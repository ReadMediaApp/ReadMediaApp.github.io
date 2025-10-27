// contact.js - Contact form functionality with Google Apps Script
class ContactForm {
    constructor() {
        // Replace this with your actual Google Apps Script URL
        this.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYkfsZZnwYpi3M61YgfpOzxu0rcfQ7O2Do2irnzwXuI50Xkmlxt_qCjiGhYVN6RZLS-g/exec';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupCharacterCounter();
    }

    setupEventListeners() {
        const form = document.getElementById('contact-form');
        const submitBtn = document.getElementById('submit-btn');
        const sendAnotherBtn = document.getElementById('send-another');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (sendAnotherBtn) {
            sendAnotherBtn.addEventListener('click', () => this.resetForm());
        }

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupFormValidation() {
        // Add custom validation methods
        this.setupCustomValidation();
    }

    setupCustomValidation() {
        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmail(emailInput);
            });
        }

        // Message length validation
        const messageInput = document.getElementById('message');
        if (messageInput) {
            messageInput.addEventListener('blur', () => {
                this.validateMessageLength(messageInput);
            });
        }
    }

    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearError(input);
                
                if (input.id === 'message') {
                    this.updateCharacterCounter();
                }
            });

            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    setupCharacterCounter() {
        const messageInput = document.getElementById('message');
        const charCounter = document.getElementById('char-counter');

        if (messageInput && charCounter) {
            messageInput.addEventListener('input', () => {
                this.updateCharacterCounter();
            });
        }
    }

    updateCharacterCounter() {
        const messageInput = document.getElementById('message');
        const charCounter = document.getElementById('char-counter');
        
        if (messageInput && charCounter) {
            const length = messageInput.value.length;
            charCounter.textContent = length;

            // Add warning class if approaching limit
            if (length > 900) {
                charCounter.style.color = '#f50057';
            } else if (length > 750) {
                charCounter.style.color = '#ff9800';
            } else {
                charCounter.style.color = '';
            }
        }
    }

    validateField(field) {
        switch (field.type) {
            case 'email':
                return this.validateEmail(field);
            case 'text':
                return this.validateText(field);
            case 'textarea':
                return this.validateMessageLength(field);
            case 'select-one':
                return this.validateSelect(field);
            default:
                return this.validateRequired(field);
        }
    }

    validateEmail(input) {
        const value = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!value) {
            return this.showError(input, 'Email address is required');
        }
        
        if (!emailRegex.test(value)) {
            return this.showError(input, 'Please enter a valid email address');
        }
        
        this.clearError(input);
        return true;
    }

    validateText(input) {
        const value = input.value.trim();
        
        if (!value) {
            return this.showError(input, 'This field is required');
        }
        
        if (value.length < 2) {
            return this.showError(input, 'Please enter at least 2 characters');
        }
        
        this.clearError(input);
        return true;
    }

    validateMessageLength(input) {
        const value = input.value.trim();
        
        if (!value) {
            return this.showError(input, 'Message is required');
        }
        
        if (value.length < 10) {
            return this.showError(input, 'Please enter at least 10 characters');
        }
        
        if (value.length > 1000) {
            return this.showError(input, 'Message must be less than 1000 characters');
        }
        
        this.clearError(input);
        return true;
    }

    validateSelect(select) {
        const value = select.value;
        
        if (!value) {
            return this.showError(select, 'Please select a subject');
        }
        
        this.clearError(select);
        return true;
    }

    validateRequired(field) {
        const value = field.value.trim();
        
        if (!value) {
            return this.showError(field, 'This field is required');
        }
        
        this.clearError(field);
        return true;
    }

    showError(field, message) {
        this.clearError(field);
        
        field.classList.add('error');
        
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        return false;
    }

    clearError(field) {
        field.classList.remove('error');
        
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    validateForm() {
        const fields = [
            document.getElementById('name'),
            document.getElementById('email'),
            document.getElementById('subject'),
            document.getElementById('message')
        ];

        let isValid = true;

        fields.forEach(field => {
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }
    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            this.showToast('Please fix the errors in the form', 'error');
            return;
        }

        const form = e.target;
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';

        try {
            // Convert form data to URL-encoded format
            const formData = new FormData(form);
            const urlEncodedData = new URLSearchParams();
            
            // Add all form data
            for (const [key, value] of formData) {
                urlEncodedData.append(key, value);
            }
            
            // Add additional data
            urlEncodedData.append('timestamp', new Date().toISOString());
            urlEncodedData.append('source', 'ReadMedia Contact Form');
            urlEncodedData.append('userAgent', navigator.userAgent);

            // Use Google Apps Script specific approach
            const scriptURL = this.SCRIPT_URL;
            
            // Create a hidden iframe to handle the POST request (bypasses CORS)
            const iframe = document.createElement('iframe');
            iframe.name = 'form-submission-iframe';
            iframe.style.display = 'none';
            
            // Create a form that targets the iframe
            const tempForm = document.createElement('form');
            tempForm.style.display = 'none';
            tempForm.method = 'POST';
            tempForm.action = scriptURL;
            tempForm.target = iframe.name;
            
            // Add all form data as hidden inputs
            for (const [key, value] of urlEncodedData) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                tempForm.appendChild(input);
            }
            
            document.body.appendChild(iframe);
            document.body.appendChild(tempForm);
            
            // Submit the form
            tempForm.submit();
            
            // Wait a bit then check for success (we can't get response due to CORS)
            setTimeout(() => {
                this.showSuccess();
                this.showToast('Message sent successfully!', 'success');
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    document.body.removeChild(tempForm);
                }, 1000);
            }, 2000);

        } catch (error) {
            console.error('Form submission error:', error);
            this.showToast('There was an error sending your message. Please try again.', 'error');
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
        }
    }

    showSuccess() {
        const form = document.getElementById('contact-form');
        const successMessage = document.getElementById('success-message');

        if (form && successMessage) {
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Scroll to success message
            successMessage.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    resetForm() {
        const form = document.getElementById('contact-form');
        const successMessage = document.getElementById('success-message');

        if (form && successMessage) {
            form.reset();
            form.style.display = 'block';
            successMessage.style.display = 'none';
            
            // Clear all errors
            const errors = document.querySelectorAll('.form-error');
            errors.forEach(error => {
                error.textContent = '';
                error.style.display = 'none';
            });
            
            const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
            inputs.forEach(input => {
                input.classList.remove('error');
            });
            
            // Reset character counter
            this.updateCharacterCounter();
            
            // Scroll to form
            form.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
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
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactForm();
});