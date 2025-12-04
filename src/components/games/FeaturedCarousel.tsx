import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Star, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseRichText } from "@/components/admin/RichTextEditor";

interface FeaturedGame {
  id: string;
  title: string;
  slug: string;
  image: string;
  background_image?: string | null;
  backgroundImage?: string;
  version: string;
  category: string;
  size: string;
  description: string;
  developer?: string | null;
  rating?: number | null;
  platforms?: string[] | null;
}

interface FeaturedCarouselProps {
  games: FeaturedGame[];
}

export const FeaturedCarousel = ({ games }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || games.length <= 1) return;
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

  if (!games.length) return null;
  const currentGame = games[currentIndex];
  const bgImage = currentGame.background_image || currentGame.backgroundImage || currentGame.image;

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
      {games.map((game, index) => (
        <div
          key={game.id}
          className={cn(
            "absolute inset-0 transition-all duration-1000",
            index === currentIndex ? "opacity-100" : "opacity-0"
          )}
        >
          <img
            src={game.background_image || game.backgroundImage || game.image}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>
      ))}

      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl space-y-6" key={currentIndex}>
          <div className="flex items-center gap-4">
            <span className="category-badge">{currentGame.category}</span>
            {currentGame.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold">{currentGame.rating}</span>
              </div>
            )}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black text-foreground">
            {currentGame.title}
          </h1>
          <div className="text-lg text-muted-foreground line-clamp-3">{parseRichText(currentGame.description)}</div>
          <Link to={`/${currentGame.slug}`} className="btn-primary inline-flex items-center gap-2">
            <Download className="w-5 h-5 relative z-10" />
            <span className="relative z-10">تحميل الآن</span>
          </Link>
        </div>
      </div>

      {games.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {games.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex ? "w-8 bg-primary" : "bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};