/**
 * Action generators for the rule engine.
 * Each generator creates the proposed changes based on action type.
 */

import { Action, ActionParams } from '../types/rule';
import { FileMeta, FileChange, getFileCategory } from '../types/file';
import { join, basename, dirname, isAbsolute } from '../../utils/path';

/**
 * Format a date according to a pattern.
 * Supports: YYYY, YY, MMMM, MMM, MM, M, DD, D
 */
function formatDate(date: Date, pattern: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return pattern
    .replace('YYYY', String(date.getFullYear()))
    .replace('YY', String(date.getFullYear()).slice(-2))
    .replace('MMMM', months[date.getMonth()])
    .replace('MMM', monthsShort[date.getMonth()])
    .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
    .replace('M', String(date.getMonth() + 1))
    .replace('DD', String(date.getDate()).padStart(2, '0'))
    .replace('D', String(date.getDate()));
}

/**
 * Replace placeholders in a rename pattern.
 * Supports: {name}, {ext}, {date}, {category}, {size}
 */
function applyRenamePattern(file: FileMeta, pattern: string): string {
  const nameWithoutExt = file.name.replace(file.extension, '');
  const date = formatDate(new Date(file.modifiedTime), 'YYYY-MM-DD');
  const category = getFileCategory(file.extension);
  const sizeKB = Math.round(file.size / 1024);

  return pattern
    .replace('{name}', nameWithoutExt)
    .replace('{ext}', file.extension)
    .replace('{date}', date)
    .replace('{category}', category)
    .replace('{size}', `${sizeKB}KB`);
}

/**
 * Generate the proposed path for a move action.
 */
export function generateMovePath(
  file: FileMeta,
  params: ActionParams,
  baseFolder?: string
): string {
  if (!params.targetFolder) {
    return file.path;
  }

  // If target folder is absolute, use it directly
  if (isAbsolute(params.targetFolder)) {
    return join(params.targetFolder, file.name);
  }

  // Otherwise, use it relative to the base folder or file's parent
  const base = baseFolder || file.parentPath;
  return join(base, params.targetFolder, file.name);
}

/**
 * Generate the proposed path for a date-based move action.
 */
export function generateDateBasedPath(
  file: FileMeta,
  params: ActionParams,
  baseFolder?: string
): string {
  const dateFormat = params.dateFormat || 'YYYY/MM';
  const date = new Date(file.modifiedTime);
  const datePath = formatDate(date, dateFormat);

  const targetBase = params.targetFolder || '';
  const base = baseFolder || file.parentPath;

  if (isAbsolute(targetBase)) {
    return join(targetBase, datePath, file.name);
  }

  return join(base, targetBase, datePath, file.name);
}

/**
 * Generate the proposed path for a category-based move action.
 */
export function generateCategoryBasedPath(
  file: FileMeta,
  params: ActionParams,
  baseFolder?: string
): string {
  const category = getFileCategory(file.extension);
  const categoryFolderMap: Record<string, string> = {
    documents: 'Documents',
    images: 'Images',
    videos: 'Videos',
    audio: 'Audio',
    archives: 'Archives',
    code: 'Code',
    other: 'Other',
  };

  const categoryFolder = categoryFolderMap[category] || 'Other';
  const targetBase = params.targetFolder || '';
  const base = baseFolder || file.parentPath;

  if (isAbsolute(targetBase)) {
    return join(targetBase, categoryFolder, file.name);
  }

  return join(base, targetBase, categoryFolder, file.name);
}

/**
 * Generate the proposed name for a rename action.
 */
export function generateRenamedPath(
  file: FileMeta,
  params: ActionParams
): string {
  if (!params.renamePattern) {
    return file.path;
  }

  const newName = applyRenamePattern(file, params.renamePattern);
  return join(file.parentPath, newName);
}

/**
 * Apply an action to a file and generate the proposed change.
 */
export function applyAction(
  file: FileMeta,
  action: Action,
  baseFolder?: string
): { proposedPath: string; proposedName: string } {
  let proposedPath: string;

  switch (action.type) {
    case 'move':
      proposedPath = generateMovePath(file, action.params, baseFolder);
      break;
    case 'moveByDate':
      proposedPath = generateDateBasedPath(file, action.params, baseFolder);
      break;
    case 'moveByCategory':
      proposedPath = generateCategoryBasedPath(file, action.params, baseFolder);
      break;
    case 'rename':
      proposedPath = generateRenamedPath(file, action.params);
      break;
    default:
      proposedPath = file.path;
  }

  const proposedName = basename(proposedPath);
  return { proposedPath, proposedName };
}

/**
 * Apply all actions from a rule to a file.
 * Actions are applied in sequence.
 */
export function applyAllActions(
  file: FileMeta,
  actions: Action[],
  baseFolder?: string
): { proposedPath: string; proposedName: string } {
  let currentFile = { ...file };
  let result = { proposedPath: file.path, proposedName: file.name };

  for (const action of actions) {
    result = applyAction(currentFile, action, baseFolder);
    // Update current file for next action
    currentFile = {
      ...currentFile,
      path: result.proposedPath,
      name: result.proposedName,
      parentPath: dirname(result.proposedPath),
    };
  }

  return result;
}
