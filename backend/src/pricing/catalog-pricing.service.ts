import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MockDatabaseService } from '../database/mock-db.service';
import { PlatformStoreService } from '../platform/store.service';
import { AuthenticatedUser } from '../types/domain';
import { ADMIN_ROLES, MANAGER_ROLES } from '../platform/types';
import { PricingEngineService } from './pricing.service';

export interface PriceUpdateInput {
  unitPrice: number;
  trolleyRate?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  bulkPrice?: number;
  gstRate?: number;
  minOrderQty?: number;
  stockQty?: number;
  reason?: string;
  effectiveAt?: string;
  /** ISO timestamp — if in the future, schedule instead of applying now */
  scheduleAt?: string;
}

export interface CartLineInput {
  productId: string;
  quantity: number;
  clientUnitPrice?: number;
}

export interface PriceHistoryRow {
  id: string;
  tenantId: string;
  productId: string;
  previousUnitPrice: number | null;
  newUnitPrice: number;
  previousTrolleyRate: number | null;
  newTrolleyRate: number | null;
  wholesalePrice?: number | null;
  retailPrice?: number | null;
  bulkPrice?: number | null;
  gstRate: number;
  reason?: string;
  effectiveAt: string;
  actorId: string;
  actorRole: string;
  createdAt: string;
}

@Injectable()
export class CatalogPricingService {
  private history: PriceHistoryRow[] = [];
  private schedules: Array<PriceUpdateInput & {
    id: string;
    tenantId: string;
    productId: string;
    status: 'PENDING' | 'ACTIVATED' | 'CANCELLED';
    actorId: string;
    createdAt: string;
    activateAt: string;
    activatedAt?: string;
  }> = [];

  constructor(
    private readonly db: MockDatabaseService,
    private readonly store: PlatformStoreService,
    private readonly pricing: PricingEngineService,
  ) {}

  listCatalog(tenantId: string) {
    return this.db.getProductsForTenant(tenantId).map((p) => this.publicProduct(p));
  }

  getProduct(tenantId: string, productId: string) {
    const p = this.db.getProductById(tenantId, productId);
    if (!p) throw new NotFoundException('Product not found');
    return this.publicProduct(p);
  }

  listHistory(tenantId: string, productId?: string, limit = 100) {
    return this.history
      .filter((h) => h.tenantId === tenantId && (!productId || h.productId === productId))
      .slice(-limit)
      .reverse();
  }

