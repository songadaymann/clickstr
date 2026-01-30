# Contract Reference

How to query the StupidClicker contract state.

> **Note:** `ethers.js` can have issues with function selector encoding. `cast` from Foundry is more reliable for quick queries.

## Quick Status Check with Cast

```bash
# Set your RPC URL
RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
CONTRACT="0x8ac0facc097ba05d70fa5A480F334A28B0802c7e"  # Update per deployment

# Basic game stats
cast call $CONTRACT "getGameStats()" --rpc-url $RPC
# Returns: poolRemaining, currentEpoch, totalEpochs, gameStartTime, gameEndTime, difficultyTarget, gameStarted, gameEnded

# Current difficulty (higher = easier)
cast call $CONTRACT "difficultyTarget()(uint256)" --rpc-url $RPC

# Pool remaining
cast call $CONTRACT "poolRemaining()(uint256)" --rpc-url $RPC

# Current epoch
cast call $CONTRACT "currentEpoch()(uint256)" --rpc-url $RPC
```

## Epoch History with Cast

```bash
# Clicks per epoch (use totalClicksPerEpoch, NOT clicksPerEpoch which is per-user)
cast call $CONTRACT "totalClicksPerEpoch(uint256)(uint256)" 1 --rpc-url $RPC

# Check if epoch is finalized
cast call $CONTRACT "epochFinalized(uint256)(bool)" 1 --rpc-url $RPC

# Epoch winner
cast call $CONTRACT "epochWinner(uint256)(address)" 1 --rpc-url $RPC

# Loop through all epochs
for i in 1 2 3 4 5 6 7 8 9; do
  clicks=$(cast call $CONTRACT "totalClicksPerEpoch(uint256)(uint256)" $i --rpc-url $RPC)
  echo "Epoch $i: $clicks clicks"
done
```

## Key Mappings Reference

| Function | Signature | Returns |
|----------|-----------|---------|
| `totalClicksPerEpoch(uint256)` | Per-epoch total clicks | uint256 |
| `clicksPerEpoch(uint256,address)` | Per-user per-epoch clicks | uint256 |
| `epochFinalized(uint256)` | Is epoch done? | bool |
| `epochWinner(uint256)` | Winner address | address |
| `epochWinnerClicks(uint256)` | Winner's click count | uint256 |
| `epochDifficultyHistory(uint256)` | Difficulty at epoch end | uint256 |
| `epochEmissionBudget(uint256)` | Tokens available that epoch | uint256 |
| `epochEmissionUsed(uint256)` | Tokens distributed that epoch | uint256 |

## User Stats

```bash
# Get user lifetime stats
cast call $CONTRACT "getUserLifetimeStats(address)(uint256,uint256)" 0xYOUR_ADDRESS --rpc-url $RPC
# Returns: totalClicks, totalReward

# Get user stats for specific epoch
cast call $CONTRACT "clicksPerEpoch(uint256,address)(uint256)" 1 0xYOUR_ADDRESS --rpc-url $RPC
```

## Difficulty Reference Values

```
MAX EASY (game recovers from death spiral):
0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
= 57896044618658097711785492504343953926634992332820282019728792003956564819967

Starting difficulty (type(uint256).max / 1000):
= 115792089237316195423570985008687907853269984665640564039457584007913129639
```

When current difficulty equals MAX EASY, it means the death spiral prevention kicked in after zero-click epochs.

## GraphQL Queries (Goldsky Subgraph)

```graphql
# Leaderboard
{
  users(first: 10, orderBy: totalClicks, orderDirection: desc) {
    id
    totalClicks
    totalReward
    epochsWon
  }
}

# Global stats
{
  globalStats(id: "global") {
    totalClicks
    totalDistributed
    totalBurned
    uniqueUsers
    currentEpoch
  }
}

# Epoch details
{
  epochs(orderBy: number, orderDirection: asc) {
    number
    totalClicks
    totalDistributed
    winner { id }
    finalized
  }
}
```

**Endpoint (Sepolia v1.0.1):**
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/stupid-clicker-sepolia/1.0.1/gn
```

## Common Issues

### "Game has ended!" false positive
Check that you're reading `currentEpoch` correctly. The bot scripts had ABI issues where they were reading the wrong return value from `getGameStats()`.

### Difficulty seems stuck at max
This is normal after zero-click epochs. The death spiral prevention sets difficulty to MAX EASY so mining becomes trivial and the game can recover.

### Can't submit clicks
1. Check epoch hasn't ended (`currentEpoch` vs `TOTAL_EPOCHS`)
2. Check batch size (min 50, max 500)
3. Check proofs aren't already used
4. Check difficulty - proofs must be < `difficultyTarget`
