/**
 * image-generator.js
 * Uses Puter.js with Nano Banana (Gemini image model) — completely FREE.
 * No API key needed. Puter uses a User-Pays model so dev cost = $0.
 *
 * API: puter.ai.txt2img(prompt, { provider: 'gemini', model: 'nano-banana' })
 * Docs: https://docs.puter.com/AI/txt2img/
 */

const { puter } = require('@heyputer/puter.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const IMAGES_DIR = path.join(__dirname, '..', 'reports', 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ─── Prompt builder ───────────────────────────────────────────────────────────

/**
 * Build a vivid, highly specific image prompt based on this week's top tools.
 * The prompt is tuned for Nano Banana (Gemini image model).
 */
function buildImagePrompt(grouped) {
  const domainThemes = {
    'Video/Media':
      'holographic film reels floating in neon space, AI-generated video frames, glowing waveforms, vibrant purple and pink neon',
    'Coding/Agents':
      'glowing code streams, neural network nodes connecting, futuristic robot hands typing on holographic keyboard',
    'Research/Analytics':
      'glowing 3D data graphs and charts floating in dark space, scientific diagrams, AI brain visualization',
    'Enterprise/Security':
      'sleek digital shield with glowing lock icons, cloud network connections, blue and gold enterprise aesthetic',
    'General':
      'AI brain surrounded by glowing circuits and data streams',
  };

  // Get active domains this week
  const activeDomains = Object.entries(grouped)
    .filter(([, articles]) => articles.length > 0)
    .map(([domain]) => domain)
    .slice(0, 2); // Top 2 dominant domains

  // Pick top tool names mentioned this week
  const topTools = Object.values(grouped)
    .flat()
    .sort((a, b) => (b.sourcePriority === 'HIGH' ? 1 : 0) - (a.sourcePriority === 'HIGH' ? 1 : 0))
    .slice(0, 3)
    .map((a) => a.title.split(/[-–:|,]/)[0].trim().slice(0, 25))
    .filter(Boolean);

  const themeVisuals = activeDomains
    .map((d) => domainThemes[d] || domainThemes['General'])
    .join(', ');

  // Build a highly descriptive, visually rich prompt
  const prompt = [
    `Futuristic dark tech poster, ultra HD digital art`,
    themeVisuals,
    `deep dark background (#0a0a0f), neon purple and indigo glow`,
    `glassmorphism panels with glowing borders`,
    `text "AI Weekly" in bold futuristic typography at the top`,
    `week's theme: ${topTools.length > 0 ? topTools.join(', ') : 'AI tools'}`,
    `Gen Z aesthetic, trending on Artstation`,
    `cinematic lighting, volumetric glow effects`,
    `16:9 wide aspect ratio, no humans`,
    `highly detailed, 4K quality`,
  ].join(', ');

  return prompt;
}

// ─── Image download utility ───────────────────────────────────────────────────

/**
 * Download an image from a URL to a local file.
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outputPath);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadImage(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Clean up partial file
      reject(err);
    });
  });
}

// ─── Base64 to file ───────────────────────────────────────────────────────────

/**
 * Save base64 image data to a file.
 */
function saveBase64Image(base64Data, outputPath) {
  // Strip data URL prefix if present (e.g., "data:image/png;base64,")
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

// ─── HTML element to image file ───────────────────────────────────────────────

/**
 * Extract image from Puter's returned HTMLImageElement or object and save locally.
 */
async function extractAndSaveImage(imageResult, outputPath) {
  // Puter returns different shapes depending on provider
  // Check for common response shapes

  // Shape 1: { src } — img element or plain object with src
  if (imageResult && imageResult.src) {
    const src = imageResult.src;
    if (src.startsWith('data:')) {
      saveBase64Image(src, outputPath);
      return outputPath;
    } else if (src.startsWith('http')) {
      await downloadImage(src, outputPath);
      return outputPath;
    }
  }

  // Shape 2: { url }
  if (imageResult && imageResult.url) {
    await downloadImage(imageResult.url, outputPath);
    return outputPath;
  }

  // Shape 3: { data } — base64 string
  if (imageResult && imageResult.data) {
    saveBase64Image(imageResult.data, outputPath);
    return outputPath;
  }

  // Shape 4: raw base64 string
  if (typeof imageResult === 'string' && imageResult.startsWith('data:')) {
    saveBase64Image(imageResult, outputPath);
    return outputPath;
  }

  // Shape 5: raw URL string
  if (typeof imageResult === 'string' && imageResult.startsWith('http')) {
    await downloadImage(imageResult, outputPath);
    return outputPath;
  }

  // Shape 6: Buffer
  if (Buffer.isBuffer(imageResult)) {
    fs.writeFileSync(outputPath, imageResult);
    return outputPath;
  }

  throw new Error(`Unknown image response shape: ${JSON.stringify(Object.keys(imageResult || {}))}`);
}

// ─── Main image generation function ──────────────────────────────────────────

/**
 * Generate a weekly cover image using Nano Banana (Gemini) via Puter.js.
 * Falls back to Pollinations.ai if Puter fails.
 *
 * @param {Object} grouped - Articles grouped by domain
 * @returns {Promise<string|null>} Absolute path to saved image, or null on failure
 */
async function generateWeeklyImage(grouped) {
  const dateStr = new Date().toISOString().split('T')[0];
  const outputPath = path.join(IMAGES_DIR, `cover-${dateStr}.jpg`);
  const prompt = buildImagePrompt(grouped);

  console.log('\n🍌 Generating image with Nano Banana (Gemini via Puter.js)...');
  console.log(`   Prompt: ${prompt.slice(0, 100)}...`);

  // ── Attempt 1: Nano Banana via Puter.js ──────────────────────────────────
  try {
    const imageResult = await puter.ai.txt2img({
      prompt,
      provider: 'gemini',
      model: 'nano-banana', // Gemini 2.5 Flash Image (Nano Banana)
      ratio: { w: 16, h: 9 }, // 16:9 for LinkedIn cover
      quality: '1K',          // 1024px — good quality, fast generation
    });

    await extractAndSaveImage(imageResult, outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`   ✅ Nano Banana image saved: ${outputPath} (${(stats.size / 1024).toFixed(0)} KB)`);
    return outputPath;

  } catch (nanoBananaErr) {
    console.warn(`   ⚠️  Nano Banana failed: ${nanoBananaErr.message}`);
    console.log('   🔄 Falling back to Pollinations.ai...');

    // ── Fallback: Pollinations.ai (always free, no auth) ───────────────────
    try {
      const { default: axios } = await import('axios');
      const encodedPrompt = encodeURIComponent(prompt);
      const seed = Date.now() % 99999;
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&seed=${seed}&model=flux&enhance=true&nologo=true`;

      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: 60000,
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(outputPath);
      console.log(`   ✅ Fallback image saved via Pollinations.ai (${(stats.size / 1024).toFixed(0)} KB)`);
      return outputPath;

    } catch (fallbackErr) {
      console.error(`   ❌ Both image generators failed: ${fallbackErr.message}`);
      return null;
    }
  }
}

module.exports = { generateWeeklyImage, buildImagePrompt };

// ─── CLI test ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  const mockGrouped = {
    'Coding/Agents': [{ title: 'Claude Code goes terminal', sourcePriority: 'HIGH', publishedAt: new Date() }],
    'Video/Media': [{ title: 'Sora 2 drops in wild', sourcePriority: 'HIGH', publishedAt: new Date() }],
    'Research/Analytics': [],
    'Enterprise/Security': [],
  };

  generateWeeklyImage(mockGrouped).then((path) => {
    if (path) console.log(`\n✅ Test image saved to: ${path}`);
    else console.log('\n❌ Image generation failed');
  });
}