  async updatePrice(actor: AuthenticatedUser, productId: string, input: PriceUpdateInput) {
    this.assertPriceManager(actor);
    if (input.unitPrice == null || Number(input.unitPrice) < 0) {
      throw new BadRequestException('unitPrice must be a non-negative number');
    }

    if (input.scheduleAt && new Date(input.scheduleAt).getTime() > Date.now() + 1000) {
      return this.schedulePrice(actor, productId, input);
    }

    const product: any = this.db.getProductById(actor.tenantId, productId);
    if (!product) throw new NotFoundException('Product not found');

    const previousUnitPrice = Number(product.unitPrice);
    const previousTrolleyRate = product.trolleyRate != null ? Number(product.trolleyRate) : null;
    const updated: any = this.db.updateProductPrice(actor.tenantId, productId, {
      unitPrice: Number(input.unitPrice),
      oldPrice: previousUnitPrice,
      trolleyRate: input.trolleyRate != null ? Number(input.trolleyRate) : product.trolleyRate,
      wholesalePrice: input.wholesalePrice != null ? Number(input.wholesalePrice) : product.wholesalePrice,
      retailPrice: input.retailPrice != null ? Number(input.retailPrice) : product.retailPrice,
      bulkPrice: input.bulkPrice != null ? Number(input.bulkPrice) : product.bulkPrice,
      gstRate: input.gstRate != null ? Number(input.gstRate) : product.gstRate ?? 5,
      minOrderQty: input.minOrderQty != null ? Number(input.minOrderQty) : product.minOrderQty,
      stockQty: input.stockQty != null ? Number(input.stockQty) : product.stockQty,
      priceUpdatedAt: new Date().toISOString(),
      priceUpdatedBy: actor.id,
    });

    const row: PriceHistoryRow = {
      id: `ph-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      tenantId: actor.tenantId,
      productId,
      previousUnitPrice,
      newUnitPrice: Number(input.unitPrice),
      previousTrolleyRate,
      newTrolleyRate: updated.trolleyRate != null ? Number(updated.trolleyRate) : null,
      wholesalePrice: updated.wholesalePrice ?? null,
      retailPrice: updated.retailPrice ?? null,
      bulkPrice: updated.bulkPrice ?? null,
      gstRate: Number(updated.gstRate ?? 5),
      reason: input.reason || 'Daily price update',
      effectiveAt: input.effectiveAt || new Date().toISOString(),
      actorId: actor.id,
      actorRole: actor.role,
      createdAt: new Date().toISOString(),
    };
    this.history.push(row);
    await this.store.audit(actor as any, 'PRODUCT_PRICE_CHANGED', 'PRODUCT', productId, {
      previousUnitPrice,
      newUnitPrice: row.newUnitPrice,
      reason: row.reason,
    });

    return { product: this.publicProduct(updated), history: row };
  }

  schedulePrice(actor: AuthenticatedUser, productId: string, input: PriceUpdateInput) {
    this.assertPriceManager(actor);
    const product = this.db.getProductById(actor.tenantId, productId);
    if (!product) throw new NotFoundException('Product not found');
    const entry = {
      id: `ps-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      tenantId: actor.tenantId,
      productId,
      unitPrice: Number(input.unitPrice),
      trolleyRate: input.trolleyRate,
      wholesalePrice: input.wholesalePrice,
      retailPrice: input.retailPrice,
      bulkPrice: input.bulkPrice,
      gstRate: input.gstRate,
      minOrderQty: input.minOrderQty,
      stockQty: input.stockQty,
      reason: input.reason || 'Scheduled price change',
      status: 'PENDING' as const,
      actorId: actor.id,
      createdAt: new Date().toISOString(),
      activateAt: input.scheduleAt!,
    };
    this.schedules.push(entry);
    return { scheduled: true, data: entry };
  }

  async activateDueSchedules(tenantId?: string) {
    const now = Date.now();
    const due = this.schedules.filter(
      (s) =>
        s.status === 'PENDING' &&
        (!tenantId || s.tenantId === tenantId) &&
        new Date(s.activateAt).getTime() <= now,
    );
    const activated = [];
    for (const s of due) {
      const actor = {
        id: s.actorId,
        role: 'ADMIN',
        tenantId: s.tenantId,
        name: 'Scheduler',
        phone: '',
      } as AuthenticatedUser;
      const result = await this.updatePrice(actor, s.productId, {
        unitPrice: s.unitPrice,
        trolleyRate: s.trolleyRate,
        wholesalePrice: s.wholesalePrice,
        retailPrice: s.retailPrice,
        bulkPrice: s.bulkPrice,
        gstRate: s.gstRate,
        minOrderQty: s.minOrderQty,
        stockQty: s.stockQty,
        reason: s.reason,
        effectiveAt: s.activateAt,
      });
      s.status = 'ACTIVATED';
      s.activatedAt = new Date().toISOString();
      activated.push(result);
    }
    return { activated: activated.length, items: activated };
  }

