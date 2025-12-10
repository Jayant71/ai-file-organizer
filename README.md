# Smart File Organizer

A cross-platform desktop application to organize files on your local computer and Google Drive using rules and AI suggestions.

![Smart File Organizer](https://via.placeholder.com/800x400?text=Smart+File+Organizer)

## Features

- 📁 **Local File Organization** - Scan and organize files from any folder
- ☁️ **Google Drive Integration** - Browse and organize Drive files
- ⚙️ **Rule-Based Engine** - Create custom rules with conditions and actions
- ✨ **AI Suggestions** - Get intelligent organization recommendations
- 🔍 **Preview Before Apply** - Always see changes before they happen
- 🎨 **Dark/Light Mode** - Beautiful UI with theme support
- 🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux

## Tech Stack

- **Desktop Shell**: Electron
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Rule Engine**: Custom TypeScript implementation
- **Cloud**: Google Drive API (OAuth 2.0)
- **Testing**: Vitest

## Prerequisites

- Node.js 18+ 
- npm 9+
- (Optional) Google Cloud account for Drive integration

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smart-file-organizer.git
   cd smart-file-organizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure Google Drive API credentials (see below)

## Development

Start the development server:

```bash
npm run dev
```

This will:
- Start the Vite dev server for the React app
- Launch Electron with hot reload

## Building

Build for your current platform:

```bash
npm run package
```

Build for specific platforms:

```bash
# Windows
npm run package:win

# macOS
npm run package:mac

# Linux
npm run package:linux
```

Built installers will be in the `release` directory.

## Testing

Run the test suite:

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test
```

## Project Structure

```
file-organizer/
├── electron/
│   └── main/
│       ├── index.ts          # Main process entry
│       ├── preload.ts        # Context bridge
│       └── ipc/              # IPC handlers
│           ├── filesystem.ts
│           ├── google-drive.ts
│           └── settings.ts
├── src/
│   ├── domain/
│   │   ├── types/            # TypeScript types
│   │   └── rule-engine/      # Rule matching logic
│   ├── services/
│   │   ├── ai-suggestion.ts  # AI suggestions
│   │   └── config.ts         # Configuration
│   └── renderer/
│       ├── components/       # React components
│       ├── pages/            # Page components
│       ├── context/          # React contexts
│       ├── App.tsx
│       └── main.tsx
├── tests/                    # Test files
├── package.json
└── README.md
```

## Google Drive Setup

To enable Google Drive features:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project or select an existing one

3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Fill in app name, user support email, and developer contact
   - Add scopes: `drive.file`, `drive.metadata.readonly`, `userinfo.email`, `userinfo.profile`
   - Add test users (your email)

5. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Desktop app"
   - Download the JSON file

6. Set environment variables:
   ```bash
   export GOOGLE_CLIENT_ID="your_client_id"
   export GOOGLE_CLIENT_SECRET="your_client_secret"
   ```

   On Windows (PowerShell):
   ```powershell
   $env:GOOGLE_CLIENT_ID="your_client_id"
   $env:GOOGLE_CLIENT_SECRET="your_client_secret"
   ```

## Creating Rules

1. Navigate to the **Rules** tab
2. Click **Create Rule**
3. Set rule properties:
   - **Name**: A descriptive name
   - **Description**: What the rule does
   - **Scope**: Local, Drive, or Both
4. Add **Conditions** (when to apply):
   - File category (documents, images, videos, etc.)
   - File extension (.pdf, .jpg, etc.)
   - File size (greater/less than)
   - File age (days since modified)
   - File name (contains, starts with, etc.)
5. Add **Actions** (what to do):
   - Move to folder
   - Move by date (year/month structure)
   - Move by category
   - Rename with pattern
6. Enable the rule and save

## AI Suggestions

The app includes an AI suggestion feature that analyzes your files and proposes organization strategies. Currently uses heuristic-based matching with support for LLM integration in future versions.

Click **AI Suggestions** after scanning to see recommendations.

## Safety Features

- ⚠️ **No Deletions** - Only move and rename operations
- 👁️ **Preview Mode** - Always see changes before applying
- 🔄 **Conflict Handling** - Automatic suffix for name conflicts (file_1.pdf)
- 📋 **Operation Log** - Track all applied changes

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm run test:run`)
5. Submit a pull request
