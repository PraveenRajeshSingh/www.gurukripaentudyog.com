import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PricingEngineService } from '../pricing/pricing.service';
import { MockDatabaseService } from '../database/mock-db.service';
import { CurrentTenant, CurrentUser, TenantIsolationGuard } from '../security/tenant.guard';
import { AuthenticatedUser, EstimationParams } from '../types/domain';
import { JwtAuthGuard } from '../platform/guards';

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

  // 4. Legacy mock checkout — JWT tenant is authoritative (body.tenantId cannot spoof).
  // Prefer /api/v1/me + quotation workflow for production orders.
  @Post('orders')
  @UseGuards(JwtAuthGuard, TenantIsolationGuard)
  createOrder(@CurrentTenant() tenantId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    const order = this.db.createOrder(tenantId, {
      ...body,
      tenantId,
      customerName: body.customerName || user.name,
      customerPhone: body.customerPhone || user.phone,
      userId: user.id,
    });
    return { success: true, message: 'Order created successfully', data: order };
  }

  // 5. Offline sync — authenticated; tenant and user come from JWT, not the body.
  @Post('sync/push')
  @UseGuards(JwtAuthGuard, TenantIsolationGuard)
  syncOfflineData(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { deviceId: string; entries?: any[]; tenantId?: string; userId?: string },
  ) {
    if (!body.deviceId) {
      return { success: false, message: 'deviceId is required for sync transactions' };
    }
    const result = this.db.recordSyncBatch(tenantId, body.deviceId, user.id, body.entries || []);
    return { success: true, message: 'Offline sync journal applied successfully', result };
  }
}
