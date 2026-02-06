# Clickstr V2 Transition

This document tracks the implementation progress of the V2 architecture transition.

## Overview

V2 moves from expensive on-chain proof validation to off-chain validation with on-chain settlement. Key benefits:
- ~95% gas savings per user interaction
- Human-only via Turnstile (no bots)
- Cross-season click accumulation for NFT eligibility
- Autonomous season deployment (no TokenWorks coordination needed)

---

## Completed Work

### Smart Contracts

All V2 contracts have been written and compile successfully.

#### 1. ClickRegistry (`contracts/ClickRegistry.sol`)
Permanent, canonical record of ALL clicks across ALL seasons.

**Key Features:**
- `totalClicks[user]` - Lifetime clicks per user
- `clicksPerSeason[user][season]` - Per-season breakdown
- `globalTotalClicks` - Global counter
- `authorizeGame(gameContract, season)` - Owner authorizes game contracts
- `recordClicks(user, season, clicks)` - Called by authorized games
- `seedHistoricalClicks(users[], clicks[], season)` - One-time S1 migration

**Design Decisions:**
- Deployed once, never replaced
- Only authorized game contracts can write
- Anyone can read (for NFT eligibility checks)

#### 2. ClickstrTreasury (`contracts/ClickstrTreasury.sol`)
Central treasury holding all $CLICK tokens for all seasons.

**Key Features:**
- Gets allowlisted by TokenWorks once
- `authorizeDisburser(gameContract, allowance)` - Owner authorizes season contracts
- `disburse(recipient, userAmount, burnAmount)` - Called by games for rewards
- `burn(amount)` - Burn unused epoch emissions
- Per-disburser allowance limits and tracking
- `totalDisbursedToUsers` / `totalBurned` statistics

**Design Decisions:**
- Eliminates need to coordinate with TokenWorks each season
- Enforces burn mechanics at disbursement level
- Allowances prevent runaway spending by compromised contracts

#### 3. ClickstrGameV2 (`contracts/ClickstrGameV2.sol`)
Per-season game contract with off-chain proof validation.

**Key Features:**
- `claimReward(epoch, clickCount, signature)` - Claim with server attestation
- `claimMultipleEpochs(epochs[], clickCounts[], signatures[])` - Batch claims
- `finalizeEpoch(epoch)` - End-of-epoch processing with winner bonus
- Signature format: `keccak256(address, epoch, clickCount, seasonNumber, contractAddress, chainId)`
- 50/50 burn split enforced on all distributions
- 10% winner bonus, 0.1% finalizer reward (50/50 split)
- **NFT tier bonus system** - holding achievement NFTs grants 2-10% reward bonus
  - `setAchievementNFT(address)` - set NFT contract reference
  - `setTierBonuses(tiers[], bonuses[])` - configure bonus percentages
  - `calculateBonus(address)` - query user's bonus
  - Bonus drawn from pool, capped at 50%, applied on every claim

**Gas Comparison:**
| Action | V1 | V2 |
|--------|----|----|
| Submit 500 clicks | ~10M gas (~$50-100) | N/A (off-chain) |
| Claim epoch reward | N/A | ~150k gas (~$0.75-1.50) |

#### 4. ClickstrNFTV2 (`contracts/ClickstrNFTV2.sol`)
Updated NFT contract that checks ClickRegistry for eligibility.

**Key Features:**
- Queries `registry.totalClicks(user)` for lifetime clicks
- On-chain click requirements for personal milestones (tiers 1-12)
- Still uses signature-based claiming for flexibility
- Cross-season click accumulation enabled

**Decision: Keep V1 NFT Contract**

We decided NOT to deploy ClickstrNFTV2 because:
- Friends already minted "First Timer" NFTs from V1 contract
- No 1/1 global milestones claimed yet
- V1 signature-based approach works fine
- Server can query registry for eligibility without contract change

### Deployment Scripts

