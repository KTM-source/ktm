const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const AdmZip = require('adm-zip');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let splashWindow;
let downloadPath = store.get('downloadPath') || path.join(app.getPath('downloads'), 'KTM Games');
let activeDownloads = new Map();
let currentDownloadRequest = null; // For single download queue
let installedGames = store.get('installedGames') || [];
let downloadHistory = store.get('downloadHistory') || [];

// Ensure download directory exists
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      // Performance optimizations
      backgroundThrottling: false,
      enableBlinkFeatures: 'CSSColorSchemeUARendering'
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0a0a0f'
  });

  // Disable hardware acceleration throttling
  mainWindow.webContents.setBackgroundThrottling(false);

  // Load the official KTM website
  mainWindow.loadURL('https://ktm.lovable.app/');

  // Show main window when ready and close splash
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();
    }, 2500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false);
  });
}

// Disable hardware acceleration for better performance in some cases
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');

app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

// Get window state
ipcMain.handle('get-window-state', () => ({
  isMaximized: mainWindow?.isMaximized() || false
}));

// Settings
ipcMain.handle('get-settings', () => ({
  downloadPath,
  installedGames,
  downloadHistory
}));

ipcMain.handle('set-download-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'اختر مجلد التنزيلات'
  });
  
  if (!result.canceled && result.filePaths[0]) {
    downloadPath = result.filePaths[0];
    store.set('downloadPath', downloadPath);
    return downloadPath;
  }
  return null;
});

// Select exe file for game
ipcMain.handle('select-exe', async (event, gameId) => {
  const game = installedGames.find(g => g.gameId === gameId);
  if (!game) return { success: false, error: 'اللعبة غير موجودة' };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'اختر ملف تشغيل اللعبة (.exe)',
    defaultPath: game.installPath,
    filters: [
      { name: 'Executable', extensions: ['exe'] }
    ]
  });

  if (!result.canceled && result.filePaths[0]) {
    // Update the game's exePath
    const gameIndex = installedGames.findIndex(g => g.gameId === gameId);
    if (gameIndex !== -1) {
      installedGames[gameIndex].exePath = result.filePaths[0];
      store.set('installedGames', installedGames);
      return { success: true, exePath: result.filePaths[0] };
    }
  }
  return { success: false, error: 'لم يتم اختيار ملف' };
});

