import React from 'react';

type Tone = 'success' | 'error' | 'warning' | 'info';

const toneCls: Record<Tone, string> = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-amber-50 border-amber-300 text-amber-950',
  info: 'bg-sky-50 border-sky-200 text-sky-950',
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/** Inline success / error / warning / info banner — replaces ad-hoc alert boxes. */
export default function Alert({ tone = 'info', title, children, className = '' }: AlertProps) {
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={[
        'rounded-lg border p-3 sm:p-3.5 text-sm',
        toneCls[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {title && <strong className="block font-bold mb-0.5">{title}</strong>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
