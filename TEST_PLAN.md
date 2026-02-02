# Clickstr - Comprehensive 2-Day Test Plan

## Overview

**Duration:** 2 days (48 hours)
**Network:** Sepolia testnet
**Goal:** End-to-end testing of all systems with simulated real-world usage patterns

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (create .env file)
cat > .env << 'EOF'
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=0x...your_deployer_private_key...
BOT_A_PRIVATE_KEY=0x...bot_a_wallet_key...
EOF

# 3. Deploy test environment (deploys all 3 contracts + starts game)
npm run deploy:test

# 4. Set up player addresses for monitoring
cat > test-deployment/players.json << 'EOF'
{
  "botA": "0x...bot_a_address...",
  "botB": "0x...bot_b_address...",
  "human": "0x...your_address..."
}
EOF

# 5. Start monitoring (Terminal 1)
npm run test:monitor

# 6. Start Bot A - contract miner (Terminal 2)
BOT_A_PRIVATE_KEY=0x... npm run test:bot-a

# 7. Start Bot B - frontend bot (Terminal 3, optional)
FRONTEND_URL=https://your-frontend.vercel.app npm run test:bot-b

# 8. Open frontend and start clicking! (You)
```

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run deploy:test` | Deploy 2-day test environment to Sepolia |
| `npm run test:bot-a` | Run Bot A (contract miner) |
| `npm run test:bot-b` | Run Bot B (Puppeteer frontend bot) |
| `npm run test:monitor` | Run real-time monitoring dashboard |

---

## Test Participants (3 "Players")

| Player | Type | Method | Expected Behavior |
|--------|------|--------|-------------------|
| **Bot A** | Contract Bot | Script submits PoW directly to contract | Earns $CLICK, NO off-chain rewards |
| **Bot B** | Frontend Bot | Puppeteer/Selenium automating browser | Should be BLOCKED by Turnstile |
| **Human** | Real User | You clicking manually | Earns $CLICK AND off-chain rewards |

---

## Phase 0: Pre-Test Setup (Day 0)

### 0.1 Contract Deployment

| Task | Details | Status |
|------|---------|--------|
| Deploy MockClickToken | Fresh token for this test | ☐ |
| Deploy Clickstr | 2-hour epochs, 24 total epochs (48 hours) | ☐ |
| Deploy ClickstrNFT | With test signer address | ☐ |
| Verify all contracts on Etherscan | For transparency | ☐ |
| Fund game with test tokens | 10M CLICK (smaller pool for faster testing) | ☐ |
| Start the game | Call `startGame()` | ☐ |

**Deployment Parameters:**
```bash
# Configured in scripts/test-deploy.js
TOTAL_EPOCHS=24           # 24 epochs
EPOCH_DURATION=7200       # 2 hours per epoch (7200 seconds)
POOL_AMOUNT=2000000       # 2M tokens (realistic for 2-day test)

# This means:
# - Day 1: Epochs 1-12
# - Day 2: Epochs 13-24
# - Each epoch = 2 hours
# - ~1M tokens distributed per day (matching production rate)
# - Difficulty adjusts every 2 hours
# - Target: 83,333 clicks per epoch (scaled from 1M/day)
```

**Run deployment:**
```bash
npm run deploy:test
# or
npx hardhat run scripts/test-deploy.js --network sepolia
```

### 0.2 API Setup

| Task | Details | Status |
|------|---------|--------|
| Deploy /api/clickstr | Click tracking endpoint | ☐ |
| Deploy /api/clickstr/claim-signature | NFT claim signing | ☐ |
| Deploy /api/nft-metadata/{tokenId} | NFT metadata endpoint | ☐ |
| Set environment variables | See below | ☐ |
| Test all endpoints manually | Curl/Postman | ☐ |

**Environment Variables Needed:**
```
CLICKSTR_ADMIN_SECRET=<generate>
NFT_SIGNER_PRIVATE_KEY=<generate test wallet>
NFT_CONTRACT_ADDRESS=<after deployment>
TURNSTILE_SECRET_KEY=<from Cloudflare>
TURNSTILE_SITE_KEY=<from Cloudflare>
```

### 0.3 Frontend Setup

| Task | Details | Status |
|------|---------|--------|
| Update CONFIG in index.html | Point to Sepolia contracts | ☐ |
| Update API URL | Point to test API | ☐ |
| Add Turnstile site key | For human verification | ☐ |
| Deploy frontend | Vercel preview or local | ☐ |
| Test wallet connection | MetaMask on Sepolia | ☐ |

