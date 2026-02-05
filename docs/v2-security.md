# Clickstr V2 Security Analysis

Last updated: February 5, 2026

## Scope
This document covers V2 security concerns across the on-chain contracts, the off-chain attestation server, and operational key management. It assumes the architecture described in `docs/v2-architecture.md` and `docs/v2-transition.md`.

## Trust Model
V2 explicitly trades on-chain validation for off-chain validation with on-chain settlement.

Server-trusted components:
1. Click counts in signatures (the server can lie or be compromised).
2. Signature availability (censorship or downtime can block claims).
3. PoW validation (server decides what is valid).
4. Turnstile enforcement (server decides who is "human").

On-chain trustless components:
1. Claim deduplication per user per epoch (`claimed`).
2. Signature verification bound to `(address, epoch, clickCount, season, contract, chainId)`.
3. Token distribution split enforced by the treasury.
4. Click registry append-only totals (assuming authorized games).

## Key Roles and Secret Handling
There are two distinct keys with different risk profiles.

1. Contract owner (deployer or multisig). This key can start games, set the attestation signer, and authorize contracts. It should not live in server environments.
2. Attestation signer (hot key). This key signs claim attestations and must be available to the server. If compromised, an attacker can drain the token pool through valid on-chain claims.

Recommended operational practices for the attestation signer key:
1. Store only on the server side. Never reference this env var in client code or build-time frontend bundles.
2. Disable production secrets for preview deployments to prevent PR-based exfiltration.
3. Never log environment variables or raw errors that might include them.
4. Rotate the signer periodically and after any suspected leak. Use `setAttestationSigner()` on the game contract.
5. Consider using a KMS-backed signing flow or a minimal signing service separate from the main API to reduce blast radius.

## Findings

### Critical

1. Grace-period bypass via `finalizeEpoch` calling `_endGame`.

Description:
`finalizeEpoch(TOTAL_EPOCHS)` triggers `_finalizeEpochInternal`, which calls `_endGame()` unconditionally when `epoch >= TOTAL_EPOCHS`. This bypasses the `CLAIM_GRACE_PERIOD` and immediately burns remaining pool tokens.

Impact:
Users with valid unclaimed attestations can lose rewards immediately at season end even though the contract documents a 72-hour grace period.

Reference:
`contracts/ClickstrGameV2.sol` in `_finalizeEpochInternal` and `_endGame`.

Recommended fix:
Only call `_endGame()` after `block.timestamp >= gameEndTime + CLAIM_GRACE_PERIOD`, or remove the call from `_finalizeEpochInternal` and enforce end-of-game exclusively via `endGame()`.

Status:
✅ FIXED - `_finalizeEpochInternal` now respects `CLAIM_GRACE_PERIOD` before calling `_endGame()`.

2. Attestation signer compromise drains the pool.

Description:
If `ATTESTATION_SIGNER_PRIVATE_KEY` is compromised, an attacker can issue valid signatures for arbitrary addresses and high `clickCount` values (up to `MAX_CLICKS_PER_CLAIM`). They can then submit claims from many addresses and drain the season pool via the treasury (50% to themselves, 50% burned).

Impact:
Rapid depletion of the reward pool and permanent inflation of the click registry.

Recommended mitigation:
Treat the signer as a hot key. Use strong secrets hygiene, rotate keys, and consider KMS or a dedicated signing service. Add server-side guardrails such as per-epoch global caps and anomaly alerts.

Status:
Accepted risk. Key is stored in Vercel env vars (encrypted at rest, not exposed to client). If this key leaks, broader opsec has failed. Can revisit with KMS/dedicated signing service if the game scales significantly.

### High

3. Epoch finalization can grief late claimers.

Description:
`finalizeEpoch` burns the unused emission immediately, but `claimReward` and `claimMultipleEpochs` previously allowed claims for finalized epochs. A malicious actor could finalize right after epoch end, burn unused budget, and reduce or zero out late claims.

Impact:
Late claimers could receive reduced or zero rewards even with valid attestations.

