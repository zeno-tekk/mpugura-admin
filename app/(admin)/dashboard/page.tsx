'use client';

import Link from 'next/link';
import { useAdminData } from '@/context/admin-data-context';
import { formatDate, formatMoney, getInitials } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';

function StatCard({
  label,
  value,
  hint,
  iconBg,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-hint">{hint}</div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

function SeedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

export default function DashboardPage() {
  const {
    categories, lessons, students, payments,
    isLoading, seedDefaultContent,
  } = useAdminData();

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const premiumStudents  = students.filter((s) => s.isPremium).length;
  const publishedLessons = lessons.filter((l) => l.published).length;
  const pendingPayments  = payments.filter((p) => p.status === 'pending').length;

  const recentStudents = students.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  const handleSeed = async () => {
    if (!window.confirm('Seed the mobile app catalog into Firestore? Existing docs will be updated.')) return;
    try {
      await seedDefaultContent();
      alert('Default content seeded successfully.');
    } catch (err) {
      alert(`Could not seed the catalog. ${getFriendlyErrorMessage(err)}`);
    }
  };

  if (isLoading) {
    return <div className="loading-state">Loading data from Firebase…</div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Today&apos;s report and performance overview</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Categories"
          value={String(categories.length)}
          hint="Content groups in Firestore"
          iconBg="rgba(79,110,247,0.15)"
          icon={<LayersIcon />}
        />
        <StatCard
          label="Published Lessons"
          value={String(publishedLessons)}
          hint={`${lessons.length} total lessons`}
          iconBg="rgba(16,185,129,0.15)"
          icon={<BookIcon />}
        />
        <StatCard
          label="Students"
          value={String(students.length)}
          hint={`${premiumStudents} premium learners`}
          iconBg="rgba(245,158,11,0.15)"
          icon={<UsersIcon />}
        />
        <StatCard
          label="Revenue"
          value={formatMoney(totalRevenue, 'RWF')}
          hint={`${pendingPayments} pending payment${pendingPayments !== 1 ? 's' : ''}`}
          iconBg="rgba(239,68,68,0.15)"
          icon={<CardIcon />}
        />
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="section-header">
          <div>
            <h2>Quick Actions</h2>
            <p>Seed catalog or jump to a management flow</p>
          </div>
        </div>
        <div className="action-grid">
          <button className="action-card" type="button" onClick={handleSeed}>
            <SeedIcon />
            <span>Seed Mobile Catalog</span>
          </button>
          <Link href="/categories" className="action-card">
            <PlusIcon />
            <span>Add Category</span>
          </Link>
          <Link href="/lessons" className="action-card">
            <PlusIcon />
            <span>Add Lesson</span>
          </Link>
          <Link href="/payments" className="action-card">
            <PlusIcon />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Recent lists */}
      <div className="two-col">
        {/* Recent students */}
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Recent Students</h2>
              <p>Newest activity from Firebase Auth profiles</p>
            </div>
            <Link href="/students" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {recentStudents.length ? (
            <div className="list">
              {recentStudents.map((student) => (
                <div key={student.id} className="list-item">
                  <div className="list-item-main">
                    <div className="avatar">{getInitials(student.name)}</div>
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex-row">
                    <span className={`badge ${student.isPremium ? 'badge-success' : 'badge-muted'}`}>
                      {student.isPremium ? 'Premium' : 'Free'}
                    </span>
                    <span className="meta-text">{formatDate(student.lastLoginAt ?? student.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No students yet</h3>
              <p>Students appear after they sign into the mobile app.</p>
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Recent Payments</h2>
              <p>Manual payment records from the admin panel</p>
            </div>
            <Link href="/payments" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {recentPayments.length ? (
            <div className="list">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="list-item">
                  <div>
                    <strong>{payment.studentName}</strong>
                    <p>{formatMoney(payment.amount, payment.currency)} · {payment.method}</p>
                  </div>
                  <div className="flex-row">
                    <span className={`badge ${payment.status === 'completed' ? 'badge-success' : payment.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {payment.status}
                    </span>
                    <span className="meta-text">{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No payments yet</h3>
              <p>Recorded payments will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
