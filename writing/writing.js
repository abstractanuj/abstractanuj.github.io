document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('posts-container');
    const loadingMessage = document.getElementById('loading-message');
    const manifestURL = 'manifest.json';

    try {
        const response = await fetch(manifestURL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        if (posts.length > 0) {
            let html = '';
            posts.forEach((post, index) => {
                const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                const tagsHTML = post.tags.map(tag => `<a href="#" class="tag">#${tag}</a>`).join(' | ');

                html += `
                    <tr class='athing'>
                        <td align="right" valign="top" class="title">${index + 1}.</td>
                        <td valign="top" class="votelinks">
                            <center><a href='#'><div class='votearrow' title='upvote'></div></a></center>
                        </td>
                        <td class="title">
                            <a href="${post.file}" class="storylink">${post.title}</a>
                            <span class="sitebit comhead"> (<a href="#">anuj.com</a>) </span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2"></td>
                        <td class="subtext">
                            <span>by Anuj Singh</span> | 
                            <span>on ${formattedDate}</span> |
                            <span>${tagsHTML}</span>
                        </td>
                    </tr>
                    <tr class="spacer" style="height:5px"></tr>
                `;
            });
            container.innerHTML = html;
        } else {
            loadingMessage.textContent = 'No posts found.';
        }

    } catch (error) {
        loadingMessage.innerHTML = 'Could not load blog posts. Please try again later.';
        console.error('Failed to load blog manifest:', error);
    } finally {
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }
});
