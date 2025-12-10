/**
 * Google Drive specific types.
 */

/**
 * Represents a file or folder in Google Drive.
 */
export interface DriveFile {
  /** Google Drive file ID */
  id: string;
  /** File name */
  name: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes (not available for folders) */
  size?: number;
  /** Created time */
  createdTime: Date;
  /** Modified time */
  modifiedTime: Date;
  /** Parent folder IDs */
  parents: string[];
  /** Full path in Drive (computed) */
  path: string;
  /** Whether this is a folder */
  isFolder: boolean;
  /** Web view link */
  webViewLink?: string;
  /** Icon link */
  iconLink?: string;
  /** Owner info */
  owners?: {
    displayName: string;
    emailAddress: string;
  }[];
}

/**
 * Google Drive authentication state.
 */
export interface DriveAuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** User's email address */
  email?: string;
  /** User's display name */
  displayName?: string;
  /** User's profile picture URL */
  photoUrl?: string;
  /** Access token expiry time */
  tokenExpiresAt?: Date;
}

/**
 * Options for listing Drive files.
 */
export interface DriveListOptions {
  /** Folder ID to list files from (default: 'root') */
  folderId?: string;
  /** Search query (Drive API q parameter) */
  query?: string;
  /** Maximum number of files to return */
  pageSize?: number;
  /** Page token for pagination */
  pageToken?: string;
  /** Fields to include in response */
  fields?: string[];
  /** Order by field */
  orderBy?: string;
  /** Whether to include trashed files */
  includeTrash?: boolean;
}

/**
 * Response from listing Drive files.
 */
export interface DriveListResponse {
  /** Files in the current page */
  files: DriveFile[];
  /** Token for next page (if any) */
  nextPageToken?: string;
  /** Whether there are more files */
  hasMore: boolean;
}

/**
 * Options for moving a Drive file.
 */
export interface DriveMoveOptions {
  /** File ID to move */
  fileId: string;
  /** Current parent folder ID */
  currentParentId: string;
  /** New parent folder ID */
  newParentId: string;
  /** Optional new name for the file */
  newName?: string;
}

/**
 * Result of a Drive operation.
 */
export interface DriveOperationResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Updated file (if successful) */
  file?: DriveFile;
  /** Error message (if failed) */
  error?: string;
}
