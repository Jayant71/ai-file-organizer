/**
 * Theme Context
 * Manages light/dark mode across the application.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

    // Detect system preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateEffectiveTheme = () => {
            if (theme === 'system') {
                setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setEffectiveTheme(theme);
            }
        };

        updateEffectiveTheme();
        mediaQuery.addEventListener('change', updateEffectiveTheme);

        return () => mediaQuery.removeEventListener('change', updateEffectiveTheme);
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [effectiveTheme]);

    // Load saved theme
    useEffect(() => {
        const loadTheme = async () => {
            try {
                if (window.electronAPI) {
                    const settings = await window.electronAPI.getSettings();
                    if (settings?.theme) {
                        setTheme(settings.theme);
                    }
                }
            } catch (error) {
                console.error('Failed to load theme:', error);
            }
        };
        loadTheme();
    }, []);

    // Save theme changes
    const handleSetTheme = async (newTheme: Theme) => {
        setTheme(newTheme);
        try {
            if (window.electronAPI) {
                await window.electronAPI.setSettings({ theme: newTheme });
            }
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme: handleSetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
