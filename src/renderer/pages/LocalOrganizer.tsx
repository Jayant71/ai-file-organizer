/**
 * Local File Organizer Page
 * Main page for organizing local files.
 */

import React, { useState, useCallback } from 'react';
import { Button, Modal, LoadingSpinner, EmptyState } from '../components/common';
import FileTable from '../components/file-table/FileTable';
import PreviewPanel from '../components/file-table/PreviewPanel';
import { useRules } from '../context/RulesContext';
import { useSettings } from '../context/SettingsContext';
import { FileMeta, FileChange /* OperationLogEntry */ } from '@/domain/types/file';
import { RuleEngine } from '@/domain/rule-engine';
import { getAISuggestions, aiSuggestionService } from '@/services/ai-suggestion';
import { formatFileSize } from '@/services/config';

export default function LocalOrganizer() {
    // State
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [files, setFiles] = useState<FileMeta[]>([]);
    const [changes, setChanges] = useState<FileChange[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiProgress, setAiProgress] = useState<string>('');
    const [includeSubdirectories, setIncludeSubdirectories] = useState(true);
    const [scanComplete, setScanComplete] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [operationLog, setOperationLog] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { rules, getEnabledRules } = useRules();
    const { settings } = useSettings();

    // Configure AI service when settings change
    React.useEffect(() => {
        if (settings.aiConfig?.apiKey) {
            aiSuggestionService.configure({ apiKey: settings.aiConfig.apiKey });
        }
    }, [settings.aiConfig?.apiKey]);

    // Select folder
    const handleSelectFolder = useCallback(async () => {
        try {
            if (!window.electronAPI) {
                setError('Electron API not available. Running in browser mode.');
                return;
            }

            const folder = await window.electronAPI.selectFolder();
            if (folder) {
                setSelectedFolders((prev) =>
                    prev.includes(folder) ? prev : [...prev, folder]
                );
                setFiles([]);
                setScanComplete(false);
                setChanges([]);
            }
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    // Remove folder
    const handleRemoveFolder = useCallback((folder: string) => {
        setSelectedFolders((prev) => prev.filter((f) => f !== folder));
        setFiles([]);
        setScanComplete(false);
        setChanges([]);
    }, []);

    // Scan folders
    const handleScan = useCallback(async () => {
        if (selectedFolders.length === 0) {
            setError('Please select at least one folder to scan.');
            return;
        }

        setIsScanning(true);
        setError(null);
        setScanComplete(false);
        setFiles([]);
        setChanges([]);

        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            const allFiles: FileMeta[] = [];
            for (const folder of selectedFolders) {
                const scanned = await window.electronAPI.scanFolder(folder, {
                    includeSubdirectories
                });
                // Filter out directories for the file list
                const filesOnly = scanned.filter((f: FileMeta) => !f.isDirectory);
                allFiles.push(...filesOnly);
            }

            setFiles(allFiles);
            setScanComplete(true);
        } catch (err: any) {
            setError(`Failed to scan folders: ${err.message}`);
        } finally {
            setIsScanning(false);
        }
    }, [selectedFolders, includeSubdirectories]);

    // Run rules (preview)
    const handleRunRules = useCallback(() => {
        const enabledRules = getEnabledRules('local');

        if (enabledRules.length === 0) {
            setError('No enabled rules for local files. Create and enable rules first.');
            return;
        }

        const engine = new RuleEngine(enabledRules);
        const result = engine.preview(files, { scope: 'local' });

        setChanges(result.changes);
        setShowPreview(true);
    }, [files, getEnabledRules]);

    // Run AI suggestions
    const handleAISuggestions = useCallback(async () => {
        if (files.length === 0) return;

        setIsGeneratingAI(true);
        setAiProgress('Starting AI analysis...');
        setError(null);

        // Use setTimeout to let the UI update before heavy processing
        setTimeout(async () => {
            try {
                const baseFolder = selectedFolders[0] || '';
                const mode = settings.aiMode || 'smart';

                const suggestions = await getAISuggestions(
                    files,
                    baseFolder,
                    mode,
                    settings.userPreferences,
                    (progress) => {
                        setAiProgress(progress.status);
                    }
                );

                // Convert suggestions to FileChange format
                const aiChanges: FileChange[] = suggestions.map((s) => {
                    const file = files.find((f) => f.id === s.fileId);
                    if (!file) return null;

                    // Include duplicate and source info in the reason
                    let reason = `AI (${s.source}): ${s.reason}`;
                    if (s.isDuplicate) {
                        reason += ' [DUPLICATE]';
                    }

                    return {
                        file,
                        currentPath: file.path,
                        currentName: file.name,
                        proposedPath: s.proposedPath,
                        proposedName: s.proposedName || file.name,
                        matchedRule: reason,
                        matchedRuleId: 'ai-suggestion',
                        selected: s.selected,
                        status: 'pending' as const,
                    };
                }).filter((c): c is FileChange => c !== null);

                setChanges(aiChanges);
                setShowPreview(true);
                setAiProgress('');
            } catch (err: any) {
                setError(`AI suggestions failed: ${err.message}`);
                setAiProgress('');
            } finally {
                setIsGeneratingAI(false);
            }
        }, 50);
    }, [files, selectedFolders, settings.aiMode, settings.userPreferences]);

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
                    const result = await window.electronAPI.moveFile(
                        change.currentPath,
                        change.proposedPath
                    );

                    log.push({
                        id: change.file.id,
                        timestamp: new Date(),
                        operation: 'move',
                        sourcePath: change.currentPath,
                        destinationPath: result.finalPath || change.proposedPath,
                        success: result.success,
                        errorMessage: result.error,
                        source: 'local',
                    });

                    // Update change status
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
                        source: 'local',
                    });
                }
            }

            setOperationLog((prev) => [...prev, ...log]);
        } catch (err: any) {
            setError(`Failed to apply changes: ${err.message}`);
        } finally {
            setIsApplying(false);
        }
    }, [changes]);

    // Stats
    const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + f.size, 0),
        pendingChanges: changes.filter((c) => c.selected && c.status === 'pending').length,
        successChanges: changes.filter((c) => c.status === 'success').length,
        errorChanges: changes.filter((c) => c.status === 'error').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Local File Organizer
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Scan and organize files on your computer
                    </p>
                </div>
            </div>

            {/* Error banner */}
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

            {/* Folder selection */}
            <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        📁 Folders to Organize
                    </h2>
                    <Button onClick={handleSelectFolder} variant="secondary" size="sm">
                        + Add Folder
                    </Button>
                </div>

                {selectedFolders.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                        <p className="mb-2">No folders selected</p>
                        <p className="text-sm">Click "Add Folder" to select folders to scan</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {selectedFolders.map((folder) => (
                            <div
                                key={folder}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            >
                                <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                                    {folder}
                                </span>
                                <button
                                    onClick={() => handleRemoveFolder(folder)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {selectedFolders.length > 0 && (
                    <div className="mt-4 flex items-center gap-4">
                        <Button
                            onClick={handleScan}
                            isLoading={isScanning}
                            disabled={isScanning}
                        >
                            {isScanning ? 'Scanning...' : '🔍 Scan Folders'}
                        </Button>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={includeSubdirectories}
                                onChange={(e) => setIncludeSubdirectories(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Include subdirectories
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* Scanning state */}
            {isScanning && (
                <div className="card p-8">
                    <LoadingSpinner size="lg" text="Scanning folders..." />
                </div>
            )}

            {/* File results */}
            {scanComplete && !isScanning && (
                <>
                    {/* Stats bar */}
                    <div className="card p-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Files Found
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.totalFiles.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Total Size
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {formatFileSize(stats.totalSize)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Pending
                                </p>
                                <p className="text-2xl font-bold text-amber-500">
                                    {stats.pendingChanges}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Completed
                                </p>
                                <p className="text-2xl font-bold text-green-500">
                                    {stats.successChanges}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Errors
                                </p>
                                <p className="text-2xl font-bold text-red-500">
                                    {stats.errorChanges}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button onClick={handleRunRules} variant="primary" disabled={isGeneratingAI}>
                            ⚙️ Run Rules (Preview)
                        </Button>
                        <Button
                            onClick={handleAISuggestions}
                            variant="secondary"
                            isLoading={isGeneratingAI}
                            disabled={isGeneratingAI}
                        >
                            {isGeneratingAI
                                ? (aiProgress || 'Generating...')
                                : `✨ AI (${settings.aiMode === 'quick' ? 'Quick' : settings.aiMode === 'deep' ? 'Deep' : 'Smart'})`
                            }
                        </Button>
                    </div>

                    {/* File table */}
                    {files.length > 0 ? (
                        <FileTable files={files} />
                    ) : (
                        <EmptyState
                            icon="📂"
                            title="No files found"
                            description="The selected folders don't contain any files."
                        />
                    )}
                </>
            )}

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
