/**
 * Structure Analysis Service
 * Analyzes folder structure and suggests optimal organization.
 * Designed to handle large numbers of files efficiently.
 */

import { FileMeta, FileChange, getFileCategory } from '@/domain/types/file';
import { FolderAnalysis, SuggestedFolder, StructureSuggestion } from '../context/FileOrganizerContext';
import { v4 as uuidv4 } from 'uuid';

/**
 * Browser-compatible path join utility for Windows paths
 */
function pathJoin(...parts: string[]): string {
    return parts
        .filter(part => part && part.length > 0)
        .map((part, index) => {
            // Remove trailing slashes except for drive letters
            if (index > 0) {
                part = part.replace(/^[\\\/]+/, '');
            }
            return part.replace(/[\\\/]+$/, '');
        })
        .join('\\');
}

// File category mapping
const CATEGORY_MAP: Record<string, string[]> = {
    'Documents': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'],
    'Images': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'raw'],
    'Videos': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'],
    'Audio': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
    'Archives': ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    'Code': ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml'],
    'Executables': ['exe', 'msi', 'dmg', 'app', 'deb', 'rpm'],
    'Fonts': ['ttf', 'otf', 'woff', 'woff2', 'eot'],
    'Design': ['psd', 'ai', 'sketch', 'fig', 'xd', 'indd'],
};

export interface AnalysisProgress {
    stage: 'collecting' | 'analyzing' | 'generating' | 'complete';
    message: string;
    progress: number; // 0-100
}

export interface CompactFileSummary {
    name: string;
    ext: string;
    size: number;
    modified: number; // timestamp
    path: string;
}

export interface FolderSummary {
    path: string;
    name: string;
    fileCount: number;
    totalSize: number;
    categories: Record<string, number>;
    sampleFiles: string[]; // Just names for context
    subfolders: string[];
}

/**
 * Create a compact summary of files for LLM analysis
 * Only includes essential metadata to minimize token usage
 */
export function createCompactSummary(files: FileMeta[]): {
    summary: FolderSummary[];
    stats: FolderAnalysis;
} {
    // Group files by parent folder
    const folderMap = new Map<string, FileMeta[]>();
    
    files.forEach(file => {
        const parentPath = file.path.substring(0, file.path.lastIndexOf('\\')) || 
                          file.path.substring(0, file.path.lastIndexOf('/'));
        const existing = folderMap.get(parentPath) || [];
        existing.push(file);
        folderMap.set(parentPath, existing);
    });

    // Create folder summaries
    const summaries: FolderSummary[] = [];
    let totalSize = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;
    const globalCategories: Record<string, number> = {};
    const detectedPurposes: Set<string> = new Set();
    const issues: string[] = [];

    folderMap.forEach((folderFiles, folderPath) => {
        const categories: Record<string, number> = {};
        let folderSize = 0;
        const sampleFiles: string[] = [];

        folderFiles.forEach(file => {
            // Strip the leading dot from extension (e.g., '.pdf' -> 'pdf')
            const ext = (file.extension?.toLowerCase() || 'unknown').replace(/^\./, '');
            const category = getFileCategory(ext);
            categories[category] = (categories[category] || 0) + 1;
            globalCategories[category] = (globalCategories[category] || 0) + 1;
            folderSize += file.size;
            totalSize += file.size;

            // Track dates
            if (file.modifiedAt) {
                const date = new Date(file.modifiedAt);
                if (!oldestDate || date < oldestDate) oldestDate = date;
                if (!newestDate || date > newestDate) newestDate = date;
            }

            // Sample first 5 file names for context
            if (sampleFiles.length < 5) {
                sampleFiles.push(file.name);
            }
        });

        // Detect folder purpose from name and contents
        const folderName = folderPath.split(/[/\\]/).pop() || '';
        const purpose = detectFolderPurpose(folderName, categories);
        if (purpose) detectedPurposes.add(purpose);

        // Detect issues
        if (Object.keys(categories).length > 3) {
            issues.push(`Mixed content in "${folderName}" (${Object.keys(categories).length} different file types)`);
        }

        // Get subfolder names
        const subfolders: string[] = [];
        folderMap.forEach((_, path) => {
            if (path.startsWith(folderPath) && path !== folderPath) {
                const relative = path.substring(folderPath.length + 1);
                if (!relative.includes('\\') && !relative.includes('/')) {
                    subfolders.push(relative);
                }
            }
        });

        summaries.push({
            path: folderPath,
            name: folderName,
            fileCount: folderFiles.length,
            totalSize: folderSize,
            categories,
            sampleFiles,
            subfolders,
        });
    });

    // Detect global issues
    const totalFiles = files.length;
    if (totalFiles > 100 && summaries.length < 5) {
        issues.push('Too many files in too few folders - needs better organization');
    }

    const stats: FolderAnalysis = {
        totalFiles,
        totalSize,
        categories: globalCategories,
        dateRange: oldestDate && newestDate ? { oldest: oldestDate, newest: newestDate } : null,
        purposes: Array.from(detectedPurposes),
        issues,
    };

    return { summary: summaries, stats };
}

