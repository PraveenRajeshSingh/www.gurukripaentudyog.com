/**
 * Gurukripa Bricks - Shopping Cart Service
 */
let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
let savedForLater = JSON.parse(localStorage.getItem('gurukripa_saved_items')) || [];
let appliedCoupon = null;

const VALID_COUPONS = {
    'BRICK10': { type: 'percent', value: 10, label: '10% OFF' },
    'FIRST50': { type: 'flat', value: 50, minOrder: 200, label: '₹50 OFF on ₹200+' },
    'WELCOME5': { type: 'percent', value: 5, label: '5% OFF' },
    'FREESHIP': { type: 'shipping', value: 0, label: 'Free Shipping' }
};

var CartService = {
    getCart: () => cart,

    addToCart: (productId) => {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        CartService.saveCart();
        CartService.updateUI();
        showToast(`✅ ${TranslationService.getLabel('addToCart')} - ${TranslationService.getLabel('success')}`);
    },

    removeFromCart: (productId) => {
        // Use loose equality or cast to Number to avoid string/number mismatch issues
        const pid = Number(productId);
        cart = cart.filter(item => Number(item.id) !== pid);
        CartService.saveCart();
        CartService.updateUI();
        showToast('🗑️ Product removed from cart.');
    },

    updateQuantity: (productId, change) => {
        const pid = Number(productId);
        const item = cart.find(i => Number(i.id) === pid);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                CartService.removeFromCart(pid);
            } else {
                CartService.saveCart();
                CartService.updateUI();
            }
        }
    },

    getTotal: () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = CartService.getShippingCost();
        const discount = CartService.getCouponDiscount(subtotal);
        return Math.max(0, subtotal + shipping - discount);
    },
    getSubtotal: () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    getCount: () => cart.reduce((count, item) => count + item.quantity, 0),

    getShippingCost: () => {
        const count = CartService.getCount();
        if (count === 0) return 0;
        if (count >= 500) return 0; // Free shipping for 500+ items
        if (count >= 100) return 50;
        return 100;
    },

    getCouponDiscount: (subtotal) => {
        if (!appliedCoupon) return 0;
        const coupon = VALID_COUPONS[appliedCoupon];
        if (!coupon) return 0;
        if (coupon.type === 'percent') return subtotal * (coupon.value / 100);
        if (coupon.type === 'flat' && subtotal >= (coupon.minOrder || 0)) return coupon.value;
        if (coupon.type === 'shipping') return CartService.getShippingCost();
        return 0;
    },

    saveCart: () => {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    },

    updateUI: () => {
        const count = CartService.getCount();
        const total = CartService.getTotal();
        const subtotal = CartService.getSubtotal();
        const shipping = CartService.getShippingCost();
        const discount = CartService.getCouponDiscount(subtotal);

        const countElements = document.querySelectorAll('#cartCount, #cartCountSummary, #cartBadge, #mobileCartCount, .cart-badge');
        countElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? (el.id.includes('mobile') || el.classList.contains('cart-count-summary') ? 'inline-flex' : 'block') : (el.classList.contains('cart-count-summary') ? 'inline' : 'none');
        });

        const totalElements = document.querySelectorAll('#cartTotal, #cartSubtotal, #checkoutTotalRow');
        totalElements.forEach(el => {
            if (el.id === 'cartSubtotal') {
                el.textContent = `₹${subtotal.toLocaleString()}`;
            } else {
                el.textContent = `₹${total.toLocaleString()}`;
            }
        });

        // Update shipping cost
        const shippingEl = document.getElementById('shippingCost');
        if (shippingEl) {
            shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
            shippingEl.className = shipping === 0 ? 'fee-free' : '';
        }

        // Update coupon discount row
        const couponRow = document.getElementById('couponDiscountRow');
        const couponEl = document.getElementById('couponDiscount');
        if (couponRow && couponEl) {
            if (discount > 0) {
                couponRow.style.display = 'flex';
                couponEl.textContent = `-₹${discount.toFixed(2)}`;
            } else {
                couponRow.style.display = 'none';
            }
        }

        const profileCartBadge = document.getElementById('profileCartCount');
        if (profileCartBadge) {
            profileCartBadge.textContent = count;
            profileCartBadge.style.display = count > 0 ? 'inline-flex' : 'none';
        }

        CartService.renderCartItems();
    },

    updateCartUI: () => CartService.updateUI(), // Alias for compatibility
    add: (productId) => CartService.addToCart(productId), // Short alias

    renderCartItems: () => {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart-modern">
                    <div class="empty-cart-illustration">
                        <svg viewBox="0 0 120 120" width="120" height="120">
                            <circle cx="60" cy="60" r="50" fill="rgba(139,0,0,0.05)" stroke="rgba(139,0,0,0.1)" stroke-width="2"/>
                            <text x="60" y="55" text-anchor="middle" font-size="36">🛒</text>
                            <text x="60" y="80" text-anchor="middle" font-size="10" fill="#94a3b8">Empty</text>
                        </svg>
                    </div>
                    <p style="font-weight: 700; color: var(--text-primary, #1a1a2e); margin-top: 16px;">Your cart is empty</p>
                    <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">Browse our premium bricks and add items to start</p>
                    <button class="empty-cart-cta" onclick="Modals.close('cartModal'); navigateTo('products');">Browse Products</button>
                </div>`;
            return;
        }

        const isHindi = TranslationService.getLanguage() === 'hi';
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item-modern" data-cart-item="${item.id}">
                <div class="cart-item-img-wrap">
                    <img src="${item.image}" alt="${isHindi ? item.nameHi : item.name}" />
                </div>
                <div class="cart-item-content">
                    <div class="cart-item-title-row">
                        <h4>${isHindi ? item.nameHi : item.name}</h4>
                        <div class="cart-item-actions">
                            <button class="btn-save-later" onclick="saveForLater(${item.id})" title="Save for later">
                                <i class="ion-ios-heart-outline"></i>
                            </button>
                            <button class="btn-remove-item" onclick="removeFromCartAnimated(${item.id})">
                                <i class="ion-ios-trash-outline"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="cart-item-bottom-row">
                        <div class="cart-item-price-wrap">
                            <span class="item-price-current">₹${item.price.toLocaleString()}</span>
                            <span class="item-line-total">= ₹${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                        
                        <div class="qty-control-modern">
                            <button class="qty-btn-m" onclick="updateQuantity(${item.id}, -1)">
                                <i class="ion-ios-minus-empty"></i>
                            </button>
                            <span class="qty-val-m">${item.quantity}</span>
                            <button class="qty-btn-m" onclick="updateQuantity(${item.id}, 1)">
                                <i class="ion-ios-plus-empty"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },
    clearCart: () => {
        cart = [];
        CartService.saveCart();
        CartService.updateUI();
    },

    init: () => {
        CartService.updateUI();

        // Expose globally for HTML onclick handlers
        window.addToCart = CartService.addToCart;
        window.removeFromCart = CartService.removeFromCart;
        window.updateQuantity = CartService.updateQuantity;
        window.openCart = () => Modals.open('cartModal');
        window.closeCart = () => Modals.close('cartModal');

        // Animated remove
        window.removeFromCartAnimated = (id) => {
            const itemEl = document.querySelector(`[data-cart-item="${id}"]`);
            if (itemEl) {
                itemEl.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                itemEl.style.transform = 'translateX(100%)';
                itemEl.style.opacity = '0';
                itemEl.style.maxHeight = itemEl.offsetHeight + 'px';
                setTimeout(() => {
                    itemEl.style.maxHeight = '0';
                    itemEl.style.margin = '0';
                    itemEl.style.padding = '0';
                }, 300);
                setTimeout(() => CartService.removeFromCart(id), 500);
            } else {
                CartService.removeFromCart(id);
            }
        };

        // Coupon
        window.applyCoupon = () => {
            const input = document.getElementById('couponInput');
            const msg = document.getElementById('couponMessage');
            if (!input || !msg) return;
            const code = input.value.trim().toUpperCase();
            if (!code) { msg.innerHTML = '<span style="color:#dc2626;">Please enter a coupon code</span>'; return; }
            if (VALID_COUPONS[code]) {
                appliedCoupon = code;
                msg.innerHTML = `<span style="color:#16a34a;">✅ ${VALID_COUPONS[code].label} applied!</span>`;
                CartService.updateUI();
            } else {
                appliedCoupon = null;
                msg.innerHTML = '<span style="color:#dc2626;">❌ Invalid coupon code</span>';
                CartService.updateUI();
            }
        };

        // Save for later
        window.saveForLater = (id) => {
            const item = cart.find(i => Number(i.id) === Number(id));
            if (item) {
                savedForLater.push({ ...item });
                localStorage.setItem('gurukripa_saved_items', JSON.stringify(savedForLater));
                CartService.removeFromCart(id);
                showToast('💾 Saved for later!');
            }
        };
    }
};

// Initialized by App.init

