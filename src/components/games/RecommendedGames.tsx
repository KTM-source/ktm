import { GameCard } from "./GameCard";
import { usePersonalizedRecommendations, clearViewedGames } from "@/hooks/usePersonalizedRecommendations";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const RecommendedGames = () => {
  const { recommendations, isLoading, hasViewedGames, refresh } = usePersonalizedRecommendations();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearHistory = () => {
    setIsClearing(true);
    clearViewedGames();
    toast.success("تم مسح سجل المشاهدة");
    setTimeout(() => {
      refresh();
      setIsClearing(false);
    }, 500);
  };

  // Don't show section if user hasn't viewed any games
  if (!hasViewedGames) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-primary relative z-10" />
          </div>
        </div>
      </section>
    );
  }

  // Don't show if no recommendations
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-12 relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[250px] bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Special Header for Recommendations */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl blur-md opacity-50 animate-pulse" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border border-white/10">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  مُقترح لك
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                بناءً على الألعاب التي شاهدتها ✨
              </p>
            </div>
          </div>

          {/* Clear History Button */}
          <button
            onClick={handleClearHistory}
            disabled={isClearing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition-all duration-300 hover:scale-105 group"
          >
            <RotateCcw className={`w-4 h-4 transition-transform ${isClearing ? 'animate-spin' : 'group-hover:-rotate-180'} duration-500`} />
            <span>مسح السجل</span>
          </button>
        </div>
        
        {/* Animated gradient line */}
        <div className="mt-4 h-1 w-40 rounded-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient" />
      </div>

      {/* Recommendations Grid */}
      <div className="relative">
        {/* Glow border effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-xl opacity-50 animate-pulse" />
        
        <div className="relative glass-morphism p-6 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {recommendations.map((game, index) => (
              <div
                key={game.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GameCard game={game} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
