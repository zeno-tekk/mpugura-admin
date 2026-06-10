'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { AdminDataProvider } from '@/context/admin-data-context';
import { ThemeProvider } from '@/context/theme-context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminDataProvider>{children}</AdminDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