### 0.4 Test Wallets

| Wallet | Purpose | Fund With |
|--------|---------|-----------|
| Deployer | Contract deployment | 0.5 Sepolia ETH |
| Bot A | Contract bot | 0.3 Sepolia ETH |
| Bot B | Frontend bot | 0.1 Sepolia ETH |
| Human | Manual clicking | 0.2 Sepolia ETH |
| NFT Signer | Signs claim messages | No ETH needed (off-chain only) |

**Get Sepolia ETH from:**
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

---

## Phase 1: API Testing (Before Game Start)

### 1.1 GET /api/clickstr?address=0x...

| Test | Expected | Status |
|------|----------|--------|
| New address (never seen) | Returns zeros, empty milestones | ☐ |
| Valid address format | 200 OK | ☐ |
| Invalid address format | 400 error | ☐ |
| Missing address param | 400 error | ☐ |

### 1.2 POST /api/clickstr

| Test | Expected | Status |
|------|----------|--------|
| Valid click submission | 200 OK, click count increases | ☐ |
| Missing address | 400 error | ☐ |
| Invalid clicks (negative) | 400 error | ☐ |
| Invalid clicks (too large, >1000) | 400 error or cap | ☐ |
| Without Turnstile when required | 403 requires verification | ☐ |
| With valid Turnstile token | 200 OK | ☐ |
| With invalid Turnstile token | 403 error | ☐ |
| Milestone unlock at threshold | Returns newMilestones array | ☐ |

### 1.3 GET /api/clickstr?leaderboard=true

| Test | Expected | Status |
|------|----------|--------|
| Empty leaderboard | Returns empty array | ☐ |
| After clicks recorded | Returns sorted leaderboard | ☐ |
| Pagination (if implemented) | Works correctly | ☐ |

### 1.4 GET /api/clickstr?verification=true&address=0x...

| Test | Expected | Status |
|------|----------|--------|
| New user | Needs verification | ☐ |
| After verification | verified: true | ☐ |
| After 500 clicks | Needs re-verification | ☐ |
| After 1 hour | Session expired, needs verification | ☐ |

### 1.5 POST /api/clickstr/claim-signature

| Test | Expected | Status |
|------|----------|--------|
| Eligible user, valid milestone | Returns signature + tier | ☐ |
| Not eligible (not enough clicks) | 403 not eligible | ☐ |
| Already claimed milestone | 400 already claimed | ☐ |
| Invalid milestone ID | 400 invalid milestone | ☐ |
| Global 1/1 - first claimer | Returns signature | ☐ |
| Global 1/1 - second claimer | 400 already claimed globally | ☐ |

---

## Phase 2: Contract Testing (Before Game Start)

### 2.1 Clickstr Contract

| Test | Expected | Status |
|------|----------|--------|
| View functions before game start | Return zeros/defaults | ☐ |
| submitClicks before game start | Revert "Game not started" | ☐ |
| startGame with tokens | Game starts, epoch 1 begins | ☐ |
| Difficulty target initial value | Reasonable starting difficulty | ☐ |

### 2.2 ClickstrNFT Contract

| Test | Expected | Status |
|------|----------|--------|
| claim with valid signature | Mints NFT | ☐ |
| claim with invalid signature | Reverts | ☐ |
| claim same tier twice | Reverts "AlreadyClaimed" | ☐ |
| claim global 1/1 first time | Mints, marks globally claimed | ☐ |
| claim global 1/1 second person | Reverts "GlobalMilestoneAlreadyClaimed" | ☐ |
| claimBatch with multiple tiers | Mints all | ☐ |
| canClaim view function | Returns correct boolean | ☐ |
| getClaimedTiers view function | Returns array of claimed | ☐ |
| uri function | Returns correct metadata URL | ☐ |

---

## Phase 3: Bot A - Contract Bot (24/7)

**Purpose:** Simulate a developer who writes a script to mine directly on-chain, bypassing the frontend entirely.

### 3.1 Bot A Script Requirements

```javascript
// bot-a-contract.js (to be created)
//
// This bot:
// 1. Mines valid PoW nonces off-chain
// 2. Batches them (50-500 proofs)
// 3. Submits directly to Clickstr.submitClicks()
// 4. Never touches the frontend or APIs
// 5. Runs 24/7 for the full test duration

const BOT_CONFIG = {
  privateKey: process.env.BOT_A_PRIVATE_KEY,
  contractAddress: '<Clickstr address>',
  rpcUrl: 'https://sepolia.infura.io/v3/...',
  batchSize: 100,           // Proofs per submission
  submitInterval: 60000,    // Submit every 60 seconds
  miningThreads: 4          // Parallel mining workers
};
```

