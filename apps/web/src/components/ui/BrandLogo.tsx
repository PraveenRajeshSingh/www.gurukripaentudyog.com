import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  size?: number;
  className?: string;
  /** Decorative when parent already names the brand. */
  decorative?: boolean;
}

/**
 * Shared brand mark — SVG works crisp on retina web and Capacitor shells.
 */
export default function BrandLogo({
  size = 40,
  className = '',
  decorative = true,
}: BrandLogoProps) {
  return (
    <span
      className={[
        'relative inline-flex shrink-0 overflow-hidden rounded-[22%] shadow-sm ring-1 ring-brand/15 bg-brand',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/logo-new.svg"
        alt={decorative ? '' : 'Gurukripa Ent Udyog'}
        width={size}
        height={size}
        className="object-cover"
        priority={size >= 40}
      />
    </span>
  );
}
