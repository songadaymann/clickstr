/**
 * Smart contract interaction service
 */

import { ethers } from 'ethers';
import { CONFIG, hasNftContract } from '@/config/index.ts';
import { CLICKSTR_ABI, NFT_CONTRACT_ABI } from '@/types/index.ts';
import type { GameStats, EpochInfo, UserLifetimeStats } from '@/types/index.ts';
import { getSigner } from './wallet.ts';
import { gameState } from '@/state/index.ts';

/** Contract instances */
let gameContract: ethers.Contract | null = null;
let nftContract: ethers.Contract | null = null;

/**
 * Initialize contracts with current signer
 */
export function initializeContracts(): void {
  const signer = getSigner();
  if (!signer) {
    console.error('[Contracts] No signer available');
    return;
  }

  gameContract = new ethers.Contract(CONFIG.contractAddress, CLICKSTR_ABI, signer);

  if (hasNftContract()) {
    nftContract = new ethers.Contract(CONFIG.nftContractAddress, NFT_CONTRACT_ABI, signer);
  }
}

/**
 * Get the game contract instance
 */
export function getGameContract(): ethers.Contract | null {
  return gameContract;
}

/**
 * Get the NFT contract instance
 */
export function getNftContract(): ethers.Contract | null {
  return nftContract;
}

/**
 * Fetch game stats from the contract
 */
export async function fetchGameStats(): Promise<GameStats | null> {
  if (!gameContract) {
    console.error('[Contracts] Game contract not initialized');
    return null;
  }

  try {
    const stats = await gameContract.getGameStats();

    return {
      poolRemaining: stats.poolRemaining_.toBigInt(),
      currentEpoch: stats.currentEpoch_.toNumber(),
      totalEpochs: stats.totalEpochs_.toNumber(),
      gameStartTime: stats.gameStartTime_.toNumber(),
      gameEndTime: stats.gameEndTime_.toNumber(),
      difficulty: stats.difficulty_.toBigInt(),
      started: stats.started_,
      ended: stats.ended_,
    };
  } catch (error) {
    console.error('[Contracts] Error fetching game stats:', error);
    return null;
  }
}

/**
 * Fetch the current difficulty target
 */
export async function fetchDifficultyTarget(): Promise<bigint | null> {
  if (!gameContract) {
    console.error('[Contracts] Game contract not initialized');
    return null;
  }

  try {
    const difficulty = await gameContract.getDifficultyTarget();
    return difficulty.toBigInt();
  } catch (error) {
    console.error('[Contracts] Error fetching difficulty:', error);
    return null;
  }
}

/**
 * Fetch reward calculation parameters from contract
 */
export async function fetchRewardParams(): Promise<{ targetClicksPerEpoch: bigint; dailyEmissionRate: bigint } | null> {
  if (!gameContract) {
    console.error('[Contracts] Game contract not initialized');
    return null;
  }

  try {
    const [targetClicks, emissionRate] = await Promise.all([
      gameContract.TARGET_CLICKS_PER_EPOCH(),
      gameContract.DAILY_EMISSION_RATE(),
    ]);
    return {
      targetClicksPerEpoch: targetClicks.toBigInt(),
      dailyEmissionRate: emissionRate.toBigInt(),
    };
  } catch (error) {
    console.error('[Contracts] Error fetching reward params:', error);
    return null;
  }
}

/**
 * Fetch current epoch info
 */
export async function fetchEpochInfo(): Promise<EpochInfo | null> {
  if (!gameContract) {
    console.error('[Contracts] Game contract not initialized');
    return null;
  }

  try {
    const info = await gameContract.getCurrentEpochInfo();

    return {
      epoch: info.epoch.toNumber(),
      epochStartTime: info.epochStartTime_.toNumber(),
      epochEndTime: info.epochEndTime_.toNumber(),
      totalClicks: info.totalClicks.toNumber(),
      currentLeader: info.currentLeader,
      leaderClicks: info.leaderClicks.toNumber(),
      distributed: info.distributed.toBigInt(),
      burned: info.burned.toBigInt(),
    };
  } catch (error) {
    console.error('[Contracts] Error fetching epoch info:', error);
    return null;
  }
}

/**
 * Fetch user lifetime stats
 */
export async function fetchUserStats(address: string): Promise<UserLifetimeStats | null> {
  if (!gameContract) {
    console.error('[Contracts] Game contract not initialized');
    return null;
  }

  try {
    const stats = await gameContract.getUserLifetimeStats(address);

    return {
      totalClicks: stats.totalClicks.toNumber(),
      totalEarned: stats.totalEarned.toBigInt(),
      totalBurned: stats.totalBurned.toBigInt(),
      epochsWon: stats.epochsWon_.toNumber(),
    };
  } catch (error) {
    console.error('[Contracts] Error fetching user stats:', error);
    return null;
  }
}

/**
 * Submit clicks to the contract
 * @returns Transaction receipt on success, null on failure
 */
export async function submitClicks(
  nonces: bigint[]
): Promise<ethers.providers.TransactionReceipt | null> {
  if (!gameContract) {
    console.error('[Contracts] Game contract not initialized');
    return null;
  }

  try {
    const tx = await gameContract.submitClicks(nonces);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('[Contracts] Error submitting clicks:', error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Check if an NFT tier has been claimed by a user
 */
export async function checkNftClaimed(address: string, tier: number): Promise<boolean> {
  if (!nftContract) {
    return false;
  }

  try {
    return await nftContract.claimed(address, tier);
  } catch (error) {
    console.error('[Contracts] Error checking claimed status:', error);
    return false;
  }
}

/**
 * Claim an NFT
 * @returns Transaction receipt on success
 */
export async function claimNft(
  tier: number,
  signature: string
): Promise<ethers.providers.TransactionReceipt> {
  if (!nftContract) {
    throw new Error('NFT contract not initialized');
  }

  const tx = await nftContract.claim(tier, signature);
  return await tx.wait();
}

/**
 * Fetch and update game data in state
 */
export async function refreshGameData(): Promise<boolean> {
  const [gameStats, difficulty] = await Promise.all([fetchGameStats(), fetchDifficultyTarget()]);

  if (!gameStats || difficulty === null) {
    gameState.setGameActive(false);
    return false;
  }

  gameState.setEpochInfo(gameStats.currentEpoch, gameStats.totalEpochs);
  gameState.setDifficulty(difficulty);
  gameState.setPoolRemaining(
    parseFloat(ethers.utils.formatEther(gameStats.poolRemaining.toString()))
  );

  // Check if game is currently active
  const now = Math.floor(Date.now() / 1000);
  const isActive = gameStats.started && !gameStats.ended && now < gameStats.gameEndTime;
  gameState.setGameActive(isActive);

  if (!gameStats.started) {
    console.log('[Contracts] Game not started');
    return false;
  }

  if (gameStats.ended || now >= gameStats.gameEndTime) {
    console.log('[Contracts] Game ended');
    return false;
  }

  return true;
}

/**
 * Fetch and update user stats in state
 * Note: Only updates totalEarned from contract.
 * allTimeClicks comes from API (server stats) to track frontend clicks for NFT rewards.
 */
export async function refreshUserStats(): Promise<void> {
  const address = gameState.userAddress;
  if (!address) return;

  const stats = await fetchUserStats(address);
  if (!stats) return;

  const earned = parseFloat(ethers.utils.formatEther(stats.totalEarned.toString()));
  // Only update earned tokens from contract - allTimeClicks comes from API
  gameState.setTotalEarned(earned);
}
