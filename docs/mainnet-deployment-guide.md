# Mainnet Deployment Guide

This guide documents the complete deployment flow for Clickstr, based on the Sepolia v6 dry run (Feb 3, 2026).

## Overview

The deployment involves multiple wallets and a two-phase process to mimic the TokenWorks token distribution flow:

**Wallets:**
- **NFT Deployer/Signer** (`NFT_DEPLOYER_KEY`): Deploys NFT contract, deploys token, owns NFT contract, signs NFT claims
- **Safe Wallet**: Multi-sig that holds the token reserve (100M for game pool)
- **Game Deployer** (`MAINNET_PRIVATE_KEY`): Deploys Clickstr contract, starts the game

**Token Flow:**
```
NFT Deployer mints 1B tokens
    │
    ├── 100M → Safe Wallet (game reserve)
    │              │
    │              └── 3-10M → Game Deployer (season pool)
    │
    └── 900M → Recursive Strategy Pool (TokenWorks)
```

---

## Prerequisites

### Environment Variables (.env)

```bash
# Deployment keys
NFT_DEPLOYER_KEY=0x...      # Deploys NFT + token, signs NFT claims
MAINNET_PRIVATE_KEY=0x...   # Deploys game contract

# RPC URLs
ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...

# Verification
ETHERSCAN_API_KEY=...

# Subgraph
GOLDSKY_API_KEY=...
```

### Wallet Addresses

| Wallet | Address | Purpose |
|--------|---------|---------|
| NFT Deployer | `0xf55E4fac663ad8db80284620F97D95391ab002EF` | Deploy NFT, sign claims |
| Safe Wallet | `0x4890c268170a51d7864d4F879E73AC24A0415810` | Token reserve |
| Game Deployer | `0x73468BD5fDD81b6e0c583bB5bb38534684c8DFe0` | Deploy game |

### Funding Requirements

- NFT Deployer: ~0.01 ETH (NFT contract + token deployment)
- Game Deployer: ~0.01 ETH (Clickstr deployment + startGame)

---

## Phase 1: Deploy NFT and Token

This phase deploys the NFT contract and token, then transfers tokens to the Safe.

### Run Phase 1

```bash
PHASE=1 npx hardhat run scripts/deploy-sepolia-dryrun.js --network mainnet
```

**What it does:**
1. Deploys `ClickstrNFT` from NFT Deployer (owner = signer = NFT Deployer)
2. Deploys token with 1B supply to NFT Deployer
3. Transfers 100M tokens to Safe Wallet

**Output:**
```
Contract Addresses:
  ClickstrNFT:     0x...
  Token:           0x...

MANUAL ACTION REQUIRED:
Transfer 3M tokens from Safe to Game Deployer:
  From:    0x4890c268170a51d7864d4F879E73AC24A0415810
  To:      0x73468BD5fDD81b6e0c583bB5bb38534684c8DFe0
  Amount:  3,000,000 tokens
```

### Manual: Transfer Tokens from Safe

Using your Safe wallet UI:
1. Go to safe.global and connect to your Safe
2. Create a new transaction
3. Token transfer:
   - To: Game Deployer address
   - Token: The deployed token address
   - Amount: 3,000,000 (or desired season pool)
4. Sign and execute the transaction

---

## Phase 2: Deploy Game Contract

After the Safe transfer is complete, deploy the game contract.

### Run Phase 2

```bash
PHASE=2 \
  TOKEN_ADDRESS=0x... \
  NFT_ADDRESS=0x... \
  SEASON_EPOCHS=90 \
  SEASON_DURATION=86400 \
  npx hardhat run scripts/deploy-sepolia-dryrun.js --network mainnet
```

**Season Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `SEASON_EPOCHS` | 12 | Number of epochs |
| `SEASON_DURATION` | 7200 | Epoch duration in seconds |
| `INITIAL_DIFFICULTY` | (auto) | Starting difficulty |

**Production values (90-day season):**
```bash
SEASON_EPOCHS=90 SEASON_DURATION=86400  # 90 days, 24hr epochs
```

**What it does:**
1. Verifies Game Deployer has enough tokens
2. Deploys `Clickstr` contract
3. Sets NFT tier bonuses (2%-10%)
4. Approves and transfers tokens to contract
5. Starts the game

**Output:**
```
Contract Addresses:
  ClickstrNFT:     0x...
  Token:           0x...
  Clickstr:        0x...

Game Stats:
  Pool remaining: 3,000,000.0 CLICK
  Current epoch: 1 of 90
  Start time: 2026-02-03T19:10:24.000Z
  End time: 2026-05-04T19:10:24.000Z
```

---

## Phase 3: Verify Contracts

Verify all contracts on Etherscan:

```bash
# NFT Contract
npx hardhat verify --network mainnet <NFT_ADDRESS> \
  "<SIGNER_ADDRESS>" \
  "ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/"

# Clickstr Contract
npx hardhat verify --network mainnet <CLICKSTR_ADDRESS> \
  <TOKEN_ADDRESS> \
  <TOTAL_EPOCHS> \
  <EPOCH_DURATION> \
  "<INITIAL_DIFFICULTY>" \
  <NFT_ADDRESS>
```

---

## Phase 4: Deploy Subgraph

### Delete Old Subgraph (if exists)

```bash
goldsky subgraph list
goldsky subgraph delete clickstr-mainnet/1.0.0 --force
```

### Update Subgraph Config

Edit `subgraph/subgraph.yaml`:

```yaml
network: mainnet
source:
  address: "0x..."  # New Clickstr address
  startBlock: ...   # Block number of deployment
```

### Deploy New Subgraph

```bash
cd subgraph
npm run codegen
npm run build
goldsky subgraph deploy clickstr-mainnet/1.0.0 --path .
```

---

