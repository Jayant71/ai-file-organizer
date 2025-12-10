/**
 * AI Suggestion Service
 * 
 * Provides intelligent file organization suggestions.
 * Currently implements a heuristic-based approach but is designed
 * to easily integrate with LLM APIs (OpenAI, Anthropic, local models).
 * 
 * @example
 * ```typescript
 * const service = new AISuggestionService();
 * const suggestions = await service.getAISuggestions(files, '/home/user');
 * ```
 */

import {
  AISuggestion,
  AISuggestionInput,
  AISuggestionResponse,
  AIServiceConfig,
} from '@/domain/types/ai';
import { FileMeta, getFileCategory, FileCategory } from '@/domain/types/file';

/**
 * Default folder structure for organizing files by category.
 */
const DEFAULT_CATEGORY_FOLDERS: Record<FileCategory, string> = {
  documents: 'Documents/Organized',
  images: 'Media/Images',
  videos: 'Media/Videos',
  audio: 'Media/Audio',
  archives: 'Archives',
  code: 'Development/Code',
  other: 'Miscellaneous',
};

/**
 * Smart folder suggestions based on common file patterns.
 */
const SMART_PATTERNS: {
  pattern: RegExp;
  folder: string;
  reason: string;
}[] = [
  {
    pattern: /screenshot|screen.?shot|capture/i,
    folder: 'Media/Screenshots',
    reason: 'Detected as screenshot based on filename',
  },
  {
    pattern: /invoice|receipt|bill/i,
    folder: 'Documents/Finance/Invoices',
    reason: 'Detected as financial document',
  },
  {
    pattern: /resume|cv|curriculum/i,
    folder: 'Documents/Career',
    reason: 'Detected as career document',
  },
  {
    pattern: /contract|agreement|legal/i,
    folder: 'Documents/Legal',
    reason: 'Detected as legal document',
  },
  {
    pattern: /report|analysis|summary/i,
    folder: 'Documents/Reports',
    reason: 'Detected as report document',
  },
  {
    pattern: /backup|export|dump/i,
    folder: 'Backups',
    reason: 'Detected as backup file',
  },
  {
    pattern: /wallpaper|background/i,
    folder: 'Media/Wallpapers',
    reason: 'Detected as wallpaper image',
  },
  {
    pattern: /avatar|profile|headshot/i,
    folder: 'Media/Profile Pictures',
    reason: 'Detected as profile picture',
  },
];

/**
 * AI Suggestion Service class.
 * Generates intelligent organization suggestions for files.
 */
