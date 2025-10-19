/**
 * SEO Helper Functions
 * Updates meta tags and structured data based on page content
 */

const SEO = {
    /**
     * Updates article meta tags and structured data
     * @param {Object} article - The article data
     */
    updateArticleMeta: function(article) {
        if (!article) return;
        
        // Update page title
        document.title = `${article.title} - ReadMedia`;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', article.excerpt || `Read ${article.title} on ReadMedia`);
        }
        
        // Update canonical URL
        const canonicalLink = document.getElementById('canonical-link');
        if (canonicalLink) {
            canonicalLink.setAttribute('href', `https://readmediaapp.github.io/article.html?id=${article.id}`);
        }
        
        // Update Open Graph tags
        const ogTitle = document.getElementById('og-title');
        const ogDescription = document.getElementById('og-description');
        const ogUrl = document.getElementById('og-url');
        
        if (ogTitle) ogTitle.setAttribute('content', article.title);
        if (ogDescription) ogDescription.setAttribute('content', article.excerpt || `Read ${article.title} on ReadMedia`);
        if (ogUrl) ogUrl.setAttribute('content', `https://readmediaapp.github.io/article.html?id=${article.id}`);
        
        // Update Twitter tags
        const twitterTitle = document.getElementById('twitter-title');
        const twitterDescription = document.getElementById('twitter-description');
        
        if (twitterTitle) twitterTitle.setAttribute('content', article.title);
        if (twitterDescription) twitterDescription.setAttribute('content', article.excerpt || `Read ${article.title} on ReadMedia`);
        
        // Update structured data
        const articleSchema = document.getElementById('article-schema');
        if (articleSchema) {
            const schemaData = JSON.parse(articleSchema.textContent);
            schemaData.headline = article.title;
            schemaData.description = article.excerpt || `Read ${article.title} on ReadMedia`;
            schemaData.image = article.image || "";
            if (article.author) {
                schemaData.author.name = article.author;
            }
            schemaData.datePublished = article.publishedDate || new Date().toISOString();
            schemaData.dateModified = article.modifiedDate || article.publishedDate || new Date().toISOString();
            
            articleSchema.textContent = JSON.stringify(schemaData);
        }
    },
    
    /**
     * Updates meta tags for listing pages (articles, books, reviews)
     * @param {string} pageType - The type of page (articles, books, reviews)
     * @param {string} category - Optional category filter
     */
    updateListingMeta: function(pageType, category = '') {
        let title, description;
        
        switch(pageType) {
            case 'articles':
                title = category ? `${category} Articles - ReadMedia` : 'Articles - ReadMedia';
                description = category ? 
                    `Browse our collection of ${category.toLowerCase()} articles on ReadMedia` : 
                    'Browse all articles on ReadMedia';
                break;
            case 'books':
                title = category ? `${category} Books - ReadMedia` : 'Books - ReadMedia';
                description = category ? 
                    `Explore our ${category.toLowerCase()} book collection on ReadMedia` : 
                    'Browse and download books from ReadMedia';
                break;
            case 'reviews':
                title = category ? `${category} Book Reviews - ReadMedia` : 'Book Reviews - ReadMedia';
                description = category ? 
                    `Read professional reviews of ${category.toLowerCase()} books on ReadMedia` : 
                    'Read professional book reviews and recommendations';
                break;
            default:
                return;
        }
        
        // Update page title
        document.title = title;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }
    }
};

// Export for use in other files
window.SEO = SEO;