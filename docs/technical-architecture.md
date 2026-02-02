# Technical Architecture

## System Overview

```
┌───────────────────────────────────────────────────────────────┐
│  BROWSER (Frontend)                                           │
│  ├── User clicks button                                       │
│  ├── WebWorker mines keccak256 hashes                         │
│  ├── Valid proofs accumulated locally                         │
│  │                                                            │
│  ├── ON SUBMIT (GAME ACTIVE):                                 │
│  │   └── Submit to Clickstr contract (pays gas)          │
│  │   └── On success: POST /api/clickstr (record clicks) │
│  │                                                            │
│  ├── ON SUBMIT (GAME INACTIVE / BETWEEN SEASONS):             │
│  │   └── POST /api/clickstr with nonces array           │
│  │   └── Server validates PoW, counts toward NFT milestones   │
│  │                                                            │
│  ├── ON MILESTONE UNLOCKED:                                   │
│  │   └── POST /api/clickstr/claim-signature             │
│  │   └── User calls NFT contract with signature (pays gas)    │
│  │                                                            │
│  └── DISPLAY:                                                 │
│      ├── GET /api/clickstr?address=... (stats)          │
│      └── GET /api/clickstr?leaderboard=true             │
└───────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐    ┌───────────────────────────────────┐
│ ETHEREUM (On-chain)  │    │ MANN.COOL SERVER (Off-chain)      │
│ ├── Clickstr    │    │ ├── /api/clickstr           │
│ │   └── PoW mining   │    │ │   └── Track frontend clicks     │
│ │   └── $CLICK dist  │    │ │   └── Check milestones          │
│ │   └── Burns 50%    │    │ │   └── Verify PoW nonces         │
│ │                    │    │ │                                 │
│ └── NFT Contract     │    │ ├── /api/clickstr/          │
│     └── Verify sig   │◄───│ │   claim-signature               │
│     └── Mint NFT     │    │ │   └── Verify eligibility        │
│                      │    │ │   └── Sign claim message        │
└──────────────────────┘    │ │                                 │
                            │ └── Upstash Redis                 │
                            └───────────────────────────────────┘
```

## Smart Contracts

### Clickstr.sol
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

### ClickstrNFT.sol
- ERC1155 for achievement NFTs
- Signature-based claiming (server signs, user submits)
- Tier system:
  - 1-99: Personal milestones (editions)
  - 100-199: Streak/epoch achievements (editions)
  - 200-499: Global 1/1 milestones (only one owner ever)
  - 500+: Hidden personal achievements (editions)

## Frontend

### TypeScript Version (src-ts/) - ACTIVE
Modern Vite + TypeScript implementation with modular architecture:

```
src-ts/
├── src/
│   ├── main.ts           # Application entry (~740 lines)
│   ├── types/            # TypeScript interfaces (game, nft, api, contracts, effects)
│   ├── config/           # Network configs, milestones, collection slots
│   ├── state/            # GameState class with event subscriptions
│   ├── services/         # api, wallet, contracts, mining
│   ├── effects/          # particles, confetti, cursor, disco, sounds
│   ├── styles/           # 11 modular CSS files
│   └── workers/          # WebWorker for PoW mining
└── public/               # Static assets (cursors, sounds, fonts)
```

**Build:** `npm run build` → ~317KB JS, ~43KB CSS (gzipped: ~104KB JS, ~7KB CSS)

### Legacy Version (public/index.html)
Original single-file vanilla HTML/JS implementation (~4,922 lines). Kept for reference but TypeScript version is the active codebase.

### Key Features
- Arcade cabinet aesthetic with DSEG7 seven-segment fonts
- MetaMask/WalletConnect via ethers.js
- Inline WebWorker for keccak256 mining
- Cloudflare Turnstile for bot protection
- localStorage persistence for pending clicks
- Circular click zone centered on button
- Real-time stats (session clicks, all-time, earned)
- Merged leaderboard (frontend + contract data)
- Collection modal with 95 NFT slots
- Cursor cosmetics with 16 particle effects
- Achievement toasts on milestone unlock

## Server APIs (mann.cool)

### /api/clickstr
| Method | Params | Purpose |
|--------|--------|---------|
| GET | `?address=0x...` | Player stats |
| GET | `?leaderboard=true&limit=N` | Top clickers |
| GET | `?global=true` | Global statistics |
| GET | `?verification=true&address=0x...` | Turnstile status |
| POST | `{ address, clicks, turnstileToken }` | Record frontend clicks |
| POST | `{ address, clicks, nonces }` | Record off-chain clicks with PoW validation |
| POST | `{ address, onChainClicks, txHash }` | Record on-chain submissions |

#### Off-Chain Proof-of-Work Validation

