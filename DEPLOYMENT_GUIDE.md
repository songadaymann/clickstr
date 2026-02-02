# Clickstr - Deployment Guide

Checklists for deploying seasons and the NFT contract.

---

# Season Deployment

## Pre-Deployment Decisions

Before deploying, decide on these parameters:

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| `SEASON_EPOCHS` | Number of epochs (days if 24h epochs) | 3, 7, 14 |
| `SEASON_DURATION` | Length of each epoch in seconds | 3600 (1hr), 86400 (24hr) |
| `SEASON_POOL` | Tokens to allocate (in whole tokens) | 5000000, 10000000 |
| `INITIAL_DIFFICULTY` | Starting difficulty (from previous season or default) | See below |
| `NFT_CONTRACT` | Achievement NFT address (Season 2+ only) | 0x... |

### Common Season Configurations

```bash
# First season (no NFT bonuses)
SEASON_EPOCHS=3 SEASON_POOL=5000000

# Season 2+ (with NFT bonuses)
SEASON_EPOCHS=7 SEASON_POOL=10000000 \
NFT_CONTRACT=0x... \
INITIAL_DIFFICULTY=<from previous season>
```

---

## Season 1 vs Season 2+ Differences

| | Season 1 | Season 2+ |
|---|----------|-----------|
| NFT Contract | Not needed | Required |
| NFT Bonuses | None | Configured |
| Initial Difficulty | Default | Carry over from previous |
| Constructor Args | 5 (NFT = address(0)) | 5 (with NFT address) |

---

## NFT Bonus System (Season 2+)

Players who hold achievement NFTs from previous seasons get bonus rewards. The bonus is applied ON TOP of the normal 50/50 split.

### How It Works

```
Normal player:  grossReward → 50% to player, 50% burned
Bonus player:   grossReward → 50% to player + BONUS%, 50% burned
                             (bonus comes from pool)
```

Example: Player with 10% bonus
- Gross reward: 1000 tokens
- Normal player gets: 500 tokens
- Bonus player gets: 500 + 50 (10% of 500) = 550 tokens
- Burned: 500 tokens (same either way)

### Recommended Tier Bonuses

The deploy script automatically sets these when `NFT_CONTRACT` is provided:

| Tier | Clicks Required | Bonus |
|------|-----------------|-------|
| 4 | 1,000 | 2% |
| 6 | 10,000 | 3% |
| 8 | 50,000 | 5% |
| 9 | 100,000 | 7% |
| 11 | 500,000 | 10% |

**Max possible bonus: 27%** (if someone has all 5 NFTs)
**Cap: 50%** (enforced by contract, even if more tiers added)

> **Note:** Achievement names (Dedicated, Obsessed, etc.) are placeholders and will be renamed before launch. The tier numbers and click thresholds are what matter for the bonus system.

**Why no global 1/1s?** Global milestones (The First Click, The Millionth, etc.) are unique - only one person ever gets each one. Using them for bonuses would give a permanent advantage to a single player, which isn't fair for ongoing seasons.

### Customizing Bonuses

To use different bonuses, call `setTierBonuses()` before `startGame()`:

```javascript
// After deploying, before starting
await stupidClicker.setTierBonuses(
  [4, 9, 12],           // Tier numbers
  [500, 1000, 2000]     // Bonuses in basis points (5%, 10%, 20%)
);

// Then start the game
await stupidClicker.startGame(poolAmount);
```

**Constraints:**
- Max 20% per individual tier
- Max 50% total (contract caps it)
- Can only set before game starts
- Max 20 bonus tiers

---

## Deployment Checklist

### 1. Get Difficulty from Previous Season (Skip for Season 1)

If this is Season 2+, get the final difficulty from the previous season:

```bash
# Sepolia
cast call <PREVIOUS_CONTRACT_ADDRESS> "difficultyTarget()" --rpc-url sepolia

# Mainnet
cast call <PREVIOUS_CONTRACT_ADDRESS> "difficultyTarget()" --rpc-url mainnet
```

This returns a big number like:
```
115792089237316195423570985008687907853269984665640564039457584007913129639
```

Save this - you'll use it as `INITIAL_DIFFICULTY`.

**Note:** You can adjust this ±20% if you want to make the new season slightly easier/harder than where the last one ended.

---

### 2. Ensure You Have Tokens

For testnet (Sepolia), the deploy script creates a MockClickToken automatically.

For mainnet, you need real $CLICK tokens in your deployer wallet:
- The deploy script will transfer `SEASON_POOL` tokens to the contract
- Make sure you have enough + gas

---

### 3. Deploy the Contract

