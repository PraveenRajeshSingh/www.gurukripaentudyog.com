'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../providers/CartProvider';
import { translations } from '../../lib/translations';
import { getSiteLang, setSiteLang, LANG_EVENT, type SiteLang } from '../../lib/lang';
import { SESSION_EVENT, notifySessionChange } from '../../lib/session';
import {
  CartIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  MessageIcon,
  FlameIcon,
  LogoutIcon,
} from '../ui/icons';

const WHATSAPP_ENQUIRY =
  'https://wa.me/919198923230?text=Hello%20Gurukripa%20Ent%20Udyog,%20I%20would%20like%20a%20rate%20quote%20for%20bricks.';

interface SessionUser {
  name: string;
  role: string;
}

/** Is a nav href the current route? Home anchors are intentionally not highlighted. */
function isActive(pathname: string, href: string): boolean {
  const clean = href.split('#')[0];
  if (clean === '/' || clean === '') return pathname === '/' && href === '/';
  return pathname === clean || pathname.startsWith(clean + '/');
}

const initialsOf = (name: string) =>
  name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U';

export default function Navbar() {
  const { count, openCart } = useCart();
  const pathname = usePathname();
  const [lang, setLang] = useState<SiteLang>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  // Restore language + session, and keep both in sync with the profile page.
  const refreshSession = useCallback(() => {
    fetch('/api/me/profile', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data;
        setUser(data ? { name: data.name, role: data.role } : null);
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setLang(getSiteLang());
    const onLang = (e: Event) => setLang((e as CustomEvent<SiteLang>).detail ?? 'en');
    window.addEventListener(LANG_EVENT, onLang);
    refreshSession();
    window.addEventListener(SESSION_EVENT, refreshSession);
    return () => {
      window.removeEventListener(LANG_EVENT, onLang);
      window.removeEventListener(SESSION_EVENT, refreshSession);
    };
  }, [refreshSession]);

  // Close menus on route change.
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // Click-outside + Escape close for the account menu.
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const toggleLang = () => setSiteLang(lang === 'en' ? 'hi' : 'en');

  const signOut = useCallback(async () => {
    setAccountOpen(false);
    try {
      await fetch('/api/login', { method: 'DELETE', credentials: 'same-origin' });
    } catch {
      /* clear the UI even if the logout call fails */
    }
    setUser(null);
    // Sync the account portal too when it is mounted on /profile.
    notifySessionChange();
  }, []);

  const navLinks = [
    { href: '/', label: t.navHome },
    { href: '/products', label: t.navProducts },
    { href: '/#estimator', label: t.navEstimator },
    { href: '/about', label: t.navAbout },
    { href: '/services', label: t.navServices },
    { href: '/contact', label: t.navContact },
  ];

  const desktopLinkCls = (href: string) =>
    `relative py-1 transition ${
      isActive(pathname, href)
        ? 'text-[#C8460A] font-bold after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#C8460A]'
        : 'hover:text-[#C8460A]'
    }`;

  return (
    <>
      {/* Top information bar */}
      <div className="bg-[#8B2E05] text-[#FAFAF9] text-xs py-1.5 px-4 font-medium">
        <div className="container mx-auto flex justify-between items-center gap-3">
          <p className="flex items-center gap-1.5 min-w-0 truncate">
            <FlameIcon className="w-3.5 h-3.5 shrink-0 text-amber-300" />
            <span>
              {lang === 'en'
                ? 'Double-fired red bricks · 4,000-brick trolley loads · 5% GST invoices'
                : 'डबल-फायर्ड लाल ईंटें · 4,000 ईंट प्रति ट्रॉली · 5% जीएसटी बिल'}
            </span>
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:+919198923230"
              className="hover:underline flex items-center gap-1.5 font-semibold"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+91 91989 23230</span>
              <span className="sm:hidden">{t.callUs.split(':')[1]?.trim() || 'Call'}</span>
            </a>
            <button
              onClick={toggleLang}
              className="bg-black/20 hover:bg-black/30 text-white px-2 py-1 rounded text-[11px] font-bold transition min-h-[28px]"
              aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            >
              {lang === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Main sticky navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(200,70,10,0.12)] shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#C8460A] text-white flex items-center justify-center font-black text-xl shrink-0">
              GE
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-base text-[#1C1009] tracking-tight block leading-tight truncate">
                {t.companyName}
              </span>
              <span className="text-[11px] text-[#6B5545] font-medium block truncate">
                {t.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#4A3728]" aria-label="Main navigation">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className={desktopLinkCls(l.href)} aria-current={isActive(pathname, l.href) ? 'page' : undefined}>
                {l.label}
              </Link>
            ))}
            <Link href="/tracker" className={`${desktopLinkCls('/tracker')} flex items-center gap-1.5`} aria-current={isActive(pathname, '/tracker') ? 'page' : undefined}>
              <TruckIcon className="w-4 h-4 text-[#C8460A]" />
              {t.navTracker}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Account control — visible at every breakpoint */}
            <div className="relative" ref={accountRef}>
              {user ? (
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-controls="account-menu"
                  className="inline-flex items-center gap-2 px-1.5 sm:pl-1.5 sm:pr-2.5 py-1.5 rounded-full hover:bg-[rgba(200,70,10,0.06)] text-[#1C1009] transition min-h-[40px]"
                >
                  <span className="w-7 h-7 rounded-full bg-[#8B2E05] text-white text-[11px] font-black flex items-center justify-center shrink-0" aria-hidden>
                    {initialsOf(user.name)}
                  </span>
                  <span className="hidden sm:inline text-sm font-bold max-w-[8rem] truncate">{user.name.split(' ')[0]}</span>
                  <svg className="w-3.5 h-3.5 hidden sm:block text-[#6B5545]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              ) : (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4A3728] hover:text-[#C8460A] px-2.5 py-2 rounded-lg hover:bg-[rgba(200,70,10,0.06)] transition min-h-[40px]"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'en' ? 'Sign in' : 'साइन इन'}</span>
                </Link>
              )}

              {user && accountOpen && (
                <div
                  id="account-menu"
                  role="menu"
                  aria-label={lang === 'en' ? 'Account' : 'खाता'}
                  className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-neutral-200 shadow-lg py-1.5 z-50"
                >
                  <div className="px-3.5 py-2 border-b border-neutral-100">
                    <p className="text-sm font-black text-[#1C1009] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#6B5545] truncate">{user.role}</p>
                  </div>
                  <Link href="/profile" role="menuitem" className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-[#1C1009] hover:bg-neutral-50 hover:text-[#C8460A] min-h-[44px]">
                    <UserIcon className="w-4 h-4 text-[#C8460A]" />
                    {lang === 'en' ? 'My account' : 'मेरा खाता'}
                  </Link>
                  <Link href="/tracker" role="menuitem" className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-[#1C1009] hover:bg-neutral-50 hover:text-[#C8460A] min-h-[44px]">
                    <TruckIcon className="w-4 h-4 text-[#C8460A]" />
                    {t.navTracker}
                  </Link>
                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <button
                      onClick={signOut}
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 min-h-[44px] text-left"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      {lang === 'en' ? 'Sign out' : 'साइन आउट'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={openCart}
              className="relative p-2.5 rounded-lg hover:bg-[rgba(200,70,10,0.08)] text-[#1C1009] transition min-h-[44px] min-w-[44px]"
              aria-label={
                count > 0
                  ? `${t.navProducts} — ${count} item${count === 1 ? '' : 's'} in cart, open cart`
                  : 'Open cart (empty)'
              }
            >
              <CartIcon className="w-5 h-5" />
              {count > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 bg-[#C8460A] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  {count}
                </span>
              )}
            </button>

            <a
              href={WHATSAPP_ENQUIRY}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition min-h-[44px]"
            >
              <MessageIcon className="w-4 h-4" />
              {t.whatsappQuote}
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-md hover:bg-neutral-100 min-h-[44px] min-w-[44px]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="lg:hidden bg-white border-b border-[rgba(200,70,10,0.12)] px-4 py-3 space-y-1 shadow-md"
            aria-label="Mobile navigation"
          >
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive(pathname, l.href) ? 'page' : undefined}
                className={`block font-semibold py-2.5 px-1 rounded hover:bg-neutral-50 min-h-[44px] ${
                  isActive(pathname, l.href) ? 'text-[#C8460A]' : 'text-[#1C1009] hover:text-[#C8460A]'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-neutral-100 pt-1">
              <Link
                href="/tracker"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 font-semibold py-2.5 px-1 min-h-[44px] ${
                  isActive(pathname, '/tracker') ? 'text-[#C8460A]' : 'text-[#C8460A]'
                }`}
              >
                <TruckIcon className="w-4 h-4" /> {t.navTracker}
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 font-semibold text-[#1C1009] py-2.5 px-1 min-h-[44px]"
              >
                <UserIcon className="w-4 h-4" /> {user ? (lang === 'en' ? 'My Account' : 'मेरा खाता') : (lang === 'en' ? 'Sign in / Profile' : 'साइन इन / प्रोफ़ाइल')}
              </Link>
              {user && (
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-2 font-semibold text-red-700 py-2.5 px-1 min-h-[44px] text-left"
                >
                  <LogoutIcon className="w-4 h-4" /> {lang === 'en' ? 'Sign out' : 'साइन आउट'}
                </button>
              )}
              <a
                href={WHATSAPP_ENQUIRY}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-semibold text-[#15803d] py-2.5 px-1 min-h-[44px]"
              >
                <MessageIcon className="w-4 h-4" /> {t.whatsappQuote}
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