// Download game - Single download at a time
ipcMain.handle('download-game', async (event, { gameId, gameTitle, downloadUrl, gameSlug }) => {
  // Cancel any existing download
  if (currentDownloadRequest) {
    try {
      currentDownloadRequest.destroy();
    } catch (e) {}
    currentDownloadRequest = null;
  }
  
  // Clear active downloads (only one allowed)
  for (const [id, data] of activeDownloads) {
    mainWindow?.webContents.send('download-status', {
      downloadId: id,
      gameId: data.gameId,
      status: 'paused'
    });
  }
  activeDownloads.clear();

  return new Promise((resolve, reject) => {
    const gameFolder = path.join(downloadPath, gameSlug);
    
    // Create game folder first
    if (!fs.existsSync(gameFolder)) {
      fs.mkdirSync(gameFolder, { recursive: true });
    }
    
    // ZIP file goes inside the game folder
    const zipPath = path.join(gameFolder, `${gameSlug}.zip`);

    const downloadId = `${gameId}-${Date.now()}`;
    
    const protocol = downloadUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(downloadUrl, { timeout: 30000 }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
        const redirectRequest = redirectProtocol.get(redirectUrl, { timeout: 30000 }, handleResponse);
        redirectRequest.on('error', handleError);
        currentDownloadRequest = redirectRequest;
        return;
      }
      
      handleResponse(response);
    });

    currentDownloadRequest = request;

    function handleResponse(response) {
      const totalSize = parseInt(response.headers['content-length'], 10) || 0;
      let downloadedSize = 0;
      
      const fileStream = fs.createWriteStream(zipPath);
      
      activeDownloads.set(downloadId, {
        gameId,
        gameTitle,
        gameSlug,
        totalSize,
        downloadedSize: 0,
        progress: 0,
        status: 'downloading',
        startTime: Date.now()
      });

      // Send initial progress
      mainWindow?.webContents.send('download-progress', {
        downloadId,
        gameId,
        gameTitle,
        progress: 0,
        downloadedSize: 0,
        totalSize,
        speed: 0
      });

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
        
        const downloadData = activeDownloads.get(downloadId);
        if (downloadData) {
          downloadData.downloadedSize = downloadedSize;
          downloadData.progress = progress;
        }
        
        mainWindow?.webContents.send('download-progress', {
          downloadId,
          gameId,
          gameTitle,
          progress,
          downloadedSize,
          totalSize,
          speed: calculateSpeed(downloadedSize, activeDownloads.get(downloadId)?.startTime || Date.now())
        });
      });

      response.pipe(fileStream);

      fileStream.on('finish', async () => {
        fileStream.close();
        currentDownloadRequest = null;
        
        const downloadData = activeDownloads.get(downloadId);
        if (downloadData) {
          downloadData.status = 'extracting';
        }
        
        mainWindow?.webContents.send('download-status', {
          downloadId,
          gameId,
          status: 'extracting'
        });

        try {
          // Extract ZIP
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(gameFolder, true);
          
          // Delete ZIP after extraction
          fs.unlinkSync(zipPath);
          
          // Find executable (but don't auto-set, let user choose on first launch)
          const exePath = findExecutable(gameFolder);
          
          // Save to installed games
          const installedGame = {
            gameId,
            gameTitle,
            gameSlug,
            installPath: gameFolder,
            exePath, // This might be null, user will select on first launch
            installedAt: new Date().toISOString(),
            size: getFolderSize(gameFolder)
          };
          
          installedGames.push(installedGame);
          store.set('installedGames', installedGames);
          
          // Add to download history
          downloadHistory.unshift({
            ...installedGame,
            downloadedAt: new Date().toISOString()
          });
          downloadHistory = downloadHistory.slice(0, 50);
          store.set('downloadHistory', downloadHistory);
          
          activeDownloads.delete(downloadId);
          
          mainWindow?.webContents.send('download-complete', {
            downloadId,
            gameId,
            gameTitle,
            installPath: gameFolder,
            exePath
          });
          
          resolve({ success: true, installPath: gameFolder, exePath });
        } catch (extractError) {
          activeDownloads.delete(downloadId);
          mainWindow?.webContents.send('download-error', {
            downloadId,
            gameId,
            error: 'فشل في استخراج الملفات'
          });
          reject(extractError);
        }
      });

      fileStream.on('error', (err) => {
        currentDownloadRequest = null;
        activeDownloads.delete(downloadId);
        mainWindow?.webContents.send('download-error', {
          downloadId,
          gameId,
          error: err.message
        });
        reject(err);
      });
    }

    function handleError(err) {
      currentDownloadRequest = null;
      activeDownloads.delete(downloadId);
      mainWindow?.webContents.send('download-error', {
        downloadId,
        gameId,
        error: err.message
      });
      reject(err);
    }

    request.on('error', handleError);
    request.on('timeout', () => {
      request.destroy();
      handleError(new Error('Connection timeout'));
    });
  });
});

// Cancel download
ipcMain.handle('cancel-download', (event, downloadId) => {
  if (currentDownloadRequest) {
    try {
      currentDownloadRequest.destroy();
    } catch (e) {}
    currentDownloadRequest = null;
  }
  
  if (activeDownloads.has(downloadId)) {
    activeDownloads.delete(downloadId);
    return true;
  }
  return false;
});

