

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
        isSearchView: false,
        searchQuery: '',
        searchPage: 0,
        searchTotalPages: 0,
        maxScore: 1, // Avoid div by zero
        maxComments: 1,
        keyboardIndex: -1,
        currentStoryId: null,
    };

    // --- CONSTANTS ---
    const API_BASE = 'https://hacker-news.firebaseio.com/v0';
    const ALGOLIA_API_BASE = 'https://hn.algolia.com/api/v1/search';
    const STORIES_PER_PAGE = 30;
    const MAX_STORIES_IN_DOM = 150;
    const REPLIES_PER_BATCH = 15; // Limit deep nesting fetches
    const LOCAL_STORAGE_KEY_THEME = 'hn-times-theme';

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
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        body: document.body,
        scrollSentinel: document.getElementById('scroll-sentinel'),
        infiniteScrollLoader: document.getElementById('infinite-scroll-loader'),
        
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

    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
        };
    }

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

    function simpleSanitize(htmlString) {
        if (!htmlString) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        // Allowed tags for basic markdown rendering
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

    // --- API FUNCTIONS ---

    async function fetchAPI(endpoint) {
        const response = await fetch(`${API_BASE}/${endpoint}.json`);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return response.json();
    }
    
    // --- STORY FETCHING LOGIC ---

    async function fetchStories(loadMore = false) {
        if (appState.isFetching) return;
        appState.isFetching = true;
        
        if (loadMore) {
            elements.infiniteScrollLoader.hidden = false;
        } else {
            if (elements.preloader.classList.contains('loaded')) {
                // If not initial load, show in-grid skeleton
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
            }
            const idsToShow = appState.storyIds.slice(appState.storiesOffset, appState.storiesOffset + STORIES_PER_PAGE);
            const storyPromises = idsToShow.map(id => fetchAPI(`item/${id}`));
            const newStories = (await Promise.all(storyPromises)).filter(Boolean);
            
            appState.stories.push(...newStories);
            
            // Recalculate heatmap max values
            if (appState.stories.length > 0) {
                 const allScores = appState.stories.map(s => s.score || 0).sort((a,b)=>a-b);
                 const allComments = appState.stories.map(s => s.descendants || 0).sort((a,b)=>a-b);
                 appState.maxScore = allScores[Math.min(Math.floor(allScores.length * 0.95), allScores.length - 1)] || 1;
                 appState.maxComments = allComments[Math.min(Math.floor(allComments.length * 0.95), allComments.length - 1)] || 1;
            }

            if (loadMore) {
                renderStories(newStories, true);
            } else {
                displayStories();
            }
            appState.storiesOffset += STORIES_PER_PAGE;

        } catch (error) {
            console.error('Error fetching stories:', error);
            elements.grid.innerHTML = '<p class="error">Failed to load stories.</p>';
        } finally {
            appState.isFetching = false;
            if (loadMore) elements.infiniteScrollLoader.hidden = true;
            if (!elements.preloader.classList.contains('loaded')) elements.preloader.classList.add('loaded');
            elements.grid.classList.remove('loading');
        }
    }

    async function fetchSearchResults(loadMore = false) {
        if (appState.isFetching) return;
        appState.isFetching = true;
        
        if (loadMore) {
            appState.searchPage++;
            elements.infiniteScrollLoader.hidden = false;
        } else {
            elements.grid.innerHTML = createGridSkeletonHTML();
            elements.grid.classList.add('loading');
            appState.stories = [];
            appState.searchPage = 0;
            appState.keyboardIndex = -1;
        }

        try {
            const queryTags = (appState.activeCategory === 'askstories' || appState.activeCategory === 'showstories') 
                ? `(story,${appState.activeCategory})`
                : 'story';
            const response = await fetch(`${ALGOLIA_API_BASE}?query=${encodeURIComponent(appState.searchQuery)}&tags=${queryTags}&page=${appState.searchPage}`);
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            appState.searchTotalPages = data.nbPages;

            const newStories = data.hits
                .filter(hit => hit.title && hit.author)
                .map(hit => ({
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
            // Recalc heat maps...
            if (appState.stories.length > 0) {
                 const allScores = appState.stories.map(s => s.score || 0).sort((a,b)=>a-b);
                 const allComments = appState.stories.map(s => s.descendants || 0).sort((a,b)=>a-b);
                 appState.maxScore = allScores[Math.min(Math.floor(allScores.length * 0.95), allScores.length - 1)] || 1;
                 appState.maxComments = allComments[Math.min(Math.floor(allComments.length * 0.95), allComments.length - 1)] || 1;
            }

            if (loadMore) renderStories(newStories, true);
            else displayStories();

        } catch (error) {
            console.error('Search Error:', error);
            elements.grid.innerHTML = '<p class="error">Failed to load search results.</p>';
        } finally {
            appState.isFetching = false;
            if (loadMore) elements.infiniteScrollLoader.hidden = true;
            elements.grid.classList.remove('loading');
        }
    }

    // --- RENDER FUNCTIONS ---
    
    function createGridSkeletonHTML() {
        return Array.from({ length: 12 }, (_, i) => `
            <div class="story-cell-placeholder">
                <div class="skeleton skeleton-title ${i % 3 === 0 ? '' : 'short'}"></div>
                ${i % 4 === 0 ? '<div class="skeleton skeleton-text" style="width: 95%;"></div>' : ''}
                <div class="skeleton skeleton-meta"></div>
            </div>
        `).join('');
    }

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

    function getStoryHeat(story) {
        const score = story.score || 0;
        const comments = story.descendants || 0;
        if (score > appState.maxScore * 0.7 || comments > appState.maxComments * 0.7) return 'heat-4';
        if (score > appState.maxScore * 0.3 || comments > appState.maxComments * 0.3) return 'heat-3';
        if (score > appState.maxScore * 0.1 || comments > appState.maxComments * 0.1) return 'heat-2';
        return 'heat-1';
    }

    function displayStories() {
        // Sort logic
        let sorted = [...appState.stories];
        if (appState.activeSort === 'score') sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
        else if (appState.activeSort === 'comments') sorted.sort((a, b) => (b.descendants || 0) - (a.descendants || 0));
        else if (appState.activeSort === 'new') sorted.sort((a, b) => b.time - a.time);
        
        renderStories(sorted, false);
    }
    
    function renderStories(stories, append = false) {
        if (!append) elements.grid.innerHTML = '';
        if (!append && stories.length === 0) {
            elements.grid.innerHTML = '<p class="no-results">No stories found.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const startingIndex = append ? elements.grid.children.length : 0;

        stories.forEach((story) => {
            if (!story || !story.title) return;

            const storyElement = document.createElement('div');
            storyElement.className = `story-cell ${getStorySize(story)} ${getStoryHeat(story)}`;
            // Store ID for event delegation
            storyElement.dataset.storyId = String(story.id);

            const hasUrl = !!story.url;
            const domainName = hasUrl ? new URL(story.url).hostname.replace('www.', '') : 'Hacker News';
            
            // Build inner HTML string for performance
            let html = `
                <div class="story-content">
                    <h2 class="story-title">
                        <a href="${hasUrl ? story.url : '#'}" target="${hasUrl ? '_blank' : ''}" rel="noopener noreferrer">${story.title}</a>
                    </h2>
                    ${(appState.activeCategory === 'askstories' && story.text) ? `<div class="story-text-snippet">${simpleSanitize(story.text)}</div>` : ''}
                    <div class="story-meta">
                        <span class="meta-item source-item">
                            ${hasUrl ? 
                                `<img src="https://www.google.com/s2/favicons?domain=${domainName}&sz=32" class="site-favicon" alt="" loading="lazy" />` : 
                                `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
                            }
                            <a class="${hasUrl ? 'domain-link' : ''}" data-domain="${domainName}">${domainName}</a>
                        </span>
                        <span class="meta-item time-item"><span>${timeAgo(story.time)}</span></span>
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
        
        elements.grid.appendChild(fragment);
        
        // Fade in animation
        Array.from(elements.grid.children).slice(startingIndex).forEach((cell, i) => {
            requestAnimationFrame(() => cell.classList.add('visible'));
        });
    }

    // --- COMMENTS SYSTEM RE-WRITE ---

    async function openCommentsModal(storyId) {
        appState.currentStoryId = storyId;
        
        // Push state for back button support
        try {
            // Only push state if we aren't already there (avoids duplicate pushes if clicked multiple times rapidly)
            if (!location.hash.includes(storyId)) {
                history.pushState({ modal: true, storyId: storyId }, '', `#story/${storyId}`);
            }
        } catch (e) {
            console.warn("History pushState failed (likely due to sandbox):", e);
        }

        // 1. Open Modal UI immediately
        elements.commentsOverlay.hidden = false;
        requestAnimationFrame(() => {
            elements.commentsOverlay.classList.add('open');
        });
        document.body.classList.add('overlay-open');
        
        // 2. Clear Previous Content & Show Loader
        elements.overlayStoryDetails.innerHTML = '';
        elements.overlayCommentsContainer.innerHTML = `
            <div class="modal-loader">
                <div class="brewing-loader">
                     <div class="brewing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
                </div>
            </div>`;
        elements.overlayHeaderTitle.textContent = 'Loading...';

        try {
            // 3. Fetch Story Details First
            const story = await fetchAPI(`item/${storyId}`);
            
            // Render Header & Story Details
            renderStoryInModal(story);
            
            // 4. Fetch Top Level Comments
            if (story.kids && story.kids.length > 0) {
                // Fetch first batch of root comments
                const rootIds = story.kids.slice(0, 20); 
                const rootComments = await Promise.all(rootIds.map(id => fetchAPI(`item/${id}`)));
                
                // Clear loader and render
                elements.overlayCommentsContainer.innerHTML = '';
                
                // Render linearly
                for (const comment of rootComments) {
                    if (comment) renderCommentTree(comment, elements.overlayCommentsContainer);
                }
                
                // If there are more comments, add a "Load More" button
                if (story.kids.length > 20) {
                     const loadMoreBtn = document.createElement('button');
                     loadMoreBtn.className = 'load-replies-btn';
                     loadMoreBtn.textContent = `Load more top-level comments (${story.kids.length - 20} remaining)`;
                     loadMoreBtn.onclick = () => loadMoreRootComments(story.kids.slice(20), loadMoreBtn);
                     elements.overlayCommentsContainer.appendChild(loadMoreBtn);
                }

            } else {
                elements.overlayCommentsContainer.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--meta-color);">No comments yet.</p>';
            }

        } catch (error) {
            console.error(error);
            elements.overlayCommentsContainer.innerHTML = '<p class="error">Failed to load conversation.</p>';
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

    function renderCommentTree(comment, parentContainer) {
        if (!comment || comment.deleted || comment.dead) return;

        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.id = `c-${comment.id}`;
        
        const hasKids = comment.kids && comment.kids.length > 0;
        
        commentEl.innerHTML = `
            <div class="comment-meta">
                <span class="comment-toggle">[–]</span>
                <span class="comment-author">${comment.by}</span>
                <span class="comment-time">${timeAgo(comment.time)}</span>
            </div>
            <div class="comment-text">${simpleSanitize(comment.text)}</div>
        `;
        
        // Handle Toggle Logic locally
        const toggleBtn = commentEl.querySelector('.comment-toggle');
        toggleBtn.addEventListener('click', () => {
            commentEl.classList.toggle('collapsed');
            toggleBtn.textContent = commentEl.classList.contains('collapsed') ? `[+] (${(comment.kids || []).length + 1} hidden)` : '[–]';
        });

        parentContainer.appendChild(commentEl);

        if (hasKids) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'comment-children';
            commentEl.appendChild(childrenContainer);
            
            // We fetch immediate children asynchronously to avoid UI blocking on huge trees
            fetchKids(comment.kids, childrenContainer);
        }
    }

    async function fetchKids(kidsIds, container) {
        // Fetch only first few replies to keep it snappy, add load more if needed
        const batch = kidsIds.slice(0, REPLIES_PER_BATCH);
        const comments = await Promise.all(batch.map(id => fetchAPI(`item/${id}`)));
        
        for (const c of comments) {
            renderCommentTree(c, container);
        }
        
        if (kidsIds.length > REPLIES_PER_BATCH) {
            const btn = document.createElement('button');
            btn.className = 'load-replies-btn';
            btn.style.marginTop = '0.5rem';
            btn.style.fontSize = '0.8rem';
            btn.textContent = `Load ${kidsIds.length - REPLIES_PER_BATCH} more replies`;
            btn.onclick = () => {
                btn.remove();
                fetchKids(kidsIds.slice(REPLIES_PER_BATCH), container);
            };
            container.appendChild(btn);
        }
    }

    async function loadMoreRootComments(ids, btnEl) {
        btnEl.textContent = 'Loading...';
        const batch = ids.slice(0, 20);
        const comments = await Promise.all(batch.map(id => fetchAPI(`item/${id}`)));
        
        for (const c of comments) {
            renderCommentTree(c, elements.overlayCommentsContainer);
        }
        
        const remaining = ids.slice(20);
        if (remaining.length > 0) {
            btnEl.textContent = `Load more top-level comments (${remaining.length} remaining)`;
            btnEl.onclick = () => loadMoreRootComments(remaining, btnEl);
            // Move button to end
            elements.overlayCommentsContainer.appendChild(btnEl);
        } else {
            btnEl.remove();
        }
    }
    
    // Close function triggered by UI buttons (Back or Close)
    function closeCommentsModal() {
        // If we are currently in a modal state (pushed via openCommentsModal),
        // we use history.back() to remove that state and trigger popstate.
        // This ensures the browser history stack is clean.
        if (history.state && history.state.modal) {
            history.back(); 
        } else {
            // If the modal was opened without a history state (e.g. reload or error), just close it visually.
            internalCloseModal(); 
        }
    }

    // Actual Logic to hide the modal (called by popstate or fallback)
    function internalCloseModal() {
        elements.commentsOverlay.classList.remove('open');
        document.body.classList.remove('overlay-open');
        
        // Remove hash if it exists but no state (clean URL for fallback case)
        if (!history.state && location.hash.startsWith('#story/')) {
             history.replaceState(null, '', ' '); 
        }

        setTimeout(() => {
            if (!elements.commentsOverlay.classList.contains('open')) {
                elements.commentsOverlay.hidden = true;
                elements.overlayCommentsContainer.innerHTML = ''; // Clean up RAM
            }
        }, 400);
    }


    // --- EVENT LISTENERS ---

    function initEvents() {
        // Grid Click Delegation
        elements.grid.addEventListener('click', (e) => {
            const commentsLink = e.target.closest('.comments-link');
            if (commentsLink) {
                e.preventDefault();
                const id = commentsLink.dataset.storyId;
                if (id) openCommentsModal(id);
                return;
            }

            const domainLink = e.target.closest('.domain-link');
            if (domainLink) {
                e.preventDefault();
                const domain = domainLink.dataset.domain;
                if (domain) {
                    elements.searchInput.value = `site:${domain}`;
                    performSearch(`site:${domain}`);
                }
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
        
        // History API / Back Mouse Gesture Support
        window.addEventListener('popstate', (e) => {
             // If we are popping state, it means we are navigating back (or forward).
             // If the modal is open, we should likely close it unless the new state expects it open.
             // In this simple implementation, popping state usually means going back to list.
             if (elements.commentsOverlay.classList.contains('open')) {
                 // Check if new state is meant to have a modal (e.g. forward nav). 
                 // If not (state is null or doesn't have modal:true), close it.
                 if (!e.state || !e.state.modal) {
                     internalCloseModal();
                 }
             }
        });

        // Overlay Controls
        elements.overlayCloseBtn.addEventListener('click', closeCommentsModal);
        elements.overlayBackBtn.addEventListener('click', closeCommentsModal);
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.commentsOverlay.classList.contains('open')) {
                closeCommentsModal();
            }
        });

        // Nav/Filter Controls
        elements.categoryButtons.forEach(btn => btn.addEventListener('click', handleCategoryClick));
        elements.sortButtons.forEach(btn => btn.addEventListener('click', handleSortClick));
        elements.serendipityBtn.addEventListener('click', fetchSerendipityStory);
        elements.themeToggleBtn.addEventListener('click', toggleTheme);

        // Search
        elements.searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();
            if (query.length > 1) {
                performSearch(query);
            } else if (query.length === 0 && appState.isSearchView) {
                const topBtn = document.querySelector('.story-categories button[data-category="topstories"]');
                if (topBtn) handleCategoryClick({ target: topBtn });
            }
        }, 400));
        
        // Scroll to top
        elements.backToTopBtn.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
        window.addEventListener('scroll', () => {
             elements.backToTopBtn.classList.toggle('visible', window.scrollY > 400);
        }, {passive: true});
        
        // Infinite Scroll
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
    
    // --- APP INIT ---
    function init() {
        // Time & Date
        elements.headerDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
        elements.headerTime.textContent = `UPDATED ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
        setInterval(() => {
             elements.headerTime.textContent = `UPDATED ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
        }, 60000);

        // Initial Data Load
        initEvents();
        fetchStories();
        
        // Check for deep link on load (e.g. reload on comments page)
        if (location.hash.startsWith('#story/')) {
            const id = location.hash.split('/')[1];
            if (id) {
                // Replace current state so back button works correctly if they navigate further
                history.replaceState({ modal: true, storyId: id }, '', location.hash);
                openCommentsModal(id);
            }
        }
        
        // Weather
        fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(geo => {
                if(geo.latitude && geo.longitude) {
                    return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`);
                }
            })
            .then(r => r ? r.json() : null)
            .then(data => {
                if(data && data.current_weather) {
                    elements.headerWeather.textContent = `${Math.round(data.current_weather.temperature)}°C`;
                }
            })
            .catch(() => { elements.headerWeather.textContent = ''; });
    }

    init();

    // Re-attach handlers functions for category/sort to work with event listeners above
    function handleCategoryClick(e) {
        const btn = e.target;
        if(appState.isFetching || btn.dataset.category === appState.activeCategory) return;
        
        appState.activeCategory = btn.dataset.category;
        appState.activeSort = appState.sortPreferences[appState.activeCategory] || 'default';
        appState.isSearchView = false;
        appState.searchQuery = '';
        elements.searchInput.value = '';
        
        elements.categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show/Hide sorters
        elements.subFilters.hidden = (appState.activeCategory === 'beststories');
        elements.sortButtons.forEach(b => b.classList.toggle('active', b.dataset.sort === appState.activeSort));
        
        // Condensed view check
        elements.grid.classList.toggle('condensed-view', appState.activeCategory === 'beststories');
        
        fetchStories();
    }
    
    function handleSortClick(e) {
        const btn = e.target;
        if(appState.isFetching || btn.dataset.sort === appState.activeSort) return;
        appState.activeSort = btn.dataset.sort;
        appState.sortPreferences[appState.activeCategory] = btn.dataset.sort;
        
        elements.sortButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        displayStories();
    }

    function fetchSerendipityStory() {
        if(appState.isFetching) return;
        appState.isFetching = true;
        elements.categoryButtons.forEach(b => b.classList.remove('active'));
        elements.grid.innerHTML = '<div style="padding:4rem; text-align:center;">Digging through the archives...</div>';
        
        const now = Math.floor(Date.now()/1000);
        const start = now - (5*365*24*60*60);
        const randStart = Math.floor(Math.random() * (now - 365*24*60*60 - start + 1)) + start;
        const randEnd = randStart + (90*24*60*60);
        
        fetch(`${ALGOLIA_API_BASE}?query=&numericFilters=created_at_i>${randStart},created_at_i<${randEnd},points>200,num_comments>50&hitsPerPage=1`)
            .then(r => r.json())
            .then(data => {
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
                    renderStories(appState.stories);
                } else {
                    elements.grid.innerHTML = '<p class="no-results">Dusty archives are empty today. Try again.</p>';
                }
            })
            .catch(e => console.error(e))
            .finally(() => { appState.isFetching = false; });
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem(LOCAL_STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
        // Update icons visually
        const sun = elements.themeToggleBtn.querySelector('.sun-icon');
        const moon = elements.themeToggleBtn.querySelector('.moon-icon');
        if(isDark) { moon.style.display='none'; sun.style.display='block'; }
        else { moon.style.display='block'; sun.style.display='none'; }
    }
});
