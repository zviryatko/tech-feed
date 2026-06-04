const Parser = require('rss-parser');
const fs = require('fs-extra');
const path = require('path');

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    },
    requestOptions: {
        rejectUnauthorized: false
    }
});

const FEEDS = [
    { label: 'Cloudflare', url: 'https://blog.cloudflare.com/rss/' },
    { label: 'Google Developers', url: 'https://developers.googleblog.com/feeds/posts/default?alt=rss' },
    { label: 'Pragmatic Engineer', url: 'https://blog.pragmaticengineer.com/rss/' },
    { label: 'Uber Eng', url: 'https://www.uber.com/en-US/blog/engineering/rss/' },
    { label: 'Netflix Tech', url: 'https://netflixtechblog.com/feed' },
    { label: 'InfoQ', url: 'https://feed.infoq.com/' },
    { label: 'Towards Data Science', url: 'https://towardsdatascience.com/feed/' },
    { label: '@geohot', url: 'https://geohot.github.io/blog/feed.xml' },
    { label: '@zviryatko', url: 'https://zviryatko.github.io/feed.xml' }
];

// Production feed URL (GitHub Pages)
const PRODUCTION_FEED_URL = 'https://zviryatko.github.io/tech-feed/feed.json';

async function getExistingDates() {
    // First try fetching from production
    try {
        console.log('Fetching existing feed from production...');
        const response = await fetch(PRODUCTION_FEED_URL);
        if (response.ok) {
            const data = await response.json();
            console.log(`Loaded ${data.length} existing items from production`);
            return data.reduce((acc, item) => {
                if (item.link && item.pubDate) {
                    acc[item.link] = new Date(item.pubDate);
                }
                return acc;
            }, {});
        } else {
            console.warn(`Production feed returned ${response.status}`);
        }
    } catch (err) {
        console.warn('Could not fetch production feed:', err.message);
    }

    // Fallback to local file if it exists
    try {
        if (await fs.pathExists('public/feed.json')) {
            const data = await fs.readJson('public/feed.json');
            console.log(`Loaded ${data.length} existing items from local file`);
            return data.reduce((acc, item) => {
                if (item.link && item.pubDate) {
                    acc[item.link] = new Date(item.pubDate);
                }
                return acc;
            }, {});
        }
    } catch (err) {
        console.warn('Could not read local feed.json:', err.message);
    }

    console.log('No existing feed found, all items will be treated as new');
    return {};
}

async function fetchFeed(feedDef, existingDates = {}) {
    try {
        const feed = await parser.parseURL(feedDef.url);
        console.log(`Fetched ${feedDef.label}: ${feed.items.length} items`);
        const itemPromises = feed.items.map(async item => {
            let pubDate;
            if (item.pubDate) {
                pubDate = new Date(item.pubDate);
            }

            // Extract the true publication date from Google Developers blog article HTML
            if (feedDef.label === 'Google Developers' && item.link) {
                try {
                    const res = await fetch(item.link);
                    const html = await res.text();
                    const match = html.match(/class="published-date[^"]*">\s*([^<]+?)\s*<\/div>/i);
                    if (match && match[1]) {
                        const parsedDate = new Date(match[1].trim());
                        if (!isNaN(parsedDate.getTime())) {
                            pubDate = parsedDate;
                        }
                    }
                } catch (err) {
                    console.warn(`Could not fetch article HTML for ${item.link}:`, err.message);
                }
            }

            // If date is invalid or missing, check existing dates
            if (!pubDate || isNaN(pubDate.getTime())) {
                if (existingDates[item.link]) {
                    pubDate = existingDates[item.link];
                } else {
                    pubDate = new Date(); // Only default to now if truly new
                }
            }

            return {
                title: item.title,
                link: item.link,
                pubDate: pubDate,
                contentSnippet: item.contentSnippet || item.content || '',
                categories: item.categories || [],
                source: feedDef.label,
                sourceUrl: feed.link
            };
        });
        return await Promise.all(itemPromises);
    } catch (err) {
        console.error(`Error fetching ${feedDef.label}:`, err.message);
        return [];
    }
}

async function build() {
    console.log('Starting feed fetch...');
    const existingDates = await getExistingDates();
    const allProms = FEEDS.map(f => fetchFeed(f, existingDates));
    const results = await Promise.all(allProms);

    // Flatten items
    const allItems = results.flat();

    // Sort by date (newest first)
    allItems.sort((a, b) => b.pubDate - a.pubDate);

    console.log(`Total items: ${allItems.length}`);

    // Generate JSON
    await fs.ensureDir('public');
    await fs.writeJson('public/feed.json', allItems, { spaces: 2 });
    console.log('Successfully wrote public/feed.json');
}

if (require.main === module) {
    build();
}

module.exports = {
    fetchFeed,
    build,
    getExistingDates,
    FEEDS
};
