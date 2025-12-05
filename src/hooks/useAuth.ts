import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  totp_enabled: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, firstName: string, lastName?: string) => Promise<{ error: any; needsTOTP?: boolean; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data as Profile);
    }
    return data;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });
  }, []);

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_username_available', {
      check_username: username
    });
    return !error && data === true;
  };

  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    firstName: string, 
    lastName?: string
  ) => {
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,28}$/;
    if (!usernameRegex.test(username)) {
      return { error: { message: 'اليوزرنيم يجب أن يكون 3-28 حرف، إنجليزي فقط، بدون نقاط أو رموز خاصة' } };
    }

    if (username.includes('.')) {
      return { error: { message: 'لا يمكن استخدام النقاط في اليوزرنيم' } };
    }

    // Check username availability
    const isAvailable = await checkUsernameAvailable(username);
    if (!isAvailable) {
      return { error: { message: 'هذا اليوزرنيم مستخدم من قبل، اختر اسم آخر' } };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          first_name: firstName,
          last_name: lastName || null,
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: { message: 'هذا البريد الإلكتروني مسجل مسبقاً' } };
      }
      return { error };
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          username,
          first_name: firstName,
          last_name: lastName || null,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      return { error: null, needsTOTP: true, userId: data.user.id };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' } };
      }
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user?.id) {
      return { error: { message: 'يجب تسجيل الدخول أولاً' } };
    }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    resetPassword,
    updatePassword,
  };
};

export { AuthContext };
export type { Profile, AuthContextType };
