import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserId } from './useUserId';
import { toast } from 'sonner';

interface RatingInfo {
  userRating: number | null;
  averageRating: number;
  totalRatings: number;
}

export const useGameRating = (gameId: string) => {
  const [ratingInfo, setRatingInfo] = useState<RatingInfo>({
    userRating: null,
    averageRating: 0,
    totalRatings: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchRating = useCallback(async () => {
    if (!gameId) return;
    
    const userId = getUserId();

    if (userId) {
      const { data: userRating } = await supabase
        .from('game_ratings')
        .select('rating')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .single();

      if (userRating) {
        setRatingInfo(prev => ({ ...prev, userRating: userRating.rating }));
      }
    }

    const { data: ratings } = await supabase
      .from('game_ratings')
      .select('rating')
      .eq('game_id', gameId);

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      setRatingInfo(prev => ({
        ...prev,
        averageRating: Math.round(avg * 10) / 10,
        totalRatings: ratings.length
      }));
    }

    setIsLoading(false);
  }, [gameId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  const submitRating = async (rating: number) => {
    const userId = getUserId();
    if (!userId || !gameId) return false;

    const { error } = await supabase
      .from('game_ratings')
      .upsert({
        user_id: userId,
        game_id: gameId,
        rating
      }, {
        onConflict: 'user_id,game_id'
      });

    if (error) {
      toast.error('حدث خطأ في حفظ التقييم');
      return false;
    }

    toast.success('شكراً على تقييمك! ⭐');
    fetchRating();
    return true;
  };

  return {
    ...ratingInfo,
    isLoading,
    submitRating,
    refetch: fetchRating
  };
};
