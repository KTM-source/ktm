import { Store, Download, Library, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useElectron } from '@/hooks/useElectron';

interface LauncherNavProps {
  activeTab: 'store' | 'downloads' | 'library' | 'stats' | 'admin';
  onTabChange: (tab: 'store' | 'downloads' | 'library' | 'stats' | 'admin') => void;
  onSettingsClick: () => void;
}

const LauncherNav = ({ activeTab, onTabChange, onSettingsClick }: LauncherNavProps) => {
  const { activeDownloads, isElectron } = useElectron();

  if (!isElectron) return null;

  const tabs = [
    { id: 'store' as const, label: 'المتجر', icon: Store },
    { id: 'downloads' as const, label: 'التنزيلات', icon: Download, badge: activeDownloads.length },
    { id: 'library' as const, label: 'المكتبة', icon: Library },
    { id: 'stats' as const, label: 'الإحصائيات', icon: BarChart3 },
    { id: 'admin' as const, label: 'القاعدة', icon: Shield },
  ];

  return (
    <div className="fixed top-8 left-0 right-0 h-12 bg-background/95 backdrop-blur-sm border-b border-border/50 flex items-center justify-between px-4 z-[9998]">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>
  );
};

export default LauncherNav;