/**
 * Get file category from extension
 */
function getFileCategory(ext: string): string {
    for (const [category, extensions] of Object.entries(CATEGORY_MAP)) {
        if (extensions.includes(ext)) return category;
    }
    return 'Other';
}

/**
 * Detect folder purpose from name and contents
 */
function detectFolderPurpose(name: string, categories: Record<string, number>): string | null {
    const lowerName = name.toLowerCase();
    
    // Name-based detection
    if (lowerName.includes('download')) return 'Downloads';
    if (lowerName.includes('document')) return 'Documents';
    if (lowerName.includes('photo') || lowerName.includes('picture') || lowerName.includes('image')) return 'Photos';
    if (lowerName.includes('video') || lowerName.includes('movie')) return 'Videos';
    if (lowerName.includes('music') || lowerName.includes('audio')) return 'Music';
    if (lowerName.includes('project')) return 'Projects';
    if (lowerName.includes('backup')) return 'Backups';
    if (lowerName.includes('archive')) return 'Archives';
    if (lowerName.includes('work')) return 'Work';
    if (lowerName.includes('personal')) return 'Personal';
    if (lowerName.includes('desktop')) return 'Desktop';
    
    // Content-based detection
    const dominant = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] > 10) {
        return dominant[0];
    }
    
    return null;
}

/**
 * Generate a text summary for LLM analysis
 * Optimized to be concise but informative
 */
export function generateLLMPromptSummary(
    summaries: FolderSummary[],
    stats: FolderAnalysis
): string {
    const lines: string[] = [];
    
    lines.push(`FOLDER ANALYSIS SUMMARY`);
    lines.push(`Total: ${stats.totalFiles} files, ${formatSize(stats.totalSize)}`);
    lines.push(`Categories: ${Object.entries(stats.categories).map(([k, v]) => `${k}:${v}`).join(', ')}`);
    
    if (stats.dateRange) {
        lines.push(`Date range: ${stats.dateRange.oldest.toLocaleDateString()} - ${stats.dateRange.newest.toLocaleDateString()}`);
    }
    
    if (stats.issues.length > 0) {
        lines.push(`Issues: ${stats.issues.join('; ')}`);
    }
    
    lines.push(`\nFOLDER BREAKDOWN:`);
    
    // Limit to top 20 folders by file count for token efficiency
    const topFolders = summaries
        .sort((a, b) => b.fileCount - a.fileCount)
        .slice(0, 20);
    
    topFolders.forEach(folder => {
        const cats = Object.entries(folder.categories)
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
        lines.push(`- ${folder.name} (${folder.fileCount} files): ${cats}`);
        if (folder.sampleFiles.length > 0) {
            lines.push(`  Samples: ${folder.sampleFiles.slice(0, 3).join(', ')}`);
        }
    });
    
    return lines.join('\n');
}

/**
 * Generate structure suggestion without LLM (heuristic-based)
 * Fast and works offline
 */
