/**
 * Browser-side fetch helper for the same-origin /api/* proxy routes.
 * The JWT stays in an httpOnly cookie; this layer never handles tokens.
 */
import { friendlyHttpError, type FriendlyError } from './errors';

export interface ApiResult<T = unknown> {
  ok: boolean;
  /** HTTP status; 0 means the request never reached the server. */
  status: number;
  json: T | null;
  /** Human-readable fallback message when the server gave none. */
  message: string;
  /** Structured, user-safe error classification. */
  error: FriendlyError | null;
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/${path}`, {
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      ...init,
    });
    const json = (await res.json().catch(() => null)) as T | null;
    const j = json as { success?: boolean; message?: string; error?: string } | null;
    const serverMessage = (j && (j.message || j.error)) || undefined;
    const ok = res.ok && j?.success !== false;
    const error = ok ? null : friendlyHttpError(res.status, serverMessage);
    return {
      ok,
      status: res.status,
      json,
      message: error?.message || serverMessage || (res.ok ? 'Request completed.' : `Request failed (HTTP ${res.status}).`),
      error,
    };
  } catch {
    const error = friendlyHttpError(0);
    return {
      ok: false,
      status: 0,
      json: null,
      message: error.message,
      error,
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
