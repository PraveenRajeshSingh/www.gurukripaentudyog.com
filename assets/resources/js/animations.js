// Comprehensive Animation System
(function() {
    'use strict';
    
    // Initialize animations on page load
    function initAnimations() {
        // Add animate-on-scroll classes to elements
        const animateElements = document.querySelectorAll('.box, .product-card, .blog-card, .testimonial-card, .city-card, .quality-box, .stat-box');
        animateElements.forEach((el, index) => {
            el.classList.add('animate-on-scroll');
            el.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Add left/right animation classes
        const leftElements = document.querySelectorAll('.steps-box:first-child, .brick-image-container');
        leftElements.forEach(el => {
            el.classList.add('animate-on-scroll-left');
        });
        
        const rightElements = document.querySelectorAll('.steps-box:last-child, .works-step');
        rightElements.forEach(el => {
            el.classList.add('animate-on-scroll-right');
        });
        
        // Add scale animation to cards
        const scaleElements = document.querySelectorAll('.product-card, .blog-card');
        scaleElements.forEach(el => {
            el.classList.add('animate-on-scroll-scale');
        });
    }
    
    // Intersection Observer for scroll animations
    function initScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    // Mark section as animated
                    const section = entry.target.closest('section');
                    if (section) {
                        section.classList.add('animate-in');
                    }
                }
            });
        }, observerOptions);
        
        // Observe all animate-on-scroll elements
        const animateElements = document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right, .animate-on-scroll-scale');
        animateElements.forEach(el => {
            observer.observe(el);
        });
        
        // Observe sections
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            observer.observe(section);
        });
    }
    
    // Parallax effect for header
    function initParallax() {
        const header = document.querySelector('header');
        if (!header) return;
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;
            header.style.transform = `translateY(${rate}px)`;
        });
    }
    
    // Animate counters
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        const observerOptions = {
            threshold: 0.5
        };
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-target'));
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    let current = 0;
                    
                    counter.classList.add('counted');
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            counter.textContent = target;
                            clearInterval(timer);
                        } else {
                            counter.textContent = Math.floor(current);
                        }
                    }, 16);
                }
            });
        }, observerOptions);
        
        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }
    
    // Stagger animation for lists
    function staggerAnimation(elements, delay = 100) {
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'all 0.6s ease-out';
                
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 50);
            }, index * delay);
        });
    }
    
    // Animate navigation items on load
    function animateNavigation() {
        const navItems = document.querySelectorAll('.main-nav li');
        staggerAnimation(navItems, 100);
    }
    
    // Animate buttons on hover
    function initButtonAnimations() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px) scale(1.05)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
            
            button.addEventListener('mousedown', function() {
                this.style.transform = 'translateY(-1px) scale(0.98)';
            });
            
            button.addEventListener('mouseup', function() {
                this.style.transform = 'translateY(-3px) scale(1.05)';
            });
        });
    }
    
    // Animate images on load
    function animateImages() {
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            img.style.opacity = '0';
            img.style.transform = 'scale(0.9)';
            img.style.transition = 'all 0.6s ease-out';
            
            if (img.complete) {
                setTimeout(() => {
                    img.style.opacity = '1';
                    img.style.transform = 'scale(1)';
                }, index * 50);
            } else {
                img.addEventListener('load', function() {
                    setTimeout(() => {
                        this.style.opacity = '1';
                        this.style.transform = 'scale(1)';
                    }, index * 50);
                });
            }
        });
    }
    
    // Smooth scroll with animation
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#!') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Animate form inputs on focus
    function initFormAnimations() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.02)';
                this.parentElement.style.transition = 'transform 0.3s ease';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
        });
    }
    
    // Page transition effect
    function initPageTransition() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease-in';
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
        });
    }
    
    // Animate cards on hover
    function initCardAnimations() {
        const cards = document.querySelectorAll('.card, .product-card, .blog-card, .testimonial-card, .city-card, .quality-box');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
                this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    
    // Initialize all animations
    function init() {
        initAnimations();
        initScrollAnimations();
        initParallax();
        animateCounters();
        animateNavigation();
        initButtonAnimations();
        animateImages();
        initSmoothScroll();
        initFormAnimations();
        initPageTransition();
        initCardAnimations();
        
        // Add loaded class to body
        document.body.classList.add('animations-loaded');
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Re-initialize on dynamic content load
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
            initScrollAnimations();
            animateCounters();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
})();


