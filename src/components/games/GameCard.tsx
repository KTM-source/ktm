import { Link } from "react-router-dom";
import { Download, Star, Monitor } from "lucide-react";
import { Game } from "@/types/game";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  index?: number;
}

export const GameCard = ({ game, index = 0 }: GameCardProps) => {
  return (
    <Link
      to={`/game/${game.slug}`}
      className={cn(
        "game-card group block opacity-0 animate-slide-up",
        `stagger-${(index % 6) + 1}`
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        
        {/* Version Badge */}
        <div className="absolute top-3 left-3">
          <span className="version-badge">{game.version}</span>
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3 flex gap-1">
          {game.platforms.map((platform) => (
            <span key={platform} className="platform-badge flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              {platform}
            </span>
          ))}
        </div>

        {/* Rating */}
        {game.rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold">{game.rating}</span>
          </div>
        )}

        {/* Download Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="btn-primary flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Download className="w-4 h-4" />
            <span className="relative z-10">تحميل</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {game.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="category-badge">{game.category}</span>
          <span className="text-xs text-muted-foreground">{game.size}</span>
        </div>
      </div>
    </Link>
  );
};
