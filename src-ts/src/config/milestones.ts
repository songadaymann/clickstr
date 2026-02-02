/**
 * Milestone and achievement configuration
 */

import type {
  MilestoneInfo,
  PersonalMilestoneThreshold,
  MilestoneId,
} from '@/types/index.ts';

/** Milestone metadata for display (tier -> info) */
export const MILESTONE_INFO: Record<number, MilestoneInfo> = {
  // Personal milestones (1-12)
  1: { name: 'First Timer', emoji: '👆', desc: '1 click' },
  2: { name: 'Getting Started', emoji: '🌱', desc: '100 clicks' },
  3: { name: 'Warming Up', emoji: '🔥', desc: '500 clicks' },
  4: { name: 'Dedicated', emoji: '💪', desc: '1,000 clicks' },
  5: { name: 'Serious Clicker', emoji: '🎯', desc: '5,000 clicks' },
  6: { name: 'Obsessed', emoji: '😵', desc: '10,000 clicks' },
  7: { name: 'No Sleep', emoji: '🌙', desc: '25,000 clicks' },
  8: { name: 'Touch Grass', emoji: '🌿', desc: '50,000 clicks' },
  9: { name: 'Legend', emoji: '🏆', desc: '100,000 clicks' },
  10: { name: 'Ascended', emoji: '👼', desc: '250,000 clicks' },
  11: { name: 'Transcendent', emoji: '✨', desc: '500,000 clicks' },
  12: { name: 'Click God', emoji: '🌟', desc: '1,000,000 clicks' },

  // Streak achievements (101-105)
  101: { name: 'Week Warrior', emoji: '📅', desc: '7 day streak' },
  102: { name: 'Month Master', emoji: '🗓️', desc: '30 day streak' },
  103: { name: 'Perfect Attendance', emoji: '🎓', desc: '90 day streak' },
  104: { name: 'Day One OG', emoji: '🥇', desc: 'Epoch 1 participant' },
  105: { name: 'The Final Day', emoji: '🏁', desc: 'Final epoch participant' },

  // Global 1/1 milestones (200-213)
  200: { name: 'The First Click', emoji: '1️⃣', desc: 'Global click #1' },
  201: { name: 'The Tenth', emoji: '🔟', desc: 'Global click #10' },
  202: { name: 'Century', emoji: '💯', desc: 'Global click #100' },
  203: { name: 'Thousandaire', emoji: '🎰', desc: 'Global click #1,000' },
  204: { name: 'Ten Grand', emoji: '💰', desc: 'Global click #10,000' },
  205: { name: 'The Hundred Thousandth', emoji: '🎊', desc: 'Global click #100,000' },
  206: { name: 'The Millionth Click', emoji: '🎉', desc: 'Global click #1,000,000' },
  207: { name: 'Ten Million', emoji: '🚀', desc: 'Global click #10,000,000' },
  208: { name: 'Halfway There', emoji: '⏳', desc: 'Global click #50,000,000' },
  209: { name: 'The Final Click', emoji: '🏆', desc: 'Global click #100,000,000' },

  // Hidden achievements (500+)
  500: { name: 'Nice', emoji: '😏', desc: 'Your 69th click' },
  501: { name: 'Blaze It', emoji: '🌿', desc: 'Your 420th click' },
  502: { name: "Devil's Click", emoji: '😈', desc: 'Your 666th click' },
  503: { name: 'Lucky 7s', emoji: '🎰', desc: 'Your 777th click' },
  504: { name: 'Elite', emoji: '💻', desc: 'Your 1337th click' },
  505: { name: 'Palindrome', emoji: '🔄', desc: 'Your 12321st click' },
} as const;

/** Mapping from milestone ID string to tier number */
export const MILESTONE_ID_TO_TIER: Record<MilestoneId, number> = {
  // Personal (1-12)
  'first-timer': 1,
  'getting-started': 2,
  'warming-up': 3,
  'dedicated': 4,
  'serious-clicker': 5,
  'obsessed': 6,
  'no-sleep': 7,
  'touch-grass': 8,
  'legend': 9,
  'ascended': 10,
  'transcendent': 11,
  'click-god': 12,

  // Streak/Epoch (101-105)
  'week-warrior': 101,
  'month-master': 102,
  'perfect-attendance': 103,
  'day-one-og': 104,
  'final-day': 105,

  // Global (200+)
  'global-1': 201,
  'global-100': 202,
  'global-1000': 203,
  'global-10000': 204,
  'global-100000': 205,
  'global-1000000': 206,
  'global-10000000': 207,
  'global-50000000': 208,
  'global-100000000': 209,

  // Hidden (500+)
  'nice': 500,
  'blaze-it': 501,
  'devils-click': 502,
  'lucky-7s': 503,
  'elite': 504,
  'palindrome': 505,
} as const;

/** Personal milestone thresholds (sorted high to low for lookup) */
export const PERSONAL_MILESTONE_THRESHOLDS: readonly PersonalMilestoneThreshold[] = [
  { tier: 12, clicks: 1000000, cursor: 'god', name: 'Click God' },
  { tier: 11, clicks: 500000, cursor: 'prismatic', name: 'Transcendent' },
  { tier: 10, clicks: 250000, cursor: 'holographic', name: 'Ascended' },
  { tier: 9, clicks: 100000, cursor: 'diamond', name: 'Legend' },
  { tier: 8, clicks: 50000, cursor: 'platinum', name: 'Touch Grass' },
  { tier: 7, clicks: 25000, cursor: 'rose-gold', name: 'No Sleep' },
  { tier: 6, clicks: 10000, cursor: 'gold', name: 'Obsessed' },
  { tier: 5, clicks: 5000, cursor: 'silver', name: 'Serious Clicker' },
  { tier: 4, clicks: 1000, cursor: 'bronze', name: 'Dedicated' },
  { tier: 3, clicks: 500, cursor: 'brown', name: 'Warming Up' },
  { tier: 2, clicks: 100, cursor: 'gray', name: 'Getting Started' },
  { tier: 1, clicks: 1, cursor: 'white', name: 'First Timer' },
] as const;

/** Get the highest personal milestone for a given click count */
export function getHighestMilestone(clicks: number): PersonalMilestoneThreshold | null {
  for (const milestone of PERSONAL_MILESTONE_THRESHOLDS) {
    if (clicks >= milestone.clicks) {
      return milestone;
    }
  }
  return null;
}

/** Get milestone info by tier, with fallback */
export function getMilestoneInfo(tier: number): MilestoneInfo {
  return MILESTONE_INFO[tier] ?? { name: `Tier ${tier}`, emoji: '🎖️', desc: 'Achievement' };
}

/** Check if a tier is a global 1/1 milestone */
export function isGlobalMilestone(tier: number): boolean {
  return tier >= 200 && tier < 500;
}

/** Check if a tier is a hidden achievement */
export function isHiddenMilestone(tier: number): boolean {
  return tier >= 500;
}

/** Check if a tier is a streak/epoch achievement */
export function isStreakMilestone(tier: number): boolean {
  return tier >= 101 && tier <= 105;
}

/** Check if a tier is a personal milestone */
export function isPersonalMilestone(tier: number): boolean {
  return tier >= 1 && tier <= 12;
}
