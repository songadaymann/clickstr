# Clickstr V2 Architecture

## Motivation

Season 1 revealed a critical UX problem: **on-chain proof submission is too expensive**.

Each `submitClicks()` call costs ~$5-50 in gas because the contract:
- Loops through 50-500 nonces
- Writes each used proof hash to storage (~20,000 gas per SSTORE)
- Total: 2-10M gas per submission

This makes the game prohibitively expensive for casual players.

## Design Goals

1. **Dramatically reduce gas costs** for human players
2. **Maintain permanent on-chain record** of all clicks
3. **Remove bot access** - make it a human-only game
4. **Simplify cross-season continuity** with a canonical registry

## The New Philosophy

> **Clickstr: Proof-of-Human-Work**
>
> Click the button. Earn real crypto. No bots allowed.
>
> Every token earned required a real human clicking a real button.

V1 allowed bots because it seemed inevitable. V2 embraces human-only gameplay as a *feature*. Turnstile verification + server attestation isn't just anti-cheat - it's the core mechanic.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ClickRegistry (Permanent)                           │
│                                                                             │
│  • Canonical record of ALL clicks across ALL seasons                        │
│  • Single address forever                                                   │
│  • Authorized game contracts can write                                      │
│  • Anyone can read                                                          │
│  • NFT contract checks eligibility here                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                    ▲                           ▲
                    │ recordClicks()            │ recordClicks()
                    │                           │
         ┌──────────────────────┐    ┌──────────────────────┐
         │   Season 1 Contract  │    │   Season 2 Contract  │    ...
         │   (ClickstrGame)     │    │   (ClickstrGame)     │
         │                      │    │                      │
         │  • Token distribution│    │  • Token distribution│
         │  • Epoch management  │    │  • Epoch management  │
         │  • 50/50 burn        │    │  • 50/50 burn        │
         │  • Winner bonuses    │    │  • Winner bonuses    │
         └──────────────────────┘    └──────────────────────┘
                    ▲                           ▲
                    │ claimReward()             │ claimReward()
                    │ (with server signature)   │
                    │                           │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Server (mann.cool)                                  │
│                                                                             │
│  • Validates Turnstile (human verification)                                 │
│  • Validates PoW proofs off-chain                                           │
│  • Tracks clicks in Redis                                                   │
│  • Signs attestations for claims                                            │
│  • Manages leaderboards                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                    ▲
                    │ POST /api/clickstr
                    │ (proofs + turnstile token)
                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Browser (clickstr.fun)                              │
│                                                                             │
│  • User clicks button                                                       │
│  • WebWorker mines PoW proofs                                               │
│  • Sends proofs to server (NOT blockchain)                                  │
│  • Requests claim signature when ready                                      │
│  • Submits ONE tx to claim rewards                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## User Flow

### Clicking (Off-Chain)

```
1. User connects wallet, passes Turnstile verification
2. User clicks button
3. WebWorker mines valid PoW proof
4. Frontend POSTs proof to mann.cool/api/clickstr
5. Server validates:
   - Turnstile session is valid
   - PoW hash meets difficulty target
   - Proof hasn't been used before
6. Server stores click in Redis, updates leaderboard
7. Server returns updated stats to frontend
8. Repeat...
```

### Claiming Rewards (On-Chain)

```
1. User clicks "Claim Rewards" in UI
2. Frontend requests signature from server:
   POST /api/clickstr/claim-reward
   { address, epoch }
3. Server returns:
   { signature, clickCount, epoch }
4. Frontend submits tx to game contract:
   claimReward(epoch, clickCount, signature)
5. Contract verifies signature, calculates reward
6. Contract records clicks to ClickRegistry
7. Contract does 50/50 burn, transfers tokens to user
```

---

## Contract: ClickstrTreasury

Holds all $CLICK tokens and handles disbursement. Allowlisted by TokenWorks once.

### Why?

TokenWorks requires allowlisting for any contract that transfers $CLICK. Without a treasury:
- Every new season contract needs manual allowlisting
- Requires coordinating with TokenWorks admin (Adam)
- Delays and planning overhead

With a treasury:
- Treasury gets allowlisted once
- New season contracts are authorized by *you* (no external coordination)
- Full autonomy for future seasons

### State

```solidity
IERC20 public immutable clickToken;
address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

// Contracts authorized to request disbursements
mapping(address => bool) public authorizedDisbursers;

// Track per-disburser limits (optional safety)
mapping(address => uint256) public disburserAllowance;

address public owner;
```

