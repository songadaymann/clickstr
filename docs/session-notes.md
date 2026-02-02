# Development Session Notes

## Session 1 - Initial Build
- Started with concept of anti-cheat for clicker game
- Evolved to PoW as the anti-cheat mechanism
- Discovered TokenWorks Recursive Strategy as base layer
- Designed 50/50 burn mechanism (atomic in same tx)
- Built full contract + frontend + deploy scripts
- Fixed OpenZeppelin v5 import paths
- Contract compiles successfully

## Session 2 - Security Review Fixes

### High Severity Fixed
1. **SHA-256 vs keccak256 in miner** - Replaced with js-sha3 keccak256
2. **Daily emission cap unenforced** - Added `epochEmissionBudget` tracking

### Medium Severity Fixed
3. **finalizeEpoch accepts invalid epochs** - Added bounds check
4. **Hardcoded chainId in frontend** - Now uses `useChainId()` hook

## Session 3 - Sepolia Deployment & Frontend Rebuild (Jan 12, 2026)

- Deployed v1 contracts to Sepolia
- Rebuilt frontend as vanilla HTML/JS (replaced React)
- Added arcade button images and sounds
- **Key decision:** 1 Click = 1 Mining Operation
  - Button stays DOWN while mining
  - Pops UP when valid nonce found
  - Creates meaningful, intentional clicking

## Session 4 - WalletConnect & Ideas (Jan 13, 2026)

- Fixed ethers.js CDN issues
- Added WalletConnect support
- **Critical fix:** Frontend was using sha3_256 instead of keccak256
- Added game status check for "not started" state
- Brainstormed human vs script leaderboards

## Session 5 - Security Audit Fixes (Jan 13, 2026)

### Critical Issues Fixed
1. **Gas Bomb DoS** - Capped auto-finalize to 5 epochs
2. **Death Spiral** - Difficulty decreases on zero-click epochs
3. **MEV Exploitation** - Separate finalizer rewards from auto-finalize
4. **Precision Loss** - Scaled math for difficulty adjustment

### High/Medium Fixed
5. **Budget Exhaustion UX** - Soft overflow at 10% rate instead of revert
6. **Unbounded Array** - Capped view function iteration to 1000

Deployed v2 contracts to Sepolia with all fixes.

## Session 6 - Cookie Clicker Architecture (Jan 14, 2026)

- Designed dual-layer reward system (on-chain + off-chain)
- Created server APIs for mann.cool:
  - `/api/clickstr` - Click tracking, stats, leaderboard
  - `/api/clickstr-eligible` - NFT eligibility
- Defined milestone/achievement system
- Designed signature-based NFT claiming (not Chainlink)
- Added Cloudflare Turnstile for bot protection

## Session 7 - Frontend Turnstile Integration (Jan 14, 2026)

- Added Turnstile verification modal
- Added achievement toast notifications
- Integrated server API calls
- Added periodic verification checks

## Session 8 - Seasonal Architecture Decision (Jan 14, 2026)

- Identified problems with 90-day finite model
- Decided on seasonal model (multiple shorter seasons)
- Key decisions:
  - Unused tokens burn at season end
  - Fresh contract per season (not upgradeable)
  - Off-chain achievements persist forever

## Session 9 - Seasonal Contract + Frontend UX (Jan 15, 2026)

- Parameterized contract constructor (epochs, duration configurable)
- Updated deploy script for season config via env vars
- Fixed arithmetic overflow bug in difficulty adjustment
- All 52 tests passing

## Session 10 - NFT Claim System + Difficulty Carryover (Jan 20, 2026)

- Added `initialDifficulty` constructor param for season continuity
- Scaled `TARGET_CLICKS_PER_EPOCH` based on duration
- Added epoch duration bounds (1 hour to 7 days)
- Created ClickstrNFT.sol (ERC721 with signatures)
- Created reference claim-signature API
- Added claim modal to frontend
- 35 NFT contract tests passing

## Session 11 - ERC1155 Conversion + Expanded Milestones (Jan 27, 2026)

- Converted NFT from ERC721 to ERC1155
  - Personal milestones = editions (many can own)
  - Global milestones = 1/1s (only one owner ever)
  - Batch claiming support
- Expanded global milestone range to 200-499
- Defined ~100 milestone tiers (meme numbers, palindromes, math, cultural)
- 43 NFT contract tests passing

## Session 12 - Test Deployment & Comprehensive Testing (Jan 28, 2026)

- Reorganized milestones (global 1/1s now only powers of 10 + hidden)
- Created `milestones-v2.csv` with cursor cosmetic rewards
- Deployed 2-day compressed test environment
- Created test scripts:
  - `test-bot-a-contract.js` - Contract miner
  - `test-bot-b-frontend.js` - Puppeteer bot
  - `test-monitor.js` - Real-time dashboard
- Fixed click persistence (localStorage)
- Fixed Turnstile keys
- Added arcade-style segmented displays

## Session 13 - Leaderboard UI & Arcade Styling (Jan 28, 2026)

- Bot A running successfully (~17-25K H/s)
- Added leaderboard panel with top 10 + rank
- Full arcade theme overhaul:
  - 3D beveled buttons
  - CRT scanline effects
  - Press Start 2P pixel font
  - DSEG7 seven-segment font
- Fixed bot script ABI issues
- Created optimized miner (500 batch, multi-threaded)
- Gas economics analysis: ~$0.33/token on mainnet = natural bot deterrent

## Session: January 29, 2026 - UI Overhaul & Collection System

- Mobile responsiveness complete (multiple breakpoints)
- Button image fills entire screen (`object-fit: cover`)
- Red LED segment display aesthetic throughout
- Custom SevenSegment font for labels
- NFT panel renamed to "Mint Rewards"
- Collection modal with 95 slots
- Cursor cosmetics system scaffolded (awaiting PNGs)

## Session: January 30, 2026 - Rankings Modal & Subgraph Integration

- Frontend config restructured for easy network switching
- Circular button click zone (not entire screen)
- Subgraph redeployed for test contract (v1.0.1)
- Three-tier leaderboard → simplified to single leaderboard with human/bot indicators:
  - 🧑 = has frontend activity (human)
  - 🤖 = contract-only submissions (bot/script)
- On-chain clicks (subgraph) now authoritative, frontend activity indicates human usage
- Fixed "Anonymous" display name bug

## Session: January 30, 2026 (Later) - Test Game End & Repo Setup

### Test Game Completed Successfully

Called `endGame()` after 2-day test period. Final results:

| Metric | Value |
|--------|-------|
| You (0xAd9f...) | ~3,241 CLICK (won epochs 2, 3, 4) |
| Bot (0x3d94...) | ~210 CLICK (won epoch 1) |
| **Burned** | **~1,996,549 CLICK (99.8%)** |

Confirmed all mechanics working:
- ✅ Winner bonuses distributed at epoch finalization
- ✅ 50% burn during gameplay
- ✅ Remaining pool burned at game end
- ✅ Tokens distributed immediately on `submitClicks()`, not at game end

### New GitHub Repo: Clickstr

Renamed project and created fresh repo: **https://github.com/songadaymann/clickstr**

- Cleaned `.gitignore` (excluded build artifacts, logs, old images)
- Fresh git history, 137 files committed

### Global 1/1 Milestones - Arcade Game Themes

Updated `milestones-v2.csv` with classic arcade game names:

**Main Global (200-213):**
- 200: The First Click → Spacewar
- 201: The Tenth → Pong
- 202: Century → Space Invaders
- 203: Thousandaire → Asteroids
- 204: Ten Grand → Beserk
- 205: Hundred Thousandth → Galaxian
- 206: Millionth Click → PacMan
- 207: Ten Million → Tempest
- 208: Hundred Million → Centipede
- 209: Billionaire → Donkey Kong
- 210: Ten Billion → Frogger (NEW)
- 211: Hundred Billion → DigDug (NEW)
- 212: One Trillion → Joust (NEW)
- 213: Ten Trillion → PolePosition (NEW)

**Hidden Global (220-229):**
- Nice → Smash TV
- Blaze It → NBA Jam
- Devil's Click → Mortal Kombat
- Lucky Sevens → Jurassic Park
- Elite → Area 51
- The Perfect Number → TMNT
- Ultra Nice → X-Men
- Calculator Masterpiece → Street Fighter 2
- Jenny → Virtua Fighter
- Meaning of Everything → Cruis'n USA

### Launch Prep

Planning mainnet launch tomorrow:
1. Fresh Sepolia deployment as dress rehearsal
2. Production Turnstile configured in Vercel
3. Deploy cursors and 1/1 artwork to IPFS
4. Set up Vercel deployment for clickstr site

## Session: January 30, 2026 (Evening) - IPFS NFT Metadata & Fresh Test Deployment

### NFT Assets Uploaded to IPFS (Pinata)

Verified all 98 milestone images present:
- 74 cursor images (personal + streak milestones)
- 24 one-of-one images (global 1/1s)

Created `scripts/upload-nft-assets.js` which:
1. Parses `milestones-v2.csv` for milestone definitions
2. Uploads cursor images to IPFS
3. Uploads 1/1 NFT images to IPFS
4. Generates ERC1155 metadata JSON for each tier
5. Uploads metadata directory to IPFS
6. Saves config to `nft-ipfs-config.json`

**IPFS Hashes:**
| Asset | CID |
|-------|-----|
| Cursors | `QmVk3Eh4wZqyYpVs5iWM8P7XGrtHA5L685F1XEptRLsBrW` |
| 1/1 NFTs | `QmULij7pVE5C6kcddr3Caj9TAjZ5UCwKgnPKsUM533cM3S` |
| Metadata | `QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx` |

