/**
 * File Organizer Context
 * Persists state across page navigation for the local file organizer.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FileMeta, FileChange } from '@/domain/types/file';

// Saved structure suggestion
export interface StructureSuggestion {
    id: string;
    timestamp: Date;
    sourceFolders: string[];
    analysis: FolderAnalysis;
    suggestedStructure: SuggestedFolder[];
    status: 'pending' | 'applied' | 'saved';
}

export interface FolderAnalysis {
    totalFiles: number;
    totalSize: number;
    categories: Record<string, number>;
    dateRange: { oldest: Date; newest: Date } | null;
    purposes: string[];
    issues: string[];
}

export interface SuggestedFolder {
    name: string;
    purpose: string;
    icon: string;
    subfolders?: SuggestedFolder[];
    filePatterns: string[];
    estimatedFiles: number;
}

interface FileOrganizerState {
    // Folder selection
    selectedFolders: string[];
    includeSubdirectories: boolean;

    // Scanned files
    files: FileMeta[];
    scanComplete: boolean;

    // Changes
    changes: FileChange[];
    showPreview: boolean;

    // Structure analysis
    structureSuggestions: StructureSuggestion[];
    currentAnalysis: FolderAnalysis | null;

    // Operation log
    operationLog: any[];

    // UI state
    activeMode: 'ai' | 'rules';
    isFirstVisit: boolean;
}

interface FileOrganizerContextType extends FileOrganizerState {
    // Folder actions
    addFolder: (folder: string) => void;
    removeFolder: (folder: string) => void;
    setIncludeSubdirectories: (include: boolean) => void;

    // Scan actions
    setFiles: (files: FileMeta[]) => void;
    setScanComplete: (complete: boolean) => void;

    // Change actions
    setChanges: (changes: FileChange[] | ((prev: FileChange[]) => FileChange[])) => void;
    updateChange: (index: number, updates: Partial<FileChange>) => void;
    toggleChange: (index: number) => void;
    toggleAllChanges: (selected: boolean) => void;
    setShowPreview: (show: boolean) => void;

    // Structure analysis actions
    setCurrentAnalysis: (analysis: FolderAnalysis | null) => void;
    saveStructureSuggestion: (suggestion: StructureSuggestion) => void;
    removeStructureSuggestion: (id: string) => void;

    // Log actions
    addToLog: (entries: any[]) => void;
    clearLog: () => void;

    // UI actions
    setActiveMode: (mode: 'ai' | 'rules') => void;
    setFirstVisit: (isFirst: boolean) => void;

    // Reset
    resetState: () => void;
    resetScan: () => void;
}

const initialState: FileOrganizerState = {
    selectedFolders: [],
    includeSubdirectories: true,
    files: [],
    scanComplete: false,
    changes: [],
    showPreview: false,
    structureSuggestions: [],
    currentAnalysis: null,
    operationLog: [],
    activeMode: 'ai',
    isFirstVisit: true,
};

const FileOrganizerContext = createContext<FileOrganizerContextType | undefined>(undefined);

export function FileOrganizerProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<FileOrganizerState>(() => {
        // Load saved suggestions from localStorage
        const savedSuggestions = localStorage.getItem('smartFileOrganizer_structureSuggestions');
        const isFirstVisit = !localStorage.getItem('smartFileOrganizer_hasVisited');

        return {
            ...initialState,
            structureSuggestions: savedSuggestions ? JSON.parse(savedSuggestions) : [],
            isFirstVisit,
        };
    });

    // Folder actions
    const addFolder = useCallback((folder: string) => {
        setState(prev => ({
            ...prev,
            selectedFolders: prev.selectedFolders.includes(folder)
                ? prev.selectedFolders
                : [...prev.selectedFolders, folder],
            // Reset scan when folders change
            files: [],
            scanComplete: false,
            changes: [],
        }));
    }, []);

    const removeFolder = useCallback((folder: string) => {
        setState(prev => ({
            ...prev,
            selectedFolders: prev.selectedFolders.filter(f => f !== folder),
            files: [],
            scanComplete: false,
            changes: [],
        }));
    }, []);

    const setIncludeSubdirectories = useCallback((include: boolean) => {
        setState(prev => ({ ...prev, includeSubdirectories: include }));
    }, []);

    // Scan actions
    const setFiles = useCallback((files: FileMeta[]) => {
        setState(prev => ({ ...prev, files }));
    }, []);

    const setScanComplete = useCallback((complete: boolean) => {
        setState(prev => ({ ...prev, scanComplete: complete }));
    }, []);

    // Change actions
    const setChanges = useCallback((changesOrUpdater: FileChange[] | ((prev: FileChange[]) => FileChange[])) => {
        setState(prev => {
            const newChanges = typeof changesOrUpdater === 'function'
                ? changesOrUpdater(prev.changes)
                : changesOrUpdater;
            return { ...prev, changes: Array.isArray(newChanges) ? newChanges : [] };
        });
    }, []);

    const updateChange = useCallback((index: number, updates: Partial<FileChange>) => {
        setState(prev => ({
            ...prev,
            changes: prev.changes.map((c, i) => i === index ? { ...c, ...updates } : c),
        }));
    }, []);

    const toggleChange = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            changes: prev.changes.map((c, i) =>
                i === index ? { ...c, selected: !c.selected } : c
            ),
        }));
    }, []);

    const toggleAllChanges = useCallback((selected: boolean) => {
        setState(prev => ({
            ...prev,
            changes: prev.changes.map(c => ({ ...c, selected })),
        }));
    }, []);

    const setShowPreview = useCallback((show: boolean) => {
        setState(prev => ({ ...prev, showPreview: show }));
    }, []);

    // Structure analysis actions
    const setCurrentAnalysis = useCallback((analysis: FolderAnalysis | null) => {
        setState(prev => ({ ...prev, currentAnalysis: analysis }));
    }, []);

    const saveStructureSuggestion = useCallback((suggestion: StructureSuggestion) => {
        setState(prev => {
            const newSuggestions = [...prev.structureSuggestions, suggestion];
            // Persist to localStorage
            localStorage.setItem('smartFileOrganizer_structureSuggestions', JSON.stringify(newSuggestions));
            return { ...prev, structureSuggestions: newSuggestions };
        });
    }, []);

    const removeStructureSuggestion = useCallback((id: string) => {
        setState(prev => {
            const newSuggestions = prev.structureSuggestions.filter(s => s.id !== id);
            localStorage.setItem('smartFileOrganizer_structureSuggestions', JSON.stringify(newSuggestions));
            return { ...prev, structureSuggestions: newSuggestions };
        });
    }, []);

    // Log actions
    const addToLog = useCallback((entries: any[]) => {
        setState(prev => ({
            ...prev,
            operationLog: [...prev.operationLog, ...entries],
        }));
    }, []);

    const clearLog = useCallback(() => {
        setState(prev => ({ ...prev, operationLog: [] }));
    }, []);

    // UI actions
    const setActiveMode = useCallback((mode: 'ai' | 'rules') => {
        setState(prev => ({ ...prev, activeMode: mode }));
    }, []);

    const setFirstVisit = useCallback((isFirst: boolean) => {
        setState(prev => ({ ...prev, isFirstVisit: isFirst }));
        if (!isFirst) {
            localStorage.setItem('smartFileOrganizer_hasVisited', 'true');
        }
    }, []);

    // Reset actions
    const resetState = useCallback(() => {
        setState(prev => ({
            ...initialState,
            structureSuggestions: prev.structureSuggestions,
            isFirstVisit: false,
        }));
    }, []);

    const resetScan = useCallback(() => {
        setState(prev => ({
            ...prev,
            files: [],
            scanComplete: false,
            changes: [],
            showPreview: false,
            currentAnalysis: null,
        }));
    }, []);

    const value: FileOrganizerContextType = {
        ...state,
        addFolder,
        removeFolder,
        setIncludeSubdirectories,
        setFiles,
        setScanComplete,
        setChanges,
        updateChange,
        toggleChange,
        toggleAllChanges,
        setShowPreview,
        setCurrentAnalysis,
        saveStructureSuggestion,
        removeStructureSuggestion,
        addToLog,
        clearLog,
        setActiveMode,
        setFirstVisit,
        resetState,
        resetScan,
    };

    return (
        <FileOrganizerContext.Provider value={value}>
            {children}
        </FileOrganizerContext.Provider>
    );
}

export function useFileOrganizer() {
    const context = useContext(FileOrganizerContext);
    if (!context) {
        throw new Error('useFileOrganizer must be used within a FileOrganizerProvider');
    }
    return context;
}
