'use strict';
// ══════════════════════════════════════════
// GURUKRIPA BRICKS SERVICES & REPOSITORY ARCHITECTURE
// Clean domain service abstractions for products, pricing, orders, and delivery
// ══════════════════════════════════════════

window.GurukripaServices = window.GurukripaServices || {};

(function(exports) {
    // 1. Product Service
    exports.ProductService = {
        getAll: function() {
            return (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
        },
        getById: function(id) {
            const list = this.getAll();
            return list.find(p => p.id === id) || null;
        },
        getByCategory: function(cat) {
            const list = this.getAll();
            if (!cat || cat === 'all') return list;
            return list.filter(p => p.category === cat);
        },
        search: function(query) {
            if (!query) return this.getAll();
            const q = query.toLowerCase().trim();
            return this.getAll().filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.desc.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.badge && p.badge.toLowerCase().includes(q))
            );
        }
    };

    // 2. Pricing & Trolley Calculation Service
    exports.PricingService = {
        getTrolleyRate: function(category) {
            const rates = {
                'awwal': 28200,
                'laal-peti': 25000
            };
            return rates[category] || null;
        },
        calculateLineTotal: function(price, qty) {
            return Math.max(0, (price || 0) * (qty || 0));
        },
        calculateCartSubtotal: function(cartItems) {
            if (!Array.isArray(cartItems)) return 0;
            return cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        },
        calculateGSTBreakdown: function(inclusiveTotal, ratePct = 5) {
            const base = Math.round(inclusiveTotal / (1 + (ratePct / 100)));
            const taxTotal = inclusiveTotal - base;
            const cgst = Math.round(taxTotal / 2);
            const sgst = taxTotal - cgst;
            return { base, cgst, sgst, taxTotal, total: inclusiveTotal };
        }
    };

    // 3. Order & Delivery Tracking Service
    exports.OrderService = {
        createOrder: function(orderPayload) {
            const orders = (typeof getSafeStorage === 'function') ? getSafeStorage('gb_orders', []) : [];
            const newOrder = {
                id: orderPayload.id || ('GBI-' + Date.now().toString().slice(-6)),
                date: new Date().toISOString(),
                status: 'Confirmed',
                statusStep: 1, // 0: Placed, 1: Confirmed, 2: Loading, 3: Dispatched, 4: Delivered
                items: orderPayload.items || [],
                total: orderPayload.total || 0,
                customer: orderPayload.customer || {},
                shipping: orderPayload.shipping || {},
                paymentMethod: orderPayload.paymentMethod || 'COD'
            };
            orders.unshift(newOrder);
            if (typeof setSafeStorage === 'function') {
                setSafeStorage('gb_orders', orders);
            }
            return newOrder;
        },
        getOrderById: function(orderId) {
            const orders = (typeof getSafeStorage === 'function') ? getSafeStorage('gb_orders', []) : [];
            return orders.find(o => o.id.toLowerCase() === (orderId || '').toLowerCase().trim()) || null;
        },
        getAllOrders: function() {
            return (typeof getSafeStorage === 'function') ? getSafeStorage('gb_orders', []) : [];
        }
    };
})(window.GurukripaServices);
