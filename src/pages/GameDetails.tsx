import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { GameCard } from "@/components/games/GameCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useGame, useGames } from "@/hooks/useGames";
import { parseRichText } from "@/components/admin/RichTextEditor";
import { ScreenshotGallery } from "@/components/games/ScreenshotGallery";
import { AdditionalFiles } from "@/components/games/AdditionalFiles";
import { addViewedGame } from "@/hooks/usePersonalizedRecommendations";
import { GameChatbot } from "@/components/games/GameChatbot";
import { FavoriteButton } from "@/components/games/FavoriteButton";
import { GameRating } from "@/components/games/GameRating";
import { GameComments } from "@/components/games/GameComments";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/hooks/useAuth";
import {
  Download,
  Star,
  Eye,
  User,
  ChevronRight,
  Check,
  ArrowRight,
  Loader2,
  Calendar,
  HardDrive,
  Tag,
} from "lucide-react";

const GameDetails = () => {
  const { slug } = useParams();
  const { game, relatedGames, isLoading } = useGame(slug || "");
  const { incrementViews } = useGames();
  const { unlockAchievement } = useAchievements();
  const { incrementStat } = useUserStats();
  const { user } = useAuth();

  useEffect(() => {
    if (game) {
      incrementViews(game.id);
      addViewedGame(game.id);
      incrementStat('games_viewed');
      
      // Check for night owl achievement
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) {
        unlockAchievement('night_owl');
      }
    }
  }, [game?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">جاري تحميل اللعبة...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
          <div className="text-8xl mb-6 animate-bounce-slow">😕</div>
          <h1 className="font-display text-3xl font-bold mb-4">اللعبة غير موجودة</h1>
          <p className="text-muted-foreground mb-8">عذراً، لم نتمكن من العثور على اللعبة المطلوبة</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 group">
            <span className="relative z-10">العودة للرئيسية</span>
            <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </Layout>
    );
  }

  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get plain text description for meta (strip formatting)
  const plainDescription = game.description
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\{[^:]+:([^}]+)\}/g, '$1')
    .replace(/^- /gm, '')
    .substring(0, 160);

  const pageUrl = `https://ktm.lovable.app/${game.slug}`;
  const gameImage = game.image || game.background_image;

  return (
    <Layout>
      <Helmet>
        <title>{game.title} - Free Download | KTM</title>
        <meta name="description" content={plainDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={`${game.title} - Free Download | KTM`} />
        <meta property="og:description" content={plainDescription} />
        <meta property="og:image" content={gameImage || ''} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={`${game.title} - Free Download | KTM`} />
        <meta name="twitter:description" content={plainDescription} />
        <meta name="twitter:image" content={gameImage || ''} />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <img
          src={game.background_image || game.image}
          alt={game.title}
          className="w-full h-full object-cover animate-blur-in"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        
        {/* Animated glow effect */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      </div>

      <div className="container mx-auto px-4 -mt-48 relative z-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 animate-fade-in">
          <Link to="/" className="hover:text-primary transition-colors duration-300">الرئيسية</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/categories/${game.category}`} className="hover:text-primary transition-colors duration-300 capitalize">
            {game.category}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{game.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-morphism p-6 md:p-8 animate-slide-up">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 gradient-text">
                {game.title} Free Download
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <FavoriteButton gameId={game.id} variant="full" />
                {game.developer && (
                  <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full animate-scale-in">
                    <User className="w-4 h-4 text-primary" />
                    <span>{game.developer}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <Eye className="w-4 h-4 text-primary" />
                  <span>{game.views.toLocaleString()} مشاهدة</span>
                </div>
              </div>

              {/* User Rating */}
              <div className="mb-6 p-4 rounded-xl bg-card/30 border border-border/30">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">قيّم هذه اللعبة</h4>
                <GameRating gameId={game.id} size="lg" />
              </div>

              <div className="text-muted-foreground leading-relaxed mb-8 text-lg">
                {parseRichText(game.description)}
              </div>

              {/* Screenshots Gallery */}
              {game.screenshots && game.screenshots.length > 0 && (
                <div className="mb-8">
                  <ScreenshotGallery screenshots={game.screenshots} />
                </div>
              )}

              {game.features && game.features.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg mb-4">مميزات اللعبة</h3>
                  <ul className="space-y-3">
                    {game.features.map((feature, index) => (
                      <li 
                        key={index} 
                        className="flex items-start gap-3 text-muted-foreground animate-slide-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* System Requirements */}
            {game.system_requirements_minimum && (
              <div className="glass-morphism p-6 md:p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-primary" />
                  متطلبات النظام
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-primary mb-3">الحد الأدنى</h3>
                    <div className="space-y-2 text-sm">
                      {game.system_requirements_minimum.os && (
                        <p className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">نظام التشغيل</span>
                          <span>{game.system_requirements_minimum.os}</span>
                        </p>
                      )}
                      {game.system_requirements_minimum.processor && (
                        <p className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">المعالج</span>
                          <span>{game.system_requirements_minimum.processor}</span>
                        </p>
                      )}
                      {game.system_requirements_minimum.memory && (
                        <p className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">الذاكرة</span>
                          <span>{game.system_requirements_minimum.memory}</span>
                        </p>
                      )}
                      {game.system_requirements_minimum.graphics && (
                        <p className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">كرت الشاشة</span>
                          <span>{game.system_requirements_minimum.graphics}</span>
                        </p>
                      )}
                      {game.system_requirements_minimum.storage && (
                        <p className="flex justify-between py-2">
                          <span className="text-muted-foreground">التخزين</span>
                          <span>{game.system_requirements_minimum.storage}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {game.system_requirements_recommended && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-secondary mb-3">الموصى به</h3>
                      <div className="space-y-2 text-sm">
                        {game.system_requirements_recommended.os && (
                          <p className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-muted-foreground">نظام التشغيل</span>
                            <span>{game.system_requirements_recommended.os}</span>
                          </p>
                        )}
                        {game.system_requirements_recommended.processor && (
                          <p className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-muted-foreground">المعالج</span>
                            <span>{game.system_requirements_recommended.processor}</span>
                          </p>
                        )}
                        {game.system_requirements_recommended.memory && (
                          <p className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-muted-foreground">الذاكرة</span>
                            <span>{game.system_requirements_recommended.memory}</span>
                          </p>
                        )}
                        {game.system_requirements_recommended.graphics && (
                          <p className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-muted-foreground">كرت الشاشة</span>
                            <span>{game.system_requirements_recommended.graphics}</span>
                          </p>
                        )}
                        {game.system_requirements_recommended.storage && (
                          <p className="flex justify-between py-2">
                            <span className="text-muted-foreground">التخزين</span>
                            <span>{game.system_requirements_recommended.storage}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-morphism p-6 sticky top-24 animate-slide-in-right">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                معلومات اللعبة
              </h3>
              <div className="space-y-4 text-sm mb-6">
                {game.genre && (
                  <div className="flex justify-between py-2 border-b border-border/30 animate-fade-in">
                    <span className="text-muted-foreground">النوع</span>
                    <span className="font-medium">{game.genre}</span>
                  </div>
                )}
                {game.developer && (
                  <div className="flex justify-between py-2 border-b border-border/30 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                    <span className="text-muted-foreground">المطور</span>
                    <span className="font-medium">{game.developer}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border/30 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <span className="text-muted-foreground">الحجم</span>
                  <span className="font-medium">{game.size}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                  <span className="text-muted-foreground">الإصدار</span>
                  <span className="version-badge">{game.version}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <span className="text-muted-foreground">تاريخ الإضافة</span>
                  <span className="font-medium text-xs">{formattedDate(game.created_at)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                  <span className="text-muted-foreground">آخر تحديث</span>
                  <span className="font-medium text-xs">{formattedDate(game.created_at)}</span>
                </div>
                <div className="py-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <span className="text-primary font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Pre-Installed Game
                  </span>
                </div>
              </div>

              {/* Additional Files */}
              {game.additional_files && game.additional_files.length > 0 && (
                <AdditionalFiles files={game.additional_files} />
              )}

              {game.download_link && (
                <button
                  onClick={() => window.location.href = game.download_link!}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg animate-scale-in"
                  style={{ animationDelay: '0.3s' }}
                >
                  <Download className="w-5 h-5 relative z-10" />
                  <span className="font-bold relative z-10">تحميل اللعبة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <section className="py-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <GameComments gameId={game.id} />
        </section>

        {/* Related Games */}
        {relatedGames.length > 0 && (
          <section className="py-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <SectionHeader title="ألعاب مشابهة" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedGames.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* AI Chatbot */}
      <GameChatbot
        gameContext={{
          title: game.title,
          developer: game.developer,
          genre: game.genre,
          category: game.category,
          size: game.size,
          version: game.version,
          description: game.description,
        }}
      />
    </Layout>
  );
};

export default GameDetails;
