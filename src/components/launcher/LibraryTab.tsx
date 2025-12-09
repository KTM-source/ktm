import { useState, useEffect } from 'react';
import { Library, Play, Trash2, FolderOpen, Search, HardDrive, RefreshCw, ExternalLink, Gamepad2, Star, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useElectron, InstalledGame } from '@/hooks/useElectron';
import { useRunningGames } from '@/hooks/useRunningGames';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
  rating?: number;
}

const LibraryTab = () => {
  const { installedGames, launchGame, uninstallGame, openFolder, scanGamesFolder, isElectron } = useElectron();
  const { isGameRunning, formatPlaytime, getGamePlaytime } = useRunningGames();
  const [searchQuery, setSearchQuery] = useState('');
  const [gameToUninstall, setGameToUninstall] = useState<InstalledGame | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [gamesWithImages, setGamesWithImages] = useState<GameWithImage[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
        .select('id, image, genre, rating')
        .in('id', gameIds);

      const gamesMap = new Map(gamesData?.map(g => [g.id, { image: g.image, genre: g.genre, rating: g.rating }]) || []);
      
      const enrichedGames = installedGames.map(game => ({
        ...game,
        image: gamesMap.get(game.gameId)?.image,
        genre: gamesMap.get(game.gameId)?.genre,
        rating: gamesMap.get(game.gameId)?.rating
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
      {/* Header with stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
            <Library className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">مكتبتي</h2>
            <p className="text-sm text-muted-foreground">ألعابك المثبتة في مكان واحد</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats Cards */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{installedGames.length} لعبة</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
            <HardDrive className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">{formatSize(totalSize)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={scanForGames}
            disabled={isScanning}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            فحص
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="ابحث في مكتبتك..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-12 bg-muted/30 border-border/50 h-12 rounded-xl text-base"
        />
      </div>

      {filteredGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="p-6 rounded-full bg-muted/30 mb-6">
            <Library className="w-16 h-16 opacity-30" />
          </div>
          <p className="text-xl font-medium mb-2">
            {searchQuery ? 'لم يتم العثور على ألعاب' : 'مكتبتك فارغة'}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'جرب كلمات بحث أخرى' : 'قم بتحميل ألعاب من المتجر لبدء مجموعتك'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((game) => (
            <GameCard
              key={game.gameId}
              game={game}
              isRunning={isGameRunning(game.gameId)}
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
  isRunning,
  onLaunch,
  onOpenFolder,
  onUninstall,
  onViewPage
}: {
  game: GameWithImage;
  isRunning: boolean;
  onLaunch: () => void;
  onOpenFolder: () => void;
  onUninstall: () => void;
  onViewPage: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden animate-fade-in hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Game Image */}
      <div 
        className="relative aspect-[16/10] bg-gradient-to-br from-muted/50 to-muted cursor-pointer overflow-hidden"
        onClick={onViewPage}
      >
        {game.image && !imageError ? (
          <>
            <img
              src={game.image}
              alt={game.gameTitle}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isHovered ? 'scale-110 brightness-75' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Gamepad2 className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <Gamepad2 className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-80" />
        
        {/* Hover Play Button */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            onClick={(e) => { e.stopPropagation(); onLaunch(); }}
            size="lg"
            className="gap-3 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/50 scale-110"
          >
            <Play className="w-5 h-5 fill-current" />
            تشغيل الآن
          </Button>
        </div>
        
        {/* Top badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
          {game.genre && (
            <span className="px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-lg text-xs font-medium text-foreground border border-border/50">
              {game.genre.split(',')[0].trim()}
            </span>
          )}
          {game.rating && (
            <span className="flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-lg text-xs font-medium text-yellow-400 border border-border/50">
              <Star className="w-3 h-3 fill-current" />
              {Number(game.rating).toFixed(1)}
            </span>
          )}
        </div>
        
        {/* View page icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onViewPage(); }}
          className={`absolute bottom-3 left-3 w-9 h-9 bg-background/70 backdrop-blur-sm text-foreground/70 hover:text-foreground hover:bg-background/90 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Game Info */}
      <div className="p-4 space-y-3">
        <div className="cursor-pointer" onClick={onViewPage}>
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-lg">
            {game.gameTitle}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" />
              {formatSize(game.size)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={onLaunch}
            disabled={isRunning}
            className={cn(
              "flex-1 gap-2 h-10",
              isRunning 
                ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30" 
                : "bg-primary hover:bg-primary/90"
            )}
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                قيد التشغيل
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                تشغيل
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenFolder}
            className="text-muted-foreground hover:text-foreground h-10 w-10"
            title="فتح المجلد"
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onUninstall}
            className="text-muted-foreground hover:text-destructive hover:border-destructive/50 h-10 w-10"
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