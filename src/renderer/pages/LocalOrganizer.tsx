/**
 * Local File Organizer Page
 * Main page for organizing local files with AI/Rules modes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, LoadingSpinner, EmptyState, HelpIcon, GuidedCard, StepIndicator } from '../components/common';
import FileTable from '../components/file-table/FileTable';
import PreviewPanel from '../components/file-table/PreviewPanel';
import { WelcomeModal } from '../components/onboarding';
import { StructureAnalysis } from '../components/ai';
import { useFileOrganizer } from '../context/FileOrganizerContext';
import { useRules } from '../context/RulesContext';
import { useSettings } from '../context/SettingsContext';
import { FileMeta, FileChange } from '@/domain/types/file';
import { RuleEngine } from '@/domain/rule-engine';
import { getAISuggestions, aiSuggestionService } from '@/services/ai-suggestion';
import { formatFileSize } from '@/services/config';

// Workflow steps for the step indicator
const workflowSteps = [
    { id: 1, label: 'Select Folders', icon: '📁' },
    { id: 2, label: 'Scan Files', icon: '🔍' },
    { id: 3, label: 'Organize', icon: '✨' },
    { id: 4, label: 'Apply', icon: '✅' },
];

export default function LocalOrganizer() {
    // Use context for persistent state
    const {
        selectedFolders,
        includeSubdirectories,
        files,
        scanComplete,
        changes,
        showPreview,
        activeMode,
        isFirstVisit,
        structureSuggestions,
        operationLog,
        addFolder,
        removeFolder,
        setIncludeSubdirectories,
        setFiles,
        setScanComplete,
        setChanges,
        toggleChange,
        toggleAllChanges,
        setShowPreview,
        setActiveMode,
        setFirstVisit,
        saveStructureSuggestion,
        removeStructureSuggestion,
        addToLog,
    } = useFileOrganizer();

    // Local UI state
    const [isScanning, setIsScanning] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiProgress, setAiProgress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [aiSubMode, setAiSubMode] = useState<'quickOrganize' | 'structureAnalysis'>('quickOrganize');

    const { rules, getEnabledRules } = useRules();
    const { settings } = useSettings();

    // Show welcome on first visit
    useEffect(() => {
        if (isFirstVisit) {
            setShowWelcome(true);
        }
    }, [isFirstVisit]);

    // Configure AI service when settings change
    useEffect(() => {
        if (settings.aiConfig?.apiKey) {
            aiSuggestionService.configure({ apiKey: settings.aiConfig.apiKey });
        }
    }, [settings.aiConfig?.apiKey]);

    // Complete onboarding
    const handleOnboardingComplete = () => {
        setFirstVisit(false);
        setShowWelcome(false);
    };

    // Determine current step
    const getCurrentStep = () => {
        const changesArray = Array.isArray(changes) ? changes : [];
        const filesArray = Array.isArray(files) ? files : [];
        if (changesArray.length > 0 && showPreview) return 4;
        if (scanComplete && filesArray.length > 0) return 3;
        if (selectedFolders.length > 0) return 2;
        return 1;
    };

    // Navigate to a specific step
    const handleStepClick = (stepId: number) => {
        const current = getCurrentStep();
        if (stepId >= current) return; // Can only go back

        switch (stepId) {
            case 1: // Go back to folder selection
                setScanComplete(false);
                setFiles([]);
                setChanges([]);
                setShowPreview(false);
                break;
            case 2: // Go back to scan step
                setChanges([]);
                setShowPreview(false);
                break;
            case 3: // Go back to organize step
                setShowPreview(false);
                break;
        }
    };

    // Go back to previous step
    const handleGoBack = () => {
        const current = getCurrentStep();
        if (current > 1) {
            handleStepClick(current - 1);
        }
    };

    // Select folder
    const handleSelectFolder = useCallback(async () => {
        try {
            if (!window.electronAPI) {
                setError('This app needs to run as a desktop application. Please launch the installed version.');
                return;
            }

            const folder = await window.electronAPI.selectFolder();
            if (folder) {
                addFolder(folder);
                setError(null);
            }
        } catch (err: any) {
            setError(`Unable to select folder: ${err.message}`);
        }
    }, [addFolder]);

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
                throw new Error('Desktop API not available');
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
            setError(`Unable to scan folders: ${err.message}`);
        } finally {
            setIsScanning(false);
        }
    }, [selectedFolders, includeSubdirectories, setFiles, setScanComplete, setChanges]);

    // Run rules (for Rules mode)
    const handleRunRules = useCallback(() => {
        const enabledRules = getEnabledRules('local');

        if (enabledRules.length === 0) {
            setError('No rules created yet. Go to "My Rules" to create custom organization rules.');
            return;
        }

        const engine = new RuleEngine(enabledRules);
        const result = engine.preview(files, { scope: 'local' });

        setChanges(result.changes);
        setShowPreview(true);
    }, [files, getEnabledRules, setChanges, setShowPreview]);

    // Run AI suggestions (for AI mode - Quick Organize)
    const handleAISuggestions = useCallback(async () => {
        if (files.length === 0) return;

        setIsGeneratingAI(true);
        setAiProgress('Analyzing your files...');
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
                        // User-friendly progress messages
                        const friendlyMessages: Record<string, string> = {
                            'Starting analysis...': 'Looking at your files...',
                            'Categorizing files...': 'Sorting files by type...',
                            'Finding duplicates...': 'Checking for duplicate files...',
                            'Generating suggestions...': 'Creating organization suggestions...',
                        };
                        setAiProgress(friendlyMessages[progress.status] || progress.status);
                    }
                );

                // Convert suggestions to FileChange format
                const aiChanges: FileChange[] = suggestions.map((s) => {
                    const file = files.find((f) => f.id === s.fileId);
                    if (!file) return null;

                    // User-friendly reasons
                    let reason = s.reason;
                    if (s.isDuplicate) {
                        reason = '📋 Duplicate file detected';
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
                setError(`Could not generate suggestions: ${err.message}`);
                setAiProgress('');
            } finally {
                setIsGeneratingAI(false);
            }
        }, 50);
    }, [files, selectedFolders, settings.aiMode, settings.userPreferences, setChanges, setShowPreview]);

    // Apply selected changes
    const handleApply = useCallback(async () => {
        const selectedChanges = changes.filter((c) => c.selected);
        if (selectedChanges.length === 0) {
            setError('Please select at least one change to apply.');
            return;
        }

        setIsApplying(true);
        const log: any[] = [];

        try {
            if (!window.electronAPI) {
                throw new Error('Desktop API not available');
            }

            for (const change of selectedChanges) {
                try {
                    const result = await window.electronAPI.moveFile(
                        change.currentPath,
                        change.proposedPath
                    );

                    log.push({
                        id: change?.file?.id || 'unknown',
                        timestamp: new Date(),
                        operation: 'move',
                        sourcePath: change.currentPath,
                        destinationPath: result.finalPath || change.proposedPath,
                        success: result.success,
                        errorMessage: result.error,
                        source: 'local',
                    });

                    // Update change status
                    setChanges((prev: FileChange[]) =>
                        prev.map((c) =>
                            c?.file?.id === change?.file?.id
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
                        id: change?.file?.id || 'unknown',
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

            addToLog(log);

            // Show success message
            const successCount = log.filter(l => l.success).length;
            if (successCount > 0) {
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 5000);
            }
        } catch (err: any) {
            setError(`Unable to apply changes: ${err.message}`);
        } finally {
            setIsApplying(false);
        }
    }, [changes, setChanges, addToLog]);

    // Ensure changes is always an array
    const safeChanges = Array.isArray(changes) ? changes : [];
    const safeFiles = Array.isArray(files) ? files : [];

    // Stats
    const stats = {
        totalFiles: safeFiles.length,
        totalSize: safeFiles.reduce((acc, f) => acc + (f?.size || 0), 0),
        pendingChanges: safeChanges.filter((c) => c?.selected && c?.status === 'pending').length,
        successChanges: safeChanges.filter((c) => c?.status === 'success').length,
        errorChanges: safeChanges.filter((c) => c?.status === 'error').length,
    };

    const currentStep = getCurrentStep();
    const enabledRulesCount = rules.filter(r => r.enabled).length;

    return (
        <div className="space-y-6">
            {/* Welcome Modal */}
            <WelcomeModal
                isOpen={showWelcome}
                onComplete={handleOnboardingComplete}
            />

            {/* Success Toast */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 z-50 p-4 bg-green-500 text-white rounded-xl shadow-lg animate-slide-in-right flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                        <p className="font-semibold">Files organized successfully!</p>
                        <p className="text-sm opacity-90">{stats.successChanges} files moved</p>
                    </div>
                </div>
            )}

            {/* Header with Mode Toggle */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            📁 Local File Organizer
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Organize files on your computer
                        </p>
                    </div>

                    {/* Mode Toggle - AI vs Rules */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                            onClick={() => setActiveMode('ai')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeMode === 'ai'
                                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            ✨ AI Mode
                        </button>
                        <button
                            onClick={() => setActiveMode('rules')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeMode === 'rules'
                                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            📋 Rules Based
                            {enabledRulesCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                                    {enabledRulesCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress Steps - Clickable to go back */}
                <StepIndicator
                    steps={workflowSteps}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />

                {/* Back button hint */}
                {currentStep > 1 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                        💡 Click any completed step above to go back
                    </p>
                )}
            </div>

            {/* Error banner */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="flex-1">
                            <p className="font-medium text-red-700 dark:text-red-400">Something went wrong</p>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: Folder Selection */}
            <GuidedCard
                stepNumber={1}
                title="Select Folders to Organize"
                description="Choose which folders on your computer you want to clean up"
                isActive={currentStep === 1}
                isCompleted={currentStep > 1}
                hint={selectedFolders.length === 0 ? "Click 'Add Folder' to get started!" : undefined}
            >
                <div className="space-y-4">
                    {selectedFolders.length === 0 ? (
                        <div className="py-6 text-center">
                            <div className="text-4xl mb-3">📂</div>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                No folders selected yet
                            </p>
                            <Button onClick={handleSelectFolder} size="lg">
                                + Add Folder
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {selectedFolders.map((folder) => (
                                    <div
                                        key={folder}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📁</span>
                                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-md">
                                                {folder}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeFolder(folder)}
                                            className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove folder"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between">
                                <Button onClick={handleSelectFolder} variant="secondary" size="sm">
                                    + Add Another Folder
                                </Button>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={includeSubdirectories}
                                        onChange={(e) => setIncludeSubdirectories(e.target.checked)}
                                        className="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Include subfolders
                                    </span>
                                    <HelpIcon tooltip="When checked, we'll also look inside folders within your selected folders." />
                                </label>
                            </div>
                        </>
                    )}
                </div>
            </GuidedCard>

            {/* Step 2: Scan */}
            {selectedFolders.length > 0 && (
                <GuidedCard
                    stepNumber={2}
                    title="Scan Your Files"
                    description="We'll look through your files to see what's there"
                    isActive={currentStep === 2}
                    isCompleted={currentStep > 2}
                >
                    {isScanning ? (
                        <div className="py-8 text-center">
                            <LoadingSpinner size="lg" text="Scanning your files..." />
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                                This may take a moment for large folders
                            </p>
                        </div>
                    ) : scanComplete ? (
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <p className="font-medium text-green-700 dark:text-green-400">
                                        Scan complete!
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-300">
                                        Found {stats.totalFiles.toLocaleString()} files ({formatFileSize(stats.totalSize)})
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleScan}
                                variant="secondary"
                                size="sm"
                            >
                                🔄 Rescan
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <Button
                                onClick={handleScan}
                                size="lg"
                                disabled={selectedFolders.length === 0}
                            >
                                🔍 Scan Folders
                            </Button>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                                This will show you all files in the selected folders
                            </p>
                        </div>
                    )}
                </GuidedCard>
            )}

            {/* Step 3: Organize */}
            {scanComplete && files.length > 0 && (
                <GuidedCard
                    stepNumber={3}
                    title={activeMode === 'ai' ? 'AI Organization' : 'Apply Your Rules'}
                    description={activeMode === 'ai'
                        ? 'Let AI analyze and organize your files'
                        : `Apply your ${enabledRulesCount} custom rules`
                    }
                    isActive={currentStep === 3}
                    isCompleted={currentStep > 3}
                >
                    {activeMode === 'ai' ? (
                        // AI Mode Content
                        <div className="space-y-4">
                            {/* AI Sub-mode tabs */}
                            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setAiSubMode('quickOrganize')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${aiSubMode === 'quickOrganize'
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    ⚡ Quick Organize
                                </button>
                                <button
                                    onClick={() => setAiSubMode('structureAnalysis')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${aiSubMode === 'structureAnalysis'
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    🏗️ Structure Analysis
                                </button>
                            </div>

                            {aiSubMode === 'quickOrganize' ? (
                                // Quick Organize UI
                                isGeneratingAI ? (
                                    <div className="py-8 text-center">
                                        <LoadingSpinner size="lg" text={aiProgress || 'Analyzing...'} />
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                                            AI is figuring out the best way to organize your files
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl">
                                            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                What Quick Organize does:
                                            </h4>
                                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                                <li>✓ Sorts files by category (Documents, Images, etc.)</li>
                                                <li>✓ Finds duplicate files</li>
                                                <li>✓ Suggests better file names</li>
                                                <li>✓ You review everything before any files move</li>
                                            </ul>
                                        </div>
                                        <Button onClick={handleAISuggestions} size="lg" className="w-full">
                                            ✨ Generate AI Suggestions
                                        </Button>
                                    </div>
                                )
                            ) : (
                                // Structure Analysis UI
                                <StructureAnalysis
                                    files={files}
                                    sourceFolders={selectedFolders}
                                    onSaveSuggestion={saveStructureSuggestion}
                                    savedSuggestions={structureSuggestions}
                                    onRemoveSuggestion={removeStructureSuggestion}
                                    apiKey={settings.aiConfig?.apiKey}
                                    onApplyStructure={(structureChanges) => {
                                        setChanges(structureChanges);
                                        setShowPreview(true);
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        // Rules Mode Content
                        <div className="space-y-4">
                            {enabledRulesCount === 0 ? (
                                <div className="p-6 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div className="text-3xl mb-3">📋</div>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        You haven't created any rules yet
                                    </p>
                                    <Button
                                        variant="secondary"
                                        onClick={() => window.location.href = '#/rules'}
                                    >
                                        Create Rules →
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Active Rules ({enabledRulesCount}):
                                        </h4>
                                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                            {rules.filter(r => r.enabled).slice(0, 3).map(rule => (
                                                <li key={rule.id} className="flex items-center gap-2">
                                                    <span className="text-green-500">●</span>
                                                    {rule.name}
                                                </li>
                                            ))}
                                            {enabledRulesCount > 3 && (
                                                <li className="text-slate-500">
                                                    + {enabledRulesCount - 3} more...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                    <Button onClick={handleRunRules} size="lg" className="w-full">
                                        ⚙️ Run My Rules
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </GuidedCard>
            )}

            {/* File Table */}
            {scanComplete && files.length > 0 && !showPreview && (
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                            📋 Files Found
                        </h3>
                        <span className="text-sm text-slate-500">
                            {files.length} files
                        </span>
                    </div>
                    <FileTable files={files} />
                </div>
            )}

            {/* Preview panel */}
            {showPreview && changes.length > 0 && (
                <div className="space-y-4">
                    {/* Back button */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleGoBack}
                            size="sm"
                        >
                            ← Back to Organize
                        </Button>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Review changes before applying
                        </span>
                    </div>

                    <PreviewPanel
                        changes={changes}
                        onToggleChange={toggleChange}
                        onToggleAll={toggleAllChanges}
                        onApply={handleApply}
                        onClose={() => setShowPreview(false)}
                        isApplying={isApplying}
                    />
                </div>
            )}

            {/* Empty state for no files */}
            {scanComplete && files.length === 0 && (
                <EmptyState
                    icon="📂"
                    title="No files found"
                    description="The selected folders appear to be empty or only contain subfolders."
                />
            )}

            {/* Operation log */}
            {operationLog.length > 0 && (
                <div className="card p-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        📋 What Happened
                        <HelpIcon tooltip="A log of all the file moves that were made" />
                    </h3>
                    <div className="max-h-48 overflow-auto space-y-2">
                        {operationLog.slice(-10).map((log) => (
                            <div
                                key={log.id}
                                className={`p-3 rounded-lg text-sm ${log.success
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span>{log.success ? '✅' : '❌'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate">{log.success ? 'Moved' : 'Failed to move'}:</p>
                                        <p className="text-xs opacity-75 truncate">{log.sourcePath}</p>
                                        {log.errorMessage && (
                                            <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                                                {log.errorMessage}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Help Footer */}
            {currentStep === 1 && selectedFolders.length === 0 && (
                <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <span>🤔</span> Not sure where to start?
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📥</span>
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">Downloads</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Usually the messiest folder
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🖥️</span>
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">Desktop</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Clear the clutter
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📄</span>
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">Documents</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Sort by type or date
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
