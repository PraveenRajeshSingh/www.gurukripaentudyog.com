// ══════════════════════════════════════════
// PRODUCT DATA
// ══════════════════════════════════════════
const PRODUCTS = [
    { id: 1,  name: 'Shiv Eent Grade-A',                category: 'shiv-eent',   price: 12,   oldPrice: 14,   unit: 'per piece', desc: 'Ultra-premium Grade-A brick with double-fired durability. Best for load-bearing walls.',                                                                                    rating: 5,   reviews: 89,  badge: 'Best Seller', badgeClass: '',      stock: 'in-stock',  stockText: 'In Stock (10k+)', img: 'src/assets/images/brick_product_3.png', features: ['Double-fired process', 'Weather resistant', 'Uniform 230\xd7110\xd770mm', 'ISI certified'] },
    { id: 7,  name: 'Awwal Bricks (\u0906\u0935\u094d\u0935\u0932 \u0908\u0902\u091f)',   category: 'awwal',       price: 7.05, oldPrice: null, unit: 'per piece', desc: 'High-quality Awwal bricks known for strength and durability. Ideal for heavy-duty construction \u2014 large buildings, factories and load-bearing walls. \u20b928,200 per trolley of 4,000 bricks.', rating: 4.9, reviews: 78,  badge: 'Heavy Duty', badgeClass: '',      stock: 'in-stock',  stockText: 'In Stock',        img: 'src/assets/images/brick_product_1.png', features: ['Strong & durable', 'Heavy structure ready', 'Long-lasting performance', '\u20b928,200 per trolley (4,000 bricks)'] },
    { id: 8,  name: 'Laal Peti Bricks (\u0932\u093e\u0932 \u092a\u0947\u091f\u0940 \u0908\u0902\u091f)', category: 'laal-peti', price: 6.25, oldPrice: null, unit: 'per piece', desc: 'Commonly used for general construction \u2014 homes, boundary walls and commercial buildings. Made using natural clay at an affordable price. \u20b925,000 per trolley of 4,000 bricks.',       rating: 4.5, reviews: 134, badge: 'Popular',    badgeClass: 'amber', stock: 'in-stock',  stockText: 'In Stock',        img: 'src/assets/images/brick_product_2.png', features: ['Affordable & widely available', 'Natural clay construction', 'Suitable for most projects', '\u20b925,000 per trolley (4,000 bricks)'] },
    { id: 2,  name: 'Premium Red Bricks',                category: 'premium',     price: 10,   oldPrice: null, unit: 'per piece', desc: 'Premium quality red clay bricks with high compressive strength, ideal for structural walls.',                                                                                 rating: 4.8, reviews: 64,  badge: 'Popular',    badgeClass: 'amber', stock: 'in-stock',  stockText: 'In Stock',        img: 'src/assets/images/brick_product_2.png', features: ['High compressive strength', 'Excellent thermal insulation', 'Smooth finish', 'Bulk discounts available'] },
    { id: 3,  name: 'Standard Bricks',                   category: 'standard',    price: 8,    oldPrice: null, unit: 'per piece', desc: 'Reliable standard bricks for everyday construction. Best value for residential projects.',                                                                                    rating: 4.5, reviews: 112, badge: 'Value Pick', badgeClass: 'amber', stock: 'in-stock',  stockText: 'In Stock',        img: 'src/assets/images/redbrick1.jpg',        features: ['Cost-effective', 'Well-burnt clay', 'Standard dimensions', 'Suitable for all walls'] },
    { id: 4,  name: 'Machine Made Wirecut',               category: 'machine-made',price: 11,   oldPrice: 13,   unit: 'per piece', desc: 'Precision machine-made wirecut bricks with perfect uniform size for modern construction.',                                                                                    rating: 4.9, reviews: 43,  badge: 'New',        badgeClass: '',      stock: 'low-stock', stockText: 'Limited Stock',   img: 'src/assets/images/brick_product_1.png', features: ['Machine precision', 'Zero size variation', 'Sharp edges', 'Perfect for exposed brickwork'] },
    { id: 5,  name: 'First Class Red Bricks',             category: 'premium',     price: 10,   oldPrice: null, unit: 'per piece', desc: 'First-class quality bricks that pass all IS standards for residential and commercial use.',                                                                                  rating: 4.7, reviews: 55,  badge: null,         badgeClass: '',      stock: 'in-stock',  stockText: 'In Stock',        img: 'src/assets/images/brick_product_3.png', features: ['IS standard compliant', 'Heavy-duty strength', 'Consistent color', 'Large project ready'] },
    { id: 6,  name: 'Standard Hollow Bricks',             category: 'standard',    price: 9,    oldPrice: null, unit: 'per piece', desc: 'Lightweight hollow bricks for partition walls, offering better thermal and sound insulation.',                                                                               rating: 4.4, reviews: 38,  badge: null,         badgeClass: '',      stock: 'in-stock',  stockText: 'In Stock',        img: 'src/assets/images/brick_product_2.png', features: ['Lightweight design', 'Better insulation', 'Easy to handle', 'Faster construction'] },
];