**First Season (use default difficulty):**
```bash
# Sepolia
SEASON_EPOCHS=3 SEASON_POOL=5000000 \
npx hardhat run scripts/deploy-sepolia.js --network sepolia

# Mainnet (when ready)
SEASON_EPOCHS=3 SEASON_POOL=5000000 \
npx hardhat run scripts/deploy.js --network mainnet
```

**Subsequent Seasons (carry over difficulty):**
```bash
# Sepolia
SEASON_EPOCHS=7 SEASON_POOL=10000000 \
INITIAL_DIFFICULTY=115792089237316195423570985008687907853269984665640564039457584007913129639 \
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

---

### 4. Verify the Contract on Etherscan

The deploy script prints verification commands. Run them:

```bash
# Verify MockClickToken (testnet only)
npx hardhat verify --network sepolia <CLICK_TOKEN_ADDRESS> "<POOL_AMOUNT_WEI>"

# Verify Clickstr
npx hardhat verify --network sepolia <CLICKER_ADDRESS> <CLICK_TOKEN> <EPOCHS> <DURATION> "<DIFFICULTY>"
```

Example:
```bash
npx hardhat verify --network sepolia \
  0xfA0C8a82DC76cA1dB2AD37e85b3DFD91e342F83C \
  0xF493D552281ce8328308a04C8153568d3A8422aC \
  3 \
  86400 \
  "115792089237316195423570985008687907853269984665640564039457584007913129639"
```

---

### 5. Update Frontend Config

Update `public/index.html` with the new contract address:

```javascript
const CONFIG = {
  contractAddress: '0x...NEW_ADDRESS...',
  // ... rest of config
};
```

---

### 6. Deploy/Update the Subgraph

The Goldsky subgraph indexes on-chain clicks for the contract-direct leaderboard.

**First time setup:**
```bash
# Install Goldsky CLI
curl -fsSL https://cli.goldsky.com/install | bash

# Login with your API key
goldsky login
```

**For each new season:**

1. Update `subgraph/subgraph.yaml`:
   - `source.address` → new contract address
   - `source.startBlock` → deployment block number

2. Deploy with a new version:
   ```bash
   cd subgraph

   # Sepolia
   goldsky subgraph deploy clickstr-sepolia/1.0.0 --path .

   # Mainnet
   goldsky subgraph deploy clickstr-mainnet/1.0.0 --path .
   ```

3. Note the GraphQL endpoint URL from the output (needed if querying from frontend)

See `subgraph/README.md` for query examples.

---

### 7. Update Server API (if tracking seasons)

If the mann.cool API tracks seasons, update any relevant config there.

---

### 8. Announce the Season

- Tweet it
- Update Discord
- Note the start/end times from the deploy output

---

## Post-Season Checklist

When a season ends:

### 1. Save the Final Difficulty

```bash
cast call <CONTRACT_ADDRESS> "difficultyTarget()" --rpc-url sepolia
```

Write this down for the next season.

### 2. Call endGame() (Optional)

The game auto-ends, but you can manually finalize:

```bash
cast send <CONTRACT_ADDRESS> "endGame()" --rpc-url sepolia --private-key $PRIVATE_KEY
```

### 3. Review Stats

Check final stats before deploying next season:

```bash
# Total distributed vs burned
cast call <CONTRACT_ADDRESS> "getGameStats()" --rpc-url sepolia
```

### 4. Archive Deployment Info

The deploy script saves to `sepolia/deployment.json`. Archive this with a season number:

```bash
mv sepolia/deployment.json sepolia/season1-deployment.json
```

---

## Quick Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SEASON_EPOCHS` | 3 | Number of epochs |
| `SEASON_DURATION` | 86400 | Seconds per epoch |
| `SEASON_POOL` | 5000000 | Tokens (whole, not wei) |
| `INITIAL_DIFFICULTY` | contract default | Starting difficulty |

### Useful Cast Commands

```bash
# Check game status
cast call <ADDR> "getGameStats()" --rpc-url sepolia

# Check current epoch
cast call <ADDR> "currentEpoch()" --rpc-url sepolia

# Check difficulty
cast call <ADDR> "difficultyTarget()" --rpc-url sepolia

# Check pool remaining
cast call <ADDR> "poolRemaining()" --rpc-url sepolia

# Manually finalize an epoch
cast send <ADDR> "finalizeEpoch(uint256)" <EPOCH_NUM> --rpc-url sepolia --private-key $KEY

# End the game (after end time)
cast send <ADDR> "endGame()" --rpc-url sepolia --private-key $KEY
```

### Target Clicks per Epoch (auto-calculated)

| Epoch Duration | Target Clicks |
|----------------|---------------|
| 1 hour | 41,666 |
| 6 hours | 250,000 |
| 12 hours | 500,000 |
| 24 hours | 1,000,000 |
| 48 hours | 2,000,000 |

---

## Example: Full Season 2 Deployment

