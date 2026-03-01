/**
 * Gurukripa Bricks - Application Entry Point
 * Initializes all modular services and standardized components.
 */

// Application State
const App = {
    init: () => {
        console.log('🚀 Gurukripa Bricks Initializing...');

        // Initialize Core Services
        safeExecute(() => {
            TranslationService.init();
            AuthService.init();
            CartService.init();
            ProductService.init();
        }, null, 'Core initialization failed');

        // Global Event Listeners
        App.bindGlobalEvents();

        // Initialize Calculator
        App.initCalculator();

        // Initialize Counters
        App.initCounters();

        // Initialize Chatbot Toggle
        App.initChatbot();

        // Finalize UI
        setTimeout(App.hideLoader, 800);

        console.log('✅ Gurukripa Bricks Ready.');
    },

    hideLoader: () => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                document.body.classList.remove('loading');
            }, 600);
        }
    },

    toggleMobileMenu: (isOpen) => {
        const drawer = document.getElementById('mobileDrawer');
        const overlay = document.getElementById('drawerOverlay');
        if (drawer && overlay) {
            if (isOpen) {
                drawer.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                drawer.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    },

    bindGlobalEvents: () => {
        // Scroll Behavior for Header & Back to Top Button
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            const scrollTopBtn = document.getElementById('scrollTopBtn');

            if (header) {
                header.classList.toggle('header-scrolled', window.scrollY > 50);
            }

            if (scrollTopBtn) {
                if (window.scrollY > 400) {
                    scrollTopBtn.classList.add('visible');
                    scrollTopBtn.style.display = 'flex';
                } else {
                    scrollTopBtn.classList.remove('visible');
                    scrollTopBtn.style.display = 'none';
                }
            }
        });

        // Close Modals & Mobile Drawer on Backdrop Click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                Modals.closeAll();
            }
            if (e.target.id === 'drawerOverlay') {
                App.toggleMobileMenu(false);
            }
        });

        // Mobile Menu Toggles
        const navToggle = document.getElementById('navToggle');
        const drawerClose = document.getElementById('drawerClose');

        if (navToggle) navToggle.onclick = () => App.toggleMobileMenu(true);
        if (drawerClose) drawerClose.onclick = () => App.toggleMobileMenu(false);

        // Expose closeMobileMenu for inline onclicks
        window.closeMobileMenu = () => App.toggleMobileMenu(false);

        // Close mobile menu on nav link click
        document.querySelectorAll('.drawer-menu .nav-link').forEach(link => {
            link.addEventListener('click', () => App.toggleMobileMenu(false));
        });

        // Escape Key Handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Modals.closeAll();
                App.toggleMobileMenu(false);
            }
        });

        // Hash Change handling for Dashboard/Profile
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash === '#dashboard' || hash === '#profile') {
                const user = AuthService.getUser();
                if (user) {
                    AuthService.renderDashboard();
                    window.scrollTo({ top: document.getElementById('dashboard').offsetTop - 100, behavior: 'smooth' });
                } else {
                    showToast('🔒 Please login to access your profile.');
                    Modals.open('loginModal');
                    window.location.hash = 'home';
                }
            } else {
                const dashboard = document.getElementById('dashboard');
                if (dashboard) dashboard.style.display = 'none';
            }
        });

        // Initialize dashboard if hash is present on load
        if (window.location.hash === '#dashboard' || window.location.hash === '#profile') {
            setTimeout(AuthService.renderDashboard, 1000);
        }

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#dashboard' || href === '#profile') return; // Handled by hashchange

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update active nav link
                    document.querySelectorAll('.nav-link').forEach(nl => nl.classList.remove('active'));
                    document.querySelectorAll(`.nav-link[href="${href}"]`)
                        .forEach(nl => nl.classList.add('active'));
                }
            });
        });

        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showToast('✅ Message sent successfully! We will contact you soon.', 4000);
                contactForm.reset();
            });
        }

        // Initialize AOS-like reveals
        App.initScrollReveal();
    },

    initScrollReveal: () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal, .reveal-item').forEach(el => observer.observe(el));
    },

    // ═══════ BRICK CALCULATOR ═══════
    initCalculator: () => {
        const calcBtn = document.getElementById('calculateBricks');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', () => {
            const length = parseFloat(document.getElementById('wallLength').value);
            const width = parseFloat(document.getElementById('wallWidth').value);
            const height = parseFloat(document.getElementById('wallHeight').value);
            const brickType = document.getElementById('brickType').value;

            // Validate inputs
            if (!length || length <= 0 || !height || height <= 0) {
                showToast('⚠️ Please enter valid wall dimensions.', 3000);
                return;
            }

            const wallWidth = width || 0.23;

            // Brick dimensions (meters) with mortar
            const brickSizes = {
                standard: { l: 0.228, w: 0.114, h: 0.076, price: 6.5 },
                shiv: { l: 0.228, w: 0.114, h: 0.076, price: 10 },
                premium: { l: 0.228, w: 0.114, h: 0.076, price: 8.5 },
                machine: { l: 0.230, w: 0.110, h: 0.075, price: 9 }
            };

            const brick = brickSizes[brickType] || brickSizes.standard;
            const brickVolume = brick.l * brick.w * brick.h;
            const wallVolume = length * wallWidth * height;
            const totalBricks = Math.ceil(wallVolume / brickVolume);

            // Cement: ~1 bag per 500 bricks (standard wall)
            const cementBags = Math.ceil(totalBricks / 500);
            // Sand: ~0.5 cu.ft per 100 bricks
            const sandCuFt = Math.ceil((totalBricks / 100) * 0.5);
            const totalCost = totalBricks * brick.price;

            // Show results
            const resultsDiv = document.getElementById('calcResults');
            document.getElementById('resultBricks').textContent = totalBricks.toLocaleString('en-IN') + ' bricks';
            document.getElementById('resultCement').textContent = cementBags + ' bags (approx)';
            document.getElementById('resultSand').textContent = sandCuFt + ' cu.ft (approx)';
            document.getElementById('resultCost').textContent = '₹' + totalCost.toLocaleString('en-IN');
            document.getElementById('resultDelivery').textContent = 'Available — Same-day in Jaunpur';

            if (resultsDiv) {
                resultsDiv.classList.add('show');
                resultsDiv.style.display = 'block';
            }

            showToast('✅ Calculation complete!', 3000);
        });
    },

    // ═══════ COUNTER ANIMATION ═══════
    initCounters: () => {
        const counters = document.querySelectorAll('.counter');
        if (counters.length === 0) return;

        const animateCounter = (counter) => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const start = 0;
            const startTime = performance.now();

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.floor(start + (target - start) * easeOut);

                counter.textContent = currentValue.toLocaleString('en-IN');

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString('en-IN');
                }
            };

            requestAnimationFrame(updateCounter);
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        counters.forEach(counter => counterObserver.observe(counter));
    },

    // ═══════ CHATBOT INIT ═══════
    initChatbot: () => {
        const toggleBtn = document.getElementById('chatbotToggle');
        const chatbot = document.getElementById('chatbot');
        const closeBtn = document.getElementById('chatbotClose');
        const sendBtn = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');
        const messagesDiv = document.getElementById('chatbotMessages');

        if (!chatbot || !toggleBtn) return;

        // Toggle chatbot
        toggleBtn.addEventListener('click', () => {
            chatbot.classList.toggle('active');
            if (chatbot.classList.contains('active') && input) {
                setTimeout(() => input.focus(), 300);
            }
        });

        // Close chatbot
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                chatbot.classList.remove('active');
            });
        }

        // Simple chatbot responses
        const handleChatMessage = () => {
            if (!input || !messagesDiv) return;
            const text = input.value.trim();
            if (!text) return;

            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'chatbot-message user-message';
            userMsg.innerHTML = `<p>${text}</p>`;
            messagesDiv.appendChild(userMsg);
            input.value = '';

            // Bot response after delay
            setTimeout(() => {
                const response = App.chatbotResponse(text);
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot-message';
                botMsg.innerHTML = `<p>${response}</p>`;
                messagesDiv.appendChild(botMsg);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 800);

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        };

        if (sendBtn) sendBtn.addEventListener('click', handleChatMessage);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleChatMessage();
            });
        }
    },

    chatbotResponse: (text) => {
        const input = text.toLowerCase();

        if (input.includes('price') || input.includes('कीमत') || input.includes('rate') || input.includes('cost')) {
            return 'Our brick prices: Standard ₹6.5/pc, Premium ₹8.5/pc, Machine Made ₹9/pc, Shiv Eent ₹10-11/pc. Call +91 91989 23230 for bulk pricing!';
        }
        if (input.includes('delivery') || input.includes('डिलीवरी') || input.includes('time')) {
            return 'We offer same-day delivery in Jaunpur district! For Varanasi and surrounding areas, delivery takes 1-2 days. Call us for details.';
        }
        if (input.includes('quality') || input.includes('गुणवत्ता')) {
            return 'All our bricks are first-class quality — well-burnt, uniform shape, metallic sound when struck, and less than 20% water absorption.';
        }
        if (input.includes('order') || input.includes('buy') || input.includes('ऑर्डर') || input.includes('खरीद')) {
            return 'To place an order, call us at +91 91989 23230 or WhatsApp us. You can also add products to cart on this website!';
        }
        if (input.includes('hi') || input.includes('hello') || input.includes('namaste') || input.includes('नमस्ते')) {
            return 'Namaste! 🙏 Welcome to Gurukripa Bricks. How can I help you today? Ask about prices, delivery, or quality!';
        }
        if (input.includes('contact') || input.includes('phone') || input.includes('call') || input.includes('संपर्क')) {
            return 'Contact us: 📞 +91 91989 23230 | 📧 info@gurukripaentudyog.com | 📍 Jaunpur, Uttar Pradesh';
        }
        if (input.includes('address') || input.includes('location') || input.includes('पता')) {
            return 'Address: गुरुकृपा ईंट उद्योग, नेवादा, जलालपुर-चावरी रोड, जलालपुर, जौनपुर (उ.प्र.) — 222001';
        }

        return 'Thank you for your message! For detailed information, please call us at +91 91989 23230 or WhatsApp. We\'re happy to help! 😊';
    }
};

