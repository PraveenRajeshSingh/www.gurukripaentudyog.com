// Product catalog and filtering system
window.products = [
    {
        id: 1,
        name: 'Shiv Eant',
        nameHi: 'शिव ईंट',
        category: 'shiv-eent',
        price: 10,
        oldPrice: 12,
        image: 'assets/resources/img/redbrick1.jpg',
        description: 'Premium quality Shiv Eant bricks with superior strength and durability. Perfect for all construction needs. These bricks are machine-made with uniform size and shape, ensuring consistent quality and faster construction.',
        descriptionHi: 'उत्कृष्ट शक्ति और स्थायित्व के साथ प्रीमियम गुणवत्ता वाली शिव ईंटें। सभी निर्माण आवश्यकताओं के लिए परफेक्ट। ये ईंटें मशीन से बनी हैं जिनमें समान आकार और आकृति है, जो सुसंगत गुणवत्ता और तेज निर्माण सुनिश्चित करती हैं।',
        inStock: true,
        rating: 4.9,
        reviews: 120,
        isNew: true,
        discount: 17
    },
    {
        id: 2,
        name: 'Premium Red Brick',
        nameHi: 'प्रीमियम लाल ईंट',
        category: 'premium',
        price: 7,
        oldPrice: 9,
        image: 'assets/resources/img/brick.jpeg',
        description: 'High-quality premium red bricks with excellent strength and uniform size. Ideal for residential and commercial construction. These bricks are well-burnt with low water absorption and perfect for load-bearing walls.',
        descriptionHi: 'उत्कृष्ट शक्ति और समान आकार के साथ उच्च गुणवत्ता वाली प्रीमियम लाल ईंटें। आवासीय और वाणिज्यिक निर्माण के लिए आदर्श। ये ईंटें अच्छी तरह से जली हुई हैं जिनमें कम पानी अवशोषण है और भार वहन करने वाली दीवारों के लिए परफेक्ट हैं।',
        inStock: true,
        rating: 4.8,
        reviews: 38,
        features: ['Excellent Strength', 'Uniform Size', 'Well-Burnt', 'Low Absorption'],
        specs: {
            size: '190×90×90 mm',
            weight: '2.5-3 kg',
            strength: '8-12 N/mm²',
            absorption: '<18%'
        }
    },
    {
        id: 3,
        name: 'Machine Made Brick',
        nameHi: 'मशीन से बनी ईंट',
        category: 'machine-made',
        price: 7,
        oldPrice: 8,
        image: 'assets/resources/img/redbrick1.jpg',
        description: 'Uniform size and shape machine-made bricks. Consistent quality and perfect for modern construction. These bricks offer superior precision, reduced mortar consumption, and faster construction time.',
        descriptionHi: 'समान आकार और आकृति वाली मशीन से बनी ईंटें। सुसंगत गुणवत्ता और आधुनिक निर्माण के लिए परफेक्ट। ये ईंटें उत्कृष्ट सटीकता, कम मोर्टार खपत और तेज निर्माण समय प्रदान करती हैं।',
        inStock: true,
        rating: 4.7,
        reviews: 32,
        features: ['Uniform Size', 'Precise Shape', 'Consistent Quality', 'Fast Construction'],
        specs: {
            size: '190×90×90 mm',
            weight: '2.5-3 kg',
            strength: '7-10 N/mm²',
            absorption: '<22%'
        }
    },
    {
        id: 4,
        name: 'Standard Clay Brick',
        nameHi: 'स्टैंडर्ड क्ले ईंट',
        category: 'standard',
        price: 6,
        oldPrice: 7,
        image: 'assets/resources/img/redbricks.jpg',
        description: 'Reliable standard clay bricks suitable for general construction purposes. Well-burnt with good strength characteristics.',
        descriptionHi: 'सामान्य निर्माण उद्देश्यों के लिए उपयुक्त विश्वसनीय मानक मिट्टी की ईंटें। अच्छी शक्ति विशेषताओं के साथ अच्छी तरह से जली हुई।',
        inStock: true,
        rating: 4.5,
        reviews: 28,
        features: ['Good Strength', 'Standard Size', 'Affordable', 'Durable'],
        specs: {
            size: '190×90×90 mm',
            weight: '2.3-2.8 kg',
            strength: '6-9 N/mm²',
            absorption: '<25%'
        }
    },
    {
        id: 5,
        name: 'Decorative Brick',
        nameHi: 'सजावटी ईंट',
        category: 'premium',
        price: 12,
        oldPrice: 15,
        image: 'assets/resources/img/gurukripaEnt1.png',
        description: 'High-quality decorative bricks with attractive finish for exterior walls and landscaping.',
        descriptionHi: 'बाहरी दीवारों और लैंडस्केपिंग के लिए आकर्षक फिनिश वाली उच्च गुणवत्ता वाली सजावटी ईंटें।',
        inStock: true,
        rating: 4.9,
        reviews: 42,
        isNew: true,
        features: ['Attractive Finish', 'Weather Resistant', 'Premium Quality', 'Versatile'],
        specs: {
            size: '190×90×90 mm',
            weight: '2.5-3 kg',
            strength: '8-12 N/mm²',
            absorption: '<15%'
        }
    },
    {
        id: 6,
        name: 'Hollow Brick',
        nameHi: 'खोखली ईंट',
        category: 'standard',
        price: 5,
        oldPrice: 6,
        image: 'assets/resources/img/newbricks_2.jpg',
        description: 'Lightweight hollow bricks ideal for partition walls and non-load bearing applications.',
        descriptionHi: 'विभाजन दीवारों और गैर-भार वहन करने वाले अनुप्रयोगों के लिए आदर्श हल्की खोखली ईंटें।',
        inStock: true,
        rating: 4.3,
        reviews: 24,
        features: ['Lightweight', 'Thermal Insulation', 'Sound Proof', 'Cost Effective'],
        specs: {
            size: '190×90×90 mm',
            weight: '1.8-2.2 kg',
            strength: '4-7 N/mm²',
            absorption: '<20%'
        }
    }
];

