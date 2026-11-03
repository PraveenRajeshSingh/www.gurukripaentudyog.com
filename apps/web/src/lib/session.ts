/**
 * Minimal session-sync bus shared by the navbar and the account portal.
 *
 * Both surfaces read the same httpOnly-cookie session via /api/me/profile, but
 * they live in different parts of the client tree (persistent layout vs a page).
 * Signing in or out on the profile page can't re-render the navbar on its own,
 * so any session change dispatches this event and the navbar refetches. Keeping
 * it to a bare event avoids introducing global state for a two-consumer signal.
 */
export const SESSION_EVENT = 'gk:session';

/** Notify listeners that the signed-in user may have changed. */
export function notifySessionChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}
