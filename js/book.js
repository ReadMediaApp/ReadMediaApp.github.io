// book.js
class BookPage {
    constructor() {
        this.bookId = this.getBookIdFromURL();
        this.init();
    }

    getBookIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.bookId) {
            this.showError('No book ID provided');
            return;
        }

        await this.waitForAppData();
        this.renderBook();
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

    renderBook() {
        const container = document.getElementById('book-detail');
        if (!container) return;

        const books = window.readMediaApp.appData.books || [];
        const book = books.find(b => b.id === this.bookId);

        if (!book) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Book Not Found</h2>
                    <p>The requested book could not be found.</p>
                    <a href="books.html" class="btn btn-primary">Back to Books</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="book-header">
                <div class="book-cover">
                    ${book.cover ? `
                        <img src="${book.cover}" alt="${book.title}" class="book-cover-image">
                    ` : `
                        <div class="book-cover-placeholder">
                            <span>📚</span>
                        </div>
                    `}
                </div>
                <div class="book-info">
                    <h1 class="book-title">${this.escapeHtml(book.title)}</h1>
                    <div class="book-author">By ${this.escapeHtml(book.author)}</div>
                    <div class="book-meta">
                        ${book.year ? `<span class="meta-item">Published: ${book.year}</span>` : ''}
                        ${book.genre ? `<span class="meta-item">Genre: ${book.genre}</span>` : ''}
                        ${book.pages ? `<span class="meta-item">Pages: ${book.pages}</span>` : ''}
                    </div>
                    <div class="book-actions">
                        ${this.getBookActions(book)}
                    </div>
                </div>
            </div>
            <div class="book-content">
                <div class="book-description">
                    <h2>Description</h2>
                    <p>${this.escapeHtml(book.description)}</p>
                </div>
                ${book.tags && book.tags.length > 0 ? `
                    <div class="book-tags">
                        <h3>Tags</h3>
                        <div class="tags-list">
                            ${book.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getBookActions(book) {
        const actions = [];
        
        if (book.file_formats && book.file_formats.length > 0) {
            actions.push(`
                <a href="${book.download_links?.pdf || '#'}" class="btn btn-primary" download>
                    Download PDF
                </a>
            `);
        }
        
        if (book.affiliate_link) {
            actions.push(`
                <a href="${book.affiliate_link}" target="_blank" rel="noopener" class="btn btn-secondary">
                    Buy on Amazon
                </a>
            `);
        }

        return actions.join('');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const container = document.getElementById('book-detail');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <a href="books.html" class="btn btn-primary">Back to Books</a>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookPage();
});