
document.addEventListener('DOMContentLoaded', () => {

    // --- JSDOC TYPE DEFINITIONS ---

    /**
     * @typedef {object} Story
     * @property {number} id
     * @property {string} [title]
     * @property {string} [url]
     * @property {number} [score]
     * @property {string} [by]
     * @property {number} [descendants]
     * @property {number} time
     * @property {string} [text]
     * @property {number[]} [kids]
     * @property {boolean} [deleted]
     */

    /**
     * @typedef {object} Comment
     * @property {number} id
     * @property {string} [by]
     * @property {number[]} [kids]
     * @property {number} [parent]
     * @property {string} [text]
     * @property {number} time
     * @property {boolean} [deleted]
     */

    /**
     * @typedef {object} AlgoliaHit
     * @property {string} objectID
     * @property {string | null} title
     * @property {string | null} url
     * @property {number} points
     * @property {string} author
     * @property {number} num_comments
     * @property {number} created_at_i
     * @property {string | null} story_text
     */


    // --- STATE MANAGEMENT ---

    const appState = {
        stories: [],
        storyIds: [],
        storiesOffset: 0,
        isFetching: false,
        activeCategory: 'topstories',
        activeSort: 'default',
        sortPreferences: {}, // Stores sort preference per category
        isSearchView: false,
        searchQuery: '',
        searchPage: 0,
        searchTotalPages: 0,
        maxScore: 0,
        maxComments: 0,
        comments: {
            storyId: null,
            story: null,
            rootCommentIds: [],
            loadedRootCount: 0,
            isFetchingMain: false,
            collapsed: new Set(),
            focusedCommentId: null,
            scrollPositionBeforeFocus: 0,
        }
    };

    // --- CONSTANTS ---

    const API_BASE = 'https://hacker-news.firebaseio.com/v0';
    const ALGOLIA_API_BASE = 'https://hn.algolia.com/api/v1/search';
    const STORIES_PER_PAGE = 30;
    const MAX_STORIES_IN_DOM = 150;
    const MAIN_COMMENTS_PER_BATCH = 20;
    const REPLIES_PER_BATCH = 15;

    // --- DOM ELEMENTS ---

    const elements = {
        preloader: document.getElementById('preloader'),
        headerDate: document.getElementById('header-date'),
        headerTime: document.getElementById('header-time'),
        headerWeather: document.getElementById('header-weather'),
        grid: document.getElementById('stories-grid'),
        categoryButtons: document.querySelectorAll('.story-categories button'),
        subFilters: document.getElementById('sub-filters'),
        sortButtons: document.querySelectorAll('.story-sorters button'),
        searchInput: document.getElementById('search-input'),
        serendipityBtn: document.getElementById('serendipity-btn'),
        body: document.body,
        scrollSentinel: document.getElementById('scroll-sentinel'),
        infiniteScrollLoader: document.getElementById('infinite-scroll-loader'),
        commentsOverlay: document.getElementById('comments-overlay'),
        overlayCloseBtn: document.getElementById('overlay-close-btn'),
        overlayBackBtn: document.getElementById('overlay-back-btn'),
        overlayHeaderTitle: document.getElementById('overlay-header-title'),
        overlayStoryDetails: document.getElementById('overlay-story-details'),
        overlayCommentsContainer: document.getElementById('overlay-comments-container'),
        commentsScrollSentinel: document.getElementById('comments-scroll-sentinel'),
        commentsInfiniteLoader: document.getElementById('comments-infinite-loader'),
        backToTopBtn: document.getElementById('back-to-top-btn'),
    };
    
    // --- OBSERVERS ---

    let commentsObserver = null;

    // --- UTILITY FUNCTIONS ---

    /**
     * @param {Function} func The function to debounce.
     * @param {number} delay The delay in milliseconds.
     */
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    /** @param {number} timestamp Unix timestamp in seconds */
    function timeAgo(timestamp) {
        if (!timestamp) return '';
        const now = new Date();
        const seconds = Math.floor((now.getTime() - timestamp * 1000) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;

        const years = Math.floor(months / 12);
        return `${years}y ago`;
    }

    /**
     * A simple, naive HTML sanitizer. For a production app, a robust library like DOMPurify is recommended.
     * @param {string} htmlString The HTML string to sanitize.
     * @returns {string} Sanitized HTML string.
     */
    function simpleSanitize(htmlString) {
        if (!htmlString) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        const allowedTags = ['P', 'B', 'I', 'EM', 'STRONG', 'A', 'PRE', 'CODE', 'BLOCKQUOTE'];
        
        tempDiv.querySelectorAll('*').forEach(el => {
            if (!allowedTags.includes(el.tagName)) {
                el.outerHTML = el.innerHTML;
            } else if (el.tagName === 'A') {
                const href = el.getAttribute('href');
                if (!href || !href.startsWith('http')) {
                    el.removeAttribute('href');
                } else {
                    el.setAttribute('target', '_blank');
                    el.setAttribute('rel', 'noopener noreferrer nofollow');
                }
            }
        });
        return tempDiv.innerHTML;
    }

    function recalculateRelativeMaxValues() {
        if (appState.stories.length === 0) {
            appState.maxScore = 1;
            appState.maxComments = 1;
            return;
        }
        const allScores = appState.stories.map(s => s.score || 0);
        const allComments = appState.stories.map(s => s.descendants || 0);
        
        // Use the 95th percentile instead of a pure max to avoid extreme outliers skewing the results too much.
        allScores.sort((a, b) => a - b);
        allComments.sort((a, b) => a - b);
        
        const scoreIndex = Math.min(Math.floor(allScores.length * 0.95), allScores.length - 1);
        const commentsIndex = Math.min(Math.floor(allComments.length * 0.95), allComments.length - 1);
        
        // Ensure maxScore and maxComments are at least 1 to prevent division by zero.
        appState.maxScore = allScores[scoreIndex] || 1;
        appState.maxComments = allComments[commentsIndex] || 1;
    }

    // --- API FUNCTIONS ---

    /** @param {string} endpoint */
    async function fetchAPI(endpoint) {
        const response = await fetch(`${API_BASE}/${endpoint}.json`);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return response.json();
    }
    
    async function fetchStories(loadMore = false) {
        if (appState.isFetching) return;
        appState.isFetching = true;
        
        if (loadMore) {
            elements.infiniteScrollLoader.hidden = false;
        } else {
            if (elements.preloader.classList.contains('loaded')) {
                showGridLoader();
            }
            appState.storiesOffset = 0;
            appState.stories = [];
        }

        try {
            if (!loadMore) {
                appState.storyIds = await fetchAPI(appState.activeCategory);
            }
            const idsToShow = appState.storyIds.slice(appState.storiesOffset, appState.storiesOffset + STORIES_PER_PAGE);
            const storyPromises = idsToShow.map(id => fetchAPI(`item/${id}`));
            const newStories = (await Promise.all(storyPromises)).filter(Boolean);
            
            appState.stories.push(...newStories);
            recalculateRelativeMaxValues();
            
            if (loadMore) {
                renderStories(newStories, true);
            } else {
                displayStories();
            }
            appState.storiesOffset += STORIES_PER_PAGE;

        } catch (error) {
            console.error('Error fetching stories:', error);
            elements.grid.classList.remove('loading');
            elements.grid.innerHTML = '<p class="error">Failed to load stories.</p>';
        } finally {
            appState.isFetching = false;
            if (loadMore) {
                elements.infiniteScrollLoader.hidden = true;
            }
            if (!elements.preloader.classList.contains('loaded')) {
                 elements.preloader.classList.add('loaded');
            }
        }
    }

    async function fetchSearchResults(loadMore = false) {
        if (appState.isFetching) return;
        appState.isFetching = true;
        
        if (loadMore) {
            appState.searchPage++;
            elements.infiniteScrollLoader.hidden = false;
        } else {
            showGridLoader();
            appState.stories = [];
            appState.searchPage = 0;
        }

        try {
            const queryTags = (appState.activeCategory === 'askstories' || appState.activeCategory === 'showstories') 
                ? `(story,${appState.activeCategory})`
                : 'story';
            const response = await fetch(`${ALGOLIA_API_BASE}?query=${encodeURIComponent(appState.searchQuery)}&tags=${queryTags}&page=${appState.searchPage}`);
            if (!response.ok) throw new Error(`Failed to search for "${appState.searchQuery}"`);
            const data = await response.json();

            appState.searchTotalPages = data.nbPages;

            /** @type {Story[]} */
            const newStories = data.hits
                .filter(/** @param {AlgoliaHit} hit */ hit => hit.title && hit.author)
                .map(/** @param {AlgoliaHit} hit */ hit => ({
                    id: parseInt(hit.objectID, 10),
                    title: hit.title,
                    url: hit.url,
                    score: hit.points,
                    by: hit.author,
                    descendants: hit.num_comments || 0,
                    time: hit.created_at_i,
                    text: hit.story_text || '',
                }));
            
            appState.stories.push(...newStories);
            recalculateRelativeMaxValues();

            if (loadMore) {
                renderStories(newStories, true);
            } else {
                displayStories();
            }

        } catch (error) {
            console.error('Error fetching search results:', error);
            elements.grid.classList.remove('loading');
            elements.grid.innerHTML = '<p class="error">Failed to load search results.</p>';
        } finally {
            appState.isFetching = false;
            if (loadMore) {
                elements.infiniteScrollLoader.hidden = true;
            }
        }
    }

    // --- RENDER & SORT FUNCTIONS ---
    
    /** @returns {string} */
    function createGridSkeletonHTML() {
        return Array.from({ length: 12 }, (_, i) => `
            <div class="story-cell-placeholder">
                <div class="skeleton skeleton-title ${i % 3 === 0 ? '' : 'short'}"></div>
                ${i % 4 === 0 ? '<div class="skeleton skeleton-text" style="width: 95%;"></div>' : ''}
                <div class="skeleton skeleton-meta"></div>
            </div>
        `).join('');
    }

    function showGridLoader() {
        elements.grid.innerHTML = createGridSkeletonHTML();
        elements.grid.classList.add('loading');
        elements.grid.classList.remove('serendipity-view');
        elements.grid.style.opacity = '1';
    }

    /** @param {Story} story */
    function getStorySize(story) {
        if (appState.activeCategory === 'askstories') {
            const titleLength = story.title?.length || 0;
            if (titleLength > 120) return 'size-large';
            if (titleLength > 60) return 'size-medium';
            return 'size-small';
        }
        const score = story.score || 0;
        const comments = story.descendants || 0;
        if (score > appState.maxScore * 0.7 || comments > appState.maxComments * 0.7) return 'size-large';
        if (score > appState.maxScore * 0.3 || comments > appState.maxComments * 0.3) return 'size-medium';
        return 'size-small';
    }

    /** @param {Story} story */
    function getStoryHeat(story) {
        const score = story.score || 0;
        const comments = story.descendants || 0;
        if (score > appState.maxScore * 0.7 || comments > appState.maxComments * 0.7) return 'heat-4';
        if (score > appState.maxScore * 0.3 || comments > appState.maxComments * 0.3) return 'heat-3';
        if (score > appState.maxScore * 0.1 || comments > appState.maxComments * 0.1) return 'heat-2';
        return 'heat-1';
    }

    /** @returns {Story[]} */
    function sortStories() {
        const stories = [...appState.stories];
        switch (appState.activeSort) {
            case 'score': return stories.sort((a, b) => (b.score || 0) - (a.score || 0));
            case 'comments': return stories.sort((a, b) => (b.descendants || 0) - (a.descendants || 0));
            case 'new': return stories.sort((a, b) => b.time - a.time);
            case 'default':
            default: return stories;
        }
    }

    function displayStories() {
        renderStories(sortStories(), false);
    }
    
    /**
     * @param {Story[]} stories
     * @param {boolean} [append=false]
     */
    function renderStories(stories, append = false) {
        if (!append) {
            elements.grid.classList.remove('loading');
            elements.grid.innerHTML = '';
        }

        if (!append && stories.length === 0) {
            elements.grid.innerHTML = '<p class="no-results">No stories found.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const startingIndex = append ? elements.grid.children.length : 0;

        stories.forEach((story, i) => {
            if (!story || !story.title) return;

            const storyElement = document.createElement('div');
            storyElement.className = `story-cell ${getStorySize(story)} ${getStoryHeat(story)}`;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'story-content';

            const titleH2 = document.createElement('h2');
            titleH2.className = 'story-title';
            const titleLink = document.createElement('a');
            titleLink.textContent = story.title;
            
            if (appState.activeCategory === 'askstories' || story.url === null) {
                titleLink.href = '#';
                titleLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    openCommentsOverlay(String(story.id));
                });
            } else {
                titleLink.href = story.url;
                titleLink.target = '_blank';
                titleLink.rel = 'noopener noreferrer';
            }
            titleH2.appendChild(titleLink);
            contentDiv.appendChild(titleH2);
            
            if ((appState.activeCategory === 'askstories' || appState.activeCategory === 'showstories') && story.text) {
                const snippetDiv = document.createElement('div');
                snippetDiv.className = 'story-text-snippet';
                snippetDiv.innerHTML = simpleSanitize(story.text);
                contentDiv.appendChild(snippetDiv);
            }

            const metaDiv = document.createElement('div');
            metaDiv.className = 'story-meta';

            const metaParts = [];

            const isMajor = (story.score || 0) > 1000 || (story.descendants || 0) > 500;
            if (isMajor) {
                metaParts.push('<span class="story-badge major-discussion">Major Discussion</span>');
            }
            
            metaParts.push(`<span>${story.score || 0} PTS</span>`);
            metaParts.push(`<span>BY ${story.by}</span>`);
            metaParts.push(`<span>${timeAgo(story.time)}</span>`);
            
            const commentsHTML = (story.descendants > 0)
                ? `<a class="comments-link" data-story-id="${story.id}">${story.descendants} COMMENTS</a>`
                : `<span>0 COMMENTS</span>`;
            metaParts.push(commentsHTML);

            const domainName = story.url ? new URL(story.url).hostname.replace('www.', '') : null;
            if (domainName) {
                const domainHTML = `<a class="domain-link" data-domain="${domainName}">${domainName}</a>`;
                metaParts.push(domainHTML);
            }

            metaDiv.innerHTML = metaParts.join('<span class="separator">&bull;</span>');

            const commentsLink = metaDiv.querySelector('.comments-link');
            if (commentsLink) {
                 commentsLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    openCommentsOverlay(e.currentTarget.dataset.storyId);
                });
            }

            const domainLink = metaDiv.querySelector('.domain-link');
            if (domainLink) {
                domainLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const domain = e.currentTarget.dataset.domain;
                    elements.searchInput.value = `site:${domain}`;
                    performSearch(`site:${domain}`);
                });
            }

            contentDiv.appendChild(metaDiv);
            storyElement.appendChild(contentDiv);
            fragment.appendChild(storyElement);
        });
        
        elements.grid.appendChild(fragment);

        Array.from(elements.grid.children).slice(startingIndex).forEach((cell, i) => {
            setTimeout(() => cell.classList.add('visible'), i * 50);
        });

        // DOM Cleanup: Remove old stories to keep performance high
        const childrenCount = elements.grid.children.length;
        if (childrenCount > MAX_STORIES_IN_DOM) {
            const toRemoveCount = childrenCount - MAX_STORIES_IN_DOM;
            for (let i = 0; i < toRemoveCount; i++) {
                if (elements.grid.firstChild) {
                    elements.grid.firstChild.remove();
                }
            }
        }
    }
    
    /**
     * @param {Comment} comment
     * @param {number} [depth=0]
     */
    function renderSingleComment(comment, depth = 0) {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.id = `comment-${comment.id}`;
        commentEl.dataset.commentId = String(comment.id);
        commentEl.dataset.depth = String(depth);
    
        if (comment.deleted || !comment.by) {
            commentEl.classList.add('comment-deleted');
            commentEl.textContent = '[deleted]';
            return commentEl;
        }
    
        const isCollapsed = appState.comments.collapsed.has(comment.id);
        if (isCollapsed) commentEl.classList.add('collapsed');
    
        const metaDiv = document.createElement('div');
        metaDiv.className = 'comment-meta';
        
        const hasKids = comment.kids && comment.kids.length > 0;
        const toggleButton = document.createElement('button');
        toggleButton.className = 'comment-toggle';
        if (hasKids) {
            toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
            toggleButton.dataset.kidsCount = String(comment.kids.length);
            toggleButton.textContent = isCollapsed ? `[+] [${comment.kids.length} replies]` : '[–]';
        } else {
            toggleButton.style.visibility = 'hidden';
        }
        metaDiv.appendChild(toggleButton);
    
        const authorSpan = document.createElement('span');
        authorSpan.className = 'comment-author';
        authorSpan.textContent = comment.by;
        metaDiv.appendChild(authorSpan);
    
        const timeSpan = document.createElement('span');
        timeSpan.className = 'comment-time';
        timeSpan.textContent = `• ${timeAgo(comment.time)}`;
        metaDiv.appendChild(timeSpan);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'comment-actions';
        const focusBtn = document.createElement('button');
        focusBtn.className = 'comment-focus-btn';
        focusBtn.title = 'Focus on this thread';
        focusBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>`;
        actionsDiv.appendChild(focusBtn);
        metaDiv.appendChild(actionsDiv);
    
        commentEl.appendChild(metaDiv);
    
        const textDiv = document.createElement('div');
        textDiv.className = 'comment-text';
        textDiv.innerHTML = simpleSanitize(comment.text);
        commentEl.appendChild(textDiv);
    
        if (hasKids) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'comment-children';
            childrenContainer.id = `children-for-${comment.id}`;
            commentEl.appendChild(childrenContainer);
        }
        
        return commentEl;
    }
    
    /**
     * @param {Comment} comment
     * @param {HTMLElement} parentEl
     * @param {number} [depth=0]
     */
    async function renderCommentTree(comment, parentEl, depth = 0) {
        const commentEl = renderSingleComment(comment, depth);
        parentEl.appendChild(commentEl);

        if (comment.kids && comment.kids.length > 0) {
            const childrenContainer = /** @type {HTMLElement} */ (commentEl.querySelector('.comment-children'));
            if (childrenContainer) {
                childrenContainer.dataset.depth = String(depth);
                childrenContainer.dataset.colorIndex = String(depth % 4);
                await renderReplies(comment.kids, childrenContainer, REPLIES_PER_BATCH, depth + 1);
            }
        }
    }

    /**
     * @param {number[]} allReplyIds
     * @param {HTMLElement} parentContainer
     * @param {number} limit
     * @param {number} childDepth
     */
    async function renderReplies(allReplyIds, parentContainer, limit, childDepth) {
        const idsToFetch = allReplyIds.slice(0, limit);
        const remainingIds = allReplyIds.slice(limit);

        const replies = await Promise.all(idsToFetch.map(id => fetchAPI(`item/${id}`)));
        
        for (const reply of replies.filter(Boolean)) {
            await renderCommentTree(reply, parentContainer, childDepth);
        }

        if (remainingIds.length > 0) {
            const loadRepliesBtn = document.createElement('button');
            loadRepliesBtn.className = 'load-replies-btn';
            loadRepliesBtn.textContent = `Load ${remainingIds.length} more replies`;
            loadRepliesBtn.dataset.replyIds = JSON.stringify(remainingIds);
            loadRepliesBtn.dataset.depth = String(childDepth);
            parentContainer.appendChild(loadRepliesBtn);
        }
    }

    // --- UI LOGIC & EVENT HANDLERS ---
    
    function updateSorterVisibility(category) {
        const isJobs = category === 'jobstories';
        elements.sortButtons.forEach(button => {
            const sortType = button.dataset.sort;
            button.hidden = isJobs && (sortType === 'score' || sortType === 'comments');
        });
    }

    function updateViewMode(category, isSearch = false) {
        const isCondensed = category === 'beststories' || isSearch;
        elements.grid.classList.toggle('condensed-view', isCondensed);
        elements.grid.classList.remove('serendipity-view');
        elements.subFilters.hidden = category === 'beststories';
        appState.isSearchView = isSearch;
    }

    /** @param {Event | HTMLElement} e */
    function handleCategoryClick(e) {
        const button = e.target || e;
        const selectedCategory = button.dataset.category;
        if (selectedCategory === appState.activeCategory || appState.isFetching) return;
        
        appState.activeCategory = selectedCategory;
        appState.activeSort = appState.sortPreferences[selectedCategory] || 'default';
        appState.isSearchView = false;
        appState.searchQuery = '';

        elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        elements.sortButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === appState.activeSort));
        
        elements.searchInput.value = '';
        updateViewMode(selectedCategory);
        updateSorterVisibility(selectedCategory);
        fetchStories();
    }
    
    /** @param {Event} e */
    function handleSortClick(e) {
        const button = /** @type {HTMLButtonElement} */ (e.target);
        const selectedSort = button.dataset.sort;
        if (selectedSort === appState.activeSort || appState.isFetching) return;

        appState.activeSort = selectedSort;
        if (appState.activeCategory) {
            appState.sortPreferences[appState.activeCategory] = selectedSort;
        }
        elements.sortButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        displayStories();
    }
    
    /** @param {string} query */
    function performSearch(query) {
        if (query.length < 2 || (appState.isSearchView && query === appState.searchQuery)) return;
        if (appState.isFetching) return;

        appState.searchQuery = query;
        appState.activeSort = 'default';

        elements.sortButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === 'default'));
        if (!appState.isSearchView) {
            elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
        }

        updateViewMode(null, true);
        updateSorterVisibility(null);
        fetchSearchResults(false);
    }
    
    async function fetchSerendipityStory() {
        if (appState.isFetching) return;
        appState.isFetching = true;

        elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
        elements.searchInput.value = '';
        elements.grid.style.opacity = '0';

        await new Promise(resolve => setTimeout(resolve, 300));

        elements.grid.innerHTML = `
            <div class="serendipity-loader">
                <div class="brewing-loader">
                    <span class="brewing-text">Discovering a hidden gem...</span>
                    <div class="brewing-dots">
                        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                    </div>
                </div>
            </div>`;
        elements.grid.className = 'serendipity-view';
        elements.grid.style.opacity = '1';

        try {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            const oneYearAgo = nowInSeconds - (365 * 24 * 60 * 60);
            const fiveYearsAgo = nowInSeconds - (5 * 365 * 24 * 60 * 60);

            const randomTimestampStart = Math.floor(Math.random() * (oneYearAgo - fiveYearsAgo + 1)) + fiveYearsAgo;
            const randomTimestampEnd = randomTimestampStart + (90 * 24 * 60 * 60);
            
            const response = await fetch(`${ALGOLIA_API_BASE}?query=&numericFilters=created_at_i>${randomTimestampStart},created_at_i<${randomTimestampEnd},points>200,num_comments>100&hitsPerPage=20&tags=story`);
            if (!response.ok) throw new Error('Could not fetch serendipity story');
            const data = await response.json();
            
            if (data.hits.length === 0) {
                elements.grid.innerHTML = '<p class="no-results">Couldn\'t find a gem this time. Try again!</p>';
                return;
            }

            const randomHit = data.hits[Math.floor(Math.random() * data.hits.length)];
            const story = {
                id: parseInt(randomHit.objectID, 10),
                title: randomHit.title,
                url: randomHit.url,
                score: randomHit.points,
                by: randomHit.author,
                descendants: randomHit.num_comments || 0,
                time: randomHit.created_at_i,
                text: randomHit.story_text || '',
            };
            
            appState.activeCategory = null; // Ensure we don't render snippets incorrectly
            renderStories([story], false);

        } catch (error) {
            console.error("Serendipity Error:", error);
            elements.grid.innerHTML = '<p class="error">An error occurred while searching for a story.</p>';
        } finally {
            appState.isFetching = false;
        }
    }

    function renderCommentSkeletons() {
        elements.overlayCommentsContainer.innerHTML = Array.from({length: 6}, () => `
            <div class="comment-placeholder">
                <div class="skeleton skeleton-meta-comments"></div>
                <div class="skeleton skeleton-text-1"></div>
                <div class="skeleton skeleton-text-2"></div>
            </div>`).join('');
    }

    async function loadMainComments() {
        if (appState.comments.isFetchingMain) return;
        appState.comments.isFetchingMain = true;
        elements.commentsInfiniteLoader.hidden = false;

        const startIndex = appState.comments.loadedRootCount;
        const idsToFetch = appState.comments.rootCommentIds.slice(startIndex, startIndex + MAIN_COMMENTS_PER_BATCH);

        if (idsToFetch.length === 0) {
            appState.comments.isFetchingMain = false;
            elements.commentsInfiniteLoader.hidden = true;
            return;
        }

        const commentsData = await Promise.all(idsToFetch.map(id => fetchAPI(`item/${id}`)));

        if (startIndex === 0) {
            elements.overlayCommentsContainer.innerHTML = '';
        }

        for (const comment of commentsData.filter(Boolean)) {
            await renderCommentTree(comment, elements.overlayCommentsContainer, 0);
        }
        
        appState.comments.loadedRootCount += idsToFetch.length;

        if (appState.comments.loadedRootCount >= appState.comments.rootCommentIds.length) {
            if (commentsObserver) commentsObserver.disconnect();
        }

        appState.comments.isFetchingMain = false;
        elements.commentsInfiniteLoader.hidden = true;
    }
    async function loadMoreReplies(button) {
        const parentContainer = button.parentElement;
        const remainingIds = JSON.parse(button.dataset.replyIds);
        const childDepth = parseInt(button.dataset.depth, 10);
        button.textContent = 'Brewing...';
        button.disabled = true;
        button.remove();
        await renderReplies(remainingIds, parentContainer, REPLIES_PER_BATCH, childDepth);
    }
    function setupCommentsInfiniteScroll() {
        if (commentsObserver) commentsObserver.disconnect();
        commentsObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !appState.comments.isFetchingMain && appState.comments.loadedRootCount < appState.comments.rootCommentIds.length) {
                loadMainComments();
            }
        }, { rootMargin: '400px' });
        commentsObserver.observe(elements.commentsScrollSentinel);
    }
    async function openCommentsOverlay(storyId) {
        appState.comments = { storyId: parseInt(storyId, 10), rootCommentIds: [], loadedRootCount: 0, isFetchingMain: false, collapsed: new Set(), focusedCommentId: null, story: null, scrollPositionBeforeFocus: 0 };
        elements.commentsOverlay.hidden = false;
        elements.body.classList.add('overlay-open');
        requestAnimationFrame(() => { elements.commentsOverlay.style.transform = 'translateX(0)'; });
        elements.overlayStoryDetails.innerHTML = '';
        renderCommentSkeletons();
        
        try {
            const story = await fetchAPI(`item/${storyId}`);
            appState.comments.story = story;
            const domain = story.url ? `(${new URL(story.url).hostname.replace('www.','')})` : '';
            const linkHTML = story.url ? `<a href="${story.url}" target="_blank" rel="noopener noreferrer">Visit Link</a>` : '';
            elements.overlayStoryDetails.innerHTML = `<h2 class="story-title">${story.title}</h2><div class="story-meta"><span>${story.score || 0} points by ${story.by}</span>${linkHTML}<span>${domain}</span></div>`;
            elements.overlayHeaderTitle.textContent = `${story.descendants || 0} Comments`;
            if (story.kids && story.kids.length > 0) {
                appState.comments.rootCommentIds = story.kids;
                loadMainComments();
                setupCommentsInfiniteScroll();
            } else {
                elements.overlayCommentsContainer.innerHTML = '<p>No comments yet.</p>';
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            elements.overlayCommentsContainer.innerHTML = '<p class="error">Could not load comments.</p>';
        }
    }
    function closeCommentsOverlay() {
        if (appState.comments.focusedCommentId) unfocusThread();
        elements.commentsOverlay.style.transform = 'translateX(100%)';
        elements.commentsOverlay.addEventListener('transitionend', function onTransitionEnd(e) {
            if (e.propertyName !== 'transform') return;
            elements.commentsOverlay.hidden = true;
            elements.body.classList.remove('overlay-open');
            elements.overlayStoryDetails.innerHTML = '';
            elements.overlayCommentsContainer.innerHTML = '';
            elements.overlayHeaderTitle.textContent = 'Comments';
            if (commentsObserver) commentsObserver.disconnect();
            elements.commentsOverlay.removeEventListener('transitionend', onTransitionEnd);
        });
    }
    function focusOnThread(commentId) {
        const commentEl = document.getElementById(`comment-${commentId}`);
        if (!commentEl) return;
        appState.comments.focusedCommentId = commentId;
        appState.comments.scrollPositionBeforeFocus = elements.commentsOverlay.querySelector('.comments-overlay-content').scrollTop;
        elements.overlayCommentsContainer.classList.add('focus-mode');
        commentEl.classList.add('is-focused');
        commentEl.scrollIntoView({ behavior: 'smooth' });
        const author = commentEl.querySelector('.comment-author').textContent;
        elements.overlayHeaderTitle.textContent = `Thread by ${author} (click to exit)`;
        elements.overlayHeaderTitle.classList.add('is-clickable');
        elements.overlayBackBtn.style.display = 'block';
    }
    function unfocusThread() {
        const commentEl = document.getElementById(`comment-${appState.comments.focusedCommentId}`);
        if (commentEl) commentEl.classList.remove('is-focused');
        appState.comments.focusedCommentId = null;
        elements.overlayCommentsContainer.classList.remove('focus-mode');
        elements.overlayHeaderTitle.textContent = `${appState.comments.story.descendants || 0} Comments`;
        elements.overlayHeaderTitle.classList.remove('is-clickable');
        if (window.innerWidth > 768) elements.overlayBackBtn.style.display = 'none';
        elements.commentsOverlay.querySelector('.comments-overlay-content').scrollTop = appState.comments.scrollPositionBeforeFocus;
    }
    function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    function setupInfiniteScroll() {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !appState.isFetching) {
                if (appState.isSearchView) {
                    if ((appState.searchPage + 1) < appState.searchTotalPages) fetchSearchResults(true);
                } else {
                    if (appState.storiesOffset < appState.storyIds.length) fetchStories(true);
                }
            }
        }, { rootMargin: '400px' });
        observer.observe(elements.scrollSentinel);
    }
    
    // --- GESTURE HANDLING ---
    const gestureState = { startX: 0, currentX: 0, isDragging: false, threshold: 100 };
    function handleGestureStart(e) { gestureState.isDragging = true; gestureState.startX = e.pageX || e.touches[0].pageX; gestureState.currentX = gestureState.startX; elements.commentsOverlay.style.transition = 'none'; }
    function handleGestureMove(e) { if (!gestureState.isDragging) return; gestureState.currentX = e.pageX || e.touches[0].pageX; let diff = gestureState.currentX - gestureState.startX; if (diff > 0) elements.commentsOverlay.style.transform = `translateX(${diff}px)`; }
    function handleGestureEnd() { if (!gestureState.isDragging) return; gestureState.isDragging = false; let diff = gestureState.currentX - gestureState.startX; elements.commentsOverlay.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'; if (diff > gestureState.threshold) closeCommentsOverlay(); else elements.commentsOverlay.style.transform = 'translateX(0)'; }
    
    // --- HEADER INFO FUNCTIONS ---
    function updateDate() { elements.headerDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase(); }
    function updateTime() { elements.headerTime.textContent = `UPDATED ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`; }
    function getWeatherDescription(code) { if (code === 0) return 'Clear Sky'; if (code <= 3) return 'Mainly Clear'; if (code <= 48) return 'Foggy'; if (code <= 67) return 'Rainy'; if (code <= 77) return 'Snowy'; if (code <= 82) return 'Rain Showers'; if (code >= 95) return 'Thunderstorm'; return 'Fair Weather'; }
    async function fetchWeather(lat, lon) { try { const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`); if (!res.ok) throw new Error(); const data = await res.json(); elements.headerWeather.textContent = `${Math.round(data.current_weather.temperature)}°C, ${getWeatherDescription(data.current_weather.weathercode).toUpperCase()}`; } catch (e) { elements.headerWeather.textContent = 'WEATHER UNAVAILABLE'; } }
    async function updateWeather() { try { const res = await fetch('https://ipapi.co/json/'); if (!res.ok) throw new Error(); const geoData = await res.json(); if (geoData.latitude && geoData.longitude) fetchWeather(geoData.latitude, geoData.longitude); else throw new Error(); } catch (e) { elements.headerWeather.textContent = 'WEATHER UNAVAILABLE'; } }

    // --- INITIALIZATION ---
    function init() {
        updateDate();
        updateTime();
        updateWeather();
        setInterval(updateTime, 60000); // Update time every minute

        updateViewMode(appState.activeCategory);
        updateSorterVisibility(appState.activeCategory);
        fetchStories();
        setupInfiniteScroll();
        
        // EVENT LISTENERS
        window.addEventListener('scroll', () => elements.backToTopBtn.classList.toggle('visible', window.scrollY > 400), { passive: true });
        elements.backToTopBtn.addEventListener('click', scrollToTop);

        elements.categoryButtons.forEach(btn => btn.addEventListener('click', handleCategoryClick));
        elements.sortButtons.forEach(btn => btn.addEventListener('click', handleSortClick));
        elements.serendipityBtn.addEventListener('click', fetchSerendipityStory);

        elements.searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();
            if (query.length > 1) {
                performSearch(query);
            } else if (query.length === 0 && appState.isSearchView) {
                // When search is cleared, go back to the default 'Top' category
                const topStoriesButton = document.querySelector('.story-categories button[data-category="topstories"]');
                if (topStoriesButton) handleCategoryClick({ target: topStoriesButton });
            }
        }, 400));
        
        elements.overlayCloseBtn.addEventListener('click', closeCommentsOverlay);
        elements.overlayBackBtn.addEventListener('click', () => appState.comments.focusedCommentId ? unfocusThread() : closeCommentsOverlay());
        elements.overlayHeaderTitle.addEventListener('click', () => { if (appState.comments.focusedCommentId) unfocusThread(); });
        
        elements.overlayCommentsContainer.addEventListener('click', e => {
            const button = e.target.closest('button');
            if (!button) return;
            
            if (button.matches('.load-replies-btn')) {
                loadMoreReplies(button);
            } else if (button.matches('.comment-toggle')) {
                const commentEl = button.closest('.comment');
                const commentId = parseInt(commentEl.dataset.commentId, 10);
                const isNowCollapsed = commentEl.classList.toggle('collapsed');
                if (isNowCollapsed) appState.comments.collapsed.add(commentId); else appState.comments.collapsed.delete(commentId);
                button.textContent = isNowCollapsed ? `[+] [${button.dataset.kidsCount} replies]` : '[–]';
                button.setAttribute('aria-expanded', String(!isNowCollapsed));
            } else if (button.matches('.comment-focus-btn')) {
                const commentEl = button.closest('.comment');
                focusOnThread(parseInt(commentEl.dataset.commentId, 10));
            }
        });

        // Touch gestures for overlay
        ['mousedown', 'touchstart'].forEach(evt => elements.commentsOverlay.addEventListener(evt, handleGestureStart, { passive: true }));
        ['mousemove', 'touchmove'].forEach(evt => elements.commentsOverlay.addEventListener(evt, handleGestureMove, { passive: true }));
        ['mouseup', 'mouseleave', 'touchend'].forEach(evt => elements.commentsOverlay.addEventListener(evt, handleGestureEnd));
    }

    init();
});
