import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  align?: 'left' | 'center';
}

/**
 * Consistent page intro — one eyebrow, one headline, one support line.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = 'left',
}: PageHeaderProps) {
  return (
    <div
      className={[
        'mb-6 sm:mb-8 max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow && (
        <span className="inline-block text-xs font-bold text-brand uppercase tracking-wider mb-2">
          {eyebrow}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-primary tracking-tight text-balance">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm sm:text-base text-ink-tertiary leading-relaxed text-pretty">
          {description}
        </p>
      )}
      {actions && (
        <div
          className={[
            'mt-4 flex flex-wrap gap-3',
            align === 'center' ? 'justify-center' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
