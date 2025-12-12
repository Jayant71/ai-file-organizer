/**
 * Quick Start Component
 * Simplified one-click organization for non-technical users.
 */

import React, { useState } from 'react';
import { Button } from '../common';

interface QuickStartProps {
    onSelectMode: (mode: 'simple' | 'advanced') => void;
    onQuickOrganize: (preset: string) => void;
}

const presets = [
    {
        id: 'clean-downloads',
        icon: '📥',
        title: 'Clean Downloads',
        description: 'Sort your Downloads folder by file type',
        color: 'from-blue-500 to-cyan-500',
        popular: true,
    },
    {
        id: 'organize-desktop',
        icon: '🖥️',
        title: 'Tidy Desktop',
        description: 'Organize files scattered on your Desktop',
        color: 'from-purple-500 to-pink-500',
        popular: true,
    },
    {
        id: 'sort-photos',
        icon: '📸',
        title: 'Sort Photos',
        description: 'Organize photos into folders by date',
        color: 'from-green-500 to-emerald-500',
        popular: false,
    },
    {
        id: 'archive-old',
        icon: '📦',
        title: 'Archive Old Files',
        description: 'Move files older than 30 days to archive',
        color: 'from-orange-500 to-amber-500',
        popular: false,
    },
];

export default function QuickStart({ onSelectMode, onQuickOrganize }: QuickStartProps) {
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    👋 How would you like to organize your files?
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    Choose a quick preset or go advanced for full control
                </p>
            </div>

            {/* Quick presets */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    ⚡ Quick Presets — One Click Organization
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {presets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => setSelectedPreset(preset.id)}
                            className={`
                                relative p-5 rounded-xl text-left transition-all duration-200
                                border-2 
                                ${selectedPreset === preset.id
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                                }
                            `}
                        >
                            {preset.popular && (
                                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-400 text-xs font-bold text-amber-900 rounded-full">
                                    Popular
                                </span>
                            )}
                            <div className={`
                                w-12 h-12 rounded-lg bg-gradient-to-br ${preset.color} 
                                flex items-center justify-center text-2xl text-white mb-3
                            `}>
                                {preset.icon}
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                {preset.title}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {preset.description}
                            </p>
                        </button>
                    ))}
                </div>

                {selectedPreset && (
                    <div className="mt-4 flex justify-center">
                        <Button onClick={() => onQuickOrganize(selectedPreset)} size="lg">
                            🚀 Start Organizing
                        </Button>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-4 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500">
                        or
                    </span>
                </div>
            </div>

            {/* Advanced mode option */}
            <div className="text-center">
                <button
                    onClick={() => onSelectMode('advanced')}
                    className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <span>⚙️</span>
                    <span>I want full control — Show me all options</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );
}
