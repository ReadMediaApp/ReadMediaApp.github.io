// search.js - Complete version with Amazon affiliate links
class SearchPage {
    constructor() {
        this.searchQuery = this.getSearchQuery();
        this.localResults = [];
        this.init();
    }

    getSearchQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q') || '';
    }

    async init() {
        if (!this.searchQuery) {
            this.showNoResults('Please enter a search term');
            return;
        }

        await this.waitForAppData();
        this.performLocalSearch();
        this.renderAmazonSearchSection();
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

    performLocalSearch() {
        this.localResults = this.searchAllContent(this.searchQuery);
        this.renderResults();
    }

    generateAmazonSearchUrl(query) {
        // Amazon search URL with your affiliate tag
        const encodedQuery = encodeURIComponent(query);
        return `https://www.amazon.com/s?k=${encodedQuery}&tag=readmediaapp-20&linkCode=ll2&linkId=shopnow`;
    }

    renderAmazonSearchSection() {
        const amazonSearchUrl = this.generateAmazonSearchUrl(this.searchQuery);
        
        const amazonSection = `
            <div class="amazon-search-section">
                <h2>Find More on Amazon</h2>
                <div class="amazon-search-card">
                    <div class="amazon-icon">📚</div>
                    <div class="amazon-content">
                        <h3>Search Amazon for Books</h3>
                        <p>Find thousands of books related to "${this.escapeHtml(this.searchQuery)}" on Amazon</p>
                        <div class="amazon-actions">
                            <a href="${amazonSearchUrl}" 
                               target="_blank" 
                               rel="noopener" 
                               class="btn btn-amazon">
                                <span class="amazon-logo">amazon</span>
                                Search Amazon
                            </a>
                            <a href="https://www.amazon.com/best-sellers-books-Amazon/zgbs/books/?tag=readmediaapp-20"
                               target="_blank"
                               rel="noopener"
                               class="btn btn-secondary">
                                Amazon Best Sellers
                            </a>
                        </div>
                    </div>
                </div>
                <div class="affiliate-disclaimer">
                    <p>📚 <strong>Disclosure:</strong> As an Amazon Associate, we earn from qualifying purchases. Your support helps us maintain this website.</p>
                </div>
            </div>
        `;

        const container = document.getElementById('search-results');
        if (container) {
            if (this.localResults.length > 0) {
                // Insert Amazon section after local results
                const resultsContainer = container.querySelector('.local-results-section');
                if (resultsContainer) {
                    resultsContainer.insertAdjacentHTML('afterend', amazonSection);
                }
            } else {
                // If no results, Amazon section is already in no-results template
                container.insertAdjacentHTML('beforeend', amazonSection);
            }
        }
    }

    searchAllContent(query) {
        const appData = window.readMediaApp.appData;
        const results = [];

        // Search articles
        if (appData.articles) {
            appData.articles.forEach(article => {
                if (this.matchesSearch(article, query)) {
                    results.push({
                        type: 'article',
                        data: article,
                        relevance: this.calculateRelevance(article, query)
                    });
                }
            });
        }

        // Search books
        if (appData.books) {
            appData.books.forEach(book => {
                if (this.matchesSearch(book, query)) {
                    results.push({
                        type: 'book',
                        data: book,
                        relevance: this.calculateRelevance(book, query)
                    });
                }
            });
        }

        // Search reviews
        if (appData.reviews) {
            appData.reviews.forEach(review => {
                if (this.matchesSearch(review, query)) {
                    results.push({
                        type: 'review',
                        data: review,
                        relevance: this.calculateRelevance(review, query)
                    });
                }
            });
        }

        // Sort by relevance
        return results.sort((a, b) => b.relevance - a.relevance);
    }

    matchesSearch(item, query) {
        const searchTerms = query.toLowerCase().split(' ');
        const searchableText = this.getSearchableText(item).toLowerCase();

        return searchTerms.some(term => searchableText.includes(term));
    }

    getSearchableText(item) {
        let text = '';
        
        if (item.title) text += ' ' + item.title;
        if (item.author) text += ' ' + item.author;
        if (item.description) text += ' ' + item.description;
        if (item.excerpt) text += ' ' + item.excerpt;
        if (item.content) text += ' ' + item.content;
        if (item.tags) text += ' ' + item.tags.join(' ');
        if (item.genre) text += ' ' + item.genre;

        return text;
    }

    calculateRelevance(item, query) {
        const searchTerms = query.toLowerCase().split(' ');
        const searchableText = this.getSearchableText(item).toLowerCase();
        let relevance = 0;

        searchTerms.forEach(term => {
            // Higher weight for title matches
            if (item.title && item.title.toLowerCase().includes(term)) {
                relevance += 3;
            }
            // Medium weight for author matches
            if (item.author && item.author.toLowerCase().includes(term)) {
                relevance += 2;
            }
            // Lower weight for content matches
            if (searchableText.includes(term)) {
                relevance += 1;
            }
        });

        return relevance;
    }

    renderResults() {
        const container = document.getElementById('search-results');
        if (!container) return;

        if (this.localResults.length === 0) {
            this.showNoResults(`No results found for "${this.searchQuery}"`);
            return;
        }

        container.innerHTML = `
            <h1>Search Results for "${this.escapeHtml(this.searchQuery)}"</h1>
            
            <div class="local-results-section">
                <h2>Our Content</h2>
                <p class="results-count">Found ${this.localResults.length} result${this.localResults.length !== 1 ? 's' : ''} in our library</p>
                <div class="search-results-grid">
                    ${this.localResults.map(result => this.renderSearchResult(result)).join('')}
                </div>
            </div>
        `;

        // Show Amazon search section
        this.renderAmazonSearchSection();
    }

    renderSearchResult(result) {
        const { type, data } = result;
        
        switch (type) {
            case 'article':
                return this.renderArticleResult(data);
            case 'book':
                return this.renderBookResult(data);
            case 'review':
                return this.renderReviewResult(data);
            default:
                return '';
        }
    }

    renderArticleResult(article) {
        return `
            <div class="search-result-card article-result">
                <div class="result-type">Article</div>
                <h3><a href="article.html?id=${article.id}">${this.escapeHtml(article.title)}</a></h3>
                <div class="result-meta">
                    <span>By ${this.escapeHtml(article.author)}</span>
                    <span>•</span>
                    <time datetime="${article.date}">${this.formatDate(article.date)}</time>
                </div>
                <p class="result-excerpt">${this.escapeHtml(article.excerpt)}</p>
                <a href="article.html?id=${article.id}" class="btn btn-secondary">Read Article</a>
            </div>
        `;
    }

    renderBookResult(book) {
        return `
            <div class="search-result-card book-result">
                <div class="result-type">Book</div>
                <h3><a href="book.html?id=${book.id}">${this.escapeHtml(book.title)}</a></h3>
                <div class="result-meta">
                    <span>By ${this.escapeHtml(book.author)}</span>
                    ${book.year ? `<span>•</span><span>${book.year}</span>` : ''}
                    ${book.genre ? `<span>•</span><span>${book.genre}</span>` : ''}
                </div>
                <p class="result-excerpt">${this.truncateText(book.description, 150)}</p>
                <a href="book.html?id=${book.id}" class="btn btn-secondary">View Book</a>
            </div>
        `;
    }

    renderReviewResult(review) {
        return `
            <div class="search-result-card review-result">
                <div class="result-type">Review</div>
                <div class="rating">${this.renderStars(review.rating)}</div>
                <h3><a href="review.html?id=${review.id}">${this.escapeHtml(review.title)}</a></h3>
                <div class="result-meta">
                    <span>By ${this.escapeHtml(review.author)}</span>
                    <span>•</span>
                    <time datetime="${review.date}">${this.formatDate(review.date)}</time>
                </div>
                <p class="result-excerpt">${this.truncateText(review.content, 150)}</p>
                <a href="review.html?id=${review.id}" class="btn btn-secondary">Read Review</a>
            </div>
        `;
    }

    showNoResults(message) {
        const container = document.getElementById('search-results');
        if (container) {
            const amazonSearchUrl = this.generateAmazonSearchUrl(this.searchQuery);
            
            container.innerHTML = `
                <div class="no-results">
                    <h2>${message}</h2>
                    <p>We couldn't find any matches in our library for "${this.escapeHtml(this.searchQuery)}"</p>
                    
                    <div class="amazon-search-card">
                        <div class="amazon-icon">🔍</div>
                        <div class="amazon-content">
                            <h3>Search on Amazon</h3>
                            <p>Find thousands of books related to "${this.escapeHtml(this.searchQuery)}" on Amazon</p>
                            <div class="amazon-actions">
                                <a href="${amazonSearchUrl}" 
                                   target="_blank" 
                                   rel="noopener" 
                                   class="btn btn-amazon">
                                    <span class="amazon-logo">amazon</span>
                                    Search Amazon
                                </a>
                                <a href="https://www.amazon.com/best-sellers-books-Amazon/zgbs/books/?tag=readmediaapp-20"
                                   target="_blank"
                                   rel="noopener"
                                   class="btn btn-secondary">
                                    Amazon Best Sellers
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="affiliate-disclaimer">
                        <p>📚 <strong>Disclosure:</strong> As an Amazon Associate, we earn from qualifying purchases. Your support helps us maintain this website.</p>
                    </div>

                    <div class="search-suggestions">
                        <h3>Or try these:</h3>
                        <div class="suggestion-buttons">
                            <a href="books.html" class="btn btn-primary">Browse All Books</a>
                            <a href="articles.html" class="btn btn-primary">Browse Articles</a>
                            <a href="reviews.html" class="btn btn-primary">Browse Reviews</a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderStars(rating) {
        if (!rating) return '';
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '½' : '') + 
               '☆'.repeat(emptyStars);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
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
}

// Initialize search page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchPage();
});

// Optional: Add global error handling for search functionality
window.addEventListener('error', (event) => {
    console.error('Search page error:', event.error);
    
    // If there's a critical error, show a user-friendly message
    const container = document.getElementById('search-results');
    if (container && container.innerHTML.includes('loading')) {
        container.innerHTML = `
            <div class="error-state">
                <h2>Something went wrong</h2>
                <p>We're having trouble loading search results. Please try again.</p>
                <button onclick="window.location.reload()" class="btn btn-primary">Reload Page</button>
            </div>
        `;
    }
});