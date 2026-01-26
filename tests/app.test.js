/**
 * @jest-environment jsdom
 */

import { TechFeedApp } from '../public/components/tech-feed-app.js';

// Mock fetch
global.fetch = jest.fn();

describe('TechFeedApp', () => {
    let app;

    // Mock localStorage
    const localStorageMock = (function () {
        let store = {};
        return {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, value) => {
                store[key] = value.toString();
            }),
            removeItem: jest.fn(key => {
                delete store[key];
            }),
            clear: jest.fn(() => {
                store = {};
            })
        };
    })();

    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
    });

    beforeEach(() => {
        // Clear mocks and store
        fetch.mockClear();
        localStorageMock.clear();
        localStorageMock.setItem.mockClear();
        localStorageMock.getItem.mockClear();

        // Reset fetch response
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ([
                { title: 'Item 1', link: 'http://item1.com', categories: ['tech'] },
                { title: 'Item 2', link: 'http://item2.com', categories: ['news'] }
            ])
        });

        // Instantiate
        app = new TechFeedApp();
    });

    test('initializes with default state', () => {
        expect(app.state.view).toBe('new');
        expect(app.state.starredIds).toEqual([]);
        expect(app.state.readIds).toEqual([]);
    });

    test('loads pinned/read items from localStorage', () => {
        // Populate storage
        localStorageMock.setItem('tech_feed_starred', JSON.stringify(['http://item1.com']));
        localStorageMock.setItem('tech_feed_read', JSON.stringify(['http://item2.com']));

        const newApp = new TechFeedApp();
        expect(newApp.state.starredIds).toContain('http://item1.com');
        expect(newApp.state.readIds).toContain('http://item2.com');
    });

    test('toggles star status', () => {
        const url = 'http://item1.com';
        const event = { detail: { url } };

        // Mock renderList to avoid DOM errors or checking irrelevant render logic
        app.renderList = jest.fn();

        app.handleToggleStar(event);
        expect(app.state.starredIds).toContain(url);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'tech_feed_starred',
            JSON.stringify([url])
        );

        app.handleToggleStar(event);
        expect(app.state.starredIds).not.toContain(url);
    });

    test('toggles read status (archive)', () => {
        const url = 'http://item1.com';
        const event = { detail: { url } };

        app.renderList = jest.fn();

        app.handleToggleRead(event);
        expect(app.state.readIds).toContain(url);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'tech_feed_read',
            JSON.stringify([url])
        );

        app.handleToggleRead(event);
        expect(app.state.readIds).not.toContain(url);
    });

    test('filters items correctly based on view and search', () => {
        app.state.items = [
            { title: 'React News', link: 'p1', categories: [] },
            { title: 'Vue Update', link: 'p2', categories: [] },
            { title: 'Angular', link: 'p3', categories: [] }
        ];
        app.state.starredIds = ['p1'];
        app.state.readIds = ['p3'];

        // View: New (excluding read items)
        app.state.view = 'new';
        let items = app.getFilteredItems();
        let links = items.map(i => i.link);
        expect(links).toContain('p1');
        expect(links).toContain('p2');
        expect(links).not.toContain('p3');

        // View: Starred
        app.state.view = 'starred';
        items = app.getFilteredItems();
        links = items.map(i => i.link);
        expect(links).toContain('p1');
        expect(links).toHaveLength(1);

        // View: Archive
        app.state.view = 'archive';
        items = app.getFilteredItems();
        links = items.map(i => i.link);
        expect(links).toContain('p3');
        expect(links).toHaveLength(1);

        // Search filtering in New
        app.state.view = 'new';
        app.state.search = 'vue';
        items = app.getFilteredItems();
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Vue Update');
    });

    test('UI Integration: Switching tabs updates view and active class', async () => {
        // Setup initial data
        app.state.items = [
            { title: 'New Item', link: 'http://new.com', categories: [] },
            { title: 'Starred Item', link: 'http://starred.com', categories: [] },
            { title: 'Read Item', link: 'http://read.com', categories: [] }
        ];
        app.state.starredIds = ['http://starred.com'];
        app.state.readIds = ['http://read.com'];
        app.state.loading = false; // IMPORTANT: Disable loading state 

        // Force render
        app.render();

        // 1. Check default "New" view
        let newTab = app.shadowRoot.getElementById('view-new');
        let starredTab = app.shadowRoot.getElementById('view-starred');
        let archiveTab = app.shadowRoot.getElementById('view-archive');

        expect(newTab.classList.contains('active')).toBe(true);
        expect(starredTab.classList.contains('active')).toBe(false);

        // Verify content in "New" (should have New Item and Starred Item, but NOT Read Item)
        // Since renderList creates feed-items, we check child count
        app.renderList();

        const list = app.shadowRoot.getElementById('list-container');
        expect(list.children.length).toBe(2); // New + Starred

        // Check content rendered in the first item's Shadow DOM
        const firstItem = list.children[0];
        expect(firstItem.shadowRoot).not.toBeNull();
        expect(firstItem.shadowRoot.querySelector('.title-link').textContent).toBe('New Item');

        // 2. Click "Starred" Tab
        starredTab.click();

        // Re-query elements as render() replaces innerHTML
        newTab = app.shadowRoot.getElementById('view-new');
        starredTab = app.shadowRoot.getElementById('view-starred');

        expect(app.state.view).toBe('starred');
        expect(starredTab.classList.contains('active')).toBe(true);
        expect(newTab.classList.contains('active')).toBe(false);

        // Verify content (Starred only)
        const updatedList = app.shadowRoot.getElementById('list-container');
        expect(updatedList.children.length).toBe(1);
        const starredItem = updatedList.children[0];
        expect(starredItem.shadowRoot.querySelector('.title-link').textContent).toBe('Starred Item');

        // 3. Click "Archive" Tab
        archiveTab = app.shadowRoot.getElementById('view-archive');
        archiveTab.click();

        const archiveList = app.shadowRoot.getElementById('list-container');
        expect(archiveList.children.length).toBe(1);
        const archiveItem = archiveList.children[0];
        expect(archiveItem.shadowRoot.querySelector('.title-link').textContent).toBe('Read Item');
    });

    test('UI Integration: Search input filters list', () => {
        app.state.items = [
            { title: 'React News', link: 'p1', categories: [] },
            { title: 'Vue Update', link: 'p2', categories: [] }
        ];
        app.state.loading = false;
        app.render(); // build DOM

        const input = app.shadowRoot.getElementById('search-input');
        input.value = 'vue';
        input.dispatchEvent(new Event('input')); // Trigger handler

        const list = app.shadowRoot.getElementById('list-container');
        expect(list.children.length).toBe(1);
        expect(list.children[0].shadowRoot.querySelector('.title-link').textContent).toBe('Vue Update');
    });
});
