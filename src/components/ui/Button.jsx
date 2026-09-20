import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-600 shadow-xs',
    secondary: 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200 focus:ring-stone-400',
    outline: 'border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 focus:ring-teal-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-xs',
    success: 'bg-green-700 text-white hover:bg-green-800 focus:ring-green-600 shadow-xs',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
