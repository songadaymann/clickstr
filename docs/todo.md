# TODO - Remaining Tasks

## Pre-Mainnet Checklist

### Configuration
- [x] Get production Turnstile keys from Cloudflare dashboard
- [x] Update `CONFIG.turnstileSiteKey` in frontend (`0x4AAAAAACV0UOMmCeG_g2Jr`)
- [x] Add `TURNSTILE_SECRET_KEY` to Vercel env (mann.cool)
- [x] NFT signer wallet ready (`0xf55E4fac663ad8db80284620F97D95391ab002EF`)
- [x] Add `NFT_SIGNER_PRIVATE_KEY` to Vercel env
- [x] Add `NFT_CONTRACT_ADDRESS` to Vercel env (mann.cool)
- [x] Add `VITE_SEPOLIA_RPC_URL` to Vercel env (clickstr.fun)
- [x] Add `VITE_WALLET_CONNECT_PROJECT_ID` to Vercel env (clickstr.fun)
- [x] Fix .env to have both `SEPOLIA_RPC_URL` (Hardhat) and `VITE_SEPOLIA_RPC_URL` (frontend)

### Sepolia v5 Final Test (Feb 2-3, 2026) - DEPLOYED
- [x] Deploy ClickstrNFT contract: `0x39B41525ba423FcAbE23564ecCCdEa66e7D59551`
- [x] Deploy MockClickToken contract: `0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4`
- [x] Deploy Clickstr contract: `0xA16d45e4D186B9678020720BD1e743872a6e9bA0`
- [x] Configure NFT tier bonuses (2%-10%)
- [x] Deploy subgraph v1.0.3
- [x] Update frontend config with v5 addresses
- [x] Update games.ts with Beta Game 2
- [x] Configure Vercel root directory (`src-ts`)
- [x] Fix Vite output directory (`dist` not `../dist`)

### Mainnet Deployment
- [ ] Deploy $CLICK token via TokenWorks (fix metadata)
- [ ] Deploy Clickstr contract to mainnet
- [ ] Deploy ClickstrNFT contract to mainnet
- [ ] Verify contracts on Etherscan
- [ ] Update frontend `NETWORK = 'mainnet'`
- [ ] Deploy mainnet subgraph: `goldsky subgraph deploy clickstr-mainnet/1.0.0`
- [ ] Update Vercel env var with mainnet NFT contract

### Testing (Sepolia v5)
- [x] Test full flow: Connect wallet → click → verify → submit → see achievements
- [ ] Test epoch transitions (12 × 2hr epochs)
- [ ] Test difficulty adjustment after epochs
- [ ] Test winner bonus distribution
- [x] Verify NFT claiming flow end-to-end
- [ ] Test NFT tier bonuses apply correctly
- [ ] Run `npm run test:bot-b` to verify Turnstile blocks automation

---

## Art Assets - COMPLETED

All NFT artwork and cursor images have been uploaded to IPFS via Pinata.

**Uploaded (98 total):**
- [x] 74 cursor images (personal + streak milestones)
- [x] 24 one-of-one images (global 1/1s)
- [x] 98 ERC1155 metadata JSON files generated

**IPFS Hashes:**
| Asset | CID |
|-------|-----|
| Cursors | `QmVk3Eh4wZqyYpVs5iWM8P7XGrtHA5L685F1XEptRLsBrW` |
| 1/1 NFTs | `QmULij7pVE5C6kcddr3Caj9TAjZ5UCwKgnPKsUM533cM3S` |
| Metadata | `QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx` |

**NFT BaseURI:** `ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/`

**Upload Script:** `scripts/upload-nft-assets.js`
**Config File:** `nft-ipfs-config.json`

---

## Frontend Enhancements

