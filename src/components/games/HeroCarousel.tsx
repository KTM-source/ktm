import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Download, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseRichText } from "@/components/admin/RichTextEditor";
import { Game } from "@/hooks/useGames";

interface HeroCarouselProps {
  games: Game[];
}

export const HeroCarousel = ({ games }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Filter games: rating >= 4.2 AND created in the last week
  // Sort to show specific games first
  const heroGames = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const filtered = games.filter(game => {
      const rating = game.rating || 0;
      const createdAt = new Date(game.created_at);
      return rating >= 4.2 && createdAt >= oneWeekAgo;
    });

    // Custom sort: The Last of Us first, Red Dead Redemption 2 second
    return filtered.sort((a, b) => {
      const slugA = a.slug.toLowerCase();
      const slugB = b.slug.toLowerCase();
      
      if (slugA.includes('last-of-us-part-ii')) return -1;
      if (slugB.includes('last-of-us-part-ii')) return 1;
      if (slugA.includes('red-dead-redemption-2')) return -1;
      if (slugB.includes('red-dead-redemption-2')) return 1;
      
      // Then sort by created_at descending
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [games]);

  useEffect(() => {
    if (!isAutoPlaying || heroGames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroGames.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroGames.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  if (!heroGames.length) return null;
  
  const currentGame = heroGames[currentIndex];
  const bgImage = currentGame.background_image || currentGame.image;

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Images */}
      {heroGames.map((game, index) => (
        <div
          key={game.id}
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-out",
            index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
        >
          <img
            src={game.background_image || game.image}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div 
          className={cn(
            "max-w-2xl space-y-6 transition-all duration-700",
            "animate-fade-in"
          )} 
          key={currentIndex}
        >
          {/* Category & Rating */}
          <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="px-4 py-1.5 bg-primary/90 text-primary-foreground text-sm font-bold rounded-full">
              {currentGame.genre || currentGame.category}
            </span>
            {currentGame.rating && (
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-white">{currentGame.rating}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 
            className="font-display text-5xl md:text-7xl font-black text-white leading-tight animate-slide-up drop-shadow-2xl"
            style={{ animationDelay: '0.2s' }}
          >
            {currentGame.title}
          </h1>

          {/* Description */}
          <div 
            className="text-lg md:text-xl text-gray-200 line-clamp-3 max-w-xl animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            {parseRichText(currentGame.description)}
          </div>

          {/* Download Button */}
          <Link 
            to={`/${currentGame.slug}`} 
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-400 text-primary-foreground font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Download className="w-5 h-5" />
            <span>تحميل الآن</span>
          </Link>
        </div>
      </div>

      {/* Dots Navigation */}
      {heroGames.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {heroGames.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                index === currentIndex 
                  ? "w-10 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                  : "w-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}

      {/* Side Navigation Arrows (hidden on mobile) */}
      {heroGames.length > 1 && (
        <>
          <button
            onClick={() => goToSlide(currentIndex === 0 ? heroGames.length - 1 : currentIndex - 1)}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 glass-card rounded-full items-center justify-center hover:bg-primary/20 transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => goToSlide((currentIndex + 1) % heroGames.length)}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 glass-card rounded-full items-center justify-center hover:bg-primary/20 transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};