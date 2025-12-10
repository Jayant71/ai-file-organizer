/**
 * AI suggestion types for intelligent file organization.
 * Designed with a clean interface for future LLM integration.
 */

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
  /** Human-readable reason for this suggestion */
  reason: string;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Category assigned to this file */
  category: string;
  /** Whether this suggestion is selected for execution */
  selected: boolean;
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
  }[];
  /** Base folder for organizing (e.g., user's home or Drive root) */
  baseFolder: string;
  /** Optional preferences to guide suggestions */
  preferences?: {
    /** Preferred folder structure style */
    folderStyle?: 'flat' | 'byCategory' | 'byDate' | 'hybrid';
    /** Custom category mappings */
    customCategories?: Record<string, string[]>;
  };
}

/**
 * Response from the AI suggestion service.
 */
export interface AISuggestionResponse {
  /** Generated suggestions */
  suggestions: AISuggestion[];
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
  };
}

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
}
