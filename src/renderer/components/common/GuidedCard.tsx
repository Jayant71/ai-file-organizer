/**
 * Guided Card Component
 * A card with step-by-step guidance and visual cues.
 */

import React from 'react';

interface GuidedCardProps {
    stepNumber?: number;
    title: string;
    description: string;
    icon?: string;
    isActive?: boolean;
    isCompleted?: boolean;
    children?: React.ReactNode;
    hint?: string;
    className?: string;
}

export default function GuidedCard({
    stepNumber,
    title,
    description,
    icon,
    isActive = false,
    isCompleted = false,
    children,
    hint,
    className = '',
}: GuidedCardProps) {
    return (
        <div
            className={`
                relative card p-5 transition-all duration-300
                ${isActive
                    ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/10'
                    : isCompleted
                        ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                        : ''
                }
                ${className}
            `}
        >
            {/* Pulse animation for active step */}
            {isActive && (
                <div className="absolute -inset-px rounded-xl bg-primary-500/20 animate-pulse pointer-events-none" />
            )}

            <div className="relative">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    {/* Step number or icon */}
                    <div
                        className={`
                            flex items-center justify-center w-12 h-12 rounded-xl text-lg
                            ${isCompleted
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : isActive
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }
                        `}
                    >
                        {isCompleted ? (
                            '✓'
                        ) : icon ? (
                            icon
                        ) : stepNumber ? (
                            <span className="font-bold">{stepNumber}</span>
                        ) : null}
                    </div>

                    <div className="flex-1">
                        <h3 className={`
                            text-lg font-semibold 
                            ${isActive
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-slate-800 dark:text-slate-200'
                            }
                        `}>
                            {title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {children && (
                    <div className="mt-4">
                        {children}
                    </div>
                )}

                {/* Hint */}
                {hint && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <span className="text-lg">💡</span>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                {hint}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
