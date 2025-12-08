import { useState, useEffect } from 'react';
import { Library, Play, Trash2, FolderOpen, Search, HardDrive, RefreshCw, ExternalLink, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useElectron, InstalledGame } from '@/hooks/useElectron';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
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

interface GameWithImage extends InstalledGame {
  image?: string;
  genre?: string;
}

const LibraryTab = () => {
  const { installedGames, launchGame, uninstallGame, openFolder, scanGamesFolder, isElectron } = useElectron();
  const [searchQuery, setSearchQuery] = useState('');
  const [gameToUninstall, setGameToUninstall] = useState<InstalledGame | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [gamesWithImages, setGamesWithImages] = useState<GameWithImage[]>([]);
  const navigate = useNavigate();

  // Auto-scan on mount
  useEffect(() => {
    if (isElectron) {
      scanForGames();
    }
  }, [isElectron]);

  // Fetch game images when installedGames changes
  useEffect(() => {
    const fetchGameImages = async () => {
      if (installedGames.length === 0) {
        setGamesWithImages([]);
        return;
      }

      const gameIds = installedGames.map(g => g.gameId);
      const { data: gamesData } = await supabase
        .from('games')
        .select('id, image, genre')
        .in('id', gameIds);

      const gamesMap = new Map(gamesData?.map(g => [g.id, { image: g.image, genre: g.genre }]) || []);
      
      const enrichedGames = installedGames.map(game => ({
        ...game,
        image: gamesMap.get(game.gameId)?.image,
        genre: gamesMap.get(game.gameId)?.genre
      }));

      setGamesWithImages(enrichedGames);
    };

    fetchGameImages();
  }, [installedGames]);

  const scanForGames = async () => {
    if (!isElectron || isScanning) return;
    
    setIsScanning(true);
    try {
      const { data: websiteGames, error } = await supabase
        .from('games')
        .select('id, title, slug');
      
      if (error) {
        console.error('Error fetching games:', error);
        toast.error('فشل في جلب قائمة الألعاب');
        return;
      }

      const result = await scanGamesFolder(websiteGames || []);
      
      if (result?.success) {
        toast.success('تم فحص المجلد بنجاح');
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredGames = gamesWithImages.filter((game) =>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={scanForGames}
            disabled={isScanning}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            فحص المجلد
          </Button>
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
              onViewPage={() => navigate(`/${game.gameSlug}`)}
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
  onUninstall,
  onViewPage
}: {
  game: GameWithImage;
  onLaunch: () => void;
  onOpenFolder: () => void;
  onUninstall: () => void;
  onViewPage: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden animate-fade-in hover:border-primary/50 transition-all group">
      {/* Game Image */}
      <div 
        className="relative h-32 bg-gradient-to-br from-muted/50 to-muted cursor-pointer overflow-hidden"
        onClick={onViewPage}
      >
        {game.image && !imageError ? (
          <>
            <img
              src={game.image}
              alt={game.gameTitle}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-muted-foreground/30 animate-pulse" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        
        {/* Genre badge */}
        {game.genre && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/80 backdrop-blur-sm rounded text-xs text-primary-foreground">
            {game.genre.split(',')[0].trim()}
          </div>
        )}
        
        {/* View page icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onViewPage(); }}
          className="absolute top-2 left-2 w-8 h-8 bg-background/50 backdrop-blur-sm text-foreground/70 hover:text-foreground hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Game Info */}
      <div className="p-4 space-y-3">
        <div className="cursor-pointer" onClick={onViewPage}>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {game.gameTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatSize(game.size)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onLaunch}
            className="flex-1 gap-2 bg-primary hover:bg-primary/90"
            size="sm"
          >
            <Play className="w-4 h-4" />
            تشغيل
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenFolder}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
            title="فتح المجلد"
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onUninstall}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            title="إلغاء التثبيت"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LibraryTab;