import { Controller, Get } from '@nestjs/common';

/**
 * Lightweight liveness/readiness probes for load balancers and CI smoke checks.
 * Does not expose secrets, DB credentials, or internal hostnames.
 */
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'brick-saas-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/v1/health')
  apiHealth() {
    return this.health();
  }
}
