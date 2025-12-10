/**
 * File metadata type representing a local or cloud file.
 * Used throughout the application for file scanning and rule matching.
 */
export interface FileMeta {
  /** Unique identifier for the file */
  id: string;
  /** Full path to the file (local) or Drive path */
  path: string;
  /** File name including extension */
  name: string;
  /** File extension (e.g., '.pdf', '.jpg') */
  extension: string;
  /** File size in bytes */
  size: number;
  /** File creation timestamp */
  createdTime: Date;
  /** File last modified timestamp */
  modifiedTime: Date;
  /** MIME type of the file */
  mimeType: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Source of the file */
  source: 'local' | 'drive';
  /** Parent folder path */
  parentPath: string;
}

/**
 * Represents a proposed change to a file (move or rename).
 * Used in preview mode before applying changes.
 */
export interface FileChange {
  /** Original file metadata */
  file: FileMeta;
  /** Current file path */
  currentPath: string;
  /** Current file name */
  currentName: string;
  /** Proposed new path after applying rule */
  proposedPath: string;
  /** Proposed new name after applying rule */
  proposedName: string;
  /** Name of the rule that generated this change */
  matchedRule: string;
  /** Rule ID that matched */
  matchedRuleId: string;
  /** Whether this change is selected for execution */
  selected: boolean;
  /** Status of the operation */
  status: 'pending' | 'success' | 'error' | 'skipped';
  /** Error message if operation failed */
  errorMessage?: string;
}

/**
 * File category for grouping files by type.
 */
export type FileCategory = 
  | 'documents'
  | 'images'
  | 'videos'
  | 'audio'
  | 'archives'
  | 'code'
  | 'other';

/**
 * Mapping of extensions to file categories.
 */
export const FILE_CATEGORY_MAP: Record<string, FileCategory> = {
  // Documents
  '.pdf': 'documents',
  '.doc': 'documents',
  '.docx': 'documents',
  '.txt': 'documents',
  '.rtf': 'documents',
  '.odt': 'documents',
  '.xls': 'documents',
  '.xlsx': 'documents',
  '.ppt': 'documents',
  '.pptx': 'documents',
  '.csv': 'documents',
  
  // Images
  '.jpg': 'images',
  '.jpeg': 'images',
  '.png': 'images',
  '.gif': 'images',
  '.bmp': 'images',
  '.svg': 'images',
  '.webp': 'images',
  '.ico': 'images',
  '.tiff': 'images',
  '.raw': 'images',
  
  // Videos
  '.mp4': 'videos',
  '.avi': 'videos',
  '.mkv': 'videos',
  '.mov': 'videos',
  '.wmv': 'videos',
  '.flv': 'videos',
  '.webm': 'videos',
  '.m4v': 'videos',
  '.3gp': 'videos',
  
  // Audio
  '.mp3': 'audio',
  '.wav': 'audio',
  '.flac': 'audio',
  '.aac': 'audio',
  '.ogg': 'audio',
  '.wma': 'audio',
  '.m4a': 'audio',
  '.opus': 'audio',
  '.aiff': 'audio',
  '.mid': 'audio',
  '.midi': 'audio',
  
  // Archives
  '.zip': 'archives',
  '.rar': 'archives',
  '.7z': 'archives',
  '.tar': 'archives',
  '.gz': 'archives',
  '.bz2': 'archives',
  '.xz': 'archives',
  '.iso': 'archives',
  '.dmg': 'archives',
  
  // Code
  '.js': 'code',
  '.ts': 'code',
  '.jsx': 'code',
  '.tsx': 'code',
  '.py': 'code',
  '.java': 'code',
  '.c': 'code',
  '.cpp': 'code',
  '.h': 'code',
  '.hpp': 'code',
  '.cs': 'code',
  '.go': 'code',
  '.rs': 'code',
  '.php': 'code',
  '.rb': 'code',
  '.swift': 'code',
  '.kt': 'code',
  '.html': 'code',
  '.css': 'code',
  '.scss': 'code',
  '.sass': 'code',
  '.less': 'code',
  '.json': 'code',
  '.xml': 'code',
  '.yaml': 'code',
  '.yml': 'code',
  '.md': 'code',
  '.sql': 'code',
  '.sh': 'code',
  '.bash': 'code',
  '.ps1': 'code',
  '.bat': 'code',
  '.vue': 'code',
  '.svelte': 'code',
  '.r': 'code',
  '.scala': 'code',
  '.lua': 'code',
  '.pl': 'code',
  '.dart': 'code',
  '.elm': 'code',
  '.ex': 'code',
  '.exs': 'code',
  '.ipynb': 'code',
  
  // Data files
  '.db': 'other',
  '.sqlite': 'other',
  '.mdb': 'other',
  '.accdb': 'other',
  
  // Ebooks
  '.epub': 'documents',
  '.mobi': 'documents',
  '.azw': 'documents',
  '.azw3': 'documents',
  
  // Fonts
  '.ttf': 'other',
  '.otf': 'other',
  '.woff': 'other',
  '.woff2': 'other',
  '.eot': 'other',
  
  // Design files
  '.psd': 'images',
  '.ai': 'images',
  '.sketch': 'images',
  '.fig': 'images',
  '.xd': 'images',
  '.indd': 'documents',
  
  // 3D files
  '.obj': 'other',
  '.fbx': 'other',
  '.stl': 'other',
  '.blend': 'other',
  '.max': 'other',
  
  // Executables
  '.exe': 'other',
  '.msi': 'other',
  '.app': 'other',
  '.deb': 'other',
  '.rpm': 'other',
  '.apk': 'other',
  '.ipa': 'other',
};

/**
 * Get the category of a file based on its extension.
 */
export function getFileCategory(extension: string): FileCategory {
  return FILE_CATEGORY_MAP[extension.toLowerCase()] || 'other';
}

/**
 * Operation log entry for tracking applied changes.
 */
export interface OperationLogEntry {
  /** Unique ID for this log entry */
  id: string;
  /** Timestamp of the operation */
  timestamp: Date;
  /** Type of operation */
  operation: 'move' | 'rename';
  /** Original file path */
  sourcePath: string;
  /** New file path */
  destinationPath: string;
  /** Whether operation succeeded */
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
  /** Source type */
  source: 'local' | 'drive';
}
