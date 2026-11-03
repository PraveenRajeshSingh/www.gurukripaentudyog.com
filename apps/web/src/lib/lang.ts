/**
 * Single source of truth for the site display language (English | हिंदी).
 *
 * The navbar toggle and the account profile's "preferred language" both go
 * through this helper so the two never drift apart. Changing the language
 * persists it and fires a window event that the navbar listens for, giving an
 * instant switch without a reload. Marathi ('mr') and anything unknown stay
 * out of the chrome — only the two fully-translated UI languages are honoured.
 */
export type SiteLang = 'en' | 'hi';

export const LANG_KEY = 'gk_web_lang';
export const LANG_EVENT = 'gk:lang';

/** Normalise any stored/preferred tag to a supported UI language. */
export function toSiteLang(value?: string | null): SiteLang {
  return value === 'hi' ? 'hi' : 'en';
}

export function getSiteLang(): SiteLang {
  try {
    return toSiteLang(window.localStorage.getItem(LANG_KEY));
  } catch {
    return 'en';
  }
}

/**
 * Persist the language and notify listeners. Pass a non-'hi' tag to force
 * English. Returns the tag actually applied (so callers know Marathi fell back).
 */
export function setSiteLang(value?: string | null): SiteLang {
  const next = toSiteLang(value);
  try {
    window.localStorage.setItem(LANG_KEY, next);
  } catch {
    /* storage blocked (private mode) — still update this session */
  }
  window.dispatchEvent(new CustomEvent<SiteLang>(LANG_EVENT, { detail: next }));
  return next;
}