export function generateHeuristicStructure(
    stats: FolderAnalysis,
    summaries: FolderSummary[],
    maxDepth: number = 3
): SuggestedFolder[] {
    const suggestions: SuggestedFolder[] = [];
    
    // Create main category folders based on what exists
    const categoryThreshold = 5; // Need at least 5 files to warrant a folder
    
    Object.entries(stats.categories)
        .filter(([_, count]) => count >= categoryThreshold)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            const folder = createCategoryFolder(category, count, stats, maxDepth);
            suggestions.push(folder);
        });
    
    // Suggest Archive folder if old files exist (only if depth allows)
    if (stats.dateRange && maxDepth >= 1) {
        const oldThreshold = new Date();
        oldThreshold.setMonth(oldThreshold.getMonth() - 6);
        if (stats.dateRange.oldest < oldThreshold) {
            const archiveFolder: SuggestedFolder = {
                name: 'Archive',
                purpose: 'Store older files you don\'t need quick access to',
                icon: '📦',
                filePatterns: ['Files older than 6 months'],
                estimatedFiles: Math.floor(stats.totalFiles * 0.1),
            };
            
            // Only add subfolders if depth allows
            if (maxDepth >= 2) {
                archiveFolder.subfolders = [
                    {
                        name: 'By Year',
                        purpose: 'Organize archived files by year',
                        icon: '📅',
                        filePatterns: ['2023/', '2022/', 'etc.'],
                        estimatedFiles: 0,
                    }
                ];
            }
            
            suggestions.push(archiveFolder);
        }
    }
    
    // Suggest Unsorted folder for remaining
    const categorizedCount = Object.values(stats.categories)
        .filter((_, i, arr) => arr[i] >= categoryThreshold)
        .reduce((a, b) => a + b, 0);
    
    const unsortedCount = stats.totalFiles - categorizedCount;
    if (unsortedCount > 0) {
        suggestions.push({
            name: '_Unsorted',
            purpose: 'Files that need manual review',
            icon: '❓',
            filePatterns: ['Miscellaneous files'],
            estimatedFiles: unsortedCount,
        });
    }
    
    return suggestions;
}

/**
 * Create a category folder suggestion
 */
