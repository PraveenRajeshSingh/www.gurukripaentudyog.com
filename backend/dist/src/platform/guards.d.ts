import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../types/domain';
export declare const JWT_ROLES_KEY = "jwt:roles";
export declare const RATE_LIMIT_KEY = "platform:rateLimit";
export declare const RequireRoles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimit: (max: number, windowMs: number) => import("@nestjs/common").CustomDecorator<string>;
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwt;
    constructor(jwt: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export declare class RateLimitGuard implements CanActivate {
    private readonly reflector;
    private hits;
    canActivate(context: ExecutionContext): boolean;
    private reflectorCfg;
    constructor(reflector: Reflector);
}
export declare const Authenticated: (...roles: UserRole[]) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
