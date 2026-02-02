/**
 * Stupid Clicker - Main Entry Point
 *
 * This is the TypeScript refactored version of the game.
 * All functionality from the original index.html has been modularized.
 */

// Import styles
import './styles/main.css';

// Import state
import { gameState } from './state/index.ts';

// Import config
import { CONFIG, hasNftContract, getCurrentGame, getAllGames, type GameConfig } from './config/index.ts';

// Import services
import {
  disconnect,
  initializeContracts,
  refreshGameData,
  refreshUserStats,
  submitClicks,
  fetchServerStats,
  checkVerificationStatus,
  recordClicksToServer,
  recordOnChainSubmission,
  fetchGlobalLeaderboard,
  fetchGameLeaderboard,
  startMining,
  terminateMining,
  sendHeartbeat,
  fetchActiveUsers,
  fetchRecentBotActivity,
  syncAchievements,
  lookupEns,
  getCachedEns,
  initWalletSubscriptions,
  openConnectModal,
} from './services/index.ts';

// Import effects
import {
  initConfetti,
  initDisco,
  initParticles,
  initCursor,
  preloadSounds,
  playButtonDown,
  playButtonUp,
  celebratePersonalMilestone,
  celebrateGlobalMilestone,
  applyCursor,
  resetCursor,
  getEquippedCursorName,
} from './effects/index.ts';

// Import utilities
import {
  getElement,
  getElementOrNull,
  addClass,
  removeClass,
  toggleClass,
  setText,
  setHtml,
  formatNumber,
  formatTokens,
  formatTokensSplit,
  shortenAddress,
} from './utils/index.ts';

// Import milestones and collection
import {
  getHighestMilestone,
  getMilestoneInfo,
  isGlobalMilestone,
  findSlotByTier,
  MILESTONE_ID_TO_TIER,
  COLLECTION_SLOTS,
  GLOBAL_ONE_OF_ONE_TIERS,
} from './config/index.ts';

// Import contract services for NFT claiming
import { checkNftClaimed, claimNft, getClaimSignature, confirmClaim } from './services/index.ts';

import type { MergedLeaderboardEntry, UnlockedAchievement, ClaimState, ServerStatsResponse } from './types/index.ts';

// ============ DOM Elements ============
let buttonImg: HTMLImageElement;
let buttonClickZone: HTMLElement;
let connectBtn: HTMLButtonElement;
let submitBtn: HTMLButtonElement;
let submitContainer: HTMLElement;
let epochInfoEl: HTMLElement;
let poolInfoEl: HTMLElement;
let poolSuffixEl: HTMLElement;
let arcadeCurrentEl: HTMLElement;
let arcadeAlltimeEl: HTMLElement;
let arcadeEarnedEl: HTMLElement;
let leaderboardListEl: HTMLElement;
// walletModal removed - AppKit handles wallet modal
let helpModal: HTMLElement;
let claimModal: HTMLElement;
let collectionModal: HTMLElement;
let rankingsModal: HTMLElement;
let achievementToast: HTMLElement;
let achievementNameEl: HTMLElement;
let achievementDescEl: HTMLElement;
let turnstileModal: HTMLElement;

// Global stats panel elements
let globalTotalClicksEl: HTMLElement;
let activeHumansEl: HTMLElement;
let activeBotsEl: HTMLElement;
let gameStatusEl: HTMLElement;

// ============ Local State ============
let isPressed = false;
let isMiningClick = false;
let turnstileToken: string | null = null;
let turnstileWidgetId: string | null = null;
let leaderboardData: MergedLeaderboardEntry[] = [];
let claimedOnChain: Set<number> = new Set();
let serverStats: ServerStatsResponse | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let leaderboardMode: 'global' | 'game' = 'global';
let currentGame: GameConfig | undefined;

// Additional DOM elements for NFT/Collection
let nftPanel: HTMLElement;
let nftList: HTMLElement;
let nftClaimableCount: HTMLElement;
let collectionGrid: HTMLElement;
let trophySection: HTMLElement;
let trophyGrid: HTMLElement;
let equippedCursorName: HTMLElement;
let claimNftBtn: HTMLButtonElement;
let claimLaterBtn: HTMLButtonElement;

// Leaderboard toggle elements
let leaderboardToggleGlobal: HTMLButtonElement;
let leaderboardToggleGame: HTMLButtonElement;
let leaderboardGameName: HTMLElement;

// Rankings modal elements
let rankingsTabsEl: HTMLElement;
let rankingsListEl: HTMLElement;
let rankingsTab: 'global' | string = 'global'; // 'global' or game id

// ============ Preload Images ============
const imgUp = new Image();
const imgDown = new Image();
imgUp.src = 'button-up.jpg';
imgDown.src = 'button-down.jpg';

// ============ Initialization ============

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  // Cache DOM elements
  cacheElements();

  // Initialize wallet subscriptions (must be early to catch connection events)
  initWalletSubscriptions();

  // Initialize effects
  initEffects();

  // Initialize current game
  currentGame = getCurrentGame();
  if (currentGame) {
    setText(leaderboardGameName, currentGame.name);
  }

  // Set up event listeners
  setupEventListeners();

  // Start leaderboard updates
  startLeaderboardUpdates();

  // Start global stats updates (humans + bots clicking now)
  startGlobalStatsUpdates();

  // Subscribe to state changes
  gameState.subscribe(handleStateChange);

  console.log('[App] Initialized');
}

/**
 * Cache DOM element references
 */
