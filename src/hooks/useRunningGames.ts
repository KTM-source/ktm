import { useState, useEffect, useCallback } from 'react';
import { useElectron } from './useElectron';

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

// Extended ElectronAPI interface for running games
interface RunningGamesAPI {
  getRunningGames?: () => Promise<RunningGame[]>;
  getGamePlaytime?: () => Promise<GamePlaytime[]>;
  isGameRunning?: (gameId: string) => Promise<boolean>;
  onGameStarted?: (callback: (data: { gameId: string; gameTitle: string }) => void) => void;
  onGameStopped?: (callback: (data: { gameId: string; playTime: number }) => void) => void;
}

export const useRunningGames = () => {
  const { installedGames, isElectron } = useElectron();
  const [runningGames, setRunningGames] = useState<RunningGame[]>([]);
  const [playtimeStats, setPlaytimeStats] = useState<GamePlaytime[]>([]);

  // Get the extended API
  const getExtendedAPI = useCallback((): RunningGamesAPI | undefined => {
    return window.electronAPI as unknown as RunningGamesAPI;
  }, []);

  // Poll for running games
  useEffect(() => {
    if (!isElectron) return;

    const api = getExtendedAPI();

    const checkRunningGames = async () => {
      if (api?.getRunningGames) {
        try {
          const games = await api.getRunningGames();
          setRunningGames(games || []);
        } catch (e) {
          console.error('Error checking running games:', e);
        }
      }
    };

    const fetchPlaytime = async () => {
      if (api?.getGamePlaytime) {
        try {
          const stats = await api.getGamePlaytime();
          setPlaytimeStats(stats || []);
        } catch (e) {
          console.error('Error fetching playtime:', e);
        }
      }
    };

    // Initial fetch
    checkRunningGames();
    fetchPlaytime();

    // Poll every 3 seconds
    const interval = setInterval(() => {
      checkRunningGames();
    }, 3000);

    // Update playtime every 30 seconds
    const playtimeInterval = setInterval(() => {
      fetchPlaytime();
    }, 30000);

    // Listen for game events
    api?.onGameStarted?.((data) => {
      setRunningGames(prev => [...prev, { 
        ...data, 
        startTime: Date.now(), 
        sessionTime: 0 
      }]);
    });

    api?.onGameStopped?.((data) => {
      setRunningGames(prev => prev.filter(g => g.gameId !== data.gameId));
      fetchPlaytime();
    });

    return () => {
      clearInterval(interval);
      clearInterval(playtimeInterval);
    };
  }, [isElectron, getExtendedAPI]);

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
