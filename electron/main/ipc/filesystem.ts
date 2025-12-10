/**
 * Filesystem IPC Handlers
 * 
 * Handles all filesystem operations:
 * - Folder selection dialogs
 * - Recursive folder scanning
 * - File moving and renaming
 * - Folder creation
 */

import { ipcMain, dialog, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { lookup } from 'mime-types';
import { IPC_CHANNELS } from '../../../src/services/config';
import { FileMeta } from '../../../src/domain/types/file';

/**
 * Register all filesystem IPC handlers.
 */
export function registerFilesystemHandlers(): void {
  // Select folder dialog
  ipcMain.handle(IPC_CHANNELS.FS_SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Folder to Organize',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Scan folder with options
  ipcMain.handle(
    IPC_CHANNELS.FS_SCAN_FOLDER,
    async (_, folderPath: string, options?: { includeSubdirectories?: boolean }) => {
      try {
        const includeSubdirs = options?.includeSubdirectories ?? true;
        const maxDepth = includeSubdirs ? 10 : 0;
        const files = await scanFolderRecursive(folderPath, maxDepth);
        return files;
      } catch (error) {
        console.error('Error scanning folder:', error);
        throw error;
      }
    }
  );

  // Move file
  ipcMain.handle(
    IPC_CHANNELS.FS_MOVE_FILE,
    async (_, sourcePath: string, destPath: string) => {
      try {
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });

        // Handle name conflicts
        let finalDestPath = destPath;
        let counter = 1;
        while (await pathExists(finalDestPath)) {
          const ext = path.extname(destPath);
          const nameWithoutExt = path.basename(destPath, ext);
          finalDestPath = path.join(destDir, `${nameWithoutExt}_${counter}${ext}`);
          counter++;
        }

        // Try rename first (fastest for same-device moves)
        try {
          await fs.rename(sourcePath, finalDestPath);
        } catch (renameError: any) {
          // If EXDEV (cross-device), use copy + delete
          if (renameError.code === 'EXDEV') {
            await fs.copyFile(sourcePath, finalDestPath);
            await fs.unlink(sourcePath);
          } else {
            throw renameError;
          }
        }

        return { success: true, finalPath: finalDestPath };
      } catch (error: any) {
        console.error('Error moving file:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Rename file
  ipcMain.handle(
    IPC_CHANNELS.FS_RENAME_FILE,
    async (_, filePath: string, newName: string) => {
      try {
        const dir = path.dirname(filePath);
        const newPath = path.join(dir, newName);

        // Handle name conflicts
        let finalPath = newPath;
        let counter = 1;
        while (await pathExists(finalPath)) {
          const ext = path.extname(newName);
          const nameWithoutExt = path.basename(newName, ext);
          finalPath = path.join(dir, `${nameWithoutExt}_${counter}${ext}`);
          counter++;
        }

        await fs.rename(filePath, finalPath);

        return { success: true, finalPath };
      } catch (error: any) {
        console.error('Error renaming file:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Create folder
  ipcMain.handle(IPC_CHANNELS.FS_CREATE_FOLDER, async (_, folderPath: string) => {
    try {
      await fs.mkdir(folderPath, { recursive: true });
      return { success: true };
    } catch (error: any) {
      console.error('Error creating folder:', error);
      return { success: false, error: error.message };
    }
  });

  // Check if path exists
  ipcMain.handle(IPC_CHANNELS.FS_CHECK_PATH_EXISTS, async (_, checkPath: string) => {
    return pathExists(checkPath);
  });

  // Get app version
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  // Get platform
  ipcMain.handle(IPC_CHANNELS.APP_GET_PLATFORM, () => {
    return process.platform;
  });
}

/**
 * Check if a path exists.
 */
async function pathExists(checkPath: string): Promise<boolean> {
  try {
    await fs.access(checkPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively scan a folder and collect file metadata.
 */
async function scanFolderRecursive(
  folderPath: string,
  maxDepth: number = 10,
  currentDepth: number = 0
): Promise<FileMeta[]> {
  const files: FileMeta[] = [];

  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);

      try {
        const stats = await fs.stat(fullPath);
        const extension = path.extname(entry.name).toLowerCase();
        const mimeType = lookup(fullPath) || 'application/octet-stream';

        const fileMeta: FileMeta = {
          id: crypto.randomUUID(),
          path: fullPath,
          name: entry.name,
          extension,
          size: stats.size,
          createdTime: stats.birthtime,
          modifiedTime: stats.mtime,
          mimeType,
          isDirectory: entry.isDirectory(),
          source: 'local',
          parentPath: folderPath,
        };

        files.push(fileMeta);

        // Recurse into directories only if within depth limit
        // maxDepth 0 = current folder only (no recursion)
        // maxDepth 1 = current + 1 level of subdirectories
        if (entry.isDirectory() && currentDepth < maxDepth) {
          const subFiles = await scanFolderRecursive(
            fullPath,
            maxDepth,
            currentDepth + 1
          );
          files.push(...subFiles);
        }
      } catch (statError) {
        // Skip files we can't access
        console.warn(`Could not access: ${fullPath}`, statError);
      }
    }
  } catch (readError) {
    console.error(`Error reading directory: ${folderPath}`, readError);
    throw readError;
  }

  return files;
}