### Functions

```solidity
// Called by authorized game contracts to send rewards
function disburse(
    address recipient,
    uint256 userAmount,
    uint256 burnAmount
) external onlyAuthorizedDisburser {
    clickToken.safeTransfer(recipient, userAmount);
    clickToken.safeTransfer(BURN_ADDRESS, burnAmount);

    emit Disbursed(msg.sender, recipient, userAmount, burnAmount);
}

// Admin: authorize a new season's game contract
function authorizeDisburser(address disburser) external onlyOwner {
    authorizedDisbursers[disburser] = true;
    emit DisburserAuthorized(disburser);
}

// Admin: revoke a game contract (emergency)
function revokeDisburser(address disburser) external onlyOwner {
    authorizedDisbursers[disburser] = false;
    emit DisburserRevoked(disburser);
}

// Admin: withdraw tokens (for moving to new treasury, emergencies)
function withdraw(address to, uint256 amount) external onlyOwner {
    clickToken.safeTransfer(to, amount);
}
```

### Architecture with Treasury

```
┌─────────────────────────────────────────────────────────────┐
│            ClickstrTreasury (Allowlisted by TokenWorks)     │
│                                                             │
│  • Holds ALL $CLICK tokens for ALL seasons                  │
│  • Authorized disbursers can request transfers              │
│  • You control who gets authorized (no Adam needed)         │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ disburse(user, amount, burn)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Season 2        Season 3        Season N
    Game Contract   Game Contract   Game Contract
    (authorized)    (authorized)    (authorized)
```

### Funding the Treasury

1. Transfer $CLICK from your Safe to the Treasury
2. Treasury holds the full game pool (e.g., 97M remaining tokens)
3. Each season contract has a `poolRemaining` that tracks its allocation
4. Season contracts call `treasury.disburse()` but the Treasury is the actual source

---

## Contract: ClickRegistry

The permanent, canonical record of all clicks.

### State

```solidity
// Lifetime clicks per user (across all seasons)
mapping(address => uint256) public totalClicks;

// Clicks per user per season
mapping(address => mapping(uint256 => uint256)) public clicksPerSeason;

// Global statistics
uint256 public globalTotalClicks;
uint256 public totalSeasons;

// Access control
mapping(address => bool) public authorizedGames;
mapping(address => uint256) public gameToSeason;
address public owner;
```

### Functions

```solidity
// Called by authorized game contracts when users claim
function recordClicks(
    address user,
    uint256 season,
    uint256 clicks
) external onlyAuthorizedGame;

// Admin: authorize a new season's game contract
function authorizeGame(
    address gameContract,
    uint256 season
) external onlyOwner;

// Admin: revoke a game contract (emergency only)
function revokeGame(address gameContract) external onlyOwner;
```

### Events

```solidity
event ClicksRecorded(
    address indexed user,
    uint256 indexed season,
    uint256 clicks,
    address indexed gameContract
);

event GameAuthorized(address indexed game, uint256 indexed season);
event GameRevoked(address indexed game);
```

### Design Notes

- **Append-only**: Games can only add clicks, never remove or modify
- **Transparent**: Anyone can see which contracts are authorized
- **Simple**: Minimal logic, maximum reliability
- **Forever**: This contract address never changes

---

## Contract: ClickstrGame (Per-Season)

Each season deploys a new game contract. Handles token distribution, epochs, and game mechanics.

### Key Differences from V1

| Aspect | V1 | V2 |
|--------|----|----|
| Proof validation | On-chain loop | Off-chain (server) |
| Entry point | `submitClicks(nonces[])` | `claimReward(epoch, clicks, sig)` |
| Bot access | Full | None |
| Gas per interaction | ~2-10M | ~100-150k |
| Click storage | In game contract | In ClickRegistry |

### State

```solidity
// External contracts
IERC20 public immutable clickToken;
IClickRegistry public immutable registry;
address public attestationSigner;

// Season configuration
uint256 public immutable SEASON_NUMBER;
uint256 public immutable TOTAL_EPOCHS;
uint256 public immutable EPOCH_DURATION;

// Game state (similar to V1)
uint256 public gameStartTime;
uint256 public currentEpoch;
uint256 public poolRemaining;
bool public gameStarted;
bool public gameEnded;

// Claim tracking (replaces per-proof tracking)
mapping(address => mapping(uint256 => bool)) public claimed;

// Epoch stats (still needed for winner determination)
mapping(uint256 => uint256) public totalClicksPerEpoch;
mapping(uint256 => address) public epochWinner;
mapping(uint256 => uint256) public epochWinnerClicks;
mapping(uint256 => bool) public epochFinalized;
```

