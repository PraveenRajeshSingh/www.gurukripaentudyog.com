// Product catalog and filtering system
const products = [
    {
        id: 1,
        name: 'Standard Red Brick',
        nameHi: 'स्टैंडर्ड लाल ईंट',
        category: 'standard',
        price: 8,
        image: 'assets/resources/img/redbrick1.jpg',
        description: 'High-quality standard red bricks perfect for construction',
        descriptionHi: 'निर्माण के लिए उच्च गुणवत्ता वाली मानक लाल ईंटें',
        inStock: true,
        rating: 4.5
    },
    {
        id: 2,
        name: 'Premium Red Brick',
        nameHi: 'प्रीमियम लाल ईंट',
        category: 'premium',
        price: 12,
        image: 'assets/resources/img/redbricks.jpg',
        description: 'Premium quality bricks with superior strength and durability',
        descriptionHi: 'उत्कृष्ट शक्ति और स्थायित्व के साथ प्रीमियम गुणवत्ता वाली ईंटें',
        inStock: true,
        rating: 4.8
    },
    {
        id: 3,
        name: 'Machine Made Brick',
        nameHi: 'मशीन से बनी ईंट',
        category: 'machine',
        price: 10,
        image: 'assets/resources/img/gurukripaEnt1.png',
        description: 'Uniform size and shape machine-made bricks',
        descriptionHi: 'समान आकार और आकृति वाली मशीन से बनी ईंटें',
        inStock: true,
        rating: 4.7
    },
    {
        id: 4,
        name: 'Fire Brick',
        nameHi: 'फायर ईंट',
        category: 'fire',
        price: 15,
        image: 'assets/resources/img/newbricks_2.jpg',
        description: 'Fire-resistant bricks for high-temperature applications',
        descriptionHi: 'उच्च तापमान अनुप्रयोगों के लिए अग्निरोधी ईंटें',
        inStock: true,
        rating: 4.9
    },
    {
        id: 5,
        name: 'Hollow Brick',
        nameHi: 'खोखली ईंट',
        category: 'hollow',
        price: 9,
        image: 'assets/resources/img/newparasbrick2.jpg',
        description: 'Lightweight hollow bricks for modern construction',
        descriptionHi: 'आधुनिक निर्माण के लिए हल्की खोखली ईंटें',
        inStock: true,
        rating: 4.6
    },
    {
        id: 6,
        name: 'Clay Brick',
        nameHi: 'मिट्टी की ईंट',
        category: 'clay',
        price: 7,
        image: 'assets/resources/img/brick.jpeg',
        description: 'Traditional clay bricks with natural composition',
        descriptionHi: 'प्राकृतिक संरचना वाली पारंपरिक मिट्टी की ईंटें',
        inStock: true,
        rating: 4.4
    }
];

let filteredProducts = [...products];
let currentCategory = 'all';
let priceRange = { min: 0, max: 20 };

function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="no-products"><p>No products found</p></div>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${isHindi ? product.nameHi : product.name}" class="product-image" />
            <div class="product-info">
                <h3>${isHindi ? product.nameHi : product.name}</h3>
                <p class="product-description">${isHindi ? product.descriptionHi : product.description}</p>
                <div class="product-price">₹${product.price}/piece</div>
                <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}" style="width: 100%; margin-top: 15px;">
                    <i class="ion-ios-cart"></i> Add to Cart
                </button>
            </div>
        `;
        container.appendChild(productCard);
    });
    
    // Add event listeners for add to cart buttons
    setTimeout(() => {
        container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-product-id'));
                if (typeof addToCart === 'function') {
                    addToCart(productId);
                } else {
                    alert('Product added! Cart functionality will be available shortly.');
                }
            });
        });
    }, 100);
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
    const buttons = document.querySelectorAll('.category-btn');
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
    
    const isHindi = currentLanguage === 'hi';
    const modal = document.createElement('div');
    modal.className = 'product-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close" onclick="this.closest('.product-modal').remove()">&times;</span>
            <div class="modal-body">
                <div class="modal-image">
                    <img src="${product.image}" alt="${isHindi ? product.nameHi : product.name}" />
                </div>
                <div class="modal-info">
                    <h2>${isHindi ? product.nameHi : product.name}</h2>
                    <p class="modal-description">${isHindi ? product.descriptionHi : product.description}</p>
                    <div class="modal-rating">
                        ${generateStars(product.rating)}
                        <span>${product.rating}/5</span>
                    </div>
                    <div class="modal-price">₹${product.price}/piece</div>
                    <div class="modal-actions">
                        <button class="btn btn-full" onclick="addToCart(${product.id}); this.closest('.product-modal').remove();">
                            ${getTranslation('addToCart')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('productsContainer')) {
        // Set default filter to show all products
        currentCategory = 'all';
        priceRange = { min: 0, max: 20 };
        filterProducts();
    }
});

// Make functions globally available
window.setCategory = setCategory;
window.setPriceRange = setPriceRange;

