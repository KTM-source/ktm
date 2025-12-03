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
          <Link to="/games" className="btn-primary inline-flex items-center gap-2">
            <span className="relative z-10">العودة للألعاب</span>
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
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Meta */}
            <div className="glass-card p-6 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="category-badge mb-2 inline-block">{game.category}</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    {game.title}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Rating */}
              {game.rating && (
                <div className="flex items-center gap-2 mb-4">
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

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {game.description}
              </p>
            </div>

            {/* System Requirements */}
            <div className="glass-card p-6 animate-slide-up stagger-2">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                متطلبات النظام
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-primary font-bold mb-3">الحد الأدنى</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• نظام التشغيل: Windows 10 64-bit</li>
                    <li>• المعالج: Intel Core i5-4460</li>
                    <li>• الذاكرة: 8 GB RAM</li>
                    <li>• كرت الشاشة: NVIDIA GTX 960 4GB</li>
                    <li>• مساحة التخزين: {game.size}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-secondary font-bold mb-3">الموصى به</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• نظام التشغيل: Windows 11 64-bit</li>
                    <li>• المعالج: Intel Core i7-9700K</li>
                    <li>• الذاكرة: 16 GB RAM</li>
                    <li>• كرت الشاشة: NVIDIA RTX 3070</li>
                    <li>• مساحة التخزين: SSD {game.size}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Card */}
            <div className="glass-card p-6 sticky top-24 animate-slide-up stagger-3">
              <div className="space-y-4">
                {/* Info Grid */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">الإصدار:</span>
                    <span className="text-foreground font-bold">{game.version}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">الحجم:</span>
                    <span className="text-foreground font-bold">{game.size}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">تاريخ الإضافة:</span>
                    <span className="text-foreground font-bold">
                      {new Date(game.releaseDate).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Monitor className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">المنصات:</span>
                    <span className="text-foreground font-bold">
                      {game.platforms.join(" / ")}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <button className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4">
                  <Download className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">تحميل اللعبة</span>
                </button>

                {/* Alternative Links */}
                <div className="space-y-2">
                  <button className="w-full px-4 py-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    رابط بديل 1
                  </button>
                  <button className="w-full px-4 py-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    رابط بديل 2
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Games */}
        {relatedGames.length > 0 && (
          <section className="py-16">
            <SectionHeader
              title="ألعاب مشابهة"
              subtitle={`المزيد من ألعاب ${game.category}`}
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
