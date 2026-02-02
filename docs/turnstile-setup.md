# Turnstile Setup & Troubleshooting

## How Turnstile Works

Turnstile uses a **key pair** from a single Cloudflare widget:

1. **Site Key** (public) - Goes in frontend, renders the challenge widget
2. **Secret Key** (private) - Goes on server, verifies tokens from the widget

**Critical:** Both keys must be from the **same widget**. Mismatched keys = verification always fails.

## Current Configuration

### Cloudflare Widget: "clickstr"
- **Allowed Domains:** `clickstr.fun`, `www.clickstr.fun`
- **Widget Mode:** Managed
- **Site Key:** `0x4AAAAAACV0UOMmCeG_g2Jr`
- **Secret Key:** `0x4AAAAAACV0UOESiWaDY-0EOZUvgaGrqSA`

### Where Keys Are Set

| Key | Location | File/Setting |
|-----|----------|--------------|
| Site Key | clickstr.fun frontend | `public/index.html` line ~1975 (sepolia config) |
| Site Key | clickstr.fun frontend | `public/index.html` line ~1985 (mainnet config) |
| Secret Key | mann.cool server | Vercel env var `TURNSTILE_SECRET_KEY` |

### Verification Flow

```
User on clickstr.fun
    │
    ├── 1. Turnstile widget loads (uses Site Key)
    │
    ├── 2. User completes challenge
    │
    ├── 3. Turnstile returns token to frontend
    │
    ├── 4. Frontend POSTs to mann.cool/api/clickstr
    │      with { address, clicks, turnstileToken }
    │
    ▼
mann.cool server
    │
    ├── 5. Server POSTs to challenges.cloudflare.com/turnstile/v0/siteverify
    │      with { secret: SECRET_KEY, response: token }
    │
    ├── 6. Cloudflare returns { success: true/false, error-codes: [...] }
    │
    └── 7. Server returns 200 (success) or 403 (failed)
```

## Troubleshooting History

### Issue: 403 errors on every POST (Jan 30, 2026)

**Symptoms:**
- Turnstile widget appeared and user could complete it
- mann.cool logs showed POST returning 403
- External API calls to Cloudflare showed 200
- Response body: `{"error": "Verification failed", "reason": "Verification failed", "requiresVerification": true}`

**Root Cause:**
Frontend was using `NETWORK = 'sepolia'`, which had the **TEST** Turnstile site key:
```javascript
turnstileSiteKey: '1x00000000000000000000AA'  // Test key - always passes
```

But mann.cool had the **PRODUCTION** secret key:
```
TURNSTILE_SECRET_KEY=0x4AAAAAACV0UOESiWaDY-0EOZUvgaGrqSA
```

Test site key + production secret key = **mismatched widget keys** = always fails.

**Fix:**
Updated sepolia config in `public/index.html` to use production site key:
```javascript
turnstileSiteKey: '0x4AAAAAACV0UOMmCeG_g2Jr'  // Production key
```

### Debug Logging Added

Added to `mann.cool/api/clickstr.js`:
```javascript
const data = await response.json();
console.log('Turnstile verification response:', JSON.stringify(data));
```

Check mann.cool Vercel logs to see Cloudflare's actual response including error codes.

## Common Cloudflare Error Codes

| Error Code | Meaning |
|------------|---------|
| `missing-input-secret` | Secret key not provided |
| `invalid-input-secret` | Secret key is wrong |
| `missing-input-response` | Token not provided |
| `invalid-input-response` | Token is malformed or expired |
| `invalid-widget-id` | Site key doesn't exist |
| `invalid-parsed-secret` | Secret key format is wrong |
| `bad-request` | Request was malformed |
| `timeout-or-duplicate` | Token already used or expired |
| `internal-error` | Cloudflare internal error |

## Test Keys (Development Only)

Cloudflare provides test keys that always pass/fail:

**Always Pass:**
- Site Key: `1x00000000000000000000AA`
- Secret Key: `1x0000000000000000000000000000000AA`

**Always Fail:**
- Site Key: `2x00000000000000000000AB`
- Secret Key: `2x0000000000000000000000000000000AB`

**Important:** Test keys only work together. You cannot mix test site key with production secret key.

## Checklist for Turnstile Issues

- [ ] Site key and secret key are from the **same** Cloudflare widget
- [ ] Domain is in the widget's allowed hostnames list
- [ ] mann.cool was redeployed after changing `TURNSTILE_SECRET_KEY`
- [ ] Frontend is using correct `NETWORK` config (sepolia vs mainnet)
- [ ] Token is not being reused (each token can only be verified once)
- [ ] Check mann.cool Vercel logs for actual Cloudflare error codes

---

## Client-Side Error Codes (Jan 30, 2026)

Added error code logging to frontend. The error-callback now logs the Turnstile error code:

```javascript
'error-callback': (errorCode) => {
  console.error('Turnstile error:', errorCode);
  statusEl.textContent = 'Verification failed';
}
```

### Error Code Families

| Family | Category | Meaning |
|--------|----------|---------|
| `100***` | Initialization | Page reload needed |
| `102***` | Network params | Connection/browser issues |
| `103***` | Browser params | Compatibility issues |
| `200***` | Widget issues | State problems |
| `300***` | Challenge failure | **Bot behavior detected** |
| `400***` | Configuration | Invalid options |

### Note on 300*** Errors

If you see `300***` errors, Cloudflare is detecting bot-like behavior. Try:
1. Different browser or incognito mode
2. Disable browser extensions (especially wallet extensions)
3. Disable VPN/proxy
4. Try different network (mobile hotspot)

The 401 errors on Private Access Token (`/pat/`) URLs are **expected** and can be ignored if the widget eventually succeeds.
