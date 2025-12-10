/**
 * Application Configuration Service
 * 
 * Manages application settings and defaults.
 * Settings are persisted using electron-store.
 */

import type { AIMode, UserOrganizationPreferences } from '@/domain/types/ai';

/**
 * Application settings structure.
 */
export interface AppSettings {
  /** Default folders to scan */
  defaultFolders: string[];
  /** Number of days to consider a file "old" */
  oldFileThresholdDays: number;
  /** Whether to show preview before applying changes */
  previewByDefault: boolean;
  /** UI theme */
  theme: 'light' | 'dark' | 'system';
  /** Whether this is the first run */
  firstRun: boolean;
  /** AI organization mode */
  aiMode: AIMode;
  /** User organization preferences */
  userPreferences: UserOrganizationPreferences;
  /** AI service configuration */
  aiConfig: {
    provider: 'heuristic' | 'openai' | 'anthropic' | 'local-llm';
    endpoint?: string;
    apiKey?: string;
    model?: string;
  };
}

/**
 * Default application settings.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  defaultFolders: [],
  oldFileThresholdDays: 30,
  previewByDefault: true,
  theme: 'system',
  firstRun: true,
  aiMode: 'smart',
  userPreferences: {
    cleanlinessLevel: 'moderate',
    safetyPreference: 'balanced',
    accessPriority: 'organized',
    organizationStyle: 'by-category',
    aiSourcePreference: 'heuristics-preferred',
  },
  aiConfig: {
    provider: 'heuristic',
  },
};

/**
 * File size constants for UI display.
 */
export const FILE_SIZE_UNITS = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
};

/**
 * Common folder paths by platform.
 */
export const COMMON_FOLDERS = {
  windows: {
    downloads: '%USERPROFILE%\\\\Downloads',
    desktop: '%USERPROFILE%\\\\Desktop',
    documents: '%USERPROFILE%\\\\Documents',
  },
  macos: {
    downloads: '~/Downloads',
    desktop: '~/Desktop',
    documents: '~/Documents',
  },
  linux: {
    downloads: '~/Downloads',
    desktop: '~/Desktop',
    documents: '~/Documents',
  },
};

/**
 * IPC channel names for main <-> renderer communication.
 */
export const IPC_CHANNELS = {
  // Filesystem operations
  FS_SELECT_FOLDER: 'fs:select-folder',
  FS_SCAN_FOLDER: 'fs:scan-folder',
  FS_MOVE_FILE: 'fs:move-file',
  FS_RENAME_FILE: 'fs:rename-file',
  FS_CREATE_FOLDER: 'fs:create-folder',
  FS_CHECK_PATH_EXISTS: 'fs:check-path-exists',
  FS_READ_FILE_SAMPLE: 'fs:read-file-sample',

  // Google Drive operations
  DRIVE_AUTH: 'drive:auth',
  DRIVE_LOGOUT: 'drive:logout',
  DRIVE_GET_AUTH_STATE: 'drive:get-auth-state',
  DRIVE_LIST_FILES: 'drive:list-files',
  DRIVE_MOVE_FILE: 'drive:move-file',
  DRIVE_CREATE_FOLDER: 'drive:create-folder',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',

  // App
  APP_GET_VERSION: 'app:get-version',
  APP_GET_PLATFORM: 'app:get-platform',
};

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < FILE_SIZE_UNITS.KB) {
    return `${bytes} B`;
  }
  if (bytes < FILE_SIZE_UNITS.MB) {
    return `${(bytes / FILE_SIZE_UNITS.KB).toFixed(1)} KB`;
  }
  if (bytes < FILE_SIZE_UNITS.GB) {
    return `${(bytes / FILE_SIZE_UNITS.MB).toFixed(1)} MB`;
  }
  return `${(bytes / FILE_SIZE_UNITS.GB).toFixed(2)} GB`;
}

/**
 * Format a date to a relative or absolute string.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  if (days < 30) {
    return `${Math.floor(days / 7)} weeks ago`;
  }
  
  return d.toLocaleDateString();
}