function cacheElements(): void {
  buttonImg = getElement<HTMLImageElement>('button-img');
  buttonClickZone = getElement('button-click-zone');
  connectBtn = getElement<HTMLButtonElement>('connect-btn');
  submitBtn = getElement<HTMLButtonElement>('submit-btn');
  submitContainer = getElement('submit-container');
  epochInfoEl = getElement('epoch-info');
  poolInfoEl = getElement('pool-info');
  poolSuffixEl = getElement('pool-suffix');
  arcadeCurrentEl = getElement('arcade-current');
  arcadeAlltimeEl = getElement('arcade-alltime');
  arcadeEarnedEl = getElement('arcade-earned');
  leaderboardListEl = getElement('leaderboard-list');
  // walletModal removed - AppKit handles wallet modal
  helpModal = getElement('help-modal');
  turnstileModal = getElement('turnstile-modal');
  claimModal = getElement('claim-modal');
  collectionModal = getElement('collection-modal');
  rankingsModal = getElement('rankings-modal');
  achievementToast = getElement('achievement-toast');
  achievementNameEl = getElement('achievement-name');
  achievementDescEl = getElement('achievement-desc');

  // NFT panel elements
  nftPanel = getElement('nft-panel');
  nftList = getElement('nft-list');
  nftClaimableCount = getElement('nft-claimable-count');

  // Collection modal elements
  collectionGrid = getElement('collection-grid');
  trophySection = getElement('trophy-section');
  trophyGrid = getElement('trophy-grid');
  equippedCursorName = getElement('equipped-cursor-name');

  // Claim modal buttons
  claimNftBtn = getElement<HTMLButtonElement>('claim-nft-btn');
  claimLaterBtn = getElement<HTMLButtonElement>('claim-later-btn');

  // Global stats panel elements
  globalTotalClicksEl = getElement('global-total-clicks');
  activeHumansEl = getElement('active-humans');
  activeBotsEl = getElement('active-bots');
  gameStatusEl = getElement('game-status');

  // Leaderboard toggle elements
  leaderboardToggleGlobal = getElement<HTMLButtonElement>('leaderboard-toggle-global');
  leaderboardToggleGame = getElement<HTMLButtonElement>('leaderboard-toggle-game');
  leaderboardGameName = getElement('leaderboard-game-name');

  // Rankings modal elements
  rankingsTabsEl = getElement('rankings-tabs');
  rankingsListEl = getElement('rankings-list');
}

/**
 * Initialize all effects
 */
function initEffects(): void {
  // Preload sounds
  preloadSounds();

  // Initialize confetti
  const confettiCanvas = getElementOrNull<HTMLCanvasElement>('confetti-canvas');
  if (confettiCanvas) {
    initConfetti(confettiCanvas);
  }

  // Initialize disco overlay
  const discoOverlay = getElementOrNull('disco-overlay');
  if (discoOverlay) {
    initDisco(discoOverlay);
  }

  // Initialize particles
  const particleContainer = getElementOrNull('cursor-particles');
  if (particleContainer) {
    initParticles(particleContainer);
  }

  // Initialize custom cursor
  const cursorElement = getElementOrNull('custom-cursor');
  if (cursorElement) {
    initCursor(cursorElement);
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners(): void {
  // Button click events
  buttonClickZone.addEventListener('mousedown', (e) => {
    e.preventDefault();
    pressDown();
  });
  buttonClickZone.addEventListener('mouseup', pressUp);
  buttonClickZone.addEventListener('mouseleave', pressUp);
  buttonClickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    pressDown();
  });
  buttonClickZone.addEventListener('touchend', pressUp);
  buttonClickZone.addEventListener('touchcancel', pressUp);
  buttonClickZone.addEventListener('contextmenu', (e) => e.preventDefault());

  // Connect button - opens AppKit modal
  connectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState.isConnected) {
      handleDisconnect();
    } else {
      openConnectModal();
    }
  });

  // Legacy wallet modal listeners removed - AppKit handles its own modal

  // Submit button
  submitBtn.addEventListener('click', handleSubmit);

  // Help modal
  setupHelpModalListeners();

  // Mobile menu
  setupMobileMenuListeners();

  // Collection modal
  setupCollectionModalListeners();

  // Claim modal
  setupClaimModalListeners();

  // UI visibility based on mouse position
  setupUIVisibility();

  // Leaderboard toggle
  leaderboardToggleGlobal.addEventListener('click', () => setLeaderboardMode('global'));
  leaderboardToggleGame.addEventListener('click', () => setLeaderboardMode('game'));
}

// Wallet modal setup removed - AppKit provides its own modal UI

/**
 * Set up help modal event listeners
 */
function setupHelpModalListeners(): void {
  const helpBtn = getElementOrNull('help-btn');
  const helpCloseBtn = getElementOrNull('help-close-btn');

  helpBtn?.addEventListener('click', () => showModal(helpModal));
  helpCloseBtn?.addEventListener('click', () => hideModal(helpModal));
  helpModal?.addEventListener('click', (e) => {
    if (e.target === helpModal) hideModal(helpModal);
  });
}

/**
 * Set up mobile menu event listeners
 */
