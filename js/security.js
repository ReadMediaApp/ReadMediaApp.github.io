// Security measures for static site
class Security {
    static sanitizeHTML(str) {
        if (typeof str !== 'string') return str;
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static validateURL(url) {
        if (!url) return false;
        
        try {
            const parsed = new URL(url, window.location.origin);
            const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
            const allowedDomains = [
                'amazon.com',
                'amazon.co.uk',
                'goodreads.com',
                'bookshop.org',
                'nowpayments.io',
                'amzn.to'
            ];
            
            if (!allowedProtocols.includes(parsed.protocol)) {
                return false;
            }
            
            // For external URLs, check if domain is allowed
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

    static escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static preventXSS(data) {
        if (typeof data === 'string') {
            return this.sanitizeHTML(data);
        }
        if (Array.isArray(data)) {
            return data.map(item => this.preventXSS(item));
        }
        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.preventXSS(value);
            }
            return sanitized;
        }
        return data;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    }
}

// Content Security Policy helper
class CSP {
    static createPolicy() {
        // This would be set via meta tag in production
        const policies = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            'font-src': ["'self'", "https://fonts.gstatic.com"],
            'img-src': ["'self'", "data:", "https:"],
            'connect-src': ["'self'"],
            'frame-src': ["https://nowpayments.io"]
        };
        
        return Object.entries(policies)
            .map(([key, values]) => `${key} ${values.join(' ')}`)
            .join('; ');
    }
}

// Initialize security features
document.addEventListener('DOMContentLoaded', () => {
    // Add CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = CSP.createPolicy();
    document.head.appendChild(cspMeta);
    
    // Secure all external links
    Security.secureExternalLinks();
});

// Secure external links
Security.secureExternalLinks = function() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.hostname !== window.location.hostname) {
            if (!Security.validateURL(link.href)) {
                e.preventDefault();
                console.warn('Blocked potentially unsafe link:', link.href);
                return;
            }
            
            // Add security attributes to external links
            link.setAttribute('rel', 'noopener noreferrer');
            link.setAttribute('target', '_blank');
        }
    });
};