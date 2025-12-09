const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const AdmZip = require('adm-zip');
const Store = require('electron-store');
const { exec, spawn } = require('child_process');

const store = new Store();

let mainWindow;
let splashWindow;
let downloadPath = store.get('downloadPath') || path.join(app.getPath('downloads'), 'KTM Games');
let activeDownloads = new Map();
let currentDownloadRequest = null;
let installedGames = store.get('installedGames') || [];
let downloadHistory = store.get('downloadHistory') || [];

// Settings with defaults
let settings = store.get('settings') || {
  autoUpdate: true,
  notifications: true,
  autoLaunch: false,
  minimizeToTray: true,
  hardwareAcceleration: true,
  theme: 'dark',
  language: 'ar',
  downloadSpeed: 0,
  autoExtract: true,
  deleteArchiveAfterExtract: true,
  verifyIntegrity: true,
  soundEffects: true
};

// Ensure download directory exists
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 850,
    height: 550,
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
  // Apply hardware acceleration setting
  if (!settings.hardwareAcceleration) {
    app.disableHardwareAcceleration();
  }

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
      backgroundThrottling: false,
      spellcheck: false,
      v8CacheOptions: 'code',
      devTools: false // Disable DevTools completely
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: settings.theme === 'light' ? '#ffffff' : '#0a0a0f'
  });

  mainWindow.webContents.setBackgroundThrottling(false);
  
  // Prevent DevTools and zoom via keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block F12
    if (input.key === 'F12') {
      event.preventDefault();
    }
    // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (input.control && input.shift && ['I', 'i', 'J', 'j', 'C', 'c'].includes(input.key)) {
      event.preventDefault();
    }
    // Block Ctrl+U (view source)
    if (input.control && ['U', 'u'].includes(input.key)) {
      event.preventDefault();
    }
    // Block Ctrl++ and Ctrl+- (zoom)
    if (input.control && ['+', '-', '=', '_', 'NumpadAdd', 'NumpadSubtract'].includes(input.key)) {
      event.preventDefault();
    }
    // Block Ctrl+0 (reset zoom)
    if (input.control && input.key === '0') {
      event.preventDefault();
    }
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    // Apply theme
    applyTheme(settings.theme);
    
    mainWindow.webContents.insertCSS(`
      * { scroll-behavior: auto !important; }
    `);
    
    // Inject DevTools and zoom blocking script
    mainWindow.webContents.executeJavaScript(`
      // Block right-click context menu
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      }, true);
      
      // Block keyboard shortcuts including zoom
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
          e.preventDefault();
          return false;
        }
        if (e.ctrlKey && ['U', 'u'].includes(e.key)) {
          e.preventDefault();
          return false;
        }
        // Block zoom shortcuts
        if (e.ctrlKey && ['+', '-', '=', '_', '0'].includes(e.key)) {
          e.preventDefault();
          return false;
        }
        if (e.ctrlKey && (e.key === 'NumpadAdd' || e.key === 'NumpadSubtract')) {
          e.preventDefault();
          return false;
        }
      }, true);
      
      // Block mouse wheel zoom
      document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          return false;
        }
      }, { passive: false });
    `);
  });

  mainWindow.loadURL('https://ktm.lovable.app/');

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();
    }, 7000);
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

// Apply theme to the window
function applyTheme(theme) {
  if (!mainWindow) return;
  
  const isDark = theme === 'dark';
  mainWindow.setBackgroundColor(isDark ? '#0a0a0f' : '#ffffff');
  
  // Inject theme CSS
  mainWindow.webContents.executeJavaScript(`
    (function() {
      const root = document.documentElement;
      if ('${theme}' === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        localStorage.setItem('theme', 'light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    })();
  `);
}

// Performance optimizations - Max 300 FPS
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('max-gum-fps', '300');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');

// Game images cache folder
const gameImagesPath = path.join(app.getPath('userData'), 'games-images');
if (!fs.existsSync(gameImagesPath)) {
  fs.mkdirSync(gameImagesPath, { recursive: true });
}

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
  downloadHistory,
  settings
}));

ipcMain.handle('save-settings', (event, newSettings) => {
  const oldTheme = settings.theme;
  settings = { ...settings, ...newSettings };
  store.set('settings', settings);
  
  // Apply theme change immediately
  if (newSettings.theme && newSettings.theme !== oldTheme) {
    applyTheme(newSettings.theme);
  }
  
  return { success: true };
});

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

