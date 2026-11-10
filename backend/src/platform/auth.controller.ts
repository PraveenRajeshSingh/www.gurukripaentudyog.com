// Public authentication + public read endpoints.
import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { PlatformStoreService } from './store.service';
import { WorkflowService } from './workflow.service';
import { Authenticated, RateLimitGuard, RateLimit } from './guards';
import { CurrentUser } from '../security/tenant.guard';
import { AuthenticatedUser } from '../types/domain';
import { DealerRegisterDto, LoginDto, RegisterDto, CreateEnquiryDto } from './dto';
import { RecaptchaService } from '../security/recaptcha.service';

const TENANT = PlatformStoreService.GURUKRIPA_TENANT_ID;

@Controller('api/v1/auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  @Post('register')
  @RateLimit(8, 60_000)
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    await this.recaptcha.verifyOrThrow(dto.captchaToken, 'register', req.ip);
    return this.auth.register(dto);
  }

  @Post('dealer-register')
  @RateLimit(5, 60_000)
  async registerDealer(@Body() dto: DealerRegisterDto, @Req() req: Request) {
    await this.recaptcha.verifyOrThrow(dto.captchaToken, 'register', req.ip);
    return this.auth.registerDealer(dto);
  }

  @Post('login')
  @RateLimit(10, 60_000)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    await this.recaptcha.verifyOrThrow(dto.captchaToken, 'login', req.ip);
    return this.auth.login(dto);
  }

  @Get('me')
  @Authenticated()
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user, account: this.auth.freshUser(user.id) ? { ...this.auth.freshUser(user.id), passwordHash: undefined } : null };
  }
}

/**
 * Catalogue/FAQ/announcement reads that the app needs before login, plus the
 * guest enquiry path (leads - still stored server-side, never localStorage).
 */
@Controller('api/v1/public')
@UseGuards(RateLimitGuard)
export class PublicController {
  constructor(
    private readonly store: PlatformStoreService,
    private readonly workflow: WorkflowService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  @Get('products')
  products() {
    return { success: true, count: this.store.productsOf(TENANT).length, data: this.store.productsOf(TENANT) };
  }

  @Get('products/categories')
  categories() {
    const cats = Array.from(new Set(this.store.productsOf(TENANT).map((p: any) => p.category)));
    return { success: true, data: cats };
  }

  @Get('announcements')
  announcements() {
    return { success: true, data: this.store.listAnnouncements(TENANT, true) };
  }

  @Post('enquiries')
  @RateLimit(6, 60_000)
  async guestEnquiry(@Body() dto: CreateEnquiryDto, @Req() req: Request) {
    if (!dto.contactPhone || !dto.contactName) {
      // Guest enquiries must carry contact details to be actionable.
      throw new BadRequestException('contactName and contactPhone are required for guest enquiries');
    }
    await this.recaptcha.verifyOrThrow(dto.captchaToken, 'enquiry', req.ip);
    const enq = await this.store.createEnquiry({
      tenantId: TENANT, userId: undefined,
      contactName: dto.contactName, contactPhone: dto.contactPhone,
      siteLocation: dto.siteLocation, notes: dto.notes,
      lines: dto.lines, attachments: dto.attachments || [],
    });
    await this.store.audit({ id: 'guest', role: 'CUSTOMER' } as any, 'ENQUIRY_CREATED', 'ENQUIRY', enq.id, { guest: true });
    return { success: true, data: enq };
  }
}
