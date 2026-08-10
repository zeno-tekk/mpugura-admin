'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { formatDate, formatMoney } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { PaymentRecord, PaymentStatus } from '@/lib/types';

interface PaymentDraft {
  id?: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  amount: string;
  currency: string;
  plan: string;
  status: PaymentStatus;
  method: string;
  note: string;
  grantPremium: boolean;
}

function createDraft(): PaymentDraft {
  return {
    userId: '', studentName: '', studentEmail: '',
    amount: '2500', currency: 'RWF', plan: 'premium',
    status: 'completed', method: 'Manual', note: '', grantPremium: true,
  };
}

export default function PaymentsPage() {
  const { students, payments, isLoading, savePayment, deletePayment } = useAdminData();

  const [draft, setDraft]   = useState<PaymentDraft>(createDraft());
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const set = (key: keyof PaymentDraft, val: unknown) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const handleStudentPick = (studentId: string) => {
    const s = students.find((x) => x.id === studentId);
    setDraft((d) => ({
      ...d, userId: studentId,
      studentName: s?.name ?? '',
      studentEmail: s?.email ?? '',
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await savePayment({
        id: draft.id,
        userId: draft.userId || undefined,
        studentName: draft.studentName.trim(),
        studentEmail: draft.studentEmail.trim(),
        amount: Number(draft.amount),
        currency: draft.currency.trim(),
        plan: draft.plan.trim(),
        status: draft.status,
        method: draft.method.trim(),
        note: draft.note.trim(),
        grantPremium: draft.grantPremium,
      });
      setDraft(createDraft());
      showNotice('success', draft.id ? 'Payment updated.' : 'Payment recorded.');
    } catch (err) {
      showNotice('error', `Could not save payment. ${getFriendlyErrorMessage(err)}`);
    }
  };

  const startEdit = (payment: PaymentRecord) => {
    setDraft({
      id: payment.id,
      userId: payment.userId ?? '',
      studentName: payment.studentName,
      studentEmail: payment.studentEmail,
      amount: String(payment.amount),
      currency: payment.currency,
      plan: payment.plan,
      status: payment.status,
      method: payment.method,
      note: payment.note ?? '',
      grantPremium: payment.status === 'completed',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (payment: PaymentRecord) => {
    if (!window.confirm(`Delete payment for "${payment.studentName}"?`)) return;
    try {
      await deletePayment(payment.id);
      showNotice('success', 'Payment deleted.');
    } catch (err) {
      showNotice('error', `Could not delete payment. ${getFriendlyErrorMessage(err)}`);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pending = payments.filter((p) => p.status === 'pending').length;

  return (
    <>
      <div className="page-header">
        <h1>Payments</h1>
        <p>Track manual payment records and grant premium access</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      {/* Summary */}
      <div className="card" style={{ padding: '16px 22px' }}>
        <div className="flex-row">
          <span className="meta-text">Total records: <strong style={{ color: 'var(--text-strong)' }}>{payments.length}</strong></span>
          <span className="meta-text" style={{ marginLeft: 12 }}>
            Revenue: <strong style={{ color: 'var(--success)' }}>{formatMoney(totalRevenue, 'RWF')}</strong>
          </span>
          <span className="meta-text" style={{ marginLeft: 12 }}>
            Pending: <strong style={{ color: 'var(--warning)' }}>{pending}</strong>
          </span>
        </div>
      </div>

      <div className="two-col">
        {/* Form */}
        <form className="card stack" onSubmit={handleSave}>
          <div className="section-header">
            <div>
              <h2>{draft.id ? 'Edit Payment' : 'Record Payment'}</h2>
              <p>Manual premium tracking until a full payment gateway is added</p>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">Loading…</div>
          ) : (
            <>
              <div className="form-grid">
                <label className="field">
                  <span>Student</span>
                  <select value={draft.userId} onChange={(e) => handleStudentPick(e.target.value)}>
                    <option value="">Select a student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Student name</span>
                  <input value={draft.studentName} onChange={(e) => set('studentName', e.target.value)} required />
                </label>
                <label className="field">
                  <span>Student email</span>
                  <input
                    type="email"
                    value={draft.studentEmail}
                    onChange={(e) => set('studentEmail', e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Amount</span>
                  <input
                    type="number"
                    value={draft.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    min={0}
                    required
                  />
                </label>
                <label className="field">
                  <span>Currency</span>
                  <input value={draft.currency} onChange={(e) => set('currency', e.target.value)} required />
                </label>
                <label className="field">
                  <span>Plan</span>
                  <input value={draft.plan} onChange={(e) => set('plan', e.target.value)} required />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select value={draft.status} onChange={(e) => set('status', e.target.value as PaymentStatus)}>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
                <label className="field">
                  <span>Method</span>
                  <input value={draft.method} onChange={(e) => set('method', e.target.value)} required />
                </label>
              </div>

              <label className="field">
                <span>Note</span>
                <textarea value={draft.note} onChange={(e) => set('note', e.target.value)} rows={4} />
              </label>

              <label className="toggle-field">
                <input
                  type="checkbox"
                  checked={draft.grantPremium}
                  onChange={(e) => set('grantPremium', e.target.checked)}
                />
                <span>Grant premium access when saving</span>
              </label>

              <div className="flex-row">
                <button className="btn btn-primary" type="submit">
                  {draft.id ? 'Update payment' : 'Save payment'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setDraft(createDraft())}>
                  Reset
                </button>
              </div>
            </>
          )}
        </form>

        {/* List */}
        <div className="card stack">
          <div className="section-header">
            <div>
              <h2>Payment History</h2>
              <p>Manual records tied to your Firebase project</p>
            </div>
          </div>

          {payments.length ? (
            <>
              <div className="data-table-header payments-cols">
                <span>Student</span>
                <span>Amount</span>
                <span>Plan</span>
                <span>Status</span>
                <span>Date</span>
                <span>Actions</span>
              </div>
              <div className="data-table">
                {payments.map((payment) => (
                  <div key={payment.id} className="data-table-row payments-cols">
                    <div>
                      <strong style={{ color: 'var(--text-strong)', fontSize: '0.875rem' }}>{payment.studentName}</strong>
                      <div className="meta-text" style={{ marginTop: 2 }}>{payment.method}</div>
                    </div>
                    <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
                      {formatMoney(payment.amount, payment.currency)}
                    </span>
                    <span className="meta-text">{payment.plan}</span>
                    <span>
                      <span className={`badge ${payment.status === 'completed' ? 'badge-success' : payment.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {payment.status}
                      </span>
                    </span>
                    <span className="meta-text">{formatDate(payment.paidAt ?? payment.createdAt)}</span>
                    <div className="flex-row">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(payment)}>Edit</button>
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => void handleDelete(payment)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No payments recorded</h3>
              <p>Add your first manual payment using the form.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
