// Main application logic
class App {
    static config = {
        itemsPerPage: 9,
        currentPage: 1
    };

    static data = {
        articles: [],
        books: [],
        reviews: [],
        ads: []
    };

    static async init() {
        try {
            await this.loadData();
            this.renderSidebar();
            this.renderFooter();
            this.setupEventListeners();
            
            // Page-specific initialization
            this.initPage();

            // Refresh footer with actual data after load
            this.refreshFooterWithData();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load content. Please refresh the page.');
        }
    }

    static refreshFooterWithData() {
        // Re-render footer with actual data after everything is loaded
        setTimeout(() => {
            const footer = document.getElementById('footer');
            if (footer) {
                footer.innerHTML = Components.renderFooter();
            }
        }, 100);
    }

    static showArticle(articleId) {
        // Navigate to article detail page
        window.location.href = `article.html?id=${articleId}`;
    }

    static async loadData() {
        try {
            const [articles, books, reviews, ads] = await Promise.all([
                this.fetchJSON('data/articles.json'),
                this.fetchJSON('data/books.json'),
                this.fetchJSON('data/reviews.json'),
                this.fetchJSON('data/ads.json')
            ]);
            
            this.data = {
                articles: articles || [],
                books: books || [],
                reviews: reviews || [],
                ads: ads || []
            };
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = { articles: [], books: [], reviews: [], ads: [] };
        }
    }

