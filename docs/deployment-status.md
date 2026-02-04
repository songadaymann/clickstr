# Deployment Status

## Current Production (Mainnet Season 1)

**3-Day Season - First Real Game**

| Parameter | Value |
|-----------|-------|
| Total Epochs | 3 |
| Epoch Duration | 24 hours |
| Pool Size | 3M $CLICK |
| Season Length | 3 days |

**Timeline:**
- Start: 2026-02-04 15:19:59 UTC
- End: 2026-02-07 15:19:59 UTC

### Mainnet Contracts

| Contract | Address | Etherscan |
|----------|---------|-----------|
| $CLICK Token | `0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d` | [View](https://etherscan.io/address/0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d) |
| ClickstrNFT | `0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849` | [View](https://etherscan.io/address/0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849#code) |
| Clickstr | `0xf724ede44Bbb2Ccf46cec530c21B14885D441e02` | [View](https://etherscan.io/address/0xf724ede44Bbb2Ccf46cec530c21B14885D441e02#code) |

**NFT Contract Details:**
- Deployed: 2026-02-03
- Owner: `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- Signer: `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- BaseURI: `ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/`

**NFT Tier Bonuses:**
- Tier 4 (1K clicks): +2%
- Tier 6 (10K clicks): +3%
- Tier 8 (50K clicks): +5%
- Tier 9 (100K clicks): +7%
- Tier 11 (500K clicks): +10%

### Mainnet Subgraph

**Goldsky Endpoint:**
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-mainnet/1.0.0/gn
```

---

## Sepolia Test Environment

**24-Hour Test Environment (v6) - Mainnet Dry Run**

| Parameter | Production | Test |
|-----------|------------|------|
| Total Epochs | 90 | 12 |
| Epoch Duration | 24 hours | 2 hours |
| Pool Size | 100M | 3M |
| Season Length | 90 days | 1 day |

**Timeline:**
- Start: 2026-02-03 19:10:24 UTC
- End: 2026-02-04 19:10:24 UTC

### Test Contracts (v6)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| MockClickToken | `0x78A607EDE7C7b134F51E725e4bA73D7b269580fc` | [View](https://sepolia.etherscan.io/address/0x78A607EDE7C7b134F51E725e4bA73D7b269580fc) |
| ClickstrNFT | `0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849` | [View](https://sepolia.etherscan.io/address/0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849) |
| Clickstr | `0xf724ede44Bbb2Ccf46cec530c21B14885D441e02` | [View](https://sepolia.etherscan.io/address/0xf724ede44Bbb2Ccf46cec530c21B14885D441e02) |

### Sepolia Subgraph

**Goldsky Endpoint (v1.0.4):**
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.4/gn
```

### Previous Sepolia Deployments

**v5 (24hr test Feb 2-3)**
| Contract | Address |
|----------|---------|
| MockClickToken | `0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4` |
| ClickstrNFT | `0x39B41525ba423FcAbE23564ecCCdEa66e7D59551` |
| Clickstr | `0xA16d45e4D186B9678020720BD1e743872a6e9bA0` |

**v4 (24hr test Jan 30-31)**
| Contract | Address |
|----------|---------|
| MockClickToken | `0xE7BBD98a6cA0de23baA1E781Df1159FCb1a467fA` |
| ClickstrNFT | `0x3cDC7937B051497E4a4C8046d90293E2f1B84ff3` |
| Clickstr | `0x6dD800B88FEecbE7DaBb109884298590E5BbBf20` |

---

## Frontend Configuration

Located in `src-ts/src/config/network.ts`:

```typescript
export const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    contractAddress: '0xf724ede44Bbb2Ccf46cec530c21B14885D441e02',
    tokenAddress: '0x78A607EDE7C7b134F51E725e4bA73D7b269580fc',
    nftContractAddress: '0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849',
  },
  mainnet: {
    chainId: 1,
    contractAddress: '0xf724ede44Bbb2Ccf46cec530c21B14885D441e02',
    tokenAddress: '0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d',
    nftContractAddress: '0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849',
  }
};

export const CURRENT_NETWORK = 'mainnet';
```

---

## Environment Variables

### Required for Contract Deployment (.env)
```
MAINNET_PRIVATE_KEY=0x...
NFT_DEPLOYER_KEY=0x...
ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
ETHERSCAN_API_KEY=...
GOLDSKY_API_KEY=...
```

### Required for Frontend (Vercel - clickstr.fun)
```
VITE_ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
VITE_WALLET_CONNECT_PROJECT_ID=...
```

### Required for Server (Vercel - mann.cool)
```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
TURNSTILE_SECRET_KEY=...
NFT_SIGNER_PRIVATE_KEY=0x...  # Private key for 0xf55E...
NFT_CONTRACT_ADDRESS=0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849
CLICKSTR_ADMIN_SECRET=...  # For admin reset endpoint
```

---

## Deployment Commands

### Mainnet Season Deployment
```bash
PHASE=2 \
  TOKEN_ADDRESS=0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d \
  NFT_ADDRESS=0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849 \
  SEASON_EPOCHS=3 \
  SEASON_DURATION=86400 \
  npx hardhat run scripts/deploy-sepolia-dryrun.js --network mainnet
```

### Subgraph Deployment
```bash
cd subgraph
npm run codegen
npm run build
goldsky subgraph deploy clickstr-mainnet/1.0.0 --path .
```

### Contract Verification
```bash
npx hardhat verify --network mainnet <CLICKSTR_ADDRESS> \
  <TOKEN_ADDRESS> <EPOCHS> <DURATION> "<DIFFICULTY>" <NFT_ADDRESS>
```
