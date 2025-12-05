import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface RatingInfo {
  userRating: number | null;
  averageRating: number;
  totalRatings: number;
}

export const useGameRating = (gameId: string) => {
  const { user } = useAuth();
  const [ratingInfo, setRatingInfo] = useState<RatingInfo>({
    userRating: null,
    averageRating: 0,
    totalRatings: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchRating = useCallback(async () => {
    if (!gameId) return;

    // Fetch user's rating
    if (user?.id) {
      const { data: userRating } = await supabase
        .from('game_ratings')
        .select('rating')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .single();

      if (userRating) {
        setRatingInfo(prev => ({ ...prev, userRating: userRating.rating }));
      }
    }

    // Fetch average rating
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
  }, [gameId, user?.id]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  const submitRating = async (rating: number) => {
    if (!user?.id) {
      toast.error('يجب تسجيل الدخول للتقييم');
      return false;
    }
    
    if (!gameId) return false;

    const { error } = await supabase
      .from('game_ratings')
      .upsert({
        user_id: user.id,
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
    refetch: fetchRating,
    isLoggedIn: !!user
  };
};