**NFT BaseURI:** `ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/`

### NFT Contract Redeployed with IPFS Metadata

Deployed new ClickstrNFT with IPFS baseURI:
- Address: `0x3cDC7937B051497E4a4C8046d90293E2f1B84ff3`
- Signer: `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- Owner: `0xAd9fDaD276AB1A430fD03177A07350CD7C61E897`

**Note for mainnet:** Deploy NFT contract FROM the signer wallet so signer = owner.

### Admin Reset Endpoint

Created `/api/clickstr-admin-reset` on mann.cool for testing:
- Resets off-chain Redis data (clicks, milestones, achievements, streaks)
- Protected by `CLICKSTR_ADMIN_SECRET` env var
- Can reset single address or ALL data
- NEVER use in production once game is live!

### Fresh 24-Hour Test Deployment (v4)

Deployed new season for testing:

| Parameter | Value |
|-----------|-------|
| Total Epochs | 12 |
| Epoch Duration | 2 hours |
| Pool Size | 2M CLICK |
| Season Length | 24 hours |

**Contracts (v4):**
- Clickstr: `0x6dD800B88FEecbE7DaBb109884298590E5BbBf20`
- MockClickToken: `0xE7BBD98a6cA0de23baA1E781Df1159FCb1a467fA`
- NFT Contract: `0x3cDC7937B051497E4a4C8046d90293E2f1B84ff3`

**Timeline:**
- Start: 2026-01-30 19:46:48 UTC
- End: 2026-01-31 19:46:48 UTC

**NFT Tier Bonuses (enabled for first time!):**
- Tier 4 (1K clicks): +2%
- Tier 6 (10K clicks): +3%
- Tier 8 (50K clicks): +5%
- Tier 9 (100K clicks): +7%
- Tier 11 (500K clicks): +10%
- Max bonus: 27%

### Subgraph Updated

Deployed v1.0.2 to Goldsky pointing to new contract:
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.2/gn
```

### Files Updated
- `public/index.html` - contract addresses, subgraph URL
- `docs/deployment-status.md` - v4 contract info
- `subgraph/subgraph.yaml` - new contract address + start block
- `.env` - Pinata credentials (fixed format)
- `nft-ipfs-config.json` - IPFS hashes for deploy script

## Session: January 30, 2026 (Night) - UI Polish & Click Tracking Fix

### Cursor/NFT Images in UI

Replaced emoji placeholders with actual cursor and 1/1 NFT artwork throughout the UI:

1. **Leaderboard panel** (sidebar) - Shows cursor image based on user's click milestone tier
2. **Rankings modal** (expanded view) - Same cursor images, larger size
3. **Collection modal grid** - Cursor images for personal milestones, 1/1 images for globals
4. **Legendary 1/1s section** - Shows actual NFT artwork instead of numbered emoji

Added helper function `getMilestoneIcon()` that maps click count → highest tier → cursor filename.

### Critical Bug Fix: Click Count Mismatch

**Problem discovered:** Frontend API showed 505 clicks, but on-chain (subgraph) showed only 320.

**Root cause:** Clicks were being recorded to the frontend API BEFORE submitting to blockchain. If the transaction failed or was rejected, the API already had those clicks but they never made it on-chain.

**Fix:** Reordered the submit flow:
- Before: Record to API → Submit to blockchain (if tx fails, API has phantom clicks)
- After: Submit to blockchain → Wait for confirmation → Record to API (API stays in sync)

Also added `updateSubmitButton()` and `updateStatus()` calls after transaction failures so the UI properly reflects that clicks are still pending and ready to retry.

### Files Changed
- `public/index.html` - All UI and bug fix changes

## Session: January 30, 2026 (Late Night) - Custom Cursors, Help Modal & Public Miner

### Custom Cursor System with Particle Effects

Implemented full cursor cosmetics system that was previously scaffolded:

**Core Implementation:**
- Custom cursor element (48x48px) follows mouse instead of CSS `cursor` property
  - CSS cursors have strict size limits (~32x32), our artwork is 1024x1024
- Cursor selection persists to localStorage
- Reset button in collection modal to return to default

**Particle Effects for Special Cursors:**

Added 16 cursor effects with different visual styles:

| Effect Type | Cursors | Animation |
|-------------|---------|-----------|
| Flames | orange-flame, blue-flame, white-flame, demon-red | Rising fire particles |
| Smoke | smoke-green (Blaze It) | Green smoke trail |
| Sparkles | casino-gold, silver-sparkle, gold-sparkle, prismatic | Rotating sparkle burst |
| Glows | white-glow, hot-pink | Floating glow particles |
| Special | matrix-green (falling code), glitch-purple (glitchy), lava, rasta, dragon | Various unique effects |

**Cursor → Effect Mapping:**
- Tier 101-103 (Streaks): Flame effects (orange → blue → white/plasma)
- Tier 501 (420): Green smoke
- Tier 502 (666): Red demon flames
- Tier 503 (777): Gold sparkles
- Tier 504 (1337): Matrix falling code
- Tier 509-511: Rasta, lava, pink glow
- Tier 522-532: Various sparkles and glitch effects
- Tier 11-12 (500K-1M): Rainbow prismatic, golden aura

### Help Modal ("How to Play")

Added arcade-themed help button and modal:

**Help Button:**
- Red circular "?" in upper right corner
- 44x44px, matches arcade red-on-black theme
- Fixed position, always accessible

**Help Modal Sections:**
1. **The Basics** - Click to mine $CLICK via proof-of-work
2. **How It Works** - Connect wallet, click, batch 50-500, submit, pay gas
3. **The 50/50 Burn** - Every earned token burns another
4. **Seasons & Epochs** - 24-hour epochs, 2% distribution, winner bonus
5. **NFT Rewards** - Milestones unlock collectibles and cursors
6. **Scripts Welcome** - Bot script earns $CLICK but not NFTs
7. **Between Seasons** - Frontend clicks still count for NFT milestones

**Responsive Design:**
- Desktop: 580px max-width, larger fonts
- Mobile (<600px): 95% width, smaller fonts, adjusted button size

### Public Miner Script

Created `scripts/public-miner.js` for users who want to mine via script:

**Key Features:**
- Self-contained (no dependency on local deployment.json)
- Hardcoded contract addresses for Sepolia (mainnet ready when addresses added)
- Simple setup: just needs `PRIVATE_KEY` in .env file
- Clear startup banner noting scripts don't earn NFTs
- Multi-threaded mining (uses all CPU cores)
- Explorer links for transactions
- Friendly error messages

**Usage:**
```bash
# Create .env with your private key
echo "PRIVATE_KEY=0xYourKey" > .env

# Run the miner
node scripts/public-miner.js
```

**Environment Variables:**
- `PRIVATE_KEY` - Required: wallet private key
- `NETWORK` - Optional: 'sepolia' or 'mainnet' (default: sepolia)
- `RPC_URL` - Optional: custom RPC endpoint
- `BATCH_SIZE` - Optional: proofs per TX (default/max: 500)
- `NUM_WORKERS` - Optional: CPU threads (default: all cores)

### Files Changed
- `public/index.html` - Custom cursor system, particle effects, help modal
- `scripts/public-miner.js` - New public-facing miner script

### UI Label Updates

Renamed bottom stats display for clarity:
- "All-Time Clicks" → "Your Total Clicks"
- "Total Earned" → "Your Total Earned"

Increased stats label visibility:
- Font size: 14px (up from default)
- Full opacity (was 0.7)
- Stronger red glow effect
- Number display: 28px font, 160px min-width

## Session: January 31, 2026 - UI Theme Unification & Mobile UX

### Submit Button Redesign

Moved submit button from bottom bar to contextual display above the main button:
- Only appears when 50+ clicks accumulated AND wallet connected
- Positioned above the red button, centered
- Restyled to match red/black arcade theme (was orange)
- Added help text: "Batch 50-500 clicks per tx" with tooltip
- Moved outside UI overlay so it doesn't fade on inactivity

### Mobile Hamburger Menu

Added slide-out menu for mobile screens (≤768px):
- Replaces hidden side panels (leaderboard, mint rewards)
- Three menu items: Mint Rewards, Leaderboard, How to Play
- Animated hamburger icon transforms to X when open
- Backdrop click closes menu
- Help button hidden on mobile (consolidated into menu)

### Unified Red/Black Theme

Updated all modals to match arcade aesthetic:
- **Wallet Connect Modal**: Dark red background, red borders, SevenSegment font
- **Turnstile Modal**: Same red/black treatment
- **NFT Claim Modal**: Consistent styling with glow effects
- **Connect Wallet Button**: Changed from green to red/black theme
  - Added pulse animation for wrong-network state

### WalletConnect Improvements

Fixed WalletConnect v2 integration:
- Provider was failing to load - fixed by accessing `window['@walletconnect/ethereum-provider']`
- Added multiple wallet options to our modal:
  - MetaMask (direct browser extension)
  - Rainbow (via WalletConnect)
  - Rabby (via WalletConnect)
  - Coinbase (via WalletConnect)
  - Other Wallets (curated WalletConnect list)
- Each wallet button pre-selects that wallet in the WalletConnect modal

### Files Changed
- `public/index.html` - All UI changes

## Session: February 1, 2026 - Bug Fixes & Polish

### WalletConnect Modal Z-Index Fix

