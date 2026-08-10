'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { getInitials } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { PasswordField } from '@/components/password-field';

export default function SettingsPage() {
  const { user, updateDisplayName, changePassword, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const [name, setName] = useState(user?.name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingName(true);
    try {
      await updateDisplayName(name);
      showNotice('success', 'Profile updated.');
    } catch (err) {
      showNotice('error', getFriendlyErrorMessage(err, 'Could not update your profile.'));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showNotice('error', 'Choose a new password with at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotice('error', 'New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showNotice('success', 'Password changed.');
    } catch (err) {
      showNotice('error', getFriendlyErrorMessage(err, 'Could not change your password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Admin account, security, and appearance preferences</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      <div className="two-col">
        {/* Profile */}
        <form className="card stack" onSubmit={handleSaveName}>
          <div className="section-header">
            <div>
              <h2>Profile</h2>
              <p>Your admin account details</p>
            </div>
          </div>

          <div className="flex-row">
            <div className="avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>{getInitials(user?.name ?? 'Admin')}</div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-strong)' }}>{user?.name ?? 'Admin'}</strong>
              <span className="meta-text">{user?.email ?? ''}</span>
            </div>
          </div>

          <label className="field">
            <span>Display name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="field">
            <span>Email</span>
            <input value={user?.email ?? ''} disabled />
            <small>Contact a super admin to change the email on this account.</small>
          </label>

          <div className="flex-row">
            <button className="btn btn-primary" type="submit" disabled={isSavingName}>
              {isSavingName ? 'Saving…' : 'Save profile'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        </form>

        {/* Security + Appearance */}
        <div className="stack" style={{ gap: 20 }}>
          <form className="card stack" onSubmit={handleChangePassword}>
            <div className="section-header">
              <div>
                <h2>Change Password</h2>
                <p>Update the password used to sign in to this dashboard</p>
              </div>
            </div>

            {user && !user.hasPasswordProvider ? (
              <div className="empty-state">
                <h3>Signed in with Google</h3>
                <p>This account signs in with Google and has no password to change here.</p>
              </div>
            ) : (
              <>
                <label className="field">
                  <span>Current password</span>
                  <PasswordField value={currentPassword} onChange={setCurrentPassword} required autoComplete="current-password" />
                </label>
                <label className="field">
                  <span>New password</span>
                  <PasswordField value={newPassword} onChange={setNewPassword} required autoComplete="new-password" />
                </label>
                <label className="field">
                  <span>Confirm new password</span>
                  <PasswordField value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" />
                </label>
                <div className="flex-row">
                  <button className="btn btn-primary" type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Updating…' : 'Update password'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="card stack">
            <div className="section-header">
              <div>
                <h2>Appearance</h2>
                <p>Choose how the dashboard looks on this device</p>
              </div>
            </div>
            <div className="flex-row" style={{ justifyContent: 'space-between' }}>
              <span className="meta-text">Currently using <strong style={{ color: 'var(--text-strong)' }}>{theme === 'dark' ? 'Dark' : 'Light'}</strong> mode</span>
              <button className="btn btn-secondary btn-sm" type="button" onClick={toggleTheme}>
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
