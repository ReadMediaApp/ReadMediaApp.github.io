// Component rendering functions
class Components {
    // Render article card
    static renderArticleCard(article) {
        const safeArticle = Security.preventXSS(article);
        const excerpt = safeArticle.excerpt || safeArticle.content.substring(0, 150) + '...';
        const date = new Date(safeArticle.date).toLocaleDateString();
        
        return `
            <article class="card" data-id="${safeArticle.id}" data-type="article">
                ${safeArticle.image ? `
                    <div class="card-image-container">
                        <img src="${safeArticle.image}" alt="${safeArticle.title}" class="card-image" loading="lazy">
                    </div>
                ` : ''}
                <div class="card-content">
                    <h3 class="card-title">${safeArticle.title}</h3>
                    <div class="card-meta">
                        <span>By ${safeArticle.author}</span>
                        <span>•</span>
                        <span>${date}</span>
                        ${safeArticle.tags && safeArticle.tags.length > 0 ? `
                            <span>•</span>
                            <span>${safeArticle.tags.slice(0, 2).join(', ')}</span>
                        ` : ''}
                    </div>
                    <p class="card-excerpt">${excerpt}</p>
                    <div class="card-actions">
                        <a href="article.html?id=${safeArticle.id}" class="read-more">Read More</a>
                        <div class="share-buttons">
                            <button class="share-btn" onclick="event.stopPropagation(); Share.shareArticle('${safeArticle.id}')" title="Share">
                                <span class="material-icons">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    // Render book card
    static renderBookCard(book) {
        const safeBook = Security.preventXSS(book);
        const downloadButtons = Object.entries(safeBook.download_links || {})
            .map(([format, url]) => `
                <a href="${url}" class="download-btn" download title="Download ${format.toUpperCase()}">
                    <span class="material-icons">download</span>
                    ${format.toUpperCase()}
                </a>
            `).join('');
        
        const affiliateButton = safeBook.affiliate_link ? `
            <a href="${safeBook.affiliate_link}" class="btn" target="_blank" rel="noopener noreferrer" onclick="Track.affiliateClick('${safeBook.id}')">
                <span class="material-icons">shopping_cart</span>
                Buy Now
            </a>
        ` : '';
        
        return `
            <article class="card" data-id="${safeBook.id}" data-type="book">
                ${safeBook.cover ? `
                    <div class="card-image-container">
                        <img src="${safeBook.cover}" alt="${safeBook.title}" class="card-image" loading="lazy">
                        <div class="book-badge">${safeBook.file_formats ? safeBook.file_formats.join(' • ') : ''}</div>
                    </div>
                ` : ''}
                <div class="card-content">
                    <h3 class="card-title">${safeBook.title}</h3>
                    <div class="card-meta">
                        <span>By ${safeBook.author}</span>
                        <span>•</span>
                        <span>${safeBook.year}</span>
                        ${safeBook.pages ? `<span>•</span><span>${safeBook.pages} pages</span>` : ''}
                    </div>
                    <p class="card-excerpt">${safeBook.description}</p>
                    <div class="card-actions">
                        <div class="download-buttons">
                            ${downloadButtons}
                            ${affiliateButton}
                        </div>
                        <button class="info-btn" onclick="BookManager.showBookInfo('${safeBook.id}')" title="Book Info">
                            <span class="material-icons">info</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    // Render review card
    static renderReviewCard(review) {
        const safeReview = Security.preventXSS(review);
        const book = App.data.books.find(b => b.id === safeReview.book_id);
        const date = new Date(safeReview.date).toLocaleDateString();
        const stars = '★'.repeat(safeReview.rating) + '☆'.repeat(5 - safeReview.rating);
        
        return `
            <article class="review-card" data-id="${safeReview.id}" data-type="review">
                <div class="review-header">
                    <div class="review-book">
                        <h4>${safeReview.title}</h4>
                        ${book ? `<p>Review of <strong>${book.title}</strong> by ${book.author}</p>` : ''}
                    </div>
                    <div class="review-rating" title="${safeReview.rating} out of 5 stars">
                        ${stars}
                    </div>
                </div>
                <div class="review-content">
                    ${safeReview.content}
                </div>
                <div class="card-meta">
                    <span>By ${safeReview.author}</span>
                    <span>•</span>
                    <span>${date}</span>
                </div>
            </article>
        `;
    }

    // Render ad unit
    static renderAd(ad) {
        if (!ad.active) return '';
        const safeAd = Security.preventXSS(ad);
        
        return `
            <div class="ad-unit" data-id="${safeAd.id}">
                <h4>${safeAd.title}</h4>
                ${safeAd.image ? `<img src="${safeAd.image}" alt="${safeAd.title}" style="width: 100%; border-radius: 4px; margin: 0.5rem 0;" loading="lazy">` : ''}
                <p>${safeAd.content}</p>
                ${safeAd.link ? `<a href="${safeAd.link}" class="ad-link" target="_blank" rel="noopener noreferrer">Learn More</a>` : ''}
            </div>
        `;
    }

    // Render sidebar content
    static renderSidebar(articles, books, ads) {
        const featuredArticles = articles.filter(a => a.featured).slice(0, 3);
        const featuredBooks = books.filter(b => b.featured).slice(0, 3);
        const sidebarAds = ads.filter(ad => ad.type === 'sidebar' && ad.active);

        return `
            <div class="sidebar-section">
                <h4>Featured Articles</h4>
                ${featuredArticles.map(article => `
                    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
                        <h5 style="margin-bottom: 0.25rem; font-size: 0.9rem;">
                            <a href="article.html?id=${article.id}" style="color: inherit; text-decoration: none; display: block;">
                                ${Security.sanitizeHTML(article.title)}
                            </a>
                        </h5>
                        <small style="color: #666;">${new Date(article.date).toLocaleDateString()}</small>
                    </div>
                `).join('')}
            </div>

            <div class="sidebar-section">
                <h4>Featured Books</h4>
                ${featuredBooks.map(book => `
                    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
                        <h5 style="margin-bottom: 0.25rem; font-size: 0.9rem;">
                            <a href="#" onclick="BookManager.showBookInfo('${book.id}')" style="color: inherit; text-decoration: none; display: block; cursor: pointer;">
                                ${Security.sanitizeHTML(book.title)}
                            </a>
                        </h5>
                        <small style="color: #666;">By ${Security.sanitizeHTML(book.author)}</small>
                    </div>
                `).join('')}
            </div>

            ${sidebarAds.map(ad => this.renderAd(ad)).join('')}
        `;
    }

    /// Add this method to your Components class in components.js
    static renderFooter() {
        const currentYear = new Date().getFullYear();
        return `
            <div class="footer-content">
                <div class="footer-section">
                    <h3>ReadMedia</h3>
                    <p>Your trusted source for quality articles, book reviews, and literary content.</p>
                    <div class="social-links">
                        <a href="#" aria-label="Twitter">🐦</a>
                        <a href="#" aria-label="Facebook">📘</a>
                        <a href="#" aria-label="Instagram">📷</a>
                    </div>
                </div>
                
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul class="footer-links">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="articles.html">Articles</a></li>
                        <li><a href="books.html">Books</a></li>
                        <li><a href="reviews.html">Reviews</a></li>
                        <li><a href="donate.html">Support Us</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Legal</h4>
                    <ul class="footer-links">
                        <li><a href="privacy.html">Privacy Policy</a></li>
                        <li><a href="terms.html">Terms of Service</a></li>
                        <li><a href="cookies.html">Cookie Policy</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Contact</h4>
                    <ul class="footer-links">
                        <li>📧 contact@readmedia.com</li>
                        <li>📞 +1 (555) 123-4567</li>
                        <li>📍 123 Book Street, Library City</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; ${currentYear} ReadMedia. All rights reserved.</p>
            </div>
        `;
    }
    // Render book info modal
    static renderBookInfo(book) {
        const safeBook = Security.preventXSS(book);
        const downloadOptions = Object.entries(safeBook.download_links || {})
            .map(([format, url]) => `
                <a href="${url}" class="download-option" download>
                    <span class="material-icons">download</span>
                    <span>${format.toUpperCase()} (${safeBook.file_size[format]})</span>
                </a>
            `).join('');
        
        const affiliateSection = safeBook.affiliate_link ? `
            <div class="affiliate-section" style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border-radius: 4px;">
                <h4>Purchase Options</h4>
                <a href="${safeBook.affiliate_link}" class="btn" target="_blank" rel="noopener noreferrer" style="background: #ff6b35;">
                    <span class="material-icons">shopping_cart</span>
                    Buy on Amazon
                </a>
                <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #856404;">
                    Support ReadMedia by purchasing through our affiliate link
                </p>
            </div>
        ` : '';

        return `
            <div class="modal" id="book-modal-${safeBook.id}">
                <div class="modal-content">
                    <span class="close-modal" onclick="BookManager.closeModal('${safeBook.id}')">&times;</span>
                    <div class="modal-header">
                        <h2>${safeBook.title}</h2>
                        <p class="modal-subtitle">by ${safeBook.author}</p>
                    </div>
                    <div class="modal-body">
                        <div class="book-info-grid">
                            <div class="book-cover">
                                <img src="${safeBook.cover}" alt="${safeBook.title}" loading="lazy">
                            </div>
                            <div class="book-details">
                                <div class="detail-item">
                                    <strong>Year:</strong> ${safeBook.year}
                                </div>
                                ${safeBook.pages ? `
                                <div class="detail-item">
                                    <strong>Pages:</strong> ${safeBook.pages}
                                </div>
                                ` : ''}
                                ${safeBook.publisher ? `
                                <div class="detail-item">
                                    <strong>Publisher:</strong> ${safeBook.publisher}
                                </div>
                                ` : ''}
                                ${safeBook.isbn ? `
                                <div class="detail-item">
                                    <strong>ISBN:</strong> ${safeBook.isbn}
                                </div>
                                ` : ''}
                                <div class="detail-item">
                                    <strong>Genre:</strong> ${safeBook.genre}
                                </div>
                                <div class="detail-item">
                                    <strong>Formats:</strong> ${(safeBook.file_formats || []).join(', ')}
                                </div>
                            </div>
                        </div>
                        <div class="book-description">
                            <h4>Description</h4>
                            <p>${safeBook.description}</p>
                        </div>
                        <div class="download-section">
                            <h4>Download</h4>
                            <div class="download-options">
                                ${downloadOptions}
                            </div>
                        </div>
                        ${affiliateSection}
                    </div>
                </div>
            </div>
        `;
    }

    // Render pagination
    static renderPagination(currentPage, totalPages, pageSize, totalItems) {
        if (totalPages <= 1) return '';
        
        const pages = [];
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        // Previous button
        pages.push(`
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="App.goToPage(${currentPage - 1})">
                Previous
            </button>
        `);
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="App.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        
        // Next button
        pages.push(`
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="App.goToPage(${currentPage + 1})">
                Next
            </button>
        `);
        
        return `
            <div class="pagination">
                ${pages.join('')}
            </div>
        `;
    }
}

// Share functionality
// Share functionality
class Share {
    static shareArticle(articleId) {
        const article = App.data.articles?.find(a => a.id === articleId);
        if (!article) return;

        const shareData = {
            title: article.title,
            text: article.excerpt || article.content.substring(0, 100),
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    }

    static socialShare(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        };
        
        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    // Add these new methods for the article page
    static shareOnTwitter() {
        const text = encodeURIComponent(document.title);
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }

    static shareOnFacebook() {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }

    static copyLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            // Show success message
            this.showCopySuccess();
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    static showCopySuccess() {
        // Create a temporary success message
        const successMsg = document.createElement('div');
        successMsg.textContent = 'Link copied to clipboard!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: var(--shadow);
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
}

// Book management
class BookManager {
    static showBookInfo(bookId) {
        const book = App.data.books.find(b => b.id === bookId);
        if (book) {
            const modalHTML = Components.renderBookInfo(book);
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const modal = document.getElementById(`book-modal-${bookId}`);
            modal.style.display = 'block';
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(bookId);
                }
            });
        }
    }

    static closeModal(bookId) {
        const modal = document.getElementById(`book-modal-${bookId}`);
        if (modal) {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        }
    }
}

// Tracking (for analytics)
class Track {
    static affiliateClick(bookId) {
        console.log('Affiliate link clicked:', bookId);
        // Here you would integrate with your analytics service
    }
    
    static downloadClick(bookId, format) {
        console.log('Download clicked:', bookId, format);
        // Track downloads
    }
}