/**
 * Browser-side fetch helper for the same-origin /api/* proxy routes.
 * The JWT stays in an httpOnly cookie; this layer never handles tokens.
 */
export interface ApiResult<T = any> {
  ok: boolean;
  /** HTTP status; 0 means the request never reached the server. */
  status: number;
  json: T | null;
  /** Human-readable fallback message when the server gave none. */
  message: string;
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/${path}`, {
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      ...init,
    });
    const json = (await res.json().catch(() => null)) as T | null;
    const j = json as any;
    return {
      ok: res.ok && j?.success !== false,
      status: res.status,
      json,
      message:
        (j && (j.message || j.error)) ||
        (res.ok ? 'Request completed.' : `Request failed (HTTP ${res.status}).`),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      json: null,
      message: 'Network problem — the request did not reach the server.',
    };
  }
}

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