// Start the Application
document.addEventListener('DOMContentLoaded', App.init);

// Expose Globals for HTML event handlers
window.App = App;
window.Modals = Modals;
window.TranslationService = TranslationService;
window.AuthService = AuthService;
window.CartService = CartService;
window.ProductService = ProductService;
window.showToast = showToast;

// FAQ Accordion Logic
window.toggleFaq = (button) => {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');

    // Close other items
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

    if (!isActive) {
        item.classList.add('active');
    }
};

// Form Handlers
window.handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    showToast('✅ Success! You are subscribed to our newsletter.', 'success');
    e.target.reset();
};

window.submitOrder = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const payment = data.payment;

    if (!payment) {
        showToast('⚠️ Please select a payment method.', 3000);
        return;
    }

    const currentCart = CartService.getCart();
    if (!currentCart || currentCart.length === 0) {
        showToast('⚠️ Your cart is empty!', 3000);
        return;
    }

    // Capture snapshot of cart data before clearing
    const cartSnapshot = JSON.parse(JSON.stringify(currentCart));
    const isUPI = ['gpay', 'phonepe', 'paytm'].includes(payment);

    if (isUPI) {
        showToast(`🚀 Redirecting to UPI Pay (${payment.toUpperCase()})...`, 2000);
        // Simulate deep link: 
        // window.location.href = `upi://pay?pa=gurukripa@upi&pn=GurukripaBricks&am=${amount}&cu=INR`;
    } else {
        showToast('📦 Processing your Cash on Delivery order...', 2000);
    }

    setTimeout(() => {
        generateInvoice(data, cartSnapshot);
        CartService.clearCart();
        Modals.close('checkoutModal');
        showToast('✅ Order successful! Your invoice is ready.', 5000);
        e.target.reset();
    }, 2500);
};

