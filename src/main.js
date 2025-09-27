const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { autoUpdater } = require('electron-updater');

// Settings storage
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return {
    outputPath: path.join(os.homedir(), 'Downloads'),
    quality: '320'
  };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Get the bundled yt-dlp path
function getYtDlpPath() {
  if (app.isPackaged) {
    // In packaged app, yt-dlp is in resources/app.asar.unpacked/binaries/
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'binaries', 'yt-dlp');
  } else {
    // In development, check for bundled binary first, then fall back to system
    const bundledPath = path.join(__dirname, '..', 'binaries', 'yt-dlp');
    if (fs.existsSync(bundledPath)) {
      return bundledPath;
    }
    // Fall back to system yt-dlp in development
    return 'yt-dlp';
  }
}

// Development mode check
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  // Load the React app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', 'renderer', 'dist', 'index.html')}`;

  console.log('Loading URL:', startUrl, 'isDev:', isDev, 'dirname:', __dirname);
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close event - quit the entire app when window is closed
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// Configure auto-updater
function configureAutoUpdater() {
  // Configure update server URL for GitHub releases
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'mrmoe28',
    repo: 'yt-music-downloader-electron'
  });

  // Check for updates every 30 minutes
  setInterval(() => {
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }, 30 * 60 * 1000);

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version ${info.version} is available. It will be downloaded in the background.`,
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Current version is up-to-date.');
  });

  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Check for updates on startup
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  configureAutoUpdater();
});

app.on('window-all-closed', () => {
  // Always quit the app when all windows are closed
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for YouTube downloads

ipcMain.handle('get-video-info', async (event, url) => {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-download',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--extractor-args', 'youtube:player_client=mweb',
      '--cookies-from-browser', 'chrome',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      '--add-header', 'Accept-Encoding:gzip, deflate, br',
      '--add-header', 'DNT:1',
      '--add-header', 'Connection:keep-alive',
      '--add-header', 'Upgrade-Insecure-Requests:1',
      '--no-check-certificates',
      '--ignore-errors',
      url
    ];

    const ytdlp = spawn(getYtDlpPath(), args);
    let output = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      const errorText = data.toString();
      console.log('yt-dlp audio info stderr:', errorText);

      // Don't fail on warnings, only on actual errors
      if (errorText.includes('ERROR:') && !errorText.includes('WARNING:')) {
        console.error('yt-dlp error:', errorText);
      }
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output.trim());
          resolve({
            title: info.title || 'Unknown Title',
            duration: info.duration || 0,
            audio_format: info.ext || 'mp3'
          });
        } catch (error) {
          console.error('Failed to parse audio info:', error);
          reject('Failed to parse audio info: ' + error.message);
        }
      } else {
        console.error('yt-dlp process exited with code:', code);
        reject(`Failed to get audio info (exit code: ${code})`);
      }
    });
  });
});

ipcMain.handle('download-audio', async (event, { url, outputPath, quality }) => {
  const downloadId = uuidv4();
  console.log('Starting download with ID:', downloadId);
  console.log('URL:', url);
  console.log('Output path:', outputPath);
  console.log('Quality:', quality);

  return new Promise((resolve, reject) => {
    // Add timeout protection
    const timeout = setTimeout(() => {
      console.log('Download timeout - terminating process');
      if (ytdlp && !ytdlp.killed) {
        ytdlp.kill('SIGTERM');
      }
      reject(new Error('Download timeout after 5 minutes'));
    }, 5 * 60 * 1000); // 5 minute timeout

    // Send initial progress
    event.sender.send('download-progress', {
      id: downloadId,
      status: 'starting',
      progress: 0,
      speed: null,
      eta: null,
      file_path: null
    });

    // Set quality arguments
    let qualityArgs = [];
    switch (quality) {
      case '320':
        qualityArgs = ['--audio-quality', '0', '--audio-format', 'mp3'];
        break;
      case '256':
        qualityArgs = ['--audio-quality', '2', '--audio-format', 'mp3'];
        break;
      case 'flac':
        qualityArgs = ['--audio-format', 'flac'];
        break;
      default:
        qualityArgs = ['--audio-quality', '0', '--audio-format', 'mp3'];
    }

    const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
    const args = [
      '--extract-audio',
      '--embed-metadata',
      '--output', outputTemplate,
      '--force-ipv4',
      '--verbose',
      '--extractor-args', 'youtube:player_client=mweb',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--cookies-from-browser', 'chrome',
      '--no-check-certificates',
      '--ignore-errors',
      '--concurrent-fragments', '16',
      '--retries', '2',
      '--fragment-retries', '2',
      '--buffer-size', '16K',
      '--prefer-free-formats',
      '--newline',
      ...qualityArgs,
      '--progress',
      url
    ];

    console.log('Executing yt-dlp with args:', args);
    let ytdlp = spawn(getYtDlpPath(), args);
    console.log('yt-dlp process spawned, PID:', ytdlp.pid);

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp stdout:', output);

      // Parse progress from yt-dlp output - more specific matching
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        console.log('Progress detected:', progress + '%');
        event.sender.send('download-progress', {
          id: downloadId,
          status: progress >= 100 ? 'converting' : 'downloading',
          progress: progress,
          speed: extractSpeed(output),
          eta: extractETA(output),
          file_path: null
        });
      }

      // Handle "already downloaded" case
      if (output.includes('[download]') && output.includes('has already been downloaded')) {
        console.log('File already downloaded, marking as complete');
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'converting',
          progress: 100,
          speed: null,
          eta: null,
          file_path: null
        });
      }

      // Check for conversion/processing messages
      if (output.includes('[ffmpeg]') || output.includes('Converting')) {
        console.log('Conversion detected');
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'converting',
          progress: 99,
          speed: null,
          eta: null,
          file_path: null
        });
      }

      // Check for completed download before conversion
      if (output.includes('[download] 100%')) {
        console.log('Download completed, starting conversion');
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'converting',
          progress: 100,
          speed: null,
          eta: null,
          file_path: null
        });
      }
    });

    ytdlp.stderr.on('data', (data) => {
      const errorText = data.toString();
      console.log('yt-dlp stderr:', errorText);

      // Send progress updates for warnings but don't fail
      if (errorText.includes('WARNING:')) {
        console.log('Warning received:', errorText);
        // Just log warnings, don't send error to UI
        return;
      }

      // Only handle actual errors
      if (errorText.includes('ERROR:')) {
        console.log('Error received:', errorText);
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'error',
          progress: 0,
          speed: null,
          eta: null,
          file_path: null,
          error: errorText
        });
      }
    });

    ytdlp.on('close', (code) => {
      console.log('yt-dlp process closed with code:', code);
      clearTimeout(timeout); // Clear the timeout when process ends

      if (code === 0) {
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'completed',
          progress: 100,
          speed: null,
          eta: null,
          file_path: outputPath
        });
        resolve(downloadId);
      } else {
        console.error('yt-dlp download failed with exit code:', code);
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'error',
          progress: 0,
          speed: null,
          eta: null,
          file_path: null,
          error: `Download failed with exit code: ${code}`
        });
        reject(`Download failed with exit code: ${code}`);
      }
    });
  });
});

// Helper functions
function extractSpeed(output) {
  const speedMatch = output.match(/(\d+\.?\d*\w+\/s)/);
  return speedMatch ? speedMatch[1] : null;
}

function extractETA(output) {
  const etaMatch = output.match(/ETA (\d+:\d+)/);
  return etaMatch ? etaMatch[1] : null;
}


// Settings operations
ipcMain.handle('get-settings', async () => {
  return loadSettings();
});

ipcMain.handle('save-settings', async (event, settings) => {
  saveSettings(settings);
  return true;
});

// File operations
ipcMain.handle('select-folder', async () => {
  const currentSettings = loadSettings();

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Download Folder',
    defaultPath: currentSettings.outputPath
  });

  if (!result.canceled && result.filePaths.length > 0) {
    // Save the selected folder to settings
    const updatedSettings = { ...currentSettings, outputPath: result.filePaths[0] };
    saveSettings(updatedSettings);
    return result.filePaths[0];
  }

  // Return current saved folder if cancelled
  return currentSettings.outputPath;
});


// Subscription verification (placeholder - integrate with your existing API)
ipcMain.handle('verify-subscription', async (event, token) => {
  // This would integrate with your existing Vercel API
  // For now, return a mock response
  return {
    active: true,
    tier: 'pro',
    downloads_used: 0,
    downloads_limit: null
  };
});