document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('postForm');
    const postsContainer = document.getElementById('postsContainer');
    const loadingIndicator = document.getElementById('loading');

    // Config
    const REPO_OWNER = 'Takutaku05';
    const REPO_NAME = 'chatApp';

    // Load saved credentials
    loadCredentials();

    // Fetch and display posts
    fetchPosts();

    // Handling form submission with window.open
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const userId = document.getElementById('userId').value.trim();
        const tripKey = document.getElementById('tripKey').value.trim();
        const bodyContent = document.getElementById('body').value.trim();

        if (!userId || !tripKey || !bodyContent) {
            showToast('All fields are required.', 'error');
            return;
        }

        const payload = {
            user_id: userId,
            trip_key: tripKey,
            body: bodyContent
        };

        const jsonBody = JSON.stringify(payload);
        const title = 'BBS Post Request';

        // Construct GitHub Issue URL
        // Using encodeURIComponent to safely encode the parameters
        const issueUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(jsonBody)}`;

        // Open in new tab
        window.open(issueUrl, '_blank');

        showToast('Opened GitHub Issue page. Please click "Submit new issue".', 'success');

        // Save credentials and reset body
        saveCredentials(userId, tripKey);
        document.getElementById('body').value = '';
    });

    async function fetchPosts() {
        try {
            // Add cache-busting to prevent stale data
            const response = await fetch(`data/posts.json?t=${new Date().getTime()}`);
            if (!response.ok) {
                if (response.status === 404) {
                    renderPosts([]); // File might not exist yet
                    return;
                }
                throw new Error('Failed to load posts');
            }
            const posts = await response.json();
            // Sort by timestamp descending (newest first)
            posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            renderPosts(posts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            postsContainer.innerHTML = '<div class="subtitle" style="text-align:center">Failed to load posts.</div>';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    function renderPosts(posts) {
        postsContainer.innerHTML = '';

        if (posts.length === 0) {
            postsContainer.innerHTML = '<div class="subtitle" style="text-align:center">No posts yet. Be the first!</div>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('article');
            card.className = 'post-card';

            const date = new Date(post.timestamp).toLocaleString();

            // Escape HTML to prevent XSS
            const safeUserId = escapeHtml(post.user_id);
            const safeBody = escapeHtml(post.body);

            card.innerHTML = `
                <div class="post-meta">
                    <span class="post-user">@${safeUserId}</span>
                    <time class="post-time">${date}</time>
                </div>
                <div class="post-body">${safeBody}</div>
            `;
            postsContainer.appendChild(card);
        });
    }

    // Helpers
    function saveCredentials(userId, tripKey) {
        localStorage.setItem('bbs_user_id', userId);
        localStorage.setItem('bbs_trip_key', tripKey);
    }

    function loadCredentials() {
        const userId = localStorage.getItem('bbs_user_id');
        const tripKey = localStorage.getItem('bbs_trip_key');

        if (userId) document.getElementById('userId').value = userId;
        if (tripKey) document.getElementById('tripKey').value = tripKey;
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
