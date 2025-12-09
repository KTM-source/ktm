import { useState, useEffect } from 'react';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export const useCachedImage = (gameId: string, imageUrl: string) => {
  const [cachedSrc, setCachedSrc] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isElectron || !gameId || !imageUrl) {
      setCachedSrc(imageUrl);
      setIsLoading(false);
      return;
    }

    const loadCachedImage = async () => {
      try {
        const electronAPI = (window as any).electronAPI;
        
        // First check if image is already cached
        const cached = await electronAPI.getCachedImage(gameId);
        
        if (cached.success && cached.localPath) {
          // Use local file path with file:// protocol
          setCachedSrc(`file://${cached.localPath}`);
          setIsLoading(false);
          return;
        }
        
        // Not cached, download and cache it
        const result = await electronAPI.cacheGameImage({ gameId, imageUrl });
        
        if (result.success && result.localPath) {
          setCachedSrc(`file://${result.localPath}`);
        } else {
          // Fallback to original URL
          setCachedSrc(imageUrl);
        }
      } catch (err) {
        console.error('Image caching error:', err);
        setCachedSrc(imageUrl);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedImage();
  }, [gameId, imageUrl]);

  return { cachedSrc, isLoading };
};
