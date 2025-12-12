/**
 * Structure Analysis Component
 * Shows AI-suggested folder structure with save functionality.
 */

import React, { useState } from 'react';
import { Button, LoadingSpinner } from '../common';
import {
    StructureSuggestion,
    SuggestedFolder,
} from '../../context/FileOrganizerContext';
import {
    analyzeStructure,
    AnalysisProgress,
    exportAnalysis,
    applyStructureToFiles,
} from '../../services/structure-analysis';
import { FileMeta, FileChange } from '@/domain/types/file';

interface StructureAnalysisProps {
    files: FileMeta[];
    sourceFolders: string[];
    onSaveSuggestion: (suggestion: StructureSuggestion) => void;
    savedSuggestions: StructureSuggestion[];
    onRemoveSuggestion: (id: string) => void;
    apiKey?: string;
    onApplyStructure?: (changes: FileChange[]) => void;
}

export default function StructureAnalysis({
    files,
    sourceFolders,
    onSaveSuggestion,
    savedSuggestions,
    onRemoveSuggestion,
    apiKey,
    onApplyStructure,
}: StructureAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState<AnalysisProgress | null>(null);
    const [currentSuggestion, setCurrentSuggestion] = useState<StructureSuggestion | null>(null);
    const [showSaved, setShowSaved] = useState(false);
    const [useLLM, setUseLLM] = useState(!!apiKey);
    const [maxDepth, setMaxDepth] = useState(3);

    const handleAnalyze = async () => {
        if (files.length === 0) return;

        setIsAnalyzing(true);
        setCurrentSuggestion(null);

        try {
            const suggestion = await analyzeStructure(
                files,
                sourceFolders,
                setProgress,
                { useLLM: useLLM && !!apiKey, apiKey, maxDepth }
            );
            setCurrentSuggestion(suggestion);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
            setProgress(null);
        }
    };


    const handleSave = () => {
        if (currentSuggestion) {
            onSaveSuggestion({ ...currentSuggestion, status: 'saved' });
            setCurrentSuggestion(null);
        }
    };

    const handleExport = () => {
        if (currentSuggestion) {
            const json = exportAnalysis(currentSuggestion);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `folder-structure-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleApplyStructure = async () => {
        if (!currentSuggestion || !onApplyStructure) {
            console.log('Cannot apply: no suggestion or callback');
            return;
        }

        try {
            // Check if Electron API is available
            if (!window.electronAPI?.selectFolder) {
                alert('Folder selection is not available. Please run as desktop app.');
                return;
            }

            // Use Electron dialog to select destination folder
            const destinationRoot = await window.electronAPI.selectFolder();

            // User cancelled the dialog
            if (!destinationRoot) {
                console.log('Folder selection cancelled');
                return;
            }

            console.log('Selected destination:', destinationRoot);

            // Validate the destination path
            if (typeof destinationRoot !== 'string' || destinationRoot.length < 3) {
                alert('Invalid destination folder selected.');
                return;
            }

            // Generate file changes based on the structure (PREVIEW ONLY - NO FILES MOVED)
            const changes = applyStructureToFiles(
                files,
                currentSuggestion.suggestedStructure,
                destinationRoot
            );

            console.log(`Generated ${changes.length} changes for preview`);

            if (changes.length === 0) {
                alert('No files to organize with this structure.');
                return;
            }

            // Pass changes to parent for PREVIEW (files are NOT moved yet)
            onApplyStructure(changes);
        } catch (error) {
            console.error('Failed to apply structure:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };



    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        🏗️ Smart Structure Analysis
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Let AI suggest the best folder structure for your files
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {savedSuggestions.length > 0 && (
                        <button
                            onClick={() => setShowSaved(!showSaved)}
                            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                        >
                            📋 Saved ({savedSuggestions.length})
                        </button>
                    )}
                    <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || files.length === 0}
                    >
                        {isAnalyzing ? '🔄 Analyzing...' : '✨ Analyze Structure'}
                    </Button>
                </div>
            </div>

            {/* LLM Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{useLLM && apiKey ? '🧠' : '⚡'}</span>
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                            {useLLM && apiKey ? 'AI-Powered Analysis' : 'Quick Analysis'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {useLLM && apiKey
                                ? 'Uses AI to understand file purposes and suggest smart organization'
                                : 'Fast heuristic-based analysis (no API needed)'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!apiKey && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                            Add API key in Settings for AI analysis
                        </span>
                    )}
                    <button
                        onClick={() => setUseLLM(!useLLM)}
                        disabled={!apiKey}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useLLM && apiKey
                            ? 'bg-primary-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                            } ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useLLM && apiKey ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Folder Depth Selector */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                            Folder Depth
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            How many levels of subfolders to suggest
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((depth) => (
                        <button
                            key={depth}
                            onClick={() => setMaxDepth(depth)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${maxDepth === depth
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                            title={`${depth} level${depth > 1 ? 's' : ''} deep`}
                        >
                            {depth}
                        </button>
                    ))}
                </div>
            </div>

            {/* Depth Preview */}
            <div className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Preview:</p>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                    <p>📁 Documents/</p>
                    {maxDepth >= 2 && <p className="pl-4">📁 PDFs/</p>}
                    {maxDepth >= 3 && <p className="pl-8">📁 2024/</p>}
                    {maxDepth >= 4 && <p className="pl-12">📁 Work/</p>}
                    {maxDepth >= 5 && <p className="pl-16">📁 Reports/</p>}
                </div>
            </div>


            {/* Saved Suggestions Panel */}
            {showSaved && savedSuggestions.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Saved Analysis Results
                    </h4>
                    <div className="space-y-2">
                        {savedSuggestions.map(suggestion => (
                            <div
                                key={suggestion.id}
                                className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg"
                            >
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {suggestion.analysis.totalFiles} files analyzed
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(suggestion.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentSuggestion(suggestion)}
                                        className="px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => onRemoveSuggestion(suggestion.id)}
                                        className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress */}
            {isAnalyzing && progress && (
                <div className="p-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <LoadingSpinner size="md" />
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                {progress.message}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Stage: {progress.stage}
                            </p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {currentSuggestion && !isAnalyzing && (
                <div className="space-y-4">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard
                            icon="📁"
                            label="Total Files"
                            value={currentSuggestion.analysis.totalFiles.toLocaleString()}
                        />
                        <StatCard
                            icon="💾"
                            label="Total Size"
                            value={formatSize(currentSuggestion.analysis.totalSize)}
                        />
                        <StatCard
                            icon="📊"
                            label="Categories"
                            value={Object.keys(currentSuggestion.analysis.categories).length.toString()}
                        />
                        <StatCard
                            icon="⚠️"
                            label="Issues Found"
                            value={currentSuggestion.analysis.issues.length.toString()}
                        />
                    </div>

                    {/* Issues */}
                    {currentSuggestion.analysis.issues.length > 0 && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                                ⚠️ Issues Detected
                            </h4>
                            <ul className="space-y-1">
                                {currentSuggestion.analysis.issues.map((issue, i) => (
                                    <li key={i} className="text-sm text-amber-600 dark:text-amber-300 flex items-start gap-2">
                                        <span>•</span>
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Suggested Structure */}
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            ✨ Recommended Folder Structure
                        </h4>

                        <div className="space-y-2">
                            {currentSuggestion.suggestedStructure.map((folder, index) => (
                                <FolderItem
                                    key={index}
                                    folder={folder}
                                    level={0}
                                    defaultExpanded={false}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-4">
                            📊 File Categories
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(currentSuggestion.analysis.categories)
                                .sort((a, b) => b[1] - a[1])
                                .map(([category, count]) => (
                                    <div
                                        key={category}
                                        className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                                    >
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {category}
                                        </p>
                                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                            {count}
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={handleExport} size="sm">
                                📥 Export JSON
                            </Button>
                            <Button variant="ghost" onClick={handleSave} size="sm">
                                💾 Save Analysis
                            </Button>
                        </div>
                        {onApplyStructure && (
                            <Button
                                variant="primary"
                                onClick={handleApplyStructure}
                                size="lg"
                                className="px-6"
                            >
                                🚀 Apply This Structure
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!currentSuggestion && !isAnalyzing && (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-4xl mb-3">🏗️</div>
                    <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                        No Analysis Yet
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Click "Analyze Structure" to get AI recommendations for organizing your files
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        The AI will suggest the best folder structure based on your file types and purposes
                    </p>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

// Folder Item Component - Self-managing expanded state for full tree navigation
function FolderItem({
    folder,
    level,
    defaultExpanded = false,
}: {
    folder: SuggestedFolder;
    level: number;
    defaultExpanded?: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;

    const handleToggle = () => {
        if (hasSubfolders) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div style={{ marginLeft: level * 20 }}>
            <div
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${hasSubfolders ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''
                    }`}
                onClick={handleToggle}
            >
                {hasSubfolders && (
                    <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        ▶
                    </span>
                )}
                {!hasSubfolders && <span className="w-4" />}
                <span className="text-2xl">{folder.icon}</span>
                <div className="flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                        {folder.name}/
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {folder.purpose}
                    </p>
                </div>
                {folder.estimatedFiles > 0 && (
                    <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                        ~{folder.estimatedFiles} files
                    </span>
                )}
            </div>

            {hasSubfolders && isExpanded && (
                <div className="mt-1 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                    {folder.subfolders!.map((subfolder, index) => (
                        <FolderItem
                            key={index}
                            folder={subfolder}
                            level={level + 1}
                            defaultExpanded={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
