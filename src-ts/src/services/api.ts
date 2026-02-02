/**
 * Server API service
 */

import { CONFIG } from '@/config/index.ts';
import type {
  ServerStatsResponse,
  LeaderboardResponse,
  RecordClicksResponse,
  VerificationResponse,
  ClaimSignatureResponse,
  SubgraphUsersResponse,
  SubgraphGlobalStatsResponse,
  LeaderboardEntry,
  SubgraphUser,
  MergedLeaderboardEntry,
  ActiveUsersResponse,
  HeartbeatResponse,
} from '@/types/index.ts';

const CLAIM_SIGNATURE_URL = 'https://mann.cool/api/clickstr-claim-signature';

/**
 * Fetch user stats from the server
 */
export async function fetchServerStats(address: string): Promise<ServerStatsResponse | null> {
  try {
    const response = await fetch(`${CONFIG.apiUrl}?address=${address}`);
    const data = await response.json() as ServerStatsResponse;
    return data.success ? data : null;
  } catch (error) {
    console.error('Server stats error:', error);
    return null;
  }
}

/**
 * Check if user needs Turnstile verification
 */
export async function checkVerificationStatus(address: string): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${CONFIG.apiUrl}?address=${address}&verification=true`);
    return await response.json() as VerificationResponse;
  } catch (error) {
    console.error('Verification check error:', error);
    return { success: false };
  }
}

/**
 * Record clicks to server (with optional Turnstile token and nonces for proof-of-work)
 * @param address User's wallet address
 * @param clicks Number of clicks to record
 * @param turnstileToken Optional Turnstile verification token
 * @param nonces Optional array of nonces as proof-of-work (for off-chain submissions)
 * @param epoch Optional epoch number (required for PoW verification when game is active)
 */
export async function recordClicksToServer(
  address: string,
  clicks: number,
  turnstileToken?: string | null,
  nonces?: string[],
  epoch?: number
): Promise<RecordClicksResponse> {
  try {
    const body: Record<string, unknown> = { address, clicks };
    if (turnstileToken) {
      body.turnstileToken = turnstileToken;
    }
    if (nonces && nonces.length > 0) {
      body.nonces = nonces;
    }
    if (epoch !== undefined) {
      body.epoch = epoch;
    }

    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.status === 403) {
      const data = await response.json() as RecordClicksResponse;
      if (data.requiresVerification) {
        return { success: false, requiresVerification: true };
      }
    }

    return await response.json() as RecordClicksResponse;
  } catch (error) {
    console.error('Record clicks error:', error);
    return { success: false };
  }
}

/**
 * Record on-chain submission metadata
 */
export async function recordOnChainSubmission(
  address: string,
  onChainClicks: number,
  txHash: string,
  epoch: number
): Promise<void> {
  try {
    await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        onChainClicks,
        txHash,
        epoch,
      }),
    });
  } catch (error) {
    console.warn('Failed to record on-chain submission:', error);
  }
}

/**
 * Fetch frontend leaderboard
 */
export async function fetchFrontendLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${CONFIG.apiUrl}?leaderboard=true&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch frontend leaderboard');

    const data = await response.json() as LeaderboardResponse;
    if (data.success && data.leaderboard) {
      return data.leaderboard;
    }
    return [];
  } catch (error) {
    console.error('Frontend leaderboard fetch error:', error);
    return [];
  }
}

/**
 * Fetch contract leaderboard from subgraph
 */
export async function fetchContractLeaderboard(limit = 50): Promise<SubgraphUser[]> {
  try {
    const response = await fetch(CONFIG.subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          users(first: ${limit}, orderBy: totalClicks, orderDirection: desc) {
            id
            totalClicks
            totalReward
          }
        }`,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch contract leaderboard');

    const data = await response.json() as SubgraphUsersResponse;
    if (data.data?.users) {
      return data.data.users;
    }
    return [];
  } catch (error) {
    console.error('Contract leaderboard fetch error:', error);
    return [];
  }
}

