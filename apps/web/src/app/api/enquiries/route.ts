import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Mirrors backend CreateEnquiryDto (platform/dto.ts) — keep in sync.
const PHONE_RE = /^[6-9]\d{9}$/;
const UNITS = ['bricks', 'trolleys', 'cuft', 'bags', 'pieces', 'trip'] as const;

interface EnquiryPayload {
  lines: { productName: string; quantity: number; unit: string }[];
  siteLocation: string;
  notes?: string;
  contactName?: string;
  contactPhone?: string;
}

/**
 * POST /api/enquiries — guest enquiry submission (public endpoint on the backend).
 * Server-side validation mirrors the NestJS DTO so bad input never reaches upstream.
 * Success is only reported when the backend confirms it; failures pass through as-is.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Partial<EnquiryPayload> | null;

  const errors: string[] = [];
  const lines = Array.isArray(body?.lines) ? body!.lines : [];
  if (lines.length < 1 || lines.length > 10) errors.push('Add between 1 and 10 items.');
  for (const l of lines) {
    if (!l || typeof l.productName !== 'string' || l.productName.trim().length < 2 || l.productName.length > 120)
      errors.push('Each item needs a product name (2–120 characters).');
    if (typeof l.quantity !== 'number' || !Number.isFinite(l.quantity) || l.quantity < 1 || l.quantity > 10_000_000)
      errors.push('Each item needs a quantity between 1 and 10,000,000.');
    if (!UNITS.includes(l.unit as (typeof UNITS)[number])) errors.push('Each item needs a valid unit.');
  }
  const siteLocation = typeof body?.siteLocation === 'string' ? body.siteLocation.trim() : '';
  if (siteLocation.length < 4 || siteLocation.length > 200) errors.push('Site location must be 4–200 characters.');
  const contactName = typeof body?.contactName === 'string' ? body.contactName.trim() : '';
  if (contactName.length < 2 || contactName.length > 80) errors.push('Your name is required (2–80 characters).');
  const contactPhone = typeof body?.contactPhone === 'string' ? body.contactPhone.replace(/\D/g, '').slice(-10) : '';
  if (!PHONE_RE.test(contactPhone)) errors.push('Enter a valid 10-digit Indian mobile number.');

  if (errors.length) {
    return NextResponse.json({ success: false, error: 'VALIDATION', message: errors[0] }, { status: 400 });
  }

  const payload: EnquiryPayload = {
    lines: lines.map((l) => ({ productName: l.productName.trim(), quantity: Math.round(l.quantity), unit: l.unit })),
    siteLocation,
    contactName,
    contactPhone,
    ...(typeof body?.notes === 'string' && body.notes.trim() ? { notes: body.notes.trim().slice(0, 1000) } : {}),
  };

  return proxy(req, 'public/enquiries', { method: 'POST', body: payload });
}
