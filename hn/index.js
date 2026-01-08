

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    const appState = {
        stories: [],
        storyIds: [],
        storiesOffset: 0,
        isFetching: false,
        activeCategory: 'topstories',
        activeSort: 'default',
        sortPreferences: {},
        maxScore: 1, 
        maxComments: 1,
        keyboardIndex: -1,
        currentStoryId: null,
        fetchRequestId: 0, 
        isInitialLoad: true, 
        // Optimization: Cache for API Items
        itemCache: new Map(),
    };

    // --- CONSTANTS ---
    const API_BASE = 'https://hacker-news.firebaseio.com/v0';
    const ALGOLIA_API_BASE = 'https://hn.algolia.com/api/v1';
    const STORIES_PER_PAGE = 24; 
    const REPLIES_PER_BATCH = 15; 
    const LOCAL_STORAGE_KEY_THEME = 'hn-times-theme';

    // --- DOM ELEMENTS ---
    const elements = {
        grid: document.getElementById('stories-grid'),
        categoryButtons: document.querySelectorAll('.story-categories button'),
        subFilters: document.getElementById('sub-filters'),
        sortButtons: document.querySelectorAll('.story-sorters button'),
        scoreSortBtn: document.getElementById('sort-score-btn'),
        dateSortBtn: document.querySelector('button[data-sort="time"]'),
        serendipityBtn: document.getElementById('serendipity-btn'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        body: document.body,
        scrollSentinel: document.getElementById('scroll-sentinel'),
        infiniteScrollLoader: document.getElementById('infinite-scroll-loader'),
        loadingBar: document.getElementById('loading-bar'), 
        splashLoader: document.getElementById('splash-loader'), 
        
        // Modal Elements
        commentsOverlay: document.getElementById('comments-overlay'),
        overlayCloseBtn: document.getElementById('overlay-close-btn'),
        overlayBackBtn: document.getElementById('overlay-back-btn'), 
        overlayHeaderTitle: document.getElementById('overlay-header-title'),
        overlayStoryDetails: document.getElementById('overlay-story-details'),
        overlayCommentsContainer: document.getElementById('overlay-comments-container'),
        commentsInfiniteLoader: document.getElementById('comments-infinite-loader'),
        
        backToTopBtn: document.getElementById('back-to-top-btn'),
    };
    
    // --- UTILITY FUNCTIONS ---

    // Optimization: Reuse Date object reference where possible or pass 'now'
    function timeAgo(timestamp, now = new Date()) {
        if (!timestamp) return '';
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

    // Optimization: Reuse sanitizer DOM node to prevent GC thrashing
    const sanitizerNode = document.createElement('div');
    const allowedTags = ['P', 'B', 'I', 'EM', 'STRONG', 'A', 'PRE', 'CODE', 'BLOCKQUOTE'];

    function simpleSanitize(htmlString) {
        if (!htmlString) return '';
        sanitizerNode.innerHTML = htmlString;
        
        const allElements = sanitizerNode.getElementsByTagName('*');
        // Reverse loop is safer when modifying live collection, but here we replace or modify
        for (let i = allElements.length - 1; i >= 0; i--) {
            const el = allElements[i];
            if (!allowedTags.includes(el.tagName)) {
                // Not allowed? replace with text content (strip tag)
                // Use insertAdjacentText for efficiency
                el.replaceWith(document.createTextNode(el.textContent));
            } else if (el.tagName === 'A') {
                const href = el.getAttribute('href');
                if (!href || !href.startsWith('http')) {
                    el.removeAttribute('href');
                } else {
                    el.setAttribute('target', '_blank');
                    el.setAttribute('rel', 'noopener noreferrer nofollow');
                }
            }
        }
        return sanitizerNode.innerHTML;
    }
    
    // Optimization: Simple throttle for scroll events
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // --- LOADING BAR ANIMATION ---
    function startLoadingBar() {
        if (appState.isInitialLoad) return;

        elements.loadingBar.style.width = '0%';
        elements.loadingBar.classList.add('loading');
        
        setTimeout(() => { if(appState.isFetching) elements.loadingBar.style.width = '20%'; }, 100);
        setTimeout(() => { if(appState.isFetching) elements.loadingBar.style.width = '50%'; }, 500);
        setTimeout(() => { if(appState.isFetching) elements.loadingBar.style.width = '80%'; }, 1200);
    }
    
    function finishLoadingBar() {
        if (appState.isInitialLoad) {
            elements.splashLoader.classList.add('hidden');
            appState.isInitialLoad = false;
        } else {
            elements.loadingBar.style.width = '100%';
            setTimeout(() => {
                elements.loadingBar.classList.remove('loading');
                setTimeout(() => {
                    elements.loadingBar.style.width = '0%';
                }, 200);
            }, 300);
        }
    }

    // --- API FUNCTIONS ---

    async function fetchAPI(endpoint) {
        // Optimization: Check cache for items
        if (endpoint.startsWith('item/') && appState.itemCache.has(endpoint)) {
            return appState.itemCache.get(endpoint);
        }

        const response = await fetch(`${API_BASE}/${endpoint}.json`);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        
        const data = await response.json();
        
        // Cache items (immutable-ish)
        if (endpoint.startsWith('item/')) {
            appState.itemCache.set(endpoint, data);
        }
        
        return data;
    }
    
    // --- STORY FETCHING LOGIC ---
    
    function calcStats() {
         if (appState.stories.length > 0) {
             const allScores = appState.stories.map(s => s.score || 0).sort((a,b)=>a-b);
             const allComments = appState.stories.map(s => s.descendants || 0).sort((a,b)=>a-b);
             appState.maxScore = allScores[Math.min(Math.floor(allScores.length * 0.95), allScores.length - 1)] || 1;
             appState.maxComments = allComments[Math.min(Math.floor(allComments.length * 0.95), allComments.length - 1)] || 1;
        }
    }

    async function fetchStories(loadMore = false) {
        if (appState.isFetching) return;
        appState.isFetching = true;
        
        appState.fetchRequestId++;
        const currentRequestId = appState.fetchRequestId;
        
        if (loadMore) {
            elements.infiniteScrollLoader.hidden = false;
        } else {
            startLoadingBar();
            if (!appState.isInitialLoad) {
                elements.grid.innerHTML = createGridSkeletonHTML();
                elements.grid.classList.add('loading');
                elements.grid.classList.remove('serendipity-view');
            }
            appState.storiesOffset = 0;
            appState.stories = [];
            appState.keyboardIndex = -1;
        }

        try {
            if (!loadMore) {
                appState.storyIds = await fetchAPI(appState.activeCategory);
                if (currentRequestId !== appState.fetchRequestId) return;
                
                const firstBatchSize = 12; // Slightly larger initial batch to fill screen
                const firstIds = appState.storyIds.slice(0, firstBatchSize);
                const firstStories = (await Promise.all(firstIds.map(id => fetchAPI(`item/${id}`)))).filter(Boolean);
                
                if (currentRequestId !== appState.fetchRequestId) return;
                
                appState.stories.push(...firstStories);
                calcStats();
                renderStories(firstStories, elements.grid, false); 
                elements.grid.classList.remove('loading');
                
                finishLoadingBar(); 
                
                appState.storiesOffset = firstBatchSize;

                // Load second part of first page quietly
                const secondBatchSize = STORIES_PER_PAGE - firstBatchSize;
                const secondIds = appState.storyIds.slice(firstBatchSize, STORIES_PER_PAGE);
                
                if (secondIds.length > 0) {
                    const secondStories = (await Promise.all(secondIds.map(id => fetchAPI(`item/${id}`)))).filter(Boolean);
                    if (currentRequestId === appState.fetchRequestId) {
                        appState.stories.push(...secondStories);
                        calcStats();
                        renderStories(secondStories, elements.grid, true); 
                        appState.storiesOffset = STORIES_PER_PAGE;
                    }
                }
                
            } else {
                const idsToShow = appState.storyIds.slice(appState.storiesOffset, appState.storiesOffset + STORIES_PER_PAGE);
                const newStories = (await Promise.all(idsToShow.map(id => fetchAPI(`item/${id}`)))).filter(Boolean);
                
                if (currentRequestId !== appState.fetchRequestId) return;
                
                appState.stories.push(...newStories);
                calcStats();
                renderStories(newStories, elements.grid, true);
                appState.storiesOffset += STORIES_PER_PAGE;
            }

        } catch (error) {
            if (currentRequestId === appState.fetchRequestId) {
                console.error('Error fetching stories:', error);
                if(!loadMore) elements.grid.innerHTML = '<p class="error">Failed to load stories.</p>';
                finishLoadingBar(); 
            }
        } finally {
            if (currentRequestId === appState.fetchRequestId) {
                appState.isFetching = false;
                if (loadMore) elements.infiniteScrollLoader.hidden = true;
                elements.grid.classList.remove('loading');
            }
        }
    }

    // --- RENDER FUNCTIONS ---
    
    function createGridSkeletonHTML() {
        // Optimization: Use less placeholders to reduce initial layout cost
        return Array.from({ length: 8 }, (_, i) => `
            <div class="story-cell-placeholder">
                <div class="skeleton skeleton-title ${i % 3 === 0 ? '' : 'short'}"></div>
                ${i % 4 === 0 ? '<div class="skeleton skeleton-text" style="width: 95%;"></div>' : ''}
                <div class="skeleton skeleton-meta"></div>
            </div>
        `).join('');
    }

    function getStoryHeat(story) {
        const score = story.score || 0;
        const comments = story.descendants || 0;
        
        // Expanded to 5 levels
        if (score > appState.maxScore * 0.85 || comments > appState.maxComments * 0.85) return 'heat-5';
        if (score > appState.maxScore * 0.60 || comments > appState.maxComments * 0.60) return 'heat-4';
        if (score > appState.maxScore * 0.35 || comments > appState.maxComments * 0.35) return 'heat-3';
        if (score > appState.maxScore * 0.15 || comments > appState.maxComments * 0.15) return 'heat-2';
        
        return 'heat-1';
    }

    function displayStories() {
        let sorted = [...appState.stories];
        
        switch (appState.activeSort) {
            case 'score':
                sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
                break;
            case 'comments':
                sorted.sort((a, b) => (b.descendants || 0) - (a.descendants || 0));
                break;
            case 'time':
                sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
                break;
            default:
                break;
        }
        
        renderStories(sorted, elements.grid, false);
    }
    
    function renderStories(stories, container, append = false) {
        if (!container) container = elements.grid; 

        if (!append) container.innerHTML = '';
        if (!append && stories.length === 0) {
            container.innerHTML = '<p class="no-results">No stories found.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const startingIndex = append ? container.children.length : 0;
        const showHintText = (appState.activeCategory === 'askstories' || appState.activeCategory === 'showstories');
        // Optimization: Calculate 'now' once for the whole batch
        const now = new Date();

        stories.forEach((story, index) => {
            if (!story || !story.title) return;
            
            const globalIndex = startingIndex + index;
            const isFeature = (globalIndex === 0 && appState.activeCategory === 'topstories' && appState.activeSort === 'default');

            const storyElement = document.createElement('div');
            let classes = `story-cell ${getStoryHeat(story)}`;
            if (isFeature) classes += ' feature';
            storyElement.className = classes;
            storyElement.dataset.storyId = String(story.id);

            const hasUrl = !!story.url;
            const domainName = hasUrl ? new URL(story.url).hostname.replace('www.', '') : 'Hacker News';
            const faviconUrl = hasUrl 
                ? `https://www.google.com/s2/favicons?domain=${domainName}&sz=32`
                : '';

            let html = `
                <div class="story-content">
                    <h2 class="story-title">
                        <a href="${hasUrl ? story.url : '#'}" target="${hasUrl ? '_blank' : ''}" rel="noopener noreferrer">${story.title}</a>
                    </h2>
                    ${(isFeature && story.text) || (showHintText && story.text) ? `<div class="story-text-snippet">${simpleSanitize(story.text)}</div>` : ''}
                    <div class="story-meta">
                        <span class="meta-item source-item">
                            ${faviconUrl ? `<img src="${faviconUrl}" class="story-favicon" alt="" loading="lazy">` : ''}
                            <a class="${hasUrl ? 'domain-link' : ''}" data-domain="${domainName}">${domainName}</a>
                        </span>
                        <span class="meta-item time-item"><span>${timeAgo(story.time, now)}</span></span>
                        <span class="meta-item comments-item">
                            <a class="comments-link" href="#" data-story-id="${story.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                <span>${story.descendants || 0}</span>
                            </a>
                        </span>
                    </div>
                </div>
            `;
            
            storyElement.innerHTML = html;
            fragment.appendChild(storyElement);
        });
        
        container.appendChild(fragment);
        
        // Optimization: Use a single RequestAnimationFrame to trigger animations for all new items
        // instead of queuing one per item.
        requestAnimationFrame(() => {
            const children = container.children;
            // Loop through only the new items
            for(let i = startingIndex; i < children.length; i++) {
                children[i].classList.add('visible');
            }
        });
    }

    // --- COMMENTS SYSTEM ---

    async function openCommentsModal(storyId, fromHistory = false) {
        appState.currentStoryId = String(storyId);
        const thisRequestId = String(storyId);

        try {
            if (!fromHistory) {
                if (!location.hash.includes(storyId)) {
                    history.pushState({ modal: true, storyId: storyId }, '', `#story/${storyId}`);
                }
            }
        } catch (e) {
            console.warn("History pushState failed:", e);
        }

        elements.commentsOverlay.hidden = false;
        requestAnimationFrame(() => {
            elements.commentsOverlay.classList.add('open');
        });
        document.body.classList.add('overlay-open');
        
        elements.overlayStoryDetails.innerHTML = '';
        elements.overlayCommentsContainer.innerHTML = `
            <div class="modal-loader">
                <div class="brewing-loader">
                     <div class="brewing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
                </div>
            </div>`;
        elements.overlayHeaderTitle.textContent = 'Loading...';

        try {
            const story = await fetchAPI(`item/${storyId}`);
            if (appState.currentStoryId !== thisRequestId) return;
            
            renderStoryInModal(story);
            
            if (story.kids && story.kids.length > 0) {
                const rootIds = story.kids.slice(0, 20); 
                const rootComments = await Promise.all(rootIds.map(id => fetchAPI(`item/${id}`)));
                
                if (appState.currentStoryId !== thisRequestId) return;

                elements.overlayCommentsContainer.innerHTML = '';
                
                // Optimization: 'now' for batch processing
                const now = new Date();
                for (const comment of rootComments) {
                    if (comment) renderCommentTree(comment, elements.overlayCommentsContainer, story.by, now);
                }
                
                if (story.kids.length > 20) {
                     const loadMoreBtn = document.createElement('button');
                     loadMoreBtn.className = 'load-replies-btn';
                     loadMoreBtn.textContent = `Load more top-level comments (${story.kids.length - 20} remaining)`;
                     loadMoreBtn.onclick = () => loadMoreRootComments(story.kids.slice(20), loadMoreBtn, story.by);
                     elements.overlayCommentsContainer.appendChild(loadMoreBtn);
                }

            } else {
                elements.overlayCommentsContainer.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--meta-color);">No comments yet.</p>';
            }

        } catch (error) {
            if (appState.currentStoryId === thisRequestId) {
                console.error(error);
                elements.overlayCommentsContainer.innerHTML = '<p class="error">Failed to load conversation.</p>';
            }
        }
    }

    function renderStoryInModal(story) {
        const hasUrl = !!story.url;
        const domain = hasUrl ? new URL(story.url).hostname.replace('www.', '') : '';
        
        elements.overlayHeaderTitle.textContent = `${story.descendants || 0} Comments`;
        
        elements.overlayStoryDetails.innerHTML = `
            <div class="modal-content-wrapper" style="padding-bottom: 0;">
                <h1 class="story-title">
                    <a href="${hasUrl ? story.url : '#'}" target="${hasUrl ? '_blank' : ''}">${story.title}</a>
                </h1>
                <div class="story-meta">
                    <span>${story.score} points</span>
                    <span>by ${story.by}</span>
                    <span>${timeAgo(story.time)}</span>
                    ${hasUrl ? `<a href="${story.url}" target="_blank" class="domain-link">${domain}</a>` : ''}
                </div>
                ${story.text ? `<div class="overlay-story-text">${simpleSanitize(story.text)}</div>` : ''}
            </div>
        `;
    }

    // Now accepts opName and now
    function renderCommentTree(comment, parentContainer, opName, now = new Date()) {
        if (!comment || comment.deleted || comment.dead) return;

        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.id = `c-${comment.id}`;
        
        const hasKids = comment.kids && comment.kids.length > 0;
        const isOp = (opName && comment.by === opName);
        
        // Comment structure: Header (Meta) is the clickable toggle area
        commentEl.innerHTML = `
            <div class="comment-meta">
                <span class="comment-toggle">[–]</span>
                <span class="comment-author ${isOp ? 'is-op' : ''}">${comment.by}</span>
                <span class="comment-time">${timeAgo(comment.time, now)}</span>
            </div>
            <div class="comment-text">${simpleSanitize(comment.text)}</div>
        `;
        
        // Handle Toggle Logic on the entire meta header for ease of use
        const metaHeader = commentEl.querySelector('.comment-meta');
        const toggleBtn = commentEl.querySelector('.comment-toggle');
        
        metaHeader.addEventListener('click', (e) => {
            // Prevent interaction if clicking specific links inside meta if any
            if(e.target.tagName === 'A') return;
            
            commentEl.classList.toggle('collapsed');
            const isCollapsed = commentEl.classList.contains('collapsed');
            toggleBtn.textContent = isCollapsed ? `[+] (${(comment.kids || []).length + 1} hidden)` : '[–]';
        });

        parentContainer.appendChild(commentEl);

        if (hasKids) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'comment-children';
            commentEl.appendChild(childrenContainer);
            
            fetchKids(comment.kids, childrenContainer, opName);
        }
    }

    async function fetchKids(kidsIds, container, opName) {
        const batch = kidsIds.slice(0, REPLIES_PER_BATCH);
        const comments = await Promise.all(batch.map(id => fetchAPI(`item/${id}`)));
        
        const now = new Date();
        for (const c of comments) {
            renderCommentTree(c, container, opName, now);
        }
        
        if (kidsIds.length > REPLIES_PER_BATCH) {
            const btn = document.createElement('button');
            btn.className = 'load-replies-btn';
            btn.style.marginTop = '0.5rem';
            btn.style.fontSize = '0.8rem';
            btn.textContent = `Load ${kidsIds.length - REPLIES_PER_BATCH} more replies`;
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent bubbling to parent collapse
                btn.remove();
                fetchKids(kidsIds.slice(REPLIES_PER_BATCH), container, opName);
            };
            container.appendChild(btn);
        }
    }

    async function loadMoreRootComments(ids, btnEl, opName) {
        btnEl.textContent = 'Loading...';
        const batch = ids.slice(0, 20);
        const comments = await Promise.all(batch.map(id => fetchAPI(`item/${id}`)));
        
        const now = new Date();
        for (const c of comments) {
            renderCommentTree(c, elements.overlayCommentsContainer, opName, now);
        }
        
        const remaining = ids.slice(20);
        if (remaining.length > 0) {
            btnEl.textContent = `Load more top-level comments (${remaining.length} remaining)`;
            btnEl.onclick = () => loadMoreRootComments(remaining, btnEl, opName);
            elements.overlayCommentsContainer.appendChild(btnEl);
        } else {
            btnEl.remove();
        }
    }
    
    function closeCommentsModal() {
        if (history.state && history.state.modal) {
            history.back(); 
        } else {
            internalCloseModal(); 
        }
    }

    function internalCloseModal() {
        elements.commentsOverlay.classList.remove('open');
        document.body.classList.remove('overlay-open');
        appState.currentStoryId = null; 
        
        if (!history.state && location.hash.startsWith('#story/')) {
             history.replaceState(null, '', ' '); 
        }

        setTimeout(() => {
            if (!elements.commentsOverlay.classList.contains('open')) {
                elements.commentsOverlay.hidden = true;
                elements.overlayCommentsContainer.innerHTML = ''; 
            }
        }, 400);
    }


    // --- EVENT LISTENERS ---

    function initEvents() {
        document.getElementById('app-container').addEventListener('click', (e) => {
            const commentsLink = e.target.closest('.comments-link');
            if (commentsLink) {
                e.preventDefault();
                const id = commentsLink.dataset.storyId;
                if (id) openCommentsModal(id);
                return;
            }

            const titleLink = e.target.closest('.story-title a');
            if (titleLink) {
                const href = titleLink.getAttribute('href');
                if (href === '#' || !href) {
                    e.preventDefault();
                    const cell = titleLink.closest('.story-cell');
                    if (cell && cell.dataset.storyId) {
                        openCommentsModal(cell.dataset.storyId);
                    }
                }
            }
        });
        
        window.addEventListener('popstate', (e) => {
             if (e.state && e.state.modal && e.state.storyId) {
                 if (!elements.commentsOverlay.classList.contains('open') || appState.currentStoryId !== e.state.storyId) {
                     openCommentsModal(e.state.storyId, true);
                 }
             } else {
                 if (elements.commentsOverlay.classList.contains('open')) {
                     internalCloseModal();
                 }
             }
        });

        elements.overlayCloseBtn.addEventListener('click', closeCommentsModal);
        elements.overlayBackBtn.addEventListener('click', closeCommentsModal);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.commentsOverlay.classList.contains('open')) {
                closeCommentsModal();
            }
        });

        elements.categoryButtons.forEach(btn => btn.addEventListener('click', handleCategoryClick));
        elements.sortButtons.forEach(btn => btn.addEventListener('click', handleSortClick));
        elements.serendipityBtn.addEventListener('click', fetchSerendipityStory);
        elements.themeToggleBtn.addEventListener('click', toggleTheme);

        elements.backToTopBtn.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
        
        // Optimization: Throttled Scroll Listener
        const checkScroll = throttle(() => {
             elements.backToTopBtn.classList.toggle('visible', window.scrollY > 400);
        }, 200);
        window.addEventListener('scroll', checkScroll, {passive: true});
        
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !appState.isFetching) {
                 if (appState.storiesOffset < appState.storyIds.length) fetchStories(true);
            }
        }, { rootMargin: '400px' });
        observer.observe(elements.scrollSentinel);
    }
    
    // --- APP INIT ---
    function init() {
        initEvents();
        fetchStories();
        
        if (location.hash.startsWith('#story/')) {
            const id = location.hash.split('/')[1];
            if (id) {
                history.replaceState({ modal: true, storyId: id }, '', location.hash);
                openCommentsModal(id, true);
            }
        }
    }

    init();

    function handleCategoryClick(e) {
        const btn = e.target.closest('button');
        if(!btn || appState.isFetching || btn.dataset.category === appState.activeCategory) return;
        
        appState.activeCategory = btn.dataset.category;
        appState.activeSort = appState.sortPreferences[appState.activeCategory] || 'default';
        
        elements.categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const hideSubFilters = ['beststories', 'jobstories'].includes(appState.activeCategory);
        elements.subFilters.hidden = hideSubFilters;

        if (!hideSubFilters) {
            if (elements.dateSortBtn) {
                 elements.dateSortBtn.hidden = (appState.activeCategory === 'newstories');
            }
            if (appState.activeCategory === 'newstories' && appState.activeSort === 'time') {
                appState.activeSort = 'default';
            }
        }

        elements.sortButtons.forEach(b => {
             b.classList.toggle('active', b.dataset.sort === appState.activeSort);
        });

        updateGridLayout();
        
        fetchStories();
    }
    
    function handleSortClick(e) {
        const btn = e.target.closest('button');
        if(!btn || appState.isFetching || btn.dataset.sort === appState.activeSort) return;
        appState.activeSort = btn.dataset.sort;
        
        appState.sortPreferences[appState.activeCategory] = btn.dataset.sort;
        
        elements.sortButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        updateGridLayout();
        
        displayStories();
    }

    function updateGridLayout() {
        const isCondensed = 
            appState.activeCategory === 'beststories' || 
            appState.activeCategory === 'jobstories' ||
            (appState.activeCategory === 'topstories' && appState.activeSort === 'score');
            
        elements.grid.classList.toggle('condensed-view', isCondensed);
    }

    function fetchSerendipityStory() {
        if(appState.isFetching) return;
        appState.isFetching = true;
        appState.fetchRequestId++;
        const currentRequestId = appState.fetchRequestId;
        
        startLoadingBar();

        elements.categoryButtons.forEach(b => b.classList.remove('active'));
        elements.grid.innerHTML = '<div style="padding:4rem; text-align:center;">Digging through the archives...</div>';
        
        const now = Math.floor(Date.now()/1000);
        const start = now - (5*365*24*60*60);
        const randStart = Math.floor(Math.random() * (now - 365*24*60*60 - start + 1)) + start;
        const randEnd = randStart + (90*24*60*60);
        
        fetch(`${ALGOLIA_API_BASE}/search?query=&numericFilters=created_at_i>${randStart},created_at_i<${randEnd},points>200,num_comments>50&hitsPerPage=1`)
            .then(r => r.json())
            .then(data => {
                if (currentRequestId !== appState.fetchRequestId) return;
                
                if(data.hits.length) {
                    const hit = data.hits[0];
                    appState.stories = [{
                        id: parseInt(hit.objectID),
                        title: hit.title,
                        url: hit.url,
                        score: hit.points,
                        by: hit.author,
                        time: hit.created_at_i,
                        descendants: hit.num_comments
                    }];
                    renderStories(appState.stories, elements.grid);
                } else {
                    elements.grid.innerHTML = '<p class="no-results">Dusty archives are empty today. Try again.</p>';
                }
            })
            .catch(e => console.error(e))
            .finally(() => { 
                if (currentRequestId === appState.fetchRequestId) {
                    appState.isFetching = false; 
                    finishLoadingBar();
                }
            });
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem(LOCAL_STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
        const sun = elements.themeToggleBtn.querySelector('.sun-icon');
        const moon = elements.themeToggleBtn.querySelector('.moon-icon');
        if(isDark) { moon.style.display='none'; sun.style.display='block'; }
        else { moon.style.display='block'; sun.style.display='none'; }
    }
});