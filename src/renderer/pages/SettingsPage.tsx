/**
 * Settings Page
 * Application configuration and preferences.
 */

import React, { useState } from 'react';
import { Button } from '../components/common';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import type { AIMode, UserOrganizationPreferences } from '@/domain/types/ai';

export default function SettingsPage() {
    const { settings, updateSettings, resetSettings } = useSettings();
    const { theme, setTheme } = useTheme();
    const [showApiKey, setShowApiKey] = useState(false);

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

    const aiModes = [
        { value: 'quick' as const, label: '⚡ Quick', desc: 'Fast heuristics (< 1 sec)' },
        { value: 'smart' as const, label: '🧠 Smart', desc: '+ Duplicates, renames (2-5 sec)' },
        { value: 'deep' as const, label: '🔮 Deep', desc: '+ LLM analysis (10-30 sec)' },
    ];

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure your file organization preferences
                </p>
            </div>

            {/* AI Configuration */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    ✨ AI Organization
                </h2>

                <div className="space-y-6">
                    {/* Mode Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Analysis Mode
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {aiModes.map((mode) => (
                                <button
                                    key={mode.value}
                                    onClick={() => handleAIModeChange(mode.value)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${settings.aiMode === mode.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {mode.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {mode.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* OpenAI API Key */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            OpenAI API Key
                            <span className="text-xs text-slate-500 ml-2">
                                (Required for Deep mode)
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={settings.aiConfig?.apiKey || ''}
                                onChange={(e) => handleApiKeyChange(e.target.value)}
                                placeholder="sk-..."
                                className="input flex-1"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                {showApiKey ? '🙈 Hide' : '👁️ Show'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Get your API key from{' '}
                            <a
                                href="https://platform.openai.com/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-500 hover:underline"
                            >
                                platform.openai.com
                            </a>
                        </p>
                    </div>

                    {/* User Preferences */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Organization Style
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                    📁 Organization Style
                                </label>
                                <select
                                    value={settings.userPreferences?.organizationStyle || 'by-category'}
                                    onChange={(e) => handlePreferenceChange('organizationStyle', e.target.value)}
                                    className="input w-full"
                                >
                                    <option value="by-category">By Category (Documents, Images, etc.)</option>
                                    <option value="by-date">By Date (Year/Month/Category)</option>
                                    <option value="by-type">By File Type (PDF, DOCX, etc.)</option>
                                    <option value="flat">Flat (No subfolders)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                    🤖 AI Source Preference
                                </label>
                                <select
                                    value={settings.userPreferences?.aiSourcePreference || 'heuristics-preferred'}
                                    onChange={(e) => handlePreferenceChange('aiSourcePreference', e.target.value)}
                                    className="input w-full"
                                >
                                    <option value="heuristics-only">Heuristics Only (Fast, consistent)</option>
                                    <option value="heuristics-preferred">Heuristics Preferred (Smart fallback)</option>
                                    <option value="llm-preferred">LLM Preferred (Better but slower)</option>
                                    <option value="llm-only">LLM Only (Requires API key)</option>
                                </select>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    Fine-tuning Options
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                    Cleanliness Level
                                </label>
                                <select
                                    value={settings.userPreferences?.cleanlinessLevel || 'moderate'}
                                    onChange={(e) => handlePreferenceChange('cleanlinessLevel', e.target.value)}
                                    className="input w-full"
                                >
                                    <option value="minimal">Minimal - Only essential moves</option>
                                    <option value="moderate">Moderate - Balanced approach</option>
                                    <option value="aggressive">Aggressive - Deep cleaning</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                    Safety Preference
                                </label>
                                <select
                                    value={settings.userPreferences?.safetyPreference || 'balanced'}
                                    onChange={(e) => handlePreferenceChange('safetyPreference', e.target.value)}
                                    className="input w-full"
                                >
                                    <option value="cautious">Cautious - Extra confirmations</option>
                                    <option value="balanced">Balanced - Normal safety</option>
                                    <option value="fast">Fast - Fewer prompts</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                    Access Priority
                                </label>
                                <select
                                    value={settings.userPreferences?.accessPriority || 'organized'}
                                    onChange={(e) => handlePreferenceChange('accessPriority', e.target.value)}
                                    className="input w-full"
                                >
                                    <option value="recent">Recent files first</option>
                                    <option value="frequent">Frequently used first</option>
                                    <option value="organized">Well-organized structure</option>
                                </select>
                            </div>
                        </div>
                    </div>
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
                                    {t === 'system' && '💻 System'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Behavior */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    ⚙️ Behavior
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Old File Threshold (days)
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            Files older than this will be suggested for archiving.
                        </p>
                        <input
                            type="number"
                            value={settings.oldFileThresholdDays}
                            onChange={(e) => handleThresholdChange(parseInt(e.target.value) || 30)}
                            min={1}
                            max={365}
                            className="input w-32"
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Preview by Default
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Always show preview before applying changes
                            </p>
                        </div>
                        <button
                            onClick={() => handlePreviewToggle(!settings.previewByDefault)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.previewByDefault
                                ? 'bg-primary-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.previewByDefault ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Google Drive */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    ☁️ Google Drive
                </h2>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Configure via environment variables:
                    </p>
                    <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono overflow-x-auto">
                        {`GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret`}
                    </pre>
                </div>
            </div>

            {/* Reset */}
            <div className="card p-6 border-red-200 dark:border-red-900/50">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                    🗑️ Reset Settings
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Reset all settings to their default values. This will not affect your rules.
                </p>

                <Button onClick={resetSettings} variant="danger">
                    Reset to Defaults
                </Button>
            </div>

            {/* Version info */}
            <div className="text-center py-4 text-sm text-slate-400">
                <p>Smart File Organizer v1.0.0</p>
                <p>Built with Electron + React + TypeScript</p>
            </div>
        </div>
    );
}
