/**
 * Preview Panel Component
 * Shows proposed changes before applying them.
 */

import React, { useState, useMemo } from 'react';
import { FileChange } from '@/domain/types/file';
import { Button } from '../common';

interface PreviewPanelProps {
    changes: FileChange[];
    onToggleChange: (index: number) => void;
    onToggleAll: (selected: boolean) => void;
    onApply: () => void;
    onClose: () => void;
    isApplying: boolean;
}

export default function PreviewPanel({
    changes,
    onToggleChange,
    onToggleAll,
    onApply,
    onClose,
    isApplying,
}: PreviewPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter out any invalid changes - memoized
    const validChanges = useMemo(() => {
        if (!changes || !Array.isArray(changes)) return [];
        return changes.filter(c =>
            c && c.file && c.file.id && c.currentPath && c.proposedPath
        );
    }, [changes]);

    // Filter changes based on search query
    const filteredChanges = useMemo(() => {
        if (!searchQuery.trim()) return validChanges;
        const query = searchQuery.toLowerCase();
        return validChanges.filter(c =>
            c.currentName?.toLowerCase().includes(query) ||
            c.currentPath?.toLowerCase().includes(query) ||
            c.proposedPath?.toLowerCase().includes(query) ||
            c.matchedRule?.toLowerCase().includes(query)
        );
    }, [validChanges, searchQuery]);

    // Get original index for toggle callback
    const getOriginalIndex = (change: FileChange) => {
        if (!changes || !Array.isArray(changes)) return -1;
        return changes.findIndex(c => c?.file?.id === change?.file?.id);
    };

    const selectedCount = useMemo(() => validChanges.filter((c) => c.selected).length, [validChanges]);
    const pendingCount = useMemo(() => validChanges.filter((c) => c.status === 'pending').length, [validChanges]);
    const allSelected = selectedCount === validChanges.length && validChanges.length > 0;
    const noneSelected = selectedCount === 0;

    // Safety check - show error if no valid changes
    if (validChanges.length === 0) {
        return (
            <div className="card p-6 text-center">
                <p className="text-amber-500 mb-2">⚠️ No valid changes to preview</p>
                <p className="text-sm text-slate-500">The structure analysis didn't find any files to organize.</p>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const getStatusBadge = (status: FileChange['status']) => {
        switch (status) {
            case 'pending':
                return <span className="badge badge-warning">Pending</span>;
            case 'success':
                return <span className="badge badge-success">Done</span>;
            case 'error':
                return <span className="badge badge-error">Error</span>;
            case 'skipped':
                return <span className="badge">Skipped</span>;
        }
    };


    return (
        <div className="card border-2 border-primary-500/30">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            📋 Preview Changes
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {selectedCount} of {validChanges.length} changes selected
                            {searchQuery && ` (showing ${filteredChanges.length})`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => onToggleAll(!allSelected)}
                            variant="ghost"
                            size="sm"
                        >
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Button onClick={onClose} variant="ghost" size="sm">
                            ✕
                        </Button>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="🔍 Search by filename, path, or rule..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input w-full pl-3 pr-8"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Changes table */}
            <div className="max-h-[400px] overflow-auto">
                <table>
                    <thead>
                        <tr>
                            <th className="w-12">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={(e) => onToggleAll(e.target.checked)}
                                    className="rounded border-slate-300 dark:border-slate-600"
                                />
                            </th>
                            <th>Current</th>
                            <th>→</th>
                            <th>Proposed</th>
                            <th>Rule</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredChanges.map((change) => (
                            <tr
                                key={change.file.id}
                                className={
                                    change.status === 'success'
                                        ? 'bg-green-50 dark:bg-green-900/10'
                                        : change.status === 'error'
                                            ? 'bg-red-50 dark:bg-red-900/10'
                                            : ''
                                }
                            >
                                <td className="align-top pt-3">
                                    <input
                                        type="checkbox"
                                        checked={change.selected}
                                        onChange={() => onToggleChange(getOriginalIndex(change))}
                                        disabled={change.status !== 'pending'}
                                        className="rounded border-slate-300 dark:border-slate-600"
                                    />
                                </td>
                                <td className="align-top">
                                    <div className="max-w-[280px]">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {change.currentName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all whitespace-normal leading-relaxed mt-1">
                                            {change.currentPath}
                                        </p>
                                    </div>
                                </td>
                                <td className="text-center text-slate-400 align-top pt-3">→</td>
                                <td className="align-top">
                                    <div className="max-w-[280px]">
                                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                            {change.proposedName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all whitespace-normal leading-relaxed mt-1">
                                            {change.proposedPath}
                                        </p>
                                    </div>
                                </td>
                                <td className="align-top pt-2">
                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                        {change.matchedRule}
                                    </span>
                                </td>
                                <td className="align-top pt-2">{getStatusBadge(change.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <span className="text-amber-500">⚠️</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Files will be moved to new locations. This action can be undone manually.
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button onClick={onClose} variant="secondary">
                        Cancel
                    </Button>
                    <Button
                        onClick={onApply}
                        variant="primary"
                        disabled={noneSelected || pendingCount === 0}
                        isLoading={isApplying}
                    >
                        {isApplying
                            ? 'Applying...'
                            : `Apply ${selectedCount} Changes`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