/**
 * Fetch global stats from subgraph
 */
export async function fetchGlobalStats(): Promise<number> {
  try {
    const response = await fetch(CONFIG.subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ globalStats(id: "global") { totalClicks } }`,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch global stats');

    const data = await response.json() as SubgraphGlobalStatsResponse;
    if (data.data?.globalStats) {
      return parseInt(data.data.globalStats.totalClicks) || 0;
    }
    return 0;
  } catch (error) {
    console.error('Global stats fetch error:', error);
    return 0;
  }
}

/**
 * Merge frontend and contract leaderboards
 * Contract clicks are authoritative, frontend indicates human activity
 */
export function mergeLeaderboards(
  frontendData: LeaderboardEntry[],
  contractData: SubgraphUser[],
  limit = 10
): MergedLeaderboardEntry[] {
  const merged: Record<string, MergedLeaderboardEntry> = {};

  // Add frontend data (marks user as human)
  for (const entry of frontendData) {
    const addr = entry.address?.toLowerCase();
    if (!addr) continue;

    if (!merged[addr]) {
      merged[addr] = {
        address: entry.address,
        name: entry.name ?? null,
        totalClicks: 0,
        frontendClicks: 0,
        isHuman: true,
      };
    }
    merged[addr].frontendClicks = entry.totalClicks || 0;
    if (entry.name) merged[addr].name = entry.name;
  }

  // Add contract data (authoritative click count)
  for (const entry of contractData) {
    const addr = entry.id?.toLowerCase();
    if (!addr) continue;

    if (!merged[addr]) {
      merged[addr] = {
        address: entry.id,
        name: null,
        totalClicks: 0,
        frontendClicks: 0,
        isHuman: false,
      };
    }
    merged[addr].totalClicks = parseInt(entry.totalClicks) || 0;
  }

  // Sort by on-chain clicks and take top N
  // isHuman = true if they have any frontend activity
  return Object.values(merged)
    .filter(entry => entry.totalClicks > 0)
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isHuman: entry.frontendClicks > 0,
    }));
}

/**
 * Fetch global leaderboard (all-time frontend clicks from Redis)
 * This tracks human activity across all games
 */
export async function fetchGlobalLeaderboard(limit = 10): Promise<MergedLeaderboardEntry[]> {
  try {
    const frontendData = await fetchFrontendLeaderboard(limit);

    // For global, frontend clicks ARE the ranking (all humans)
    return frontendData
      .slice(0, limit)
      .map((entry, index) => ({
        address: entry.address,
        name: entry.name ?? null,
        totalClicks: entry.totalClicks || 0,
        frontendClicks: entry.totalClicks || 0,
        rank: index + 1,
        isHuman: true,
      }));
  } catch (error) {
    console.error('Global leaderboard fetch error:', error);
    return [];
  }
}

/**
 * Fetch game-specific leaderboard (on-chain clicks from that game's subgraph)
 */
export async function fetchGameLeaderboard(
  subgraphUrl: string,
  limit = 10
): Promise<MergedLeaderboardEntry[]> {
  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          users(first: ${limit}, orderBy: totalClicks, orderDirection: desc) {
            id
            totalClicks
            totalReward
          }
        }`,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch game leaderboard');

    const data = await response.json() as SubgraphUsersResponse;
    if (data.data?.users) {
      // Also fetch frontend data to get names and mark humans
      const frontendData = await fetchFrontendLeaderboard(100);
      const frontendMap = new Map(
        frontendData.map(e => [e.address?.toLowerCase(), e])
      );

      return data.data.users.map((user, index) => {
        const addr = user.id.toLowerCase();
        const frontend = frontendMap.get(addr);
        return {
          address: user.id,
          name: frontend?.name ?? null,
          totalClicks: parseInt(user.totalClicks) || 0,
          frontendClicks: frontend?.totalClicks || 0,
          rank: index + 1,
          isHuman: !!frontend,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Game leaderboard fetch error:', error);
    return [];
  }
}

/**
 * Get NFT claim signature from server
 */
export async function getClaimSignature(
  address: string,
  tier: number
): Promise<ClaimSignatureResponse> {
  const response = await fetch(CLAIM_SIGNATURE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, tier }),
  });

  if (!response.ok) {
    const error = await response.json() as { error?: string };
    throw new Error(error.error ?? 'Failed to get signature');
  }

  return await response.json() as ClaimSignatureResponse;
}

/**
 * Confirm NFT claim with server
 */
export async function confirmClaim(
  address: string,
  tier: number,
  txHash: string
): Promise<void> {
  try {
    await fetch(CLAIM_SIGNATURE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        tier,
        action: 'confirm',
        txHash,
      }),
    });
  } catch (error) {
    // Non-critical - the on-chain claim succeeded
    console.warn('Failed to confirm claim with server:', error);
  }
}

