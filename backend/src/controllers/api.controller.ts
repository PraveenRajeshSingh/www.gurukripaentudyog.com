import { Controller, Get, Post, Body, Param, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PricingEngineService } from '../pricing/pricing.service';
import { MockDatabaseService } from '../database/mock-db.service';
import { CurrentTenant, MultiTenantRequest, TenantIsolationGuard } from '../security/tenant.guard';
import { EstimationParams } from '../types/domain';

@Controller('api/v1')
export class ApiController {
  constructor(
    private readonly pricingEngine: PricingEngineService,
    private readonly db: MockDatabaseService,
  ) {}

  // 1. Tenant White-Label Configuration Lookup (Public)
  @Get('tenants/:slug/branding')
  getTenantBranding(@Param('slug') slug: string) {
    const tenant = this.db.getTenantBySlug(slug);
    if (!tenant) {
      return { success: false, message: 'Tenant not found' };
    }
    return {
      success: true,
      data: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        legalName: tenant.legalName,
        gstin: tenant.gstin,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
      },
    };
  }

  // 2. Product Catalog (Isolated per tenant)
  @Get('tenants/:slug/products')
  getTenantProducts(@Param('slug') slug: string) {
    const tenant = this.db.getTenantBySlug(slug);
    if (!tenant) return { success: false, message: 'Tenant not found' };
    const products = this.db.getProductsForTenant(tenant.id);
    return { success: true, count: products.length, data: products };
  }

  // 3. Estimator Studio (Wall, House, Boundary calculations)
  @Post('calculator/estimate')
  calculateEstimate(@Body() params: EstimationParams) {
    const result = this.pricingEngine.calculateEstimation(params);
    return { success: true, data: result };
  }

  // 4. Order Checkout with automatic 5% GST computation
  @Post('orders')
  createOrder(@Body() body: any) {
    const tenantId = body.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID is required to place an order');
    }
    const order = this.db.createOrder(tenantId, body);
    return { success: true, message: 'Order created successfully', data: order };
  }

  // 5. Offline Sync Push Endpoint for Drivers & Warehouse Staff
  @Post('sync/push')
  syncOfflineData(@Body() body: { tenantId: string; deviceId: string; userId: string; entries: any[] }) {
    if (!body.tenantId || !body.deviceId) {
      throw new UnauthorizedException('Tenant ID and Device ID are mandatory for sync transactions');
    }
    const result = this.db.recordSyncBatch(body.tenantId, body.deviceId, body.userId, body.entries || []);
    return { success: true, message: 'Offline sync journal applied successfully', result };
  }
}
