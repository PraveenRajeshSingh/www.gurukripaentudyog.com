import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/api-proxy';

/**
 * Public (unauthenticated) auth endpoints: /api/auth/register -> api/v1/auth/register.
 * Rate limiting and validation live in the NestJS backend; this is a thin,
 * fail-closed pass-through so the browser never talks to the backend directly.
 * Any JWT in the response is stripped — sessions are only established
 * through /api/login, which stores the token in an httpOnly cookie.
 */
export async function POST(req: NextRequest, ctx: { params?: { path?: string[] } }) {
  const segments = ctx.params?.path ?? [];
  const body = await req.json().catch(() => undefined);
  const res = await proxy(req, `auth/${segments.join('/')}`, { method: 'POST', body });
  const json = await res.clone().json().catch(() => null);
  if (json && typeof json === 'object' && 'token' in json) {
    delete json.token;
    return NextResponse.json(json, { status: res.status });
  }
  return res;
}
