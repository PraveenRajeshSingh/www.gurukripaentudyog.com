import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
}

const padCls = {
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-5 sm:p-8',
};

/** Surface container for interactive or content blocks (not decorative chrome). */
export default function Card({
  children,
  className = '',
  padding = 'md',
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      className={[
        'bg-surface-card border border-neutral-200 rounded-xl shadow-sm',
        padCls[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}
