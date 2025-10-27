// article.js - Fixed markdown parsing with enhanced features
class ArticlePage {
    constructor() {
        this.articleId = this.getArticleIdFromURL();
        this.article = null;
        this.init();
    }

    getArticleIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.articleId) {
            this.showError('No article ID provided');
            return;
        }

        await this.waitForAppData();
        this.loadArticle();
        this.updateSEO();
    }

    async waitForAppData() {
        return new Promise((resolve) => {
            const checkData = () => {
                if (window.readMediaApp && window.readMediaApp.appData) {
                    resolve();
                } else {
                    setTimeout(checkData, 100);
                }
            };
            checkData();
        });
    }

    loadArticle() {
        const articles = window.readMediaApp.appData.articles || [];
        this.article = articles.find(a => a.id === this.articleId);

        if (!this.article) {
            this.showError('Article not found');
            return;
        }

        this.renderArticle();
    }

    renderArticle() {
        const container = document.getElementById('article-detail');
        if (!container) return;

        container.innerHTML = `
            <article itemscope itemtype="https://schema.org/Article">
                <header class="article-header">
                    ${this.article.image ? `
                        <div class="article-hero-image">
                            <img src="${this.article.image}" alt="${this.article.title}" class="article-image" itemprop="image">
                            ${this.article.imageCaption ? `<figcaption class="image-caption">${this.escapeHtml(this.article.imageCaption)}</figcaption>` : ''}
                        </div>
                    ` : ''}
                    
                    <nav class="breadcrumb" aria-label="Breadcrumb">
                        <a href="articles.html">Articles</a> 
                        <span class="breadcrumb-separator">/</span>
                        <span>${this.escapeHtml(this.article.title)}</span>
                    </nav>
                    
                    <h1 class="article-title" itemprop="headline">${this.escapeHtml(this.article.title)}</h1>
                    
                    <div class="article-meta">
                        <div class="author-info">
                            <span class="author" itemprop="author">By ${this.escapeHtml(this.article.author)}</span>
                        </div>
                        <div class="article-details">
                            <time datetime="${this.article.date}" class="publish-date" itemprop="datePublished">
                                ${this.formatDate(this.article.date)}
                            </time>
                            ${this.article.read_time ? `<span class="read-time">${this.article.read_time}</span>` : ''}
                            ${this.article.views ? `<span class="views">${this.article.views} views</span>` : ''}
                        </div>
                    </div>

                    ${this.article.excerpt ? `
                        <div class="article-excerpt" itemprop="description">
                            <p>${this.escapeHtml(this.article.excerpt)}</p>
                        </div>
                    ` : ''}
                </header>

                <div class="article-content" itemprop="articleBody">
                    ${this.formatContent(this.article.content)}
                </div>

                ${this.article.affiliate_link && this.article.affiliate_product ? `
                    <div class="affiliate-section">
                        <div class="affiliate-card">
                            <h3>📚 Recommended Reading</h3>
                            <p>If you enjoyed this article, you might like:</p>
                            <a href="${this.article.affiliate_link}" 
                               target="_blank" 
                               rel="noopener sponsored" 
                               class="btn btn-amazon">
                                <span class="amazon-logo">amazon</span>
                                ${this.escapeHtml(this.article.affiliate_product)}
                            </a>
                        </div>
                    </div>
                ` : ''}

                ${this.article.tags && this.article.tags.length > 0 ? `
                    <footer class="article-footer">
                        <div class="article-tags">
                            <strong>Tags:</strong>
                            ${this.article.tags.map(tag => 
                                `<span class="tag" itemprop="keywords">${this.escapeHtml(tag)}</span>`
                            ).join('')}
                        </div>
                    </footer>
                ` : ''}

                <div class="article-actions">
                    <div class="sharing-section">
                        <h3>Share this article</h3>
                        <div class="share-buttons">
                            <button class="share-btn share-twitter" onclick="shareOnTwitter()" aria-label="Share on Twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.016 10.016 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.543l-.047-.02z"/>
                                </svg>
                                Twitter
                            </button>
                            <button class="share-btn share-facebook" onclick="shareOnFacebook()" aria-label="Share on Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook
                            </button>
                            <button class="share-btn share-linkedin" onclick="shareOnLinkedIn()" aria-label="Share on LinkedIn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                LinkedIn
                            </button>
                            <button class="share-btn share-copy" onclick="copyArticleLink()" aria-label="Copy article link">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                                Copy Link
                            </button>
                        </div>
                    </div>

                    <div class="navigation-section">
                        <a href="articles.html" class="btn btn-primary">← Back to Articles</a>
                    </div>
                </div>
            </article>
        `;

        // Highlight code blocks if Prism.js is available
        this.highlightCodeBlocks();
    }

    formatContent(content) {
        if (!content) return '<p>No content available.</p>';
        
        // Process markdown line by line
        const lines = content.split('\n');
        let htmlLines = [];
        let inList = false;
        let inCodeBlock = false;
        let codeBlockLanguage = '';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Handle code blocks
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    // Start code block
                    codeBlockLanguage = line.replace('```', '').trim() || 'text';
                    htmlLines.push(`<pre><code class="language-${codeBlockLanguage}">`);
                    inCodeBlock = true;
                } else {
                    // End code block
                    htmlLines.push('</code></pre>');
                    inCodeBlock = false;
                }
                continue;
            }

            if (inCodeBlock) {
                // Inside code block - preserve formatting
                htmlLines.push(this.escapeHtml(lines[i]));
                continue;
            }

            // Skip empty lines
            if (line === '') {
                if (inList) {
                    htmlLines.push('</ul>');
                    inList = false;
                }
                htmlLines.push('');
                continue;
            }

            // Headers
            if (line.startsWith('### ')) {
                htmlLines.push(`<h3>${this.processInlineMarkdown(line.substring(4))}</h3>`);
                continue;
            }
            
            if (line.startsWith('## ')) {
                htmlLines.push(`<h2>${this.processInlineMarkdown(line.substring(3))}</h2>`);
                continue;
            }
            
            if (line.startsWith('# ')) {
                htmlLines.push(`<h1>${this.processInlineMarkdown(line.substring(2))}</h1>`);
                continue;
            }

            // Blockquotes
            if (line.startsWith('> ')) {
                htmlLines.push(`<blockquote>${this.processInlineMarkdown(line.substring(2))}</blockquote>`);
                continue;
            }

            // Lists
            if (line.startsWith('- ') || line.startsWith('* ')) {
                if (!inList) {
                    htmlLines.push('<ul>');
                    inList = true;
                }
                const listItem = line.substring(2);
                htmlLines.push(`<li>${this.processInlineMarkdown(listItem)}</li>`);
                continue;
            }

            // Ordered lists
            if (/^\d+\.\s/.test(line)) {
                if (!inList) {
                    htmlLines.push('<ol>');
                    inList = true;
                }
                const listItem = line.replace(/^\d+\.\s/, '');
                htmlLines.push(`<li>${this.processInlineMarkdown(listItem)}</li>`);
                continue;
            }

            // Horizontal rule
            if (line === '---' || line === '***') {
                htmlLines.push('<hr>');
                continue;
            }

            // Regular paragraphs
            if (line) {
                // Close list if we're starting a new paragraph
                if (inList) {
                    htmlLines.push('</ul>');
                    inList = false;
                }
                htmlLines.push(`<p>${this.processInlineMarkdown(line)}</p>`);
            }
        }

        // Close any open list
        if (inList) {
            htmlLines.push('</ul>');
        }

        return htmlLines.join('\n');
    }

    processInlineMarkdown(text) {
        return text
            // Bold: **text** or __text__
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            
            // Italic: *text* or _text_
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            
            // Inline code: `code`
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            
            // Links: [text](url)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            
            // Images: ![alt](src)
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    }

    highlightCodeBlocks() {
        if (window.Prism) {
            Prism.highlightAllUnder(document.getElementById('article-detail'));
        }
    }

    updateSEO() {
        if (!this.article) return;

        // Update meta tags
        document.title = `${this.article.title} - ReadMedia`;
        
        // Update or create meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = this.article.meta_description || this.article.excerpt || this.article.title;

        // Update or create meta keywords
        if (this.article.meta_keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.content = this.article.meta_keywords;
        }

        // Add structured data
        this.addStructuredData();
    }

    addStructuredData() {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": this.article.title,
            "description": this.article.meta_description || this.article.excerpt,
            "image": this.article.image ? new URL(this.article.image, window.location.origin).href : '',
            "author": {
                "@type": "Person",
                "name": this.article.author
            },
            "publisher": {
                "@type": "Organization",
                "name": "ReadMedia",
                "logo": {
                    "@type": "ImageObject",
                    "url": new URL("/icons/icon-192x192.png", window.location.origin).href
                }
            },
            "datePublished": this.article.date,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            }
        };

        // Remove script if it exists
        const existingScript = document.getElementById('article-structured-data');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'article-structured-data';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown date';
        }
    }

    showError(message) {
        const container = document.getElementById('article-detail');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Unable to Load Article</h2>
                    <p>${this.escapeHtml(message)}</p>
                    <div class="error-actions">
                        <a href="articles.html" class="btn btn-primary">Browse All Articles</a>
                        <button onclick="window.location.reload()" class="btn btn-secondary">Try Again</button>
                    </div>
                </div>
            `;
        }
    }
}

// Share functions
function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
}

function copyArticleLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        // Show success message
        const copyBtn = document.querySelector('.share-copy');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }).catch(() => {
        alert('Failed to copy link. Please copy manually: ' + url);
    });
}

// Initialize article page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ArticlePage();
});