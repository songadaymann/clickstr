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
- Three-tier leaderboard complete:
  - Global (merged frontend + contract)
  - Hardcore (frontend only)
  - Scripted (subgraph only)
- "See All Rankings" modal with tabs
- Fixed "Anonymous" display name bug
