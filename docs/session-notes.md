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
  - `/api/stupid-clicker` - Click tracking, stats, leaderboard
  - `/api/stupid-clicker-eligible` - NFT eligibility
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
- Created StupidClickerNFT.sol (ERC721 with signatures)
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

Deployed new StupidClickerNFT with IPFS baseURI:
- Address: `0x3cDC7937B051497E4a4C8046d90293E2f1B84ff3`
- Signer: `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- Owner: `0xAd9fDaD276AB1A430fD03177A07350CD7C61E897`

**Note for mainnet:** Deploy NFT contract FROM the signer wallet so signer = owner.

### Admin Reset Endpoint

Created `/api/stupid-clicker-admin-reset` on mann.cool for testing:
- Resets off-chain Redis data (clicks, milestones, achievements, streaks)
- Protected by `STUPID_CLICKER_ADMIN_SECRET` env var
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
- StupidClicker: `0x6dD800B88FEecbE7DaBb109884298590E5BbBf20`
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
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/stupid-clicker-sepolia/1.0.2/gn
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
