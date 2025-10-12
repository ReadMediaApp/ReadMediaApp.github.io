// Enhanced search functionality with affiliate integration
class EnhancedSearch {
    static config = {
        affiliateId: 'readmediaapp-20', // Your affiliate ID
        amazonSearch: true,
        fallbackSearch: true
    };

    static init() {
        this.setupSearchListeners();
        this.setupSearchUI();
    }

    static setupSearchUI() {
        // Add search suggestions container
        const searchContainer = document.querySelector('.hero-search') || document.querySelector('.search-container');
        if (searchContainer && !document.getElementById('search-suggestions')) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.id = 'search-suggestions';
            suggestionsDiv.className = 'search-suggestions';
            searchContainer.appendChild(suggestionsDiv);
        }
    }

    static setupSearchListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                this.showSearchSuggestions(e.target.value);
                
                searchTimeout = setTimeout(() => {
                    this.performEnhancedSearch(e.target.value);
                }, 500);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performEnhancedSearch(e.target.value);
                }
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.hero-search') && !e.target.closest('.search-container')) {
                    this.hideSearchSuggestions();
                }
            });
        }
    }

    static showSearchSuggestions(query) {
        const suggestionsDiv = document.getElementById('search-suggestions');
        if (!suggestionsDiv || !query.trim()) {
            this.hideSearchSuggestions();
            return;
        }

        const localResults = this.getQuickSearchSuggestions(query);
        
        if (localResults.length > 0) {
            suggestionsDiv.innerHTML = `
                <div class="suggestions-section">
                    <h4>Quick Results</h4>
                    ${localResults.map(item => `
                        <div class="suggestion-item" onclick="EnhancedSearch.selectSuggestion('${item.term}')">
                            <span class="material-icons">search</span>
                            ${this.highlightMatch(item.term, query)}
                            <span class="suggestion-type">${item.type}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="suggestions-section">
                    <div class="suggestion-item external-search" onclick="EnhancedSearch.searchOnAmazon('${query}')">
                        <span class="material-icons">shopping_cart</span>
                        Search for "${query}" on Amazon
                        <span class="material-icons">open_in_new</span>
                    </div>
                </div>
            `;
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.innerHTML = `
                <div class="suggestions-section">
                    <div class="suggestion-item external-search" onclick="EnhancedSearch.searchOnAmazon('${query}')">
                        <span class="material-icons">shopping_cart</span>
                        Search for "${query}" on Amazon
                        <span class="material-icons">open_in_new</span>
                    </div>
                    <div class="suggestion-item external-search" onclick="EnhancedSearch.searchOnGoogleBooks('${query}')">
                        <span class="material-icons">menu_book</span>
                        Search for "${query}" on Google Books
                        <span class="material-icons">open_in_new</span>
                    </div>
                </div>
            `;
            suggestionsDiv.style.display = 'block';
        }
    }

    static hideSearchSuggestions() {
        const suggestionsDiv = document.getElementById('search-suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }

    static selectSuggestion(term) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = term;
            
            // Track suggestion selection in GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'search_suggestion_click', {
                    event_category: 'Search',
                    event_label: term,
                    search_term: term
                });
            }
            
            this.performEnhancedSearch(term);
        }
        this.hideSearchSuggestions();
    }

    static getQuickSearchSuggestions(query) {
        if (!App.data.articles || !App.data.books) return [];
        
        const lowerQuery = query.toLowerCase();
        const suggestions = [];
        
        // Search in articles
        App.data.articles.slice(0, 5).forEach(article => {
            if (article.title.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    term: article.title,
                    type: 'Article'
                });
            }
        });
        
        // Search in books
        App.data.books.slice(0, 5).forEach(book => {
            if (book.title.toLowerCase().includes(lowerQuery) || 
                book.author.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    term: book.title,
                    type: 'Book'
                });
            }
        });
        
        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    static highlightMatch(text, query) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        
        if (index >= 0) {
            return text.substring(0, index) + 
                   '<strong>' + text.substring(index, index + query.length) + '</strong>' + 
                   text.substring(index + query.length);
        }
        return text;
    }

    static async performEnhancedSearch(query) {
        if (!query.trim()) {
            this.clearSearchResults();
            return;
        }

        // Track search in GA4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'search', {
                event_category: 'Search',
                event_label: query,
                search_term: query
            });
        }

        const localResults = this.searchLocalContent(query);
        const hasLocalResults = localResults.articles.length > 0 || localResults.books.length > 0;
        
        if (hasLocalResults) {
            this.displaySearchResults(localResults, query);
        } else {
            this.showExternalSearchOptions(query);
        }
    }

    static searchLocalContent(query) {
        const lowerQuery = query.toLowerCase();
        
        return {
            articles: App.data.articles.filter(article =>
                article.title.toLowerCase().includes(lowerQuery) ||
                article.content.toLowerCase().includes(lowerQuery) ||
                (article.tags && article.tags.some(tag => 
                    tag.toLowerCase().includes(lowerQuery)
                )) ||
                article.author.toLowerCase().includes(lowerQuery)
            ),
            books: App.data.books.filter(book =>
                book.title.toLowerCase().includes(lowerQuery) ||
                book.author.toLowerCase().includes(lowerQuery) ||
                book.description.toLowerCase().includes(lowerQuery) ||
                book.genre.toLowerCase().includes(lowerQuery)
            ),
            reviews: App.data.reviews.filter(review =>
                review.title.toLowerCase().includes(lowerQuery) ||
                review.content.toLowerCase().includes(lowerQuery) ||
                review.author.toLowerCase().includes(lowerQuery)
            )
        };
    }

    static displaySearchResults(results, query) {
        let resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'search-results';
            resultsContainer.className = 'search-results';
            document.querySelector('.content').prepend(resultsContainer);
        }

        const totalResults = results.articles.length + results.books.length + results.reviews.length;
        
        resultsContainer.innerHTML = `
            <div class="search-header">
                <h3>Search Results for "${query}"</h3>
                <p>Found ${totalResults} local results</p>
                <div class="external-search-option">
                    <p>Not finding what you're looking for?</p>
                    <button class="btn btn-outline" onclick="EnhancedSearch.searchOnAmazon('${query}')">
                        <span class="material-icons">search</span>
                        Search on Amazon
                    </button>
                    <button class="btn btn-outline" onclick="EnhancedSearch.searchOnGoogleBooks('${query}')">
                        <span class="material-icons">menu_book</span>
                        Search on Google Books
                    </button>
                </div>
            </div>
            ${this.renderSearchSection('Articles', results.articles, 'articles')}
            ${this.renderSearchSection('Books', results.books, 'books')}
            ${this.renderSearchSection('Reviews', results.reviews, 'reviews')}
        `;
    }

    static showExternalSearchOptions(query) {
        let resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'search-results';
            resultsContainer.className = 'search-results';
            document.querySelector('.content').prepend(resultsContainer);
        }

        resultsContainer.innerHTML = `
            <div class="search-header">
                <h3>No Local Results for "${query}"</h3>
                <p>We couldn't find any local content matching your search.</p>
            </div>
            <div class="external-search-options">
                <div class="external-search-card">
                    <div class="external-search-icon">
                        <span class="material-icons">shopping_cart</span>
                    </div>
                    <h4>Search on Amazon</h4>
                    <p>Find books and products on Amazon with our affiliate link</p>
                    <button class="btn btn-amazon" onclick="EnhancedSearch.searchOnAmazon('${query}')">
                        Search Amazon
                    </button>
                </div>
                <div class="external-search-card">
                    <div class="external-search-icon">
                        <span class="material-icons">menu_book</span>
                    </div>
                    <h4>Search on Google Books</h4>
                    <p>Find books and preview content on Google Books</p>
                    <button class="btn btn-google" onclick="EnhancedSearch.searchOnGoogleBooks('${query}')">
                        Search Google Books
                    </button>
                </div>
                <div class="external-search-card">
                    <div class="external-search-icon">
                        <span class="material-icons">library_books</span>
                    </div>
                    <h4>Search on Goodreads</h4>
                    <p>Find book reviews and recommendations</p>
                    <button class="btn btn-goodreads" onclick="EnhancedSearch.searchOnGoodreads('${query}')">
                        Search Goodreads
                    </button>
                </div>
            </div>
        `;
    }

    static searchOnAmazon(query) {
        const affiliateId = this.config.affiliateId;
        const encodedQuery = encodeURIComponent(query);
        const amazonUrl = `https://www.amazon.com/s?k=${encodedQuery}&tag=${affiliateId}`;
        
        // Track affiliate click in GA4
        this.trackAffiliateClick('amazon', query);
        
        // Small delay to ensure tracking fires
        setTimeout(() => {
            window.open(amazonUrl, '_blank');
        }, 100);
    }

    static searchOnGoogleBooks(query) {
        const encodedQuery = encodeURIComponent(query);
        const googleBooksUrl = `https://www.google.com/search?tbm=bks&q=${encodedQuery}`;
        
        // Track Google Books searches too
        this.trackAffiliateClick('google_books', query);
        
        setTimeout(() => {
            window.open(googleBooksUrl, '_blank');
        }, 100);
    }

    static searchOnGoodreads(query) {
        const encodedQuery = encodeURIComponent(query);
        const goodreadsUrl = `https://www.goodreads.com/search?q=${encodedQuery}`;
        
        this.trackAffiliateClick('goodreads', query);
        
        setTimeout(() => {
            window.open(goodreadsUrl, '_blank');
        }, 100);
    }

    static trackAffiliateClick(platform, query) {
        try {
            // Google Analytics 4 tracking
            if (typeof gtag !== 'undefined') {
                gtag('event', 'affiliate_click', {
                    event_category: 'Affiliate',
                    event_label: `${platform} - ${query}`,
                    platform: platform,
                    search_query: query,
                    affiliate_id: this.config.affiliateId,
                    value: 1,
                    currency: 'USD',
                    page_location: window.location.href,
                    page_title: document.title
                });
            }

            // Enhanced tracking with custom parameters
            if (typeof gtag !== 'undefined') {
                gtag('event', 'affiliate_click_detailed', {
                    event_category: 'Affiliate_Detailed',
                    event_label: `${platform}_search`,
                    platform: platform,
                    query: query,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    language: navigator.language,
                    screen_resolution: `${screen.width}x${screen.height}`,
                    referrer: document.referrer || 'direct'
                });
            }

            console.log(`🔗 Affiliate click tracked: ${platform} - ${query}`);

        } catch (error) {
            console.error('GA4 tracking failed:', error);
        }
    }

    static clearSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.remove();
        }
        this.hideSearchSuggestions();
    }

    static renderSearchSection(title, items, type) {
        if (items.length === 0) return '';
        
        return `
            <div class="search-section">
                <h4>${title} (${items.length})</h4>
                <div class="search-items">
                    ${items.slice(0, 3).map(item => this.renderSearchItem(item, type)).join('')}
                    ${items.length > 3 ? `
                        <div class="search-more">
                            <a href="${type}.html?search=${encodeURIComponent(query)}">View all ${items.length} ${title.toLowerCase()}</a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static renderSearchItem(item, type) {
        // Use the existing render methods from Components class
        switch(type) {
            case 'articles':
                return Components.renderArticleCard(item);
            case 'books':
                return Components.renderBookCard(item);
            case 'reviews':
                return `
                    <div class="search-item">
                        <a href="reviews.html">
                            <h5>${Security.sanitizeHTML(item.title)}</h5>
                            <p>${Security.sanitizeHTML(item.content.substring(0, 100))}...</p>
                            <small>By ${Security.sanitizeHTML(item.author)} • ${new Date(item.date).toLocaleDateString()}</small>
                        </a>
                    </div>
                `;
            default:
                return '';
        }
    }
}

// Initialize enhanced search
document.addEventListener('DOMContentLoaded', () => {
    EnhancedSearch.init();
});

// Export for global access
window.EnhancedSearch = EnhancedSearch;