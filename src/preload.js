const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Video information
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),

  // Download operations
  downloadAudio: (options) => ipcRenderer.invoke('download-audio', options),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', callback);
    return () => ipcRenderer.removeListener('download-progress', callback);
  },

  // File operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  copyToUsb: (options) => ipcRenderer.invoke('copy-to-usb', options),

  // USB drive detection
  getUsbDrives: () => ipcRenderer.invoke('get-usb-drives'),

  // Subscription
  verifySubscription: (token) => ipcRenderer.invoke('verify-subscription', token),

  // Platform info
  platform: process.platform,

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});