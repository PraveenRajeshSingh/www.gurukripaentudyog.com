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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("./store.service");
let NotifyService = class NotifyService {
    constructor(store) {
        this.store = store;
    }
    async notifyUser(userId, tenantId, type, title, body, ref) {
        const n = await this.store.addNotification({
            userId, tenantId, type, title, body,
            entityType: ref?.entityType, entityId: ref?.entityId,
        });
        const kind = type === 'ANNOUNCEMENT' ? 'announcements' : type.startsWith('QUOTATION') ? 'quotations' : 'orderUpdates';
        for (const device of this.store.tokensOf(userId)) {
            if (!device.preferences[kind])
                continue;
            this.pushToDevice(device.token, n);
        }
        return n;
    }
    pushToDevice(token, n) {
        const endpoint = process.env.PUSH_WEBHOOK_URL;
        if (!endpoint)
            return;
        const payload = JSON.stringify({
            to: token,
            notification: { title: n.title, body: n.body },
            data: { type: n.type, entityType: n.entityType || '', entityId: n.entityId || '' },
        });
        fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...(process.env.PUSH_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.PUSH_WEBHOOK_TOKEN}` } : {}) },
            body: payload,
        }).catch((err) => console.warn('[notify] push transport failed:', err.message));
    }
};
exports.NotifyService = NotifyService;
exports.NotifyService = NotifyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.PlatformStoreService])
], NotifyService);
//# sourceMappingURL=notify.service.js.map