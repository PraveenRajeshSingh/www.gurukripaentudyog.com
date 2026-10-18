/**
 * Gurukripa Bricks Industry — Unified TypeScript Domain Definitions & Data Contracts
 * Platform: Web · Android · iOS
 */

export type ProductId = number;
export type ProductCategory = 'shiv-eent' | 'awwal' | 'laal-peti' | 'premium' | 'standard' | 'machine-made';
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
export type PaymentMethod = 'upi' | 'card' | 'cod';
export type OrderStatus = 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type SupportedLanguage = 'en' | 'hi';
export type ThemeMode = 'light' | 'dark' | 'system';

/** Domain Entity: Brick Product */
export interface Product {
    id: ProductId;
    name: string;
    category: ProductCategory | string;
    price: number;
    oldPrice: number | null;
    unit: string;
    desc: string;
    rating: number;
    reviews: number;
    badge: string | null;
    badgeClass: string;
    stock: StockStatus | string;
    stockText: string;
    img: string;
    features: string[];
}

/** Domain Entity: Active Cart Item */
export interface CartItem extends Product {
    qty: number;
}

/** Domain Entity: User Account */
export interface User {
    name: string;
    email: string;
    mobile: string;
    address?: string;
    city?: string;
    gstin?: string;
}

/** Domain Entity: Order Record */
export interface Order {
    id: string;
    date: string;
    itemsCount: number;
    total: number;
    status: OrderStatus;
    items?: CartItem[];
}

/** Domain Entity: Coupon Configuration */
export interface Coupon {
    pct?: number;
    flat?: number;
    label: string;
}

/** Domain Entity: Kiln Supply Partner / Vendor */
export interface Vendor {
    type: 'dealer' | 'energy' | 'logistics' | 'govt';
    name: string;
    location: string;
    desc: string;
    contact: string;
    since: string;
    icon: string;
}

/** Brick Estimation Results */
export interface EstimatorWallResult {
    bricksNeeded: number;
    trolleys: number;
    cementBags: number;
    sandCuFt: number;
    totalCost: number;
}

export interface EstimatorHouseResult {
    totalBricks: number;
    trolleyLoad: number;
    cementBags: number;
    sandCuFt: number;
    totalCost: number;
}

export interface EstimatorBoundaryResult {
    bricksNeeded: number;
    trolleyCount: number;
    totalCost: number;
}

/** Cross-Platform Native Adapter Interface */
export interface PlatformAdapter {
    init(): void;
    isNative(): boolean;
    getPlatform(): 'web' | 'android' | 'ios' | string;
    share(data: { title?: string; text?: string; url?: string }): Promise<boolean>;
    openExternal(url: string): Promise<void>;
    haptic(type?: 'light' | 'success' | 'warning'): void;
    setTheme(theme: ThemeMode): void;
    toggleTheme(): void;
    syncStatusBar(theme?: string): Promise<void>;
}