Fixed issue where game UI elements (stats displays) were showing through the WalletConnect modal.

**Solution:**
- Added CSS overrides to force WalletConnect modal elements to z-index 100000
- Increased game modals z-index from 1000 to 50000
- Targets various WalletConnect selectors: `wcm-modal`, `w3m-modal`, `[class*="wcm-"]`, etc.

### Confetti Race Condition Fix

Fixed intermittent bug where confetti wouldn't appear on first milestone celebration.

**Root Cause:** Multiple race conditions:
1. Canvas might not have dimensions on first call
2. Animation started before particles were added (setInterval delay)
3. Stale animation state not being cleared

**Solution:**
- Check and resize canvas if dimensions are 0
- Add initial burst of 20 particles immediately (not waiting for setInterval)
- Force-restart animation on each launch (cancel any existing animation frame)

### Files Changed
- `public/index.html` - Z-index fixes, confetti race condition fixes

## Session: February 2, 2026 - Security Audit & Threat Mitigation

### Comprehensive Security Assessment

Conducted thorough security audit of entire system (contracts, API, frontend) focusing on cheating and theft vectors.

### Threat Analysis Summary

| Threat | Severity | Status |
|--------|----------|--------|
| Server private key compromise | CRITICAL | Mitigated (env var, rotatable) |
| Global milestone race condition | HIGH | **FIXED** |
| API DoS via spam | MEDIUM | **FIXED** |
| Bot automation | MEDIUM | Partially mitigated (Turnstile) |
| GPU mining advantage | MEDIUM | By design (PoW is permissionless) |
| Front-running global milestones | MEDIUM | Open (inherent MEV risk) |
| Signature replay | LOW | Already mitigated in contract |
| Token pool drainage | LOW | Already protected in contract |

### Security Fixes Implemented

#### 1. Rate Limiting on Claim Signature API

**File:** `mann-dot-cool/api/clickstr-claim-signature.js`

Added sliding window rate limiting:
- 10 requests per minute per address
- Returns HTTP 429 with `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers
- Uses Redis with TTL for distributed rate limiting

```javascript
const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX_REQUESTS = 10;
```

#### 2. Atomic Locks for Global 1/1 Milestone Claims

**File:** `mann-dot-cool/api/clickstr-claim-signature.js`

Prevents race condition where two users could both get signatures for the same global 1/1 NFT:

- Uses Redis `SETNX` for atomic lock acquisition
- 30-second TTL prevents deadlocks if claim fails
- Returns 409 Conflict if another claim is in progress
- Lock released on confirmation or auto-expires

```javascript
const GLOBAL_LOCK_KEY = (tier) => `clickstr:global-lock:${tier}`;
const GLOBAL_LOCK_TTL = 30; // seconds
```

#### 3. Claim Confirmation Webhook

**API:** `POST /api/clickstr-claim-signature` with `action: 'confirm'`

New endpoint to sync Redis state after successful on-chain claim:
- Called by frontend after NFT mint transaction confirms
- Updates `nft-claimed` set to prevent duplicate signature requests
- For global milestones, also updates global registry and releases lock
- Accepts optional `txHash` for audit trail

**Frontend:** `public/index.html`

Added confirmation call after successful mint:
```javascript
await fetch('https://mann.cool/api/clickstr-claim-signature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: userAddress,
    tier: serverTier,
    action: 'confirm',
    txHash: receipt.hash
  })
});
```

Non-blocking - if confirmation fails, on-chain state is still authoritative.

### Remaining Considerations

#### Alchemy API Key Exposure

The Alchemy RPC key is exposed in the frontend HTML. Options discussed:

| Option | Recommendation |
|--------|----------------|
| Public RPC | Good for testnet, less reliable |
| Domain allowlist | Configure in Alchemy dashboard for mainnet |
| RPC proxy | More infrastructure, hides key completely |
| Vite refactor | Best long-term: env vars + code organization |

**Decision:** Defer to Vite refactor when ready for mainnet. The 5000+ line index.html would benefit from modularization anyway.

#### Front-Running Global Milestones

MEV bots could theoretically front-run global milestone transactions. This is an inherent blockchain risk. Mitigation options:
- Commit-reveal scheme (complex, worse UX)
- Private mempool submission (costs money)
- Accept as known risk (current approach)

### Files Changed
- `mann-dot-cool/api/clickstr-claim-signature.js` - Rate limiting, atomic locks, confirm endpoint
- `public/index.html` - Claim confirmation call after NFT mint

## Session: February 2, 2026 (Later) - TypeScript Refactoring

### Monolithic index.html Refactored to TypeScript

Refactored the 4,922-line `public/index.html` into a modern Vite + TypeScript project at `src-ts/`. The original file contained ~2,443 lines of CSS and ~2,130 lines of JavaScript embedded inline.

### New Project Structure

```
src-ts/
├── index.html              # Clean HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript strict mode
├── src/
│   ├── main.ts             # Application entry (~740 lines)
│   ├── types/              # TypeScript interfaces
│   │   ├── game.ts         # GameStats, MiningState, ConnectionState
│   │   ├── nft.ts          # MilestoneInfo, CollectionSlot, ClaimState
│   │   ├── api.ts          # API response types
│   │   ├── contracts.ts    # Contract ABIs (typed)
│   │   └── effects.ts      # Particle effect types
│   ├── config/             # Configuration modules
│   │   ├── network.ts      # Sepolia/Mainnet configs
│   │   ├── milestones.ts   # 55 milestone definitions
│   │   └── collection.ts   # 95 collection slots
│   ├── state/              # Reactive state management
│   │   ├── GameState.ts    # Central state with event subscriptions
│   │   └── persistence.ts  # localStorage helpers
│   ├── services/           # Business logic
│   │   ├── api.ts          # Server API + subgraph queries
│   │   ├── wallet.ts       # MetaMask/WalletConnect
│   │   ├── contracts.ts    # Smart contract interactions
│   │   └── mining.ts       # PoW mining with WebWorkers
│   ├── effects/            # Visual effects
│   │   ├── particles.ts    # 16 cursor particle effects
│   │   ├── confetti.ts     # Canvas confetti animation
│   │   ├── cursor.ts       # Custom cursor management
│   │   ├── disco.ts        # Disco overlay effect
│   │   ├── sounds.ts       # Audio preloading
│   │   └── celebrations.ts # Combined celebration effects
│   ├── styles/             # CSS organization
│   │   ├── main.css        # Import aggregator
│   │   ├── variables.css   # CSS custom properties
│   │   ├── base.css        # Reset, fonts, cursor
│   │   ├── effects.css     # Particle animations
│   │   ├── layout.css      # Game container, bars
│   │   ├── arcade.css      # DSEG7 displays
│   │   ├── buttons.css     # Arcade button styles
│   │   ├── panels.css      # Leaderboard, NFT panels
│   │   ├── modals.css      # All modal dialogs
│   │   ├── mobile-menu.css # Hamburger menu
│   │   └── responsive.css  # Media queries
│   ├── utils/              # Utility functions
│   │   └── dom.ts          # DOM helpers
│   └── workers/
│       └── miningWorker.ts # WebWorker for PoW mining
└── public/                 # Static assets
    ├── button-up.jpg
    ├── button-down.jpg
    ├── cursors/            # All cursor PNGs
    ├── sounds/             # Audio files
    ├── Fonts/              # SevenSegment font
    └── one-of-ones/        # Legendary NFT images
```

### Build Output

```
dist/index.html                 13.33 kB │ gzip:   3.49 kB
dist/assets/main-BI_MbiDr.css   43.59 kB │ gzip:   7.26 kB
dist/assets/main-Bf1vFmIm.js   317.68 kB │ gzip: 104.46 kB
```

### Key Architectural Decisions

1. **Event-Based State Management**: `GameState` class with pub/sub pattern replaces global variables
2. **Modular Services**: Wallet, API, contracts, mining all separated
3. **Type Safety**: Full TypeScript strict mode with explicit interfaces
4. **CSS Custom Properties**: Theme colors, spacing, z-index as variables
5. **Path Aliases**: `@/` prefix for clean imports

### Files Created
- `src-ts/` - Entire new TypeScript project (~50 files)
- Static assets copied from `public/` to `src-ts/public/`

### Next Steps Documented in todo.md

## Session: February 2, 2026 (Continued) - TypeScript Bug Fixes & Off-Chain Click Tracking

### Testing the TypeScript Refactor

Began manual testing of the new TypeScript build. Several issues were discovered and fixed.

### Bug Fix: Buffer Polyfill for Ethers.js

**Problem:** Console error `Cannot access "buffer.Buffer" in client code` - ethers.js v5 uses Node's `Buffer` internally, which isn't available in browsers.

**Initial Attempt (Failed):** Added manual polyfill at top of `main.ts`:
```typescript
import { Buffer } from 'buffer';
window.Buffer = Buffer;
```
This didn't work because JavaScript hoists all imports - ethers.js loaded before the polyfill was applied.

**Solution:** Installed `vite-plugin-node-polyfills` and configured in `vite.config.ts`:
```typescript
import { nodePolyfills } from 'vite-plugin-node-polyfills';

