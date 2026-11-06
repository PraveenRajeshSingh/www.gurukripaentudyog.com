'use client';

import React, { useId } from 'react';

const baseInput =
  'w-full min-h-[48px] px-3.5 py-2.5 border rounded-lg text-base bg-white text-ink-primary placeholder:text-ink-tertiary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition disabled:opacity-60 disabled:bg-surface-muted';

const labelCls = 'block text-sm font-bold text-ink-secondary mb-1';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  requiredMark?: boolean;
}

/** Text / number / tel / email input with accessible label + error. */
export function TextField({
  label,
  error,
  hint,
  requiredMark,
  id,
  className = '',
  ...rest
}: FieldProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="min-w-0">
      <label htmlFor={fieldId} className={labelCls}>
        {label}
        {requiredMark || rest.required ? (
          <span className="text-semantic-danger" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>
      <input
        id={fieldId}
        className={[
          baseInput,
          error ? 'border-semantic-danger' : 'border-neutral-300',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-tertiary mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-semantic-danger text-xs mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  requiredMark?: boolean;
}

export function TextArea({
  label,
  error,
  requiredMark,
  id,
  className = '',
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="min-w-0">
      <label htmlFor={fieldId} className={labelCls}>
        {label}
        {requiredMark || rest.required ? (
          <span className="text-semantic-danger" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>
      <textarea
        id={fieldId}
        className={[
          baseInput,
          'min-h-[88px]',
          error ? 'border-semantic-danger' : 'border-neutral-300',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-semantic-danger text-xs mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  requiredMark?: boolean;
  children: React.ReactNode;
}

export function SelectField({
  label,
  error,
  requiredMark,
  id,
  className = '',
  children,
  ...rest
}: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="min-w-0">
      <label htmlFor={fieldId} className={labelCls}>
        {label}
        {requiredMark || rest.required ? (
          <span className="text-semantic-danger" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>
      <select
        id={fieldId}
        className={[
          baseInput,
          error ? 'border-semantic-danger' : 'border-neutral-300',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-semantic-danger text-xs mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export { baseInput as inputCls, labelCls };
