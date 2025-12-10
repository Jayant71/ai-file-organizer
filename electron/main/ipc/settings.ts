/**
 * Settings IPC Handlers
 * 
 * Manages application settings persistence using electron-store.
 */

import { ipcMain } from 'electron';
import Store from 'electron-store';
import { IPC_CHANNELS, DEFAULT_SETTINGS, AppSettings } from '../../../src/services/config';

// Settings store
const settingsStore = new Store<AppSettings>({
  name: 'settings',
  defaults: DEFAULT_SETTINGS,
});

/**
 * Register settings IPC handlers.
 */
export function registerSettingsHandlers(): void {
  // Get all settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settingsStore.store;
  });

  // Update settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, settings: Partial<AppSettings>) => {
    for (const [key, value] of Object.entries(settings)) {
      settingsStore.set(key as keyof AppSettings, value);
    }

    // Mark first run as complete
    if (settingsStore.get('firstRun')) {
      settingsStore.set('firstRun', false);
    }
  });

  // Reset to defaults
  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    settingsStore.clear();
    settingsStore.store = DEFAULT_SETTINGS;
  });
}

// Export for use in other modules
export { settingsStore };
