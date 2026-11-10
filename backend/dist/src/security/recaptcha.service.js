"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RecaptchaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecaptchaService = void 0;
const common_1 = require("@nestjs/common");
let RecaptchaService = RecaptchaService_1 = class RecaptchaService {
    constructor() {
        this.log = new common_1.Logger(RecaptchaService_1.name);
    }
    isConfigured() {
        return !!String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
    }
    minScore() {
        const n = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
        return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5;
    }
    async verifyOrThrow(token, action, remoteIp) {
        if (!this.isConfigured()) {
            if (process.env.NODE_ENV === 'production') {
                this.log.warn('RECAPTCHA_SECRET_KEY not set — public forms rely on rate limits only.');
            }
            return;
        }
        const trimmed = String(token || '').trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('CAPTCHA verification required. Refresh the page and try again.');
        }
        const body = new URLSearchParams();
        body.set('secret', String(process.env.RECAPTCHA_SECRET_KEY).trim());
        body.set('response', trimmed);
        if (remoteIp)
            body.set('remoteip', remoteIp);
        let json;
        try {
            const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
            json = await res.json();
        }
        catch (err) {
            this.log.error(`reCAPTCHA network error: ${err?.message || err}`);
            throw new common_1.BadRequestException('CAPTCHA verification failed. Please try again.');
        }
        if (!json?.success) {
            throw new common_1.BadRequestException('CAPTCHA verification failed. Please try again.');
        }
        if (action && json.action && json.action !== action) {
            throw new common_1.BadRequestException('CAPTCHA action mismatch.');
        }
        const score = typeof json.score === 'number' ? json.score : 1;
        if (score < this.minScore()) {
            throw new common_1.BadRequestException('CAPTCHA score too low. Please try again later.');
        }
    }
};
exports.RecaptchaService = RecaptchaService;
exports.RecaptchaService = RecaptchaService = RecaptchaService_1 = __decorate([
    (0, common_1.Injectable)()
], RecaptchaService);
//# sourceMappingURL=recaptcha.service.js.map