### 3.2 Bot A Metrics to Track

| Metric | How to Track |
|--------|--------------|
| Total proofs submitted | Contract events |
| Total $CLICK earned | balanceOf() |
| Gas spent | Transaction receipts |
| Proofs per second | Script logging |
| Submission success rate | Script logging |
| Average gas per proof | Calculation |

### 3.3 Bot A Expected Behavior

| Expectation | Verification |
|-------------|--------------|
| Earns $CLICK tokens | Check balance increases |
| Appears on-chain leaderboard | Check contract state |
| Does NOT appear on off-chain leaderboard | Check API |
| Does NOT earn milestones/cursors | Check API |
| Cannot claim NFTs | API returns "not eligible" |
| Affects difficulty for everyone | Watch difficulty target |

---

## Phase 4: Bot B - Frontend Bot (Attempted)

**Purpose:** Simulate someone trying to automate the frontend with Puppeteer/Selenium. Should be blocked by Turnstile.

### 4.1 Bot B Script Requirements

```javascript
// bot-b-frontend.js (to be created)
//
// This bot:
// 1. Uses Puppeteer to control a browser
// 2. Navigates to the frontend
// 3. Connects wallet (programmatically)
// 4. Attempts to click the button automatically
// 5. Attempts to submit clicks to API
// 6. Should be BLOCKED by Turnstile

const BOT_CONFIG = {
  frontendUrl: 'https://your-test-frontend.vercel.app',
  headless: true,           // Run without visible browser
  clickInterval: 100,       // Try to click every 100ms
};
```

### 4.2 Bot B Tests

| Test | Expected | Status |
|------|----------|--------|
| Can load frontend | Yes | ☐ |
| Can connect wallet | Yes (MetaMask automation) | ☐ |
| Can click button | Yes (but mining happens) | ☐ |
| Can submit to API without Turnstile | NO - 403 error | ☐ |
| Can solve Turnstile programmatically | NO - should fail | ☐ |
| Can earn off-chain rewards | NO | ☐ |
| Can still submit to contract directly | Yes (but no off-chain) | ☐ |

### 4.3 Bot B Expected Outcomes

- **If Turnstile works:** Bot gets stuck at verification, cannot record clicks to API
- **If Turnstile fails:** We need to add more anti-bot measures
- **Either way:** Bot can still mine on-chain (this is by design)

---

## Phase 5: Human Testing (You)

**Purpose:** Verify the actual user experience works end-to-end.

### 5.1 Session 1: Initial Experience (Day 1, Hour 1-2)

| Test | Expected | Status |
|------|----------|--------|
| Load frontend | Button displays | ☐ |
| Connect wallet | MetaMask connects | ☐ |
| See game stats | Pool, epoch, difficulty shown | ☐ |
| Click button | Button goes down, mining starts | ☐ |
| Mining completes | Button pops up, click counted | ☐ |
| Accumulate 50 clicks | Submit button activates | ☐ |
| Turnstile challenge appears | Complete successfully | ☐ |
| Submit clicks | TX succeeds, tokens received | ☐ |
| Check off-chain stats | Clicks recorded, milestones shown | ☐ |

### 5.2 Milestone Testing (Day 1, Throughout)

Click to these thresholds and verify milestone unlocks:

| Clicks | Milestone | Tier | Cursor | Status |
|--------|-----------|------|--------|--------|
| 1 | First Timer | 1 | White | ☐ |
| 42 | Meaning of Everything | 608 | Towel beige | ☐ |
| 69 | Nice | 500 | Pink | ☐ |
| 100 | Getting Started | 2 | Gray | ☐ |
| 101 | Binary Palindrome | 540 | Mirror chrome | ☐ |
| 111 | Triple Ones | 520 | Light gray | ☐ |
| 137 | Fine Structure | 560 | Chalk white | ☐ |
| 256 | Byte | 580 | Green PCB | ☐ |
| 314 | Pi Day | 561 | Blueprint blue | ☐ |
| 404 | Not Found | 600 | Glitched | ☐ |
| 420 | Blaze It | 501 | Smoke green | ☐ |
| 500 | Warming Up | 3 | Brown leather | ☐ |
| 500 | Server Error | 601 | Red warning | ☐ |
| 512 | Half K | 581 | PCB + LED | ☐ |
| 666 | Devil's Click | 502 | Demon red | ☐ |
| 747 | Jumbo | 602 | Cloud white | ☐ |
| 777 | Lucky 7s | 503 | Casino gold | ☐ |
| 888 | Prosperity | 527 | Red | ☐ |
| 911 | Emergency | 603 | Ambulance | ☐ |
| 999 | So Close | 530 | Light purple | ☐ |
| 1000 | Dedicated | 4 | Bronze | ☐ |
| 1001 | Bookends | 541 | Polished silver | ☐ |

