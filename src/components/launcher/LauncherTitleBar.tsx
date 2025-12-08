import { Minus, Square, X } from 'lucide-react';

const LauncherTitleBar = () => {
  const isElectron = window.electronAPI?.isElectron;

  if (!isElectron) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between z-[100] select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center gap-2 px-3">
        <img src="/favicon.png" alt="KTM" className="w-4 h-4" />
        <span className="text-xs font-medium text-foreground/70">KTM Launcher</span>
      </div>
      
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="h-8 w-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-foreground/70" />
        </button>
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="h-8 w-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <Square className="w-3 h-3 text-foreground/70" />
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="h-8 w-10 flex items-center justify-center hover:bg-destructive/80 transition-colors group"
        >
          <X className="w-4 h-4 text-foreground/70 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default LauncherTitleBar;
