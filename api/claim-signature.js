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
// Must match milestones-v2.csv
const GLOBAL_MILESTONES = {
  // Main milestones (200-213)
  200: 1,
  201: 10,
  202: 100,
  203: 1000,
  204: 10000,
  205: 100000,
  206: 1000000,
  207: 10000000,
  208: 100000000,
  209: 1000000000,
  210: 10000000000,
  211: 100000000000,
  212: 1000000000000,
  213: 10000000000000,

  // Hidden global meme numbers (220-229)
  220: 69,
  221: 420,
  222: 666,
  223: 777,
  224: 1337,
  225: 42069,
  226: 69420,
  227: 8008135,
  228: 8675309,
  229: 42,
};

// Hidden personal achievements (editions) - tier -> personal click number
// Must match milestones-v2.csv
const HIDDEN_MILESTONES = {
  // Meme numbers (500-511)
  500: 69,
  501: 420,
  502: 666,
  503: 777,
  504: 1337,
  505: 8008,
  506: 42069,
  507: 69420,
  508: 80085,
  509: 420420,
  510: 666666,
  511: 696969,

  // Ones family (520-523)
  520: 111,
  521: 1111,
  522: 11111,
  523: 111111,

  // Sevens family (524-526)
  524: 7777,
  525: 77777,
  526: 777777,

  // Eights family (527-529)
  527: 888,
  528: 8888,
  529: 888888,

  // Nines family (530-532)
  530: 999,
  531: 9999,
  532: 999999,

  // Palindromes (540-545)
  540: 101,
  541: 1001,
  542: 10001,
  543: 12321,
  544: 123321,
  545: 1234321,

  // Mathematical (560-566)
  560: 137,
  561: 314,
  562: 1618,
  563: 2718,
  564: 3141,
  565: 31415,
  566: 314159,

  // Powers of 2 (580-588)
  580: 256,
  581: 512,
  582: 1024,
  583: 2048,
  584: 4096,
  585: 8192,
  586: 16384,
  587: 32768,
  588: 65536,

  // Cultural (600-609)
  600: 404,
  601: 500,
  602: 747,
  603: 911,
  604: 1984,
  605: 2001,
  606: 2012,
  607: 3000,
  608: 42,
  609: 525600,
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
