// Modern Scroll Effects and Animations
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all animations
    initScrollAnimations();
    initProductCardAnimations();
    initMobileContactBar();
    initScrollToTop();
    initScrollProgress();
    
    // Update cart count
    updateMobileCartCount();
});

// Scroll-triggered animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Remove observer after animation
                if (!entry.target.classList.contains('permanent-observe')) {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animateElements = document.querySelectorAll(
        '.fade-in-element, .slide-up-section, .staggered-item, .feature-card, ' +
        '.review-card, .city-card, .stat-item, .section-header, .product-card-animated'
    );
    
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // Add staggered animation to product grid
    const productGrid = document.querySelector('.products-grid-modern');
    if (productGrid) {
        const productCards = productGrid.querySelectorAll('.product-card-animated');
        productCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });
    }
}

// Product card hover animations
function initProductCardAnimations() {
    const productCards = document.querySelectorAll('.product-card-animated');
    
    productCards.forEach(card => {
        // Add to cart animation
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Visual feedback
                this.classList.add('added');
                this.disabled = true;
                
                // Get product ID
                const productId = card.dataset.productId || 1;
                
                // Add to cart functionality
                if (typeof addToCart === 'function') {
                    addToCart(parseInt(productId));
                }
                
                // Update mobile cart count
                updateMobileCartCount();
                
                // Reset button after animation
                setTimeout(() => {
                    this.classList.remove('added');
                    this.disabled = false;
                    this.blur();
                }, 2000);
            });
        }
        
        // Quick view functionality
        const quickViewBtn = card.querySelector('.quick-view-btn');
        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const productId = card.dataset.productId || 1;
                if (typeof viewProductDetails === 'function') {
                    viewProductDetails(parseInt(productId));
                }
            });
        }
    });
}

// Mobile contact bar functionality
function initMobileContactBar() {
    const contactBar = document.getElementById('mobileContactBar');
    let lastScrollY = window.scrollY;
    
    // Hide/show contact bar based on scroll direction
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down - hide bar
            contactBar.classList.add('hide-on-scroll');
        } else {
            // Scrolling up - show bar
            contactBar.classList.remove('hide-on-scroll');
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Add active state to buttons
    const contactButtons = contactBar.querySelectorAll('.contact-bar-btn');
    contactButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all buttons
            contactButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');
            
            // Remove active state after delay
            setTimeout(() => {
                this.classList.remove('active');
            }, 1000);
        });
    });
}

// Scroll to top functionality
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTop');
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    document.body.appendChild(scrollProgress);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        // Update scroll progress
        scrollProgress.style.width = scrollPercent + '%';
        
        // Show/hide scroll to top button
        if (scrollTop > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    // Scroll to top click handler
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Scroll progress indicator
function initScrollProgress() {
    // Already handled in initScrollToTop
}

// Update mobile cart count
function updateMobileCartCount() {
    const cartCount = getCartCount();
    const mobileCartCount = document.getElementById('mobileCartCount');
    const cartBadges = document.querySelectorAll('.cart-badge');
    
    if (mobileCartCount) {
        mobileCartCount.setAttribute('data-count', cartCount);
        mobileCartCount.textContent = cartCount;
        
        // Add animation if count changes
        if (parseInt(mobileCartCount.dataset.prevCount || 0) !== cartCount) {
            mobileCartCount.style.animation = 'none';
            mobileCartCount.offsetHeight; // Trigger reflow
            mobileCartCount.style.animation = 'badgePulse 0.5s ease';
            mobileCartCount.dataset.prevCount = cartCount;
        }
    }
    
    // Update all cart badges
    cartBadges.forEach(badge => {
        badge.textContent = cartCount;
    });
}

// Get cart count from localStorage
function getCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        return cart.reduce((total, item) => total + (item.quantity || 1), 0);
    } catch (e) {
        return 0;
    }
}

// Scroll to section function
function scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Open cart function
function openCart() {
    // Trigger existing cart modal
    if (typeof showCartModal === 'function') {
        showCartModal();
    } else if (document.getElementById('cartModal')) {
        document.getElementById('cartModal').style.display = 'flex';
    }
}

// Enhanced product card rendering
function renderAnimatedProductCards() {
    const productGrid = document.getElementById('productsGrid');
    if (!productGrid || !window.products) return;
    
    productGrid.innerHTML = '';
    
    window.products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card-animated';
        productCard.dataset.productId = product.id;
        
        // Calculate discount percentage
        const discount = product.oldPrice ? 
            Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
        
        // Stock status
        const stockClass = product.inStock ? 
            (product.id % 3 === 0 ? 'low-stock' : 'in-stock') : 'out-of-stock';
        const stockText = product.inStock ? 
            (product.id % 3 === 0 ? 'Low Stock' : 'In Stock') : 'Out of Stock';
        
        productCard.innerHTML = `
            <div class="product-card-image-container">
                ${discount > 0 ? `<div class="discount-ribbon">${discount}% OFF</div>` : ''}
                <div class="stock-badge ${stockClass}">${stockText}</div>
                <img src="${product.image}" alt="${product.name}" class="product-card-image" loading="lazy">
                <button class="quick-view-btn" aria-label="Quick view ${product.name}">
                    <i class="ion-ios-eye"></i>
                </button>
            </div>
            <div class="product-card-content">
                <h3 class="product-card-title">${product.name}</h3>
                <p class="product-card-description">${product.description.substring(0, 100)}...</p>
                <div class="product-rating">
                    <div class="star-rating">
                        ${'★'.repeat(Math.floor(product.rating))}${product.rating % 1 ? '½' : ''}
                        ${'☆'.repeat(5 - Math.ceil(product.rating))}
                    </div>
                    <span class="rating-count">(${product.reviews})</span>
                </div>
                <div class="product-price-container">
                    <span class="product-price">₹${product.price}</span>
                    ${product.oldPrice ? `<span class="product-price-old">₹${product.oldPrice}</span>` : ''}
                </div>
                <button class="add-to-cart-btn" data-product-id="${product.id}">
                    <i class="ion-ios-cart"></i> Add to Cart
                </button>
            </div>
        `;
        
        productGrid.appendChild(productCard);
    });
    
    // Reinitialize animations for new cards
    setTimeout(() => {
        initProductCardAnimations();
        initScrollAnimations();
    }, 100);
}

// Performance optimizations
function optimizeAnimations() {
    // Reduce motion for users who prefer it
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
        document.body.classList.add('reduce-motion');
    }
    
    // Throttle scroll events
    let ticking = false;
    const scrollHandler = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                // Scroll-dependent updates here
                ticking = false;
            });
            ticking = true;
        }
    };
    
    window.addEventListener('scroll', scrollHandler, { passive: true });
}

// Initialize optimizations
optimizeAnimations();

// Export functions for global use
window.updateMobileCartCount = updateMobileCartCount;
window.scrollToSection = scrollToSection;
window.openCart = openCart;
window.renderAnimatedProductCards = renderAnimatedProductCards;