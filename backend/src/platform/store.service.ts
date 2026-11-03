import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostgresService } from '../database/postgres.service';
import { MockDatabaseService } from '../database/mock-db.service';
import {
  Announcement, AuditLog, DeviceToken, EnquiryStatus,
  PlatformEnquiry, PlatformOrder, PlatformQuotation, PlatformUser,
  QuotationStatus, SavedSite, StatusEvent, UserAddress, UserNotification,
} from './types';

/**
 * PlatformStoreService
 *
 * Single repository for the customer/dealer/admin platform entities.
 * In-memory is the authoritative store (works with zero infrastructure — the
 * same dual-mode pattern used by MockDatabaseService). When PostgreSQL is
 * reachable, every write is mirrored best-effort and collections are hydrated
 * at boot, so a deployed backend with DATABASE_URL persists across restarts.
 */
@Injectable()
export class PlatformStoreService implements OnModuleInit {
  private pg = PostgresService.getInstance();
  private dbReady = false;

  users: PlatformUser[] = [];
  addresses: UserAddress[] = [];
  enquiries: PlatformEnquiry[] = [];
  quotations: PlatformQuotation[] = [];
  orders: PlatformOrder[] = [];
  events: StatusEvent[] = [];
  deviceTokens: DeviceToken[] = [];
  notifications: UserNotification[] = [];
  announcements: Announcement[] = [];
  savedSites: SavedSite[] = [];
  auditLogs: AuditLog[] = [];

  static readonly GURUKRIPA_TENANT_ID = 'tenant-gurukripa-001';

  constructor(private readonly mockDb: MockDatabaseService) {}

  newId(prefix: string): string {
    return `${prefix}-${randomUUID().slice(0, 12)}`;
  }

  now(): string {
    return new Date().toISOString();
  }

  // ------------------------------------------------------------------ boot
  async onModuleInit(): Promise<void> {
    const conn = await this.pg.testConnection();
    this.dbReady = conn.ok;
    if (!this.dbReady) {
      console.log('[platform] PostgreSQL not reachable - running in-memory store (dev mode).');
      return;
    }
    try {
      await this.runMigrationsIfPresent();
      await this.hydrate();
      console.log('[platform] hydrated platform collections from PostgreSQL.');
    } catch (err: any) {
      console.warn('[platform] hydration failed, continuing in-memory:', err.message);
      this.dbReady = false;
    }
  }

  private async runMigrationsIfPresent(): Promise<void> {
    // The standalone migrator is run via `npm run migrate`; nothing to do here.
  }

  private async hydrate(): Promise<void> {
    const map: Array<[string, string]> = [
      ['platform_users', 'users'],
      ['platform_addresses', 'addresses'],
      ['platform_enquiries', 'enquiries'],
      ['platform_quotations', 'quotations'],
      ['platform_orders', 'orders'],
      ['platform_status_events', 'events'],
      ['platform_device_tokens', 'deviceTokens'],
      ['platform_notifications', 'notifications'],
      ['platform_announcements', 'announcements'],
      ['platform_saved_sites', 'savedSites'],
      ['platform_audit_logs', 'auditLogs'],
    ];
    for (const [table, key] of map) {
      const res = await this.pg.query(`SELECT * FROM ${table}`);
      (this as any)[key] = res.rows.map((r) => this.fromRow(r));
    }
  }

