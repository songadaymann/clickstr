# Clickstr - Overview

## Concept

A proof-of-work "clicker" game on Ethereum mainnet where clicking a button mines valid hashes. Every click distributes tokens AND burns tokens (50/50 split). Built on top of TokenWorks Recursive Strategy.

**Tagline:** "Click the button. Get tokens. Burn tokens."

## Tokenomics

### Token Distribution ($CLICK)

| Allocation | Amount | % | Purpose |
|------------|--------|---|---------|
| Recursive Strategy Pool | 890,000,000 | 89% | TokenWorks flywheel (8% burn on trades) |
| Clickstr Pool | 100,000,000 | 10% | Mining rewards via PoW clicking |
| Creator | 10,000,000 | 1% | Aligned incentives |
| **Total** | **1,000,000,000** | 100% | |

### Token Flow
- Total supply: 1B
- After 90-day game: ~950M (50M distributed to players, 50M burned)
- Plus ongoing 8% burns from TokenWorks trading activity

## The Flywheel

```
STUPID CLICKER              RECURSIVE STRATEGY
     │                              │
     ├── Clicks distribute          ├── Trades burn 8%
     │   + burn 50%                 │
     │                              │
     └──────────┬───────────────────┘
                │
                ▼
        COMBINED EFFECT:
        Activity = Deflation
        More play = Scarcer token
```

## Seasonal Model

Instead of one 90-day game, the project runs multiple shorter seasons:

```
100M tokens in treasury
     ↓
Season 1 (3 days) → allocate 5M → play → burn unused
     ↓
Season 2 (1 week) → allocate 10M → play → burn unused
     ↓
Season 3 (2 weeks) → allocate 15M → play → burn unused
     ↓
[iterate based on what works]
```

**Benefits:**
- Low-risk iteration (test with 5M tokens, not 100M)
- Marketing beats ("Season 2 drops Friday!")
- Adjust mechanics between seasons
- Sustainable treasury depletion
- FOMO from short seasons
- Can stop anytime if not working

**Architecture:**
- Fresh contract deployed per season (not upgradeable)
- Off-chain rewards (NFTs, achievements) persist forever across seasons
- On-chain rewards are per-season, independent
