"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const postgres_service_1 = require("./postgres.service");
class DatabaseService {
    constructor(pricingEngine) {
        this.pricingEngine = pricingEngine;
        this.fallbackTenants = [
            {
                id: 'tenant-gurukripa-001',
                slug: 'gurukripa',
                name: 'Gurukripa Bricks Industry',
                legalName: 'Gurukripa Ent Udyog Pvt Ltd',
                gstin: '09AAACG7481M1Z2',
                phone: '+91 94150 12345',
                email: 'contact@gurukripaentudyog.com',
                address: 'Shahganj Road, Kheta Sarai',
                city: 'Jaunpur',
                state: 'Uttar Pradesh',
                pincode: '222139',
                primaryColor: '#C8460A',
                secondaryColor: '#2A2A2A',
                isActive: true,
            },
            {
                id: 'tenant-awadh-002',
                slug: 'awadh-bricks',
                name: 'Awadh Brick Kiln & Suppliers',
                legalName: 'Awadh Construction & Bhatta Ltd',
                gstin: '09AABCA9999M1Z5',
                phone: '+91 98390 11223',
                email: 'sales@awadhbricks.com',
                address: 'Varanasi Bypass Road',
                city: 'Varanasi',
                state: 'Uttar Pradesh',
                pincode: '221002',
                primaryColor: '#0284C7',
                secondaryColor: '#0F172A',
                isActive: true,
            },
        ];
        this.fallbackProducts = [
            {
                id: 'prod-001',
                tenantId: 'tenant-gurukripa-001',
                sku: 'GURU-AWWAL-01',
                name: 'Awwal Bricks (आव्वल ईंट)',
                category: 'awwal',
                unitPrice: 7.05,
                trolleyCapacity: 4000,
                trolleyRate: 28200,
                description: 'High-strength Awwal bricks for heavy load-bearing structural walls.',
                features: ['Double-fired', 'Uniform 230x110x70mm', 'IS:1077 compliant'],
                isActive: true,
            },
            {
                id: 'prod-002',
                tenantId: 'tenant-gurukripa-001',
                sku: 'GURU-LAAL-02',
                name: 'Laal Peti Bricks (लाल पेटी ईंट)',
                category: 'laal-peti',
                unitPrice: 6.25,
                trolleyCapacity: 4000,
                trolleyRate: 25000,
                description: 'All-purpose natural clay bricks for homes and boundary walls.',
                features: ['Natural clay', 'Affordable', '25,000 per trolley'],
                isActive: true,
            },
            {
                id: 'prod-003',
                tenantId: 'tenant-gurukripa-001',
                sku: 'GURU-SHIV-03',
                name: 'Shiv Eent Grade-A',
                category: 'shiv-eent',
                unitPrice: 12.00,
                trolleyCapacity: 4000,
                trolleyRate: 48000,
                description: 'Ultra-premium Grade-A brick with double-fired durability.',
                features: ['Double-fired process', 'Weather resistant'],
                isActive: true,
            },
            {
                id: 'prod-101',
                tenantId: 'tenant-awadh-002',
                sku: 'AWADH-STD-01',
                name: 'Awadh Standard Kiln Bricks',
                category: 'standard',
                unitPrice: 7.50,
                trolleyCapacity: 4000,
                trolleyRate: 30000,
                description: 'Awadh regional standard construction bricks.',
                features: ['Well fired', 'Batch certified'],
                isActive: true,
            },
        ];
        this.fallbackOrders = [];
        this.fallbackSyncJournal = [];
        this.fallbackAuditLogs = [];
        this.pg = postgres_service_1.PostgresService.getInstance();
    }
    async getTenantBySlug(slug) {
        try {
            const res = await this.pg.query('SELECT * FROM tenants WHERE slug = $1 OR id = $1 LIMIT 1', [slug]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                return {
                    id: row.id,
                    slug: row.slug,
                    name: row.name,
                    legalName: row.legal_name,
                    gstin: row.gstin,
                    phone: row.phone,
                    email: row.email,
                    address: row.address,
                    city: row.city,
                    state: row.state,
                    pincode: row.pincode,
                    logoUrl: row.logo_url || undefined,
                    primaryColor: row.primary_color,
                    secondaryColor: row.secondary_color,
                    isActive: row.is_active,
                };
            }
        }
        catch (_) {
        }
        return this.fallbackTenants.find((t) => t.slug === slug || t.id === slug);
    }
    async getProductsForTenant(tenantId) {
        try {
            const res = await this.pg.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true ORDER BY name ASC', [tenantId]);
            if (res.rows.length > 0) {
                return res.rows.map((row) => ({
                    id: row.id,
                    tenantId: row.tenant_id,
                    sku: row.sku,
                    name: row.name,
                    category: row.category,
                    unitPrice: Number(row.unit_price),
                    oldPrice: row.old_price ? Number(row.old_price) : null,
                    trolleyCapacity: row.trolley_capacity,
                    trolleyRate: Number(row.trolley_rate),
                    description: row.description,
                    features: row.features || [],
                    isActive: row.is_active,
                }));
            }
        }
        catch (_) {
        }
        return this.fallbackProducts.filter((p) => p.tenantId === tenantId && p.isActive);
    }
    async createOrder(tenantId, orderData) {
        const gstCalc = this.pricingEngine.calculateGstFromInclusiveTotal(orderData.subtotal);
        const orderNumber = `INV-${Date.now()}`;
        try {
            return await this.pg.transaction(async (client) => {
                const res = await client.query(`INSERT INTO orders (
            tenant_id, order_number, customer_name, customer_phone, delivery_address,
            delivery_city, subtotal, discount_amount, cgst, sgst, total_amount,
            status, payment_method
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`, [
                    tenantId,
                    orderNumber,
                    orderData.customerName,
                    orderData.customerPhone,
                    orderData.deliveryAddress,
                    orderData.deliveryCity || 'Jaunpur',
                    orderData.subtotal,
                    orderData.discountAmount || 0,
                    gstCalc.cgst,
                    gstCalc.sgst,
                    gstCalc.grandTotal,
                    'CONFIRMED',
                    orderData.paymentMethod || 'COD',
                ]);
                const order = res.rows[0];
                await client.query(`INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id)
           VALUES ($1, $2, $3, $4)`, [tenantId, 'ORDER_CREATED', 'ORDER', order.id]);
                return {
                    id: order.id,
                    tenantId: order.tenant_id,
                    orderNumber: order.order_number,
                    customerName: order.customer_name,
                    customerPhone: order.customer_phone,
                    deliveryAddress: order.delivery_address,
                    subtotal: Number(order.subtotal),
                    cgst: Number(order.cgst),
                    sgst: Number(order.sgst),
                    totalAmount: Number(order.total_amount),
                    status: order.status,
                    paymentMethod: order.payment_method,
                    createdAt: order.created_at,
                };
            });
        }
        catch (_) {
            const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const fallbackOrder = {
                id: orderId,
                tenantId,
                orderNumber,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                deliveryAddress: orderData.deliveryAddress,
                deliveryCity: orderData.deliveryCity || 'Jaunpur',
                subtotal: orderData.subtotal,
                cgst: gstCalc.cgst,
                sgst: gstCalc.sgst,
                totalAmount: gstCalc.grandTotal,
                status: 'CONFIRMED',
                paymentMethod: orderData.paymentMethod || 'COD',
                createdAt: new Date().toISOString(),
            };
            this.fallbackOrders.push(fallbackOrder);
            this.fallbackAuditLogs.push({
                tenantId,
                action: 'ORDER_CREATED',
                entityType: 'ORDER',
                entityId: orderId,
                timestamp: new Date().toISOString(),
            });
            return fallbackOrder;
        }
    }
    async getOrdersForTenant(tenantId) {
        try {
            const res = await this.pg.query('SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
            if (res.rows.length > 0) {
                return res.rows.map((r) => ({
                    id: r.id,
                    tenantId: r.tenant_id,
                    orderNumber: r.order_number,
                    customerName: r.customer_name,
                    customerPhone: r.customer_phone,
                    deliveryAddress: r.delivery_address,
                    subtotal: Number(r.subtotal),
                    cgst: Number(r.cgst),
                    sgst: Number(r.sgst),
                    totalAmount: Number(r.total_amount),
                    status: r.status,
                    createdAt: r.created_at,
                }));
            }
        }
        catch (_) {
        }
        return this.fallbackOrders.filter((o) => o.tenantId === tenantId);
    }
    async recordSyncBatch(tenantId, deviceId, userId, entries) {
        try {
            return await this.pg.transaction(async (client) => {
                const applied = [];
                for (const entry of entries) {
                    const res = await client.query(`INSERT INTO sync_journal (
              tenant_id, device_id, user_id, entity_name, operation,
              client_id, payload, client_timestamp, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (tenant_id, device_id, client_id) DO NOTHING
            RETURNING *`, [
                        tenantId,
                        deviceId,
                        userId || null,
                        entry.entityName,
                        entry.operation,
                        entry.clientId,
                        JSON.stringify(entry.payload),
                        entry.clientTimestamp || new Date().toISOString(),
                        'APPLIED',
                    ]);
                    if (res.rows.length > 0) {
                        applied.push(res.rows[0]);
                    }
                }
                return { success: true, count: applied.length, applied };
            });
        }
        catch (_) {
            const applied = [];
            for (const entry of entries) {
                const item = {
                    id: `sync-${Date.now()}-${Math.random()}`,
                    tenantId,
                    deviceId,
                    userId,
                    entityName: entry.entityName,
                    operation: entry.operation,
                    clientId: entry.clientId,
                    payload: entry.payload,
                    clientTimestamp: entry.clientTimestamp,
                    serverTimestamp: new Date().toISOString(),
                    status: 'APPLIED',
                };
                this.fallbackSyncJournal.push(item);
                applied.push(item);
            }
            return { success: true, count: applied.length, applied };
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map