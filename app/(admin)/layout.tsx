'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthorized, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ alignItems: 'center' }}>
          <div className="auth-brand">
            <div className="logo-mark">M</div>
            <div className="logo-name">Mpugura Admin</div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAuthorized) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="logo-mark">M</div>
            <div className="logo-name">Mpugura Admin</div>
          </div>
          <div>
            <h2 className="auth-heading">Access Denied</h2>
            <p className="auth-sub">
              This account does not have admin access. Contact the system administrator to grant you access.
            </p>
          </div>
          <button className="btn btn-primary btn-full" type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
