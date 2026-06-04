/**
 * Gurukripa Bricks - Product & Catalog Service
 */
let currentCategory = 'all';
let searchTerm = '';
let currentSort = 'featured';
let currentView = 'grid'; // grid, grid-2, list
let maxPrice = 15; // Price filter ceiling

var ProductService = {
    getProducts: () => {
        let filtered = [...PRODUCTS];

        if (currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === currentCategory);
        }

        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.nameHi.includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.descriptionHi.includes(query)
            );
        }

        // Price filter
        if (maxPrice < 15) {
            filtered = filtered.filter(p => p.price <= maxPrice);
        }

        // Sorting
        switch (currentSort) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'newest':
                filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        return filtered;
    },

    setCategory: (catId) => {
        currentCategory = catId;
        ProductService.renderGrid();
        ProductService.updateActiveTabs();

        // Smooth scroll to products section
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    searchDebounceTimer: null,

    setSearch: (termOrEvent) => {
        let term = '';
        // Handle both event objects and direct string values
        if (typeof termOrEvent === 'object' && termOrEvent.target) {
            term = (termOrEvent.target.value || '');
        } else {
            term = (termOrEvent || '');
        }

        clearTimeout(ProductService.searchDebounceTimer);
        ProductService.searchDebounceTimer = setTimeout(() => {
            searchTerm = term.trim();
            ProductService.renderGrid();
        }, 300);
    },

    setSort: (sortOrEvent) => {
        if (typeof sortOrEvent === 'object' && sortOrEvent.target) {
            currentSort = sortOrEvent.target.value;
        } else {
            currentSort = sortOrEvent;
        }
        ProductService.renderGrid();
    },

    setView: (view) => {
        currentView = view;
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.classList.remove('view-grid', 'view-list');
            grid.classList.add(`view-${view}`, 'animate-fade-in');
        }
        // Update active view buttons
        document.querySelectorAll('.view-btn-icon').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    },

    renderGrid: () => {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const filtered = ProductService.getProducts();

        // Always show skeletons briefly for smooth transition
        ProductService.renderSkeletons();
        setTimeout(() => ProductService.renderFiltered(filtered), 350);
    },

    renderFiltered: (filtered) => {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        const isHindi = typeof TranslationService !== 'undefined' && TranslationService.getLanguage() === 'hi';

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="no-products"><i class="ion-ios-search"></i><p>${isHindi ? 'कोई उत्पाद नहीं मिला' : 'No products found matching your criteria'}</p></div>`;
            return;
        }

        grid.innerHTML = filtered.map(product => ProductService.createCardHTML(product, isHindi)).join('');
    },

    renderSkeletons: () => {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const skeletonCount = 12;
        const skeletonHTML = Array(skeletonCount).fill(0).map(() => `
            <div class="product-skeleton">
                <div class="skeleton-img skeleton"></div>
                <div class="skeleton-line title skeleton"></div>
                <div class="skeleton-line text skeleton"></div>
                <div class="skeleton-line price skeleton"></div>
            </div>
        `).join('');

        grid.innerHTML = skeletonHTML;
    },

    renderRatingStars: (rating = 4.8) => {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="ion-ios-star"></i>';
        }
        if (hasHalf) {
            starsHTML += '<i class="ion-ios-star-half"></i>';
        }
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="ion-ios-star-outline"></i>';
        }
        return starsHTML;
    },

    createCardHTML: (product, isHindi) => {
        const name = isHindi ? product.nameHi : product.name;
        const buyLabel = isHindi ? 'जोड़ें' : 'ADD';
        const detailsLabel = isHindi ? 'विवरण' : 'Details';
        
        // --- Dual-Sided Prioritized Badge System ---
        const leftBadges = [];
        const rightBadges = [];
        
        // RIGHT SIDE: Promotional (Discounts)
        if (product.oldPrice && product.oldPrice > product.price) {
            const pct = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
            rightBadges.push(`<div class="product-badge badge-discount">${pct}% OFF</div>`);
        }
        
        // LEFT SIDE: Status & Marketing
        if (product.tag) {
            leftBadges.push(`<div class="product-badge badge-tag">${product.tag}</div>`);
        }
        if (product.specs && product.specs.strength && parseInt(product.specs.strength) >= 1000) {
            leftBadges.push(`<div class="product-badge badge-strength"><i class="ion-ios-heart"></i> High Strength</div>`);
        }
        if (product.isHot || (product.oldPrice && (product.oldPrice - product.price) / product.oldPrice > 0.2)) {
            leftBadges.push(`<div class="product-badge badge-hot btn-hot-pulse">🔥 HOT</div>`);
        }

        // Stock indicator badge
        let stockBadgeHTML = '';
        if (product.inStock === false) {
            stockBadgeHTML = '<span class="stock-badge stock-out">Out of Stock</span>';
        } else if (product.stockLow) {
            stockBadgeHTML = '<span class="stock-badge stock-low">Low Stock</span>';
        } else {
            stockBadgeHTML = '<span class="stock-badge stock-in">In Stock</span>';
        }

        // Wishlist heart
        const isWished = typeof WishlistService !== 'undefined' && WishlistService.isWishlisted(product.id);
        const heartClass = isWished ? 'wishlist-heart active' : 'wishlist-heart';

        const leftHtml = leftBadges.slice(0, 2).join('');
        const rightHtml = rightBadges.slice(0, 2).join('');

        return `
            <div class="product-card-modern ${product.isNew ? 'is-new' : ''}" data-aos="fade-up" data-product-id="${product.id}">
                <div class="product-badges-left">
                    ${leftHtml}
                </div>
                <div class="product-badges-right">
                    ${rightHtml}
                </div>
                
                <!-- Wishlist Heart -->
                <button class="${heartClass}" data-product-id="${product.id}"
                    onclick="event.stopPropagation(); WishlistService.toggle(${product.id})" aria-label="Toggle wishlist">
                    ♥
                </button>

                <div class="product-image-wrapper" onclick="viewProductDetails(${product.id})">
                    <img src="${product.image}" alt="${name}" loading="lazy" class="product-image"
                         onerror="this.src='src/assets/images/logo-new.svg'">
                    <div class="image-overlay">
                        <span class="overlay-btn" onclick="event.stopPropagation(); viewProductDetails(${product.id})">
                            <i class="ion-ios-search"></i> ${detailsLabel}
                        </span>
                    </div>
                </div>

                <div class="product-info">
                    <h3 class="product-title" onclick="viewProductDetails(${product.id})">${name}</h3>
                    
                    <div class="product-info-row">
                        <span class="product-size-label">${product.specs ? product.specs.size : ''}</span>
                        ${stockBadgeHTML}
                    </div>

                    <div class="product-info-row">
                        <div class="product-rating-stars">
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star-half"></i>
                            <span class="rating-value">${product.rating || '4.8'}</span>
                        </div>
                    </div>
                    
                    <div class="product-footer">
                        <div class="price-block">
                            <span class="product-price">₹${product.price}</span>
                            ${product.oldPrice ? `<span class="product-old-price">₹${product.oldPrice}</span>` : ''}
                        </div>
                        <button class="btn-buy-modern btn-add-cart" onclick="addToCart(${product.id})">
                            ${buyLabel}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    updateActiveTabs: () => {
        // Update filter-tab buttons
        const tabs = document.querySelectorAll('.filter-tab-pill');
        tabs.forEach(tab => {
            const onclickAttr = tab.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/'([^']+)'/);
                if (match) {
                    const cat = match[1];
                    tab.classList.toggle('active', cat === currentCategory);
                }
            }
        });

        // Update category title
        const titleEl = document.getElementById('categoryTitle');
        if (titleEl) {
            if (currentCategory === 'all') {
                titleEl.textContent = 'Serving Jaunpur & Varanasi for 25+ Years';
            } else {
                const cat = CATEGORIES.find(c => c.id === currentCategory);
                if (cat) {
                    titleEl.textContent = `Showing: ${cat.name}`;
                }
            }
        }
    },

    viewProductDetails: (id) => {
        const product = PRODUCTS.find(p => p.id === id);
        if (!product) return;

        const isHindi = typeof TranslationService !== 'undefined' && TranslationService.getLanguage() === 'hi';
        const modal = document.getElementById('productDetailModal');
        if (!modal) return;

        // Fill data
        const title = modal.querySelector('#detailTitle');
        const img = modal.querySelector('#detailImg');
        const price = modal.querySelector('#detailPrice');
        const desc = modal.querySelector('#detailDesc');
        const specs = modal.querySelector('#detailSpecs');
        const buyBtn = modal.querySelector('#detailBuyBtn');

        if (title) title.textContent = isHindi ? product.nameHi : product.name;
        if (img) { img.src = product.image; img.alt = isHindi ? product.nameHi : product.name; }
        if (price) price.textContent = `₹${product.price}/piece`;
        if (desc) desc.textContent = isHindi ? product.descriptionHi : product.description;

        if (specs && product.specs) {
            specs.innerHTML = Object.entries(product.specs).map(([key, val]) => `
                <div class="spec-item">
                    <span class="spec-label">${key}:</span>
                    <span class="spec-value">${val}</span>
                </div>
            `).join('');
        }

        if (buyBtn) {
            buyBtn.onclick = () => {
                CartService.addToCart(product.id);
                Modals.close('productDetailModal');
            };
        }

        Modals.open('productDetailModal');
    },

    init: () => {
        ProductService.renderGrid();
        ProductService.updateActiveTabs();

        // Expose globally for legacy HTML
        window.setCategory = ProductService.setCategory;
        window.setSort = ProductService.setSort;
        window.setSearch = ProductService.setSearch;
        window.setProductView = ProductService.setView;
        window.viewProductDetails = ProductService.viewProductDetails;
        window.setPriceFilter = (val) => {
            maxPrice = parseFloat(val);
            const label = document.getElementById('priceRangeValue');
            if (label) label.textContent = `₹0 - ₹${maxPrice}`;
            ProductService.renderGrid();
        };

        // Sort dropdown listener
        const sortSelect = document.getElementById('productSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => ProductService.setSort(e.target.value));
        }

        // View toggle listeners
        document.querySelectorAll('.view-btn-icon').forEach(btn => {
            btn.addEventListener('click', () => ProductService.setView(btn.dataset.view));
        });
    }
};

// Initialized by App.init
