/**
 * Rules Page
 * Manage organization rules.
 */

import React, { useState } from 'react';
import { Button, Modal, EmptyState } from '../components/common';
import RuleCard from '../components/rules/RuleCard';
import RuleForm from '../components/rules/RuleForm';
import { useRules } from '../context/RulesContext';
import { Rule } from '@/domain/types/rule';

export default function RulesPage() {
    const { rules, addRule, updateRule, deleteRule, toggleRule } = useRules();
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleCreate = () => {
        setEditingRule(null);
        setShowForm(true);
    };

    const handleEdit = (rule: Rule) => {
        setEditingRule(rule);
        setShowForm(true);
    };

    const handleSave = (
        ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
        if (editingRule) {
            updateRule(editingRule.id, ruleData);
        } else {
            addRule(ruleData);
        }
        setShowForm(false);
        setEditingRule(null);
    };

    const handleDelete = (id: string) => {
        deleteRule(id);
        setDeleteConfirm(null);
    };

    const enabledRules = rules.filter((r) => r.enabled);
    const disabledRules = rules.filter((r) => !r.enabled);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Organization Rules
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Define rules to automatically organize your files
                    </p>
                </div>
                <Button onClick={handleCreate}>+ Create Rule</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Total Rules
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {rules.length}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Enabled
                    </p>
                    <p className="text-2xl font-bold text-green-500">{enabledRules.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Disabled
                    </p>
                    <p className="text-2xl font-bold text-slate-400">
                        {disabledRules.length}
                    </p>
                </div>
            </div>

            {/* Rules list */}
            {rules.length === 0 ? (
                <EmptyState
                    icon="⚙️"
                    title="No rules yet"
                    description="Create your first rule to start organizing files automatically."
                    actionLabel="Create Rule"
                    onAction={handleCreate}
                />
            ) : (
                <div className="space-y-6">
                    {/* Enabled rules */}
                    {enabledRules.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                Active Rules
                            </h2>
                            <div className="grid gap-4">
                                {enabledRules.map((rule) => (
                                    <RuleCard
                                        key={rule.id}
                                        rule={rule}
                                        onToggle={() => toggleRule(rule.id)}
                                        onEdit={() => handleEdit(rule)}
                                        onDelete={() => setDeleteConfirm(rule.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Disabled rules */}
                    {disabledRules.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-3">
                                Inactive Rules
                            </h2>
                            <div className="grid gap-4 opacity-70">
                                {disabledRules.map((rule) => (
                                    <RuleCard
                                        key={rule.id}
                                        rule={rule}
                                        onToggle={() => toggleRule(rule.id)}
                                        onEdit={() => handleEdit(rule)}
                                        onDelete={() => setDeleteConfirm(rule.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rule form modal */}
            <Modal
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingRule(null);
                }}
                title={editingRule ? 'Edit Rule' : 'Create New Rule'}
                size="lg"
            >
                <RuleForm
                    initialRule={editingRule || undefined}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingRule(null);
                    }}
                />
            </Modal>

            {/* Delete confirmation modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Rule"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-slate-600 dark:text-slate-400">
                    Are you sure you want to delete this rule? This action cannot be
                    undone.
                </p>
            </Modal>
        </div>
    );
}
