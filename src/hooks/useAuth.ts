import { useContext } from 'react';
import { AuthContext, AuthContextType, Profile } from '@/contexts/AuthContext';

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};

export type { Profile, AuthContextType };
