import { Layout } from "@/components/layout/Layout";
import { FeaturedCarousel } from "@/components/games/FeaturedCarousel";
import { GameCard } from "@/components/games/GameCard";
import { CategoryCard } from "@/components/games/CategoryCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { featuredGames, recentGames, categories, games } from "@/data/games";
import { Sparkles, Zap, Shield, Clock } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      {/* Hero Carousel */}
      <FeaturedCarousel games={featuredGames} />

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
      <section className="container mx-auto px-4 py-8">
        <SectionHeader
          title="Categories"
          subtitle="Browse by genre"
          href="/categories"
        />
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </section>

      {/* Recently Added */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Recently Added"
          subtitle="Latest games added to the library"
          href="/recent"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {recentGames.slice(0, 12).map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>
      </section>

      {/* All Games */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeader
          title="All Games"
          subtitle="Browse our full library"
          href="/games"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {games.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 gradient-text">
              Massive Game Library
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "5000+", label: "Games Available" },
                { value: "1M+", label: "Monthly Downloads" },
                { value: "99%", label: "Success Rate" },
                { value: "24/7", label: "Support" },
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
