# Features & Architecture

This document serves as a guide for both humans and AI agents to understand the available features, their implementation, and how to interact with the codebase.

## 🚀 User Features

### 1. **Content Aggregation**
- **Description**: Fetches RSS feeds from multiple configured tech blogs (e.g., Cloudflare, Google, Uber, Netflix).
- **Implementation**: `build.js` uses `rss-parser` to fetch and normalize data into a single `public/feed.json`.
- **Automation**: Runs daily via GitHub Actions.

### 2. **Feed Filtering**
- **Description**: Users can search articles by title, source, or tags.
- **Implementation**: Real-time filtering in `tech-feed-app.js` (`getFilteredItems`).
- **Interaction**: Search input in the header.

### 3. **Starring Items**
- **Description**: Users can "star" items to keep them in a dedicated "Starred" tab.
- **Persistence**: Uses `localStorage` key `tech_feed_starred` (Array of URLs).
- **UI**: Star icon toggle on each feed item.

### 4. **Archiving (Mark as Read)**
- **Description**: Users can mark items as read, moving them to the "Archive" tab.
- **Persistence**: Uses `localStorage` key `tech_feed_read` (Array of URLs).
- **UI**: Checkmark/Circle icon toggle on each feed item.
- **Behavior**: 
    - **New Tab**: Shows items that are NOT read.
    - **Archive Tab**: Shows items that ARE read.
    - **Starred Tab**: Shows starred items regardless of read status.

### 5. **Dark/Light Mode**
- **Description**: Automatically adheres to the user's system preference (`prefers-color-scheme`).
- **Implementation**: CSS Variables in `index.html` (`:root` vs `@media (prefers-color-scheme: dark)`).

---

## 🤖 Agent Context (For AI Developers)

### Project Structure
- **`build.js`**: Node.js script for fetching RSS feeds. usage: `node build.js` (or via `npm run build`). Outputs `public/feed.json`.
- **`public/index.html`**: Entry point. Defines CSS variables and loads the main web component.
- **`public/components/`**:
    - **`tech-feed-app.js`**: Main controller. Manages state (`items`, `starredIds`, `readIds`, `view`, `search`).
    - **`feed-item.js`**: Presentational component for individual rows. Shadow DOM encapsulated.

### State Management (`tech-feed-app.js`)
The application uses a simple reactive state object:
```javascript
this.state = {
    items: [],          // Loaded from feed.json
    starredIds: [],     // Synced with localStorage 'tech_feed_starred'
    readIds: [],        // Synced with localStorage 'tech_feed_read'
    view: 'new',        // 'new' | 'starred' | 'archive'
    search: '',         // Current search query
    loading: true       // Loading state
};
```
Updates to state should generally trigger `this.renderList()` or `this.render()`.

### Event System
Components communicate via Custom Events (bubbling up from `feed-item` to `tech-feed-app`):
- **`toggle-star`**: Dispatched when star button is clicked. Detail: `{ url: string }`.
- **`toggle-read`**: Dispatched when read button is clicked. Detail: `{ url: string }`.
- **`filter-tag`**: Dispatched when a tag is clicked. Detail: `{ tag: string }`.

### Testing
- **Framework**: Jest + JSDOM.
- **Location**: `tests/`.
- **Running**: `npm test`.
- **Scope**:
    - `parser.test.js`: Unit tests for RSS fetching/parsing logic (mocks network).
    - `app.test.js`: Integration tests for the Web Component logic and DOM interactions (mocks localStorage and fetch).

### Customization
To add new feeds, edit the `FEEDS` array in `build.js`.
