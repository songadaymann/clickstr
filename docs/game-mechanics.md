# Game Mechanics

## Duration (Configurable per Season)
- Default: **90 days** (90 epochs × 24 hours each)
- Test: 2 days (24 epochs × 2 hours each)
- Fixed end date creates urgency

## Daily Emission
- **2% of remaining pool** distributed each epoch
- Day 1: ~2,000,000 tokens gross
- Day 90: ~324,000 tokens gross
- Final day: All remaining pool (~16M) distributed

## The 50/50 Burn Mechanism

Every token claimed also burns a token:

```
User submits valid click batch
→ Contract calculates gross reward: 1,000 $CLICK
→ User receives: 500 $CLICK (50%)
→ Burned forever: 500 $CLICK (50%)
→ Same transaction, atomic
```

## Winner Bonus
- Top clicker each epoch gets 10% bonus
- Also 50/50 split
- Creates daily competition

## Finalizer Reward
- Anyone can call `finalizeEpoch()` after epoch ends
- Gets 1% of that epoch's distribution (full, not 50/50)
- Incentivizes epoch advancement

## Difficulty Adjustment (Bitcoin-style)
- Targets 1,000,000 clicks per day globally (scales with epoch duration)
- Adjusts up/down each epoch based on actual clicks
- Max 4x adjustment per epoch (prevents wild swings)
- More players = harder hashes = each click worth more
- Zero-click epochs trigger 4x ease (death spiral prevention)

## Proof-of-Work Formula

```
hash = keccak256(userAddress, nonce, epoch, chainId)
valid if: uint256(hash) < difficultyTarget
```

## Anti-Cheat (Built into PoW)
- Hash includes `msg.sender` → Can't steal others' proofs
- Hash includes `epoch` → Can't use old/future epoch proofs
- Hash includes `chainId` → No cross-chain replay
- `usedProofs[hash]` tracking → No replay attacks
- Contract verifies every proof on-chain

## Batch Submissions
- Min: 50 proofs per tx (gas efficiency)
- Max: 500 proofs per tx (gas limit)
- Users accumulate clicks client-side, submit when ready

## 1 Click = 1 Mining Operation

Each button press triggers mining. The button stays DOWN until a valid nonce is found, then pops UP and the click counts.

**Why this design:**
1. Makes each click meaningful - can't spam
2. Ties physical action to computation
3. Prevents "leave tab open" strategy
4. Creates tension - waiting for each click to land
5. Rewards active presence

## Scripts vs Human Clicking

Scripts are allowed - they still do computational work and pay gas. The difficulty adjusts proportionally. However:

**Gas Economics (Bot Deterrent):**
- 50/50 burn + gas costs create natural rate limiting
- Mindless botting is expensive
- Humans competitive (near-zero marginal cost)
- Optimal strategy: batch clicks, submit during low gas

## Key Contract Parameters

| Parameter | Value |
|-----------|-------|
| `EPOCH_DURATION` | Configurable (default 24 hours) |
| `TOTAL_EPOCHS` | Configurable (default 90) |
| `DAILY_EMISSION_RATE` | 2% (200 basis points) |
| `WINNER_BONUS_RATE` | 10% of daily |
| `FINALIZER_REWARD_RATE` | 1% of daily |
| `TARGET_CLICKS_PER_EPOCH` | Scales with duration (1M/day base) |
| `MAX_ADJUSTMENT_FACTOR` | 4x |
| `MIN_BATCH_SIZE` | 50 |
| `MAX_BATCH_SIZE` | 500 |
| `BURN_ADDRESS` | 0x000...dEaD |
