// Giscus comments system for ReadMedia using GitHub Discussions
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on article pages
    if (window.location.pathname.includes('article.html')) {
        // Get the comments container
        const commentsContainer = document.querySelector('#comments-container');
        if (!commentsContainer) {
            console.error('Comments container not found: #comments-container');
            return;
        }

        // Create a header for the comments section
        const commentsHeader = document.createElement('div');
        commentsHeader.className = 'comments-header';
        commentsHeader.innerHTML = '<h3>Comments</h3>';
        commentsContainer.appendChild(commentsHeader);

        // Create the giscus script element
        const giscusScript = document.createElement('script');
        giscusScript.src = 'https://giscus.app/client.js';
        giscusScript.setAttribute('data-repo', 'ReadMediaApp/ReadMediaApp.github.io');
        giscusScript.setAttribute('data-repo-id', 'R_kgDOQAnWNw');
        giscusScript.setAttribute('data-category', 'Q&A');
        giscusScript.setAttribute('data-category-id', 'DIC_kwDOQAnWN84Cw0zC');
        giscusScript.setAttribute('data-mapping', 'pathname');
        giscusScript.setAttribute('data-strict', '0');
        giscusScript.setAttribute('data-reactions-enabled', '1');
        giscusScript.setAttribute('data-emit-metadata', '0');
        giscusScript.setAttribute('data-input-position', 'bottom');
        giscusScript.setAttribute('data-theme', 'preferred_color_scheme');
        giscusScript.setAttribute('data-lang', 'en');
        giscusScript.setAttribute('crossorigin', 'anonymous');
        giscusScript.async = true;

        // Create a container for the giscus comments
        const giscusContainer = document.createElement('div');
        giscusContainer.className = 'giscus-container';
        commentsContainer.appendChild(giscusContainer);

        // Add the script to the container
        giscusContainer.appendChild(giscusScript);

        // Add a note about Giscus
        const giscusNote = document.createElement('div');
        giscusNote.className = 'giscus-note';
        giscusNote.innerHTML = `
            <p class="giscus-info" style="font-size: 0.8rem; color: #666; margin-top: 1rem; text-align: center;">
                Comments are powered by 
                <a href="https://giscus.app" target="_blank" rel="noopener noreferrer">giscus</a>.
                To comment, please sign in with GitHub.
            </p>
        `;
        commentsContainer.appendChild(giscusNote);

        console.log('Giscus comments system initialized');
    }
});