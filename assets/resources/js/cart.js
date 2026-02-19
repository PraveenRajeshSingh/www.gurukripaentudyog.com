// Shopping cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId) {
    // Ensure products array is available
    if (typeof products === 'undefined' || !products.length) {
        console.error('Products array not found');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
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
            'currency': 'INR',
            'value': product.price,
            'items': [{
                'item_id': product.id.toString(),
                'item_name': product.name,
                'price': product.price,
                'quantity': 1
            }]
        });
    }
    
    // Also track using analytics.js function if available
    if (typeof trackAddToCart === 'function') {
        trackAddToCart(product.id, product.name, product.price, 1);
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
    const cartBadge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');
    const cartItems = document.getElementById('cartItems');
    
    const count = getCartCount();
    
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'block' : 'none';
    }
    
    // Update navbar cart badge
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'block' : 'none';
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
    
    closeCart();
    openCheckout();
}

function openCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.style.display = 'flex';
        renderCheckout();
        
        // Track begin_checkout event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'begin_checkout', {
                'currency': 'INR',
                'value': getCartTotal(),
                'items': cart.map(item => ({
                    'id': item.id,
                    'name': item.name,
                    'price': item.price,
                    'quantity': item.quantity
                }))
            });
        }
    }
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
}

function renderCheckout() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (checkoutItems) {
        const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
        checkoutItems.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <div class="checkout-item-info">
                    <h4>${isHindi ? item.nameHi : item.name}</h4>
                    <p>₹${item.price} × ${item.quantity}</p>
                </div>
                <div class="checkout-item-total">
                    ₹${(item.price * item.quantity).toFixed(2)}
                </div>
            </div>
        `).join('');
    }
    
    if (checkoutTotal) {
        checkoutTotal.textContent = `₹${getCartTotal().toFixed(2)}`;
    }
    
    // Pre-fill form if user is logged in
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && document.getElementById('checkoutForm')) {
        const form = document.getElementById('checkoutForm');
        if (form.name) form.name.value = user.name || '';
        if (form.email) form.email.value = user.email || '';
        if (form.mobile) form.mobile.value = user.mobile || '';
        if (form.address) form.address.value = user.address || '';
    }
}

function submitOrder(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        alert(getTranslation('emptyCart'));
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    const orderData = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: [...cart],
        total: getCartTotal(),
        shipping: {
            name: formData.get('name'),
            mobile: formData.get('mobile'),
            email: formData.get('email'),
            address: formData.get('address'),
            city: formData.get('city'),
            pincode: formData.get('pincode')
        },
        status: 'pending'
    };
    
    // Save order to user account if logged in
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        if (!user.orders) user.orders = [];
        user.orders.push(orderData);
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
    }
    
    // Send order via WhatsApp
    const orderMessage = formatOrderMessage(orderData);
    const whatsappUrl = `https://wa.me/919198923230?text=${encodeURIComponent(orderMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    // Track purchase event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            'transaction_id': orderData.id.toString(),
            'value': orderData.total,
            'currency': 'INR',
            'items': orderData.items.map(item => ({
                'id': item.id,
                'name': item.name,
                'price': item.price,
                'quantity': item.quantity
            }))
        });
    }
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    
    // Show success message
    alert('Order placed successfully! You will be redirected to WhatsApp to confirm your order.');
    
    // Close checkout modal
    closeCheckout();
    
    // Redirect to home
    window.location.href = '#home';
}

function formatOrderMessage(orderData) {
    const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
    let message = isHindi ? 
        'नमस्ते, मैं ऑर्डर देना चाहता/चाहती हूं:\n\n' :
        'Hello, I would like to place an order:\n\n';
    
    message += isHindi ? 'उत्पाद:\n' : 'Products:\n';
    orderData.items.forEach(item => {
        message += `- ${isHindi ? item.nameHi : item.name}: ${item.quantity} × ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}\n`;
    });
    
    message += `\n${isHindi ? 'कुल राशि' : 'Total'}: ₹${orderData.total.toFixed(2)}\n\n`;
    message += isHindi ? 'शिपिंग जानकारी:\n' : 'Shipping Information:\n';
    message += `${isHindi ? 'नाम' : 'Name'}: ${orderData.shipping.name}\n`;
    message += `${isHindi ? 'मोबाइल' : 'Mobile'}: ${orderData.shipping.mobile}\n`;
    if (orderData.shipping.email) {
        message += `${isHindi ? 'ईमेल' : 'Email'}: ${orderData.shipping.email}\n`;
    }
    message += `${isHindi ? 'पता' : 'Address'}: ${orderData.shipping.address}\n`;
    message += `${isHindi ? 'शहर' : 'City'}: ${orderData.shipping.city}\n`;
    message += `${isHindi ? 'पिनकोड' : 'Pincode'}: ${orderData.shipping.pincode}\n`;
    
    return message;
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
});

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.openCart = openCart;
window.closeCart = closeCart;
window.proceedToCheckout = proceedToCheckout;
window.closeCheckout = closeCheckout;
window.submitOrder = submitOrder;
window.getCartTotal = getCartTotal;
window.getCartCount = getCartCount;