function setupMobileMenuListeners(): void {
  const menuBtn = getElementOrNull('mobile-menu-btn');
  const menu = getElementOrNull('mobile-menu');
  const backdrop = getElementOrNull('mobile-menu-backdrop');

  const openMenu = (): void => {
    menuBtn?.classList.add('open');
    menu?.classList.add('open');
    backdrop?.classList.add('open');
    // Update wallet text when menu opens
    updateMobileWalletText();
  };

  const closeMenu = (): void => {
    menuBtn?.classList.remove('open');
    menu?.classList.remove('open');
    backdrop?.classList.remove('open');
  };

  menuBtn?.addEventListener('click', () => {
    if (menu?.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  backdrop?.addEventListener('click', closeMenu);

  // Menu items
  getElementOrNull('mobile-menu-wallet')?.addEventListener('click', () => {
    closeMenu();
    if (gameState.isConnected) {
      handleDisconnect();
    } else {
      openConnectModal();
    }
  });

  getElementOrNull('mobile-menu-rewards')?.addEventListener('click', () => {
    closeMenu();
    showCollectionModal();
  });

  getElementOrNull('mobile-menu-leaderboard')?.addEventListener('click', () => {
    closeMenu();
    showRankingsModal();
  });

  getElementOrNull('mobile-menu-about')?.addEventListener('click', () => {
    closeMenu();
    showModal(helpModal);
  });
}

/**
 * Update mobile menu wallet text based on connection state
 */
function updateMobileWalletText(): void {
  const walletText = getElementOrNull('mobile-menu-wallet-text');
  if (!walletText) return;

  if (gameState.isConnected && gameState.userAddress) {
    setText(walletText, shortenAddress(gameState.userAddress));
  } else {
    setText(walletText, 'Connect Wallet');
  }
}

/**
 * Set up collection modal event listeners
 */
function setupCollectionModalListeners(): void {
  const seeCollectionBtn = getElementOrNull('see-collection-btn');
  const collectionCloseBtn = getElementOrNull('collection-close-btn');
  const resetCursorBtn = getElementOrNull('reset-cursor-btn');
  const seeRankingsBtn = getElementOrNull('see-rankings-btn');
  const rankingsCloseBtn = getElementOrNull('rankings-close-btn');

  seeCollectionBtn?.addEventListener('click', showCollectionModal);
  collectionCloseBtn?.addEventListener('click', () => hideModal(collectionModal));
  collectionModal?.addEventListener('click', (e) => {
    if (e.target === collectionModal) hideModal(collectionModal);
  });

  // Sync achievements button
  const syncAchievementsBtn = getElementOrNull<HTMLButtonElement>('sync-achievements-btn');
  syncAchievementsBtn?.addEventListener('click', handleSyncAchievements);

  resetCursorBtn?.addEventListener('click', () => {
    resetCursor();
    setText(equippedCursorName, 'Default');
    renderCollectionGrid();
    showAchievementToast('Cursor Reset', 'Using default cursor');
  });

  // Rankings modal
  seeRankingsBtn?.addEventListener('click', showRankingsModal);
  rankingsCloseBtn?.addEventListener('click', () => hideModal(rankingsModal));
  rankingsModal?.addEventListener('click', (e) => {
    if (e.target === rankingsModal) hideModal(rankingsModal);
  });
}

/**
 * Set up claim modal event listeners
 */
function setupClaimModalListeners(): void {
  claimNftBtn?.addEventListener('click', handleClaimNft);
  claimLaterBtn?.addEventListener('click', () => hideModal(claimModal));
  claimModal?.addEventListener('click', (e) => {
    if (e.target === claimModal) hideModal(claimModal);
  });
}

/**
 * Set up UI visibility based on mouse/touch position
 */
function setupUIVisibility(): void {
  const uiOverlay = getElementOrNull('ui-overlay');
  if (!uiOverlay) return;

  const EDGE_MARGIN = 400;

  // Check if touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // On mobile, always show UI overlay (don't hide it)
  if (isTouchDevice) {
    removeClass(uiOverlay, 'hidden');
    return;
  }

  // Desktop: show UI when near edges
  document.addEventListener('mousemove', (e) => {
    const nearEdge =
      e.clientX < EDGE_MARGIN ||
      e.clientX > window.innerWidth - EDGE_MARGIN ||
      e.clientY < EDGE_MARGIN ||
      e.clientY > window.innerHeight - EDGE_MARGIN;

    toggleClass(uiOverlay, 'hidden', !nearEdge);
  });

  document.addEventListener('mouseleave', () => {
    removeClass(uiOverlay, 'hidden');
  });
}

// ============ Button Mechanics ============

function pressDown(): void {
  if (isPressed || isMiningClick) return;
  isPressed = true;
  buttonImg.src = 'button-down.jpg';
  playButtonDown();

  if (gameState.isConnected) {
    isMiningClick = true;
    startMining(onClickMined);
  }
}

function pressUp(): void {
  if (!gameState.isConnected && isPressed) {
    isPressed = false;
    buttonImg.src = 'button-up.jpg';
    playButtonUp();
  }
}

function onClickMined(nonce: bigint): void {
  isMiningClick = false;
  isPressed = false;
  buttonImg.src = 'button-up.jpg';
  playButtonUp();

  gameState.addClick(nonce);
  updateDisplays();
  updateSubmitButton();
}

// ============ Connection ============

async function onConnected(): Promise<void> {
  initializeContracts();

  // Fetch game data
  await refreshGameData();

  // Try to restore saved clicks
  const restored = gameState.tryRestoreFromStorage();
  if (restored) {
    console.log(`[App] Restored ${gameState.validClicks} saved clicks`);
  }

  // Update UI
  updateConnectButton();
  updateDisplays();
  updateSubmitButton();

  // Fetch user stats
  await refreshUserStats();

  // Check verification status
  await checkVerificationStatus(gameState.userAddress!);

  // Fetch server stats and render NFT panel
  const stats = await fetchServerStats(gameState.userAddress!);
  if (stats) {
    serverStats = stats;
    gameState.setServerStats(stats);
    await renderNftPanel(stats);
  }

  // Start periodic updates
  startPeriodicUpdates();

  // Start heartbeat for active user tracking
  startHeartbeat();
}

async function handleDisconnect(): Promise<void> {
  terminateMining();
  stopHeartbeat();
  await disconnect();
  updateConnectButton();
  isMiningClick = false;
  isPressed = false;
  buttonImg.src = 'button-up.jpg';
}

// ============ Submit ============

async function handleSubmit(e: Event): Promise<void> {
  e.stopPropagation();

  const nonces = gameState.pendingNonces.slice(0, CONFIG.maxBatchSize);
  if (nonces.length < CONFIG.minBatchSize) return;

  // Require Turnstile verification before any submission
  // PoW proves the work was done, Turnstile proves a human is present
  if (!turnstileToken) {
    showTurnstileModal();
    return;
  }

  try {
    submitBtn.disabled = true;

    if (gameState.isGameActive) {
      // Game is active: submit to blockchain first, then record to API
      await handleOnChainSubmit(nonces);
    } else {
      // Game is inactive: record to API only (with nonces as proof-of-work)
      await handleOffChainSubmit(nonces);
    }
  } catch (error) {
    console.error('[Submit] Error:', error);
    submitBtn.disabled = false;
    updateSubmitButton();
  }
}

async function handleOnChainSubmit(nonces: readonly bigint[]): Promise<void> {
  // Submit to blockchain
  const receipt = await submitClicks([...nonces]);
  if (!receipt) return;

  // Record to server (with Turnstile token + PoW nonces)
  const clicksToRecord = Math.min(gameState.serverClicksPending, nonces.length);
  if (clicksToRecord > 0) {
    const result = await recordClicksToServer(
      gameState.userAddress!,
      clicksToRecord,
      turnstileToken,
      nonces.slice(0, clicksToRecord).map(n => n.toString()),
      gameState.currentEpoch
    );
    if (result.success) {
      gameState.markServerClicksRecorded(clicksToRecord);
      // Keep turnstileToken for session - server tracks verification status
      handleAchievements(result);
    } else if (result.requiresVerification) {
      // Server says re-verify (e.g., after N clicks)
      turnstileToken = null;
      showTurnstileModal();
    }
  }

  // Record on-chain submission
  await recordOnChainSubmission(
    gameState.userAddress!,
    nonces.length,
    receipt.transactionHash,
    gameState.currentEpoch
  );

  // Clear submitted clicks
  gameState.clearSubmittedClicks(nonces.length);

  // Update UI
  updateDisplays();
  updateSubmitButton();

  // Refresh stats and NFT panel
  await refreshUserStats();
  const stats = await fetchServerStats(gameState.userAddress!);
  if (stats) {
    serverStats = stats;
    gameState.setServerStats(stats);
    await renderNftPanel(stats);
  }
}

async function handleOffChainSubmit(nonces: readonly bigint[]): Promise<void> {
  // Record to API with Turnstile token + PoW nonces (no blockchain submission)
  const result = await recordClicksToServer(
    gameState.userAddress!,
    nonces.length,
    turnstileToken,
    nonces.map(n => n.toString())
  );

  if (result.success) {
    gameState.markServerClicksRecorded(nonces.length);
    // Keep turnstileToken for session - server tracks verification status
    handleAchievements(result);

    // Clear submitted clicks
    gameState.clearSubmittedClicks(nonces.length);

    // Update UI
    updateDisplays();
    updateSubmitButton();

    // Refresh stats from server and NFT panel
    const stats = await fetchServerStats(gameState.userAddress!);
    if (stats) {
      serverStats = stats;
      gameState.setServerStats(stats);
      await renderNftPanel(stats);
    }
  } else if (result.requiresVerification) {
    // Server says re-verify (e.g., after N clicks)
    turnstileToken = null;
    showTurnstileModal();
    submitBtn.disabled = false;
    updateSubmitButton();
  } else {
    submitBtn.disabled = false;
    updateSubmitButton();
  }
}

// ============ Achievements ============

function handleAchievements(data: {
  newMilestones?: Array<{ id: string; name: string; tier?: number; cosmetic?: string }>;
  newAchievements?: UnlockedAchievement[];
}): void {
  const claimable: ClaimState[] = [];
  let hasPersonalMilestone = false;
  let hasGlobalMilestone = false;

  // Handle personal milestones
  if (data.newMilestones && data.newMilestones.length > 0) {
    hasPersonalMilestone = true;
    for (const m of data.newMilestones) {
      showAchievementToast(m.name, m.cosmetic ? `Unlocked: ${m.cosmetic}` : 'Achievement unlocked!');
      if (m.tier) {
        claimable.push({ milestoneId: m.id, tier: m.tier });
      }
    }
  }

  // Handle other achievements
  if (data.newAchievements && data.newAchievements.length > 0) {
    for (const a of data.newAchievements) {
      if (a.type === 'global') {
        hasGlobalMilestone = true;
        showAchievementToast(`${a.name}`, '1/1 NFT incoming!');
      } else if (a.type === 'hidden') {
        showAchievementToast(`${a.name}`, 'Secret achievement!');
      } else if (a.type === 'streak') {
        showAchievementToast(`${a.name}`, `${a.days} day streak!`);
      } else {
        showAchievementToast(a.name, 'Achievement unlocked!');
      }
      if (a.tier) {
        claimable.push({ milestoneId: a.id, tier: a.tier });
      }
    }
  }

  // Trigger celebration
  if (hasGlobalMilestone) {
    celebrateGlobalMilestone();
  } else if (hasPersonalMilestone) {
    celebratePersonalMilestone();
  }

  // Queue claims
  if (claimable.length > 0 && hasNftContract()) {
    setTimeout(() => {
      const first = claimable.shift()!;
      gameState.addToClaimQueue(...claimable);
      showClaimModal(first.milestoneId, first.tier);
    }, 2000);
  }
}

/**
 * Handle sync achievements button click
 * Retroactively grants any missing achievements based on total clicks
 */
async function handleSyncAchievements(): Promise<void> {
  if (!gameState.userAddress) {
    showAchievementToast('Not Connected', 'Connect wallet first');
    return;
  }

  const syncBtn = document.getElementById('sync-achievements-btn');
  if (syncBtn?.classList.contains('syncing')) return; // Already syncing

  syncBtn?.classList.add('syncing');

  try {
    const result = await syncAchievements(gameState.userAddress);

    if (result.success) {
      const totalNew = (result.newMilestones?.length || 0) + (result.newAchievements?.length || 0);

      if (totalNew > 0) {
        // Process any new achievements like normal
        handleAchievements({
          newMilestones: result.newMilestones || [],
          newAchievements: result.newAchievements?.map(a => ({
            ...a,
            type: a.type as 'hidden' | 'global' | 'streak' | 'epoch' | 'personal',
          })) || [],
        });
        showAchievementToast('Synced!', `Found ${totalNew} achievement${totalNew > 1 ? 's' : ''}`);
      } else {
        showAchievementToast('All Synced', 'No missing achievements');
      }
    } else {
      showAchievementToast('Sync Failed', 'Try again later');
    }
  } catch (error) {
    console.error('Sync error:', error);
    showAchievementToast('Sync Error', 'Something went wrong');
  } finally {
    syncBtn?.classList.remove('syncing');
  }
}

// ============ UI Updates ============

/** Track previous connection state to detect new connections */
let wasConnected = false;

function handleStateChange(event: string): void {
  switch (event) {
    case 'connectionChanged':
      updateConnectButton();
      updateMobileWalletText();
      // Detect new connection (transition from disconnected to connected)
      if (gameState.isConnected && !wasConnected) {
        wasConnected = true;
        onConnected();
      } else if (!gameState.isConnected) {
        wasConnected = false;
      }
      break;
    case 'clicksChanged':
      updateDisplays();
      updateSubmitButton();
      break;
    case 'statsChanged':
      updateDisplays();
      break;
  }
}

function updateConnectButton(): void {
  if (gameState.isConnected && gameState.userAddress) {
    setText(connectBtn, shortenAddress(gameState.userAddress));
    addClass(connectBtn, 'connected');
    removeClass(connectBtn, 'wrong-network');
  } else if (gameState.connectionState === 'wrong-network') {
    setText(connectBtn, 'Wrong Network');
    addClass(connectBtn, 'wrong-network');
    removeClass(connectBtn, 'connected');
  } else {
    setText(connectBtn, 'Connect Wallet');
    removeClass(connectBtn, 'connected', 'wrong-network');
  }
}

function updateDisplays(): void {
  setText(arcadeCurrentEl, gameState.validClicks.toLocaleString());
  setText(arcadeAlltimeEl, gameState.allTimeClicks.toLocaleString());
  setText(arcadeEarnedEl, formatTokens(gameState.totalEarned));

  // Update game status, epoch, and pool based on whether game is active
  if (gameState.isGameActive) {
    setText(gameStatusEl, 'ACTIVE');
    removeClass(gameStatusEl, 'inactive');
    addClass(gameStatusEl, 'active');
    setText(epochInfoEl, `${gameState.currentEpoch} / ${gameState.totalEpochs}`);
    const poolFormatted = formatTokensSplit(gameState.poolRemaining);
    setText(poolInfoEl, poolFormatted.value);
    setText(poolSuffixEl, poolFormatted.suffix);
  } else {
    setText(gameStatusEl, 'INACTIVE');
    removeClass(gameStatusEl, 'active');
    addClass(gameStatusEl, 'inactive');
    setText(epochInfoEl, '0 / 0');
    setText(poolInfoEl, '0');
    setText(poolSuffixEl, '');
  }
}

function updateSubmitButton(): void {
  const hasEnoughClicks = gameState.validClicks >= CONFIG.minBatchSize;
  const canSubmit = hasEnoughClicks && gameState.isConnected;

  submitBtn.disabled = !canSubmit;
  setText(submitBtn, `Submit (${gameState.validClicks})`);

  // Show submit container when user has enough clicks (game active or not)
  if (hasEnoughClicks) {
    addClass(submitContainer, 'visible');
  } else {
    removeClass(submitContainer, 'visible');
  }
}

// ============ Leaderboard ============

/**
 * Set the leaderboard mode (global or current game)
 */
function setLeaderboardMode(mode: 'global' | 'game'): void {
  leaderboardMode = mode;

  // Update toggle button states
  if (mode === 'global') {
    addClass(leaderboardToggleGlobal, 'active');
    removeClass(leaderboardToggleGame, 'active');
  } else {
    removeClass(leaderboardToggleGlobal, 'active');
    addClass(leaderboardToggleGame, 'active');
  }

  // Refresh leaderboard
  fetchLeaderboard();
}

async function fetchLeaderboard(): Promise<void> {
  if (leaderboardMode === 'global') {
    // Global: all-time frontend clicks from Redis
    leaderboardData = await fetchGlobalLeaderboard(10);
  } else {
    // Game: on-chain clicks from current game's subgraph
    if (currentGame) {
      leaderboardData = await fetchGameLeaderboard(currentGame.subgraphUrl, 10);
    } else {
      leaderboardData = [];
    }
  }

  renderLeaderboard();
}

function renderLeaderboard(): void {
  if (leaderboardData.length === 0) {
    const message = leaderboardMode === 'global'
      ? 'No clicks yet!'
      : 'No on-chain submissions yet!';
    setHtml(leaderboardListEl, `<li class="leaderboard-loading">${message}</li>`);
    return;
  }

  const userAddrLower = gameState.userAddress?.toLowerCase();

  const html = leaderboardData
    .map((entry, index) => {
      const isYou = userAddrLower && entry.address?.toLowerCase() === userAddrLower;
      const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

      // Priority: server name > cached ENS > shortened address
      const cachedEns = getCachedEns(entry.address);
      const displayName =
        entry.name && entry.name !== 'Anonymous'
          ? entry.name
          : cachedEns || shortenAddress(entry.address);

      const milestone = getHighestMilestone(entry.totalClicks);
      const iconHtml = milestone
        ? `<img src="cursors/${milestone.cursor}.png" class="leaderboard-cursor-icon" alt="${milestone.name}">`
        : `<span class="leaderboard-indicator">${entry.isHuman ? '🧑' : '🤖'}</span>`;

      return `
        <li class="leaderboard-item ${isYou ? 'is-you' : ''}" data-address="${entry.address}">
          <span class="leaderboard-rank ${rankClass}">#${entry.rank}</span>
          ${iconHtml}
          <span class="leaderboard-name ${isYou ? 'is-you' : ''}">${displayName}${isYou ? ' (you)' : ''}</span>
          <span class="leaderboard-clicks">${formatNumber(entry.totalClicks)}</span>
        </li>
      `;
    })
    .join('');

  setHtml(leaderboardListEl, html);

  // Kick off ENS resolution in background for addresses without cached ENS
  resolveLeaderboardEns();
}

/**
 * Resolve ENS names for leaderboard entries in the background
 * Updates the DOM when names are resolved
 */
async function resolveLeaderboardEns(): Promise<void> {
  const addressesToResolve = leaderboardData
    .filter(entry => !entry.name && !getCachedEns(entry.address))
    .map(entry => entry.address);

  if (addressesToResolve.length === 0) return;

  // Resolve all addresses in parallel
  for (const address of addressesToResolve) {
    lookupEns(address).then(ensName => {
      if (ensName) {
        // Update the DOM element with the ENS name
        const item = leaderboardListEl.querySelector(`[data-address="${address}"]`);
        if (item) {
          const nameEl = item.querySelector('.leaderboard-name');
          if (nameEl) {
            const isYou = gameState.userAddress?.toLowerCase() === address.toLowerCase();
            nameEl.textContent = ensName + (isYou ? ' (you)' : '');
          }
        }
      }
    });
  }
}

function startLeaderboardUpdates(): void {
  fetchLeaderboard();

  setInterval(() => {
    fetchLeaderboard();
  }, 30000);
}

// ============ Periodic Updates ============

function startPeriodicUpdates(): void {
  setInterval(async () => {
    if (gameState.isConnected) {
      await refreshGameData();
      await refreshUserStats();
    }
  }, 30000);
}

// ============ Heartbeat & Active Users ============

/**
 * Start sending heartbeat to track active frontend users
 */
function startHeartbeat(): void {
  if (heartbeatInterval) return;

  // Send immediately
  if (gameState.userAddress) {
    sendHeartbeat(gameState.userAddress);
  }

  // Then every 30 seconds
  heartbeatInterval = setInterval(() => {
    if (gameState.userAddress) {
      sendHeartbeat(gameState.userAddress);
    }
  }, 30000);
}

/**
 * Stop heartbeat when disconnected
 */
function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Fetch and display global stats (active humans + bots)
 */
async function updateGlobalStats(): Promise<void> {
  try {
    // Fetch active humans from our API (heartbeat-based)
    const activeUsersPromise = fetchActiveUsers();

    // Fetch recent bot activity from subgraph (addresses that submitted in last 5 mins)
    const botActivityPromise = fetchRecentBotActivity(5);

    const [activeUsers, recentBots] = await Promise.all([activeUsersPromise, botActivityPromise]);

    // Update displays
    setText(activeHumansEl, activeUsers.activeHumans.toString());
    setText(activeBotsEl, recentBots.toString());

    // Also update global clicks if provided
    if (activeUsers.globalClicks !== undefined) {
      setText(globalTotalClicksEl, formatNumber(activeUsers.globalClicks));
    }
  } catch (error) {
    console.warn('Failed to update global stats:', error);
  }
}

/**
 * Start periodic global stats updates
 */
function startGlobalStatsUpdates(): void {
  // Initial fetch
  updateGlobalStats();

  // Update every 30 seconds for active users and global clicks (from API)
  setInterval(updateGlobalStats, 30000);
}

// ============ Modals ============

function showModal(modal: HTMLElement): void {
  addClass(modal, 'visible');
}

function hideModal(modal: HTMLElement): void {
  removeClass(modal, 'visible');
}

// showWalletModal removed - AppKit handles wallet modal

function showAchievementToast(name: string, desc: string): void {
  setText(achievementNameEl, name);
  setText(achievementDescEl, desc);
  addClass(achievementToast, 'visible');
  setTimeout(() => removeClass(achievementToast, 'visible'), 4000);
}

// ============ Turnstile Verification ============

declare const turnstile: {
  render: (selector: string, options: {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: (errorCode: string) => void;
    'expired-callback'?: () => void;
    theme?: 'light' | 'dark';
  }) => string;
  reset: (widgetId: string) => void;
};

function showTurnstileModal(): void {
  showModal(turnstileModal);

  if (!turnstileWidgetId && typeof turnstile !== 'undefined') {
    turnstileWidgetId = turnstile.render('#turnstile-widget', {
      sitekey: CONFIG.turnstileSiteKey,
      callback: onTurnstileSuccess,
      'error-callback': (errorCode) => {
        console.error('[Turnstile] Error:', errorCode);
      },
      'expired-callback': () => {
        turnstileToken = null;
        // Token expired, will need to re-verify on next submit
      },
      theme: 'dark'
    });
  } else if (turnstileWidgetId && typeof turnstile !== 'undefined') {
    turnstile.reset(turnstileWidgetId);
  }
}

function onTurnstileSuccess(token: string): void {
  turnstileToken = token;
  hideModal(turnstileModal);

  // Retry pending clicks if any
  if (gameState.serverClicksPending > 0 && gameState.pendingNonces.length > 0) {
    // Re-trigger submit - create a dummy event
    handleSubmit(new Event('click'));
  }
}

function showClaimModal(milestoneId: string, tier: number): void {
  gameState.setPendingClaim({ milestoneId, tier });

  const info = getMilestoneInfo(tier);
  const slot = findSlotByTier(tier);

  const previewEl = getElement('claim-nft-preview');
  const tierNameEl = getElement('claim-tier-name');
  const tierDescEl = getElement('claim-tier-desc');
  const claimBtn = getElement<HTMLButtonElement>('claim-nft-btn');

  // Set preview image
  if (slot?.cursor) {
    setHtml(previewEl, `<img src="cursors/${slot.cursor}.png" alt="${info.name}" style="width:100%;height:100%;object-fit:contain;">`);
  } else if (isGlobalMilestone(tier)) {
    setHtml(previewEl, `<img src="one-of-ones/${tier}.png" alt="${info.name}" style="width:100%;height:100%;object-fit:contain;">`);
  } else {
    setHtml(previewEl, '');
    setText(previewEl, info.emoji);
  }

  setText(tierNameEl, info.name);
  setText(tierDescEl, info.desc);
  setText(claimBtn, 'Mint NFT');
  claimBtn.disabled = false;
  removeClass(claimBtn, 'claiming');

  showModal(claimModal);
}

function showCollectionModal(): void {
  // Update equipped cursor name display
  setText(equippedCursorName, getEquippedCursorName());

  renderTrophySection();
  renderCollectionGrid();
  showModal(collectionModal);
}

/**
 * Show the rankings modal with tabs for Global and each game
 */
function showRankingsModal(): void {
  // Render tabs
  renderRankingsTabs();

  // Load rankings for current tab
  loadRankingsForTab(rankingsTab);

  showModal(rankingsModal);
}

/**
 * Render the tabs for the rankings modal
 */
function renderRankingsTabs(): void {
  const games = getAllGames();

  // Build tabs HTML
  let tabsHtml = `<button class="rankings-tab${rankingsTab === 'global' ? ' active' : ''}" data-tab="global">Global</button>`;

  for (const game of games) {
    const isActive = rankingsTab === game.id;
    tabsHtml += `<button class="rankings-tab${isActive ? ' active' : ''}" data-tab="${game.id}">${game.name}</button>`;
  }

  setHtml(rankingsTabsEl, tabsHtml);

  // Add click handlers to tabs
  const tabBtns = rankingsTabsEl.querySelectorAll('.rankings-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab') || 'global';
      setRankingsTab(tabId);
    });
  });
}

