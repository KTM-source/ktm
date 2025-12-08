import { useState } from 'react';
import { Settings, FolderOpen, X, HardDrive, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useElectron } from '@/hooks/useElectron';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LauncherSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LauncherSettings = ({ open, onOpenChange }: LauncherSettingsProps) => {
  const { downloadPath, changeDownloadPath, installedGames } = useElectron();
  const [isChangingPath, setIsChangingPath] = useState(false);

  const totalSize = installedGames.reduce((acc, game) => acc + game.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleChangePath = async () => {
    setIsChangingPath(true);
    await changeDownloadPath();
    setIsChangingPath(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5 text-primary" />
            إعدادات اللانشر
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Download Path */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              مجلد التنزيلات
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-muted-foreground truncate" dir="ltr">
                {downloadPath || 'لم يتم تحديد مسار'}
              </div>
              <Button
                variant="outline"
                onClick={handleChangePath}
                disabled={isChangingPath}
                className="shrink-0"
              >
                {isChangingPath ? 'جاري...' : 'تغيير'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              سيتم تحميل الألعاب وتثبيتها في هذا المجلد
            </p>
          </div>

          {/* Storage Info */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              معلومات التخزين
            </label>
            <div className="bg-muted/50 border border-border/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الألعاب المثبتة</span>
                <span className="text-foreground font-medium">{installedGames.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">إجمالي الحجم</span>
                <span className="text-foreground font-medium">{formatSize(totalSize)}</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              عن اللانشر
            </label>
            <div className="bg-muted/50 border border-border/50 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">KTM Launcher</strong> الإصدار 1.0.0</p>
              <p>لانشر ألعاب متكامل لتحميل وتشغيل الألعاب بسهولة</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LauncherSettings;
