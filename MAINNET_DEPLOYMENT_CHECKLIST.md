# Stupid Clicker - Mainnet Deployment Checklist

**Status:** NOT READY (See DEPLOYMENT_READINESS_REPORT.md for full analysis)

---

## IMMEDIATE ACTIONS (DO FIRST)

### Critical Security Fixes (1-2 hours)
- [ ] Rotate Alchemy API keys
  - Create new Alchemy project
  - Update all RPC URLs in .env
  - Invalidate old keys
- [ ] Rotate Etherscan API keys
  - Create new key on Etherscan
  - Update in .env
- [ ] Rotate WalletConnect Project ID
- [ ] Create new NFT signer wallet
  - Generate new wallet
  - Save private key securely
  - Update in .env
- [ ] Rotate test private keys (SEPOLIA_PRIVATE_KEY, BOT keys)
  - Create fresh test wallets
  - Fund with fresh Sepolia ETH
- [ ] Create MAINNET_PRIVATE_KEY
  - Create dedicated mainnet deployer wallet
  - Secure key in hardware wallet or secret manager
- [ ] Verify .gitignore includes .env
  - Ensure .env is not committed
  - Check git history for any exposed keys
- [ ] Create .env.example with NO real values
  - Template for developers
  - Commit to repo

---

## WEEK 1: Infrastructure Setup (3-4 days)

### Backend/API Setup
- [ ] Set up Vercel project (or equivalent)
- [ ] Create Upstash Redis instance
  - Save KV_REST_API_URL
  - Save KV_REST_API_TOKEN
- [ ] Set up Cloudflare Turnstile
  - Create Turnstile project
  - Save TURNSTILE_SITE_KEY (public)
  - Save TURNSTILE_SECRET_KEY (private)
- [ ] Implement API endpoints
  - POST /api/stupid-clicker (click tracking + Turnstile)
  - GET /api/stupid-clicker?address=0x... (user stats)
  - POST /api/stupid-clicker/claim-signature (NFT signing)
  - GET /api/stupid-clicker/nft/[tokenId] (metadata)
  - GET /api/stupid-clicker/config (system config)
- [ ] Test API endpoints locally
  - curl tests for each endpoint
  - Error handling
  - Rate limiting
- [ ] Deploy API to Vercel
- [ ] Configure environment variables on Vercel
  - NFT_SIGNER_PRIVATE_KEY
  - NFT_CONTRACT_ADDRESS
  - KV_REST_API_URL
  - KV_REST_API_TOKEN
  - TURNSTILE_SECRET_KEY
  - STUPID_CLICKER_ADMIN_SECRET

### Frontend Setup
- [ ] Create frontend build configuration
  - Separate mainnet/testnet env files
  - Build scripts in package.json
- [ ] Update public/index.html
  - Add Turnstile widget code
  - Add API URL configuration
  - Add contract address
  - Add NFT contract address
  - Add chain ID (1 for mainnet)
- [ ] Test frontend locally with testnet contract
  - Can connect wallet
  - Can click button
  - Mining works
  - Can submit clicks
  - Can claim NFTs
- [ ] Deploy frontend to Vercel
  - Point to API endpoints
  - Point to contract addresses (initially testnet)
  - Point to NFT contract (initially testnet)

---

## WEEK 2: Testing & Verification (3-4 days)

### Comprehensive Testing
- [ ] Run full smart contract test suite
  ```bash
  npm test
  ```
- [ ] Gas cost analysis
  - Calculate submitClicks() gas for different batch sizes
  - Calculate cost in ETH per proof
  - Document break-even click value
- [ ] Load test API
  - Simulate 1000s of concurrent clicks
  - Verify rate limiting works
  - Check response times
- [ ] Load test frontend
  - Simulate 100+ concurrent users
  - Check for memory leaks
  - Verify UI responsiveness
- [ ] Security testing
  - Test Turnstile bot prevention
  - Test replay attack protection
  - Test signature verification
- [ ] End-to-end testing on testnet
  - Deploy to Sepolia
  - Run full game cycle
  - Test NFT claiming
  - Verify leaderboard accuracy
  - Test difficulty adjustments

### Contract Verification
- [ ] Prepare Etherscan verification data
  - Flatten contracts (if needed)
  - Encode constructor arguments
  - Prepare verification script
- [ ] Verify on Sepolia test
  - Deploy to Sepolia
  - Verify on SepoliaEtherscan
  - Confirm all functions visible
- [ ] Dry-run mainnet deployment
  - Use testnet deployment script
  - Confirm all steps work
  - Estimate gas costs

---

## WEEK 3: Compliance & Documentation (2-3 days)

### Legal & Compliance
- [ ] Create Terms of Service
  - Game rules
  - Token disclaimer (no intrinsic value)
  - No warranty
  - Liability limitations
  - Geographic restrictions
  - Dispute resolution
- [ ] Create Privacy Policy
  - Data collected (wallet addresses, click counts)
  - Data storage (Redis)
  - GDPR compliance
  - Cookie policy
- [ ] Create Security Disclosure Policy
  - How to report bugs
  - Email address (security@mann.cool)
  - Response time commitment
  - Bug bounty info (if applicable)

