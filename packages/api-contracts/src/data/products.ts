export interface Product {
  id: number;
  name: string;
  nameHi?: string;
  category: string;
  price: number;
  oldPrice: number | null;
  unit: string;
  desc: string;
  rating: number;
  reviews: number;
  badge: string | null;
  badgeClass?: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  stockText: string;
  img: string;
  features: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Shiv Eent Grade-A',
    category: 'shiv-eent',
    price: 12,
    oldPrice: 14,
    unit: 'per piece',
    desc: 'Ultra-premium Grade-A brick with double-fired durability. Best for load-bearing walls.',
    rating: 5,
    reviews: 89,
    badge: 'Best Seller',
    badgeClass: '',
    stock: 'in-stock',
    stockText: 'In Stock (10k+)',
    img: '/images/brick_product_3.png',
    features: ['Double-fired process', 'Weather resistant', 'Uniform 230×110×70mm', 'ISI certified']
  },
  {
    id: 7,
    name: 'Awwal Bricks (आव्वल ईंट)',
    nameHi: 'आव्वल ईंट',
    category: 'awwal',
    price: 7.05,
    oldPrice: null,
    unit: 'per piece',
    desc: 'High-quality Awwal bricks known for strength and durability. Ideal for heavy-duty construction — large buildings, factories and load-bearing walls. ₹28,200 per trolley of 4,000 bricks.',
    rating: 4.9,
    reviews: 78,
    badge: 'Heavy Duty',
    badgeClass: '',
    stock: 'in-stock',
    stockText: 'In Stock',
    img: '/images/brick_product_1.png',
    features: ['Strong & durable', 'Heavy structure ready', 'Long-lasting performance', '₹28,200 per trolley (4,000 bricks)']
  },
  {
    id: 8,
    name: 'Laal Peti Bricks (लाल पेटी ईंट)',
    nameHi: 'लाल पेटी ईंट',
    category: 'laal-peti',
    price: 6.25,
    oldPrice: null,
    unit: 'per piece',
    desc: 'Commonly used for general construction — homes, boundary walls and commercial buildings. Made using natural clay at an affordable price. ₹25,000 per trolley of 4,000 bricks.',
    rating: 4.5,
    reviews: 134,
    badge: 'Popular',
    badgeClass: 'amber',
    stock: 'in-stock',
    stockText: 'In Stock',
    img: '/images/brick_product_2.png',
    features: ['Affordable & widely available', 'Natural clay construction', 'Suitable for most projects', '₹25,000 per trolley (4,000 bricks)']
  },
  {
    id: 2,
    name: 'Premium Red Bricks',
    category: 'premium',
    price: 10,
    oldPrice: null,
    unit: 'per piece',
    desc: 'Premium quality red clay bricks with high compressive strength, ideal for structural walls.',
    rating: 4.8,
    reviews: 64,
    badge: 'Popular',
    badgeClass: 'amber',
    stock: 'in-stock',
    stockText: 'In Stock',
    img: '/images/brick_product_2.png',
    features: ['High compressive strength', 'Excellent thermal insulation', 'Smooth finish', 'Bulk discounts available']
  },
  {
    id: 3,
    name: 'Standard Bricks',
    category: 'standard',
    price: 8,
    oldPrice: null,
    unit: 'per piece',
    desc: 'Reliable standard bricks for everyday construction. Best value for residential projects.',
    rating: 4.5,
    reviews: 112,
    badge: 'Value Pick',
    badgeClass: 'amber',
    stock: 'in-stock',
    stockText: 'In Stock',
    img: '/images/redbrick1.jpg',
    features: ['Cost-effective', 'Well-burnt clay', 'Standard dimensions', 'Suitable for all walls']
  },
  {
    id: 4,
    name: 'Machine Made Wirecut',
    category: 'machine-made',
    price: 11,
    oldPrice: 13,
    unit: 'per piece',
    desc: 'Precision machine-made wirecut bricks with perfect uniform size for modern construction.',
    rating: 4.9,
    reviews: 43,
    badge: 'New',
    badgeClass: '',
    stock: 'low-stock',
    stockText: 'Limited Stock',
    img: '/images/brick_product_1.png',
    features: ['Machine precision', 'Zero size variation', 'Sharp edges', 'Perfect for exposed brickwork']
  },
  {
    id: 5,
    name: 'First Class Red Bricks',
    category: 'premium',
    price: 10,
    oldPrice: null,
    unit: 'per piece',
    desc: 'First-class quality bricks that pass all IS standards for residential and commercial use.',
    rating: 4.7,
    reviews: 55,
    badge: null,
    badgeClass: '',
    stock: 'in-stock',
    stockText: 'In Stock',
    img: '/images/brick_product_3.png',
    features: ['IS standard compliant', 'Heavy-duty strength', 'Consistent color', 'Large project ready']
  },
  {
    id: 6,
    name: 'Standard Hollow Bricks',
    category: 'standard',
    price: 9,
    oldPrice: null,
    unit: 'per piece',
    desc: 'Lightweight hollow bricks for partition walls, offering better thermal and sound insulation.',
    rating: 4.4,
    reviews: 38,
    badge: null,
    badgeClass: '',
    stock: 'in-stock',
    stockText: 'In Stock',
    img: '/images/brick_product_2.png',
    features: ['Lightweight design', 'Better insulation', 'Easy to handle', 'Faster construction']
  }
];
