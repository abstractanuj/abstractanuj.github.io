


document.addEventListener('DOMContentLoaded', () => {
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
        comments: {
            storyId: null,
            story: null, // To store story details for focus mode header
            rootCommentIds: [],
            loadedRootCount: 0,
            isFetchingMain: false,
            collapsed: new Set(),
            focusedCommentId: null,
            scrollPositionBeforeFocus: 0,
        }
    };

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
    
    // --- CONSTANTS ---
    const API_BASE = 'https://hacker-news.firebaseio.com/v0';
    const ALGOLIA_API_BASE = 'https://hn.algolia.com/api/v1/search';
    const STORIES_PER_PAGE = 30;
    const MAIN_COMMENTS_PER_BATCH = 20;
    const REPLIES_PER_BATCH = 15;

    // --- OBSERVERS ---
    let commentsObserver = null;

    // --- API & HELPER FUNCTIONS ---
    async function fetchAPI(endpoint) {
        const response = await fetch(`${API_BASE}/${endpoint}.json`);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return response.json();
    }
    
    function createGridSkeletonHTML() {
        let skeletons = '';
        for (let i = 0; i < 12; i++) {
            skeletons += `
                <div class="story-cell-placeholder">
                    <div class="skeleton skeleton-title ${i % 3 === 0 ? '' : 'short'}"></div>
                    ${i % 4 === 0 ? '<div class="skeleton skeleton-text" style="width: 95%;"></div>' : ''}
                    <div class="skeleton skeleton-meta"></div>
                </div>
            `;
        }
        return skeletons;
    }

    function showGridLoader() {
        elements.grid.innerHTML = createGridSkeletonHTML();
        elements.grid.classList.add('loading');
        elements.grid.style.opacity = '1';
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
            // Algolia API needs item text, so we can't just get IDs. We fetch full items.
            const queryTags = (appState.activeCategory === 'askstories' || appState.activeCategory === 'showstories') 
                ? `(story,${appState.activeCategory})`
                : 'story';
            const response = await fetch(`${ALGOLIA_API_BASE}?query=${encodeURIComponent(appState.searchQuery)}&tags=${queryTags}&page=${appState.searchPage}`);
            if (!response.ok) throw new Error(`Failed to search for "${appState.searchQuery}"`);
            const data = await response.json();

            appState.searchTotalPages = data.nbPages;

            const newStories = data.hits.map(hit => ({
                id: hit.objectID,
                title: hit.title,
                url: hit.url,
                score: hit.points,
                by: hit.author,
                descendants: hit.num_comments || 0,
                time: hit.created_at_i,
                text: hit.story_text, // Get text for Ask/Show HN context
            }));
            
            appState.stories.push(...newStories);

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
    function getStorySize(story) {
        if (appState.activeCategory === 'askstories') {
            const titleLength = story.title.length;
            if (titleLength > 120) return 'size-large';
            if (titleLength > 60) return 'size-medium';
            return 'size-small';
        }

        const score = story.score || 0;
        const comments = story.descendants || 0;
        if (score > 400 || comments > 250) return 'size-large';
        if (score > 150 || comments > 100) return 'size-medium';
        return 'size-small';
    }

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
        const sortedStories = sortStories();
        renderStories(sortedStories, false);
    }
    
    function renderStories(stories, append = false) {
        if (!append) {
            elements.grid.classList.remove('loading');
        }

        if (!append && stories.length === 0) {
            elements.grid.innerHTML = '<p class="no-results">No stories found.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const startingIndex = append ? elements.grid.children.length : 0;

        stories.forEach((story, i) => {
            if (!story || !story.title) return;

            const domainName = story.url ? new URL(story.url).hostname.replace('www.','') : '';
            const domainHTML = domainName ? `<a class="domain-link" data-domain="${domainName}">(${domainName})</a>` : '';
            const sizeClass = getStorySize(story);
            const colorIndex = (startingIndex + i) % 4;

            const storyElement = document.createElement('div');
            storyElement.className = `story-cell ${sizeClass} color-theme-${colorIndex}`;
            
            const commentsHTML = story.descendants > 0 
                ? `<span class="comments-link" data-story-id="${story.id}">${story.descendants} comments</span>` 
                : '';
            
            let titleHTML;
            if (appState.activeCategory === 'askstories' || story.url === null) {
                titleHTML = `<a href="#" class="ask-title-link" data-story-id="${story.id}">${story.title}</a>`;
            } else {
                 titleHTML = `<a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.title}</a>`;
            }

            const textSnippetHTML = (appState.activeCategory === 'askstories' || appState.activeCategory === 'showstories') && story.text
                ? `<div class="story-text-snippet">${story.text}</div>`
                : '';

            storyElement.innerHTML = `
                <div class="story-content">
                    <h2 class="story-title">${titleHTML}</h2>
                    ${textSnippetHTML}
                    <div class="story-meta">
                        <span>${story.score || 0} points by ${story.by}</span>
                        ${commentsHTML}
                        ${domainHTML}
                    </div>
                </div>
            `;
            fragment.appendChild(storyElement);
        });
        
        if (append) {
            elements.grid.appendChild(fragment);
        } else {
            elements.grid.replaceChildren(fragment);
        }

        Array.from(elements.grid.children).slice(startingIndex).forEach((cell, i) => {
            setTimeout(() => cell.classList.add('visible'), i * 50);
        });
    }
    
    function renderSingleComment(comment, depth = 0) {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.id = `comment-${comment.id}`;
        commentEl.dataset.commentId = comment.id;
        commentEl.dataset.depth = depth;

        if (comment.deleted || !comment.by) {
            commentEl.innerHTML = `<div class="comment-deleted">[deleted]</div>`;
            return commentEl;
        }

        const timeAgo = new Date(comment.time * 1000).toLocaleString();
        const hasKids = comment.kids && comment.kids.length > 0;
        const isCollapsed = appState.comments.collapsed.has(comment.id);
        const kidsCount = comment.kids?.length || 0;
        
        if (isCollapsed) {
            commentEl.classList.add('collapsed');
        }

        const toggleText = isCollapsed 
            ? `[+] [${kidsCount} replies]`
            : '[–]';
        
        const toggleButton = hasKids 
            ? `<button class="comment-toggle" aria-expanded="${!isCollapsed}" aria-controls="children-for-${comment.id}" data-kids-count="${kidsCount}">${toggleText}</button>`
            : '<span class="comment-toggle" style="visibility: hidden;"></span>';

        commentEl.innerHTML = `
            <div class="comment-meta">
                ${toggleButton}
                <span class="comment-author">${comment.by}</span>
                <span class="comment-time">${timeAgo}</span>
                <div class="comment-actions">
                    <button class="comment-focus-btn" title="Focus on this thread">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>
                    </button>
                </div>
            </div>
            <div class="comment-text">${comment.text || ''}</div>
        `;

        if (hasKids) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'comment-children';
            childrenContainer.id = `children-for-${comment.id}`;
            commentEl.appendChild(childrenContainer);
        }
        
        return commentEl;
    }
    
    async function renderCommentTree(comment, parentEl, depth = 0) {
        const commentEl = renderSingleComment(comment, depth);
        parentEl.appendChild(commentEl);

        if (comment.kids && comment.kids.length > 0) {
            const childrenContainer = commentEl.querySelector('.comment-children');
            childrenContainer.dataset.depth = depth;
            childrenContainer.dataset.colorIndex = depth % 4;
            await renderReplies(comment.kids, childrenContainer, REPLIES_PER_BATCH, depth + 1);
        }
    }

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
            loadRepliesBtn.dataset.depth = childDepth;
            parentContainer.appendChild(loadRepliesBtn);
        }
    }

    // --- UI LOGIC & EVENT HANDLERS ---
    function updateSorterVisibility(category) {
        const isJobs = category === 'jobstories';
        elements.sortButtons.forEach(button => {
            const sortType = button.dataset.sort;
            if (isJobs && (sortType === 'score' || sortType === 'comments')) {
                button.hidden = true;
            } else {
                button.hidden = false;
            }
        });
    }

    function updateViewMode(category, isSearch = false) {
        const isCondensed = category === 'beststories' || isSearch;
        elements.grid.classList.toggle('condensed-view', isCondensed);

        const hideSubFilters = category === 'beststories';
        elements.subFilters.hidden = hideSubFilters;
        
        appState.isSearchView = isSearch;
    }

    function handleCategoryClick(e) {
        const selectedCategory = e.target.dataset.category;
        if (selectedCategory === appState.activeCategory || appState.isFetching) return;
        
        appState.activeCategory = selectedCategory;
        appState.activeSort = appState.sortPreferences[selectedCategory] || 'default';
        appState.isSearchView = false;
        appState.searchQuery = '';

        elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        elements.sortButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === appState.activeSort));
        
        elements.searchInput.value = '';
        updateViewMode(selectedCategory);
        updateSorterVisibility(selectedCategory);
        fetchStories();
    }
    
    function handleSortClick(e) {
        const selectedSort = e.target.dataset.sort;
        if (selectedSort === appState.activeSort || appState.isFetching) return;

        appState.activeSort = selectedSort;
        if (appState.activeCategory) {
            appState.sortPreferences[appState.activeCategory] = selectedSort;
        }
        elements.sortButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        displayStories();
    }
    
    function performSearch(query) {
        if (query.length < 2 || appState.isFetching) return;

        appState.searchQuery = query;
        appState.activeCategory = null; // Clear category when searching
        appState.activeSort = 'default';

        elements.sortButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === 'default'));
        elements.categoryButtons.forEach(btn => btn.classList.remove('active'));

        updateViewMode(null, true);
        updateSorterVisibility(null);
        fetchSearchResults(false);
    }

    function handleSearch(e) {
        if (e.key !== 'Enter') return;
        performSearch(elements.searchInput.value.trim());
    }

    function renderCommentSkeletons() {
        let skeletonsHTML = '';
        for (let i = 0; i < 6; i++) {
            skeletonsHTML += `
                <div class="comment-placeholder">
                    <div class="skeleton skeleton-meta-comments"></div>
                    <div class="skeleton skeleton-text-1"></div>
                    <div class="skeleton skeleton-text-2"></div>
                </div>
            `;
        }
        elements.overlayCommentsContainer.innerHTML = skeletonsHTML;
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

        const commentPromises = idsToFetch.map(id => fetchAPI(`item/${id}`));
        const commentsData = await Promise.all(commentPromises);

        // If it's the first load, clear skeletons
        if (startIndex === 0) {
            elements.overlayCommentsContainer.innerHTML = '';
        }

        for (const comment of commentsData.filter(Boolean)) {
            await renderCommentTree(comment, elements.overlayCommentsContainer, 0);
        }
        
        appState.comments.loadedRootCount += idsToFetch.length;

        if (appState.comments.loadedRootCount >= appState.comments.rootCommentIds.length) {
            // All comments loaded, disconnect observer
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
            if (entry.isIntersecting && !appState.comments.isFetchingMain) {
                if (appState.comments.loadedRootCount < appState.comments.rootCommentIds.length) {
                    loadMainComments();
                }
            }
        }, { rootMargin: '400px' });
        
        commentsObserver.observe(elements.commentsScrollSentinel);
    }

    async function openCommentsOverlay(storyId) {
        appState.comments = { storyId, rootCommentIds: [], loadedRootCount: 0, isFetchingMain: false, collapsed: new Set(), focusedCommentId: null, story: null, scrollPositionBeforeFocus: 0 };

        elements.commentsOverlay.hidden = false;
        elements.body.classList.add('overlay-open');
        
        requestAnimationFrame(() => {
            elements.commentsOverlay.style.transform = 'translateX(0)';
        });

        elements.overlayStoryDetails.innerHTML = '';
        renderCommentSkeletons();
        
        try {
            const story = await fetchAPI(`item/${storyId}`);
            appState.comments.story = story; // Save story
            const domain = story.url ? `(${new URL(story.url).hostname.replace('www.','')})` : '';
            const linkHTML = story.url ? `<a href="${story.url}" target="_blank" rel="noopener noreferrer">Visit Link</a>` : '';
            
            elements.overlayStoryDetails.innerHTML = `
                <h2 class="story-title">${story.title}</h2>
                <div class="story-meta">
                    <span>${story.score || 0} points by ${story.by}</span>
                    ${linkHTML}
                    <span>${domain}</span>
                </div>
            `;
            
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
        if (appState.comments.focusedCommentId) {
            unfocusThread();
        }
        elements.commentsOverlay.style.transform = 'translateX(100%)';
        
        const onTransitionEnd = (e) => {
            if (e.propertyName !== 'transform') return;
            elements.commentsOverlay.hidden = true;
            elements.body.classList.remove('overlay-open');
            elements.overlayStoryDetails.innerHTML = '';
            elements.overlayCommentsContainer.innerHTML = '';
            elements.overlayHeaderTitle.textContent = 'Comments';
            if (commentsObserver) commentsObserver.disconnect();
            elements.commentsOverlay.removeEventListener('transitionend', onTransitionEnd);
        };
        
        elements.commentsOverlay.addEventListener('transitionend', onTransitionEnd);
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
        if (commentEl) {
            commentEl.classList.remove('is-focused');
        }
        
        appState.comments.focusedCommentId = null;
        elements.overlayCommentsContainer.classList.remove('focus-mode');
        elements.overlayHeaderTitle.textContent = `${appState.comments.story.descendants || 0} Comments`;
        elements.overlayHeaderTitle.classList.remove('is-clickable');

        // Hide back button on desktop, it's always visible on mobile via CSS
        if (window.innerWidth > 768) {
            elements.overlayBackBtn.style.display = 'none';
        }
        
        elements.commentsOverlay.querySelector('.comments-overlay-content').scrollTop = appState.comments.scrollPositionBeforeFocus;
    }


    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    function setupInfiniteScroll() {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !appState.isFetching) {
                if (appState.isSearchView) {
                    if ((appState.searchPage + 1) < appState.searchTotalPages) {
                        fetchSearchResults(true);
                    }
                } else {
                    if (appState.storiesOffset < appState.storyIds.length) {
                        fetchStories(true);
                    }
                }
            }
        }, { rootMargin: '400px' });
        observer.observe(elements.scrollSentinel);
    }

    // --- GESTURE HANDLING FOR COMMENTS OVERLAY ---
    const gestureState = {
        startX: 0,
        currentX: 0,
        isDragging: false,
        threshold: 100
    };

    function handleGestureStart(e) {
        gestureState.isDragging = true;
        gestureState.startX = e.pageX || e.touches[0].pageX;
        gestureState.currentX = gestureState.startX;
        elements.commentsOverlay.style.transition = 'none';
    }

    function handleGestureMove(e) {
        if (!gestureState.isDragging) return;
        gestureState.currentX = e.pageX || e.touches[0].pageX;
        let diff = gestureState.currentX - gestureState.startX;
        if (diff > 0) { // Only track right-swipes
            elements.commentsOverlay.style.transform = `translateX(${diff}px)`;
        }
    }

    function handleGestureEnd() {
        if (!gestureState.isDragging) return;
        gestureState.isDragging = false;
        
        let diff = gestureState.currentX - gestureState.startX;
        elements.commentsOverlay.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';

        if (diff > gestureState.threshold) {
            closeCommentsOverlay();
        } else {
            elements.commentsOverlay.style.transform = 'translateX(0)';
        }
    }

    // --- HEADER INFO FUNCTIONS ---
    function updateDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = today.toLocaleDateString('en-US', options).toUpperCase();
        elements.headerDate.textContent = formattedDate;
    }

    function updateTime() {
        const now = new Date();
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        const formattedTime = now.toLocaleTimeString('en-US', options);
        elements.headerTime.textContent = `UPDATED ${formattedTime}`;
    }

    function getWeatherDescription(code) {
        if (code === 0) return 'Clear Sky';
        if (code >= 1 && code <= 3) return 'Mainly Clear';
        if (code >= 45 && code <= 48) return 'Foggy';
        if (code >= 51 && code <= 67) return 'Rainy';
        if (code >= 71 && code <= 77) return 'Snowy';
        if (code >= 80 && code <= 82) return 'Rain Showers';
        if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
        return 'Fair Weather';
    }

    async function fetchWeather(lat, lon) {
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            if (!response.ok) throw new Error('Weather data not available');
            const data = await response.json();
            const weather = data.current_weather;
            const description = getWeatherDescription(weather.weathercode);
            const temperature = Math.round(weather.temperature);
            elements.headerWeather.textContent = `${temperature}°C, ${description.toUpperCase()}`;
        } catch (error) {
            console.error("Failed to fetch weather:", error);
            elements.headerWeather.textContent = 'WEATHER UNAVAILABLE';
        }
    }

    async function updateWeather() {
        try {
            const geoResponse = await fetch('https://ipapi.co/json/');
            if (!geoResponse.ok) throw new Error('Could not fetch location data.');
            const geoData = await geoResponse.json();
            
            if (geoData.latitude && geoData.longitude) {
                fetchWeather(geoData.latitude, geoData.longitude);
            } else {
                throw new Error('Location data is incomplete.');
            }
        } catch (error) {
            console.error("Failed to get weather via IP geolocation:", error);
            elements.headerWeather.textContent = 'WEATHER UNAVAILABLE';
        }
    }

    // --- INITIALIZATION ---
    function init() {
        updateDate();
        updateTime();
        updateWeather();

        updateViewMode(appState.activeCategory);
        updateSorterVisibility(appState.activeCategory);
        fetchStories();
        setupInfiniteScroll();
        
        // --- EVENT LISTENERS ---
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                elements.backToTopBtn.classList.add('visible');
            } else {
                elements.backToTopBtn.classList.remove('visible'); // Corrected typo here
            }
        }, { passive: true });
        elements.backToTopBtn.addEventListener('click', scrollToTop);

        elements.categoryButtons.forEach(btn => btn.addEventListener('click', handleCategoryClick));
        elements.sortButtons.forEach(btn => btn.addEventListener('click', handleSortClick));
        elements.searchInput.addEventListener('keydown', handleSearch);
        elements.grid.addEventListener('click', e => {
            const storyLink = e.target.closest('.comments-link, .ask-title-link');
            if (storyLink) {
                e.preventDefault();
                openCommentsOverlay(storyLink.dataset.storyId);
                return;
            }
            const domainLink = e.target.closest('.domain-link');
            if (domainLink) {
                e.preventDefault();
                const domain = domainLink.dataset.domain;
                elements.searchInput.value = `url:${domain}`;
                performSearch(`url:${domain}`);
            }
        });

        elements.overlayCloseBtn.addEventListener('click', closeCommentsOverlay);
        elements.overlayBackBtn.addEventListener('click', () => {
            if (appState.comments.focusedCommentId) {
                unfocusThread();
            } else {
                closeCommentsOverlay();
            }
        });
        elements.overlayHeaderTitle.addEventListener('click', () => {
             if (appState.comments.focusedCommentId) {
                unfocusThread();
            }
        });
        
        elements.overlayCommentsContainer.addEventListener('click', e => {
            const repliesButton = e.target.closest('.load-replies-btn');
            if (repliesButton) {
                loadMoreReplies(repliesButton);
                return;
            }

            const toggleButton = e.target.closest('.comment-toggle');
            if (toggleButton) {
                const commentEl = toggleButton.closest('.comment');
                const commentId = parseInt(commentEl.dataset.commentId, 10);
                const kidsCount = parseInt(toggleButton.dataset.kidsCount, 10) || 0;
                
                const isNowCollapsed = !commentEl.classList.contains('collapsed');
                commentEl.classList.toggle('collapsed', isNowCollapsed);

                if (isNowCollapsed) {
                    appState.comments.collapsed.add(commentId);
                    toggleButton.textContent = `[+] [${kidsCount} replies]`;
                    toggleButton.setAttribute('aria-expanded', 'false');
                } else {
                    appState.comments.collapsed.delete(commentId);
                    toggleButton.textContent = '[–]';
                    toggleButton.setAttribute('aria-expanded', 'true');
                }
                return;
            }
            
            const focusButton = e.target.closest('.comment-focus-btn');
            if (focusButton) {
                const commentEl = focusButton.closest('.comment');
                const commentId = parseInt(commentEl.dataset.commentId, 10);
                focusOnThread(commentId);
                return;
            }
        });

        elements.commentsOverlay.addEventListener('mousedown', handleGestureStart);
        elements.commentsOverlay.addEventListener('mousemove', handleGestureMove);
        elements.commentsOverlay.addEventListener('mouseup', handleGestureEnd);
        elements.commentsOverlay.addEventListener('mouseleave', handleGestureEnd);
        elements.commentsOverlay.addEventListener('touchstart', handleGestureStart, { passive: true });
        elements.commentsOverlay.addEventListener('touchmove', handleGestureMove, { passive: true });
        elements.commentsOverlay.addEventListener('touchend', handleGestureEnd);
    }

    init();
});