import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { GameCard } from "@/components/games/GameCard";
import { games, categories } from "@/data/games";
import { Search, Filter, Grid3X3, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const Games = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid");

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || game.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            كل الألعاب
          </h1>
          <p className="text-muted-foreground">
            اكتشف مكتبتنا الضخمة من الألعاب
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن لعبة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-full pr-10 text-right"
              dir="rtl"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-1 md:flex-none overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-300",
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground"
                )}
              >
                الكل
              </button>
              {categories.slice(0, 5).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-300",
                    selectedCategory === category.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded transition-all duration-300",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("large")}
                className={cn(
                  "p-2 rounded transition-all duration-300",
                  viewMode === "large"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-muted-foreground">
          تم العثور على <span className="text-primary font-bold">{filteredGames.length}</span> لعبة
        </div>

        {/* Games Grid */}
        <div
          className={cn(
            "grid gap-4 md:gap-6",
            viewMode === "grid"
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {filteredGames.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              لم يتم العثور على ألعاب
            </h3>
            <p className="text-muted-foreground">
              جرب البحث بكلمات أخرى أو اختر تصنيف مختلف
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Games;
