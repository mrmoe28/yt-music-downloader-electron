const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { autoUpdater } = require('electron-updater');

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
const isDev = false; // Temporarily force production mode to use built files

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
  if (process.platform !== 'darwin') {
    app.quit();
  }
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
      '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      '--extractor-args', 'youtube:player_client=ios,web',
      '--cookies-from-browser', 'chrome',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      '--add-header', 'Accept-Encoding:gzip, deflate, br',
      '--add-header', 'DNT:1',
      '--add-header', 'Connection:keep-alive',
      '--add-header', 'Upgrade-Insecure-Requests:1',
      url
    ];

    const ytdlp = spawn(getYtDlpPath(), args);
    let output = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      console.log('yt-dlp info stderr:', data.toString());
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output.trim());
          resolve({
            title: info.title || 'Unknown Title',
            thumbnail: info.thumbnail || ''
          });
        } catch (error) {
          reject('Failed to parse video info');
        }
      } else {
        reject('Failed to get video info');
      }
    });
  });
});

ipcMain.handle('download-audio', async (event, { url, outputPath, quality }) => {
  const downloadId = uuidv4();

  return new Promise((resolve, reject) => {
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
      '--embed-thumbnail',
      '--output', outputTemplate,
      '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      '--extractor-args', 'youtube:player_client=ios,web',
      '--cookies-from-browser', 'chrome',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      '--add-header', 'Accept-Encoding:gzip, deflate, br',
      '--add-header', 'DNT:1',
      '--add-header', 'Connection:keep-alive',
      '--add-header', 'Upgrade-Insecure-Requests:1',
      '--no-check-certificates',
      '--concurrent-fragments', '8',
      '--retries', '3',
      '--fragment-retries', '3',
      '--throttled-rate', '100K',
      '--prefer-free-formats',
      ...qualityArgs,
      '--progress',
      url
    ];

    const ytdlp = spawn(getYtDlpPath(), args);

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();

      // Parse progress from yt-dlp output
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'downloading',
          progress: progress,
          speed: extractSpeed(output),
          eta: extractETA(output),
          file_path: null
        });
      }
    });

    ytdlp.stderr.on('data', (data) => {
      console.log('yt-dlp stderr:', data.toString());
    });

    ytdlp.on('close', (code) => {
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
        event.sender.send('download-progress', {
          id: downloadId,
          status: 'error',
          progress: 0,
          speed: null,
          eta: null,
          file_path: null
        });
        reject('Download failed');
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

// USB drive detection
ipcMain.handle('get-usb-drives', async () => {
  const drives = [];

  try {
    if (process.platform === 'darwin') {
      // macOS - check /Volumes
      const volumes = fs.readdirSync('/Volumes');
      for (const volume of volumes) {
        const volumePath = `/Volumes/${volume}`;
        try {
          const stats = fs.statSync(volumePath);
          if (stats.isDirectory() && volume !== 'Macintosh HD') {
            drives.push({
              name: volume,
              path: volumePath,
              capacity: 0, // Could be enhanced with actual size detection
              available: 0
            });
          }
        } catch (error) {
          // Skip inaccessible volumes
        }
      }
    } else if (process.platform === 'win32') {
      // Windows - check removable drives
      const { execSync } = require('child_process');
      try {
        const output = execSync('wmic logicaldisk get deviceid,description,size,freespace /format:csv', { encoding: 'utf8' });
        const lines = output.split('\n').filter(line => line.includes('Removable Disk'));
        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 4) {
            drives.push({
              name: `USB Drive (${parts[1]})`,
              path: parts[1],
              capacity: parseInt(parts[3]) || 0,
              available: parseInt(parts[2]) || 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to detect USB drives on Windows:', error);
      }
    } else {
      // Linux - check mounted USB devices
      try {
        const mounts = fs.readFileSync('/proc/mounts', 'utf8');
        const usbMounts = mounts.split('\n').filter(line =>
          line.includes('/media/') || line.includes('/mnt/')
        );
        for (const mount of usbMounts) {
          const parts = mount.split(' ');
          if (parts.length >= 2) {
            const mountPoint = parts[1];
            drives.push({
              name: path.basename(mountPoint),
              path: mountPoint,
              capacity: 0,
              available: 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to detect USB drives on Linux:', error);
      }
    }
  } catch (error) {
    console.error('Failed to detect USB drives:', error);
  }

  return drives;
});

// File operations
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Download Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }

  // Return default download folder if cancelled
  return path.join(os.homedir(), 'Downloads');
});

ipcMain.handle('copy-to-usb', async (event, { sourcePath, usbPath }) => {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(sourcePath);
    const destinationPath = path.join(usbPath, fileName);

    const readStream = fs.createReadStream(sourcePath);
    const writeStream = fs.createWriteStream(destinationPath);

    readStream.pipe(writeStream);

    writeStream.on('finish', () => {
      resolve(true);
    });

    writeStream.on('error', (error) => {
      reject(`Failed to copy file: ${error.message}`);
    });
  });
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