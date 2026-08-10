'use client';

import { useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { formatDate, getInitials } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { ExamAttempt, StudentProfile } from '@/lib/types';

const PASS_PERCENT = 70;

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function percent(score: number, total: number) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function formatSeconds(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/* ── Edit modal ─────────────────────────────────────────────── */
function EditStudentModal({
  student,
  onClose,
  onSave,
}: {
  student: StudentProfile;
  onClose: () => void;
  onSave: (updates: { name: string; email: string; isPremium: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [isPremium, setIsPremium] = useState(student.isPremium);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), email: email.trim(), isPremium });
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Could not update this student.'));
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <h2>Edit Student</h2>
            <p>Update this learner&apos;s profile</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="toggle-field">
            <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
            <span>Premium access</span>
          </label>
        </div>

        {error && <div className="notice notice-error">{error}</div>}

        <div className="modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Detail modal: profile + progress + exam history ─────────── */
function StudentDetailModal({
  student,
  attempts,
  isLoading,
  onClose,
}: {
  student: StudentProfile;
  attempts: ExamAttempt[] | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const list = attempts ?? [];
  const bestPercent = list.length ? Math.max(...list.map((a) => percent(a.score, a.total))) : 0;
  const avgPercent = list.length
    ? Math.round(list.reduce((sum, a) => sum + percent(a.score, a.total), 0) / list.length)
    : 0;
  const passCount = list.filter((a) => percent(a.score, a.total) >= PASS_PERCENT).length;
  const passRate = list.length ? Math.round((passCount / list.length) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>{getInitials(student.name)}</div>
            <div>
              <h2>{student.name}</h2>
              <p>{student.email || 'No email'}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-row">
          <span className={`badge ${student.isPremium ? 'badge-success' : 'badge-muted'}`}>
            {student.isPremium ? 'Premium' : 'Free'}
          </span>
          {student.disabled && <span className="badge badge-danger">Removed</span>}
          <span className="meta-text">Joined {formatDate(student.createdAt)}</span>
          <span className="meta-text">· Last seen {formatDate(student.lastLoginAt ?? student.createdAt)}</span>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card" style={{ padding: '14px 16px' }}>
            <div className="stat-card-label">Exams Taken</div>
            <div className="stat-card-value">{list.length}</div>
          </div>
          <div className="stat-card" style={{ padding: '14px 16px' }}>
            <div className="stat-card-label">Best Score</div>
            <div className="stat-card-value">{list.length ? `${bestPercent}%` : '-'}</div>
          </div>
          <div className="stat-card" style={{ padding: '14px 16px' }}>
            <div className="stat-card-label">Average</div>
            <div className="stat-card-value">{list.length ? `${avgPercent}%` : '-'}</div>
          </div>
          <div className="stat-card" style={{ padding: '14px 16px' }}>
            <div className="stat-card-label">Pass Rate</div>
            <div className="stat-card-value">{list.length ? `${passRate}%` : '-'}</div>
          </div>
        </div>

        <div className="section-header">
          <div>
            <h2>Exam History</h2>
            <p>Every practice exam this student has completed</p>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">Loading exam history…</div>
        ) : list.length ? (
          <div className="data-table">
            <div className="data-table-header" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr' }}>
              <span>Date</span>
              <span>Score</span>
              <span>Percent</span>
              <span>Time Used</span>
              <span>Result</span>
            </div>
            {list.map((attempt) => {
              const pct = percent(attempt.score, attempt.total);
              const passed = pct >= PASS_PERCENT;
              return (
                <div key={attempt.id} className="data-table-row" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr' }}>
                  <span className="meta-text">{formatDate(attempt.createdAt)}</span>
                  <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{attempt.score}/{attempt.total}</span>
                  <span className="meta-text">{pct}%</span>
                  <span className="meta-text">{formatSeconds(attempt.timeUsed)}</span>
                  <span>
                    <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`}>
                      {passed ? 'Passed' : 'Failed'}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No exams yet</h3>
            <p>This student hasn&apos;t completed a practice exam in the mobile app.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function StudentsPage() {
  const { students, isLoading, setStudentPremium, updateStudent, deleteStudent, restoreStudent, fetchStudentAttempts } = useAdminData();

  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [showRemoved, setShowRemoved] = useState(false);

  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentProfile | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[] | null>(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const togglePremium = async (student: StudentProfile) => {
    try {
      await setStudentPremium(student.id, !student.isPremium);
      showNotice('success', student.isPremium ? 'Premium access removed.' : 'Premium access granted.');
    } catch (err) {
      showNotice('error', getFriendlyErrorMessage(err, 'Could not update premium access.'));
    }
  };

  const handleSaveEdit = async (updates: { name: string; email: string; isPremium: boolean }) => {
    if (!editingStudent) return;
    await updateStudent(editingStudent.id, updates);
    showNotice('success', 'Student profile updated.');
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      await deleteStudent(deletingStudent.id);
      showNotice('success', 'Student removed.');
      setDeletingStudent(null);
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err, 'Could not remove this student.'));
    }
  };

  const handleRestore = async (student: StudentProfile) => {
    try {
      await restoreStudent(student.id);
      showNotice('success', 'Student access restored.');
    } catch (err) {
      showNotice('error', getFriendlyErrorMessage(err, 'Could not restore this student.'));
    }
  };

  const openDetail = async (student: StudentProfile) => {
    setViewingStudent(student);
    setAttempts(null);
    setAttemptsLoading(true);
    try {
      const result = await fetchStudentAttempts(student.id);
      setAttempts(result);
    } catch (err) {
      showNotice('error', getFriendlyErrorMessage(err, "Could not load this student's exam history."));
      setAttempts([]);
    } finally {
      setAttemptsLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!showRemoved && s.disabled) return false;
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const activeStudents = students.filter((s) => !s.disabled);
  const premiumCount = activeStudents.filter((s) => s.isPremium).length;
  const removedCount = students.filter((s) => s.disabled).length;

  return (
    <>
      <div className="page-header">
        <h1>Students</h1>
        <p>Manage learners, their premium access, and exam progress</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      {/* Summary bar */}
      <div className="card" style={{ padding: '16px 22px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between' }}>
          <div className="flex-row">
            <span className="meta-text">Total: <strong style={{ color: 'var(--text-strong)' }}>{activeStudents.length}</strong></span>
            <span className="meta-text" style={{ marginLeft: 12 }}>
              Premium: <strong style={{ color: 'var(--success)' }}>{premiumCount}</strong>
            </span>
            <span className="meta-text" style={{ marginLeft: 12 }}>
              Free: <strong style={{ color: 'var(--muted)' }}>{activeStudents.length - premiumCount}</strong>
            </span>
            {removedCount > 0 && (
              <label className="toggle-field" style={{ marginLeft: 12 }}>
                <input type="checkbox" checked={showRemoved} onChange={(e) => setShowRemoved(e.target.checked)} />
                <span>Show removed ({removedCount})</span>
              </label>
            )}
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
            <p>Click a student to see their progress and exam history</p>
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
                <div
                  key={student.id}
                  className="data-table-row students-cols"
                  style={{ cursor: 'pointer', opacity: student.disabled ? 0.6 : 1 }}
                  onClick={() => void openDetail(student)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar">{getInitials(student.name)}</div>
                    <strong style={{ color: 'var(--text-strong)', fontSize: '0.875rem' }}>{student.name}</strong>
                  </div>
                  <span className="meta-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.email || '-'}
                  </span>
                  <span className="meta-text">{student.role}</span>
                  <span className="flex-row">
                    <span className={`badge ${student.isPremium ? 'badge-success' : 'badge-muted'}`}>
                      {student.isPremium ? 'Premium' : 'Free'}
                    </span>
                    {student.disabled && <span className="badge badge-danger">Removed</span>}
                  </span>
                  <span className="meta-text">{formatDate(student.lastLoginAt ?? student.createdAt)}</span>
                  <div className="flex-row" onClick={(e) => e.stopPropagation()}>
                    {student.disabled ? (
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => void handleRestore(student)}>
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          className={`btn btn-sm ${student.isPremium ? 'btn-secondary' : 'btn-primary'}`}
                          type="button"
                          onClick={() => void togglePremium(student)}
                        >
                          {student.isPremium ? 'Remove Premium' : 'Grant Premium'}
                        </button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditingStudent(student)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" type="button" onClick={() => setDeletingStudent(student)}>
                          Delete
                        </button>
                      </>
                    )}
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

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={handleSaveEdit}
        />
      )}

      {viewingStudent && (
        <StudentDetailModal
          student={viewingStudent}
          attempts={attempts}
          isLoading={attemptsLoading}
          onClose={() => setViewingStudent(null)}
        />
      )}

      {deletingStudent && (
        <ConfirmDialog
          title="Remove student"
          message={`Remove "${deletingStudent.name}"? They will be signed out and won't be able to sign back in until you restore their account.`}
          confirmLabel="Remove"
          tone="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingStudent(null)}
        />
      )}
    </>
  );
}
