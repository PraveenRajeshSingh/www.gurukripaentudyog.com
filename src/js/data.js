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
// TRANSLATIONS  (EN + HI — full coverage)
// ══════════════════════════════════════════
const TRANSLATIONS = {
    en: {
        // Topbar
        'topbar.hours': 'Mon\u2013Sat | 8AM\u20136PM',
        // Nav
        'nav.home': 'Home', 'nav.products': 'Products', 'nav.pricing': 'Pricing',
        'nav.qualitySpec': 'Quality Spec', 'nav.calculator': 'Estimator',
        'nav.gallery': 'Gallery', 'nav.about': 'About', 'nav.contact': 'Contact',
        'nav.trackOrder': '\ud83d\ude9b Track Delivery', 'nav.vendors': 'Vendors',
        // Auth
        'auth.signIn': 'Sign In', 'auth.signUp': 'Sign Up', 'auth.signOut': 'Sign Out',
        'auth.myProfile': 'My Profile', 'auth.myCart': 'My Cart',
        // Hero
        'hero.eyebrow': "Jaunpur\u2019s #1 Brick Manufacturer \u00b7 Since 1998",
        'hero.title': 'Build with<br><em>Confidence.</em>',
        'hero.subtitle': '25+ years of premium brick manufacturing. Trusted by 10,000+ customers across Jaunpur, Varanasi &amp; Uttar Pradesh.',
        'hero.callNow': 'Call Now', 'hero.viewProducts': 'View Products',
        'hero.chip1': 'Same-Day Delivery', 'hero.chip2': 'Weather-Resistant', 'hero.chip3': 'ISI Certified',
        'hero.stat1': 'Bricks Delivered', 'hero.stat2': 'Projects Done',
        'hero.stat3': 'Cities Served', 'hero.stat4': 'Satisfaction',
        'hero.certTitle': 'Grade-A Certified', 'hero.certSub': 'Double-Fired Quality',
        // Categories
        'categories.tag': 'Premium Categories', 'categories.title': 'Explore Our Range',
        'categories.desc': 'Choose from our wide range of premium quality bricks engineered for strength',
        'categories.shivSub': 'Ultra-Premium Quality', 'categories.premiumSub': 'Double-Fired Durability',
        'categories.standardSub': 'Best Value Choice', 'categories.machineSub': 'Precision Shape & Size',
        // Products
        'products.tag': 'Verified Quality', 'products.title': 'Our Products',
        'products.desc': 'Grade-A bricks tested for strength, uniformity and weather resistance',
        'products.filterAll': 'All Products', 'products.addToCart': 'Add to Cart',
        'products.orderNow': 'Order Now', 'products.inStock': 'In Stock', 'products.lowStock': 'Limited Stock',
        // Pricing
        'pricing.tag': 'Transparent Pricing', 'pricing.title': 'Compare Our Products',
        'pricing.desc': 'No hidden costs \u2014 honest pricing at every budget level',
        'pricing.colProduct': 'Product', 'pricing.colPrice': 'Price / Brick',
        'pricing.colStrength': 'Strength', 'pricing.colBestFor': 'Best For',
        'pricing.colISI': 'ISI Grade', 'pricing.colBulk': 'Bulk Discount', 'pricing.colOrder': 'Order',
        'pricing.orderNow': 'Order Now',
        // Search
        'search.placeholder': 'Search bricks, prices...',
        // Quality Spec
        'qualitySpec.tag': 'Quality Verification',
        'qualitySpec.title': 'Brick Quality Spec & Metallic Ringing Sound Test',
        'qualitySpec.sub': 'Compare technical specifications & test the authentic metallic ringing sound of Grade-A bricks before buying',
        'qualitySpec.soundBtn1': '\ud83d\udd14 Test Grade-A Metallic Sound',
        'qualitySpec.soundBtn2': '\ud83d\udd08 Test Low-Grade Brick Sound',
        'qualitySpec.cardTitle': '\ud83d\udd0a Real-Life Quality Test: Metallic Ringing Sound (Khanak)',
        'qualitySpec.cardDesc': 'In real brick testing, striking two well-burnt Grade-A bricks together produces a clear metallic ringing sound. Poorly baked bricks make a dull thud. Tap below to simulate!',
        // Brick Details
        'brickDetails.tag': 'Know Your Bricks', 'brickDetails.title': 'Laal Peti & Awwal \u2014 Compared',
        'brickDetails.desc': 'Understand which brick suits your project best before you buy',
        // BRL / Bhatta
        'brl.tag': 'Direct from Bhatta',
        'brl.headline': 'No Middlemen.<br>No Markup.<br><em>Just Honest Prices.</em>',
        'brl.lead': "Jaunpur\u2019s only direct-to-customer brand offering all brick material at the bhatta rate. No aggressive selling \u2014 you buy exactly what you need, at factory price.",
        // Buying Guide
        'brickGuide.tag': 'Buying Guide',
        'brickGuide.title': 'Where to Use Which Brick?',
        'brickGuide.desc': 'Expert guidance for every project type',
        'brickGuide.callout': '\ud83d\udcde Confused? Call our expert for free advice',
        // About
        'about.tag': 'Our Story',
        'about.title': "Jaunpur\u2019s Most<br><em>Trusted</em> Brick Maker",
        'about.lead': 'Since 1998, Gurukripa Bricks Industry has been the backbone of construction across Jaunpur, Varanasi and all of UP.',
        'about.talkToUs': '\ud83d\udcde Talk to Us Today',
        'about.yearsLabel': 'Years of Excellence',
        // Gallery
        'about.gallery.tag': 'Our Factory',
        'about.gallery.title': 'Inside Gurukripa Bricks',
        'about.gallery.desc': 'A look inside our state-of-the-art manufacturing facility in Jaunpur, UP',
        // Quality Process
        'quality.tag': 'Our Process', 'quality.title': 'Built on Quality. Fired by Passion.',
        'quality.desc': 'Every brick passes through a rigorous 3-stage process before leaving our kiln',
        // Reviews
        'reviews.tag': 'Customer Love', 'reviews.title': 'What Our Customers Say',
        'reviews.desc': '10,000+ happy builders across Jaunpur, Varanasi & UP',
        // Vendors Section
        'vendors.tag': 'Business Partners',
        'vendors.title': 'Our Vendors & Partners',
        'vendors.desc': "A trusted network of authorized dealers, energy suppliers, logistics partners & institutional clients powering Gurukripa\u2019s excellence",
        'vendors.badge.dealer': 'Authorized Dealer',
        'vendors.badge.energy': 'Kiln Energy Partner',
        'vendors.badge.logistics': 'Logistics Fleet',
        'vendors.badge.govt': 'Govt Supply Partner',
        'vendors.since': 'Partner since',
        'vendors.inquiryTitle': 'Become a Vendor or Partner',
        'vendors.inquiryDesc': 'Are you a dealer, logistics provider, or institution looking to partner with Gurukripa Bricks? We welcome reliable partners across UP.',
        'vendors.inquiryBtn': '\ud83d\udce9 Apply to Partner with Us',
        'vendors.stat1': 'Active Dealers', 'vendors.stat2': 'Fleet Trucks',
        'vendors.stat3': 'Govt Projects', 'vendors.stat4': 'Districts Covered',
        // Calculator
        'calculator.tag': 'Smart Construction Studio',
        'calculator.title': '3-in-1 Building Material & Cost Estimator',
        'calculator.desc': 'Calculate bricks, cement bags, sand volume & total budget estimate',
        'calculator.tab1': '\ud83e\uddf1 Wall Estimator',
        'calculator.tab2': '\ud83c\udfe0 Full House Estimator',
        'calculator.tab3': '\ud83e\uddf1 Boundary Wall & Pillars',
        // Cities
        'cities.tag': 'Delivery Coverage', 'cities.title': 'Cities We Serve',
        'cities.desc': 'Delivering premium bricks across Jaunpur, Varanasi & UP \u2014 same-day within Jaunpur district',
        // FAQ
        'faq.tag': 'FAQ', 'faq.title': 'Frequently Asked Questions',
        'faq.desc': 'Everything you need to know about Gurukripa Bricks',
        // Blog
        'blog.tag': 'Knowledge Hub', 'blog.title': 'Blog & Tips',
        'blog.desc': 'Expert advice on bricks, construction, and quality building practices',
        // Contact
        'contact.tag': 'Get In Touch', 'contact.title': 'Contact Us',
        'contact.desc': 'We respond within the hour \u2014 or just call us directly',
        'contact.labelPhone': 'Phone', 'contact.labelEmail': 'Email',
        'contact.labelAddress': 'Address', 'contact.labelHours': 'Working Hours',
        'contact.whatsapp': '\ud83d\udcac Chat on WhatsApp',
        'contact.formName': 'Full Name *', 'contact.formEmail': 'Email *',
        'contact.formPhone': 'Phone *', 'contact.formSubject': 'Subject *',
        'contact.formMessage': 'Message *', 'contact.sendBtn': '\ud83d\udce8 Send Message',
        'contact.sending': '\u23f3 Sending...',
        // Footer
        'footer.quickLinks': 'Quick Links', 'footer.ourProducts': 'Our Products',
        'footer.connect': 'Connect With Us', 'footer.newsletter': 'Newsletter',
        'footer.newsletterDesc': 'Get offers & updates', 'footer.subscribe': 'Subscribe',
        'footer.weAccept': 'We Accept:',
        'footer.rights': '\u00a9 2025 Gurukripa Bricks Industry. All rights reserved.',
        // Drawer / Mobile Nav
        'drawer.callUs': '\ud83d\udcde Call Us', 'drawer.whatsapp': '\ud83d\udcac WhatsApp',
        'drawer.signUp': 'Sign Up \u2014 Free', 'drawer.signIn': 'Sign In',
        'drawer.trackDelivery': 'Track Delivery \ud83d\ude9b',
        'drawer.qualitySpec': 'Quality Specs & Tester',
        'drawer.estimator': 'Material Estimator',
        'drawer.aboutUs': 'About Us',
        // Mobile bottom nav
        'mobile.home': 'Home', 'mobile.products': 'Products',
        'mobile.cart': 'Cart', 'mobile.calc': 'Calc', 'mobile.profile': 'Profile',
        // CTA Banner
        'cta.title': 'Order Premium Bricks Today \u2014<br>Fast Delivery in Jaunpur!',
        'cta.subtitle': '\u0906\u091c \u0939\u0940 \u0911\u0930\u094d\u0921\u0930 \u0915\u0930\u0947\u0902 \u0914\u0930 \u0905\u092a\u0928\u0947 \u0938\u092a\u0928\u094b\u0902 \u0915\u093e \u0918\u0930 \u092c\u0928\u093e\u090f\u0902',
        'cta.call': '\ud83d\udcde Call Now: +91 91989 23230',
        'cta.wa': '\ud83d\udcac WhatsApp Us',
    },
    hi: {
        // Topbar
        'topbar.hours': '\u0938\u094b\u092e\u2013\u0936\u0928\u093f | \u0938\u0941\u092c\u0939 8\u2013\u0936\u093e\u092e 6',
        // Nav
        'nav.home': '\u0939\u094b\u092e', 'nav.products': '\u0909\u0924\u094d\u092a\u093e\u0926', 'nav.pricing': '\u092e\u0942\u0932\u094d\u092f',
        'nav.qualitySpec': '\u0917\u0941\u0923 \u0935\u093f\u0936\u0947\u0937', 'nav.calculator': '\u0905\u0928\u0941\u092e\u093e\u0928\u0915',
        'nav.gallery': '\u0917\u0948\u0932\u0930\u0940', 'nav.about': '\u0939\u092e\u093e\u0930\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902', 'nav.contact': '\u0938\u0902\u092a\u0930\u094d\u0915',
        'nav.trackOrder': '\ud83d\ude9b \u0921\u093f\u0932\u0940\u0935\u0930\u0940 \u091f\u094d\u0930\u0948\u0915 \u0915\u0930\u0947\u0902', 'nav.vendors': '\u0935\u093f\u0915\u094d\u0930\u0947\u0924\u093e',
        // Auth
        'auth.signIn': '\u0938\u093e\u0907\u0928 \u0907\u0928', 'auth.signUp': '\u0938\u093e\u0907\u0928 \u0905\u092a', 'auth.signOut': '\u0938\u093e\u0907\u0928 \u0906\u0909\u091f',
        'auth.myProfile': '\u092e\u0947\u0930\u0940 \u092a\u094d\u0930\u094b\u092b\u093e\u0907\u0932', 'auth.myCart': '\u092e\u0947\u0930\u0940 \u0915\u093e\u0930\u094d\u091f',
        // Hero
        'hero.eyebrow': '\u091c\u094c\u0928\u092a\u0941\u0930 \u0915\u093e \u0928\u0902\u092c\u0930 1 \u0908\u0902\u091f \u0928\u093f\u0930\u094d\u092e\u093e\u0924\u093e \u00b7 1998 \u0938\u0947',
        'hero.title': '\u0906\u0924\u094d\u092e\u0935\u093f\u0936\u094d\u0935\u093e\u0938 \u0915\u0947 \u0938\u093e\u0925<br><em>\u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0915\u0930\u0947\u0902\u0964</em>',
        'hero.subtitle': '25+ \u0935\u0930\u094d\u0937\u094b\u0902 \u0915\u093e \u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e \u0908\u0902\u091f \u0928\u093f\u0930\u094d\u092e\u093e\u0923\u0964 \u091c\u094c\u0928\u092a\u0941\u0930, \u0935\u093e\u0930\u093e\u0923\u0938\u0940 \u0914\u0930 \u0909\u0924\u094d\u0924\u0930 \u092a\u094d\u0930\u0926\u0947\u0936 \u092e\u0947\u0902 10,000+ \u0917\u094d\u0930\u093e\u0939\u0915\u094b\u0902 \u0926\u094d\u0935\u093e\u0930\u093e \u0935\u093f\u0936\u094d\u0935\u0938\u094d\u0924\u0964',
        'hero.callNow': '\u0905\u092d\u0940 \u0915\u0949\u0932 \u0915\u0930\u0947\u0902', 'hero.viewProducts': '\u0909\u0924\u094d\u092a\u093e\u0926 \u0926\u0947\u0916\u0947\u0902',
        'hero.chip1': '\u0909\u0938\u0940 \u0926\u093f\u0928 \u0921\u093f\u0932\u0940\u0935\u0930\u0940', 'hero.chip2': '\u092e\u094c\u0938\u092e \u092a\u094d\u0930\u0924\u093f\u0930\u094b\u0927\u0940', 'hero.chip3': 'ISI \u092a\u094d\u0930\u092e\u093e\u0923\u093f\u0924',
        'hero.stat1': '\u0908\u0902\u091f\u0947\u0902 \u0921\u093f\u0932\u0940\u0935\u0930', 'hero.stat2': '\u092a\u094d\u0930\u094b\u091c\u0947\u0915\u094d\u091f \u092a\u0942\u0930\u094d\u0923',
        'hero.stat3': '\u0936\u0939\u0930\u094b\u0902 \u092e\u0947\u0902 \u0938\u0947\u0935\u093e', 'hero.stat4': '\u0938\u0902\u0924\u0941\u0937\u094d\u091f\u093f',
        'hero.certTitle': '\u0917\u094d\u0930\u0947\u0921-A \u092a\u094d\u0930\u092e\u093e\u0923\u093f\u0924', 'hero.certSub': '\u0921\u092c\u0932-\u092b\u093e\u092f\u0930\u094d\u0921 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e',
        // Categories
        'categories.tag': '\u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e \u0936\u094d\u0930\u0947\u0923\u093f\u092f\u093e\u0901', 'categories.title': '\u0939\u092e\u093e\u0930\u0940 \u0936\u094d\u0930\u0947\u0923\u0940 \u0926\u0947\u0916\u0947\u0902',
        'categories.desc': '\u092e\u091c\u092c\u0942\u0924\u0940 \u0915\u0947 \u0932\u093f\u090f \u0924\u0948\u092f\u093e\u0930 \u0915\u0940 \u0917\u0908 \u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e \u0908\u0902\u091f\u094b\u0902 \u0915\u0940 \u0935\u093f\u0936\u093e\u0932 \u0936\u094d\u0930\u0947\u0923\u0940 \u092e\u0947\u0902 \u0938\u0947 \u091a\u0941\u0928\u0947\u0902',
        'categories.shivSub': '\u0905\u0932\u094d\u091f\u094d\u0930\u093e-\u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e', 'categories.premiumSub': '\u0921\u092c\u0932-\u092b\u093e\u092f\u0930\u094d\u0921 \u092e\u091c\u092c\u0942\u0924\u0940',
        'categories.standardSub': '\u0938\u0930\u094d\u0935\u0936\u094d\u0930\u0947\u0937\u094d\u0920 \u0915\u093f\u092b\u093e\u092f\u0924\u0940 \u0935\u093f\u0915\u0932\u094d\u092a', 'categories.machineSub': '\u092a\u0930\u093f\u0936\u0941\u0926\u094d\u0927 \u0906\u0915\u093e\u0930 \u0914\u0930 \u0938\u093e\u0907\u091c\u093c',
        // Products
        'products.tag': '\u092a\u094d\u0930\u092e\u093e\u0923\u093f\u0924 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e', 'products.title': '\u0939\u092e\u093e\u0930\u0947 \u0909\u0924\u094d\u092a\u093e\u0926',
        'products.desc': '\u0939\u0930 \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0906\u0935\u0936\u094d\u092f\u0915\u0924\u093e \u0915\u0947 \u0932\u093f\u090f \u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e \u0908\u0902\u091f\u094b\u0902 \u0915\u0940 \u091a\u092f\u0928\u093f\u0924 \u0936\u094d\u0930\u0947\u0923\u0940',
        'products.filterAll': '\u0938\u092d\u0940 \u0909\u0924\u094d\u092a\u093e\u0926', 'products.addToCart': '\u0915\u093e\u0930\u094d\u091f \u092e\u0947\u0902 \u091c\u094b\u0921\u093c\u0947\u0902',
        'products.orderNow': '\u0905\u092d\u0940 \u0911\u0930\u094d\u0921\u0930 \u0915\u0930\u0947\u0902', 'products.inStock': '\u0938\u094d\u091f\u0949\u0915 \u092e\u0947\u0902', 'products.lowStock': '\u0938\u0940\u092e\u093f\u0924 \u0938\u094d\u091f\u0949\u0915',
        // Pricing
        'pricing.tag': '\u092a\u093e\u0930\u0926\u0930\u094d\u0936\u0940 \u092e\u0942\u0932\u094d\u092f \u0928\u093f\u0930\u094d\u0927\u093e\u0930\u0923', 'pricing.title': '\u0939\u092e\u093e\u0930\u0947 \u0909\u0924\u094d\u092a\u093e\u0926\u094b\u0902 \u0915\u0940 \u0924\u0941\u0932\u0928\u093e \u0915\u0930\u0947\u0902',
        'pricing.desc': '\u0915\u094b\u0908 \u091b\u093f\u092a\u0940 \u0939\u0941\u0908 \u0932\u093e\u0917\u0924 \u0928\u0939\u0940\u0902 \u2014 \u0939\u0930 \u092c\u091c\u091f \u0938\u094d\u0924\u0930 \u092a\u0930 \u0908\u092e\u093e\u0928\u0926\u093e\u0930 \u092e\u0942\u0932\u094d\u092f',
        'pricing.colProduct': '\u0909\u0924\u094d\u092a\u093e\u0926', 'pricing.colPrice': '\u092e\u0942\u0932\u094d\u092f / \u0908\u0902\u091f',
        'pricing.colStrength': '\u092e\u091c\u092c\u0942\u0924\u0940', 'pricing.colBestFor': '\u0938\u092c\u0938\u0947 \u0905\u091a\u094d\u091b\u093e',
        'pricing.colISI': 'ISI \u0917\u094d\u0930\u0947\u0921', 'pricing.colBulk': '\u0925\u094b\u0915 \u091b\u0942\u091f', 'pricing.colOrder': '\u0911\u0930\u094d\u0921\u0930',
        'pricing.orderNow': '\u0905\u092d\u0940 \u0911\u0930\u094d\u0921\u0930 \u0915\u0930\u0947\u0902',
        // Search
        'search.placeholder': '\u0908\u0902\u091f\u0947\u0902, \u0915\u0940\u092e\u0924\u0947\u0902 \u0916\u094b\u091c\u0947\u0902...',
        // Quality Spec
        'qualitySpec.tag': '\u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u092a\u094d\u0930\u092e\u093e\u0923\u0940\u0915\u0930\u0923',
        'qualitySpec.title': '\u0908\u0902\u091f \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0935\u093f\u0936\u0947\u0937 \u0914\u0930 \u0916\u0928\u0915 \u091f\u0947\u0938\u094d\u091f',
        'qualitySpec.sub': '\u0916\u0930\u0940\u0926\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947 \u0924\u0915\u0928\u0940\u0915\u0940 \u0935\u093f\u0936\u0947\u0937\u0924\u093e\u0913\u0902 \u0915\u0940 \u0924\u0941\u0932\u0928\u093e \u0915\u0930\u0947\u0902 \u0914\u0930 \u0917\u094d\u0930\u0947\u0921-A \u0908\u0902\u091f\u094b\u0902 \u0915\u0940 \u0905\u0938\u0932\u0940 \u0916\u0928\u0915 \u091f\u0947\u0938\u094d\u091f \u0915\u0930\u0947\u0902',
        'qualitySpec.soundBtn1': '\ud83d\udd14 \u0917\u094d\u0930\u0947\u0921-A \u0916\u0928\u0915 \u091f\u0947\u0938\u094d\u091f \u0915\u0930\u0947\u0902',
        'qualitySpec.soundBtn2': '\ud83d\udd08 \u0928\u093f\u092e\u094d\u0928 \u0917\u094d\u0930\u0947\u0921 \u0908\u0902\u091f \u0915\u0940 \u0906\u0935\u093e\u091c\u093c \u091f\u0947\u0938\u094d\u091f \u0915\u0930\u0947\u0902',
        'qualitySpec.cardTitle': '\ud83d\udd0a \u0905\u0938\u0932\u0940 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u091f\u0947\u0938\u094d\u091f: \u0916\u0928\u0915 \u0915\u0940 \u0906\u0935\u093e\u091c\u093c \u0938\u0941\u0928\u0947\u0902',
        'qualitySpec.cardDesc': '\u092d\u093e\u0930\u0924 \u092e\u0947\u0902 \u0908\u0902\u091f \u092a\u0930\u0940\u0915\u094d\u0937\u0923 \u092e\u0947\u0902, \u0926\u094b \u0905\u091a\u094d\u091b\u0940 \u0924\u0930\u0939 \u091c\u0932\u0940 \u0917\u094d\u0930\u0947\u0921-A \u0908\u0902\u091f\u094b\u0902 \u0915\u094b \u0906\u092a\u0938 \u092e\u0947\u0902 \u0920\u094b\u0915\u0928\u0947 \u092a\u0930 \u0938\u094d\u092a\u0937\u094d\u091f \u0916\u0928\u0915 \u0915\u0940 \u0906\u0935\u093e\u091c\u093c \u0906\u0924\u0940 \u0939\u0948\u0964',
        // Brick Details
        'brickDetails.tag': '\u0908\u0902\u091f \u0915\u0940 \u091c\u093e\u0928\u0915\u093e\u0930\u0940', 'brickDetails.title': '\u0932\u093e\u0932 \u092a\u0947\u091f\u0940 \u0914\u0930 \u0906\u0935\u094d\u0935\u0932 \u2014 \u0924\u0941\u0932\u0928\u093e',
        'brickDetails.desc': '\u0916\u0930\u0940\u0926\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947 \u091c\u093e\u0928\u0947\u0902 \u0915\u093f \u0906\u092a\u0915\u0947 \u092a\u094d\u0930\u094b\u091c\u0947\u0915\u094d\u091f \u0915\u0947 \u0932\u093f\u090f \u0915\u094c\u0928 \u0938\u0940 \u0908\u0902\u091f \u0938\u092c\u0938\u0947 \u0909\u092a\u092f\u0941\u0915\u094d\u0924 \u0939\u0948',
        // BRL
        'brl.tag': '\u0938\u0940\u0927\u0947 \u092d\u091f\u094d\u091f\u0947 \u0938\u0947',
        'brl.headline': '\u0915\u094b\u0908 \u092c\u093f\u091a\u094c\u0932\u093f\u092f\u093e \u0928\u0939\u0940\u0902\u0964<br>\u0915\u094b\u0908 \u092e\u093e\u0930\u094d\u0915\u0905\u092a \u0928\u0939\u0940\u0902\u0964<br><em>\u092c\u0938 \u0908\u092e\u093e\u0928\u0926\u093e\u0930 \u0915\u0940\u092e\u0924\u0947\u0902\u0964</em>',
        'brl.lead': '\u091c\u094c\u0928\u092a\u0941\u0930 \u092e\u0947\u0902 \u090f\u0915\u092e\u093e\u0924\u094d\u0930 \u0910\u0938\u093e \u092c\u094d\u0930\u093e\u0902\u0921 \u091c\u094b \u092d\u091f\u094d\u091f\u0947 \u0915\u0940 \u0926\u0930 \u092a\u0930 \u0938\u092d\u0940 \u0908\u0902\u091f \u0938\u093e\u092e\u0917\u094d\u0930\u0940 \u0926\u0947\u0924\u093e \u0939\u0948\u0964',
        // Buying Guide
        'brickGuide.tag': '\u0916\u0930\u0940\u0926 \u0917\u093e\u0907\u0921',
        'brickGuide.title': '\u0915\u0939\u093e\u0901 \u0915\u094c\u0928 \u0938\u0940 \u0908\u0902\u091f \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0947\u0902?',
        'brickGuide.desc': '\u0939\u0930 \u092a\u094d\u0930\u094b\u091c\u0947\u0915\u094d\u091f \u0915\u0947 \u0932\u093f\u090f \u0935\u093f\u0936\u0947\u0937\u091c\u094d\u091e \u092e\u093e\u0930\u094d\u0917\u0926\u0930\u094d\u0936\u0928',
        'brickGuide.callout': '\ud83d\udcde \u0909\u0932\u091d\u0928 \u092e\u0947\u0902 \u0939\u0948\u0902? \u0939\u092e\u093e\u0930\u0947 \u0935\u093f\u0936\u0947\u0937\u091c\u094d\u091e \u0915\u094b \u0928\u093f\u0903\u0936\u0941\u0932\u094d\u0915 \u0915\u0949\u0932 \u0915\u0930\u0947\u0902',
        // About
        'about.tag': '\u0939\u092e\u093e\u0930\u0940 \u0915\u0939\u093e\u0928\u0940',
        'about.title': '\u091c\u094c\u0928\u092a\u0941\u0930 \u0915\u093e \u0938\u092c\u0938\u0947<br><em>\u0935\u093f\u0936\u094d\u0935\u0938\u0928\u0940\u092f</em> \u0908\u0902\u091f \u0928\u093f\u0930\u094d\u092e\u093e\u0924\u093e',
        'about.lead': '1998 \u0938\u0947, \u0917\u0941\u0930\u0941\u0915\u0943\u092a\u093e \u0908\u0902\u091f \u0909\u0926\u094d\u092f\u094b\u0917 \u091c\u094c\u0928\u092a\u0941\u0930, \u0935\u093e\u0930\u093e\u0923\u0938\u0940 \u0914\u0930 UP \u092e\u0947\u0902 \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0915\u0940 \u0930\u0940\u0922\u093c \u0930\u0939\u093e \u0939\u0948\u0964',
        'about.talkToUs': '\ud83d\udcde \u0906\u091c \u0939\u0940 \u0939\u092e\u0938\u0947 \u092c\u093e\u0924 \u0915\u0930\u0947\u0902',
        'about.yearsLabel': '\u0935\u0930\u094d\u0937\u094b\u0902 \u0915\u0940 \u0909\u0924\u094d\u0915\u0943\u0937\u094d\u091f\u0924\u093e',
        // Gallery
        'about.gallery.tag': '\u0939\u092e\u093e\u0930\u093e \u0915\u093e\u0930\u0916\u093e\u0928\u093e',
        'about.gallery.title': '\u0917\u0941\u0930\u0941\u0915\u0943\u092a\u093e \u0908\u0902\u091f \u0909\u0926\u094d\u092f\u094b\u0917 \u0915\u0947 \u0905\u0902\u0926\u0930',
        'about.gallery.desc': '\u091c\u094c\u0928\u092a\u0941\u0930, UP \u092e\u0947\u0902 \u0939\u092e\u093e\u0930\u0940 \u0905\u0924\u094d\u092f\u093e\u0927\u0941\u0928\u093f\u0915 \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0938\u0941\u0935\u093f\u0927\u093e \u0915\u0940 \u090f\u0915 \u091d\u0932\u0915',
        // Quality Process
        'quality.tag': '\u0939\u092e\u093e\u0930\u0940 \u092a\u094d\u0930\u0915\u094d\u0930\u093f\u092f\u093e', 'quality.title': '\u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u092a\u0930 \u0928\u093f\u0930\u094d\u092e\u093f\u0924\u0964 \u091c\u0941\u0928\u0942\u0928 \u0938\u0947 \u0924\u092a\u093e\u092f\u093e\u0964',
        'quality.desc': '\u0939\u0930 \u0908\u0902\u091f \u0915\u093f\u0932\u094d\u0928 \u091b\u094b\u0921\u093c\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947 \u0915\u0920\u094b\u0930 3-\u091a\u0930\u0923 \u092a\u094d\u0930\u0915\u094d\u0930\u093f\u092f\u093e \u0938\u0947 \u0917\u0941\u091c\u0930\u0924\u0940 \u0939\u0948',
        // Reviews
        'reviews.tag': '\u0917\u094d\u0930\u093e\u0939\u0915 \u092a\u094d\u092f\u093e\u0930', 'reviews.title': '\u0939\u092e\u093e\u0930\u0947 \u0917\u094d\u0930\u093e\u0939\u0915 \u0915\u094d\u092f\u093e \u0915\u0939\u0924\u0947 \u0939\u0948\u0902',
        'reviews.desc': '\u091c\u094c\u0928\u092a\u0941\u0930, \u0935\u093e\u0930\u093e\u0923\u0938\u0940 \u0914\u0930 UP \u092e\u0947\u0902 10,000+ \u0916\u0941\u0936 \u0928\u093f\u0930\u094d\u092e\u093e\u0924\u093e',
        // Vendors
        'vendors.tag': '\u0935\u094d\u092f\u093e\u092a\u093e\u0930\u093f\u0915 \u0938\u093e\u091d\u0947\u0926\u093e\u0930',
        'vendors.title': '\u0939\u092e\u093e\u0930\u0947 \u0935\u093f\u0915\u094d\u0930\u0947\u0924\u093e \u0914\u0930 \u0938\u093e\u091d\u0947\u0926\u093e\u0930',
        'vendors.desc': '\u0905\u0927\u093f\u0915\u0943\u0924 \u0921\u0940\u0932\u0930\u094b\u0902, \u090a\u0930\u094d\u091c\u093e \u0906\u092a\u0942\u0930\u094d\u0924\u093f\u0915\u0930\u094d\u0924\u093e\u0913\u0902, \u0932\u0949\u091c\u093f\u0938\u094d\u091f\u093f\u0915\u094d\u0938 \u092d\u093e\u0917\u0940\u0926\u093e\u0930\u094b\u0902 \u0914\u0930 \u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u0917\u094d\u0930\u093e\u0939\u0915\u094b\u0902 \u0915\u093e \u090f\u0915 \u0935\u093f\u0936\u094d\u0935\u0938\u0928\u0940\u092f \u0928\u0947\u091f\u0935\u0930\u094d\u0915',
        'vendors.badge.dealer': '\u0905\u0927\u093f\u0915\u0943\u0924 \u0921\u0940\u0932\u0930',
        'vendors.badge.energy': '\u092d\u091f\u094d\u091f\u093e \u090a\u0930\u094d\u091c\u093e \u0938\u093e\u091d\u0947\u0926\u093e\u0930',
        'vendors.badge.logistics': '\u0932\u0949\u091c\u093f\u0938\u094d\u091f\u093f\u0915\u094d\u0938 \u092b\u094d\u0932\u0940\u091f',
        'vendors.badge.govt': '\u0938\u0930\u0915\u093e\u0930\u0940 \u0906\u092a\u0942\u0930\u094d\u0924\u093f \u0938\u093e\u091d\u0947\u0926\u093e\u0930',
        'vendors.since': '\u0938\u093e\u091d\u0947\u0926\u093e\u0930\u0940 \u0936\u0941\u0930\u0942',
        'vendors.inquiryTitle': '\u0935\u093f\u0915\u094d\u0930\u0947\u0924\u093e \u092f\u093e \u0938\u093e\u091d\u0947\u0926\u093e\u0930 \u092c\u0928\u0947\u0902',
        'vendors.inquiryDesc': '\u0915\u094d\u092f\u093e \u0906\u092a \u0921\u0940\u0932\u0930, \u0932\u0949\u091c\u093f\u0938\u094d\u091f\u093f\u0915\u094d\u0938 \u092a\u094d\u0930\u0926\u093e\u0924\u093e \u092f\u093e \u0938\u0902\u0938\u094d\u0925\u093e \u0939\u0948\u0902 \u091c\u094b \u0917\u0941\u0930\u0941\u0915\u0943\u092a\u093e \u0908\u0902\u091f \u0915\u0947 \u0938\u093e\u0925 \u0938\u093e\u091d\u0947\u0926\u093e\u0930\u0940 \u0915\u0930\u0928\u093e \u091a\u093e\u0939\u0924\u0947 \u0939\u0948\u0902?',
        'vendors.inquiryBtn': '\ud83d\udce9 \u0938\u093e\u091d\u0947\u0926\u093e\u0930\u0940 \u0915\u0947 \u0932\u093f\u090f \u0906\u0935\u0947\u0926\u0928 \u0915\u0930\u0947\u0902',
        'vendors.stat1': '\u0938\u0915\u094d\u0930\u093f\u092f \u0921\u0940\u0932\u0930', 'vendors.stat2': '\u091f\u094d\u0930\u0915 \u092b\u094d\u0932\u0940\u091f',
        'vendors.stat3': '\u0938\u0930\u0915\u093e\u0930\u0940 \u092a\u094d\u0930\u094b\u091c\u0947\u0915\u094d\u091f', 'vendors.stat4': '\u091c\u093f\u0932\u0947 \u0915\u0935\u0930',
        // Calculator
        'calculator.tag': '\u0938\u094d\u092e\u093e\u0930\u094d\u091f \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0938\u094d\u091f\u0942\u0921\u093f\u092f\u094b',
        'calculator.title': '3-\u0907\u0928-1 \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0938\u093e\u092e\u0917\u094d\u0930\u0940 \u0914\u0930 \u0932\u093e\u0917\u0924 \u0905\u0928\u0941\u092e\u093e\u0928\u0915',
        'calculator.desc': '\u0908\u0902\u091f\u0947\u0902, \u0938\u0940\u092e\u0947\u0902\u091f \u092c\u0948\u0917, \u0930\u0947\u0924 \u0915\u0940 \u092e\u093e\u0924\u094d\u0930\u093e \u0914\u0930 \u0915\u0941\u0932 \u092c\u091c\u091f \u0905\u0928\u0941\u092e\u093e\u0928 \u0915\u0940 \u0917\u0923\u0928\u093e \u0915\u0930\u0947\u0902',
        'calculator.tab1': '\ud83e\uddf1 \u090f\u0915\u0932/\u092c\u0939\u0941-\u0926\u0940\u0935\u093e\u0930 \u0905\u0928\u0941\u092e\u093e\u0928\u0915',
        'calculator.tab2': '\ud83c\udfe0 \u092a\u0942\u0930\u094d\u0923 \u0918\u0930 \u0938\u093e\u092e\u0917\u094d\u0930\u0940 \u0905\u0928\u0941\u092e\u093e\u0928\u0915',
        'calculator.tab3': '\ud83e\uddf1 \u0938\u0940\u092e\u093e \u0926\u0940\u0935\u093e\u0930 \u0914\u0930 \u0938\u094d\u0924\u0902\u092d',
        // Cities
        'cities.tag': '\u0921\u093f\u0932\u0940\u0935\u0930\u0940 \u0915\u094d\u0937\u0947\u0924\u094d\u0930', 'cities.title': '\u0939\u092e \u091c\u0939\u093e\u0901 \u0938\u0947\u0935\u093e \u0926\u0947\u0924\u0947 \u0939\u0948\u0902',
        'cities.desc': '\u091c\u094c\u0928\u092a\u0941\u0930, \u0935\u093e\u0930\u093e\u0923\u0938\u0940 \u0914\u0930 UP \u092e\u0947\u0902 \u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e \u0908\u0902\u091f\u0947\u0902 \u0921\u093f\u0932\u0940\u0935\u0930 \u2014 \u091c\u094c\u0928\u092a\u0941\u0930 \u091c\u093f\u0932\u0947 \u092e\u0947\u0902 \u0909\u0938\u0940 \u0926\u093f\u0928',
        // FAQ
        'faq.tag': '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u092a\u094d\u0930\u0936\u094d\u0928', 'faq.title': '\u0905\u0915\u094d\u0938\u0930 \u092a\u0942\u091b\u0947 \u091c\u093e\u0928\u0947 \u0935\u093e\u0932\u0947 \u092a\u094d\u0930\u0936\u094d\u0928',
        'faq.desc': '\u0917\u0941\u0930\u0941\u0915\u0943\u092a\u093e \u0908\u0902\u091f \u0915\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902 \u0938\u092c \u0915\u0941\u091b \u091c\u093e\u0928\u0947\u0902',
        // Blog
        'blog.tag': '\u091c\u094d\u091e\u093e\u0928 \u0915\u0947\u0902\u0926\u094d\u0930', 'blog.title': '\u092c\u094d\u0932\u0949\u0917 \u0914\u0930 \u091f\u093f\u092a\u094d\u0938',
        'blog.desc': '\u0908\u0902\u091f\u094b\u0902, \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0914\u0930 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u092a\u094d\u0930\u0925\u093e\u0913\u0902 \u092a\u0930 \u0935\u093f\u0936\u0947\u0937\u091c\u094d\u091e \u0938\u0932\u093e\u0939',
        // Contact
        'contact.tag': '\u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902', 'contact.title': '\u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902',
        'contact.desc': '\u0939\u092e \u090f\u0915 \u0918\u0902\u091f\u0947 \u0915\u0947 \u092d\u0940\u0924\u0930 \u091c\u0935\u093e\u092c \u0926\u0947\u0924\u0947 \u0939\u0948\u0902 \u2014 \u092f\u093e \u0938\u0940\u0927\u0947 \u0915\u0949\u0932 \u0915\u0930\u0947\u0902',
        'contact.labelPhone': '\u092b\u094b\u0928', 'contact.labelEmail': '\u0908\u092e\u0947\u0932',
        'contact.labelAddress': '\u092a\u0924\u093e', 'contact.labelHours': '\u0915\u093e\u092e \u0915\u0947 \u0918\u0902\u091f\u0947',
        'contact.whatsapp': '\ud83d\udcac WhatsApp \u092a\u0930 \u091a\u0948\u091f \u0915\u0930\u0947\u0902',
        'contact.formName': '\u092a\u0942\u0930\u093e \u0928\u093e\u092e *', 'contact.formEmail': '\u0908\u092e\u0947\u0932 *',
        'contact.formPhone': '\u092b\u094b\u0928 *', 'contact.formSubject': '\u0935\u093f\u0937\u092f *',
        'contact.formMessage': '\u0938\u0902\u0926\u0947\u0936 *', 'contact.sendBtn': '\ud83d\udce8 \u0938\u0902\u0926\u0947\u0936 \u092d\u0947\u091c\u0947\u0902',
        'contact.sending': '\u23f3 \u092d\u0947\u091c \u0930\u0939\u0947 \u0939\u0948\u0902...',
        // Footer
        'footer.quickLinks': '\u0924\u094d\u0935\u0930\u093f\u0924 \u0932\u093f\u0902\u0915', 'footer.ourProducts': '\u0939\u092e\u093e\u0930\u0947 \u0909\u0924\u094d\u092a\u093e\u0926',
        'footer.connect': '\u0939\u092e\u0938\u0947 \u091c\u0941\u0921\u093c\u0947\u0902', 'footer.newsletter': '\u0928\u094d\u092f\u0942\u091c\u093c\u0932\u0947\u091f\u0930',
        'footer.newsletterDesc': '\u0911\u092b\u0930 \u0914\u0930 \u0905\u092a\u0921\u0947\u091f \u092a\u093e\u090f\u0902', 'footer.subscribe': '\u0938\u0926\u0938\u094d\u092f\u0924\u093e \u0932\u0947\u0902',
        'footer.weAccept': '\u0939\u092e \u0938\u094d\u0935\u0940\u0915\u093e\u0930 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902:',
        'footer.rights': '\u00a9 2025 \u0917\u0941\u0930\u0941\u0915\u0943\u092a\u093e \u0908\u0902\u091f \u0909\u0926\u094d\u092f\u094b\u0917\u0964 \u0938\u0930\u094d\u0935\u093e\u0927\u093f\u0915\u093e\u0930 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924\u0964',
        // Drawer / Mobile Nav
        'drawer.callUs': '\ud83d\udcde \u0915\u0949\u0932 \u0915\u0930\u0947\u0902', 'drawer.whatsapp': '\ud83d\udcac WhatsApp',
        'drawer.signUp': '\u0938\u093e\u0907\u0928 \u0905\u092a \u0915\u0930\u0947\u0902 \u2014 \u0928\u093f\u0903\u0936\u0941\u0932\u094d\u0915', 'drawer.signIn': '\u0938\u093e\u0907\u0928 \u0907\u0928',
        'drawer.trackDelivery': '\u0921\u093f\u0932\u0940\u0935\u0930\u0940 \u091f\u094d\u0930\u0948\u0915 \u0915\u0930\u0947\u0902 \ud83d\ude9b',
        'drawer.qualitySpec': '\u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0935\u093f\u0936\u0947\u0937 \u0914\u0930 \u091f\u0947\u0938\u094d\u091f\u0930',
        'drawer.estimator': '\u0938\u093e\u092e\u0917\u094d\u0930\u0940 \u0905\u0928\u0941\u092e\u093e\u0928\u0915',
        'drawer.aboutUs': '\u0939\u092e\u093e\u0930\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902',
        // Mobile bottom nav
        'mobile.home': '\u0939\u094b\u092e', 'mobile.products': '\u0909\u0924\u094d\u092a\u093e\u0926',
        'mobile.cart': '\u0915\u093e\u0930\u094d\u091f', 'mobile.calc': '\u0905\u0928\u0941\u092e\u093e\u0928', 'mobile.profile': '\u092a\u094d\u0930\u094b\u092b\u093e\u0907\u0932',
        // CTA Banner
        'cta.title': '\u0906\u091c \u0939\u0940 \u092a\u094d\u0930\u0940\u092e\u093f\u092f\u092e \u0908\u0902\u091f\u0947\u0902 \u0911\u0930\u094d\u0921\u0930 \u0915\u0930\u0947\u0902 \u2014<br>\u091c\u094c\u0928\u092a\u0941\u0930 \u092e\u0947\u0902 \u0924\u0947\u091c\u093c \u0921\u093f\u0932\u0940\u0935\u0930\u0940!',
        'cta.subtitle': '\u0906\u091c \u0939\u0940 \u0911\u0930\u094d\u0921\u0930 \u0915\u0930\u0947\u0902 \u0914\u0930 \u0905\u092a\u0928\u0947 \u0938\u092a\u0928\u094b\u0902 \u0915\u093e \u0918\u0930 \u092c\u0928\u093e\u090f\u0902',
        'cta.call': '\ud83d\udcde \u0905\u092d\u0940 \u0915\u0949\u0932 \u0915\u0930\u0947\u0902: +91 91989 23230',
        'cta.wa': '\ud83d\udcac WhatsApp \u0915\u0930\u0947\u0902',
    }
};

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
