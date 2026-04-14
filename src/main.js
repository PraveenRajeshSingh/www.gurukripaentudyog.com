/**
 * Gurukripa Bricks - Application Entry Point
 * Initializes all modular services and standardized components.
 */

const App = {
    init: () => {
        console.log('🚀 Gurukripa Bricks Initializing...');

        try {
            App.initTheme();

            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(err => {
                        console.error('❌ Service Worker failed:', err);
                    });
                });
            }

            App.initValidation();

            safeExecute(() => {
                TranslationService.init();
                AuthService.init();
                CartService.init();
                ProductService.init();
            });

            App.handleRouting();
            App.bindGlobalEvents();

            // Initialize Extracted Modules
            if (window.BrickCalculator) BrickCalculator.init();
            if (window.Chatbot) Chatbot.init();

            // Profile Sync on Init
            const user = AuthService.getUser();
            if (user) {
                AuthService.syncAllAvatars(user);
                App.updateMobileNavProfileState();
            } else {
                App.updateMobileNavProfileState();
            }

            App.initFabMenu();

            console.log('✅ Gurukripa Bricks Ready.');
        } catch (error) {
            console.error('💥 Initialization error:', error);
        } finally {
            if (window.AOS) {
                AOS.init({ duration: 500, easing: 'ease-out-cubic', once: true, offset: 50 });
            }
            setTimeout(App.hideLoader, 500);
        }
    },

    hideLoader: () => {
        const loaders = document.querySelectorAll('#pageLoader, #page-loader, .page-loader');
        loaders.forEach(loader => {
            loader.style.transition = 'opacity 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 600);
        });
        document.body.classList.remove('loading');
    },

    handleRouting: () => {
        const spaRedirectRaw = localStorage.getItem('spa_redirect');
        if (spaRedirectRaw) {
            try {
                const redirect = JSON.parse(spaRedirectRaw);
                localStorage.removeItem('spa_redirect');
                let path = redirect.path.replace('/www.gurukripaentudyog.com', '');
                if (!path.startsWith('#') && path !== '/') {
                    window.location.hash = '#' + (path.startsWith('/') ? path.substring(1) : path);
                }
            } catch (e) { localStorage.removeItem('spa_redirect'); }
        }

        let hash = window.location.hash || '#home';
        if (!hash.startsWith('#')) hash = '#' + hash;

        // Clean URL mapping
        const path = window.location.pathname.replace('/www.gurukripaentudyog.com', '');
        if (path && path !== '/' && path !== '/index.html' && hash === '#home') {
            hash = '#' + (path.startsWith('/') ? path.substring(1) : path);
        }

        const sectionId = hash.substring(1);
        const protectedRoutes = ['dashboard', 'profile', 'orders', 'settings'];
        
        if (protectedRoutes.includes(sectionId) && !AuthService.getUser()) {
            window.location.hash = '#home';
            Modals.open('loginModal');
            return;
        }

        if (sectionId === 'dashboard' || protectedRoutes.includes(sectionId)) {
            App.renderDashboard();
        } else {
            App.renderSection(sectionId);
        }

        App.updateActiveStates();
    },

    renderDashboard: () => {
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            document.querySelectorAll('header.hero-section, section:not(.modal)').forEach(s => {
                if (s.id !== 'dashboard' && !s.classList.contains('header')) s.style.display = 'none';
            });
            dashboard.style.display = 'block';
            AuthService.renderDashboard();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    renderSection: (sectionId) => {
        document.querySelectorAll('header.hero-section, section:not(.modal)').forEach(s => {
            if (s.id !== 'dashboard' && !s.classList.contains('header')) s.style.display = '';
        });
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.style.display = 'none';

        const target = document.getElementById(sectionId) || (sectionId === 'home' ? document.documentElement : null);
        
        if (target) {
            const header = document.querySelector('.header');
            const headerOffset = header ? header.offsetHeight : 80;
            
            setTimeout(() => {
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: sectionId === 'home' ? 0 : offsetPosition,
                    behavior: 'smooth'
                });
            }, 50);
        }
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
    },

    updateActiveStates: () => {
        const hash = window.location.hash || '#home';
        document.querySelectorAll('.nav-link, .drawer-menu a, .mobile-bottom-nav a').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === hash || (hash === '#home' && (href === '#' || href === '#home')));
        });
    },

    bindGlobalEvents: () => {
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        const contactForm = document.getElementById('contactForm');

        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (header) header.classList.toggle('header-scrolled', window.scrollY > 50);
            
            if (scrollTopBtn) {
                const visible = window.scrollY > 400;
                scrollTopBtn.classList.toggle('visible', visible);
                scrollTopBtn.style.display = visible ? 'flex' : 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) Modals.closeAll();
            if (e.target.id === 'drawerOverlay') App.toggleMobileMenu(false);
        });

        const navToggle = document.getElementById('navToggle');
        if (navToggle) navToggle.onclick = () => App.toggleMobileMenu(!navToggle.classList.contains('active'));

        document.querySelectorAll('.drawer-menu .nav-link').forEach(link => {
            link.addEventListener('click', () => App.toggleMobileMenu(false));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { Modals.closeAll(); App.toggleMobileMenu(false); }
        });

        window.addEventListener('hashchange', () => App.handleRouting());

        App.initScrollReveal();
        App.initActiveLinkObserver();
        App.updateMobileNavProfileState();

        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showToast('✅ Message sent successfully! We will contact you soon.', 4000);
                contactForm.reset();
            });
        }
    },

    initScrollReveal: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    const anim = entry.target.dataset.animation;
                    if (anim) entry.target.classList.add(anim);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        document.querySelectorAll('.reveal, .reveal-item, [data-aos]').forEach(el => observer.observe(el));
    },

    initActiveLinkObserver: () => {
        const sections = document.querySelectorAll('section[id], header[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    document.querySelectorAll('.nav-link').forEach(nl => nl.classList.toggle('active', nl.getAttribute('href') === `#${id}`));
                }
            });
        }, { threshold: 0.5, rootMargin: '-80px 0px -20% 0px' });
        sections.forEach(section => observer.observe(section));
    },

    initTheme: () => {
        const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        App.updateThemeUI(theme);
    },

    updateThemeUI: (theme) => {
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = theme === 'dark' ? 'ion-ios-sunny-outline' : 'ion-ios-moon-outline';
    },

    initValidation: () => {
        document.querySelectorAll('form').forEach(form => {
            form.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('input', () => App.handleValidation(input));
            });
        });
    },

    handleValidation: (input) => {
        if (!window.Validation) return;
        const val = input.value.trim();
        if (val === '') { Validation.clear(input); return; }
        if (input.type === 'email' && !Validation.isEmail(val)) Validation.showError(input, 'Invalid email');
        else if (input.name === 'mobile' && !Validation.isPhone(val)) Validation.showError(input, 'Invalid mobile');
        else Validation.showSuccess(input);
    },

    initFabMenu: () => {
        const wrapper = document.getElementById('supportFab');
        const mainBtn = document.getElementById('fabMainBtn');
        if (!mainBtn || !wrapper) return;
        mainBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('active');
        });
        document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) wrapper.classList.remove('active'); });
    },

    updateMobileNavProfileState: () => {
        const user = AuthService.getUser();
        const btn = document.getElementById('mobileNavProfileBtn');
        const avatar = document.getElementById('mobileNavAvatar');
        if (!btn) return;

        btn.classList.toggle('logged-in', !!user);
        const icon = btn.querySelector('i');
        if (icon) icon.className = user ? 'ion-ios-contact' : 'ion-ios-person';

        if (avatar && user) {
            const span = avatar.querySelector('span');
            const img = avatar.querySelector('img');
            if (user.profileImage) {
                if (img) { img.src = user.profileImage; img.style.display = 'block'; }
                if (span) span.style.display = 'none';
            } else {
                if (span) { span.innerHTML = AuthService.getInitials(user.name || 'U'); span.style.display = 'flex'; }
                if (img) img.style.display = 'none';
            }
        } else if (avatar) {
            const span = avatar.querySelector('span');
            const img = avatar.querySelector('img');
            if (span) { span.innerHTML = '<i class="ion-ios-person"></i>'; span.style.display = 'flex'; }
            if (img) img.style.display = 'none';
        }
    },

    toggleTheme: () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        App.updateThemeUI(next);
        showToast(next === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 2500);
    }
};

