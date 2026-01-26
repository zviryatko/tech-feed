import './feed-item.js';

/**
 * Web Component: <tech-feed-app>
 * Main application container.
 */
export class TechFeedApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // State definition
        this.state = {
            items: [],
            starredIds: JSON.parse(localStorage.getItem('tech_feed_starred') || '[]'),
            readIds: JSON.parse(localStorage.getItem('tech_feed_read') || '[]'),
            view: 'new', // 'new' | 'starred' | 'archive'
            search: '',
            loading: true
        };
    }

    static get styles() {
        return `
            :host {
                display: block;
                max-width: var(--container-width, 800px);
                margin: 20px auto;
                padding: 0 20px;
                color: var(--text-primary);
            }
            header {
                background-color: var(--accent-color);
                padding: 12px 16px;
                display: flex;
                align-items: center;
                margin-bottom: 24px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            header h1 {
                font-size: 18px;
                line-height: 1.2;
                margin: 0;
                font-weight: 700;
                color: white;
                margin-right: 24px;
                letter-spacing: -0.02em;
            }
            .header-links {
                display: flex;
                gap: 16px;
            }
            .header-links a {
                color: rgba(255,255,255, 0.8);
                text-decoration: none;
                font-size: 15px;
                font-weight: 500;
                cursor: pointer;
                transition: color 0.2s;
            }
            .header-links a:hover {
                color: white;
            }
            .header-links a.active {
                color: white;
                font-weight: 600;
            }
            .filter-bar {
                margin-bottom: 20px;
            }
            .search-input {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid var(--border-color);
                background-color: var(--card-bg);
                color: var(--text-primary);
                border-radius: 8px;
                font-size: 15px;
                font-family: inherit;
                transition: border-color 0.2s, box-shadow 0.2s;
                box-sizing: border-box;
            }
            .search-input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
            }
            .item-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .loading, .empty {
                padding: 40px;
                text-align: center;
                color: var(--text-secondary);
                font-size: 15px;
            }
            footer {
                border-top: 1px solid var(--border-color);
                margin-top: 40px;
                padding: 24px 0;
                text-align: center;
                font-size: 13px;
                color: var(--text-secondary);
            }
        `;
    }

    async connectedCallback() {
        this.renderSkeleton();
        await this.fetchData();
        this.render();
    }

    async fetchData() {
        try {
            const res = await fetch('./feed.json');
            if (!res.ok) throw new Error('Failed to load');
            this.state.items = await res.json();
            this.state.loading = false;
        } catch (e) {
            console.error(e);
            this.state.loading = false;
            this.state.error = 'Failed to load feed.';
        }
    }

    handleSearch(e) {
        this.state.search = e.target.value.toLowerCase();
        this.renderList();
    }

    toggleView(view) {
        this.state.view = view;
        this.render(); // Re-render header to update active state
    }

    handleToggleStar(e) {
        const url = e.detail.url;
        if (this.state.starredIds.includes(url)) {
            this.state.starredIds = this.state.starredIds.filter(id => id !== url);
        } else {
            this.state.starredIds.push(url);
        }
        localStorage.setItem('tech_feed_starred', JSON.stringify(this.state.starredIds));
        this.renderList();
    }

    handleToggleRead(e) {
        const url = e.detail.url;
        if (this.state.readIds.includes(url)) {
            this.state.readIds = this.state.readIds.filter(id => id !== url);
        } else {
            this.state.readIds.push(url);
        }
        localStorage.setItem('tech_feed_read', JSON.stringify(this.state.readIds));
        this.renderList();
    }

    handleFilterTag(e) {
        const tag = e.detail.tag;
        this.state.search = tag.toLowerCase();
        const input = this.shadowRoot.getElementById('search-input');
        if (input) input.value = tag;
        this.renderList();
    }

    getFilteredItems() {
        return this.state.items.filter(item => {
            const isStarred = this.state.starredIds.includes(item.link);
            const isRead = this.state.readIds.includes(item.link);

            // View filtering
            if (this.state.view === 'starred' && !isStarred) return false;
            if (this.state.view === 'new' && isRead) return false;
            if (this.state.view === 'archive' && !isRead) return false;

            // Search filtering
            if (this.state.search) {
                const content = (item.title + ' ' + (item.categories || []).join(' ') + ' ' + item.source).toLowerCase();
                if (!content.includes(this.state.search)) return false;
            }

            return true;
        });
    }

    renderSkeleton() {
        this.shadowRoot.innerHTML = `
            <style>${TechFeedApp.styles}</style>
            <header>
                <h1>Tech Feed</h1>
            </header>
            <div class="loading">Loading...</div>
        `;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>${TechFeedApp.styles}</style>
            <header>
                <h1>Tech Feed</h1>
                <div class="header-links">
                    <a id="view-new" class="${this.state.view === 'new' ? 'active' : ''}">New</a>
                    <a id="view-starred" class="${this.state.view === 'starred' ? 'active' : ''}">Starred</a>
                    <a id="view-archive" class="${this.state.view === 'archive' ? 'active' : ''}">Archive</a>
                </div>
            </header>

            <div class="filter-bar">
                <input type="text" id="search-input" class="search-input" placeholder="Search titles or tags..." value="${this.state.search}" />
            </div>

            <div id="list-container" class="item-list"></div>

            <footer>
                <p>Built with GitHub Actions & Web Components</p>
            </footer>
        `;

        this.shadowRoot.getElementById('view-new').onclick = () => this.toggleView('new');
        this.shadowRoot.getElementById('view-starred').onclick = () => this.toggleView('starred');
        this.shadowRoot.getElementById('view-archive').onclick = () => this.toggleView('archive');
        this.shadowRoot.getElementById('search-input').oninput = (e) => this.handleSearch(e);

        this.shadowRoot.addEventListener('toggle-star', (e) => this.handleToggleStar(e));
        this.shadowRoot.addEventListener('toggle-read', (e) => this.handleToggleRead(e));
        this.shadowRoot.addEventListener('filter-tag', (e) => this.handleFilterTag(e));

        this.renderList();
    }

    renderList() {
        const container = this.shadowRoot.getElementById('list-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.state.loading) {
            container.innerHTML = '<div class="loading">Loading feed...</div>';
            return;
        }

        if (this.state.error) {
            container.innerHTML = `<div class="loading">${this.state.error}</div>`;
            return;
        }

        const filtered = this.getFilteredItems();
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty">No items found.</div>';
            return;
        }

        // Render limited window for performance (300 items)
        filtered.slice(0, 300).forEach((item, idx) => {
            const el = document.createElement('feed-item');
            el.data = {
                item,
                index: idx,
                isStarred: this.state.starredIds.includes(item.link),
                isRead: this.state.readIds.includes(item.link)
            };
            container.appendChild(el);
        });
    }
}
customElements.define('tech-feed-app', TechFeedApp);
