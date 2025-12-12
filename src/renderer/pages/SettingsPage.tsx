/**
 * Settings Page
 * Application configuration with crystal-clear explanations for non-technical users.
 */

import React, { useState } from 'react';
import { Button, HelpIcon } from '../components/common';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import type { AIMode, UserOrganizationPreferences } from '@/domain/types/ai';

export default function SettingsPage() {
    const { settings, updateSettings, resetSettings } = useSettings();
    const { theme, setTheme } = useTheme();
    const [showApiKey, setShowApiKey] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
    };

    const handleThresholdChange = (days: number) => {
        updateSettings({ oldFileThresholdDays: days });
    };

    const handlePreviewToggle = (enabled: boolean) => {
        updateSettings({ previewByDefault: enabled });
    };

    const handleAIModeChange = (mode: AIMode) => {
        updateSettings({ aiMode: mode });
    };

    const handleApiKeyChange = (apiKey: string) => {
        updateSettings({
            aiConfig: {
                ...settings.aiConfig,
                apiKey,
                provider: apiKey ? 'openai' : 'heuristic',
            }
        });
    };

    const handlePreferenceChange = (key: keyof UserOrganizationPreferences, value: string) => {
        updateSettings({
            userPreferences: {
                ...settings.userPreferences,
                [key]: value,
            },
        });
    };

    // User-friendly AI mode descriptions with examples
    const aiModes = [
        {
            value: 'quick' as const,
            label: '⚡ Quick',
            time: 'Under 1 second',
            whatItDoes: 'Sorts files by their type (documents, images, etc.)',
            bestFor: 'When you just want basic sorting',
            example: 'report.pdf → Documents folder',
        },
        {
            value: 'smart' as const,
            label: '🧠 Smart',
            time: '2-5 seconds',
            whatItDoes: 'Sorts by type + finds duplicate files + suggests better names',
            bestFor: 'Most users (recommended)',
            example: 'IMG_1234.jpg → Photos/2024/January/',
            recommended: true,
        },
        {
            value: 'deep' as const,
            label: '🔮 Deep',
            time: '10-30 seconds',
            whatItDoes: 'Reads file contents to understand what\'s inside',
            bestFor: 'When you have many similar files',
            example: 'Understands that "Q4 Report" is a financial document',
            requiresApiKey: true,
        },
    ];

    // Organization styles with before/after examples
    const organizationStyles = [
        {
            value: 'by-category',
            label: '📁 By Category',
            description: 'Group files by what they are',
            before: ['report.pdf', 'photo.jpg', 'song.mp3', 'video.mp4'],
            after: {
                'Documents': ['report.pdf'],
                'Images': ['photo.jpg'],
                'Music': ['song.mp3'],
                'Videos': ['video.mp4'],
            }
        },
        {
            value: 'by-date',
            label: '📅 By Date',
            description: 'Organize by when files were created',
            before: ['photo1.jpg', 'photo2.jpg', 'doc.pdf'],
            after: {
                '2024': {
                    'January': ['photo1.jpg'],
                    'March': ['photo2.jpg', 'doc.pdf'],
                }
            }
        },
        {
            value: 'by-type',
            label: '📝 By Extension',
            description: 'Group by file extension (.pdf, .jpg, etc.)',
            before: ['file1.pdf', 'file2.pdf', 'image.jpg'],
            after: {
                'PDF Files': ['file1.pdf', 'file2.pdf'],
                'JPG Images': ['image.jpg'],
            }
        },
        {
            value: 'flat',
            label: '📄 No Folders',
            description: 'Keep everything in one place, just rename files',
            before: ['IMG_1234.jpg', 'Document (1).pdf'],
            after: ['Photo_2024-01-15.jpg', 'Report_January.pdf'],
        },
    ];

    // Thoroughness levels with examples
    const cleanlinessLevels = [
        {
            value: 'minimal',
            label: '🪶 Light Touch',
            description: 'Only move clearly misplaced files',
            example: 'Moves downloads to proper folders, leaves everything else',
            movePercentage: '~20% of files',
        },
        {
            value: 'moderate',
            label: '⚖️ Balanced',
            description: 'Standard organization',
            example: 'Moves most files, keeps recent items in place',
            movePercentage: '~50% of files',
            recommended: true,
        },
        {
            value: 'aggressive',
            label: '🧹 Deep Clean',
            description: 'Organize everything possible',
            example: 'Moves all files to proper locations, nothing left behind',
            movePercentage: '~80% of files',
        },
    ];

    const selectedOrgStyle = organizationStyles.find(s => s.value === (settings.userPreferences?.organizationStyle || 'by-category'));

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    ⚙️ Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Customize how your files get organized
                </p>
            </div>

            {/* SECTION 1: Analysis Speed */}
            <div className="card p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        ⚡ Analysis Speed
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        How long should the app spend analyzing your files?
                    </p>
                </div>

                <div className="space-y-3">
                    {aiModes.map((mode) => (
                        <button
                            key={mode.value}
                            onClick={() => handleAIModeChange(mode.value)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${settings.aiMode === mode.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                        >
                            {mode.recommended && (
                                <span className="absolute -top-2 right-4 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                    Recommended
                                </span>
                            )}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {mode.label}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">
                                            {mode.time}
                                        </span>
                                        {mode.requiresApiKey && (
                                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-700 dark:text-amber-400">
                                                Requires API Key
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>What it does:</strong> {mode.whatItDoes}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                        <strong>Best for:</strong> {mode.bestFor}
                                    </p>
                                </div>
                            </div>

                            {/* Example */}
                            <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-medium">Example:</span> {mode.example}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* SECTION 2: Organization Style */}
            <div className="card p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        📁 Organization Style
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        How should your files be grouped into folders?
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    {organizationStyles.map((style) => (
                        <button
                            key={style.value}
                            onClick={() => handlePreferenceChange('organizationStyle', style.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${settings.userPreferences?.organizationStyle === style.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                        >
                            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                {style.label}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {style.description}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Visual Example of Selected Style */}
                {selectedOrgStyle && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            📋 What this looks like:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Before */}
                            <div>
                                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 uppercase">
                                    ❌ Before (messy)
                                </p>
                                <div className="space-y-1">
                                    {selectedOrgStyle.before.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span>📄</span> {file}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* After */}
                            <div>
                                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 uppercase">
                                    ✅ After (organized)
                                </p>
                                <div className="space-y-1 text-sm">
                                    {typeof selectedOrgStyle.after === 'object' && !Array.isArray(selectedOrgStyle.after) ? (
                                        Object.entries(selectedOrgStyle.after).map(([folder, files]) => (
                                            <div key={folder}>
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                                    <span>📁</span> {folder}/
                                                </div>
                                                {Array.isArray(files) ? (
                                                    files.map((file, i) => (
                                                        <div key={i} className="ml-6 text-slate-500 dark:text-slate-400">
                                                            └ {file}
                                                        </div>
                                                    ))
                                                ) : (
                                                    Object.entries(files as Record<string, string[]>).map(([subfolder, subfiles]) => (
                                                        <div key={subfolder}>
                                                            <div className="ml-4 text-slate-600 dark:text-slate-400">
                                                                └ 📁 {subfolder}/
                                                            </div>
                                                            {subfiles.map((file, i) => (
                                                                <div key={i} className="ml-10 text-slate-500 dark:text-slate-500">
                                                                    └ {file}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        (selectedOrgStyle.after as string[]).map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <span>📄</span> {file}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 3: How Thorough */}
            <div className="card p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        🧹 How Thorough?
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        How many files should be moved and organized?
                    </p>
                </div>

                <div className="space-y-3">
                    {cleanlinessLevels.map((level) => (
                        <button
                            key={level.value}
                            onClick={() => handlePreferenceChange('cleanlinessLevel', level.value)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${settings.userPreferences?.cleanlinessLevel === level.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                        >
                            {level.recommended && (
                                <span className="absolute -top-2 right-4 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                    Recommended
                                </span>
                            )}
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {level.label}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {level.description}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                        {level.example}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <span className="text-sm font-medium px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">
                                        {level.movePercentage}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Visual indicator */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                        <span>💡</span>
                        <span>
                            <strong>Tip:</strong> Start with "Balanced" first. You can always run it again with "Deep Clean" if you want more organization.
                        </span>
                    </p>
                </div>
            </div>

            {/* Appearance */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    🎨 Appearance
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Theme
                        </label>
                        <div className="flex gap-2">
                            {(['light', 'dark', 'system'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => handleThemeChange(t)}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${theme === t
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    {t === 'light' && '☀️ Light'}
                                    {t === 'dark' && '🌙 Dark'}
                                    {t === 'system' && '💻 Match System'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Safety Settings */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    🛡️ Safety
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Always Preview First
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Show what will change before making any moves
                            </p>
                        </div>
                        <button
                            onClick={() => handlePreviewToggle(!settings.previewByDefault)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.previewByDefault
                                ? 'bg-green-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.previewByDefault ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            Files are only moved, never deleted
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-2">
                            <span className="text-green-500">✓</span>
                            You can always move files back manually
                        </p>
                    </div>
                </div>
            </div>

            {/* Advanced Settings (Collapsible) */}
            <div className="card overflow-hidden">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span>🔧</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            Advanced Settings (Optional)
                        </span>
                    </div>
                    <span className={`text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>

                {showAdvanced && (
                    <div className="p-6 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-6">
                        {/* OpenAI API Key */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                AI API Key (for "Deep" analysis only)
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                ⚠️ Most users don't need this. Only required if you selected "Deep" analysis above.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={settings.aiConfig?.apiKey || ''}
                                    onChange={(e) => handleApiKeyChange(e.target.value)}
                                    placeholder="sk-... (leave empty for Quick or Smart mode)"
                                    className="input flex-1"
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    {showApiKey ? '🙈 Hide' : '👁️ Show'}
                                </button>
                            </div>
                        </div>

                        {/* Old File Threshold */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Archive files older than
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                Files not modified in this many days may be suggested for archiving
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.oldFileThresholdDays}
                                    onChange={(e) => handleThresholdChange(parseInt(e.target.value) || 30)}
                                    min={1}
                                    max={365}
                                    className="input w-24"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400">days</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reset */}
            <div className="card p-6 border-red-200 dark:border-red-900/50">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    🔄 Reset Everything
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Go back to default settings. This won't affect your saved rules or move any files.
                </p>

                <Button onClick={resetSettings} variant="danger">
                    Reset to Defaults
                </Button>
            </div>

            {/* Version info */}
            <div className="text-center py-4 text-sm text-slate-400">
                <p>Smart File Organizer v1.0.0</p>
            </div>
        </div>
    );
}
