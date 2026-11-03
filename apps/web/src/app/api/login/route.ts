import { NextRequest, NextResponse } from 'next/server';
import { proxy, backendConfigured } from '../../../lib/api-proxy';

const SESSION_COOKIE = 'gk_session';
const SESSION_MAX_AGE = 12 * 60 * 60; // 12h; the backend JWT lifetime governs real expiry.

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/** POST /api/login — exchanges phone+password with the backend, stores JWT in an httpOnly cookie. */
export async function POST(req: NextRequest) {
  if (!backendConfigured()) return proxy(req, 'auth/login');

  const body = await req.json().catch(() => null);
  if (!body || typeof body.phone !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ success: false, message: 'Phone and password are required.' }, { status: 400 });
  }

  const upstream = await fetch(
    `${process.env.BACKEND_API_URL?.replace(/\/+$/, '')}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: body.phone, password: body.password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    }
  ).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, error: 'UPSTREAM_UNREACHABLE', message: 'Could not reach the kiln service. Try again later.' },
      { status: 503 }
    );
  }

  const json = await upstream.json().catch(() => ({ success: false }));

  // The JWT goes into an httpOnly cookie only — never into the response body.
  const token = upstream.ok && typeof json?.token === 'string' ? json.token : null;
  if (token) delete json.token;

  const res = NextResponse.json(json, { status: upstream.status });
  if (token) {
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(req.nextUrl.protocol === 'https:'));
  }
  return res;
}

/** DELETE /api/login — end the session. */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(true), maxAge: 0 });
  return res;
}