// ══════════════════════════════════════════
// COUPONS
// ══════════════════════════════════════════
const COUPONS = {
    GURU10:     { pct: 10, label: '10% off' },
    BRICK50:    { flat: 50, label: '\u20b950 off' },
    FIRSTORDER: { pct: 15, label: '15% off for first order' }
};

// ══════════════════════════════════════════
// VENDOR / PARTNER DATA
// ══════════════════════════════════════════
const VENDORS = [
    {
        type: 'dealer',
        name: 'Singh Construction Materials',
        location: 'Jaunpur City, UP',
        desc: 'Premier authorized dealer for all Gurukripa brick grades. 8+ years partnership.',
        contact: '+91 94150 12345',
        since: '2016',
        icon: '🏪'
    },
    {
        type: 'dealer',
        name: 'Varanasi Building Depot',
        location: 'Lanka, Varanasi, UP',
        desc: 'Authorized distributor serving Varanasi district with same-day stock availability.',
        contact: '+91 98390 56789',
        since: '2018',
        icon: '🏬'
    },
    {
        type: 'energy',
        name: 'Shyam Coal & Fuel Suppliers',
        location: 'Jalalpur, Jaunpur, UP',
        desc: 'Primary kiln energy partner supplying premium-grade coal for our double-fired process.',
        contact: '+91 94510 33210',
        since: '2010',
        icon: '\u26a1'
    },
    {
        type: 'energy',
        name: 'UP Biomass Energy Pvt. Ltd.',
        location: 'Sultanpur, UP',
        desc: 'Biomass fuel supplier supporting eco-friendly kiln operations across seasonal demand.',
        contact: '+91 99190 77002',
        since: '2020',
        icon: '\ud83c\udf3f'
    },
    {
        type: 'logistics',
        name: 'Ramesh Transport Co.',
        location: 'Jaunpur–Varanasi Highway',
        desc: 'Fleet of 12 trolley trucks ensuring same-day delivery across Jaunpur & Varanasi districts.',
        contact: '+91 98765 43210',
        since: '2012',
        icon: '\ud83d\ude9b'
    },
    {
        type: 'logistics',
        name: 'Patel Logistics Fleet',
        location: 'Shahganj, Jaunpur, UP',
        desc: 'Heavy logistics partner for bulk institutional orders across Eastern UP.',
        contact: '+91 97730 11223',
        since: '2019',
        icon: '\ud83d\ude9a'
    },
    {
        type: 'govt',
        name: 'Jaunpur PWD (Public Works Dept)',
        location: 'Jaunpur District, UP',
        desc: 'Government approved supplier for public infrastructure, roads and municipal building projects.',
        contact: 'Govt. Tender',
        since: '2015',
        icon: '\ud83c\udfdb\ufe0f'
    },
    {
        type: 'govt',
        name: 'UP Housing Board Projects',
        location: 'Uttar Pradesh',
        desc: 'Empaneled supplier for affordable housing schemes under PMAY across Jaunpur zone.',
        contact: 'Official Tender',
        since: '2021',
        icon: '\ud83c\udfe0'
    }
];

// ══════════════════════════════════════════
// CHAT RESPONSES
// ══════════════════════════════════════════
const CHAT_RESPONSES = {
    'brick prices': 'Our brick prices:\n\u2022 Laal Peti Bricks: \u20b96.25/piece\n\u2022 Awwal Bricks: \u20b97.05/piece\n\u2022 Standard Bricks: \u20b98/piece\n\u2022 Premium Red Bricks: \u20b910/piece\n\u2022 Machine Made: \u20b911/piece\n\u2022 Shiv Eent Grade-A: \u20b912/piece\n\nBulk orders get special discounts! \ud83d\udcde Call: +91 91989 23230',
    'delivery info': 'We deliver to Jaunpur, Varanasi, Jalalpur, Trilochan and 15+ cities. Same-day delivery available for orders placed before 12 PM in Jaunpur district. \ud83d\ude9b',
    'place order': 'To place an order:\n1. Browse our Products section\n2. Add bricks to cart\n3. Proceed to checkout\nOr simply call \ud83d\udcde +91 91989 23230 or WhatsApp us directly!',
    'quality': 'All our bricks are Grade-A certified and ISI compliant. Double-fired process ensures maximum durability and weather resistance. \ud83c\udfc6',
    'contact': 'You can reach us at:\n\ud83d\udcde +91 91989 23230\n\u2709\ufe0f info@gurukripaentudyog.com\n\ud83d\udccd Jaunpur\u2013Varanasi Highway, UP\n\u23f0 Mon\u2013Sat, 8AM\u20136PM',
    'discount': 'We offer bulk discounts up to 15% for large orders! Use coupon codes:\n\u2022 GURU10 \u2014 10% off\n\u2022 FIRSTORDER \u2014 15% off first order\n\u2022 BRICK50 \u2014 \u20b950 flat off',
};
