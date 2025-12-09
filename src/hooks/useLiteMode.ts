import { useState, useEffect } from 'react';

export const useLiteMode = () => {
  const [isLiteMode, setIsLiteMode] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const isElectron = !!(window as any).electronAPI;
    setIsLiteMode(isElectron);

    // Add/remove lite-mode class on document
    if (isElectron) {
      document.documentElement.classList.add('lite-mode');
      document.body.classList.add('lite-mode');
    } else {
      document.documentElement.classList.remove('lite-mode');
      document.body.classList.remove('lite-mode');
    }

    return () => {
      document.documentElement.classList.remove('lite-mode');
      document.body.classList.remove('lite-mode');
    };
  }, []);

  return isLiteMode;
};

export default useLiteMode;
