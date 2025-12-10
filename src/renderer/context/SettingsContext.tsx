/**
 * Settings Context
 * Manages application settings with Electron store persistence.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '@/services/config';

interface SettingsContextType {
    settings: AppSettings;
    isLoading: boolean;
    updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
    resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from electron store
    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (window.electronAPI) {
                    const stored = await window.electronAPI.getSettings();
                    if (stored) {
                        setSettings(stored);
                    }
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
        try {
            const newSettings = { ...settings, ...updates };
            setSettings(newSettings);

            if (window.electronAPI) {
                await window.electronAPI.setSettings(updates);
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    }, [settings]);

    const resetSettings = useCallback(async () => {
        try {
            setSettings(DEFAULT_SETTINGS);
            if (window.electronAPI) {
                await window.electronAPI.resetSettings();
            }
        } catch (error) {
            console.error('Failed to reset settings:', error);
            throw error;
        }
    }, []);

    return (
        <SettingsContext.Provider
            value={{ settings, isLoading, updateSettings, resetSettings }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
