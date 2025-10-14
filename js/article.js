// Article detail page functionality
class ArticleViewer {
    static init() {
        this.loadArticle();
        this.setupEventListeners();
    }

    static async loadArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
            this.showError('No article specified');
            return;
        }

        try {
            // Load articles data directly
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
            
            // Update page title and meta description
            document.title = `${article.title} - ReadMedia`;
            this.updateMetaDescription(article);

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
            content: article.content,
            tags: Array.isArray(article.tags) ? article.tags.map(tag => this.escapeHTML(tag)) : [],
            image: this.isValidURL(article.image) ? article.image : '',
            excerpt: this.escapeHTML(article.excerpt || '')
        };

        const date = new Date(safeArticle.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const tagsHTML = safeArticle.tags && safeArticle.tags.length > 0 
            ? `<div class="article-tags">
                 ${safeArticle.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
               </div>`
            : '';

        const featuredImageHTML = safeArticle.image 
            ? `<img src="${safeArticle.image}" alt="${safeArticle.title}" class="article-featured-image" loading="lazy">`
            : '';

        // Convert markdown-like content to HTML with security
        const contentHTML = this.formatContent(safeArticle.content);

        articleContent.innerHTML = `
            <div class="article-header">
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
                ${tagsHTML}
            </div>
            
            ${featuredImageHTML}
            
            <div class="article-content">
                ${contentHTML}
            </div>
            
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

    static formatContent(content) {
        if (!content) return '<p>No content available.</p>';
        
        // Very simple formatting - just handle paragraphs with security
        const paragraphs = content.split('\n\n');
        
        const formattedParagraphs = paragraphs.map(para => {
            const trimmed = this.escapeHTML(para.trim());
            if (!trimmed) return '';
            
            // Replace single line breaks with <br> within paragraphs
            const withBreaks = trimmed.replace(/\n/g, '<br>');
            
            return `<p>${withBreaks}</p>`;
        }).filter(para => para !== '');
        
        return formattedParagraphs.join('\n');
    }

    // Security helper methods
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

        // Find related articles (same tags or same author)
        const related = allArticles
            .filter(article => 
                article.id !== currentArticle.id && 
                (article.tags?.some(tag => currentArticle.tags?.includes(tag)) || 
                 article.author === currentArticle.author)
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

    static updateMetaDescription(article) {
        let description = article.excerpt || article.content.substring(0, 160);
        description = description.replace(/<[^>]*>/g, ''); // Remove HTML tags
        
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = description;
    }

    static setupEventListeners() {
        // Handle browser navigation
        window.addEventListener('popstate', () => {
            this.loadArticle();
        });
    }
}

// Initialize when DOM is loaded
if (document.getElementById('article-content')) {
    document.addEventListener('DOMContentLoaded', () => {
        ArticleViewer.init();
        
        // Load sidebar and footer if App is available
        if (typeof App !== 'undefined') {
            App.loadData().then(() => {
                App.renderSidebar();
                App.renderFooter();
            });
        } else {
            // Fallback: Load sidebar and footer directly
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