'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const { user, isLoading, isAuthorized, login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '', error: '', isSubmitting: false });

  useEffect(() => {
    if (!isLoading && user && isAuthorized) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, isAuthorized, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForm((f) => ({ ...f, error: '', isSubmitting: true }));
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not sign in.';
      setForm((f) => ({ ...f, error: msg, isSubmitting: false }));
    }
  };

  const handleGoogle = async () => {
    setForm((f) => ({ ...f, error: '', isSubmitting: true }));
    try {
      await loginWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not sign in with Google.';
      setForm((f) => ({ ...f, error: msg, isSubmitting: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ alignItems: 'center' }}>
          <div className="auth-brand">
            <div className="logo-mark">M</div>
            <div className="logo-name">Mpugura Admin</div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="logo-mark">M</div>
          <div className="logo-name">Mpugura Admin</div>
        </div>

        <div>
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-sub">
            Sign in to manage categories, lessons, students, and payments for your mobile app.
          </p>
        </div>

        <form className="stack" style={{ gap: 14 }} onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </label>

          {form.error && <div className="notice notice-error">{form.error}</div>}

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={form.isSubmitting}
            style={{ marginTop: 4 }}
          >
            {form.isSubmitting ? 'Signing in…' : 'Sign in with email'}
          </button>
        </form>

        <div className="divider-or">or</div>

        <button
          className="btn btn-secondary btn-full"
          type="button"
          onClick={handleGoogle}
          disabled={form.isSubmitting}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
