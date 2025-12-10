/**
 * Browser-compatible path utilities.
 * These work in both Node.js and browser environments.
 */

/**
 * Get the file extension from a path.
 */
export function extname(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  const lastSep = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  
  if (lastDot > lastSep && lastDot !== -1) {
    return filePath.slice(lastDot);
  }
  return '';
}

/**
 * Get the file name from a path.
 */
export function basename(filePath: string, ext?: string): string {
  // Normalize separators
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  let name = parts[parts.length - 1] || '';
  
  if (ext && name.endsWith(ext)) {
    name = name.slice(0, -ext.length);
  }
  
  return name;
}

/**
 * Get the directory name from a path.
 */
export function dirname(filePath: string): string {
  // Normalize separators
  const normalized = filePath.replace(/\\/g, '/');
  const lastSep = normalized.lastIndexOf('/');
  
  if (lastSep === -1) {
    return '.';
  }
  
  return normalized.slice(0, lastSep) || '/';
}

/**
 * Join path segments.
 */
export function join(...segments: string[]): string {
  // Filter empty segments and join
  const joined = segments
    .filter(Boolean)
    .join('/')
    .replace(/\\/g, '/');
  
  // Normalize multiple slashes
  return joined.replace(/\/+/g, '/');
}

/**
 * Check if a path is absolute.
 */
export function isAbsolute(filePath: string): boolean {
  // Windows absolute path (e.g., C:\, D:\)
  if (/^[a-zA-Z]:[\\/]/.test(filePath)) {
    return true;
  }
  // Unix absolute path
  if (filePath.startsWith('/')) {
    return true;
  }
  return false;
}

/**
 * Normalize a path (resolve . and ..).
 */
export function normalize(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const result: string[] = [];
  
  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.' && part !== '') {
      result.push(part);
    }
  }
  
  let output = result.join('/');
  
  // Preserve leading slash
  if (normalized.startsWith('/')) {
    output = '/' + output;
  }
  
  // Preserve Windows drive letter
  if (/^[a-zA-Z]:/.test(normalized)) {
    const drive = normalized.slice(0, 2);
    if (!output.startsWith(drive)) {
      output = drive + '/' + output;
    }
  }
  
  return output || '.';
}

// Default export for compatibility
const path = {
  extname,
  basename,
  dirname,
  join,
  isAbsolute,
  normalize,
};

export default path;
