import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { GameCard } from "@/components/games/GameCard";
import { useGames, Category } from "@/hooks/useGames";
import { ChevronRight, Loader2, Gamepad2 } from "lucide-react";

const CategoryGames = () => {
  const { slug } = useParams();
  const { games, categories, isLoading } = useGames();

  const category = categories.find((c) => c.slug === slug);
  
  // Filter games by checking if genre contains the category slug
  const categoryGames = games.filter((g) => {
    if (!g.genre) return g.category === slug;
    const genres = g.genre.toLowerCase().split(",").map(genre => genre.trim());
    return genres.includes(slug || "") || g.category === slug;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce-slow">😕</div>
          <h1 className="font-display text-2xl font-bold mb-4">التصنيف غير موجود</h1>
          <Link to="/categories" className="btn-primary inline-flex items-center gap-2 group">
            <span className="relative z-10">تصفح التصنيفات</span>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 animate-fade-in">
            <Link to="/" className="hover:text-primary transition-colors duration-300">الرئيسية</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/categories" className="hover:text-primary transition-colors duration-300">التصنيفات</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{category.name}</span>
          </nav>

          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-24 h-24 glass-morphism rounded-3xl mb-6 text-5xl animate-float">
              {category.icon}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
              {category.name}
            </h1>
            <p className="text-muted-foreground text-lg">
              <span className="text-primary font-bold">{categoryGames.length}</span> لعبة متاحة في هذا التصنيف
            </p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-4 py-12">
        {categoryGames.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">لا توجد ألعاب حالياً</h2>
            <p className="text-muted-foreground mb-6">سيتم إضافة ألعاب قريباً في هذا التصنيف</p>
            <Link to="/games" className="btn-primary inline-flex items-center gap-2">
              تصفح كل الألعاب
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {categoryGames.map((game, index) => (
              <GameCard key={game.id} game={game} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Other Categories */}
      <div className="container mx-auto px-4 py-12">
        <div className="glass-morphism p-8 rounded-2xl text-center animate-fade-in">
          <h2 className="font-display text-2xl font-bold mb-4">تصفح تصنيفات أخرى</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories
              .filter((c) => c.slug !== slug)
              .map((cat, index) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span>{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryGames;

