"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PlatformStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformStoreService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = require("fs");
const path = require("path");
const postgres_service_1 = require("../database/postgres.service");
const mock_db_service_1 = require("../database/mock-db.service");
let PlatformStoreService = PlatformStoreService_1 = class PlatformStoreService {
    constructor(mockDb) {
        this.mockDb = mockDb;
        this.pg = postgres_service_1.PostgresService.getInstance();
        this.dbReady = false;
        this.users = [];
        this.addresses = [];
        this.enquiries = [];
        this.quotations = [];
        this.orders = [];
        this.events = [];
        this.deviceTokens = [];
        this.notifications = [];
        this.announcements = [];
        this.savedSites = [];
        this.auditLogs = [];
    }
    newId(prefix) {
        return `${prefix}-${(0, crypto_1.randomUUID)().slice(0, 12)}`;
    }
    now() {
        return new Date().toISOString();
    }
    async onModuleInit() {
        const conn = await this.pg.testConnection();
        this.dbReady = conn.ok;
        if (!this.dbReady) {
            console.log('[platform] PostgreSQL not reachable - running in-memory store (dev mode).');
        }
        else {
            try {
                await this.runMigrationsIfPresent();
                await this.hydrate();
                console.log('[platform] hydrated platform collections from PostgreSQL.');
            }
            catch (err) {
                console.warn('[platform] hydration failed, continuing in-memory:', err.message);
                this.dbReady = false;
            }
        }
        this.loadDemoSnapshotIfAllowed();
    }
    loadDemoSnapshotIfAllowed() {
        if (process.env.NODE_ENV === 'production')
            return;
        if (process.env.ALLOW_DEMO_SEED !== '1' && process.env.ALLOW_DEMO_SEED !== 'true')
            return;
        const candidates = [
            path.resolve(process.cwd(), '../.demo/platform-seed-snapshot.local.json'),
            path.resolve(process.cwd(), '.demo/platform-seed-snapshot.local.json'),
            path.resolve(__dirname, '../../../.demo/platform-seed-snapshot.local.json'),
        ];
        const file = candidates.find((p) => fs.existsSync(p));
        if (!file) {
            console.log('[platform] ALLOW_DEMO_SEED set but no .demo/platform-seed-snapshot.local.json — run npm run seed:demo');
            return;
        }
        try {
            const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
            const mergeById = (current, incoming) => {
                if (!incoming?.length)
                    return current;
                const map = new Map(current.map((x) => [x.id, x]));
                for (const row of incoming)
                    map.set(row.id, row);
                return [...map.values()];
            };
            this.users = mergeById(this.users, snap.users);
            this.addresses = mergeById(this.addresses, snap.addresses);
            this.enquiries = mergeById(this.enquiries, snap.enquiries);
            this.quotations = mergeById(this.quotations, snap.quotations);
            this.orders = mergeById(this.orders, snap.orders);
            this.events = mergeById(this.events, snap.events);
            this.notifications = mergeById(this.notifications, snap.notifications);
            this.announcements = mergeById(this.announcements, snap.announcements);
            this.savedSites = mergeById(this.savedSites, snap.savedSites);
            this.auditLogs = mergeById(this.auditLogs, snap.auditLogs);
            console.log(`[platform] loaded demo seed snapshot (${snap.users?.length || 0} test users) from ${file}`);
        }
        catch (err) {
            console.warn('[platform] demo snapshot load failed:', err.message);
        }
    }
    async runMigrationsIfPresent() {
    }
    async hydrate() {
        const map = [
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
            this[key] = res.rows.map((r) => this.fromRow(r));
        }
    }
    async mirror(table, row) {
        if (!this.dbReady)
            return;
        try {
            const cols = Object.keys(row).map((c) => this.snake(c));
            const vals = Object.keys(row).map((c) => this.mirrorValue(row[c]));
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
            const updates = cols.filter((c) => c !== 'id').map((c) => `${c} = EXCLUDED.${c}`).join(', ');
            await this.pg.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
         ON CONFLICT (id) DO UPDATE SET ${updates}`, vals);
        }
        catch (err) {
            console.warn(`[platform] mirror to ${table} failed: ${err.message}`);
        }
    }
    mirrorValue(v) {
        if (v === undefined)
            return null;
        if (v === null || typeof v !== 'object')
            return v;
        return JSON.stringify(v);
    }
    snake(camel) {
        return camel.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
    }
    camel(snakeStr) {
        return snakeStr.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    }
    fromRow(row) {
        const out = {};
        for (const key of Object.keys(row)) {
            const v = row[key];
            out[this.camel(key)] = typeof v === 'string' && (key.startsWith('lines') || key.endsWith('json') || key === 'preferences' || key === 'attachments' || key === 'meta') ? JSON.parse(v) : v;
        }
        return out;
    }
    async createUser(user) {
        const full = { ...user, id: this.newId('usr'), createdAt: this.now() };
        this.users.push(full);
        await this.mirror('platform_users', full);
        return full;
    }
    findUserByPhone(tenantId, phone) {
        return this.users.find((u) => u.tenantId === tenantId && u.phone === phone);
    }
    findUserById(id) {
        return this.users.find((u) => u.id === id);
    }
    async updateUser(id, patch) {
        const u = this.findUserById(id);
        if (!u)
            return undefined;
        Object.assign(u, patch);
        await this.mirror('platform_users', u);
        return u;
    }
    listStaff(tenantId) {
        return this.users.filter((u) => u.tenantId === tenantId && ['STAFF', 'SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN'].includes(u.role));
    }
    listDealers(tenantId, status) {
        return this.users.filter((u) => u.tenantId === tenantId && u.role === 'DEALER' && (!status || u.dealerStatus === status));
    }
    async addAddress(userId, tenantId, dto) {
        const addr = {
            ...dto, isDefault: dto.isDefault !== false && this.addresses.filter((a) => a.userId === userId).length === 0,
            id: this.newId('adr'), userId, tenantId, createdAt: this.now(),
        };
        if (addr.isDefault)
            this.clearDefaultAddress(userId);
        this.addresses.push(addr);
        await this.mirror('platform_addresses', addr);
        return addr;
    }
    clearDefaultAddress(userId) {
        this.addresses.filter((a) => a.userId === userId).forEach((a) => (a.isDefault = false));
    }
    addressesOf(userId) {
        return this.addresses.filter((a) => a.userId === userId);
    }
    findAddress(userId, addressId) {
        return this.addresses.find((a) => a.id === addressId && a.userId === userId);
    }
    async removeAddress(userId, addressId) {
        const idx = this.addresses.findIndex((a) => a.id === addressId && a.userId === userId);
        if (idx < 0)
            return false;
        this.addresses.splice(idx, 1);
        return true;
    }
    async createEnquiry(enq) {
        const full = { ...enq, id: this.newId('enq'), status: 'NEW', createdAt: this.now(), updatedAt: this.now() };
        this.enquiries.push(full);
        await this.mirror('platform_enquiries', full);
        this.addEvent('ENQUIRY', full.id, 'NEW', 'NEW', 'Enquiry submitted', { id: full.userId || 'guest', name: full.contactName, role: 'CUSTOMER', tenantId: full.tenantId });
        return full;
    }
    findEnquiry(id) {
        return this.enquiries.find((e) => e.id === id);
    }
    listEnquiries(tenantId, filter) {
        return this.enquiries.filter((e) => e.tenantId === tenantId &&
            (!filter?.status || e.status === filter.status) &&
            (!filter?.userId || e.userId === filter.userId) &&
            (!filter?.assignedStaffId || e.assignedStaffId === filter.assignedStaffId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async updateEnquiry(id, patch) {
        const e = this.findEnquiry(id);
        if (!e)
            return undefined;
        Object.assign(e, patch, { updatedAt: this.now() });
        await this.mirror('platform_enquiries', e);
        return e;
    }
    async createQuotation(q) {
        const full = { ...q, id: this.newId('qt'), status: 'DRAFT', createdAt: this.now(), updatedAt: this.now() };
        this.quotations.push(full);
        await this.mirror('platform_quotations', full);
        return full;
    }
    findQuotation(id) {
        return this.quotations.find((q) => q.id === id);
    }
    listQuotations(tenantId, userId) {
        return this.quotations.filter((q) => q.tenantId === tenantId && (!userId || q.userId === userId))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async updateQuotation(id, patch) {
        const q = this.findQuotation(id);
        if (!q)
            return undefined;
        Object.assign(q, patch, { updatedAt: this.now() });
        await this.mirror('platform_quotations', q);
        return q;
    }
    async createOrder(o) {
        const full = { ...o, id: this.newId('ord'), status: 'CONFIRMED', createdAt: this.now(), updatedAt: this.now() };
        this.orders.push(full);
        await this.mirror('platform_orders', full);
        return full;
    }
    findOrder(id) {
        return this.orders.find((o) => o.id === id);
    }
    listOrders(tenantId, userId) {
        return this.orders.filter((o) => o.tenantId === tenantId && (!userId || o.userId === userId))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async updateOrder(id, patch) {
        const o = this.findOrder(id);
        if (!o)
            return undefined;
        Object.assign(o, patch, { updatedAt: this.now() });
        await this.mirror('platform_orders', o);
        return o;
    }
    addEvent(entityType, entityId, fromStatus, toStatus, note, actor) {
        const tenantId = actor.tenantId || PlatformStoreService_1.GURUKRIPA_TENANT_ID;
        const ev = {
            id: this.newId('evt'), tenantId,
            entityType, entityId, fromStatus, toStatus, note,
            actorId: actor.id, actorName: actor.name, actorRole: actor.role, at: this.now(),
        };
        this.events.push(ev);
        this.mirror('platform_status_events', ev);
        return ev;
    }
    timeline(entityType, entityId) {
        return this.events.filter((e) => e.entityType === entityType && e.entityId === entityId).sort((a, b) => a.at.localeCompare(b.at));
    }
    async registerDevice(userId, dto) {
        const existing = this.deviceTokens.find((d) => d.userId === userId && d.token === dto.token);
        if (existing) {
            Object.assign(existing, { platform: dto.platform, preferences: { ...existing.preferences, ...(dto.preferences || {}) } });
            await this.mirror('platform_device_tokens', existing);
            return existing;
        }
        const t = {
            id: this.newId('dev'), userId, token: dto.token, platform: dto.platform,
            preferences: { orderUpdates: true, quotations: true, announcements: true, ...(dto.preferences || {}) },
            createdAt: this.now(),
        };
        this.deviceTokens.push(t);
        await this.mirror('platform_device_tokens', t);
        return t;
    }
    async updateDevicePrefs(userId, deviceId, prefs) {
        const d = this.deviceTokens.find((x) => x.id === deviceId && x.userId === userId);
        if (!d)
            return undefined;
        d.preferences = { ...d.preferences, ...prefs };
        await this.mirror('platform_device_tokens', d);
        return d;
    }
    tokensOf(userId) {
        return this.deviceTokens.filter((d) => d.userId === userId);
    }
    async addNotification(n) {
        const full = { ...n, id: this.newId('ntf'), read: false, createdAt: this.now() };
        this.notifications.push(full);
        await this.mirror('platform_notifications', full);
        return full;
    }
    notificationsOf(userId) {
        return this.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async markNotificationsRead(userId) {
        const unread = this.notifications.filter((n) => n.userId === userId && !n.read);
        for (const n of unread) {
            n.read = true;
            await this.mirror('platform_notifications', n);
        }
        return unread.length;
    }
    async saveAnnouncement(a) {
        const idx = this.announcements.findIndex((x) => x.id === a.id);
        if (idx >= 0)
            this.announcements[idx] = a;
        else
            this.announcements.push(a);
        await this.mirror('platform_announcements', a);
        return a;
    }
    listAnnouncements(tenantId, activeOnly = false) {
        return this.announcements.filter((a) => a.tenantId === tenantId && (!activeOnly || a.isActive))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    findAnnouncement(id) {
        return this.announcements.find((a) => a.id === id);
    }
    async addSavedSite(userId, tenantId, dto) {
        const s = { ...dto, id: this.newId('site'), userId, tenantId, createdAt: this.now() };
        this.savedSites.push(s);
        await this.mirror('platform_saved_sites', s);
        return s;
    }
    savedSitesOf(userId) {
        return this.savedSites.filter((s) => s.userId === userId);
    }
    async audit(actor, action, entityType, entityId, meta) {
        const log = {
            id: this.newId('aud'), tenantId: actor.tenantId || PlatformStoreService_1.GURUKRIPA_TENANT_ID,
            actorId: actor.id, actorRole: actor.role, action, entityType, entityId, meta, at: this.now(),
        };
        this.auditLogs.push(log);
        await this.mirror('platform_audit_logs', log);
    }
    listAudit(tenantId, limit = 200) {
        return this.auditLogs.filter((l) => l.tenantId === tenantId).slice(-limit).reverse();
    }
    findProduct(tenantId, productId) {
        return this.mockDb.getProductById(tenantId, productId);
    }
    productsOf(tenantId) {
        return this.mockDb.getProductsForTenant(tenantId);
    }
};
exports.PlatformStoreService = PlatformStoreService;
PlatformStoreService.GURUKRIPA_TENANT_ID = 'tenant-gurukripa-001';
exports.PlatformStoreService = PlatformStoreService = PlatformStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mock_db_service_1.MockDatabaseService])
], PlatformStoreService);
//# sourceMappingURL=store.service.js.map