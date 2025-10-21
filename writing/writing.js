document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('newspaper-grid');
    const loadingMessage = document.getElementById('loading-message');
    const manifestURL = 'manifest.json';

    try {
        const response = await fetch(manifestURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        if (posts.length > 0) {
            const postPromises = posts.map(async (post) => {
                let snippet = 'Read more...';
                try {
                    const postResponse = await fetch(post.file);
                    if (postResponse.ok) {
                        const postHTML = await postResponse.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(postHTML, 'text/html');
                        const firstParagraph = doc.querySelector('.post-page-content p');
                        if (firstParagraph) {
                            snippet = firstParagraph.textContent.trim();
                        }
                    }
                } catch (e) {
                    console.error(`Could not fetch snippet for ${post.file}:`, e);
                }

                const postElement = document.createElement('a');
                postElement.className = 'grid-item';
                postElement.href = post.file;

                const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                
                const tagsHTML = post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');

                postElement.innerHTML = `
                    <div>
                        <h2>${post.title}</h2>
                        <p>${snippet}</p>
                    </div>
                    <div class="meta">
                        <span>${formattedDate}</span>
                        <div class="tags">${tagsHTML}</div>
                    </div>
                `;
                return postElement;
            });

            const postElements = await Promise.all(postPromises);
            postElements.forEach(el => grid.appendChild(el));

        } else {
            loadingMessage.textContent = 'No posts found.';
        }

    } catch (error) {
        loadingMessage.textContent = 'Could not load articles. Please try again later.';
        console.error('Failed to load blog manifest:', error);
    } finally {
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        // Activate cursor after posts are loaded and interactive elements are in the DOM
        activateCursor();
    }

    // --- Custom Cursor Logic ---
    function activateCursor() {
        document.body.classList.add('cursor-active');

        const cursorDot = document.querySelector('.cursor-dot');
        const cursorOutline = document.querySelector('.cursor-outline');
        // Include the newly added grid items in the interactive elements
        const interactiveElements = document.querySelectorAll('a, button');

        let mouse = { x: -100, y: -100 };
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        const moveCursor = () => {
            if (!cursorDot || !cursorOutline) return;
            const posX = mouse.x;
            const posY = mouse.y;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: 'forwards' });

            requestAnimationFrame(moveCursor);
        };
        moveCursor();

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('hover');
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('hover');
            });
        });
    }
});