/**
 * Set the active rankings tab
 */
function setRankingsTab(tabId: string): void {
  rankingsTab = tabId;

  // Update tab button states
  const tabBtns = rankingsTabsEl.querySelectorAll('.rankings-tab');
  tabBtns.forEach(btn => {
    const btnTabId = btn.getAttribute('data-tab');
    if (btnTabId === tabId) {
      addClass(btn as HTMLElement, 'active');
    } else {
      removeClass(btn as HTMLElement, 'active');
    }
  });

  // Load rankings for this tab
  loadRankingsForTab(tabId);
}

/**
 * Load and render rankings for a specific tab
 */
async function loadRankingsForTab(tabId: string): Promise<void> {
  // Show loading
  setHtml(rankingsListEl, '<li class="rankings-loading">Loading...</li>');

  try {
    let data: MergedLeaderboardEntry[];

    if (tabId === 'global') {
      // Global: all-time frontend clicks from Redis
      data = await fetchGlobalLeaderboard(50);
    } else {
      // Game: on-chain clicks from that game's subgraph
      const games = getAllGames();
      const game = games.find(g => g.id === tabId);
      if (game) {
        data = await fetchGameLeaderboard(game.subgraphUrl, 50);
      } else {
        data = [];
      }
    }

    renderRankingsList(data);
  } catch (error) {
    console.error('Failed to load rankings:', error);
    setHtml(rankingsListEl, '<li class="rankings-loading">Failed to load rankings</li>');
  }
}

