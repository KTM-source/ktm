import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserId } from './useUserId';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_icon: string;
  unlocked_at: string;
}

export const ACHIEVEMENTS = {
  first_visit: { name: 'الزائر الأول', icon: '🎮', description: 'قمت بزيارة الموقع لأول مرة' },
  first_favorite: { name: 'المُفضِّل', icon: '⭐', description: 'أضفت أول لعبة للمفضلة' },
  collector: { name: 'جامع الألعاب', icon: '🏆', description: 'أضفت 10 ألعاب للمفضلة' },
  explorer: { name: 'المستكشف', icon: '🔍', description: 'شاهدت 20 لعبة مختلفة' },
  veteran: { name: 'المخضرم', icon: '🎖️', description: 'شاهدت 50 لعبة مختلفة' },
  downloader: { name: 'المُحمِّل', icon: '📥', description: 'قمت بتحميل أول لعبة' },
  mega_downloader: { name: 'المُحمِّل الخارق', icon: '🚀', description: 'قمت بتحميل 10 ألعاب' },
  chatty: { name: 'المتحدث', icon: '💬', description: 'أرسلت 10 رسائل للبوت' },
  social: { name: 'الاجتماعي', icon: '🤝', description: 'أرسلت 50 رسالة للبوت' },
  streak_3: { name: 'المواظب', icon: '🔥', description: 'زرت الموقع 3 أيام متتالية' },
  streak_7: { name: 'المدمن', icon: '💎', description: 'زرت الموقع 7 أيام متتالية' },
  rater: { name: 'الناقد', icon: '⚖️', description: 'قيّمت أول لعبة' },
  critic: { name: 'الناقد المحترف', icon: '🎬', description: 'قيّمت 10 ألعاب' },
  night_owl: { name: 'بومة الليل', icon: '🦉', description: 'تصفحت الموقع بعد منتصف الليل' },
};

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const fetchAchievements = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (!error && data) {
      setAchievements(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockAchievement = async (type: keyof typeof ACHIEVEMENTS) => {
    const userId = getUserId();
    if (!userId) return false;

    const achievement = ACHIEVEMENTS[type];
    if (!achievement) return false;

    const exists = achievements.some(a => a.achievement_type === type);
    if (exists) return false;

    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: type,
        achievement_name: achievement.name,
        achievement_icon: achievement.icon
      })
      .select()
      .single();

    if (error) return false;

    if (data) {
      setNewAchievement(data);
      toast.success(`🎉 إنجاز جديد: ${achievement.name}`, {
        description: achievement.description,
        duration: 5000,
      });
      fetchAchievements();
      setTimeout(() => setNewAchievement(null), 5000);
    }

    return true;
  };

  const hasAchievement = (type: string) => {
    return achievements.some(a => a.achievement_type === type);
  };

  return {
    achievements,
    isLoading,
    unlockAchievement,
    hasAchievement,
    newAchievement,
    clearNewAchievement: () => setNewAchievement(null),
    refetch: fetchAchievements
  };
};
