# Deployment Status

## Current Test Deployment (Sepolia)

**2-Day Compressed Test Environment**

| Parameter | Production | Test |
|-----------|------------|------|
| Total Epochs | 90 | 24 |
| Epoch Duration | 24 hours | 2 hours |
| Pool Size | 100M | 2M |
| Season Length | 90 days | 2 days |

**Timeline:**
- Start: 2026-01-28 16:19:24 UTC
- End: 2026-01-30 16:19:24 UTC

### Test Contracts (v3 - Current)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| MockClickToken | `0xe068de6E3A830BB09b5dcdBB0cD0F631FDC23f28` | [View](https://sepolia.etherscan.io/address/0xe068de6E3A830BB09b5dcdBB0cD0F631FDC23f28) |
| StupidClickerNFT | `0x36E0ecd8E2A5cb854c1F02f07933B81f439c28F8` | [View](https://sepolia.etherscan.io/address/0x36E0ecd8E2A5cb854c1F02f07933B81f439c28F8) |
| StupidClicker | `0x8ac0facc097ba05d70fa5A480F334A28B0802c7e` | [View](https://sepolia.etherscan.io/address/0x8ac0facc097ba05d70fa5A480F334A28B0802c7e) |

### Previous Sepolia Deployments

**v2 (With Security Fixes)**
| Contract | Address |
|----------|---------|
| MockClickToken | `0xF493D552281ce8328308a04C8153568d3A8422aC` |
| StupidClicker | `0xfA0C8a82DC76cA1dB2AD37e85b3DFD91e342F83C` |

**v1 (Initial - Deprecated)**
| Contract | Address |
|----------|---------|
| MockClickToken | `0xd8b4FD0d0B7F46576f4e249A125E13D98D8F6B4C` |
| StupidClicker | `0x914CB6aCdcd77614C58A4097A5F710b7AB3C945A` |

---

## Subgraph Deployment

**Goldsky Endpoint (Sepolia v1.0.1):**
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/stupid-clicker-sepolia/1.0.1/gn
```

Points to test contract: `0x8ac0facc097ba05d70fa5A480F334A28B0802c7e`

---

## Mainnet (Not Yet Deployed)

### Required Steps
1. Get production Turnstile keys from Cloudflare
2. Create fresh NFT signer wallet
3. Deploy contracts
4. Update frontend `NETWORK = 'mainnet'`
5. Update Vercel env vars
6. Deploy mainnet subgraph

---

## Frontend Configuration

Located in `public/index.html`:

```javascript
const NETWORK = 'sepolia';  // Change to 'mainnet' for production

const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    contractAddress: '0x8ac0facc097ba05d70fa5A480F334A28B0802c7e',
    tokenAddress: '0xe068de6E3A830BB09b5dcdBB0cD0F631FDC23f28',
    nftContractAddress: '0x36E0ecd8E2A5cb854c1F02f07933B81f439c28F8',
    turnstileSiteKey: '1x00000000000000000000AA',  // Test key
    subgraphUrl: 'https://api.goldsky.com/.../1.0.1/gn'
  },
  mainnet: {
    chainId: 1,
    contractAddress: '0x...',  // TODO
    tokenAddress: '0x...',      // TODO
    nftContractAddress: '0x...', // TODO
    turnstileSiteKey: '...',    // TODO: Production key
    subgraphUrl: '...'          // TODO
  }
};
```

---

## Deployment Commands

### Season Deployment
```bash
# Default 3-day season with 5M tokens
npx hardhat run scripts/deploy-sepolia.js --network sepolia

# Custom configuration
SEASON_EPOCHS=24 SEASON_DURATION=7200 SEASON_POOL=2000000 \
  npx hardhat run scripts/deploy-sepolia.js --network sepolia

# Carry over difficulty from previous season
INITIAL_DIFFICULTY=<value> npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

### NFT Contract Deployment
```bash
npx hardhat run scripts/deploy-nft.js --network sepolia
```

### Subgraph Deployment
```bash
cd subgraph
npm install
npm run codegen
npm run build
goldsky subgraph deploy stupid-clicker-sepolia/1.0.1 --path .
```

---

## Test Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `scripts/test-deploy.js` | `npm run deploy:test` | Deploy 2-day test environment |
| `scripts/test-bot-a-contract.js` | `npm run test:bot-a` | Contract miner bot |
| `scripts/test-bot-b-frontend.js` | `npm run test:bot-b` | Puppeteer frontend bot |
| `scripts/test-monitor.js` | `npm run test:monitor` | Real-time monitoring |
| `scripts/optimized-miner.js` | `npm run mine` | Max performance miner |

---

## Environment Variables

### Required for Contract Deployment (.env)
```
SEPOLIA_PRIVATE_KEY=0x...
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/...
GOLDSKY_API_KEY=...
```

### Required for Server (Vercel)
```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA  # Test
NFT_SIGNER_PRIVATE_KEY=0x...
NFT_CONTRACT_ADDRESS=0x36E0ecd8E2A5cb854c1F02f07933B81f439c28F8
```