  // ----------------------------------------------------- persistence mirror
  /** Best-effort write-through mirror; failures never break the API path. */
  async mirror(table: string, row: Record<string, any>): Promise<void> {
    if (!this.dbReady) return;
    try {
      const cols = Object.keys(row).map((c) => this.snake(c));
      const vals = Object.keys(row).map((c) => this.mirrorValue(row[c]));
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const updates = cols.filter((c) => c !== 'id').map((c) => `${c} = EXCLUDED.${c}`).join(', ');
      await this.pg.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
         ON CONFLICT (id) DO UPDATE SET ${updates}`,
        vals,
      );
    } catch (err: any) {
      console.warn(`[platform] mirror to ${table} failed: ${err.message}`);
    }
  }

  private mirrorValue(v: any): any {
    if (v === undefined) return null;
    if (v === null || typeof v !== 'object') return v;
    return JSON.stringify(v);
  }

  private snake(camel: string): string {
    return camel.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
  }

  private camel(snakeStr: string): string {
    return snakeStr.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }

  private fromRow(row: Record<string, any>): any {
    const out: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      const v = row[key];
      out[this.camel(key)] = typeof v === 'string' && (key.startsWith('lines') || key.endsWith('json') || key === 'preferences' || key === 'attachments' || key === 'meta') ? JSON.parse(v) : v;
    }
    return out;
  }

  // ------------------------------------------------------------- users
  async createUser(user: Omit<PlatformUser, 'id' | 'createdAt'>): Promise<PlatformUser> {
    const full: PlatformUser = { ...user, id: this.newId('usr'), createdAt: this.now() };
    this.users.push(full);
    await this.mirror('platform_users', full);
    return full;
  }

  findUserByPhone(tenantId: string, phone: string): PlatformUser | undefined {
    return this.users.find((u) => u.tenantId === tenantId && u.phone === phone);
  }

  findUserById(id: string): PlatformUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  async updateUser(id: string, patch: Partial<PlatformUser>): Promise<PlatformUser | undefined> {
    const u = this.findUserById(id);
    if (!u) return undefined;
    Object.assign(u, patch);
    await this.mirror('platform_users', u);
    return u;
  }

  listStaff(tenantId: string): PlatformUser[] {
    return this.users.filter((u) => u.tenantId === tenantId && ['STAFF', 'SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN'].includes(u.role));
  }

  listDealers(tenantId: string, status?: string): PlatformUser[] {
    return this.users.filter((u) => u.tenantId === tenantId && u.role === 'DEALER' && (!status || u.dealerStatus === status));
  }

  // ----------------------------------------------------------- addresses
  async addAddress(userId: string, tenantId: string, dto: any): Promise<UserAddress> {
    const addr: UserAddress = {
      ...dto, isDefault: dto.isDefault !== false && this.addresses.filter((a) => a.userId === userId).length === 0,
      id: this.newId('adr'), userId, tenantId, createdAt: this.now(),
    } as UserAddress;
    if (addr.isDefault) this.clearDefaultAddress(userId);
    this.addresses.push(addr);
    await this.mirror('platform_addresses', addr);
    return addr;
  }

  private clearDefaultAddress(userId: string): void {
    this.addresses.filter((a) => a.userId === userId).forEach((a) => (a.isDefault = false));
  }

  addressesOf(userId: string): UserAddress[] {
    return this.addresses.filter((a) => a.userId === userId);
  }

  findAddress(userId: string, addressId: string): UserAddress | undefined {
    return this.addresses.find((a) => a.id === addressId && a.userId === userId);
  }

  async removeAddress(userId: string, addressId: string): Promise<boolean> {
    const idx = this.addresses.findIndex((a) => a.id === addressId && a.userId === userId);
    if (idx < 0) return false;
    this.addresses.splice(idx, 1);
    // Note: deletes are not mirrored to PostgreSQL in Phase 1 (in-memory is
    // authoritative); documented in PLATFORM-API.md under known limitations.
    return true;
  }

  // ----------------------------------------------------------- enquiries
  async createEnquiry(enq: Omit<PlatformEnquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<PlatformEnquiry> {
    const full: PlatformEnquiry = { ...enq, id: this.newId('enq'), status: 'NEW', createdAt: this.now(), updatedAt: this.now() };
    this.enquiries.push(full);
    await this.mirror('platform_enquiries', full);
    this.addEvent('ENQUIRY', full.id, 'NEW', 'NEW', 'Enquiry submitted', { id: full.userId || 'guest', name: full.contactName, role: 'CUSTOMER' } as any);
    return full;
  }

  findEnquiry(id: string): PlatformEnquiry | undefined {
    return this.enquiries.find((e) => e.id === id);
  }

  listEnquiries(tenantId: string, filter?: { status?: EnquiryStatus; userId?: string; assignedStaffId?: string }): PlatformEnquiry[] {
    return this.enquiries.filter(
      (e) => e.tenantId === tenantId &&
        (!filter?.status || e.status === filter.status) &&
        (!filter?.userId || e.userId === filter.userId) &&
        (!filter?.assignedStaffId || e.assignedStaffId === filter.assignedStaffId),
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateEnquiry(id: string, patch: Partial<PlatformEnquiry>): Promise<PlatformEnquiry | undefined> {
    const e = this.findEnquiry(id);
    if (!e) return undefined;
    Object.assign(e, patch, { updatedAt: this.now() });
    await this.mirror('platform_enquiries', e);
    return e;
  }

  // ----------------------------------------------------------- quotations
  async createQuotation(q: Omit<PlatformQuotation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<PlatformQuotation> {
    const full: PlatformQuotation = { ...q, id: this.newId('qt'), status: 'DRAFT', createdAt: this.now(), updatedAt: this.now() };
    this.quotations.push(full);
    await this.mirror('platform_quotations', full);
    return full;
  }

  findQuotation(id: string): PlatformQuotation | undefined {
    return this.quotations.find((q) => q.id === id);
  }

  listQuotations(tenantId: string, userId?: string): PlatformQuotation[] {
    return this.quotations.filter((q) => q.tenantId === tenantId && (!userId || q.userId === userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateQuotation(id: string, patch: Partial<PlatformQuotation>): Promise<PlatformQuotation | undefined> {
    const q = this.findQuotation(id);
    if (!q) return undefined;
    Object.assign(q, patch, { updatedAt: this.now() });
    await this.mirror('platform_quotations', q);
    return q;
  }

  // --------------------------------------------------------------- orders
  async createOrder(o: Omit<PlatformOrder, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<PlatformOrder> {
    const full: PlatformOrder = { ...o, id: this.newId('ord'), status: 'CONFIRMED', createdAt: this.now(), updatedAt: this.now() };
    this.orders.push(full);
    await this.mirror('platform_orders', full);
    return full;
  }

  findOrder(id: string): PlatformOrder | undefined {
    return this.orders.find((o) => o.id === id);
  }

  listOrders(tenantId: string, userId?: string): PlatformOrder[] {
    return this.orders.filter((o) => o.tenantId === tenantId && (!userId || o.userId === userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateOrder(id: string, patch: Partial<PlatformOrder>): Promise<PlatformOrder | undefined> {
    const o = this.findOrder(id);
    if (!o) return undefined;
    Object.assign(o, patch, { updatedAt: this.now() });
    await this.mirror('platform_orders', o);
    return o;
  }

  // ---------------------------------------------------------- status events
  addEvent(entityType: StatusEvent['entityType'], entityId: string, fromStatus: string, toStatus: string, note: string | undefined, actor: { id: string; name: string; role: any }): StatusEvent {
    const ev: StatusEvent = {
      id: this.newId('evt'), tenantId: PlatformStoreService.GURUKRIPA_TENANT_ID,
      entityType, entityId, fromStatus, toStatus, note,
      actorId: actor.id, actorName: actor.name, actorRole: actor.role, at: this.now(),
    };
    this.events.push(ev);
    this.mirror('platform_status_events', ev);
    return ev;
  }

  timeline(entityType: StatusEvent['entityType'], entityId: string): StatusEvent[] {
    return this.events.filter((e) => e.entityType === entityType && e.entityId === entityId).sort((a, b) => a.at.localeCompare(b.at));
  }

  // -------------------------------------------------------------- devices
  async registerDevice(userId: string, dto: any): Promise<DeviceToken> {
    const existing = this.deviceTokens.find((d) => d.userId === userId && d.token === dto.token);
    if (existing) {
      Object.assign(existing, { platform: dto.platform, preferences: { ...existing.preferences, ...(dto.preferences || {}) } });
      await this.mirror('platform_device_tokens', existing);
      return existing;
    }
    const t: DeviceToken = {
      id: this.newId('dev'), userId, token: dto.token, platform: dto.platform,
      preferences: { orderUpdates: true, quotations: true, announcements: true, ...(dto.preferences || {}) },
      createdAt: this.now(),
    };
    this.deviceTokens.push(t);
    await this.mirror('platform_device_tokens', t);
    return t;
  }

  async updateDevicePrefs(userId: string, deviceId: string, prefs: any): Promise<DeviceToken | undefined> {
    const d = this.deviceTokens.find((x) => x.id === deviceId && x.userId === userId);
    if (!d) return undefined;
    d.preferences = { ...d.preferences, ...prefs };
    await this.mirror('platform_device_tokens', d);
    return d;
  }

  tokensOf(userId: string): DeviceToken[] {
    return this.deviceTokens.filter((d) => d.userId === userId);
  }

  // --------------------------------------------------------- notifications
  async addNotification(n: Omit<UserNotification, 'id' | 'createdAt' | 'read'>): Promise<UserNotification> {
    const full: UserNotification = { ...n, id: this.newId('ntf'), read: false, createdAt: this.now() };
    this.notifications.push(full);
    await this.mirror('platform_notifications', full);
    return full;
  }

  notificationsOf(userId: string): UserNotification[] {
    return this.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markNotificationsRead(userId: string): Promise<number> {
    const unread = this.notifications.filter((n) => n.userId === userId && !n.read);
    for (const n of unread) { n.read = true; await this.mirror('platform_notifications', n); }
    return unread.length;
  }

  // ---------------------------------------------------------- announcements
  async saveAnnouncement(a: Announcement): Promise<Announcement> {
    const idx = this.announcements.findIndex((x) => x.id === a.id);
    if (idx >= 0) this.announcements[idx] = a; else this.announcements.push(a);
    await this.mirror('platform_announcements', a);
    return a;
  }

  listAnnouncements(tenantId: string, activeOnly = false): Announcement[] {
    return this.announcements.filter((a) => a.tenantId === tenantId && (!activeOnly || a.isActive))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  findAnnouncement(id: string): Announcement | undefined {
    return this.announcements.find((a) => a.id === id);
  }

  // ------------------------------------------------------------ saved sites
  async addSavedSite(userId: string, tenantId: string, dto: any): Promise<SavedSite> {
    const s: SavedSite = { ...dto, id: this.newId('site'), userId, tenantId, createdAt: this.now() };
    this.savedSites.push(s);
    await this.mirror('platform_saved_sites', s);
    return s;
  }

  savedSitesOf(userId: string): SavedSite[] {
    return this.savedSites.filter((s) => s.userId === userId);
  }

  // -------------------------------------------------------------- audit log
  async audit(actor: { id: string; role: any }, action: string, entityType: string, entityId: string, meta?: Record<string, any>): Promise<void> {
    const log: AuditLog = {
      id: this.newId('aud'), tenantId: PlatformStoreService.GURUKRIPA_TENANT_ID,
      actorId: actor.id, actorRole: actor.role, action, entityType, entityId, meta, at: this.now(),
    };
    this.auditLogs.push(log);
    await this.mirror('platform_audit_logs', log);
  }

  listAudit(tenantId: string, limit = 200): AuditLog[] {
    return this.auditLogs.filter((l) => l.tenantId === tenantId).slice(-limit).reverse();
  }

  // ---------------------------------------------------------- catalogue ids
  /** Resolve a catalogue product for the Gurukripa tenant (from existing mock/SaaS catalogue). */
  findProduct(tenantId: string, productId: string): any {
    return this.mockDb.getProductById(tenantId, productId);
  }

  productsOf(tenantId: string): any[] {
    return this.mockDb.getProductsForTenant(tenantId);
  }
}
