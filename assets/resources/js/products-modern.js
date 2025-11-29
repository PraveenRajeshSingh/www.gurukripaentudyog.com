/**
 * Modern Products Section - Dynamic Features
 * Search, Filter, Sort, Grid/List View
 */

class ModernProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentView = 'grid';
        this.currentFilter = 'all';
        this.currentSort = 'featured';
        this.searchQuery = '';
        this.currentPage = 1;
        this.productsPerPage = 18;
        
        this.init();
    }
    
    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.renderProducts();
    }
    
    loadProducts() {
        // Load products from global window.products or create sample data
        if (window.products && window.products.length > 0) {
            this.products = window.products.map(p => ({
                id: p.id,
                name: p.name || p.nameHi,
                nameHi: p.nameHi || p.name,
                category: p.category,
                price: p.price,
                oldPrice: p.oldPrice || p.price * 1.2,
                image: p.image,
                description: p.description || '',
                features: p.features || [],
                rating: p.rating || 4.5,
                reviews: p.reviews || Math.floor(Math.random() * 100) + 20,
                inStock: p.inStock !== false,
                isNew: p.isNew || false,
                discount: p.discount || Math.round(((p.oldPrice || p.price * 1.2) - p.price) / (p.oldPrice || p.price * 1.2) * 100) || 0,
                isFeatured: p.isFeatured || false,
                isBestSeller: p.isBestSeller || false,
                specifications: p.specifications || { strength: '100kg load', type: 'Standard', size: 'Normal', usage: 'General' }
            }));
        } else {
            // Sample products if none exist
            this.products = this.createSampleProducts();
        }
        
        this.filteredProducts = [...this.products];
    }
    
    createSampleProducts() {
        const categories = ['shiv-eent', 'premium', 'standard', 'machine-made'];
        const products = [];
        
        // Product specifications data
        const specifications = [
            { strength: '120kg load', type: 'Premium', size: 'Normal', usage: 'Walls' },
            { strength: '100kg load', type: 'Standard', size: 'Jumbo', usage: 'Foundation' },
            { strength: '150kg load', type: 'Machine Made', size: 'Normal', usage: 'Roof' },
            { strength: '130kg load', type: 'Premium', size: 'Jumbo', usage: 'Walls' },
            { strength: '90kg load', type: 'Standard', size: 'Normal', usage: 'Foundation' },
            { strength: '140kg load', type: 'Machine Made', size: 'Jumbo', usage: 'Roof' },
            { strength: '110kg load', type: 'Premium', size: 'Normal', usage: 'Walls' },
            { strength: '95kg load', type: 'Standard', size: 'Jumbo', usage: 'Foundation' },
            { strength: '160kg load', type: 'Machine Made', size: 'Normal', usage: 'Roof' },
            { strength: '125kg load', type: 'Premium', size: 'Jumbo', usage: 'Walls' },
            { strength: '85kg load', type: 'Standard', size: 'Normal', usage: 'Foundation' },
            { strength: '135kg load', type: 'Machine Made', size: 'Jumbo', usage: 'Roof' }
        ];
        
        for (let i = 1; i <= 12; i++) {
            products.push({
                id: i,
                name: `Premium Brick ${i}`,
                nameHi: `प्रीमियम ईंट ${i}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                price: 8 + Math.floor(Math.random() * 12),
                oldPrice: 12 + Math.floor(Math.random() * 8),
                image: `assets/resources/images/products/brick-${i}.jpg`,
                description: 'High-quality construction brick with excellent durability and strength.',
                features: ['Durable', 'Strong', 'Eco-Friendly'],
                specifications: specifications[i-1] || { strength: '100kg load', type: 'Standard', size: 'Normal', usage: 'General' },
                rating: 4 + Math.random(),
                reviews: Math.floor(Math.random() * 200) + 50,
                inStock: Math.random() > 0.2,
                isNew: Math.random() > 0.7,
                discount: Math.floor(Math.random() * 30),
                isFeatured: Math.random() > 0.8,
                isBestSeller: Math.random() > 0.7,
                specifications: specifications[i-1] || { strength: '100kg load', type: 'Standard', size: 'Normal', usage: 'General' }
            });
        }
        
        return products;
    }
    
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('productSearch');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.applyFilters();
            });
            
            // Add placeholder with both languages
            const currentLang = localStorage.getItem('language') || 'hi';
            searchInput.placeholder = currentLang === 'hi' ? 'ईंट खोजें...' : 'Search bricks...';
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        // Filter Tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.applyFilters();
            });
        });
        
        // View Toggle
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.updateView();
            });
        });
        
        // Sort Dropdown
        const sortSelect = document.getElementById('productSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applySort();
            });
        }
    }
    
    applyFilters() {
        this.filteredProducts = this.products.filter(product => {
            // Category Filter
            const categoryMatch = this.currentFilter === 'all' || product.category === this.currentFilter;
            
            // Search Filter
            const searchMatch = !this.searchQuery || 
                product.name.toLowerCase().includes(this.searchQuery) ||
                product.nameHi.includes(this.searchQuery) ||
                product.description.toLowerCase().includes(this.searchQuery);
            
            return categoryMatch && searchMatch;
        });
        
        // Update category title
        this.updateCategoryTitle();
        
        this.applySort();
    }
    
    applySort() {
        // Add smooth transition effect when sorting
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.style.animation = 'filterTransition 0.3s ease';
        }
        
        switch (this.currentSort) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => b.id - a.id);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default: // featured
                // Featured sorting could be based on multiple factors
                this.filteredProducts.sort((a, b) => {
                    // Prioritize featured items
                    if (a.isFeatured && !b.isFeatured) return -1;
                    if (!a.isFeatured && b.isFeatured) return 1;
                    // Then best sellers
                    if (a.isBestSeller && !b.isBestSeller) return -1;
                    if (!a.isBestSeller && b.isBestSeller) return 1;
                    // Then by rating
                    return b.rating - a.rating;
                });
                break;
        }
        
        this.currentPage = 1;
        this.renderProducts();
    }
    
    updateView() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        grid.classList.remove('list-view', 'grid-2');
        const cards = grid.querySelectorAll('.product-card-modern');
        
        cards.forEach(card => {
            card.classList.remove('list-view');
        });
        
        if (this.currentView === 'list') {
            cards.forEach(card => {
                card.classList.add('list-view');
            });
            grid.classList.add('list-view');
        } else if (this.currentView === 'grid-2') {
            grid.classList.add('grid-2');
        }
    }
    
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        // Show loading
        grid.innerHTML = '<div class="products-loading"><div class="loader"></div></div>';
        
        // Simulate loading delay for smooth animation
        setTimeout(() => {
            if (this.filteredProducts.length === 0) {
                grid.innerHTML = `
                    <div class="no-products-found">
                        <i class="ion-ios-search"></i>
                        <h3>No Products Found</h3>
                        <p>Try adjusting your search or filter to find what you're looking for.</p>
                    </div>
                `;
                return;
            }
            
            // Pagination
            const start = (this.currentPage - 1) * this.productsPerPage;
            const end = start + this.productsPerPage;
            const productsToShow = this.filteredProducts.slice(start, end);
            
            // Render products
            grid.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
            
            // Update view
            this.updateView();
            
            // Render pagination
            this.renderPagination();
            
            // Add animation to cards
            this.animateCards();
            
            // Update category title
            this.updateCategoryTitle();
        }, 300);
    }
    
    createProductCard(product) {
        const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        const currentLang = localStorage.getItem('language') || 'hi';
        const productName = currentLang === 'hi' ? product.nameHi : product.name;
        
        return `
            <div class="product-card-modern" data-product-id="${product.id}">
                <div class="product-image-container-modern">
                    <img src="${product.image}" alt="${productName}" class="product-image-modern" loading="lazy" onerror="this.src='assets/resources/img/redbrick1.jpg'; this.onerror=null;" onload="this.classList.add('image-loaded')">
                    
                    <div class="product-badges">
                        ${product.inStock ? '<span class="badge badge-stock">Available</span>' : '<span class="badge badge-out-of-stock">Out of Stock</span>'}
                        ${product.isNew ? '<span class="badge badge-new">New</span>' : ''}
                        ${product.isFeatured ? '<span class="badge badge-featured">Featured</span>' : ''}
                        ${product.isBestSeller ? '<span class="badge badge-best-seller">Best Seller</span>' : ''}
                        ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
                    </div>
                    
                    <div class="product-quick-actions">
                        <button class="quick-action-btn" onclick="quickView(${product.id})" title="Quick View">
                            <i class="ion-ios-eye"></i>
                        </button>
                        <button class="quick-action-btn" onclick="addToWishlist(${product.id})" title="Add to Wishlist">
                            <i class="ion-ios-heart"></i>
                        </button>
                        <button class="quick-action-btn" onclick="shareProduct(${product.id})" title="Share">
                            <i class="ion-ios-share"></i>
                        </button>
                    </div>
                </div>
                
                <div class="product-info-modern">
                    <div class="product-category-modern">${this.getCategoryName(product.category)}</div>
                    <h3 class="product-name-modern">${productName}</h3>
                    
                    <div class="product-rating-modern">
                        <div class="stars-modern">
                            ${this.renderStars(product.rating)}
                        </div>
                        <span class="rating-count-modern">(${product.reviews})</span>
                    </div>
                    
                    ${product.description ? `<p class="product-description-modern">${product.description}</p>` : ''}
                    
                    ${product.features && product.features.length > 0 ? `
                        <div class="product-features-modern">
                            ${product.features.slice(0, 3).map(f => `<span class="feature-tag-modern"><i class="ion-ios-checkmark"></i>${f}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Product Specifications -->
                    ${product.specifications ? `
                        <div class="product-specs-modern">
                            <div class="spec-item-modern">
                                <span class="spec-label-modern">Strength:</span>
                                <span class="spec-value-modern">${product.specifications.strength}</span>
                            </div>
                            <div class="spec-item-modern">
                                <span class="spec-label-modern">Type:</span>
                                <span class="spec-value-modern">${product.specifications.type}</span>
                            </div>
                            <div class="spec-item-modern">
                                <span class="spec-label-modern">Size:</span>
                                <span class="spec-value-modern">${product.specifications.size}</span>
                            </div>
                            <div class="spec-item-modern">
                                <span class="spec-label-modern">Usage:</span>
                                <span class="spec-value-modern">${product.specifications.usage}</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="product-price-section-modern">
                        <div class="product-price-container-modern">
                            <span class="product-price-modern">₹${product.price}</span>
                            ${product.oldPrice > product.price ? `<span class="product-price-old-modern">₹${product.oldPrice}</span>` : ''}
                            ${discount > 0 ? `<span class="price-save-modern">Save ${discount}%</span>` : ''}
                        </div>
                        
                        <div class="product-actions-modern">
                            <button class="btn-add-cart-modern" onclick="addToCart(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                                <i class="ion-ios-cart"></i>
                                <span>${product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                            </button>
                            <button class="btn-wishlist-modern" onclick="toggleWishlist(${product.id})">
                                <i class="ion-ios-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getCategoryName(category) {
        const categories = {
            'shiv-eent': 'Shiv Eent',
            'premium': 'Premium',
            'standard': 'Standard',
            'machine-made': 'Machine Made',
            'all': 'All Products'
        };
        return categories[category] || category;
    }
    
    updateCategoryTitle() {
        const categoryTitle = document.getElementById('categoryTitle');
        if (categoryTitle) {
            const categoryName = this.getCategoryName(this.currentFilter);
            const currentLang = localStorage.getItem('language') || 'hi';
            const titleText = currentLang === 'hi' ? 
                `दिखा रहे हैं: ${categoryName}` : 
                `Showing: ${categoryName}`;
            categoryTitle.textContent = titleText;
        }
    }
    
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="ion-ios-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="ion-ios-star-half"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="ion-ios-star-outline"></i>';
        }
        
        return stars;
    }
    
    renderPagination() {
        const paginationContainer = document.getElementById('productsPagination');
        if (!paginationContainer) return;
        
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let html = `
            <button class="pagination-btn" onclick="productsManager.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="ion-ios-arrow-left"></i> Previous
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="productsManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<span class="pagination-dots">...</span>';
            }
        }
        
        html += `
            <button class="pagination-btn" onclick="productsManager.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="ion-ios-arrow-right"></i>
            </button>
        `;
        
        paginationContainer.innerHTML = html;
    }
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderProducts();
        
        // Scroll to products section
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    animateCards() {
        const cards = document.querySelectorAll('.product-card-modern');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                // Add animation class for better performance
                card.classList.add('fade-up-animation');
            }, index * 100);
        });
    }
}

