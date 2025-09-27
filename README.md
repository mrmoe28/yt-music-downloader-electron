# YouTube Music Downloader Pro

A professional desktop application for downloading YouTube music with a modern UI, download history, and auto-update functionality.

![YouTube Music Downloader Pro](https://img.shields.io/badge/Electron-App-blue?style=for-the-badge&logo=electron)
![TypeScript](https://img.shields.io/badge/TypeScript-React-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

### 🎵 **Core Functionality**
- **High-Quality Audio Downloads**: MP3 (320kbps, 256kbps) and FLAC formats
- **Fast Downloads**: Optimized with concurrent fragments and retry logic
- **YouTube Bot Detection Bypass**: Uses browser cookies and proper user agents
- **Batch Processing**: Download multiple songs with queue management

### 🎨 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful transparent UI with backdrop blur effects
- **Download History Sidebar**: Visual history with thumbnails and progress tracking
- **Dark Mode**: Elegant dark theme with gradient backgrounds
- **Responsive Layout**: Adapts to different window sizes

### 📱 **User Experience**
- **Thumbnail Preview**: Shows video thumbnails during and after downloads
- **Real-time Progress**: Live download progress with speed and ETA
- **Auto URL Clear**: Automatically clears URL field after successful download
- **Status Indicators**: Visual feedback for download states (pending, downloading, completed, error)

### 🔧 **Technical Features**
- **Auto-Updates**: Automatic app updates with user notification
- **USB Drive Detection**: Detect and transfer files to external drives
- **Cross-Platform**: macOS, Windows, and Linux support
- **Desktop Integration**: Proper app bundle with custom icon

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - for development only
- **Git** - for development only

**Note**: End users don't need any dependencies - yt-dlp is bundled with the app!

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mrmoe28/yt-music-downloader-electron.git
   cd yt-music-downloader-electron
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd renderer && npm install && cd ..
   ```

3. **Development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### 📦 Pre-built Releases

Download the latest release from [Releases](https://github.com/mrmoe28/yt-music-downloader-electron/releases):

- **macOS**: `YouTube Music Downloader Pro.dmg`
- **Windows**: `YouTube Music Downloader Pro Setup.exe`
- **Linux**: `YouTube Music Downloader Pro.AppImage`

## 🛠️ Development

### Project Structure

```
yt-music-downloader-electron/
├── src/                    # Electron main process
│   ├── main.js            # Main application entry
│   └── preload.js         # Preload script for security
├── renderer/              # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── components/ui/ # ShadCN UI components
│   │   └── lib/           # Utilities
│   └── dist/              # Built frontend files
├── assets/                # App icons and resources
├── dist/                  # Built application
└── package.json           # Main package configuration
```

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: ShadCN/UI + Tailwind CSS
- **Desktop**: Electron 33
- **Bundler**: electron-builder
- **Audio Downloader**: yt-dlp
- **Auto-Updates**: electron-updater

### Available Scripts

```bash
npm run dev           # Start development mode
npm run build         # Build for production
npm run build:renderer # Build only the React frontend
npm start            # Start the built application
npm run pack         # Package without creating installers
npm run dist         # Create distribution packages
```

## 🎯 Usage

1. **Launch the Application**
   - Open from Applications folder (macOS)
   - Or run from development: `npm run dev`

2. **Download Music**
   - Paste a YouTube URL in the input field
   - Select your preferred audio quality
   - Choose output folder
   - Click "Download Audio"

3. **Track Progress**
   - Watch real-time progress in the sidebar
   - View thumbnails and download status
   - URL automatically clears when complete

4. **Manage Downloads**
   - View complete download history
   - Transfer files to USB drives
   - Monitor download speeds and ETAs

## ⚙️ Configuration

### Auto-Updates

To enable auto-updates, configure your update server in `src/main.js`:

```javascript
// For GitHub releases
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'mrmoe28',
  repo: 'yt-music-downloader-electron'
});
```

### Download Optimization

The app includes optimized yt-dlp settings:
- 8 concurrent fragments for faster downloads
- Browser cookie authentication
- Retry logic for failed downloads
- Custom user agent for bot detection bypass

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational purposes only. Please respect YouTube's Terms of Service and only download content you have permission to download. The developers are not responsible for any misuse of this software.

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/mrmoe28/yt-music-downloader-electron/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/mrmoe28/yt-music-downloader-electron/discussions)

## 🙏 Acknowledgments

- **yt-dlp** - Core download functionality
- **Electron** - Cross-platform desktop framework
- **React** - UI framework
- **ShadCN/UI** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework

---

**Built with ❤️ by [Claude Code](https://claude.ai/code)**