/**
 * Electron Main Process Entry Point
 * 
 * Handles:
 * - Window creation and management
 * - IPC handler registration
 * - Application lifecycle
 */

// Load environment variables from .env file FIRST
import { config } from 'dotenv';
import path from 'path';

// Load .env from project root (go up from dist-electron/main)
config({ path: path.join(__dirname, '../../.env') });

import { app, BrowserWindow, shell } from 'electron';
import { registerFilesystemHandlers } from './ipc/filesystem';
import { registerGoogleDriveHandlers } from './ipc/google-drive';
import { registerSettingsHandlers } from './ipc/settings';

// Store reference to main window
let mainWindow: BrowserWindow | null = null;

// Environment checks
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Create the main application window.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Smart File Organizer',
    backgroundColor: '#0f172a', // Dark background while loading
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for some node APIs in preload
    },
    // Modern window style
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    show: false, // Show when ready
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Cleanup on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Register all IPC handlers.
 */
function registerIpcHandlers(): void {
  registerFilesystemHandlers();
  registerGoogleDriveHandlers();
  registerSettingsHandlers();
}

// Application lifecycle
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  // macOS: Re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    // Allow navigation to the app itself
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });
});

// Handle certificate errors in development
if (isDev) {
  app.on('certificate-error', (event, _, __, ___, ____, callback) => {
    event.preventDefault();
    callback(true);
  });
}

// Export for testing
export { createWindow, mainWindow };