function generateInvoice(custData, cartItems) {
    const isHindi = TranslationService.getLanguage() === 'hi';
    const invNum = `GB-${Date.now().toString().slice(-6)}`;
    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Helper to get payment label
    const paymentLabels = {
        'gpay': 'Google Pay',
        'phonepe': 'PhonePe',
        'paytm': 'Paytm',
        'cod': 'Cash on Delivery'
    };

    // Fill Invoice Modal - Use querySelector for robustness
    const setInner = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setInner('invNumber', invNum);
    setInner('invDate', date);
    setInner('invCustName', custData.name || 'N/A');
    setInner('invCustMobile', custData.mobile || 'N/A');
    setInner('invCustAddr', custData.address || 'N/A');
    setInner('invMethod', paymentLabels[custData.payment] || custData.payment.toUpperCase());
    setInner('invTxn', `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`);

    const itemsTable = document.getElementById('invItems');
    if (!itemsTable) return;

    let subtotal = 0;
    itemsTable.innerHTML = cartItems.map((item, index) => {
        const total = (item.price || 0) * (item.quantity || 1);
        subtotal += total;
        const name = isHindi ? (item.nameHi || item.name) : (item.name || 'Product');
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${name}</td>
                <td>₹${(item.price || 0).toFixed(2)}</td>
                <td>${item.quantity || 1}</td>
                <td>₹${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    setInner('invSubtotal', `₹${subtotal.toFixed(2)}`);
    setInner('invTotal', `₹${subtotal.toFixed(2)}`);

    Modals.open('invoiceModal');
}

window.downloadInvoicePDF = () => {
    const element = document.getElementById('invoiceArea');
    if (!element || typeof html2pdf === 'undefined') {
        showToast('⚠️ PDF generator is loading, please wait...', 3000);
        return;
    }

    const invNum = document.getElementById('invNumber')?.textContent || 'Invoice';

    const opt = {
        margin: 5, // smaller margin
        filename: `Invoice_${invNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    showToast('📄 Generating PDF, please wait...', 2000);
    html2pdf().set(opt).from(element).save();
};

window.logoutUser = () => {
    AuthService.logout();
    window.location.reload();
};

window.navigateTo = (page) => {
    showToast(`Redirecting to ${page}...`, 2000);
    window.location.hash = page;
};

// ═══════ AUTH FORM HANDLERS ═══════
window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const remember = e.target.querySelector('input[name="remember"]')?.checked;

    if (!email || !password) {
        showToast('⚠️ Please fill in all fields.', 3000);
        return;
    }

    try {
        await AuthService.login(email, password, remember);
        Modals.close('loginModal');
    } catch (err) {
        showToast('❌ Login failed. Please check your credentials.', 3000);
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const mobile = document.getElementById('register-mobile').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const address = document.getElementById('register-address').value;

    if (!name || !mobile || !email || !password) {
        showToast('⚠️ Please fill in all required fields.', 3000);
        return;
    }

    if (password.length < 6) {
        showToast('⚠️ Password must be at least 6 characters.', 3000);
        return;
    }

    if (password !== confirmPassword) {
        showToast('⚠️ Passwords do not match.', 3000);
        return;
    }

    try {
        await AuthService.register({ name, mobile, email, address });
        Modals.close('registerModal');
    } catch (err) {
        showToast('❌ Registration failed. Please try again.', 3000);
    }
};

// ═══════ PASSWORD TOGGLE ═══════
window.toggleLoginPassword = () => {
    const input = document.getElementById('login-password');
    const btn = document.getElementById('loginPasswordToggle');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        if (btn) btn.textContent = input.type === 'password' ? '👁' : '🔒';
    }
};

window.toggleRegisterPassword = () => {
    const input = document.getElementById('register-password');
    const btn = document.getElementById('regPasswordToggle');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        if (btn) btn.textContent = input.type === 'password' ? '👁' : '🔒';
    }
};

window.toggleRegisterConfirmPassword = () => {
    const input = document.getElementById('register-confirm-password');
    const btn = document.getElementById('regConfirmPasswordToggle');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        if (btn) btn.textContent = input.type === 'password' ? '👁' : '🔒';
    }
};

// ═══════ UTILITY FUNCTIONS ═══════
window.scrollToSection = (selector) => {
    const target = document.querySelector(selector);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.proceedToCheckout = () => {
    if (CartService.getCount() === 0) {
        showToast('⚠️ Your cart is empty. Add products first!', 3000);
        return;
    }
    Modals.close('cartModal');
    Modals.open('checkoutModal');
};

// Product Service Shortcuts
window.setCategory = (cat) => ProductService.setCategory(cat);
window.setSearch = (val) => ProductService.setSearch(val);
window.setSort = (val) => ProductService.setSort(val);
window.setLanguage = (lang) => TranslationService.setLanguage(lang);
window.viewProductDetails = (id) => ProductService.viewProductDetails(id);
window.addToCart = (id) => CartService.addToCart(id);
window.openCart = () => Modals.open('cartModal');
window.closeCart = () => Modals.close('cartModal');
window.openLoginModal = () => Modals.open('loginModal');
window.closeLoginModal = () => Modals.close('loginModal');
window.openRegisterModal = () => Modals.open('registerModal');
window.closeRegisterModal = () => Modals.close('registerModal');
window.ProductService = ProductService;