// Global Handlers
window.navigateTo = (page) => {
    const cleanPage = page.replace(/^[\/#]+/, '');
    const targetHash = '#' + (cleanPage || 'home');
    window.closeUserDropdown();
    if (window.closeMobileMenu) window.closeMobileMenu();

    if (cleanPage === 'cart') { openCart(); return; }

    if (window.location.hash === targetHash) App.handleRouting();
    else window.location.hash = targetHash;

    if (['dashboard', 'profile', 'orders'].includes(cleanPage)) window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openProfileModal = () => {
    const user = AuthService.getUser();
    if (!user) { Modals.open('loginModal'); return; }
    Modals.open('profileModal');
    document.querySelectorAll('.profile-user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.profile-user-email').forEach(el => el.textContent = user.email);
    const initials = AuthService.getInitials(user.name);
    document.querySelectorAll('.profile-avatar-container span').forEach(el => el.textContent = initials);
};

window.logoutUser = () => {
    AuthService.logout();
    App.updateMobileNavProfileState();
    window.location.hash = '#home';
};

window.toggleUserDropdown = (e) => {
    if (e) e.stopPropagation();
    const d = document.getElementById('userDropdown');
    if (d) d.classList.toggle('active');
};

window.closeUserDropdown = () => {
    const d = document.getElementById('userDropdown');
    if (d) d.classList.remove('active');
};

window.toggleFaq = (btn) => {
    const item = btn.parentElement;
    const active = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!active) item.classList.add('active');
};

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await AuthService.login(email, pass);
        Modals.close('loginModal');
    } catch (err) { showToast('❌ Login failed'); }
};