Status:
✅ FIXED - Claims are now blocked for finalized epochs. `claimReward` reverts with `EpochAlreadyFinalized()` and `claimMultipleEpochs` skips finalized epochs. Users must claim before epoch finalization. UI should make claiming obvious.

4. Claim-signature denial-of-service if the API does not authenticate wallet ownership.

Description:
If the claim-signature endpoint accepts `{ address, epoch }` without a wallet-signed challenge, an attacker can request a valid signature for a victim. If the server marks `claim-issued:{addr}:{epoch}` and refuses to re-issue, the victim can be blocked from claiming.

Impact:
Targeted censorship of claims without on-chain recourse.

Recommended fix:
Require a wallet-signed challenge (e.g., SIWE) before issuing. Make issuance idempotent by re-issuing the same signature if the claim is still unclaimed on-chain.

Status:
✅ FIXED - Claim signatures now require a wallet-signed challenge in the V2 API (`/api/clickstr-v2`). Idempotent re-issue is preserved.

5. Epoch progression ordering can cause claim reverts after inactivity.

Description:
`claimReward` checks `epoch > currentEpoch` before calling `_checkAndAdvanceEpoch()`. If the contract is idle for multiple epochs, `currentEpoch` may be stale and valid claims for the real current epoch will revert.

Impact:
Soft DoS on claims after inactivity until a state-advancing call occurs.

Recommended fix:
Call `_checkAndAdvanceEpoch()` before validating `epoch > currentEpoch`, or derive a time-based current epoch for validation.

Status:
✅ FIXED - `_checkAndAdvanceEpoch()` now runs before the `epoch > currentEpoch` validation in `claimReward`.

### Medium

6. Winner state can be overwritten after finalization.

Description:
Winner tracking (`epochWinner`, `epochWinnerClicks`) previously updated on every claim, even after finalization. This could desync the stored winner from the winner actually paid at finalization.

Impact:
Misleading on-chain/off-chain data for consumers reading the winner mappings.

