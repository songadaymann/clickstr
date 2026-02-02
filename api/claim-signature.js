/**
 * API Endpoint: POST /api/clickstr/claim-signature
 *
 * Reference implementation for mann.cool API
 * Generates signatures for NFT milestone claims
 *
 * Environment variables needed:
 *   NFT_SIGNER_PRIVATE_KEY - Private key of the signing wallet
 *   NFT_CONTRACT_ADDRESS   - Address of ClickstrNFT contract
 *   KV_REST_API_URL        - Upstash Redis URL
 *   KV_REST_API_TOKEN      - Upstash Redis token
 *
 * Tier Ranges:
 *   1-99:    Personal click milestones (editions)
 *   100-199: Streak/special achievements (editions)
 *   200-499: Global milestones - 1/1s
 *   500+:    Hidden personal achievements (editions)
 */

import { ethers } from "ethers";
import { kv } from "@vercel/kv";

// ============================================
// MILESTONE DEFINITIONS
// ============================================

// Personal milestones - click count based (editions)
const PERSONAL_MILESTONES = {
  1: 1,           // First Timer
  2: 100,         // Getting Started
  3: 500,         // Warming Up
  4: 1000,        // Dedicated
  5: 5000,        // Serious Clicker
  6: 10000,       // Obsessed
  7: 25000,       // No Sleep
  8: 50000,       // Touch Grass
  9: 100000,      // Legend
  10: 250000,     // Ascended
  11: 500000,     // Transcendent
  12: 1000000,    // Click God
};

// Streak milestones (editions)
const STREAK_MILESTONES = {
  101: 7,   // Week Warrior
  102: 30,  // Month Master
  103: 90,  // Perfect Attendance
};

// Epoch participation milestones (editions)
const EPOCH_MILESTONES = {
  104: 1,       // Day One OG (epoch 1)
  105: "final", // The Final Day
};

// Global milestones - 1/1s (tier -> global click number)
const GLOBAL_MILESTONES = {
  // Main milestones
  200: 1,
  201: 69,
  202: 100,
  203: 420,
  204: 666,
  205: 777,
  206: 1000,
  207: 1337,
  208: 10000,
  209: 100000,
  210: 1000000,
  211: 10000000,
  212: 50000000,
  213: 100000000,

  // Meme numbers
  220: 8008,
  221: 42069,
  222: 69420,
  223: 80085,
  224: 420420,
  225: 666666,
  226: 696969,
  227: 1337420,
  228: 6969696,
  229: 8008135,
  230: 42042069,
  231: 69420000,
  232: 420420420,
  233: 666666666,
  234: 696969696,

  // Repeated digits
  240: 111,
  241: 1111,
  242: 11111,
  243: 111111,
  244: 1111111,
  245: 11111111,
  246: 111111111,
  247: 1111111111,
  250: 7777,
  251: 77777,
  252: 777777,
  253: 7777777,
  254: 77777777,
  255: 777777777,
  260: 888,
  261: 8888,
  262: 88888,
  263: 888888,
  264: 8888888,
  265: 88888888,
  266: 888888888,
  270: 999,
  271: 9999,
  272: 99999,
  273: 999999,
  274: 9999999,
  275: 99999999,
  276: 999999999,

  // Palindromes
  280: 101,
  281: 1001,
  282: 10001,
  283: 12321,
  284: 123321,
  285: 1234321,
  286: 1000001,
  287: 10000001,
  288: 100000001,
  289: 1000000001,
  290: 12345654321,

  // Mathematical
  300: 137,
  301: 314,
  302: 1618,
  303: 2718,
  304: 3141,
  305: 31415,
  306: 314159,
  307: 3141592,
  308: 31415926,
  309: 314159265,
  310: 1123581321,
  311: 2147483647,
  312: 4294967295,

  // Powers of 2
  320: 256,
  321: 512,
  322: 1024,
  323: 2048,
  324: 4096,
  325: 8192,
  326: 16384,
  327: 32768,
  328: 65536,
  329: 1048576,
  330: 1073741824,

  // Cultural
  340: 404,
  341: 500,
  342: 747,
  343: 911,
  344: 1984,
  345: 2001,
  346: 2012,
  347: 3000,
  348: 8675309,
  349: 525600,
  350: 86400,
  351: 31536000,
  352: 5318008,

  // Big round numbers
  360: 5000000,
  361: 25000000,
  362: 75000000,
  363: 123456789,
  364: 250000000,
  365: 500000000,
  366: 750000000,
  367: 1000000000,
  368: 10000000000,
  369: 100000000000,
  370: 1000000000000,
};