/**
 * Render the rankings list
 */
function renderRankingsList(data: MergedLeaderboardEntry[]): void {
  if (data.length === 0) {
    const message = rankingsTab === 'global'
      ? 'No clicks recorded yet!'
      : 'No on-chain submissions yet!';
    setHtml(rankingsListEl, `<li class="rankings-loading">${message}</li>`);
    return;
  }

  const userAddrLower = gameState.userAddress?.toLowerCase();

  const html = data
    .map((entry, index) => {
      const isYou = userAddrLower && entry.address?.toLowerCase() === userAddrLower;
      const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

      // Priority: server name > cached ENS > shortened address
      const cachedEns = getCachedEns(entry.address);
      const displayName =
        entry.name && entry.name !== 'Anonymous'
          ? entry.name
          : cachedEns || shortenAddress(entry.address);

      const milestone = getHighestMilestone(entry.totalClicks);
      const iconHtml = milestone
        ? `<img src="cursors/${milestone.cursor}.png" class="rankings-cursor-icon" alt="${milestone.name}">`
        : `<span class="rankings-indicator">${entry.isHuman ? '🧑' : '🤖'}</span>`;

      return `
        <li class="rankings-item ${isYou ? 'is-you' : ''}" data-address="${entry.address}">
          <span class="rankings-rank ${rankClass}">#${entry.rank}</span>
          ${iconHtml}
          <span class="rankings-name ${isYou ? 'is-you' : ''}">${displayName}${isYou ? ' (you)' : ''}</span>
          <span class="rankings-clicks">${formatNumber(entry.totalClicks)}</span>
        </li>
      `;
    })
    .join('');

  setHtml(rankingsListEl, html);

  // Kick off ENS resolution in background
  resolveRankingsEns(data);
}

