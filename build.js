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
    { label: 'Towards Data Science', url: 'https://towardsdatascience.com/feed/' }
];

async function getExistingDates() {
    try {
        if (await fs.pathExists('public/feed.json')) {
            const data = await fs.readJson('public/feed.json');
            return data.reduce((acc, item) => {
                if (item.link && item.pubDate) {
                    acc[item.link] = new Date(item.pubDate);
                }
                return acc;
            }, {});
        }
    } catch (err) {
        console.warn('Could not read existing feed.json', err);
    }
    return {};
}

async function fetchFeed(feedDef, existingDates = {}) {
    try {
        const feed = await parser.parseURL(feedDef.url);
        console.log(`Fetched ${feedDef.label}: ${feed.items.length} items`);
        return feed.items.map(item => {
            let pubDate;
            if (item.pubDate) {
                pubDate = new Date(item.pubDate);
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
