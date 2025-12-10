/**
 * Top Bar Component
 * Shows theme toggle and Google account status.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DriveAuthState } from '@/domain/types/drive';

const pageTitles: Record<string, string> = {
    '/local': 'Local File Organizer',
    '/drive': 'Google Drive Organizer',
    '/rules': 'Organization Rules',
    '/settings': 'Settings',
};

export default function TopBar() {
    const location = useLocation();
    const { theme, setTheme, effectiveTheme } = useTheme();
    const [driveAuth, setDriveAuth] = useState<DriveAuthState>({ isAuthenticated: false });

    const pageTitle = pageTitles[location.pathname] || 'Smart File Organizer';

    // Load Drive auth state
    useEffect(() => {
        const loadAuthState = async () => {
            try {
                if (window.electronAPI) {
                    const state = await window.electronAPI.getDriveAuthState();
                    setDriveAuth(state);
                }
            } catch (error) {
                console.error('Failed to load auth state:', error);
            }
        };

        loadAuthState();
    }, [location.pathname]);

    const cycleTheme = () => {
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const getThemeIcon = () => {
        if (theme === 'system') return '💻';
        return effectiveTheme === 'dark' ? '🌙' : '☀️';
    };

    return (
        <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Page title */}
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {pageTitle}
            </h2>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Theme toggle */}
                <button
                    onClick={cycleTheme}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={`Theme: ${theme}`}
                >
                    <span className="text-lg">{getThemeIcon()}</span>
                </button>

                {/* Google Account status */}
                {location.pathname === '/drive' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {driveAuth.isAuthenticated ? (
                            <>
                                {driveAuth.photoUrl ? (
                                    <img
                                        src={driveAuth.photoUrl}
                                        alt={driveAuth.displayName || 'User'}
                                        className="w-6 h-6 rounded-full"
                                    />
                                ) : (
                                    <span className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                                        {driveAuth.displayName?.[0] || driveAuth.email?.[0] || '?'}
                                    </span>
                                )}
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {driveAuth.displayName || driveAuth.email || 'Connected'}
                                </span>
                                <span className="badge badge-success">Connected</span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm text-slate-500">Not connected</span>
                                <span className="badge badge-warning">Sign in</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
