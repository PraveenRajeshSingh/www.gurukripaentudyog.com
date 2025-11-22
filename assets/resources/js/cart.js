// Shopping cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            nameHi: product.nameHi,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showCartNotification();
    
    // Track analytics event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'add_to_cart', {
            'items': [{
                'id': product.id,
                'name': product.name,
                'price': product.price,
                'quantity': 1
            }]
        });
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const cartItems = document.getElementById('cartItems');
    
    if (cartCount) {
        const count = getCartCount();
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'block' : 'none';
    }
    
    if (cartTotal) {
        cartTotal.textContent = `₹${getCartTotal().toFixed(2)}`;
    }
    
    if (cartItems) {
        renderCartItems();
    }
}

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="empty-cart"><p>${getTranslation('emptyCart')}</p></div>`;
        return;
    }
    
    const isHindi = currentLanguage === 'hi';
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${isHindi ? item.nameHi : item.name}" />
            <div class="cart-item-info">
                <h4>${isHindi ? item.nameHi : item.name}</h4>
                <p>₹${item.price}/piece</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">
                <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                <button class="btn-remove" onclick="removeFromCart(${item.id})">
                    <i class="ion-ios-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function showCartNotification() {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = getTranslation('addToCart') + ' - ' + getTranslation('success');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function openCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = 'flex';
        updateCartUI();
    }
}

function closeCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert(getTranslation('emptyCart'));
        return;
    }
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert('Please login to continue');
        openLoginModal();
        return;
    }
    
    // Redirect to checkout
    window.location.href = '#checkout';
    closeCart();
    renderCheckout();
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
});

