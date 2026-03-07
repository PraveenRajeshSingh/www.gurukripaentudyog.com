/**
 * Gurukripa Bricks - Product & Catalog Service
 */
let currentCategory = 'all';
let searchTerm = '';
let currentSort = 'featured';
let currentView = 'grid'; // grid, grid-2, list

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

        // Sorting
        switch (currentSort) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                // Keep original order (all highly rated)
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

    setSearch: (termOrEvent) => {
        // Handle both event objects and direct string values
        if (typeof termOrEvent === 'object' && termOrEvent.target) {
            searchTerm = (termOrEvent.target.value || '').trim();
        } else {
            searchTerm = (termOrEvent || '').trim();
        }
        ProductService.renderGrid();
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
            grid.className = `products-grid-modern animate-fade-in`;
            if (view === 'grid-2') {
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else if (view === 'list') {
                grid.style.gridTemplateColumns = '1fr';
            } else {
                grid.style.gridTemplateColumns = '';
            }
        }
        // Update active view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    },

    renderGrid: () => {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const filtered = ProductService.getProducts();
        const isHindi = typeof TranslationService !== 'undefined' && TranslationService.getLanguage() === 'hi';

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="no-products"><i class="ion-ios-search"></i><p>${isHindi ? 'कोई उत्पाद नहीं मिला' : 'No products found matching your criteria'}</p></div>`;
            return;
        }

        grid.innerHTML = filtered.map(product => ProductService.createCardHTML(product, isHindi)).join('');
    },

    createCardHTML: (product, isHindi) => {
        const name = isHindi ? product.nameHi : product.name;
        const desc = isHindi ? product.descriptionHi : product.description;
        const buyLabel = isHindi ? 'कार्ट में जोड़ें' : 'Add to Cart';
        const detailsLabel = isHindi ? 'विवरण' : 'Details';
        const callLabel = isHindi ? 'कॉल करें' : 'Call Now';

        return `
            <div class="product-card-modern ${product.isNew ? 'is-new' : ''}" data-aos="fade-up">
                ${product.tag ? `<div class="product-tag ${product.tagClass || ''}">${product.tag}</div>` : ''}
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="${name}" loading="lazy" class="product-image"
                         onerror="this.src='src/assets/images/logo-new.svg'">
                    <div class="product-overlay">
                        <button class="overlay-btn" onclick="viewProductDetails(${product.id})">
                            <i class="ion-ios-eye"></i> ${detailsLabel}
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-trust-row">
                        <div class="product-rating">
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star"></i>
                            <i class="ion-ios-star-half"></i>
                        </div>
                        <div class="verified-badge" title="${isHindi ? 'गुणवत्ता सत्यापित' : 'Quality Verified'}">
                            <i class="ion-ios-checkmark-circle"></i> ${isHindi ? 'सत्यापित' : 'Verified'}
                        </div>
                    </div>
                    <h3 class="product-title">${name}</h3>
                    <div class="product-price-row">
                        <span class="product-price">₹${product.price}/pc</span>
                        ${product.oldPrice ? `<span class="product-old-price">₹${product.oldPrice}</span>` : ''}
                    </div>
                    <p class="product-description">${desc}</p>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-add-cart" onclick="addToCart(${product.id})">
                            <i class="ion-ios-cart"></i> ${buyLabel}
                        </button>
                        <a href="tel:+919198923230" class="btn btn-secondary btn-icon-only" title="${callLabel}">
                            <i class="ion-ios-telephone"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    updateActiveTabs: () => {
        // Update filter-tab buttons
        const tabs = document.querySelectorAll('.filter-tab');
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

        // Sort dropdown listener
        const sortSelect = document.getElementById('productSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => ProductService.setSort(e.target.value));
        }

        // View toggle listeners
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => ProductService.setView(btn.dataset.view));
        });
    }
};

// Initialized by App.init
