# 🤖 AI Weekly Monitor

An automated, 100% free tool that tracks the latest Artificial Intelligence releases, categorizes them, builds a beautiful web archive, and posts a Gen Z-friendly summary to LinkedIn every week.

🔗 **Live Website Archive:** [https://ai-weekly-monitor.vercel.app](https://ai-weekly-monitor.vercel.app)

---

## 🌟 What This Project Does

Keeping up with the firehose of new AI tools is nearly impossible. The **AI Weekly Monitor** automates the entire process end-to-end:

1. **Scrapes the Web:** It pulls from over 25+ top AI RSS feeds and newsletters every week.
2. **AI Categorization:** It uses **Gemini 2.0 Flash** to filter out the noise and categorize the real tools into clean buckets (Coding & Agents, Video & Media, Research, Enterprise).
3. **Builds an Archive Website:** It automatically generates a dark-mode, responsive HTML report of the week's tools and adds it to the **Past Reports Archive** on the live website.
4. **Generates Thumbnails:** It creates a custom, relevant AI-generated cover image using Nano Banana (Puter.js) for the LinkedIn post.
5. **Posts to LinkedIn:** It uses Gemini to write a snappy, Gen Z-friendly summary of the week's top tools and uses headless Chromium (Puppeteer) to publish it directly to your LinkedIn feed.

---

## ⚡ Advantages of This Project

- **Zero Cost Architecture:** Uses Google Gemini's free tier, Nano Banana's free image generation, and free GitHub Actions runner. No expensive API keys required.
- **Set It and Forget It:** Runs entirely in the cloud on a Monday schedule. You never have to open your computer.
- **Stealth Automation:** Uses `puppeteer-extra-plugin-stealth` to bypass basic bot detections when posting to LinkedIn from a cloud server.
- **Beautiful UI:** The generated website uses modern design principles (glassmorphism, CSS gradients) to present the data clearly.
- **Living Archive:** Doesn't just overwrite data—every week's run is saved in a permanent archive so you can look back at AI history.

---

## 🚀 Setup Instructions

1. Clone this repository.
2. Link the repository to **Vercel** to host the website automatically (the `vercel.json` will automatically route traffic to the `docs/` folder).
3. Add the following **Repository Secrets** in your GitHub Settings (`Settings > Secrets and variables > Actions`):
   - `GEMINI_API_KEY`: Your free Gemini API Key from Google AI Studio.
   - `LINKEDIN_EMAIL`: Your LinkedIn login email.
   - `LINKEDIN_PASSWORD`: Your LinkedIn login password.
   - `WEBSITE_URL`: Your Vercel URL (optional, defaults to `https://[repo-name].vercel.app`).
4. Go to the **Actions** tab in GitHub and click **Run workflow** to trigger your first scan!

---
*Built autonomously by an AI Coding Agent.*
