// Enhanced search functionality
class Search {
    static init() {
        this.setupSearchListeners();
    }

    static setupSearchListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
    }

    static performSearch(query) {
        if (!query.trim()) {
            this.clearSearchResults();
            return;
        }

        const results = this.searchContent(query);
        this.displaySearchResults(results, query);
    }

    static searchContent(query) {
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
        // Create or update search results container
        let resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'search-results';
            resultsContainer.className = 'search-results';
            document.querySelector('.content').prepend(resultsContainer);
        }

        const totalResults = results.articles.length + results.books.length + results.reviews.length;
        
        if (totalResults === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <h3>No results found for "${query}"</h3>
                    <p>Try different keywords or browse our categories</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = `
            <div class="search-header">
                <h3>Search Results for "${query}"</h3>
                <p>Found ${totalResults} results</p>
            </div>
            ${this.renderSearchSection('Articles', results.articles, 'articles')}
            ${this.renderSearchSection('Books', results.books, 'books')}
            ${this.renderSearchSection('Reviews', results.reviews, 'reviews')}
        `;
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
        switch(type) {
            case 'articles':
                return `
                    <div class="search-item">
                        <a href="#" onclick="App.showArticle('${item.id}')">
                            <h5>${Security.sanitizeHTML(item.title)}</h5>
                            <p>${Security.sanitizeHTML(item.excerpt || item.content.substring(0, 100))}...</p>
                            <small>By ${Security.sanitizeHTML(item.author)} • ${new Date(item.date).toLocaleDateString()}</small>
                        </a>
                    </div>
                `;
            case 'books':
                return `
                    <div class="search-item">
                        <a href="#" onclick="BookManager.showBookInfo('${item.id}')">
                            <h5>${Security.sanitizeHTML(item.title)}</h5>
                            <p>By ${Security.sanitizeHTML(item.author)} • ${item.year}</p>
                            <p>${Security.sanitizeHTML(item.description.substring(0, 100))}...</p>
                        </a>
                    </div>
                `;
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

    static clearSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.remove();
        }
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => Search.init());