```bash
# 1. Get difficulty from Season 1
cast call 0xfA0C8a82DC76cA1dB2AD37e85b3DFD91e342F83C "difficultyTarget()" --rpc-url sepolia
# Output: 115792089237316195423570985008687907853269984665640564039457584007913129639

# 2. Deploy Season 2 (1 week, 10M tokens, carry over difficulty)
SEASON_EPOCHS=7 \
SEASON_POOL=10000000 \
INITIAL_DIFFICULTY=115792089237316195423570985008687907853269984665640564039457584007913129639 \
npx hardhat run scripts/deploy-sepolia.js --network sepolia

# 3. Verify on Etherscan (use commands from deploy output)

# 4. Update frontend CONFIG.contractAddress

# 5. Announce!
```

---

## Troubleshooting

### "Epoch too short" error
Minimum epoch duration is 1 hour (3600 seconds).

### "Epoch too long" error
Maximum epoch duration is 7 days (604800 seconds).

### "Difficulty too low" error
Minimum difficulty is 1000. Use the default or a value from a previous season.

### Forgot to save previous difficulty?
If the contract is still deployed, you can always read it:
```bash
cast call <OLD_CONTRACT> "difficultyTarget()" --rpc-url sepolia
```

If the contract is gone, use the default difficulty (first season behavior).

---

# NFT Contract Deployment

The NFT contract uses **ERC1155** (not ERC721) because:
- Personal milestones are "editions" (many people can own the same achievement)
- Global milestones are "1/1s" (only one person can ever own)
- Batch claiming saves gas when users claim multiple achievements at once

The NFT contract is deployed **once** and persists across all seasons. Players earn achievements across seasons, and can claim NFTs anytime.

## Pre-Deployment Setup

### 1. Create a Signing Wallet

Create a **new** wallet specifically for signing NFT claims. This wallet:
- Never needs ETH (it only signs messages)
- Private key lives on your API server
- Public address is set in the NFT contract

```bash
# Generate a new wallet (or use your preferred method)
cast wallet new

# Output:
# Address: 0x1234...
# Private key: 0xabcd...
```

**Save both values:**
- Address → used for deployment
- Private key → used by API server to sign claims

### 2. Decide on Base URI

The base URI points to your NFT metadata endpoint. Format:
```
https://mann.cool/api/clickstr/nft/
```

Token URIs will be: `{baseURI}{tier}` → `https://mann.cool/api/clickstr/nft/4`

You'll need to create this metadata endpoint that returns JSON like:
```json
{
  "name": "Dedicated",
  "description": "Reached 1,000 clicks in Clickstr",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "Tier", "value": 4 },
    { "trait_type": "Type", "value": "Personal Milestone" },
    { "trait_type": "Clicks Required", "value": 1000 }
  ]
}
```

---

## NFT Deployment Checklist

### 1. Deploy the Contract

```bash
# Sepolia
NFT_SIGNER_ADDRESS=0x1234... \
NFT_BASE_URI="https://mann.cool/api/clickstr/nft/" \
npx hardhat run scripts/deploy-nft.js --network sepolia

# Mainnet (when ready)
NFT_SIGNER_ADDRESS=0x1234... \
NFT_BASE_URI="https://mann.cool/api/clickstr/nft/" \
npx hardhat run scripts/deploy-nft.js --network mainnet
```

### 2. Verify on Etherscan

```bash
npx hardhat verify --network sepolia <NFT_ADDRESS> "<SIGNER_ADDRESS>" "<BASE_URI>"
```

### 3. Update Frontend

In `public/index.html`, update:
```javascript
const CONFIG = {
  // ...
  nftContractAddress: '0x...NEW_NFT_ADDRESS...',
};
```

### 4. Set API Environment Variables

On your mann.cool server:
```bash
NFT_SIGNER_PRIVATE_KEY=0xabcd...  # Private key from step 1
NFT_CONTRACT_ADDRESS=0x...        # Deployed contract address
```

### 5. Implement API Endpoint

Create `/api/clickstr/claim-signature` endpoint. Reference implementation in `api/claim-signature.js`.

Key logic:
```javascript
// 1. Verify user is eligible (check Redis for click count, etc.)
// 2. Verify not already claimed
// 3. Sign the message
const messageHash = ethers.solidityPackedKeccak256(
  ["address", "uint256", "address"],
  [userAddress, tier, nftContractAddress]
);
const signature = await wallet.signMessage(ethers.getBytes(messageHash));
// 4. Return signature to frontend
```

### Batch Claiming

Users can claim multiple NFTs in one transaction using `claimBatch()`:

