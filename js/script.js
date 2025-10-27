// script.js
class ReadMediaApp {
    constructor() {
        this.cacheName = 'readmedia-v1';
        this.apiEndpoints = {
            articles: 'data/articles.json',
            books: 'data/books.json',
            reviews: 'data/reviews.json',
            recommendations: 'data/amazon-recommendations.json',
            ads: 'data/ads.json'
        };
        
        this.init();
    }

    async init() {
        try {
            // Initialize app
            await this.loadCachedData();
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.checkOnlineStatus();
        } catch (error) {
            console.error('App initialization failed:', error);
        }
    }

    // Data Management
    async loadCachedData() {
        try {
            // Try to get data from cache first
            let data = await this.getCachedData();
            
            if (!data) {
                // If no cache, fetch fresh data
                data = await this.fetchAllData();
                await this.cacheData(data);
            }
            
            this.appData = data;
            this.updateUIWithData();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load content. Please check your connection.');
        }
    }

    async fetchAllData() {
        const requests = Object.entries(this.apiEndpoints).map(async ([key, url]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const jsonData = await response.json();
                return { [key]: jsonData };
            } catch (error) {
                console.warn(`Failed to fetch ${key}:`, error);
                return { [key]: [] };
            }
        });

        const results = await Promise.all(requests);
        return Object.assign({}, ...results);
    }

    async cacheData(data) {
        try {
            // Cache in localStorage for immediate access
            localStorage.setItem('readmedia_data', JSON.stringify(data));
            localStorage.setItem('readmedia_cache_time', Date.now().toString());
            
            // Cache in CacheStorage for offline use
            if ('caches' in window) {
                const cache = await caches.open(this.cacheName);
                const cachePromises = Object.entries(this.apiEndpoints).map(async ([key, url]) => {
                    try {
                        const response = new Response(JSON.stringify(data[key] || []), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        await cache.put(url, response);
                    } catch (error) {
                        console.warn(`Failed to cache ${key}:`, error);
                    }
                });
                await Promise.all(cachePromises);
            }
        } catch (error) {
            console.warn('Caching failed:', error);
        }
    }

    async getCachedData() {
        try {
            // Check if cache is fresh (less than 1 hour old)
            const cacheTime = localStorage.getItem('readmedia_cache_time');
            if (cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
                const cached = localStorage.getItem('readmedia_data');
                if (cached) return JSON.parse(cached);
            }
            
            // Try CacheStorage as fallback
            if ('caches' in window) {
                const cache = await caches.open(this.cacheName);
                const data = {};
                
                for (const [key, url] of Object.entries(this.apiEndpoints)) {
                    try {
                        const response = await cache.match(url);
                        if (response) {
                            data[key] = await response.json();
                        }
                    } catch (error) {
                        console.warn(`Failed to get cached ${key}:`, error);
                    }
                }
                
                if (Object.keys(data).length > 0) {
                    await this.cacheData(data); // Refresh localStorage
                    return data;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('Cache retrieval failed:', error);
            return null;
        }
    }

    // UI Rendering
    updateUIWithData() {
        this.updateStats();
        this.renderFeaturedContent();
    }

    updateStats() {
        const stats = {
            'books-count': this.appData.books?.length || 0,
            'articles-count': this.appData.articles?.length || 0,
            'reviews-count': this.appData.reviews?.length || 0
        };

        Object.entries(stats).forEach(([id, count]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count === 0 ? 'Loading...' : `${count}+`;
            }
        });
    }

    renderFeaturedContent() {
        this.renderFeaturedArticles();
        this.renderLatestBooks();
        this.renderRecentReviews();
    }

    renderFeaturedArticles() {
        const container = document.getElementById('featured-articles-grid');
        if (!container || !this.appData.articles) return;

        const featuredArticles = (this.appData.articles || [])
            .filter(article => article.featured)
            .slice(0, 6);

        if (featuredArticles.length === 0) {
            container.innerHTML = '<p class="no-content">No featured articles available.</p>';
            return;
        }

        container.innerHTML = featuredArticles.map(article => `
            <article class="card" data-id="${article.id}">
                ${article.image ? `
                    <img src="${article.image}" alt="${article.title}" class="card-image" loading="lazy">
                ` : ''}
                <div class="card-content">
                    <h3 class="card-title">
                        <a href="article.html?id=${article.id}">${this.escapeHtml(article.title)}</a>
                    </h3>
                    <div class="card-meta">
                        <span>By ${this.escapeHtml(article.author)}</span>
                        <span>•</span>
                        <time datetime="${article.date}">${this.formatDate(article.date)}</time>
                    </div>
                    <p class="card-excerpt">${this.escapeHtml(article.excerpt)}</p>
                </div>
                <div class="card-footer">
                    <span class="read-time">${article.read_time || '4 min read'}</span>
                    <a href="article.html?id=${article.id}" class="btn btn-secondary">Read More</a>
                </div>
            </article>
        `).join('');
    }

    renderLatestBooks() {
        const container = document.getElementById('latest-books-grid');
        if (!container || !this.appData.books) return;

        const latestBooks = (this.appData.books || [])
            .filter(book => book.featured)
            .slice(0, 8);

        if (latestBooks.length === 0) {
            container.innerHTML = '<p class="no-content">No books available.</p>';
            return;
        }

        container.innerHTML = latestBooks.map(book => `
            <div class="card" data-id="${book.id}">
                ${book.cover ? `
                    <img src="${book.cover}" alt="${book.title}" class="card-image" loading="lazy">
                ` : `
                    <div class="card-image" style="background: var(--surface-alt); display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 3rem;">📚</span>
                    </div>
                `}
                <div class="card-content">
                    <h3 class="card-title">
                        <a href="book.html?id=${book.id}">${this.escapeHtml(book.title)}</a>
                    </h3>
                    <div class="card-meta">
                        <span>By ${this.escapeHtml(book.author)}</span>
                        ${book.year ? `<span>•</span><span>${book.year}</span>` : ''}
                    </div>
                    <p class="card-excerpt">${this.truncateText(book.description, 120)}</p>
                </div>
                <div class="card-footer">
                    <span class="genre">${book.genre}</span>
                    <a href="book.html?id=${book.id}" class="btn btn-secondary">View Details</a>
                </div>
            </div>
        `).join('');
    }

    renderRecentReviews() {
        const container = document.getElementById('recent-reviews-grid');
        if (!container || !this.appData.reviews) return;

        const recentReviews = (this.appData.reviews || [])
            .filter(review => review.featured)
            .slice(0, 4);

        if (recentReviews.length === 0) {
            container.innerHTML = '<p class="no-content">No reviews available.</p>';
            return;
        }

        container.innerHTML = recentReviews.map(review => `
            <div class="card" data-id="${review.id}">
                <div class="card-content">
                    <div class="rating">
                        ${this.renderStars(review.rating)}
                    </div>
                    <h3 class="card-title">
                        <a href="review.html?id=${review.id}">${this.escapeHtml(review.title)}</a>
                    </h3>
                    <div class="card-meta">
                        <span>By ${this.escapeHtml(review.author)}</span>
                        <span>•</span>
                        <time datetime="${review.date}">${this.formatDate(review.date)}</time>
                    </div>
                    <p class="card-excerpt">${this.truncateText(review.content, 150)}</p>
                </div>
                <div class="card-footer">
                    <a href="review.html?id=${review.id}" class="btn btn-primary">Read Review</a>
                </div>
            </div>
        `).join('');
    }

    // Utility Methods
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

    renderStars(rating) {
        if (!rating) return '☆☆☆☆☆';
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '½' : '') + 
               '☆'.repeat(emptyStars);
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Search functionality
        const searchForm = document.querySelector('.hero-search form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('search-input');
                if (input && input.value.trim()) {
                    this.performSearch(input.value.trim());
                }
            });
        }

        // Scroll to top
        const scrollTopBtn = document.querySelector('.scroll-top');
        if (scrollTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.classList.add('visible');
                } else {
                    scrollTopBtn.classList.remove('visible');
                }
            });

            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Online/offline status
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    // Performance Optimization
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    }

    // Search functionality
    performSearch(query) {
        // Store search query for results page
        sessionStorage.setItem('searchQuery', query);
        // Redirect to search page
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }

    // Online/Offline handling
    checkOnlineStatus() {
        this.handleOnlineStatus(navigator.onLine);
    }

    handleOnlineStatus(online) {
        const indicator = document.getElementById('online-status');
        if (indicator) {
            indicator.textContent = online ? 'Online' : 'Offline';
            indicator.className = online ? 'online' : 'offline';
        }

        if (online) {
            // Refresh data when coming back online
            this.refreshData();
        }
    }

    async refreshData() {
        try {
            const freshData = await this.fetchAllData();
            await this.cacheData(freshData);
            this.appData = freshData;
            this.updateUIWithData();
        } catch (error) {
            console.warn('Data refresh failed:', error);
        }
    }

    // Error handling
    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span>⚠️ ${message}</span>
                <button class="error-close">×</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error);
            color: white;
            padding: var(--space-md);
            border-radius: var(--radius-md);
            z-index: 10000;
            max-width: 300px;
            box-shadow: var(--shadow-lg);
        `;
        
        document.body.appendChild(errorDiv);
        
        // Close button
        errorDiv.querySelector('.error-close').addEventListener('click', () => {
            errorDiv.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.readMediaApp = new ReadMediaApp();
});

// Service Worker messaging
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('Cache updated, refreshing data...');
            // Trigger data refresh if needed
            if (window.readMediaApp) {
                window.readMediaApp.refreshData();
            }
        }
    });
}