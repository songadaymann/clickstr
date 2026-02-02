const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * Bot B - Frontend Automation Bot
 *
 * This bot uses Puppeteer to automate the frontend.
 * It attempts to:
 *   1. Load the frontend
 *   2. Connect a wallet
 *   3. Click the button automatically
 *   4. Submit clicks to the API
 *
 * Purpose: Test if Turnstile effectively blocks automated browsers
 * Expected: Should be BLOCKED by Turnstile verification
 *
 * Usage:
 *   FRONTEND_URL=https://... node scripts/test-bot-b-frontend.js
 *
 * Prerequisites:
 *   npm install puppeteer
 */

// ============ Configuration ============
const CONFIG = {
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  headless: process.env.HEADLESS !== "false", // Default headless, set HEADLESS=false to watch
  clickIntervalMs: 500,        // Click every 500ms
  maxClicks: 100,              // Stop after this many clicks (for testing)
  timeout: 60000,              // Page load timeout
  screenshotOnError: true,     // Take screenshot on errors
};

// ============ State ============
let browser;
let page;
let stats = {
  clicksAttempted: 0,
  clicksSuccessful: 0,
  turnstileChallenges: 0,
  turnstilePassed: 0,
  turnstileFailed: 0,
  apiRequestsAttempted: 0,
  apiRequestsBlocked: 0,
  apiRequestsSuccess: 0,
  errors: [],
  startTime: Date.now()
};

// ============ Helper Functions ============

function log(message, type = "info") {
  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = {
    info: "ℹ️ ",
    success: "✅",
    error: "❌",
    warning: "⚠️ ",
    robot: "🤖"
  }[type] || "";

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function takeScreenshot(name) {
  if (!page) return;

  const screenshotDir = path.join(__dirname, "..", "test-deployment", "screenshots");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  log(`Screenshot saved: ${filename}`, "info");
}

async function waitForSelector(selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

// ============ Bot Actions ============

async function launchBrowser() {
  log("Launching browser...", "robot");

  browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      // Try to look more human
      "--window-size=1920,1080",
    ]
  });

  page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Set user agent to look like a real browser
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Intercept API requests to monitor Turnstile behavior
  await page.setRequestInterception(true);

  page.on("request", request => {
    // Log API requests
    if (request.url().includes("/api/clickstr")) {
      stats.apiRequestsAttempted++;
      log(`API Request: ${request.method()} ${request.url()}`, "info");
    }
    request.continue();
  });

  page.on("response", async response => {
    // Monitor API responses
    if (response.url().includes("/api/clickstr")) {
      const status = response.status();
      log(`API Response: ${status} ${response.url()}`, status === 200 ? "success" : "warning");

      if (status === 403) {
        stats.apiRequestsBlocked++;
        try {
          const body = await response.json();
          if (body.requiresVerification) {
            log("BLOCKED: Turnstile verification required!", "error");
            stats.turnstileChallenges++;
          }
        } catch {
          // Response might not be JSON
        }
      } else if (status === 200) {
        stats.apiRequestsSuccess++;
      }
    }
  });

  log("Browser launched", "success");
}

async function loadFrontend() {
  log(`Loading frontend: ${CONFIG.frontendUrl}`, "robot");

  try {
    await page.goto(CONFIG.frontendUrl, {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout
    });

    log("Frontend loaded", "success");
    await takeScreenshot("01-frontend-loaded");

    return true;
  } catch (error) {
    log(`Failed to load frontend: ${error.message}`, "error");
    stats.errors.push({ phase: "load", error: error.message });
    await takeScreenshot("error-load");
    return false;
  }
}

async function connectWallet() {
  log("Looking for wallet connect button...", "robot");

  // Look for connect button
  const connectButton = await page.$('button:has-text("Connect"), #connect-btn, [data-testid="connect-wallet"]');

  if (!connectButton) {
    // Maybe wallet is already connected?
    const connected = await page.$('.connected, [data-wallet-connected="true"]');
    if (connected) {
      log("Wallet appears to be already connected", "success");
      return true;
    }

    log("Could not find connect button", "warning");
    await takeScreenshot("02-no-connect-button");

    // For this test, we might not have MetaMask installed in Puppeteer
    // That's actually fine - we can still test the clicking and API parts
    log("Note: MetaMask not available in Puppeteer. Testing click/API flow only.", "info");
    return false;
  }

  try {
    await connectButton.click();
    log("Clicked connect button", "info");
    await takeScreenshot("02-wallet-connect-clicked");

    // Wait for wallet modal or connected state
    await page.waitForTimeout(2000);

    return true;
  } catch (error) {
    log(`Wallet connect failed: ${error.message}`, "error");
    stats.errors.push({ phase: "connect", error: error.message });
    return false;
  }
}

