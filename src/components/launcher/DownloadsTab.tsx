import { useState } from 'react';
import { Download, Pause, X, FolderOpen, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useElectron, DownloadProgress, InstalledGame } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number) => {
  return formatSize(bytesPerSecond) + '/s';
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'منذ أقل من ساعة';
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
};

const DownloadsTab = () => {
  const { activeDownloads, downloadHistory, cancelDownload, openFolder } = useElectron();
  const [filter, setFilter] = useState<'active' | 'history'>('active');

  // Filter history to last 24 hours
  const recentHistory = downloadHistory.filter((item) => {
    const downloadDate = new Date(item.installedAt);
    const now = new Date();
    const diffHours = (now.getTime() - downloadDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Download className="w-6 h-6 text-primary" />
          التنزيلات
        </h2>
        
        <div className="flex gap-2 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setFilter('active')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              filter === 'active'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            نشطة ({activeDownloads.length})
          </button>
          <button
            onClick={() => setFilter('history')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              filter === 'history'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            آخر 24 ساعة ({recentHistory.length})
          </button>
        </div>
      </div>

      {filter === 'active' ? (
        <div className="space-y-4">
          {activeDownloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Download className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">لا توجد تنزيلات نشطة</p>
              <p className="text-sm">ابدأ بتحميل لعبة من المتجر</p>
            </div>
          ) : (
            activeDownloads.map((download) => (
              <ActiveDownloadCard
                key={download.downloadId}
                download={download}
                onCancel={() => cancelDownload(download.downloadId)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {recentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">لا توجد تنزيلات في آخر 24 ساعة</p>
            </div>
          ) : (
            recentHistory.map((item, index) => (
              <HistoryCard
                key={`${item.gameId}-${index}`}
                item={item}
                onOpenFolder={() => openFolder(item.installPath)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ActiveDownloadCard = ({
  download,
  onCancel
}: {
  download: DownloadProgress;
  onCancel: () => void;
}) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{download.gameTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {formatSize(download.downloadedSize)} / {formatSize(download.totalSize)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary font-medium">
            {formatSpeed(download.speed)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-destructive hover:bg-destructive/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <Progress value={download.progress} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {download.progress.toFixed(1)}%
      </p>
    </div>
  );
};

const HistoryCard = ({
  item,
  onOpenFolder
}: {
  item: InstalledGame;
  onOpenFolder: () => void;
}) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{item.gameTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {formatSize(item.size)} • {formatTimeAgo(item.installedAt)}
          </p>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenFolder}
        className="text-muted-foreground hover:text-foreground"
      >
        <FolderOpen className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default DownloadsTab;
