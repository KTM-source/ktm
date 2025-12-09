import { useState, useEffect } from 'react';

const LITE_MODE_KEY = 'ktm-lite-mode';

export const useLiteMode = () => {
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const electronDetected = !!(window as any).electronAPI;
    setIsElectron(electronDetected);

    if (electronDetected) {
      // Check saved preference, default to true (enabled)
      const savedPreference = localStorage.getItem(LITE_MODE_KEY);
      const shouldEnable = savedPreference === null ? true : savedPreference === 'true';
      setIsLiteMode(shouldEnable);
      applyLiteMode(shouldEnable);
    } else {
      // Not in Electron - never apply lite mode
      setIsLiteMode(false);
      applyLiteMode(false);
    }

    return () => {
      applyLiteMode(false);
    };
  }, []);

  const applyLiteMode = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('lite-mode');
      document.body.classList.add('lite-mode');
    } else {
      document.documentElement.classList.remove('lite-mode');
      document.body.classList.remove('lite-mode');
    }
  };

  const toggleLiteMode = (enabled: boolean) => {
    setIsLiteMode(enabled);
    localStorage.setItem(LITE_MODE_KEY, String(enabled));
    applyLiteMode(enabled);
  };

  return { isLiteMode, isElectron, toggleLiteMode };
};

export default useLiteMode;