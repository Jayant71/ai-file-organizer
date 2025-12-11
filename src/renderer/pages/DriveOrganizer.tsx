/**
 * Google Drive Organizer Page
 * Manage and organize files in Google Drive.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, LoadingSpinner, EmptyState } from '../components/common';
import PreviewPanel from '../components/file-table/PreviewPanel';
import { useRules } from '../context/RulesContext';
import { DriveFile, DriveAuthState, DriveChange, driveFileToFileMeta } from '@/domain/types/drive';
import { FileChange, FileMeta } from '@/domain/types/file';
import { RuleEngine } from '@/domain/rule-engine';
import { getAISuggestions } from '@/services/ai-suggestion';
import { formatFileSize, formatDate } from '@/services/config';

export default function DriveOrganizer() {
    const [authState, setAuthState] = useState<DriveAuthState>({ isAuthenticated: false });
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }>({
        id: 'root',
        name: 'My Drive',
    });
    const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
        { id: 'root', name: 'My Drive' },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Organization state
    const [changes, setChanges] = useState<FileChange[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [operationLog, setOperationLog] = useState<any[]>([]);

    // Folder cache for organization (maps folder name to ID)
    const [folderCache, setFolderCache] = useState<Map<string, string>>(new Map());

    const { getEnabledRules } = useRules();

    // Check auth state on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (window.electronAPI) {
                    const state = await window.electronAPI.getDriveAuthState();
                    setAuthState(state);
                    if (state.isAuthenticated) {
                        loadFiles('root');
                    }
                }
            } catch (err: any) {
                console.error('Failed to check auth:', err);
            }
        };
        checkAuth();
    }, []);

    // Load files from Drive
    const loadFiles = useCallback(async (folderId: string) => {
        setIsLoading(true);
        setError(null);
        setChanges([]);
        setShowPreview(false);

        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            const response = await window.electronAPI.listDriveFiles({
                folderId,
                pageSize: 100,
            });

            setFiles(response.files);

            // Build folder cache for the current folder
            const cache = new Map<string, string>();
            response.files.forEach((f: DriveFile) => {
                if (f.isFolder) {
                    cache.set(f.name, f.id);
                }
            });
            setFolderCache(cache);
        } catch (err: any) {
            setError(`Failed to load files: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Authenticate with Google
    const handleAuth = useCallback(async () => {
        setIsAuthenticating(true);
        setError(null);

        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            const result = await window.electronAPI.driveAuth();

            if (result.success) {
                const state = await window.electronAPI.getDriveAuthState();
                setAuthState(state);
                loadFiles('root');
            } else {
                setError(result.error || 'Authentication failed');
            }
        } catch (err: any) {
            setError(`Authentication failed: ${err.message}`);
        } finally {
            setIsAuthenticating(false);
        }
    }, [loadFiles]);

    // Logout
    const handleLogout = useCallback(async () => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.driveLogout();
                setAuthState({ isAuthenticated: false });
                setFiles([]);
                setCurrentFolder({ id: 'root', name: 'My Drive' });
                setFolderPath([{ id: 'root', name: 'My Drive' }]);
                setChanges([]);
            }
        } catch (err: any) {
            console.error('Logout failed:', err);
        }
    }, []);

    // Navigate to folder
    const handleNavigate = useCallback(
        (folder: DriveFile) => {
            if (!folder.isFolder) return;

            const newPath = [...folderPath, { id: folder.id, name: folder.name }];
            setFolderPath(newPath);
            setCurrentFolder({ id: folder.id, name: folder.name });
            loadFiles(folder.id);
        },
        [folderPath, loadFiles]
    );

    // Navigate to breadcrumb
    const handleBreadcrumb = useCallback(
        (index: number) => {
            const newPath = folderPath.slice(0, index + 1);
            setFolderPath(newPath);
            const target = newPath[newPath.length - 1];
            setCurrentFolder(target);
            loadFiles(target.id);
        },
        [folderPath, loadFiles]
    );

    // Get current path string
    const getCurrentPathString = () => {
        return folderPath.map(f => f.name).join('/');
    };

    // Run rules on Drive files
    const handleRunRules = useCallback(() => {
        const enabledRules = getEnabledRules('drive');

        if (enabledRules.length === 0) {
            setError('No enabled rules for Google Drive. Create and enable rules with scope "drive" or "both".');
            return;
        }

        // Convert Drive files to FileMeta format
        const fileOnlyFiles = files.filter(f => !f.isFolder);
        const filesMeta: FileMeta[] = fileOnlyFiles.map(f =>
            driveFileToFileMeta(f, getCurrentPathString())
        );

        const engine = new RuleEngine(enabledRules);
        const result = engine.preview(filesMeta, { scope: 'drive' });

        // Convert to FileChange format with Drive-specific data
        const driveChanges: FileChange[] = result.changes.map(change => ({
            ...change,
            // Store the Drive file ID in the file object for later use
            file: {
                ...change.file,
                id: fileOnlyFiles.find(f => f.name === change.file.name)?.id || change.file.id,
            }
        }));

        setChanges(driveChanges);
        setShowPreview(true);
    }, [files, getEnabledRules, folderPath]);

    // Run AI suggestions on Drive files
    const handleAISuggestions = useCallback(async () => {
        const fileOnlyFiles = files.filter(f => !f.isFolder);
        if (fileOnlyFiles.length === 0) return;

        setIsGeneratingAI(true);
        setError(null);

        setTimeout(async () => {
            try {
                const filesMeta: FileMeta[] = fileOnlyFiles.map(f =>
                    driveFileToFileMeta(f, getCurrentPathString())
                );

                const baseFolder = getCurrentPathString();
                const suggestions = await getAISuggestions(filesMeta, baseFolder);

                const aiChanges: FileChange[] = suggestions.map((s) => {
                    const driveFile = fileOnlyFiles.find(f => f.id === s.fileId);
                    const file = filesMeta.find((f) => f.id === s.fileId);
                    if (!file || !driveFile) return null;

                    return {
                        file: {
                            ...file,
                            id: driveFile.id, // Keep Drive ID
                        },
                        currentPath: file.path,
                        currentName: file.name,
                        proposedPath: s.proposedPath,
                        proposedName: file.name,
                        matchedRule: `AI: ${s.reason}`,
                        matchedRuleId: 'ai-suggestion',
                        selected: s.selected,
                        status: 'pending' as const,
                    };
                }).filter((c): c is FileChange => c !== null);

                setChanges(aiChanges);
                setShowPreview(true);
            } catch (err: any) {
                setError(`AI suggestions failed: ${err.message}`);
            } finally {
                setIsGeneratingAI(false);
            }
        }, 50);
    }, [files, folderPath]);

    // Toggle change selection
    const handleToggleChange = useCallback((index: number) => {
        setChanges((prev) =>
            prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
        );
    }, []);

    // Toggle all changes
    const handleToggleAll = useCallback((selected: boolean) => {
        setChanges((prev) => prev.map((c) => ({ ...c, selected })));
    }, []);

    // Create folder if it doesn't exist
    const ensureFolderExists = useCallback(async (folderName: string, parentId: string): Promise<string | null> => {
        try {
            if (!window.electronAPI) return null;

            // Check cache first
            if (folderCache.has(folderName)) {
                return folderCache.get(folderName)!;
            }

            // Create the folder
            const result = await window.electronAPI.createDriveFolder(folderName, parentId);
            if (result.success && result.folder) {
                const newId = result.folder.id;
                setFolderCache(prev => new Map(prev).set(folderName, newId));
                return newId;
            }
            return null;
        } catch (err) {
            console.error('Error creating folder:', err);
            return null;
        }
    }, [folderCache]);

    // Apply selected changes
    const handleApply = useCallback(async () => {
        const selectedChanges = changes.filter((c) => c.selected);
        if (selectedChanges.length === 0) {
            setError('No changes selected to apply.');
            return;
        }

        setIsApplying(true);
        const log: any[] = [];

        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            for (const change of selectedChanges) {
                try {
                    // Parse the proposed path to get target folder
                    const pathParts = change.proposedPath.split('/');
                    const targetFolderName = pathParts[pathParts.length - 2] || 'Organized';

                    // Ensure target folder exists
                    let targetFolderId = folderCache.get(targetFolderName);
                    if (!targetFolderId) {
                        targetFolderId = await ensureFolderExists(targetFolderName, currentFolder.id);
                    }

                    if (!targetFolderId) {
                        throw new Error(`Failed to create folder: ${targetFolderName}`);
                    }

                    // Move the file
                    const result = await window.electronAPI.moveDriveFile({
                        fileId: change.file.id,
                        currentParentId: currentFolder.id,
                        newParentId: targetFolderId,
                    });

                    log.push({
                        id: change.file.id,
                        timestamp: new Date(),
                        operation: 'move',
                        sourcePath: change.currentPath,
                        destinationPath: change.proposedPath,
                        success: result.success,
                        errorMessage: result.error,
                        source: 'drive',
                    });

                    setChanges((prev) =>
                        prev.map((c) =>
                            c.file.id === change.file.id
                                ? {
                                    ...c,
                                    status: result.success ? 'success' : 'error',
                                    errorMessage: result.error,
                                }
                                : c
                        )
                    );
                } catch (err: any) {
                    log.push({
                        id: change.file.id,
                        timestamp: new Date(),
                        operation: 'move',
                        sourcePath: change.currentPath,
                        destinationPath: change.proposedPath,
                        success: false,
                        errorMessage: err.message,
                        source: 'drive',
                    });

                    setChanges((prev) =>
                        prev.map((c) =>
                            c.file.id === change.file.id
                                ? { ...c, status: 'error', errorMessage: err.message }
                                : c
                        )
                    );
                }
            }

            setOperationLog((prev) => [...prev, ...log]);

            // Reload files after applying changes
            setTimeout(() => loadFiles(currentFolder.id), 500);
        } catch (err: any) {
            setError(`Failed to apply changes: ${err.message}`);
        } finally {
            setIsApplying(false);
        }
    }, [changes, currentFolder, folderCache, ensureFolderExists, loadFiles]);

    // File type icon
    const getFileIcon = (file: DriveFile) => {
        if (file.isFolder) return '📁';
        if (file.mimeType.includes('image')) return '🖼️';
        if (file.mimeType.includes('video')) return '🎬';
        if (file.mimeType.includes('audio')) return '🎵';
        if (file.mimeType.includes('pdf')) return '📕';
        if (file.mimeType.includes('spreadsheet')) return '📊';
        if (file.mimeType.includes('document')) return '📄';
        if (file.mimeType.includes('presentation')) return '📽️';
        return '📄';
    };

    // Count files (not folders)
    const fileCount = files.filter(f => !f.isFolder).length;

    // Not authenticated view
    if (!authState.isAuthenticated) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Google Drive Organizer
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Connect your Google account to organize Drive files
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                <div className="card p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <span className="text-6xl mb-6 block">☁️</span>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            Connect to Google Drive
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Sign in with your Google account to view and organize your Drive
                            files. We only request permissions to view and move files.
                        </p>
                        <Button
                            onClick={handleAuth}
                            isLoading={isAuthenticating}
                            size="lg"
                        >
                            {isAuthenticating ? 'Connecting...' : '🔗 Connect Google Account'}
                        </Button>
                        <p className="text-xs text-slate-400 mt-4">
                            Note: You'll need to configure Google API credentials first.
                            See the README for setup instructions.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated view
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Google Drive Organizer
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Browse and organize your Drive files
                    </p>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                    Disconnect
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span>❌</span>
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-500 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 overflow-x-auto">
                {folderPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                        {index > 0 && <span>/</span>}
                        <button
                            onClick={() => handleBreadcrumb(index)}
                            className={`px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 truncate max-w-[150px] ${index === folderPath.length - 1
                                ? 'text-slate-900 dark:text-white font-medium'
                                : ''
                                }`}
                        >
                            {folder.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Stats & Actions */}
            {!isLoading && files.length > 0 && (
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Files
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {fileCount}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Folders
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {files.length - fileCount}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleRunRules}
                                variant="primary"
                                disabled={isGeneratingAI || fileCount === 0}
                            >
                                ⚙️ Run Rules
                            </Button>
                            <Button
                                onClick={handleAISuggestions}
                                variant="secondary"
                                isLoading={isGeneratingAI}
                                disabled={isGeneratingAI || fileCount === 0}
                            >
                                {isGeneratingAI ? 'Generating...' : '✨ AI Suggestions'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* File list */}
            <div className="card">
                {isLoading ? (
                    <div className="p-12">
                        <LoadingSpinner size="lg" text="Loading files..." />
                    </div>
                ) : files.length === 0 ? (
                    <EmptyState
                        icon="📂"
                        title="No files here"
                        description="This folder is empty."
                    />
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                onClick={() => file.isFolder && handleNavigate(file)}
                            >
                                <span className="text-2xl">{getFileIcon(file)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {file.isFolder
                                            ? 'Folder'
                                            : `${file.size ? formatFileSize(file.size) : 'Unknown size'}`}
                                        {' • '}
                                        {formatDate(file.modifiedTime)}
                                    </p>
                                </div>
                                {file.isFolder && (
                                    <span className="text-slate-400">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview panel */}
            {showPreview && changes.length > 0 && (
                <PreviewPanel
                    changes={changes}
                    onToggleChange={handleToggleChange}
                    onToggleAll={handleToggleAll}
                    onApply={handleApply}
                    onClose={() => setShowPreview(false)}
                    isApplying={isApplying}
                />
            )}

            {/* Operation log */}
            {operationLog.length > 0 && (
                <div className="card p-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        📋 Operation Log
                    </h3>
                    <div className="max-h-48 overflow-auto space-y-2">
                        {operationLog.map((log) => (
                            <div
                                key={log.id}
                                className={`p-2 rounded text-sm font-mono ${log.success
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                    }`}
                            >
                                {log.success ? '✓' : '✗'} {log.sourcePath} → {log.destinationPath}
                                {log.errorMessage && (
                                    <span className="block text-xs mt-1">{log.errorMessage}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
