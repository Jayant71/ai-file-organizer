/**
 * Rule Form Component
 * Form for creating and editing rules.
 */

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Rule, Condition, Action, ConditionType, ActionType, RuleScope, ConditionOperator } from '@/domain/types/rule';
import { Button } from '../common';

interface RuleFormProps {
    initialRule?: Rule;
    onSave: (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
}

export default function RuleForm({ initialRule, onSave, onCancel }: RuleFormProps) {
    const [name, setName] = useState(initialRule?.name || '');
    const [description, setDescription] = useState(initialRule?.description || '');
    const [scope, setScope] = useState<RuleScope>(initialRule?.scope || 'local');
    const [enabled, setEnabled] = useState(initialRule?.enabled ?? true);
    const [conditions, setConditions] = useState<Condition[]>(
        initialRule?.conditions || []
    );
    const [actions, setActions] = useState<Action[]>(initialRule?.actions || []);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Add condition
    const addCondition = () => {
        const newCondition: Condition = {
            id: uuidv4(),
            type: 'category',
            operator: 'equals',
            value: 'documents',
        };
        setConditions([...conditions, newCondition]);
    };

    // Update condition
    const updateCondition = (id: string, updates: Partial<Condition>) => {
        setConditions(
            conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
    };

    // Remove condition
    const removeCondition = (id: string) => {
        setConditions(conditions.filter((c) => c.id !== id));
    };

    // Add action
    const addAction = () => {
        const newAction: Action = {
            id: uuidv4(),
            type: 'move',
            params: {
                targetFolder: 'Organized',
                createIfNotExists: true,
            },
        };
        setActions([...actions, newAction]);
    };

    // Update action
    const updateAction = (id: string, updates: Partial<Action>) => {
        setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    };

    // Remove action
    const removeAction = (id: string) => {
        setActions(actions.filter((a) => a.id !== id));
    };

    // Validate and save
    const handleSave = () => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (conditions.length === 0) {
            newErrors.conditions = 'At least one condition is required';
        }

        if (actions.length === 0) {
            newErrors.actions = 'At least one action is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            name: name.trim(),
            description: description.trim(),
            scope,
            enabled,
            conditions,
            actions,
            priority: initialRule?.priority ?? 0,
        });
    };

