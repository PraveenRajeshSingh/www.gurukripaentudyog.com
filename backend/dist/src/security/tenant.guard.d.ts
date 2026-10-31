import 'reflect-metadata';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser, UserRole } from '../types/domain';
export interface MultiTenantRequest extends Request {
    user?: AuthenticatedUser;
    tenantId?: string;
}
export declare const CurrentTenant: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare class TenantIsolationGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
export declare const Roles: (...roles: UserRole[]) => (target: any, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => any;
