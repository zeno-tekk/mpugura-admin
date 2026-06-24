'use client';

import { useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { formatDate, getInitials } from '@/lib/utils';
import type { StudentProfile } from '@/lib/types';

export default function StudentsPage() {
  const { students, isLoading, setStudentPremium } = useAdminData();
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch]  = useState('');

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const togglePremium = async (student: StudentProfile) => {
    try {
      await setStudentPremium(student.id, !student.isPremium);
      showNotice('success', student.isPremium ? 'Premium access removed.' : 'Premium access granted.');
    } catch (err) {
      showNotice('error', `Could not update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const premiumCount = students.filter((s) => s.isPremium).length;

  return (
    <>
      <div className="page-header">
        <h1>Students</h1>
        <p>Manage learners and their premium access</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      {/* Summary bar */}
      <div className="card" style={{ padding: '16px 22px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between' }}>
          <div className="flex-row">
            <span className="meta-text">Total: <strong style={{ color: 'var(--text-strong)' }}>{students.length}</strong></span>
            <span className="meta-text" style={{ marginLeft: 12 }}>
              Premium: <strong style={{ color: 'var(--success)' }}>{premiumCount}</strong>
            </span>
            <span className="meta-text" style={{ marginLeft: 12 }}>
              Free: <strong style={{ color: 'var(--muted)' }}>{students.length - premiumCount}</strong>
            </span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              padding: '7px 12px',
              border: '1px solid var(--input-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--input-bg)',
              color: 'var(--input-text)',
              fontSize: '0.875rem',
              width: 260,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2>All Students</h2>
            <p>Records from Firebase Auth user profiles</p>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">Loading students…</div>
        ) : filtered.length ? (
          <>
            {/* Table header */}
            <div className="data-table-header students-cols">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Last seen</span>
              <span>Actions</span>
            </div>

            <div className="data-table">
              {filtered.map((student) => (
                <div key={student.id} className="data-table-row students-cols">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar">{getInitials(student.name)}</div>
                    <strong style={{ color: 'var(--text-strong)', fontSize: '0.875rem' }}>{student.name}</strong>
                  </div>
                  <span className="meta-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.email || '-'}
                  </span>
                  <span className="meta-text">{student.role}</span>
                  <span>
                    <span className={`badge ${student.isPremium ? 'badge-success' : 'badge-muted'}`}>
                      {student.isPremium ? 'Premium' : 'Free'}
                    </span>
                  </span>
                  <span className="meta-text">{formatDate(student.lastLoginAt ?? student.createdAt)}</span>
                  <div>
                    <button
                      className={`btn btn-sm ${student.isPremium ? 'btn-secondary' : 'btn-primary'}`}
                      type="button"
                      onClick={() => void togglePremium(student)}
                    >
                      {student.isPremium ? 'Remove Premium' : 'Grant Premium'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>{search ? 'No results found' : 'No students yet'}</h3>
            <p>
              {search
                ? 'Try a different search term.'
                : 'Students appear automatically after they sign into the mobile app.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
