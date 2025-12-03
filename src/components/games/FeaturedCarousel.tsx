import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Star, Play } from "lucide-react";
import { Game } from "@/types/game";
import { cn } from "@/lib/utils";

interface FeaturedCarouselProps {
  games: Game[];
}

export const FeaturedCarousel = ({ games }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [games.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    goToSlide(currentIndex === 0 ? games.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    goToSlide((currentIndex + 1) % games.length);
  };

  const currentGame = games[currentIndex];

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background Images */}
      {games.map((game, index) => (
        <div
          key={game.id}
          className={cn(
            "absolute inset-0 transition-all duration-1000",
            index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
        >
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl space-y-6 animate-fade-in" key={currentIndex}>
          {/* Category & Rating */}
          <div className="flex items-center gap-4">
            <span className="category-badge text-sm">{currentGame.category}</span>
            {currentGame.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold">{currentGame.rating}</span>
              </div>
            )}
            <span className="version-badge">{currentGame.version}</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-6xl font-black text-foreground neon-text">
            {currentGame.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground leading-relaxed">
            {currentGame.description}
          </p>

          {/* Info */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>الحجم: {currentGame.size}</span>
            <span>•</span>
            <span>{currentGame.platforms.join(" / ")}</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Link
              to={`/game/${currentGame.slug}`}
              className="btn-primary flex items-center gap-2 text-lg"
            >
              <Download className="w-5 h-5 relative z-10" />
              <span className="relative z-10">تحميل الآن</span>
            </Link>
            <Link
              to={`/game/${currentGame.slug}`}
              className="px-6 py-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              <span>المزيد</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass-card hover:bg-primary/20 hover:text-primary transition-all duration-300 hover-glow"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass-card hover:bg-primary/20 hover:text-primary transition-all duration-300 hover-glow"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {games.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "w-8 bg-primary animate-pulse-glow"
                : "bg-muted-foreground/50 hover:bg-primary/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};
