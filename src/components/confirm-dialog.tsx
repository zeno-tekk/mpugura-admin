'use client';

import { useState } from 'react';

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close" disabled={isSubmitting}>
            <CloseIcon />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>{message}</p>

        {error && <div className="notice notice-error">{error}</div>}

        <div className="modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