window.proceedToCheckout = () => {
    const count = CartService.getCount();
    if (count === 0) {
        showToast('⚠️ Your cart is empty. Please add products before checking out.');
        return;
    }
    
    // Ensure user is logged in
    const user = AuthService.getUser();
    if (!user) {
        showToast('🔐 Please login or register to proceed to checkout.');
        Modals.close('cartModal');
        Modals.open('loginModal');
        return;
    }

    Modals.close('cartModal');
    Modals.open('checkoutModal');
    // Pre-fill user data if available
    const nameInput = document.getElementById('checkout-name');
    const mobileInput = document.getElementById('checkout-mobile');
    if (nameInput && user.name) nameInput.value = user.name;
    if (mobileInput && user.mobile) mobileInput.value = user.mobile;
};

// Start App
document.addEventListener('DOMContentLoaded', () => App.init());

// Expose Globals
window.App = App;
window.Modals = Modals;
window.AuthService = AuthService;
window.CartService = CartService;
window.ProductService = ProductService;
window.TranslationService = TranslationService;
window.showToast = showToast;
window.openCart = () => Modals.open('cartModal');
window.openLoginModal = () => Modals.open('loginModal');
window.openRegisterModal = () => Modals.open('registerModal');
window.toggleTheme = () => App.toggleTheme();
window.handleProfileClick = () => window.openProfileModal();
window.setLanguage = (lang) => TranslationService.setLanguage(lang);
window.closeMobileMenu = () => App.toggleMobileMenu(false);

window.handleRegister = async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const mobile = document.getElementById('register-mobile').value;
    const pass = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm-password').value;

    if (pass !== confirm) { showToast('❌ Passwords do not match'); return; }

    try {
        await AuthService.register({ name, email, mobile, password: pass });
        Modals.close('registerModal');
    } catch (err) { showToast('❌ Registration failed'); }
};

