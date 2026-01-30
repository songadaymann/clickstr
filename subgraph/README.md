# Stupid Clicker Subgraph

Goldsky-hosted subgraph for indexing on-chain click activity from the StupidClicker contract.

## Overview

This subgraph tracks:
- **Users**: Lifetime stats (total clicks, rewards earned, epochs won)
- **ClickSubmissions**: Individual submission transactions
- **Epochs**: Per-epoch stats (participants, clicks, winners)
- **GlobalStats**: Aggregate totals across all time

## Setup

### Prerequisites

1. Install Goldsky CLI:
   ```bash
   curl -fsSL https://cli.goldsky.com/install | bash
   ```

2. Login to Goldsky:
   ```bash
   goldsky login
   ```
   Enter your API key when prompted (from `.env`: `GOLDSKY_API_KEY`)

### Deploy

```bash
cd subgraph
goldsky subgraph deploy stupid-clicker-sepolia/1.0.0 --path .
```

For mainnet (update `subgraph.yaml` first!):
```bash
goldsky subgraph deploy stupid-clicker-mainnet/1.0.0 --path .
```

## Updating for New Seasons

**IMPORTANT**: Each season deploys a new contract. Update `subgraph.yaml`:

1. Change `source.address` to the new contract address
2. Change `source.startBlock` to the deployment block
3. Change `network` if switching between sepolia/mainnet
4. Redeploy with a new version:
   ```bash
   goldsky subgraph deploy stupid-clicker-sepolia/1.1.0 --path .
   ```

## Example Queries

### Leaderboard (Top 10 by clicks)
```graphql
{
  users(first: 10, orderBy: totalClicks, orderDirection: desc) {
    id
    totalClicks
    totalReward
    epochsWon
  }
}
```

### Global Stats
```graphql
{
  globalStats(id: "global") {
    totalClicks
    totalDistributed
    totalBurned
    uniqueUsers
    currentEpoch
  }
}
```

### User Stats
```graphql
{
  user(id: "0x...address...") {
    totalClicks
    totalReward
    epochsParticipated
    epochsWon
    submissions(first: 10, orderBy: timestamp, orderDirection: desc) {
      validClicks
      reward
      epoch
      timestamp
    }
  }
}
```

### Epoch Summary
```graphql
{
  epoch(id: "1") {
    totalClicks
    participantCount
    winner
    winnerClicks
    finalized
  }
}
```

## GraphQL Endpoint

After deployment, your endpoint will be:
```
https://api.goldsky.com/api/public/<project-id>/subgraphs/stupid-clicker-sepolia/1.0.0/gn
```

Check the Goldsky dashboard for the exact URL.

## File Structure

```
subgraph/
├── schema.graphql      # Entity definitions
├── subgraph.yaml       # Data source config (CONTRACT ADDRESS HERE)
├── src/
│   └── mapping.ts      # Event handlers
├── abis/
│   └── StupidClicker.json
└── README.md
```