// Get active downloads
ipcMain.handle('get-active-downloads', () => {
  return Array.from(activeDownloads.entries()).map(([id, data]) => ({
    downloadId: id,
    gameId: data.gameId,
    gameTitle: data.gameTitle,
    progress: data.progress || 0,
    downloadedSize: data.downloadedSize || 0,
    totalSize: data.totalSize || 0,
    speed: calculateSpeed(data.downloadedSize || 0, data.startTime || Date.now())
  }));
});

// Get installed games
ipcMain.handle('get-installed-games', () => installedGames);

// Get download history
ipcMain.handle('get-download-history', () => downloadHistory);

// Launch game
ipcMain.handle('launch-game', async (event, { gameId, exePath }) => {
  const game = installedGames.find(g => g.gameId === gameId);
  
  // If exePath provided and exists, use it
  if (exePath && fs.existsSync(exePath)) {
    shell.openPath(exePath);
    return { success: true };
  }
  
  // If game has saved exePath
  if (game?.exePath && fs.existsSync(game.exePath)) {
    shell.openPath(game.exePath);
    return { success: true };
  }
  
  // No exe found - need user to select
  return { success: false, needsExeSelection: true, installPath: game?.installPath };
});

// Uninstall game
ipcMain.handle('uninstall-game', async (event, gameId) => {
  const gameIndex = installedGames.findIndex(g => g.gameId === gameId);
  if (gameIndex === -1) return { success: false };
  
  const game = installedGames[gameIndex];
  
  try {
    if (fs.existsSync(game.installPath)) {
      fs.rmSync(game.installPath, { recursive: true, force: true });
    }
    
    installedGames.splice(gameIndex, 1);
    store.set('installedGames', installedGames);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Open folder
ipcMain.handle('open-folder', (event, folderPath) => {
  if (fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

// Check if game is installed
ipcMain.handle('is-game-installed', (event, gameId) => {
  const game = installedGames.find(g => g.gameId === gameId);
  if (game && fs.existsSync(game.installPath)) {
    return { installed: true, ...game };
  }
  return { installed: false };
});

// Helper functions
function findExecutable(folderPath) {
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    
    // First, look for .exe files in the root
    for (const file of files) {
      if (file.isFile() && file.name.toLowerCase().endsWith('.exe')) {
        const skipNames = ['unins', 'setup', 'install', 'update', 'redist', 'vcredist', 'dxsetup', 'directx', 'dotnet'];
        const isSkipped = skipNames.some(skip => file.name.toLowerCase().includes(skip));
        if (!isSkipped) {
          return path.join(folderPath, file.name);
        }
      }
    }
    
    // Then search in subdirectories (max 2 levels deep)
    for (const file of files) {
      if (file.isDirectory()) {
        const subExe = findExecutableShallow(path.join(folderPath, file.name), 1);
        if (subExe) return subExe;
      }
    }
  } catch (e) {}
  
  return null;
}

function findExecutableShallow(folderPath, depth) {
  if (depth > 2) return null;
  
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile() && file.name.toLowerCase().endsWith('.exe')) {
        const skipNames = ['unins', 'setup', 'install', 'update', 'redist', 'vcredist', 'dxsetup', 'directx', 'dotnet'];
        const isSkipped = skipNames.some(skip => file.name.toLowerCase().includes(skip));
        if (!isSkipped) {
          return path.join(folderPath, file.name);
        }
      }
    }
    
    for (const file of files) {
      if (file.isDirectory()) {
        const subExe = findExecutableShallow(path.join(folderPath, file.name), depth + 1);
        if (subExe) return subExe;
      }
    }
  } catch (e) {}
  
  return null;
}

function getFolderSize(folderPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(folderPath, file.name);
      if (file.isDirectory()) {
        size += getFolderSize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    }
  } catch (e) {}
  
  return size;
}

function calculateSpeed(downloadedSize, startTime) {
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  if (elapsedSeconds === 0) return 0;
  return downloadedSize / elapsedSeconds;
}