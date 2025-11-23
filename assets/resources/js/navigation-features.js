// ============================================
// NAVIGATION FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // STICKY NAVIGATION
    // ============================================
    
    function initStickyNav() {
        const nav = document.querySelector('.modern-nav');
        if (!nav) return;

        let lastScroll = 0;
        const scrollThreshold = 100;

        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;

            if (currentScroll > scrollThreshold) {
                nav.classList.add('scrolled');
                
                // Hide on scroll down, show on scroll up
                if (currentScroll > lastScroll && currentScroll > 200) {
                    nav.style.transform = 'translateY(-100%)';
                } else {
                    nav.style.transform = 'translateY(0)';
                }
            } else {
                nav.classList.remove('scrolled');
                nav.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    // ============================================
    // SMOOTH SCROLL NAVIGATION
    // ============================================
    
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || !href) return;
                
                const target = document.querySelector(href);
                if (!target) return;
                
                e.preventDefault();
                
                const navHeight = document.querySelector('.modern-nav')?.offsetHeight || 0;
                const targetPosition = target.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-drawer');
                if (mobileMenu) {
                    mobileMenu.classList.remove('active');
                }
            });
        });
    }

    // ============================================
    // MOBILE SLIDE DRAWER
    // ============================================
    
    function initMobileDrawer() {
        const navToggle = document.getElementById('navToggle');
        if (!navToggle) return;

        // Create drawer
        const drawer = document.createElement('div');
        drawer.className = 'mobile-drawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <h3>Menu</h3>
                <button class="drawer-close" onclick="closeMobileDrawer()">&times;</button>
            </div>
            <ul class="drawer-menu">
                <li><a href="#home" class="drawer-link">Home</a></li>
                <li><a href="#products" class="drawer-link">Products</a></li>
                <li>
                    <div class="drawer-accordion">
                        <div class="drawer-accordion-header">Categories</div>
                        <div class="drawer-accordion-content">
                            <ul class="drawer-accordion-links">
                                <li><a href="#" onclick="setCategory('all'); closeMobileDrawer();">All Products</a></li>
                                <li><a href="#" onclick="setCategory('shiv'); closeMobileDrawer();">Shiv Eant</a></li>
                                <li><a href="#" onclick="setCategory('premium'); closeMobileDrawer();">Premium</a></li>
                                <li><a href="#" onclick="setCategory('standard'); closeMobileDrawer();">Standard</a></li>
                            </ul>
                        </div>
                    </div>
                </li>
                <li><a href="#blog" class="drawer-link">Blog</a></li>
                <li><a href="#about" class="drawer-link">About</a></li>
                <li><a href="#cities" class="drawer-link">Cities</a></li>
                <li><a href="#contact" class="drawer-link">Contact</a></li>
            </ul>
        `;
        
        const overlay = document.createElement('div');
        overlay.className = 'mobile-drawer-overlay';
        
        document.body.appendChild(drawer);
        document.body.appendChild(overlay);

        navToggle.addEventListener('click', function() {
            drawer.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        overlay.addEventListener('click', function() {
            closeMobileDrawer();
        });

        // Accordion functionality
        drawer.querySelectorAll('.drawer-accordion-header').forEach(header => {
            header.addEventListener('click', function() {
                this.parentElement.classList.toggle('active');
            });
        });

        // Close on link click
        drawer.querySelectorAll('.drawer-link').forEach(link => {
            link.addEventListener('click', function() {
                closeMobileDrawer();
            });
        });
    }

    window.closeMobileDrawer = function() {
        const drawer = document.querySelector('.mobile-drawer');
        const overlay = document.querySelector('.mobile-drawer-overlay');
        if (drawer) drawer.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    // ============================================
    // FLOATING QUICK MENU
    // ============================================
    
    function initFloatingQuickMenu() {
        // Remove existing quick menu if any
        const existing = document.querySelector('.floating-quick-menu');
        if (existing) existing.remove();
        
        const quickMenu = document.createElement('div');
        quickMenu.className = 'floating-quick-menu';
        quickMenu.innerHTML = `
            <a href="https://wa.me/919198923230?text=Hello%20Gurukripa%20Bricks" class="quick-menu-item whatsapp" target="_blank" aria-label="WhatsApp">
                <i class="ion-social-whatsapp"></i>
            </a>
            <a href="tel:+919198923230" class="quick-menu-item call" aria-label="Call Us">
                <i class="ion-ios-telephone"></i>
            </a>
            <button class="quick-menu-item chat" onclick="document.getElementById('chatbotToggle')?.click()" aria-label="Chat with us">
                <i class="ion-ios-chatbubbles"></i>
            </button>
        `;
        document.body.appendChild(quickMenu);
    }

    // ============================================
    // MEGA MENU
    // ============================================
    
    function initMegaMenu() {
        const productsLink = document.querySelector('a[href="#products"]');
        if (!productsLink) return;

        const navItem = productsLink.closest('li');
        if (!navItem) return;

        navItem.classList.add('has-mega-menu');
        
        const megaMenu = document.createElement('div');
        megaMenu.className = 'mega-menu';
        megaMenu.innerHTML = `
            <div class="mega-menu-section">
                <h4>Product Categories</h4>
                <ul class="mega-menu-links">
                    <li><a href="#products" onclick="setCategory('all')"><i class="ion-ios-grid"></i> All Products</a></li>
                    <li><a href="#products" onclick="setCategory('shiv')"><i class="ion-ios-cube"></i> Shiv Eant</a></li>
                    <li><a href="#products" onclick="setCategory('premium')"><i class="ion-ios-star"></i> Premium</a></li>
                    <li><a href="#products" onclick="setCategory('standard')"><i class="ion-ios-square"></i> Standard</a></li>
                    <li><a href="#products" onclick="setCategory('machine')"><i class="ion-ios-gear"></i> Machine Made</a></li>
                </ul>
            </div>
            <div class="mega-menu-section">
                <h4>Quick Links</h4>
                <ul class="mega-menu-links">
                    <li><a href="#about"><i class="ion-ios-information"></i> About Us</a></li>
                    <li><a href="#cities"><i class="ion-ios-location"></i> Service Areas</a></li>
                    <li><a href="#contact"><i class="ion-ios-mail"></i> Contact</a></li>
                    <li><a href="#blog"><i class="ion-ios-book"></i> Blog</a></li>
                </ul>
            </div>
            <div class="mega-menu-section">
                <h4>Information</h4>
                <ul class="mega-menu-links">
                    <li><a href="#quality"><i class="ion-ios-checkmark-circle"></i> Quality Standards</a></li>
                    <li><a href="#cities"><i class="ion-ios-home"></i> Cities We Serve</a></li>
                    <li><a href="tel:+919198923230"><i class="ion-ios-telephone"></i> Call Us</a></li>
                </ul>
            </div>
            <div class="mega-menu-section">
                <h4>Connect</h4>
                <ul class="mega-menu-links">
                    <li><a href="https://wa.me/919198923230" target="_blank"><i class="ion-social-whatsapp"></i> WhatsApp</a></li>
                    <li><a href="https://www.facebook.com/profile.php?id=100080293837397" target="_blank"><i class="ion-social-facebook"></i> Facebook</a></li>
                    <li><a href="https://www.instagram.com/prem_narayan_singh" target="_blank"><i class="ion-social-instagram"></i> Instagram</a></li>
                </ul>
            </div>
        `;
        
        navItem.appendChild(megaMenu);
    }

    // ============================================
    // INITIALIZE
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initStickyNav();
                initSmoothScroll();
                initMobileDrawer();
                initFloatingQuickMenu();
                initMegaMenu();
            });
        } else {
            initStickyNav();
            initSmoothScroll();
            initMobileDrawer();
            initFloatingQuickMenu();
            initMegaMenu();
        }
    }

    init();

})();

