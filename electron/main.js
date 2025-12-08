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
    width: 650,
    height: 420,
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
      enableBlinkFeatures: 'CSSColorSchemeUARendering',
      // Additional performance settings
      spellcheck: false,
      enableWebSQL: false,
      v8CacheOptions: 'code'
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0a0a0f'
  });

  // Performance optimizations
  mainWindow.webContents.setBackgroundThrottling(false);
  
  // Optimize rendering
  mainWindow.webContents.on('did-finish-load', () => {
    // Inject performance CSS to reduce animations if needed
    mainWindow.webContents.insertCSS(`
      * { scroll-behavior: auto !important; }
    `);
  });

  // Load the official KTM website
  mainWindow.loadURL('https://ktm.lovable.app/');

  // Show main window when ready and close splash (5 seconds)
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();
    }, 5000);
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

// Performance optimizations
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

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

// Scan download folder for games and validate against website
ipcMain.handle('scan-games-folder', async (event, websiteGames) => {
  try {
    if (!fs.existsSync(downloadPath)) {
      return { success: true, games: [] };
    }

    const folders = fs.readdirSync(downloadPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const detectedGames = [];

    for (const folderName of folders) {
      const folderPath = path.join(downloadPath, folderName);
      
      // Check if this folder matches a game from the website (by slug)
      const matchedGame = websiteGames.find(g => g.slug === folderName);
      
      if (!matchedGame) {
        // Game not on website, skip it
        continue;
      }

      // Check if there's an exe file in the folder
      const exePath = findExecutable(folderPath);
      
      // Create instructions.txt if it doesn't exist
      const instructionsPath = path.join(folderPath, 'KTM_تعليمات.txt');
      if (!fs.existsSync(instructionsPath)) {
        const instructions = `=== تعليمات تشغيل اللعبة ===

اسم اللعبة: ${matchedGame.title}

إذا لم يتم العثور على ملف التشغيل (.exe) تلقائياً:

1. افتح مجلد اللعبة من المكتبة
2. ابحث عن ملف .exe الرئيسي للعبة (عادة يكون باسم اللعبة)
3. عند الضغط على "تشغيل" لأول مرة، سيُطلب منك تحديد ملف .exe
4. بعد التحديد، سيتم حفظ المسار ولن تحتاج لتحديده مرة أخرى

=== إنشاء اختصار ===

لإنشاء اختصار على سطح المكتب:
1. ابحث عن ملف .exe الرئيسي داخل المجلد
2. انقر بزر الماوس الأيمن عليه
3. اختر "إرسال إلى" > "سطح المكتب (إنشاء اختصار)"

=== ملاحظة ===
تم تحميل هذه اللعبة من موقع KTM Games
`;
        fs.writeFileSync(instructionsPath, instructions, 'utf8');
      }

      // Check if already in installedGames
      const existingGame = installedGames.find(g => g.gameId === matchedGame.id);
      
      if (!existingGame) {
        // Add to detected games
        const gameInfo = {
          gameId: matchedGame.id,
          gameTitle: matchedGame.title,
          gameSlug: matchedGame.slug,
          installPath: folderPath,
          exePath: exePath,
          installedAt: new Date().toISOString(),
          size: getFolderSize(folderPath)
        };
        detectedGames.push(gameInfo);
        
        // Add to installedGames
        installedGames.push(gameInfo);
      } else {
        // Update existing game info
        existingGame.installPath = folderPath;
        if (!existingGame.exePath || !fs.existsSync(existingGame.exePath)) {
          existingGame.exePath = exePath;
        }
        existingGame.size = getFolderSize(folderPath);
        detectedGames.push(existingGame);
      }
    }

    // Clean up installedGames - remove games that no longer exist in folder
    installedGames = installedGames.filter(game => {
      return fs.existsSync(game.installPath);
    });

    store.set('installedGames', installedGames);

    return { success: true, games: installedGames };
  } catch (err) {
    console.error('Scan error:', err);
    return { success: false, error: err.message };
  }
});

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