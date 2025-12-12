/**
 * Rules Page
 * Manage organization rules with beginner-friendly guidance.
 */

import React, { useState } from 'react';
import { Button, Modal, EmptyState, HelpIcon } from '../components/common';
import RuleCard from '../components/rules/RuleCard';
import RuleForm from '../components/rules/RuleForm';
import { useRules } from '../context/RulesContext';
import { Rule } from '@/domain/types/rule';

// Example rules for beginners
const exampleRules = [
    {
        name: 'Sort Documents',
        description: 'Move PDF, Word, and Excel files to a Documents folder',
        icon: '📄',
    },
    {
        name: 'Organize Photos',
        description: 'Move images and photos by date (Year/Month)',
        icon: '📸',
    },
    {
        name: 'Archive Old Files',
        description: 'Move files older than 30 days to an Archive folder',
        icon: '📦',
    },
];

export default function RulesPage() {
    const { rules, addRule, updateRule, deleteRule, toggleRule } = useRules();
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showExamples, setShowExamples] = useState(false);

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
                        📋 My Rules
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create custom rules to automatically organize specific types of files
                    </p>
                </div>
                <Button onClick={handleCreate}>+ Create Rule</Button>
            </div>

            {/* What are rules - Explainer */}
            <div className="card p-5 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-4">
                    <div className="text-3xl">🤔</div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                            What are Rules?
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            Rules let you tell the app exactly how to organize certain files. For example:
                        </p>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                "Move all PDFs to my Documents folder"
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                "Put photos in folders by year and month"
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                "Archive files I haven't touched in 60 days"
                            </li>
                        </ul>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                            💡 <strong>Tip:</strong> You don't need rules to use this app! The AI can automatically suggest how to organize files.
                            Rules are for when you want <em>specific</em> behavior.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {rules.length > 0 && (
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            Active
                            <HelpIcon tooltip="These rules will run when you click 'Use My Rules'" />
                        </p>
                        <p className="text-2xl font-bold text-green-500">{enabledRules.length}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            Paused
                            <HelpIcon tooltip="These rules won't run until you turn them back on" />
                        </p>
                        <p className="text-2xl font-bold text-slate-400">
                            {disabledRules.length}
                        </p>
                    </div>
                </div>
            )}

            {/* Rules list */}
            {rules.length === 0 ? (
                <div className="space-y-6">
                    <EmptyState
                        icon="📋"
                        title="No rules yet"
                        description="Create your first rule, or just use AI Suggestions which work without any rules!"
                        actionLabel="Create Rule"
                        onAction={handleCreate}
                    />

                    {/* Example rules */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                💡 Example Rules to Get You Started
                            </h3>
                            <button
                                onClick={() => setShowExamples(!showExamples)}
                                className="text-sm text-primary-500 hover:text-primary-600"
                            >
                                {showExamples ? 'Hide' : 'Show'} examples
                            </button>
                        </div>

                        {showExamples && (
                            <div className="grid gap-3">
                                {exampleRules.map((example, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                    >
                                        <span className="text-3xl">{example.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                                {example.name}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {example.description}
                                            </p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleCreate}
                                        >
                                            Create Similar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Enabled rules */}
                    {enabledRules.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="text-green-500">●</span> Active Rules
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
                            <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                                <span className="text-slate-400">○</span> Paused Rules
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
                title={editingRule ? '✏️ Edit Rule' : '✨ Create New Rule'}
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
                title="🗑️ Delete Rule"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                            Keep It
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                        >
                            Yes, Delete
                        </Button>
                    </>
                }
            >
                <p className="text-slate-600 dark:text-slate-400">
                    Are you sure you want to delete this rule?
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                    This won't undo any files that were already moved.
                </p>
            </Modal>
        </div>
    );
}