```javascript
// Frontend example
const tiers = [1, 2, 3, 4];  // Tiers user wants to claim
const signatures = [];       // Get signatures from API for each tier

for (const tier of tiers) {
  const { signature } = await fetch('/api/claim-signature', {
    method: 'POST',
    body: JSON.stringify({ address: userAddress, milestone: tierToMilestone(tier) })
  }).then(r => r.json());
  signatures.push(signature);
}

// Call contract
await nftContract.claimBatch(tiers, signatures);
```

Batch claiming is limited to 20 NFTs per transaction to prevent gas issues.

### 6. Create Metadata Endpoint

Create `/api/clickstr/nft/[tokenId]` that returns ERC1155 metadata JSON.

Reference implementation in `api/nft-metadata.js`. The response format:
```json
{
  "name": "Dedicated",
  "description": "1,000 clicks. You're officially dedicated to the cause.",
  "image": "https://mann.cool/clickstr/nft/images/4.png",
  "external_url": "https://mann.cool/clickstr/nft/4",
  "attributes": [
    { "trait_type": "Category", "value": "personal" },
    { "trait_type": "Rarity", "value": "uncommon" },
    { "trait_type": "Clicks Required", "value": 1000 },
    { "trait_type": "Edition", "value": "Open" }
  ],
  "properties": {
    "tier": 4,
    "category": "personal",
    "rarity": "uncommon",
    "unique": false
  }
}
```

For 1/1 global milestones, `Edition` is `"1/1"` and `unique` is `true`.

---

## NFT Tier Reference

| Tier Range | Type | Examples |
|------------|------|----------|
| 1-12 | Personal Milestones | First Timer (1), Dedicated (4), Click God (12) |
| 101-199 | Streak/Special | Week Warrior (101), Perfect Attendance (103) |
| 200-299 | Global 1/1s | The First Click (201), The Millionth (206) |
| 300-399 | Hidden | Nice (303), Blaze It (304), Elite (306) |

### Personal Milestones (1-12)

| Tier | Name | Clicks |
|------|------|--------|
| 1 | First Timer | 1 |
| 2 | Getting Started | 100 |
| 3 | Warming Up | 500 |
| 4 | Dedicated | 1,000 |
| 5 | Serious Clicker | 5,000 |
| 6 | Obsessed | 10,000 |
| 7 | No Sleep | 25,000 |
| 8 | Touch Grass | 50,000 |
| 9 | Legend | 100,000 |
| 10 | Ascended | 250,000 |
| 11 | Transcendent | 500,000 |
| 12 | Click God | 1,000,000 |

### Global 1/1s (200-299)

Only ONE person can ever claim each of these:

| Tier | Name | Global Click # |
|------|------|----------------|
| 201 | The First Click | 1 |
| 202 | Century | 100 |
| 203 | Thousandaire | 1,000 |
| 204 | Ten Grand | 10,000 |
| 205 | The Hundred Thousandth | 100,000 |
| 206 | The Millionth Click | 1,000,000 |
| 207 | Ten Million | 10,000,000 |
| 208 | Halfway There | 50,000,000 |
| 209 | The Final Click | 100,000,000 |

---

## Updating the Signer

If you need to rotate the signing key:

```bash
# As contract owner
cast send <NFT_ADDRESS> "setSigner(address)" <NEW_SIGNER> --rpc-url sepolia --private-key $OWNER_KEY
```

Then update `NFT_SIGNER_PRIVATE_KEY` on your API server.

---

## Useful NFT Commands

```bash
# Check signer address
cast call <NFT_ADDRESS> "signer()" --rpc-url sepolia

# Check if user claimed a tier
cast call <NFT_ADDRESS> "claimed(address,uint256)" <USER> <TIER> --rpc-url sepolia

# Check if global milestone is taken
cast call <NFT_ADDRESS> "globalMilestoneClaimed(uint256)" <TIER> --rpc-url sepolia

# Who owns a global milestone (1/1)?
cast call <NFT_ADDRESS> "globalMilestoneOwner(uint256)" <TIER> --rpc-url sepolia

# Get user's NFT balance for a specific tier (ERC1155)
cast call <NFT_ADDRESS> "balanceOf(address,uint256)" <USER> <TIER> --rpc-url sepolia

# Can a user claim a tier?
cast call <NFT_ADDRESS> "canClaim(address,uint256)" <USER> <TIER> --rpc-url sepolia

# Get all tiers claimed by a user (gas-heavy, use sparingly)
cast call <NFT_ADDRESS> "getClaimedTiers(address,uint256)" <USER> 400 --rpc-url sepolia

# Get token URI (ERC1155)
cast call <NFT_ADDRESS> "uri(uint256)" <TIER> --rpc-url sepolia

# Check if tier is a global 1/1
cast call <NFT_ADDRESS> "isGlobalMilestone(uint256)" <TIER> --rpc-url sepolia
```