async function findAndClickButton() {
  // Look for the main click button
  const buttonSelectors = [
    "#click-button",
    "#button-img",
    'img[src*="button"]',
    ".arcade-button",
    'button:has-text("Click")'
  ];

  for (const selector of buttonSelectors) {
    const button = await page.$(selector);
    if (button) {
      try {
        // Get button position for "realistic" clicking
        const box = await button.boundingBox();
        if (box) {
          // Click in center of button with some randomness
          const x = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
          const y = box.y + box.height / 2 + (Math.random() - 0.5) * 10;

          await page.mouse.click(x, y);
          stats.clicksAttempted++;
          return true;
        }
      } catch (error) {
        log(`Click failed on ${selector}: ${error.message}`, "warning");
      }
    }
  }

  return false;
}

async function checkForTurnstile() {
  // Look for Turnstile challenge
  const turnstileSelectors = [
    'iframe[src*="turnstile"]',
    'iframe[src*="challenges.cloudflare"]',
    "#turnstile-modal",
    ".cf-turnstile",
    '[data-turnstile]'
  ];

  for (const selector of turnstileSelectors) {
    const element = await page.$(selector);
    if (element) {
      const isVisible = await element.isIntersectingViewport();
      if (isVisible) {
        return true;
      }
    }
  }

  return false;
}