// Initialize on DOM load
let productsManager;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for products to be available
    function initProductsManager() {
        if (typeof window.products !== 'undefined' && window.products.length > 0) {
            productsManager = new ModernProductsManager();
        } else {
            // Retry after a short delay
            setTimeout(initProductsManager, 200);
        }
    }
    
    initProductsManager();
});

// Helper functions for cart/wishlist
function addToCart(productId) {
    if (typeof window.addToCart === 'function') {
        window.addToCart(productId);
    } else {
        console.log('Add to cart:', productId);
        alert('Product added to cart!');
    }
}

function toggleWishlist(productId) {
    const btn = event.target.closest('.btn-wishlist-modern');
    if (btn) {
        btn.classList.toggle('active');
    }
    console.log('Toggle wishlist:', productId);
}

function quickView(productId) {
    // Find the product
    const product = productsManager.filteredProducts.find(p => p.id == productId);
    if (!product) return;
    
    // Get language
    const currentLang = localStorage.getItem('language') || 'hi';
    const productName = currentLang === 'hi' ? product.nameHi : product.name;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal-overlay';
    modal.innerHTML = `
        <div class="quick-view-modal">
            <div class="modal-header">
                <h2>${productName}</h2>
                <button class="modal-close" onclick="this.closest('.quick-view-modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-content">
                <div class="modal-image">
                    <img src="${product.image}" alt="${productName}" onerror="this.src='assets/resources/img/redbrick1.jpg'">
                </div>
                <div class="modal-details">
                    <div class="modal-price-section">
                        <span class="modal-price">₹${product.price}</span>
                        ${product.oldPrice > product.price ? 
                            `<span class="modal-old-price">₹${product.oldPrice}</span>
                             <span class="modal-discount">${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% Off</span>` : 
                            ''}
                    </div>
                    
                    ${product.description ? 
                        `<p class="modal-description">${product.description}</p>` : ''}
                    
                    ${product.specifications ? `
                        <div class="modal-specs">
                            <h3>Specifications</h3>
                            <div class="spec-grid">
                                <div class="spec-item">
                                    <span class="spec-label">Strength:</span>
                                    <span class="spec-value">${product.specifications.strength}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Type:</span>
                                    <span class="spec-value">${product.specifications.type}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Size:</span>
                                    <span class="spec-value">${product.specifications.size}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Usage:</span>
                                    <span class="spec-value">${product.specifications.usage}</span>
                                </div>
                            </div>
                        </div>` : ''}
                    
                    <div class="modal-actions">
                        <button class="btn-add-cart-modern" onclick="addToCart(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                            <i class="ion-ios-cart"></i>
                            <span>${product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                        </button>
                        <button class="btn-wishlist-modern" onclick="toggleWishlist(${product.id})">
                            <i class="ion-ios-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modal);
    
    // Close on escape key
    const closeOnEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    };
    document.addEventListener('keydown', closeOnEscape);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

function shareProduct(productId) {
    if (navigator.share) {
        navigator.share({
            title: 'Gurukripa Brick',
            text: 'Check out this product!',
            url: window.location.href
        });
    } else {
        console.log('Share:', productId);
        alert('Share functionality');
    }
}