### Documentation
- [ ] Create Operator Runbook
  - Daily monitoring tasks
  - Incident response procedures
  - Key metrics to track
  - Troubleshooting guide
- [ ] Create Deployment SOP
  - Step-by-step deployment guide
  - Rollback procedures
  - Communication plan
  - Monitoring setup
- [ ] Create User Guide
  - How to play
  - Gas cost calculator
  - Tokenomics explained
  - FAQ
- [ ] Create API Documentation
  - Endpoint specs
  - Request/response formats
  - Error codes
  - Rate limits
  - Example code

### Setup Monitoring & Alerting
- [ ] Configure Etherscan monitoring
  - Watch contract for events
  - Set up alerts for unusual activity
- [ ] Configure Sentry for API errors
  - Error tracking
  - Performance monitoring
- [ ] Configure Vercel Analytics
  - User analytics
  - Performance metrics
- [ ] Set up Discord/Slack alerts
  - Critical errors
  - Unusual game activity
  - API downtime

---

## DEPLOYMENT DAY

### Pre-Deployment (24 hours before)
- [ ] Final security audit
- [ ] Backup all sensitive keys
- [ ] Brief team on SOP
- [ ] Prepare rollback plan
- [ ] Draft announcements
  - Twitter announcement
  - Discord message
  - Website update

### Deployment (Execute SOP)
- [ ] Deploy token contract (if needed)
  - Verify constructor args
  - Monitor deployment
  - Verify on Etherscan
  - Save deployment receipt
- [ ] Deploy StupidClicker contract
  - Verify constructor args
  - Check initial difficulty
  - Monitor deployment
  - Verify on Etherscan
  - Save deployment receipt
- [ ] Deploy StupidClickerNFT contract
  - Set signer address
  - Set base URI
  - Verify on Etherscan
  - Save deployment receipt
- [ ] Update frontend config
  - Set NEXT_PUBLIC_CONTRACT_ADDRESS
  - Set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
  - Set NEXT_PUBLIC_CHAIN_ID=1
  - Deploy to Vercel
- [ ] Update API environment
  - Set NFT_CONTRACT_ADDRESS
  - Set contract addresses
  - Verify API is responding
- [ ] Start the game
  - Approve tokens to contract
  - Call startGame()
  - Monitor transaction
  - Verify game started
- [ ] Run smoke tests
  - Connect wallet
  - Place a few clicks
  - Verify pool is correct
  - Check difficulty is reasonable
- [ ] Announce
  - Tweet announcement
  - Discord message
  - Website update
  - Email list (if applicable)

### Post-Launch Monitoring (24+ hours)
- [ ] Monitor difficulty adjustments
  - Should adjust after first epoch
  - Should not be too hard/easy
- [ ] Monitor participation
  - Track unique wallets
  - Track clicks per epoch
  - Watch for bot patterns
- [ ] Monitor API
  - Check response times
  - Check error rates
  - Check Turnstile effectiveness
- [ ] Monitor gas prices
  - Track average tx cost
  - Compare to projected costs
  - Alert if unusually high
- [ ] Monitor social media
  - Twitter mentions
  - Discord discussion
  - Watch for complaint patterns
- [ ] Be ready for emergency pause
  - Have endGame() transaction prepared
  - Be ready to call if exploit found
  - Monitor for unusual behavior

---

## POST-LAUNCH (Week after)

- [ ] Review deployment metrics
  - Total clicks
  - Participation
  - Gas costs
  - API performance
- [ ] Review issues found
  - Bug reports
  - User feedback
  - Performance problems
- [ ] Plan improvements
  - Quick fixes for next season
  - Long-term improvements
  - Feature requests
- [ ] Prepare for Season 2
  - Calculate final difficulty
  - Plan next season parameters
  - Plan NFT bonus tiers

---

## CRITICAL FILES TO PREPARE

Before deployment day, prepare these files:

### deployment-mainnet-config.json
```json
{
  "network": "mainnet",
  "chainId": 1,
  "season": {
    "epochs": 90,
    "duration": 86400,
    "poolAmount": "100000000"
  },
  "deployer": "0x...",
  "deploymentDate": "2026-02-01T00:00:00Z",
  "difficulty": "115792089237316195423570985008687907853269984665640564039457584007913129639"
}
```

### mainnet-env-template.txt
```
# Mainnet Environment Variables
ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
MAINNET_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
NFT_SIGNER_PRIVATE_KEY=0x...
NFT_CONTRACT_ADDRESS=0x...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
TURNSTILE_SECRET_KEY=...
STUPID_CLICKER_ADMIN_SECRET=...
```

### rollback-plan.md
```markdown
# Rollback Plan

If something goes wrong, here's how to recover:

1. Call endGame() to pause the game
2. Notify community
3. Investigate the issue
4. Deploy fix or hotfix contract
5. Relaunch with new contract address
```

---

## SIGN-OFF

Before deployment, confirm:
- [ ] All critical security issues fixed
- [ ] All infrastructure deployed and tested
- [ ] All documentation complete
- [ ] Legal documents ready
- [ ] Team briefed on SOP
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Communication plan ready

**Ready for mainnet:** [ ] YES / [ ] NO

**Date:** _______________

**Signed by:** _______________

---

*Last updated: January 29, 2026*
