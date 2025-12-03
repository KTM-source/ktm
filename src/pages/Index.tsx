import { Layout } from "@/components/layout/Layout";
import { FeaturedCarousel } from "@/components/games/FeaturedCarousel";
import { GameCard } from "@/components/games/GameCard";
import { CategoryCard } from "@/components/games/CategoryCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useGames } from "@/hooks/useGames";
import { Sparkles, Zap, Shield, Clock, Loader2 } from "lucide-react";

const Index = () => {
  const { games, categories, isLoading } = useGames();
  
  const featuredGames = games.filter(g => g.rating && g.rating >= 4.5).slice(0, 5);
  const recentGames = games.slice(0, 12);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Carousel */}
      {featuredGames.length > 0 && <FeaturedCarousel games={featuredGames} />}

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap, title: "سرعة عالية", desc: "تحميل سريع ومباشر" },
            { icon: Shield, title: "آمن 100%", desc: "ملفات نظيفة ومفحوصة" },
            { icon: Clock, title: "تحديث مستمر", desc: "أحدث الإصدارات" },
            { icon: Sparkles, title: "جودة عالية", desc: "ألعاب كاملة Pre-Installed" },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card p-4 text-center group hover:border-primary/50 transition-all duration-300 opacity-0 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <feature.icon className="w-8 h-8 text-primary mx-auto mb-2 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-bold text-foreground">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <SectionHeader
            title="التصنيفات"
            subtitle="تصفح حسب النوع"
            href="/categories"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      {recentGames.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <SectionHeader
            title="أحدث الألعاب"
            subtitle="آخر الألعاب المضافة للمكتبة"
            href="/recent"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {recentGames.map((game, index) => (
              <GameCard key={game.id} game={game} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="text-8xl mb-6">🎮</div>
          <h2 className="font-display text-2xl font-bold mb-4">لا توجد ألعاب حالياً</h2>
          <p className="text-muted-foreground">سيتم إضافة الألعاب قريباً</p>
        </section>
      )}

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="glass-morphism p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 gradient-text">
              KTM Game Library
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: games.length, label: "لعبة متاحة" },
                { value: "1M+", label: "تحميل شهرياً" },
                { value: "99%", label: "نسبة النجاح" },
                { value: "24/7", label: "دعم فني" },
              ].map((stat, index) => (
                <div key={index} className="opacity-0 animate-scale-in" style={{ animationDelay: `${index * 0.15}s` }}>
                  <div className="font-display text-3xl md:text-4xl font-black text-primary neon-text">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;