import type { ReactNode } from 'react';
import './globals.css';
import { AppProviders } from '@/context/app-providers';

export const metadata = {
  title: 'Nyigisha Admin',
  description: 'Admin panel for managing Nyigisha content, students, and payments.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
