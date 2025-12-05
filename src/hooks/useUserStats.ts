import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserStats {
  id: string;
  user_id: string;
  games_viewed: number;
  games_downloaded: number;
  favorites_count: number;
  chat_messages_sent: number;
  total_time_spent: number;
  first_visit: string;
  last_visit: string;
  streak_days: number;
  longest_streak: number;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create new stats record
      const { data: newData } = await supabase
        .from('user_stats')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (newData) setStats(newData);
    } else if (data) {
      // Update last visit and streak
      const lastVisit = new Date(data.last_visit);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      
      let newStreakDays = data.streak_days;
      let newLongestStreak = data.longest_streak;

      if (diffDays === 1) {
        newStreakDays += 1;
        if (newStreakDays > newLongestStreak) {
          newLongestStreak = newStreakDays;
        }
      } else if (diffDays > 1) {
        newStreakDays = 1;
      }

      if (diffDays >= 1) {
        await supabase
          .from('user_stats')
          .update({ 
            last_visit: now.toISOString(),
            streak_days: newStreakDays,
            longest_streak: newLongestStreak
          })
          .eq('user_id', user.id);
      }

      setStats({ ...data, streak_days: newStreakDays, longest_streak: newLongestStreak });
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const incrementStat = async (stat: 'games_viewed' | 'games_downloaded' | 'favorites_count' | 'chat_messages_sent') => {
    if (!user?.id || !stats) return;

    const newValue = (stats[stat] || 0) + 1;
    
    await supabase
      .from('user_stats')
      .update({ [stat]: newValue })
      .eq('user_id', user.id);

    setStats(prev => prev ? { ...prev, [stat]: newValue } : null);
  };

  return {
    stats,
    isLoading,
    incrementStat,
    refetch: fetchStats
  };
};