### Core Function: claimReward

```solidity
function claimReward(
    uint256 epoch,
    uint256 clickCount,
    bytes calldata signature
) external nonReentrant {
    // Validation
    require(gameStarted, "Game not started");
    require(epoch >= 1 && epoch <= TOTAL_EPOCHS, "Invalid epoch");
    require(epoch <= currentEpoch, "Epoch not started");
    require(!claimed[msg.sender][epoch], "Already claimed");
    require(clickCount > 0, "No clicks");

    // Verify server attestation
    bytes32 message = keccak256(abi.encodePacked(
        msg.sender,
        epoch,
        clickCount,
        SEASON_NUMBER,
        address(this),
        block.chainid
    ));
    bytes32 ethSignedMessage = keccak256(abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        message
    ));
    require(recoverSigner(ethSignedMessage, signature) == attestationSigner, "Invalid signature");

    // Mark claimed
    claimed[msg.sender][epoch] = true;

    // Update epoch stats
    totalClicksPerEpoch[epoch] += clickCount;

    // Update winner tracking
    if (clickCount > epochWinnerClicks[epoch]) {
        epochWinner[epoch] = msg.sender;
        epochWinnerClicks[epoch] = clickCount;
    }

    // Record to permanent registry
    registry.recordClicks(msg.sender, SEASON_NUMBER, clickCount);

    // Calculate and distribute reward (same 50/50 logic as V1)
    uint256 reward = calculateReward(epoch, clickCount);
    uint256 userAmount = reward / 2;
    uint256 burnAmount = reward - userAmount;

    poolRemaining -= reward;

    clickToken.safeTransfer(msg.sender, userAmount);
    clickToken.safeTransfer(BURN_ADDRESS, burnAmount);

    emit RewardClaimed(msg.sender, epoch, clickCount, userAmount, burnAmount);
}
```

### Epoch & Winner Logic