window.openEditProfileModal = () => {
    const user = AuthService.getUser();
    if (!user) return;
    Modals.open('editProfileModal');
    const nameInput = document.getElementById('editName');
    const emailInput = document.getElementById('editEmail');
    const phoneInput = document.getElementById('editPhone');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.mobile || '';

    // Update preview
    const initials = AuthService.getInitials(user.name);
    const span = document.getElementById('editProfileInitials');
    const img = document.getElementById('editProfilePreview');
    if (user.profileImage) {
        if (img) { img.src = user.profileImage; img.style.display = 'block'; }
        if (span) span.style.display = 'none';
    } else {
        if (span) { span.textContent = initials; span.style.display = 'flex'; }
        if (img) img.style.display = 'none';
    }
};

window.handleProfileUpdate = (e) => {
    e.preventDefault();
    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    const mobile = document.getElementById('editPhone').value;
    AuthService.updateUser({ name, email, mobile });
    Modals.close('editProfileModal');
};

window.handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        AuthService.updateProfileImage(event.target.result);
    };
    reader.readAsDataURL(file);
};

window.switchProfileTab = (tabId) => {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-pane').forEach(p => p.classList.remove('active'));
    const tab = document.querySelector(`.profile-tab[data-tab="${tabId}"]`);
    const pane = document.getElementById(`tab-${tabId}`);
    if (tab) tab.classList.add('active');
    if (pane) pane.classList.add('active');
};

// Password Toggles
const toggleP = (id, btn) => {
    const i = document.getElementById(id);
    if (!i) return;
    const isP = i.type === 'password';
    i.type = isP ? 'text' : 'password';
    btn.textContent = isP ? '🙈' : '👁';
};
window.toggleLoginPassword = () => toggleP('login-password', document.getElementById('loginPasswordToggle'));
window.toggleRegisterPassword = () => toggleP('register-password', document.getElementById('regPasswordToggle'));
window.toggleRegisterConfirmPassword = () => toggleP('register-confirm-password', document.getElementById('regConfirmPasswordToggle'));

// Newsletter
window.handleNewsletterSubmit = (e) => {
    e.preventDefault();
    showToast('🎉 Thank you for subscribing to our newsletter!', 4000);
    e.target.reset();
};

// Order Submission
window.submitOrder = (e) => {
    e.preventDefault();
    const count = CartService.getCount();
    if (count === 0) {
        showToast('⚠️ Your cart is empty');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Place Order';
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ion-load-c animate-spin"></i> Processing...';
    }

    showToast('⏳ Securely processing your order...');
    
    setTimeout(() => {
        const orderData = {
            items: CartService.getCart(),
            total: CartService.getTotal(),
            customer: {
                name: document.getElementById('checkout-name').value,
                mobile: document.getElementById('checkout-mobile').value,
                address: document.getElementById('checkout-address').value
            },
            date: new Date().toISOString()
        };
        
        console.log('📦 Order Placed:', orderData);
        
        CartService.clearCart();
        Modals.close('checkoutModal');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }

        showToast('🎉 Order placed successfully! Check your email for confirmation.', 6000);
        navigateTo('home');
    }, 2000);
};

// ── Backward Compatibility Aliases ──
window.closeRegisterModal = () => Modals.close('registerModal');
window.openCart = () => Modals.open('cartModal');

// ── Counter Animation (for city sections) ──
function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (!target || isNaN(target)) return;
    
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current.toLocaleString('en-IN');
    }, 16);
}

// Trigger counters when visible
(function initCounters() {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.counter[data-target]');
                counters.forEach(animateCounter);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.section-cities, .cities-grid').forEach(el => {
            counterObserver.observe(el);
        });
        document.querySelectorAll('.city-card').forEach(el => {
            counterObserver.observe(el);
        });
    });
})();

// ── Improved FAQ Toggle (CSS max-height approach) ──
window.toggleFaq = (btn) => {
    const item = btn.closest('.faq-item') || btn.parentElement;
    const isActive = item.classList.contains('active');
    
    // Close all
    document.querySelectorAll('.faq-item.active').forEach(i => {
        i.classList.remove('active');
    });
    
    // Toggle clicked
    if (!isActive) {
        item.classList.add('active');
    }
};

