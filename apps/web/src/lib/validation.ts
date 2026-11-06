/** Shared client-side patterns — mirror backend platform/dto.ts. */
export const PHONE_RE = /^[6-9]\d{9}$/;
export const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
export const PIN_RE = /^[1-9]\d{5}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeIndianPhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10);
}

export const WHATSAPP_BASE = 'https://wa.me/919198923230';

export function whatsappUrl(text: string): string {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
}
