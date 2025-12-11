/**
 * Preload Script
 * 
 * Exposes safe IPC methods to the renderer process via contextBridge.
 * This is the ONLY way for the React app to communicate with Node.js APIs.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../src/services/config';

/**
 * Type definitions for the exposed API.
 */
export interface ElectronAPI {
  // Filesystem operations
  selectFolder: () => Promise<string | null>;
  scanFolder: (folderPath: string, options?: { includeSubdirectories?: boolean }) => Promise<any[]>;
  moveFile: (sourcePath: string, destPath: string) => Promise<{ success: boolean; error?: string }>;
  renameFile: (filePath: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  createFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  checkPathExists: (path: string) => Promise<boolean>;
  readFileSample: (filePath: string, maxBytes?: number) => Promise<{ success: boolean; content?: string | null; error?: string }>;

  // Google Drive operations
  driveAuth: () => Promise<{ success: boolean; error?: string }>;
  driveLogout: () => Promise<void>;
  getDriveAuthState: () => Promise<any>;
  listDriveFiles: (options: any) => Promise<any>;
  moveDriveFile: (options: any) => Promise<any>;
  createDriveFolder: (name: string, parentId?: string) => Promise<any>;

  // Settings
  getSettings: () => Promise<any>;
  setSettings: (settings: any) => Promise<void>;
  resetSettings: () => Promise<void>;

  // App info
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
}

// Expose the API to the renderer
const api: ElectronAPI = {
  // Filesystem operations
  selectFolder: () => ipcRenderer.invoke(IPC_CHANNELS.FS_SELECT_FOLDER),
  scanFolder: (folderPath, options) => ipcRenderer.invoke(IPC_CHANNELS.FS_SCAN_FOLDER, folderPath, options),
  moveFile: (sourcePath, destPath) => 
    ipcRenderer.invoke(IPC_CHANNELS.FS_MOVE_FILE, sourcePath, destPath),
  renameFile: (filePath, newName) => 
    ipcRenderer.invoke(IPC_CHANNELS.FS_RENAME_FILE, filePath, newName),
  createFolder: (folderPath) => 
    ipcRenderer.invoke(IPC_CHANNELS.FS_CREATE_FOLDER, folderPath),
  checkPathExists: (path) => 
    ipcRenderer.invoke(IPC_CHANNELS.FS_CHECK_PATH_EXISTS, path),
  readFileSample: (filePath, maxBytes) => 
    ipcRenderer.invoke(IPC_CHANNELS.FS_READ_FILE_SAMPLE, filePath, maxBytes),

  // Google Drive operations
  driveAuth: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_AUTH),
  driveLogout: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_LOGOUT),
  getDriveAuthState: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_GET_AUTH_STATE),
  listDriveFiles: (options) => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_LIST_FILES, options),
  moveDriveFile: (options) => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_MOVE_FILE, options),
  createDriveFolder: (name, parentId) => 
    ipcRenderer.invoke(IPC_CHANNELS.DRIVE_CREATE_FOLDER, name, parentId),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  resetSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET),

  // App info
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  getPlatform: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PLATFORM),
};

// Expose in the main world
contextBridge.exposeInMainWorld('electronAPI', api);

// Type declaration for global access
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
