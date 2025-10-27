// recommendations.js - Enhanced version
class RecommendationsPage {
    constructor() {
        this.currentFilters = {
            category: 'all',
            sort: 'relevance'
        };
        this.userPreferences = this.loadUserPreferences();
        this.recommendationsData = null;
        
        this.init();
    }

    async init() {
        await this.waitForAppData();
        this.setupEventListeners();
        this.renderUserProfile();
        this.renderRecommendations();
        this.renderCategories();
        this.setupModal();
        this.updateStructuredData();
    }

    async waitForAppData() {
        return new Promise((resolve) => {
            const checkData = () => {
                if (window.readMediaApp && window.readMediaApp.appData) {
                    this.recommendationsData = window.readMediaApp.appData.recommendations;
                    resolve();
                } else {
                    setTimeout(checkData, 100);
                }
            };
            checkData();
        });
    }

    setupEventListeners() {
        // Filter changes
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        const refreshBtn = document.getElementById('refresh-recommendations');
        const shuffleBtn = document.getElementById('shuffle-recommendations');
        const resetBtn = document.getElementById('reset-preferences');
        const editBtn = document.getElementById('edit-preferences');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.renderRecommendations();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.renderRecommendations();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshRecommendations();
            });
        }

        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                this.shuffleRecommendations();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetPreferences();
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.openPreferencesModal();
            });
        }
    }

    loadUserPreferences() {
        const stored = localStorage.getItem('readmedia_user_preferences');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Default preferences
        return {
            genres: ['fiction', 'self-help', 'non-fiction'],
            authors: ['James Clear', 'J.K. Rowling'],
            readingLevel: 'intermediate',
            lastUpdated: new Date().toISOString()
        };
    }

    saveUserPreferences() {
        this.userPreferences.lastUpdated = new Date().toISOString();
        localStorage.setItem('readmedia_user_preferences', JSON.stringify(this.userPreferences));
    }

    renderUserProfile() {
        const genresElement = document.getElementById('preferred-genres');
        const authorsElement = document.getElementById('favorite-authors');
        const levelElement = document.getElementById('reading-level');
        const matchElement = document.getElementById('match-score');

        if (genresElement) {
            genresElement.textContent = this.userPreferences.genres.map(g => this.capitalizeFirst(g)).join(', ') || 'Not set';
        }
        
        if (authorsElement) {
            authorsElement.textContent = this.userPreferences.authors.join(', ') || 'Not set';
        }
        
        if (levelElement) {
            levelElement.textContent = this.capitalizeFirst(this.userPreferences.readingLevel);
        }
        
        if (matchElement) {
            // Calculate match score based on preferences
            const recommendations = this.getRecommendations();
            const preferredCount = recommendations.filter(book => this.calculateMatchScore(book) > 70).length;
            const totalCount = recommendations.length;
            const matchScore = totalCount > 0 ? Math.round((preferredCount / totalCount) * 100) : 0;
            
            matchElement.textContent = `${matchScore}% Match`;
            matchElement.style.color = this.getMatchColor(matchScore);
        }
    }

    renderRecommendations() {
        const container = document.getElementById('recommendations-grid');
        const loadingElement = document.getElementById('loading-state');
        const emptyElement = document.getElementById('empty-state');
        
        if (!container) return;

        const recommendations = this.getRecommendations();
        const totalRecommendations = recommendations.length;
        
        // Show/hide loading and empty states
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (emptyElement) {
            emptyElement.style.display = totalRecommendations === 0 ? 'block' : 'none';
        }

        // Update results count
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `${totalRecommendations} book${totalRecommendations !== 1 ? 's' : ''} found`;
        }

        // Update last updated time
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = `Updated ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }

        // Render recommendations
        container.innerHTML = recommendations.map(book => {
            const matchScore = this.calculateMatchScore(book);
            const badge = book.featured ? `<div class="recommendation-badge">Featured</div>` : '';
            const image = book.imageUrl ? 
                `<img src="${book.imageUrl}" alt="${book.title}" class="recommendation-image" loading="lazy" itemprop="image">` :
                `<div class="recommendation-image book-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20M4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20V17V2H6.5C5.83696 2 5.20107 2.26339 4.73223 2.73223C4.26339 3.20107 4 3.83696 4 4.5V19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>`;

            return `
                <div class="recommendation-card" data-asin="${book.asin || ''}" itemscope itemtype="https://schema.org/Book">
                    ${badge}
                    ${image}
                    <div class="recommendation-content">
                        <h3 class="recommendation-title" itemprop="name">${this.escapeHtml(book.title)}</h3>
                        <div class="recommendation-author" itemprop="author">By ${this.escapeHtml(book.author)}</div>
                        <div class="recommendation-rating">
                            <span class="rating-stars">${this.renderStars(book.rating)}</span>
                            <span class="rating-value">${book.rating}</span>
                        </div>
                        <div class="recommendation-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                            <span itemprop="price">${book.price && book.price !== 'Price not available' ? book.price : 'Price varies'}</span>
                        </div>
                        <div class="recommendation-match">
                            <span>Match:</span>
                            <div class="match-bar">
                                <div class="match-fill" style="width: ${matchScore}%"></div>
                            </div>
                            <span>${matchScore}%</span>
                        </div>
                    </div>
                    <div class="recommendation-actions">
                        <a href="${book.productUrl}" 
                           target="_blank" 
                           rel="noopener sponsored" 
                           class="btn btn-primary"
                           itemprop="url">
                            View on Amazon
                        </a>
                        ${this.getAdditionalActions(book)}
                    </div>
                </div>
            `;
        }).join('');
        
        // Update structured data with current recommendations
        this.updateStructuredData(recommendations);
    }

    getRecommendations() {
        if (!this.recommendationsData || !this.recommendationsData.categories) return [];

        let allBooks = [];
        
        // Flatten all books from all categories
        Object.values(this.recommendationsData.categories).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(book => {
                    if (book.title && book.productUrl) {
                        allBooks.push({
                            ...book,
                            category: book.category || 'general',
                            matchScore: this.calculateMatchScore(book)
                        });
                    }
                });
            }
        });

        // Remove duplicates by ASIN or title
        const uniqueBooks = allBooks.filter((book, index, self) =>
            index === self.findIndex(b => 
                (b.asin && b.asin === book.asin) || b.title === book.title
            )
        );

        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            const filteredBooks = uniqueBooks.filter(book => 
                book.category && book.category.toLowerCase().includes(this.currentFilters.category.toLowerCase())
            );
            if (filteredBooks.length > 0) {
                allBooks = filteredBooks;
            }
        }

        // Apply user preferences matching
        const preferredBooks = allBooks.filter(book => book.matchScore > 50);
        const otherBooks = allBooks.filter(book => book.matchScore <= 50);

        // Apply sorting
        switch (this.currentFilters.sort) {
            case 'rating':
                allBooks.sort((a, b) => {
                    const ratingA = parseFloat(a.rating) || 0;
                    const ratingB = parseFloat(b.rating) || 0;
                    return ratingB - ratingA;
                });
                break;
            case 'price-low':
                allBooks.sort((a, b) => this.parsePrice(a.price) - this.parsePrice(b.price));
                break;
            case 'price-high':
                allBooks.sort((a, b) => this.parsePrice(b.price) - this.parsePrice(a.price));
                break;
            case 'title':
                allBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'relevance':
            default:
                // Sort by match score, then rating
                allBooks.sort((a, b) => {
                    if (b.matchScore !== a.matchScore) {
                        return b.matchScore - a.matchScore;
                    }
                    const ratingA = parseFloat(a.rating) || 0;
                    const ratingB = parseFloat(b.rating) || 0;
                    return ratingB - ratingA;
                });
                break;
        }

        return allBooks.slice(0, 12); // Limit to 12 recommendations
    }

    calculateMatchScore(book) {
        let score = 0;
        
        // Genre matching (40% weight)
        if (book.category) {
            const bookCategory = book.category.toLowerCase();
            const genreMatch = this.userPreferences.genres.some(genre => 
                bookCategory.includes(genre.toLowerCase())
            );
            if (genreMatch) score += 40;
        }
        
        // Author matching (30% weight)
        if (book.author) {
            const authorMatch = this.userPreferences.authors.some(author => 
                book.author.toLowerCase().includes(author.toLowerCase())
            );
            if (authorMatch) score += 30;
        }
        
        // Rating consideration (20% weight)
        const rating = parseFloat(book.rating) || 0;
        if (rating >= 4.0) score += 20;
        else if (rating >= 3.5) score += 10;
        
        // Popularity/featured boost (10% weight)
        if (book.featured) score += 10;
        
        return Math.min(score, 100);
    }

    getMatchColor(score) {
        if (score >= 80) return '#4caf50'; // Green
        if (score >= 60) return '#ff9800'; // Orange
        return '#f44336'; // Red
    }

    renderCategories() {
        const container = document.getElementById('categories-grid');
        if (!container) return;

        if (!this.recommendationsData || !this.recommendationsData.categories) return;

        const categories = Object.entries(this.recommendationsData.categories).map(([category, books]) => ({
            name: this.formatCategoryName(category),
            count: Array.isArray(books) ? books.length : 0,
            key: category
        }));

        container.innerHTML = categories.map(category => `
            <a href="#" class="category-card" data-category="${category.key}">
                <div class="category-icon">📚</div>
                <div class="category-name">${category.name}</div>
                <div class="category-count">${category.count} books</div>
            </a>
        `).join('');

        // Add event listeners to category cards
        container.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentFilters.category = card.dataset.category;
                const categoryFilter = document.getElementById('category-filter');
                if (categoryFilter) {
                    categoryFilter.value = this.currentFilters.category;
                }
                this.renderRecommendations();
                
                // Scroll to recommendations section
                document.getElementById('recommendations-title')?.scrollIntoView({ 
                    behavior: 'smooth' 
                });
            });
        });
    }

    setupModal() {
        const modal = document.getElementById('preferences-modal');
        const openBtn = document.getElementById('edit-preferences');
        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-preferences');
        const saveBtn = document.getElementById('save-preferences');
        const addAuthorBtn = document.getElementById('add-author');
        const authorInput = document.getElementById('author-input');

        // Open modal
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.openPreferencesModal();
            });
        }

        // Close modal
        const closeModal = () => {
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        // Save preferences
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.savePreferencesFromModal();
                closeModal();
            });
        }

        // Add author
        if (addAuthorBtn && authorInput) {
            addAuthorBtn.addEventListener('click', () => {
                this.addAuthorFromInput();
            });

            authorInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addAuthorFromInput();
                }
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
    }

    openPreferencesModal() {
        const modal = document.getElementById('preferences-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            this.renderGenresChips();
            this.renderAuthorsChips();
            this.setReadingLevel();
            
            // Focus on first interactive element for accessibility
            setTimeout(() => {
                const firstChip = document.querySelector('.chip');
                if (firstChip) firstChip.focus();
            }, 100);
        }
    }

    renderGenresChips() {
        const container = document.getElementById('genres-chips');
        if (!container) return;

        const availableGenres = [
            'fiction', 'non-fiction', 'self-help', 'science-tech', 
            'mystery-thriller', 'biography', 'business', 'romance',
            'fantasy', 'history', 'science-fiction', 'young-adult'
        ];

        container.innerHTML = availableGenres.map(genre => `
            <div class="chip ${this.userPreferences.genres.includes(genre) ? 'active' : ''}" 
                 data-genre="${genre}"
                 tabindex="0"
                 role="button"
                 aria-pressed="${this.userPreferences.genres.includes(genre)}">
                ${this.capitalizeFirst(genre)}
                <button class="chip-remove" data-genre="${genre}" aria-label="Remove ${genre}">×</button>
            </div>
        `).join('');

        // Add event listeners to genre chips
        container.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                const genre = chip.dataset.genre;
                this.toggleGenre(genre);
            });
            
            chip.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const genre = chip.dataset.genre;
                    this.toggleGenre(genre);
                }
            });
        });
    }

    renderAuthorsChips() {
        const container = document.getElementById('authors-chips');
        if (!container) return;

        container.innerHTML = this.userPreferences.authors.map(author => `
            <div class="chip" data-author="${author}" tabindex="0">
                ${author}
                <button class="chip-remove" data-author="${author}" aria-label="Remove ${author}">×</button>
            </div>
        `).join('');

        // Add event listeners to author chips
        container.querySelectorAll('.chip-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const author = btn.dataset.author;
                this.removeAuthor(author);
            });
        });
    }

    setReadingLevel() {
        const select = document.getElementById('reading-level-select');
        if (select) {
            select.value = this.userPreferences.readingLevel;
        }
    }

    toggleGenre(genre) {
        const currentIndex = this.userPreferences.genres.indexOf(genre);
        
        if (currentIndex === -1) {
            if (this.userPreferences.genres.length < 5) {
                this.userPreferences.genres.push(genre);
            } else {
                // Show message about limit
                this.showToast('You can select up to 5 genres', 'info');
                return;
            }
        } else {
            this.userPreferences.genres.splice(currentIndex, 1);
        }
        
        this.renderGenresChips();
    }

    addAuthorFromInput() {
        const input = document.getElementById('author-input');
        if (!input) return;

        const author = input.value.trim();
        
        if (author && !this.userPreferences.authors.includes(author)) {
            this.userPreferences.authors.push(author);
            this.renderAuthorsChips();
            input.value = '';
            input.focus();
        } else if (author) {
            this.showToast('Author already added', 'info');
        }
    }

    removeAuthor(author) {
        const index = this.userPreferences.authors.indexOf(author);
        if (index !== -1) {
            this.userPreferences.authors.splice(index, 1);
            this.renderAuthorsChips();
        }
    }

    savePreferencesFromModal() {
        const readingLevelSelect = document.getElementById('reading-level-select');
        if (readingLevelSelect) {
            this.userPreferences.readingLevel = readingLevelSelect.value;
        }
        
        this.saveUserPreferences();
        this.renderUserProfile();
        this.renderRecommendations();
        
        this.showToast('Preferences saved successfully!', 'success');
    }

    refreshRecommendations() {
        // Show loading state
        const loadingElement = document.getElementById('loading-state');
        const container = document.getElementById('recommendations-grid');
        
        if (loadingElement && container) {
            loadingElement.style.display = 'block';
            container.innerHTML = '';
            
            // Simulate API call delay
            setTimeout(() => {
                this.renderRecommendations();
                this.showToast('Recommendations refreshed!', 'success');
            }, 1500);
        }
    }

    shuffleRecommendations() {
        // Create a temporary shuffle and re-render
        const currentSort = this.currentFilters.sort;
        this.currentFilters.sort = 'relevance';
        this.renderRecommendations();
        this.currentFilters.sort = currentSort;
        
        this.showToast('Shuffled recommendations!', 'info');
    }

    resetPreferences() {
        this.userPreferences = {
            genres: ['fiction', 'self-help', 'non-fiction'],
            authors: ['James Clear', 'J.K. Rowling'],
            readingLevel: 'intermediate',
            lastUpdated: new Date().toISOString()
        };
        
        this.saveUserPreferences();
        this.renderUserProfile();
        this.renderRecommendations();
        
        // Reset filters
        this.currentFilters = {
            category: 'all',
            sort: 'relevance'
        };
        
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (categoryFilter) categoryFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'relevance';
        
        this.showToast('Preferences reset to default', 'info');
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

    updateStructuredData(recommendations = []) {
        const currentRecommendations = recommendations.length > 0 ? recommendations : this.getRecommendations().slice(0, 6);
        
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "RecommendationPage",
            "name": "Personalized Book Recommendations | ReadMedia",
            "description": "AI-powered book recommendations based on reading preferences, interests, and behavior patterns",
            "url": window.location.href,
            "isBasedOn": {
                "@type": "Book",
                "name": "Amazon Bestsellers and Curated Collection"
            },
            "publisher": {
                "@type": "Organization",
                "name": "ReadMedia",
                "url": window.location.origin
            },
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": currentRecommendations.length,
                "itemListOrder": "Descending",
                "itemListElement": currentRecommendations.map((book, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Book",
                        "name": book.title,
                        "author": {
                            "@type": "Person",
                            "name": book.author
                        },
                        "aggregateRating": book.rating ? {
                            "@type": "AggregateRating",
                            "ratingValue": book.rating,
                            "bestRating": "5"
                        } : undefined,
                        "offers": book.price && book.price !== 'Price not available' ? {
                            "@type": "Offer",
                            "price": this.parsePrice(book.price),
                            "priceCurrency": "USD",
                            "availability": "https://schema.org/InStock",
                            "url": book.productUrl
                        } : undefined
                    }
                }))
            }
        };

        // Remove existing structured data
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => {
            if (script.textContent.includes('RecommendationPage')) {
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

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
    }

    formatCategoryName(category) {
        if (!category) return '';
        return category.split('_')
            .map(word => this.capitalizeFirst(word))
            .join(' ');
    }

    renderStars(rating) {
        if (!rating) return '☆☆☆☆☆';
        
        const numRating = parseFloat(rating);
        const fullStars = Math.floor(numRating);
        const hasHalfStar = numRating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '½' : '') + 
               '☆'.repeat(emptyStars);
    }

    parsePrice(price) {
        if (!price || price === 'Price not available') return 0;
        
        const match = price.match(/\$?([0-9]+\.?[0-9]*)/);
        return match ? parseFloat(match[1]) : 0;
    }

    getAdditionalActions(book) {
        if (!book) return '';
        
        // Check if this book exists in our local collection
        const localBooks = window.readMediaApp?.appData?.books || [];
        const localBook = localBooks.find(b => 
            b.title === book.title || b.author === book.author
        );
        
        if (localBook) {
            return `<a href="book.html?id=${localBook.id}" class="btn btn-secondary btn-sm">View Details</a>`;
        }
        
        return '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RecommendationsPage();
});