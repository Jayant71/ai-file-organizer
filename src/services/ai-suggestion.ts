/**
 * AI Suggestion Service
 * 
 * Provides intelligent file organization suggestions with tiered modes:
 * - Quick: Fast heuristic-based suggestions (name, extension, category)
 * - Smart: + Duplicate detection, rename suggestions, age analysis
 * - Deep: + LLM-powered semantic analysis, content sampling
 */

import {
  AISuggestion,
  AISuggestionInput,
  AISuggestionResponse,
  AIServiceConfig,
  AIMode,
  DuplicateGroup,
  RenameSuggestion,
  FolderAnalysis,
  AIProgressCallback,
  UserOrganizationPreferences,
} from '@/domain/types/ai';
import { FileMeta, getFileCategory, FileCategory } from '@/domain/types/file';
import { LLMService, createLLMService } from './llm-service';

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
 * Organized by category for maintainability.
 */
const SMART_PATTERNS: {
  pattern: RegExp;
  folder: string;
  reason: string;
  priority?: number; // Higher = checked first
}[] = [
  // ===== SCREENSHOTS & CAPTURES =====
  {
    pattern: /screenshot|screen.?shot|capture|snip|grab/i,
    folder: 'Media/Screenshots',
    reason: 'Detected as screenshot',
    priority: 10,
  },
  {
    pattern: /screen.?record|screencast|recording/i,
    folder: 'Media/Screen Recordings',
    reason: 'Detected as screen recording',
    priority: 10,
  },

  // ===== PHOTOS & CAMERA =====
  {
    pattern: /^IMG_|^DSC_|^DCIM|^P\d{7}|^DSCN/i,
    folder: 'Media/Photos/Camera',
    reason: 'Detected as camera photo',
    priority: 8,
  },
  {
    pattern: /selfie|portrait/i,
    folder: 'Media/Photos/Selfies',
    reason: 'Detected as selfie/portrait',
  },
  {
    pattern: /panorama|pano/i,
    folder: 'Media/Photos/Panoramas',
    reason: 'Detected as panorama photo',
  },
  {
    pattern: /wallpaper|background|desktop/i,
    folder: 'Media/Wallpapers',
    reason: 'Detected as wallpaper',
  },
  {
    pattern: /avatar|profile.?pic|headshot|dp\b/i,
    folder: 'Media/Profile Pictures',
    reason: 'Detected as profile picture',
  },
  {
    pattern: /meme|reaction|funny/i,
    folder: 'Media/Memes',
    reason: 'Detected as meme/reaction image',
  },

  // ===== SOCIAL MEDIA & MESSAGING =====
  {
    pattern: /whatsapp|wa.?image|wa.?video/i,
    folder: 'Media/WhatsApp',
    reason: 'Detected as WhatsApp media',
    priority: 9,
  },
  {
    pattern: /instagram|ig.?story|insta/i,
    folder: 'Media/Instagram',
    reason: 'Detected as Instagram media',
  },
  {
    pattern: /telegram/i,
    folder: 'Media/Telegram',
    reason: 'Detected as Telegram media',
  },
  {
    pattern: /twitter|tweet/i,
    folder: 'Media/Twitter',
    reason: 'Detected as Twitter media',
  },
  {
    pattern: /facebook|fb.?/i,
    folder: 'Media/Facebook',
    reason: 'Detected as Facebook media',
  },
  {
    pattern: /snapchat|snap/i,
    folder: 'Media/Snapchat',
    reason: 'Detected as Snapchat media',
  },
  {
    pattern: /tiktok/i,
    folder: 'Media/TikTok',
    reason: 'Detected as TikTok video',
  },
  {
    pattern: /youtube|yt.?download/i,
    folder: 'Media/YouTube',
    reason: 'Detected as YouTube download',
  },

  // ===== DOCUMENTS - FINANCE =====
  {
    pattern: /invoice|receipt|bill|payment/i,
    folder: 'Documents/Finance/Invoices',
    reason: 'Detected as financial document',
    priority: 8,
  },
  {
    pattern: /tax|1099|w2|w-2|itr|gst/i,
    folder: 'Documents/Finance/Tax',
    reason: 'Detected as tax document',
  },
  {
    pattern: /bank.?statement|account.?statement/i,
    folder: 'Documents/Finance/Bank Statements',
    reason: 'Detected as bank statement',
  },
  {
    pattern: /salary|payslip|pay.?stub/i,
    folder: 'Documents/Finance/Payslips',
    reason: 'Detected as payslip',
  },

  // ===== DOCUMENTS - CAREER =====
  {
    pattern: /resume|cv|curriculum.?vitae/i,
    folder: 'Documents/Career/Resumes',
    reason: 'Detected as resume/CV',
    priority: 8,
  },
  {
    pattern: /cover.?letter/i,
    folder: 'Documents/Career/Cover Letters',
    reason: 'Detected as cover letter',
  },
  {
    pattern: /certificate|certification|diploma/i,
    folder: 'Documents/Career/Certificates',
    reason: 'Detected as certificate',
  },
  {
    pattern: /offer.?letter|appointment/i,
    folder: 'Documents/Career/Offer Letters',
    reason: 'Detected as offer letter',
  },

  // ===== DOCUMENTS - LEGAL & OFFICIAL =====
  {
    pattern: /contract|agreement|nda/i,
    folder: 'Documents/Legal/Contracts',
    reason: 'Detected as contract/agreement',
  },
  {
    pattern: /passport|visa|id.?card|license|licence/i,
    folder: 'Documents/Identity',
    reason: 'Detected as identity document',
    priority: 9,
  },
  {
    pattern: /insurance|policy/i,
    folder: 'Documents/Insurance',
    reason: 'Detected as insurance document',
  },

  // ===== DOCUMENTS - WORK =====
  {
    pattern: /report|analysis|summary/i,
    folder: 'Documents/Reports',
    reason: 'Detected as report',
  },
  {
    pattern: /presentation|slides|deck/i,
    folder: 'Documents/Presentations',
    reason: 'Detected as presentation',
  },
  {
    pattern: /meeting.?note|minutes|mom\b/i,
    folder: 'Documents/Meeting Notes',
    reason: 'Detected as meeting notes',
  },
  {
    pattern: /proposal|quotation|quote/i,
    folder: 'Documents/Proposals',
    reason: 'Detected as proposal/quote',
  },
  {
    pattern: /manual|guide|tutorial|howto|how-to/i,
    folder: 'Documents/Guides',
    reason: 'Detected as guide/manual',
  },

  // ===== EDUCATION =====
  {
    pattern: /assignment|homework|hw\d|lab.?\d/i,
    folder: 'Education/Assignments',
    reason: 'Detected as assignment',
    priority: 7,
  },
  {
    pattern: /lecture|lect\d|class.?note|note/i,
    folder: 'Education/Lecture Notes',
    reason: 'Detected as lecture notes',
  },
  {
    pattern: /syllabus|curriculum/i,
    folder: 'Education/Syllabus',
    reason: 'Detected as syllabus',
  },
  {
    pattern: /exam|test|quiz|midterm|final/i,
    folder: 'Education/Exams',
    reason: 'Detected as exam/test material',
  },
  {
    pattern: /textbook|ebook|book/i,
    folder: 'Education/Books',
    reason: 'Detected as ebook/textbook',
  },
  {
    pattern: /project|thesis|dissertation/i,
    folder: 'Education/Projects',
    reason: 'Detected as project/thesis',
  },
  {
    pattern: /research|paper|journal|article/i,
    folder: 'Education/Research Papers',
    reason: 'Detected as research paper',
  },

  // ===== DOWNLOADS & INSTALLERS =====
  {
    pattern: /setup|installer|install/i,
    folder: 'Downloads/Installers',
    reason: 'Detected as installer',
  },
  {
    pattern: /crack|keygen|patch|activat/i,
    folder: 'Downloads/Software',
    reason: 'Detected as software file',
  },
  {
    pattern: /driver|firmware/i,
    folder: 'Downloads/Drivers',
    reason: 'Detected as driver/firmware',
  },
  {
    pattern: /font|typeface/i,
    folder: 'Design/Fonts',
    reason: 'Detected as font file',
  },

  // ===== BACKUPS & EXPORTS =====
  {
    pattern: /backup|bak|export|dump/i,
    folder: 'Backups',
    reason: 'Detected as backup file',
  },
  {
    pattern: /archive|old|deprecated/i,
    folder: 'Archive',
    reason: 'Detected as archive/old file',
  },

  // ===== DESIGN & CREATIVE =====
  {
    pattern: /logo|icon|brand/i,
    folder: 'Design/Logos',
    reason: 'Detected as logo/branding',
  },
  {
    pattern: /mockup|wireframe|prototype/i,
    folder: 'Design/Mockups',
    reason: 'Detected as design mockup',
  },
  {
    pattern: /banner|poster|flyer|brochure/i,
    folder: 'Design/Marketing',
    reason: 'Detected as marketing material',
  },
  {
    pattern: /template|boilerplate/i,
    folder: 'Templates',
    reason: 'Detected as template',
  },

  // ===== MUSIC =====
  {
    pattern: /podcast|episode|ep\d/i,
    folder: 'Media/Podcasts',
    reason: 'Detected as podcast',
  },
  {
    pattern: /audiobook/i,
    folder: 'Media/Audiobooks',
    reason: 'Detected as audiobook',
  },
  {
    pattern: /ringtone|notification/i,
    folder: 'Media/Ringtones',
    reason: 'Detected as ringtone',
  },
];

