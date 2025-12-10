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

### ✨ AI Suggestions

Intelligent file organization using heuristic pattern matching:

- **Smart Pattern Detection**: Recognizes screenshots, invoices, resumes, contracts, backups, wallpapers
- **Category-Based Sorting**: Suggests folder structure based on file type
- **Date-Based Organization**: Groups images/videos by year and month
- **Confidence Scoring**: Each suggestion includes a confidence level (0.7-0.85)

### ☁️ Google Drive Integration

- **OAuth 2.0 Authentication**: Secure Google sign-in flow
- **File Browser**: Navigate folders with breadcrumb navigation
- **Token Persistence**: Encrypted token storage via electron-store
- **API Support**: List, move, and create folders (full organization coming soon)

### 🎨 User Interface

- **Dark/Light/System Theme**: Automatic theme detection with manual override
- **Responsive Layout**: Sidebar navigation with collapsible sections
- **Preview Mode**: Review all changes before applying
- **Operation Log**: Track successful and failed operations
- **Loading States**: Visual feedback during scans and processing

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
│  │           Rule Engine │ AI Suggestions │ Types        │   │
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
│       ├── filesystem.ts    # File operations
│       ├── google-drive.ts  # Drive OAuth & API
│       └── settings.ts      # Persistent settings
│
├── src/
│   ├── domain/              # Business logic (no dependencies)
│   │   ├── types/           # TypeScript interfaces
│   │   └── rule-engine/     # Condition matching & actions
│   │
│   ├── services/            # Application services
│   │   ├── ai-suggestion.ts # Heuristic suggestions
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

### Environment Variables

Create `.env` in project root:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

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

---

## Default Rules (Included)

| Rule | Conditions | Actions |
|------|------------|---------|
| Organize Documents | Category = documents | Move by category |
| Organize Media | Category = images, videos, audio | Move by category |
| Archive Old Files | Age > 90 days, Size > 1MB | Move to Archive folder |
| Screenshot Organizer | Name contains "screenshot" | Move by date |
| Clean Downloads | Path contains "Downloads" | Move by category |

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

---

## Known Limitations

- Google Drive organization features are read-only (browse mode)
- AI suggestions use heuristics only (LLM integration planned)
- Maximum scan depth: 10 subdirectory levels
- Large folders (10,000+ files) may take time to scan

---

## Roadmap

- [ ] Full Google Drive move/rename operations
- [ ] LLM-powered AI suggestions (OpenAI, Claude)
- [ ] Undo functionality for applied changes
- [ ] Scheduled/automatic organization
- [ ] Custom folder templates
- [ ] Drag-and-drop rule reordering

---

## License

MIT License
