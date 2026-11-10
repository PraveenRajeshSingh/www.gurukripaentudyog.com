import { BadRequestException, Injectable, Logger } from '@nestjs/common';

/**
 * Google reCAPTCHA v3 verifier.
 * When RECAPTCHA_SECRET_KEY is unset, verification is skipped (rate limits still apply).
 * When set, abuse-prone public actions must present a valid captchaToken.
 */
@Injectable()
export class RecaptchaService {
  private readonly log = new Logger(RecaptchaService.name);

  isConfigured(): boolean {
    return !!String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
  }

  minScore(): number {
    const n = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5;
  }

  async verifyOrThrow(token: string | undefined | null, action?: string, remoteIp?: string): Promise<void> {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        this.log.warn('RECAPTCHA_SECRET_KEY not set — public forms rely on rate limits only.');
      }
      return;
    }
    const trimmed = String(token || '').trim();
    if (!trimmed) {
      throw new BadRequestException('CAPTCHA verification required. Refresh the page and try again.');
    }

    const body = new URLSearchParams();
    body.set('secret', String(process.env.RECAPTCHA_SECRET_KEY).trim());
    body.set('response', trimmed);
    if (remoteIp) body.set('remoteip', remoteIp);

    let json: any;
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      json = await res.json();
    } catch (err) {
      this.log.error(`reCAPTCHA network error: ${(err as Error)?.message || err}`);
      throw new BadRequestException('CAPTCHA verification failed. Please try again.');
    }

    if (!json?.success) {
      throw new BadRequestException('CAPTCHA verification failed. Please try again.');
    }
    if (action && json.action && json.action !== action) {
      throw new BadRequestException('CAPTCHA action mismatch.');
    }
    const score = typeof json.score === 'number' ? json.score : 1;
    if (score < this.minScore()) {
      throw new BadRequestException('CAPTCHA score too low. Please try again later.');
    }
  }
}
