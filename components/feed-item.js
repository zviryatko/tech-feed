/**
 * Web Component: <feed-item>
 * Renders a single feed item row.
 */
export class FeedItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get styles() {
        return `
            :host {
                display: flex;
                align-items: flex-start;
                margin-bottom: var(--item-spacing);
                padding: 12px 16px;
                background-color: var(--card-bg, transparent); /* Fallback */
                border-radius: 8px;
                transition: background-color 0.2s ease;
                font-family: inherit;
                color: var(--text-primary);
            }
            :host(:hover) {
                background-color: rgba(0,0,0, 0.02);
            }
            @media (prefers-color-scheme: dark) {
                :host(:hover) {
                    background-color: rgba(255,255,255, 0.03);
                }
            }
            .star-btn {
                background: none;
                border: none;
                cursor: pointer;
                color: #d1d5db;
                margin-right: 12px;
                font-size: 18px;
                padding: 0;
                line-height: 1;
                margin-top: 2px;
                transition: color 0.2s;
            }
            .star-btn:hover {
                color: #fbbf24;
            }
            .star-btn.starred {
                color: #fbbf24; /* Amber-400 equivalent */
            }
            .content {
                flex-grow: 1;
                min-width: 0; /* Flexbox text overflow fix */
            }
            .title-line {
                font-size: 16px;
                line-height: 1.4;
                margin-bottom: 6px;
                display: block;
            }
            .title-link {
                color: var(--text-primary);
                text-decoration: none;
                font-weight: 600;
                letter-spacing: -0.01em;
            }
            .title-link:visited {
                color: var(--text-secondary); /* Subtle visited state */
            }
            .title-link:hover {
                color: var(--accent-color);
            }
            .meta-line {
                font-size: 13px;
                color: var(--text-secondary);
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
            }
            .source-link {
                color: var(--text-primary);
                font-weight: 500;
                text-decoration: none;
            }
            .source-link:hover {
                text-decoration: underline;
                color: var(--accent-color);
            }
            .meta-separator {
                color: var(--border-color);
            }
            .tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-left: auto; /* Push tags to the right or just keep them inline */
            }
            /* If tags are adjacent to time, just keep normal flow */
            .tags { 
                margin-left: 0; 
            }
            
            .tag {
                background-color: var(--bg-color); /* Matches page bg effectively */
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 1px 8px;
                font-size: 11px;
                cursor: pointer;
                color: var(--text-secondary);
                transition: all 0.2s;
            }
            .tag:hover {
                border-color: var(--text-secondary);
                color: var(--text-primary);
            }
        `;
    }

    set data({ item, index, isStarred }) {
        this._item = item;
        this._index = index;
        this._isStarred = isStarred;
        this.render();
    }

    connectedCallback() {
        // Ensure styles are available from parent context if needed, 
        // but we use shadow DOM styles here relying on CSS variables passed down.
    }

    formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHrs < 24) return `${diffHrs}h ago`; // Shortened
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays}d ago`; // Shortened

        return date.toLocaleDateString();
    }

    toggleStar() {
        this.dispatchEvent(new CustomEvent('toggle-star', {
            bubbles: true,
            composed: true,
            detail: { url: this._item.link }
        }));
    }

    filterTag(tag) {
        this.dispatchEvent(new CustomEvent('filter-tag', {
            bubbles: true,
            composed: true,
            detail: { tag }
        }));
    }

    render() {
        const { title, link, source, sourceUrl, pubDate, categories } = this._item;
        const cats = (categories || [])
            .filter(c => typeof c === 'string' && c.length < 20)
            .slice(0, 4);

        this.shadowRoot.innerHTML = `
            <style>${FeedItem.styles}</style>
            <button class="star-btn ${this._isStarred ? 'starred' : ''}">${this._isStarred ? '★' : '☆'}</button>
            <div class="content">
                <div class="title-line">
                    <a href="${link}" target="_blank" class="title-link">${title}</a>
                </div>
                <div class="meta-line">
                    <a href="${sourceUrl}" target="_blank" class="source-link">${source}</a>
                    <span class="meta-separator">•</span>
                    <span class="time">${this.formatTime(pubDate)}</span>
                    <span class="tags"></span>
                </div>
            </div>
        `;

        // Add event listeners manually to keep clean
        this.shadowRoot.querySelector('.star-btn').onclick = () => this.toggleStar();

        const tagsContainer = this.shadowRoot.querySelector('.tags');
        cats.forEach(c => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = c;
            tagSpan.onclick = () => this.filterTag(c);
            tagsContainer.appendChild(tagSpan);
        });
    }
}

customElements.define('feed-item', FeedItem);
