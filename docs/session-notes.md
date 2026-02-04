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

---

## Session 24 - Mobile UX, NFT Lightbox & Click Transaction Logging (Feb 2, 2026)

### Mobile UX Improvements

#### 1. Disabled Custom Cursors on Mobile

**Problem:** Custom cursor cosmetics don't make sense on touch devices - users tap, not hover with a mouse pointer.

**Solution:** Added touch device detection in `src/effects/cursor.ts`:
```typescript
function checkIsTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
```

Changes:
- `initCursor()`: On touch devices, hides cursor element and skips mouse tracking setup
- `applyCursor()`: On touch devices, still saves equipped cursor to state (for collection modal) but doesn't display visual effects
- No particle effects spawned on mobile

#### 2. Smaller Trophy Section on Mobile

**Problem:** The 1/1 NFT trophy section took up too much screen space in the collection modal on mobile.

**Solution:** Added mobile-specific styles in `responsive.css`:
```css
@media (max-width: 768px) {
  .trophy-section { padding: var(--spacing-md); }
  .trophy-img { width: 40px; height: 40px; }
  .trophy-name { font-size: 10px; }
  .trophy-click-num { font-size: 9px; }
}
```

### NFT Image Lightbox Feature

**Problem:** Users wanted to view 1/1 NFT artwork larger, especially on mobile.

**Solution:** Added click-to-enlarge lightbox for all 1/1 NFTs in the collection modal.

#### Implementation

**HTML (`index.html`):**
```html
<div id="image-lightbox" class="modal">
  <div class="lightbox-content">
    <button class="lightbox-close-btn" id="lightbox-close-btn">X</button>
    <img id="lightbox-image" src="" alt="NFT Preview">
    <div class="lightbox-caption">
      <span class="lightbox-name" id="lightbox-name"></span>
      <span class="lightbox-click-num" id="lightbox-click-num"></span>
    </div>
  </div>
</div>
```

**CSS (`modals.css`):**
- Full-screen backdrop (click to close)
- Centered image with gold border and glow
- Caption with NFT name and click number
- Responsive sizing (80vw max on desktop, 90vw on mobile)

**JavaScript (`main.ts`):**
- `showImageLightbox(imageSrc, name, clickNum)` - Opens lightbox with specified image
- `setupLightboxListeners()` - Close button and backdrop click handlers
- Updated `renderTrophySection()` - Trophy items now clickable
- Updated `renderCollectionGrid()` - Global 1/1 items (tier 200-500) now clickable

### Click Transaction Logging (API)

**Problem:** No way to retroactively determine who made a specific global click number. If we wanted to add a 1/1 NFT for click #1111 later, we couldn't find who made it.

**Solution:** Added transaction logging to the API that records every click submission.

#### Implementation

**New Redis key:** `clickstr:click-log` (list)

**Log entry format (~120 bytes each):**
```json
{"a": "0x1234...", "c": 50, "b": 10000, "f": 10050, "t": 1706900000}
```
- `a` = address
- `c` = clicks in this batch
- `b` = global count before
- `f` = global count after
- `t` = timestamp

**New API endpoint:** `GET /api/clickstr?findClick=1111`

Returns:
```json
{
  "success": true,
  "clickNumber": 1111,
  "found": true,
  "address": "0xabc...",
  "batchStart": 1100,
  "batchEnd": 1150,
  "batchSize": 50,
  "timestamp": 1706900000,
  "note": "Click #1111 was part of a batch of 50 clicks (1100-1150)"
}
```

**Storage cost analysis:**
- 120 bytes × 1000 submissions/day = ~3.6MB/month
- At 10K submissions/day = ~36MB/month (~$0.01 storage, ~$0.60 commands)
- Negligible cost, enables future flexibility

### Bot Miner Testing

Tested the public miner script with updated contract addresses:

**Contract address fix:** `public-miner.js` had outdated Sepolia addresses. Updated to v5:
- Clickstr: `0xA16d45e4D186B9678020720BD1e743872a6e9bA0`
- Token: `0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4`

**Test results:**
- 7 successful transactions before running out of Sepolia ETH
- 3,500 clicks submitted
- ~345.7 CLICK earned
- ~0.062 ETH spent on gas (~0.009 ETH per 500-click batch)

**Gas analysis:**
- Each 500-click batch uses ~12M gas (verifying 500 PoW hashes on-chain)
- That's ~40% of a single Ethereum block
- Sepolia gas: ~1 gwei → ~0.012 ETH per TX
- Mainnet gas: ~0.1 gwei → ~0.0012 ETH per TX (10x cheaper!)

