import { Injectable } from '@nestjs/common';
import { PricingEngineService } from '../pricing/pricing.service';

@Injectable()
export class MockDatabaseService {
  private tenants = [
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

  private products = [
    // Tenant 1: Gurukripa
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
    // Tenant 2: Awadh (Completely isolated)
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

  private orders: any[] = [];
  private syncJournal: any[] = [];
  private auditLogs: any[] = [];

  constructor(private readonly pricingEngine: PricingEngineService) {}

  getTenantBySlug(slug: string) {
    return this.tenants.find((t) => t.slug === slug || t.id === slug);
  }

  getProductsForTenant(tenantId: string) {
    return this.products.filter((p) => p.tenantId === tenantId && p.isActive);
  }

  getProductById(tenantId: string, productId: string) {
    return this.products.find((p) => p.tenantId === tenantId && p.id === productId);
  }

  createOrder(tenantId: string, orderData: any) {
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const gstCalc = this.pricingEngine.calculateGstFromInclusiveTotal(orderData.subtotal);

    const newOrder = {
      id: orderId,
      tenantId,
      orderNumber: `INV-${Date.now()}`,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      deliveryCity: orderData.deliveryCity || 'Jaunpur',
      items: orderData.items,
      subtotal: orderData.subtotal,
      cgst: gstCalc.cgst,
      sgst: gstCalc.sgst,
      totalAmount: gstCalc.grandTotal,
      status: 'CONFIRMED',
      paymentMethod: orderData.paymentMethod || 'COD',
      createdAt: new Date().toISOString(),
    };

    this.orders.push(newOrder);
    this.auditLogs.push({
      tenantId,
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: orderId,
      timestamp: new Date().toISOString(),
    });

    return newOrder;
  }

  getOrdersForTenant(tenantId: string) {
    return this.orders.filter((o) => o.tenantId === tenantId);
  }

  recordSyncBatch(tenantId: string, deviceId: string, userId: string, entries: any[]) {
    const applied: any[] = [];
    for (const entry of entries) {
      const journalItem = {
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
      this.syncJournal.push(journalItem);
      applied.push(journalItem);
    }
    return { success: true, count: applied.length, applied };
  }
}