/**
 * Resolve ENS names for rankings entries in the background
 */
async function resolveRankingsEns(data: MergedLeaderboardEntry[]): Promise<void> {
  const addressesToResolve = data
    .filter(entry => !entry.name && !getCachedEns(entry.address))
    .map(entry => entry.address);

  if (addressesToResolve.length === 0) return;

  // Resolve all addresses in parallel
  for (const address of addressesToResolve) {
    lookupEns(address).then(ensName => {
      if (ensName) {
        // Update the DOM element with the ENS name
        const item = rankingsListEl.querySelector(`[data-address="${address}"]`);
        if (item) {
          const nameEl = item.querySelector('.rankings-name');
          if (nameEl) {
            const isYou = gameState.userAddress?.toLowerCase() === address.toLowerCase();
            nameEl.textContent = ensName + (isYou ? ' (you)' : '');
          }
        }
      }
    });
  }
}

// ============ NFT Panel & Collection ============

/**
 * Render the NFT panel showing claimable achievements
 */
async function renderNftPanel(stats: ServerStatsResponse): Promise<void> {
  if (!stats || !hasNftContract()) {
    nftPanel.style.display = 'none';
    return;
  }

  // Collect all unlocked milestones and achievements
  const allUnlocked: Array<{ id: string; tier: number; type: string }> = [];

  // Personal milestones
  if (stats.milestones?.unlocked) {
    for (const id of stats.milestones.unlocked) {
      const tier = MILESTONE_ID_TO_TIER[id as keyof typeof MILESTONE_ID_TO_TIER];
      if (tier) allUnlocked.push({ id, tier, type: 'personal' });
    }
  }

  // Other achievements (global, hidden, streak, epoch)
  if (stats.achievements?.unlocked) {
    for (const id of stats.achievements.unlocked) {
      const tier = MILESTONE_ID_TO_TIER[id as keyof typeof MILESTONE_ID_TO_TIER];
      if (tier) allUnlocked.push({ id, tier, type: tier >= 200 && tier < 500 ? 'global' : 'hidden' });
    }
  }

  if (allUnlocked.length === 0) {
    nftPanel.style.display = 'none';
    return;
  }

  // Show the panel
  nftPanel.style.display = 'block';

  // Check on-chain claim status for each
  const nftItems: Array<{ id: string; tier: number; type: string; claimed: boolean }> = [];
  for (const item of allUnlocked) {
    let isClaimed = claimedOnChain.has(item.tier);
    if (!isClaimed) {
      isClaimed = await checkNftClaimed(gameState.userAddress!, item.tier);
      if (isClaimed) claimedOnChain.add(item.tier);
    }
    nftItems.push({ ...item, claimed: isClaimed });
  }

  // Sort: unclaimed first, then by tier
  nftItems.sort((a, b) => {
    if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
    return a.tier - b.tier;
  });

  // Count claimable
  const claimableCount = nftItems.filter(n => !n.claimed).length;
  setText(nftClaimableCount, claimableCount.toString());

  // Render the list
  if (nftItems.length === 0) {
    setHtml(nftList, '<li class="nft-empty">No achievements yet</li>');
    return;
  }

  let html = '';
  for (const item of nftItems) {
    const info = getMilestoneInfo(item.tier);
    const slot = findSlotByTier(item.tier);
    const claimedClass = item.claimed ? ' claimed' : '';

    // Use cursor image if available, 1/1 image for globals, otherwise fall back to emoji
    let iconHtml: string;
    if (slot?.cursor) {
      iconHtml = `<img src="cursors/${slot.cursor}.png" class="nft-cursor-icon" alt="${info.name}">`;
    } else if (item.tier >= 200 && item.tier < 500) {
      iconHtml = `<img src="one-of-ones/${item.tier}.png" class="nft-cursor-icon" alt="${info.name}">`;
    } else {
      iconHtml = `<span class="nft-emoji">${info.emoji}</span>`;
    }

    html += `
      <li class="nft-item${claimedClass}" data-tier="${item.tier}" data-id="${item.id}">
        ${iconHtml}
        <div class="nft-info">
          <div class="nft-name">${info.name}</div>
          <div class="nft-desc">${info.desc}</div>
        </div>
        ${item.claimed ? '<span class="nft-claimed-badge">✓</span>' : '<span class="nft-claim-badge">Mint</span>'}
      </li>
    `;
  }

  setHtml(nftList, html);

  // Add click handlers to unclaimed items
  const unclaimedItems = nftList.querySelectorAll('.nft-item:not(.claimed)');
  unclaimedItems.forEach(li => {
    li.addEventListener('click', () => {
      const tier = parseInt(li.getAttribute('data-tier') || '0', 10);
      const id = li.getAttribute('data-id') || '';
      if (tier > 0) {
        showClaimModal(id, tier);
      }
    });
  });
}

