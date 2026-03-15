/**
 * Gurukripa Bricks - Application Entry Point
 * Initializes all modular services and standardized components.
 */

// Application State
const App = {
    init: () => {
        console.log('🚀 Gurukripa Bricks Initializing...');

        try {
            // Initialize Theme
            App.initTheme();

            // Register PWA Service Worker
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(reg => {
                        console.log('📡 Service Worker registered:', reg.scope);
                    }).catch(err => {
                        console.error('❌ Service Worker registration failed:', err);
                    });
                });
            }

            // Initialize Form Validation
            App.initValidation();

            // Initialize Core Services
            safeExecute(() => {
                TranslationService.init();
                AuthService.init();
                CartService.init();
                ProductService.init();
            }, null, 'Core initialization failed');

            // Handle initial routing (deep linking)
            App.handleRouting();

            // Global Event Listeners
            App.bindGlobalEvents();

            // Initialize Calculator
            App.initCalculator();

            // Initialize Counters
            App.initCounters();

            // Initialize Chatbot Toggle
            App.initChatbot();

            // Initialize FAB Menu
            App.initFabMenu();

            console.log('✅ Gurukripa Bricks Ready.');
        } catch (error) {
            console.error('💥 Critical initialization error:', error);
        } finally {
            // Initialize AOS
            if (window.AOS) {
                AOS.init({
                    duration: 800,
                    easing: 'ease-in-out',
                    once: true,
                    offset: 100
                });
            }

            // Finalize UI - Always ensure loader disappears
            setTimeout(App.hideLoader, 500);
        }
    },

    hideLoader: () => {
        const loaders = document.querySelectorAll('#pageLoader, #page-loader, .page-loader');
        loaders.forEach(loader => {
            loader.style.transition = 'opacity 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        });
        document.body.classList.remove('loading');
    },

    handleRouting: () => {
        let hash = window.location.hash || '#home';
        if (!hash.startsWith('#')) hash = '#' + hash;

        const sectionId = hash.substring(1);
        const sections = ['home', 'products', 'blog', 'about', 'cities', 'contact', 'dashboard', 'categories'];

        // Protected Routes check
        const protectedRoutes = ['dashboard', 'profile', 'orders', 'settings'];
        if (protectedRoutes.includes(sectionId)) {
            const user = AuthService.getUser();
            if (!user) {
                window.location.hash = '#home';
                Modals.open('loginModal');
                return;
            }
        }

        // Standard Routing Logic
        if (sectionId === 'home' || sectionId === '') {
            document.querySelectorAll('header.hero-section, section:not(.modal)').forEach(s => {
                if (s.id !== 'dashboard' && !s.classList.contains('header')) {
                    s.style.display = '';
                }
            });
            const dashboard = document.getElementById('dashboard');
            if (dashboard) dashboard.style.display = 'none';
        } else {
            // Show only the target section if it's a "page" style section
            // or just ensure targeting works if we are coming from a hidden state
            const target = document.getElementById(sectionId);
            if (target) {
                document.querySelectorAll('header.hero-section, section:not(.modal)').forEach(s => {
                    if (s.id !== 'dashboard' && !s.classList.contains('header')) {
                        s.style.display = ''; // Restore visibility to all for normal scrolling
                    }
                });
                const dashboard = document.getElementById('dashboard');
                if (dashboard) dashboard.style.display = 'none';

                // Smooth scroll to target
                setTimeout(() => {
                    const offset = 80;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = target.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }

        // Render Dashboard if active
        if (sectionId === 'dashboard' || protectedRoutes.includes(sectionId)) {
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                document.querySelectorAll('header.hero-section, section:not(.modal)').forEach(s => {
                    if (s.id !== 'dashboard' && !s.classList.contains('header')) {
                        s.style.display = 'none';
                    }
                });
                dashboard.style.display = 'block';
                AuthService.renderDashboard();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        App.updateActiveStates();
    },

    toggleMobileMenu: (force) => {
        const drawer = document.getElementById('mobileDrawer');
        const overlay = document.getElementById('drawerOverlay');
        const toggle = document.querySelector('.nav-toggle');

        const isActive = force !== undefined ? force : !drawer.classList.contains('active');

        if (drawer) drawer.classList.toggle('active', isActive);
        if (overlay) overlay.classList.toggle('active', isActive);
        if (toggle) toggle.classList.toggle('active', isActive);

        document.body.style.overflow = isActive ? 'hidden' : '';

        // If closing, ensure active states are updated
        if (!isActive) App.updateActiveStates();
    },

    updateActiveStates: () => {
        const hash = window.location.hash || '#home';
        document.querySelectorAll('.nav-link, .drawer-menu a, .mobile-bottom-nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href === hash || (hash === '#home' && (href === '#' || href === '#home')))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    updateMobileNavProfileState: () => {
        const user = AuthService.getUser();
        const avatarContainer = document.getElementById('mobileNavAvatar');
        if (avatarContainer) {
            const span = avatarContainer.querySelector('span');
            const img = avatarContainer.querySelector('img');

            if (user && user.profileImage) {
                if (img) {
                    img.src = user.profileImage;
                    img.style.display = 'block';
                }
                if (span) span.style.display = 'none';
                avatarContainer.style.border = '2px solid var(--primary)';
            } else if (user) {
                // Logged in but no image
                if (span) {
                    span.innerHTML = `<i class="ion-ios-person"></i>`;
                    span.style.display = 'flex';
                }
                if (img) img.style.display = 'none';
                avatarContainer.style.border = '2px solid var(--primary)';
            } else {
                // Logged out
                if (span) {
                    span.innerHTML = `<i class="ion-ios-person"></i>`;
                    span.style.display = 'flex';
                }
                if (img) img.style.display = 'none';
                avatarContainer.style.border = '1.5px solid var(--border-main)';
            }
        }
    },

    bindGlobalEvents: () => {
        // Explicitly fetch elements
        const navToggle = document.getElementById('navToggle');
        const drawerClose = document.getElementById('drawerClose');
        const contactForm = document.getElementById('contactForm');
        const scrollTopBtn = document.getElementById('scrollTopBtn');

        // Scroll Behavior for Header & Back to Top Button
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');

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
        if (navToggle) {
            navToggle.onclick = () => {
                const isOpen = !navToggle.classList.contains('active');
                App.toggleMobileMenu(isOpen);
            };
        }
        if (drawerClose) {
            drawerClose.onclick = () => App.toggleMobileMenu(false);
        }

        // Expose closeMobileMenu and profile sync for inline onclicks
        window.closeMobileMenu = () => App.toggleMobileMenu(false);
        window.updateMobileNavProfileState = App.updateMobileNavProfileState;

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

        // Hash Change handling - Core Navigation
        window.addEventListener('hashchange', () => {
            App.handleRouting();
        });

        // Initialized auth & profile state
        App.updateMobileNavProfileState();
        window.handleProfileClick = App.handleProfileClick;
        window.updateMobileNavProfileState = App.updateMobileNavProfileState;
        window.toggleTheme = App.toggleTheme;

        // Smooth scroll for nav links & Auto-close drawer
        document.querySelectorAll('.nav-link, .drawer-menu .nav-link, a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href || !href.startsWith('#') || href === '#') return;
                if (href === '#dashboard' || href === '#profile') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    App.toggleMobileMenu(false); // Close drawer on click

                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Immediate active class update
                    document.querySelectorAll('.nav-link').forEach(nl => nl.classList.remove('active'));
                    document.querySelectorAll(`.nav-link[href="${href}"]`).forEach(nl => nl.classList.add('active'));
                }
            });
        });

        // Highlight nav links on scroll
        App.initActiveLinkObserver();

        // Contact form submission with enhanced validation
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let isValid = true;

                // Standardized IDs
                const name = (document.getElementById('contactName') || document.getElementById('contact-name'))?.value;
                const email = (document.getElementById('contactEmail') || document.getElementById('contact-email'))?.value;
                const phone = (document.getElementById('contactPhone') || document.getElementById('contact-phone'))?.value;

                // Simple Regex
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^[0-9]{10}$/;

                if (!name) { isValid = false; showToast('⚠️ Name is required', 3000); }
                else if (email && !emailRegex.test(email)) { isValid = false; showToast('⚠️ Invalid email format', 3000); }
                else if (phone && !phoneRegex.test(phone)) { isValid = false; showToast('⚠️ Please enter a valid 10-digit phone number', 3000); }

                if (!isValid) return;

                showToast('✅ Message sent successfully! We will contact you soon.', 4000);
                contactForm.reset();
                contactForm.querySelectorAll('.form-group').forEach(g => {
                    g.classList.remove('valid', 'invalid');
                });
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
                    // Add animation class if specified
                    const animation = entry.target.dataset.animation;
                    if (animation) {
                        entry.target.classList.add(animation);
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal, .reveal-item, [data-aos]').forEach(el => observer.observe(el));
    },

    initActiveLinkObserver: () => {
        const sections = document.querySelectorAll('section[id], header[id]');
        const options = {
            threshold: 0.5,
            rootMargin: '-80px 0px -20% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    const activeLinks = document.querySelectorAll(`.nav-link[href="#${id}"]`);
                    if (activeLinks.length > 0) {
                        document.querySelectorAll('.nav-link').forEach(nl => nl.classList.remove('active'));
                        activeLinks.forEach(nl => nl.classList.add('active'));
                    }
                }
            });
        }, options);

        sections.forEach(section => observer.observe(section));
    },

    // ═══════ PROFILE & AUTH HELPERS ═══════
    handleProfileClick: () => {
        const user = AuthService.getUser();
        if (user) {
            // Open profile modal - Ensure openProfileModal is global or use Modals.open
            if (window.openProfileModal) {
                window.openProfileModal();
            } else {
                Modals.open('profileModal');
            }
        } else {
            // Open login modal
            if (window.openLoginModal) {
                window.openLoginModal();
            } else {
                Modals.open('loginModal');
            }
            showToast('🔒 Please login to view your profile.');
        }
    },

    updateMobileNavProfileState: () => {
        const user = AuthService.getUser();
        const btn = document.getElementById('mobileNavProfileBtn');
        if (!btn) return;
        if (user) {
            btn.classList.add('logged-in');
            btn.setAttribute('title', 'Profile: ' + (user.name || 'User'));
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'ion-ios-contact';
        } else {
            btn.classList.remove('logged-in');
            btn.setAttribute('title', 'Login / Profile');
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'ion-ios-person';
        }
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

    // ═══════ THEME SYSTEM ═══════
    initTheme: () => {
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || systemTheme;

        document.documentElement.setAttribute('data-theme', theme);
        App.updateThemeUI(theme);
    },

    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        App.updateThemeUI(newTheme);

        // Visual feedback
        if (typeof showToast !== 'undefined') {
            showToast(`🌙 ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode Activated`);
        }
    },

    updateThemeUI: (theme) => {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'dark' ? 'ion-ios-sunny-outline' : 'ion-ios-moon-outline';
        }
    },

    // ═══════ FORM VALIDATION ═══════
    initValidation: () => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => App.handleRealTimeValidation(input));
                input.addEventListener('blur', () => App.handleRealTimeValidation(input));
            });
        });
    },

    handleRealTimeValidation: (input) => {
        if (!window.Validation) return;

        const val = input.value.trim();
        const type = input.type;
        const name = input.name;

        if (val === '') {
            Validation.clear(input);
            return;
        }

        if (type === 'email') {
            if (!Validation.isEmail(val)) {
                Validation.showError(input, 'Please enter a valid email address');
            } else {
                Validation.showSuccess(input);
            }
        } else if (name === 'mobile') {
            if (!Validation.isPhone(val)) {
                Validation.showError(input, 'Enter 10 digit mobile number');
            } else {
                Validation.showSuccess(input);
            }
        } else if (type === 'password' && input.id === 'register-password') {
            if (val.length < 6) {
                Validation.showError(input, 'Password must be at least 6 characters');
            } else {
                Validation.showSuccess(input);
            }
        } else if (input.id === 'register-confirm-password') {
            const pass = document.getElementById('register-password').value;
            if (val !== pass) {
                Validation.showError(input, 'Passwords do not match');
            } else {
                Validation.showSuccess(input);
            }
        }
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

    // ═══════ FAB MENU INIT ═══════
    initFabMenu: () => {
        const fabMain = document.getElementById('fabMainBtn');
        const fabWrapper = document.getElementById('supportFab');
        const mainIcon = document.getElementById('mainIcon');
        const closeIcon = document.getElementById('closeIcon');

        if (!fabMain || !fabWrapper) return;

        fabMain.addEventListener('click', (e) => {
            e.stopPropagation();
            fabWrapper.classList.toggle('active');
            if (fabWrapper.classList.contains('active')) {
                if (mainIcon) mainIcon.style.display = 'none';
                if (closeIcon) closeIcon.style.display = 'block';
            } else {
                if (mainIcon) mainIcon.style.display = 'block';
                if (closeIcon) closeIcon.style.display = 'none';
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!fabWrapper.contains(e.target) && fabWrapper.classList.contains('active')) {
                fabWrapper.classList.remove('active');
                if (mainIcon) mainIcon.style.display = 'block';
                if (closeIcon) closeIcon.style.display = 'none';
            }
        });
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
// document.addEventListener('DOMContentLoaded', App.init); // Removed duplicate call

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
        // Calculate amount for deep link
        const totalAmount = cartSnapshot.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // On mobile, try to open the UPI app
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            const upiUrl = `upi://pay?pa=gurukripa@upi&pn=GurukripaBricks&am=${totalAmount}&cu=INR&tn=Order_${Date.now()}`;
            window.location.href = upiUrl;
        }
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

// Navigation and Auth helper functions moved to window scope


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

// ═══════ MOBILE PROFILE BUTTON HANDLER ═══════
/**
 * Handles the Profile button in the mobile bottom nav.
 * - If logged in → open the profile modal
 * - If not logged in → open the login modal
 */
window.handleProfileClick = () => {
    const user = AuthService.getUser();
    if (user) {
        window.openProfileModal();
    } else {
        Modals.open('loginModal');
    }
};

window.handleMobileProfileClick = window.handleProfileClick; // Alias for consistency


/**
 * Opens the profile modal and populates user data.
 */
window.openProfileModal = () => {
    const user = AuthService.getUser();
    if (!user) {
        Modals.open('loginModal');
        return;
    }

    // Open Modal first
    Modals.open('profileModal');

    // Populate Data — Modern Card IDs
    const nameEls = document.querySelectorAll('.profile-user-name, #profileModalName');
    const emailEls = document.querySelectorAll('.profile-user-email, #profileModalEmail');
    const roleEls = document.querySelectorAll('.profile-user-role, #profileModalRole');
    const initialEls = document.querySelectorAll('.profile-avatar-container span, #profileModalInitial');
    const imgEls = document.querySelectorAll('.profile-avatar-container img, #profileModalImg');

    const initials = AuthService.getInitials(user.name);

    nameEls.forEach(el => el.textContent = user.name || 'User');
    emailEls.forEach(el => el.textContent = user.email || '');
    roleEls.forEach(el => el.textContent = user.role || 'Member');

    // Handle Profile Image/Initials
    if (user.profileImage) {
        imgEls.forEach(img => {
            img.src = user.profileImage;
            img.style.display = 'block';
        });
        initialEls.forEach(span => span.style.display = 'none');
    } else {
        imgEls.forEach(img => img.style.display = 'none');
        initialEls.forEach(span => {
            span.textContent = initials;
            span.style.display = 'block';
        });
    }

    // Sync stats
    const cartCountEl = document.getElementById('profileCartCount');
    if (cartCountEl) {
        const count = CartService.getCartCount();
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'flex' : 'none';
    }

    // Random/Static values for demo purposes
    const ordersStat = document.getElementById('profileStatOrders');
    if (ordersStat) ordersStat.textContent = '3'; // Demo fallback

    // Apply translation for the newly opened modal
    if (window.TranslationService) {
        TranslationService.translatePage();
    }
};

window.openEditProfileModal = () => {
    const user = AuthService.getUser();
    if (!user) return;

    const form = document.getElementById('editProfileForm');
    if (form) {
        form.name.value = user.name || '';
        form.email.value = user.email || '';
        form.phone.value = user.phone || '';

        // Handle Preview
        const preview = document.getElementById('editProfilePreview');
        const initials = document.getElementById('editProfileInitials');
        if (user.profileImage) {
            if (preview) {
                preview.src = user.profileImage;
                preview.style.display = 'block';
            }
            if (initials) initials.style.display = 'none';
        } else {
            if (preview) preview.style.display = 'none';
            if (initials) {
                initials.textContent = AuthService.getInitials(user.name);
                initials.style.display = 'flex';
            }
        }
    }
    Modals.open('editProfileModal');
};

window.handleProfileUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone')
    };

    AuthService.updateUser(data);
    Modals.close('editProfileModal');
    // Re-open profile modal to show changes
    setTimeout(() => window.openProfileModal(), 300);
};

