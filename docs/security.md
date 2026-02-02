# Security Assessment & Mitigations

Last updated: February 2, 2026

## Overview

This document covers security threats, mitigations, and ongoing considerations for the Clickstr game system including smart contracts, API endpoints, and frontend.

---

## Architecture Security Summary

| Component | Security Model |
|-----------|---------------|
| **Clickstr.sol** | PoW validation, ReentrancyGuard, emission caps |
| **ClickstrNFT.sol** | Signature verification, claimed tracking, global 1/1 protection |
| **Claim Signature API** | Rate limiting, atomic locks, eligibility verification |
| **Frontend** | Turnstile bot detection, localStorage for pending state |

---

## Threat Matrix

| Threat | Severity | Likelihood | Impact | Status |
|--------|----------|------------|--------|--------|
| Server private key compromise | CRITICAL | Low | Total NFT system compromise | Mitigated |
| Global milestone race condition | HIGH | Medium | Duplicate 1/1 signatures | **Fixed** |
| Off-chain eligibility trust | HIGH | Low | Unearned NFTs | Partially mitigated |
| API DoS via spam | MEDIUM | Medium | Service disruption | **Fixed** |
| Bot automation | MEDIUM | High | Unfair advantage | Partially mitigated |
| GPU/ASIC mining | MEDIUM | Medium | Unfair advantage | By design |
| Front-running globals | MEDIUM | Medium | Lost 1/1 NFT | Open (MEV) |
| LocalStorage manipulation | LOW | High | Visual-only | N/A |
| Signature replay | LOW | Low | None | Fully mitigated |
| Token pool drainage | LOW | Very Low | None | Fully mitigated |

---

## Smart Contract Security

### Clickstr.sol

**Protections:**
- `ReentrancyGuard` on all external functions
- Proof-of-work validation (nonce + address + epoch + chainId)
- Used nonces tracked to prevent replay
- Epoch emission budget caps (2% of pool per epoch)
- Max 10% of pool per transaction
- Gas bomb protection (max 5 epochs auto-finalized)
- No owner withdrawal function (pool is locked)

**Audit Status:** Internal review completed. No external audit yet.

### ClickstrNFT.sol

**Protections:**
- ECDSA signature verification (EIP-191)
- `claimed[address][tier]` prevents double-claim per user
- `globalMilestoneClaimed[tier]` prevents duplicate 1/1s
- Signature bound to: `(address, tier, contractAddress)`
- Signer address updatable by owner (key rotation)

**Signature Message Format:**
```solidity
keccak256(abi.encodePacked(msg.sender, tier, address(this)))
```

---

## API Security

### Claim Signature Endpoint

**Endpoint:** `POST /api/clickstr-claim-signature`

#### Rate Limiting (Added Feb 2, 2026)

```javascript
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // per address
```

- Sliding window using Redis with TTL
- Returns 429 with retry information
- Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### Atomic Locks for Global 1/1s (Added Feb 2, 2026)

```javascript
const GLOBAL_LOCK_KEY = (tier) => `clickstr:global-lock:${tier}`;
const GLOBAL_LOCK_TTL = 30; // seconds
```

- Uses Redis `SETNX` for atomic lock acquisition
- Prevents race condition where two users get signatures simultaneously
- Returns 409 Conflict if lock held by another user
- Auto-expires after 30 seconds (prevents deadlocks)

#### Eligibility Verification

Before signing, the API verifies:
1. User has unlocked the milestone (Redis: `milestones:{addr}` or `achievements:{addr}`)
2. User hasn't already claimed this tier (Redis: `nft-claimed:{addr}`)
3. For globals: User is the recorded winner (Redis: `global-milestones`)

#### Claim Confirmation (Added Feb 2, 2026)

**Action:** `{ action: 'confirm', address, tier, txHash }`

Called by frontend after successful on-chain mint:
- Updates `nft-claimed` set in Redis
- For globals: Updates global registry and releases lock
- Non-blocking (on-chain is source of truth)

### Click Tracking Endpoint

**Endpoint:** `POST /api/clickstr`

**Protections:**
- Cloudflare Turnstile verification required
- Session-based verification (re-verify every 500 clicks or 1 hour)
- Click count validated (1-10000 per request)
- Address validation

---

## Frontend Security

### Bot Detection

- Cloudflare Turnstile integration
- Human session tracking in Redis
- Leaderboard distinguishes human (frontend) vs bot (contract-only)

### State Management

