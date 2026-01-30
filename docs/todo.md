# TODO - Remaining Tasks

## Pre-Mainnet Checklist

### Configuration
- [ ] Get production Turnstile keys from Cloudflare dashboard
- [ ] Update `CONFIG.turnstileSiteKey` in frontend
- [ ] Add `TURNSTILE_SECRET_KEY` to Vercel env (production key)
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

## Art Assets (~120 needed)

### Cursor PNGs (95)
Location: `/public/cursors/`
Format: 32x32 or 48x48 PNG

**Main Progression:**
- [ ] white.png
- [ ] gray.png
- [ ] bronze.png
- [ ] bronze-glow.png
- [ ] silver.png
- [ ] silver-glow.png
- [ ] gold.png
- [ ] gold-glow.png
- [ ] platinum.png
- [ ] diamond.png
- [ ] diamond-glow.png
- [ ] cosmic.png

**Streak/Epoch:**
- [ ] fire.png
- [ ] fire-intense.png
- [ ] fire-inferno.png
- [ ] genesis.png
- [ ] finale.png

**Meme Themed:**
- [ ] pink.png (Nice)
- [ ] green.png (420)
- [ ] hellfire.png (666)
- [ ] lucky.png (777)
- [ ] elite.png (1337)
- [ ] calculator.png (8008)
- [ ] perfect.png (42069)
- [ ] ultra-nice.png (69420)
- ... (see milestones-and-nfts.md for full list)

### NFT Artwork (~60)

**Personal Milestones (12):**
- [ ] nft-first-timer.png
- [ ] nft-getting-started.png
- [ ] nft-warming-up.png
- [ ] nft-dedicated.png
- [ ] nft-serious-clicker.png
- [ ] nft-obsessed.png
- [ ] nft-no-sleep.png
- [ ] nft-touch-grass.png
- [ ] nft-legend.png
- [ ] nft-ascended.png
- [ ] nft-transcendent.png
- [ ] nft-click-god.png

**Streak Achievements (5):**
- [ ] nft-week-warrior.png
- [ ] nft-month-master.png
- [ ] nft-perfect-attendance.png
- [ ] nft-day-one-og.png
- [ ] nft-final-day.png

**Global 1/1s (~30):**
- [ ] nft-first-click.png (1)
- [ ] nft-century.png (100)
- [ ] nft-thousandaire.png (1,000)
- [ ] nft-ten-grand.png (10,000)
- [ ] nft-hundred-thousandth.png (100,000)
- [ ] nft-millionth.png (1,000,000)
- [ ] nft-ten-million.png (10,000,000)
- [ ] nft-hundred-million.png (100,000,000)
- [ ] nft-billionaire.png (1,000,000,000)
- [ ] ... (hidden global 1/1s)

**Hidden Personal (~50):**
- [ ] See milestones-and-nfts.md for full list

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
