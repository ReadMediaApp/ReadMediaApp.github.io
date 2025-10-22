// Article detail page functionality
class ArticleViewer {
    static init() {
        this.loadMarkdownParser();
        this.loadArticle();
        this.setupEventListeners();
    }

    static async loadMarkdownParser() {
        // Load marked.js from CDN if not already loaded
        if (typeof marked === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    static async loadArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
            this.showError('No article specified');
            return;
        }

        try {
            const response = await fetch('data/articles.json');
            if (!response.ok) {
                throw new Error('Failed to load articles');
            }
            const articles = await response.json();
            const article = articles.find(a => a.id === articleId);

            if (!article) {
                this.showError('Article not found');
                return;
            }

            this.displayArticle(article);
            this.showShareSection();
            this.loadRelatedArticles(article, articles);
            this.incrementViews(article);
            
            // Update page title and meta
            document.title = `${article.title} - ReadMedia`;
            this.updateMetaData(article);

        } catch (error) {
            console.error('Error loading article:', error);
            this.showError('Failed to load article');
        }
    }

    static displayArticle(article) {
        const articleContent = document.getElementById('article-content');
        
        // Simple security sanitization
        const safeArticle = {
            id: this.escapeHTML(article.id),
            title: this.escapeHTML(article.title),
            author: this.escapeHTML(article.author),
            date: article.date,
            content: article.content, // Will be processed separately
            tags: Array.isArray(article.tags) ? article.tags.map(tag => this.escapeHTML(tag)) : [],
            image: this.isValidURL(article.image) ? article.image : '',
            excerpt: this.escapeHTML(article.excerpt || ''),
            category: this.escapeHTML(article.category || ''),
            read_time: this.escapeHTML(article.read_time || ''),
            views: article.views || 0,
            affiliate_link: this.isValidURL(article.affiliate_link) ? article.affiliate_link : '',
            affiliate_product: this.escapeHTML(article.affiliate_product || ''),
            affiliate_disclosure: article.affiliate_disclosure || false
        };

        const date = new Date(safeArticle.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Category badge
        const categoryHTML = safeArticle.category 
            ? `<span class="category-badge">${safeArticle.category}</span>`
            : '';

        // Read time and views
        const metaExtras = [];
        if (safeArticle.read_time) {
            metaExtras.push(`<span class="read-time">
                <span class="material-icons">schedule</span>
                ${safeArticle.read_time}
            </span>`);
        }
        if (safeArticle.views > 0) {
            metaExtras.push(`<span class="views-count">
                <span class="material-icons">visibility</span>
                ${safeArticle.views} views
            </span>`);
        }
        const metaExtrasHTML = metaExtras.length > 0 
            ? `<div class="article-meta-extras">${metaExtras.join('')}</div>` 
            : '';

        // Tags
        const tagsHTML = safeArticle.tags && safeArticle.tags.length > 0 
            ? `<div class="article-tags">
                 ${safeArticle.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
               </div>`
            : '';

        // Featured image
        const featuredImageHTML = safeArticle.image 
            ? `<img src="${safeArticle.image}" alt="${safeArticle.title}" class="article-featured-image" loading="lazy">`
            : '';

        // Convert Markdown content to HTML
        const contentHTML = this.formatContent(safeArticle.content);

        // Affiliate disclosure and product recommendation
        const affiliateHTML = this.renderAffiliateSection(safeArticle);

        articleContent.innerHTML = `
            <div class="article-header">
                ${categoryHTML}
                <h1 class="article-title">${safeArticle.title}</h1>
                <div class="article-meta">
                    <span class="article-author">
                        <span class="material-icons">person</span>
                        By ${safeArticle.author}
                    </span>
                    <span class="article-date">
                        <span class="material-icons">calendar_today</span>
                        ${date}
                    </span>
                </div>
                ${metaExtrasHTML}
                ${tagsHTML}
            </div>
            
            ${featuredImageHTML}
            
            <div class="article-content">
                ${contentHTML}
            </div>
            
            ${affiliateHTML}
            
            <div class="article-actions">
                <a href="articles.html" class="back-to-articles">
                    <span class="material-icons">arrow_back</span>
                    Back to Articles
                </a>
                <div class="share-buttons">
                    <button class="share-btn" onclick="Share.shareArticle('${safeArticle.id}')" title="Share">
                        <span class="material-icons">share</span>
                    </button>
                </div>
            </div>
        `;

        // Initialize reading assistant after content is loaded
        setTimeout(() => {
            if (typeof ReadingAssistant !== 'undefined') {
                ReadingAssistant.init();
            }
        }, 100);
    }

    static renderAffiliateSection(safeArticle) {
        if (!safeArticle.affiliate_link) return '';

        const productName = safeArticle.affiliate_product || 'this product';
        const disclosureText = safeArticle.affiliate_disclosure 
            ? `<p class="affiliate-disclosure">
                <span class="material-icons">info</span>
                <em>Disclosure: This article contains affiliate links. If you purchase through these links, 
                we may earn a small commission at no extra cost to you. This helps support ReadMedia and 
                allows us to continue providing quality content. Thank you for your support!</em>
               </p>`
            : '';

        return `
            <div class="affiliate-section">
                <div class="affiliate-card">
                    <h3>
                        <span class="material-icons">shopping_bag</span>
                        Recommended Reading
                    </h3>
                    <p>Interested in exploring this topic further? Check out <strong>${productName}</strong>.</p>
                    <a href="${safeArticle.affiliate_link}" 
                       class="affiliate-btn" 
                       target="_blank" 
                       rel="noopener noreferrer sponsored"
                       onclick="Track.affiliateClick('${safeArticle.id}')">
                        <span class="material-icons">open_in_new</span>
                        View on Amazon
                    </a>
                </div>
                ${disclosureText}
            </div>
        `;
    }

    static formatContent(content) {
        if (!content) return '<p>No content available.</p>';
        
        // Use marked.js if available, otherwise fallback to basic parsing
        if (typeof marked !== 'undefined') {
            // Configure marked for security
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false,
                sanitize: false // We handle sanitization separately
            });
            
            // Parse markdown to HTML
            return marked.parse(content);
        } else {
            // Fallback: Basic markdown parsing
            return this.basicMarkdownParse(content);
        }
    }

    static basicMarkdownParse(content) {
        // Basic markdown parsing for fallback
        let html = content;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
        
        // Lists
        html = html.replace(/^\* (.*)$/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Code blocks
        html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Paragraphs
        const paragraphs = html.split('\n\n');
        html = paragraphs.map(para => {
            const trimmed = para.trim();
            if (!trimmed) return '';
            if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<pre')) {
                return trimmed;
            }
            return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');
        
        return html;
    }

    static incrementViews(article) {
        console.log(`Article viewed: ${article.id}`);
        
        const viewKey = `article_view_${article.id}`;
        const hasViewed = localStorage.getItem(viewKey);
        
        if (!hasViewed) {
            localStorage.setItem(viewKey, 'true');
            if (typeof Track !== 'undefined') {
                Track.articleView(article.id);
            }
        }
    }

    static updateMetaData(article) {
        let description = article.meta_description || article.excerpt || article.content.substring(0, 160);
        description = description.replace(/<[^>]*>/g, '');
        
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = description;

        this.updateOGTag('og:title', article.title);
        this.updateOGTag('og:description', description);
        if (article.image) {
            this.updateOGTag('og:image', article.image);
        }
        
        if (article.slug) {
            const canonical = document.getElementById('canonical-link');
            if (canonical) {
                canonical.href = `https://readmediaapp.github.io/article/${article.slug}`;
            }
        }

        this.updateStructuredData(article);
    }

    static updateOGTag(property, content) {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.content = content;
    }

    static updateStructuredData(article) {
        const schema = document.getElementById('article-schema');
        if (schema) {
            const structuredData = {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": article.title,
                "description": article.excerpt || article.content.substring(0, 160),
                "image": article.image || "",
                "author": {
                    "@type": "Person",
                    "name": article.author
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "ReadMedia",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://readmediaapp.github.io/images/logo.png"
                    }
                },
                "datePublished": article.published_date || article.date,
                "dateModified": article.date
            };
            
            if (article.meta_keywords) {
                structuredData.keywords = article.meta_keywords;
            }
            
            schema.textContent = JSON.stringify(structuredData, null, 2);
        }
    }

    static escapeHTML(unsafe) {
        if (unsafe === null || unsafe === undefined) {
            return '';
        }
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static isValidURL(string) {
        if (!string) return false;
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    static showShareSection() {
        const shareSection = document.getElementById('share-section');
        if (shareSection) {
            shareSection.style.display = 'block';
        }
    }

    static loadRelatedArticles(currentArticle, allArticles) {
        const relatedSection = document.getElementById('related-articles');
        const relatedGrid = document.getElementById('related-articles-grid');
        
        if (!relatedSection || !relatedGrid) return;

        const related = allArticles
            .filter(article => 
                article.id !== currentArticle.id && 
                article.status === 'published' &&
                (article.tags?.some(tag => currentArticle.tags?.includes(tag)) || 
                 article.author === currentArticle.author ||
                 article.category === currentArticle.category)
            )
            .slice(0, 3);

        if (related.length > 0) {
            relatedGrid.innerHTML = related
                .map(article => Components.renderArticleCard(article))
                .join('');
            relatedSection.style.display = 'block';
        }
    }

    static showError(message) {
        const articleContent = document.getElementById('article-content');
        articleContent.innerHTML = `
            <div class="article-error">
                <span class="material-icons">error_outline</span>
                <h2>Article Not Found</h2>
                <p>${message}</p>
                <a href="articles.html" class="btn" style="margin-top: 1rem;">
                    <span class="material-icons">arrow_back</span>
                    Back to Articles
                </a>
            </div>
        `;
    }

    static setupEventListeners() {
        window.addEventListener('popstate', () => {
            this.loadArticle();
        });
    }
}

// Initialize when DOM is loaded
if (document.getElementById('article-content')) {
    document.addEventListener('DOMContentLoaded', () => {
        ArticleViewer.init();
        
        if (typeof App !== 'undefined') {
            App.loadData().then(() => {
                App.renderSidebar();
                App.renderFooter();
            });
        } else {
            fetch('data/articles.json')
                .then(response => response.json())
                .then(articles => {
                    fetch('data/books.json')
                        .then(response => response.json())
                        .then(books => {
                            fetch('data/ads.json')
                                .then(response => response.json())
                                .then(ads => {
                                    const sidebar = document.getElementById('sidebar');
                                    const footer = document.getElementById('footer');
                                    if (sidebar) {
                                        sidebar.innerHTML = Components.renderSidebar(articles, books, ads);
                                    }
                                    if (footer) {
                                        footer.innerHTML = Components.renderFooter();
                                    }
                                });
                        });
                })
                .catch(error => {
                    console.error('Error loading sidebar/footer:', error);
                });
        }
    });
}