// Sort patterns by priority (higher first)
SMART_PATTERNS.sort((a, b) => (b.priority || 0) - (a.priority || 0));

/**
 * Rename patterns for cleaning up filenames.
 */
const RENAME_PATTERNS: {
  pattern: RegExp;
  transform: (match: RegExpMatchArray, filename: string) => string;
  reason: string;
}[] = [
  // Camera photos
  {
    pattern: /^IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i,
    transform: (m) => `Photo_${m[1]}-${m[2]}-${m[3]}_${m[4]}${m[5]}`,
    reason: 'Clean up camera photo naming',
  },
  // WhatsApp images
  {
    pattern: /^IMG-(\d{4})(\d{2})(\d{2})-WA/i,
    transform: (m) => `WhatsApp_${m[1]}-${m[2]}-${m[3]}`,
    reason: 'Clean up WhatsApp image naming',
  },
  // Screenshots
  {
    pattern: /^Screenshot[_ ](\d{4})-(\d{2})-(\d{2})/i,
    transform: (m) => `Screenshot_${m[1]}-${m[2]}-${m[3]}`,
    reason: 'Standardize screenshot naming',
  },
  // Windows screenshots
  {
    pattern: /^Screenshot \((\d+)\)/i,
    transform: (m) => `Screenshot_${m[1]}`,
    reason: 'Clean up Windows screenshot naming',
  },
  // Remove duplicate suffix (1), (2), etc.
  {
    pattern: /\s*\(\d+\)\s*$/,
    transform: (_, filename) => filename.replace(/\s*\(\d+\)\s*$/, ''),
    reason: 'Remove duplicate number suffix',
  },
  // Remove "copy" suffix
  {
    pattern: /\s+copy\s*$/i,
    transform: (_, filename) => filename.replace(/\s+copy\s*$/i, ''),
    reason: 'Remove "copy" suffix',
  },
  // Remove "-final", "-v2", etc.
  {
    pattern: /[-_](final|v\d+|new|old|backup)\s*$/i,
    transform: (_, filename) => filename.replace(/[-_](final|v\d+|new|old|backup)\s*$/i, ''),
    reason: 'Remove version suffix',
  },
  // Clean up underscores and dashes
  {
    pattern: /_{2,}/,
    transform: (_, filename) => filename.replace(/_{2,}/g, '_'),
    reason: 'Clean up multiple underscores',
  },
  // Remove UUID-like prefixes
  {
    pattern: /^[a-f0-9]{8}-[a-f0-9]{4}-/i,
    transform: (_, filename) => filename.replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}[-_]?/i, ''),
    reason: 'Remove UUID prefix',
  },
  // Remove download timestamps
  {
    pattern: /[-_]\d{13,}[-_]?/,
    transform: (_, filename) => filename.replace(/[-_]\d{13,}[-_]?/, ''),
    reason: 'Remove timestamp suffix',
  },
];

