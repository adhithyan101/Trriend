import React from 'react';

export function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  const variants = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200/80',
    normal: 'bg-teal-50 text-teal-800 border-teal-200/80',
    urgent: 'bg-amber-50 text-amber-800 border-amber-300/80 font-semibold',
    amber: 'bg-amber-50 text-amber-800 border-amber-300/80 font-semibold',
    critical: 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse',
    red: 'bg-red-50 text-red-700 border-red-200 font-bold',
    success: 'bg-green-50 text-green-800 border-green-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const normalized = (status || '').toLowerCase();

  if (normalized.includes('critical') || normalized.includes('immediate')) {
    return <Badge variant="critical" className={className}>🔴 {status}</Badge>;
  }
  if (normalized.includes('high') || normalized.includes('urgent')) {
    return <Badge variant="urgent" className={className}>⚡ {status}</Badge>;
  }
  if (normalized.includes('success') || normalized.includes('resolved') || normalized.includes('available')) {
    return <Badge variant="success" className={className}>✓ {status}</Badge>;
  }
  if (normalized.includes('medium') || normalized.includes('in progress')) {
    return <Badge variant="teal" className={className}>🔵 {status}</Badge>;
  }
  return <Badge variant="neutral" className={className}>{status}</Badge>;
}

export default Badge;
