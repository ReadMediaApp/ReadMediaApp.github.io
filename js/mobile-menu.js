// Mobile Menu Toggle Handler
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        // Toggle menu on click
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            
            // Update icon
            const icon = navToggle.querySelector('.material-icons');
            if (icon) {
                icon.textContent = navMenu.classList.contains('active') ? 'close' : 'menu';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('.material-icons');
                if (icon) {
                    icon.textContent = 'menu';
                }
            }
        });
        
        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('.material-icons');
                if (icon) {
                    icon.textContent = 'menu';
                }
            });
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768) {
                    navMenu.classList.remove('active');
                    const icon = navToggle.querySelector('.material-icons');
                    if (icon) {
                        icon.textContent = 'menu';
                    }
                }
            }, 250);
        });
    }
    
    // Set active navigation item based on current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        // Remove active class from all links first
        link.classList.remove('active');
        
        // Get the href and check if it matches current path
        const href = link.getAttribute('href');
        if (href) {
            // Handle both full path and just filename
            const linkPath = href.split('/').pop() || 'index.html';
            const currentFile = currentPath.split('/').pop() || 'index.html';
            
            if (linkPath === currentFile) {
                link.classList.add('active');
            }
        }
    });
});