// Get system info
ipcMain.handle('get-system-info', async () => {
  const os = require('os');
  
  return {
    os: `${os.type()} ${os.release()}`,
    cpu: os.cpus()[0]?.model || 'Unknown',
    ram: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
    freeMem: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
    platform: os.platform(),
    arch: os.arch()
  };
});

// Uninstall launcher
ipcMain.handle('uninstall-launcher', async () => {
  try {
    const uninstallerPath = path.join(path.dirname(app.getPath('exe')), 'Uninstall KTM Launcher.exe');
    
    if (fs.existsSync(uninstallerPath)) {
      spawn(uninstallerPath, [], { detached: true, stdio: 'ignore' });
      setTimeout(() => app.quit(), 500);
      return { success: true };
    }
    
    return { success: false, error: 'Uninstaller not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Clear download history
ipcMain.handle('clear-download-history', () => {
  downloadHistory = [];
  store.set('downloadHistory', downloadHistory);
  return { success: true };
});

// Cache game image locally
ipcMain.handle('cache-game-image', async (event, { gameId, imageUrl }) => {
  try {
    const gameImagesPath = path.join(app.getPath('userData'), 'games-images');
    if (!fs.existsSync(gameImagesPath)) {
      fs.mkdirSync(gameImagesPath, { recursive: true });
    }
    
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const imagePath = path.join(gameImagesPath, `${gameId}.${extension}`);
    
    // Check if already cached
    if (fs.existsSync(imagePath)) {
      return { success: true, localPath: imagePath };
    }
    
    // Download and cache image
    return new Promise((resolve) => {
      const protocol = imageUrl.startsWith('https') ? https : http;
      
      const request = protocol.get(imageUrl, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirect
          protocol.get(response.headers.location, (redirectRes) => {
            const fileStream = fs.createWriteStream(imagePath);
            redirectRes.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              resolve({ success: true, localPath: imagePath });
            });
          }).on('error', () => resolve({ success: false }));
          return;
        }
        
        if (response.statusCode !== 200) {
          resolve({ success: false });
          return;
        }
        
        const fileStream = fs.createWriteStream(imagePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve({ success: true, localPath: imagePath });
        });
        fileStream.on('error', () => resolve({ success: false }));
      });
      
      request.on('error', () => resolve({ success: false }));
      request.on('timeout', () => {
        request.destroy();
        resolve({ success: false });
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get cached image path
ipcMain.handle('get-cached-image', async (event, gameId) => {
  try {
    const gameImagesPath = path.join(app.getPath('userData'), 'games-images');
    
    // Check for common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    for (const ext of extensions) {
      const imagePath = path.join(gameImagesPath, `${gameId}.${ext}`);
      if (fs.existsSync(imagePath)) {
        return { success: true, localPath: imagePath };
      }
    }
    
    return { success: false };
  } catch (err) {
    return { success: false };
  }
});

// Clear image cache
ipcMain.handle('clear-image-cache', async () => {
  try {
    const gameImagesPath = path.join(app.getPath('userData'), 'games-images');
    if (fs.existsSync(gameImagesPath)) {
      fs.rmSync(gameImagesPath, { recursive: true, force: true });
      fs.mkdirSync(gameImagesPath, { recursive: true });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
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
    const gameIndex = installedGames.findIndex(g => g.gameId === gameId);
    if (gameIndex !== -1) {
      installedGames[gameIndex].exePath = result.filePaths[0];
      store.set('installedGames', installedGames);
      return { success: true, exePath: result.filePaths[0] };
    }
  }
  return { success: false, error: 'لم يتم اختيار ملف' };
});

// Resolve Gofile direct download link using their API
async function resolveGofileLink(url) {
  return new Promise(async (resolve, reject) => {
    try {
      // Extract content ID from URL
      const match = url.match(/gofile\.io\/d\/([a-zA-Z0-9-]+)/);
      if (!match) {
        resolve({ directLink: url, fileName: null, token: null });
        return;
      }
      
      const contentId = match[1];
      console.log('Resolving Gofile content:', contentId);
      
      // Step 1: Create guest account to get token
      const tokenResponse = await fetchJson('https://api.gofile.io/accounts', 'POST');
      console.log('Token response:', JSON.stringify(tokenResponse));
      
      if (tokenResponse.status !== 'ok') {
        reject(new Error('Failed to create Gofile guest account: ' + JSON.stringify(tokenResponse)));
        return;
      }
      
      const token = tokenResponse.data.token;
      console.log('Got token:', token);
      
      // Step 2: Get content info with token - use correct websiteToken
      const websiteToken = '4fd6sg89d7s6';
      const contentUrl = `https://api.gofile.io/contents/${contentId}?wt=${websiteToken}`;
      console.log('Fetching content from:', contentUrl);
      
      const contentResponse = await fetchJson(contentUrl, 'GET', {
        'Authorization': `Bearer ${token}`,
        'Cookie': `accountToken=${token}`
      });
      
      console.log('Content response status:', contentResponse.status);
      
      if (contentResponse.status !== 'ok') {
        // Try alternative API endpoint
        const altContentUrl = `https://api.gofile.io/getContent?contentId=${contentId}&token=${token}&wt=${websiteToken}`;
        const altResponse = await fetchJson(altContentUrl, 'GET');
        
        if (altResponse.status !== 'ok') {
          reject(new Error('Failed to get Gofile content: ' + (contentResponse.data?.message || altResponse.data?.message || 'Unknown error')));
          return;
        }
        
        return processGofileContent(altResponse.data, token, resolve, reject);
      }
      
      return processGofileContent(contentResponse.data, token, resolve, reject);
    } catch (err) {
      console.error('Gofile error:', err);
      reject(err);
    }
  });
}

function processGofileContent(data, token, resolve, reject) {
  // Extract files from response
  const contents = data.children || data.contents || data.childs;
  
  if (!contents || (typeof contents === 'object' && Object.keys(contents).length === 0)) {
    reject(new Error('No files found in Gofile folder'));
    return;
  }
  
  // Get files array
  const files = Array.isArray(contents) ? contents : Object.values(contents);
  
  if (files.length === 0) {
    reject(new Error('Empty Gofile folder'));
    return;
  }
  
  // Find the main file (largest or first)
  let mainFile = files[0];
  for (const file of files) {
    if (file.type === 'file' && (!mainFile || (file.size && file.size > (mainFile.size || 0)))) {
      mainFile = file;
    }
  }
  
  const directLink = mainFile.link || mainFile.directLink || mainFile.downloadUrl;
  const fileName = mainFile.name;
  
  console.log('Found file:', fileName, 'Link:', directLink ? 'yes' : 'no');
  
  if (!directLink) {
    reject(new Error('No direct download link available. File might be password protected.'));
    return;
  }
  
  resolve({ directLink, fileName, token });
}

// Helper function for JSON fetch with better error handling
function fetchJson(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          console.error('JSON parse error:', data.substring(0, 200));
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
      reject(err);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Download game - Single download at a time
ipcMain.handle('download-game', async (event, { gameId, gameTitle, downloadUrl, gameSlug, gameImage }) => {
  // Cancel any existing download
  if (currentDownloadRequest) {
    try {
      currentDownloadRequest.destroy();
    } catch (e) {}
    currentDownloadRequest = null;
  }
  
  // Clear active downloads
  for (const [id, data] of activeDownloads) {
    mainWindow?.webContents.send('download-status', {
      downloadId: id,
      gameId: data.gameId,
      status: 'paused'
    });
  }
  activeDownloads.clear();

  return new Promise(async (resolve, reject) => {
    const gameFolder = path.join(downloadPath, gameSlug);
    
    if (!fs.existsSync(gameFolder)) {
      fs.mkdirSync(gameFolder, { recursive: true });
    }
    
    const downloadId = `${gameId}-${Date.now()}`;
    let finalUrl = downloadUrl;
    let fileName = `${gameSlug}.zip`;
    let gofileToken = null;
    
    // Check if it's a Gofile link and resolve it
    if (downloadUrl.includes('gofile.io/d/')) {
      try {
        mainWindow?.webContents.send('download-status', {
          downloadId,
          gameId,
          status: 'resolving',
          message: 'جاري استخراج رابط التحميل المباشر...'
        });
        
        const resolved = await resolveGofileLink(downloadUrl);
        finalUrl = resolved.directLink;
        fileName = resolved.fileName || fileName;
        gofileToken = resolved.token;
      } catch (err) {
        mainWindow?.webContents.send('download-error', {
          downloadId,
          gameId,
          error: 'فشل في استخراج رابط Gofile: ' + err.message
        });
        reject(err);
        return;
      }
    }
    
    // Determine file extension
    const isRar = fileName.toLowerCase().endsWith('.rar') || finalUrl.toLowerCase().includes('.rar');
    const extension = isRar ? '.rar' : '.zip';
    const archivePath = path.join(gameFolder, `${gameSlug}${extension}`);
    
    const protocol = finalUrl.startsWith('https') ? https : http;
    
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br'
    };
    
    // Add Gofile cookie if we have token
    if (gofileToken) {
      requestHeaders['Cookie'] = `accountToken=${gofileToken}`;
    }
    
    const request = protocol.get(finalUrl, { 
      timeout: 60000,
      headers: requestHeaders
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307) {
        const redirectUrl = response.headers.location;
        handleDownload(redirectUrl);
        return;
      }
      
      if (response.statusCode !== 200) {
        handleError(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      handleResponse(response);
    });

    currentDownloadRequest = request;
    
    function handleDownload(url) {
      const proto = url.startsWith('https') ? https : http;
      const redirectRequest = proto.get(url, { 
        timeout: 60000,
        headers: requestHeaders
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307) {
          handleDownload(res.headers.location);
          return;
        }
        handleResponse(res);
      });
      redirectRequest.on('error', handleError);
      currentDownloadRequest = redirectRequest;
    }

    function handleResponse(response) {
      const totalSize = parseInt(response.headers['content-length'], 10) || 0;
      let downloadedSize = 0;
      
      const fileStream = fs.createWriteStream(archivePath);
      
      activeDownloads.set(downloadId, {
        gameId,
        gameTitle,
        gameSlug,
        gameImage,
        totalSize,
        downloadedSize: 0,
        progress: 0,
        status: 'downloading',
        startTime: Date.now(),
        archivePath,
        isRar
      });

      mainWindow?.webContents.send('download-progress', {
        downloadId,
        gameId,
        gameTitle,
        gameImage,
        progress: 0,
        downloadedSize: 0,
        totalSize,
        speed: 0,
        status: 'downloading'
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
          gameImage,
          progress,
          downloadedSize,
          totalSize,
          speed: calculateSpeed(downloadedSize, activeDownloads.get(downloadId)?.startTime || Date.now()),
          status: 'downloading'
        });
      });

      response.pipe(fileStream);

      fileStream.on('finish', async () => {
        fileStream.close();
        currentDownloadRequest = null;
        
        // Check if auto-extract is enabled
        if (settings.autoExtract) {
          mainWindow?.webContents.send('download-status', {
            downloadId,
            gameId,
            status: 'extracting',
            message: 'جاري فك الضغط...'
          });

          try {
            await extractArchive(archivePath, gameFolder, isRar);
            
            // Delete archive after extraction if enabled
            if (settings.deleteArchiveAfterExtract && fs.existsSync(archivePath)) {
              fs.unlinkSync(archivePath);
            }
            
            completeDownload();
          } catch (extractError) {
            console.error('Extraction error:', extractError);
            mainWindow?.webContents.send('download-error', {
              downloadId,
              gameId,
              error: 'فشل في فك الضغط: ' + extractError.message
            });
            activeDownloads.delete(downloadId);
            reject(extractError);
          }
        } else {
          completeDownload();
        }
      });
      
      function completeDownload() {
        const exePath = findExecutable(gameFolder);
        
        // Create instructions file
        createInstructionsFile(gameFolder, gameTitle);
        
        const installedGame = {
          gameId,
          gameTitle,
          gameSlug,
          gameImage,
          installPath: gameFolder,
          exePath,
          installedAt: new Date().toISOString(),
          size: getFolderSize(gameFolder)
        };
        
        // Check if already exists
        const existingIndex = installedGames.findIndex(g => g.gameId === gameId);
        if (existingIndex !== -1) {
          installedGames[existingIndex] = installedGame;
        } else {
          installedGames.push(installedGame);
        }
        store.set('installedGames', installedGames);
        
        downloadHistory.unshift({
          ...installedGame,
          downloadedAt: new Date().toISOString()
        });
        downloadHistory = downloadHistory.slice(0, 50);
        store.set('downloadHistory', downloadHistory);
        
        activeDownloads.delete(downloadId);
        
        // Show notification if enabled
        if (settings.notifications && Notification.isSupported()) {
          new Notification({
            title: 'اكتمل التنزيل',
            body: `تم تحميل ${gameTitle} بنجاح!`,
            icon: path.join(__dirname, 'assets', 'icon.png')
          }).show();
        }
        
        mainWindow?.webContents.send('download-complete', {
          downloadId,
          gameId,
          gameTitle,
          installPath: gameFolder,
          exePath
        });
        
        resolve({ success: true, installPath: gameFolder, exePath });
      }

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

// Extract archive (ZIP or RAR)
async function extractArchive(archivePath, destFolder, isRar) {
  return new Promise((resolve, reject) => {
    if (isRar) {
      // Try using system unrar or 7zip
      const unrarPaths = [
        'unrar',
        'C:\\Program Files\\WinRAR\\UnRAR.exe',
        'C:\\Program Files (x86)\\WinRAR\\UnRAR.exe',
        '7z',
        'C:\\Program Files\\7-Zip\\7z.exe',
        'C:\\Program Files (x86)\\7-Zip\\7z.exe'
      ];
      
      let extracted = false;
      
      const tryExtract = (index) => {
        if (index >= unrarPaths.length) {
          // If all failed, try basic extraction
          reject(new Error('لم يتم العثور على برنامج لفك ضغط RAR. يرجى تثبيت WinRAR أو 7-Zip'));
          return;
        }
        
        const extractorPath = unrarPaths[index];
        const isSevenZip = extractorPath.includes('7z');
        
        const args = isSevenZip 
          ? ['x', '-y', `-o${destFolder}`, archivePath]
          : ['x', '-y', archivePath, destFolder];
        
        const process = spawn(extractorPath, args, { windowsHide: true });
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            tryExtract(index + 1);
          }
        });
        
        process.on('error', () => {
          tryExtract(index + 1);
        });
      };
      
      tryExtract(0);
    } else {
      // ZIP extraction using AdmZip
      try {
        const zip = new AdmZip(archivePath);
        zip.extractAllTo(destFolder, true);
        resolve();
      } catch (err) {
        reject(err);
      }
    }
  });
}

// Create instructions file
function createInstructionsFile(gameFolder, gameTitle) {
  const instructionsPath = path.join(gameFolder, 'KTM_تعليمات.txt');
  if (!fs.existsSync(instructionsPath)) {
    const instructions = `=== تعليمات تشغيل اللعبة ===

اسم اللعبة: ${gameTitle}

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
}

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
    gameImage: data.gameImage,
    progress: data.progress || 0,
    downloadedSize: data.downloadedSize || 0,
    totalSize: data.totalSize || 0,
    speed: calculateSpeed(data.downloadedSize || 0, data.startTime || Date.now()),
    status: data.status || 'downloading'
  }));
});

// Get installed games
ipcMain.handle('get-installed-games', () => installedGames);

// Get download history
ipcMain.handle('get-download-history', () => downloadHistory);

// Scan download folder for games
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
      
      const matchedGame = websiteGames.find(g => g.slug === folderName);
      
      if (!matchedGame) {
        continue;
      }

      const exePath = findExecutable(folderPath);
      
      createInstructionsFile(folderPath, matchedGame.title);

      const existingGame = installedGames.find(g => g.gameId === matchedGame.id);
      
      if (!existingGame) {
        const gameInfo = {
          gameId: matchedGame.id,
          gameTitle: matchedGame.title,
          gameSlug: matchedGame.slug,
          gameImage: matchedGame.image,
          installPath: folderPath,
          exePath: exePath,
          installedAt: new Date().toISOString(),
          size: getFolderSize(folderPath)
        };
        detectedGames.push(gameInfo);
        installedGames.push(gameInfo);
      } else {
        existingGame.installPath = folderPath;
        existingGame.gameImage = matchedGame.image;
        if (!existingGame.exePath || !fs.existsSync(existingGame.exePath)) {
          existingGame.exePath = exePath;
        }
        existingGame.size = getFolderSize(folderPath);
        detectedGames.push(existingGame);
      }
    }

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
  
  if (exePath && fs.existsSync(exePath)) {
    shell.openPath(exePath);
    return { success: true };
  }
  
  if (game?.exePath && fs.existsSync(game.exePath)) {
    shell.openPath(game.exePath);
    return { success: true };
  }
  
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
