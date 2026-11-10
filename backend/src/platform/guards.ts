// Server-side authentication & authorization for the platform APIs.
// Requirement F: authorization is enforced here on the backend — the app
// hiding buttons is a UX convenience, never a security boundary.
import {
  CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException,
  ForbiddenException, applyDecorators, UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AuthenticatedUser, UserRole } from '../types/domain';
import { MultiTenantRequest, TenantIsolationGuard } from '../security/tenant.guard';

export const JWT_ROLES_KEY = 'jwt:roles';
export const RATE_LIMIT_KEY = 'platform:rateLimit';

/** Restrict a route to the given roles (enforced by RolesGuard). */
export const RequireRoles = (...roles: UserRole[]) => SetMetadata(JWT_ROLES_KEY, roles);

/** Simple per-IP sliding-window rate limit metadata (enforced by RateLimitGuard). */
export const RateLimit = (max: number, windowMs: number) => SetMetadata(RATE_LIMIT_KEY, { max, windowMs });

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MultiTenantRequest>();
    // Authorization header only — never accept JWT from query strings (logs/referrers leak).
    const header = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    try {
      const payload = await this.jwt.verifyAsync<AuthenticatedUser>(header.slice(7));
      request.user = { id: payload.id, tenantId: payload.tenantId, name: payload.name, phone: payload.phone, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(JWT_ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const request = context.switchToHttp().getRequest<MultiTenantRequest>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Unauthenticated');
    // SUPER_ADMIN implicitly satisfies TENANT_ADMIN (Administrator) routes.
    const held = new Set<UserRole>([user.role]);
    if (user.role === 'SUPER_ADMIN') held.add('TENANT_ADMIN');
    if (!required.some((r) => held.has(r))) {
      throw new ForbiddenException(`Requires role: ${required.join(' | ')}`);
    }
    return true;
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private hits = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const cfg = this.reflectorCfg(context);
    if (!cfg) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const key = `${request.ip || 'unknown'}:${context.getHandler()?.name}`;
    const now = Date.now();
    const windowStart = now - cfg.windowMs;
    const recent = (this.hits.get(key) || []).filter((t) => t > windowStart);
    if (recent.length >= cfg.max) {
      throw new ForbiddenException('Too many requests — please slow down and retry shortly.');
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) {
      // Opportunistic eviction to bound memory.
      for (const [k, times] of this.hits) {
        if (!times.some((t) => t > windowStart)) this.hits.delete(k);
      }
    }
    return true;
  }

  private reflectorCfg(context: ExecutionContext): { max: number; windowMs: number } | undefined {
    return this.reflector.getAllAndOverride<number>(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]) as any;
  }

  constructor(private readonly reflector: Reflector) {}
}

/** Composed decorators used across platform controllers. */
export const Authenticated = (...roles: UserRole[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, TenantIsolationGuard, RolesGuard),
    ...(roles.length ? [RequireRoles(...roles)] : []),
  );
