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
- [ ] Show streak counter somewhere
- [ ] Show current difficulty level somewhere
- [ ] Add simple 3 sentence explanation on first visit 
- [ ] Sound effects for achievements
- [ ] Confetti animation for legendary unlocks
- [ ] Error handling improvements
- [ ] Investigate remaining font weirdness
       - Can we make . bigger so numbers like 5.34k read better
       - What's up with the words 'active' and 'inactive' in the game state - they look weird
       - Number 6 still looks werd in some, but not all, leaderboard positions
- [ ] Think about making modals bigger, so font can be bigger for readability. 



---

## API Enhancements

- [ ] Create NFT metadata API endpoint (`/api/clickstr/nft/[tokenId]`)
- [ ] Add streak tracking display to stats endpoint

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

1. **Write Unit Tests** (Priority: Medium)
   - [ ] Test `GameState` subscription and state updates
   - [ ] Test `persistence.ts` localStorage functions
   - [ ] Test `milestones.ts` helper functions
   - [ ] Test `api.ts` mergeLeaderboards logic
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
