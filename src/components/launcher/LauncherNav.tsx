import { Store, Download, Library, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useElectron } from '@/hooks/useElectron';

interface LauncherNavProps {
  activeTab: 'store' | 'downloads' | 'library';
  onTabChange: (tab: 'store' | 'downloads' | 'library') => void;
  onSettingsClick: () => void;
}

const LauncherNav = ({ activeTab, onTabChange, onSettingsClick }: LauncherNavProps) => {
  const { activeDownloads, isElectron } = useElectron();

  if (!isElectron) return null;

  const tabs = [
    { id: 'store' as const, label: 'المتجر', icon: Store },
    { id: 'downloads' as const, label: 'التنزيلات', icon: Download, badge: activeDownloads.length },
    { id: 'library' as const, label: 'المكتبة', icon: Library },
  ];

  return (
    <div className="fixed top-8 left-0 right-0 h-12 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 z-[99]">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onSettingsClick}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
};

export default LauncherNav;
