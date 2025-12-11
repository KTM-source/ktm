import { useState, useEffect } from 'react';
import { X, Download, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CURRENT_VERSION = 'v1.0.0'; // This should match the installed launcher version
const VERSION_CHECK_URL = 'https://ktm.lovable.app/version.txt';
const DOWNLOAD_URL = 'https://github.com/KTM-Games/launcher/releases/latest/download/KTM-Launcher-Setup.exe';

interface UpdateNotificationProps {
  onClose?: () => void;
}

const UpdateNotification = ({ onClose }: UpdateNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isElectron] = useState(() => !!(window as any).electronAPI?.isElectron);

  useEffect(() => {
    if (!isElectron) return;

    const checkForUpdates = async () => {
      try {
        // Get current version from Electron
        const api = (window as any).electronAPI;
        const currentVersion = api?.getAppVersion?.() || CURRENT_VERSION;
        
        // Fetch latest version from server
        const response = await fetch(VERSION_CHECK_URL + '?t=' + Date.now(), {
          cache: 'no-store'
        });
        
        if (!response.ok) return;
        
        const serverVersion = (await response.text()).trim();
        setLatestVersion(serverVersion);
        
        // Compare versions
        if (isNewerVersion(serverVersion, currentVersion)) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check after a short delay
    const timeout = setTimeout(checkForUpdates, 2000);
    return () => clearTimeout(timeout);
  }, [isElectron]);

  const isNewerVersion = (latest: string, current: string): boolean => {
    const parseVersion = (v: string) => {
      const match = v.match(/v?(\d+)\.(\d+)\.(\d+)/);
      if (!match) return [0, 0, 0];
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    };

    const [latestMajor, latestMinor, latestPatch] = parseVersion(latest);
    const [currentMajor, currentMinor, currentPatch] = parseVersion(current);

    if (latestMajor > currentMajor) return true;
    if (latestMajor === currentMajor && latestMinor > currentMinor) return true;
    if (latestMajor === currentMajor && latestMinor === currentMinor && latestPatch > currentPatch) return true;
    
    return false;
  };

  const handleDownload = () => {
    setIsDownloading(true);
    // Open download link in external browser
    const api = (window as any).electronAPI;
    if (api?.openExternal) {
      api.openExternal(DOWNLOAD_URL);
    } else {
      window.open(DOWNLOAD_URL, '_blank');
    }
    
    setTimeout(() => {
      setIsDownloading(false);
    }, 3000);
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !isElectron) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-card to-card/95 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="relative p-6 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/30">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            تحديث جديد متاح! 🎉
          </h2>

          {/* Version info */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="px-3 py-1 bg-muted/50 rounded-full text-sm text-muted-foreground">
              الحالي: {CURRENT_VERSION}
            </span>
            <span className="text-primary">→</span>
            <span className="px-3 py-1 bg-primary/20 rounded-full text-sm text-primary font-bold">
              الجديد: {latestVersion}
            </span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            يوجد إصدار جديد من KTM Launcher يحتوي على تحسينات وإصلاحات مهمة.
            ننصحك بالتحديث للحصول على أفضل تجربة.
          </p>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6 text-right">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200/80">
              بعد تنزيل التحديث، أغلق اللانشر الحالي ثم قم بتثبيت الإصدار الجديد.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              لاحقاً
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'جاري التنزيل...' : 'تنزيل التحديث'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
