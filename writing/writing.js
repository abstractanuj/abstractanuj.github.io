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
    }
});
