# Technical Architecture

## System Overview

```
┌───────────────────────────────────────────────────────────────┐
│  BROWSER (Frontend)                                           │
│  ├── User clicks button                                       │
│  ├── WebWorker mines keccak256 hashes                         │
│  ├── Valid proofs accumulated locally                         │
│  │                                                            │
│  ├── ON SUBMIT TO CONTRACT:                                   │
│  │   └── POST /api/stupid-clicker (record clicks)             │
│  │                                                            │
│  ├── ON MILESTONE UNLOCKED:                                   │
│  │   └── POST /api/stupid-clicker/claim-signature             │
│  │   └── User calls NFT contract with signature (pays gas)    │
│  │                                                            │
│  └── DISPLAY:                                                 │
│      ├── GET /api/stupid-clicker?address=... (stats)          │
│      └── GET /api/stupid-clicker?leaderboard=true             │
└───────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐    ┌───────────────────────────────────┐
│ ETHEREUM (On-chain)  │    │ MANN.COOL SERVER (Off-chain)      │
│ ├── StupidClicker    │    │ ├── /api/stupid-clicker           │
│ │   └── PoW mining   │    │ │   └── Track frontend clicks     │
│ │   └── $CLICK dist  │    │ │   └── Check milestones          │
│ │   └── Burns 50%    │    │ │                                 │
│ │                    │    │ ├── /api/stupid-clicker/          │
│ └── NFT Contract     │    │ │   claim-signature               │
│     └── Verify sig   │◄───│ │   └── Verify eligibility        │
│     └── Mint NFT     │    │ │   └── Sign claim message        │
│                      │    │ │                                 │
└──────────────────────┘    │ └── Upstash Redis                 │
                            └───────────────────────────────────┘
```

## Smart Contracts

### StupidClicker.sol
- Main game contract (Solidity 0.8.20)
- Uses OpenZeppelin v5 (Ownable, ReentrancyGuard, SafeERC20)
- Parameterized constructor for seasonal deployments:
  ```solidity
  constructor(
      address _clickToken,
      uint256 _totalEpochs,      // e.g., 3 for 3-day season
      uint256 _epochDuration,    // e.g., 86400 for 24 hours
      uint256 _initialDifficulty // carry over from previous season
  )
  ```

### StupidClickerNFT.sol
- ERC1155 for achievement NFTs
- Signature-based claiming (server signs, user submits)
- Tier system:
  - 1-99: Personal milestones (editions)
  - 100-199: Streak/epoch achievements (editions)
  - 200-499: Global 1/1 milestones (only one owner ever)
  - 500+: Hidden personal achievements (editions)

## Frontend

### public/index.html
- Single-file vanilla HTML/JS implementation
- Arcade cabinet aesthetic with DSEG7 seven-segment fonts
- MetaMask/WalletConnect via ethers.js
- Inline WebWorker for keccak256 mining
- Cloudflare Turnstile for bot protection
- localStorage persistence for pending clicks

### Key Features
- Circular click zone centered on button
- Real-time stats (session clicks, all-time, earned)
- Three-tier leaderboard (Global, Hardcore, Scripted)
- Collection modal with 95 NFT slots
- Cursor cosmetics system (awaiting PNG assets)
- Achievement toasts on milestone unlock

## Server APIs (mann.cool)

### /api/stupid-clicker
| Method | Params | Purpose |
|--------|--------|---------|
| GET | `?address=0x...` | Player stats |
| GET | `?leaderboard=true&limit=N` | Top clickers |
| GET | `?global=true` | Global statistics |
| GET | `?verification=true&address=0x...` | Turnstile status |
| POST | `{ address, clicks, turnstileToken }` | Record frontend clicks |
| POST | `{ address, onChainClicks, txHash }` | Record on-chain submissions |

### /api/stupid-clicker/claim-signature
```javascript
// Request
{ "address": "0x...", "milestone": "dedicated" }

// Response
{ "signature": "0x...", "tier": 4, "contractAddress": "0x..." }
```

## Goldsky Subgraph

Indexes on-chain activity for contract-direct leaderboard:

**Entities:** User, ClickSubmission, Epoch, GlobalStats

**Events indexed:** Clicked, EpochFinalized, GameStarted

**Endpoint (Sepolia v1.0.1):**
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/stupid-clicker-sepolia/1.0.1/gn
```

## Three-Tier Leaderboard System

| Tier | Description | Data Source |
|------|-------------|-------------|
| Global | Combined frontend + contract | Merged from both |
| Hardcore | Frontend only (human clickers) | Redis via mann.cool API |
| Scripted | Contract only (scripts/bots) | Goldsky subgraph |

## Redis Data Structure

```
stupid-clicker:clicks:{address}     - Hash: totalClicks, sessionsCount, lastSessionAt, name
stupid-clicker:leaderboard          - Sorted Set: {address} scored by totalClicks
stupid-clicker:onchain-leaderboard  - Sorted Set: {address} scored by onChainClicks
stupid-clicker:milestones:{address} - Set: unlocked milestone IDs
stupid-clicker:human-session:{address} - Hash: verifiedAt, expiresAt, clicksSinceVerify
```

## Anti-Bot: Cloudflare Turnstile

- Session-based verification (good for 1 hour)
- Re-verification after 500 clicks
- Graceful degradation in dev mode
- Test keys: `1x00000000000000000000AA` (site), `1x0000000000000000000000000000000AA` (secret)

## Environment Variables

### Vercel (mann.cool)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` - Upstash Redis
- `TURNSTILE_SECRET_KEY` - Bot protection
- `NFT_SIGNER_PRIVATE_KEY` - Signs claim messages
- `NFT_CONTRACT_ADDRESS` - Per network

### This Repo (.env)
- `GOLDSKY_API_KEY` - Subgraph deployment
- `SEPOLIA_PRIVATE_KEY` - Contract deployment
- `ALCHEMY_SEPOLIA_URL` - RPC endpoint

## Files Structure

```
contracts/
  StupidClicker.sol      - Main game contract
  StupidClickerNFT.sol   - Achievement NFT contract

public/
  index.html             - Frontend (single file)
  button-up.jpg          - Button released state
  button-down.jpg        - Button pressed state
  Fonts/                 - DSEG7, SevenSegment fonts
  cursors/               - Cursor PNG assets (TODO)

scripts/
  deploy-sepolia.js      - Season deployment script
  deploy-nft.js          - NFT contract deployment
  optimized-miner.js     - Max performance mining bot
  test-*.js              - Various test scripts

subgraph/
  schema.graphql         - Entity definitions
  subgraph.yaml          - Config (update per season!)
  src/mapping.ts         - Event handlers

api/
  claim-signature.js     - Reference implementation
```
