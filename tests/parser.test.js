const Parser = require('rss-parser');
// 1. Mock first
jest.mock('rss-parser');

// 2. Then require the module under test (which uses the mock)
const { fetchFeed } = require('../build.js');

describe('Feed Parser', () => {
    let mockParserInstance;

    beforeAll(() => {
        // Grab the instance created inside build.js
        mockParserInstance = Parser.mock.instances[0];
    });

    beforeEach(() => {
        // Clear previous calls
        if (mockParserInstance && mockParserInstance.parseURL && mockParserInstance.parseURL.mockClear) {
            mockParserInstance.parseURL.mockClear();
        }
    });

    test('should fetch and parse items correctly', async () => {
        const mockFeedItems = [
            {
                title: 'Test Article 1',
                link: 'https://example.com/1',
                pubDate: 'Mon, 01 Jan 2024 10:00:00 GMT',
                contentSnippet: 'Snippet 1',
                categories: ['tech']
            },
            {
                title: 'Test Article 2',
                link: 'https://example.com/2',
                pubDate: 'Mon, 01 Jan 2024 12:00:00 GMT',
                contentSnippet: 'Snippet 2'
            }
        ];

        // Setup the mock response
        mockParserInstance.parseURL.mockResolvedValue({
            link: 'https://example.com',
            items: mockFeedItems
        });

        const feedDef = { label: 'Example Blog', url: 'https://example.com/rss' };
        const items = await fetchFeed(feedDef, {});

        expect(items).toHaveLength(2);
        expect(items[0].title).toBe('Test Article 1');
        expect(items[0].source).toBe('Example Blog');
        expect(items[0].sourceUrl).toBe('https://example.com');

        // Verify Date parsing
        expect(items[0].pubDate).toBeInstanceOf(Date);
        expect(items[0].pubDate.toISOString()).toBe(new Date('Mon, 01 Jan 2024 10:00:00 GMT').toISOString());
    });

    test('should handle fetch errors gracefully', async () => {
        mockParserInstance.parseURL.mockRejectedValue(new Error('Network error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const feedDef = { label: 'Error Blog', url: 'https://error.com/rss' };
        const items = await fetchFeed(feedDef, {});

        expect(items).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
