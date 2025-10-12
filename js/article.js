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
        const safeArticle = Security.preventXSS(article);
        
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

        // Convert markdown-like content to HTML (simple conversion)
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
    }

    static formatContent(content) {
        if (!content) return '<p>No content available.</p>';
        
        // Simple markdown to HTML conversion
        let formattedContent = content
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            
            // Bold and Italic
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            
            // Links
            .replace(/\[([^\[]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            
            // Code blocks (simple)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            
            // Line breaks
            .replace(/\n/g, '<br>');

        // Handle paragraphs - split by double line breaks
        const paragraphs = formattedContent.split('<br><br>');
        formattedContent = paragraphs.map(para => {
            if (para.trim() && !para.startsWith('<h') && !para.startsWith('<ul>') && !para.startsWith('<ol>') && !para.startsWith('<li>')) {
                return `<p>${para}</p>`;
            }
            return para;
        }).join('');

        return formattedContent;
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