import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  user_id: string;
  challenge_text: string;
  challenge_description: string | null;
  challenge_type: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  expires_at: string;
}

interface VerificationStatus {
  verified: boolean;
  permanent: boolean;
  completions: number;
  requiredForVerification: number;
  verifiedUntil: string | null;
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get authenticated user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchChallenges = useCallback(async () => {
    if (!userId) {
      setChallenges([]);
      setIsLoading(false);
      return;
    }

    // Get today's challenges (not expired)
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setChallenges(data as Challenge[]);
    }
    
    setIsLoading(false);
  }, [userId]);

  const generateNewChallenges = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-challenges', {
        body: { userId }
      });

      if (error) {
        console.error('Error generating challenges:', error);
        toast.error('حدث خطأ في توليد التحديات');
      } else {
        toast.success('تم إنشاء تحديات جديدة!');
        await fetchChallenges();
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('حدث خطأ غير متوقع');
    }
    
    setIsLoading(false);
  }, [userId, fetchChallenges]);

  const completeChallenge = useCallback(async (challengeId: string) => {
    if (!userId) return false;

    // Update challenge as completed
    const { error: updateError } = await supabase
      .from('user_challenges')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', challengeId)
      .eq('user_id', userId);

    if (updateError) {
      toast.error('حدث خطأ في إكمال التحدي');
      return false;
    }

    // Record completion
    const { error: insertError } = await supabase
      .from('challenge_completions')
      .insert({
        user_id: userId,
        challenge_id: challengeId
      });

    if (insertError) {
      console.error('Error recording completion:', insertError);
    }

    toast.success('تم إكمال التحدي! 🎉');
    
    // Update local state
    setChallenges(prev => 
      prev.map(c => 
        c.id === challengeId 
          ? { ...c, is_completed: true, completed_at: new Date().toISOString() } 
          : c
      )
    );

    // Check verification status
    await checkVerification();

    return true;
  }, [userId]);

  const checkVerification = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-verification', {
        body: { userId }
      });

      if (!error && data) {
        setVerificationStatus(data);
      }
    } catch (err) {
      console.error('Error checking verification:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchChallenges();
      checkVerification();
    }
  }, [userId, fetchChallenges, checkVerification]);

  // Auto-generate challenges if none exist
  useEffect(() => {
    if (!isLoading && userId && challenges.length === 0) {
      generateNewChallenges();
    }
  }, [isLoading, userId, challenges.length, generateNewChallenges]);

  return {
    challenges,
    isLoading,
    verificationStatus,
    completeChallenge,
    generateNewChallenges,
    checkVerification,
    refetch: fetchChallenges
  };
};
