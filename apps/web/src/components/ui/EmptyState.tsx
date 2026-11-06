import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/** Shared empty / zero-data presentation for lists, carts, and dashboards. */
export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="text-center py-10 sm:py-12 px-4 rounded-xl border border-dashed border-neutral-300 bg-surface-subtle/60">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
          {icon}
        </div>
      )}
      <p className="font-bold text-ink-primary text-sm sm:text-base">{title}</p>
      {description && (
        <p className="text-xs sm:text-sm text-ink-tertiary mt-1.5 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
