import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserId } from './useUserId';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  game_id: string;
  collection_name: string;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFavorites(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (gameId: string, collectionName: string = 'المفضلة') => {
    const userId = getUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, game_id: gameId, collection_name: collectionName });

    if (error) {
      if (error.code === '23505') {
        toast.error('اللعبة موجودة بالفعل في المفضلة');
      }
      return false;
    }

    toast.success('تمت الإضافة للمفضلة ⭐');
    fetchFavorites();
    return true;
  };

  const removeFavorite = async (gameId: string) => {
    const userId = getUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId);

    if (error) return false;

    toast.success('تمت الإزالة من المفضلة');
    fetchFavorites();
    return true;
  };

  const isFavorite = (gameId: string) => {
    return favorites.some(f => f.game_id === gameId);
  };

  const toggleFavorite = async (gameId: string) => {
    if (isFavorite(gameId)) {
      return removeFavorite(gameId);
    }
    return addFavorite(gameId);
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
};