**Note:** You probably won't hit all of these in 2 days of manual clicking. Focus on the early ones (1-1000) and verify the system works.

### 5.3 NFT Claim Testing (Day 1)

| Test | Expected | Status |
|------|----------|--------|
| Unlock milestone | Toast notification appears | ☐ |
| Click "Mint NFT" | Claim modal opens | ☐ |
| Modal shows correct NFT | Name, tier, preview | ☐ |
| Click mint | API returns signature | ☐ |
| Transaction sent | MetaMask prompts | ☐ |
| Transaction succeeds | NFT in wallet | ☐ |
| Check OpenSea testnet | NFT visible with metadata | ☐ |
| Try to claim same NFT again | Error "already claimed" | ☐ |

### 5.4 Epoch Transition Testing (Every 2 Hours)

| Test | Expected | Status |
|------|----------|--------|
| Epoch countdown reaches 0 | UI updates | ☐ |
| New epoch starts | Epoch number increments | ☐ |
| Difficulty adjusts | Based on previous epoch clicks | ☐ |
| Winner bonus distributed | Top clicker gets 10% bonus | ☐ |
| Can call finalizeEpoch() | If auto-finalize didn't trigger | ☐ |
| Finalizer reward works | 1% to finalizer | ☐ |

### 5.5 Streak Testing (Day 2)

| Test | Expected | Status |
|------|----------|--------|
| Click on Day 1 | Streak = 1 | ☐ |
| Click on Day 2 | Streak = 2 | ☐ |
| Streak counter in UI | Shows current streak | ☐ |
| (Future) 7-day streak | Week Warrior milestone | ☐ |

---

## Phase 6: Comparative Analysis

### 6.1 End-of-Test Metrics Comparison

| Metric | Bot A (Contract) | Bot B (Frontend) | Human |
|--------|------------------|------------------|-------|
| Total clicks (on-chain) | ??? | ??? | ??? |
| Total clicks (off-chain) | 0 | ??? (should be 0) | ??? |
| $CLICK earned | ??? | ??? | ??? |
| Gas spent (ETH) | ??? | ??? | ??? |
| Cost per click (gas) | ??? | ??? | ??? |
| Milestones unlocked | 0 | 0 | ??? |
| NFTs claimed | 0 | 0 | ??? |
| On-chain leaderboard rank | ??? | ??? | ??? |
| Off-chain leaderboard rank | N/A | N/A | ??? |

### 6.2 Questions to Answer

1. **Is the economic balance right?**
   - Does bot mining make human clicking pointless?
   - Is gas cost prohibitive for anyone?
   - Is difficulty adjusting appropriately?

2. **Is Turnstile effective?**
   - Did Bot B get blocked?
   - Were there false positives (human blocked)?
   - Is the UX acceptable?

3. **Are off-chain rewards compelling?**
   - Do milestones unlock at right times?
   - Is cursor progression satisfying?
   - Do NFT claims work smoothly?

4. **Are there exploits?**
   - Can someone game the system?
   - Are there unexpected edge cases?
   - Is anything broken?

---

## Phase 7: Edge Case Testing

### 7.1 Contract Edge Cases

| Test | How to Trigger | Expected | Status |
|------|----------------|----------|--------|
| Zero clicks in an epoch | No one clicks for 2 hours | Difficulty decreases 4x | ☐ |
| Epoch budget exhausted | Many clicks early in epoch | Soft overflow (10% rate) | ☐ |
| Submit during epoch transition | Time tx right at boundary | Should handle gracefully | ☐ |
| Duplicate proofs in batch | Include same nonce twice | Revert | ☐ |
| Invalid epoch in proof | Use wrong epoch number | Proof rejected | ☐ |
| Wrong chain ID in proof | Use mainnet chain ID | Proof rejected | ☐ |
| Very large batch (500) | Submit max batch | Should work | ☐ |
| Very small batch (50) | Submit min batch | Should work | ☐ |
| Below min batch (49) | Submit 49 proofs | Revert | ☐ |
| Multiple users same block | Concurrent submissions | Both succeed | ☐ |
| finalizeMultipleEpochs | Skip several epochs, then finalize | Works | ☐ |

