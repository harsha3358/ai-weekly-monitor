/**
 * linkedin.js
 * Puppeteer-based LinkedIn automation.
 * Posts text + image to your LinkedIn profile — completely free.
 *
 * Strategy:
 *  1. Launch headless Chromium (Puppeteer)
 *  2. Log in with credentials from .env
 *  3. Click "Start a post" on the feed
 *  4. Upload the cover image
 *  5. Type the post text
 *  6. Click "Post"
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, '..', 'puppeteer-data', 'li-session.json');
const USER_DATA_DIR = path.join(__dirname, '..', 'puppeteer-data', 'profile');

// Ensure dirs exist
[path.dirname(SESSION_FILE), USER_DATA_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const SELECTORS = {
  // Login page
  emailInput: '#username',
  passwordInput: '#password',
  loginBtn: '[data-litms-control-urn="sign-in-submit"]',

  // Feed — "Start a post" button
  startPostBtn: '.share-box-feed-entry__top-bar',
  startPostBtnAlt: '[data-control-name="share.sharebox_trigger"]',

  // Post modal
  postTextArea: '.ql-editor[contenteditable="true"]',
  postTextAreaAlt: '[data-placeholder="What do you want to talk about?"]',

  // Image upload
  imageUploadBtn: '[aria-label="Add a photo"]',
  imageUploadInput: 'input[type="file"][accept*="image"]',

  // Submit
  postSubmitBtn: '.share-actions__primary-action',
  postSubmitBtnAlt: '[data-control-name="share.post"]',
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Type text slowly (more human-like)
 */
async function typeSlowly(page, selector, text) {
  await page.click(selector);
  await sleep(300);
  // Use clipboard for faster, more reliable text input
  await page.evaluate((sel, txt) => {
    const el = document.querySelector(sel);
    if (el) {
      el.focus();
    }
  }, selector, text);

  // Type the text character by character with small delays
  for (const char of text) {
    await page.keyboard.type(char, { delay: 15 });
  }
}

/**
 * Check if already logged in (session cookie exists)
 */
function hasSession() {
  return fs.existsSync(SESSION_FILE);
}

/**
 * Perform LinkedIn login
 */
async function doLogin(page) {
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    throw new Error('LINKEDIN_EMAIL and LINKEDIN_PASSWORD must be set in .env');
  }

  console.log('   🔑 Logging in to LinkedIn...');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);

  await page.waitForSelector(SELECTORS.emailInput, { timeout: 10000 });
  await page.type(SELECTORS.emailInput, email, { delay: 50 });
  await sleep(300);
  await page.type(SELECTORS.passwordInput, password, { delay: 50 });
  await sleep(300);
  await page.click(SELECTORS.loginBtn);

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

  // Check if login succeeded
  const url = page.url();
  if (url.includes('/login') || url.includes('/checkpoint')) {
    throw new Error('LinkedIn login failed — check credentials or solve CAPTCHA manually');
  }

  // Save session cookies
  const cookies = await page.cookies();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies), 'utf8');
  console.log('   ✅ Logged in successfully, session saved');
}

/**
 * Restore saved session
 */
async function restoreSession(page) {
  try {
    const cookies = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    await page.setCookie(...cookies);
    console.log('   🍪 Session restored from cache');
    return true;
  } catch {
    return false;
  }
}

/**
 * Main LinkedIn post function
 * @param {string} postText - The post content
 * @param {string|null} imagePath - Absolute path to image file (optional)
 */
