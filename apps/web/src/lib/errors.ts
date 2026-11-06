/**
 * Central mapping of HTTP / transport failures to user-safe copy.
 * Never surfaces stack traces or raw Nest exception objects.
 */
export type ErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rate_limit'
  | 'unavailable'
  | 'server'
  | 'unknown';

export interface FriendlyError {
  kind: ErrorKind;
  title: string;
  message: string;
  canRetry: boolean;
}

export function friendlyHttpError(status: number, serverMessage?: string): FriendlyError {
  const msg = (serverMessage || '').trim();

  if (status === 0) {
    return {
      kind: 'network',
      title: 'Connection problem',
      message: 'The request did not reach the kiln server. Check your internet connection and try again.',
      canRetry: true,
    };
  }
  if (status === 400 || status === 422) {
    return {
      kind: 'validation',
      title: 'Please check your details',
      message: msg || 'Some fields need correction before this can be saved.',
      canRetry: false,
    };
  }
  if (status === 401) {
    return {
      kind: 'unauthorized',
      title: 'Sign in required',
      message: msg || 'Your session expired or you are not signed in. Please sign in again.',
      canRetry: false,
    };
  }
  if (status === 403) {
    return {
      kind: 'forbidden',
      title: 'Not allowed',
      message: msg || 'You do not have permission for this action.',
      canRetry: false,
    };
  }
  if (status === 404) {
    return {
      kind: 'not_found',
      title: 'Not found',
      message: msg || 'That record could not be found. It may have been removed.',
      canRetry: false,
    };
  }
  if (status === 409) {
    return {
      kind: 'conflict',
      title: 'Already exists',
      message: msg || 'This conflicts with an existing record. Refresh and try again.',
      canRetry: true,
    };
  }
  if (status === 429) {
    return {
      kind: 'rate_limit',
      title: 'Too many requests',
      message: msg || 'Please wait a moment before trying again.',
      canRetry: true,
    };
  }
  if (status === 503) {
    return {
      kind: 'unavailable',
      title: 'Service unavailable',
      message: msg || 'The kiln API is temporarily unavailable. Call +91 91989 23230 if urgent.',
      canRetry: true,
    };
  }
  if (status >= 500) {
    return {
      kind: 'server',
      title: 'Server error',
      message: msg || 'Something went wrong on the kiln server. Please try again shortly.',
      canRetry: true,
    };
  }
  return {
    kind: 'unknown',
    title: 'Request failed',
    message: msg || `Request failed (HTTP ${status}).`,
    canRetry: true,
  };
}
