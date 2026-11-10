import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ApiController } from './controllers/api.controller';
import { PricingEngineService } from './pricing/pricing.service';
import { CatalogPricingService } from './pricing/catalog-pricing.service';
import { PricingController } from './pricing/pricing.controller';
import { PaymentIdempotencyService } from './payments/payment-idempotency.service';
import { RazorpayService } from './payments/razorpay.service';
import { MockDatabaseService } from './database/mock-db.service';
import { TenantIsolationGuard } from './security/tenant.guard';
import { RecaptchaService } from './security/recaptcha.service';
import { PlatformStoreService } from './platform/store.service';
import { AuthService } from './platform/auth.service';
import { NotifyService } from './platform/notify.service';
import { WorkflowService } from './platform/workflow.service';
import { JwtAuthGuard, RolesGuard, RateLimitGuard } from './platform/guards';
import { AuthController, PublicController } from './platform/auth.controller';
import { MeController } from './platform/me.controller';
import { StaffController } from './platform/staff.controller';
import { HealthController } from './platform/health.controller';


// JWT secret must come from the environment in production. A per-process
// random secret is generated as a dev fallback (sessions then do not survive
// a restart, which is the safe failure mode).
const jwtSecret =
  process.env.JWT_SECRET ||
  (() => {
    console.warn('[auth] JWT_SECRET is not set - using a random per-process secret. Set JWT_SECRET before deploying!');
    return crypto.randomBytes(32).toString('hex');
  })();

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '12h' },
    }),
  ],
  controllers: [
    ApiController, AuthController, PublicController, MeController,
    StaffController, HealthController, PricingController,
  ],
  providers: [
    PricingEngineService, CatalogPricingService, PaymentIdempotencyService, RazorpayService,
    MockDatabaseService, TenantIsolationGuard, RecaptchaService,
    PlatformStoreService, AuthService, NotifyService, WorkflowService,
    JwtAuthGuard, RolesGuard, RateLimitGuard,
  ],
  exports: [
    PricingEngineService, CatalogPricingService, PaymentIdempotencyService, RazorpayService,
    MockDatabaseService, PlatformStoreService, WorkflowService, RecaptchaService,
  ],
})
export class AppModule {}
