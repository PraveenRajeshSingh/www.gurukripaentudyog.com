'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../providers/CartProvider';
import { translations } from '../../lib/translations';
import {
  CartIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  MessageIcon,
  FlameIcon,
} from '../ui/icons';

const WHATSAPP_ENQUIRY =
  'https://wa.me/919198923230?text=Hello%20Gurukripa%20Ent%20Udyog,%20I%20would%20like%20a%20rate%20quote%20for%20bricks.';
const LANG_KEY = 'gk_web_lang';

interface SessionUser {
  name: string;
  role: string;
}

export default function Navbar() {
  const { count, openCart } = useCart();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const t = translations[lang];

  // Restore language preference and check the real server session.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored === 'hi' || stored === 'en') setLang(stored);
    } catch {}
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.user) setUser({ name: json.user.name, role: json.user.role });
      })
      .catch(() => {});
  }, []);

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {}
  };

  const navLinks = [
    { href: '/', label: t.navHome },
    { href: '/products', label: t.navProducts },
    { href: '/#estimator', label: t.navEstimator },
    { href: '/about', label: t.navAbout },
    { href: '/services', label: t.navServices },
    { href: '/contact', label: t.navContact },
  ];

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
              <Link key={l.href} href={l.href} className="hover:text-[#C8460A] transition">
                {l.label}
              </Link>
            ))}
            <Link href="/tracker" className="hover:text-[#C8460A] transition flex items-center gap-1.5">
              <TruckIcon className="w-4 h-4 text-[#C8460A]" />
              {t.navTracker}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#4A3728] hover:text-[#C8460A] px-2.5 py-2 rounded-lg hover:bg-[rgba(200,70,10,0.06)] transition min-h-[40px]"
            >
              <UserIcon className="w-4 h-4" />
              <span className="max-w-[10rem] truncate">
                {user ? user.name.split(' ')[0] : lang === 'en' ? 'Sign in' : 'साइन इन'}
              </span>
            </Link>

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
                className="block font-semibold text-[#1C1009] py-2.5 px-1 rounded hover:text-[#C8460A] hover:bg-neutral-50 min-h-[44px]"
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-neutral-100 pt-1">
              <Link
                href="/tracker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 font-semibold text-[#C8460A] py-2.5 px-1 min-h-[44px]"
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
