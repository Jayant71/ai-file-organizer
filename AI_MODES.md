# AI Organization Modes - Technical Documentation

This document explains how the three AI organization modes work internally.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI SUGGESTION PIPELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Input: Files[] + BaseFolder + Mode + UserPreferences                │
│                                                                       │
│  ┌──────────────┐                                                    │
│  │    QUICK     │ ──► Pattern Matching + Category Detection          │
│  └──────────────┘                                                    │
│         │                                                             │
│         ▼                                                             │
│  ┌──────────────┐                                                    │
│  │    SMART     │ ──► + Duplicate Detection + Rename Suggestions     │
│  └──────────────┘       + Age Analysis                               │
│         │                                                             │
│         ▼                                                             │
│  ┌──────────────┐                                                    │
│  │    DEEP      │ ──► + OpenAI LLM Analysis + Folder Context         │
│  └──────────────┘       + Semantic Grouping                          │
│                                                                       │
│  Output: AISuggestion[]                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Mode

**Speed**: < 1 second | **Accuracy**: 70-85% | **50+ Pattern Rules**

### What It Does
1. **Pattern Matching** - Checks filename against 50+ known patterns
2. **Category Detection** - Categorizes by 100+ file extensions
3. **Organization Style** - Applies user's folder structure preference

### Pattern Categories

| Category | Patterns | Examples |
|----------|----------|----------|
| **Screenshots** | screenshot, capture, snip, grab | `Screenshot_2024.png` |
| **Screen Recordings** | screenrecord, screencast | `recording.mp4` |
| **Camera Photos** | IMG_, DSC_, DCIM, DSCN | `IMG_20241210.jpg` |
| **Selfies** | selfie, portrait | `selfie_001.jpg` |
| **Wallpapers** | wallpaper, background, desktop | `wallpaper.png` |
| **Profile Pictures** | avatar, profile, headshot, dp | `profile_pic.jpg` |
| **Memes** | meme, reaction, funny | `funny_meme.gif` |

### Social Media Patterns

| Platform | Patterns | Folder |
|----------|----------|--------|
| **WhatsApp** | whatsapp, wa-image, wa-video | Media/WhatsApp |
| **Instagram** | instagram, ig-story, insta | Media/Instagram |
| **Telegram** | telegram | Media/Telegram |
| **Twitter** | twitter, tweet | Media/Twitter |
| **Facebook** | facebook, fb | Media/Facebook |
| **Snapchat** | snapchat, snap | Media/Snapchat |
| **TikTok** | tiktok | Media/TikTok |
| **YouTube** | youtube, yt-download | Media/YouTube |

### Document Patterns

| Type | Patterns | Folder |
|------|----------|--------|
| **Invoices** | invoice, receipt, bill, payment | Documents/Finance/Invoices |
| **Tax** | tax, 1099, w2, w-2, itr, gst | Documents/Finance/Tax |
| **Bank Statements** | bank-statement, account-statement | Documents/Finance/Bank Statements |
| **Payslips** | salary, payslip, paystub | Documents/Finance/Payslips |
| **Resume/CV** | resume, cv, curriculum-vitae | Documents/Career/Resumes |
| **Cover Letters** | cover-letter | Documents/Career/Cover Letters |
| **Certificates** | certificate, certification, diploma | Documents/Career/Certificates |
| **Contracts** | contract, agreement, nda | Documents/Legal/Contracts |
| **Identity** | passport, visa, id-card, license | Documents/Identity |
| **Insurance** | insurance, policy | Documents/Insurance |
| **Reports** | report, analysis, summary | Documents/Reports |
| **Presentations** | presentation, slides, deck | Documents/Presentations |
| **Meeting Notes** | meeting-note, minutes, mom | Documents/Meeting Notes |
| **Proposals** | proposal, quotation, quote | Documents/Proposals |
| **Guides** | manual, guide, tutorial, howto | Documents/Guides |

### Education Patterns

| Type | Patterns | Folder |
|------|----------|--------|
| **Assignments** | assignment, homework, hw1, lab1 | Education/Assignments |
| **Lecture Notes** | lecture, lect1, classnote, note | Education/Lecture Notes |
| **Syllabus** | syllabus, curriculum | Education/Syllabus |
| **Exams** | exam, test, quiz, midterm, final | Education/Exams |
| **Books** | textbook, ebook, book | Education/Books |
| **Projects** | project, thesis, dissertation | Education/Projects |
| **Research** | research, paper, journal, article | Education/Research Papers |

