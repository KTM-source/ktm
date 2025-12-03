import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { GameCard } from "@/components/games/GameCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { games } from "@/data/games";
import { supabase } from "@/integrations/supabase/client";
import {
  Download,
  Star,
  Monitor,
  Calendar,
  HardDrive,
  Tag,
  ArrowRight,
  Eye,
  User,
  Gamepad2,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";

interface ScrapedGame {
  title: string;
  slug: string;
  image: string;
  backgroundImage: string;
  version: string;
  category: string;
  size: string;
  description: string;
  features: string[];
  systemRequirements: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
  developer: string;
  genre: string;
  downloadLink: string;
  screenshots: string[];
}

const GameDetails = () => {
  const { slug } = useParams();
  const [scrapedGame, setScrapedGame] = useState<ScrapedGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First check local data
  const localGame = games.find((g) => g.slug === slug);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to scrape from steamrip
        const steamripUrl = `https://steamrip.com/${slug}/`;
        
        const { data, error: fnError } = await supabase.functions.invoke('scrape-game', {
          body: { action: 'scrape-single', url: steamripUrl }
        });
        
        if (fnError) {
          console.error('Function error:', fnError);
          setError('Failed to fetch game data');
        } else if (data?.game) {
          setScrapedGame(data.game);
        }
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Failed to load game data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [slug]);

  // Use scraped data if available, otherwise fall back to local
  const game = scrapedGame || localGame;

  if (!game && !isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="font-display text-2xl font-bold mb-4">Game Not Found</h1>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <span className="relative z-10">Back to Home</span>
            <ArrowRight className="w-4 h-4 relative z-10" />
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedGames = games
    .filter((g) => g.category === (game?.category || localGame?.category) && g.slug !== slug)
    .slice(0, 6);

  // Merge data - prefer scraped data
  const displayGame = {
    title: scrapedGame?.title || localGame?.title || '',
    slug: slug || '',
    image: scrapedGame?.image || localGame?.image || '',
    backgroundImage: scrapedGame?.backgroundImage || localGame?.backgroundImage || localGame?.image || '',
    version: scrapedGame?.version || localGame?.version || '',
    category: scrapedGame?.category || localGame?.category || '',
    size: scrapedGame?.size || localGame?.size || '',
    description: scrapedGame?.description || localGame?.description || '',
    features: scrapedGame?.features || localGame?.features || [],
    systemRequirements: scrapedGame?.systemRequirements || localGame?.systemRequirements?.minimum || {
      os: 'Windows 10',
      processor: 'Intel Core i5',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 1060',
      storage: '50 GB'
    },
    developer: scrapedGame?.developer || localGame?.developer || '',
    genre: scrapedGame?.genre || localGame?.genre || '',
    downloadLink: scrapedGame?.downloadLink || localGame?.downloadLinks?.[0]?.url || '#',
    screenshots: scrapedGame?.screenshots || localGame?.screenshots || [],
    rating: localGame?.rating,
    platforms: localGame?.platforms || ['PC', 'Windows'],
    views: localGame?.views
  };

  return (
    <Layout>
      {/* Hero Section with Background */}
      <div className="relative h-[60vh] min-h-[500px]">
        <img
          src={displayGame.backgroundImage}
          alt={displayGame.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-48 relative z-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/categories/${displayGame.category.toLowerCase()}`} className="hover:text-primary transition-colors">
            {displayGame.category}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{displayGame.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="glass-card p-6 animate-slide-up">
              {isLoading && (
                <div className="flex items-center gap-2 text-primary mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading latest data...</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {displayGame.genre?.split(", ").slice(0, 4).map((g) => (
                  <span key={g} className="category-badge">{g}</span>
                ))}
              </div>
              
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                {displayGame.title} Free Download
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {displayGame.developer && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{displayGame.developer}</span>
                  </div>
                )}
                {displayGame.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{displayGame.views.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              {displayGame.rating && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= displayGame.rating!
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-foreground font-bold">{displayGame.rating}</span>
                  <span className="text-muted-foreground">/ 5</span>
                </div>
              )}

              {/* Main Image */}
              <div className="rounded-xl overflow-hidden mb-6">
                <img
                  src={displayGame.backgroundImage}
                  alt={displayGame.title}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Description */}
              <h2 className="font-display text-xl font-bold text-foreground mb-3">
                {displayGame.title} Direct Download
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {displayGame.description}
              </p>

              {/* Features */}
              {displayGame.features && displayGame.features.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {displayGame.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Screenshots */}
            {displayGame.screenshots && displayGame.screenshots.length > 0 && (
              <div className="glass-card p-6 animate-slide-up stagger-2">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  SCREENSHOTS
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {displayGame.screenshots.map((screenshot, index) => (
                    <a
                      key={index}
                      href={screenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
                    >
                      <img
                        src={screenshot}
                        alt={`${displayGame.title} screenshot ${index + 1}`}
                        className="w-full h-auto"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* System Requirements */}
            <div className="glass-card p-6 animate-slide-up stagger-3">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                SYSTEM REQUIREMENTS
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <strong className="text-foreground">OS:</strong>
                  <span className="text-muted-foreground">{displayGame.systemRequirements.os}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <strong className="text-foreground">Processor:</strong>
                  <span className="text-muted-foreground">{displayGame.systemRequirements.processor}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <strong className="text-foreground">Memory:</strong>
                  <span className="text-muted-foreground">{displayGame.systemRequirements.memory}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <strong className="text-foreground">Graphics:</strong>
                  <span className="text-muted-foreground">{displayGame.systemRequirements.graphics}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <strong className="text-foreground">Storage:</strong>
                  <span className="text-muted-foreground">{displayGame.systemRequirements.storage}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Info Card */}
            <div className="glass-card p-6 sticky top-24 animate-slide-up stagger-4">
              <h3 className="font-display font-bold text-foreground mb-4">GAME INFO</h3>
              
              <div className="space-y-3 mb-6">
                {displayGame.genre && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-primary">+</span>
                    <span className="text-muted-foreground">Genre:</span>
                    <span className="text-foreground">{displayGame.genre}</span>
                  </div>
                )}
                {displayGame.developer && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-primary">+</span>
                    <span className="text-muted-foreground">Developer:</span>
                    <span className="text-foreground">{displayGame.developer}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-primary">+</span>
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="text-foreground">{displayGame.platforms.join(", ")}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-primary">+</span>
                  <span className="text-muted-foreground">Game Size:</span>
                  <span className="text-foreground">{displayGame.size}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-primary">+</span>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="text-foreground font-mono">{displayGame.version}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-primary">+</span>
                  <span className="text-foreground font-medium">Pre-Installed Game</span>
                </div>
              </div>

              {/* Download Button */}
              <div className="space-y-3">
                {displayGame.downloadLink && displayGame.downloadLink !== '#' ? (
                  <>
                    <p className="text-sm font-bold text-primary text-center">GOFILE</p>
                    <a
                      href={displayGame.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                    >
                      <Download className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 font-bold">DOWNLOAD HERE</span>
                    </a>
                  </>
                ) : (
                  <button 
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                    <span className="relative z-10 font-bold">Loading...</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Games */}
        {relatedGames.length > 0 && (
          <section className="py-16">
            <SectionHeader
              title="Related Games"
              subtitle={`More ${displayGame.category} games`}
              href={`/categories/${displayGame.category.toLowerCase()}`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {relatedGames.map((relatedGame, index) => (
                <GameCard key={relatedGame.id} game={relatedGame} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default GameDetails;