When game is inactive (between seasons), users can still submit clicks to the API with their mined nonces as proof-of-work:

```javascript
// Request (off-chain submission)
{
  "address": "0x...",
  "clicks": 50,
  "nonces": ["12345678901234", "98765432109876", ...] // BigInt as strings
}

// Response
{
  "success": true,
  "clicksRecorded": 48,  // Only valid nonces count
  "totalClicks": 1048,
  "verifiedByPoW": true
}
```

The server validates each nonce by:
1. Packing `encodePacked(address, nonce, epoch, chainId)`
2. Hashing with keccak256
3. Checking `hash < difficultyTarget`

This bypasses Turnstile verification since PoW itself proves computational work.

### /api/clickstr-claim-signature
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

**Endpoint (Sepolia v1.0.0):**
```
https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.0/gn
```

## Dual Leaderboard System

The leaderboard has two modes accessible via toggle in the sidebar panel and tabs in the full rankings modal:

| Mode | Description | Data Source |
|------|-------------|-------------|
| **Global** | All-time frontend clicks (humans across all games) | Redis via mann.cool API |
| **Per-Game** | On-chain clicks for a specific game/season | Game's Goldsky subgraph |

**Why two modes:**
- Global tracks human activity that counts toward NFT milestones (persists forever)
- Per-Game tracks on-chain competition within each seasonal contract

### Games Configuration

Games are defined in `src-ts/src/config/games.ts`:

```typescript
export interface GameConfig {
  id: string;           // e.g., 'beta-1', 'game-1'
  name: string;         // Display name
  subgraphUrl: string;  // Goldsky endpoint for this game
  contractAddress: string;
  startDate?: string;
  endDate?: string | null;
  isActive: boolean;
  isBeta: boolean;
}

export const GAMES: GameConfig[] = [
  {
    id: 'beta-1',
    name: 'Beta Game 1',
    subgraphUrl: 'https://api.goldsky.com/.../clickstr-sepolia/1.0.2/gn',
    contractAddress: '0x6dD800B88FEecbE7DaBb109884298590E5BbBf20',
    isActive: true,
    isBeta: true,
  },
  // Add new games here as they launch
];
```

### Rankings Modal Tabs

The full rankings modal ("See All Rankings") shows tabs for:
- **Global** - All-time frontend clicks
- **[Game Name]** - One tab per game from the `GAMES` config

Each tab fetches from the appropriate data source and displays up to 50 entries.

## Redis Data Structure

```
clickstr:clicks:{address}     - Hash: totalClicks, sessionsCount, lastSessionAt, name
clickstr:leaderboard          - Sorted Set: {address} scored by totalClicks
clickstr:onchain-leaderboard  - Sorted Set: {address} scored by onChainClicks
clickstr:milestones:{address} - Set: unlocked milestone IDs
clickstr:human-session:{address} - Hash: verifiedAt, expiresAt, clicksSinceVerify
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
- `SEPOLIA_RPC_URL` / `ETH_MAINNET_RPC_URL` - RPC endpoints (for scripts)

### Vite Frontend (src-ts/.env)
- `VITE_SEPOLIA_RPC_URL` - Sepolia RPC (Alchemy)
- `VITE_ETH_MAINNET_RPC_URL` - Mainnet RPC (Alchemy)
- `VITE_WALLET_CONNECT_PROJECT_ID` - WalletConnect v2 project ID

Note: Vite requires the `VITE_` prefix for client-side environment variables.

## Files Structure

```
contracts/
  Clickstr.sol      - Main game contract
  ClickstrNFT.sol   - Achievement NFT contract

src-ts/                  - TypeScript frontend (ACTIVE)
  src/
    main.ts              - Application entry
    types/               - TypeScript interfaces
    config/              - Network, milestones, collection
    state/               - GameState, persistence
    services/            - api, wallet, contracts, mining
    effects/             - particles, confetti, cursor, disco
    styles/              - 11 modular CSS files
    workers/             - PoW mining WebWorker
  public/                - Static assets
    button-*.jpg         - Button images
    cursors/             - 73 cursor PNGs
    sounds/              - Audio files
    Fonts/               - SevenSegment font
    one-of-ones/         - Legendary NFT images

public/                  - Legacy frontend (reference only)
  index.html             - Original single-file implementation

scripts/
  deploy-sepolia.js      - Season deployment script
  deploy-nft.js          - NFT contract deployment
  public-miner.js        - Public mining script
  optimized-miner.js     - Max performance mining bot
  test-*.js              - Various test scripts

subgraph/
  schema.graphql         - Entity definitions
  subgraph.yaml          - Config (update per season!)
  src/mapping.ts         - Event handlers

api/
  claim-signature.js     - Reference implementation
```