### Done
- [x] Display milestones/achievements panel
- [x] Add leaderboard display (three-tier)
- [x] Show global click counter
- [x] Add season info display
- [x] Mobile responsiveness
- [x] Collection modal (95 slots)
- [x] Cursor cosmetics system (fully implemented)
- [x] Cursor PNG assets renamed and working (73 cursors)
- [x] One-of-one NFT images renamed and working (24 images)
- [x] Mint Rewards panel shows cursor/NFT images instead of emojis
- [x] Claim modal shows cursor/NFT images instead of emojis
- [x] NFT claim API fix (send tier number instead of milestone string)
- [x] Turnstile error code logging for debugging
- [x] Custom cursor element (follows mouse, 48x48px)
- [x] Cursor particle effects (flames, sparkles, glows, matrix, glitch, etc.)
- [x] 16 special cursors with unique effects
- [x] Cursor Reset button in collection modal
- [x] Help modal ("How to Play") with game overview
- [x] Help button (red "?" circle, upper right)
- [x] Responsive help modal for mobile
- [x] Mobile hamburger menu (Mint Rewards, Leaderboard, How to Play)
- [x] Contextual submit button (appears above button at 50+ clicks)
- [x] Unified red/black arcade theme for all modals
- [x] Multiple wallet options (MetaMask, Rainbow, Rabby, Coinbase)
- [x] Fixed WalletConnect v2 provider loading
- [x] Migrated to Reown AppKit for reliable mobile wallet connections
- [x] Rankings modal with tabs for Global + each past game
- [x] "Your Total Clicks" reads consistently from API only

