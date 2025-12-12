/**
 * Rule Form Component
 * Form for creating and editing rules with beginner-friendly guidance.
 */

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Rule, Condition, Action, ConditionType, ActionType, RuleScope, ConditionOperator } from '@/domain/types/rule';
import { Button, HelpIcon } from '../common';

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
            newErrors.name = 'Please give your rule a name';
        }

        if (conditions.length === 0) {
            newErrors.conditions = 'Tell us when this rule should apply (add at least one condition)';
        }

        if (actions.length === 0) {
            newErrors.actions = 'Tell us what to do with matching files (add at least one action)';
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
                        Rule Name
                        <HelpIcon tooltip="Give your rule a descriptive name so you remember what it does" />
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='e.g., "Sort my PDFs", "Organize photos by date"'
                        className={`input ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && (
                        <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Notes about what this rule does..."
                        rows={2}
                        className="input"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Where to apply
                            <HelpIcon tooltip="Choose where this rule should work: your computer, Google Drive, or both" />
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as RuleScope)}
                            className="input"
                        >
                            <option value="local">📁 My Computer</option>
                            <option value="drive">☁️ Google Drive</option>
                            <option value="both">🔄 Both</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                Enable this rule
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Conditions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            🎯 When should this rule apply?
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            Add conditions to tell us which files this rule applies to
                        </p>
                    </div>
                    <Button onClick={addCondition} variant="secondary" size="sm">
                        + Add Condition
                    </Button>
                </div>

                {errors.conditions && (
                    <p className="text-xs text-red-500 mb-2 bg-red-50 dark:bg-red-900/30 p-2 rounded">{errors.conditions}</p>
                )}

                {conditions.length === 0 ? (
                    <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400 mb-2">
                            No conditions yet
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Click "+ Add Condition" to specify which files this rule applies to
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {conditions.map((condition, index) => (
                            <ConditionRow
                                key={condition.id}
                                condition={condition}
                                isFirst={index === 0}
                                onUpdate={(updates) => updateCondition(condition.id, updates)}
                                onRemove={() => removeCondition(condition.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                            ✨ What should happen to matching files?
                        </h3>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            Add actions to tell us what to do with files that match
                        </p>
                    </div>
                    <Button onClick={addAction} variant="secondary" size="sm">
                        + Add Action
                    </Button>
                </div>

                {errors.actions && (
                    <p className="text-xs text-red-500 mb-2 bg-red-50 dark:bg-red-900/30 p-2 rounded">{errors.actions}</p>
                )}

                {actions.length === 0 ? (
                    <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400 mb-2">
                            No actions yet
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Click "+ Add Action" to specify what to do with matching files
                        </p>
                    </div>
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
                    {initialRule ? '✓ Save Changes' : '✨ Create Rule'}
                </Button>
            </div>
        </div>
    );
}

// Condition row component
function ConditionRow({
    condition,
    isFirst,
    onUpdate,
    onRemove,
}: {
    condition: Condition;
    isFirst: boolean;
    onUpdate: (updates: Partial<Condition>) => void;
    onRemove: () => void;
}) {
    // User-friendly condition types
    const conditionTypes: { value: ConditionType; label: string; icon: string; hint: string }[] = [
        { value: 'category', label: 'File Type', icon: '📂', hint: 'Documents, Images, Videos, etc.' },
        { value: 'extension', label: 'File Extension', icon: '📎', hint: '.pdf, .docx, .jpg, etc.' },
        { value: 'size', label: 'File Size', icon: '📊', hint: 'Larger or smaller than...' },
        { value: 'age', label: 'File Age', icon: '📅', hint: 'How old is the file' },
        { value: 'name', label: 'File Name', icon: '📝', hint: 'Name contains, starts with...' },
        { value: 'path', label: 'Folder Location', icon: '📁', hint: 'Where the file is located' },
    ];

    // User-friendly operators
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
            { value: 'gt', label: 'is bigger than' },
            { value: 'lt', label: 'is smaller than' },
        ],
        age: [
            { value: 'gt', label: 'is older than' },
            { value: 'lt', label: 'is newer than' },
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

    // User-friendly category names
    const categories = [
        { value: 'documents', label: '📄 Documents' },
        { value: 'images', label: '🖼️ Images' },
        { value: 'videos', label: '🎬 Videos' },
        { value: 'audio', label: '🎵 Audio' },
        { value: 'archives', label: '📦 Archives (ZIP, etc.)' },
        { value: 'code', label: '💻 Code Files' },
        { value: 'other', label: '📎 Other' },
    ];

    return (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900">
            {!isFirst && (
                <p className="text-xs text-slate-400 mb-2">AND</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">If the</span>

                <select
                    value={condition.type}
                    onChange={(e) => {
                        const newType = e.target.value as ConditionType;
                        const defaultOperatorMap: Record<ConditionType, ConditionOperator> = {
                            category: 'equals',
                            extension: 'in',
                            size: 'gt',
                            age: 'gt',
                            name: 'contains',
                            path: 'contains',
                        };
                        const defaultValueMap: Record<ConditionType, string> = {
                            category: 'documents',
                            extension: '',
                            size: '',
                            age: '',
                            name: '',
                            path: '',
                        };
                        onUpdate({
                            type: newType,
                            operator: defaultOperatorMap[newType],
                            value: defaultValueMap[newType],
                        });
                    }}
                    className="input w-auto text-sm"
                >
                    {conditionTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.icon} {t.label}
                        </option>
                    ))}
                </select>

                <select
                    value={condition.operator}
                    onChange={(e) => onUpdate({ operator: e.target.value as ConditionOperator })}
                    className="input w-auto text-sm"
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
                        className="input flex-1 min-w-[150px] text-sm"
                    >
                        {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
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
                                    ? 'Size in MB'
                                    : condition.type === 'age'
                                        ? 'Number of days'
                                        : 'Enter text...'
                        }
                        className="input flex-1 min-w-[120px] text-sm"
                    />
                )}

                {condition.type === 'size' && (
                    <span className="text-sm text-slate-500">MB</span>
                )}
                {condition.type === 'age' && (
                    <span className="text-sm text-slate-500">days</span>
                )}

                <button
                    onClick={onRemove}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Remove condition"
                >
                    ✕
                </button>
            </div>
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
    // User-friendly action types
    const actionTypes: { value: ActionType; label: string; icon: string }[] = [
        { value: 'move', label: 'Move to folder', icon: '📂' },
        { value: 'moveByDate', label: 'Organize by date', icon: '📅' },
        { value: 'moveByCategory', label: 'Sort by category', icon: '📁' },
        { value: 'rename', label: 'Rename file', icon: '✏️' },
    ];

    return (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-100 dark:border-green-900">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Then</span>

                <select
                    value={action.type}
                    onChange={(e) => onUpdate({ type: e.target.value as ActionType })}
                    className="input w-auto text-sm"
                >
                    {actionTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.icon} {t.label}
                        </option>
                    ))}
                </select>

                {(action.type === 'move' || action.type === 'moveByDate' || action.type === 'moveByCategory') && (
                    <>
                        <span className="text-sm text-slate-500">to</span>
                        <input
                            type="text"
                            value={action.params.targetFolder || ''}
                            onChange={(e) =>
                                onUpdate({
                                    params: { ...action.params, targetFolder: e.target.value },
                                })
                            }
                            placeholder='e.g., "Documents", "Sorted Files"'
                            className="input flex-1 min-w-[150px] text-sm"
                        />
                    </>
                )}

                {action.type === 'moveByDate' && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">using format</span>
                        <select
                            value={action.params.dateFormat || 'YYYY/MM'}
                            onChange={(e) =>
                                onUpdate({
                                    params: { ...action.params, dateFormat: e.target.value },
                                })
                            }
                            className="input w-auto text-sm"
                        >
                            <option value="YYYY">📅 Year (2024)</option>
                            <option value="YYYY/MM">📅 Year/Month (2024/01)</option>
                            <option value="YYYY/MM/DD">📅 Year/Month/Day</option>
                        </select>
                    </div>
                )}

                {action.type === 'rename' && (
                    <>
                        <span className="text-sm text-slate-500">with pattern</span>
                        <input
                            type="text"
                            value={action.params.renamePattern || ''}
                            onChange={(e) =>
                                onUpdate({
                                    params: { ...action.params, renamePattern: e.target.value },
                                })
                            }
                            placeholder="{name}_{date}{ext}"
                            className="input flex-1 min-w-[150px] text-sm"
                        />
                        <span className="text-xs text-slate-400">
                            Use {'{name}'}, {'{date}'}, {'{ext}'}
                        </span>
                    </>
                )}

                <button
                    onClick={onRemove}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Remove action"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