window.handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select an image file', 3000);
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast('❌ Image too large (Max 2MB)', 3000);
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        AuthService.updateProfileImage(event.target.result);
    };
    reader.readAsDataURL(file);
};

/**
 * Switches tabs within the profile modal.
 */
window.switchProfileTab = (tabId) => {
    // Update tab triggers
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update tab panes
    document.querySelectorAll('.profile-tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });
};

/**
 * Updates the mobile bottom nav profile button appearance
 */
window.updateMobileNavProfileState = () => {
    const btn = document.getElementById('mobileNavProfileBtn');
    const user = AuthService.getUser();
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (user) {
        btn.classList.add('logged-in');
        btn.setAttribute('title', 'Profile: ' + (user.name || 'User'));
        if (icon) icon.className = 'ion-ios-contact';
    } else {
        btn.classList.remove('logged-in');
        btn.setAttribute('title', 'Login / Profile');
        if (icon) icon.className = 'ion-ios-person';
    }
};

// Initialize profile button state on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.updateMobileNavProfileState, 1200);
});

/**
 * Mobile-specific: Swipe to close for bottom-sheet modals
 */
function initMobileSwipeClose(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || window.innerWidth > 768) return;

    const content = modal.querySelector('.modal-content') || modal.querySelector('.profile-modal-content');
    if (!content) return;

    let startY = 0;
    let currentY = 0;

    const onTouchStart = (e) => {
        startY = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        if (diff > 0) {
            content.style.transform = `translateY(${diff}px)`;
            content.style.transition = 'none';
        }
    };

    const onTouchEnd = () => {
        const diff = currentY - startY;
        if (diff > 100) {
            Modals.close(modalId);
        }
        content.style.transform = '';
        content.style.transition = 'transform 0.3s ease';
    };

    content.addEventListener('touchstart', onTouchStart, { passive: true });
    content.addEventListener('touchmove', onTouchMove, { passive: true });
    content.addEventListener('touchend', onTouchEnd);
}

