/**
 * Rule Engine - Core logic for matching and applying organization rules.
 * 
 * This module provides the main RuleEngine class that:
 * 1. Evaluates files against configured rules
 * 2. Generates proposed changes (preview mode)
 * 3. Supports both local and Google Drive files
 */

import { Rule, RuleScope } from '../types/rule';
import { FileMeta, FileChange } from '../types/file';
import { matchAllConditions } from './conditions';
import { applyAllActions } from './actions';

/**
 * Result of evaluating a single file against all rules.
 */
export interface RuleEvaluationResult {
  /** The file that was evaluated */
  file: FileMeta;
  /** Whether any rule matched */
  matched: boolean;
  /** The rule that matched (first matching rule) */
  matchedRule?: Rule;
  /** The proposed change if a rule matched */
  proposedChange?: FileChange;
}

/**
 * Result of evaluating multiple files against all rules.
 */
export interface BatchEvaluationResult {
  /** Total number of files evaluated */
  totalFiles: number;
  /** Number of files that matched at least one rule */
  matchedFiles: number;
  /** Proposed changes for matched files */
  changes: FileChange[];
  /** Files that didn't match any rule */
  unmatched: FileMeta[];
  /** Evaluation statistics */
  stats: {
    /** Rules evaluated */
    rulesChecked: number;
    /** Time taken in milliseconds */
    evaluationTimeMs: number;
  };
}

/**
 * Options for rule evaluation.
 */
export interface EvaluationOptions {
  /** Scope to filter rules (if specified, only rules matching this scope are used) */
  scope?: RuleScope;
  /** Base folder for relative paths */
  baseFolder?: string;
  /** Whether to stop at first matching rule (default: true) */
  stopAtFirstMatch?: boolean;
}

/**
 * Rule Engine class for evaluating files against organization rules.
 */
export class RuleEngine {
  private rules: Rule[] = [];

  /**
   * Create a new RuleEngine with the given rules.
   */
  constructor(rules: Rule[] = []) {
    this.rules = this.sortRulesByPriority(rules);
  }

  /**
   * Update the rules used by this engine.
   */
  setRules(rules: Rule[]): void {
    this.rules = this.sortRulesByPriority(rules);
  }

  /**
   * Get all configured rules.
   */
  getRules(): Rule[] {
    return [...this.rules];
  }

  /**
   * Sort rules by priority (lower number = higher priority).
   */
  private sortRulesByPriority(rules: Rule[]): Rule[] {
    return [...rules].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Filter rules by scope.
   */
  private filterRulesByScope(scope?: RuleScope): Rule[] {
    if (!scope) {
      return this.rules;
    }

    return this.rules.filter((rule) => {
      if (rule.scope === 'both') return true;
      return rule.scope === scope;
    });
  }

  /**
   * Evaluate a single file against all enabled rules.
   * Returns the first matching rule and proposed change.
   */
  evaluateFile(
    file: FileMeta,
    options: EvaluationOptions = {}
  ): RuleEvaluationResult {
    const { scope, baseFolder, stopAtFirstMatch = true } = options;

    // Skip directories
    if (file.isDirectory) {
      return { file, matched: false };
    }

    // Get applicable rules
    const applicableRules = this.filterRulesByScope(scope).filter(
      (rule) => rule.enabled
    );

    for (const rule of applicableRules) {
      if (matchAllConditions(file, rule.conditions)) {
        const { proposedPath, proposedName } = applyAllActions(
          file,
          rule.actions,
          baseFolder
        );

        // Skip if no change
        if (proposedPath === file.path && proposedName === file.name) {
          continue;
        }

        const change: FileChange = {
          file,
          currentPath: file.path,
          currentName: file.name,
          proposedPath,
          proposedName,
          matchedRule: rule.name,
          matchedRuleId: rule.id,
          selected: true,
          status: 'pending',
        };

        if (stopAtFirstMatch) {
          return { file, matched: true, matchedRule: rule, proposedChange: change };
        }
      }
    }

    return { file, matched: false };
  }

  /**
   * Evaluate multiple files against all enabled rules.
   * Returns a batch result with all proposed changes.
   */
  evaluateFiles(
    files: FileMeta[],
    options: EvaluationOptions = {}
  ): BatchEvaluationResult {
    const startTime = performance.now();
    const changes: FileChange[] = [];
    const unmatched: FileMeta[] = [];
    const scope = options.scope;
    const applicableRules = this.filterRulesByScope(scope).filter(
      (rule) => rule.enabled
    );

    for (const file of files) {
      const result = this.evaluateFile(file, options);
      
      if (result.matched && result.proposedChange) {
        changes.push(result.proposedChange);
      } else if (!file.isDirectory) {
        unmatched.push(file);
      }
    }

    const endTime = performance.now();

    return {
      totalFiles: files.length,
      matchedFiles: changes.length,
      changes,
      unmatched,
      stats: {
        rulesChecked: applicableRules.length,
        evaluationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  /**
   * Preview changes without applying them.
   * Alias for evaluateFiles for semantic clarity.
   */
  preview(
    files: FileMeta[],
    options: EvaluationOptions = {}
  ): BatchEvaluationResult {
    return this.evaluateFiles(files, options);
  }
}

// Export a default instance
export const ruleEngine = new RuleEngine();

// Re-export from modules
export { matchCondition, matchAllConditions } from './conditions';
export { applyAction, applyAllActions } from './actions';
