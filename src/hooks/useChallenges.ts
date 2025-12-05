import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChallengeVerificationData {
  description?: string;
  type?: string;
  verification_data?: {
    required_text?: string;
    required_count?: number;
    avatar_description?: string;
  };
}

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
  parsed_data?: ChallengeVerificationData;
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

    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      // Parse challenge descriptions
      const parsedChallenges = data.map(c => {
        let parsed_data: ChallengeVerificationData = {};
        try {
          if (c.challenge_description) {
            parsed_data = JSON.parse(c.challenge_description);
          }
        } catch (e) {
          // Keep empty parsed_data
        }
        return { ...c, parsed_data } as Challenge;
      });
      setChallenges(parsedChallenges);
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

  // Verify a challenge based on action
  const verifyChallenge = useCallback(async (
    challengeId: string, 
    action: string, 
    actionData?: Record<string, any>
  ) => {
    if (!userId) return { verified: false };

    try {
      const { data, error } = await supabase.functions.invoke('verify-challenge', {
        body: { userId, challengeId, action, actionData }
      });

      if (error) {
        console.error('Error verifying challenge:', error);
        return { verified: false };
      }

      if (data?.verified) {
        toast.success(data.message || 'تم إنجاز التحدي! 🎉');
        
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
      }

      return data;
    } catch (err) {
      console.error('Error:', err);
      return { verified: false };
    }
  }, [userId]);

  // Auto-verify challenges based on user activity
  const autoVerifyChallenges = useCallback(async (action: string, actionData?: Record<string, any>) => {
    if (!userId || challenges.length === 0) return;

    // Find incomplete challenges that match the action type
    const matchingChallenges = challenges.filter(c => 
      !c.is_completed && c.challenge_type === action
    );

    for (const challenge of matchingChallenges) {
      await verifyChallenge(challenge.id, action, actionData);
    }
  }, [userId, challenges, verifyChallenge]);

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
    verifyChallenge,
    autoVerifyChallenges,
    generateNewChallenges,
    checkVerification,
    refetch: fetchChallenges
  };
};
