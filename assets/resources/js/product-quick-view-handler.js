// ============================================
// PRODUCT QUICK VIEW & ANIMATIONS
// ============================================

class QuickViewModal {
    constructor() {
        this.modal = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.addScrollAnimations();
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn[title="Quick View"]') || 
                e.target.closest('.quick-action-btn i.ion-ios-eye')) {
                const card = e.target.closest('.product-card-modern');
                if (card) {
                    const productId = card.getAttribute('data-product-id');
                    this.openQuickView(productId);
                }
            }
        });
    }
    
    openQuickView(productId) {
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;
        
        const productData = this.getProductData(card);
        this.showModal(productData);
    }
    
    getProductData(card) {
        return {
            id: card.getAttribute('data-product-id'),
            category: card.querySelector('.product-category-modern')?.textContent || 'Product',
            name: card.querySelector('.product-name-modern')?.textContent || 'Product Name',
            image: card.querySelector('.product-image-modern')?.src || '',
            price: card.querySelector('.product-price-modern')?.textContent || '₹0',
            oldPrice: card.querySelector('.product-price-old-modern')?.textContent || '',
            discount: card.querySelector('.price-save-modern')?.textContent || '',
            rating: card.querySelector('.stars-modern')?.textContent || '★★★★★',
            reviews: card.querySelector('.rating-count-modern')?.textContent || '(0)',
            description: card.querySelector('.product-description-modern')?.textContent || 'Premium quality product',
            inStock: !card.querySelector('.badge-out-of-stock'),
            sku: 'SKU-' + Math.random().toString(36).substr(2, 9)
        };
    }
    
    showModal(product) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const stockStatus = product.inStock ? 
            '<p class="qv-availability-text">In Stock - Ready to Ship</p>' :
            '<p class="qv-availability-text">Out of Stock</p>';
        
        overlay.innerHTML = `
            <div class="quick-view-modal">
                <div class="modal-header">
                    <h2>Quick View</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="quick-view-image">
                        <div class="quick-view-main-image">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="quick-view-thumbnails">
                            <div class="thumbnail active">
                                <img src="${product.image}" alt="${product.name}">
                            </div>
                        </div>
                    </div>
                    <div class="quick-view-info">
                        <p class="qv-category">${product.category}</p>
                        <h3 class="qv-title">${product.name}</h3>
                        
                        <div class="qv-rating">
                            <div class="qv-stars">${product.rating}</div>
                            <span class="qv-reviews">${product.reviews}</span>
                        </div>
                        
                        <div class="qv-price">
                            <h4 class="qv-current-price">${product.price}</h4>
                            ${product.oldPrice ? `<p class="qv-old-price">${product.oldPrice}</p>` : ''}\n                            ${product.discount ? `<span class="qv-discount">${product.discount}</span>` : ''}\n                        </div>
                        
                        <p class="qv-description">${product.description}</p>
                        
                        <div class="qv-features">
                            <span class="qv-feature-badge">✓ Premium Quality</span>
                            <span class="qv-feature-badge">✓ Best Price</span>
                            <span class="qv-feature-badge">✓ Fast Delivery</span>
                        </div>
                        
                        <div class="qv-availability">
                            <p class="qv-availability-label">Availability</p>
                            ${stockStatus}
                        </div>
                        
                        <div class="qv-actions">
                            <button class="qv-btn qv-btn-primary" onclick="window.addToCart('${product.id}')">
                                <i class="ion-ios-cart"></i>
                                Add to Cart
                            </button>
                            <button class="qv-wishlist" onclick="this.classList.toggle('active'); window.toggleWishlist(this)">
                                <i class="ion-ios-heart"></i>
                            </button>
                        </div>
                        
                        <div class="qv-meta">
                            <div class="qv-meta-item">
                                <span class="qv-meta-label">SKU</span>
                                <span class="qv-meta-value qv-sku">${product.sku}</span>
                            </div>
                            <div class="qv-meta-item">
                                <span class="qv-meta-label">Availability</span>
                                <span class="qv-meta-value">${product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const closeBtn = overlay.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            overlay.style.animation = 'overlayFadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.animation = 'overlayFadeOut 0.3s ease forwards';
                setTimeout(() => overlay.remove(), 300);
            }
        });
    }
    
    addScrollAnimations() {
        const cards = document.querySelectorAll('.product-card-modern');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(40px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(card);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new QuickViewModal();
    
    // Animate filter tabs on scroll
    animateFilterTabs();
});

function animateFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    const tabObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                tabObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    tabs.forEach((tab, index) => {
        tab.style.opacity = '0';
        tab.style.transform = 'translateY(20px)';
        tab.style.transition = `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms`;
        tabObserver.observe(tab);
    });
}

// Smooth pagination animation
document.addEventListener('click', (e) => {
    if (e.target.closest('.pagination-btn')) {
        const gridPrev = document.querySelector('.products-grid-modern');
        if (gridPrev) {
            gridPrev.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                gridPrev.style.animation = 'fadeIn 0.6s ease forwards';
            }, 300);
        }
    }
});

// Add CSS animation keyframes if not already present
if (!document.querySelector('style:contains("overlayFadeOut")')) {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes overlayFadeOut {
            from {
                opacity: 1;
                backdrop-filter: blur(4px);
            }
            to {
                opacity: 0;
                backdrop-filter: blur(0px);
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(20px);
            }
        }
    `;
    document.head.appendChild(style);
}
