const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const AdmZip = require('adm-zip');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let downloadPath = store.get('downloadPath') || path.join(app.getPath('downloads'), 'KTM Games');
let activeDownloads = new Map();
let installedGames = store.get('installedGames') || [];
let downloadHistory = store.get('downloadHistory') || [];

// Ensure download directory exists
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Allow loading external site with preload
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0a0a0f'
  });

  // Load the official KTM website
  mainWindow.loadURL('https://ktm.lovable.app/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
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

// Download game
ipcMain.handle('download-game', async (event, { gameId, gameTitle, downloadUrl, gameSlug }) => {
  return new Promise((resolve, reject) => {
    const gameFolder = path.join(downloadPath, gameSlug);
    const zipPath = path.join(downloadPath, `${gameSlug}.zip`);
    
    // Create game folder
    if (!fs.existsSync(gameFolder)) {
      fs.mkdirSync(gameFolder, { recursive: true });
    }

    const downloadId = `${gameId}-${Date.now()}`;
    
    const protocol = downloadUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(downloadUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        protocol.get(response.headers.location, handleResponse);
        return;
      }
      
      handleResponse(response);
    });

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
        status: 'downloading',
        startTime: Date.now()
      });

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
        
        activeDownloads.get(downloadId).downloadedSize = downloadedSize;
        activeDownloads.get(downloadId).progress = progress;
        
        mainWindow?.webContents.send('download-progress', {
          downloadId,
          gameId,
          gameTitle,
          progress,
          downloadedSize,
          totalSize,
          speed: calculateSpeed(downloadedSize, activeDownloads.get(downloadId).startTime)
        });
      });

      response.pipe(fileStream);

      fileStream.on('finish', async () => {
        fileStream.close();
        
        activeDownloads.get(downloadId).status = 'extracting';
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
          
          // Find executable
          const exePath = findExecutable(gameFolder);
          
          // Save to installed games
          const installedGame = {
            gameId,
            gameTitle,
            gameSlug,
            installPath: gameFolder,
            exePath,
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
          // Keep only last 50 downloads
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
        activeDownloads.delete(downloadId);
        mainWindow?.webContents.send('download-error', {
          downloadId,
          gameId,
          error: err.message
        });
        reject(err);
      });
    }

    request.on('error', (err) => {
      activeDownloads.delete(downloadId);
      mainWindow?.webContents.send('download-error', {
        downloadId,
        gameId,
        error: err.message
      });
      reject(err);
    });
  });
});

// Cancel download
ipcMain.handle('cancel-download', (event, downloadId) => {
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
    ...data
  }));
});

// Get installed games
ipcMain.handle('get-installed-games', () => installedGames);

// Get download history
ipcMain.handle('get-download-history', () => downloadHistory);

// Launch game
ipcMain.handle('launch-game', async (event, { gameId, exePath }) => {
  if (exePath && fs.existsSync(exePath)) {
    shell.openPath(exePath);
    return { success: true };
  }
  
  // Try to find the game in installed games
  const game = installedGames.find(g => g.gameId === gameId);
  if (game?.exePath && fs.existsSync(game.exePath)) {
    shell.openPath(game.exePath);
    return { success: true };
  }
  
  return { success: false, error: 'لم يتم العثور على ملف اللعبة' };
});

// Uninstall game
ipcMain.handle('uninstall-game', async (event, gameId) => {
  const gameIndex = installedGames.findIndex(g => g.gameId === gameId);
  if (gameIndex === -1) return { success: false };
  
  const game = installedGames[gameIndex];
  
  try {
    // Delete game folder
    if (fs.existsSync(game.installPath)) {
      fs.rmSync(game.installPath, { recursive: true, force: true });
    }
    
    // Remove from installed games
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
  const files = fs.readdirSync(folderPath, { withFileTypes: true });
  
  // First, look for .exe files in the root
  for (const file of files) {
    if (file.isFile() && file.name.toLowerCase().endsWith('.exe')) {
      // Skip common installers/updaters
      const skipNames = ['unins', 'setup', 'install', 'update', 'redist', 'vcredist', 'dxsetup'];
      const isSkipped = skipNames.some(skip => file.name.toLowerCase().includes(skip));
      if (!isSkipped) {
        return path.join(folderPath, file.name);
      }
    }
  }
  
  // Then search in subdirectories
  for (const file of files) {
    if (file.isDirectory()) {
      const subExe = findExecutable(path.join(folderPath, file.name));
      if (subExe) return subExe;
    }
  }
  
  return null;
}

function getFolderSize(folderPath) {
  let size = 0;
  const files = fs.readdirSync(folderPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(folderPath, file.name);
    if (file.isDirectory()) {
      size += getFolderSize(filePath);
    } else {
      size += fs.statSync(filePath).size;
    }
  }
  
  return size;
}

function calculateSpeed(downloadedSize, startTime) {
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  if (elapsedSeconds === 0) return 0;
  return downloadedSize / elapsedSeconds;
}
