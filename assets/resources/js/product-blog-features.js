// ============================================
// PRODUCT & BLOG SECTION FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // PRODUCT IMAGE SLIDER ON HOVER
    // ============================================
    
    function initProductImageSlider() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const imageWrapper = card.querySelector('.product-image-wrapper');
            if (!imageWrapper) return;
            
            const mainImage = imageWrapper.querySelector('img');
            if (!mainImage) return;
            
            // Get additional images from data attribute
            const additionalImages = card.dataset.images ? JSON.parse(card.dataset.images) : [];
            
            if (additionalImages.length === 0) return;
            
            // Create slider
            const slider = document.createElement('div');
            slider.className = 'product-image-slider';
            
            // Add main image
            const mainSlide = document.createElement('div');
            mainSlide.style.width = '100%';
            mainSlide.style.height = '100%';
            mainSlide.appendChild(mainImage.cloneNode(true));
            slider.appendChild(mainSlide);
            
            // Add additional images
            additionalImages.forEach(imgSrc => {
                const slide = document.createElement('div');
                slide.style.width = '100%';
                slide.style.height = '100%';
                const img = document.createElement('img');
                img.src = imgSrc;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                slide.appendChild(img);
                slider.appendChild(slide);
            });
            
            imageWrapper.appendChild(slider);
            
            // Auto-slide on hover
            let currentSlide = 0;
            let slideInterval;
            
            card.addEventListener('mouseenter', function() {
                slideInterval = setInterval(() => {
                    currentSlide = (currentSlide + 1) % slider.children.length;
                    slider.scrollTo({
                        left: currentSlide * imageWrapper.offsetWidth,
                        behavior: 'smooth'
                    });
                }, 2000);
            });
            
            card.addEventListener('mouseleave', function() {
                clearInterval(slideInterval);
                currentSlide = 0;
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            });
        });
    }

    // ============================================
    // MAGNIFYING GLASS EFFECT
    // ============================================
    
    function initMagnifyingGlass() {
        const productImages = document.querySelectorAll('.product-image-wrapper');
        
        productImages.forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (!img) return;
            
            const magnifier = document.createElement('div');
            magnifier.className = 'product-image-magnifier';
            
            const magnifiedImg = img.cloneNode(true);
            magnifiedImg.style.width = '300px';
            magnifiedImg.style.height = '300px';
            magnifiedImg.style.objectFit = 'none';
            magnifier.appendChild(magnifiedImg);
            
            wrapper.appendChild(magnifier);
            
            wrapper.addEventListener('mousemove', function(e) {
                const rect = wrapper.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                magnifier.style.left = (x - 75) + 'px';
                magnifier.style.top = (y - 75) + 'px';
                
                // Calculate zoom position
                const zoomX = (x / rect.width) * (magnifiedImg.width - rect.width);
                const zoomY = (y / rect.height) * (magnifiedImg.height - rect.height);
                
                magnifiedImg.style.objectPosition = `-${zoomX}px -${zoomY}px`;
            });
        });
    }

    // ============================================
    // INFINITE SCROLL FOR PRODUCTS
    // ============================================
    
    function initInfiniteScroll() {
        const grid = document.querySelector('.products-grid');
        if (!grid) return;
        
        const loader = document.createElement('div');
        loader.className = 'infinite-scroll-loader';
        loader.innerHTML = '<div class="spinner"></div><p>Loading more products...</p>';
        grid.parentElement.appendChild(loader);
        
        let loading = false;
        let page = 1;
        
        const observer = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting && !loading) {
                loadMoreProducts(page + 1);
            }
        }, { threshold: 0.1 });
        
        observer.observe(loader);
        
        function loadMoreProducts(nextPage) {
            loading = true;
            loader.classList.add('active');
            
            // Simulate API call
            setTimeout(() => {
                // Add more products here
                // const newProducts = await fetchProducts(nextPage);
                // renderProducts(newProducts);
                
                page = nextPage;
                loading = false;
                loader.classList.remove('active');
            }, 1000);
        }
    }

    // ============================================
    // PRELOAD IMAGES ON HOVER
    // ============================================
    
    function initImagePreload() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                const images = card.querySelectorAll('img[data-src]');
                images.forEach(img => {
                    if (img.dataset.src && !img.src) {
                        const preloadImg = new Image();
                        preloadImg.src = img.dataset.src;
                        preloadImg.onload = function() {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        };
                    }
                });
            });
        });
    }

    // ============================================
    // COMPARE PRODUCTS FEATURE
    // ============================================
    
    const compareList = [];
    
    function initCompareProducts() {
        const compareCheckboxes = document.querySelectorAll('.compare-checkbox');
        
        compareCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const productId = this.dataset.productId;
                const productData = getProductData(this.closest('.product-card'));
                
                if (this.checked) {
                    if (compareList.length < 4) {
                        compareList.push({ id: productId, data: productData });
                        updateCompareUI();
                        if (typeof showToast === 'function') {
                            showToast('Added to Compare', `Product added (${compareList.length}/4)`, 'success');
                        }
                    } else {
                        this.checked = false;
                        if (typeof showToast === 'function') {
                            showToast('Limit Reached', 'Maximum 4 products can be compared', 'warning');
                        }
                    }
                } else {
                    compareList = compareList.filter(item => item.id !== productId);
                    updateCompareUI();
                }
            });
        });
    }

    function getProductData(card) {
        return {
            title: card.querySelector('.product-title')?.textContent || '',
            price: card.querySelector('.product-price')?.textContent || '',
            image: card.querySelector('img')?.src || '',
            rating: card.querySelector('.rating-value')?.textContent || ''
        };
    }

    function updateCompareUI() {
        // Show compare button if items selected
        let compareBar = document.getElementById('compareBar');
        if (!compareBar && compareList.length > 0) {
            compareBar = document.createElement('div');
            compareBar.id = 'compareBar';
            compareBar.style.cssText = 'position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: var(--primary-color); color: white; padding: 15px 30px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 1000; display: flex; align-items: center; gap: 20px;';
            compareBar.innerHTML = `
                <span>${compareList.length} product(s) selected</span>
                <button onclick="openCompareModal()" style="background: white; color: var(--primary-color); border: none; padding: 8px 20px; border-radius: 25px; cursor: pointer; font-weight: 600;">Compare</button>
                <button onclick="clearCompare()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 20px; border-radius: 25px; cursor: pointer;">Clear</button>
            `;
            document.body.appendChild(compareBar);
        } else if (compareBar && compareList.length === 0) {
            compareBar.remove();
        } else if (compareBar) {
            compareBar.querySelector('span').textContent = `${compareList.length} product(s) selected`;
        }
    }

    window.openCompareModal = function() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px;">
                <div class="modal-header">
                    <h2>Compare Products</h2>
                    <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: repeat(${compareList.length}, 1fr); gap: 20px;">
                        ${compareList.map(item => `
                            <div>
                                <img src="${item.data.image}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                                <h3>${item.data.title}</h3>
                                <p class="product-price">${item.data.price}</p>
                                <p>Rating: ${item.data.rating}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.clearCompare = function() {
        compareList.length = 0;
        document.querySelectorAll('.compare-checkbox').forEach(cb => cb.checked = false);
        const compareBar = document.getElementById('compareBar');
        if (compareBar) compareBar.remove();
    };

    // ============================================
    // PRICE DROP ALERTS
    // ============================================
    
    function initPriceDropAlerts() {
        const productCards = document.querySelectorAll('.product-card[data-original-price]');
        
        productCards.forEach(card => {
            const originalPrice = parseFloat(card.dataset.originalPrice);
            const currentPrice = parseFloat(card.querySelector('.product-price')?.textContent.replace(/[^0-9.]/g, '') || '0');
            
            if (currentPrice < originalPrice) {
                const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                
                const alert = document.createElement('div');
                alert.className = 'price-drop-alert';
                alert.textContent = `-${discount}% OFF`;
                card.querySelector('.product-image-wrapper').appendChild(alert);
            }
        });
    }

    // ============================================
    // AI RECOMMENDATIONS
    // ============================================
    
    function generateAIRecommendations() {
        const userBehavior = {
            viewed: JSON.parse(localStorage.getItem('viewedProducts') || '[]'),
            cart: JSON.parse(localStorage.getItem('cart') || '[]'),
            wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]')
        };
        
        // Simple recommendation logic
        const recommendations = [];
        
        if (userBehavior.viewed.length > 0) {
            recommendations.push({
                type: 'similar',
                title: 'Similar Products',
                products: userBehavior.viewed.slice(0, 3)
            });
        }
        
        if (userBehavior.wishlist.length > 0) {
            recommendations.push({
                type: 'wishlist',
                title: 'From Your Wishlist',
                products: userBehavior.wishlist.slice(0, 3)
            });
        }
        
        displayRecommendations(recommendations);
    }

    function displayRecommendations(recommendations) {
        let container = document.getElementById('aiRecommendations');
        if (!container && recommendations.length > 0) {
            container = document.createElement('div');
            container.id = 'aiRecommendations';
            container.className = 'ai-recommendations';
            document.querySelector('.section-products').appendChild(container);
        }
        
        if (container && recommendations.length > 0) {
            container.innerHTML = `
                <h3>
                    AI Recommendations
                    <span class="recommendation-badge">Smart Suggestions</span>
                </h3>
                <div class="products-grid">
                    ${recommendations.map(rec => `
                        <div class="recommendation-section">
                            <h4>${rec.title}</h4>
                            <!-- Products will be rendered here -->
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // ============================================
    // BLOG SEARCH FUNCTIONALITY
    // ============================================
    
    function initBlogSearch() {
        const searchInput = document.querySelector('.blog-search input');
        if (!searchInput) return;
        
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length < 2) {
                showAllBlogPosts();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchBlogPosts(query);
            }, 300);
        });
    }

    function searchBlogPosts(query) {
        const blogCards = document.querySelectorAll('.blog-card');
        let results = 0;
        
        blogCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(query)) {
                card.style.display = '';
                card.classList.add('search-match');
                results++;
            } else {
                card.style.display = 'none';
                card.classList.remove('search-match');
            }
        });
        
        // Show results count
        if (typeof showToast === 'function') {
            showToast('Search Results', `Found ${results} blog post(s)`, 'info', 2000);
        }
    }

    function showAllBlogPosts() {
        document.querySelectorAll('.blog-card').forEach(card => {
            card.style.display = '';
            card.classList.remove('search-match');
        });
    }

    // ============================================
    // FEATURED BLOG SLIDER
    // ============================================
    
    function initFeaturedBlogSlider() {
        const slider = document.querySelector('.featured-blog-slider');
        if (!slider) return;
        
        const slides = slider.querySelectorAll('.featured-slide');
        if (slides.length === 0) return;
        
        let currentSlide = 0;
        slides[0].classList.add('active');
        
        const prevBtn = slider.querySelector('.slider-prev');
        const nextBtn = slider.querySelector('.slider-next');
        const dots = slider.querySelectorAll('.slider-dot');
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].classList.add('active');
            if (dots[index]) dots[index].classList.add('active');
            
            currentSlide = index;
        }
        
        function nextSlide() {
            const next = (currentSlide + 1) % slides.length;
            showSlide(next);
        }
        
        function prevSlide() {
            const prev = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(prev);
        }
        
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showSlide(index));
        });
        
        // Auto-play
        setInterval(nextSlide, 5000);
    }

    // ============================================
    // RELATED ARTICLES
    // ============================================
    
    function initRelatedArticles() {
        const currentCategory = document.querySelector('.blog-card.active')?.dataset.category;
        if (!currentCategory) return;
        
        const relatedContainer = document.querySelector('.related-articles-grid');
        if (!relatedContainer) return;
        
        const relatedPosts = Array.from(document.querySelectorAll('.blog-card'))
            .filter(card => card.dataset.category === currentCategory && !card.classList.contains('active'))
            .slice(0, 3);
        
        relatedContainer.innerHTML = '';
        relatedPosts.forEach(post => {
            relatedContainer.appendChild(post.cloneNode(true));
        });
    }

    // ============================================
    // SOCIAL SHARE BUTTONS
    // ============================================
    
    function initSocialShare() {
        const shareButtons = document.querySelectorAll('.social-share-btn');
        
        shareButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const platform = this.classList[1]; // facebook, twitter, etc.
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);
                
                let shareUrl = '';
                
                switch(platform) {
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                        break;
                    case 'whatsapp':
                        shareUrl = `https://wa.me/?text=${title}%20${url}`;
                        break;
                    case 'linkedin':
                        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                        break;
                }
                
                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=400');
                }
            });
        });
    }

    // ============================================
    // BREADCRUMB NAVIGATION
    // ============================================
    
    function initBreadcrumb() {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;
        
        const path = window.location.pathname.split('/').filter(p => p);
        const currentPage = document.title;
        
        breadcrumb.innerHTML = `
            <a href="/">Home</a>
            <span class="breadcrumb-separator">/</span>
            ${path.map((segment, index) => {
                const isLast = index === path.length - 1;
                const href = '/' + path.slice(0, index + 1).join('/');
                const label = segment.charAt(0).toUpperCase() + segment.slice(1);
                
                return isLast 
                    ? `<span>${label}</span>`
                    : `<a href="${href}">${label}</a><span class="breadcrumb-separator">/</span>`;
            }).join('')}
        `;
    }

    // ============================================
    // INITIALIZE ALL FEATURES
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initProductImageSlider();
                initMagnifyingGlass();
                initInfiniteScroll();
                initImagePreload();
                initCompareProducts();
                initPriceDropAlerts();
                generateAIRecommendations();
                initBlogSearch();
                initFeaturedBlogSlider();
                initRelatedArticles();
                initSocialShare();
                initBreadcrumb();
            });
        } else {
            initProductImageSlider();
            initMagnifyingGlass();
            initInfiniteScroll();
            initImagePreload();
            initCompareProducts();
            initPriceDropAlerts();
            generateAIRecommendations();
            initBlogSearch();
            initFeaturedBlogSlider();
            initRelatedArticles();
            initSocialShare();
            initBreadcrumb();
        }
    }

    init();

    // Export functions
    window.clearCompare = clearCompare;
    window.openCompareModal = openCompareModal;

})();