#### `scripts/deploy-v2.js`
Full infrastructure deployment (one-time):
- Deploys Registry, Treasury, Game, and optionally NFT
- Funds treasury with initial tokens
- Authorizes game in registry and treasury
- Optionally seeds S1 historical data
- Starts the game

#### `scripts/deploy-v2-season.js`
Deploy new seasons using existing infrastructure:
- Deploys new ClickstrGameV2 only
- Authorizes in existing registry and treasury
- Starts the game

### Server API Updates

All server code is in the `mann-dot-cool` repository.

#### New: `/api/clickstr-v2.js`
Main V2 API endpoint for off-chain click tracking and claim signatures.

**POST - Submit Clicks:**
```javascript
// Request
{
  address: "0x...",
  nonces: ["123456...", "789012...", ...],  // PoW nonces
  turnstileToken: "..."  // Human verification
}

// Response
{
  success: true,
  validClicks: 450,
  invalidClicks: 50,
  epochClicks: 1250,
  seasonClicks: 3400,
  lifetimeClicks: 15400,  // Redis + Registry combined
  globalClicks: 892340,
  epoch: 2,
  rank: 7,
  newMilestones: [...],
  newAchievements: [...]
}
```

**POST with `action: "claim"` - Get Claim Signature:**
```javascript
// Request
{
  address: "0x...",
  action: "claim",
  epoch: 1
}

// Response
{
  success: true,
  signature: "0x...",
  epoch: 1,
  clickCount: 1250,
  seasonNumber: 2,
  contractAddress: "0x...",
  chainId: 1,
  claimData: {
    functionName: "claimReward",
    args: [1, 1250, "0x..."]
  }
}
```

**GET - Player Stats:**
- `?address=0x...` - Full player stats
- `?claimable=true&address=0x...` - List claimable epochs
- `?leaderboard=true` - Current epoch leaderboard

#### Updated: `/api/clickstr-claim-signature.js`
NFT claim signature endpoint now checks ClickRegistry for personal milestone eligibility.

**Changes:**
- Added `getRegistryClicks(address)` function to query on-chain registry
- Personal milestones (tiers 1-12) now check THREE sources:
  1. V1 Redis clicks (`clickstr:clicks:{addr}.totalClicks`)
  2. V2 Redis clicks (`clickstr:v2:total:{addr}`)
  3. On-chain Registry (`registry.totalClicks(address)`)
- Uses `max(v1 + v2Redis, registry)` to avoid double-counting
- Auto-marks milestones as unlocked when eligibility verified via clicks

**Example eligibility check log:**
```
[NFT Eligibility] 0xabc... tier 4: v1=800, v2Redis=300, registry=0, total=1100, required=1000
```

### Redis Key Schema (V2 additions)

```
# Per-user per-epoch clicks (for claim verification)
clickstr:v2:clicks:{addr}:{epoch}

# Per-user total clicks this season (unclaimed)
clickstr:v2:total:{addr}

# Per-epoch leaderboard (sorted set)
clickstr:v2:leaderboard:{epoch}

# Per-epoch total clicks
clickstr:v2:epoch-total:{epoch}

# Used nonces for deduplication
clickstr:v2:nonces:{addr}:{epoch}

# Issued claim signatures (prevents replay)
clickstr:v2:claim-issued:{addr}:{epoch}

# V2 global click counter
clickstr:v2:global-clicks

# Shared with V1 (unchanged)
clickstr:milestones:{addr}
clickstr:achievements:{addr}
clickstr:nft-eligible
clickstr:global-milestones
clickstr:click-log
```

---

## Environment Variables Required