/**
 * Render the trophy section (global 1/1s)
 */
function renderTrophySection(): void {
  const ownedTrophies = GLOBAL_ONE_OF_ONE_TIERS.filter(t => claimedOnChain.has(t.tier));

  if (ownedTrophies.length === 0) {
    addClass(trophySection, 'empty');
    return;
  }

  removeClass(trophySection, 'empty');
  trophyGrid.innerHTML = '';

  for (const trophy of ownedTrophies) {
    const div = document.createElement('div');
    div.className = 'trophy-item';
    div.innerHTML = `
      <img src="one-of-ones/${trophy.tier}.png" class="trophy-img" alt="${trophy.name}">
      <span class="trophy-name">${trophy.name}</span>
      <span class="trophy-click-num">Click #${trophy.globalClick.toLocaleString()}</span>
    `;
    trophyGrid.appendChild(div);
  }
}

/**
 * Render the collection grid
 */
function renderCollectionGrid(): void {
  const equippedCursor = gameState.equippedCursor;
  collectionGrid.innerHTML = '';

  for (const slot of COLLECTION_SLOTS) {
    const isMinted = claimedOnChain.has(slot.tier);
    const isEquipped = slot.cursor && slot.cursor === equippedCursor;

    const div = document.createElement('div');
    div.className = 'collection-item' + (isMinted ? '' : ' locked') + (isEquipped ? ' equipped' : '');

    if (isMinted) {
      let iconHtml: string;
      if (slot.cursor) {
        iconHtml = `<img src="cursors/${slot.cursor}.png" class="collection-item-img" alt="${slot.name}">`;
      } else if (slot.tier >= 200 && slot.tier < 500) {
        iconHtml = `<img src="one-of-ones/${slot.tier}.png" class="collection-item-img" alt="${slot.name}">`;
      } else {
        const info = getMilestoneInfo(slot.tier);
        iconHtml = `<span class="collection-item-emoji">${info.emoji}</span>`;
      }

      div.innerHTML = `
        ${iconHtml}
        <span class="collection-item-name">${slot.name}</span>
      `;

      // Add click handler to equip cursor
      if (slot.cursor) {
        div.addEventListener('click', () => {
          applyCursor(slot.cursor!);
          setText(equippedCursorName, slot.name);
          renderCollectionGrid();
          showAchievementToast('Cursor Equipped!', `Now using: ${slot.name}`);
        });
      }
    } else {
      div.innerHTML = `
        <div class="collection-item-slot">?</div>
        <span class="collection-item-name">????</span>
      `;
    }

    collectionGrid.appendChild(div);
  }
}