### Difficulty Floor Discussion

Analyzed the contract's difficulty adjustment system:

**Current guards:**
- Minimum floor: `difficultyTarget = 1000` (line 535-536 in Clickstr.sol)
- Max adjustment: 4x per epoch
- Starting difficulty: `type(uint256).max / 1000`

**To reach floor:** Would need ~85 consecutive epochs of maximum difficulty increases. With 12 epochs per game, that's 7+ games of sustained massive over-mining.

**Conclusion:** The floor is reachable in theory but practically impossible. The seasonal reset model provides a natural safety valve - if anything goes wrong in one game, the next game starts fresh.

### Files Changed

**Frontend (`src-ts/`):**
- `index.html` - Image lightbox modal HTML
- `src/effects/cursor.ts` - Touch device detection, mobile cursor disable
- `src/main.ts` - Lightbox functions, trophy/collection click handlers
- `src/styles/modals.css` - Lightbox styles
- `src/styles/responsive.css` - Mobile trophy section sizing

**API (`mann-dot-cool/api/`):**
- `clickstr.js` - Click transaction logging, `findClick` query endpoint

**Scripts:**
- `scripts/public-miner.js` - Updated contract addresses to v5

### Commits

- `9fee509` - Improve mobile UX and add 1/1 NFT lightbox viewer
- `b14912d` - Add click transaction logging for retroactive 1/1 attribution

---

## Session 25 - ENS Resolution, Panel Visibility & Button Freeze Fix (Feb 2, 2026)

### ENS Names Not Showing in Leaderboard

**Problem:** ENS names weren't displaying in the leaderboard - users saw shortened addresses instead of their .eth names.

**Root Cause:** The ENS service (`src/services/ens.ts`) was using a hardcoded public RPC URL (`https://eth.llamarpc.com`) which is rate-limited and unreliable.

**Fix:** Updated `getMainnetProvider()` to use the Alchemy mainnet RPC from environment variable:
```typescript
function getMainnetProvider(): ethers.providers.JsonRpcProvider {
  if (mainnetProvider) return mainnetProvider;
  const rpcUrl = import.meta.env.VITE_ETH_MAINNET_RPC_URL || 'https://eth.llamarpc.com';
  mainnetProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return mainnetProvider;
}
```

Also cached the provider instance to avoid recreating it on every lookup.

### Hide Panels Until Wallet Connected

**Problem:** Leaderboard and NFT panels were visible before wallet connection, showing "Loading..." states that looked broken.

**Fix:**
1. Added `display: none` to `#leaderboard-panel` in CSS
2. Added `leaderboardPanel` DOM element reference in `main.ts`
3. Created `updatePanelVisibility()` function called on connection state changes
4. NFT panel already hidden by default, controlled by `renderNftPanel()`

**Behavior:**
- On page load: Both panels hidden
- On wallet connect: Leaderboard shows; NFT panel shows if there are claimable rewards
- On disconnect: Both panels hidden again

### Game Status Panel Layout Swap

**Problem:** User requested swapping Pool and All-Time Clicks positions in the game status panel.

**Before:**
```
Game | Epoch | Pool
All-Time Clicks: 1.46k
Clicking Now: ...
```

**After:**
```
Game | Epoch | All-Time (1.46k suffix)
Pool: 941,000 $CLICKSTR
Clicking Now: ...
```

**Changes:**
- `index.html`: Restructured panel elements, renamed IDs
- `main.ts`: Updated element references (`headerAlltimeClicksEl`, `headerAlltimeSuffixEl`), changed `updateDisplays()` and `updateGlobalStats()` to use new elements
- `panels.css`: Added `.global-stat-suffix` style for "$CLICKSTR" label

### DSEG7 Font Number Cutoff

**Problem:** Numbers with digit `6` were being cut off at the bottom in the leaderboard (e.g., "1.16k" looked like "1.1k").

**Root Cause:** The DSEG7 seven-segment font has descender segments that extend below the baseline, particularly on digits 6 and 9.

**Fix:** Added `line-height: 1.4` and `padding-bottom: 2px` to `.leaderboard-clicks`:
```css
.leaderboard-clicks {
  font-size: 18px;
  line-height: 1.4;
  padding-bottom: 2px;
  /* ... */
}
```

Also added `overflow: visible` to `.leaderboard-item`.

### Button Freeze Bug Fix (Critical)

