// Security measures for content-only static site
class Security {
    static init() {
        // this.protectDeveloperTools();
        this.secureExternalLinks();
        this.initPageProtection();
        this.initBotDetection();
    }

    // Developer Tools Protection
    // static protectDeveloperTools() {
    //     // Detect F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    //     document.addEventListener('keydown', (e) => {
    //         if (
    //             e.key === 'F12' ||
    //             (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
    //             (e.ctrlKey && e.key === 'u')
    //         ) {
    //             e.preventDefault();
    //             this.redirectToSocialHub();
    //             return false;
    //         }
    //     });

    //     // Detect right-click context menu
    //     document.addEventListener('contextmenu', (e) => {
    //         e.preventDefault();
    //         this.redirectToSocialHub();
    //         return false;
    //     });

    //     // Detect DevTools opening
    //     this.detectDevTools();
    // }

    // static detectDevTools() {
    //     // Check console size difference
    //     const checkConsole = () => {
    //         const threshold = 100;
    //         if (window.outerWidth - window.innerWidth > threshold ||
    //             window.outerHeight - window.innerHeight > threshold) {
    //             this.redirectToSocialHub();
    //         }
    //     };

    //     // Check debugger
    //     const checkDebugger = () => {
    //         const start = Date.now();
    //         debugger;
    //         if (Date.now() - start > 100) {
    //             this.redirectToSocialHub();
    //         }
    //     };

    //     // Run checks
    //     setInterval(checkConsole, 1000);
    //     setInterval(checkDebugger, 3000);
    // }

    static redirectToSocialHub() {
        // Show warning then redirect to social hub
        this.showSecurityWarning();
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = '../social.html';
        }, 3000);
    }

    static showSecurityWarning() {
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                font-family: 'Arial', sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="background: #ff4444; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                    <h1 style="font-size: 2.5em; margin: 0; color: white;">⚠️ SECURITY WARNING</h1>
                </div>
                
                <p style="font-size: 1.3em; margin-bottom: 15px; color: #ff6b6b;">
                    Developer tools detection triggered
                </p>
                
                <p style="font-size: 1.1em; margin-bottom: 10px; color: #ccc;">
                    This action has been logged for security purposes
                </p>
                
                <p style="font-size: 1em; color: #888; margin-top: 30px;">
                    Redirecting to our social media hub in <span id="countdown">3</span> seconds...
                </p>
                
                <div style="margin-top: 40px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <p style="margin: 0; font-size: 0.9em; color: #aaa;">
                        Follow us on social media for updates and content
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(warning);

        // Countdown timer
        let countdown = 3;
        const countdownEl = document.getElementById('countdown');
        const timer = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    }

    // Basic bot detection for content scraping protection
    static initBotDetection() {
        const userAgent = navigator.userAgent.toLowerCase();
        const botIndicators = [
            'headless', 'phantom', 'puppeteer', 'selenium',
            'webdriver', 'crawler', 'spider', 'bot'
        ];

        if (botIndicators.some(indicator => userAgent.includes(indicator))) {
            this.redirectToSocialHub();
        }

        // REMOVED scrolling detection as it blocks normal user behavior
    }

    // Page protection for content
    static initPageProtection() {
        // REMOVED text selection prevention - allows normal text selection
        
        // Prevent drag/drop of images (less intrusive)
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });

        // Disable right-click on images only
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        });
    }

    // Secure external links
    static secureExternalLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.hostname !== window.location.hostname) {
                if (!this.validateURL(link.href)) {
                    e.preventDefault();
                    return;
                }
                
                link.setAttribute('rel', 'noopener noreferrer');
                link.setAttribute('target', '_blank');
            }
        });

        // Secure all existing external links
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (link.hostname !== window.location.hostname) {
                link.setAttribute('rel', 'noopener noreferrer');
                link.setAttribute('target', '_blank');
            }
        });
    }

    static validateURL(url) {
        if (!url) return false;
        
        try {
            const parsed = new URL(url, window.location.origin);
            const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
            const allowedDomains = [
                'amazon.com', 'amazon.co.uk', 'amzn.to',
                'goodreads.com', 'bookshop.org', 
                'nowpayments.io', 'telegram.me', 't.me',
                'facebook.com', 'youtube.com', 'twitter.com',
                'x.com', 'instagram.com'
            ];
            
            if (!allowedProtocols.includes(parsed.protocol)) return false;
            
            if (parsed.hostname !== window.location.hostname) {
                const domain = parsed.hostname.replace('www.', '');
                if (!allowedDomains.some(allowed => domain.endsWith(allowed))) {
                    return false;
                }
            }
            
            return true;
        } catch {
            return false;
        }
    }

    // Content sanitization
    static sanitizeHTML(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Prevent XSS in dynamic content
    static preventXSS(data) {
        if (typeof data === 'string') return this.sanitizeHTML(data);
        if (Array.isArray(data)) return data.map(item => this.preventXSS(item));
        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.preventXSS(value);
            }
            return sanitized;
        }
        return data;
    }
}

// Content Security Policy
class CSP {
    static createPolicy() {
        const policies = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            'font-src': ["'self'", "https://fonts.gstatic.com"],
            'img-src': ["'self'", "data:", "https:"],
            'connect-src': ["'self'"],
            'frame-src': ["https://nowpayments.io"],
            'media-src': ["'self'"],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"]
        };
        
        return Object.entries(policies)
            .map(([key, values]) => `${key} ${values.join(' ')}`)
            .join('; ');
    }
}

// Initialize security when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add CSP
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = CSP.createPolicy();
    document.head.appendChild(cspMeta);
    
    // Initialize security features
    Security.init();
    
    console.log('🔒 Security features activated');
});