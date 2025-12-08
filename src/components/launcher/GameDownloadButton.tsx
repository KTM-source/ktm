import { useState, useEffect } from 'react';
import { Download, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useElectron } from '@/hooks/useElectron';
import { toast } from 'sonner';

interface GameDownloadButtonProps {
  gameId: string;
  gameTitle: string;
  gameSlug: string;
  downloadUrl: string;
  className?: string;
}

const GameDownloadButton = ({
  gameId,
  gameTitle,
  gameSlug,
  downloadUrl,
  className
}: GameDownloadButtonProps) => {
  const { isElectron, isGameInstalled, launchGame, downloadGame, activeDownloads, selectExe } = useElectron();
  const [installed, setInstalled] = useState<{ installed: boolean; exePath?: string | null }>({ installed: false });
  const [isLoading, setIsLoading] = useState(false);

  // Check if game is currently downloading
  const currentDownload = activeDownloads.find((d) => d.gameId === gameId);

  useEffect(() => {
    if (isElectron) {
      isGameInstalled(gameId).then((result) => {
        setInstalled({ installed: result.installed, exePath: result.exePath });
      });
    }
  }, [isElectron, gameId, isGameInstalled, activeDownloads]);

  // If not in Electron, show regular download link
  if (!isElectron) {
    return (
      <Button
        asChild
        className={className}
      >
        <a href={downloadUrl} className="gap-2">
          <Download className="w-5 h-5" />
          تحميل الآن
        </a>
      </Button>
    );
  }

  // If game is downloading, show progress
  if (currentDownload) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button disabled className="w-full gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري التحميل {currentDownload.progress.toFixed(0)}%
        </Button>
        <Progress value={currentDownload.progress} className="h-2" />
      </div>
    );
  }

  // If game is installed, show play button
  if (installed.installed) {
    const handleLaunch = async () => {
      setIsLoading(true);
      const result = await launchGame(gameId, installed.exePath || undefined);
      
      // If needs exe selection, prompt user
      if (result?.needsExeSelection) {
        toast.info('يرجى اختيار ملف تشغيل اللعبة (.exe)');
        const selectResult = await selectExe(gameId);
        if (selectResult?.success && selectResult.exePath) {
          // Update local state and try launching again
          setInstalled({ installed: true, exePath: selectResult.exePath });
          await launchGame(gameId, selectResult.exePath);
        }
      } else if (!result?.success) {
        toast.error(result?.error || 'فشل في تشغيل اللعبة');
      }
      
      setIsLoading(false);
    };

    return (
      <Button
        onClick={handleLaunch}
        disabled={isLoading}
        className={`gap-2 bg-green-600 hover:bg-green-700 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        بدء اللعب
      </Button>
    );
  }

  // Show download button
  const handleDownload = async () => {
    if (!downloadUrl) {
      toast.error('رابط التحميل غير متوفر');
      return;
    }

    setIsLoading(true);
    try {
      await downloadGame(gameId, gameTitle, downloadUrl, gameSlug);
      toast.success('بدأ التحميل');
    } catch (error) {
      toast.error('فشل في بدء التحميل');
    }
    setIsLoading(false);
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      className={`gap-2 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Download className="w-5 h-5" />
      )}
      تحميل الآن
    </Button>
  );
};

export default GameDownloadButton;