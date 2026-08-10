'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDb, googleAuthProvider } from '@/lib/firebase';

interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  hasPasswordProvider: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthorized: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthorized: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateDisplayName: async () => {},
  changePassword: async () => {},
});

function mapUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    name: user.displayName?.trim() || user.email?.split('@')[0] || 'Admin',
    email: user.email || '',
    photoURL: user.photoURL,
    hasPasswordProvider: user.providerData.some((p) => p.providerId === 'password'),
  };
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

      void (async () => {
        const snap = await getDoc(doc(firebaseDb, 'users', firebaseUser.uid));
        const isAdmin = snap.data()?.role === 'admin';

        if (!isAdmin) {
          await signOut(firebaseAuth);
          return;
        }

        setUser(mapUser(firebaseUser));
        setIsAuthorized(true);
        setIsLoading(false);
      })();
    });

    return unsubscribe;
  }, []);

  async function assertAdminRole(uid: string) {
    const snap = await getDoc(doc(firebaseDb, 'users', uid));
    if (snap.data()?.role !== 'admin') {
      await signOut(firebaseAuth);
      throw new Error('This account does not have admin access.');
    }
  }

  const login = async (email: string, password: string) => {
    const { user: firebaseUser } = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await assertAdminRole(firebaseUser.uid);
  };

  const loginWithGoogle = async () => {
    const { user: firebaseUser } = await signInWithPopup(firebaseAuth, googleAuthProvider);
    await assertAdminRole(firebaseUser.uid);
  };

  const logout = async () => {
    await signOut(firebaseAuth);
  };

  const updateDisplayName = async (name: string) => {
    const current = firebaseAuth.currentUser;
    if (!current) throw new Error('You need to be signed in to do that.');
    const trimmed = name.trim();
    await updateProfile(current, { displayName: trimmed });
    setUser((u) => (u ? { ...u, name: trimmed || u.name } : u));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const current = firebaseAuth.currentUser;
    if (!current || !current.email) throw new Error('You need to be signed in to do that.');
    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthorized, login, loginWithGoogle, logout, updateDisplayName, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
