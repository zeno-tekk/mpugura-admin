'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cloneMultiLang } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { Category, MultiLang } from '@/lib/types';

interface CategoryDraft {
  id: string;
  icon: string;
  color: string;
  bgColor: string;
  title: MultiLang;
  description: MultiLang;
  order: number;
}

const PALETTE = ['#1E3A8A', '#065F46', '#B45309', '#9D174D', '#6D28D9', '#0E7490', '#B91C1C', '#4D7C0F'];

// Light tint of the accent colour (accent mixed 90% with white) for card backgrounds.
function tintOf(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#EFF6FF';
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c * 0.1 + 255 * 0.9).toString(16).padStart(2, '0');
  return `#${mix((n >> 16) & 255)}${mix((n >> 8) & 255)}${mix(n & 255)}`.toUpperCase();
}

function createDraft(order = 1): CategoryDraft {
  return {
    id: '', icon: 'book', color: PALETTE[Math.floor(Math.random() * PALETTE.length)], bgColor: '',
    title: { en: '', fr: '', rw: '' },
    description: { en: '', fr: '', rw: '' },
    order,
  };
}

function nextCategoryId(categories: Category[]): string {
  let max = 0;
  for (const c of categories) {
    const m = c.id.match(/^cat-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `cat-${max + 1}`;
}

function nextCategoryOrder(categories: Category[]): number {
  return categories.reduce((max, c) => Math.max(max, c.order), 0) + 1;
}

function MultiLangFields({
  label, value, onChange, multiline = false,
}: {
  label: string;
  value: MultiLang;
  onChange: (lang: keyof MultiLang, val: string) => void;
  multiline?: boolean;
}) {
  const langs: Array<{ key: keyof MultiLang; title: string }> = [
    { key: 'en', title: 'English' },
    { key: 'rw', title: 'Kinyarwanda' },
    { key: 'fr', title: 'French' },
  ];

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-strong)' }}>{label}</div>
      <div className="lang-grid">
        {langs.map((l) => (
          <label key={l.key} className="field">
            <span>{l.title}</span>
            {multiline ? (
              <textarea rows={4} value={value[l.key]} onChange={(e) => onChange(l.key, e.target.value)} />
            ) : (
              <input value={value[l.key]} onChange={(e) => onChange(l.key, e.target.value)} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { categories, lessons, isLoading, saveCategory, deleteCategory } = useAdminData();

  const [draft, setDraft]         = useState<CategoryDraft>(createDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice]       = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(createDraft());
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setDraft({
      id: cat.id, icon: cat.icon, color: cat.color, bgColor: cat.bgColor,
      title: cloneMultiLang(cat.title),
      description: cloneMultiLang(cat.description),
      order: cat.order,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await saveCategory({
        id: editingId ?? nextCategoryId(categories),
        icon: draft.icon.trim(),
        color: draft.color.trim(),
        bgColor: tintOf(draft.color),
        title: cloneMultiLang(draft.title),
        description: cloneMultiLang(draft.description),
        order: editingId ? Number(draft.order) : nextCategoryOrder(categories),
        published: true,
      });
      reset();
      showNotice('success', 'Category saved.');
    } catch (err) {
      showNotice('error', `Could not save category. ${getFriendlyErrorMessage(err)}`);
    }
  };

  // Runs after the user confirms in the dialog; errors are shown inside the dialog.
  const handleConfirmDelete = async () => {
    if (!deleting) return;
    await deleteCategory(deleting.id);

    setDeleting(null);
    showNotice('success', 'Category deleted.');
  };

  const set = (key: keyof CategoryDraft, val: unknown) =>
    setDraft((d) => ({ ...d, [key]: val }));

  return (
    <>
      <div className="page-header">
        <h1>Categories</h1>
        <p>Manage the content groups that appear in your mobile app</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      <div className="two-col">
        {/* Form */}
        <form className="card stack" onSubmit={handleSave}>
          <div className="section-header">
            <div>
              <h2>{editingId ? 'Edit Category' : 'Create Category'}</h2>
              <p>Each category becomes a content bucket in the mobile app</p>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">Loading…</div>
          ) : (
            <>
              <MultiLangFields
                label="Category title"
                value={draft.title}
                onChange={(lang, val) => setDraft((d) => ({ ...d, title: { ...d.title, [lang]: val } }))}
              />

              <MultiLangFields
                label="Category description"
                value={draft.description}
                onChange={(lang, val) => setDraft((d) => ({ ...d, description: { ...d.description, [lang]: val } }))}
                multiline
              />

              <div className="field">
                <span>Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Use color ${c}`}
                      onClick={() => set('color', c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: draft.color.toUpperCase() === c ? '3px solid var(--text-strong)' : '2px solid transparent',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(draft.color) ? draft.color : '#1e3a8a'}
                    onChange={(e) => set('color', e.target.value.toUpperCase())}
                    aria-label="Pick a custom color"
                    style={{ width: 36, height: 30, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="flex-row">
                <button className="btn btn-primary" type="submit">
                  {editingId ? 'Update category' : 'Save category'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={reset}>
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
              <h2>Existing Categories</h2>
              <p>Current category documents in Firestore</p>
            </div>
          </div>

          {categories.length ? (
            <div className="list">
              {categories.map((cat) => (
                <div key={cat.id} className="list-item">
                  <div>
                    <strong>{cat.title.en || cat.id}</strong>
                    <p>{cat.id} · order {cat.order}</p>
                  </div>
                  <div className="flex-row">
                    <span className={`badge ${cat.published ? 'badge-success' : 'badge-muted'}`}>
                      {cat.published ? 'Published' : 'Hidden'}
                    </span>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(cat)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => setDeleting(cat)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No categories yet</h3>
              <p>Create one or seed the catalog from the Dashboard.</p>
            </div>
          )}
        </div>
      </div>
      {deleting && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleting.title.en || deleting.id}"? ${lessons.filter((l) => l.categoryId === deleting.id).length} lesson(s) in this category will no longer appear under any category. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
