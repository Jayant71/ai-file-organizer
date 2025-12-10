# Smart File Organizer - Complete Documentation

## Overview

Smart File Organizer is a cross-platform desktop application built with **Electron**, **React**, **TypeScript**, and **Tailwind CSS**. It helps users organize files on their local computer and Google Drive through rule-based automation and AI-powered suggestions.

---

## Features

### 🗂️ Local File Organization

| Feature | Description |
|---------|-------------|
| **Folder Scanning** | Select and scan multiple folders simultaneously |
| **Subdirectory Control** | Toggle to include/exclude subdirectories (up to 10 levels deep) |
| **File Metadata** | Collects name, extension, size, dates, and MIME type |
| **Category Detection** | Auto-categorizes files: documents, images, videos, audio, archives, code |
| **Filtering & Sorting** | Search, filter by category, sort by name/size/date |
| **Pagination** | Handles large file lists with 50 files per page |

### ⚙️ Rule-Based Organization Engine

Create custom rules with flexible conditions and actions:

**Conditions (When)**
| Type | Operators | Example |
|------|-----------|---------| 
| File Category | equals, notEquals | `category equals "documents"` |
| File Extension | in, notIn | `extension in [".pdf", ".docx"]` |
| File Size | gt, lt | `size > 10MB` |
| File Age | gt, lt (days) | `age > 30 days` |
| File Name | contains, startsWith, endsWith | `name contains "invoice"` |
| File Path | contains, startsWith | `path contains "Downloads"` |

**Actions (Then)**
| Action | Description |
|--------|-------------|
| **Move** | Move to specific folder |
| **Move by Date** | Organize into year/month structure |
| **Move by Category** | Sort into Documents, Images, Videos, etc. |
| **Rename** | Apply naming patterns with `{name}`, `{date}`, `{ext}` |

---

## ✨ AI-Powered Organization (NEW)

The app now features a **tiered AI system** with three modes, allowing you to choose the right balance of speed and intelligence.

### AI Organization Modes

| Mode | Speed | Features | Best For |
|------|-------|----------|----------|
| ⚡ **Quick** | < 1 sec | Name, extension, category-based | Fast cleanup |
| 🧠 **Smart** | 2-5 sec | + Duplicates, renames, age analysis | Daily use |
| 🔮 **Deep** | 10-30 sec | + OpenAI LLM semantic analysis | Complex folders |

### How Each Mode Works

#### Quick Mode
Uses pattern matching on filenames:
- Detects screenshots, invoices, resumes, contracts
- Categorizes by file extension
- Groups media by year/month

#### Smart Mode (Default)
Everything in Quick, plus:
- **Duplicate Detection**: Finds files with same size and similar names
- **Rename Suggestions**: Cleans up messy filenames (e.g., `IMG_20241210_123456` → `Photo_2024-12-10`)
- **Age Analysis**: Notes old files (> 90 days)

#### Deep Mode (Requires OpenAI API Key)
Everything in Smart, plus:
- **LLM-Powered Analysis**: Sends file metadata to OpenAI for semantic understanding
- **Context-Aware Suggestions**: Understands folder purpose and user preferences
- **Batch Processing**: Handles large folders by processing 50 files at a time
- **Folder Analysis**: Provides recommendations for overall folder structure

### What the LLM Actually Does

When you use **Deep Mode**, the OpenAI LLM:

1. **Analyzes File Context**: Looks at file names, types, sizes, and ages to understand what each file is about
2. **Understands Folder Purpose**: Infers what the folder is used for (e.g., "college assignments", "work projects")
3. **Considers User Preferences**: Respects your cleanliness level, safety preference, and access priority
4. **Suggests Semantic Groupings**: Groups related files even if they have different extensions
5. **Provides Human-Like Reasoning**: Explains why each suggestion makes sense

**Example LLM Enhancement:**
- Heuristic sees: `report_q3.pdf`, `analysis_q3.xlsx`, `presentation_q3.pptx`
- LLM understands: "These are all Q3 quarterly reports, group them together"

### Setting Up Deep Mode

