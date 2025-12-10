/**
 * Settings Page
 * Application configuration and preferences.
 */

import React from 'react';
import { Button } from '../components/common';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
    const { settings, updateSettings, resetSettings } = useSettings();
    const { theme, setTheme } = useTheme();

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
    };

    const handleThresholdChange = (days: number) => {
        updateSettings({ oldFileThresholdDays: days });
    };

    const handlePreviewToggle = (enabled: boolean) => {
        updateSettings({ previewByDefault: enabled });
    };

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
                            Files older than this will be considered "old" for age-based rules.
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

            {/* Google Drive (placeholder) */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    ☁️ Google Drive
                </h2>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        To use Google Drive features, you need to configure API credentials:
                    </p>
                    <ol className="mt-3 text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside space-y-1">
                        <li>Go to the Google Cloud Console</li>
                        <li>Create a new project or select existing</li>
                        <li>Enable the Google Drive API</li>
                        <li>Configure OAuth consent screen</li>
                        <li>Create OAuth 2.0 credentials</li>
                        <li>Set the environment variables:</li>
                    </ol>
                    <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono overflow-x-auto">
                        {`GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret`}
                    </pre>
                </div>
            </div>

            {/* AI Configuration (placeholder) */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    ✨ AI Suggestions
                </h2>

                <div className="p-4 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <strong>Current Mode:</strong> Heuristic-based suggestions
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        AI suggestions currently use smart heuristics to suggest file organization.
                        Support for external AI models (OpenAI, Claude, etc.) is coming in a future update.
                    </p>
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
