import { useState } from 'react';
import { Library, Play, Trash2, FolderOpen, Search, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useElectron, InstalledGame } from '@/hooks/useElectron';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const LibraryTab = () => {
  const { installedGames, launchGame, uninstallGame, openFolder } = useElectron();
  const [searchQuery, setSearchQuery] = useState('');
  const [gameToUninstall, setGameToUninstall] = useState<InstalledGame | null>(null);

  const filteredGames = installedGames.filter((game) =>
    game.gameTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = installedGames.reduce((acc, game) => acc + game.size, 0);

  const handleLaunch = async (game: InstalledGame) => {
    const result = await launchGame(game.gameId, game.exePath || undefined);
    if (!result?.success) {
      toast.error(result?.error || 'فشل في تشغيل اللعبة');
    }
  };

  const handleUninstall = async () => {
    if (!gameToUninstall) return;
    
    const result = await uninstallGame(gameToUninstall.gameId);
    if (result?.success) {
      toast.success('تم إلغاء تثبيت اللعبة بنجاح');
    } else {
      toast.error(result?.error || 'فشل في إلغاء التثبيت');
    }
    setGameToUninstall(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Library className="w-6 h-6 text-primary" />
          المكتبة
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <HardDrive className="w-4 h-4" />
            <span>{installedGames.length} ألعاب • {formatSize(totalSize)}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث في مكتبتك..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 bg-muted/50 border-border/50"
        />
      </div>

      {filteredGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Library className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg">
            {searchQuery ? 'لم يتم العثور على ألعاب' : 'مكتبتك فارغة'}
          </p>
          <p className="text-sm">
            {searchQuery ? 'جرب كلمات بحث أخرى' : 'قم بتحميل ألعاب من المتجر'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <GameCard
              key={game.gameId}
              game={game}
              onLaunch={() => handleLaunch(game)}
              onOpenFolder={() => openFolder(game.installPath)}
              onUninstall={() => setGameToUninstall(game)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!gameToUninstall} onOpenChange={() => setGameToUninstall(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء تثبيت اللعبة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء تثبيت "{gameToUninstall?.gameTitle}"؟ سيتم حذف جميع ملفات اللعبة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleUninstall} className="bg-destructive hover:bg-destructive/90">
              إلغاء التثبيت
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const GameCard = ({
  game,
  onLaunch,
  onOpenFolder,
  onUninstall
}: {
  game: InstalledGame;
  onLaunch: () => void;
  onOpenFolder: () => void;
  onUninstall: () => void;
}) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-4 animate-fade-in hover:border-primary/50 transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {game.gameTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatSize(game.size)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onLaunch}
          className="flex-1 gap-2 bg-primary hover:bg-primary/90"
        >
          <Play className="w-4 h-4" />
          تشغيل
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenFolder}
          className="text-muted-foreground hover:text-foreground"
        >
          <FolderOpen className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onUninstall}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default LibraryTab;