plugins: [
  nodePolyfills({
    include: ['buffer'],
    globals: { Buffer: true, global: true },
  }),
],
```

### Bug Fix: Mining Callback Not Firing

**Problem:** Button stayed pressed after mining completed - clicks never registered.

**Root Cause:** In `mining.ts`, `terminateMining()` was called which sets `onNonceFound = null` BEFORE the callback was invoked.

**Fix:** Save callback reference before terminating:
```typescript
miningWorker.onmessage = (e) => {
  if (e.data.type === 'FOUND') {
    // Save callback reference before terminateMining clears it
    const callback = onNonceFound;
    terminateMining();
    gameState.setMiningComplete();
    if (callback) callback(nonce);
  }
};
```

### Environment Variables for RPC URLs

Updated `src-ts/src/config/network.ts` to use Vite environment variables instead of hardcoded API keys:

```typescript
rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || '',
// ...
walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '',
```

Required `.env` variables:
- `VITE_SEPOLIA_RPC_URL`
- `VITE_ETH_MAINNET_RPC_URL`
- `VITE_WALLET_CONNECT_PROJECT_ID`

### Feature: Off-Chain Click Tracking (Between Seasons)

Implemented ability to submit clicks to the API even when no game is running, enabling NFT milestone progress between seasons.

#### GameState: Track Game Active Status

Added `isGameActive` boolean to `GameState`:
```typescript
private _isGameActive = false;

get isGameActive(): boolean { return this._isGameActive; }
setGameActive(active: boolean): void { ... }
```

Updated `refreshGameData()` in contracts service to check:
```typescript
const now = Math.floor(Date.now() / 1000);
const isActive = gameStats.started && !gameStats.ended && now < gameStats.gameEndTime;
gameState.setGameActive(isActive);
```

#### Split Submit Flow

Refactored `handleSubmit()` into two paths:

**When game is active:**
```typescript
async function handleOnChainSubmit(nonces) {
  // 1. Submit to blockchain
  // 2. Wait for confirmation
  // 3. Record to API
  // 4. Track on-chain submission
}
```

**When game is inactive:**
```typescript
async function handleOffChainSubmit(nonces) {
  // 1. Send nonces to API as proof-of-work
  // 2. API validates nonces server-side
  // 3. Clicks count toward NFT milestones
}
```

#### API: Proof-of-Work Nonce Verification

Updated `mann-dot-cool/api/clickstr.js` to validate nonces server-side:

**New imports:**
```javascript
import { keccak256, encodePacked } from 'viem';
```

**New constants:**
```javascript
const POW_CHAIN_ID = 11155111; // Sepolia
const POW_DIFFICULTY_TARGET = BigInt('0x7fff...'); // Max difficulty
```

**Nonce verification function:**
```javascript
function verifyNonce(address, nonceStr, epoch = 0) {
  const packed = encodePacked(
    ['address', 'uint256', 'uint256', 'uint256'],
    [address, nonce, BigInt(epoch), BigInt(POW_CHAIN_ID)]
  );
  const hash = keccak256(packed);
  return BigInt(hash) < POW_DIFFICULTY_TARGET;
}
```

**POST handler changes:**
- If `nonces` array provided, verify each as proof-of-work
- Valid nonces bypass Turnstile (PoW is proof of work)
- Only count valid nonces as clicks
- Response includes `verifiedByPoW: true/false`

#### Frontend Changes

**Submit button visibility:** Shows when user has 50+ clicks (regardless of game status)

**API service:** `recordClicksToServer()` now accepts optional nonces array:
```typescript
export async function recordClicksToServer(
  address: string,
  clicks: number,
  turnstileToken?: string | null,
  nonces?: string[]  // NEW: PoW validation
)
```

#### Server Stats for Total Clicks

Updated `GameState.setServerStats()` to use server's `totalClicks` for the "Your Total Clicks" display:
```typescript
if (stats.totalClicks !== undefined) {
  this._allTimeClicks = stats.totalClicks;
}
```

This ensures frontend clicks (even between seasons) are reflected in the UI for NFT milestone tracking.

### Files Changed

**Frontend (`src-ts/`):**
- `vite.config.ts` - Buffer polyfill plugin
- `src/config/network.ts` - Environment variables for RPC
- `src/services/mining.ts` - Callback race condition fix
- `src/services/api.ts` - Nonces parameter for PoW validation
- `src/state/GameState.ts` - `isGameActive` flag, server stats for total clicks
- `src/main.ts` - Split submit flow (on-chain vs off-chain)

**API (`mann-dot-cool/api/`):**
- `clickstr.js` - Nonce verification with viem's keccak256

### Summary

The TypeScript refactor is now fully functional:
- ✅ Wallet connection works
- ✅ Mining finds valid nonces
- ✅ Button state updates correctly
- ✅ Environment variables for sensitive config
- ✅ Off-chain submissions work when game is inactive
- ✅ Server-side PoW verification prevents spoofing

## Session: February 2, 2026 (Evening) - Off-Chain Mining Fix & NFT Panel Restoration

### Bug Fix: Off-Chain Mining Epoch/Difficulty Mismatch

**Problem:** 403 error when submitting clicks during off-chain mode (no active game).

**Root Cause:** Mismatch between frontend miner and server verification:
- Miner was using `gameState.currentEpoch` (e.g., 12) and contract difficulty
- Server was verifying with `epoch || 0` and max difficulty target

Since epoch is part of the packed hash data, the hashes didn't match and all nonces failed verification.

**Fix:** In `src-ts/src/services/mining.ts`, when game is inactive:
- Use epoch 0 (matches server)
- Use max difficulty target (fast mining, no competition anyway)

```typescript
const MAX_DIFFICULTY_TARGET = BigInt('0x7fff...');

const isGameActive = gameState.isGameActive;
const miningEpoch = isGameActive ? gameState.currentEpoch : 0;
const miningDifficulty = isGameActive ? gameState.difficultyTarget : MAX_DIFFICULTY_TARGET;
```

**Rationale:** Between seasons, players are just clicking for NFT milestones - no token competition, so no reason for hard difficulty.

### Feature: NFT Panel & Collection Modal Restored

The TypeScript refactor was missing several NFT-related features from the original monolithic HTML. Re-implemented:

#### NFT Panel Rendering

Added `renderNftPanel(stats)` function that:
- Collects unlocked milestones and achievements from server stats
- Checks on-chain claim status for each via `checkNftClaimed()`
- Tracks claimed NFTs in `claimedOnChain: Set<number>`
- Sorts unclaimed first, then by tier
- Renders clickable list items with cursor/1/1 images
- Click opens claim modal

#### Collection Modal

Added `showCollectionModal()` with:
- `renderTrophySection()` - Shows owned global 1/1s with arcade game art
- `renderCollectionGrid()` - All 95 collection slots, locked or unlocked
- Click handler to equip cursor on owned items

#### Claim Modal Handlers

Added `handleClaimNft()` flow:
1. Get signature from server via `getClaimSignature()`
2. Call contract `claimNft(tier, signature)`
3. Confirm with server via `confirmClaim()`
4. Update `claimedOnChain` set
5. Refresh NFT panel

#### Cursor System Integration

Connected collection grid to actual cursor effects:
- Import `applyCursor`, `resetCursor`, `getEquippedCursorName` from effects
- Clicking a cursor in collection calls `applyCursor()` (not just localStorage)
- `applyCursor()` updates cursor image, shows element, sets particle effects
- Reset button calls `resetCursor()`

### Redis Data Reset

Discovered discrepancy: `globalClicks` (1043) vs user `totalClicks` (147) when user was the only player. Extra clicks were from development/testing.

Reset all Redis data for fresh start:
- `clickstr:clicks:{address}` - User stats hash
- `clickstr:milestones:{address}` - Unlocked milestones set
- `clickstr:achievements:{address}` - Unlocked achievements set
- `clickstr:streak:{address}` - Streak data hash
- `clickstr:leaderboard` - Sorted set entry
- `clickstr:global-clicks` - Reset to 0
- `clickstr:global-milestones` - Global 1/1 winners

### Files Changed

**Frontend (`src-ts/src/`):**
- `main.ts` - NFT panel rendering, collection modal, claim handlers, cursor integration
- `services/mining.ts` - Off-chain epoch 0 / max difficulty fix

### Imports Added to main.ts

```typescript
// From config
import { MILESTONE_ID_TO_TIER, COLLECTION_SLOTS, GLOBAL_ONE_OF_ONE_TIERS } from './config/index.ts';

// From services
import { checkNftClaimed, claimNft, getClaimSignature, confirmClaim } from './services/index.ts';

