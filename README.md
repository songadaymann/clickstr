# STUPID CLICKER

> The stupidest deflationary game on Ethereum.
> 
> Click the button. Get tokens. Burn tokens.

## Overview

Stupid Clicker is a proof-of-work clicking game built on Ethereum mainnet. Every click mines a valid hash, and when you submit your clicks to the blockchain:

- **50% of tokens go to you**
- **50% of tokens are burned forever**

The more you play, the scarcer $CLICK becomes.

## Tokenomics

| Allocation | Amount | Purpose |
|------------|--------|---------|
| Recursive Strategy Pool | 890,000,000 | TokenWorks flywheel (8% burn on trades) |
| Stupid Clicker Pool | 100,000,000 | Mining rewards (50% distributed, 50% burned) |
| Creator | 10,000,000 | Aligned incentives |
| **Total Supply** | **1,000,000,000** → **950,000,000** after game |

## Game Mechanics

### Duration
- **90 days** (90 epochs)
- Each epoch = 24 hours

### Daily Rewards
- **2% of remaining pool** distributed each epoch
- Day 1: ~2,000,000 tokens available
- Day 90: ~324,000 tokens available

### 50/50 Burn
Every token distributed also burns a token:
- You submit 100 valid clicks
- Contract calculates your reward: 1,000 $CLICK
- You receive: 500 $CLICK
- Burned forever: 500 $CLICK

### Winner Bonus
The top clicker each day gets a 10% bonus (also 50/50 split).

### Difficulty Adjustment
Like Bitcoin, difficulty adjusts each epoch to target ~1,000,000 total clicks per day. More players = harder hashes = each click worth more.

### Finalizer Reward
Anyone can finalize an epoch after 24h and gets 1% of that epoch's distribution.

## How to Play

1. **Connect wallet** on Ethereum mainnet
2. **Click the button** - your browser mines valid hashes in the background
3. **Accumulate at least 50 clicks** (gas efficiency)
4. **Submit to chain** - pay gas once, receive rewards instantly
5. **Compete** to be the daily winner!

## Technical Details

### Proof-of-Work

Each "click" requires finding a nonce where:

```
keccak256(userAddress, nonce, epoch, chainId) < difficultyTarget
```

Mining happens in a WebWorker, keeping the UI responsive.

### Batch Submissions

To save gas, clicks are batched:
- Minimum: 50 proofs per submission
- Maximum: 500 proofs per submission

### Smart Contract

The core contract handles:
- Proof verification (batch)
- Epoch management
- Difficulty adjustment (Bitcoin-style, max 4x per epoch)
- 50/50 distribution + burn
- Winner tracking
- Leaderboard state

## Development

### Prerequisites

- Node.js 18+
- Hardhat

### Setup

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy

```bash
# Set environment variables
export MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
export PRIVATE_KEY="your_private_key"
export CLICK_TOKEN_ADDRESS="0x..."  # $CLICK token from TokenWorks

# Deploy
npm run deploy:mainnet
```

### After Deployment

1. Approve the contract to spend your $CLICK:
   ```solidity
   clickToken.approve(contractAddress, 100_000_000 * 10**18)
   ```

2. Start the game:
   ```solidity
   stupidClicker.startGame(100_000_000 * 10**18)
   ```

## Contract Architecture

```
StupidClicker.sol
├── submitClicks(nonces[])     // Submit batch of valid proofs
├── finalizeEpoch(epoch)       // End epoch, pay winner + finalizer
├── getCurrentEpochInfo()      // Epoch stats
├── getUserEpochStats(user)    // User's current epoch performance
├── getUserLifetimeStats(user) // All-time stats
├── getGameStats()             // Overall game state
└── isValidProof(...)          // Check if a proof would be valid
```

## Frontend

The frontend is a React component using:
- **wagmi** for wallet connection
- **WebWorker** for background mining
- **viem** for contract interactions

Key files:
- `frontend/StupidClicker.jsx` - Main UI component
- `frontend/miner.worker.js` - Background mining worker

## The Flywheel

```
┌─────────────────────────────────────────────────────┐
│  STUPID CLICKER                                      │
│  └── Clicks distribute + burn tokens                 │
│                                                      │
│  TOKEN STRATEGY RECURSIVE POOL                       │
│  └── Every trade burns 8%                            │
│                                                      │
│  COMBINED EFFECT:                                    │
│  └── Activity = Deflation                            │
│  └── More play = More burn = Scarcer token           │
└─────────────────────────────────────────────────────┘
```

## FAQ

**Q: Is this a rug?**
A: No. It's a game. The contract is open source. Tokens are distributed via proof-of-work. The creator has 1% aligned incentives.

**Q: Can I use a bot?**
A: Sure! But difficulty adjusts. More hashpower = harder puzzles = same emission rate. You can't break the math.

**Q: What happens after 90 days?**
A: Game ends. Remaining pool is burned. The token continues as a pure TokenWorks recursive strategy.

**Q: Why is it called Stupid Clicker?**
A: Because it is.

## License

MIT

---

*The more you play, the rarer it gets.*