### 7.2 API Edge Cases

| Test | How to Trigger | Expected | Status |
|------|----------------|----------|--------|
| Concurrent click submissions | Send 10 requests at once | All recorded correctly | ☐ |
| Very high click count | POST clicks: 999999 | Capped or rejected | ☐ |
| SQL injection attempt | Address = "'; DROP TABLE" | Sanitized, no effect | ☐ |
| XSS in name | Name = "<script>alert(1)</script>" | Escaped in output | ☐ |
| Rate limiting | 100 requests/second | Should be limited | ☐ |
| Signature replay attack | Reuse signature on different contract | Fails (contract address in hash) | ☐ |
| Signature for wrong user | Use someone else's signature | Fails (address in hash) | ☐ |

### 7.3 Frontend Edge Cases

| Test | How to Trigger | Expected | Status |
|------|----------------|----------|--------|
| Disconnect wallet mid-session | Unplug MetaMask | Handles gracefully | ☐ |
| Switch networks | Change to mainnet | Warning, disabled | ☐ |
| Switch accounts | Change wallet address | Resets state | ☐ |
| Refresh during mining | F5 while mining | Loses unmined clicks | ☐ |
| Close tab with pending clicks | Close browser | Loses unsubmitted clicks | ☐ |
| Submit with insufficient gas | Low gas price | TX fails gracefully | ☐ |
| Long session (hours) | Leave tab open | Session expires, re-verify | ☐ |

---

## Phase 8: Security Testing

### 8.1 Contract Security

| Test | Attack Vector | Mitigation | Status |
|------|---------------|------------|--------|
| Reentrancy | Call back during claim | ReentrancyGuard | ☐ |
| Integer overflow | Large numbers | Solidity 0.8 checks | ☐ |
| Front-running | Watch mempool, submit first | Acceptable game theory | ☐ |
| Proof grinding | Pre-compute proofs | Epoch in hash | ☐ |
| Signature malleability | Modify signature | ECDSA library handles | ☐ |

### 8.2 API Security

| Test | Attack Vector | Mitigation | Status |
|------|---------------|------------|--------|
| CORS bypass | Call from unauthorized origin | CORS headers | ☐ |
| Admin endpoint access | Call without secret | Auth required | ☐ |
| Turnstile bypass | Skip verification | Server-side check | ☐ |
| Clickjacking | Embed in iframe | X-Frame-Options | ☐ |

---

## Test Scripts (Created)

All scripts are in the `scripts/` folder and can be run via npm:

### 1. `scripts/test-deploy.js` ✅

Deploys complete test environment to Sepolia:
- MockClickToken (2M tokens)
- ClickstrNFT (achievement NFTs)
- Clickstr (game with 2-hour epochs)
- Starts the game automatically

```bash
npm run deploy:test
```

**Output:** Saves deployment info to `test-deployment/deployment.json`

---

### 2. `scripts/test-bot-a-contract.js` ✅

24/7 contract miner that bypasses the frontend:
- Mines valid PoW nonces using keccak256
- Batches proofs (100 per submission by default)
- Submits directly to contract
- Tracks all metrics (gas, tokens, hash rate)

```bash
BOT_A_PRIVATE_KEY=0x... npm run test:bot-a
```

**Output:** Saves stats to `test-deployment/bot-a-stats.json` on exit (Ctrl+C)

---

### 3. `scripts/test-bot-b-frontend.js` ✅

Puppeteer bot that attempts to automate the frontend:
- Loads frontend in headless browser
- Attempts to click button automatically
- Tests Turnstile bypass (should FAIL)
- Takes screenshots of results

```bash
FRONTEND_URL=https://... npm run test:bot-b
# Or watch it run (non-headless):
FRONTEND_URL=https://... HEADLESS=false npm run test:bot-b
```

**Output:**
- Stats to `test-deployment/bot-b-stats.json`
- Screenshots to `test-deployment/screenshots/`

---

### 4. `scripts/test-monitor.js` ✅

Real-time dashboard showing all players' stats:
- Game status (epoch, pool, difficulty)
- Current epoch info (clicks, leader)
- Player comparison table (on-chain stats)
- Live event feed (submissions, epoch changes)

```bash
npm run test:monitor
```