export class AISuggestionService {
  private config: AIServiceConfig;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      provider: 'heuristic',
      ...config,
    };
  }

  /**
   * Update service configuration.
   */
  configure(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate AI suggestions for a list of files.
   * This is the main entry point for the service.
   * 
   * @param files - Array of file metadata to analyze
   * @param baseFolder - Base folder for organizing (e.g., user's home)
   * @returns Promise<AISuggestion[]> - Array of suggestions
   */
  async getAISuggestions(
    files: FileMeta[],
    baseFolder: string
  ): Promise<AISuggestion[]> {
    const input: AISuggestionInput = {
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        extension: f.extension,
        size: f.size,
        path: f.path,
        mimeType: f.mimeType,
      })),
      baseFolder,
    };

    const response = await this.generateSuggestions(input);
    return response.suggestions;
  }

  /**
   * Full suggestion generation with metadata.
   * Use this when you need processing stats.
   */
  async generateSuggestions(
    input: AISuggestionInput
  ): Promise<AISuggestionResponse> {
    const startTime = performance.now();

    // Route to appropriate provider
    let suggestions: AISuggestion[];
    switch (this.config.provider) {
      case 'openai':
      case 'anthropic':
      case 'local-llm':
        // TODO: Implement LLM-based suggestions
        suggestions = this.generateHeuristicSuggestions(input);
        break;
      case 'heuristic':
      default:
        suggestions = this.generateHeuristicSuggestions(input);
    }

    const endTime = performance.now();

    return {
      suggestions,
      warnings: [],
      metadata: {
        filesProcessed: input.files.length,
        suggestionsGenerated: suggestions.length,
        processingTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  /**
   * Generate suggestions using heuristic rules.
   * This is the default implementation and fallback.
   */
  private generateHeuristicSuggestions(
    input: AISuggestionInput
  ): AISuggestion[] {
    const { files, baseFolder } = input;
    const suggestions: AISuggestion[] = [];

    for (const file of files) {
      // Skip if already in a well-organized location
      if (this.isAlreadyOrganized(file.path)) {
        continue;
      }

      // Try smart pattern matching first
      const patternMatch = this.matchSmartPattern(file.name);
      if (patternMatch) {
        suggestions.push({
          fileId: file.id,
          originalPath: file.path,
          proposedPath: this.buildPath(baseFolder, patternMatch.folder, file.name),
          reason: patternMatch.reason,
          confidence: 0.85,
          category: patternMatch.folder.split('/')[0],
          selected: true,
        });
        continue;
      }

      // Fall back to category-based organization
      const category = getFileCategory(file.extension);
      const categoryFolder = DEFAULT_CATEGORY_FOLDERS[category];

      // Add date-based subfolder for images and videos
      let targetFolder = categoryFolder;
      if (category === 'images' || category === 'videos') {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        targetFolder = `${categoryFolder}/${year}/${month}`;
      }

      suggestions.push({
        fileId: file.id,
        originalPath: file.path,
        proposedPath: this.buildPath(baseFolder, targetFolder, file.name),
        reason: `Organized by file type (${category})`,
        confidence: 0.7,
        category,
        selected: true,
      });
    }

    return suggestions;
  }

  /**
   * Check if a file is already in an organized location.
   */
  private isAlreadyOrganized(path: string): boolean {
    const organizedPatterns = [
      /organized/i,
      /sorted/i,
      /archive/i,
      /backup/i,
    ];
    return organizedPatterns.some((pattern) => pattern.test(path));
  }

  /**
   * Match filename against smart patterns.
   */
  private matchSmartPattern(
    filename: string
  ): { folder: string; reason: string } | null {
    for (const { pattern, folder, reason } of SMART_PATTERNS) {
      if (pattern.test(filename)) {
        return { folder, reason };
      }
    }
    return null;
  }

  /**
   * Build a full path from base, folder, and filename.
   */
  private buildPath(base: string, folder: string, filename: string): string {
    // Normalize path separators
    const normalizedBase = base.replace(/\\/g, '/');
    const normalizedFolder = folder.replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedFolder}/${filename}`.replace(
      /\/+/g,
      '/'
    );
  }

  /**
   * Placeholder for future LLM integration.
   * This method will call external AI APIs.
   */
  private async generateLLMSuggestions(
    input: AISuggestionInput
  ): Promise<AISuggestion[]> {
    // TODO: Implement LLM-based suggestions
    // Example implementation:
    // 
    // const prompt = this.buildPrompt(input);
    // const response = await fetch(this.config.endpoint!, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.config.apiKey}`,
    //   },
    //   body: JSON.stringify({
    //     model: this.config.model,
    //     messages: [{ role: 'user', content: prompt }],
    //     max_tokens: this.config.maxTokens,
    //   }),
    // });
    // 
    // return this.parseAIResponse(await response.json());

    console.warn('LLM suggestions not yet implemented, falling back to heuristics');
    return this.generateHeuristicSuggestions(input);
  }
}

// Export singleton instance
export const aiSuggestionService = new AISuggestionService();

// Export convenience function
export async function getAISuggestions(
  files: FileMeta[],
  baseFolder: string
): Promise<AISuggestion[]> {
  return aiSuggestionService.getAISuggestions(files, baseFolder);
}