async function attemptTurnstileBypass() {
  log("Turnstile challenge detected! Attempting bypass...", "warning");
  stats.turnstileChallenges++;
  await takeScreenshot("turnstile-challenge");

  // Try various bypass techniques (all should fail if Turnstile is working)

  // 1. Just wait and see if it auto-solves (it won't for bots)
  log("Attempt 1: Waiting for auto-solve...", "robot");
  await page.waitForTimeout(5000);

  let stillBlocked = await checkForTurnstile();
  if (!stillBlocked) {
    log("Turnstile somehow passed (unexpected!)", "warning");
    stats.turnstilePassed++;
    return true;
  }

  // 2. Try clicking the checkbox
  log("Attempt 2: Looking for checkbox...", "robot");
  const checkbox = await page.$('iframe[src*="turnstile"]');
  if (checkbox) {
    try {
      const frame = await checkbox.contentFrame();
      if (frame) {
        await frame.click('input[type="checkbox"]');
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      log(`Checkbox click failed: ${e.message}`, "info");
    }
  }

  stillBlocked = await checkForTurnstile();
  if (!stillBlocked) {
    log("Turnstile bypassed via checkbox (unexpected!)", "warning");
    stats.turnstilePassed++;
    return true;
  }

  // 3. All attempts failed (expected behavior)
  log("Turnstile bypass FAILED (this is expected and correct!)", "success");
  stats.turnstileFailed++;
  await takeScreenshot("turnstile-blocked");

  return false;
}

// ============ Main Bot Loop ============

async function runBot() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              BOT B - FRONTEND AUTOMATION                   ║");
  console.log("║                                                            ║");
  console.log("║  This bot attempts to automate clicking via Puppeteer.    ║");
  console.log("║  It SHOULD be blocked by Turnstile verification.          ║");
  console.log("║                                                            ║");
  console.log("║  Press Ctrl+C to stop.                                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  console.log("\n📋 Configuration:");
  console.log(`   Frontend URL: ${CONFIG.frontendUrl}`);
  console.log(`   Headless: ${CONFIG.headless}`);
  console.log(`   Click interval: ${CONFIG.clickIntervalMs}ms`);
  console.log(`   Max clicks: ${CONFIG.maxClicks}`);

  try {
    // Phase 1: Launch browser
    await launchBrowser();

    // Phase 2: Load frontend
    const loaded = await loadFrontend();
    if (!loaded) {
      throw new Error("Failed to load frontend");
    }

    // Phase 3: Try to connect wallet (may fail without MetaMask)
    await connectWallet();

    // Phase 4: Start clicking
    log(`\n🖱️  Starting click loop (${CONFIG.maxClicks} clicks max)...`, "robot");

    for (let i = 0; i < CONFIG.maxClicks; i++) {
      // Check for Turnstile challenge
      const hasTurnstile = await checkForTurnstile();
      if (hasTurnstile) {
        const bypassed = await attemptTurnstileBypass();
        if (!bypassed) {
          log("Cannot continue - Turnstile blocking bot", "error");
          break;
        }
      }

      // Try to click the button
      const clicked = await findAndClickButton();
      if (clicked) {
        stats.clicksSuccessful++;
        process.stdout.write(`   Clicks: ${stats.clicksSuccessful}/${stats.clicksAttempted}\r`);
      } else {
        log("Could not find button to click", "warning");
      }

      // Wait between clicks
      await page.waitForTimeout(CONFIG.clickIntervalMs);

      // Periodically check for Turnstile
      if (i > 0 && i % 10 === 0) {
        log(`Progress: ${i}/${CONFIG.maxClicks} clicks`, "info");
        await takeScreenshot(`progress-${i}`);
      }
    }

    log("\n\nClick loop completed", "info");

  } catch (error) {
    log(`Fatal error: ${error.message}`, "error");
    stats.errors.push({ phase: "main", error: error.message });
    if (CONFIG.screenshotOnError) {
      await takeScreenshot("fatal-error");
    }
  }

  // Print final stats
  await printStats();

  // Cleanup
  if (browser) {
    await browser.close();
  }
}

async function printStats() {
  const runtime = (Date.now() - stats.startTime) / 1000;

  console.log("\n" + "═".repeat(60));
  console.log("                    BOT B RESULTS");
  console.log("═".repeat(60));
  console.log(`⏱️  Runtime: ${runtime.toFixed(1)} seconds`);
  console.log("\n🖱️  Clicking:");
  console.log(`   ├─ Clicks attempted: ${stats.clicksAttempted}`);
  console.log(`   └─ Clicks successful: ${stats.clicksSuccessful}`);
  console.log("\n🛡️  Turnstile:");
  console.log(`   ├─ Challenges encountered: ${stats.turnstileChallenges}`);
  console.log(`   ├─ Bypassed (BAD if > 0): ${stats.turnstilePassed}`);
  console.log(`   └─ Blocked (GOOD): ${stats.turnstileFailed}`);
  console.log("\n📡 API Requests:");
  console.log(`   ├─ Attempted: ${stats.apiRequestsAttempted}`);
  console.log(`   ├─ Blocked (403): ${stats.apiRequestsBlocked}`);
  console.log(`   └─ Successful: ${stats.apiRequestsSuccess}`);
  console.log("\n❌ Errors: " + stats.errors.length);
  if (stats.errors.length > 0) {
    stats.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. [${e.phase}] ${e.error}`);
    });
  }

  // Verdict
  console.log("\n" + "─".repeat(60));
  if (stats.turnstileFailed > 0 && stats.turnstilePassed === 0) {
    console.log("✅ VERDICT: Turnstile is working! Bot was blocked.");
  } else if (stats.turnstilePassed > 0) {
    console.log("⚠️  VERDICT: Turnstile was BYPASSED! This is a security issue.");
  } else if (stats.apiRequestsBlocked > 0) {
    console.log("✅ VERDICT: API requests were blocked (likely 403).");
  } else if (stats.apiRequestsSuccess > 0 && stats.turnstileChallenges === 0) {
    console.log("⚠️  VERDICT: Bot succeeded without Turnstile challenge!");
  } else {
    console.log("❓ VERDICT: Inconclusive. Check screenshots for details.");
  }
  console.log("─".repeat(60));

  // Save stats
  const statsPath = path.join(__dirname, "..", "test-deployment", "bot-b-stats.json");
  fs.writeFileSync(statsPath, JSON.stringify({
    ...stats,
    endTime: Date.now(),
    runtime
  }, null, 2));
  console.log(`\n📊 Stats saved to: ${statsPath}`);
}

// ============ Entry Point ============

process.on("SIGINT", async () => {
  console.log("\n\n🛑 Stopping bot...");
  await printStats();
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

runBot().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
