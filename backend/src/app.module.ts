import { Module } from '@nestjs/common';
import { ApiController } from './controllers/api.controller';
import { PricingEngineService } from './pricing/pricing.service';
import { MockDatabaseService } from './database/mock-db.service';
import { TenantIsolationGuard } from './security/tenant.guard';

@Module({
  imports: [],
  controllers: [ApiController],
  providers: [PricingEngineService, MockDatabaseService, TenantIsolationGuard],
  exports: [PricingEngineService, MockDatabaseService],
})
export class AppModule {}
