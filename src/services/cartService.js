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

        const countElements = document.querySelectorAll('#cartCount, #cartBadge, #mobileCartCount, .cart-badge');
        countElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? (el.id.includes('mobile') ? 'inline-flex' : 'block') : 'none';
        });

        const totalElements = document.querySelectorAll('#cartTotal, #checkoutTotal');
        totalElements.forEach(el => {
            el.textContent = `₹${total.toFixed(2)}`;
        });

        CartService.renderCartItems();
        CartService.renderCheckoutItems();
    },

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
            cartItems.innerHTML = `<div class="empty-cart"><p>${TranslationService.getLabel('emptyCart')}</p></div>`;
            return;
        }

        const isHindi = TranslationService.getLanguage() === 'hi';
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${isHindi ? item.nameHi : item.name}" />
                <div class="cart-item-info">
                    <h4>${isHindi ? item.nameHi : item.name}</h4>
                    <p>₹${item.price}/piece</p>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
                        <i class="ion-ios-minus-empty"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
                        <i class="ion-ios-plus-empty"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})" title="Remove item">
                        <i class="ion-ios-trash-outline"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }, clearCart: () => {
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

