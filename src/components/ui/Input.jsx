import React from 'react';

export function Input({ label, error, helperText, className = '', id, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-stone-900 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-stone-900 placeholder-stone-400 text-sm shadow-xs outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-stone-50 disabled:text-stone-500 ${
          error ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20' : 'border-stone-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
    </div>
  );
}

export function Textarea({ label, error, helperText, className = '', id, rows = 4, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-stone-900 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-stone-900 placeholder-stone-400 text-sm shadow-xs outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-stone-50 disabled:text-stone-500 ${
          error ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20' : 'border-stone-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
    </div>
  );
}

export function Select({ label, error, helperText, children, className = '', id, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-stone-900 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-stone-900 text-sm shadow-xs outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-stone-50 disabled:text-stone-500 ${
          error ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20' : 'border-stone-300'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {helperText && !error && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
    </div>
  );
}

export default Input;


