// ============================================
// COMPREHENSIVE BUTTON HANDLERS
// All CTA buttons and interactive elements
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeAllButtonHandlers();
});

function initializeAllButtonHandlers() {
    // 1. CALCULATE BRICKS BUTTON
    const calculateBricksBtn = document.getElementById('calculateBricks');
    if (calculateBricksBtn) {
        calculateBricksBtn.addEventListener('click', calculateBricks);
    }
    
    // 2. CTA BUTTONS (CALL & WHATSAPP)
    const callButtons = document.querySelectorAll('.btn-cta-call, [href*="tel:"], .fab-call');
    callButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!this.href || !this.href.startsWith('tel:')) {
                e.preventDefault();
                window.location.href = 'tel:+919198923230';
            }
        });
    });
    
    const whatsappButtons = document.querySelectorAll('.btn-cta-whatsapp, .whatsapp-float, .fab-whatsapp, [href*="wa.me"]');
    whatsappButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!this.href || !this.href.startsWith('http')) {
                e.preventDefault();
                window.open('https://wa.me/919198923230', '_blank');
            }
        });
    });
    
    // 3. FAQ ACCORDION
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isOpen = faqItem.classList.contains('open');
            
            // Close all FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('open');
            });
            
            // Open clicked FAQ if it was closed
            if (!isOpen) {
                faqItem.classList.add('open');
            }
        });
    });
    
    // 4. NEWSLETTER FORM
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('.newsletter-input').value;
            if (email && validateEmail(email)) {
                alert('धन्यवाद! Thank you for subscribing!');
                this.reset();
            } else {
                alert('कृपया एक मान्य ईमेल दर्ज करें / Please enter a valid email');
            }
        });
    }
    
    // 5. PRODUCT ADD TO CART
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-add-cart-modern') || e.target.closest('.btn-add-cart-modern')) {
            const btn = e.target.matches('.btn-add-cart-modern') ? e.target : e.target.closest('.btn-add-cart-modern');
            if (!btn.disabled) {
                const productId = btn.closest('.product-card-modern')?.getAttribute('data-product-id');
                addToCart(productId || 'unknown');
            }
        }
    });
    
    // 6. PRODUCT WISHLIST
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-wishlist-modern') || e.target.closest('.btn-wishlist-modern')) {
            const btn = e.target.matches('.btn-wishlist-modern') ? e.target : e.target.closest('.btn-wishlist-modern');
            btn.classList.toggle('active');
            toggleWishlist(btn);
        }
    });
    
    // 7. QUICK ACTION BUTTONS
    document.addEventListener('click', function(e) {
        if (e.target.closest('.quick-action-btn')) {
            const btn = e.target.closest('.quick-action-btn');
            const productId = btn.closest('.product-card-modern')?.getAttribute('data-product-id');
            
            if (btn.title === 'Quick View' || btn.innerHTML.includes('ion-ios-eye')) {
                quickView(productId);
            } else if (btn.title === 'Add to Wishlist' || btn.innerHTML.includes('ion-ios-heart')) {
                toggleWishlist(btn);
            } else if (btn.title === 'Share' || btn.innerHTML.includes('ion-ios-share')) {
                shareProduct(productId);
            }
        }
    });
    
    // 8. FLOATING ACTION BUTTONS
    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    const chatbotToggle = document.getElementById('chatbotToggle');
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const chatbot = document.getElementById('chatbot');
            if (chatbot) {
                chatbot.classList.toggle('active');
            }
        });
    }
    
    // 9. NAVIGATION TOGGLE
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
        
        // Close menu when a link is clicked
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
    
    // 10. MOBILE MENU - Close on scroll
    window.addEventListener('scroll', function() {
        if (navMenu && navToggle) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
}

// HELPER FUNCTIONS

function calculateBricks() {
    const length = parseFloat(document.getElementById('wallLength')?.value || 0);
    const width = parseFloat(document.getElementById('wallWidth')?.value || 0.23);
    const height = parseFloat(document.getElementById('wallHeight')?.value || 0);
    
    if (!length || !height) {
        alert('कृपया सभी मान भरें / Please enter all values');
        return;
    }
    
    const wallArea = (length * height) / (0.23 * 0.11);
    const bricks = Math.ceil(wallArea);
    const cement = (bricks * 0.0625) / 50;
    const sand = (bricks * 0.115) / 1000;
    const cost = bricks * 10;
    
    document.getElementById('resultBricks').textContent = bricks;
    document.getElementById('resultCement').textContent = Math.ceil(cement) + ' bags';
    document.getElementById('resultSand').textContent = Math.ceil(sand) + ' cubic meters';
    document.getElementById('resultCost').textContent = '₹' + Math.ceil(cost);
    document.getElementById('resultDelivery').textContent = 'Available';
}

function addToCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const product = { id: productId, quantity: 1, addedAt: new Date().toISOString() };
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.textContent = cart.length;
    }
    
    showNotification('✓ Product added to cart!', 'success');
}

function toggleWishlist(btn) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const productId = btn.closest('.product-card-modern')?.getAttribute('data-product-id');
    
    if (btn.classList.contains('active')) {
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
        }
        showNotification('❤ Added to wishlist', 'success');
    } else {
        const index = wishlist.indexOf(productId);
        if (index > -1) {
            wishlist.splice(index, 1);
        }
        showNotification('Removed from wishlist', 'info');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function quickView(productId) {
    alert('Quick view for product ' + productId);
}

function shareProduct(productId) {
    if (navigator.share) {
        navigator.share({
            title: 'Gurukripa Bricks',
            text: 'Check out this amazing brick product!',
            url: window.location.href
        });
    } else {
        const text = 'Check out this product: ' + window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            showNotification('Link copied to clipboard!', 'success');
        }
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;
    
    const bgColor = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        background: ${bgColor};
        color: white;
        border-radius: 6px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// GLOBAL FUNCTIONS (for onclick handlers)
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.quickView = quickView;
window.shareProduct = shareProduct;
window.calculateBricks = calculateBricks;
