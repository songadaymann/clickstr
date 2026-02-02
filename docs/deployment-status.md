# Deployment Status

## Current Test Deployment (Sepolia)

**24-Hour Test Environment (v5) - Final Pre-Mainnet Test**

| Parameter | Production | Test |
|-----------|------------|------|
| Total Epochs | 90 | 12 |
| Epoch Duration | 24 hours | 2 hours |
| Pool Size | 100M | 1M |
| Season Length | 90 days | 1 day |

**Timeline:**
- Start: 2026-02-02 18:08:12 UTC
- End: 2026-02-03 18:08:12 UTC

### Test Contracts (v5 - Current)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| MockClickToken | `0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4` | [View](https://sepolia.etherscan.io/address/0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4) |
| ClickstrNFT | `0x39B41525ba423FcAbE23564ecCCdEa66e7D59551` | [View](https://sepolia.etherscan.io/address/0x39B41525ba423FcAbE23564ecCCdEa66e7D59551) |
| Clickstr | `0xA16d45e4D186B9678020720BD1e743872a6e9bA0` | [View](https://sepolia.etherscan.io/address/0xA16d45e4D186B9678020720BD1e743872a6e9bA0) |

**NFT Contract Details:**
- Signer: `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- BaseURI: `ipfs://QmfZqEdzeEm61d3uSeFxBc1HasR3KC6rMsiRnxkvzM3Ywx/clickstr-metadata/`
- Owner: `0xAd9fDaD276AB1A430fD03177A07350CD7C61E897`

**NFT Tier Bonuses (enabled):**
- Tier 4 (1K clicks): +2%
- Tier 6 (10K clicks): +3%
- Tier 8 (50K clicks): +5%
- Tier 9 (100K clicks): +7%
- Tier 11 (500K clicks): +10%

### Previous Sepolia Deployments

**v4 (24hr test Jan 30-31)**
| Contract | Address |
|----------|---------|
| MockClickToken | `0xE7BBD98a6cA0de23baA1E781Df1159FCb1a467fA` |
| ClickstrNFT | `0x3cDC7937B051497E4a4C8046d90293E2f1B84ff3` |
| Clickstr | `0x6dD800B88FEecbE7DaBb109884298590E5BbBf20` |

**v2 (With Security Fixes)**
| Contract | Address |
|----------|---------|
| MockClickToken | `0xF493D552281ce8328308a04C8153568d3A8422aC` |
| Clickstr | `0xfA0C8a82DC76cA1dB2AD37e85b3DFD91e342F83C` |

**v1 (Initial - Deprecated)**
| Contract | Address |
|----------|---------|
| MockClickToken | `0xd8b4FD0d0B7F46576f4e249A125E13D98D8F6B4C` |
| Clickstr | `0x914CB6aCdcd77614C58A4097A5F710b7AB3C945A` |

---

## Subgraph Deployment

**Goldsky Endpoint (Sepolia v1.0.3):**
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.3/gn
```

Points to v5 contract: `0xA16d45e4D186B9678020720BD1e743872a6e9bA0`

---

## Mainnet (Not Yet Deployed)

### NFT Signer (Same for Testnet & Mainnet)
- Address: `0xf55E4fac663ad8db80284620F97D95391ab002EF`
- **IMPORTANT:** For mainnet, deploy NFT contract FROM this signer address so it's also the owner

### Required Steps
1. Get production Turnstile keys from Cloudflare
2. Deploy NFT contract from signer wallet (`0xf55E...`) so signer = owner
3. Deploy Clickstr and Token contracts
4. Update frontend `NETWORK = 'mainnet'`
5. Update Vercel env vars:
   - `NFT_CONTRACT_ADDRESS` = new mainnet NFT address
   - `NFT_SIGNER_PRIVATE_KEY` = private key for `0xf55E...`
6. Deploy mainnet subgraph

---

## Frontend Configuration

Located in `src-ts/src/config/network.ts`:

```typescript
export const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    contractAddress: '0xA16d45e4D186B9678020720BD1e743872a6e9bA0',  // Clickstr v5
    tokenAddress: '0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4',     // MockClickToken v5
    nftContractAddress: '0x39B41525ba423FcAbE23564ecCCdEa66e7D59551', // ClickstrNFT v5
    turnstileSiteKey: '0x4AAAAAACV0UOMmCeG_g2Jr',
  },
  mainnet: {
    chainId: 1,
    contractAddress: '0x...',  // TODO
    tokenAddress: '0x...',      // TODO
    nftContractAddress: '0x...', // TODO
    turnstileSiteKey: '...',    // TODO: Production key
  }
};

// Subgraph URL in buildConfig():
subgraphUrl: 'https://api.goldsky.com/.../clickstr-sepolia/1.0.3/gn'
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
goldsky subgraph deploy clickstr-sepolia/1.0.1 --path .
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
NFT_SIGNER_PRIVATE_KEY=0x...  # Private key for 0xf55E4fac663ad8db80284620F97D95391ab002EF
NFT_CONTRACT_ADDRESS=0x39B41525ba423FcAbE23564ecCCdEa66e7D59551  # v5
CLICKSTR_ADMIN_SECRET=...  # For admin reset endpoint (testing only)
```