Status:
✅ FIXED - Claims are now blocked for finalized epochs (see issue #3), so winner tracking cannot be modified after finalization.

8. Turnstile session reuse and transferability.

Description:
If Turnstile verification is not bound to wallet address, IP, and short TTL, a single solved token or session can be reused by bots to submit large volumes of clicks.

Impact:
Human-only gameplay can be bypassed without breaking on-chain verification.

Recommended fix:
Bind Turnstile sessions to address and IP, rotate frequently, and enforce re-verification after N clicks or short time windows. Consider requiring a valid session for claim signature issuance as well.

Status:
✅ FIXED - Sessions are now bound to address + hashed IP in `/api/clickstr-v2.js`. Re-verification is required when: (1) session expires (1 hour TTL), (2) IP changes, (3) 500+ clicks since last verification. Claim signatures also require a valid human session.

9. Winner sniping via mempool monitoring.

Description:
Epoch winner is determined by the largest claim at the time of finalization. A bot can front-run `finalizeEpoch` with a last-minute claim and steal the winner bonus.

Impact:
Winner bonus can be consistently captured by MEV bots.

Status:
Accepted as game mechanic. Creates interesting "claim timing" strategy.

10. Multi-season treasury overdraw (operational).

Description:
`startGame()` checks only treasury balance, not the sum of active disburser allowances. Two seasons can over-commit against the same balance.

Impact:
A season could fail mid-way due to treasury exhaustion.

Status:
✅ MITIGATED - Treasury has per-disburser allowance system (`disburserAllowance`, `disburserDisbursed`) that caps each season's spending. Owner should set allowances equal to season pool size and revoke ended seasons. Code enforces limits via `ExceedsAllowance` revert.

11. Epoch and difficulty must be server-derived.

Description:
If the API trusts client-supplied epoch or difficulty target, an attacker can submit PoW for an easier epoch or difficulty and inflate clicks.

Impact:
Unfair click inflation and distorted rewards.

Status:
✅ FIXED - In `/api/clickstr-v2.js`, epoch is derived from contract state via `getGameState()` (line 762), not from client input. The `verifyNonce()` function uses server-controlled epoch and chainId values. Clients only submit nonces; epoch is determined server-side.

### Low / Informational

12. End-game loop could become uncallable for large TOTAL_EPOCHS.

Description:
`_endGame()` loops through all epochs to sum `epochDistributed` and `epochBurned`. With very large `TOTAL_EPOCHS`, this could hit gas limits.

Impact:
Game could become impossible to end cleanly.

Status:
Not an issue. Seasons are capped at ~2 weeks (14 epochs max). At 14 epochs, the loop costs ~60k gas worst case (cold storage reads). The concern would only matter for hundreds or thousands of epochs.

14. `claimMultipleEpochs` silently skips invalid claims.

Description:
Invalid signatures or invalid data are skipped without an event. This can hide bugs or partial failures.

Recommendation:
Emit an event for skipped claims or return structured errors off-chain.

Status:
Accepted. Valid claims still emit `RewardClaimed` events. Silent skipping is intentional for gas efficiency - emitting skip events would increase cost. Callers can compare input array length vs emitted events to detect skips.

15. Auto-finalization cap can leave epochs unfinalized.

Description:
Auto-finalization is capped to 5 epochs per call to avoid gas blowups. Long inactivity can leave multiple epochs unfinalized until more claims occur.

Impact:
Delayed finalization and winner payout. This is operationally acceptable but should be expected.

Status:
Accepted. Cap of 5 epochs per `_checkAndAdvanceEpoch()` call (line 494 in ClickstrGameV2.sol) is a reasonable gas safety limit. Anyone can call `finalizeEpoch()` directly if needed.

### Previously Documented

16. Turnstile bypass for off-season PoW.

Description:
Technical docs mentioned that off-chain PoW submissions could bypass Turnstile when the game is inactive, potentially allowing bots to farm NFT milestones.

Impact:
Bots could accumulate clicks toward NFT eligibility without human verification.

Status:
✅ FIXED - V2 API now allows clicking during off-season but Turnstile is always required. Off-season clicks:
- Still require valid Turnstile session (human verification)
- Count toward lifetime total (for NFT milestones)
- Do NOT count toward epoch leaderboards or token rewards
- Use epoch 0 for PoW/dedup during off-season

## Known Limitations (V1 NFT Contract)

These are known limitations in the deployed V1 NFT contract (`ClickstrNFT.sol`). Since the contract is already deployed on mainnet and working, these are documented for awareness rather than action.

1. **NFT signatures lack chain separation and expiry.**

   The V1 NFT contract signs `keccak256(msg.sender, tier, address(this))` without `chainId` or deadline. This means:
   - Signatures never expire once issued
   - Cross-chain replay is theoretically possible if the same signer key and contract address are used on another chain (e.g., via CREATE2 or a fork)

   **Why it's acceptable:** The signer key is specific to this deployment, we're not planning multi-chain deployments, and `address(this)` provides some domain separation. The `claimed[user][tier]` mapping prevents double-minting on the same chain.

   **Future recommendation:** Any new NFT contract should use EIP-712 typed signatures with `chainId` and include a deadline/nonce for expiry.

## Fixed Items (Historical)
These issues were previously identified and appear fixed in the current code.

1. Treasury enforces 50/50 burn ratio in `disburse`.
2. Registry validates season number against `gameToSeason`.
3. `MAX_CLICKS_PER_CLAIM` limits per-claim click counts.
4. `CLAIM_GRACE_PERIOD` is now enforced in `_finalizeEpochInternal` as well as `endGame()`.
5. Finalizer reward now uses a 50/50 split with reduced rate.

## Operational Checklist (Short)
1. Keep the attestation signer separate from the contract owner.
2. Do not expose production secrets to preview deployments.
3. Audit server logs for accidental env leakage.
4. Add monitoring for anomalous signature issuance or claim volumes.
5. Maintain a key-rotation playbook and practice it.