// ═══════ CLOUD/GLOBAL EXPORTS ═══════
// These are exposed to the global window object for HTML onclick handlers
// NOTE: openProfileModal is already defined above at line ~1003 with full data-populating logic.
// Do NOT redefine it here. Just alias what's needed.
window.handleProfileClick = App.handleProfileClick;
window.setLanguage = TranslationService.setLanguage;
window.openCart = () => Modals.open('cartModal');
// openProfileModal: use the full data-populating version defined above
window.openLoginModal = () => Modals.open('loginModal');
window.openRegisterModal = () => Modals.open('registerModal');
window.closeMobileMenu = () => App.toggleMobileMenu(false);
window.calculateBricks = App.initCalculator;
window.toggleMobileMenu = App.toggleMobileMenu;

window.navigateTo = (page) => {
    const targetHash = page.startsWith('#') ? page : '#' + page;
    if (window.location.hash === targetHash) {
        App.handleRouting(); // Force refresh if already on same hash
    } else {
        window.location.hash = targetHash;
    }
};

// NOTE: openEditProfileModal is already defined above at line ~1059. Not redefined here.

window.logoutUser = () => {
    Modals.close('profileModal');
    AuthService.logout();
    if (App.updateMobileNavProfileState) App.updateMobileNavProfileState();
    // Navigate to home instead of '/' which may 404 on GitHub Pages 
    setTimeout(() => { window.location.hash = '#home'; window.scrollTo({ top: 0, behavior: 'smooth' }); }, 500);
};

// NOTE: handleProfileImageUpload and switchProfileTab are already defined above.
// Not redefined here to avoid overwriting the data-aware versions.

// Initialized by App.init
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