let filteredProducts = [...products];
let currentCategory = 'all';
let priceRange = { min: 0, max: 20 };

// Ensure DOM is loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing products system...');
    
    // Wait a bit more for all resources to load
    setTimeout(() => {
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            console.log('Products grid found, rendering products...');
            currentCategory = 'all';
            priceRange = { min: 0, max: 20 };
            renderProducts();
        } else {
            console.error('Products grid container not found!');
        }
    }, 200);
});

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) {
        console.error('Products container not found');
        return;
    }
    
    // Show loading skeleton
    const skeleton = document.getElementById('productSkeleton');
    if (skeleton) skeleton.style.display = 'grid';
    
    container.innerHTML = '';
    
    // Simulate loading delay
    setTimeout(() => {
        if (skeleton) skeleton.style.display = 'none';
        
        if (filteredProducts.length === 0) {
            const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
            container.innerHTML = `<div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;"><p style="font-size: 1.2rem; color: #666;">${isHindi ? 'कोई उत्पाद नहीं मिला' : 'No products found'}</p></div>`;
            console.log('No products to display');
            return;
        }
        
        console.log(`Rendering ${filteredProducts.length} products`);
        
        filteredProducts.forEach(product => {
            const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
            const productCard = document.createElement('div');
            productCard.className = 'product-card-modern';
            productCard.setAttribute('data-product-id', product.id);
            productCard.setAttribute('data-category', product.category);
            
            // Premium badges
            const badges = [];
            if (product.isNew) badges.push('<div class="new-badge">New</div>');
            if (product.discount) badges.push(`<div class="discount-badge">-${product.discount}%</div>`);
            if (product.category === 'premium') badges.push('<div class="premium-badge">Premium</div>');
            if (product.inStock) badges.push('<div class="available-badge">Available</div>');
            
            const badgesHtml = badges.join('');
            
            // Product specs
            const specs = product.specs || {
                size: isHindi ? '190×90×90 मिमी' : '190×90×90 mm',
                weight: isHindi ? '2.5-3 किग्रा' : '2.5-3 kg',
                strength: isHindi ? '10-15 N/mm²' : '10-15 N/mm²',
                absorption: isHindi ? '<20%' : '<20%'
            };
            
            // Price section
            const priceSection = `
                <div class="product-price-container">
                    <div class="product-price">₹${product.price}<span style="font-size: 1rem; font-weight: 500;">/piece</span></div>
                    ${product.oldPrice ? `
                        <div class="product-price-old">₹${product.oldPrice}</div>
                        <div class="save-percentage">Save ${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</div>
                    ` : ''}
                </div>
            `;
            
            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.image}" alt="${isHindi ? product.nameHi : product.name}" class="product-image" loading="lazy" />
                    ${badgesHtml}
                </div>
                <div class="product-content">
                    <h3 class="product-title">${isHindi ? product.nameHi : product.name}</h3>
                    <p class="product-description">${(isHindi ? product.descriptionHi : product.description).substring(0, 120)}${(isHindi ? product.descriptionHi : product.description).length > 120 ? '...' : ''}</p>
                    
                    <div class="product-specs">
                        <div class="product-spec-item">
                            <span class="product-spec-label">Size</span>
                            <span class="product-spec-value">${specs.size}</span>
                        </div>
                        <div class="product-spec-item">
                            <span class="product-spec-label">Strength</span>
                            <span class="product-spec-value">${specs.strength}</span>
                        </div>
                        <div class="product-spec-item">
                            <span class="product-spec-label">Weight</span>
                            <span class="product-spec-value">${specs.weight}</span>
                        </div>
                        <div class="product-spec-item">
                            <span class="product-spec-label">Absorption</span>
                            <span class="product-spec-value">${specs.absorption}</span>
                        </div>
                    </div>
                    
                    ${priceSection}
                    
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        <i class="ion-ios-cart"></i> ${isHindi ? 'कार्ट में जोड़ें' : 'Add to Cart'}
                    </button>
                </div>
            `;
            
            container.appendChild(productCard);
        });
        
        // Add event listeners
        setTimeout(() => {
            // Update stock badge elements
            container.querySelectorAll('[class$="stock"').forEach(btn => {
                if (typeof currentLanguage !== 'undefined' && currentLanguage === 'hi') {
                    const newText = btn.textContent.includes('उपलब्ध') || btn.textContent.includes('Available') 
                        ? 'उपलब्ध' : 'अनुपलब्ध';
                    btn.textContent = newText;
                }
            });
            
            // Add event listeners for add to cart buttons
            container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const product = filteredProducts.find(p => p.id === productId);
                    
                    if (product) {
                        this.innerHTML = '<i class="ion-load-c"></i>';
                        
                        // Trigger ATC animation
                        if (typeof triggerATCAnimation === 'function') {
                            triggerATCAnimation(this);
                        }
                        
                        // Add to cart functionality
                        if (typeof addToCart === 'function') {
                            setTimeout(() => {
                                addToCart(productId);
                                this.innerHTML = '<i class="ion-ios-cart"></i> Added!';
                                setTimeout(() => {
                                    this.innerHTML = '<i class="ion-ios-cart"></i> Add to Cart';
                                }, 1500);
                            }, 800);
                        } else {
                            const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
                            setTimeout(() => {
                                this.innerHTML = '<i class="ion-ios-cart"></i> ' + (isHindi ? 'जोड़ा गया!' : 'Added!');
                                setTimeout(() => {
                                    this.innerHTML = '<i class="ion-ios-cart"></i> ' + (isHindi ? 'कार्ट में जोड़ें' : 'Add to Cart');
                                }, 1500);
                            }, 800);
                        }
                    }
                });
            });
        }, 100);
    }, 800); // End of setTimeout
}

function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="ion-ios-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="ion-ios-star-half"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="ion-ios-star-outline"></i>';
    }
    return stars;
}

function filterProducts() {
    filteredProducts = products.filter(product => {
        const categoryMatch = currentCategory === 'all' || product.category === currentCategory;
        const priceMatch = product.price >= priceRange.min && product.price <= priceRange.max;
        return categoryMatch && priceMatch;
    });
    renderProducts();
}

function setCategory(category) {
    currentCategory = category;
    filterProducts();
    updateCategoryButtons();
}

function updateCategoryButtons() {
    const buttons = document.querySelectorAll('.category-btn, .category-filter-btn');
    buttons.forEach(btn => {
        if (btn.dataset.category === currentCategory) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setPriceRange() {
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');
    
    if (minInput && maxInput) {
        priceRange.min = parseFloat(minInput.value) || 0;
        priceRange.max = parseFloat(maxInput.value) || 20;
        filterProducts();
    }
}

function viewProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
    const modal = document.createElement('div');
    modal.className = 'modal product-modal';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>${isHindi ? product.nameHi : product.name}</h2>
                <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start;">
                    <div class="modal-image">
                        <img src="${product.image}" alt="${isHindi ? product.nameHi : product.name}" style="width: 100%; border-radius: 10px;" />
                    </div>
                    <div class="modal-info">
                        <p class="modal-description" style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px; color: var(--text-dark);">
                            ${isHindi ? product.descriptionHi : product.description}
                        </p>
                        <div class="modal-rating" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                            ${generateStars(product.rating)}
                            <span style="font-weight: 600; color: var(--text-dark);">${product.rating}/5</span>
                        </div>
                        <div class="modal-price" style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 30px;">
                            ₹${product.price}/piece
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-primary btn-full" onclick="if(typeof addToCart === 'function') { addToCart(${product.id}); } this.closest('.modal').remove();" style="padding: 15px; font-size: 1.1rem;">
                                <i class="ion-ios-cart"></i> ${isHindi ? 'कार्ट में जोड़ें' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', function() {
    // Ensure DOM is fully loaded
    setTimeout(() => {
        if (document.getElementById('productsGrid')) {
            // Set default filter to show all products
            currentCategory = 'all';
            priceRange = { min: 0, max: 20 };
            
            // Render products
            renderProducts();
            
            // Initialize search functionality
            const searchInput = document.getElementById('productSearch');
            const searchBtn = document.getElementById('searchBtn');
            
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const searchTerm = this.value.toLowerCase();
                    filteredProducts = products.filter(product => 
                        product.name.toLowerCase().includes(searchTerm) ||
                        product.nameHi.toLowerCase().includes(searchTerm) ||
                        product.description.toLowerCase().includes(searchTerm) ||
                        product.descriptionHi.toLowerCase().includes(searchTerm)
                    );
                    renderProducts();
                });
            }
            
            if (searchBtn) {
                searchBtn.addEventListener('click', function() {
                    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
                    filteredProducts = products.filter(product => 
                        product.name.toLowerCase().includes(searchTerm) ||
                        product.nameHi.toLowerCase().includes(searchTerm) ||
                        product.description.toLowerCase().includes(searchTerm) ||
                        product.descriptionHi.toLowerCase().includes(searchTerm)
                    );
                    renderProducts();
                });
            }
        }
    }, 100);
});

// Make functions globally available
window.setCategory = setCategory;
window.setPriceRange = setPriceRange;
window.renderProducts = renderProducts;
window.viewProductDetails = viewProductDetails;