/**
 * AI Suggestion Service class.
 * Generates intelligent organization suggestions for files.
 */
export class AISuggestionService {
  private config: AIServiceConfig;
  private llmService: LLMService | null = null;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      provider: 'heuristic',
      batchSize: 50,
      ...config,
    };
    
    if (config?.apiKey) {
      this.llmService = createLLMService(config.apiKey);
    }
  }

  /**
   * Update service configuration.
   */
  configure(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.apiKey) {
      this.llmService = createLLMService(config.apiKey);
    }
  }

  /**
   * Generate AI suggestions for a list of files.
   */
  async getAISuggestions(
    files: FileMeta[],
    baseFolder: string,
    mode: AIMode = 'smart',
    preferences?: UserOrganizationPreferences,
    onProgress?: AIProgressCallback
  ): Promise<AISuggestion[]> {
    const input: AISuggestionInput = {
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        extension: f.extension,
        size: f.size,
        path: f.path,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
        createdTime: f.createdTime,
      })),
      baseFolder,
      mode,
      preferences,
    };

    const response = await this.generateSuggestions(input, onProgress);
    return response.suggestions;
  }

  /**
   * Full suggestion generation with metadata.
   */
  async generateSuggestions(
    input: AISuggestionInput,
    onProgress?: AIProgressCallback
  ): Promise<AISuggestionResponse> {
    const startTime = performance.now();
    const mode = input.mode || 'smart';

    let suggestions: AISuggestion[] = [];
    let duplicates: DuplicateGroup[] = [];
    let renames: RenameSuggestion[] = [];
    let folderAnalysis: FolderAnalysis | undefined;
    let llmCalls = 0;

    // Quick mode: Just heuristics
    suggestions = this.generateQuickSuggestions(input);

    // Smart mode: + Duplicates + Renames + Age
    if (mode === 'smart' || mode === 'deep') {
      duplicates = this.detectDuplicates(input.files);
      renames = this.generateRenameSuggestions(input.files);
      suggestions = this.enhanceWithSmartFeatures(suggestions, input, duplicates);
    }

    // Deep mode: + LLM
    console.log('[AI] Deep mode check:', { 
      mode, 
      hasLLMService: !!this.llmService, 
      hasApiKey: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey?.length 
    });
    
    if (mode === 'deep') {
      if (!this.llmService || !this.config.apiKey) {
        console.warn('[AI] Deep mode requested but LLM not configured. Add OpenAI API key in Settings.');
        // Notify via progress callback
        onProgress?.({
          currentBatch: 0,
          totalBatches: 0,
          filesProcessed: 0,
          totalFiles: input.files.length,
          status: 'No API key - using Smart mode instead',
        });
      } else {
        try {
          onProgress?.({
            currentBatch: 0,
            totalBatches: Math.ceil(input.files.length / 50),
            filesProcessed: 0,
            totalFiles: input.files.length,
            status: 'Connecting to OpenAI...',
          });

          const llmSuggestions = await this.llmService.analyzeFiles(
            input.files.map(f => ({
              id: f.id,
              path: f.path,
              name: f.name,
              extension: f.extension,
              size: f.size,
              createdTime: f.createdTime || new Date(),
              modifiedTime: f.modifiedTime || new Date(),
              mimeType: f.mimeType || '',
              isDirectory: false,
              source: 'local' as const,
              parentPath: input.baseFolder,
            })),
            input.folderPath || input.baseFolder,
            input.preferences || {
              cleanlinessLevel: 'moderate',
              safetyPreference: 'balanced',
              accessPriority: 'organized',
            },
            onProgress
          );

          // Merge LLM suggestions with heuristic ones
          suggestions = this.mergeSuggestions(suggestions, llmSuggestions);
          llmCalls = Math.ceil(input.files.length / (this.config.batchSize || 50));

          // Get folder analysis for deep mode
          onProgress?.({
            currentBatch: llmCalls,
            totalBatches: llmCalls + 1,
            filesProcessed: input.files.length,
            totalFiles: input.files.length,
            status: 'Analyzing folder context...',
          });
          
          folderAnalysis = await this.llmService.analyzeFolderContext(
            input.baseFolder,
            input.files.map(f => f.name)
          );
          llmCalls++;

          console.log('[AI] LLM analysis complete, got', llmSuggestions.length, 'suggestions');
        } catch (error: any) {
          console.error('[AI] LLM analysis failed:', error);
          onProgress?.({
            currentBatch: 0,
            totalBatches: 0,
            filesProcessed: 0,
            totalFiles: input.files.length,
            status: `LLM error: ${error.message?.slice(0, 50)}`,
          });
        }
      }
    }

    const endTime = performance.now();

    return {
      suggestions,
      duplicates,
      renames,
      folderAnalysis,
      warnings: [],
      metadata: {
        filesProcessed: input.files.length,
        suggestionsGenerated: suggestions.length,
        processingTimeMs: Math.round(endTime - startTime),
        modeUsed: mode,
        llmCalls: llmCalls > 0 ? llmCalls : undefined,
        batchesProcessed: llmCalls > 0 ? llmCalls : undefined,
      },
    };
  }

  /**
   * Quick mode: Basic heuristic suggestions.
   */
  private generateQuickSuggestions(input: AISuggestionInput): AISuggestion[] {
    const { files, baseFolder } = input;
    const suggestions: AISuggestion[] = [];

    for (const file of files) {
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
          source: 'pattern',
          action: 'move',
        });
        continue;
      }

      // Fall back to category-based organization
      const category = getFileCategory(file.extension);
      const categoryFolder = DEFAULT_CATEGORY_FOLDERS[category];
      const orgStyle = input.preferences?.organizationStyle || 'by-category';

      // Determine target folder based on user's organization style preference
      let targetFolder = categoryFolder;
      
      if (orgStyle === 'by-date') {
        // Organize ALL files by date
        const date = file.modifiedTime ? new Date(file.modifiedTime) : new Date();
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        targetFolder = `${year}/${month}/${category}`;
      } else if (orgStyle === 'by-category') {
        // Pure category-based, no date subfolders
        targetFolder = categoryFolder;
      } else if (orgStyle === 'by-type') {
        // Organize by extension type
        const ext = file.extension.replace('.', '').toUpperCase() || 'Other';
        targetFolder = `${category}/${ext}`;
      }
      // 'flat' = just use base folder, no subfolders
      if (orgStyle === 'flat') {
        targetFolder = '';
      }

      suggestions.push({
        fileId: file.id,
        originalPath: file.path,
        proposedPath: this.buildPath(baseFolder, targetFolder, file.name),
        reason: `Organized by ${orgStyle.replace('-', ' ')} (${category})`,
        confidence: 0.7,
        category,
        selected: true,
        source: 'heuristic',
        action: 'move',
      });
    }

    return suggestions;
  }

  /**
   * Detect duplicate files by size and name similarity.
   */
  private detectDuplicates(files: AISuggestionInput['files']): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const sizeMap = new Map<number, typeof files>();

    // Group by size
    for (const file of files) {
      const existing = sizeMap.get(file.size) || [];
      existing.push(file);
      sizeMap.set(file.size, existing);
    }

    // Find duplicates
    let groupId = 0;
    for (const [size, sameSize] of sizeMap) {
      if (sameSize.length > 1 && size > 0) {
        // Check for name similarity
        const baseName = (name: string) => 
          name.replace(/\s*\(\d+\)\s*/, '').replace(/\s+copy\s*/i, '').toLowerCase();
        
        const nameGroups = new Map<string, typeof files>();
        for (const file of sameSize) {
          const key = baseName(file.name);
          const existing = nameGroups.get(key) || [];
          existing.push(file);
          nameGroups.set(key, existing);
        }

        for (const [, similar] of nameGroups) {
          if (similar.length > 1) {
            // Sort by modification time, oldest first
            const sorted = [...similar].sort((a, b) => {
              const aTime = a.modifiedTime?.getTime() || 0;
              const bTime = b.modifiedTime?.getTime() || 0;
              return aTime - bTime;
            });

            groups.push({
              groupId: `dup-${groupId++}`,
              files: sorted.map(f => ({
                id: f.id,
                name: f.name,
                path: f.path,
                size: f.size,
                modifiedTime: f.modifiedTime || new Date(),
              })),
              suggestedKeepId: sorted[0].id,
              reason: `${similar.length} files with same size and similar name`,
            });
          }
        }
      }
    }

    return groups;
  }

  /**
   * Generate rename suggestions for files with messy names.
   */
  private generateRenameSuggestions(files: AISuggestionInput['files']): RenameSuggestion[] {
    const suggestions: RenameSuggestion[] = [];

    for (const file of files) {
      for (const { pattern, transform, reason } of RENAME_PATTERNS) {
        const match = file.name.match(pattern);
        if (match) {
          const newName = transform(match, file.name);
          if (newName !== file.name) {
            suggestions.push({
              fileId: file.id,
              currentName: file.name,
              suggestedName: newName,
              reason,
              pattern: pattern.source,
            });
            break;
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Enhance suggestions with Smart mode features.
   */
  private enhanceWithSmartFeatures(
    suggestions: AISuggestion[],
    input: AISuggestionInput,
    duplicates: DuplicateGroup[]
  ): AISuggestion[] {
    const now = Date.now();
    const OLD_THRESHOLD_DAYS = 90;

    // Add duplicate markers
    const duplicateFileIds = new Set<string>();
    for (const group of duplicates) {
      for (const file of group.files) {
        if (file.id !== group.suggestedKeepId) {
          duplicateFileIds.add(file.id);
        }
      }
    }

    // Enhance suggestions
    return suggestions.map(s => {
      const file = input.files.find(f => f.id === s.fileId);
      const isDuplicate = duplicateFileIds.has(s.fileId);
      
      // Check if file is old
      const modifiedTime = file?.modifiedTime?.getTime() || now;
      const daysOld = Math.floor((now - modifiedTime) / (1000 * 60 * 60 * 24));
      const isOld = daysOld > OLD_THRESHOLD_DAYS;

      // Adjust action and path for old files
      let action = s.action;
      let proposedPath = s.proposedPath;
      let reason = s.reason;

      // Note old files but don't archive (disabled for now)
      if (isOld) {
        reason = `${reason} (${daysOld} days old)`;
      }

      if (isDuplicate) {
        reason = `${reason} [DUPLICATE]`;
      }

      return {
        ...s,
        proposedPath,
        reason,
        action,
        isDuplicate,
        duplicateOfId: isDuplicate 
          ? duplicates.find(g => g.files.some(f => f.id === s.fileId))?.suggestedKeepId 
          : undefined,
      };
    });
  }

  /**
   * Merge heuristic and LLM suggestions, preferring LLM for same files.
   */
  private mergeSuggestions(
    heuristic: AISuggestion[],
    llm: AISuggestion[]
  ): AISuggestion[] {
    const llmMap = new Map(llm.map(s => [s.fileId, s]));
    
    return heuristic.map(h => {
      const llmSuggestion = llmMap.get(h.fileId);
      if (llmSuggestion && llmSuggestion.confidence >= h.confidence) {
        return llmSuggestion;
      }
      return h;
    });
  }

  /**
   * Check if a file is already in an organized location.
   */
  private isAlreadyOrganized(path: string): boolean {
    const organizedPatterns = [/organized/i, /sorted/i, /archive/i, /backup/i];
    return organizedPatterns.some((pattern) => pattern.test(path));
  }

  /**
   * Match filename against smart patterns.
   */
  private matchSmartPattern(filename: string): { folder: string; reason: string } | null {
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
    const normalizedBase = base.replace(/\\/g, '/');
    const normalizedFolder = folder.replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedFolder}/${filename}`.replace(/\/+/g, '/');
  }
}

// Export singleton instance
export const aiSuggestionService = new AISuggestionService();

// Export convenience function with mode support
export async function getAISuggestions(
  files: FileMeta[],
  baseFolder: string,
  mode: AIMode = 'smart',
  preferences?: UserOrganizationPreferences,
  onProgress?: AIProgressCallback
): Promise<AISuggestion[]> {
  return aiSuggestionService.getAISuggestions(files, baseFolder, mode, preferences, onProgress);
}
