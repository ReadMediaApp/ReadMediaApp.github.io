// legal.js - Enhanced functionality for legal pages
class LegalPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSmoothScrolling();
        this.setupTableOfContents();
        this.setupCookiePreferences();
        this.updateLastUpdated();
    }

    setupEventListeners() {
        // Mobile navigation for table of contents
        this.setupMobileTOC();
        
        // Print functionality
        this.setupPrintButton();
        
        // Text size adjustment
        this.setupTextSizeControls();
    }

    setupSmoothScrolling() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL without page jump
                    history.pushState(null, null, anchor.getAttribute('href'));
                }
            });
        });
    }

    setupTableOfContents() {
        const toc = document.querySelector('.legal-toc');
        if (!toc) return;

        // Highlight current section in TOC
        const sections = document.querySelectorAll('.legal-section');
        const links = toc.querySelectorAll('a');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    links.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px'
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    setupMobileTOC() {
        const toc = document.querySelector('.legal-toc');
        if (!toc) return;

        // Create mobile toggle for TOC on small screens
        if (window.innerWidth < 968) {
            const tocToggle = document.createElement('button');
            tocToggle.className = 'toc-toggle';
            tocToggle.innerHTML = `
                <span>Table of Contents</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            
            toc.parentNode.insertBefore(tocToggle, toc);
            toc.style.display = 'none';
            
            tocToggle.addEventListener('click', () => {
                const isOpen = toc.style.display === 'block';
                toc.style.display = isOpen ? 'none' : 'block';
                tocToggle.classList.toggle('open', !isOpen);
            });
        }
    }

    setupCookiePreferences() {
        const form = document.getElementById('cookie-preferences-form');
        if (!form) return;

        // Load saved preferences
        this.loadCookiePreferences();

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCookiePreferences();
            this.showToast('Cookie preferences saved successfully!', 'success');
        });

        // Accept all button
        const acceptAll = document.getElementById('accept-all');
        if (acceptAll) {
            acceptAll.addEventListener('click', () => {
                const checkboxes = form.querySelectorAll('input[type="checkbox"]:not(:disabled)');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = true;
                });
                this.saveCookiePreferences();
                this.showToast('All cookies accepted!', 'success');
            });
        }

        // Reject all button
        const rejectAll = document.getElementById('reject-all');
        if (rejectAll) {
            rejectAll.addEventListener('click', () => {
                const checkboxes = form.querySelectorAll('input[type="checkbox"]:not(:disabled)');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                this.saveCookiePreferences();
                this.showToast('Non-essential cookies rejected!', 'info');
            });
        }
    }

    loadCookiePreferences() {
        const preferences = localStorage.getItem('readmedia_cookie_preferences');
        if (preferences) {
            const prefs = JSON.parse(preferences);
            const form = document.getElementById('cookie-preferences-form');
            
            Object.keys(prefs).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.checked = prefs[key];
                }
            });
        }
    }

    saveCookiePreferences() {
        const form = document.getElementById('cookie-preferences-form');
        const preferences = {};
        
        const inputs = form.querySelectorAll('input[type="checkbox"]:not(:disabled)');
        inputs.forEach(input => {
            preferences[input.name] = input.checked;
        });
        
        localStorage.setItem('readmedia_cookie_preferences', JSON.stringify(preferences));
        
        // Apply preferences (in a real implementation, this would set actual cookies)
        this.applyCookiePreferences(preferences);
    }

    applyCookiePreferences(preferences) {
        // This is a simplified implementation
        // In a real scenario, you would set/remove cookies based on preferences
        
        console.log('Applying cookie preferences:', preferences);
        
        // Example: Set analytics cookie if performance cookies are accepted
        if (preferences.performance) {
            // Set analytics cookie
            document.cookie = "readmedia_analytics=true; max-age=31536000; path=/; samesite=lax";
        } else {
            // Remove analytics cookie
            document.cookie = "readmedia_analytics=; max-age=0; path=/";
        }
        
        // Similar logic for other cookie types...
    }

    setupPrintButton() {
        // Add print button to legal pages
        const printButton = document.createElement('button');
        printButton.className = 'btn btn-secondary print-btn';
        printButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L6 2H18V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 18H4C2.89543 18 2 17.1046 2 16V11C2 9.89543 2.89543 9 4 9H20C21.1046 9 22 9.89543 22 11V16C22 17.1046 21.1046 18 20 18H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 14H18.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="6" y="14" width="12" height="8" rx="1" stroke="currentColor" stroke-width="2"/>
            </svg>
            Print This Page
        `;
        
        printButton.addEventListener('click', () => {
            window.print();
        });
        
        const headerContent = document.querySelector('.page-header-content');
        if (headerContent) {
            headerContent.appendChild(printButton);
        }
    }

    setupTextSizeControls() {
        // Add text size controls for accessibility
        const textSizeControls = document.createElement('div');
        textSizeControls.className = 'text-size-controls';
        textSizeControls.innerHTML = `
            <button class="text-size-btn" data-size="small" aria-label="Decrease text size">A-</button>
            <button class="text-size-btn" data-size="normal" aria-label="Reset text size">A</button>
            <button class="text-size-btn" data-size="large" aria-label="Increase text size">A+</button>
        `;
        
        const headerContent = document.querySelector('.page-header-content');
        if (headerContent) {
            headerContent.appendChild(textSizeControls);
        }
        
        // Text size functionality
        textSizeControls.addEventListener('click', (e) => {
            if (e.target.classList.contains('text-size-btn')) {
                const size = e.target.dataset.size;
                this.adjustTextSize(size);
                
                // Update active state
                textSizeControls.querySelectorAll('.text-size-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    }

    adjustTextSize(size) {
        const legalContent = document.querySelector('.legal-main-content');
        if (!legalContent) return;
        
        legalContent.classList.remove('text-small', 'text-normal', 'text-large');
        legalContent.classList.add(`text-${size}`);
        
        // Save preference
        localStorage.setItem('readmedia_text_size', size);
    }

    updateLastUpdated() {
        // Update "last updated" dates dynamically
        const lastUpdatedElements = document.querySelectorAll('.page-subtitle');
        lastUpdatedElements.forEach(element => {
            if (element.textContent.includes('Last updated:')) {
                const currentDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                element.textContent = `Last updated: ${currentDate}`;
            }
        });
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
            bottom: '20px',
            right: '20px',
            background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '1001',
            transform: 'translateY(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateY(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LegalPage();
});

// Print styles
const printStyles = `
@media print {
    .header,
    .footer,
    .legal-toc,
    .legal-quick-nav,
    .related-legal,
    .cookie-preferences,
    .scroll-top,
    .print-btn,
    .text-size-controls {
        display: none !important;
    }
    
    .legal-layout {
        grid-template-columns: 1fr !important;
    }
    
    .legal-main-content {
        max-width: 100% !important;
    }
    
    body {
        font-size: 12pt;
        line-height: 1.4;
    }
    
    .legal-section {
        break-inside: avoid;
    }
    
    h1, h2, h3 {
        break-after: avoid;
    }
    
    a {
        color: #000 !important;
        text-decoration: underline !important;
    }
    
    .notice-box {
        border: 1px solid #000 !important;
        background: #fff !important;
    }
}
`;

// Add print styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = printStyles;
document.head.appendChild(styleSheet);