**Problem:** Intermittently, the click button would freeze and stop responding. Users had to refresh the page to fix it.

**Root Cause:** When the mining worker encountered an error or timed out, it would terminate but NOT call the callback. This left `isPressed` and `isMiningClick` stuck at `true`, causing the guard `if (isPressed || isMiningClick) return;` to block all future clicks.

**Fix:** Three-part solution:

1. **Worker error handler calls callback:**
```typescript
miningWorker.onerror = (error) => {
  const callback = onNonceFound;
  terminateMining();
  gameState.setMiningComplete();
  if (callback) callback(BigInt(0)); // Signal error with nonce 0
};
```

2. **Callback ignores error nonce:**
```typescript
function onClickMined(nonce: bigint): void {
  // Clear safety timeout
  if (miningTimeout) clearTimeout(miningTimeout);

  isMiningClick = false;
  isPressed = false;
  buttonImg.src = 'button-up.jpg';
  playButtonUp();

  // Only add valid clicks (nonce 0 indicates mining error)
  if (nonce !== 0n) {
    gameState.addClick(nonce);
    // ...
  }
}
```

3. **Safety timeout (10 seconds):**
```typescript
function pressDown(): void {
  // ...
  if (gameState.isConnected) {
    isMiningClick = true;
    startMining(onClickMined);

    // Safety timeout: if mining takes more than 10 seconds, something is wrong
    miningTimeout = setTimeout(() => {
      if (isMiningClick) {
        console.warn('[Mining] Timeout - resetting button state');
        terminateMining();
        onClickMined(0n);
      }
    }, 10000);
  }
}
```

### Debug Logging Added

Added console logging for achievement celebration debugging:
- `[Achievements] handleAchievements called:` with data from server
- `[Celebration] Personal milestone - zelda sound + confetti`
- `[Celebration] Global milestone - disco + confetti`

### Files Changed

**Frontend (`src-ts/src/`):**
- `services/ens.ts` - Use Alchemy RPC, cache provider
- `services/mining.ts` - Error handler calls callback with error nonce
- `main.ts` - Panel visibility, new element refs, button freeze fix with timeout
- `effects/celebrations.ts` - Debug logging
- `styles/panels.css` - Leaderboard panel hidden, number cutoff fix, global-stat-suffix
- `index.html` - Panel restructure for Pool/All-Time swap

### Commits

- `458c427` - Fix ENS resolution and hide panels until wallet connected
- `6f9a409` - Swap Pool and All-Time Clicks positions in game status panel
- `7c0c6ab` - Fix DSEG7 font cutoff in leaderboard click counts
- `a8e1d55` - Fix DSEG7 number cutoff with padding-bottom
- `e6661ca` - Increase line-height for DSEG7 digit 6 descender
- `4f0c55f` - Add debug logging for achievement celebrations
- `55a6eeb` - Fix button freezing when mining worker errors or hangs

## Session 25 - Welcome Modal & Buy Button (Feb 3, 2026)

### Welcome Modal (First Visit)

Added a welcome modal that appears on first visit to explain the game:

1. Connect your wallet
2. Click the button to earn $clickstr
3. Clicking also burns $clickstr at the same time
4. Your computer is doing real proof-of-work behind the scenes
5. Earn NFT rewards when you hit clicking milestones
6. Have fun

**Features:**
- Uses 7-segment display font for title with red glow
- Stores `clickstr-welcome-seen` in localStorage to only show once
- Dismisses on "Got it!" button or backdrop click
- Mobile responsive

### Temporary Cursor Preview

When the welcome modal opens, users get a preview of the custom cursor system:
- Shows `gold-sparkle` cursor while modal is open
- Cursor follows mouse position
- Reverts to default cursor when modal closes
- Gives new users a "taste of what's to come"

**Implementation:**
- Added `temporaryCursor` tracking variable in cursor.ts
- New functions: `showTemporaryCursor()` and `clearTemporaryCursor()`
- Mouse move handler checks for temp cursor OR equipped cursor

### Buy $CLICKSTR Button

Added "Buy $CLICKSTR" button in gold theme next to Connect Wallet:
- Links to TokenStrategy: `https://www.tokenstrategy.com/strategies/0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d`
- Opens in new tab
- Gold gradient background with gold glow
- Also added to mobile hamburger menu

### Copy Token Address Button

Added copy button (⎘) to the left of "Buy $CLICKSTR":
- No border/frame - minimal floating icon
- Copies `0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d` to clipboard
- Turns green with checkmark (✓) on success
- Shows toast notification "Copied! Token address copied to clipboard"
- Also added to mobile menu next to Buy button

