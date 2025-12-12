/**
 * Rules Context
 * Manages organization rules across the application.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Rule, DEFAULT_RULES, Condition, ConditionType, ConditionOperator } from '@/domain/types/rule';
import { v4 as uuidv4 } from 'uuid';

interface RulesContextType {
    rules: Rule[];
    isLoading: boolean;
    addRule: (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateRule: (id: string, updates: Partial<Rule>) => void;
    deleteRule: (id: string) => void;
    toggleRule: (id: string) => void;
    reorderRules: (ruleIds: string[]) => void;
    getEnabledRules: (scope?: 'local' | 'drive' | 'both') => Rule[];
}

const RulesContext = createContext<RulesContextType | undefined>(undefined);

// Storage key for persisting rules
const RULES_STORAGE_KEY = 'smart-file-organizer-rules';

// Valid operators for each condition type
const VALID_OPERATORS: Record<ConditionType, ConditionOperator[]> = {
    category: ['equals', 'notEquals', 'in', 'notIn'],
    extension: ['in', 'notIn', 'equals', 'notEquals'],
    size: ['gt', 'lt', 'gte', 'lte', 'equals'],
    age: ['gt', 'lt', 'gte', 'lte', 'equals'],
    name: ['contains', 'startsWith', 'endsWith', 'equals', 'notEquals'],
    path: ['contains', 'startsWith', 'endsWith', 'equals', 'notEquals'],
};

// Default operator for each condition type
const DEFAULT_OPERATORS: Record<ConditionType, ConditionOperator> = {
    category: 'equals',
    extension: 'in',
    size: 'gt',
    age: 'gt',
    name: 'contains',
    path: 'contains',
};

/**
 * Migrate and fix conditions with invalid operator combinations.
 * This fixes rules created before the bug fix where changing condition type
 * didn't reset the operator properly.
 */
function migrateConditions(conditions: Condition[]): { conditions: Condition[]; migrated: boolean } {
    let migrated = false;

    const fixedConditions = conditions.map((condition) => {
        const validOps = VALID_OPERATORS[condition.type];

        // If operator is not valid for this type, set to default
        if (!validOps || !validOps.includes(condition.operator)) {
            console.log(`Migrating condition: type=${condition.type}, invalid operator=${condition.operator} -> ${DEFAULT_OPERATORS[condition.type]}`);
            migrated = true;
            return {
                ...condition,
                operator: DEFAULT_OPERATORS[condition.type],
            };
        }

        return condition;
    });

    return { conditions: fixedConditions, migrated };
}

export function RulesProvider({ children }: { children: React.ReactNode }) {
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load rules from storage
    useEffect(() => {
        const loadRules = () => {
            try {
                const stored = localStorage.getItem(RULES_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    let needsSave = false;

                    // Convert date strings back to Date objects and migrate conditions
                    const rulesWithDates = parsed.map((rule: any) => {
                        const { conditions, migrated } = migrateConditions(rule.conditions || []);
                        if (migrated) {
                            needsSave = true;
                        }
                        return {
                            ...rule,
                            conditions,
                            createdAt: new Date(rule.createdAt),
                            updatedAt: new Date(rule.updatedAt),
                        };
                    });

                    setRules(rulesWithDates);

                    // Save back if any rules were migrated
                    if (needsSave) {
                        console.log('Saving migrated rules to storage');
                        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rulesWithDates));
                    }
                } else {
                    // Initialize with default rules
                    const now = new Date();
                    const defaultRulesWithIds = DEFAULT_RULES.map((rule, index) => ({
                        ...rule,
                        id: uuidv4(),
                        createdAt: now,
                        updatedAt: now,
                    }));
                    setRules(defaultRulesWithIds);
                    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(defaultRulesWithIds));
                }
            } catch (error) {
                console.error('Failed to load rules:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRules();
    }, []);

    // Save rules to storage
    const saveRules = useCallback((newRules: Rule[]) => {
        try {
            localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(newRules));
        } catch (error) {
            console.error('Failed to save rules:', error);
        }
    }, []);

    const addRule = useCallback(
        (ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) => {
            const now = new Date();
            const newRule: Rule = {
                ...ruleData,
                id: uuidv4(),
                createdAt: now,
                updatedAt: now,
            };

            setRules((prev) => {
                const updated = [...prev, newRule];
                saveRules(updated);
                return updated;
            });
        },
        [saveRules]
    );

    const updateRule = useCallback(
        (id: string, updates: Partial<Rule>) => {
            setRules((prev) => {
                const updated = prev.map((rule) =>
                    rule.id === id
                        ? { ...rule, ...updates, updatedAt: new Date() }
                        : rule
                );
                saveRules(updated);
                return updated;
            });
        },
        [saveRules]
    );

    const deleteRule = useCallback(
        (id: string) => {
            setRules((prev) => {
                const updated = prev.filter((rule) => rule.id !== id);
                saveRules(updated);
                return updated;
            });
        },
        [saveRules]
    );

    const toggleRule = useCallback(
        (id: string) => {
            setRules((prev) => {
                const updated = prev.map((rule) =>
                    rule.id === id
                        ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
                        : rule
                );
                saveRules(updated);
                return updated;
            });
        },
        [saveRules]
    );

    const reorderRules = useCallback(
        (ruleIds: string[]) => {
            setRules((prev) => {
                const ruleMap = new Map(prev.map((rule) => [rule.id, rule]));
                const updated = ruleIds
                    .map((id, index) => {
                        const rule = ruleMap.get(id);
                        return rule ? { ...rule, priority: index } : null;
                    })
                    .filter((rule): rule is Rule => rule !== null);

                saveRules(updated);
                return updated;
            });
        },
        [saveRules]
    );

    const getEnabledRules = useCallback(
        (scope?: 'local' | 'drive' | 'both') => {
            return rules
                .filter((rule) => {
                    if (!rule.enabled) return false;
                    if (!scope) return true;
                    return rule.scope === scope || rule.scope === 'both';
                })
                .sort((a, b) => a.priority - b.priority);
        },
        [rules]
    );

    return (
        <RulesContext.Provider
            value={{
                rules,
                isLoading,
                addRule,
                updateRule,
                deleteRule,
                toggleRule,
                reorderRules,
                getEnabledRules,
            }}
        >
            {children}
        </RulesContext.Provider>
    );
}

export function useRules() {
    const context = useContext(RulesContext);
    if (context === undefined) {
        throw new Error('useRules must be used within a RulesProvider');
    }
    return context;
}