- Pending clicks stored in localStorage (survives page refresh)
- On-chain state is authoritative
- Frontend syncs with subgraph for display

### Known Exposures

**Alchemy API Key:**
The RPC URL with Alchemy key is exposed in `index.html`. This is unavoidable for static HTML without a build step.

**Mitigations:**
- For testnet: Acceptable risk
- For mainnet: Configure domain allowlist in Alchemy dashboard, or refactor to Vite

---

## Cheating Vectors

### 1. Bot/Script Automation

**Status:** Partially mitigated

Scripts can:
- Call contract directly (bypassing Turnstile)
- Mine faster with GPU/multi-threaded
- Submit more batches per epoch

Scripts cannot:
- Earn off-chain milestones/NFTs (no frontend activity)
- Appear as "human" on leaderboard
- Bypass PoW requirement

**Design Decision:** Scripts are explicitly allowed. They earn $CLICK but not NFT rewards. Gas costs provide natural economic deterrent.

### 2. GPU/ASIC Mining

**Status:** By design

The PoW algorithm (keccak256) is mineable with specialized hardware. Difficulty adjusts based on total clicks, so massive mining makes it harder for everyone.

**Mitigation Options (not implemented):**
- Memory-hard PoW (Ethash, Argon2)
- Proof-of-human (CAPTCHA per batch)
- Time-weighted rewards

### 3. Front-Running Global Milestones

**Status:** Open (inherent MEV risk)

Global 1/1 milestone transactions are visible in mempool. MEV bots could theoretically front-run.

**Mitigation Options (not implemented):**
- Commit-reveal scheme
- Private mempool (Flashbots Protect)
- Accept as known risk

---

## Theft Vectors

### 1. Signature Forgery

**Status:** Fully mitigated

Without the server's private key, signatures cannot be forged. The NFT contract verifies ECDSA signatures against the configured signer address.

### 2. Signature Replay

**Status:** Fully mitigated

- Contract tracks `claimed[address][tier]`
- Same signature can't mint twice
- Signatures are address-bound (can't use someone else's)

### 3. Token Pool Drainage

**Status:** Fully mitigated

- No owner withdrawal function
- Pool only decreases via valid PoW submissions
- Emission caps prevent excessive distribution
- Remaining tokens burn at season end

### 4. Private Key Compromise

**Status:** Mitigated with recovery path

If `NFT_SIGNER_PRIVATE_KEY` is compromised:
1. Attacker could forge signatures for any tier
2. **Recovery:** Call `setSigner(newAddress)` on NFT contract
3. Rotate to new signer key in Vercel env vars

**Prevention:**
- Key stored only in Vercel environment variables
- Never committed to git
- Separate from contract owner key

---

## Monitoring & Incident Response

### Redis Keys to Monitor

```
clickstr:rate-limit:claim:*   # Rate limit counters
clickstr:global-lock:*        # Active claim locks
clickstr:nft-claimed:*        # Claimed NFTs
clickstr:global-milestones    # Global 1/1 winners
```

### Incident Response

**If private key is compromised:**
1. Immediately call `setSigner(newAddress)` on NFT contract
2. Rotate Vercel env var
3. Audit recent claims for fraud

**If API is being abused:**
1. Check rate limit logs
2. Tighten rate limits if needed
3. Add IP-based limiting if address-based is insufficient

**If contract is exploited:**
1. If game is live: Cannot pause (no pause function)
2. Deploy new season contract
3. Update frontend to point to new contract

---

## Future Security Improvements

### Before Mainnet

- [ ] Configure Alchemy domain allowlist
- [ ] External smart contract audit
- [ ] Set up monitoring/alerting for Redis anomalies
- [ ] Document key rotation procedure

### Nice to Have

- [ ] Vite refactor (env vars, code splitting)
- [ ] IP-based rate limiting (in addition to address)
- [ ] Webhook for real-time claim notifications
- [ ] Subgraph-based eligibility verification (cross-reference on-chain)

---

## Changelog

| Date | Change |
|------|--------|
| Feb 2, 2026 | Added rate limiting, atomic locks, claim confirmation |
| Jan 28, 2026 | Deployed ClickstrNFT with signature verification |
| Jan 14, 2026 | Added Cloudflare Turnstile integration |
| Jan 13, 2026 | Fixed gas bomb, death spiral, MEV issues in contract |
| Jan 12, 2026 | Fixed keccak256 mismatch (sha3 vs keccak) |