/**
 * Send heartbeat to server to indicate active frontend session
 */
export async function sendHeartbeat(address: string): Promise<HeartbeatResponse> {
  try {
    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        heartbeat: true,
      }),
    });
    return await response.json() as HeartbeatResponse;
  } catch (error) {
    console.warn('Heartbeat failed:', error);
    return { success: false };
  }
}

/**
 * Fetch active users count (humans with frontend open + recent bot activity)
 */
export async function fetchActiveUsers(): Promise<ActiveUsersResponse> {
  try {
    const response = await fetch(`${CONFIG.apiUrl}?activeUsers=true`);
    if (!response.ok) {
      throw new Error('Failed to fetch active users');
    }
    return await response.json() as ActiveUsersResponse;
  } catch (error) {
    console.error('Active users fetch error:', error);
    return { success: false, activeHumans: 0, activeBots: 0 };
  }
}

/**
 * Fetch recent bot activity from subgraph
 * Counts unique addresses that submitted in the last N minutes
 */
export async function fetchRecentBotActivity(minutesAgo = 5): Promise<number> {
  try {
    // Get timestamp from N minutes ago
    const cutoffTime = Math.floor(Date.now() / 1000) - (minutesAgo * 60);

    const response = await fetch(CONFIG.subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          clickSubmissions(
            first: 100,
            where: { timestamp_gt: "${cutoffTime}" },
            orderBy: timestamp,
            orderDirection: desc
          ) {
            user { id }
          }
        }`,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch recent activity');

    const data = await response.json() as {
      data?: {
        clickSubmissions?: Array<{ user: { id: string } }>;
      };
    };

    if (data.data?.clickSubmissions) {
      // Count unique addresses
      const uniqueAddresses = new Set(
        data.data.clickSubmissions.map(s => s.user.id.toLowerCase())
      );
      return uniqueAddresses.size;
    }
    return 0;
  } catch (error) {
    console.error('Recent bot activity fetch error:', error);
    return 0;
  }
}

/** Response from sync achievements endpoint */
export interface SyncAchievementsResponse {
  success: boolean;
  address?: string;
  totalClicks?: number;
  newMilestones?: Array<{ id: string; name: string; tier: number }>;
  newAchievements?: Array<{ id: string; name: string; tier: number; type: string }>;
  message?: string;
}

/**
 * Sync achievements - retroactively grant any missing achievements
 * based on current total clicks (useful for achievements added after user played)
 */
export async function syncAchievements(address: string): Promise<SyncAchievementsResponse> {
  try {
    const response = await fetch(`${CONFIG.apiUrl}?address=${address}&syncAchievements=true`);
    if (!response.ok) {
      throw new Error('Failed to sync achievements');
    }
    return await response.json() as SyncAchievementsResponse;
  } catch (error) {
    console.error('Sync achievements error:', error);
    return { success: false };
  }
}