### Other Patterns

| Type | Patterns | Folder |
|------|----------|--------|
| **Installers** | setup, installer, install | Downloads/Installers |
| **Drivers** | driver, firmware | Downloads/Drivers |
| **Fonts** | font, typeface | Design/Fonts |
| **Backups** | backup, bak, export, dump | Backups |
| **Archives** | archive, old, deprecated | Archive |
| **Logos** | logo, icon, brand | Design/Logos |
| **Mockups** | mockup, wireframe, prototype | Design/Mockups |
| **Marketing** | banner, poster, flyer, brochure | Design/Marketing |
| **Templates** | template, boilerplate | Templates |
| **Podcasts** | podcast, episode, ep1 | Media/Podcasts |
| **Audiobooks** | audiobook | Media/Audiobooks |
| **Ringtones** | ringtone, notification | Media/Ringtones |

### File Extension Categories

| Category | Extensions |
|----------|------------|
| **Documents** | pdf, doc, docx, txt, rtf, odt, xls, xlsx, ppt, pptx, csv, epub, mobi, azw3 |
| **Images** | jpg, jpeg, png, gif, bmp, svg, webp, ico, tiff, raw, psd, ai, sketch, fig, xd |
| **Videos** | mp4, avi, mkv, mov, wmv, flv, webm, m4v, 3gp |
| **Audio** | mp3, wav, flac, aac, ogg, wma, m4a, opus, aiff, mid, midi |
| **Archives** | zip, rar, 7z, tar, gz, bz2, xz, iso, dmg |
| **Code** | js, ts, jsx, tsx, py, java, c, cpp, h, hpp, cs, go, rs, php, rb, swift, kt, html, css, scss, sass, less, json, xml, yaml, yml, md, sql, sh, bash, ps1, bat, vue, svelte, r, scala, lua, pl, dart, elm, ex, exs, ipynb |
| **Executables** | exe, msi, app, deb, rpm, apk, ipa |
| **Fonts** | ttf, otf, woff, woff2, eot |
| **3D** | obj, fbx, stl, blend, max |
| **Data** | db, sqlite, mdb, accdb |

---

## 🧠 Smart Mode

**Speed**: 2-5 seconds | **Accuracy**: 75-90%

### What It Does
Everything in Quick mode, plus:
1. **Duplicate Detection** - Finds files with same size + similar names
2. **Rename Suggestions** - Cleans up messy filenames (10 patterns)
3. **Age Analysis** - Notes files older than 90 days

### Duplicate Detection Logic

```typescript
// Step 1: Group by file size
sizeMap = groupBy(files, f => f.size)

// Step 2: For files with same size, check name similarity
for each sizeGroup with > 1 file:
  baseName = removeSuffixes(name)  // Remove "(1)", " copy", etc.
  
  if multiple files have same baseName:
    Create DuplicateGroup {
      files: [file1, file2, file3],
      suggestedKeepId: oldest file,  // By modification date
      reason: "3 files with same size and similar name"
    }
```

### Rename Patterns (10 Rules)

| Pattern | Before | After |
|---------|--------|-------|
| Camera photos | `IMG_20241210_123456.jpg` | `Photo_2024-12-10_1234.jpg` |
| WhatsApp | `IMG-20241210-WA0001.jpg` | `WhatsApp_2024-12-10.jpg` |
| Screenshots | `Screenshot 2024-12-10.png` | `Screenshot_2024-12-10.png` |
| Windows screenshots | `Screenshot (1).png` | `Screenshot_1.png` |
| Duplicate suffix | `file (1).pdf` | `file.pdf` |
| Copy suffix | `document copy.docx` | `document.docx` |
| Version suffix | `report-final.pdf` | `report.pdf` |
| Multiple underscores | `file__name.txt` | `file_name.txt` |
| UUID prefix | `a1b2c3d4-e5f6-..._doc.pdf` | `doc.pdf` |
| Timestamp suffix | `file_1702234567890.pdf` | `file.pdf` |

### Age Analysis

```typescript
const OLD_THRESHOLD_DAYS = 90;

daysOld = (now - file.modifiedTime) / (1000 * 60 * 60 * 24)

if (daysOld > OLD_THRESHOLD_DAYS):
  reason += "(1250 days old)"
```

---

## 🔮 Deep Mode

**Speed**: 10-30 seconds | **Accuracy**: 85-95% | **Requires**: OpenAI API Key