## Phase 5: Update Frontend

### Update Network Config

Edit `src-ts/src/config/network.ts`:

```typescript
mainnet: {
  chainId: 1,
  chainName: 'Ethereum',
  rpcUrl: import.meta.env.VITE_ETH_MAINNET_RPC_URL || '',
  contractAddress: '0x...',      // Clickstr address
  tokenAddress: '0x...',          // Token address
  nftContractAddress: '0x...',    // NFT address
  turnstileSiteKey: '0x4AAAAAACV0UOMmCeG_g2Jr',
},
```

### Update Active Network

```typescript
export const CURRENT_NETWORK: NetworkId = 'mainnet';
```

### Update Subgraph URL

```typescript
subgraphUrl: 'https://api.goldsky.com/.../clickstr-mainnet/1.0.0/gn',
```

### Update Games Config (IMPORTANT!)

Edit `src-ts/src/config/games.ts` to add the new game/season:

```typescript
// Mark previous game as inactive
{
  id: 'beta-3',
  name: 'Beta Game 3',
  subgraphUrl: '...',
  contractAddress: '0x...',
  endDate: '2026-02-04',  // Set end date
  isActive: false,        // Mark inactive
  isBeta: true,
},
// Add the new mainnet game
{
  id: 'game-1',
  name: 'Season 1',
  subgraphUrl: 'https://api.goldsky.com/.../clickstr-mainnet/1.0.0/gn',
  contractAddress: '0x...',  // Mainnet Clickstr address
  startDate: '2026-XX-XX',
  endDate: null,  // Ongoing
  isActive: true,
  isBeta: false,
},
```

**Why this matters:** The "On-Chain" leaderboard tab uses this config to fetch data from the correct subgraph. If the games.ts config doesn't point to the new contract/subgraph, the leaderboard will show stale data or no data.

### Deploy Frontend

```bash
git add -A
git commit -m "Deploy to mainnet"
git push
```

Vercel auto-deploys from GitHub push.

---

## Phase 6: Update Server (mann.cool)

### Vercel Environment Variables

Update these in the Vercel dashboard for mann.cool:

| Variable | Value |
|----------|-------|
| `NFT_CONTRACT_ADDRESS` | Mainnet NFT address |
| `NFT_SIGNER_PRIVATE_KEY` | Private key for NFT Deployer |

### Reset API Data (Optional)

For a fresh start, reset all click data:

```bash
curl -X POST "https://mann.cool/api/clickstr-admin-reset" \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_ADMIN_SECRET"}'
```

---

## Deployment Checklist

### Before Deployment
- [ ] NFT Deployer has ~0.01 ETH
- [ ] Game Deployer has ~0.01 ETH
- [ ] Safe Wallet is set up and accessible
- [ ] All environment variables configured
- [ ] IPFS metadata uploaded (nft-ipfs-config.json exists)

### Phase 1: NFT + Token
- [ ] Run `PHASE=1` deployment script
- [ ] Note NFT contract address
- [ ] Note token contract address
- [ ] Verify 100M tokens in Safe Wallet

### Manual Transfer
- [ ] Transfer season pool (e.g., 3M) from Safe to Game Deployer
- [ ] Verify Game Deployer has tokens

### Phase 2: Game Contract
- [ ] Run `PHASE=2` deployment script
- [ ] Note Clickstr contract address
- [ ] Verify game started (check getGameStats)

### Verification
- [ ] Verify NFT contract on Etherscan
- [ ] Verify Clickstr contract on Etherscan

### Subgraph
- [ ] Delete old subgraph (if applicable)
- [ ] Update subgraph.yaml with new address
- [ ] Deploy new subgraph
- [ ] Verify subgraph is syncing

### Frontend
- [ ] Update network.ts with all addresses
- [ ] Update CURRENT_NETWORK to 'mainnet'
- [ ] Update subgraph URL in network.ts
- [ ] **Update games.ts** - add new game entry with subgraph URL and contract address
- [ ] Push to GitHub
- [ ] Verify Vercel deployment

### Server
- [ ] Update NFT_CONTRACT_ADDRESS in Vercel
- [ ] Reset API data (if fresh start)
- [ ] Test NFT claiming flow

### Final Testing
- [ ] Connect wallet on clickstr.fun
- [ ] Submit clicks and verify they register
- [ ] Check leaderboard updates
- [ ] Test NFT claim flow
- [ ] Verify on-chain transactions on Etherscan

---

## Troubleshooting

### "Not enough tokens" in Phase 2
- Verify Safe transfer completed
- Check Game Deployer balance: `cast call <TOKEN> "balanceOf(address)" <GAME_DEPLOYER>`

### Subgraph not syncing
- Check start block is correct (should be deployment block or slightly before)
- Verify contract address in subgraph.yaml matches deployed address
- Check Goldsky dashboard for errors

### NFT claims failing
- Verify `NFT_CONTRACT_ADDRESS` in Vercel matches deployed address
- Verify `NFT_SIGNER_PRIVATE_KEY` matches the signer set in the NFT contract
- Check mann.cool logs for signature errors

### Frontend showing old data
- Hard refresh (Cmd+Shift+R)
- Check browser console for RPC errors
- Verify subgraph URL is updated

---

## Contract Addresses Reference

### Mainnet (Production)
| Contract | Address |
|----------|---------|
| ClickstrNFT | `0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849` |
| $CLICK Token | `0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d` |
| Clickstr | TBD |

### Sepolia v6 (Dry Run - Feb 3-4, 2026)
| Contract | Address |
|----------|---------|
| ClickstrNFT | `0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849` |
| MockClickToken | `0x78A607EDE7C7b134F51E725e4bA73D7b269580fc` |
| Clickstr | `0xf724ede44Bbb2Ccf46cec530c21B14885D441e02` |
