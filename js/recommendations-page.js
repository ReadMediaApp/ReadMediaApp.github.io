// js/recommendations-page.js
// Recommendations Page Functionality
class RecommendationsPage {
    static init() {
        // Check if RecommendationEngine is available
        if (typeof RecommendationEngine === 'undefined') {
            console.error('RecommendationEngine is not defined. Make sure recommendation-engine.js is loaded.');
            this.showErrorState();
            return;
        }
        
        this.loadRecommendations();
        this.setupEventListeners();
        this.renderCategories();
        this.updatePageForNewUsers();
    }

    static updatePageForNewUsers() {
        // Remove user preferences section for new users
        const preferencesCard = document.querySelector('.preferences-card');
        if (preferencesCard) {
            preferencesCard.style.display = 'none';
        }

        // Update page title and description
        const pageTitle = document.querySelector('.recommendations-header h1');
        const pageSubtitle = document.querySelector('.recommendations-header .subtitle');
        
        if (pageTitle) {
            pageTitle.textContent = 'Popular Book Recommendations';
        }
        if (pageSubtitle) {
            pageSubtitle.textContent = 'Discover trending books and popular reads from our collection';
        }
    }

    static showErrorState() {
        const loadingState = document.getElementById('loading-state');
        const grid = document.getElementById('recommendations-grid');
        const emptyState = document.getElementById('empty-state');
        
        loadingState.classList.remove('active');
        grid.style.display = 'none';
        
        // Show error message in empty state
        emptyState.innerHTML = `
            <div class="empty-icon">
                <span class="material-icons">error_outline</span>
            </div>
            <h3>Recommendation Engine Not Available</h3>
            <p>The recommendation system is currently unavailable. Please try again later.</p>
            <button class="cta-btn" onclick="location.reload()">
                <span class="material-icons">refresh</span>
                Reload Page
            </button>
        `;
        emptyState.style.display = 'block';
    }

