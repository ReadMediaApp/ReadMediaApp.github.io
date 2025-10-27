// Ko-fi Donation Manager - Super Simple & Reliable
document.addEventListener('DOMContentLoaded', function() {
    let selectedAmount = 0;
    
    // Elements
    const quickAmountButtons = document.querySelectorAll('.quick-amount-btn');
    const customAmountInput = document.getElementById('custom-amount');
    const customDonateButton = document.getElementById('custom-donate');
    const summaryAmount = document.getElementById('summary-amount');
    const totalAmount = document.getElementById('total-amount');
    const kofiButton = document.querySelector('.kofi-button');
    
    // Initialize only if elements exist
    if (summaryAmount && totalAmount) {
        updateSummary();
    }
    
    // Setup event listeners if elements exist
    setupEventListeners();
    
    function setupEventListeners() {
        // Scroll to donation functionality
        document.querySelectorAll('.scroll-to-donate').forEach(button => {
            button.addEventListener('click', function() {
                const quickDonationSection = document.querySelector('.quick-donation');
                if (quickDonationSection) {
                    quickDonationSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Quick amount buttons functionality
        quickAmountButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active state from all buttons
                quickAmountButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Remove active state from custom amount
                if (customAmountInput) {
                    customAmountInput.value = '';
                }
                
                // Add active state to clicked button
                this.classList.add('active');
                
                // Set selected amount
                selectedAmount = parseInt(this.dataset.amount);
                updateSummary();
                updateKoFiLink();
                
                // Scroll to payment section
                scrollToPayment();
            });
        });
        
        // Custom amount selection
        if (customAmountInput && customDonateButton) {
            customDonateButton.addEventListener('click', function() {
                if (customAmountInput.value) {
                    selectedAmount = parseInt(customAmountInput.value) || 0;
                    if (selectedAmount > 0) {
                        // Remove active state from quick buttons
                        quickAmountButtons.forEach(btn => {
                            btn.classList.remove('active');
                        });
                        
                        updateSummary();
                        updateKoFiLink();
                        scrollToPayment();
                    } else {
                        showNotification('Please enter a valid amount', 'error');
                    }
                } else {
                    showNotification('Please enter a donation amount', 'error');
                }
            });
            
            // Enter key support for custom amount
            customAmountInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    customDonateButton.click();
                }
            });
        }
    }
    
    function updateSummary() {
        if (summaryAmount) {
            summaryAmount.textContent = `$${selectedAmount}`;
        }
        if (totalAmount) {
            totalAmount.textContent = `$${selectedAmount}`;
        }
    }
    
    function updateKoFiLink() {
        if (kofiButton && selectedAmount > 0) {
            // Ko-fi supports custom amounts in the URL!
            // Replace 'readmedia' with your actual Ko-fi username
            kofiButton.href = `https://ko-fi.com/readmedia?amount=${selectedAmount}`;
            kofiButton.innerHTML = `<span class="kofi-icon">❤️</span> Donate $${selectedAmount}`;
        }
    }
    
    function scrollToPayment() {
        const paymentSection = document.querySelector('.payment-section');
        if (paymentSection) {
            setTimeout(() => {
                paymentSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300);
        }
    }
    
    // Simple notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Close notification">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            closeNotification(notification);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                closeNotification(notification);
            }
        }, 5000);
        
        function closeNotification(notif) {
            notif.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.remove();
                }
            }, 300);
        }
    }
    
    // Add CSS for animations
    if (!document.querySelector('#donation-styles')) {
        const style = document.createElement('style');
        style.id = 'donation-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.25rem;
                cursor: pointer;
                margin-left: 1rem;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .notification-icon {
                margin-right: 0.5rem;
            }
            
            .notification-message {
                flex: 1;
                margin-right: 1rem;
            }
            
            @media (max-width: 480px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

console.log('Ko-fi donation page loaded successfully!');