    return (
        <div className="space-y-6">
            {/* Basic info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Rule Name *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Organize Documents"
                        className={`input ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && (
                        <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does this rule do?"
                        rows={2}
                        className="input"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Scope
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as RuleScope)}
                            className="input"
                        >
                            <option value="local">Local Files Only</option>
                            <option value="drive">Google Drive Only</option>
                            <option value="both">Both</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                Enable rule
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Conditions */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Conditions (When)
                    </h3>
                    <Button onClick={addCondition} variant="ghost" size="sm">
                        + Add Condition
                    </Button>
                </div>

                {errors.conditions && (
                    <p className="text-xs text-red-500 mb-2">{errors.conditions}</p>
                )}

                {conditions.length === 0 ? (
                    <p className="text-sm text-slate-400 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                        No conditions yet. Add a condition to specify which files this rule
                        applies to.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {conditions.map((condition) => (
                            <ConditionRow
                                key={condition.id}
                                condition={condition}
                                onUpdate={(updates) => updateCondition(condition.id, updates)}
                                onRemove={() => removeCondition(condition.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Actions (Then)
                    </h3>
                    <Button onClick={addAction} variant="ghost" size="sm">
                        + Add Action
                    </Button>
                </div>

                {errors.actions && (
                    <p className="text-xs text-red-500 mb-2">{errors.actions}</p>
                )}

                {actions.length === 0 ? (
                    <p className="text-sm text-slate-400 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                        No actions yet. Add an action to specify what to do with matching
                        files.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {actions.map((action) => (
                            <ActionRow
                                key={action.id}
                                action={action}
                                onUpdate={(updates) => updateAction(action.id, updates)}
                                onRemove={() => removeAction(action.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button onClick={onCancel} variant="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSave} variant="primary">
                    {initialRule ? 'Update Rule' : 'Create Rule'}
                </Button>
            </div>
        </div>
    );
}

// Condition row component
function ConditionRow({
    condition,
    onUpdate,
    onRemove,
}: {
    condition: Condition;
    onUpdate: (updates: Partial<Condition>) => void;
    onRemove: () => void;
}) {
    const conditionTypes: { value: ConditionType; label: string }[] = [
        { value: 'category', label: 'File Category' },
        { value: 'extension', label: 'File Extension' },
        { value: 'size', label: 'File Size' },
        { value: 'age', label: 'File Age' },
        { value: 'name', label: 'File Name' },
        { value: 'path', label: 'File Path' },
    ];

    const operators: Record<string, { value: ConditionOperator; label: string }[]> = {
        category: [
            { value: 'equals', label: 'is' },
            { value: 'notEquals', label: 'is not' },
        ],
        extension: [
            { value: 'in', label: 'is one of' },
            { value: 'notIn', label: 'is not one of' },
        ],
        size: [
            { value: 'gt', label: 'greater than' },
            { value: 'lt', label: 'less than' },
        ],
        age: [
            { value: 'gt', label: 'more than (days)' },
            { value: 'lt', label: 'less than (days)' },
        ],
        name: [
            { value: 'contains', label: 'contains' },
            { value: 'startsWith', label: 'starts with' },
            { value: 'endsWith', label: 'ends with' },
        ],
        path: [
            { value: 'contains', label: 'contains' },
            { value: 'startsWith', label: 'starts with' },
        ],
    };

    const categories = [
        'documents', 'images', 'videos', 'audio', 'archives', 'code', 'other'
    ];

    return (
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <select
                value={condition.type}
                onChange={(e) => onUpdate({ type: e.target.value as ConditionType })}
                className="input w-auto"
            >
                {conditionTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                        {t.label}
                    </option>
                ))}
            </select>

            <select
                value={condition.operator}
                onChange={(e) => onUpdate({ operator: e.target.value as ConditionOperator })}
                className="input w-auto"
            >
                {(operators[condition.type] || operators.name).map((op) => (
                    <option key={op.value} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>

            {condition.type === 'category' ? (
                <select
                    value={String(condition.value)}
                    onChange={(e) => onUpdate({ value: e.target.value })}
                    className="input flex-1"
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={condition.type === 'size' || condition.type === 'age' ? 'number' : 'text'}
                    value={String(condition.value)}
                    onChange={(e) => onUpdate({ value: e.target.value })}
                    placeholder={
                        condition.type === 'extension'
                            ? '.pdf, .docx, .txt'
                            : condition.type === 'size'
                                ? 'Size in bytes'
                                : condition.type === 'age'
                                    ? 'Days'
                                    : 'Value'
                    }
                    className="input flex-1"
                />
            )}

            <button
                onClick={onRemove}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
                ✕
            </button>
        </div>
    );
}

// Action row component
function ActionRow({
    action,
    onUpdate,
    onRemove,
}: {
    action: Action;
    onUpdate: (updates: Partial<Action>) => void;
    onRemove: () => void;
}) {
    const actionTypes: { value: ActionType; label: string }[] = [
        { value: 'move', label: 'Move to folder' },
        { value: 'moveByDate', label: 'Move by date' },
        { value: 'moveByCategory', label: 'Move by category' },
        { value: 'rename', label: 'Rename file' },
    ];

    return (
        <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <select
                value={action.type}
                onChange={(e) => onUpdate({ type: e.target.value as ActionType })}
                className="input w-auto"
            >
                {actionTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                        {t.label}
                    </option>
                ))}
            </select>

            {(action.type === 'move' || action.type === 'moveByDate' || action.type === 'moveByCategory') && (
                <input
                    type="text"
                    value={action.params.targetFolder || ''}
                    onChange={(e) =>
                        onUpdate({
                            params: { ...action.params, targetFolder: e.target.value },
                        })
                    }
                    placeholder="Target folder (e.g., Documents/Organized)"
                    className="input flex-1"
                />
            )}

            {action.type === 'moveByDate' && (
                <input
                    type="text"
                    value={action.params.dateFormat || 'YYYY/MM'}
                    onChange={(e) =>
                        onUpdate({
                            params: { ...action.params, dateFormat: e.target.value },
                        })
                    }
                    placeholder="Date format (e.g., YYYY/MM)"
                    className="input w-32"
                />
            )}

            {action.type === 'rename' && (
                <input
                    type="text"
                    value={action.params.renamePattern || ''}
                    onChange={(e) =>
                        onUpdate({
                            params: { ...action.params, renamePattern: e.target.value },
                        })
                    }
                    placeholder="{name}_{date}{ext}"
                    className="input flex-1"
                />
            )}

            <button
                onClick={onRemove}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
                ✕
            </button>
        </div>
    );
}
