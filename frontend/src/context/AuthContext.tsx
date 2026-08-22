import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthMode = 'signin' | 'signup' | 'forgot_password' | 'reset_password' | 'verify_email';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  unverifiedEmail: string | null;
  setUnverifiedEmail: (email: string | null) => void;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Determine if current user has a verified email or is OAuth authenticated
  const isEmailVerified = Boolean(
    user && (
      user.email_confirmed_at ||
      user.app_metadata?.provider === 'google' ||
      user.app_metadata?.providers?.includes('google')
    )
  );

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      setAuthMode('signin');
    }
    return { error: error ? new Error(error.message) : null };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isEmailVerified,
        authMode,
        setAuthMode,
        unverifiedEmail,
        setUnverifiedEmail,
        signInWithGoogle,
        signOut,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