async function postToLinkedIn(postText, imagePath = null) {
  if (!process.env.LINKEDIN_EMAIL || !process.env.LINKEDIN_PASSWORD) {
    throw new Error('LinkedIn credentials not configured in .env');
  }

  console.log('\n🚀 Starting LinkedIn automation...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      userDataDir: USER_DATA_DIR, // Persist cookies/session
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // Avoid detection
        '--disable-features=IsolateOrigins,site-per-process',
        '--lang=en-US',
      ],
      defaultViewport: { width: 1280, height: 900 },
    });

    const page = await browser.newPage();

    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    // Remove automation markers
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Try to restore session first
    const sessionRestored = await restoreSession(page);

    // Navigate to LinkedIn feed
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // Check if we're still logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/uas/login')) {
      await doLogin(page);
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
    }

    console.log('   📱 On LinkedIn feed, opening post dialog...');

    // Click "Start a post" button
    let startPostClicked = false;
    const startPostSelectors = [
      '.share-box-feed-entry__top-bar',
      '[class*="share-box"]',
      'button[class*="share"]',
      '.artdeco-button--tertiary[aria-label*="post"]',
    ];

    for (const sel of startPostSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        await page.click(sel);
        startPostClicked = true;
        break;
      } catch {
        // Try next selector
      }
    }

    if (!startPostClicked) {
      // Fallback: click any element that says "What do you want to talk about?"
      await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          if (el.textContent?.includes('What do you want to talk about?') && el.offsetParent) {
            el.click();
            break;
          }
        }
      });
    }

    await sleep(2000);

    // Upload image if provided
    if (imagePath && fs.existsSync(imagePath)) {
      console.log('   🖼️  Uploading cover image...');

      try {
        // Look for image upload button in the modal
        const imageBtn = await page.$(SELECTORS.imageUploadBtn);
        if (imageBtn) {
          await imageBtn.click();
          await sleep(1500);
        }

        // Find the hidden file input and set the file
        const fileInput = await page.$('input[type="file"][accept*="image"]') ||
                          await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.uploadFile(imagePath);
          console.log('   ✅ Image uploaded');
          await sleep(3000); // Wait for upload to complete
        }
      } catch (imgErr) {
        console.warn(`   ⚠️  Image upload skipped: ${imgErr.message}`);
      }
    }

    // Find and fill the text area
    console.log('   ✍️  Typing post content...');
    const textSelectors = [
      '.ql-editor[contenteditable="true"]',
      '[data-placeholder="What do you want to talk about?"]',
      '[contenteditable="true"]',
      '.share-creation-state__text-editor',
    ];

    let textAreaFound = false;
    for (const sel of textSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        await page.click(sel);
        await sleep(500);

        // Use keyboard to type (handles contenteditable better)
        await page.keyboard.type(postText, { delay: 10 });
        textAreaFound = true;
        console.log('   ✅ Post text entered');
        break;
      } catch {
        // Try next
      }
    }

    if (!textAreaFound) {
      throw new Error('Could not find LinkedIn post text area');
    }

    await sleep(2000);

    // Click "Post" button
    console.log('   📤 Submitting post...');
    const submitSelectors = [
      '.share-actions__primary-action',
      'button[class*="share-actions__primary"]',
      '.artdeco-button--primary[class*="share"]',
      'button[data-control-name="share.post"]',
    ];

    let posted = false;
    for (const sel of submitSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          const isDisabled = await page.evaluate((el) => el.disabled || el.getAttribute('aria-disabled') === 'true', btn);
          if (!isDisabled) {
            await btn.click();
            posted = true;
            break;
          }
        }
      } catch {
        // Try next
      }
    }

    if (!posted) {
      // Fallback: find by text content
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.trim() === 'Post' && !btn.disabled) {
            btn.click();
            break;
          }
        }
      });
      posted = true;
    }

    await sleep(4000);

    // Verify post was made (feed should be visible)
    const finalUrl = page.url();
    if (finalUrl.includes('/feed/')) {
      console.log('   🎉 Post published successfully to LinkedIn!');

      // Update session cookies
      const cookies = await page.cookies();
      fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies), 'utf8');
    } else {
      throw new Error(`Unexpected page after posting: ${finalUrl}`);
    }

    return { success: true };
  } catch (err) {
    console.error(`\n❌ LinkedIn posting failed: ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { postToLinkedIn };

// CLI test mode
if (require.main === module) {
  const testPost = `Testing AI Weekly Monitor 🤖

→ This is an automated test post
→ Posted via Puppeteer

#AITools #Test`;

  postToLinkedIn(testPost, null).then(console.log).catch(console.error);
}
