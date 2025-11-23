// ============================================
// IMAGE & GRID FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // LAZY LOADING WITH BLUR-UP
    // ============================================
    
    function initLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img[loading="lazy"]');
            
            images.forEach(img => {
                img.addEventListener('load', function() {
                    this.classList.add('loaded');
                }, { once: true });
                
                // Add placeholder if image fails
                img.addEventListener('error', function() {
                    this.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'image-placeholder';
                    placeholder.innerHTML = '<i class="ion-ios-image"></i> Image not available';
                    this.parentElement.appendChild(placeholder);
                });
            });
        } else {
            // Fallback for older browsers
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }

    // ============================================
    // RESPONSIVE IMAGES (SRCSET)
    // ============================================
    
    function initResponsiveImages() {
        const images = document.querySelectorAll('img[data-srcset]');
        
        images.forEach(img => {
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                if (img.dataset.sizes) {
                    img.sizes = img.dataset.sizes;
                }
            }
        });
    }

    // ============================================
    // LIGHTBOX IMAGE VIEWER
    // ============================================
    
    function initLightbox() {
        const lightboxImages = document.querySelectorAll('.image-lightbox, .product-image');
        
        lightboxImages.forEach(img => {
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                openLightbox(this.src, this.alt);
            });
        });
    }

    function openLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox active';
        lightbox.innerHTML = `
            <button class="lightbox-close" aria-label="Close lightbox">
                <i class="ion-ios-close"></i>
            </button>
            <div class="lightbox-content">
                <img src="${src}" alt="${alt || 'Image'}">
            </div>
        `;
        
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';
        
        // Close on click
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target.closest('.lightbox-close')) {
                closeLightbox(lightbox);
            }
        });
        
        // Close on Escape
        const escapeHandler = function(e) {
            if (e.key === 'Escape') {
                closeLightbox(lightbox);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    function closeLightbox(lightbox) {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.remove();
            document.body.style.overflow = '';
        }, 300);
    }

    // ============================================
    // CURSOR GLOW EFFECT
    // ============================================
    
    function initCursorGlow() {
        const cursorGlow = document.createElement('div');
        cursorGlow.className = 'cursor-glow';
        document.body.appendChild(cursorGlow);
        
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });
        
        // Smooth follow animation
        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            
            cursorGlow.style.left = cursorX + 'px';
            cursorGlow.style.top = cursorY + 'px';
            
            // Activate on interactive elements
            const element = document.elementFromPoint(mouseX, mouseY);
            if (element && (element.tagName === 'A' || element.tagName === 'BUTTON' || element.classList.contains('clickable'))) {
                cursorGlow.classList.add('active');
            } else {
                cursorGlow.classList.remove('active');
            }
            
            requestAnimationFrame(animateCursor);
        }
        
        animateCursor();
    }

    // ============================================
    // INFINITE SCROLL GRID
    // ============================================
    
    function initInfiniteScroll() {
        const grid = document.querySelector('.products-grid, .blog-grid');
        if (!grid) return;
        
        const loader = document.createElement('div');
        loader.className = 'infinite-scroll-loader';
        loader.innerHTML = '<div class="spinner"></div><p>Loading more...</p>';
        grid.parentElement.appendChild(loader);
        
        let loading = false;
        let page = 1;
        
        const observer = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting && !loading) {
                loadMoreItems(page + 1);
            }
        }, { threshold: 0.1 });
        
        observer.observe(loader);
        
        function loadMoreItems(nextPage) {
            loading = true;
            loader.classList.add('active');
            
            // Simulate loading (replace with actual API call)
            setTimeout(() => {
                // Add more items to grid
                // grid.appendChild(newItem);
                page = nextPage;
                loading = false;
                loader.classList.remove('active');
            }, 1000);
        }
    }

    // ============================================
    // GRID SKELETON LOADERS
    // ============================================
    
    function showGridSkeleton(container, count = 6) {
        const skeletonGrid = document.createElement('div');
        skeletonGrid.className = 'grid-skeleton';
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card';
            skeleton.innerHTML = `
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                </div>
            `;
            skeletonGrid.appendChild(skeleton);
        }
        
        container.innerHTML = '';
        container.appendChild(skeletonGrid);
    }

    function hideGridSkeleton(container) {
        const skeleton = container.querySelector('.grid-skeleton');
        if (skeleton) {
            skeleton.remove();
        }
    }

    // ============================================
    // WISHLIST FUNCTIONALITY
    // ============================================
    
    function initWishlist() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const wishlistBtn = document.createElement('button');
            wishlistBtn.className = 'wishlist-btn';
            wishlistBtn.innerHTML = '<i class="ion-ios-heart-outline"></i>';
            wishlistBtn.setAttribute('aria-label', 'Add to wishlist');
            
            const productId = card.dataset.id || card.querySelector('h3')?.textContent;
            
            if (isInWishlist(productId)) {
                wishlistBtn.classList.add('active');
                wishlistBtn.innerHTML = '<i class="ion-ios-heart"></i>';
            }
            
            wishlistBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleWishlist(productId, wishlistBtn);
            });
            
            if (card.style.position !== 'relative') {
                card.style.position = 'relative';
            }
            card.appendChild(wishlistBtn);
        });
    }

    function isInWishlist(id) {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        return wishlist.includes(id);
    }

    function toggleWishlist(id, button) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        
        if (wishlist.includes(id)) {
            wishlist = wishlist.filter(item => item !== id);
            button.classList.remove('active');
            button.innerHTML = '<i class="ion-ios-heart-outline"></i>';
            if (typeof showToast === 'function') {
                showToast('Removed', 'Removed from wishlist', 'info');
            }
        } else {
            wishlist.push(id);
            button.classList.add('active');
            button.innerHTML = '<i class="ion-ios-heart"></i>';
            if (typeof showToast === 'function') {
                showToast('Added', 'Added to wishlist', 'success');
            }
        }
        
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    // ============================================
    // RATING STARS
    // ============================================
    
    function initRatingStars() {
        const ratingContainers = document.querySelectorAll('[data-rating]');
        
        ratingContainers.forEach(container => {
            const rating = parseFloat(container.dataset.rating) || 0;
            const stars = Math.round(rating);
            
            container.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.className = 'rating-star';
                if (i <= stars) {
                    star.classList.add('active');
                    star.innerHTML = '<i class="ion-ios-star"></i>';
                } else {
                    star.innerHTML = '<i class="ion-ios-star-outline"></i>';
                }
                container.appendChild(star);
            }
        });
    }

    // ============================================
    // PRODUCT QUICK VIEW MODAL
    // ============================================
    
    function initQuickView() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const quickViewBtn = document.createElement('button');
            quickViewBtn.className = 'quick-view-btn';
            quickViewBtn.textContent = 'Quick View';
            quickViewBtn.style.cssText = 'position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px); opacity: 0; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 25px; cursor: pointer; transition: all 0.3s ease; z-index: 10;';
            
            card.addEventListener('mouseenter', function() {
                quickViewBtn.style.opacity = '1';
                quickViewBtn.style.transform = 'translateX(-50%) translateY(0)';
            });
            
            card.addEventListener('mouseleave', function() {
                quickViewBtn.style.opacity = '0';
                quickViewBtn.style.transform = 'translateX(-50%) translateY(20px)';
            });
            
            quickViewBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openQuickView(card);
            });
            
            if (card.style.position !== 'relative') {
                card.style.position = 'relative';
            }
            card.appendChild(quickViewBtn);
        });
    }

    function openQuickView(card) {
        const productData = {
            title: card.querySelector('h3')?.textContent || 'Product',
            image: card.querySelector('img')?.src || '',
            price: card.querySelector('.product-price')?.textContent || '',
            description: card.querySelector('.product-description')?.textContent || ''
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>${productData.title}</h2>
                    <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <img src="${productData.image}" alt="${productData.title}" style="width: 100%; border-radius: 12px;">
                    <div>
                        <h3>${productData.title}</h3>
                        <p class="product-price" style="font-size: 1.5rem; color: var(--primary-color); font-weight: 700;">${productData.price}</p>
                        <p>${productData.description}</p>
                        <button class="btn btn-primary" style="margin-top: 20px;">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // ============================================
    // PAGE LOADING BAR
    // ============================================
    
    function initLoadingBar() {
        const loadingBar = document.createElement('div');
        loadingBar.className = 'page-loading-bar';
        document.body.appendChild(loadingBar);
        
        // Simulate loading
        loadingBar.classList.add('loading');
        
        window.addEventListener('load', function() {
            loadingBar.classList.remove('loading');
            loadingBar.classList.add('complete');
            setTimeout(() => loadingBar.remove(), 500);
        });
    }

    // ============================================
    // INITIALIZE ALL FEATURES
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initLazyLoading();
                initResponsiveImages();
                initLightbox();
                initCursorGlow();
                initWishlist();
                initRatingStars();
                initQuickView();
                initLoadingBar();
            });
        } else {
            initLazyLoading();
            initResponsiveImages();
            initLightbox();
            initCursorGlow();
            initWishlist();
            initRatingStars();
            initQuickView();
            initLoadingBar();
        }
    }

    init();

    // Export functions
    window.showGridSkeleton = showGridSkeleton;
    window.hideGridSkeleton = hideGridSkeleton;
    window.openLightbox = openLightbox;
    window.toggleWishlist = toggleWishlist;

})();