  /**
   * Server-side cart revalidation — never trust client unit prices or totals.
   */
  validateCart(tenantId: string, lines: CartLineInput[]) {
    if (!Array.isArray(lines) || !lines.length) {
      throw new BadRequestException('Cart lines are required');
    }
    const results = lines.map((line) => {
      const product: any = this.db.getProductById(tenantId, line.productId);
      if (!product || !product.isActive) {
        return {
          productId: line.productId,
          ok: false,
          code: 'UNAVAILABLE',
          message: 'Product unavailable',
        };
      }
      const qty = Math.max(0, Number(line.quantity) || 0);
      const minQty = Number(product.minOrderQty || 1);
      if (qty < minQty) {
        return {
          productId: line.productId,
          ok: false,
          code: 'MIN_QTY',
          message: `Minimum order quantity is ${minQty}`,
          currentUnitPrice: Number(product.unitPrice),
          minOrderQty: minQty,
        };
      }
      if (product.stockQty != null && qty > Number(product.stockQty)) {
        return {
          productId: line.productId,
          ok: false,
          code: 'STOCK',
          message: 'Requested quantity exceeds available stock',
          stockQty: Number(product.stockQty),
          currentUnitPrice: Number(product.unitPrice),
        };
      }
      const current = Number(product.unitPrice);
      const client = line.clientUnitPrice != null ? Number(line.clientUnitPrice) : null;
      const priceChanged = client != null && Math.abs(client - current) > 0.001;
      return {
        productId: line.productId,
        ok: true,
        name: product.name,
        quantity: qty,
        currentUnitPrice: current,
        previousClientUnitPrice: client,
        priceChanged,
        lineTotal: Math.round(current * qty * 100) / 100,
        gstRate: Number(product.gstRate ?? 5),
        trolleyRate: product.trolleyRate != null ? Number(product.trolleyRate) : null,
        minOrderQty: minQty,
        stockQty: product.stockQty != null ? Number(product.stockQty) : null,
      };
    });

    const ok = results.every((r) => r.ok);
    const anyPriceChange = results.some((r: any) => r.priceChanged);
    const subtotal = results.reduce((s: number, r: any) => s + (r.lineTotal || 0), 0);
    const gst = this.pricing.calculateGstFromInclusiveTotal(Math.round(subtotal));

    return {
      ok,
      requiresCustomerConfirmation: anyPriceChange,
      lines: results,
      subtotal: Math.round(subtotal * 100) / 100,
      gst,
      payableTotal: gst.grandTotal,
      validatedAt: new Date().toISOString(),
    };
  }

  private assertPriceManager(actor: AuthenticatedUser) {
    const allowed = new Set<string>([...ADMIN_ROLES, ...MANAGER_ROLES, 'SALES_MANAGER']);
    // PRICE_MANAGER alias maps to SALES_MANAGER / ADMIN in JWT enum today.
    if (!allowed.has(actor.role) && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient role to change product prices');
    }
  }

  private publicProduct(p: any) {
    return {
      id: p.id,
      tenantId: p.tenantId,
      sku: p.sku,
      name: p.name,
      category: p.category,
      unitPrice: Number(p.unitPrice),
      oldPrice: p.oldPrice != null ? Number(p.oldPrice) : null,
      trolleyCapacity: p.trolleyCapacity ?? 4000,
      trolleyRate: p.trolleyRate != null ? Number(p.trolleyRate) : null,
      wholesalePrice: p.wholesalePrice != null ? Number(p.wholesalePrice) : null,
      retailPrice: p.retailPrice != null ? Number(p.retailPrice) : Number(p.unitPrice),
      bulkPrice: p.bulkPrice != null ? Number(p.bulkPrice) : null,
      gstRate: Number(p.gstRate ?? 5),
      minOrderQty: Number(p.minOrderQty ?? 1),
      stockQty: p.stockQty != null ? Number(p.stockQty) : null,
      supplierName: p.supplierName || null,
      logoUrl: p.logoUrl || null,
      description: p.description,
      features: p.features || [],
      imageUrl: p.imageUrl || null,
      isActive: !!p.isActive,
      priceUpdatedAt: p.priceUpdatedAt || null,
      priceUpdatedBy: p.priceUpdatedBy || null,
    };
  }
}
