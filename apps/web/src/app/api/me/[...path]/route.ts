import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/api-proxy';

const SESSION_COOKIE = 'gk_session';

/**
 * Authenticated pass-through for /api/me/<backend path>.
 * The httpOnly session cookie is converted back into a Bearer header here,
 * so the JWT never reaches client-side JavaScript.
 *
 * Examples (frontend path -> NestJS route):
 *   GET  /api/me/profile            -> GET   api/v1/me/profile
 *   PATCH /api/me/profile           -> PATCH api/v1/me/profile
 *   GET  /api/me/addresses          -> GET   api/v1/me/addresses
 *   POST /api/me/enquiries          -> POST  api/v1/me/enquiries
 *   GET  /api/me/orders?i=O-123     -> GET   api/v1/me/orders/O-123  (?i = id segment)
 */
async function forward(
  req: NextRequest,
  segments: string[],
  init: { body?: unknown; method: string }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHENTICATED', message: 'Please sign in.' },
      { status: 401 }
    );
  }
  // ?i=<id> lets the client address single-resource routes without nesting folders.
  const id = req.nextUrl.searchParams.get('i');
  const path = [...segments, ...(id ? [id] : [])].join('/');
  return proxy(req, `me/${path}`, { ...init, auth: `Bearer ${token}` });
}

const segments = (ctx: { params?: { path?: string[] } }) => ctx.params?.path ?? [];

export async function GET(req: NextRequest, ctx: { params?: { path?: string[] } }) {
  return forward(req, segments(ctx), { method: 'GET' });
}

export async function POST(req: NextRequest, ctx: { params?: { path?: string[] } }) {
  const body = await req.json().catch(() => undefined);
  return forward(req, segments(ctx), { method: 'POST', body });
}

export async function PATCH(req: NextRequest, ctx: { params?: { path?: string[] } }) {
  const body = await req.json().catch(() => undefined);
  return forward(req, segments(ctx), { method: 'PATCH', body });
}

export async function DELETE(req: NextRequest, ctx: { params?: { path?: string[] } }) {
  return forward(req, segments(ctx), { method: 'DELETE' });
}
