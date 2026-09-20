import React from 'react';

export function PageHeading({ title, description, actions, className = '' }) {
  return (
    <div className={`mb-8 md:flex md:items-center md:justify-between border-b border-stone-200/60 pb-5 ${className}`}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-stone-500">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export function SectionHeading({ title, description, actions, className = '' }) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeading;

