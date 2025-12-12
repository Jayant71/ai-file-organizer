/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI instead of white screen.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                        <div className="text-center">
                            <span className="text-4xl mb-4 block">⚠️</span>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                                An error occurred while rendering this page.
                            </p>
                            {this.state.error && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4 text-left">
                                    <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={this.handleReset}
                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
