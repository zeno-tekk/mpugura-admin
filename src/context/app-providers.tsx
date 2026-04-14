'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { AdminDataProvider } from '@/context/admin-data-context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminDataProvider>{children}</AdminDataProvider>
    </AuthProvider>
  );
}
