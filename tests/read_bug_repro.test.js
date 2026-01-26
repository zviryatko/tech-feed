/**
 * @jest-environment jsdom
 */
import { TechFeedApp } from '../public/components/tech-feed-app.js';

// Mock fetch
global.fetch = jest.fn();

describe('Bug Reproduction: Unmarking Read in Archive Tab', () => {
    let app;

    // Mock localStorage
    const localStorageMock = (function () {
        let store = {};
        return {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
            clear: jest.fn(() => { store = {}; })
        };
    })();

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    beforeEach(() => {
        fetch.mockClear();
        localStorageMock.clear();
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ([
                { title: 'Item 1', link: 'http://item1.com' }
            ])
        });

        app = new TechFeedApp();
        document.body.appendChild(app);
    });

    afterEach(() => {
        document.body.removeChild(app);
    });

    test('should allow unmarking read item after switching to Archive tab', async () => {
        await Promise.resolve();

        // 1. Setup: Item is read
        app.state.readIds = ['http://item1.com'];

        // 2. Switch to Archive Tab
        const archiveTab = app.shadowRoot.getElementById('view-archive');
        archiveTab.click();

        expect(app.state.view).toBe('archive');

        // 3. Emit toggle-read event
        const event = new CustomEvent('toggle-read', {
            detail: { url: 'http://item1.com' },
            bubbles: true,
            composed: true
        });
        app.shadowRoot.dispatchEvent(event);

        // 4. Assert
        // Should be unread
        expect(app.state.readIds).not.toContain('http://item1.com');

        // UI should update (list empty)
        const list = app.shadowRoot.getElementById('list-container');
        expect(list.children.length).toBe(1);
        expect(list.children[0].className).toBe('empty');
    });
});
