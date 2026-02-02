/**
 * Celebration effects combining multiple visual/audio effects
 */

import { launchConfetti } from './confetti.ts';
import { triggerDisco } from './disco.ts';
import { playMilestoneSound, playGlobalMilestoneSound } from './sounds.ts';

/**
 * Celebrate a personal milestone achievement
 * - Plays milestone sound
 * - Launches confetti for 3 seconds
 */
export function celebratePersonalMilestone(): void {
  playMilestoneSound();
  launchConfetti(3000);
}

/**
 * Celebrate a global 1/1 milestone achievement
 * - Plays global milestone sound
 * - Triggers disco lights for 11 seconds
 * - Launches confetti for 5 seconds
 */
export function celebrateGlobalMilestone(): void {
  playGlobalMilestoneSound();
  triggerDisco(11000);
  launchConfetti(5000);
}
