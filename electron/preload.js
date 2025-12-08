const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setDownloadPath: () => ipcRenderer.invoke('set-download-path'),
  
  // Downloads
  downloadGame: (data) => ipcRenderer.invoke('download-game', data),
  cancelDownload: (downloadId) => ipcRenderer.invoke('cancel-download', downloadId),
  getActiveDownloads: () => ipcRenderer.invoke('get-active-downloads'),
  getDownloadHistory: () => ipcRenderer.invoke('get-download-history'),
  
  // Installed games
  getInstalledGames: () => ipcRenderer.invoke('get-installed-games'),
  isGameInstalled: (gameId) => ipcRenderer.invoke('is-game-installed', gameId),
  launchGame: (data) => ipcRenderer.invoke('launch-game', data),
  uninstallGame: (gameId) => ipcRenderer.invoke('uninstall-game', gameId),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  selectExe: (gameId) => ipcRenderer.invoke('select-exe', gameId),
  
  // Event listeners
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onDownloadStatus: (callback) => {
    ipcRenderer.on('download-status', (event, data) => callback(data));
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', (event, data) => callback(data));
  },
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, data) => callback(data));
  },
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Check if running in Electron
  isElectron: true
});