Epochs work similarly to V1, but:
- **No auto-finalization on submit** (since there's no submitClicks)
- **Server tracks real-time leaderboard** in Redis
- **Finalization** still happens on-chain (anyone can call)
- **Winner determination** uses on-chain `epochWinnerClicks` (updated at claim time)

Note: This means the winner is whoever has the most clicks *at finalization time*. Late claims could change the winner before finalization.

### Epoch Finalization

```solidity
function finalizeEpoch(uint256 epoch) external nonReentrant {
    require(gameStarted, "Game not started");
    require(!epochFinalized[epoch], "Already finalized");
    require(block.timestamp >= epochEndTime(epoch), "Epoch not over");

    epochFinalized[epoch] = true;

    // Winner bonus (same as V1 - 10% of distributed, 50/50 split)
    address winner = epochWinner[epoch];
    if (winner != address(0)) {
        // ... winner bonus logic
    }

    // Finalizer reward (1%, no split)
    // ... finalizer logic

    // Burn unused emission
    // ... burn logic

    // Advance epoch
    if (epoch == currentEpoch && currentEpoch < TOTAL_EPOCHS) {
        currentEpoch++;
    }

    emit EpochFinalized(...);
}
```

---

## Contract: ClickstrNFT (Updated)

The NFT contract now checks the ClickRegistry for eligibility instead of individual game contracts.

### Key Change

```solidity
// Old: Check specific game contract
function checkEligibility(address user, uint256 tier) internal view returns (bool) {
    return gameContract.totalUserClicks(user) >= milestoneThreshold[tier];
}

// New: Check permanent registry
function checkEligibility(address user, uint256 tier) internal view returns (bool) {
    return registry.totalClicks(user) >= milestoneThreshold[tier];
}
```

### Benefits

- **Cross-season accumulation**: 500k clicks across 5 seasons still counts
- **Simpler configuration**: NFT contract doesn't need to know about each game
- **Future-proof**: New seasons automatically count toward milestones

---

## Server API Changes

### POST /api/clickstr (Updated)

Now the primary way clicks are recorded.

```typescript
// Request
{
  address: string;
  nonce: string;          // The mined nonce
  epoch: number;          // Current epoch
  turnstileToken?: string; // Required if session expired
}

// Server validates:
// 1. Turnstile session valid (or new token provided)
// 2. PoW: keccak256(address, nonce, epoch, chainId) < difficultyTarget
// 3. Nonce not already used (Redis set)

// Response
{
  success: true;
  totalClicks: number;     // User's total this epoch
  sessionClicks: number;   // This session
  rank: number;            // Current leaderboard position
  estimatedReward: string; // Estimated $CLICK earnings
}
```

### POST /api/clickstr/claim-reward (New)

Request a signature to claim on-chain rewards.

```typescript
// Request
{
  address: string;
  epoch: number;
}

// Server checks:
// 1. Epoch is claimable (ended or current)
// 2. User has unclaimed clicks for this epoch
// 3. User hasn't already received a signature for this epoch

// Response
{
  signature: string;
  clickCount: number;
  epoch: number;
  contractAddress: string;
  chainId: number;
}
```

### GET /api/clickstr (Updated)

```typescript
// Query params
?address=0x...           // Get user stats
?leaderboard=true        // Get current leaderboard
?epoch=N                 // Specific epoch stats
?claimable=true&address= // Get claimable epochs for user

// New response fields
{
  claimableEpochs: [
    { epoch: 1, clicks: 500, claimed: false },
    { epoch: 2, clicks: 1200, claimed: false }
  ]
}
```

---

## Gas Cost Comparison

| Action | V1 | V2 |
|--------|----|----|
| Submit 100 clicks | ~2M gas (~$10-20) | N/A (off-chain) |
| Submit 500 clicks | ~10M gas (~$50-100) | N/A (off-chain) |
| Claim epoch rewards | N/A | ~150k gas (~$0.75-1.50) |
| Mint NFT | ~100k gas | ~100k gas (unchanged) |

**User savings: 90-95% reduction in gas costs**

---

## Migration Considerations

### Season 1 Data

Season 1 used the V1 contract. Options:
1. **Snapshot and seed**: Read S1 data, seed into ClickRegistry at deployment
2. **Parallel tracking**: ClickRegistry starts fresh, S1 data lives in old contract
3. **Hybrid**: Registry has `addHistoricalClicks()` function for one-time migration

Recommendation: **Option 1** - snapshot S1 totals into registry at deployment. This gives users their full history from day one.

### NFT Eligibility

Current NFT holders keep their NFTs. Future milestone checks use registry totals, which will include S1 data after migration.

### Difficulty

V2 doesn't need on-chain difficulty adjustment (server controls it). But for transparency:
- Server publishes current difficulty
- Difficulty still adjusts based on clicks per epoch
- Frontend displays it
- It's just not enforced on-chain

---

## Security Considerations

### Trust Model

| Component | V1 Trust | V2 Trust |
|-----------|----------|----------|
| Proof validation | Trustless (on-chain) | Server |
| Click counting | Trustless (on-chain) | Server |
| Token distribution | Trustless (on-chain) | Trustless (on-chain) |
| Attestation signing | N/A | Server |
| Permanent record | On-chain | On-chain (registry) |

**V2 requires trusting the server** to:
- Honestly validate proofs
- Accurately count clicks
- Not forge attestations

**V2 remains trustless** for:
- Token distribution (contract enforces 50/50 burn)
- Permanent record (registry is on-chain)
- NFT claims (signature verification on-chain)

### Attack Vectors

| Attack | Mitigation |
|--------|------------|
| Server forges clicks | Server compromise would be detectable; registry is append-only |
| Replay attestation | Signature includes epoch, user, contract address, chainId |
| Double-claim | `claimed[user][epoch]` mapping on-chain |
| Bot bypass | Turnstile required; no direct contract interaction |

### Key Rotation

If attestation signer key is compromised:
1. Deploy new game contract with new signer
2. Revoke old contract's registry authorization
3. Users claim remaining rewards from old contract (if any)

---

## Deployment Checklist

### ClickRegistry (One-Time)
- [ ] Deploy ClickRegistry
- [ ] Transfer ownership to multisig (optional)
- [ ] Seed historical S1 data (if migrating)
- [ ] Verify on Etherscan

### Per-Season (ClickstrGame)
- [ ] Deploy ClickstrGame with registry address
- [ ] Authorize game in registry
- [ ] Set attestation signer
- [ ] Transfer tokens to contract
- [ ] Start game
- [ ] Update frontend config
- [ ] Update server config

### ClickstrNFT (Update)
- [ ] Update to point at ClickRegistry (or deploy new)
- [ ] Verify milestone thresholds use registry

---

## Design Decisions

### Claim Timing: Before Finalization

Users can claim **during an epoch or after it ends, but before finalization**. Once an epoch is finalized, claims for that epoch are blocked.

Rationale:
- Simpler economics - unused emission is burned at finalization, no ambiguity about late claims
- Clear deadline creates urgency
- Winner state is locked at finalization, preventing post-finalization manipulation

**Winner determination note**: The epoch winner is whoever has the most claimed clicks when the epoch is finalized. The UI should make it obvious when claims are due.

### Off-Season Clicking

Users can click even when no season is active:
- Turnstile (human verification) is still required
- Clicks count toward lifetime total (for NFT milestones)
- Clicks do NOT count toward epoch leaderboards or token rewards
- Uses epoch 0 for PoW validation and nonce deduplication

This ensures the game is always "playable" for NFT progress, even between seasons.

### Multi-Epoch Claims: Yes

Users can claim multiple epochs in a single transaction via `claimMultipleEpochs()`. This:
- Saves gas for users who missed claiming for a while
- Simplifies the "claim all" UX
- Server returns all claimable epochs in one signature bundle

### Difficulty Display: Same UX, Different Source

Difficulty display in the UI stays the same - just changes where we read it from:
- **V1**: Read from contract `difficultyTarget`
- **V2**: Read from server API `/api/clickstr?difficulty=true`

Server still adjusts difficulty based on clicks per epoch (same algorithm), it's just computed off-chain now.

### No Emergency Pause

No pause function. Rationale:
- Goes against the ethos of the game
- If something breaks, we deploy a new season contract
- Users can always claim what they've earned up to that point

---

## Season 1 Transition

### The Situation

Season 1 (V1 contract) launched with 3M tokens. Due to high gas costs, adoption was limited. A few friends clicked and submitted, receiving small amounts of tokens.

### The Decision

**Let Season 1 run its course.** The remaining tokens will burn when the season ends (Feb 7, 2026).

This is fine because:
- The friends who clicked **already received their tokens** via the V1 `submitClicks()` function
- Their tokens are theirs - the 50/50 burn happened, they got their share
- Those on-chain clicks are permanently recorded in the V1 contract

### What About Their Click History?

The V1 contract has their click counts in `totalUserClicks[address]`. Options:

**Option A: Seed Registry from V1 Data**
- At registry deployment, read V1 click totals for known addresses
- Call `seedHistoricalClicks(addresses[], clicks[])` one-time function
- Their S1 clicks count toward lifetime NFT milestones

**Option B: Start Fresh**
- Registry starts at zero
- V1 clicks don't count toward registry totals
- Simpler, but those early clicks "don't count" for NFTs

**Recommendation: Option A** - Honor the early adopters. They paid painful gas fees to play. Their clicks should count.

Implementation:
```solidity
// One-time function, callable only by owner, only once
function seedHistoricalClicks(
    address[] calldata users,
    uint256[] calldata clicks,
    uint256 season
) external onlyOwner {
    require(!historicalSeeded[season], "Already seeded");
    historicalSeeded[season] = true;

    for (uint256 i = 0; i < users.length; i++) {
        totalClicks[users[i]] += clicks[i];
        clicksPerSeason[users[i]][season] += clicks[i];
        globalTotalClicks += clicks[i];
    }

    emit HistoricalClicksSeeded(season, users.length);
}
```

### Migration Checklist

1. [ ] Wait for S1 to end (Feb 7, 2026)
2. [ ] Query V1 contract for all `totalUserClicks` values
3. [ ] Deploy ClickRegistry
4. [ ] Call `seedHistoricalClicks()` with S1 data
5. [ ] Deploy S2 game contract
6. [ ] Authorize S2 in registry
7. [ ] Update frontend to V2

---

## Summary

V2 is a significant architectural shift from "trustless on-chain validation" to "off-chain validation with on-chain settlement." This trade-off:

**Gains:**
- 90-95% gas cost reduction
- Human-only gameplay (bots excluded)
- Permanent cross-season click registry
- Better UX (click freely, claim when ready)

**Costs:**
- Server becomes trusted for click validation
- More complex infrastructure (server must be reliable)
- Attestation key management

The permanent ClickRegistry ensures that even as the trust model changes, the *record* of clicks remains trustless and on-chain forever.
