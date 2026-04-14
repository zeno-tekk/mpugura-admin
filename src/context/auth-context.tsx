'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth, googleAuthProvider } from '@/lib/firebase';

interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthorized: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthorized: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

const allowedAdminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function mapUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    name: user.displayName?.trim() || user.email?.split('@')[0] || 'Admin',
    email: user.email || '',
    photoURL: user.photoURL,
  };
}

function canAccessAdmin(email?: string | null) {
  if (!email) return false;
  if (!allowedAdminEmails.length) return true;
  return allowedAdminEmails.includes(email.toLowerCase());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      const nextUser = mapUser(firebaseUser);
      setUser(nextUser);
      setIsAuthorized(canAccessAdmin(nextUser.email));
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(firebaseAuth, googleAuthProvider);
  };

  const logout = async () => {
    await signOut(firebaseAuth);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthorized, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