### Files Changed

**HTML (`index.html`):**
- Added `#top-right-btns` container with copy, buy, and connect buttons
- Added `#welcome-modal` with 6-point list
- Added copy button to mobile menu row

**CSS:**
- `modals.css` - Welcome modal styles with 7-segment title font and glow
- `buttons.css` - Buy button (gold), copy button (minimal), container styles
- `mobile-menu.css` - Gold buy item, copy button, row layout
- `responsive.css` - Hide top-right-btns on mobile (use hamburger instead)

**TypeScript (`main.ts`):**
- `setupWelcomeModalListeners()` - Modal open/close with localStorage
- `checkFirstVisit()` - Show modal on first visit with temp cursor
- `setupCopyAddressButton()` - Copy to clipboard with visual feedback
- Import `showTemporaryCursor` and `clearTemporaryCursor`

**Effects (`cursor.ts`):**
- Added `temporaryCursor` state variable
- `showTemporaryCursor(cursorId)` - Show cursor without saving to state
- `clearTemporaryCursor()` - Restore user's actual cursor
- Mouse handler checks for temp cursor

---

## Session - Mainnet NFT Deployment & Sepolia v6 Dry Run (Feb 3, 2026)

This session focused on preparing for mainnet by deploying the NFT contract and running a full dry run on Sepolia that mimics the mainnet token distribution flow.

### Mainnet NFT Contract Deployed

Deployed `ClickstrNFT` to Ethereum mainnet:
- **Address:** `0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849`
- **Owner:** `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- **Signer:** `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- **Verified on Etherscan:** Yes

Key insight: The NFT contract is independent from the game contract and token. It can be deployed ahead of time and will work with any future Clickstr deployment since it only requires valid signatures from the signer.

### Sepolia v6 Dry Run - Mainnet Flow Simulation

Created a two-phase deployment process that mimics how mainnet will work with TokenWorks:

**Phase 1:** Deploy from NFT signer wallet
- Deploy ClickstrNFT (signer = owner)
- Deploy MockClickToken with 1B supply
- Transfer 100M tokens to Safe Wallet

**Phase 2:** Manual safe transfer, then deploy game
- Transfer 3M tokens from Safe to Game Deployer (manual)
- Deploy Clickstr contract from Game Deployer
- Start game with 3M token pool

**Contracts Deployed (Sepolia v6):**
| Contract | Address |
|----------|---------|
| ClickstrNFT | `0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849` |
| MockClickToken | `0x78A607EDE7C7b134F51E725e4bA73D7b269580fc` |
| Clickstr | `0xf724ede44Bbb2Ccf46cec530c21B14885D441e02` |

**Wallets Used:**
- NFT Deployer (signer): `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- Safe Wallet: `0x4890c268170a51d7864d4F879E73AC24A0415810`
- Game Deployer: `0x73468BD5fDD81b6e0c583bB5bb38534684c8DFe0`

### Deployment Script Created

Created `scripts/deploy-sepolia-dryrun.js` with two phases:
```bash
# Phase 1: Deploy NFT + token, transfer to safe
PHASE=1 npx hardhat run scripts/deploy-sepolia-dryrun.js --network sepolia

# Manual: Transfer 3M from safe to game deployer

# Phase 2: Deploy game contract
PHASE=2 TOKEN_ADDRESS=0x... NFT_ADDRESS=0x... npx hardhat run scripts/deploy-sepolia-dryrun.js --network sepolia
```

### Mainnet Deployment Guide

Created comprehensive `docs/mainnet-deployment-guide.md` documenting:
- Complete two-phase deployment flow
- Environment variables and wallet setup
- Subgraph deployment
- Frontend and server updates
- Full checklist for each phase
- Troubleshooting section

### Bug Fix: Bot Detection

**Problem:** The "BOTS" counter in the "CLICKING NOW" display was showing all recent on-chain activity as bots, including humans who clicked via the frontend.

**Root Cause:** `fetchRecentBotActivity()` counted ALL addresses with recent on-chain submissions, regardless of whether they used the frontend.

**Fix:** Updated the function to cross-reference with the human leaderboard:
1. Fetch recent on-chain submissions from subgraph
2. Fetch human leaderboard from API
3. Only count as "bot" if address has on-chain activity but is NOT in human leaderboard

```typescript
// Old: Counted all on-chain activity as bots
const uniqueAddresses = new Set(submissions.map(s => s.user.id));
return uniqueAddresses.size;