1. Go to **Settings** page
2. Select **🔮 Deep** mode
3. Enter your **OpenAI API Key** (get one from [platform.openai.com](https://platform.openai.com/api-keys))
4. Set your **Organization Preferences**:
   - Cleanliness Level: Minimal / Moderate / Aggressive
   - Safety Preference: Cautious / Balanced / Fast
   - Access Priority: Recent / Frequent / Organized

### Large Folder Handling

For folders with many files, Deep mode uses **batched processing**:

```
500 files in folder
├── Batch 1: files 1-50   → OpenAI analysis
├── Batch 2: files 51-100 → OpenAI analysis
├── ...
└── Batch 10: files 451-500 → OpenAI analysis

Progress shown: "Analyzing batch 3 of 10..."
```

---

### ☁️ Google Drive Integration

| Feature | Status |
|---------|--------|
| OAuth 2.0 Authentication | ✅ Complete |
| Browse & Navigate | ✅ Complete |
| Rule-Based Organization | ✅ Complete |
| AI Suggestions | ✅ Complete |
| File Moving | ✅ Complete |
| Folder Creation | ✅ Complete |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Filesystem  │  │ Google Drive │  │     Settings     │   │
│  │   Handler   │  │   Handler    │  │     Handler      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│                           │                                  │
│                    IPC Bridge (Secure)                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                     React Renderer Process                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Pages                              │   │
│  │  LocalOrganizer │ DriveOrganizer │ Rules │ Settings  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Domain Layer (Pure TypeScript)           │   │
│  │    Rule Engine │ AI Service │ LLM Service │ Types     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
file-organizer/
├── electron/main/           # Electron main process
│   ├── index.ts             # App lifecycle & window
│   ├── preload.ts           # Context bridge API
│   └── ipc/
│       ├── filesystem.ts    # File operations + content sampling
│       ├── google-drive.ts  # Drive OAuth & API
│       └── settings.ts      # Persistent settings
│
├── src/
│   ├── domain/              # Business logic (no dependencies)
│   │   ├── types/           # TypeScript interfaces
│   │   │   ├── ai.ts        # AIMode, DuplicateGroup, FolderAnalysis
│   │   │   └── file.ts      # FileMeta, FileChange
│   │   └── rule-engine/     # Condition matching & actions
│   │
│   ├── services/            # Application services
│   │   ├── ai-suggestion.ts # Tiered AI (Quick/Smart/Deep)
│   │   ├── llm-service.ts   # OpenAI integration with batching
│   │   └── config.ts        # Constants & utilities
│   │
│   ├── renderer/            # React UI
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Route pages
│   │   └── context/         # State management
│   │
│   └── utils/               # Shared utilities
│       └── path.ts          # Browser-safe path functions
│
├── tests/                   # Vitest unit tests
├── .env                     # Environment variables
└── package.json
```

---

## Quick Start

### Installation

```bash
git clone <repository>
cd file-organizer
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run package           # Current platform
npm run package:win       # Windows
npm run package:mac       # macOS
npm run package:linux     # Linux
```

---

## Configuration

### Environment Variables (.env)

```env
# Google Drive (required for Drive features)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### In-App Settings

| Setting | Location | Description |
|---------|----------|-------------|
| AI Mode | Settings → AI Organization | Quick / Smart / Deep |
| OpenAI API Key | Settings → AI Organization | Required for Deep mode |
| User Preferences | Settings → Organization Style | Cleanliness, safety, access |
| Theme | Settings → Appearance | Light / Dark / System |
| Old File Threshold | Settings → Behavior | Days before file is "old" |

### Google Cloud Setup

1. Create project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Google Drive API**
3. Configure **OAuth consent screen** (External, add test users)
4. Create **OAuth 2.0 Client ID** (Desktop app type)
5. Copy Client ID and Secret to `.env`

---

## Safety Features

| Feature | Description |
|---------|-------------|
| **No Deletions** | Files are only moved or renamed, never deleted |
| **Preview Mode** | All changes shown before execution |
| **Selective Apply** | Choose which changes to apply |
| **Conflict Resolution** | Auto-appends suffix for name conflicts |
| **Operation Logging** | Full history of applied changes |
| **Context Isolation** | Secure IPC between renderer and main |
| **Cross-Drive Support** | Handles moves between different drives |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Electron 33 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS 3 |
| Build Tool | Vite 6 |
| Testing | Vitest |
| Cloud | Google Drive API |
| Storage | electron-store |
| AI/LLM | OpenAI GPT-4o-mini |

---

## Troubleshooting

### Deep Mode Not Using LLM

1. Open DevTools (`Ctrl+Shift+I`)
2. Check Console for `[AI] Deep mode check:`
3. Verify `hasApiKey: true` and `hasLLMService: true`
4. If false, re-enter API key in Settings

### Google Drive Authentication Failed

1. Check `.env` has correct Client ID and Secret
2. Ensure OAuth consent screen is configured
3. Add your email as a test user

---

## License

MIT License
