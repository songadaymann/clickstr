# Stupid Clicker Documentation

A proof-of-work "clicker" game on Ethereum where clicking a button mines valid hashes. Every click distributes tokens AND burns tokens (50/50 split).

**Tagline:** "Click the button. Get tokens. Burn tokens."

## Documentation Index

| Document | Description | Size |
|----------|-------------|------|
| [overview.md](./overview.md) | Project concept, tokenomics, seasonal model | ~2KB |
| [game-mechanics.md](./game-mechanics.md) | Core gameplay rules, PoW, anti-cheat | ~3KB |
| [technical-architecture.md](./technical-architecture.md) | Contracts, frontend, APIs, subgraph | ~5KB |
| [milestones-and-nfts.md](./milestones-and-nfts.md) | Achievement system, NFT tiers, cosmetics | ~7KB |
| [deployment-status.md](./deployment-status.md) | Current deployments, addresses, config | ~3KB |
| [contract-reference.md](./contract-reference.md) | How to query contract state | ~3KB |
| [todo.md](./todo.md) | Remaining tasks before mainnet | ~3KB |
| [session-notes.md](./session-notes.md) | Development history by session | ~5KB |

## Quick Links

**Test Game (Sepolia):**
- StupidClicker: `0x8ac0facc097ba05d70fa5A480F334A28B0802c7e`
- NFT Contract: `0x36E0ecd8E2A5cb854c1F02f07933B81f439c28F8`
- Token: `0xe068de6E3A830BB09b5dcdBB0cD0F631FDC23f28`

**Subgraph:** [Goldsky v1.0.1](https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/stupid-clicker-sepolia/1.0.1/gn)

## For LLMs

Each document is designed to be digestible in a single context window (~3-7KB each). Start with:
1. `overview.md` for the big picture
2. `game-mechanics.md` for how the game works
3. `technical-architecture.md` for implementation details
4. `deployment-status.md` for current state

The `milestones-and-nfts.md` file contains the full achievement reference (larger file).
