# Tech Feed Aggregator

[![Daily Feed Update](https://github.com/zviryatko/tech-feed/actions/workflows/daily-feed.yml/badge.svg)](https://github.com/zviryatko/tech-feed/actions/workflows/daily-feed.yml)

A daily-updated aggregator that parses data from major engineering blogs (Cloudflare, Google, Uber, Netflix, InfoQ, Pragmatic Engineer, etc.) to provide a single, unified feed for easier access. Built with **Web Components** and **GitHub Actions**.

## Features
- Aggregates posts from major tech blogs:
  - Cloudflare
  - Google Developers
  - Pragmatic Engineer
  - Uber Engineering
  - Netflix TechBlog
  - InfoQ
  - Towards Data Science
- Clean, minimalist interface (Dark/Light mode support).
- **Starring**: Save your favorite posts locally (uses `localStorage`).
- **Filtering**: Search by title or tag.
- **GitHub Actions**: Runs daily to fetch new posts and deploy to GitHub Pages.

## Setup

1. **Clone the repository** (or use this template).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build locally**:
   ```bash
   npm run build
   ```
   This generates the static site in the `public/` directory.

## Deployment

The project is configured to auto-deploy to GitHub Pages using GitHub Actions.

1. Push this code to a GitHub repository.
2. Go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **Deploy from a branch**.
4. Once the Action runs at least once, a `gh-pages` branch will be created. Select `gh-pages` as the source branch and `/ (root)` as the folder.
5. Click **Save**.

The action runs automatically every day at 8:00 UTC. You can also trigger it manually from the **Actions** tab.

## Customization

Edit `build.js` to add or remove RSS feeds in the `FEEDS` array.
```javascript
const FEEDS = [
  { label: 'My Blog', url: 'https://example.com/rss' },
  ...
];
```