```bash
# === V2 Contract Addresses (set after deployment) ===
CLICKSTR_GAME_V2_ADDRESS=0x...
CLICKSTR_REGISTRY_ADDRESS=0x...

# === Signing Keys ===
# For game claim attestations (new)
ATTESTATION_SIGNER_PRIVATE_KEY=0x...

# For NFT claims (existing, unchanged)
NFT_SIGNER_PRIVATE_KEY=0x...

# === Chain Configuration ===
CHAIN_ID=1                    # 1=mainnet, 11155111=sepolia
RPC_URL=https://...           # For reading contract state

# === Existing (unchanged) ===
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
TURNSTILE_SECRET_KEY=...
NFT_CONTRACT_ADDRESS=0x...
```

---

## Frontend V2 Claim Implementation (Feb 5, 2026)

The V2 token claim UI has been fully implemented.

### New Types (`src/types/api.ts`)
- `V2ClaimableEpoch` - Interface for individual epoch claim info (epoch, clicks, claimed, estimatedReward)
- `V2ClaimableEpochsResponse` - API response for fetching claimable epochs

### New API Functions (`src/services/api.ts`)
- `fetchV2ClaimableEpochs(address)` - Fetches claimable epochs from `/api/clickstr-v2?claimable=true`

### New Contract Functions (`src/services/contracts.ts`)
- `CLICKSTR_V2_ABI` - ABI for the V2 game contract (`claimReward`, `claimMultipleEpochs`, `hasClaimed`, etc.)
- `claimV2Reward(contractAddress, epoch, clickCount, signature)` - Calls the V2 contract's `claimReward` function
- `checkV2Claimed(contractAddress, userAddress, epoch)` - Checks if an epoch has been claimed

### New UI Components
- `#v2-claim-modal` (`index.html`) - Modal showing list of claimable epochs with individual claim buttons
- "Claim All" batch button for convenience
- "Claim" button in game status panel (displays count of claimable epochs)
- Full CSS styling in `src/styles/modals.css`

### New Functions (`src/main.ts`)
- `setupV2ClaimModalListeners()` - Event listeners for modal open/close
- `showV2ClaimModal()` - Opens modal and fetches claimable epochs from API
- `renderV2ClaimList()` - Renders the epoch list with claim buttons
- `handleV2ClaimSingle(e)` - Claims a single epoch:
  1. Gets attestation via `requestV2ClaimAttestation(epoch)`
  2. Handles Turnstile prompt if needed
  3. Signs wallet challenge if required
  4. Calls `claimV2Reward()` to submit on-chain transaction
- `handleV2ClaimAll()` - Claims all epochs sequentially
- `checkV2ClaimableEpochs()` - Runs on wallet connect, shows/hides claim button

### User Flow
1. User connects wallet → `checkV2ClaimableEpochs()` checks for claimable epochs
2. If found, "Claim (N)" button appears next to Pool info in game status panel
3. User clicks → modal opens with list of claimable epochs
4. User clicks "Claim" on an epoch → full attestation + contract flow
5. UI updates to show "Claimed!" and removes from list
6. "Claim All" available for batch claiming

---

## Remaining Work

### Before Deployment

1. **Test contracts on Sepolia**
   - Deploy full V2 stack
   - Test claim flow end-to-end
   - Verify gas costs

2. ~~**Update frontend**~~ ✅ DONE (Feb 5, 2026)
   - ~~Add claim UI for epochs~~
   - ~~Update click submission to use V2 API~~
   - ~~Show claimable epochs and estimated rewards~~

3. **Seed S1 historical data**
   - Export S1 click data from subgraph/Redis
   - Call `registry.seedHistoricalClicks()` after deployment

### Deployment Checklist

1. Deploy ClickRegistry
2. Deploy ClickstrTreasury
3. Get Treasury allowlisted by TokenWorks
4. Transfer $CLICK to Treasury
5. Deploy ClickstrGameV2 for Season 2
6. Authorize game in Registry and Treasury
7. Seed S1 data to Registry
8. Update server env vars
9. Update frontend config
10. Start game

### Future Seasons

