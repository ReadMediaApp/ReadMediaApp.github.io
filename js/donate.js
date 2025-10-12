// Donation page functionality
class DonatePage {
    static init() {
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Custom amount buttons
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = e.target.dataset.amount;
                document.getElementById('custom-amount').value = amount;
            });
        });

        // Custom donation button
        document.getElementById('custom-donate-btn').addEventListener('click', () => {
            this.handleCustomDonation();
        });

        // Enter key on custom amount input
        document.getElementById('custom-amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleCustomDonation();
            }
        });
    }

    static handleCustomDonation() {
        const amountInput = document.getElementById('custom-amount');
        const amount = parseInt(amountInput.value);

        if (!amount || amount < 1) {
            this.showError('Please enter a valid amount (minimum $1)');
            amountInput.focus();
            return;
        }

        if (amount > 1000) {
            this.showError('Maximum donation amount is $1000');
            amountInput.focus();
            return;
        }

        // Redirect to payment with custom amount
        const donateUrl = `https://wpayments.io/donation/readmedia?amount=${amount}`;
        window.open(donateUrl, '_blank');
    }

    static showError(message) {
        // Remove existing error message
        const existingError = document.querySelector('.donation-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'donation-error';
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
            border: 1px solid #f5c6cb;
        `;
        errorDiv.textContent = message;

        // Insert before custom donation section
        const customSection = document.querySelector('.custom-donation');
        customSection.insertBefore(errorDiv, customSection.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    DonatePage.init();
});