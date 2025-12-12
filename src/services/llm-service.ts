/**
 * LLM Service
 * 
 * Provides AI-powered file organization using OpenAI API.
 * Handles batched processing for large folders.
 */

import type { 
  AIMode, 
  AISuggestion, 
  FolderAnalysis, 
  AIProgressCallback,
  UserOrganizationPreferences 
} from '@/domain/types/ai';
import type { FileMeta } from '@/domain/types/file';

// Batch size for processing large folders
const BATCH_SIZE = 25;

// Default OpenAI model
const DEFAULT_MODEL = 'gpt-4.1-2025-04-14';

interface LLMConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface FileForLLM {
  id: string;
  name: string;
  extension: string;
  size: number;
  path: string;
  modifiedDaysAgo: number;
  content?: string;
}

/**
 * LLM Service for AI-powered file organization.
 */
export class LLMService {
  private config: LLMConfig;
  private abortController: AbortController | null = null;

  constructor(config: LLMConfig) {
    this.config = {
      ...config,
      model: config.model || DEFAULT_MODEL,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
    };
  }

  /**
   * Cancel any ongoing requests.
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Analyze folder context to understand what the folder is about.
   */
  async analyzeFolderContext(
    folderPath: string,
    sampleFiles: string[]
  ): Promise<FolderAnalysis> {
    const prompt = `Analyze this folder and its files to understand its purpose.

Folder path: ${folderPath}
Sample files in this folder:
${sampleFiles.slice(0, 20).map((f, i) => `${i + 1}. ${f}`).join('\n')}

Respond in JSON format:
{
  "purpose": "Brief description of what this folder is for",
  "suggestedSubfolders": ["subfolder1", "subfolder2"],
  "detectedCategories": ["category1", "category2"],
  "organizationScore": 0.0 to 1.0,
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    const response = await this.callOpenAI(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        purpose: 'Unknown',
        suggestedSubfolders: [],
        detectedCategories: [],
        organizationScore: 0.5,
        recommendations: ['Could not analyze folder'],
      };
    }
  }

  /**
   * Analyze files in batches and generate organization suggestions.
   */
  async analyzeFiles(
    files: FileMeta[],
    folderContext: string,
    preferences: UserOrganizationPreferences,
    onProgress?: AIProgressCallback
  ): Promise<AISuggestion[]> {
    const totalBatches = Math.ceil(files.length / BATCH_SIZE);
    const allSuggestions: AISuggestion[] = [];
    
    this.abortController = new AbortController();

    for (let i = 0; i < totalBatches; i++) {
      // Check if cancelled
      if (this.abortController.signal.aborted) {
        break;
      }

      const startIdx = i * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, files.length);
      const batch = files.slice(startIdx, endIdx);

      onProgress?.({
        currentBatch: i + 1,
        totalBatches,
        filesProcessed: startIdx,
        totalFiles: files.length,
        status: `Analyzing batch ${i + 1} of ${totalBatches}...`,
      });

      const batchSuggestions = await this.analyzeBatch(
        batch,
        folderContext,
        preferences
      );
      
      allSuggestions.push(...batchSuggestions);
    }

    onProgress?.({
      currentBatch: totalBatches,
      totalBatches,
      filesProcessed: files.length,
      totalFiles: files.length,
      status: 'Analysis complete!',
    });

    return allSuggestions;
  }

  /**
   * Analyze a single batch of files.
   */
  private async analyzeBatch(
    files: FileMeta[],
    folderContext: string,
    preferences: UserOrganizationPreferences
  ): Promise<AISuggestion[]> {
    const now = Date.now();
    const filesForLLM: FileForLLM[] = files.map(f => ({
      id: f.id,
      name: f.name,
      extension: f.extension,
      size: f.size,
      path: f.path,
      modifiedDaysAgo: Math.floor((now - new Date(f.modifiedTime).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    const prompt = `You are a file organization assistant. Analyze these files and suggest how to organize them.

FOLDER CONTEXT: ${folderContext}

USER PREFERENCES:
- Cleanliness Level: ${preferences.cleanlinessLevel}
- Safety Preference: ${preferences.safetyPreference}
- Access Priority: ${preferences.accessPriority}

FILES TO ANALYZE:
${JSON.stringify(filesForLLM, null, 2)}

For each file that needs action, respond with a JSON array of suggestions:
[
  {
    "fileId": "the file id",
    "proposedPath": "suggested/folder/path/filename.ext",
    "proposedName": "new_filename.ext or null if no rename",
    "reason": "Why this organization makes sense",
    "confidence": 0.0 to 1.0,
    "category": "documents|images|videos|audio|archives|code|other",
    "action": "move|rename|archive|review"
  }
]

Rules:
1. Only suggest changes for files that would benefit from organization
2. Group similar files together
3. Use descriptive folder names
4. Consider file age - old files might need archiving
5. Keep the path structure simple and logical
6. If a file is already well-organized, don't include it

Respond with ONLY the JSON array, no other text.`;

    const response = await this.callOpenAI(prompt);
    
    try {
      const parsed = JSON.parse(response);
      return parsed.map((s: any) => ({
        fileId: s.fileId,
        originalPath: files.find(f => f.id === s.fileId)?.path || '',
        proposedPath: s.proposedPath,
        proposedName: s.proposedName,
        reason: s.reason,
        confidence: s.confidence,
        category: s.category,
        selected: s.confidence >= 0.7,
        source: 'llm' as const,
        action: s.action,
      }));
    } catch {
      console.error('Failed to parse LLM response:', response);
      return [];
    }
  }

  /**
   * Call OpenAI API.
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a file organization expert. You help users organize their files intelligently. Always respond with valid JSON when asked.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

/**
 * Create an LLM service instance if API key is available.
 */
export function createLLMService(apiKey?: string): LLMService | null {
  if (!apiKey) {
    return null;
  }
  return new LLMService({ apiKey });
}
