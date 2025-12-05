import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  totp_enabled: boolean | null;
  totp_secret: string | null;
  is_verified?: boolean | null;
  is_permanently_verified?: boolean | null;
  verified_until?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, firstName: string, lastName?: string) => Promise<{ error: any; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: any; needsTOTP?: boolean; totpSecret?: string; userEmail?: string; userPassword?: string }>;
  completeSignIn: (email: string, password: string) => Promise<{ error: any }>;
  cancelTOTPVerification: () => void;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  enableTOTP: (secret: string) => Promise<{ error: any }>;
  disableTOTP: () => Promise<{ error: any }>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  completeSignIn: async () => ({ error: null }),
  cancelTOTPVerification: () => {},
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  refreshProfile: async () => {},
  enableTOTP: async () => ({ error: null }),
  disableTOTP: async () => ({ error: null }),
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [skipAuthUpdate, setSkipAuthUpdate] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Skip updating user state if we're in the middle of TOTP verification
        if (skipAuthUpdate) {
          setLoading(false);
          return;
        }
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setTimeout(() => {
            fetchProfile(newSession.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!skipAuthUpdate) {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession?.user) {
          fetchProfile(existingSession.user.id).then(setProfile);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [skipAuthUpdate]);

  const signUp = async (email: string, password: string, username: string, firstName: string, lastName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) return { error };

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          username,
          first_name: firstName,
          last_name: lastName || null,
        });

      if (profileError) {
        return { error: profileError };
      }
      
      return { error: null, userId: data.user.id };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    // Set flag to prevent onAuthStateChange from updating user during TOTP check
    setSkipAuthUpdate(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setSkipAuthUpdate(false);
      return { error };
    }

    if (data.user) {
      const profileData = await fetchProfile(data.user.id);
      
      if (profileData?.totp_enabled && profileData?.totp_secret) {
        // Sign out immediately - user must complete 2FA first
        await supabase.auth.signOut();
        // Keep skipAuthUpdate true - it will be reset when Auth.tsx calls completeSignIn or cancels
        return { error: null, needsTOTP: true, totpSecret: profileData.totp_secret, userEmail: email, userPassword: password };
      }
      
      // No TOTP required, allow normal auth flow
      setSkipAuthUpdate(false);
      setUser(data.user);
      setSession(data.session);
      setProfile(profileData);
    }

    return { error: null };
  };
  
  const completeSignIn = async (email: string, password: string) => {
    setSkipAuthUpdate(false);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    if (data.user) {
      const profileData = await fetchProfile(data.user.id);
      setUser(data.user);
      setSession(data.session);
      setProfile(profileData);
    }

    return { error: null };
  };
  
  const cancelTOTPVerification = () => {
    setSkipAuthUpdate(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const enableTOTP = async (secret: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update({ totp_secret: secret, totp_enabled: true })
      .eq('user_id', user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const disableTOTP = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update({ totp_secret: null, totp_enabled: false })
      .eq('user_id', user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    completeSignIn,
    cancelTOTPVerification,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
    refreshProfile,
    enableTOTP,
    disableTOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
