/* ============================================================
   PREMIUM CHECKOUT — JavaScript Engine
   Futuristic Glowing Aesthetic
   ============================================================ */

(function () {
  'use strict';

  // ==================== STATE ====================
  const state = {
    currentStep: 0,
    cart: [],
    couponApplied: false,
    couponDiscount: 0,
    selectedPayment: 'card',
    selectedShipping: 'standard',
    shippingCosts: {
      standard: 0,
      express: 1500,
      priority: 3500
    },
    taxRate: 0.18, // 18% GST
    formData: {},
    total: 0
  };

  const steps = ['cart', 'shipping', 'payment', 'review'];

  function loadCartFromLocalStorage() {
    const rawCart = JSON.parse(localStorage.getItem('cart')) || [];
    state.cart = rawCart.map(item => ({
      id: Number(item.id),
      name: item.name,
      variant: item.specs || 'Red Clay • 9×4.5×3 inches',
      price: Number(item.price),
      qty: Number(item.quantity || item.qty || 1),
      image: item.image,
      unit: 'per brick'
    }));
  }

  function saveOrderToHistory(order) {
    const sessionUser = JSON.parse(localStorage.getItem('user'));
    if (!sessionUser) return;

    const users = JSON.parse(localStorage.getItem('users_db')) || [];
    const index = users.findIndex(u => u.id === sessionUser.id);
    if (index !== -1) {
      if (!users[index].orders) users[index].orders = [];
      users[index].orders.push(order);
      localStorage.setItem('users_db', JSON.stringify(users));

      // Sync session storage user
      const updatedSessionUser = { ...sessionUser };
      if (!updatedSessionUser.orders) updatedSessionUser.orders = [];
      updatedSessionUser.orders.push(order);
      localStorage.setItem('user', JSON.stringify(updatedSessionUser));
    }
  }

  // ==================== DOM READY ====================
  document.addEventListener('DOMContentLoaded', () => {
    loadCartFromLocalStorage();
    initParticles();
    initLoader();

    // Pre-fill shipping info from logged-in user profile
    const sessionUser = JSON.parse(localStorage.getItem('user'));
    if (sessionUser) {
      if (document.getElementById('shippingName') && sessionUser.name) {
        document.getElementById('shippingName').value = sessionUser.name;
      }
      if (document.getElementById('shippingEmail') && sessionUser.email) {
        document.getElementById('shippingEmail').value = sessionUser.email;
      }
      if (document.getElementById('shippingPhone') && sessionUser.mobile) {
        document.getElementById('shippingPhone').value = sessionUser.mobile;
      }
      if (document.getElementById('shippingAddress') && sessionUser.address) {
        document.getElementById('shippingAddress').value = sessionUser.address;
      }
      if (document.getElementById('shippingState')) {
        document.getElementById('shippingState').value = 'Uttar Pradesh';
      }
      if (document.getElementById('shippingCity')) {
        document.getElementById('shippingCity').value = 'Jaunpur';
      }
      if (document.getElementById('shippingPincode')) {
        document.getElementById('shippingPincode').value = '222001';
      }
    }

    renderCart();
    renderOrderSummary();
    updateProgressBar();
    initFormValidation();
    initPaymentMethods();
    initShippingOptions();
    initCardPreview();
    initMagneticButtons();
    initRippleEffects();
    goToStep(0);
  });

  // ==================== PARTICLES ====================
  function initParticles() {
    const bg = document.querySelector('.checkout-bg');
    if (!bg) return;

    const colors = [
      'rgba(212, 115, 46, 0.4)',
      'rgba(243, 144, 39, 0.3)',
      'rgba(232, 168, 76, 0.3)',
      'rgba(166, 92, 45, 0.2)',
      'rgba(200, 137, 46, 0.2)'
    ];

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = Math.random() * 4 + 1;
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration: ${Math.random() * 15 + 10}s;
        animation-delay: ${Math.random() * 10}s;
        box-shadow: 0 0 ${size * 3}px ${colors[Math.floor(Math.random() * colors.length)]};
      `;
      bg.appendChild(particle);
    }
  }

  // ==================== LOADER ====================
  function initLoader() {
    const loader = document.getElementById('checkoutLoader');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 1500);
  }

  // ==================== CART RENDERING ====================
  function renderCart() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;

    if (state.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some premium bricks to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.cart.map(item => `
      <div class="cart-item" data-id="${item.id}" id="cart-item-${item.id}">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-variant">${item.variant}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="CheckoutApp.updateQty(${item.id}, -100)" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${item.qty.toLocaleString()}</span>
            <button class="qty-btn" onclick="CheckoutApp.updateQty(${item.id}, 100)" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <div>
            <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="cart-item-unit-price">₹${item.price.toFixed(2)} ${item.unit}</div>
          </div>
          <button class="remove-btn" onclick="CheckoutApp.removeItem(${item.id})" aria-label="Remove item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // ==================== ORDER SUMMARY ====================
  function renderOrderSummary() {
    const itemsContainer = document.getElementById('summaryItems');
    const pricingContainer = document.getElementById('summaryPricing');
    if (!itemsContainer || !pricingContainer) return;

    // Summary items
    itemsContainer.innerHTML = state.cart.map(item => `
      <div class="summary-item">
        <div class="summary-item-img">
          <img src="${item.image}" alt="${item.name}">
          <span class="summary-item-qty">${item.qty >= 1000 ? (item.qty / 1000).toFixed(1) + 'k' : item.qty}</span>
        </div>
        <div class="summary-item-info">
          <div class="summary-item-name">${item.name}</div>
          <div class="summary-item-variant">${item.variant}</div>
        </div>
        <div class="summary-item-price">₹${(item.price * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
    `).join('');

    // Pricing
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = state.shippingCosts[state.selectedShipping];
    const discount = state.couponApplied ? subtotal * state.couponDiscount : 0;
    const taxable = subtotal - discount + shipping;
    const tax = taxable * state.taxRate;
    const total = taxable + tax;
    state.total = total;

    pricingContainer.innerHTML = `
      <div class="summary-row">
        <span class="label">Subtotal (${state.cart.reduce((s, i) => s + i.qty, 0).toLocaleString()} items)</span>
        <span class="value price-animate" id="subtotalValue">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row">
        <span class="label">Shipping</span>
        <span class="value">${shipping === 0 ? '<span style="color:var(--neon-cyan)">FREE</span>' : '₹' + shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${state.couponApplied ? `
        <div class="summary-row discount">
          <span class="label">Discount (${(state.couponDiscount * 100).toFixed(0)}%)</span>
          <span class="value">−₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      ` : ''}
      <div class="summary-row">
        <span class="label">GST (18%)</span>
        <span class="value">₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-row total">
        <span class="label">Total</span>
        <span class="value price-animate" id="totalValue">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;
  }

  // ==================== QUANTITY CONTROLS ====================
  function updateQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(100, item.qty + delta);
    item.qty = newQty;

    renderCart();
    renderOrderSummary();
    showToast(`Updated ${item.name} to ${newQty.toLocaleString()} units`, 'success');
  }

  // ==================== REMOVE ITEM ====================
  function removeItem(id) {
    const el = document.getElementById(`cart-item-${id}`);
    if (el) {
      el.classList.add('removing');
      setTimeout(() => {
        state.cart = state.cart.filter(i => i.id !== id);
        renderCart();
        renderOrderSummary();
      }, 400);
    }
    showToast('Item removed from cart', 'success');
  }

  // ==================== COUPON ====================
  function applyCoupon() {
    const input = document.getElementById('couponInput');
    const successEl = document.getElementById('couponSuccess');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    const validCoupons = {
      'GURUKRIPA10': 0.10,
      'PREMIUM20': 0.20,
      'BRICK15': 0.15,
      'SAVE10': 0.10
    };

    if (validCoupons[code]) {
      state.couponApplied = true;
      state.couponDiscount = validCoupons[code];
      if (successEl) {
        successEl.classList.add('show');
        successEl.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Coupon "${code}" applied! ${(state.couponDiscount * 100).toFixed(0)}% discount
        `;
      }
      renderOrderSummary();
      showToast(`🎉 ${(state.couponDiscount * 100).toFixed(0)}% discount applied!`, 'success');
    } else {
      showToast('Invalid coupon code. Try GURUKRIPA10', 'error');
      input.style.borderColor = '#ef4444';
      setTimeout(() => input.style.borderColor = '', 2000);
    }
  }

  // ==================== STEP NAVIGATION ====================
  function goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    // Validate current step before advancing
    if (stepIndex > state.currentStep) {
      if (!validateStep(state.currentStep)) return;
    }

    state.currentStep = stepIndex;

    // Update step visibility
    document.querySelectorAll('.checkout-step').forEach((el, i) => {
      el.classList.toggle('active', i === stepIndex);
    });

    // Update progress bar
    updateProgressBar();

    // Scroll to top of form
    const mainEl = document.querySelector('.checkout-main');
    if (mainEl) {
      window.scrollTo({ top: mainEl.offsetTop - 80, behavior: 'smooth' });
    }

    // Update button text
    updateNavigationButtons();
  }

  function nextStep() {
    goToStep(state.currentStep + 1);
  }

  function prevStep() {
    goToStep(state.currentStep - 1);
  }

  function updateProgressBar() {
    const progressFill = document.querySelector('.progress-line-fill');
    const stepElements = document.querySelectorAll('.progress-step');

    if (progressFill) {
      const progress = state.currentStep / (steps.length - 1);
      progressFill.style.width = `${progress * 100}%`;
    }

    stepElements.forEach((el, i) => {
      el.classList.remove('active', 'completed');
      if (i === state.currentStep) {
        el.classList.add('active');
      } else if (i < state.currentStep) {
        el.classList.add('completed');
      }
    });
  }

  function updateNavigationButtons() {
    const nextBtn = document.getElementById('nextStepBtn');
    const prevBtn = document.getElementById('prevStepBtn');

    if (nextBtn) {
      const labels = ['Continue to Shipping', 'Continue to Payment', 'Review Order', 'Place Order — Pay Now'];
      nextBtn.textContent = labels[state.currentStep] || 'Continue';

      if (state.currentStep === steps.length - 1) {
        nextBtn.onclick = processPayment;
      } else {
        nextBtn.onclick = nextStep;
      }
    }

    if (prevBtn) {
      prevBtn.style.display = state.currentStep === 0 ? 'none' : '';
    }
  }

  // ==================== FORM VALIDATION ====================
  function validateStep(stepIndex) {
    if (stepIndex === 0) {
      if (state.cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return false;
      }
      return true;
    }

    if (stepIndex === 1) {
      return validateShippingForm();
    }

    if (stepIndex === 2) {
      return validatePaymentForm();
    }

    return true;
  }

  function validateShippingForm() {
    const fields = [
      { id: 'shippingName', label: 'Full Name', min: 2 },
      { id: 'shippingEmail', label: 'Email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      { id: 'shippingPhone', label: 'Phone', pattern: /^\+?[0-9]{10,13}$/ },
      { id: 'shippingAddress', label: 'Address', min: 5 },
      { id: 'shippingCity', label: 'City', min: 2 },
      { id: 'shippingState', label: 'State', min: 2 },
      { id: 'shippingPincode', label: 'PIN Code', pattern: /^[0-9]{6}$/ }
    ];

    let valid = true;
    fields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;
      const group = input.closest('.form-group');
      const value = input.value.trim();

      let isValid = true;
      if (field.pattern) {
        isValid = field.pattern.test(value);
      } else if (field.min) {
        isValid = value.length >= field.min;
      }

      if (group) {
        group.classList.remove('valid', 'error');
        group.classList.add(isValid ? 'valid' : 'error');
      }

      if (!isValid) {
        valid = false;
        // Store data even if invalid for draft saving
      }

      state.formData[field.id] = value;
    });

    if (!valid) {
      showToast('Please fill in all required fields correctly', 'error');
    }

    return valid;
  }

  function validateLuhn(cardNumber) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
  }

  function validatePaymentForm() {
    if (state.selectedPayment === 'card') {
      const numberInput = document.getElementById('cardNumber');
      const nameInput = document.getElementById('cardName');
      const expiryInput = document.getElementById('cardExpiry');
      const cvvInput = document.getElementById('cardCvv');

      const numVal = numberInput ? numberInput.value.replace(/\s+/g, '') : '';
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const expiryVal = expiryInput ? expiryInput.value.trim() : '';
      const cvvVal = cvvInput ? cvvInput.value.trim() : '';

      let valid = true;

      // Card Number check
      if (!numVal || numVal.length < 13 || numVal.length > 19 || !validateLuhn(numVal)) {
        valid = false;
        numberInput?.closest('.form-group')?.classList.add('error');
        showToast('⚠️ Invalid Credit Card Number (failed Luhn check)', 'error');
      } else {
        numberInput?.closest('.form-group')?.classList.remove('error');
        numberInput?.closest('.form-group')?.classList.add('valid');
      }

      // Name check
      if (!nameVal || nameVal.length < 2) {
        valid = false;
        nameInput?.closest('.form-group')?.classList.add('error');
        showToast('⚠️ Cardholder name is required', 'error');
      } else {
        nameInput?.closest('.form-group')?.classList.remove('error');
        nameInput?.closest('.form-group')?.classList.add('valid');
      }

      // Expiry Check
      const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!expiryVal || !expiryPattern.test(expiryVal)) {
        valid = false;
        expiryInput?.closest('.form-group')?.classList.add('error');
        showToast('⚠️ Expiry date must be MM/YY format', 'error');
      } else {
        const parts = expiryVal.split('/');
        const month = parseInt(parts[0], 10);
        const year = parseInt('20' + parts[1], 10);
        const expiryDate = new Date(year, month - 1, 1);
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (expiryDate < currentDate) {
          valid = false;
          expiryInput?.closest('.form-group')?.classList.add('error');
          showToast('⚠️ Credit Card has expired', 'error');
        } else {
          expiryInput?.closest('.form-group')?.classList.remove('error');
          expiryInput?.closest('.form-group')?.classList.add('valid');
        }
      }

      // CVV check
      if (!cvvVal || cvvVal.length < 3 || cvvVal.length > 4) {
        valid = false;
        cvvInput?.closest('.form-group')?.classList.add('error');
        showToast('⚠️ Invalid CVV (must be 3 or 4 digits)', 'error');
      } else {
        cvvInput?.closest('.form-group')?.classList.remove('error');
        cvvInput?.closest('.form-group')?.classList.add('valid');
      }

      return valid;
    }

    if (state.selectedPayment === 'upi') {
      const upiInput = document.getElementById('upiId');
      const upiVal = upiInput ? upiInput.value.trim() : '';
      const upiPattern = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/;

      if (!upiVal || !upiPattern.test(upiVal)) {
        upiInput?.closest('.form-group')?.classList.add('error');
        showToast('⚠️ Invalid UPI ID format (e.g. name@upi)', 'error');
        return false;
      } else {
        upiInput?.closest('.form-group')?.classList.remove('error');
        upiInput?.closest('.form-group')?.classList.add('valid');
        return true;
      }
    }

    return true;
  }

  function initFormValidation() {
    // Real-time validation with floating label effect
    document.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('input', () => {
        const group = input.closest('.form-group');
        if (!group) return;
        const value = input.value.trim();

        if (value.length > 0) {
          group.classList.remove('error');
          if (value.length >= 2) {
            group.classList.add('valid');
          } else {
            group.classList.remove('valid');
          }
        } else {
          group.classList.remove('valid', 'error');
        }
      });

      input.addEventListener('blur', () => {
        const group = input.closest('.form-group');
        if (!group) return;
        if (input.required && !input.value.trim()) {
          group.classList.add('error');
        }
      });
    });
  }

  // ==================== PAYMENT METHODS ====================
  function initPaymentMethods() {
    document.querySelectorAll('.payment-method').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(pm => pm.classList.remove('selected'));
        el.classList.add('selected');
        state.selectedPayment = el.dataset.method;

        // Show/hide card form
        const cardForm = document.getElementById('cardFormSection');
        const upiForm = document.getElementById('upiFormSection');
        if (cardForm) cardForm.style.display = state.selectedPayment === 'card' ? 'block' : 'none';
        if (upiForm) upiForm.style.display = state.selectedPayment === 'upi' ? 'block' : 'none';
      });
    });
  }

  // ==================== SHIPPING OPTIONS ====================
  function initShippingOptions() {
    document.querySelectorAll('.shipping-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.shipping-option').forEach(so => so.classList.remove('selected'));
        el.classList.add('selected');
        state.selectedShipping = el.dataset.shipping;
        renderOrderSummary();
      });
    });
  }

  // ==================== CREDIT CARD PREVIEW ====================
  function initCardPreview() {
    const numberInput = document.getElementById('cardNumber');
    const nameInput = document.getElementById('cardName');
    const expiryInput = document.getElementById('cardExpiry');

    const numberDisplay = document.getElementById('cardNumberDisplay');
    const nameDisplay = document.getElementById('cardNameDisplay');
    const expiryDisplay = document.getElementById('cardExpiryDisplay');

    if (numberInput && numberDisplay) {
      numberInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = formatted;
        numberDisplay.textContent = formatted || '•••• •••• •••• ••••';

        // Update card type icon
        const typeIcon = document.getElementById('cardTypeIcon');
        if (typeIcon) {
          if (val.startsWith('4')) typeIcon.textContent = '💳';
          else if (val.startsWith('5') || val.startsWith('2')) typeIcon.textContent = '🏦';
          else if (val.startsWith('3')) typeIcon.textContent = '💎';
          else typeIcon.textContent = '💳';
        }
      });
    }

    if (nameInput && nameDisplay) {
      nameInput.addEventListener('input', (e) => {
        nameDisplay.textContent = e.target.value.toUpperCase() || 'YOUR NAME';
      });
    }

    if (expiryInput && expiryDisplay) {
      expiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
        e.target.value = val;
        expiryDisplay.textContent = val || 'MM/YY';
      });
    }

    // CVV input mask
    const cvvInput = document.getElementById('cardCvv');
    if (cvvInput) {
      cvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
      });
    }
  }

  // ==================== MAGNETIC BUTTONS ====================
  function initMagneticButtons() {
    document.querySelectorAll('.btn-primary, .magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ==================== RIPPLE EFFECTS ====================
  function initRippleEffects() {
    document.querySelectorAll('.btn-primary, .btn-secondary, .qty-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${e.clientX - rect.left - size / 2}px;
          top: ${e.clientY - rect.top - size / 2}px;
        `;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  // ==================== PAYMENT PROCESSING ====================
  function processPayment() {
    if (!validateStep(state.currentStep)) return;

    // Assemble order data
    const transactionId = 'TXN_' + Math.floor(100000000 + Math.random() * 900000000);
    const orderId = 'GB-' + Math.floor(1000 + Math.random() * 9000);
    const order = {
      id: orderId,
      date: new Date().toISOString(),
      items: state.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        image: item.image
      })),
      total: state.total,
      status: 'Processing',
      address: `${state.formData.shippingAddress || ''}, ${state.formData.shippingCity || ''}, ${state.formData.shippingState || ''} - ${state.formData.shippingPincode || ''}`,
      paymentMethod: state.selectedPayment === 'card' ? 'Credit/Debit Card' : state.selectedPayment === 'upi' ? 'UPI' : state.selectedPayment === 'netbanking' ? 'Net Banking' : 'Cash on Delivery',
      transactionId: transactionId
    };

    // Show biometric animation for card/upi
    const biometric = document.getElementById('biometricOverlay');
    if (biometric && (state.selectedPayment === 'card' || state.selectedPayment === 'upi')) {
      biometric.classList.add('show');

      setTimeout(() => {
        biometric.classList.remove('show');

        // Save order and clear cart
        saveOrderToHistory(order);
        localStorage.setItem('cart', JSON.stringify([]));

        // Show success
        setTimeout(() => {
          showSuccessOverlay(order.id);
        }, 300);
      }, 3000);
    } else {
      // Direct processing for COD / Netbanking
      showToast('⏳ Securely processing your order...');
      setTimeout(() => {
        saveOrderToHistory(order);
        localStorage.setItem('cart', JSON.stringify([]));
        showSuccessOverlay(order.id);
      }, 1500);
    }
  }

  function showSuccessOverlay(orderIdValue) {
    const overlay = document.getElementById('successOverlay');
    if (overlay) {
      overlay.classList.add('show');

      const orderIdDisplay = document.getElementById('orderIdDisplay');
      if (orderIdDisplay) {
        orderIdDisplay.textContent = `Order #${orderIdValue}`;
      }

      createConfetti();
    }
  }

  function createConfetti() {
    const colors = ['#d4732e', '#f39027', '#e8a84c', '#a65c2d', '#c8892e', '#5cb85c'];
    const container = document.getElementById('successOverlay');
    if (!container) return;

    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isCircle = Math.random() > 0.5;
      confetti.style.cssText = `
        position: absolute;
        top: -10px;
        left: ${Math.random() * 100}%;
        width: ${isCircle ? 8 : 12}px;
        height: ${isCircle ? 8 : 6}px;
        background: ${color};
        border-radius: ${isCircle ? '50%' : '2px'};
        opacity: ${Math.random() * 0.8 + 0.2};
        transform: rotate(${Math.random() * 360}deg);
        animation: confettiFall ${Math.random() * 2 + 2}s ${Math.random() * 1}s ease-in forwards;
        pointer-events: none;
      `;
      container.appendChild(confetti);
    }

    // Add confetti animation
    if (!document.getElementById('confettiStyle')) {
      const style = document.createElement('style');
      style.id = 'confettiStyle';
      style.textContent = `
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ==================== TOAST NOTIFICATIONS ====================
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==================== PROGRESS STEP CLICK ====================
  window.addEventListener('click', (e) => {
    const step = e.target.closest('.progress-step');
    if (step) {
      const index = parseInt(step.dataset.step);
      if (!isNaN(index) && index <= state.currentStep) {
        goToStep(index);
      }
    }
  });

  // ==================== PUBLIC API ====================
  window.CheckoutApp = {
    updateQty,
    removeItem,
    applyCoupon,
    nextStep,
    prevStep,
    goToStep,
    processPayment,
    state
  };

})();
