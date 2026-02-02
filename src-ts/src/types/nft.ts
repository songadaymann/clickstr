/**
 * NFT and milestone types
 */

/** Milestone tier categories */
export type MilestoneTierCategory =
  | 'personal'    // 1-12: Click count milestones
  | 'streak'      // 101-105: Daily streak achievements
  | 'global'      // 200-229: Global 1/1 milestones
  | 'hidden';     // 500+: Hidden/meme number achievements

/** Milestone display information */
export interface MilestoneInfo {
  readonly name: string;
  readonly emoji: string;
  readonly desc: string;
}

/** Personal milestone threshold with cursor info */
export interface PersonalMilestoneThreshold {
  readonly tier: number;
  readonly clicks: number;
  readonly cursor: string;
  readonly name: string;
}

/** Collection slot for cursor/NFT */
export interface CollectionSlot {
  readonly tier: number;
  readonly name: string;
  readonly cursor: string | null; // null for global 1/1s that don't have cursors
}

/** Global 1/1 trophy information */
export interface GlobalOneOfOneTier {
  readonly tier: number;
  readonly name: string;
  readonly globalClick: number;
}

/** NFT item state in the UI */
export interface NftItem {
  id: string;
  tier: number;
  type: MilestoneTierCategory;
  claimed: boolean;
}

/** Achievement unlocked from server */
export interface UnlockedAchievement {
  id: string;
  name: string;
  tier?: number;
  type: 'personal' | 'global' | 'hidden' | 'streak' | 'epoch';
  cosmetic?: string;
  days?: number; // For streak achievements
}

/** Milestone ID to tier mapping key */
export type MilestoneId =
  // Personal (1-12)
  | 'first-timer' | 'getting-started' | 'warming-up' | 'dedicated'
  | 'serious-clicker' | 'obsessed' | 'no-sleep' | 'touch-grass'
  | 'legend' | 'ascended' | 'transcendent' | 'click-god'
  // Streak/Epoch (101-105)
  | 'week-warrior' | 'month-master' | 'perfect-attendance'
  | 'day-one-og' | 'final-day'
  // Global (200+)
  | 'global-1' | 'global-100' | 'global-1000' | 'global-10000'
  | 'global-100000' | 'global-1000000' | 'global-10000000'
  | 'global-50000000' | 'global-100000000'
  // Hidden (500+)
  | 'nice' | 'blaze-it' | 'devils-click' | 'lucky-7s'
  | 'elite' | 'palindrome';

/** Claim modal state */
export interface ClaimState {
  milestoneId: string;
  tier: number;
}
