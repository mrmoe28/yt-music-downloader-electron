import { useState, useEffect } from 'react';
import {
  Download,
  Music,
  Settings,
  FolderOpen,
  Usb,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Monitor,
  Sun,
  Moon,
  History,
  Play
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import './App.css';


interface DownloadProgress {
  id: string;
  status: string;
  progress: number;
  speed?: string;
  eta?: string;
  file_path?: string;
  title?: string;
  thumbnail?: string;
  url?: string;
}

interface USBDrive {
  name: string;
  path: string;
  capacity: number;
  available: number;
}

interface SubscriptionStatus {
  active: boolean;
  tier: string;
  downloads_used: number;
  downloads_limit?: number;
}

interface AppSettings {
  outputPath: string;
  quality: string;
}

// Declare global window interface for Electron API
declare global {
  interface Window {
    electronAPI: {
      downloadAudio: (options: { url: string; outputPath: string; quality: string }) => Promise<string>;
      onDownloadProgress: (callback: (event: unknown, data: DownloadProgress) => void) => () => void;
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<boolean>;
      selectFolder: () => Promise<string>;
      copyToUsb: (options: { sourcePath: string; usbPath: string }) => Promise<boolean>;
      getUsbDrives: () => Promise<USBDrive[]>;
      verifySubscription: (token: string) => Promise<SubscriptionStatus>;
      getVideoInfo: (url: string) => Promise<{ title: string; thumbnail: string }>;
      platform: string;
      removeAllListeners: (channel: string) => void;
    };
  }
}

function App() {
  const [url, setUrl] = useState('');
  const [downloads, setDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [usbDrives, setUSBDrives] = useState<USBDrive[]>([]);
  const [selectedUSB, setSelectedUSB] = useState<string>('');
  const [outputPath, setOutputPath] = useState<string>('');
  const [quality, setQuality] = useState('320');
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Apply dark mode by default
    document.documentElement.classList.add('dark');

    // Listen for download progress events
    let removeListener: (() => void) | null = null;

    if (window.electronAPI) {
      removeListener = window.electronAPI.onDownloadProgress((_event: unknown, data: DownloadProgress) => {
        setDownloads(prev => {
          const newMap = new Map(prev);
          // Preserve existing metadata (title, thumbnail, url) when updating
          const existing = newMap.get(data.id);
          if (existing) {
            newMap.set(data.id, {
              ...data,
              title: existing.title || data.title,
              thumbnail: existing.thumbnail || data.thumbnail,
              url: existing.url || data.url
            });
          } else {
            newMap.set(data.id, data);
          }
          return newMap;
        });

        if (data.status === 'completed') {
          setIsDownloading(false);
          setUrl(''); // Clear URL when download completes
        } else if (data.status === 'error') {
          setIsDownloading(false);
        }
      });
    }

    // Load settings, USB drives and subscription status on mount
    loadSettings();
    loadUSBDrives();
    checkSubscription();

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const loadSettings = async () => {
    if (window.electronAPI) {
      try {
        const settings = await window.electronAPI.getSettings();
        setOutputPath(settings.outputPath);
        setQuality(settings.quality);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };


  const loadUSBDrives = async () => {
    if (window.electronAPI) {
      try {
        const drives = await window.electronAPI.getUsbDrives();
        setUSBDrives(drives);
      } catch (error) {
        console.error('Failed to load USB drives:', error);
      }
    }
  };

  const checkSubscription = async () => {
    if (window.electronAPI) {
      try {
        const status = await window.electronAPI.verifySubscription('');
        setSubscription(status);
      } catch (error) {
        console.error('Failed to check subscription:', error);
      }
    }
  };

  const handleDownload = async () => {
    if (!url.trim() || !window.electronAPI || isDownloading) return;

    setIsDownloading(true);
    try {
      // Ensure we have settings loaded, use defaults if not
      let downloadPath = outputPath;
      if (!downloadPath) {
        const settings = await window.electronAPI.getSettings();
        downloadPath = settings.outputPath;
        setOutputPath(downloadPath);
      }

      // Get video info first for thumbnail and title
      const videoInfo = await window.electronAPI.getVideoInfo(url.trim());

      const downloadId = await window.electronAPI.downloadAudio({
        url: url.trim(),
        outputPath: downloadPath,
        quality
      });

      // Create single entry with the real download ID and video metadata
      setDownloads(prev => {
        const newMap = new Map(prev);
        newMap.set(downloadId, {
          id: downloadId,
          status: 'starting',
          progress: 0,
          title: videoInfo.title,
          thumbnail: videoInfo.thumbnail,
          url: url.trim()
        });
        return newMap;
      });

      // Clear URL after successful download initiation
      setUrl('');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;

    try {
      const folder = await window.electronAPI.selectFolder();
      setOutputPath(folder);
      // Settings are automatically saved by the backend when folder is selected
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleQualityChange = async (newQuality: string) => {
    setQuality(newQuality);
    // Auto-save settings when quality changes
    if (window.electronAPI && outputPath) {
      try {
        await window.electronAPI.saveSettings({ outputPath, quality: newQuality });
      } catch (error) {
        console.error('Failed to save quality setting:', error);
      }
    }
  };


  const downloadArray = Array.from(downloads.values());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex">
      {/* Left Sidebar - Download History */}
      <div className="w-80 bg-black/20 backdrop-blur-md border-r border-white/10 p-4">
        <div className="flex items-center space-x-2 mb-6">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Download History</h2>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
          {downloadArray.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No downloads yet</p>
          ) : (
            downloadArray.map((download) => (
              <div key={download.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-start space-x-3">
                  {download.thumbnail ? (
                    <img
                      src={download.thumbnail}
                      alt={download.title}
                      className="w-16 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-primary/20 rounded flex items-center justify-center flex-shrink-0">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate" title={download.title}>
                      {download.title || 'Loading...'}
                    </h3>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {download.status === 'completed' ? 'Completed' :
                         download.status === 'error' ? 'Failed' :
                         'Downloading...'}
                      </span>

                      {download.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {download.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>

                    {download.status === 'downloading' && (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${download.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{download.progress}%</span>
                          {download.speed && <span>{download.speed}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Music className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">YouTube Music Downloader Pro</h1>
                <p className="text-muted-foreground">
                  Downloads: {subscription?.downloads_used || 0} / {subscription?.downloads_limit || '∞'} •
                  <span className="text-primary font-medium ml-1">PRO</span>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

        {/* URL Input Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5" />
              <span>Enter YouTube URL</span>
            </CardTitle>
            <CardDescription>
              Paste a YouTube music video URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && !isDownloading && url.trim() && handleDownload()}
              />
              <Button
                onClick={handleDownload}
                disabled={!!(isDownloading || !url.trim() || (url && !url.includes('youtube.com') && !url.includes('youtu.be')))}
                className="px-6"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Audio
                  </>
                )}
              </Button>
            </div>
            {url && !url.includes('youtube.com') && !url.includes('youtu.be') && (
              <p className="text-sm text-destructive">Please enter a valid YouTube URL</p>
            )}
          </CardContent>
        </Card>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Download Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Download Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Audio Quality</label>
                <select
                  value={quality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="320">320 kbps MP3 (High Quality)</option>
                  <option value="256">256 kbps MP3 (Good Quality)</option>
                  <option value="flac">FLAC (Lossless)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Download Location</label>
                  {outputPath && (
                    <span className="text-xs text-green-500 font-medium">✓ Saved</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Input
                    readOnly
                    value={outputPath ? `${outputPath.split('/').pop()}` : 'Downloads (default)'}
                    className="flex-1"
                    title={outputPath || 'Default Downloads folder'}
                  />
                  <Button variant="outline" onClick={handleSelectFolder}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {outputPath ? 'Change' : 'Choose'}
                  </Button>
                </div>
                {outputPath && (
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={outputPath}>
                    {outputPath}
                  </p>
                )}
              </div>

            </CardContent>
          </Card>

          {/* USB Drives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Usb className="w-5 h-5" />
                <span>USB Drives ({usbDrives.length} found)</span>
              </CardTitle>
              <CardDescription>
                Transfer downloaded files to external storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usbDrives.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No USB drives detected</p>
                ) : (
                  usbDrives.map((drive, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Usb className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{drive.name}</p>
                          <p className="text-xs text-muted-foreground">{drive.path}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUSB(drive.path)}
                        className={selectedUSB === drive.path ? "bg-primary text-primary-foreground" : ""}
                      >
                        {selectedUSB === drive.path ? "Selected" : "Select"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download Progress */}
        {downloadArray.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Download Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {downloadArray.map((download) => (
                  <div key={download.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {download.status === 'completed' ? 'Completed' :
                         download.status === 'error' ? 'Failed' :
                         'Downloading...'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {download.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {download.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {download.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${download.progress}%` }}
                      />
                    </div>
                    {download.speed && download.eta && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Speed: {download.speed}</span>
                        <span>ETA: {download.eta}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}

export default App;