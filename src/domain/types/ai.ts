/**
 * AI suggestion types for intelligent file organization.
 * Designed with a clean interface for future LLM integration.
 */

/**
 * AI organization mode - determines depth of analysis.
 */
export type AIMode = 'quick' | 'smart' | 'deep';

/**
 * User preferences for organization style.
 */
export interface UserOrganizationPreferences {
  /** How aggressive should cleanup be */
  cleanlinessLevel: 'minimal' | 'moderate' | 'aggressive';
  /** Safety preference for operations */
  safetyPreference: 'cautious' | 'balanced' | 'fast';
  /** Priority for file access */
  accessPriority: 'recent' | 'frequent' | 'organized';
  /** How to organize files into folders */
  organizationStyle: 'by-date' | 'by-category' | 'by-type' | 'flat';
  /** Which AI source to prefer */
  aiSourcePreference: 'heuristics-only' | 'llm-only' | 'llm-preferred' | 'heuristics-preferred';
}

/**
 * An AI-generated suggestion for organizing a file.
 */
export interface AISuggestion {
  /** ID of the file this suggestion is for */
  fileId: string;
  /** Original file path */
  originalPath: string;
  /** Proposed target folder path */
  proposedPath: string;
  /** Proposed new name (if rename suggested) */
  proposedName?: string;
  /** Human-readable reason for this suggestion */
  reason: string;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Category assigned to this file */
  category: string;
  /** Whether this suggestion is selected for execution */
  selected: boolean;
  /** Source of the suggestion */
  source: 'heuristic' | 'pattern' | 'llm' | 'duplicate';
  /** Action type */
  action: 'move' | 'rename' | 'archive' | 'review';
  /** Is this file a potential duplicate */
  isDuplicate?: boolean;
  /** ID of the original file if this is a duplicate */
  duplicateOfId?: string;
}

/**
 * Duplicate file group.
 */
export interface DuplicateGroup {
  /** Hash or identifier for this group */
  groupId: string;
  /** Files that are duplicates of each other */
  files: {
    id: string;
    name: string;
    path: string;
    size: number;
    modifiedTime: Date;
  }[];
  /** Suggested file to keep (usually oldest or most organized) */
  suggestedKeepId: string;
  /** Reason for duplicate detection */
  reason: string;
}

/**
 * Folder context analysis result.
 */
export interface FolderAnalysis {
  /** What this folder seems to be about */
  purpose: string;
  /** Suggested subfolder structure */
  suggestedSubfolders: string[];
  /** Categories of files detected */
  detectedCategories: string[];
  /** Overall organization score (0-1) */
  organizationScore: number;
  /** Recommendations for cleanup */
  recommendations: string[];
}

/**
 * Rename suggestion for a file.
 */
export interface RenameSuggestion {
  /** File ID */
  fileId: string;
  /** Current name */
  currentName: string;
  /** Suggested new name */
  suggestedName: string;
  /** Reason for rename */
  reason: string;
  /** Pattern that was matched */
  pattern?: string;
}

/**
 * Input for the AI suggestion service.
 */
export interface AISuggestionInput {
  /** Files to generate suggestions for */
  files: {
    id: string;
    name: string;
    extension: string;
    size: number;
    path: string;
    mimeType?: string;
    modifiedTime?: Date;
    createdTime?: Date;
    content?: string; // First 1KB for Deep mode
  }[];
  /** Base folder for organizing (e.g., user's home or Drive root) */
  baseFolder: string;
  /** Folder path for context */
  folderPath?: string;
  /** AI mode to use */
  mode: AIMode;
  /** Optional preferences to guide suggestions */
  preferences?: UserOrganizationPreferences;
}

/**
 * Response from the AI suggestion service.
 */
export interface AISuggestionResponse {
  /** Generated suggestions */
  suggestions: AISuggestion[];
  /** Detected duplicate groups */
  duplicates: DuplicateGroup[];
  /** Rename suggestions */
  renames: RenameSuggestion[];
  /** Folder analysis (for Deep mode) */
  folderAnalysis?: FolderAnalysis;
  /** Any errors or warnings */
  warnings: string[];
  /** Processing metadata */
  metadata: {
    /** Number of files processed */
    filesProcessed: number;
    /** Number of suggestions generated */
    suggestionsGenerated: number;
    /** Time taken in milliseconds */
    processingTimeMs: number;
    /** Mode used */
    modeUsed: AIMode;
    /** Number of LLM calls made */
    llmCalls?: number;
    /** Batches processed */
    batchesProcessed?: number;
  };
}

/**
 * Progress callback for batch processing.
 */
export type AIProgressCallback = (progress: {
  currentBatch: number;
  totalBatches: number;
  filesProcessed: number;
  totalFiles: number;
  status: string;
}) => void;

/**
 * Configuration for the AI service.
 * Designed to support both local heuristics and remote LLM calls.
 */
export interface AIServiceConfig {
  /** Type of AI provider */
  provider: 'heuristic' | 'openai' | 'anthropic' | 'local-llm';
  /** API endpoint for remote providers */
  endpoint?: string;
  /** API key for remote providers */
  apiKey?: string;
  /** Model to use (for LLM providers) */
  model?: string;
  /** Maximum tokens for LLM requests */
  maxTokens?: number;
  /** Batch size for processing large folders */
  batchSize?: number;
}
