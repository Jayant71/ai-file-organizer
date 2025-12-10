/**
 * Google Drive Organizer Page
 * Manage and organize files in Google Drive.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, LoadingSpinner, EmptyState } from '../components/common';
import { DriveFile, DriveAuthState } from '@/domain/types/drive';
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
    const [error, setError] = useState<string | null>(null);

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

        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            const response = await window.electronAPI.listDriveFiles({
                folderId,
                pageSize: 100,
            });

            setFiles(response.files);
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
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
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

            {/* Coming soon notice */}
            <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🚧</span>
                    <div>
                        <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                            Coming Soon
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            Rule-based organization for Google Drive is coming in the next update.
                            For now, you can browse your files here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
