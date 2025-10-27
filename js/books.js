// books.js - Enhanced functionality for books page
class BooksPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentView = 'grid';
        this.currentFilters = {
            genre: 'all',
            format: 'all',
            availability: 'all',
            sort: 'newest'
        };
        
        this.init();
    }

    async init() {
        await this.waitForAppData();
        this.setupEventListeners();
        this.updateStats();
        this.renderBooks();
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
        // Filter changes
        document.getElementById('genre-filter')?.addEventListener('change', (e) => {
            this.currentFilters.genre = e.target.value;
            this.currentPage = 1;
            this.renderBooks();
        });

        document.getElementById('format-filter')?.addEventListener('change', (e) => {
            this.currentFilters.format = e.target.value;
            this.currentPage = 1;
            this.renderBooks();
        });

        document.getElementById('availability-filter')?.addEventListener('change', (e) => {
            this.currentFilters.availability = e.target.value;
            this.currentPage = 1;
            this.renderBooks();
        });

        document.getElementById('sort-filter')?.addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.renderBooks();
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.setView(btn.dataset.view);
            });
        });

        // Reset filters
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        document.getElementById('reset-all-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Search functionality
        this.setupSearch();
    }
    
    setupSearch() {
        // Create search input if it doesn't exist
        if (!document.getElementById('books-search')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container';
            searchContainer.innerHTML = `
                <div class="search-group">
                    <label for="books-search" class="sr-only">Search books</label>
                    <input type="text" id="books-search" placeholder="Search by title, author, or keyword..." class="search-input">
                    <button type="button" id="clear-search" class="clear-search" aria-label="Clear search" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            
            const filtersContainer = document.querySelector('.filters-container');
            filtersContainer.parentNode.insertBefore(searchContainer, filtersContainer);
            
            // Add search event listeners
            const searchInput = document.getElementById('books-search');
            const clearButton = document.getElementById('clear-search');
            
            searchInput.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value.trim();
                clearButton.style.display = this.currentSearchTerm ? 'block' : 'none';
                this.currentPage = 1;
                this.renderBooks();
            });
            
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                this.currentSearchTerm = '';
                clearButton.style.display = 'none';
                this.currentPage = 1;
                this.renderBooks();
            });
        }
    }

    updateStats() {
        const books = window.readMediaApp.appData.books || [];
        const totalBooks = books.length;
        const freeBooks = books.filter(book => 
            book.file_formats && book.file_formats.length > 0
        ).length;
        
        const genres = new Set(books.map(book => book.genre).filter(Boolean));
        
        document.getElementById('total-books').textContent = `${totalBooks}+`;
        document.getElementById('free-books').textContent = `${freeBooks}+`;
        document.getElementById('genres-count').textContent = `${genres.size}+`;
    }

    getFilteredBooks() {
        let books = [...(window.readMediaApp.appData.books || [])];

        // Apply search filter
        if (this.currentSearchTerm) {
            const searchTerm = this.currentSearchTerm.toLowerCase();
            books = books.filter(book => 
                book.title?.toLowerCase().includes(searchTerm) ||
                book.author?.toLowerCase().includes(searchTerm) ||
                book.description?.toLowerCase().includes(searchTerm) ||
                (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        // Apply genre filter
        if (this.currentFilters.genre !== 'all') {
            books = books.filter(book => 
                book.genre?.toLowerCase() === this.currentFilters.genre.toLowerCase()
            );
        }

        // Apply format filter
        if (this.currentFilters.format !== 'all') {
            if (this.currentFilters.format === 'affiliate') {
                books = books.filter(book => 
                    book.affiliate_link && (!book.file_formats || book.file_formats.length === 0)
                );
            } else {
                books = books.filter(book => 
                    book.file_formats && book.file_formats.includes(this.currentFilters.format)
                );
            }
        }

        // Apply availability filter
        if (this.currentFilters.availability !== 'all') {
            if (this.currentFilters.availability === 'free') {
                books = books.filter(book => 
                    book.file_formats && book.file_formats.length > 0
                );
            } else if (this.currentFilters.availability === 'affiliate') {
                books = books.filter(book => 
                    book.affiliate_link && (!book.file_formats || book.file_formats.length === 0)
                );
            }
        }

        // Apply sorting
        switch (this.currentFilters.sort) {
            case 'newest':
                books.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case 'oldest':
                books.sort((a, b) => (a.year || 0) - (b.year || 0));
                break;
            case 'title':
                books.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'author':
                books.sort((a, b) => a.author.localeCompare(b.author));
                break;
            case 'popular':
                // Sort by featured first, then by other criteria
                books.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return (b.rating || 0) - (a.rating || 0);
                });
                break;
        }

        return books;
    }

    renderBooks() {
        const container = document.getElementById('books-grid');
        const loadingElement = document.getElementById('books-loading');
        const emptyElement = document.getElementById('books-empty');
        
        if (!container) return;

        const filteredBooks = this.getFilteredBooks();
        const totalBooks = filteredBooks.length;
        
        // Show/hide loading and empty states
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (emptyElement) {
            emptyElement.style.display = totalBooks === 0 ? 'block' : 'none';
        }

        // Update results count
        const countElement = document.getElementById('books-count');
        if (countElement) {
            countElement.textContent = `${totalBooks} book${totalBooks !== 1 ? 's' : ''} found`;
        }

        // Update active filters display
        this.updateActiveFilters();

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

        // Render books based on current view
        if (this.currentView === 'grid') {
            this.renderBooksGrid(container, paginatedBooks);
        } else {
            this.renderBooksList(container, paginatedBooks);
        }

        // Render pagination
        this.renderPagination(totalBooks);
        
        // Update structured data
        this.updateStructuredData(paginatedBooks);
    }

    renderBooksGrid(container, books) {
        container.className = 'books-grid';
        container.innerHTML = books.map(book => `
            <div class="card book-card" data-id="${book.id}" itemscope itemtype="https://schema.org/Book">
                ${book.cover ? `
                    <img src="${book.cover}" alt="${book.title}" class="card-image" loading="lazy" itemprop="image">
                ` : `
                    <div class="card-image book-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20M4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20V17V2H6.5C5.83696 2 5.20107 2.26339 4.73223 2.73223C4.26339 3.20107 4 3.83696 4 4.5V19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                `}
                <div class="card-content">
                    <h3 class="card-title">
                        <a href="book.html?id=${book.id}" itemprop="url">
                            <span itemprop="name">${this.escapeHtml(book.title)}</span>
                        </a>
                    </h3>
                    <div class="card-meta">
                        <span class="author" itemprop="author">By ${this.escapeHtml(book.author)}</span>
                        ${book.year ? `<span>•</span><span class="year" itemprop="datePublished">${book.year}</span>` : ''}
                    </div>
                    <p class="card-excerpt" itemprop="description">${this.truncateText(book.description, 120)}</p>
                    ${book.tags && book.tags.length > 0 ? `
                        <div class="book-tags">
                            ${book.tags.slice(0, 3).map(tag => `
                                <span class="tag">${this.escapeHtml(tag)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer">
                    <span class="genre">${book.genre || 'General'}</span>
                    <div class="book-actions">
                        ${this.getBookActionButtons(book)}
                    </div>
                </div>
                ${book.featured ? '<div class="featured-badge">Featured</div>' : ''}
            </div>
        `).join('');
    }

    renderBooksList(container, books) {
        container.className = 'books-list';
        container.innerHTML = books.map(book => `
            <div class="book-list-item" data-id="${book.id}" itemscope itemtype="https://schema.org/Book">
                <div class="book-list-image">
                    ${book.cover ? `
                        <img src="${book.cover}" alt="${book.title}" loading="lazy" itemprop="image">
                    ` : `
                        <div class="book-placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20M4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20V17V2H6.5C5.83696 2 5.20107 2.26339 4.73223 2.73223C4.26339 3.20107 4 3.83696 4 4.5V19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    `}
                </div>
                <div class="book-list-content">
                    <h3 class="book-list-title">
                        <a href="book.html?id=${book.id}" itemprop="url">
                            <span itemprop="name">${this.escapeHtml(book.title)}</span>
                        </a>
                    </h3>
                    <div class="book-list-meta">
                        <span class="author" itemprop="author">By ${this.escapeHtml(book.author)}</span>
                        ${book.year ? `<span>•</span><span class="year" itemprop="datePublished">${book.year}</span>` : ''}
                        <span>•</span>
                        <span class="genre">${book.genre || 'General'}</span>
                    </div>
                    <p class="book-list-description" itemprop="description">${this.truncateText(book.description, 200)}</p>
                    ${book.tags && book.tags.length > 0 ? `
                        <div class="book-tags">
                            ${book.tags.slice(0, 4).map(tag => `
                                <span class="tag">${this.escapeHtml(tag)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="book-list-actions">
                    ${this.getBookActionButtons(book)}
                </div>
                ${book.featured ? '<div class="featured-badge">Featured</div>' : ''}
            </div>
        `).join('');
    }

    getBookActionButtons(book) {
        const buttons = [];
        
        if (book.file_formats && book.file_formats.length > 0) {
            buttons.push(`
                <a href="book.html?id=${book.id}" class="btn btn-primary btn-sm" aria-label="Download ${book.title}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16L12 8M12 8L15 11M12 8L9 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M4 16V4C4 2.89543 4.89543 2 6 2H14M4 16C4 17.1046 4.89543 18 6 18H18C19.1046 18 20 17.1046 20 16V8C20 6.89543 19.1046 6 18 6H14C13.4477 6 13 5.55228 13 5V2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Download
                </a>
            `);
        } else if (book.affiliate_link) {
            buttons.push(`
                <a href="${book.affiliate_link}" target="_blank" rel="noopener sponsored" class="btn btn-secondary btn-sm" aria-label="Purchase ${book.title}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M16 8V6C16 4.89543 15.1046 4 14 4H6C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H8M10 8H18C19.1046 8 20 8.89543 20 10V18C20 19.1046 19.1046 20 18 20H10C8.89543 20 8 19.1046 8 18V10C8 8.89543 8.89543 8 10 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Purchase
                </a>
            `);
        }
        
        buttons.push(`
            <a href="book.html?id=${book.id}" class="btn btn-outline btn-sm" aria-label="View details for ${book.title}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Details
            </a>
        `);
        
        return buttons.join('');
    }

    renderPagination(totalBooks) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(totalBooks / this.itemsPerPage);
        
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
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}" aria-label="Page ${i}" ${i === this.currentPage ? 'aria-current="page"' : ''}>
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

        // Add event listeners
        container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.renderBooks();
                    
                    // Scroll to top of books section
                    document.getElementById('books-grid')?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            });
        });
    }

    updateActiveFilters() {
        const container = document.getElementById('active-filters');
        if (!container) return;

        const activeFilters = [];
        
        if (this.currentFilters.genre !== 'all') {
            activeFilters.push(`Genre: ${this.currentFilters.genre}`);
        }
        
        if (this.currentFilters.format !== 'all') {
            activeFilters.push(`Format: ${this.currentFilters.format}`);
        }
        
        if (this.currentFilters.availability !== 'all') {
            activeFilters.push(`Availability: ${this.currentFilters.availability}`);
        }
        
        if (this.currentSearchTerm) {
            activeFilters.push(`Search: "${this.currentSearchTerm}"`);
        }

        if (activeFilters.length > 0) {
            container.innerHTML = activeFilters.map(filter => 
                `<span class="filter-tag">${filter}</span>`
            ).join('');
        } else {
            container.innerHTML = '';
        }
    }

    setView(view) {
        if (this.currentView === view) return;
        
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.renderBooks();
    }

    resetFilters() {
        // Reset filter dropdowns
        document.getElementById('genre-filter').value = 'all';
        document.getElementById('format-filter').value = 'all';
        document.getElementById('availability-filter').value = 'all';
        document.getElementById('sort-filter').value = 'newest';
        
        // Reset search
        if (document.getElementById('books-search')) {
            document.getElementById('books-search').value = '';
            document.getElementById('clear-search').style.display = 'none';
        }
        
        // Reset internal state
        this.currentFilters = {
            genre: 'all',
            format: 'all',
            availability: 'all',
            sort: 'newest'
        };
        this.currentSearchTerm = '';
        this.currentPage = 1;
        
        // Re-render
        this.renderBooks();
    }

    updateStructuredData(books = []) {
        // Update structured data for the current page
        const filteredBooks = books.length > 0 ? books : this.getFilteredBooks().slice(0, 10);
        
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Free eBooks & Digital Library | ReadMedia",
            "description": "Collection of 500+ free eBooks, book recommendations, and literary works available in multiple formats",
            "url": window.location.href,
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": filteredBooks.length,
                "itemListOrder": "Descending",
                "itemListElement": filteredBooks.map((book, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Book",
                        "name": book.title,
                        "author": {
                            "@type": "Person",
                            "name": book.author
                        },
                        "bookFormat": "EBook",
                        "inLanguage": "English",
                        "genre": book.genre,
                        "description": book.description,
                        "url": `${window.location.origin}/book.html?id=${book.id}`
                    }
                }))
            },
            "publisher": {
                "@type": "Organization",
                "name": "ReadMedia",
                "url": window.location.origin
            }
        };

        // Remove existing structured data
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            existingScript.remove();
        }

        // Add new structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BooksPage();
});