// Hidden personal achievements (editions) - tier -> personal click number
const HIDDEN_MILESTONES = {
  500: 69,
  501: 420,
  502: 666,
  503: 777,
  504: 1337,
  505: 12321,
  506: 8008,
  507: 42069,
  508: 69420,
};

// Build reverse lookup: global click number -> tier
const GLOBAL_CLICK_TO_TIER = {};
for (const [tier, clickNum] of Object.entries(GLOBAL_MILESTONES)) {
  GLOBAL_CLICK_TO_TIER[clickNum] = parseInt(tier);
}

// Build reverse lookup: hidden click number -> tier
const HIDDEN_CLICK_TO_TIER = {};
for (const [tier, clickNum] of Object.entries(HIDDEN_MILESTONES)) {
  HIDDEN_CLICK_TO_TIER[clickNum] = parseInt(tier);
}

/**
 * Check if user is eligible for a milestone tier
 */
async function checkEligibility(address, tier) {
  tier = parseInt(tier);

  if (tier <= 0) {
    return { eligible: false, reason: "Invalid tier" };
  }

  // Check if already claimed on-chain (stored in Redis after successful claim)
  const claimedKey = `clickstr:nft-claimed:${address.toLowerCase()}:${tier}`;
  const alreadyClaimed = await kv.get(claimedKey);
  if (alreadyClaimed) {
    return { eligible: false, reason: "Already claimed" };
  }

  // Get user stats from Redis
  const statsKey = `clickstr:clicks:${address.toLowerCase()}`;
  const stats = await kv.hgetall(statsKey);

  if (!stats && tier < 200) {
    return { eligible: false, reason: "No click history found" };
  }

  const totalClicks = parseInt(stats?.totalClicks || "0");

  // Personal milestones (1-99)
  if (tier >= 1 && tier < 100) {
    const required = PERSONAL_MILESTONES[tier];
    if (!required) {
      return { eligible: false, reason: "Unknown personal milestone tier" };
    }
    if (totalClicks >= required) {
      return { eligible: true, tier };
    }
    return { eligible: false, reason: `Need ${required} clicks, have ${totalClicks}` };
  }

  // Streak milestones (100-199)
  if (tier >= 100 && tier < 200) {
    const requiredStreak = STREAK_MILESTONES[tier];
    if (!requiredStreak) {
      // Check epoch milestones
      const epoch = EPOCH_MILESTONES[tier];
      if (epoch) {
        const epochKey = `clickstr:epoch-participant:${epoch}:${address.toLowerCase()}`;
        const participated = await kv.get(epochKey);
        if (participated) {
          return { eligible: true, tier };
        }
        return { eligible: false, reason: `Did not participate in epoch ${epoch}` };
      }
      return { eligible: false, reason: "Unknown streak/epoch tier" };
    }

    const maxStreak = parseInt(stats?.maxStreak || "0");
    if (maxStreak >= requiredStreak) {
      return { eligible: true, tier };
    }
    return { eligible: false, reason: `Need ${requiredStreak} day streak, max was ${maxStreak}` };
  }

  // Global milestones (200-499) - 1/1s
  if (tier >= 200 && tier < 500) {
    const globalClickNum = GLOBAL_MILESTONES[tier];
    if (!globalClickNum) {
      return { eligible: false, reason: "Unknown global milestone tier" };
    }

    // Check if this global milestone was already claimed by anyone
    const globalClaimedKey = `clickstr:global-milestone:${tier}`;
    const globalClaimed = await kv.get(globalClaimedKey);
    if (globalClaimed) {
      return { eligible: false, reason: `Global milestone already claimed by ${globalClaimed}` };
    }

    // Check if user triggered this global click number
    const globalTriggerKey = `clickstr:global-trigger:${globalClickNum}`;
    const triggeredBy = await kv.get(globalTriggerKey);
    if (triggeredBy?.toLowerCase() === address.toLowerCase()) {
      return { eligible: true, tier };
    }
    return { eligible: false, reason: "Did not trigger this global milestone" };
  }

  // Hidden personal achievements (500+)
  if (tier >= 500) {
    const hiddenClickNum = HIDDEN_MILESTONES[tier];
    if (!hiddenClickNum) {
      return { eligible: false, reason: "Unknown hidden achievement tier" };
    }

    // Check if user passed this personal click number
    const hiddenKey = `clickstr:hidden:${address.toLowerCase()}:${hiddenClickNum}`;
    const achieved = await kv.get(hiddenKey);
    if (achieved) {
      return { eligible: true, tier };
    }

    // Also check if they've passed the number based on total clicks
    if (totalClicks >= hiddenClickNum) {
      return { eligible: true, tier };
    }

    return { eligible: false, reason: "Hidden achievement not unlocked" };
  }

  return { eligible: false, reason: "Unknown tier range" };
}

