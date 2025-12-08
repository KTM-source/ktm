import { useState, useEffect, useCallback } from 'react';

interface DownloadProgress {
  downloadId: string;
  gameId: string;
  gameTitle: string;
  progress: number;
  downloadedSize: number;
  totalSize: number;
  speed: number;
}

interface InstalledGame {
  gameId: string;
  gameTitle: string;
  gameSlug: string;
  installPath: string;
  exePath: string | null;
  installedAt: string;
  size: number;
}

interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getSettings: () => Promise<{ downloadPath: string; installedGames: InstalledGame[]; downloadHistory: InstalledGame[] }>;
  setDownloadPath: () => Promise<string | null>;
  downloadGame: (data: { gameId: string; gameTitle: string; downloadUrl: string; gameSlug: string }) => Promise<{ success: boolean; installPath?: string; exePath?: string }>;
  cancelDownload: (downloadId: string) => Promise<boolean>;
  getActiveDownloads: () => Promise<DownloadProgress[]>;
  getDownloadHistory: () => Promise<InstalledGame[]>;
  getInstalledGames: () => Promise<InstalledGame[]>;
  isGameInstalled: (gameId: string) => Promise<{ installed: boolean } & Partial<InstalledGame>>;
  launchGame: (data: { gameId: string; exePath?: string }) => Promise<{ success: boolean; error?: string }>;
  uninstallGame: (gameId: string) => Promise<{ success: boolean; error?: string }>;
  openFolder: (path: string) => Promise<boolean>;
  onDownloadProgress: (callback: (data: DownloadProgress) => void) => void;
  onDownloadStatus: (callback: (data: { downloadId: string; gameId: string; status: string }) => void) => void;
  onDownloadComplete: (callback: (data: { downloadId: string; gameId: string; gameTitle: string; installPath: string; exePath: string | null }) => void) => void;
  onDownloadError: (callback: (data: { downloadId: string; gameId: string; error: string }) => void) => void;
  removeAllListeners: (channel: string) => void;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [downloadPath, setDownloadPath] = useState<string>('');
  const [activeDownloads, setActiveDownloads] = useState<DownloadProgress[]>([]);
  const [installedGames, setInstalledGames] = useState<InstalledGame[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<InstalledGame[]>([]);

  useEffect(() => {
    const initElectron = () => {
      const electron = window.electronAPI?.isElectron;
      console.log('Checking Electron API:', !!electron, window.electronAPI);
      setIsElectron(!!electron);

      if (electron) {
        // Load initial settings
        window.electronAPI?.getSettings().then((settings) => {
          setDownloadPath(settings.downloadPath);
          setInstalledGames(settings.installedGames);
          setDownloadHistory(settings.downloadHistory);
        }).catch(console.error);

        // Load active downloads
        window.electronAPI?.getActiveDownloads().then(setActiveDownloads).catch(console.error);

        // Set up event listeners
        window.electronAPI?.onDownloadProgress((data) => {
          setActiveDownloads((prev) => {
            const index = prev.findIndex((d) => d.downloadId === data.downloadId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data;
              return updated;
            }
            return [...prev, data];
          });
        });

        window.electronAPI?.onDownloadComplete((data) => {
          setActiveDownloads((prev) => prev.filter((d) => d.downloadId !== data.downloadId));
          // Refresh installed games
          window.electronAPI?.getInstalledGames().then(setInstalledGames).catch(console.error);
          window.electronAPI?.getDownloadHistory().then(setDownloadHistory).catch(console.error);
        });

        window.electronAPI?.onDownloadError((data) => {
          setActiveDownloads((prev) => prev.filter((d) => d.downloadId !== data.downloadId));
        });
      }
    };

    // Check immediately
    initElectron();
    
    // Also check after a delay (in case API is injected after initial load)
    const timer = setTimeout(initElectron, 500);

    return () => {
      clearTimeout(timer);
      if (window.electronAPI?.isElectron) {
        window.electronAPI?.removeAllListeners('download-progress');
        window.electronAPI?.removeAllListeners('download-status');
        window.electronAPI?.removeAllListeners('download-complete');
        window.electronAPI?.removeAllListeners('download-error');
      }
    };
  }, []);

  const changeDownloadPath = useCallback(async () => {
    if (!isElectron) return null;
    const newPath = await window.electronAPI?.setDownloadPath();
    if (newPath) {
      setDownloadPath(newPath);
    }
    return newPath;
  }, [isElectron]);

  const downloadGame = useCallback(async (gameId: string, gameTitle: string, downloadUrl: string, gameSlug: string) => {
    if (!isElectron) return null;
    return window.electronAPI?.downloadGame({ gameId, gameTitle, downloadUrl, gameSlug });
  }, [isElectron]);

  const cancelDownload = useCallback(async (downloadId: string) => {
    if (!isElectron) return false;
    return window.electronAPI?.cancelDownload(downloadId);
  }, [isElectron]);

  const launchGame = useCallback(async (gameId: string, exePath?: string) => {
    if (!isElectron) return { success: false, error: 'Not in Electron' };
    return window.electronAPI?.launchGame({ gameId, exePath });
  }, [isElectron]);

  const uninstallGame = useCallback(async (gameId: string) => {
    if (!isElectron) return { success: false };
    const result = await window.electronAPI?.uninstallGame(gameId);
    if (result?.success) {
      setInstalledGames((prev) => prev.filter((g) => g.gameId !== gameId));
    }
    return result;
  }, [isElectron]);

  const isGameInstalled = useCallback(async (gameId: string) => {
    if (!isElectron) return { installed: false };
    return window.electronAPI?.isGameInstalled(gameId);
  }, [isElectron]);

  const openFolder = useCallback(async (path: string) => {
    if (!isElectron) return false;
    return window.electronAPI?.openFolder(path);
  }, [isElectron]);

  return {
    isElectron,
    downloadPath,
    activeDownloads,
    installedGames,
    downloadHistory,
    changeDownloadPath,
    downloadGame,
    cancelDownload,
    launchGame,
    uninstallGame,
    isGameInstalled,
    openFolder
  };
};

export type { DownloadProgress, InstalledGame };