For Season 3+, only need to:
1. Deploy new ClickstrGameV2
2. `registry.authorizeGame(newGame, seasonNumber)`
3. `treasury.authorizeDisburser(newGame, allowance)`
4. Update frontend/server config
5. Start game

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Click   │  │  Mine    │  │  Submit  │  │  Claim   │        │
│  │  Button  │→ │  PoW     │→ │  to API  │→ │  Reward  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                    │               │
                                    ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          SERVER                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   /api/clickstr-v2   │    │ /api/clickstr-claim- │          │
│  │                      │    │     signature        │          │
│  │  • Turnstile verify  │    │                      │          │
│  │  • PoW validation    │    │  • Check Registry    │          │
│  │  • Nonce dedup       │    │  • Check Redis       │          │
│  │  • Redis storage     │    │  • Sign attestation  │          │
│  │  • Achievement check │    │                      │          │
│  └──────────────────────┘    └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐    ┌─────────────────────────────────────┐
│       REDIS         │    │            BLOCKCHAIN               │
│                     │    │                                     │
│  • Click counts     │    │  ┌─────────────┐  ┌─────────────┐  │
│  • Leaderboards     │    │  │  Treasury   │  │  Registry   │  │
│  • Achievements     │    │  │             │  │             │  │
│  • Used nonces      │    │  │  $CLICK     │  │  Lifetime   │  │
│  • Sessions         │    │  │  tokens     │  │  clicks     │  │
│                     │    │  └─────────────┘  └─────────────┘  │
└─────────────────────┘    │         │                │         │
                           │         ▼                │         │
                           │  ┌─────────────┐         │         │
                           │  │  GameV2     │←────────┘         │
                           │  │             │                   │
                           │  │  • Claims   │                   │
                           │  │  • Epochs   │                   │
                           │  │  • Burns    │                   │
                           │  └─────────────┘                   │
                           │         │                          │
                           │         ▼                          │
                           │  ┌─────────────┐                   │
                           │  │  NFT (V1)   │                   │
                           │  │             │                   │
                           │  │  Milestones │                   │
                           │  └─────────────┘                   │
                           └─────────────────────────────────────┘
```

---

## Change Log

| Date | Change |
|------|--------|
| 2024-02-04 | Initial V2 architecture doc written |
| 2024-02-04 | ClickRegistry contract created |
| 2024-02-04 | ClickstrTreasury contract created |
| 2024-02-04 | ClickstrGameV2 contract created |
| 2024-02-04 | ClickstrNFTV2 contract created (decided not to deploy) |
| 2024-02-04 | deploy-v2.js and deploy-v2-season.js scripts created |
| 2024-02-04 | /api/clickstr-v2.js endpoint created |
| 2024-02-04 | /api/clickstr-claim-signature.js updated with Registry integration |
| 2026-02-05 | V2 contract security fixes: Treasury burn ratio, Registry season validation, max click count, 72-hour claim grace period, finalizer reward 50/50 split at 0.1% |
| 2026-02-05 | Frontend V2 claim UI implemented: modal, API functions, contract interaction |
| 2026-02-05 | Contract: Claims now blocked for finalized epochs (no late claiming) |
| 2026-02-05 | Server: Off-season clicking enabled with Turnstile required; clicks count toward lifetime NFT milestones but not epoch rewards |
| 2026-02-05 | Config: Network now set via `VITE_NETWORK` env var instead of hardcoded value |
| 2026-02-06 | Contract: NFT tier bonus system ported from V1 — `setAchievementNFT()`, `setTierBonuses()`, `calculateBonus()`, bonus applied in `claimReward()` and `claimMultipleEpochs()` |
| 2026-02-06 | Contract: Refactored claim internals for stack depth — `_verifyAttestation()`, `_distributeReward()`, `_processEpochClaim()`, `_processMultiClaim()` |
| 2026-02-06 | Deploy scripts: `deploy-v2.js` and `deploy-v2-season.js` now configure NFT bonuses before `startGame()` |