// From effects
import { applyCursor, resetCursor, getEquippedCursorName } from './effects/index.ts';
```

### New State Variables

```typescript
let claimedOnChain: Set<number> = new Set();
let serverStats: ServerStatsResponse | null = null;
```

### Build Output

```
dist/assets/main-Ct2C6s4g.js   355.16 kB │ gzip: 114.47 kB
```

## Session: February 2, 2026 (Night) - Global Stats Panel & Leaderboard Overhaul

### New Feature: Global Activity Panel

Added a new panel in the bottom-right corner showing real-time global activity:

**Display Elements:**
- **All-Time Clicks** - Total frontend clicks across all games (from Redis API)
- **Clicking Now** - Split into "X humans" (green) and "Y bots" (cyan)

**Implementation:**
- Humans tracked via heartbeat system (30-second interval while connected)
- Bots detected by querying subgraph for unique addresses with recent on-chain submissions
- Updates every 30 seconds

### Heartbeat System for Active Users

**Frontend (`src-ts/src/main.ts`):**
- `startHeartbeat()` - Sends POST to API every 30 seconds when wallet connected
- `stopHeartbeat()` - Clears interval on disconnect

**API (`mann-dot-cool/api/clickstr.js`):**
- Added sorted set `clickstr:active-users` (score = timestamp)
- POST handler: `{ address, heartbeat: true }` adds user to set
- GET handler: `?activeUsers=true` counts users with score within 60-second window

**Optimized for Redis reads:**
- Originally used SCAN to find heartbeat keys → caused ~1M reads
- Refactored to use sorted set with ZCOUNT (O(log N) operation)
- Cleanup via ZREMRANGEBYSCORE on heartbeat POST (not on query)

### Game Status Indicator

Added "Game" status box to left info panel:
- Shows "ACTIVE" (green glow) when game is running
- Shows "INACTIVE" (red glow, dimmed) when no game
- Epoch and Pool show "0 / 0" and "0" when inactive
- Help tooltip (?) explains: "When a game is active, every click earns $CLICKSTR tokens. When there's no game, you can still click to earn NFT rewards."

### Leaderboard Toggle: Global vs Current Game

**New Architecture:**
- **Global Leaderboard** = All-time frontend clicks from Redis (humans across all games)
- **Per-Game Leaderboard** = On-chain clicks from that game's subgraph only

**New Config (`src-ts/src/config/games.ts`):**
```typescript
export interface GameConfig {
  id: string;
  name: string;
  subgraphUrl: string;
  contractAddress: string;
  startDate?: string;
  endDate?: string | null;
  isActive: boolean;
  isBeta: boolean;
}

export const GAMES: GameConfig[] = [
  {
    id: 'beta-1',
    name: 'Beta Game 1',
    subgraphUrl: 'https://api.goldsky.com/.../clickstr-sepolia/1.0.2/gn',
    contractAddress: '0x6dD800B88FEecbE7DaBb109884298590E5BbBf20',
    isActive: true,
    isBeta: true,
  },
];
```

**UI Changes:**
- Leaderboard panel header now has toggle buttons: "Global" | "Beta Game 1"
- Global mode shows frontend clicks (all humans)
- Game mode shows on-chain clicks (from current game's subgraph)

**API Functions Added (`src-ts/src/services/api.ts`):**
- `fetchGlobalLeaderboard(limit)` - Redis API only
- `fetchGameLeaderboard(subgraphUrl, limit)` - Subgraph query with name lookup from Redis

### Panel Layout Adjustments

Moved panels to accommodate new Global Activity section:
- Leaderboard: `top: 50% - 220px` (was 180px)
- NFT Panel: `top: 50% + 140px` (was 220px)
- Global Activity: `bottom: 30px; right: 30px`
- Left Info Panel: `bottom: 30px` (was 100px) to align with Global Activity
- Game status box added at top of left info panel

### Files Changed

**Frontend (`src-ts/`):**
- `index.html` - Global Activity panel, leaderboard toggle buttons, game status box
- `src/main.ts` - Heartbeat system, global stats updates, leaderboard mode toggle
- `src/config/games.ts` - NEW: Games/seasons configuration
- `src/config/index.ts` - Export games config
- `src/services/api.ts` - `fetchGlobalLeaderboard()`, `fetchGameLeaderboard()`, `sendHeartbeat()`, `fetchActiveUsers()`, `fetchRecentBotActivity()`
- `src/services/index.ts` - Export new API functions
- `src/types/api.ts` - `ActiveUsersResponse`, `HeartbeatResponse` types
- `src/types/index.ts` - Export new types
- `src/styles/layout.css` - Game status styles, help tooltip, left panel positioning
- `src/styles/panels.css` - Leaderboard toggle buttons, Global Activity panel styles
- `src/styles/responsive.css` - Hide Global Activity panel on mobile

**API (`mann-dot-cool/api/`):**
- `clickstr.js` - Heartbeat POST handler, active users GET handler, sorted set for efficient counting

## Session: February 2, 2026 (Late Night) - Rankings Modal Tabs & Total Clicks Fix

### Feature: Rankings Modal with Game Tabs

Updated the "See All Rankings" modal to support tabs for Global and each game:

**UI Changes:**
- Added `.rankings-tabs` container below the modal header
- Tab buttons: "Global" + one for each game from `GAMES` config
- Tabs are dynamically rendered based on `getAllGames()`
- Clicking a tab loads rankings from the appropriate data source

**New Functions in `main.ts`:**
- `showRankingsModal()` - Renders tabs and loads initial data
- `renderRankingsTabs()` - Dynamically generates tab buttons from games config
- `setRankingsTab(tabId)` - Handles tab switching and updates active state
- `loadRankingsForTab(tabId)` - Fetches data (global from Redis, game from subgraph)
- `renderRankingsList(data)` - Renders the leaderboard entries with icons/indicators

**Data Sources:**
- **Global tab**: `fetchGlobalLeaderboard(50)` - All-time frontend clicks from Redis API
- **Game tabs**: `fetchGameLeaderboard(subgraphUrl, 50)` - On-chain clicks from that game's subgraph

**Styling (`panels.css`):**
```css
.rankings-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-red-950);
}

.rankings-tab {
  background: transparent;
  border: 1px solid var(--color-red-800);
  padding: 8px 14px;
  font-size: 11px;
  text-transform: uppercase;
}

.rankings-tab.active {
  background: var(--color-red-950);
  border-color: var(--color-red-600);
  text-shadow: var(--glow-red-sm);
}
```

### Bug Fix: "Your Total Clicks" Data Source

**Problem:** "Your Total Clicks" display was sometimes showing on-chain value (807) instead of API value (0 after reset).

**Root Cause:** Two different functions were setting `allTimeClicks`:
1. `setServerStats()` - from API (correct)
2. `setUserStats()` called by `refreshUserStats()` - from contract (incorrect)

The `refreshUserStats()` function was called after `setServerStats()`, overwriting the API value with the contract value.

**Fix:**
1. Added new `setTotalEarned(earned)` method in `GameState` that only updates token earnings
2. Modified `refreshUserStats()` in `contracts.ts` to use `setTotalEarned()` instead of `setUserStats()`
3. Now `allTimeClicks` is ONLY set from `setServerStats()` (API data)

**GameState change:**
```typescript
/** Update only total earned (from contract) - doesn't touch allTimeClicks */
setTotalEarned(earned: number): void {
  this._totalEarned = earned;
  this.emit('statsChanged');
}
```

**contracts.ts change:**
```typescript
export async function refreshUserStats(): Promise<void> {
  // ...
  const earned = parseFloat(ethers.utils.formatEther(stats.totalEarned.toString()));
  // Only update earned tokens from contract - allTimeClicks comes from API
  gameState.setTotalEarned(earned);
}
```

### Files Changed

**Frontend (`src-ts/`):**
- `index.html` - Added `.rankings-tabs` container to rankings modal
- `src/main.ts` - Added rankings modal tab functions, new state variables
- `src/config/index.ts` - Added `getAllGames` export (already existed in games.ts)
- `src/state/gameState.ts` - Added `setTotalEarned()` method
- `src/services/contracts.ts` - Changed to use `setTotalEarned()` instead of `setUserStats()`
- `src/styles/panels.css` - Added `.rankings-tabs` and `.rankings-tab` styles

### Build Output

```
dist/assets/main-Bw6W7-MR.js   358.92 kB │ gzip: 115.51 kB
```

### Summary

Both remaining TODOs from the previous session are now complete:
- ✅ Rankings modal shows tabs for Global + each past game
- ✅ "Your Total Clicks" consistently reads from API only

## Session: February 2, 2026 (Afternoon) - Project Rename: StupidClicker → Clickstr

### Complete Project Rename

Renamed all instances of "StupidClicker" to "Clickstr" across both repositories (game repo and mann-dot-cool API).

### Scope of Changes

| Category | Count |
|----------|-------|
| `StupidClicker` (PascalCase) | ~139 occurrences |
| `stupid-clicker` (kebab-case) | ~132 occurrences |
| `STUPID_CLICKER` (SCREAMING_SNAKE) | ~16 occurrences |
| Files renamed | 10 files |
| **Total text replacements** | ~287 |

### Files Renamed

**Game Repo:**
- `contracts/StupidClicker.sol` → `Clickstr.sol`
- `contracts/StupidClickerNFT.sol` → `ClickstrNFT.sol`
- `test/StupidClicker.test.js` → `Clickstr.test.js`
- `test/StupidClickerNFT.test.js` → `ClickstrNFT.test.js`
- `subgraph/abis/StupidClicker.json` → `Clickstr.json`
- `frontend/StupidClicker.jsx` → `Clickstr.jsx`

**Mann-dot-cool:**
- `api/stupid-clicker.js` → `clickstr.js`
- `api/stupid-clicker-claim-signature.js` → `clickstr-claim-signature.js`
- `api/stupid-clicker-eligible.js` → `clickstr-eligible.js`
- `api/stupid-clicker-admin-reset.js` → `clickstr-admin-reset.js`

### Rename Script

Created `scripts/rename-to-clickstr.sh` that:
1. Renames files in both repos
2. Replaces text content (PascalCase, kebab-case, SCREAMING_SNAKE)
3. Cleans up build artifacts (artifacts/, cache/, subgraph/generated/, subgraph/build/)

### Subgraph Migration

**Old subgraphs (deleted):**
- `stupid-clicker-sepolia/1.0.0`
- `stupid-clicker-sepolia/1.0.1`
- `stupid-clicker-sepolia/1.0.2`

**New subgraph:**
- Name: `clickstr-sepolia/1.0.0`
- URL: `https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.0/gn`
- Status: Healthy, 100% synced

### Redis Key Migration

Redis keys updated from `stupid-clicker:*` prefix to `clickstr:*`:
- `clickstr:clicks:{address}`
- `clickstr:leaderboard`
- `clickstr:milestones:{address}`
- `clickstr:achievements:{address}`
- `clickstr:global-clicks`
- `clickstr:global-milestones`
- `clickstr:active-users`
- etc.

Old `stupid-clicker:*` keys left orphaned (harmless, can be deleted from Upstash console).

### Vercel Environment Variable

Renamed: `STUPID_CLICKER_ADMIN_SECRET` → `CLICKSTR_ADMIN_SECRET`

### API Endpoints

New endpoints (after mann-dot-cool deployment):
- `https://mann.cool/api/clickstr`
- `https://mann.cool/api/clickstr-claim-signature`
- `https://mann.cool/api/clickstr-eligible`
- `https://mann.cool/api/clickstr-admin-reset`

