# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is an Electron-based YouTube Music Downloader application with a dual-process architecture:

- **Main Process** (`src/main.js`): Electron main process that handles system interactions, file operations, and spawns `yt-dlp` processes for downloading
- **Renderer Process** (`renderer/`): React + Vite application providing the user interface

### Key Components

**Main Process (`src/main.js`)**:
- Manages Electron window creation and lifecycle
- IPC handlers for video info extraction, audio downloading, and file operations
- System integration (USB drive detection, folder selection, file copying)
- Uses `yt-dlp` command-line tool for YouTube processing
- Subscription verification (placeholder implementation)

**Renderer Process (`renderer/src/`)**:
- React 18 + TypeScript application
- Uses ShadCN UI components with Tailwind CSS
- Vite for build tooling and development server
- Main application logic in `App.tsx`

## Development Commands

### Full Application Development
```bash
# Start both Electron and React dev servers
npm run dev

# Build and package the application
npm run build

# Create distributable packages
npm run dist

# Development build only (no packaging)
npm run pack
```

### Renderer-Only Development
```bash
# Start React dev server only (for UI work)
cd renderer && npm run dev

# Build renderer for production
cd renderer && npm run build

# TypeScript compilation check
cd renderer && npm run build

# Lint renderer code
cd renderer && npm run lint
```

### Individual Process Commands
```bash
# Start Electron main process only (requires built renderer)
npm start

# Build renderer then package Electron app
npm run build:renderer && electron-builder
```

## Technical Dependencies

### Core External Dependency
- **yt-dlp**: Must be installed system-wide. The application spawns `yt-dlp` processes for video info extraction and audio downloading.

### Key IPC Communication
The main process exposes these IPC handlers to the renderer:
- `get-video-info`: Extract video metadata from YouTube URLs
- `download-audio`: Download audio with progress tracking via `download-progress` events
- `get-usb-drives`: Cross-platform USB drive detection
- `select-folder`: Native folder selection dialog
- `copy-to-usb`: File copying to USB drives
- `verify-subscription`: Subscription status (placeholder)

### Platform Considerations
- USB drive detection implemented differently for macOS (`/Volumes`), Windows (`wmic`), and Linux (`/proc/mounts`)
- File path handling uses Node.js `path` module for cross-platform compatibility
- Development mode detection via `NODE_ENV` and `app.isPackaged`

## UI Component System

Uses ShadCN UI components located in `renderer/src/components/ui/`:
- Pre-built components: Button, Card, Input, Progress, Select, Badge
- Tailwind CSS with custom color scheme using CSS variables
- Dark mode support via class-based toggle

## Build Configuration

### Electron Builder
- Multi-platform builds: macOS (icns), Windows (ico), Linux (png)
- Output directory: `dist/`
- Includes: `src/**/*`, `renderer/dist/**/*`, `node_modules/**/*`

### Vite Configuration
- React plugin with TypeScript support
- Base path: `./` for Electron compatibility
- Dev server: port 3000 with strict port enforcement
- Alias: `@` points to renderer root directory

## Development Patterns

### Environment Detection
```javascript
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
```

### IPC Progress Tracking
The application uses event-driven progress updates for long-running operations like downloads. All download operations send progress events with standardized payload structure.

### Error Handling
- Promise-based IPC handlers with try/catch error propagation
- yt-dlp stderr monitoring and error message parsing
- Cross-platform file operation error handling