**Setup:** Create `test-deployment/players.json` with wallet addresses:
```json
{
  "botA": "0x...",
  "botB": "0x...",
  "human": "0x..."
}
```

---

### 5. `scripts/test-api-suite.js` (TODO)

Automated API testing - not yet created. For now, test APIs manually with curl.

---

## Schedule

### Day 0 (Setup)
- [ ] Morning: Deploy contracts, set up APIs
- [ ] Afternoon: Test all endpoints manually
- [ ] Evening: Start Bot A, verify it works

### Day 1
- [ ] 00:00 - Game starts (Epoch 1)
- [ ] 00:00 - Bot A running continuously
- [ ] 00:00 - Start Bot B, observe failures
- [ ] 09:00 - Human session 1 (2 hours clicking)
- [ ] 12:00 - Check metrics, epoch 6
- [ ] 15:00 - Human session 2 (1 hour clicking)
- [ ] 18:00 - Check metrics, epoch 9
- [ ] 21:00 - Human session 3 (1 hour clicking)
- [ ] 24:00 - End of Day 1, epoch 12

### Day 2
- [ ] 00:00 - Epoch 13 starts
- [ ] 09:00 - Human session 4 (verify streak works)
- [ ] 09:00 - Test NFT claims
- [ ] 12:00 - Check metrics, epoch 18
- [ ] 15:00 - Human session 5 (edge case testing)
- [ ] 18:00 - Check metrics, epoch 21
- [ ] 21:00 - Final human session
- [ ] 24:00 - Game ends (Epoch 24)

### Post-Test
- [ ] Export all metrics
- [ ] Compare Bot A vs Human results
- [ ] Document findings
- [ ] List bugs/issues found
- [ ] Prioritize fixes

---

## Success Criteria

### Must Pass (Critical)

- [ ] Contracts deploy and start successfully
- [ ] Human can click, mine, submit, earn tokens
- [ ] Milestones unlock at correct thresholds
- [ ] NFT claiming works with valid signatures
- [ ] Turnstile blocks automated API submissions
- [ ] Epoch transitions happen correctly
- [ ] Difficulty adjusts based on click volume
- [ ] 50/50 burn mechanism works

### Should Pass (Important)

- [ ] Bot A earns tokens but no off-chain rewards
- [ ] Bot B is blocked by Turnstile
- [ ] All API endpoints return correct data
- [ ] Leaderboard shows correct rankings
- [ ] Gas costs are reasonable
- [ ] No transaction failures

### Nice to Pass (Polish)

- [ ] UI feels responsive
- [ ] Achievement toasts look good
- [ ] NFT metadata displays on OpenSea
- [ ] No console errors in frontend
- [ ] All edge cases handled gracefully

---

## Bug Tracking

| ID | Description | Severity | Found In | Status |
|----|-------------|----------|----------|--------|
| | | | | |
| | | | | |
| | | | | |

---

## Notes

*Add observations, questions, and ideas during testing here*

---

## Dependencies

All dependencies are in `package.json`. Install with:

```bash
npm install
```

| Package | Purpose | Version |
|---------|---------|---------|
| hardhat | Smart contract development | ^2.19.0 |
| @openzeppelin/contracts | ERC1155, Ownable, etc. | ^5.0.0 |
| ethers | Blockchain interaction (via hardhat) | ^6.x |
| dotenv | Environment variables | ^16.3.1 |
| puppeteer | Browser automation (Bot B) | ^21.6.0 |
| js-sha3 | Keccak256 for mining | ^0.9.2 |

---

## File Structure

```
clickstr/
├── contracts/
│   ├── Clickstr.sol       # Main game contract
│   ├── ClickstrNFT.sol    # Achievement NFTs (ERC1155)
│   └── MockClickToken.sol      # Test token
├── scripts/
│   ├── test-deploy.js          # Deploy test environment
│   ├── test-bot-a-contract.js  # Contract miner bot
│   ├── test-bot-b-frontend.js  # Puppeteer frontend bot
│   └── test-monitor.js         # Real-time monitoring
├── test-deployment/            # Created by test-deploy.js
│   ├── deployment.json         # Contract addresses
│   ├── players.json            # Player wallet addresses
│   ├── bot-a-stats.json        # Bot A metrics
│   ├── bot-b-stats.json        # Bot B metrics
│   └── screenshots/            # Bot B screenshots
├── public/
│   └── index.html              # Frontend
├── TEST_PLAN.md                # This file
├── milestones-v2.csv           # All milestones + cursors
└── package.json                # Dependencies + scripts
```

