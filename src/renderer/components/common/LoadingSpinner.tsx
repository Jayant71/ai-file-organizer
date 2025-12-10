/**
 * Loading Spinner Component
 */

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} border-2 border-primary-500 border-t-transparent rounded-full animate-spin`}
            />
            {text && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
            )}
        </div>
    );
}
