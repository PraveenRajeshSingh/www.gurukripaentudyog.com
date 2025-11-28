/* ============================================
   GURUKRIPA EENT UDYOG - PREMIUM REDESIGN JS
   Interactive Features & Animations
   ============================================ */

// ============================================
// BRICK CALCULATOR
// ============================================
function initBrickCalculator() {
    const calculateBtn = document.getElementById('calculateBricks');
    const resultsDiv = document.getElementById('calcResults');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            const length = parseFloat(document.getElementById('wallLength').value) || 0;
            const width = parseFloat(document.getElementById('wallWidth').value) || 0;
            const height = parseFloat(document.getElementById('wallHeight').value) || 0;
            const brickType = document.getElementById('brickType').value;
            
            if (length > 0 && height > 0) {
                // Calculate wall area in square meters
                const wallArea = length * height;
                
                // Standard brick dimensions (in meters)
                // Standard brick: 0.23m x 0.11m = 0.0253 sq m
                const brickArea = 0.0253;
                const mortar = 0.012; // 1.2cm mortar thickness
                
                // Calculate bricks needed (with 10% wastage)
                const totalBricksRaw = wallArea / (brickArea + mortar);
                const totalBricks = Math.ceil(totalBricksRaw * 1.1);
                
                // Calculate cement and sand
                // For 1000 bricks: 0.3 cubic meter cement, 0.45 cubic meter sand
                const cementBags = Math.ceil((totalBricks / 1000) * 6); // 6 bags per 1000 bricks
                const sandCubicMeter = ((totalBricks / 1000) * 0.45).toFixed(2);
                
                // Calculate cost based on brick type
                let pricePerBrick = 8; // Default price
                switch(brickType) {
                    case 'shiv':
                        pricePerBrick = 10;
                        break;
                    case 'premium':
                        pricePerBrick = 12;
                        break;
                    case 'standard':
                        pricePerBrick = 8;
                        break;
                    case 'machine':
                        pricePerBrick = 9;
                        break;
                }
                
                const bricksCost = totalBricks * pricePerBrick;
                const cementCost = cementBags * 350; // ₹350 per bag
                const sandCost = parseFloat(sandCubicMeter) * 1500; // ₹1500 per cubic meter
                const totalCost = bricksCost + cementCost + sandCost;
                
                // Display results
                document.getElementById('resultBricks').textContent = totalBricks.toLocaleString('en-IN');
                document.getElementById('resultCement').textContent = `${cementBags} bags`;
                document.getElementById('resultSand').textContent = `${sandCubicMeter} m³`;
                document.getElementById('resultCost').textContent = `₹${totalCost.toLocaleString('en-IN')}`;
                document.getElementById('resultDelivery').textContent = 'Available in Jaunpur';
                
                resultsDiv.classList.add('show');
                
                // Smooth scroll to results
                resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                alert('कृपया सभी आवश्यक फ़ील्ड भरें / Please fill all required fields');
            }
        });
    }
}

