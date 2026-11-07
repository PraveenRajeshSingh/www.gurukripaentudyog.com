// Secure authentication (requirement F): bcrypt-hashed passwords, short-lived
// JWT sessions carrying role + tenant claims. The JWT secret comes from the
// environment only — never from the app bundle.
import {
  ConflictException, ForbiddenException, Injectable, OnModuleInit, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PlatformStoreService } from './store.service';
import { AuthenticatedUser, PlatformUser } from './types';
import { DealerRegisterDto, LoginDto, RegisterDto } from './dto';

const ROUNDS = 10;

export interface SessionPayload extends AuthenticatedUser {
  /** JWT subject — set by JwtService; kept explicit for typing at call sites. */
  sub?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly store: PlatformStoreService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Bootstrap administrator: created on first boot ONLY if
   * BOOTSTRAP_ADMIN_PHONE + BOOTSTRAP_ADMIN_PASSWORD are set and no ADMIN
   * exists yet. This avoids seeding guessable demo credentials into a real
   * deployment (requirement H: no fake data in production).
   */
  async onModuleInit(): Promise<void> {
    const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
    const pass = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!phone || !pass) return;
    const tenantId = PlatformStoreService.GURUKRIPA_TENANT_ID;
    if (this.store.users.some((u) => u.role === 'ADMIN' && u.tenantId === tenantId)) return;
    if (this.store.findUserByPhone(tenantId, phone)) return;
    await this.store.createUser({
      tenantId, role: 'ADMIN', name: 'Administrator', phone,
      passwordHash: await bcrypt.hash(pass, ROUNDS),
    });
    console.log('[auth] bootstrap administrator created from environment.');
  }

  private resolveTenantId(slug?: string): string {
    if (!slug || slug === 'gurukripa') return PlatformStoreService.GURUKRIPA_TENANT_ID;
    const tenant = this.mockTenantLookup(slug);
    if (!tenant) throw new ConflictException('Unknown business tenant');
    return tenant.id;
  }

  private mockTenantLookup(slug: string): any {
    // Reuse the SaaS tenant registry (gurukripa + demo tenants).
    return (this.store as any).mockDb?.getTenantBySlug?.(slug);
  }

  async register(dto: RegisterDto): Promise<{ user: AuthenticatedUser; token: string }> {
    const tenantId = this.resolveTenantId(dto.tenantSlug);
    if (this.store.findUserByPhone(tenantId, dto.phone)) {
      throw new ConflictException('An account already exists for this phone number');
    }
    const user = await this.store.createUser({
      tenantId, role: 'CUSTOMER', name: dto.name, phone: dto.phone,
      email: dto.email, language: dto.language,
      passwordHash: await bcrypt.hash(dto.password, ROUNDS),
    });
    return this.issueSession(user);
  }

  /**
   * Dealer sign-up lands in PENDING — an administrator must approve it before
   * any dealer-priced endpoint unlocks (requirement B.1).
   */
  async registerDealer(dto: DealerRegisterDto): Promise<{ user: AuthenticatedUser; token: string; dealerStatus: string }> {
    const tenantId = this.resolveTenantId(dto.tenantSlug);
    if (this.store.findUserByPhone(tenantId, dto.phone)) {
      throw new ConflictException('An account already exists for this phone number');
    }
    const user = await this.store.createUser({
      tenantId, role: 'DEALER', name: dto.name, phone: dto.phone, email: dto.email,
      language: dto.language, dealerStatus: 'PENDING',
      firmName: dto.firmName, gstin: dto.gstin, licenseNo: dto.licenseNo,
      dealerAddress: dto.dealerAddress, dealerCity: dto.dealerCity,
      passwordHash: await bcrypt.hash(dto.password, ROUNDS),
    });
    const session = this.issueSession(user);
    return { ...session, dealerStatus: 'PENDING' };
  }

  async login(dto: LoginDto): Promise<{ user: AuthenticatedUser; token: string }> {
    // Resolve tenant from optional slug only — never accept a raw tenantId from the client,
    // and never fall back to "any phone across all tenants" (cross-tenant session leak).
    const tenantId = this.resolveTenantId(dto.tenantSlug);
    // Platform login identifier is the 10-digit Indian mobile (Username in QA docs mirrors phone).
    const user = this.store.findUserByPhone(tenantId, dto.phone);
    if (!user) throw new UnauthorizedException('Invalid phone number or password');
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid phone number or password');
    }
    const status = user.accountStatus || 'ACTIVE';
    if (status === 'DISABLED' || status === 'SUSPENDED') {
      throw new ForbiddenException(`Account is ${status.toLowerCase()}. Contact the administrator.`);
    }
    if (user.role === 'DEALER' && user.dealerStatus === 'REJECTED') {
      throw new ForbiddenException('Dealer application was rejected. Contact the branch office.');
    }
    return this.issueSession(user);
  }

  private issueSession(user: PlatformUser): { user: AuthenticatedUser; token: string } {
    const claims: SessionPayload = {
      id: user.id, sub: user.id, tenantId: user.tenantId,
      name: user.name, phone: user.phone, email: user.email, role: user.role,
    };
    const token = this.jwt.sign(claims);
    return { user: { id: user.id, tenantId: user.tenantId, name: user.name, phone: user.phone, email: user.email, role: user.role }, token };
  }

  /** Guard helper: reload the account so role/dealerStatus changes apply mid-session. */
  freshUser(userId: string): PlatformUser | undefined {
    return this.store.findUserById(userId);
  }

  assertDealerApproved(user: AuthenticatedUser): PlatformUser {
    const fresh = this.freshUser(user.id);
    if (!fresh) throw new UnauthorizedException('Account no longer exists');
    if (fresh.role !== 'DEALER' || fresh.dealerStatus !== 'APPROVED') {
      throw new ForbiddenException('Dealer account pending administrator approval');
    }
    return fresh;
  }
}
