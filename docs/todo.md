# TODO - Remaining Tasks

## Pre-Mainnet Checklist

### Configuration
- [x] Get production Turnstile keys from Cloudflare dashboard
- [x] Update `CONFIG.turnstileSiteKey` in frontend (`0x4AAAAAACV0UOMmCeG_g2Jr`)
- [x] Add `TURNSTILE_SECRET_KEY` to Vercel env (mann.cool)
- [ ] Create fresh NFT signer wallet for mainnet
- [ ] Add `NFT_SIGNER_PRIVATE_KEY` to Vercel env

### Deployment
- [ ] Deploy $CLICK token via TokenWorks (fix metadata)
- [ ] Deploy StupidClicker contract to mainnet
- [ ] Deploy StupidClickerNFT contract to mainnet
- [ ] Verify contracts on Etherscan
- [ ] Update frontend `NETWORK = 'mainnet'`
- [ ] Deploy mainnet subgraph: `goldsky subgraph deploy stupid-clicker-mainnet/1.0.0`

### Testing
- [ ] Test full flow: Connect wallet → click → verify → submit → see achievements
- [ ] Test epoch transitions
- [ ] Test difficulty adjustment after epochs
- [ ] Test winner bonus distribution
- [ ] Verify NFT claiming flow end-to-end
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
- [x] Cursor cosmetics system (scaffolded)

### Remaining
- [ ] Show cosmetic unlocks working (needs PNG assets)
- [ ] Add click effects/particles for special achievements
- [ ] Show streak counter in header
- [ ] Sound effects for achievements
- [ ] Confetti animation for legendary unlocks
- [ ] Error handling improvements

---

## API Enhancements

- [ ] Create NFT metadata API endpoint (`/api/stupid-clicker/nft/[tokenId]`)
- [ ] Add streak tracking display to stats endpoint

---

## Nice to Have (Post-Launch)

- [ ] The Graph subgraph for mainnet (already have Goldsky)
- [ ] Historical stats page
- [ ] Button skins (6 tiers)
- [ ] Sound effects on valid click
- [ ] Confetti on epoch win
