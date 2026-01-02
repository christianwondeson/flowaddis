/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the component tree and displays
 * a fallback UI instead of crashing the entire application.
 */

'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<FallbackProps>;
}

/**
 * Default error fallback UI
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-red-900 mb-2">
                    Something went wrong
                </h2>

                <p className="text-red-700 mb-4 text-sm">
                    {error.message || 'An unexpected error occurred'}
                </p>

                <Button
                    onClick={resetErrorBoundary}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try again
                </Button>

                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 text-left">
                        <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                            Error details (dev only)
                        </summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}

/**
 * Error logging function
 */
function logError(error: Error, errorInfo: React.ErrorInfo) {
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    console.error('Error caught by boundary:', error, errorInfo);

    // TODO: Send to error tracking service
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
}

/**
 * Error Boundary wrapper component
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
    return (
        <ReactErrorBoundary
            FallbackComponent={fallback || ErrorFallback}
            onError={logError}
            onReset={() => {
                // Reset any state that might have caused the error
                window.location.reload();
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}