function createCategoryFolder(
    category: string, 
    count: number, 
    stats: FolderAnalysis,
    maxDepth: number = 3
): SuggestedFolder {
    const categoryConfig: Record<string, { icon: string; subfolders?: SuggestedFolder[] }> = {
        'Documents': {
            icon: '📄',
            subfolders: [
                { name: 'PDFs', purpose: 'PDF documents', icon: '📕', filePatterns: ['*.pdf'], estimatedFiles: 0 },
                { name: 'Office', purpose: 'Word, Excel, PowerPoint', icon: '📊', filePatterns: ['*.docx', '*.xlsx', '*.pptx'], estimatedFiles: 0 },
                { name: 'Text', purpose: 'Plain text files', icon: '📝', filePatterns: ['*.txt', '*.md'], estimatedFiles: 0 },
            ]
        },
        'Images': {
            icon: '🖼️',
            subfolders: [
                { name: 'Photos', purpose: 'Camera photos', icon: '📸', filePatterns: ['*.jpg', '*.jpeg'], estimatedFiles: 0 },
                { name: 'Screenshots', purpose: 'Screen captures', icon: '📱', filePatterns: ['Screenshot*', 'Screen Shot*'], estimatedFiles: 0 },
                { name: 'Graphics', purpose: 'Design files and icons', icon: '🎨', filePatterns: ['*.png', '*.svg'], estimatedFiles: 0 },
            ]
        },
        'Videos': {
            icon: '🎬',
            subfolders: [
                { name: 'Movies', purpose: 'Long-form videos', icon: '🎥', filePatterns: ['*.mp4', '*.mkv'], estimatedFiles: 0 },
                { name: 'Clips', purpose: 'Short clips', icon: '📹', filePatterns: ['*.webm', '*.gif'], estimatedFiles: 0 },
            ]
        },
        'Audio': {
            icon: '🎵',
            subfolders: [
                { name: 'Music', purpose: 'Songs and albums', icon: '🎧', filePatterns: ['*.mp3', '*.flac'], estimatedFiles: 0 },
                { name: 'Recordings', purpose: 'Voice recordings', icon: '🎤', filePatterns: ['*.wav', '*.m4a'], estimatedFiles: 0 },
            ]
        },
        'Archives': { icon: '📦' },
        'Code': {
            icon: '💻',
            subfolders: [
                { name: 'Projects', purpose: 'Full project folders', icon: '📁', filePatterns: ['Project folders'], estimatedFiles: 0 },
                { name: 'Scripts', purpose: 'Standalone scripts', icon: '📜', filePatterns: ['*.py', '*.js', '*.sh'], estimatedFiles: 0 },
            ]
        },
        'Executables': { icon: '⚙️' },
        'Fonts': { icon: '🔤' },
        'Design': { icon: '🎨' },
        'Other': { icon: '📎' },
    };
    
    const config = categoryConfig[category] || { icon: '📁' };
    
    // Only include subfolders if maxDepth allows (depth 2+ means we can have 1 level of subfolders)
    const subfolders = maxDepth >= 2 ? config.subfolders : undefined;
    
    return {
        name: category,
        purpose: `All ${category.toLowerCase()} files`,
        icon: config.icon,
        filePatterns: CATEGORY_MAP[category] ? CATEGORY_MAP[category].map(e => `*.${e}`) : [],
        estimatedFiles: count,
        subfolders,
    };
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Call LLM for structure suggestions
 */
async function getLLMStructureSuggestion(
    prompt: string,
    apiKey: string,
    maxDepth: number = 3
): Promise<SuggestedFolder[]> {
    try {
        const depthDescription = maxDepth === 1 
            ? 'Create only top-level folders, no subfolders'
            : maxDepth === 2 
                ? 'Create folders with one level of subfolders maximum'
                : `Keep folder depth reasonable (max ${maxDepth} levels)`;
                
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4.1-2025-04-14',
                messages: [
                    {
                        role: 'system',
                        content: `You are a file organization expert. Analyze the folder structure and suggest an optimal organization.
                        
Return a JSON array of folder suggestions with this structure:
[
  {
    "name": "FolderName",
    "purpose": "Brief description of what goes here",
    "icon": "emoji icon",
    "filePatterns": ["*.ext", "pattern*"],
    "estimatedFiles": number,
    "subfolders": [same structure for nested folders]
  }
]

IMPORTANT CONSTRAINTS:
- ${depthDescription}
- Group by purpose/project when possible
- Separate by file type as fallback
- Create Archive folder for old files if needed
- Use clear, descriptive names`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('No content in LLM response');
        }

        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const suggestions = JSON.parse(jsonStr.trim());
        return suggestions;
    } catch (error) {
        console.error('LLM structure analysis failed:', error);
        return []; // Fall back to heuristic
    }
}

export interface AnalysisOptions {
    useLLM?: boolean;
    apiKey?: string;
    maxDepth?: number; // 1-5, default 3
}

/**
 * Main analysis function
 */
export async function analyzeStructure(
    files: FileMeta[],
    sourceFolders: string[],
    onProgress?: (progress: AnalysisProgress) => void,
    options?: AnalysisOptions
): Promise<StructureSuggestion> {
    const useLLM = options?.useLLM && options?.apiKey;
    
    // Stage 1: Collecting data
    onProgress?.({
        stage: 'collecting',
        message: 'Gathering file information...',
        progress: 10,
    });
    
    await delay(100); // Allow UI to update
    
    // Stage 2: Analyzing structure
    onProgress?.({
        stage: 'analyzing',
        message: 'Analyzing folder structure...',
        progress: 40,
    });
    
    const { summary, stats } = createCompactSummary(files);
    
    await delay(100);
    
    // Stage 3: Generating suggestions
    let suggestedStructure: SuggestedFolder[];
    const maxDepth = options?.maxDepth || 3;
    
    if (useLLM) {
        onProgress?.({
            stage: 'generating',
            message: 'AI is analyzing your files...',
            progress: 60,
        });
        
        const prompt = generateLLMPromptSummary(summary, stats);
        const llmSuggestions = await getLLMStructureSuggestion(prompt, options!.apiKey!, maxDepth);
        
        if (llmSuggestions.length > 0) {
            suggestedStructure = llmSuggestions;
        } else {
            // Fall back to heuristic if LLM fails
            onProgress?.({
                stage: 'generating',
                message: 'Using smart analysis...',
                progress: 70,
            });
            suggestedStructure = generateHeuristicStructure(stats, summary, maxDepth);
        }
    } else {
        onProgress?.({
            stage: 'generating',
            message: 'Creating organization recommendations...',
            progress: 70,
        });
        
        suggestedStructure = generateHeuristicStructure(stats, summary, maxDepth);
    }
    
    await delay(100);
    
    // Stage 4: Complete
    onProgress?.({
        stage: 'complete',
        message: 'Analysis complete!',
        progress: 100,
    });
    
    return {
        id: uuidv4(),
        timestamp: new Date(),
        sourceFolders,
        analysis: stats,
        suggestedStructure,
        status: 'pending',
    };
}


/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Export analysis to JSON for saving
 */
export function exportAnalysis(suggestion: StructureSuggestion): string {
    return JSON.stringify(suggestion, null, 2);
}

/**
 * Import analysis from JSON
 */
export function importAnalysis(json: string): StructureSuggestion | null {
    try {
        const data = JSON.parse(json);
        // Validate required fields
        if (data.id && data.analysis && data.suggestedStructure) {
            return {
                ...data,
                timestamp: new Date(data.timestamp),
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Apply suggested structure to files and generate FileChange objects
 * NOTE: This only generates preview changes, it does NOT move any files!
 */
export function applyStructureToFiles(
    files: FileMeta[],
    structure: SuggestedFolder[],
    destinationRoot: string
): FileChange[] {
    // Validate inputs
    if (!files || !Array.isArray(files) || files.length === 0) {
        console.warn('applyStructureToFiles: No files provided');
        return [];
    }
    
    if (!structure || !Array.isArray(structure) || structure.length === 0) {
        console.warn('applyStructureToFiles: No structure provided');
        return [];
    }
    
    if (!destinationRoot || typeof destinationRoot !== 'string' || destinationRoot.length < 3) {
        console.warn('applyStructureToFiles: Invalid destination root:', destinationRoot);
        return [];
    }

    console.log(`applyStructureToFiles: Processing ${files.length} files to ${destinationRoot}`);
    
    const changes: FileChange[] = [];
    
    // Build a flat list of all folders with their full paths and patterns
    interface FolderMapping {
        path: string;
        name: string;
        patterns: string[];
        category?: string;
    }
    
    const folderMappings: FolderMapping[] = [];
    
    function flattenStructure(folders: SuggestedFolder[], parentPath: string = '') {
        folders.forEach(folder => {
            const folderPath = parentPath 
                ? pathJoin(parentPath, folder.name) 
                : folder.name;
            
            // Detect category from folder name
            const categoryName = folder.name.toLowerCase();
            
            folderMappings.push({
                path: folderPath,
                name: folder.name,
                patterns: folder.filePatterns || [],
                category: categoryName,
            });
            
            if (folder.subfolders && folder.subfolders.length > 0) {
                flattenStructure(folder.subfolders, folderPath);
            }
        });
    }
    
    flattenStructure(structure);
    
    // Match each file to the best folder
    files.forEach(file => {
        const ext = file.extension.toLowerCase().replace('.', '');
        const extWithDot = file.extension.toLowerCase();
        const fileName = file.name.toLowerCase();
        const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, '');
        const fileCategory = getFileCategory(extWithDot);
        
        let bestMatch: FolderMapping | null = null;
        let matchScore = 0;
        
        // Find the best matching folder
        for (const mapping of folderMappings) {
            let score = 0;
            const folderName = mapping.name.toLowerCase();
            const folderPath = mapping.path.toLowerCase();
            
            // ===== FILE NAME TO FOLDER NAME MATCHING =====
            // This is the most important matching - check if file name contains folder keywords
            
            // Generate keywords from folder name
            const folderKeywords = folderName
                .replace(/[&\/\\-]/g, ' ')  // Replace separators with spaces
                .split(/\s+/)
                .filter(k => k.length >= 2);  // Only keywords with 2+ chars
            
            // Also add abbreviations/acronyms
            const folderAbbreviations: Record<string, string[]> = {
                'artificial intelligence': ['ai', 'ml', 'neural', 'deep learning'],
                'computer networks': ['cn', 'network', 'tcp', 'ip', 'routing', 'networking'],
                'digital logic design': ['dld', 'digital', 'logic', 'gates', 'flip', 'flop'],
                'electronics': ['ecm', 'electronic', 'circuit', 'resistor', 'capacitor'],
                'mathematics': ['math', 'maths', 'calculus', 'algebra', 'integration'],
                'ethics & life skills': ['ethics', 'life skills', 'values', 'society'],
                'syllabus & reference': ['syllabus', 'reference', 'curriculum'],
                'assignments': ['assignment', 'homework', 'hw', 'task'],
                'lab work': ['lab', 'practical', 'experiment'],
                'programming': ['code', 'program', 'cpp', 'python', 'java', 'js'],
                'documents': ['doc', 'document', 'report', 'paper'],
                'presentations': ['ppt', 'presentation', 'slides'],
                'personal': ['personal', 'private', 'my'],
                'photos': ['photo', 'picture', 'image', 'pic'],
                'videos': ['video', 'movie', 'clip'],
                'music': ['music', 'song', 'audio'],
                'fcb': ['fcb', 'fundamentals'],
            };
            
            // Check for abbreviations and keywords
            for (const [fullName, abbrevs] of Object.entries(folderAbbreviations)) {
                if (folderName.includes(fullName.split(' ')[0]) || folderPath.includes(fullName.split(' ')[0])) {
                    for (const abbrev of abbrevs) {
                        if (fileNameWithoutExt.includes(abbrev)) {
                            score += 15;  // High score for keyword match
                        }
                    }
                }
            }
            
            // Check if filename contains any folder keyword
            for (const keyword of folderKeywords) {
                if (fileNameWithoutExt.includes(keyword)) {
                    score += 12;  // Good score for direct keyword match
                }
            }
            
            // Check if folder name words appear in filename
            const folderWords = folderName.split(/[\s&\-\/]+/).filter(w => w.length >= 3);
            for (const word of folderWords) {
                if (fileNameWithoutExt.includes(word)) {
                    score += 10;
                }
            }
            
            // ===== FILE PATTERN MATCHING =====
            // Check file patterns
            for (const pattern of mapping.patterns) {
                const patternLower = pattern.toLowerCase();
                
                // Match *.ext patterns
                if (patternLower.startsWith('*.')) {
                    const patternExt = patternLower.substring(2);
                    if (ext === patternExt) {
                        score += 8;
                    }
                }
                
                // Match name* patterns (prefix)
                if (patternLower.endsWith('*') && !patternLower.startsWith('*')) {
                    const prefix = patternLower.slice(0, -1);
                    if (fileName.startsWith(prefix)) {
                        score += 8;
                    }
                }
                
                // Match *name patterns (suffix in name)
                if (patternLower.startsWith('*') && !patternLower.endsWith('*')) {
                    const suffix = patternLower.slice(1);
                    if (fileName.includes(suffix)) {
                        score += 5;
                    }
                }
            }
            
            // ===== CATEGORY MATCHING =====
            // Check category match
            if (mapping.category) {
                // Direct category match
                if (fileCategory === mapping.category) {
                    score += 5;
                }
                
                // Partial category name match
                if (mapping.category.includes(fileCategory) || fileCategory.includes(mapping.category)) {
                    score += 3;
                }
                
                // Extension-based category hints
                const categoryHints: Record<string, string[]> = {
                    'documents': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'],
                    'images': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'psd'],
                    'photos': ['jpg', 'jpeg', 'png', 'raw', 'heic', 'heif'],
                    'screenshots': ['png'],
                    'videos': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
                    'audio': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
                    'music': ['mp3', 'flac', 'wav', 'aac', 'm4a'],
                    'code': ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html'],
                    'programming': ['js', 'ts', 'py', 'java', 'cpp', 'c', 'jsx', 'tsx', 'exe'],
                    'archive': ['zip', 'rar', '7z', 'tar', 'gz'],
                    'presentations': ['ppt', 'pptx', 'key', 'odp'],
                    'pdfs': ['pdf'],
                    'text': ['txt', 'md', 'rtf'],
                    'assignments': ['doc', 'docx', 'pdf', 'txt'],
                    'notes': ['txt', 'md', 'doc', 'docx', 'pdf'],
                    'syllabi': ['pdf', 'doc', 'docx'],
                    'lecture': ['pdf', 'ppt', 'pptx'],
                    'personal': ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
                    'academic': ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
                    'academics': ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xlsx'],
                };
                
                const hints = categoryHints[mapping.category];
                if (hints && hints.includes(ext)) {
                    score += 4;
                }
            }
            
            // Prefer more specific folders (deeper in hierarchy)
            const depth = mapping.path.split('\\').length;
            score += depth * 0.5;
            
            if (score > matchScore) {
                matchScore = score;
                bestMatch = mapping;
            }
        }
        
        // If no good match, use unsorted or the first category folder
        if (!bestMatch || matchScore < 3) {
            // Try to find an unsorted folder
            bestMatch = folderMappings.find(m => 
                m.name.toLowerCase().includes('unsorted') || 
                m.name.toLowerCase().includes('other')
            ) || folderMappings[0];
        }
        
        if (bestMatch) {
            const proposedPath = pathJoin(destinationRoot, bestMatch.path, file.name);
            
            // Only create change if the file would actually move
            if (proposedPath !== file.path) {
                changes.push({
                    file,
                    currentPath: file.path,
                    currentName: file.name,
                    proposedPath,
                    proposedName: file.name,
                    matchedRule: `Structure: ${bestMatch.path}`,
                    matchedRuleId: `structure-${bestMatch.path}`,
                    selected: true,
                    status: 'pending',
                });
            }
        }
    });
    
    return changes;
}
