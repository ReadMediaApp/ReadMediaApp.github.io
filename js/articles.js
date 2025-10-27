// articles.js - Complete functionality for articles page
class ArticlesPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilters = {
            category: 'all',
            sort: 'newest',
            search: ''
        };
        
        this.init();
    }

    async init() {
        await this.waitForAppData();
        this.setupEventListeners();
        this.renderArticles();
        this.toggleScrollTopButton(); // Initial check
    }

    async waitForAppData() {
        // Wait for main app to load data
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

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('articles-search');
        if (searchInput) {
            // Add search button click
            document.querySelector('.search-btn')?.addEventListener('click', () => {
                this.currentFilters.search = searchInput.value;
                this.currentPage = 1;
                this.renderArticles();
            });

            // Add Enter key support
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.currentFilters.search = searchInput.value;
                    this.currentPage = 1;
                    this.renderArticles();
                }
            });

            // Real-time search with debounce
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.currentPage = 1;
                    this.renderArticles();
                }, 300);
            });
        }

        // Filter changes
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.currentPage = 1;
            this.renderArticles();
            this.updateActiveFilters();
        });

        document.getElementById('sort-filter')?.addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.currentPage = 1;
            this.renderArticles();
        });

        // Reset filters
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Newsletter form
        document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsletterSignup(e.target);
        });

        // Scroll to top button
        document.querySelector('.scroll-top')?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Show/hide scroll to top button based on scroll position
        window.addEventListener('scroll', this.toggleScrollTopButton.bind(this));
    }

    toggleScrollTopButton() {
        const scrollTopBtn = document.querySelector('.scroll-top');
        if (scrollTopBtn) {
            if (window.scrollY > 300) {
                scrollTopBtn.style.display = 'flex';
            } else {
                scrollTopBtn.style.display = 'none';
            }
        }
    }

    getFilteredArticles() {
        let articles = [...(window.readMediaApp.appData.articles || [])];

        // Apply search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            articles = articles.filter(article => 
                article.title.toLowerCase().includes(searchTerm) ||
                article.excerpt.toLowerCase().includes(searchTerm) ||
                article.author.toLowerCase().includes(searchTerm) ||
                (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                (article.content && article.content.toLowerCase().includes(searchTerm))
            );
        }

        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            articles = articles.filter(article => 
                article.category === this.currentFilters.category
            );
        }

        // Apply sorting
        switch (this.currentFilters.sort) {
            case 'newest':
                articles.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                articles.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'title':
                articles.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'popular':
                // Assuming we have view counts in the future
                articles.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
        }

        return articles;
    }

    renderArticles() {
        const container = document.getElementById('articles-grid');
        const loadingElement = document.getElementById('articles-loading');
        const emptyElement = document.getElementById('articles-empty');
        
        if (!container) return;

        const filteredArticles = this.getFilteredArticles();
        const totalArticles = filteredArticles.length;
        
        // Show/hide loading and empty states
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (emptyElement) {
            emptyElement.style.display = totalArticles === 0 ? 'block' : 'none';
        }

        // Update results count
        const countElement = document.getElementById('articles-count');
        if (countElement) {
            countElement.textContent = `${totalArticles} article${totalArticles !== 1 ? 's' : ''} found`;
        }

        // Update active filters display
        this.updateActiveFilters();

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

        // Render articles
        if (paginatedArticles.length === 0 && totalArticles > 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13V9M12 17H12.01M7.2 21H16.8C17.9201 21 18.4802 21 18.908 20.782C19.2843 20.5903 19.5903 20.2843 19.782 19.908C20 19.4802 20 18.9201 20 17.8V6.2C20 5.0799 20 4.51984 19.782 4.09202C19.5903 3.71569 19.2843 3.40973 18.908 3.21799C18.4802 3 17.9201 3 16.8 3H7.2C6.0799 3 5.51984 3 5.09202 3.21799C4.71569 3.40973 4.40973 3.71569 4.21799 4.09202C4 4.51984 4 5.07989 4 6.2V17.8C4 18.9201 4 19.4802 4.21799 19.908C4.40973 20.2843 4.71569 20.5903 5.09202 20.782C5.51984 21 6.07989 21 7.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>No articles on this page</h3>
                    <p>Try navigating to a different page.</p>
                    <button class="btn btn-primary" onclick="articlesPage.currentPage = 1; articlesPage.renderArticles();">Go to First Page</button>
                </div>
            `;
        } else {
            container.innerHTML = paginatedArticles.map(article => `
                <article class="card" data-id="${article.id}">
                    ${article.image ? `
                        <div class="card-image-container">
                            <img src="${article.image}" alt="${article.title}" class="card-image" loading="lazy">
                            ${article.featured ? `<span class="featured-badge">Featured</span>` : ''}
                        </div>
                    ` : `
                        <div class="card-image-placeholder">
                            <span class="placeholder-icon">📚</span>
                        </div>
                    `}
                    <div class="card-content">
                        <h3 class="card-title">
                            <a href="article.html?id=${article.id}" aria-label="Read article: ${article.title}">${this.escapeHtml(article.title)}</a>
                        </h3>
                        <div class="card-meta">
                            <span class="author">By ${this.escapeHtml(article.author)}</span>
                            <span class="meta-separator">•</span>
                            <time datetime="${article.date}" class="publish-date">${this.formatDate(article.date)}</time>
                            ${article.category ? `<span class="meta-separator">•</span><span class="category">${this.formatCategory(article.category)}</span>` : ''}
                        </div>
                        <p class="card-excerpt">${this.escapeHtml(article.excerpt || 'Discover insights and analysis in this engaging article.')}</p>
                        ${article.tags && article.tags.length > 0 ? `
                            <div class="article-tags">
                                ${article.tags.slice(0, 3).map(tag => `
                                    <span class="tag">${this.escapeHtml(tag)}</span>
                                `).join('')}
                                ${article.tags.length > 3 ? `<span class="tag-more">+${article.tags.length - 3} more</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-footer">
                        <span class="read-time">${article.read_time || '4 min read'}</span>
                        <a href="article.html?id=${article.id}" class="btn btn-secondary" aria-label="Read more about ${article.title}">Read More</a>
                    </div>
                </article>
            `).join('');
        }

        // Render pagination
        this.renderPagination(totalArticles);
    }

    renderPagination(totalItems) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn pagination-prev" data-page="${this.currentPage - 1}" aria-label="Previous page">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="pagination-text">Previous</span>
                </button>
            `;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)
            ) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            data-page="${i}" 
                            aria-label="Page ${i}"
                            ${i === this.currentPage ? 'aria-current="page"' : ''}>
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn pagination-next" data-page="${this.currentPage + 1}" aria-label="Next page">
                    <span class="pagination-text">Next</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            `;
        }

        container.innerHTML = paginationHTML;

        // Add event listeners to pagination buttons
        container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = parseInt(btn.dataset.page);
                this.renderArticles();
                // Scroll to top of articles section
                document.getElementById('articles-grid')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    updateActiveFilters() {
        const activeFiltersContainer = document.getElementById('active-filters');
        if (!activeFiltersContainer) return;

        const activeFilters = [];
        
        if (this.currentFilters.search) {
            activeFilters.push(`Search: "${this.currentFilters.search}"`);
        }
        
        if (this.currentFilters.category !== 'all') {
            activeFilters.push(`Category: ${this.formatCategory(this.currentFilters.category)}`);
        }

        if (activeFilters.length > 0) {
            activeFiltersContainer.innerHTML = activeFilters.map(filter => 
                `<span class="filter-tag">${filter}</span>`
            ).join('');
        } else {
            activeFiltersContainer.innerHTML = '';
        }
    }

    resetFilters() {
        this.currentFilters = {
            category: 'all',
            sort: 'newest',
            search: ''
        };
        
        // Reset form elements
        const searchInput = document.getElementById('articles-search');
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'newest';
        
        this.currentPage = 1;
        this.renderArticles();
        this.showNotification('Filters reset successfully', 'success');
    }

    async handleNewsletterSignup(form) {
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        // Simple validation
        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;

        try {
            // Simulate API call - replace with actual API endpoint
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // In a real implementation, you would send this to your backend
            console.log('Newsletter signup:', email);
            
            this.showNotification('🎉 Thanks for subscribing to our newsletter!', 'success');
            form.reset();
            
            // Track newsletter signup (optional)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'newsletter_signup', {
                    'event_category': 'engagement',
                    'event_label': 'articles_page'
                });
            }
        } catch (error) {
            this.showNotification('❌ Failed to subscribe. Please try again.', 'error');
        } finally {
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Utility methods
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Show "X days ago" for recent articles
            if (diffDays <= 7) {
                if (diffDays === 1) return 'Yesterday';
                if (diffDays === 0) return 'Today';
                return `${diffDays} days ago`;
            }
            
            // Show full date for older articles
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown date';
        }
    }

    formatCategory(category) {
        const categoryMap = {
            'literature': 'Literature',
            'review': 'Book Review',
            'news': 'Literary News',
            'analysis': 'Literary Analysis',
            'interviews': 'Author Interviews',
            'guides': 'Reading Guides'
        };
        
        return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" aria-label="Close notification">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        const autoRemove = setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.remove();
        });

        // Add enter/exit animations
        notification.style.animation = 'slideInRight 0.3s ease';
    }
}

// Initialize when DOM is loaded
let articlesPage;
document.addEventListener('DOMContentLoaded', () => {
    articlesPage = new ArticlesPage();
});

// Make articlesPage globally available for debugging
window.articlesPage = articlesPage;