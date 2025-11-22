// Product catalog and filtering system
const products = [
    {
        id: 1,
        name: 'Shiv Eant',
        nameHi: 'शिव ईंट',
        category: 'shiv',
        price: 10,
        image: 'assets/resources/img/gurukripaEnt1.png',
        description: 'Premium quality Shiv Eant bricks with superior strength and durability. Perfect for all construction needs.',
        descriptionHi: 'उत्कृष्ट शक्ति और स्थायित्व के साथ प्रीमियम गुणवत्ता वाली शिव ईंटें। सभी निर्माण आवश्यकताओं के लिए परफेक्ट।',
        inStock: true,
        rating: 4.9
    },
    {
        id: 2,
        name: 'Premium Red Brick',
        nameHi: 'प्रीमियम लाल ईंट',
        category: 'premium',
        price: 12,
        image: 'assets/resources/img/redbricks.jpg',
        description: 'High-quality premium red bricks with excellent strength and uniform size. Ideal for residential and commercial construction.',
        descriptionHi: 'उत्कृष्ट शक्ति और समान आकार के साथ उच्च गुणवत्ता वाली प्रीमियम लाल ईंटें। आवासीय और वाणिज्यिक निर्माण के लिए आदर्श।',
        inStock: true,
        rating: 4.8
    },
    {
        id: 3,
        name: 'Standard Red Brick',
        nameHi: 'मानक लाल ईंट',
        category: 'standard',
        price: 8,
        image: 'assets/resources/img/redbrick1.jpg',
        description: 'Standard quality red bricks perfect for general construction work. Cost-effective and reliable.',
        descriptionHi: 'सामान्य निर्माण कार्य के लिए परफेक्ट मानक गुणवत्ता वाली लाल ईंटें। लागत प्रभावी और विश्वसनीय।',
        inStock: true,
        rating: 4.5
    },
    {
        id: 4,
        name: 'Machine Made Brick',
        nameHi: 'मशीन से बनी ईंट',
        category: 'machine',
        price: 11,
        image: 'assets/resources/img/gurukripaEnt2.png',
        description: 'Uniform size and shape machine-made bricks. Consistent quality and perfect for modern construction.',
        descriptionHi: 'समान आकार और आकृति वाली मशीन से बनी ईंटें। सुसंगत गुणवत्ता और आधुनिक निर्माण के लिए परफेक्ट।',
        inStock: true,
        rating: 4.7
    },
    {
        id: 5,
        name: 'Fire Resistant Brick',
        nameHi: 'अग्निरोधी ईंट',
        category: 'fire',
        price: 15,
        image: 'assets/resources/img/newbricks_2.jpg',
        description: 'Fire-resistant bricks for high-temperature applications. Perfect for furnaces and industrial use.',
        descriptionHi: 'उच्च तापमान अनुप्रयोगों के लिए अग्निरोधी ईंटें। भट्टियों और औद्योगिक उपयोग के लिए परफेक्ट।',
        inStock: true,
        rating: 4.9
    },
    {
        id: 6,
        name: 'Hollow Brick',
        nameHi: 'खोखली ईंट',
        category: 'hollow',
        price: 9,
        image: 'assets/resources/img/newparasbrick2.jpg',
        description: 'Lightweight hollow bricks for modern construction. Reduces overall building weight and improves insulation.',
        descriptionHi: 'आधुनिक निर्माण के लिए हल्की खोखली ईंटें। समग्र भवन वजन कम करती है और इन्सुलेशन में सुधार करती है।',
        inStock: true,
        rating: 4.6
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
        const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
        container.innerHTML = `<div class="no-products"><p>${isHindi ? 'कोई उत्पाद नहीं मिला' : 'No products found'}</p></div>`;
        return;
    }
    
    filteredProducts.forEach(product => {
        const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.image}" alt="${isHindi ? product.nameHi : product.name}" class="product-image" />
                <div class="product-overlay">
                    <button class="btn btn-primary view-details-btn" onclick="viewProductDetails(${product.id})">
                        <i class="ion-ios-eye"></i> ${isHindi ? 'विवरण देखें' : 'View Details'}
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${isHindi ? product.nameHi : product.name}</h3>
                <p class="product-description">${isHindi ? product.descriptionHi : product.description}</p>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span>${product.rating}/5</span>
                </div>
                <div class="product-price">₹${product.price}/piece</div>
                <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}" style="width: 100%; margin-top: 15px;">
                    <i class="ion-ios-cart"></i> ${isHindi ? 'कार्ट में जोड़ें' : 'Add to Cart'}
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
                    const isHindi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
                    alert(isHindi ? 'उत्पाद जोड़ा गया!' : 'Product added!');
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
window.renderProducts = renderProducts;
window.viewProductDetails = viewProductDetails;