    static async fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static initPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        switch(page) {
            case 'index.html':
            case '':
                this.renderHomepage();
                break;
            case 'articles.html':
                this.renderArticlesPage();
                break;
            case 'books.html':
                this.renderBooksPage();
                break;
            case 'reviews.html':
                this.renderReviewsPage();
                break;
            case 'donate.html':
                // Donate page doesn't need special initialization
                break;
            default:
                // Legal pages or others
                break;
        }
    }

    static renderHomepage() {
        this.renderFeaturedArticles();
        this.renderLatestBooks();
        this.renderRecentReviews();
    }

    static renderFeaturedArticles() {
        const container = document.getElementById('featured-articles');
        if (!container) return;

        const featuredArticles = this.data.articles
            .filter(article => article.featured)
            .slice(0, 6);

        container.innerHTML = featuredArticles
            .map(article => Components.renderArticleCard(article))
            .join('');
    }

    static renderLatestBooks() {
        const container = document.getElementById('latest-books');
        if (!container) return;

        const latestBooks = this.data.books
            .slice(0, 6);

        container.innerHTML = latestBooks
            .map(book => Components.renderBookCard(book))
            .join('');
    }

    static renderRecentReviews() {
        const container = document.getElementById('recent-reviews');
        if (!container) return;

        const recentReviews = this.data.reviews
            .slice(0, 3);

        container.innerHTML = recentReviews
            .map(review => Components.renderReviewCard(review))
            .join('');
    }

    static renderArticlesPage() {
        const container = document.getElementById('all-articles');
        if (!container) return;

        const filteredArticles = this.filterArticles();
        const paginatedArticles = this.paginateData(filteredArticles);
        
        container.innerHTML = paginatedArticles
            .map(article => Components.renderArticleCard(article))
            .join('');
        
        this.renderPagination(filteredArticles.length, 'articles');
    }

    static renderBooksPage() {
        const container = document.getElementById('all-books');
        if (!container) return;

        const filteredBooks = this.filterBooks();
        const paginatedBooks = this.paginateData(filteredBooks);
        
        container.innerHTML = paginatedBooks
            .map(book => Components.renderBookCard(book))
            .join('');
        
        this.renderPagination(filteredBooks.length, 'books');
    }

    static renderReviewsPage() {
        const container = document.getElementById('all-reviews');
        if (!container) return;

        const allReviews = this.data.reviews;
        const paginatedReviews = this.paginateData(allReviews);
        
        container.innerHTML = paginatedReviews
            .map(review => Components.renderReviewCard(review))
            .join('');
        
        this.renderPagination(allReviews.length, 'reviews');
    }

    static filterArticles() {
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        let filtered = [...this.data.articles];
        
        // Category filter
        if (categoryFilter && categoryFilter.value) {
            filtered = filtered.filter(article => 
                article.tags && article.tags.includes(categoryFilter.value)
            );
        }
        
        // Sort filter
        if (sortFilter) {
            switch(sortFilter.value) {
                case 'newest':
                    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case 'oldest':
                    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                    break;
                case 'title':
                    filtered.sort((a, b) => a.title.localeCompare(b.title));
                    break;
            }
        }
        
        return filtered;
    }

    static filterBooks() {
        const genreFilter = document.getElementById('genre-filter');
        const formatFilter = document.getElementById('format-filter');
        const availabilityFilter = document.getElementById('availability-filter');
        
        let filtered = [...this.data.books];
        
        // Genre filter
        if (genreFilter && genreFilter.value) {
            filtered = filtered.filter(book => 
                book.genre === genreFilter.value
            );
        }
        
        // Format filter
        if (formatFilter && formatFilter.value) {
            filtered = filtered.filter(book => 
                book.file_formats && book.file_formats.includes(formatFilter.value)
            );
        }
        
        // Availability filter
        if (availabilityFilter && availabilityFilter.value) {
            if (availabilityFilter.value === 'free') {
                filtered = filtered.filter(book => 
                    book.download_links && Object.keys(book.download_links).length > 0
                );
            } else if (availabilityFilter.value === 'affiliate') {
                filtered = filtered.filter(book => book.affiliate_link);
            }
        }
        
        return filtered;
    }

    static paginateData(data) {
        const start = (this.config.currentPage - 1) * this.config.itemsPerPage;
        const end = start + this.config.itemsPerPage;
        return data.slice(start, end);
    }

    static renderPagination(totalItems, type) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.config.itemsPerPage);
        container.innerHTML = Components.renderPagination(
            this.config.currentPage,
            totalPages,
            this.config.itemsPerPage,
            totalItems
        );
    }

    static goToPage(page) {
        this.config.currentPage = page;
        this.initPage();
        window.scrollTo(0, 0);
    }

    static renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        sidebar.innerHTML = Components.renderSidebar(
            this.data.articles,
            this.data.books,
            this.data.ads
        );
    }

    static renderFooter() {
        const footer = document.getElementById('footer');
        if (!footer) return;

        footer.innerHTML = Components.renderFooter();
    }

    static setupEventListeners() {
        // Mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isVisible = navMenu.style.display === 'flex';
                navMenu.style.display = isVisible ? 'none' : 'flex';
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu && navToggle && !navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.style.display = 'none';
            }
        });

        // Filter change listeners
        const articleFilters = ['category-filter', 'sort-filter'];
        const bookFilters = ['genre-filter', 'format-filter', 'availability-filter'];
        
        articleFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.config.currentPage = 1;
                    this.renderArticlesPage();
                });
            }
        });
        
        bookFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.config.currentPage = 1;
                    this.renderBooksPage();
                });
            }
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }

    static handleSearch(query) {
        if (!query.trim()) {
            this.renderHomepage();
            return;
        }
        
        // Simple search implementation
        const results = {
            articles: this.data.articles.filter(article => 
                article.title.toLowerCase().includes(query.toLowerCase()) ||
                article.content.toLowerCase().includes(query.toLowerCase()) ||
                article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            ),
            books: this.data.books.filter(book =>
                book.title.toLowerCase().includes(query.toLowerCase()) ||
                book.author.toLowerCase().includes(query.toLowerCase()) ||
                book.description.toLowerCase().includes(query.toLowerCase())
            )
        };
        
        this.renderSearchResults(results, query);
    }

    static renderSearchResults(results, query) {
        // This would be implemented based on your search UI requirements
        console.log('Search results:', results, query);
    }

    static showArticle(articleId) {
        // For a static site, you might want to create individual article pages
        // or show articles in a modal. This is a placeholder implementation.
        const article = this.data.articles.find(a => a.id === articleId);
        if (article) {
            alert(`Showing article: ${article.title}\n\nThis would open in a full article view.`);
            // In a real implementation, you might:
            // 1. Navigate to article.html?id=articleId
            // 2. Show a modal with the full article
            // 3. Use a SPA approach with history API
        }
    }

    static showError(message) {
        // Simple error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Get dynamic categories from articles
    static getArticleCategories() {
        if (!this.data.articles || this.data.articles.length === 0) {
            return [];
        }
        
        const categories = new Set();
        this.data.articles.forEach(article => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach(tag => {
                    if (tag && typeof tag === 'string') {
                        categories.add(tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
                    }
                });
            }
        });
        return Array.from(categories).sort();
    }

    // Get dynamic genres from books
    static getBookGenres() {
        if (!this.data.books || this.data.books.length === 0) {
            return [];
        }
        
        const genres = new Set();
        this.data.books.forEach(book => {
            if (book.genre && typeof book.genre === 'string') {
                genres.add(book.genre.charAt(0).toUpperCase() + book.genre.slice(1).toLowerCase());
            }
        });
        return Array.from(genres).sort();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init());

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    App.config.currentPage = 1;
    App.initPage();
});