### Remaining
- [x] Show current difficulty level somewhere
- [x] Show estimated reward per click
- [x] Leaderboard improvements (Humans/On-Chain tabs, matrix view in rankings modal)
- [x] NFT panel improvements (green MINT button, no grey-out)
- [x] Add welcome modal on first visit (6-point explanation)
- [x] Temporary cursor preview during welcome modal
- [x] "Buy $CLICKSTR" button linking to TokenStrategy
- [x] Copy token address button
- [x] Sound effects for achievements
- [x] Confetti animation for legendary unlocks
- [ ] Error handling improvements
- [x] Investigate remaining font weirdness (removed # and ~ that don't render)
- [ ] Think about making modals bigger, so font can be bigger for readability. 



---

## Streak Tracking

Backend is DONE in mann.cool API (`api/clickstr.js` lines 829-852, 930-936):
- [x] Track which days a user clicked (Redis key `clickstr:streak:{address}`)
- [x] Calculate current streak on each click
- [x] Update `currentStreak` and `longestStreak` in Redis hash
- [x] Return streak info in stats endpoint response
- [x] Check and award streak achievements (tiers 101-103)

**Frontend:**
- [x] Show streak counter in UI (panel below NFT rewards on right side)
- [ ] Display streak achievements in Mint Rewards panel when earned

**Milestones:**
- Tier 101: Week Warrior (7 day streak)
- Tier 102: Month Master (30 day streak)
- Tier 103: Perfect Attendance (90 day streak)

---

## API Enhancements

- [ ] Create NFT metadata API endpoint (`/api/clickstr/nft/[tokenId]`)
- [x] Update frontend V2 claim flow to sign server challenge (`/api/clickstr-v2` action `claim`) and retry with `walletSignature`
- [x] Wire V2 claim attestation helper into the Claim Rewards UI (use `requestV2ClaimAttestation()`; handle Turnstile prompt + wallet signature retry)

---

## V2 Security Fixes - COMPLETED (Feb 5, 2026)

All critical and high severity security issues identified in `docs/v2-security.md` have been fixed.

### Contract Fixes

**Critical:**
- [x] Treasury burn ratio enforcement - `require(burnAmount >= userAmount)` in `disburse()`
- [x] Registry season validation - `require(season == gameToSeason[msg.sender])` in `recordClicks()`

**High:**
- [x] Max click count - `MAX_CLICKS_PER_CLAIM = 100_000_000` constant
- [x] Claim grace period - `CLAIM_GRACE_PERIOD = 72 hours` before `endGame()` can be called
- [x] Grace period in finalization - `_finalizeEpochInternal` respects grace period

**Medium:**
- [x] Finalizer reward 50/50 split at 0.1% (was 100% to finalizer at 1%)

### Frontend V2 Token Claim UI

- [x] `V2ClaimableEpoch` and `V2ClaimableEpochsResponse` types
- [x] `fetchV2ClaimableEpochs()` API function
- [x] `CLICKSTR_V2_ABI` contract ABI
- [x] `claimV2Reward()` and `checkV2Claimed()` contract functions
- [x] V2 claim modal in index.html
- [x] Modal CSS styling
- [x] `showV2ClaimModal()`, `renderV2ClaimList()`, `handleV2ClaimSingle()`, `handleV2ClaimAll()` functions
- [x] `checkV2ClaimableEpochs()` runs on wallet connect
- [x] "Claim (N)" button in game status panel

### V2 Incremental Claims - COMPLETED (Feb 5-6, 2026)

- [x] Modified `ClickstrGameV2.sol` to use `claimedClicks` mapping (uint256) instead of `claimed` (bool)
- [x] Contract calculates `newClicks = clickCount - previouslyClaimed` and only pays for new clicks
- [x] Deployed Season 3 game contract with incremental claims: `0xC3af5dE6c6303A6241776c3C8b3DA747386982b1`
- [x] Added green glowing "Claim" button with pulse animation
- [x] Added cash machine sound effect on successful claim
- [x] Wired up full V2 claim flow: `submitClicksV2()` → `requestV2ClaimSignature()` → `claimV2Reward()` → `playCashMachineSound()`
- [x] Added `IS_V2` flag to detect V2 mode based on network
- [x] Fixed `fetchDifficultyTarget()` to return default difficulty for V2
- [x] **Fixed API incremental claims** — `hasClaimedOnChain()` (boolean) replaced with `getClaimedClicksOnChain()` (uint256)
- [x] **Fixed API signature cache** — now issues NEW signature when clicks > previous clickCount
- [x] **Fixed frontend claim guard** — `checkV2Claimed()` (boolean) replaced with `getV2ClaimedClicks()` (numeric comparison)

### V2 ClickRegistry with Earnings Tracking - COMPLETED (Feb 6, 2026)

- [x] Added `totalEarned`, `earnedPerSeason`, `globalTotalEarned` to ClickRegistry
- [x] Added `recordEarnings()` function to ClickRegistry
- [x] Added `seedHistoricalEarnings()` for migration
- [x] Updated ClickstrGameV2 to call `registry.recordEarnings()` on claim
- [x] Deployed new ClickRegistry: `0xF8cC8ff9f7f092f5d7221552437aF748954cA427`
- [x] Deployed Season 5 game: `0xec003c2282A01E30d712b238A068d852bCDda614`
- [x] Migrated test data (426 clicks, 12.78 CLICK earned)
- [x] Updated API to read `totalEarned` from registry and return `lifetimeEarned`
- [x] Updated frontend types (`V2StatsResponse.lifetimeEarned`)
- [x] Updated `onConnected()` to set `totalEarned` from API response
- [x] Fixed `checkV2Claimed()` missing contract address argument
- [x] Updated frontend config with Season 5 addresses

**Still TODO:**
- [ ] Debug why "Total Earned" still shows 0 on frontend
  - Verify API returns `lifetimeEarned` (curl endpoint)
  - Check Vercel env var `CLICKSTR_REGISTRY_ADDRESS` is updated
  - Check mann.cool API is redeployed
  - Trace frontend `v2Stats.lifetimeEarned` parsing

### V2 NFT Tier Bonus System - COMPLETED (Feb 6, 2026)

Ported V1's NFT bonus system to V2. Holding achievement NFTs now grants 2-10% bonus on claim rewards.

- [x] Added `IClickstrNFT` interface and `achievementNFT` state variable to ClickstrGameV2
- [x] Added `tierBonus` mapping + `bonusTiers` array
- [x] Added `setAchievementNFT()` and `setTierBonuses()` admin functions
- [x] Applied bonus in `claimReward()` via `_distributeReward()` helper
- [x] Applied bonus in `claimMultipleEpochs()` via `_processEpochClaim()` helper
- [x] Added `calculateBonus()`, `getBonusTiers()`, `getUserBonusInfo()` view functions
- [x] Added `BonusApplied` and `AchievementNFTUpdated` events
- [x] Refactored for stack-too-deep: `_verifyAttestation()`, `_distributeReward()`, `_processEpochClaim()`, `_processMultiClaim()`
- [x] Updated `deploy-v2.js` with `setAchievementNFT` + `setTierBonuses` calls
- [x] Updated `deploy-v2-season.js` with optional `NFT_CONTRACT_ADDRESS` support
- [x] All 111 tests pass, clean compile

**Vercel Env Vars to Update:**
```
CLICKSTR_REGISTRY_ADDRESS=0xF8cC8ff9f7f092f5d7221552437aF748954cA427
CLICKSTR_GAME_V2_ADDRESS=0xec003c2282A01E30d712b238A068d852bCDda614
```

### V2 NFT Contract: Mutable Registry - COMPLETED (Feb 6, 2026)

- [x] Changed `registry` from `immutable` to mutable in `ClickstrNFTV2.sol`
- [x] Added `RegistryUpdated` event
- [x] Added `setRegistry(address)` owner-only function
- [x] All 43 tests pass

---

## Scripts & Tools

### Done
- [x] `scripts/public-miner.js` - Public-facing mining script for users
  - Self-contained (hardcoded contract addresses)
  - Multi-threaded (uses all CPU cores)
  - Simple setup (just needs PRIVATE_KEY in .env)
  - Clear messaging that scripts don't earn NFTs

---

---

## TypeScript Migration (src-ts/) - DEPLOYED

The frontend has been refactored from a single 4,922-line `index.html` to a modular TypeScript project. Now live on clickstr.fun!

### Completed
- [x] Vite project scaffolding with TypeScript
- [x] tsconfig.json with strict mode and path aliases
- [x] Vitest configuration
- [x] Type definitions for all modules (game, nft, api, contracts, effects)
- [x] Config modules (network, milestones, collection, games)
- [x] GameState class with event-based subscriptions
- [x] localStorage persistence helpers
- [x] Services (api, wallet, contracts, mining)
- [x] Effects (particles, confetti, cursor, disco, sounds, celebrations)
- [x] CSS split into 11 modular files
- [x] HTML template with all UI elements
- [x] Build passes with no TypeScript errors
- [x] Deployed to Vercel (clickstr.fun)
- [x] Environment variables configured (VITE_SEPOLIA_RPC_URL, VITE_WALLET_CONNECT_PROJECT_ID)
- [x] Root directory set to `src-ts`
- [x] Output directory fixed (`dist`)

### Remaining

1. **Write Unit Tests** (Priority: Medium) - DONE (102 tests)
   - [x] Test `GameState` subscription and state updates (39 tests)
   - [x] Test `persistence.ts` localStorage functions (15 tests)
   - [x] Test `milestones.ts` helper functions (34 tests)
   - [x] Test `api.ts` mergeLeaderboards logic (14 tests)
   - [ ] Mock tests for wallet/contract interactions

2. **Code Quality** (Priority: Low)
   - [ ] Add ESLint rules
   - [ ] Add Prettier configuration
   - [ ] Consider splitting main.ts further (UI updates, event handlers)
   - [ ] Add JSDoc comments to public APIs

### Vercel Configuration

**clickstr.fun project:**
- Root Directory: `src-ts`
- Build Command: `npm run build`
- Output Directory: `dist`

**Environment Variables:**
- `VITE_SEPOLIA_RPC_URL` - Alchemy Sepolia endpoint
- `VITE_WALLET_CONNECT_PROJECT_ID` - Reown/WalletConnect project ID (from cloud.reown.com)

### Running Locally

```bash
cd src-ts

# Development
npm run dev

# Build
npm run build

# Test
npm run test

# Preview production build
npm run preview
```

---

## Nice to Have (Post-Launch)

- [ ] The Graph subgraph for mainnet (already have Goldsky)
- [ ] Historical stats page
- [ ] Button skins (6 tiers)
- [ ] Sound effects on valid click
- [ ] Confetti on epoch win
