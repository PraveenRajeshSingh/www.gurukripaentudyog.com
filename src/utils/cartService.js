/**
 * Gurukripa Bricks - Shopping Cart Service
 */
let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];

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

    getTotal: () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    getCount: () => cart.reduce((count, item) => count + item.quantity, 0),

    saveCart: () => {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    },

    updateUI: () => {
        const count = CartService.getCount();
        const total = CartService.getTotal();

        const countElements = document.querySelectorAll('#cartCount, #cartCountSummary, #cartBadge, #mobileCartCount, .cart-badge');
        countElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? (el.id.includes('mobile') || el.classList.contains('cart-count-summary') ? 'inline-flex' : 'block') : (el.classList.contains('cart-count-summary') ? 'inline' : 'none');
        });

        const totalElements = document.querySelectorAll('#cartTotal, #checkoutTotal, #cartSubtotal, #checkoutTotalRow');
        totalElements.forEach(el => {
            el.textContent = `₹${total.toLocaleString()}`;
        });

        const profileCartBadge = document.getElementById('profileCartCount');
        if (profileCartBadge) {
            profileCartBadge.textContent = count;
            profileCartBadge.style.display = count > 0 ? 'inline-flex' : 'none';
        }

        CartService.renderCartItems();
        CartService.renderCheckoutItems();
    },

    updateCartUI: () => CartService.updateUI(), // Alias for compatibility

    renderCheckoutItems: () => {
        const container = document.getElementById('checkoutItems');
        const totalEl = document.getElementById('checkoutTotal');
        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-state">No items in cart</p>';
            if (totalEl) totalEl.textContent = '₹0.00';
            return;
        }

        const isHindi = TranslationService.getLanguage() === 'hi';
        let total = 0;

        container.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            return `
                <div class="checkout-item">
                    <span class="checkout-item-name">${isHindi ? item.nameHi : item.name} x ${item.quantity}</span>
                    <span class="checkout-item-price">₹${itemTotal.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
    },

    renderCartItems: () => {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart-modern">
                    <i class="ion-ios-cart-outline" style="font-size: 4rem; opacity: 0.1; display: block; margin: 20px 0;"></i>
                    <p style="font-weight: 700; color: #666;">Your cart is empty</p>
                    <p style="font-size: 0.85rem; color: #999; margin-top: 4px;">Add items to start shopping</p>
                </div>`;
            return;
        }

        const isHindi = TranslationService.getLanguage() === 'hi';
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item-modern">
                <div class="cart-item-img-wrap">
                    <img src="${item.image}" alt="${isHindi ? item.nameHi : item.name}" />
                </div>
                <div class="cart-item-content">
                    <div class="cart-item-title-row">
                        <h4>${isHindi ? item.nameHi : item.name}</h4>
                        <button class="btn-remove-item" onclick="removeFromCart(${item.id})">
                            <i class="ion-ios-trash-outline"></i>
                        </button>
                    </div>
                    
                    <div class="cart-item-bottom-row">
                        <div class="cart-item-price-wrap">
                            <span class="item-price-current">₹${item.price.toLocaleString()}</span>
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
    }
};

// Initialized by App.init

