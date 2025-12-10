/**
 * Condition matchers for the rule engine.
 * Each matcher function evaluates a specific condition type against a file.
 */

import { Condition, ConditionOperator, ConditionType } from '../types/rule';
import { FileMeta, getFileCategory, FileCategory } from '../types/file';

/**
 * Evaluates whether a file matches a given condition.
 * @param file - The file to evaluate
 * @param condition - The condition to check
 * @returns true if the file matches the condition
 */
export function matchCondition(file: FileMeta, condition: Condition): boolean {
  switch (condition.type) {
    case 'extension':
      return matchExtension(file, condition);
    case 'category':
      return matchCategory(file, condition);
    case 'size':
      return matchSize(file, condition);
    case 'age':
      return matchAge(file, condition);
    case 'path':
      return matchPath(file, condition);
    case 'name':
      return matchName(file, condition);
    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Match by file extension.
 * Supports: in, notIn, equals, notEquals
 */
function matchExtension(file: FileMeta, condition: Condition): boolean {
  const ext = file.extension.toLowerCase();
  const value = condition.value;

  switch (condition.operator) {
    case 'in':
      if (Array.isArray(value)) {
        return value.map((v) => v.toLowerCase()).includes(ext);
      }
      return false;
    case 'notIn':
      if (Array.isArray(value)) {
        return !value.map((v) => v.toLowerCase()).includes(ext);
      }
      return true;
    case 'equals':
      return ext === String(value).toLowerCase();
    case 'notEquals':
      return ext !== String(value).toLowerCase();
    default:
      return false;
  }
}

/**
 * Match by file category (documents, images, videos, etc.).
 * Supports: equals, notEquals, in, notIn
 */
function matchCategory(file: FileMeta, condition: Condition): boolean {
  const category = getFileCategory(file.extension);
  const value = condition.value;

  switch (condition.operator) {
    case 'equals':
      return category === value;
    case 'notEquals':
      return category !== value;
    case 'in':
      if (Array.isArray(value)) {
        return value.includes(category);
      }
      return false;
    case 'notIn':
      if (Array.isArray(value)) {
        return !value.includes(category);
      }
      return true;
    default:
      return false;
  }
}

/**
 * Match by file size (in bytes).
 * Supports: gt, lt, gte, lte, equals
 */
function matchSize(file: FileMeta, condition: Condition): boolean {
  const size = file.size;
  const threshold = Number(condition.value);

  if (isNaN(threshold)) {
    console.warn('Size condition value must be a number');
    return false;
  }

  switch (condition.operator) {
    case 'gt':
      return size > threshold;
    case 'lt':
      return size < threshold;
    case 'gte':
      return size >= threshold;
    case 'lte':
      return size <= threshold;
    case 'equals':
      return size === threshold;
    default:
      return false;
  }
}

/**
 * Match by file age (days since last modified).
 * Supports: gt, lt, gte, lte, equals
 */
function matchAge(file: FileMeta, condition: Condition): boolean {
  const now = new Date();
  const modifiedTime = new Date(file.modifiedTime);
  const ageInDays = Math.floor(
    (now.getTime() - modifiedTime.getTime()) / (1000 * 60 * 60 * 24)
  );
  const threshold = Number(condition.value);

  if (isNaN(threshold)) {
    console.warn('Age condition value must be a number');
    return false;
  }

  switch (condition.operator) {
    case 'gt':
      return ageInDays > threshold;
    case 'lt':
      return ageInDays < threshold;
    case 'gte':
      return ageInDays >= threshold;
    case 'lte':
      return ageInDays <= threshold;
    case 'equals':
      return ageInDays === threshold;
    default:
      return false;
  }
}

/**
 * Match by file path.
 * Supports: contains, startsWith, endsWith, equals
 */
function matchPath(file: FileMeta, condition: Condition): boolean {
  const path = file.path.toLowerCase();
  const value = String(condition.value).toLowerCase();

  switch (condition.operator) {
    case 'contains':
      return path.includes(value);
    case 'startsWith':
      return path.startsWith(value);
    case 'endsWith':
      return path.endsWith(value);
    case 'equals':
      return path === value;
    case 'notEquals':
      return path !== value;
    default:
      return false;
  }
}

/**
 * Match by file name (without extension).
 * Supports: contains, startsWith, endsWith, equals
 */
function matchName(file: FileMeta, condition: Condition): boolean {
  const name = file.name.toLowerCase();
  const value = String(condition.value).toLowerCase();

  switch (condition.operator) {
    case 'contains':
      return name.includes(value);
    case 'startsWith':
      return name.startsWith(value);
    case 'endsWith':
      return name.endsWith(value);
    case 'equals':
      return name === value;
    case 'notEquals':
      return name !== value;
    default:
      return false;
  }
}

/**
 * Evaluates all conditions for a rule (AND logic).
 * All conditions must match for the rule to apply.
 */
export function matchAllConditions(
  file: FileMeta,
  conditions: Condition[]
): boolean {
  if (conditions.length === 0) {
    return true; // No conditions means match all
  }
  return conditions.every((condition) => matchCondition(file, condition));
}
