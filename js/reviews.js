// reviews.js - Enhanced version
class ReviewsPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.currentFilters = {
            rating: 'all',
            genre: 'all',
            sort: 'newest'
        };
        this.currentSearchTerm = '';
        
        this.init();
    }

    async init() {
        await this.waitForAppData();
        this.setupEventListeners();
        this.updateStats();
        this.renderFeaturedReviews();
        this.renderAllReviews();
        this.updateStructuredData();
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

    setupEventListeners() {
        // Search functionality
        this.setupSearch();
        
        // Filter changes
        document.getElementById('rating-filter')?.addEventListener('change', (e) => {
            this.currentFilters.rating = e.target.value;
            this.currentPage = 1;
            this.renderAllReviews();
        });

        document.getElementById('genre-filter')?.addEventListener('change', (e) => {
            this.currentFilters.genre = e.target.value;
            this.currentPage = 1;
            this.renderAllReviews();
        });

        document.getElementById('sort-filter')?.addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.renderAllReviews();
        });

        // Reset filters
        document.getElementById('reset-review-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        document.getElementById('reset-all-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Newsletter form
        document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsletterSubmit(e);
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('reviews-search');
        const clearButton = document.getElementById('clear-search');
        
        if (searchInput && clearButton) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value.trim();
                clearButton.style.display = this.currentSearchTerm ? 'block' : 'none';
                this.currentPage = 1;
                this.renderAllReviews();
            });
            
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                this.currentSearchTerm = '';
                clearButton.style.display = 'none';
                this.currentPage = 1;
                this.renderAllReviews();
            });
        }
    }

    updateStats() {
        const reviews = window.readMediaApp.appData.reviews || [];
        const totalReviews = reviews.length;
        
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;
        
        // Count unique reviewers
        const reviewers = new Set(reviews.map(review => review.author));
        
        // Count genres covered
        const genres = new Set();
        reviews.forEach(review => {
            if (review.genre) {
                genres.add(review.genre);
            }
            // Also check book data for genre
            if (review.book_id) {
                const book = this.getBookById(review.book_id);
                if (book && book.genre) {
                    genres.add(book.genre);
                }
            }
        });

        document.getElementById('total-reviews').textContent = `${totalReviews}+`;
        document.getElementById('avg-rating').textContent = avgRating;
        document.getElementById('reviewers-count').textContent = `${reviewers.size}+`;
        document.getElementById('genres-covered').textContent = `${genres.size}+`;
    }

    renderFeaturedReviews() {
        const container = document.getElementById('featured-reviews-grid');
        if (!container) return;

        const reviews = window.readMediaApp.appData.reviews || [];
        const featuredReviews = reviews
            .filter(review => review.featured)
            .slice(0, 3);

        if (featuredReviews.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = featuredReviews.map(review => {
            const book = this.getBookById(review.book_id);
            const bookInfo = book ? `<div class="review-book">Review of "${book.title}" by ${book.author}</div>` : '';
            
            return `
                <div class="featured-review-card" data-id="${review.id}" itemscope itemtype="https://schema.org/Review">
                    <div class="review-header">
                        <div class="rating featured-rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
                            <meta itemprop="worstRating" content="1">
                            <span itemprop="ratingValue">${review.rating}</span>/
                            <span itemprop="bestRating">5</span>
                            ${this.renderStars(review.rating)}
                        </div>
                        <h3 class="review-title" itemprop="name">
                            <a href="review.html?id=${review.id}">${this.escapeHtml(review.title)}</a>
                        </h3>
                        ${bookInfo}
                    </div>
                    <div class="review-excerpt" itemprop="reviewBody">
                        ${this.truncateText(review.content, 200)}
                    </div>
                    <div class="review-footer">
                        <div class="review-meta">
                            <span class="review-author" itemprop="author">By ${this.escapeHtml(review.author)}</span>
                            <span>•</span>
                            <time datetime="${review.date}" itemprop="datePublished">${this.formatDate(review.date)}</time>
                        </div>
                        <a href="review.html?id=${review.id}" class="btn btn-primary" itemprop="url">
                            Read Full Review
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAllReviews() {
        const container = document.getElementById('reviews-grid');
        const loadingElement = document.getElementById('reviews-loading');
        const emptyElement = document.getElementById('reviews-empty');
        
        if (!container) return;

        const filteredReviews = this.getFilteredReviews();
        const totalReviews = filteredReviews.length;
        
        // Show/hide loading and empty states
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (emptyElement) {
            emptyElement.style.display = totalReviews === 0 ? 'block' : 'none';
        }

        // Update results count
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `${totalReviews} review${totalReviews !== 1 ? 's' : ''} found`;
        }

        // Update active filters display
        this.updateActiveFilters();

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

        // Render reviews
        container.innerHTML = paginatedReviews.map(review => {
            const book = this.getBookById(review.book_id);
            const bookTags = book && book.tags ? book.tags.slice(0, 2) : [];
            const genre = review.genre || (book ? book.genre : '');
            
            return `
                <div class="card review-card" data-id="${review.id}" itemscope itemtype="https://schema.org/Review">
                    <div class="card-content">
                        <div class="rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
                            <meta itemprop="worstRating" content="1">
                            <span itemprop="ratingValue">${review.rating}</span>/
                            <span itemprop="bestRating">5</span>
                            ${this.renderStars(review.rating)}
                            <span class="rating-value">${review.rating}/5</span>
                        </div>
                        <h3 class="card-title" itemprop="name">
                            <a href="review.html?id=${review.id}">${this.escapeHtml(review.title)}</a>
                        </h3>
                        <div class="card-meta">
                            <span itemprop="author">By ${this.escapeHtml(review.author)}</span>
                            <span>•</span>
                            <time datetime="${review.date}" itemprop="datePublished">${this.formatDate(review.date)}</time>
                        </div>
                        <p class="card-excerpt" itemprop="reviewBody">${this.truncateText(review.content, 150)}</p>
                        ${genre || bookTags.length > 0 ? `
                            <div class="review-tags">
                                ${genre ? `<span class="review-tag">${genre}</span>` : ''}
                                ${bookTags.map(tag => `<span class="review-tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-footer">
                        <a href="review.html?id=${review.id}" class="btn btn-primary">Read Review</a>
                        ${this.getBookLink(review)}
                    </div>
                </div>
            `;
        }).join('');

        // Render pagination
        this.renderPagination(totalReviews);
        
        // Update structured data
        this.updateStructuredData(paginatedReviews);
    }

    getFilteredReviews() {
        let reviews = [...(window.readMediaApp.appData.reviews || [])];

        // Apply search filter
        if (this.currentSearchTerm) {
            const searchTerm = this.currentSearchTerm.toLowerCase();
            reviews = reviews.filter(review => 
                review.title?.toLowerCase().includes(searchTerm) ||
                review.author?.toLowerCase().includes(searchTerm) ||
                review.content?.toLowerCase().includes(searchTerm) ||
                this.doesBookMatchSearch(review.book_id, searchTerm)
            );
        }

        // Apply rating filter
        if (this.currentFilters.rating !== 'all') {
            const minRating = parseInt(this.currentFilters.rating);
            reviews = reviews.filter(review => review.rating >= minRating);
        }

        // Apply genre filter
        if (this.currentFilters.genre !== 'all') {
            reviews = reviews.filter(review => {
                // Check review genre
                if (review.genre && review.genre.toLowerCase() === this.currentFilters.genre.toLowerCase()) {
                    return true;
                }
                
                // Check book genre
                const book = this.getBookById(review.book_id);
                return book && book.genre && book.genre.toLowerCase() === this.currentFilters.genre.toLowerCase();
            });
        }

        // Apply sorting
        switch (this.currentFilters.sort) {
            case 'newest':
                reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                reviews.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'rating':
                reviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'popular':
                // Sort by featured first, then by rating
                reviews.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return (b.rating || 0) - (a.rating || 0);
                });
                break;
            case 'title':
                reviews.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        return reviews;
    }

    doesBookMatchSearch(bookId, searchTerm) {
        if (!bookId) return false;
        
        const book = this.getBookById(bookId);
        if (!book) return false;
        
        return book.title?.toLowerCase().includes(searchTerm) ||
               book.author?.toLowerCase().includes(searchTerm) ||
               (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
    }

    getBookById(bookId) {
        if (!bookId) return null;
        
        const books = window.readMediaApp.appData.books || [];
        return books.find(book => book.id === bookId);
    }

    getBookLink(review) {
        if (!review.book_id) return '';
        
        const book = this.getBookById(review.book_id);
        
        if (book) {
            return `<a href="book.html?id=${book.id}" class="btn btn-secondary btn-sm">View Book</a>`;
        }
        
        return '';
    }

    updateActiveFilters() {
        const container = document.getElementById('active-filters');
        if (!container) return;

        const activeFilters = [];
        
        if (this.currentFilters.rating !== 'all') {
            activeFilters.push(`Rating: ${this.currentFilters.rating}+ stars`);
        }
        
        if (this.currentFilters.genre !== 'all') {
            activeFilters.push(`Genre: ${this.capitalizeFirst(this.currentFilters.genre)}`);
        }
        
        if (this.currentSearchTerm) {
            activeFilters.push(`Search: "${this.currentSearchTerm}"`);
        }

        container.innerHTML = activeFilters.map(filter => 
            `<span class="filter-tag">${filter}</span>`
        ).join('');
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
                <button class="pagination-btn" data-page="${this.currentPage - 1}" aria-label="Previous page">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            `;
        }

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        data-page="${i}" 
                        aria-label="Page ${i}"
                        ${i === this.currentPage ? 'aria-current="page"' : ''}>
                    ${i}
                </button>
            `;
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" data-page="${this.currentPage + 1}" aria-label="Next page">
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
                this.renderAllReviews();
                
                // Scroll to top of reviews section
                document.getElementById('reviews-grid')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    resetFilters() {
        this.currentFilters = {
            rating: 'all',
            genre: 'all',
            sort: 'newest'
        };
        
        this.currentSearchTerm = '';
        
        // Reset form elements
        document.getElementById('rating-filter').value = 'all';
        document.getElementById('genre-filter').value = 'all';
        document.getElementById('sort-filter').value = 'newest';
        
        const searchInput = document.getElementById('reviews-search');
        const clearButton = document.getElementById('clear-search');
        if (searchInput) searchInput.value = '';
        if (clearButton) clearButton.style.display = 'none';
        
        this.currentPage = 1;
        this.renderAllReviews();
    }

    handleNewsletterSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        
        // Simulate newsletter signup
        this.showToast('Thank you for subscribing to our book reviews newsletter!', 'success');
        form.reset();
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        // Add styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '1001',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    updateStructuredData(reviews = []) {
        const currentReviews = reviews.length > 0 ? reviews : this.getFilteredReviews().slice(0, 6);
        
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Professional Book Reviews | ReadMedia",
            "description": "Collection of professional book reviews, literary analysis, and expert ratings",
            "url": window.location.href,
            "publisher": {
                "@type": "Organization",
                "name": "ReadMedia",
                "url": window.location.origin
            },
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": currentReviews.length,
                "itemListOrder": "Descending",
                "itemListElement": currentReviews.map((review, index) => {
                    const book = this.getBookById(review.book_id);
                    
                    return {
                        "@type": "ListItem",
                        "position": index + 1,
                        "item": {
                            "@type": "Review",
                            "name": review.title,
                            "author": {
                                "@type": "Person",
                                "name": review.author
                            },
                            "datePublished": review.date,
                            "reviewBody": this.truncateText(review.content, 200),
                            "reviewRating": {
                                "@type": "Rating",
                                "ratingValue": review.rating,
                                "bestRating": "5"
                            },
                            "itemReviewed": book ? {
                                "@type": "Book",
                                "name": book.title,
                                "author": {
                                    "@type": "Person",
                                    "name": book.author
                                }
                            } : {
                                "@type": "Book"
                            }
                        }
                    };
                })
            }
        };

        // Remove existing structured data
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => {
            if (script.textContent.includes('CollectionPage')) {
                script.remove();
            }
        });

        // Add new structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    // Utility methods
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text) return 'No review content available.';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '½' : '') + 
               '☆'.repeat(emptyStars);
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReviewsPage();
});