### What It Does
Everything in Smart mode, plus:
1. **LLM File Analysis** - Sends file metadata to OpenAI for semantic understanding
2. **Folder Context Analysis** - Understands what the folder is for
3. **Semantic Grouping** - Groups related files by meaning, not just extension

### Batch Processing

Files are processed in batches of 50 to:
- Avoid OpenAI token limits
- Provide progress feedback
- Handle large folders efficiently

```typescript
totalBatches = ceil(files.length / 50)

for i = 0 to totalBatches:
  batch = files.slice(i * 50, (i + 1) * 50)
  
  onProgress({
    currentBatch: i + 1,
    totalBatches: totalBatches,
    status: "Analyzing batch 2 of 10..."
  })
  
  llmSuggestions = await callOpenAI(batch, folderContext, userPreferences)
  allSuggestions.push(...llmSuggestions)
```

### LLM Prompt Structure

```typescript
const prompt = `You are a file organization assistant.

FOLDER CONTEXT: ${folderPath}
USER PREFERENCES:
- Cleanliness Level: ${preferences.cleanlinessLevel}
- Safety Preference: ${preferences.safetyPreference}
- Access Priority: ${preferences.accessPriority}

FILES TO ANALYZE:
${JSON.stringify(filesMetadata)}

For each file that needs action, respond with JSON:
[{
  "fileId": "...",
  "proposedPath": "suggested/folder/path/file.ext",
  "proposedName": "new_name.ext or null",
  "reason": "Why this organization makes sense",
  "confidence": 0.0 to 1.0,
  "category": "documents|images|videos|...",
  "action": "move|rename|archive|review"
}]

Rules:
1. Only suggest changes for files that need organization
2. Group similar files together
3. Use descriptive folder names
4. Consider file age - old files might need archiving
5. Keep path structure simple and logical
```

### Folder Context Analysis

Deep mode also analyzes the **overall folder structure**:

```typescript
const folderAnalysis = await llm.analyzeFolderContext(
  folderPath,
  sampleFileNames.slice(0, 20)
)

// Returns:
{
  purpose: "College assignments and course materials",
  suggestedSubfolders: ["Assignments", "Notes", "Projects"],
  detectedCategories: ["documents", "code", "images"],
  organizationScore: 0.3,  // 0-1, how organized it already is
  recommendations: [
    "Group files by course name",
    "Archive files from 2020-2021"
  ]
}
```

### Merge Strategy

When both heuristics and LLM provide suggestions for the same file:

```typescript
function mergeSuggestions(heuristic, llm):
  for each heuristicSuggestion:
    llmSuggestion = llm.find(s => s.fileId === h.fileId)
    
    if llmSuggestion exists AND llmSuggestion.confidence >= heuristic.confidence:
      use llmSuggestion  // LLM wins on higher confidence
    else:
      use heuristicSuggestion
```

---

## User Preferences Impact

### Organization Style

| Setting | Effect on Suggestions |
|---------|----------------------|
| **by-category** | Groups by Documents, Images, Videos, etc. |
| **by-date** | Creates Year/Month/Category structure |
| **by-type** | Groups by extension (PDF, DOCX, JPG) |
| **flat** | All files stay in base folder |

### AI Source Preference

| Setting | Behavior |
|---------|----------|
| **heuristics-only** | Never calls LLM, even in Deep mode |
| **heuristics-preferred** | LLM as fallback (not yet implemented) |
| **llm-preferred** | LLM first, heuristics fallback |
| **llm-only** | Only shows LLM suggestions |

---

## Performance Comparison

| Metric | Quick | Smart | Deep |
|--------|-------|-------|------|
| Speed (100 files) | <1s | 2-3s | 15-20s |
| Speed (500 files) | 1-2s | 3-5s | 60-90s |
| API Calls | 0 | 0 | 2-12 |
| Pattern Rules | 50+ | 50+ | 50+ + LLM |
| Rename Patterns | 0 | 10 | 10 |
| Duplicate Detection | No | Yes | Yes |
| Accuracy (subjective) | 70% | 80% | 90% |
| Best For | Fast cleanup | Daily use | Complex folders |

---

## Source Code References

- **AI Types**: `src/domain/types/ai.ts`
- **File Categories**: `src/domain/types/file.ts` (100+ extensions)
- **AI Service**: `src/services/ai-suggestion.ts` (50+ patterns)
- **LLM Service**: `src/services/llm-service.ts`
- **Settings**: `src/services/config.ts`
