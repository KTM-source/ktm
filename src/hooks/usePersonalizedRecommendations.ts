import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const VIEWED_GAMES_KEY = "ktm_viewed_games";
const MAX_VIEWED_GAMES = 10;

interface Game {
  id: string;
  title: string;
  slug: string;
  image: string;
  version: string;
  category: string;
  size: string;
  rating?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Get viewed games from localStorage
export const getViewedGames = (): string[] => {
  try {
    const stored = localStorage.getItem(VIEWED_GAMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Add a game to viewed games
export const addViewedGame = (gameId: string) => {
  try {
    const viewed = getViewedGames();
    // Remove if already exists (to move to front)
    const filtered = viewed.filter(id => id !== gameId);
    // Add to front
    filtered.unshift(gameId);
    // Keep only last N games
    const trimmed = filtered.slice(0, MAX_VIEWED_GAMES);
    localStorage.setItem(VIEWED_GAMES_KEY, JSON.stringify(trimmed));
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('viewedGamesUpdated'));
  } catch {
    // Ignore localStorage errors
  }
};

// Clear viewed games history
export const clearViewedGames = () => {
  try {
    localStorage.removeItem(VIEWED_GAMES_KEY);
    window.dispatchEvent(new CustomEvent('viewedGamesUpdated'));
  } catch {
    // Ignore localStorage errors
  }
};

export const usePersonalizedRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewedGames, setHasViewedGames] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Listen for real-time updates
    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener('viewedGamesUpdated', handleUpdate);
    return () => window.removeEventListener('viewedGamesUpdated', handleUpdate);
  }, [refresh]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      const viewedGameIds = getViewedGames();
      
      if (viewedGameIds.length === 0) {
        setHasViewedGames(false);
        setRecommendations([]);
        setIsLoading(false);
        return;
      }

      setHasViewedGames(true);

      try {
        // Get details of viewed games
        const { data: viewedGames } = await supabase
          .from("games")
          .select("id, category, genre, description")
          .in("id", viewedGameIds.slice(0, 5));

        if (!viewedGames || viewedGames.length === 0) {
          setIsLoading(false);
          return;
        }

        // Extract categories from viewed games
        const viewedCategories = new Set<string>();
        viewedGames.forEach(game => {
          if (game.category) {
            game.category.split(",").forEach(cat => viewedCategories.add(cat.trim().toLowerCase()));
          }
          if (game.genre) {
            game.genre.split(",").forEach(gen => viewedCategories.add(gen.trim().toLowerCase()));
          }
        });

        // Fetch games that match viewed categories, excluding already viewed games
        const { data: allGames } = await supabase
          .from("games")
          .select("*")
          .not("id", "in", `(${viewedGameIds.join(",")})`)
          .order("rating", { ascending: false })
          .limit(50);

        if (!allGames || allGames.length === 0) {
          setIsLoading(false);
          return;
        }

        // Score games based on category/genre match
        const scoredGames = allGames.map(game => {
          let score = 0;
          const gameCategories = new Set<string>();
          
          if (game.category) {
            game.category.split(",").forEach(cat => gameCategories.add(cat.trim().toLowerCase()));
          }
          if (game.genre) {
            game.genre.split(",").forEach(gen => gameCategories.add(gen.trim().toLowerCase()));
          }

          // Count matching categories
          gameCategories.forEach(cat => {
            if (viewedCategories.has(cat)) {
              score += 2;
            }
          });

          // Boost for high rating
          if (game.rating) {
            score += game.rating * 0.5;
          }

          return { ...game, score };
        });

        // Sort by score and take top 6
        const recommended = scoredGames
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);

        setRecommendations(recommended);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [refreshKey]);

  return { recommendations, isLoading, hasViewedGames, refresh };
};