// New: Only count addresses NOT in human leaderboard
let botCount = 0;
recentOnChainAddresses.forEach(addr => {
  if (!humanAddresses.has(addr)) {
    botCount++;
  }
});
return botCount;
```

### NFT Tier Bonus System Verified

Tested and confirmed the NFT tier bonus system is fully operational:

**Configured Bonuses:**
| Tier | Milestone | Bonus |
|------|-----------|-------|
| 4 | 1,000 clicks | +2% |
| 6 | 10,000 clicks | +3% |
| 8 | 50,000 clicks | +5% |
| 9 | 100,000 clicks | +7% |
| 11 | 500,000 clicks | +10% |

**Test Results:**
1. User reached 1,000 clicks
2. User claimed tier 4 NFT via frontend
3. `calculateBonus(user)` returned 200 (2%)
4. Subsequent click submission emitted `BonusApplied` event:
   - Base Reward: 20.11 CLICK
   - Bonus Amount: +0.40 CLICK (exactly 2%)
   - Total: 20.51 CLICK

**Key Insight:** Bonuses only apply AFTER user claims the NFT. Reaching the milestone is not enough - must mint the achievement NFT.

### Infrastructure Updates

- Deployed subgraph v1.0.4 to Goldsky
- Updated frontend config with new contract addresses
- Reset API click counts via admin endpoint
- Updated `docs/deployment-status.md` with mainnet addresses

### Mainnet Status

| Contract | Address | Status |
|----------|---------|--------|
| ClickstrNFT | `0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849` | ✅ Deployed |
| $CLICK Token | `0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d` | ✅ Deployed (TokenWorks) |
| Clickstr | TBD | ⏳ Waiting for TokenWorks allowlist |

**Blocker:** TokenWorks requires allowlisting addresses before they can transfer tokens. This prevents unauthorized pools that avoid the burn fees. Waiting for them to allowlist the Clickstr contract address.

## Session 16 - Bug Fixes and UI Polish (Feb 3, 2026)

### Investigated: Gas Limit Error with Large Batches

**Issue:** When submitting 500 clicks at MAX EASY difficulty, Rabby Wallet showed error: `[From https://eth-sepolia.g.alchemy.com] gas limit too high`

**Analysis:**
- At MAX EASY difficulty, nearly ALL proofs are valid (not just some)
- 500 valid proofs = ~13.2M gas (44% of block)
- Gas estimates for different batch sizes at MAX EASY:
  - 100 proofs: ~2.6M gas (8.8% of block)
  - 200 proofs: ~5.3M gas (17.6% of block)
  - 300 proofs: ~7.9M gas (26.4% of block)
  - 500 proofs: ~13.2M gas (44.1% of block)

**Finding:** This is a **Rabby Wallet limitation**, not a game bug. MetaMask handles the same transaction fine. Rabby has stricter gas estimation limits, especially on testnets.

**Decision:** No code changes needed. Will monitor on mainnet - the issue may be Sepolia-specific.

### Fixed: Legendary NFT Display in Collection Modal

**Problems:**
1. Trophy section title showed static "LEGENDARY 1/1s" instead of owned/total count
2. Click numbers showed "Click #69" instead of cleaner "CLICK 69"

**Changes:**
- Added `trophyTitle` element with dynamic text: "LEGENDARY X/24" (where X = owned count)
- Removed `#` from click number display (now "CLICK 69" instead of "Click #69")
- Updated both trophy section and collection grid lightbox text

### Fixed: Button Animation Not Showing at MAX EASY Difficulty

**Problem:** When mining at MAX EASY difficulty, clicks were being recorded but the button's "down" animation wasn't visible. Sound played, clicks counted, but visually the button appeared stuck in "up" state.

**Root Cause:** Mining completes so fast (< 1ms) that the browser doesn't have time to render the "down" image before `onClickMined` switches it back to "up". Both image changes happen in the same rendering frame.

**Fix:** Added minimum visual delay (50ms) before resetting button state:
```typescript
const MIN_DOWN_TIME_MS = 50;
let buttonDownTime = 0;

function pressDown(): void {
  // ...
  buttonDownTime = Date.now();
  buttonImg.src = 'button-down.jpg';
  // ...
}

function onClickMined(nonce: bigint): void {
  const elapsed = Date.now() - buttonDownTime;
  const remainingDelay = Math.max(0, MIN_DOWN_TIME_MS - elapsed);

  setTimeout(() => {
    // Reset button state after minimum visible time
    buttonImg.src = 'button-up.jpg';
    // ...
  }, remainingDelay);
}
```

**Diagnostic Logging:** Added console logs to button/mining flow for future debugging:
- `[Button] pressDown - setting isPressed=true, showing down image`
- `[Button] pressDown BLOCKED - isPressed=X, isMiningClick=Y`
- `[Mining] startMining called`
- `[Mining] Worker found nonce: X`
- `[Button] onClickMined - reset state, showing up image`

---

## Session 17 - Difficulty Display Labels + Bot Testing (Feb 3-4, 2026)

This session improved the difficulty display UX and tested bot mining against the v6 Sepolia contract.

### Difficulty Display Changed from Ratios to Labels

**Problem:** The difficulty display showed ratio numbers like "2x" or "1000x" which were confusing. At MAX EASY difficulty (death spiral prevention), it showed "2x" which sounds like "harder" but actually means trivially easy (only ~2 hashes needed per valid proof).

**Root Cause:** The display formula `maxUint256 / difficultyTarget` gives a ratio that increases as difficulty increases. But without context, users couldn't tell if "2x" meant easy or hard.

**Solution:** Replaced ratio numbers with intuitive text labels based on thresholds:

| Ratio Range | Label | Meaning |
|-------------|-------|---------|
| < 10 | EASY | Nearly every hash is valid |
| 10-100 | NORMAL- | Easier than starting difficulty |
| 100-500 | NORMAL | Around starting difficulty (1000) |
| 500-2000 | NORMAL+ | Slightly harder than start |
| 2000-10k | HARD | Noticeably harder |
| 10k-100k | HARD+ | Significantly harder |
| > 100k | EXTREME | Very competitive |

**Code Change (`src-ts/src/main.ts` lines 1115-1154):**
```typescript
// Convert to human-readable difficulty label
let difficultyStr: string;
if (difficultyRatio < 10n) {
  difficultyStr = 'EASY';
} else if (difficultyRatio < 100n) {
  difficultyStr = 'NORMAL-';
} else if (difficultyRatio < 500n) {
  difficultyStr = 'NORMAL';
} else if (difficultyRatio < 2000n) {
  difficultyStr = 'NORMAL+';
} else if (difficultyRatio < 10000n) {
  difficultyStr = 'HARD';
} else if (difficultyRatio < 100000n) {
  difficultyStr = 'HARD+';
} else {
  difficultyStr = 'EXTREME';
}
setText(difficultyDisplayEl, difficultyStr);
```

### Updated Public Miner for v6 Contract

**Problem:** The `scripts/public-miner.js` bot miner had hardcoded v5 contract addresses, causing errors when trying to mine against the current v6 deployment.

**Fix:** Updated the Sepolia network config in `public-miner.js`:
```javascript
sepolia: {
  chainId: 11155111,
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  contractAddress: "0xf724ede44Bbb2Ccf46cec530c21B14885D441e02", // Clickstr v6
  tokenAddress: "0x78A607EDE7C7b134F51E725e4bA73D7b269580fc", // MockClickToken v6
  explorerUrl: "https://sepolia.etherscan.io",
},
```

### Bot Mining Test Results

Ran the public miner script against the v6 contract to test difficulty adjustment and accumulate clicks:

**Configuration:**
- Wallet: `0xAd9fDaD276AB1A430fD03177A07350CD7C61E897` (BOT_A)
- Initial ETH: 0.372 ETH
- Batch size: 500 proofs per TX
- Workers: 10 threads

**Performance (after ~5 minutes):**
- Clicks submitted: 10,000+
- CLICK earned: ~3,457 CLICK
- Gas spent: ~0.27 ETH
- Hash rate: 65-212 H/s (avg ~100 H/s)
- Gas per batch: ~12M gas (~0.014 ETH)

**Observations:**
- At EASY difficulty, mining is extremely fast (5-15 seconds per 500 proofs)
- Each batch earns ~172 CLICK and burns ~172 CLICK (50/50 split working correctly)
- Pool started at 2.88M CLICK, being depleted at ~345 CLICK/minute from bot

### Key Insights

1. **Difficulty Labels More Intuitive:** Users now see "EASY" instead of "2x", making it immediately clear that mining is trivial

2. **Bot Mining is Gas-Efficient at EASY:** At MAX EASY difficulty, the limiting factor is gas cost, not hash rate. A bot can mine indefinitely as long as it has ETH for gas

3. **Epoch Transitions:** Bot continued operating through epoch 3, automatically adapting to difficulty changes