### Verification

| Check | Status |
|-------|--------|
| Contracts compile | ✅ 32 Solidity files |
| All tests pass | ✅ 78 tests |
| TypeScript builds | ✅ 358KB JS bundle |
| Subgraph codegen | ✅ |
| Subgraph deployed | ✅ |
| No remaining "StupidClicker" references | ✅ |

### Files Updated with New Subgraph URL

- `src-ts/src/config/network.ts`
- `src-ts/src/config/games.ts`
- `public/index.html`
- `docs/README.md`
- `docs/technical-architecture.md`
- `docs/contract-reference.md`
- `docs/deployment-status.md`

---

## Session: February 2, 2026 (Late Night) - V5 Final Test Deployment

### Overview

Deployed fresh v5 contracts to Sepolia for final pre-mainnet test. This is a complete deployment with new token, main contract, and NFT contract all wired together with NFT tier bonuses enabled.

### Deployment Details

**Game Parameters:**
- Duration: 24 hours (Feb 2 18:08 UTC → Feb 3 18:08 UTC)
- Epochs: 12 × 2 hours each
- Pool: 1M CLICK tokens
- NFT Bonuses: Enabled

**Contract Addresses (v5):**
| Contract | Address |
|----------|---------|
| MockClickToken | `0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4` |
| ClickstrNFT | `0x39B41525ba423FcAbE23564ecCCdEa66e7D59551` |
| Clickstr | `0xA16d45e4D186B9678020720BD1e743872a6e9bA0` |

**NFT Contract Details:**
- Signer: `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- BaseURI: `ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/`
- Owner: `0xAd9fDaD276AB1A430fD03177A07350CD7C61E897`

**NFT Tier Bonuses:**
- Tier 4 (1K clicks): +2%
- Tier 6 (10K clicks): +3%
- Tier 8 (50K clicks): +5%
- Tier 9 (100K clicks): +7%
- Tier 11 (500K clicks): +10%
- Max possible bonus: 27%

**Subgraph:**
- Version: `clickstr-sepolia/1.0.3`
- URL: `https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.3/gn`
- Start block: 10177493

### Deployment Process

1. **Deploy NFT Contract:**
   ```bash
   NFT_SIGNER_ADDRESS=0xf55E4fac663ad8db80284620F97D95391ab002EF \
   npx hardhat run scripts/deploy-nft.js --network sepolia
   ```

2. **Deploy Game Contracts:**
   ```bash
   SEASON_EPOCHS=12 SEASON_DURATION=7200 SEASON_POOL=1000000 \
   NFT_CONTRACT=0x39B41525ba423FcAbE23564ecCCdEa66e7D59551 \
   npx hardhat run scripts/deploy-sepolia.js --network sepolia
   ```

3. **Update & Deploy Subgraph:**
   - Updated `subgraph/subgraph.yaml` with new contract address and start block
   - `npm run codegen && npm run build`
   - `goldsky subgraph deploy clickstr-sepolia/1.0.3 --path .`

4. **Update Frontend Config:**
   - `src-ts/src/config/network.ts` - Contract addresses
   - `src-ts/src/config/games.ts` - Added Beta Game 2, archived Beta Game 1

5. **Update Vercel Environment:**
   - mann.cool: `NFT_CONTRACT_ADDRESS=0x39B41525ba423FcAbE23564ecCCdEa66e7D59551`

### Bug Fixes

**Fix: .env RPC URL Variable**

Hardhat was looking for `SEPOLIA_RPC_URL` but .env only had `VITE_SEPOLIA_RPC_URL`. Added both:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
```

VITE_ prefix is for frontend (Vite injects at build time), non-VITE for Hardhat/scripts.

**Fix: Vite Output Directory**

Build was outputting to `../dist` (repo root) but Vercel expected `dist` inside `src-ts/`. Changed `vite.config.ts`:
```typescript
outDir: 'dist',  // was '../dist'
```

**Fix: Pool Display "M" Showing as "n"**

Seven-segment font (DSEG7) doesn't support uppercase letters. "M" was rendering as lowercase "n".

Solution: Split the value and suffix into separate elements:
- Number uses seven-segment font
- Suffix (M, K) uses regular label font

```html
<span id="pool-info">1.00</span><span class="info-suffix" id="pool-suffix">M</span>
```

New utility function:
```typescript
export function formatTokensSplit(amount: number): { value: string; suffix: string }
```

**Fix: Help Icon Too Dim**

Made the "?" help icon next to Game status more visible:
- Increased size: 14px → 16px
- Added glow effect: `box-shadow: 0 0 8px rgba(255, 0, 0, 0.4)`
- Brighter border: `var(--color-red-400)`
- Removed opacity reduction

### Vercel Build Configuration