    static async loadRecommendations() {
        const loadingState = document.getElementById('loading-state');
        const grid = document.getElementById('recommendations-grid');
        const emptyState = document.getElementById('empty-state');
        
        // Show loading
        loadingState.classList.add('active');
        grid.style.display = 'none';
        emptyState.style.display = 'none';

        try {
            // Generate recommendations without user preferences
            const recommendations = await RecommendationEngine.generateRecommendations();
            
            // Hide loading
            loadingState.classList.remove('active');
            
            if (recommendations.length > 0) {
                this.renderRecommendations(recommendations);
                grid.style.display = 'grid';
                this.updateResultsInfo(recommendations.length);
            } else {
                emptyState.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error loading recommendations:', error);
            loadingState.classList.remove('active');
            emptyState.style.display = 'block';
        }
    }

    static renderRecommendations(recommendations) {
        const grid = document.getElementById('recommendations-grid');
        
        grid.innerHTML = recommendations.map(book => `
            <div class="recommendation-card-large" data-category="${book.category}" data-rating="${book.rating || '4.0'}" data-source="${book.source}">
                ${book.source === 'local' ? '<div class="source-badge local-badge">Our Library</div>' : ''}
                ${book.source === 'amazon' ? '<div class="source-badge amazon-badge">Amazon</div>' : ''}
                
                <div class="card-image">
                    <img src="${book.imageUrl}" alt="${book.title}" 
                         onerror="this.src='/images/book-placeholder.jpg'"
                         loading="lazy">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${this.truncateText(book.title, 60)}</h3>
                    <p class="card-author">by ${book.author}</p>
                    <div class="book-meta-info">
                        <span class="book-year">${book.year || 'N/A'}</span>
                        <span class="book-genre">${this.formatCategory(book.category)}</span>
                        ${book.pages ? `<span class="book-pages">${book.pages} pages</span>` : ''}
                    </div>
                    <div class="card-meta">
                        <div class="card-rating">
                            <span class="material-icons">star</span>
                            <span>${book.rating || '4.0'}</span>
                        </div>
                        <div class="book-price">${book.price || 'Price varies'}</div>
                    </div>
                    <div class="availability-badge ${this.getAvailabilityClass(book)}">
                        ${this.getAvailabilityText(book)}
                    </div>
                    <div class="card-actions">
                        ${book.source === 'local' && book.download_links && Object.keys(book.download_links).length > 0 ? `
                            <a href="/books.html#${book.id}" class="download-btn">
                                <span class="material-icons">download</span>
                                Download Free
                            </a>
                        ` : ''}
                        ${book.productUrl && book.productUrl !== '#' ? `
                            <a href="${book.productUrl}" class="amazon-btn-large" target="_blank" rel="noopener noreferrer"
                               onclick="RecommendationsPage.trackBookClick('${book.id}')">
                                <span class="material-icons">${book.source === 'local' ? 'visibility' : 'shopping_cart'}</span>
                                ${book.source === 'local' ? 'View Details' : 'View on Amazon'}
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    static getAvailabilityClass(book) {
        if (book.source === 'local' && book.download_links && Object.keys(book.download_links).length > 0) {
            return 'available';
        } else if (book.source === 'local') {
            return 'info';
        } else {
            return 'purchase';
        }
    }

    static getAvailabilityText(book) {
        if (book.source === 'local' && book.download_links && Object.keys(book.download_links).length > 0) {
            return 'Free Download';
        } else if (book.source === 'local') {
            return 'Available';
        } else {
            return 'Purchase';
        }
    }

    static formatCategory(category) {
        if (!category) return 'General';
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }


    static setupEventListeners() {
        // Keep only the essential event listeners
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterRecommendations();
            });
        }

        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.sortRecommendations();
            });
        }

        const refreshBtn = document.getElementById('refresh-recommendations');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadRecommendations();
            });
        }

        const shuffleBtn = document.getElementById('shuffle-recommendations');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                this.shuffleRecommendations();
            });
        }
    }

    static filterByCategory(category) {
        const filter = document.getElementById('category-filter');
        if (filter) {
            filter.value = category;
            this.filterRecommendations();
        }
    }

    static filterRecommendations() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;

        const filterValue = categoryFilter.value;
        const cards = document.querySelectorAll('.recommendation-card-large');
        
        let visibleCount = 0;
        
        cards.forEach(card => {
            const cardCategory = card.dataset.category;
            const shouldShow = filterValue === 'all' || cardCategory === filterValue;
            card.style.display = shouldShow ? 'block' : 'none';
            
            if (shouldShow) visibleCount++;
        });

        this.updateResultsInfo(visibleCount);
    }

    static sortRecommendations() {
        const sortBy = document.getElementById('sort-filter').value;
        const grid = document.getElementById('recommendations-grid');
        const cards = Array.from(grid.querySelectorAll('.recommendation-card-large'));

        cards.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                case 'title':
                    return a.querySelector('.card-title').textContent.localeCompare(b.querySelector('.card-title').textContent);
                case 'source':
                    const sourceA = a.dataset.source;
                    const sourceB = b.dataset.source;
                    return sourceA.localeCompare(sourceB);
                default: // relevance
                    return 0;
            }
        });

        cards.forEach(card => grid.appendChild(card));
    }

    static shuffleRecommendations() {
        const grid = document.getElementById('recommendations-grid');
        const cards = Array.from(grid.querySelectorAll('.recommendation-card-large'));
        
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            grid.appendChild(cards[j]);
        }
    }

    static updateResultsInfo(count) {
        const resultsCount = document.getElementById('results-count');
        const lastUpdated = document.getElementById('last-updated');
        
        if (resultsCount) {
            resultsCount.textContent = `${count} book${count !== 1 ? 's' : ''} found`;
        }
        
        if (lastUpdated) {
            const now = new Date();
            lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    static renderCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        
        // Get categories from both local and Amazon data
        RecommendationEngine.getAvailableCategories().then(categories => {
            const categoryData = categories.map(category => ({
                key: category,
                name: this.formatCategory(category),
                icon: this.getCategoryIcon(category),
                count: 'Various' // We don't have exact counts for mixed sources
            }));
            
            categoriesGrid.innerHTML = categoryData.map(cat => `
                <div class="category-card" onclick="RecommendationsPage.filterByCategory('${cat.key}')">
                    <span class="material-icons" style="font-size: 3rem; color: #007bff;">${cat.icon}</span>
                    <h4>${cat.name}</h4>
                    <div class="book-count">Popular Books</div>
                </div>
            `).join('');
        }).catch(error => {
            console.error('Error loading categories:', error);
            categoriesGrid.innerHTML = this.getFallbackCategories();
        });
    }

    static getCategoryIcon(category) {
        const icons = {
            'self_help': 'self_improvement',
            'programming': 'code',
            'fiction': 'menu_book',
            'business': 'business_center',
            'science_tech': 'science',
            'mystery_thriller': 'psychology',
            'biography': 'person',
            'design': 'design_services',
            'drama': 'theater_comedy'
        };
        return icons[category] || 'auto_stories';
    }

    static getFallbackCategories() {
        const fallbackCategories = [
            { name: 'Self Help', icon: 'self_improvement', key: 'self_help' },
            { name: 'Programming', icon: 'code', key: 'programming' },
            { name: 'Fiction', icon: 'menu_book', key: 'fiction' },
            { name: 'Business', icon: 'business_center', key: 'business' }
        ];

        return fallbackCategories.map(cat => `
            <div class="category-card" onclick="RecommendationsPage.filterByCategory('${cat.key}')">
                <span class="material-icons" style="font-size: 3rem; color: #007bff;">${cat.icon}</span>
                <h4>${cat.name}</h4>
                <div class="book-count">Popular Books</div>
            </div>
        `).join('');
    }

    static trackBookClick(bookId) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'book_click', {
                'book_id': bookId,
                'event_category': 'recommendations'
            });
        }
        console.log('Book clicked:', bookId);
    }

    static truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    RecommendationsPage.init();
});