// Section Fixes JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== FAQ Accordion =====
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // ===== Brick Calculator =====
    const calcBtn = document.getElementById('calculateBricks');
    const wallLength = document.getElementById('wallLength');
    const wallWidth = document.getElementById('wallWidth');
    const wallHeight = document.getElementById('wallHeight');
    const brickType = document.getElementById('brickType');
    
    if (calcBtn) {
        calcBtn.addEventListener('click', function() {
            // Add loading state
            this.classList.add('loading');
            this.disabled = true;
            
            // Get values
            const length = parseFloat(wallLength.value) || 0;
            const width = parseFloat(wallWidth.value) || 0.23;
            const height = parseFloat(wallHeight.value) || 0;
            const type = brickType.value;
            
            // Simple calculation (you can make this more complex)
            const wallVolume = length * width * height;
            const brickVolume = 0.23 * 0.115 * 0.075; // Standard brick size
            let bricksNeeded = Math.ceil(wallVolume / brickVolume);
            
            // Add 10% wastage
            bricksNeeded = Math.ceil(bricksNeeded * 1.1);
            
            // Calculate materials
            const cementBags = Math.ceil(bricksNeeded * 0.002); // 2 bags per 1000 bricks
            const sandCubicFeet = Math.ceil(bricksNeeded * 0.004); // 4 cubic feet per 1000 bricks
            const deliveryAvailable = (length > 0 && height > 0) ? 'Yes' : 'No';
            
            // Set prices based on type
            let pricePerBrick = 8;
            switch(type) {
                case 'shiv': pricePerBrick = 10; break;
                case 'premium': pricePerBrick = 12; break;
                case 'machine': pricePerBrick = 9; break;
            }
            
            const totalCost = bricksNeeded * pricePerBrick;
            
            // Update results
            setTimeout(() => {
                document.getElementById('resultBricks').textContent = bricksNeeded.toLocaleString();
                document.getElementById('resultCement').textContent = cementBags + ' bags';
                document.getElementById('resultSand').textContent = sandCubicFeet + ' cu.ft';
                document.getElementById('resultCost').textContent = '₹' + totalCost.toLocaleString();
                document.getElementById('resultDelivery').textContent = deliveryAvailable;
                
                // Remove loading state
                this.classList.remove('loading');
                this.disabled = false;
            }, 800);
        });
    }
    
    // ===== Form Validation =====
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('.submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const originalText = btnText.textContent;
            
            // Add loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            btnText.textContent = 'Sending...';
            
            // Simple validation
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const phone = document.getElementById('contactPhone').value.trim();
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value.trim();
            
            if (!name || !email || !phone || !subject || !message) {
                alert('Please fill in all required fields');
                resetButton();
                return;
            }
            
            // Simple email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                resetButton();
                return;
            }
            
            // Simulate form submission
            setTimeout(() => {
                alert('Thank you for your message! We will get back to you soon.');
                this.reset();
                resetButton();
            }, 1500);
            
            function resetButton() {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                btnText.textContent = originalText;
            }
        });
    }
    
    // ===== Smooth Scrolling for Navigation =====
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update active nav link
                    navLinks.forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });
    
    // ===== Navigation Active State Management =====
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
        
        // Special handling for home/hero section
        if (window.scrollY < 100) {
            navLinks.forEach(link => link.classList.remove('active'));
            document.querySelector('[href="#home"]').classList.add('active');
        }
    }

    // Update active nav on scroll
    window.addEventListener('scroll', updateActiveNav);

    // ===== Mobile Navigation =====
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerClose = document.getElementById('drawerClose');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    if (mobileDrawer && drawerOverlay) {
        // Open drawer
        navToggle?.addEventListener('click', () => {
            mobileDrawer.classList.add('active');
            drawerOverlay.classList.add('active');
        });
        
        // Close drawer
        const closeDrawer = () => {
            mobileDrawer.classList.remove('active');
            drawerOverlay.classList.remove('active');
        };
        
        drawerClose?.addEventListener('click', closeDrawer);
        drawerOverlay?.addEventListener('click', closeDrawer);
    }
    
    // ===== Scroll Animation Observer =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe sections for animation
    const animateSections = document.querySelectorAll('.section, .grade-card, .blog-card, .contact-item');
    animateSections.forEach(section => {
        observer.observe(section);
    });
    
    // ===== Header Scroll Effect =====
    const header = document.querySelector('.modern-nav');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        // Hide/show header on scroll (optional)
        if (window.scrollY > lastScrollY && window.scrollY > 200) {
            header?.classList.add('hidden');
        } else {
            header?.classList.remove('hidden');
        }
        
        lastScrollY = window.scrollY;
    });
    
    // ===== Mobile Quick Contact Bar =====
    const mobileContactBar = document.getElementById('mobileContactBar');
    if (mobileContactBar) {
        // Show/hide based on scroll
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    if (window.scrollY > 300) {
                        mobileContactBar.style.transform = 'translateY(0)';
                    } else {
                        mobileContactBar.style.transform = 'translateY(100%)';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    // ===== Button Ripple Effect =====
    const buttons = document.querySelectorAll('.btn, .btn-icon, .submit-btn, .calc-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

// ===== Utility Functions =====
function scrollToSection(selector) {
    const section = document.querySelector(selector);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}