For `clickstr.fun` Vercel project:
- **Root Directory:** `src-ts` (not `./src-ts`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Environment variables needed:
- `VITE_SEPOLIA_RPC_URL`
- `VITE_WALLET_CONNECT_PROJECT_ID`

### Games Config Update

Added Beta Game 2 and archived Beta Game 1:
```typescript
export const GAMES: GameConfig[] = [
  {
    id: 'beta-1',
    name: 'Beta Game 1',
    contractAddress: '0x6dD800B88FEecbE7DaBb109884298590E5BbBf20',
    isActive: false,  // Archived
    endDate: '2025-01-31',
  },
  {
    id: 'beta-2',
    name: 'Beta Game 2',
    contractAddress: '0xA16d45e4D186B9678020720BD1e743872a6e9bA0',
    isActive: true,
    startDate: '2026-02-02',
  },
];
```

### Files Changed

**Configuration:**
- `.env` - Added `SEPOLIA_RPC_URL`, `ETH_MAINNET_RPC_URL`
- `src-ts/vite.config.ts` - Fixed output directory
- `src-ts/src/config/network.ts` - v5 contract addresses
- `src-ts/src/config/games.ts` - Beta Game 2 entry
- `subgraph/subgraph.yaml` - v5 contract address, start block

**Frontend:**
- `src-ts/index.html` - Split pool value/suffix elements
- `src-ts/src/main.ts` - `formatTokensSplit` for pool display
- `src-ts/src/utils/formatting.ts` - New `formatTokensSplit` function
- `src-ts/src/utils/index.ts` - Export new function
- `src-ts/src/styles/layout.css` - `.info-suffix` style, brighter help icon

**Deployment Info:**
- `sepolia/deployment.json` - v5 deployment details
- `sepolia/nft-deployment.json` - v5 NFT contract

**Documentation:**
- `docs/deployment-status.md` - Updated to v5

### Summary

This is the final test deployment before mainnet. Everything is wired up:
- ✅ New token contract (1M pool)
- ✅ New game contract with NFT bonuses
- ✅ New NFT contract with IPFS metadata
- ✅ Subgraph indexing
- ✅ Frontend pointing to new contracts
- ✅ API configured with new NFT address
- ✅ UI fixes (pool display, help icon)

## Session: February 2, 2026 (Late Night) - API Click Recording Bug + Turnstile Restoration

### Bug Fix: API Clicks Not Recording During On-Chain Submissions

**Symptoms:** After clicking 50 times and submitting on-chain:
- ✅ Total earned (tokens) updated - from contract
- ✅ Beta Game 2 leaderboard updated - from subgraph
- ❌ "Your Total Clicks" stayed at 0 - from Redis API
- ❌ Global leaderboard not updating - from Redis API
- ❌ Global activity total clicks not updating - from Redis API

**Root Cause:** In `handleOnChainSubmit()`, we were calling `recordClicksToServer()` **without passing nonces**:

```typescript
// OLD CODE - broken
const result = await recordClicksToServer(
  gameState.userAddress!,
  clicksToRecord,
  turnstileToken  // No nonces passed!
);
```

The API requires EITHER:
1. Valid Turnstile token (human verification)
2. Valid PoW nonces (proof-of-work verification)

Since we weren't passing nonces and `turnstileToken` was likely null/expired, the API returned 403 `requiresVerification`. The code checked `if (result.success)` which was false, so it silently did nothing - clicks never recorded to Redis.

Meanwhile, `recordOnChainSubmission()` worked but only updates a separate `onChainClicks` counter - NOT `totalClicks` which powers the displays.

**Fix:** Pass nonces AND epoch to `recordClicksToServer()`:

```typescript
// NEW CODE - fixed
const result = await recordClicksToServer(
  gameState.userAddress!,
  clicksToRecord,
  turnstileToken,
  nonces.slice(0, clicksToRecord).map(n => n.toString()),
  gameState.currentEpoch  // Epoch needed for correct hash verification
);
```

**Why epoch matters:** The PoW nonce hash includes the epoch in its packed data:
```
keccak256(abi.encodePacked(address, nonce, epoch, chainId))
```

If we don't pass the epoch, the API verifies with `epoch || 0`, producing a different hash, and all nonces fail verification.

### Bug Fix: Turnstile Verification Missing from TypeScript Refactor

**Problem:** The Turnstile modal HTML existed in `index.html`, but **no code in main.ts** to show it or handle verification. The refactor completely dropped this functionality.

**What was missing:**
- `turnstileModal` element reference
- `turnstileWidgetId` state variable
- `showTurnstileModal()` function to render Cloudflare widget
- `onTurnstileSuccess()` callback to capture token and retry submit
- Handling `requiresVerification` response in submit flows

**Fix:** Added complete Turnstile implementation to `main.ts`:

```typescript
// Element reference
let turnstileModal: HTMLElement;
let turnstileWidgetId: string | null = null;

// Type declaration for Cloudflare's global
declare const turnstile: {
  render: (selector: string, options: {...}) => string;
  reset: (widgetId: string) => void;
};

// Show modal and render widget
function showTurnstileModal(): void {
  showModal(turnstileModal);
  if (!turnstileWidgetId && typeof turnstile !== 'undefined') {
    turnstileWidgetId = turnstile.render('#turnstile-widget', {
      sitekey: CONFIG.turnstileSiteKey,
      callback: onTurnstileSuccess,
      'expired-callback': () => { turnstileToken = null; },
      theme: 'dark'
    });
  } else if (turnstileWidgetId) {
    turnstile.reset(turnstileWidgetId);
  }
}

// Callback when user passes verification
function onTurnstileSuccess(token: string): void {
  turnstileToken = token;
  hideModal(turnstileModal);
  // Auto-retry pending submit
  if (gameState.serverClicksPending > 0 && gameState.pendingNonces.length > 0) {
    handleSubmit(new Event('click'));
  }
}
```

Updated `handleOffChainSubmit()` to show Turnstile when needed:

```typescript
} else if (result.requiresVerification) {
  showTurnstileModal();
  submitBtn.disabled = false;
  updateSubmitButton();
}
```

### How the Two Submit Flows Work Now

**On-Chain Flow (game active):**
1. Mine clicks with contract's epoch + difficulty
2. Submit nonces to blockchain → tokens distributed, subgraph updated
3. Call API with same nonces + epoch → PoW verified → Redis `totalClicks` updated
4. Turnstile bypassed because blockchain submission IS the proof

**Off-Chain Flow (no game running):**
1. Mine clicks with epoch 0 + max difficulty (fast, no competition)
2. Call API with nonces → PoW verified → Redis updated
3. If API returns 403 `requiresVerification` → show Turnstile modal
4. After user passes → token captured → auto-retry submit

### Files Changed

**Frontend (`src-ts/src/`):**
- `main.ts`:
  - Added `turnstileModal` element reference
  - Added `turnstileWidgetId` state variable
  - Added `showTurnstileModal()` function
  - Added `onTurnstileSuccess()` callback
  - Updated `handleOnChainSubmit()` to pass nonces + epoch
  - Updated `handleOffChainSubmit()` to show Turnstile on 403
- `services/api.ts`:
  - Added `epoch` parameter to `recordClicksToServer()`

### API Endpoint Reference

The API (`mann.cool/api/clickstr`) has these verification paths:

| Verification Method | When Used | Bypasses Turnstile? |
|---------------------|-----------|---------------------|
| Turnstile token | Manual verification | N/A |
| PoW nonces | Off-chain or on-chain submit | Yes |
| On-chain tx hash | `recordOnChainSubmission()` | Yes (separate endpoint) |

### Build & Deploy

```bash
npm run build  # Success
git push       # Vercel auto-deploys
```

### Summary

Two bugs fixed:
1. ✅ On-chain submissions now properly record to Redis API (via PoW nonces)
2. ✅ Turnstile verification restored for off-chain submissions

The key insight: During on-chain mode, we already have valid PoW nonces (the blockchain verified them). By passing those same nonces to the API, it can verify PoW and bypass Turnstile - no need for separate human verification since the blockchain submission is proof of legitimate activity.

---

## Session: 2025-02-02 - UI Redesign + Turnstile + Milestone Fixes

### Summary

Major session covering UI layout improvements, Turnstile enforcement for NFT protection, and critical milestone definition sync between API files.

### UI Layout Changes

**Panel Positioning:**
- Leaderboard moved to **left side**, pinned at `top: 100px`, expands downward
- Mint Rewards (NFT panel) moved to **right side**, pinned at `top: 100px`, expands downward
- Combined Game/Epoch/Pool with Global Activity into single **Game Status Panel** at bottom-left

**Game Status Panel Structure:**
```
┌─────────────────────────────────┐
│   GAME      EPOCH      POOL     │  <- horizontal header row
│  ACTIVE     1/12     99990K     │
├─────────────────────────────────┤
│ All-Time Clicks           370   │
│─────────────────────────────────│
│ Clicking Now    1 humans  0 bots│
└─────────────────────────────────┘
```

**Files Changed:**
- `index.html`: Restructured to combine `#center-info` into `#game-status-panel`
- `styles/panels.css`: New `#game-status-panel` styles, removed old `#global-stats-panel`
- `styles/layout.css`: Updated pointer-events, removed old `#center-info` styles
- `styles/responsive.css`: Updated media queries for new panel structure

**Other UI Fixes:**
- Custom cursor overlay offset: Changed from `translate(-50%, -50%)` to `translate(-25%, -10%)` so fingertip aligns with click point
- Game status tooltip: Now appears **above** the panel (`bottom: calc(100% + 8px)`)
- Submit button tooltip: Now appears **above** the help icon
- Font path fix: Changed `url('Fonts/Seven Segment.ttf')` to `url('/Fonts/Seven Segment.ttf')` to prevent Vite mangling

### Turnstile Enforcement for NFT Protection

**Problem:** PoW nonces were bypassing Turnstile verification, allowing bots to earn NFT milestones.

**Solution:** Require Turnstile verification **before** any submission. PoW proves work was done, Turnstile proves human is present - both required for NFT milestone progress.

**Changes to `main.ts`:**
```javascript
async function handleSubmit(e: Event): Promise<void> {
  // ...

  // Require Turnstile verification before any submission
  if (!turnstileToken) {
    showTurnstileModal();
    return;
  }

  // ... proceed with on-chain or off-chain submit
}
```

- Token kept for session (not cleared after each submit)
- Server can still force re-verification via `requiresVerification` response

### Milestone Definition Sync (Critical Bug Fix)

**Problem:** Many NFT milestones weren't triggering because `clickstr.js` (which triggers milestones) had an outdated/minimal set, while `claim-signature.js` (which validates claims) had a different set. Neither matched the full `milestones-v2.csv`.

**Root Cause:**
- `clickstr.js` only had 9 global milestones and 6 hidden achievements
- `claim-signature.js` had different tier numbers
- When user triggered global #666, it got tier 222 but claim-signature didn't recognize it

**Solution:** Updated both API files in `mann-dot-cool` repo to have complete, matching milestone definitions:

**GLOBAL_MILESTONES (1/1 NFTs) - tier 200-349:**
- Main: 1, 10, 100, 1000, 10000, 100000, 1M, 10M, 100M, 1B
- Meme: 42, 69, 420, 666, 777, 1337, 42069, 69420, 8008135, 8675309
- Repeated digits: 111, 1111, 7777, 77777, 888, 8888, 999, 9999, etc.
- Palindromes: 101, 1001, 10001, 12321, 123321, 1234321
- Mathematical: 137, 314, 1618, 2718, 3141, 31415, 314159
- Powers of 2: 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536
- Cultural: 404, 500, 747, 911, 1984, 2001, 2012, 3000, 525600

**HIDDEN_ACHIEVEMENTS (Personal editions) - tier 500-609:**
- Same categories as global but for personal click counts
- Triggers when user's personal click count passes through the number

**Files Changed (mann-dot-cool repo):**
- `api/clickstr.js`: Added ~70 global milestones, ~60 hidden achievements
- `api/clickstr-claim-signature.js`: Synced `MILESTONE_TO_TIER` and `TIER_INFO` mappings

### Commits

**stupid-clicker repo:**
- `0f54462` - Move leaderboard to left side, mint rewards to right
- `62bd8d6` - Move global activity + game info to left side
- `588335a` - Fix panel positioning - pin to top, expand downward
- `e0ea619` - Require Turnstile verification for all submissions
- `f5b9c1b` - Combine Game/Epoch/Pool with Global Activity into single panel
- `ef22065` - Fix cursor offset and tooltip positioning
- `835e452` - Adjust cursor overlay offset more to the left
- `02bb569` - Move submit button tooltip higher above the help icon
- `c33f1f8` - Fix font path for Seven Segment.ttf

**mann-dot-cool repo:**
- `c05fb5a` - Add all missing milestones to clickstr.js API
- `edc6a2c` - Update claim-signature.js with all milestone tiers

### Key Learnings

1. **Milestone definitions must be synced** across `clickstr.js` (triggers) and `claim-signature.js` (validates) - they use different data structures but must have matching tier numbers

2. **Turnstile + PoW = defense in depth** - PoW prevents trivial spam, Turnstile ensures human presence for NFT rewards

3. **Vite asset paths** - Use absolute paths (`/Fonts/...`) for public assets to prevent Vite from processing them into `assets/` folder

4. **CSS `transform` for cursor offset** - The translate percentages are relative to the element's own dimensions, not the mouse position

---

## Session: 2025-02-02 (Continued) - NFT System Audit & Sync Feature

### Problem Discovery

User reported that some hidden achievements weren't triggering:
- "Day One OG" (tier 104) and "First Timer" (tier 1) worked ✓
- "Meaning of Everything" (tier 608 - personal click #42) did NOT work ✗
- Other achievements like 666, 777 worked, but 42, 101, 314 didn't

### Root Cause Analysis

Traced through entire NFT system from CSV → API → Frontend:

1. **CSV is source of truth** (`milestones-v2.csv`) with 98 tiers
2. **API had extra tiers** that didn't exist in CSV (hallucinated tiers 240-349)
3. **Frontend had incomplete mappings** for many tiers
4. **collection.ts had wrong globalClick values** for tiers 225-229
5. **Achievement trigger logic issue** - only checked "pass-through" not "already passed"

### Fixes Applied

#### 1. Frontend Milestone Configs Synced with CSV

**Files changed:**
- `src-ts/src/config/collection.ts` - Fixed GLOBAL_ONE_OF_ONE_TIERS tiers 225-229
- `src-ts/src/config/milestones.ts` - Completed MILESTONE_INFO with all 98 tiers
- `src-ts/src/config/milestones.ts` - Completed MILESTONE_ID_TO_TIER with all IDs
- `src-ts/src/types/nft.ts` - Updated MilestoneId type with all IDs

**collection.ts fixes (tiers 225-229):**
| Tier | Was | Now |
|------|-----|-----|
| 225 | globalClick: 8008 | globalClick: 42069 |
| 226 | globalClick: 42069 | globalClick: 69420 |
| 227 | globalClick: 69420 | globalClick: 8008135 |
| 228 | globalClick: 420420 | globalClick: 8675309 |
| 229 | globalClick: 696969 | globalClick: 42 |

#### 2. API Cleaned to Match CSV (Removed Hallucinated Tiers)

**Files changed:**
- `mann-dot-cool/api/clickstr.js` - Removed tiers 240-349 from GLOBAL_MILESTONES
- `mann-dot-cool/api/clickstr-claim-signature.js` - Synced MILESTONE_TO_TIER and TIER_INFO

**Before:** API had ~70 global milestones (many invented)
**After:** API has exactly 24 global milestones matching CSV (200-213 + 220-229)

**Tier counts verified:**
- CSV: 98 tiers
- clickstr.js: 98 tiers
- clickstr-claim-signature.js: 98 tiers

#### 3. Achievement Trigger Logic Fixed

**Problem:** The "pass-through" check only triggered if you crossed the threshold in the current submission:
```javascript
// OLD - only triggers on cross
if (previousClicks < hidden.triggerClick && newTotalClicks >= hidden.triggerClick)
```

If a user had 500 clicks before achievement #42 was added, they'd never get it because they already passed 42.

**Fix:** Grant achievement if total clicks exceeds threshold (with duplicate prevention):
```javascript
// NEW - grants if threshold ever passed
if (newTotalClicks >= hidden.triggerClick)
```

#### 4. Sync Achievements Feature (Backfill Button)

Added a manual sync button for users to retroactively get missing achievements:

**API endpoint:** `GET /api/clickstr?address=0x...&syncAchievements=true`
- Looks up user's total clicks from Redis
- Checks all hidden achievements and personal milestones
- Grants any they should have but don't
- Returns list of newly granted items

**Frontend:**
- Added ↻ button in NFT panel header
- Spins while syncing
- Shows toast: "Found X achievements" or "No missing achievements"
- Processes new achievements through normal flow (adds to claim queue)

**Files changed:**
- `mann-dot-cool/api/clickstr.js` - New `syncAchievements` query handler
- `src-ts/src/services/api.ts` - New `syncAchievements()` function
- `src-ts/src/services/index.ts` - Export new function
- `src-ts/src/main.ts` - `handleSyncAchievements()` handler, button listener
- `src-ts/index.html` - Sync button in NFT panel header
- `src-ts/src/styles/panels.css` - `.sync-btn` styles with spin animation

### Commits

**stupid-clicker repo:**
- `2ac59cc` - Sync frontend milestone configs with CSV source of truth
- `cc8ee78` - Add sync achievements button to retroactively grant missing achievements

### Key Learnings

1. **CSV must be single source of truth** - API and frontend should derive from it, not invent new tiers

2. **Retroactive achievement grants** - When adding new achievements, need a way for existing users to claim ones they should already have

3. **"Pass-through" vs "threshold" logic** - For achievements, checking `>= threshold` is safer than `crossed threshold this session`

4. **Verify tier counts match** - Easy sanity check: `grep -c "tier:" file.js` should match CSV row count

---

## Session 23 - Mobile Wallet Fix & Reown AppKit Migration (Feb 2, 2026)

### Problem: Mobile Wallet Connection Broken

Users reported "WalletConnect failed to publish payload" error when trying to connect with Rainbow wallet on mobile. The old setup used raw `@walletconnect/ethereum-provider` v2.11.2 via UMD script, which had known issues with mobile deep linking.

### Solution: Migrate to Reown AppKit

Replaced the raw WalletConnect provider with **Reown AppKit** (formerly Web3Modal), which has proper mobile wallet support out of the box.

#### Dependencies Added
```bash
npm install @reown/appkit @reown/appkit-adapter-ethers5
```

#### New File: `src/config/appkit.ts`

```typescript
import { createAppKit } from '@reown/appkit';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { sepolia, mainnet } from '@reown/appkit/networks';

// Featured wallet IDs (from WalletConnect Explorer)
const FEATURED_WALLETS = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  '7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291218ebd90f5f5e26', // Rabby
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
];

export const appKit = createAppKit({
  adapters: [new Ethers5Adapter()],
  networks: [sepolia, mainnet],
  metadata: {
    name: 'Clickstr',
    description: 'Proof-of-work clicker game on Ethereum',
    url: window.location.origin,
    icons: ['/favicon.png'],
  },
  projectId: CONFIG.walletConnectProjectId,
  featuredWalletIds: FEATURED_WALLETS,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00ffff',
    '--w3m-color-mix': '#0a0a1a',
    '--w3m-border-radius-master': '2px',
    '--w3m-font-family': '"Press Start 2P", monospace',
  },
});
```

#### Rewritten: `src/services/wallet.ts`

Key changes:
- Uses `appKit.subscribeAccount()` to listen for connection state changes
- Uses `appKit.subscribeNetwork()` to detect chain switches
- `openConnectModal()` calls `appKit.open()` to show the wallet modal
- Provider/signer obtained from `appKit.getWalletProvider()`

```typescript
export function initWalletSubscriptions(): void {
  appKit.subscribeAccount((accountState) => {
    const { address, isConnected } = accountState;
    const chainId = appKit.getChainId();

    if (isConnected && address) {
      if (chainId !== CONFIG.chainId) {
        gameState.setWrongNetwork();
        return;
      }
      const walletProvider = appKit.getWalletProvider();
      provider = new ethers.providers.Web3Provider(walletProvider);
      signer = provider.getSigner();
      gameState.setConnected(address);
    } else {
      provider = null;
      signer = null;
      gameState.setDisconnected();
    }
  });
}

export async function openConnectModal(): Promise<void> {
  gameState.setConnecting();
  await appKit.open();
}
```

#### Changes to `src/main.ts`

- Added `initWalletSubscriptions()` call in `init()`
- Replaced `showWalletModal()` calls with `openConnectModal()`
- Removed custom wallet modal handling (`setupWalletModalListeners`)
- Added connection state tracking in `handleStateChange()` to detect new connections

```typescript
let wasConnected = false;

function handleStateChange(event: string): void {
  switch (event) {
    case 'connectionChanged':
      updateConnectButton();
      updateMobileWalletText();
      // Detect new connection
      if (gameState.isConnected && !wasConnected) {
        wasConnected = true;
        onConnected();
      } else if (!gameState.isConnected) {
        wasConnected = false;
      }
      break;
    // ...
  }
}
```

#### Removed

- WalletConnect UMD script from `index.html`
- Custom wallet modal HTML (AppKit provides its own)
- `setupWalletModalListeners()` function
- `showWalletModal()` function
- Individual wallet type handling (MetaMask, Rainbow, etc. now all go through AppKit)

### Benefits of AppKit

1. **Proper mobile deep linking** - Opens wallet apps correctly on mobile
2. **Modern modal UI** - Built-in wallet selection with dark theme support
3. **Better reliability** - Uses newer WalletConnect relay infrastructure
4. **Simpler code** - One modal handles all wallets instead of custom per-wallet logic

### Commits

- `297675f` - Upgrade WalletConnect to v2.17.0 for better mobile support (initial attempt)
- `d091e61` - Migrate to Reown AppKit for wallet connections
- `ff369d0` - Set featured wallets to MetaMask, Rainbow, Rabby, Coinbase

### Key Learnings

1. **Raw WalletConnect provider is fragile on mobile** - The UMD bundle has issues with deep linking; use AppKit or RainbowKit instead

2. **AppKit API differs from old WalletConnect** - Methods like `subscribeProvider` became `subscribeAccount`, `getIsConnected` became `getAccount().isConnected`

3. **Connection state is async with AppKit** - The modal opens immediately, but connection happens later via subscription callbacks

4. **TypeScript strictness** - AppKit's adapter types needed `as any` cast due to `exactOptionalPropertyTypes` conflicts
