import { useState, ReactNode } from 'react';
import LauncherTitleBar from './LauncherTitleBar';
import LauncherNav from './LauncherNav';
import LauncherSettings from './LauncherSettings';
import DownloadsTab from './DownloadsTab';
import LibraryTab from './LibraryTab';
import { useElectron } from '@/hooks/useElectron';

interface LauncherWrapperProps {
  children: ReactNode;
}

const LauncherWrapper = ({ children }: LauncherWrapperProps) => {
  const { isElectron } = useElectron();
  const [activeTab, setActiveTab] = useState<'store' | 'downloads' | 'library'>('store');
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!isElectron) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <LauncherTitleBar />
      <LauncherNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSettingsClick={() => setSettingsOpen(true)}
      />
      
      <div className="pt-20">
        {activeTab === 'store' && children}
        {activeTab === 'downloads' && <DownloadsTab />}
        {activeTab === 'library' && <LibraryTab />}
      </div>

      <LauncherSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default LauncherWrapper;
