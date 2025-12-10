/**
 * Rule Card Component
 * Displays a single rule with actions.
 */

import React from 'react';
import { Rule } from '@/domain/types/rule';
import { Button } from '../common';

interface RuleCardProps {
    rule: Rule;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const scopeLabels: Record<string, { text: string; color: string }> = {
    local: { text: 'Local', color: 'badge-primary' },
    drive: { text: 'Drive', color: 'badge-warning' },
    both: { text: 'Both', color: 'badge-success' },
};

const conditionTypeLabels: Record<string, string> = {
    extension: '📎 Extension',
    category: '📂 Category',
    size: '📏 Size',
    age: '📅 Age',
    path: '📍 Path',
    name: '🏷️ Name',
};

const actionTypeLabels: Record<string, string> = {
    move: '📦 Move to folder',
    moveByDate: '📅 Move by date',
    moveByCategory: '🗂️ Move by category',
    rename: '✏️ Rename',
};

export default function RuleCard({
    rule,
    onToggle,
    onEdit,
    onDelete,
}: RuleCardProps) {
    const scope = scopeLabels[rule.scope] || scopeLabels.local;

    return (
        <div className="card p-4">
            <div className="flex items-start gap-4">
                {/* Toggle */}
                <button
                    onClick={onToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.enabled
                            ? 'bg-primary-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            {rule.name}
                        </h3>
                        <span className={`badge ${scope.color}`}>{scope.text}</span>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        {rule.description}
                    </p>

                    {/* Conditions summary */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            When:
                        </span>
                        {rule.conditions.map((condition) => (
                            <span
                                key={condition.id}
                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400"
                            >
                                {conditionTypeLabels[condition.type] || condition.type}{' '}
                                {condition.operator}{' '}
                                {Array.isArray(condition.value)
                                    ? condition.value.join(', ')
                                    : String(condition.value)}
                            </span>
                        ))}
                    </div>

                    {/* Actions summary */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            Then:
                        </span>
                        {rule.actions.map((action) => (
                            <span
                                key={action.id}
                                className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded text-xs text-primary-700 dark:text-primary-400"
                            >
                                {actionTypeLabels[action.type] || action.type}
                                {action.params.targetFolder && ` → ${action.params.targetFolder}`}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                    <Button onClick={onEdit} variant="ghost" size="sm">
                        ✏️
                    </Button>
                    <Button onClick={onDelete} variant="ghost" size="sm">
                        🗑️
                    </Button>
                </div>
            </div>
        </div>
    );
}