// ============ NFT Claiming ============

/**
 * Handle NFT claim button click
 */
async function handleClaimNft(): Promise<void> {
  const pendingClaim = gameState.pendingClaim;
  if (!pendingClaim || !gameState.userAddress) return;

  const { tier } = pendingClaim;

  try {
    claimNftBtn.disabled = true;
    setText(claimNftBtn, 'Getting signature...');
    addClass(claimNftBtn, 'claiming');

    // Get signature from server
    const sigResponse = await getClaimSignature(gameState.userAddress, tier);

    setText(claimNftBtn, 'Confirm in wallet...');

    // Claim on-chain
    const receipt = await claimNft(tier, sigResponse.signature);

    // Confirm with server
    await confirmClaim(gameState.userAddress, tier, receipt.transactionHash);

    // Update local state
    claimedOnChain.add(tier);
    setText(claimNftBtn, 'Claimed!');

    // Refresh NFT panel
    if (serverStats) {
      await renderNftPanel(serverStats);
    }

    setTimeout(() => hideModal(claimModal), 1500);

  } catch (error) {
    console.error('NFT claim error:', error);
    setText(claimNftBtn, 'Error - Try Again');
    claimNftBtn.disabled = false;
    removeClass(claimNftBtn, 'claiming');

    if (error instanceof Error && error.message.includes('user rejected')) {
      setText(claimNftBtn, 'Mint NFT');
    }
  }
}

// ============ Start App ============

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
