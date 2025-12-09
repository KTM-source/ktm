import { useState, useEffect, useCallback } from 'react';

interface RunningGame {
  gameId: string;
  gameTitle: string;
  startTime: number;
  sessionTime: number;
}

interface GamePlaytime {
  gameId: string;
  gameTitle: string;
  totalPlaytime: number; // in seconds
  lastPlayed: string;
  sessions: number;
}

export const useRunningGames = () => {
  const [isElectron] = useState(() => !!window.electronAPI?.isElectron);
  const [runningGames, setRunningGames] = useState<RunningGame[]>([]);
  const [playtimeStats, setPlaytimeStats] = useState<GamePlaytime[]>([]);

  // Fetch running games from Electron
  const fetchRunningGames = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const api = window.electronAPI;
      if (api && 'getRunningGames' in api) {
        const games = await (api as any).getRunningGames();
        setRunningGames(games || []);
      }
    } catch (e) {
      console.error('Error fetching running games:', e);
    }
  }, [isElectron]);

  // Fetch playtime stats from Electron
  const fetchPlaytimeStats = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const api = window.electronAPI;
      if (api && 'getPlaytimeStats' in api) {
        const stats = await (api as any).getPlaytimeStats();
        setPlaytimeStats(stats || []);
      }
    } catch (e) {
      console.error('Error fetching playtime stats:', e);
    }
  }, [isElectron]);

  // Poll for running games and setup event listeners
  useEffect(() => {
    if (!isElectron) return;

    // Initial fetch
    fetchRunningGames();
    fetchPlaytimeStats();

    // Poll every 3 seconds for running games
    const runningInterval = setInterval(fetchRunningGames, 3000);

    // Update playtime stats every 30 seconds
    const playtimeInterval = setInterval(fetchPlaytimeStats, 30000);

    // Listen for game events
    const api = window.electronAPI as any;
    
    if (api?.onGameStarted) {
      api.onGameStarted((data: { gameId: string; gameTitle: string }) => {
        setRunningGames(prev => {
          if (prev.some(g => g.gameId === data.gameId)) return prev;
          return [...prev, { 
            ...data, 
            startTime: Date.now(), 
            sessionTime: 0 
          }];
        });
      });
    }

    if (api?.onGameStopped) {
      api.onGameStopped((data: { gameId: string; playTime: number }) => {
        setRunningGames(prev => prev.filter(g => g.gameId !== data.gameId));
        // Refresh playtime stats
        fetchPlaytimeStats();
      });
    }

    return () => {
      clearInterval(runningInterval);
      clearInterval(playtimeInterval);
      if (api?.removeAllListeners) {
        api.removeAllListeners('game-started');
        api.removeAllListeners('game-stopped');
      }
    };
  }, [isElectron, fetchRunningGames, fetchPlaytimeStats]);

  const isGameRunning = useCallback((gameId: string) => {
    return runningGames.some(g => g.gameId === gameId);
  }, [runningGames]);

  const getGamePlaytime = useCallback((gameId: string) => {
    return playtimeStats.find(g => g.gameId === gameId);
  }, [playtimeStats]);

  const getTotalPlaytime = useCallback(() => {
    return playtimeStats.reduce((acc, g) => acc + g.totalPlaytime, 0);
  }, [playtimeStats]);

  const formatPlaytime = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours} ساعة و ${remainingMinutes} دقيقة` : `${hours} ساعة`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} يوم و ${remainingHours} ساعة`;
  }, []);

  return {
    runningGames,
    playtimeStats,
    isGameRunning,
    getGamePlaytime,
    getTotalPlaytime,
    formatPlaytime
  };
};

export type { RunningGame, GamePlaytime };