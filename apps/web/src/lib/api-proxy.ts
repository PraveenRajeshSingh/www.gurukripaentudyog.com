import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy to the NestJS platform API.
 * - The backend URL lives in a server-only env var; it is never shipped
 *   to the browser and no secrets are logged.
 * - Responses are passed through with their original status codes, so the
 *   UI can never claim success unless the backend said so.
 * - If the backend is not configured/reachable, we answer 503 honestly —
 *   the client must surface this, never fake a result.
 */
const BACKEND = process.env.BACKEND_API_URL?.replace(/\/+$/, '') || '';

export const API_VERSION = 'api/v1';

export function backendConfigured(): boolean {
  return BACKEND.length > 0;
}

export async function proxy(
  req: NextRequest,
  path: string,
  opts: { body?: unknown; auth?: string | null; method?: string } = {}
): Promise<NextResponse> {
  if (!BACKEND) {
    return NextResponse.json(
      {
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'The kiln API is not configured on this deployment (set BACKEND_API_URL).',
      },
      { status: 503 }
    );
  }

  const url = `${BACKEND}/${API_VERSION}/${path}${req.nextUrl.search}`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const auth = opts.auth ?? req.headers.get('authorization');
  if (auth) headers.authorization = auth;

  try {
    const res = await fetch(url, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : req.method),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json().catch(() => ({ success: false }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'UPSTREAM_UNREACHABLE',
        message: 'Could not reach the kiln service. Please try again or call +91 91989 23230.',
      },
      { status: 503 }
    );
  }
}
