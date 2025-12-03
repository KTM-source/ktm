import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { GameCard } from "@/components/games/GameCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { games } from "@/data/games";
import {
  Download,
  Star,
  Monitor,
  Calendar,
  HardDrive,
  Tag,
  ArrowRight,
  Share2,
  Heart,
  ExternalLink,
  Eye,
  User,
  Gamepad2,
  ChevronRight,
} from "lucide-react";

const GameDetails = () => {
  const { slug } = useParams();
  const game = games.find((g) => g.slug === slug);

  if (!game) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="font-display text-2xl font-bold mb-4">اللعبة غير موجودة</h1>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <span className="relative z-10">العودة للرئيسية</span>
            <ArrowRight className="w-4 h-4 relative z-10" />
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedGames = games
    .filter((g) => g.category === game.category && g.id !== game.id)
    .slice(0, 6);

  return (
    <Layout>
      {/* Hero Section with Background */}
      <div className="relative h-[60vh] min-h-[500px]">
        <img
          src={game.backgroundImage || game.image}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-48 relative z-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/categories/${game.category.toLowerCase()}`} className="hover:text-primary transition-colors">
            {game.category}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{game.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="glass-card p-6 animate-slide-up">
              <div className="flex flex-wrap gap-2 mb-4">
                {game.genre?.split(", ").map((g) => (
                  <span key={g} className="category-badge">{g}</span>
                ))}
              </div>
              
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                {game.title} Free Download
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {game.developer && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{game.developer}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(game.releaseDate).toLocaleDateString("en-US")}</span>
                </div>
                {game.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{game.views.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              {game.rating && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= game.rating!
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-foreground font-bold">{game.rating}</span>
                  <span className="text-muted-foreground">/ 5</span>
                </div>
              )}

              {/* Main Image */}
              <div className="rounded-xl overflow-hidden mb-6">
                <img
                  src={game.backgroundImage || game.image}
                  alt={game.title}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Description */}
              <h2 className="font-display text-xl font-bold text-foreground mb-3">
                {game.title} Direct Download
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {game.description}
              </p>

              {/* Features */}
              {game.features && game.features.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {game.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">{feature.split(" – ")[0]}</strong> – {feature.split(" – ")[1] || ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Screenshots */}
            {game.screenshots && game.screenshots.length > 0 && (
              <div className="glass-card p-6 animate-slide-up stagger-2">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  SCREENSHOTS
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {game.screenshots.map((screenshot, index) => (
                    <a
                      key={index}
                      href={screenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
                    >
                      <img
                        src={screenshot}
                        alt={`${game.title} screenshot ${index + 1}`}
                        className="w-full h-auto"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* System Requirements */}
            {game.systemRequirements && (
              <div className="glass-card p-6 animate-slide-up stagger-3">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  SYSTEM REQUIREMENTS
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-primary font-bold mb-3 flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Minimum
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><strong>OS:</strong> {game.systemRequirements.minimum.os}</li>
                      <li><strong>Processor:</strong> {game.systemRequirements.minimum.processor}</li>
                      <li><strong>Memory:</strong> {game.systemRequirements.minimum.memory}</li>
                      <li><strong>Graphics:</strong> {game.systemRequirements.minimum.graphics}</li>
                      <li><strong>Storage:</strong> {game.systemRequirements.minimum.storage}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-secondary font-bold mb-3 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4" />
                      Recommended
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><strong>OS:</strong> {game.systemRequirements.recommended.os}</li>
                      <li><strong>Processor:</strong> {game.systemRequirements.recommended.processor}</li>
                      <li><strong>Memory:</strong> {game.systemRequirements.recommended.memory}</li>
                      <li><strong>Graphics:</strong> {game.systemRequirements.recommended.graphics}</li>
                      <li><strong>Storage:</strong> {game.systemRequirements.recommended.storage}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Info Card */}
            <div className="glass-card p-6 sticky top-24 animate-slide-up stagger-4">
              <h3 className="font-display font-bold text-foreground mb-4">GAME INFO</h3>
              
              <div className="space-y-3 mb-6">
                {game.genre && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Genre:</span>
                    <span className="text-foreground">{game.genre}</span>
                  </div>
                )}
                {game.developer && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Developer:</span>
                    <span className="text-foreground">{game.developer}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="text-foreground">{game.platforms.join(", ")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Game Size:</span>
                  <span className="text-foreground">{game.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="text-foreground font-mono">{game.version}</span>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 mb-4">
                <p className="text-xs text-muted-foreground text-center">Pre-Installed Game</p>
              </div>

              {/* Download Links */}
              {game.downloadLinks && game.downloadLinks.length > 0 && (
                <div className="space-y-3">
                  {game.downloadLinks.map((link, index) => (
                    <div key={index}>
                      <p className="text-sm font-bold text-foreground mb-2">{link.name}</p>
                      <a
                        href={link.url}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">DOWNLOAD HERE</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Share Buttons */}
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border/50">
                <button className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                  <Heart className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Games */}
        {relatedGames.length > 0 && (
          <section className="py-16">
            <SectionHeader
              title="Related Games"
              subtitle={`More ${game.category} games`}
              href={`/categories/${game.category.toLowerCase()}`}
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
