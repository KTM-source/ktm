import { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Minimize2 } from 'lucide-react';

const LauncherTitleBar = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkElectron = () => {
      const electron = !!(window as any).electronAPI?.isElectron;
      setIsElectron(electron);
      
      if (electron) {
        // Get initial window state
        (window as any).electronAPI?.getWindowState?.().then((state: { isMaximized: boolean }) => {
          setIsMaximized(state?.isMaximized || false);
        });
        
        // Listen for maximize/unmaximize events
        (window as any).electronAPI?.onWindowMaximized?.((maximized: boolean) => {
          setIsMaximized(maximized);
        });
      }
    };
    checkElectron();
    const timer = setTimeout(checkElectron, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isElectron) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-background border-b border-border/50 flex items-center justify-between z-[9999] select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center gap-2 px-3">
        <img src="/favicon.png" alt="KTM" className="w-4 h-4" />
        <span className="text-xs font-medium text-foreground/70">KTM Launcher</span>
      </div>
      
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => (window as any).electronAPI?.minimize()}
          className="h-8 w-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
          title="تصغير"
        >
          <Minus className="w-3.5 h-3.5 text-foreground/70" />
        </button>
        <button
          onClick={() => (window as any).electronAPI?.maximize()}
          className="h-8 w-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
          title={isMaximized ? "استعادة" : "تكبير"}
        >
          {isMaximized ? (
            <Minimize2 className="w-3 h-3 text-foreground/70" />
          ) : (
            <Maximize2 className="w-3 h-3 text-foreground/70" />
          )}
        </button>
        <button
          onClick={() => (window as any).electronAPI?.close()}
          className="h-8 w-10 flex items-center justify-center hover:bg-destructive/80 transition-colors group"
          title="إغلاق"
        >
          <X className="w-4 h-4 text-foreground/70 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default LauncherTitleBar;