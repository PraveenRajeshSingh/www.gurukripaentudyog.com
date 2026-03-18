/**
 * Gurukripa Bricks - Product Database
 */

var PRODUCTS = [
    {
        id: 1,
        name: 'Shiv Eant (Grade-A)',
        nameHi: 'शिव ईंट (ग्रेड-A)',
        category: 'shiv-eent',
        price: 10,
        oldPrice: 12,
        image: 'src/assets/images/redbrick1.jpg',
        description: 'Ultra-premium machine-made bricks with sharp edges and supreme strength. Ideal for high-rise buildings and luxury homes.',
        descriptionHi: 'नुकीले किनारों और सर्वोच्च शक्ति वाली अल्ट्रा-प्रीमियम मशीन से बनी ईंटें। ऊंची इमारतों और लक्जरी घरों के लिए आदर्श।',
        tag: 'Best Seller',
        tagClass: 'tag-best-seller',
        inStock: true,
        isNew: true,
        isHot: true,
        specs: { size: '9" x 4.5" x 3"', strength: '1500+ PSI', water: '<12%' }
    },
    {
        id: 2,
        name: 'Premium Red Clay Brick',
        nameHi: 'प्रीमियम लाल मिट्टी की ईंट',
        category: 'premium',
        price: 8.5,
        oldPrice: 9.5,
        image: 'src/assets/images/brick.jpeg',
        description: 'Double-fired premium clay bricks with uniform color and high durability. Trusted by top contractors in Jaunpur.',
        descriptionHi: 'एकसमान रंग और उच्च स्थायित्व वाली डबल-फायर्ड प्रीमियम मिट्टी की ईंटें। जौनपुर के शीर्ष ठेकेदारों द्वारा विश्वसनीय।',
        tag: 'Premium',
        tagClass: 'tag-premium',
        inStock: true,
        specs: { size: '9" x 4" x 3"', strength: '1200 PSI', water: '<15%' }
    },
    {
        id: 3,
        name: 'Standard Field Brick',
        nameHi: 'स्टैंडर्ड फील्ड ईंट',
        category: 'standard',
        price: 6.5,
        oldPrice: 7.5,
        image: 'src/assets/images/redbricks.jpg',
        description: 'Affordable and reliable bricks for boundary walls and general construction. Best value for money.',
        descriptionHi: 'चारदीवारी और सामान्य निर्माण के लिए सस्ती और विश्वसनीय ईंटें। पैसे का सर्वोत्तम मूल्य।',
        tag: 'Affordable',
        tagClass: 'tag-affordable',
        inStock: true,
        specs: { size: '9" x 4" x 3"', strength: '900 PSI', water: '<20%' }
    },
    {
        id: 4,
        name: 'Machine Made Wirecut',
        nameHi: 'मशीन से बनी वायरकट',
        category: 'machine-made',
        price: 9,
        oldPrice: 11,
        image: 'src/assets/images/redbrick1.jpg',
        description: 'Precision-cut bricks with perfect horizontal lines. Reduces mortar consumption by 20% due to uniform shape.',
        descriptionHi: 'सटीक क्षैतिज रेखाओं वाली वायरकट ईंटें। समान आकार के कारण मोर्टार की खपत को 20% तक कम करती हैं।',
        tag: 'High Strength',
        tagClass: 'tag-strength',
        inStock: true,
        specs: { size: '230 x 110 x 75mm', strength: '1400 PSI', water: '<14%' }
    },
    {
        id: 5,
        name: 'Shiv Eant Special Edition',
        nameHi: 'शिव ईंट स्पेशल एडिशन',
        category: 'shiv-eent',
        price: 11,
        oldPrice: 13,
        image: 'src/assets/images/redbrick1.jpg',
        description: 'Hand-picked selection of the most perfectly baked Shiv Eant bricks. Guaranteed quality for lifetime structures.',
        descriptionHi: 'सबसे अच्छी तरह पकी हुई शिव ईंटों का हाथ से चुना गया चयन। जीवन भर चलने वाली संरचनाओं के लिए गारंटीकृत गुणवत्ता।',
        tag: 'Best Seller',
        tagClass: 'tag-best-seller',
        inStock: true,
        specs: { size: '9" x 4.5" x 3"', strength: '1600 PSI', water: '<10%' }
    }
];

var CATEGORIES = [
    { id: 'all', name: 'All Products', nameHi: 'सभी उत्पाद' },
    { id: 'shiv-eent', name: 'Shiv Eant', nameHi: 'शिव ईंट' },
    { id: 'premium', name: 'Premium Bricks', nameHi: 'प्रीमियम ईंटें' },
    { id: 'standard', name: 'Standard Field', nameHi: 'स्टैंडर्ड फील्ड' },
    { id: 'machine-made', name: 'Machine Made', nameHi: 'मशीन निर्मित' }
];
