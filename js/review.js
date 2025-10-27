// review.js
class ReviewPage {
    constructor() {
        this.reviewId = this.getReviewIdFromURL();
        this.init();
    }

    getReviewIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.reviewId) {
            this.showError('No review ID provided');
            return;
        }

        await this.waitForAppData();
        this.renderReview();
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

    renderReview() {
        const container = document.getElementById('review-detail');
        if (!container) return;

        const reviews = window.readMediaApp.appData.reviews || [];
        const review = reviews.find(r => r.id === this.reviewId);

        if (!review) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Review Not Found</h2>
                    <p>The requested review could not be found.</p>
                    <a href="reviews.html" class="btn btn-primary">Back to Reviews</a>
                </div>
            `;
            return;
        }

        // Get associated book data if available
        const books = window.readMediaApp.appData.books || [];
        const book = review.book_id ? books.find(b => b.id === review.book_id) : null;

        container.innerHTML = `
            <article class="review-article">
                <header class="review-header">
                    <div class="rating large-rating">
                        ${this.renderStars(review.rating)}
                        <span class="rating-text">${review.rating}/5</span>
                    </div>
                    <h1 class="review-title">${this.escapeHtml(review.title)}</h1>
                    <div class="review-meta">
                        <span class="review-author">By ${this.escapeHtml(review.author)}</span>
                        <span>•</span>
                        <time datetime="${review.date}">${this.formatDate(review.date)}</time>
                    </div>
                </header>

                ${book ? `
                    <div class="review-book-info">
                        <h3>Book Information</h3>
                        <div class="book-preview">
                            ${book.cover ? `
                                <img src="${book.cover}" alt="${book.title}" class="book-cover-small">
                            ` : `
                                <div class="book-cover-small placeholder">
                                    <span>📚</span>
                                </div>
                            `}
                            <div class="book-preview-info">
                                <h4>${this.escapeHtml(book.title)}</h4>
                                <p class="book-author">By ${this.escapeHtml(book.author)}</p>
                                ${book.genre ? `<p class="book-genre">${book.genre}</p>` : ''}
                                <a href="book.html?id=${book.id}" class="btn btn-secondary btn-sm">View Book</a>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="review-content">
                    ${this.formatContent(review.content)}
                </div>

                <footer class="review-footer">
                    <div class="review-actions">
                        <a href="reviews.html" class="btn btn-secondary">Back to Reviews</a>
                        ${book ? `<a href="book.html?id=${book.id}" class="btn btn-primary">View Book Details</a>` : ''}
                    </div>
                </footer>
            </article>
        `;
    }

    formatContent(content) {
        if (!content) return '<p>No review content available.</p>';
        
        // Simple formatting for review content
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        return paragraphs.map(paragraph => {
            if (paragraph.startsWith('## ')) {
                return `<h2>${this.escapeHtml(paragraph.substring(3))}</h2>`;
            } else if (paragraph.startsWith('### ')) {
                return `<h3>${this.escapeHtml(paragraph.substring(4))}</h3>`;
            } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                const items = paragraph.split('\n').filter(line => line.startsWith('- ') || line.startsWith('* '));
                return `<ul>${items.map(item => `<li>${this.escapeHtml(item.substring(2))}</li>`).join('')}</ul>`;
            } else if (paragraph.startsWith('> ')) {
                return `<blockquote>${this.escapeHtml(paragraph.substring(2))}</blockquote>`;
            } else {
                return `<p>${this.escapeHtml(paragraph)}</p>`;
            }
        }).join('');
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    showError(message) {
        const container = document.getElementById('review-detail');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <a href="reviews.html" class="btn btn-primary">Back to Reviews</a>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ReviewPage();
});