/**
 * Types for the rule engine that powers file organization.
 * Rules consist of conditions to match files and actions to apply.
 */

/**
 * Types of conditions that can be used to match files.
 */
export type ConditionType =
  | 'extension'      // Match by file extension
  | 'category'       // Match by file category (documents, images, etc.)
  | 'size'           // Match by file size
  | 'age'            // Match by file age (days since modified)
  | 'path'           // Match by file path
  | 'name';          // Match by file name pattern

/**
 * Comparison operators for conditions.
 */
export type ConditionOperator =
  | 'in'             // Value is in a list
  | 'notIn'          // Value is not in a list
  | 'equals'         // Exact match
  | 'notEquals'      // Not equal
  | 'contains'       // String contains
  | 'startsWith'     // String starts with
  | 'endsWith'       // String ends with
  | 'gt'             // Greater than (for numbers)
  | 'lt'             // Less than (for numbers)
  | 'gte'            // Greater than or equal
  | 'lte';           // Less than or equal

/**
 * A single condition for matching files.
 */
export interface Condition {
  /** Unique ID for this condition */
  id: string;
  /** Type of condition */
  type: ConditionType;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Value to compare against (string, number, or array) */
  value: string | number | string[];
}

/**
 * Types of actions that can be applied to matched files.
 */
export type ActionType =
  | 'move'           // Move to a specific folder
  | 'moveByDate'     // Move to date-based folder structure
  | 'moveByCategory' // Move to category-based folder
  | 'rename';        // Rename with a pattern

/**
 * An action to apply to matched files.
 */
export interface Action {
  /** Unique ID for this action */
  id: string;
  /** Type of action */
  type: ActionType;
  /** Action parameters */
  params: ActionParams;
}

/**
 * Parameters for different action types.
 */
export interface ActionParams {
  /** Target folder path (for move actions) */
  targetFolder?: string;
  /** Date format pattern (for moveByDate), e.g., "YYYY/MM" */
  dateFormat?: string;
  /** Rename pattern, supports placeholders like {name}, {date}, {ext} */
  renamePattern?: string;
  /** Whether to create target folder if it doesn't exist */
  createIfNotExists?: boolean;
}

/**
 * Scope of where a rule applies.
 */
export type RuleScope = 'local' | 'drive' | 'both';

/**
 * A complete rule definition.
 */
export interface Rule {
  /** Unique ID for this rule */
  id: string;
  /** Human-readable name for the rule */
  name: string;
  /** Description of what this rule does */
  description: string;
  /** Conditions that must all match for the rule to apply */
  conditions: Condition[];
  /** Actions to apply when conditions match */
  actions: Action[];
  /** Whether this rule applies to local files, Drive files, or both */
  scope: RuleScope;
  /** Whether this rule is currently enabled */
  enabled: boolean;
  /** Order in which rules are evaluated (lower = earlier) */
  priority: number;
  /** When this rule was created */
  createdAt: Date;
  /** When this rule was last modified */
  updatedAt: Date;
}

/**
 * Default rules that come pre-configured with the app.
 */
export const DEFAULT_RULES: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Organize Documents',
    description: 'Move document files (PDF, DOC, etc.) to Documents folder',
    conditions: [
      {
        id: 'cond-1',
        type: 'category',
        operator: 'equals',
        value: 'documents',
      },
    ],
    actions: [
      {
        id: 'act-1',
        type: 'move',
        params: {
          targetFolder: 'Documents/Organized',
          createIfNotExists: true,
        },
      },
    ],
    scope: 'both',
    enabled: false,
    priority: 1,
  },
  {
    name: 'Organize Images by Date',
    description: 'Move images to year/month folders',
    conditions: [
      {
        id: 'cond-2',
        type: 'category',
        operator: 'equals',
        value: 'images',
      },
    ],
    actions: [
      {
        id: 'act-2',
        type: 'moveByDate',
        params: {
          targetFolder: 'Pictures/Organized',
          dateFormat: 'YYYY/MMMM',
          createIfNotExists: true,
        },
      },
    ],
    scope: 'both',
    enabled: false,
    priority: 2,
  },
  {
    name: 'Archive Old Downloads',
    description: 'Move files older than 30 days to Archive folder',
    conditions: [
      {
        id: 'cond-3',
        type: 'age',
        operator: 'gt',
        value: 30,
      },
    ],
    actions: [
      {
        id: 'act-3',
        type: 'moveByDate',
        params: {
          targetFolder: 'Archive',
          dateFormat: 'YYYY',
          createIfNotExists: true,
        },
      },
    ],
    scope: 'local',
    enabled: false,
    priority: 3,
  },
];
