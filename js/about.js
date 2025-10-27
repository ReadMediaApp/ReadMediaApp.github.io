// about.js - Interactive features for about page
class AboutPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAnimations();
        this.setupTeamHoverEffects();
    }

    setupEventListeners() {
        // Add any interactive elements here
        this.setupValueCards();
        this.setupTimelineAnimation();
    }

    setupAnimations() {
        // Animate stats counting
        this.animateStats();
        
        // Add intersection observer for scroll animations
        this.setupScrollAnimations();
    }

    setupTeamHoverEffects() {
        const teamCards = document.querySelectorAll('.team-card');
        
        teamCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    setupValueCards() {
        const valueCards = document.querySelectorAll('.value-card');
        
        valueCards.forEach(card => {
            card.addEventListener('click', () => {
                // Add pulse animation on click
                card.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    card.style.animation = '';
                }, 500);
            });
        });
    }

    setupTimelineAnimation() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        });

        timelineItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
            observer.observe(item);
        });
    }

    animateStats() {
        const stats = document.querySelectorAll('.stat-number, .impact-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        stats.forEach(stat => {
            observer.observe(stat);
        });
    }

    animateCounter(element) {
        const target = element.textContent;
        const isPercentage = target.includes('%');
        const isRating = target.includes('/');
        
        let finalValue;
        
        if (isPercentage) {
            finalValue = parseInt(target);
        } else if (isRating) {
            finalValue = parseFloat(target);
        } else {
            finalValue = parseInt(target.replace('+', '').replace('K', '000').replace('M', '000000'));
        }

        const duration = 2000;
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;

        const counter = setInterval(() => {
            frame++;
            
            const progress = frame / totalFrames;
            const currentValue = Math.round(finalValue * progress);

            if (isPercentage) {
                element.textContent = currentValue + '%';
            } else if (isRating) {
                element.textContent = currentValue.toFixed(1) + '/5';
            } else {
                let displayValue = currentValue;
                if (finalValue >= 1000) {
                    displayValue = (currentValue / 1000).toFixed(currentValue < 1000 ? 0 : 1) + 'K';
                }
                if (target.includes('+')) {
                    element.textContent = displayValue + '+';
                } else {
                    element.textContent = displayValue;
                }
            }

            if (frame === totalFrames) {
                clearInterval(counter);
                element.textContent = target; // Ensure final value is exact
            }
        }, frameDuration);
    }

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.value-card, .team-card, .testimonial-card, .support-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
}

// Add CSS for animations
const animationStyles = `
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.value-card,
.team-card,
.testimonial-card,
.support-card {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.value-card.animate-in,
.team-card.animate-in,
.testimonial-card.animate-in,
.support-card.animate-in {
    opacity: 1;
    transform: translateY(0);
}

.floating-books .book {
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { 
        transform: translateY(0px) rotate(0deg); 
    }
    50% { 
        transform: translateY(-10px) rotate(5deg); 
    }
}

.cta-card {
    animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
    from {
        box-shadow: 0 16px 48px rgba(26, 35, 126, 0.15);
    }
    to {
        box-shadow: 0 16px 48px rgba(26, 35, 126, 0.25);
    }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AboutPage();
});