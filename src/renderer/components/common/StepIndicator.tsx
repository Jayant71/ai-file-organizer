/**
 * Step Indicator Component
 * Shows progress through a multi-step workflow.
 */

import React from 'react';

interface Step {
    id: number;
    label: string;
    description?: string;
    icon?: string;
}

interface StepIndicatorProps {
    steps: Step[];
    currentStep: number;
    onStepClick?: (step: number) => void;
    orientation?: 'horizontal' | 'vertical';
}

export default function StepIndicator({
    steps,
    currentStep,
    onStepClick,
    orientation = 'horizontal',
}: StepIndicatorProps) {
    const isHorizontal = orientation === 'horizontal';

    return (
        <div className={`${isHorizontal ? 'flex items-center justify-between' : 'flex flex-col gap-4'}`}>
            {steps.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isActive = step.id === currentStep;
                const isClickable = onStepClick && (isCompleted || step.id <= currentStep);

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={`flex ${isHorizontal ? 'flex-col items-center' : 'items-start gap-4'} ${isClickable ? 'cursor-pointer' : ''
                                }`}
                            onClick={() => isClickable && onStepClick?.(step.id)}
                        >
                            {/* Step circle */}
                            <div
                                className={`
                                    flex items-center justify-center w-10 h-10 rounded-full 
                                    text-sm font-semibold transition-all duration-300
                                    ${isCompleted
                                        ? 'bg-green-500 text-white'
                                        : isActive
                                            ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/50'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }
                                `}
                            >
                                {isCompleted ? (
                                    <span className="text-lg">✓</span>
                                ) : step.icon ? (
                                    <span className="text-lg">{step.icon}</span>
                                ) : (
                                    step.id
                                )}
                            </div>

                            {/* Step label */}
                            <div className={`${isHorizontal ? 'mt-2 text-center' : ''}`}>
                                <p
                                    className={`text-sm font-medium ${isActive
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : isCompleted
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    {step.label}
                                </p>
                                {step.description && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div
                                className={`
                                    ${isHorizontal
                                        ? 'flex-1 h-0.5 mx-4'
                                        : 'ml-5 w-0.5 h-8'
                                    }
                                    ${step.id < currentStep
                                        ? 'bg-green-500'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                    }
                                    transition-colors duration-300
                                `}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
