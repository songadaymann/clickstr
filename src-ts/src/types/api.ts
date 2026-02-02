/**
 * API response types
 */

import type { UnlockedAchievement } from './nft.ts';

/** Server stats response */
export interface ServerStatsResponse {
  success: boolean;
  totalClicks?: number;
  name?: string;
  rank?: number;
  globalClicks?: number;
  milestones?: {
    unlocked: string[];
  };
  achievements?: {
    unlocked: string[];
  };
  needsVerification?: boolean;
}

/** Leaderboard entry from server */
export interface LeaderboardEntry {
  address: string;
  name?: string | null;
  totalClicks: number;
}

/** Frontend leaderboard response */
export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
}

/** Subgraph user data */
export interface SubgraphUser {
  id: string;
  totalClicks: string;
  totalReward?: string;
}

/** Subgraph users response */
export interface SubgraphUsersResponse {
  data: {
    users: SubgraphUser[];
  };
}

/** Subgraph global stats response */
export interface SubgraphGlobalStatsResponse {
  data: {
    globalStats: {
      totalClicks: string;
    } | null;
  };
}

/** New milestone from server */
export interface NewMilestone {
  id: string;
  name: string;
  tier?: number;
  cosmetic?: string;
}

/** Record clicks response */
export interface RecordClicksResponse {
  success: boolean;
  requiresVerification?: boolean;
  rank?: number;
  globalClicks?: number;
  newMilestones?: NewMilestone[];
  newAchievements?: UnlockedAchievement[];
}

/** Claim signature request */
export interface ClaimSignatureRequest {
  address: string;
  tier: number;
  action?: 'confirm';
  txHash?: string;
}

/** Claim signature response */
export interface ClaimSignatureResponse {
  signature: string;
  tier: number;
  error?: string;
}

/** Verification status response */
export interface VerificationResponse {
  success: boolean;
  needsVerification?: boolean;
}

/** Merged leaderboard entry (frontend + contract data) */
export interface MergedLeaderboardEntry {
  address: string;
  name: string | null;
  totalClicks: number;
  frontendClicks: number;
  rank?: number;
  isHuman: boolean;
}

/** Active users response from heartbeat API */
export interface ActiveUsersResponse {
  success: boolean;
  activeHumans: number;
  activeBots: number;
  globalClicks?: number;
}

/** Heartbeat response */
export interface HeartbeatResponse {
  success: boolean;
}
