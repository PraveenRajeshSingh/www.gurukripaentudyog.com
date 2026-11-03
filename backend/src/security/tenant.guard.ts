import 'reflect-metadata';
import { Injectable, ExecutionContext, CanActivate, UnauthorizedException, ForbiddenException, SetMetadata, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser, UserRole } from '../types/domain';

// Request extension interface
// `Request` is imported from 'express' rather than using the global
// `Express.Request` namespace, so the type resolves from the installed
// @types/express package instead of relying on an ambient declaration.
export interface MultiTenantRequest extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}

/**
 * Decorator to easily extract current verified tenantId from authenticated request.
 * Server-side guaranteed; client cannot spoof this header/param.
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<MultiTenantRequest>();
    if (!request.user?.tenantId && !request.tenantId) {
      throw new UnauthorizedException('Tenant context is missing or unauthenticated');
    }
    return request.user?.tenantId || request.tenantId!;
  },
);

/**
 * Decorator to extract authenticated user profile
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<MultiTenantRequest>();
    if (!request.user) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return request.user;
  },
);

/**
 * Tenant Isolation Guard:
 * Ensures every incoming authenticated API request has a valid tenant binding
 * and verifies that any URL path tenant_id matches the authenticated JWT tenant claim.
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<MultiTenantRequest>();
    const user = request.user;

    // Super Admin can switch or inspect tenants if authorized
    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Unauthenticated: Missing tenant authorization token');
    }

    // If client supplied tenantId in params or body, strictly assert it matches user.tenantId
    const requestedTenantId = (request as any).params?.tenantId || (request as any).body?.tenantId;
    if (requestedTenantId && requestedTenantId !== user.tenantId) {
      throw new ForbiddenException(
        `Cross-Tenant Access Violation: You do not have permission to access tenant ${requestedTenantId}`
      );
    }

    request.tenantId = user.tenantId;
    return true;
  }
}

/**
 * Roles metadata marker; enforcement lives in RolesGuard (platform/guards.ts)
 * so role checks run on the server before the handler executes.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('jwt:roles', roles);
