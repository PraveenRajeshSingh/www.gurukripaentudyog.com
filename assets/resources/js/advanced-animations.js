// ============================================
// ADVANCED ANIMATIONS
// ============================================

(function() {
    'use strict';

    // ============================================
    // PARALLAX SCROLL EFFECTS
    // ============================================
    
    function initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length === 0) return;

        function updateParallax() {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.parallax) || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }

        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ============================================
    // SCROLL-TRIGGERED ANIMATIONS
    // ============================================
    
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-animate]');
        
        if (animatedElements.length === 0) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animation = element.dataset.animate || 'fadeInUp';
                    
                    element.classList.add('animated', `animate-${animation}`);
                    observer.unobserve(element);
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    // ============================================
    // ANIMATED COUNTERS
    // ============================================
    
    function initAnimatedCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        if (counters.length === 0) return;

        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    animateCounter(entry.target);
                    entry.target.classList.add('counted');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    function animateCounter(element) {
        const target = parseFloat(element.dataset.counter) || parseFloat(element.textContent);
        const duration = parseInt(element.dataset.duration) || 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = formatNumber(target, element.dataset.format);
                clearInterval(timer);
            } else {
                element.textContent = formatNumber(Math.floor(current), element.dataset.format);
            }
        }, 16);
    }

    function formatNumber(num, format) {
        if (format === 'currency') {
            return '₹' + num.toLocaleString('en-IN');
        } else if (format === 'percentage') {
            return num + '%';
        } else if (format === 'decimal') {
            return num.toFixed(1);
        }
        return num.toLocaleString('en-IN');
    }

    // ============================================
    // ANIMATED PROGRESS BARS
    // ============================================
    
    function initProgressBars() {
        const progressBars = document.querySelectorAll('[data-progress]');
        
        if (progressBars.length === 0) return;

        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('progress-animated')) {
                    animateProgressBar(entry.target);
                    entry.target.classList.add('progress-animated');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        progressBars.forEach(bar => {
            observer.observe(bar);
        });
    }

    function animateProgressBar(element) {
        const target = parseInt(element.dataset.progress) || 0;
        const duration = parseInt(element.dataset.duration) || 1500;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.style.width = target + '%';
                clearInterval(timer);
            } else {
                element.style.width = current + '%';
            }
        }, 16);
    }

    // ============================================
    // 3D TILT EFFECTS
    // ============================================
    
    function initTiltEffects() {
        const tiltElements = document.querySelectorAll('[data-tilt]');
        
        tiltElements.forEach(element => {
            element.addEventListener('mousemove', function(e) {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
            
            element.addEventListener('mouseleave', function() {
                element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }

    // ============================================
    // STICKY HEADER ANIMATIONS
    // ============================================
    
    function initStickyHeader() {
        const header = document.querySelector('.modern-nav');
        if (!header) return;

        let lastScroll = 0;
        const scrollThreshold = 100;

        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;

            if (currentScroll > scrollThreshold) {
                header.classList.add('scrolled');
                
                // Shrink header on scroll down
                if (currentScroll > lastScroll && currentScroll > 200) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }
            } else {
                header.classList.remove('scrolled');
                header.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    // ============================================
    // SMOOTH PAGE TRANSITIONS
    // ============================================
    
    function initPageTransitions() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || !href) return;
                
                const target = document.querySelector(href);
                if (!target) return;
                
                e.preventDefault();
                
                // Fade out current section
                const currentSection = document.querySelector('.section.visible') || document.querySelector('.section');
                if (currentSection) {
                    currentSection.style.opacity = '0';
                    currentSection.style.transform = 'translateY(20px)';
                }
                
                // Fade in target section
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    setTimeout(() => {
                        target.style.opacity = '1';
                        target.style.transform = 'translateY(0)';
                        target.classList.add('visible');
                    }, 300);
                }, 300);
            });
        });
    }

    // ============================================
    // FLOATING ACTION BUTTONS
    // ============================================
    
    function initFloatingButtons() {
        const fabButtons = document.querySelectorAll('.fab, .whatsapp-float, .chatbot-toggle');
        
        fabButtons.forEach(button => {
            // Add pulse animation
            button.style.animation = 'fabPulse 2s ease-in-out infinite';
            
            // Add hover effect
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }

    // ============================================
    // INITIALIZE ALL ANIMATIONS
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initParallax();
                initScrollAnimations();
                initAnimatedCounters();
                initProgressBars();
                initTiltEffects();
                initStickyHeader();
                initPageTransitions();
                initFloatingButtons();
            });
        } else {
            initParallax();
            initScrollAnimations();
            initAnimatedCounters();
            initProgressBars();
            initTiltEffects();
            initStickyHeader();
            initPageTransitions();
            initFloatingButtons();
        }
    }

    init();

    // Export functions
    window.initAnimatedCounters = initAnimatedCounters;
    window.initProgressBars = initProgressBars;

})();