/**
 * Generate EIP-191 signature for claim
 */
async function generateSignature(address, tier) {
  const privateKey = process.env.NFT_SIGNER_PRIVATE_KEY;
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!privateKey || !contractAddress) {
    throw new Error("Missing NFT_SIGNER_PRIVATE_KEY or NFT_CONTRACT_ADDRESS");
  }

  const wallet = new ethers.Wallet(privateKey);

  // Create the same message hash as the contract expects
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "address"],
    [address, tier, contractAddress]
  );

  // Sign with EIP-191 prefix (eth_sign style)
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  return signature;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { address, tier } = req.body;

    // Validate inputs
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    if (!tier || isNaN(parseInt(tier))) {
      return res.status(400).json({ error: "Invalid tier" });
    }

    // Check eligibility
    const eligibility = await checkEligibility(address, tier);

    if (!eligibility.eligible) {
      return res.status(403).json({
        error: "Not eligible",
        reason: eligibility.reason,
      });
    }

    // Generate signature
    const signature = await generateSignature(address, eligibility.tier);

    // Return signature and tier
    return res.status(200).json({
      success: true,
      address,
      tier: eligibility.tier,
      signature,
      contractAddress: process.env.NFT_CONTRACT_ADDRESS,
    });
  } catch (error) {
    console.error("Claim signature error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get all claimable tiers for a user
 * POST /api/clickstr/claim-signature/available
 */
export async function getAvailableClaims(address) {
  const available = [];

  // Check personal milestones
  for (const tier of Object.keys(PERSONAL_MILESTONES)) {
    const result = await checkEligibility(address, tier);
    if (result.eligible) {
      available.push(parseInt(tier));
    }
  }

  // Check streak milestones
  for (const tier of Object.keys(STREAK_MILESTONES)) {
    const result = await checkEligibility(address, tier);
    if (result.eligible) {
      available.push(parseInt(tier));
    }
  }

  // Check epoch milestones
  for (const tier of Object.keys(EPOCH_MILESTONES)) {
    const result = await checkEligibility(address, tier);
    if (result.eligible) {
      available.push(parseInt(tier));
    }
  }

  // Check global milestones
  for (const tier of Object.keys(GLOBAL_MILESTONES)) {
    const result = await checkEligibility(address, tier);
    if (result.eligible) {
      available.push(parseInt(tier));
    }
  }

  // Check hidden milestones
  for (const tier of Object.keys(HIDDEN_MILESTONES)) {
    const result = await checkEligibility(address, tier);
    if (result.eligible) {
      available.push(parseInt(tier));
    }
  }

  return available;
}

/**
 * Webhook to mark milestone as claimed (called after successful on-chain claim)
 *
 * This could be called by:
 * 1. Frontend after tx confirms
 * 2. A blockchain event listener
 * 3. Manual admin call
 */
export async function markClaimed(address, tier) {
  const claimedKey = `clickstr:nft-claimed:${address.toLowerCase()}:${tier}`;
  await kv.set(claimedKey, Date.now());

  // For global milestones, also mark globally
  if (tier >= 200 && tier < 500) {
    const globalClaimedKey = `clickstr:global-milestone:${tier}`;
    await kv.set(globalClaimedKey, address.toLowerCase());
  }
}

// Export milestone definitions for use elsewhere
export {
  PERSONAL_MILESTONES,
  STREAK_MILESTONES,
  EPOCH_MILESTONES,
  GLOBAL_MILESTONES,
  HIDDEN_MILESTONES,
  GLOBAL_CLICK_TO_TIER,
  HIDDEN_CLICK_TO_TIER,
};