// ============================================
// FAQ ACCORDION
// ============================================
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// ============================================
// VIDEO PLAYER
// ============================================
function initVideoPlayer() {
    const videoPlaceholder = document.querySelector('.video-placeholder');
    const playButton = document.querySelector('.video-play-button');
    
    if (videoPlaceholder && playButton) {
        playButton.addEventListener('click', function() {
            // Replace with actual video embed
            const videoEmbed = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                ></iframe>
            `;
            videoPlaceholder.innerHTML = videoEmbed;
        });
    }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Add specific animation classes
                if (entry.target.classList.contains('stat-card-important')) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                } else if (entry.target.classList.contains('feature-card')) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                } else if (entry.target.classList.contains('review-card')) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                }
            }
        });
    }, observerOptions);
    
    // Observe elements
    const animatedElements = document.querySelectorAll('.stat-card-important, .feature-card, .review-card, .category-card, .blog-card');
    animatedElements.forEach(el => observer.observe(el));
}

// ============================================
// CATEGORY FILTER
// ============================================
function setCategoryFilter(category) {
    const categoryButtons = document.querySelectorAll('.category-card');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const selectedCategory = this.dataset.category;
            
            // Trigger product filter
            if (typeof setCategory === 'function') {
                setCategory(selectedCategory);
            }
            
            // Smooth scroll to products section
            const productsSection = document.getElementById('products');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// PARALLAX HERO EFFECT
// ============================================
function initParallaxHero() {
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            
            // Only apply on desktop
            if (window.innerWidth > 768) {
                heroSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
            }
        });
    }
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const offsetTop = target.offsetTop - 110; // Account for fixed header
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// LAZY LOAD IMAGES
// ============================================
function initLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ============================================
// COUNTER ANIMATION
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const target = parseInt(entry.target.dataset.target);
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        entry.target.textContent = target.toLocaleString('en-IN');
                        clearInterval(timer);
                    } else {
                        entry.target.textContent = Math.floor(current).toLocaleString('en-IN');
                    }
                }, 16);
                
                entry.target.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
}

// ============================================
// PRODUCT IMAGE QUALITY FIX
// ============================================
function fixProductImages() {
    const productImages = document.querySelectorAll('.product-image');
    
    productImages.forEach(img => {
        // Add loading attribute
        img.setAttribute('loading', 'lazy');
        
        // Add error handler
        img.addEventListener('error', function() {
            this.src = 'assets/resources/img/redbrick1.jpg'; // Fallback image
        });
        
        // Ensure sharp rendering
        img.style.imageRendering = 'crisp-edges';
        img.style.imageRendering = '-webkit-optimize-contrast';
    });
}

// ============================================
// FIX FLOATING BUTTONS OVERLAP
// ============================================
function fixFloatingButtons() {
    const whatsappBtn = document.querySelector('.whatsapp-float');
    const scrollTopBtn = document.querySelector('.scroll-top');
    const chatbotBtn = document.querySelector('.chatbot-toggle');
    
    // Ensure proper z-index and positioning
    if (whatsappBtn) {
        whatsappBtn.style.zIndex = '998';
        whatsappBtn.style.bottom = '30px';
        whatsappBtn.style.left = '30px';
    }
    
    if (scrollTopBtn) {
        scrollTopBtn.style.zIndex = '998';
        scrollTopBtn.style.bottom = '30px';
        scrollTopBtn.style.right = '30px';
    }
    
    if (chatbotBtn) {
        chatbotBtn.style.zIndex = '999999';
        chatbotBtn.style.bottom = '100px';
        chatbotBtn.style.right = '30px';
    }
}

// ============================================
// FIX FOOTER WHITE SPACE
// ============================================
function fixFooterWhiteSpace() {
    const footer = document.querySelector('.footer');
    
    if (footer) {
        footer.style.margin = '0';
        footer.style.padding = '60px 0 0';
        footer.style.width = '100%';
        
        const footerBottom = document.querySelector('.footer-bottom');
        if (footerBottom) {
            footerBottom.style.margin = '0';
        }
    }
    
    // Remove any extra divs after footer
    const body = document.body;
    const lastElement = body.lastElementChild;
    
    if (lastElement && lastElement !== footer && lastElement.offsetHeight < 10) {
        lastElement.remove();
    }
}

// ============================================
// MOBILE NAVIGATION
// ============================================
function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }
}

// ============================================
// FILTER SIDEBAR TOGGLE (MOBILE)
// ============================================
function toggleFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    
    if (sidebar) {
        sidebar.classList.toggle('active');
        
        // Prevent body scroll when sidebar is open
        if (sidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
}

// ============================================
// BLOG GRID SPACING FIX
// ============================================
function fixBlogSpacing() {
    const blogGrid = document.querySelector('.blog-grid');
    
    if (blogGrid) {
        blogGrid.style.display = 'grid';
        blogGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        blogGrid.style.gap = '30px';
        blogGrid.style.marginTop = '40px';
    }
}

// ============================================
// INITIALIZE ALL FEATURES
// ============================================
function initRedesignFeatures() {
    console.log('🎨 Initializing Premium Redesign Features...');
    
    // Initialize all features
    initBrickCalculator();
    initFAQAccordion();
    initVideoPlayer();
    initScrollAnimations();
    setCategoryFilter();
    initParallaxHero();
    initSmoothScroll();
    initLazyLoad();
    animateCounters();
    fixProductImages();
    fixFloatingButtons();
    fixFooterWhiteSpace();
    initMobileNav();
    fixBlogSpacing();
    
    console.log('✅ Premium Redesign Features Initialized');
}

// ============================================
// RUN ON DOM READY
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRedesignFeatures);
} else {
    initRedesignFeatures();
}

// Also run after a short delay to ensure all elements are loaded
setTimeout(initRedesignFeatures, 500);

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================
function initAccessibility() {
    // Add keyboard navigation support
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea');
    
    focusableElements.forEach(el => {
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                if (this.tagName !== 'INPUT' && this.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.click();
                }
            }
        });
    });
    
    // Add skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#products';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--brick-orange);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 100000;
    `;
    skipLink.addEventListener('focus', function() {
        this.style.top = '0';
    });
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Initialize accessibility features
setTimeout(initAccessibility, 100);

// ============================================
// PERFORMANCE MONITORING
// ============================================
if (window.performance && window.performance.timing) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            console.log(`⚡ Page Load Time: ${pageLoadTime}ms`);
            
            if (pageLoadTime > 3000) {
                console.warn('⚠️ Page load time is slower than recommended');
            } else {
                console.log('✅ Page load time is optimal');
            }
        }, 0);
    });
}

// Export functions for global use
window.toggleFilterSidebar = toggleFilterSidebar;
