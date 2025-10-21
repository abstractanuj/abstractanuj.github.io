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
            rootCommentIds: [],
            loadedRootCount: 0,
            isFetchingMain: false,
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
        overlayStoryDetails: document.getElementById('overlay-story-details'),
        overlayCommentsContainer: document.getElementById('overlay-comments-container'),
        commentsLoadMoreContainer: document.getElementById('comments-load-more-container'),
        commentsLoadMoreBtn: document.getElementById('comments-load-more-btn'),
    };
    
    // --- CONSTANTS ---
    const API_BASE = 'https://hacker-news.firebaseio.com/v0';
    const ALGOLIA_API_BASE = 'https://hn.algolia.com/api/v1/search';
    const STORIES_PER_PAGE = 30;
    const MAIN_COMMENTS_PER_BATCH = 20;
    const REPLIES_PER_BATCH = 15;

    // --- API & HELPER FUNCTIONS ---
    async function fetchAPI(endpoint) {
        const response = await fetch(`${API_BASE}/${endpoint}.json`);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return response.json();
    }
    
    function createLoaderHTML() {
        return `
            <div class="brewing-loader">
                <div class="brewing-bar"></div>
                <span class="brewing-text">brewing...</span>
            </div>
        `;
    }

    function showGridLoader() {
        elements.grid.innerHTML = createLoaderHTML();
        elements.grid.style.opacity = '1';
    }

    async function fetchStories(loadMore = false) {
        if (appState.isFetching) return;
        appState.isFetching = true;
        
        if (loadMore) {
            elements.infiniteScrollLoader.hidden = false;
        } else {
            // Only show the grid loader if the main preloader is already gone.
            // This prevents a redundant loader on the initial page load.
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
            const response = await fetch(`${ALGOLIA_API_BASE}?query=${encodeURIComponent(appState.searchQuery)}&tags=story&page=${appState.searchPage}`);
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
            }));
            
            appState.stories.push(...newStories);

            if (loadMore) {
                renderStories(newStories, true);
            } else {
                displayStories();
            }

        } catch (error) {
            console.error('Error fetching search results:', error);
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
            elements.grid.innerHTML = '';
        }
        
        if (stories.length === 0 && !append) {
            elements.grid.innerHTML = '<p class="no-results">No stories found.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const startingIndex = append ? elements.grid.children.length : 0;

        stories.forEach((story, i) => {
            if (!story || !story.title) return;

            const domain = story.url ? `(${new URL(story.url).hostname.replace('www.','')})` : '';
            const sizeClass = getStorySize(story);
            const colorIndex = (startingIndex + i) % 4;

            const storyElement = document.createElement('div');
            storyElement.className = `story-cell ${sizeClass} color-theme-${colorIndex}`;
            
            const commentsHTML = story.descendants > 0 
                ? `<span class="comments-link" data-story-id="${story.id}">${story.descendants} comments</span>` 
                : '';

            storyElement.innerHTML = `
                <div class="story-content">
                    <h2 class="story-title"><a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.title}</a></h2>
                    <div class="story-meta">
                        <span>${story.score || 0} points by ${story.by}</span>
                        ${commentsHTML}
                        <span class="domain">${domain}</span>
                    </div>
                </div>
            `;
            fragment.appendChild(storyElement);
        });
        
        elements.grid.appendChild(fragment);

        Array.from(elements.grid.children).slice(startingIndex).forEach((cell, i) => {
            setTimeout(() => cell.classList.add('visible'), i * 50);
        });
    }
    
    function renderSingleComment(comment) {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.id = `comment-${comment.id}`;

        if (comment.deleted || !comment.by) {
            commentEl.innerHTML = `<div class="comment-deleted">[deleted]</div>`;
            return commentEl;
        }

        const timeAgo = new Date(comment.time * 1000).toLocaleString();
        
        commentEl.innerHTML = `
            <div class="comment-meta">
                <span class="comment-author">${comment.by}</span>
                <span class="comment-time">${timeAgo}</span>
            </div>
            <div class="comment-text">${comment.text || ''}</div>
        `;

        if (comment.kids && comment.kids.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'comment-children';
            childrenContainer.id = `children-for-${comment.id}`;
            commentEl.appendChild(childrenContainer);
        }
        
        return commentEl;
    }
    
    async function renderCommentTree(comment, parentEl) {
        const commentEl = renderSingleComment(comment);
        parentEl.appendChild(commentEl);

        if (comment.kids && comment.kids.length > 0) {
            const childrenContainer = commentEl.querySelector('.comment-children');
            await renderReplies(comment.kids, childrenContainer, REPLIES_PER_BATCH);
        }
    }

    async function renderReplies(allReplyIds, parentContainer, limit) {
        const idsToFetch = allReplyIds.slice(0, limit);
        const remainingIds = allReplyIds.slice(limit);

        const replies = await Promise.all(idsToFetch.map(id => fetchAPI(`item/${id}`)));
        
        for (const reply of replies.filter(Boolean)) {
            await renderCommentTree(reply, parentContainer);
        }

        if (remainingIds.length > 0) {
            const loadRepliesBtn = document.createElement('button');
            loadRepliesBtn.className = 'load-replies-btn';
            loadRepliesBtn.textContent = `Load ${remainingIds.length} more replies`;
            loadRepliesBtn.dataset.replyIds = JSON.stringify(remainingIds);
            parentContainer.appendChild(loadRepliesBtn);
        }
    }

    // --- UI LOGIC & EVENT HANDLERS ---
    function updateViewMode(category, isSearch = false) {
        const isCondensed = category === 'beststories' || isSearch;
        elements.grid.classList.toggle('condensed-view', isCondensed);

        const hideSubFilters = category === 'beststories' || category === 'jobstories';
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
    
    function handleSearch(e) {
        if (e.key !== 'Enter') return;
        const query = elements.searchInput.value.trim();
        if (query.length < 2 || appState.isFetching) return;
        
        appState.searchQuery = query;
        appState.activeCategory = null;
        appState.activeSort = 'default';
        
        elements.sortButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === 'default'));
        elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
        
        updateViewMode(null, true);
        fetchSearchResults(false);
    }

    async function loadMainComments() {
        if (appState.comments.isFetchingMain) return;
        appState.comments.isFetchingMain = true;
        elements.commentsLoadMoreBtn.textContent = "Brewing Comments...";
        elements.commentsLoadMoreBtn.disabled = true;

        const startIndex = appState.comments.loadedRootCount;
        const idsToFetch = appState.comments.rootCommentIds.slice(startIndex, startIndex + MAIN_COMMENTS_PER_BATCH);

        if (idsToFetch.length === 0) {
            appState.comments.isFetchingMain = false;
            elements.commentsLoadMoreContainer.hidden = true;
            return;
        }

        const commentPromises = idsToFetch.map(id => fetchAPI(`item/${id}`));
        const commentsData = await Promise.all(commentPromises);

        for (const comment of commentsData.filter(Boolean)) {
            await renderCommentTree(comment, elements.overlayCommentsContainer);
        }
        
        appState.comments.loadedRootCount += idsToFetch.length;
        elements.commentsLoadMoreContainer.hidden = appState.comments.loadedRootCount >= appState.comments.rootCommentIds.length;
        appState.comments.isFetchingMain = false;
        elements.commentsLoadMoreBtn.textContent = "Load More Comments";
        elements.commentsLoadMoreBtn.disabled = false;
    }

    async function loadMoreReplies(button) {
        const parentContainer = button.parentElement;
        const remainingIds = JSON.parse(button.dataset.replyIds);
        button.textContent = 'Brewing...';
        button.disabled = true;
        
        // We remove the button before loading so it disappears instantly
        button.remove();
        
        await renderReplies(remainingIds, parentContainer, REPLIES_PER_BATCH);
    }

    async function openCommentsOverlay(storyId) {
        appState.comments = { storyId, rootCommentIds: [], loadedRootCount: 0, isFetchingMain: false };

        elements.commentsOverlay.hidden = false;
        elements.body.classList.add('overlay-open');
        
        requestAnimationFrame(() => {
            elements.commentsOverlay.style.transform = 'translateX(0)';
        });

        elements.overlayStoryDetails.innerHTML = '';
        elements.overlayCommentsContainer.innerHTML = createLoaderHTML();
        elements.commentsLoadMoreContainer.hidden = true;
        
        try {
            const story = await fetchAPI(`item/${storyId}`);
            const domain = story.url ? `(${new URL(story.url).hostname.replace('www.','')})` : '';
            elements.overlayStoryDetails.innerHTML = `
                <h2 class="story-title"><a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.title}</a></h2>
                <div class="story-meta">
                    <span>${story.score || 0} points by ${story.by}</span>
                    <a href="${story.url}" target="_blank" rel="noopener noreferrer">Visit Link</a>
                    <span>${domain}</span>
                </div>
            `;
            
            elements.overlayCommentsContainer.innerHTML = '';
            if (story.kids && story.kids.length > 0) {
                appState.comments.rootCommentIds = story.kids;
                await loadMainComments();
            } else {
                elements.overlayCommentsContainer.innerHTML = '<p>No comments yet.</p>';
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            elements.overlayCommentsContainer.innerHTML = '<p class="error">Could not load comments.</p>';
        }
    }

    function closeCommentsOverlay() {
        elements.commentsOverlay.style.transform = 'translateX(100%)';
        
        const onTransitionEnd = (e) => {
            if (e.propertyName !== 'transform') return;
            elements.commentsOverlay.hidden = true;
            elements.body.classList.remove('overlay-open');
            elements.overlayStoryDetails.innerHTML = '';
            elements.overlayCommentsContainer.innerHTML = '';
            elements.commentsOverlay.removeEventListener('transitionend', onTransitionEnd);
        };
        
        elements.commentsOverlay.addEventListener('transitionend', onTransitionEnd);
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
        fetchStories();
        setupInfiniteScroll();
        
        elements.categoryButtons.forEach(btn => btn.addEventListener('click', handleCategoryClick));
        elements.sortButtons.forEach(btn => btn.addEventListener('click', handleSortClick));
        elements.searchInput.addEventListener('keydown', handleSearch);
        elements.grid.addEventListener('click', e => {
            const link = e.target.closest('.comments-link');
            if (link) {
                e.preventDefault();
                openCommentsOverlay(link.dataset.storyId);
            }
        });

        // Overlay close listeners
        elements.overlayCloseBtn.addEventListener('click', closeCommentsOverlay);
        elements.overlayBackBtn.addEventListener('click', closeCommentsOverlay);
        
        elements.commentsLoadMoreBtn.addEventListener('click', loadMainComments);
        elements.overlayCommentsContainer.addEventListener('click', e => {
            const button = e.target.closest('.load-replies-btn');
            if (button) {
                loadMoreReplies(button);
            }
        });

        // Swipe gesture listeners
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
