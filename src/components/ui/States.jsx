import React from 'react';
import Card from './Card';
import Button from './Button';

export function LoadingState({ title = 'Loading...', description = 'Please wait while we retrieve the latest crisis data.' }) {
  return (
    <Card padding="p-8">
      <div className="flex flex-col items-center justify-center text-center py-6">
        <div className="relative flex items-center justify-center w-12 h-12 mb-4">
          <div className="absolute w-10 h-10 border-4 border-teal-100 rounded-full"></div>
          <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
        <p className="mt-1 text-xs text-stone-500 max-w-sm">{description}</p>
      </div>
    </Card>
  );
}

export function EmptyState({ icon = '📋', title = 'No records found', description = 'There are no active items listed in this section yet.', actionText, onAction }) {
  return (
    <Card padding="p-8">
      <div className="flex flex-col items-center justify-center text-center py-6">
        <div className="text-4xl mb-3 bg-stone-100 p-3 rounded-full">{icon}</div>
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
        <p className="mt-1 text-xs text-stone-500 max-w-sm">{description}</p>
        {actionText && onAction && (
          <div className="mt-5">
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionText}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ErrorState({ title = 'Service Disruption', description = 'Unable to communicate with the backend crisis network.', onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/70 p-5 text-red-900">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-950">{title}</h4>
          <p className="mt-1 text-xs text-red-700">{description}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-xs font-semibold text-red-800 underline hover:text-red-950"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
