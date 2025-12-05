import { Link } from "react-router-dom";
import { Star, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "./FavoriteButton";

interface GameCardProps {
  game: {
    id: string;
    title: string;
    slug: string;
    image: string;
    version: string;
    category: string;
    genre?: string | null;
    size: string;
    rating?: number | null;
    platforms?: string[] | null;
    created_at?: string;
    updated_at?: string;
  };
  index?: number;
}

// Check if game was added within last 24 hours
const isNewGame = (createdAt?: string) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 24;
};

// Check if game was updated within last week
const isRecentlyUpdated = (updatedAt?: string, createdAt?: string) => {
  if (!updatedAt || !createdAt) return false;
  // Don't show "updated" tag if it's a new game
  if (isNewGame(createdAt)) return false;
  
  const updated = new Date(updatedAt);
  const created = new Date(createdAt);
  // Only show if updated after creation
  if (updated.getTime() <= created.getTime()) return false;
  
  const now = new Date();
  const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
};

export const GameCard = ({ game, index = 0 }: GameCardProps) => {
  const isNew = isNewGame(game.created_at);
  const isUpdated = isRecentlyUpdated(game.updated_at, game.created_at);

  return (
    <Link
      to={`/${game.slug}`}
      className={cn(
        "game-card group block opacity-0 animate-slide-up relative",
        `stagger-${(index % 6) + 1}`
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        
        {/* Favorite Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <FavoriteButton gameId={game.id} />
        </div>

        {/* New/Updated Tags - Top Left Corner */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {isNew && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/90 text-white backdrop-blur-sm font-bold animate-pulse">
              <Sparkles className="w-3 h-3" />
              جديد
            </span>
          )}
          {isUpdated && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/90 text-white backdrop-blur-sm font-bold">
              <RefreshCw className="w-3 h-3" />
              محدث
            </span>
          )}
        </div>

        {/* Rating */}
        {game.rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold">{game.rating}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {game.title} Free Download
        </h3>
        <div className="flex flex-col gap-2">
          {/* All Genres/Categories */}
          <div className="flex flex-wrap gap-1">
            {(game.genre || game.category).split(",").map((cat, idx) => (
              <span key={idx} className="category-badge text-[10px]">
                {cat.trim()}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{game.size}</span>
        </div>
      </div>
    </Link>
  );
};
