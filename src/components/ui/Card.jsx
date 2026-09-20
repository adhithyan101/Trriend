import React from 'react';

export function Card({ children, className = '', header, footer, padding = 'p-6', ...props }) {
  return (
    <div
      className={`bg-white border border-stone-200 rounded-xl shadow-xs text-stone-900 ${className}`}
      {...props}
    >
      {header && (
        <div className="border-b border-stone-100 px-6 py-4 font-semibold text-stone-900">
          {header}
        </div>
      )}
      <div className={padding}>{children}</div>
      {footer && (
        <div className="border-t border-stone-100 px-6 py-4 bg-stone-50/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
