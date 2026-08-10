'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
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
  published: boolean;
}

function createDraft(order = 1): CategoryDraft {
  return {
    id: '', icon: 'book', color: '#1E3A8A', bgColor: '#EFF6FF',
    title: { en: '', fr: '', rw: '' },
    description: { en: '', fr: '', rw: '' },
    order, published: true,
  };
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
  const { categories, isLoading, saveCategory, deleteCategory } = useAdminData();

  const [draft, setDraft]         = useState<CategoryDraft>(createDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice]       = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(createDraft(categories.length + 1));
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setDraft({
      id: cat.id, icon: cat.icon, color: cat.color, bgColor: cat.bgColor,
      title: cloneMultiLang(cat.title),
      description: cloneMultiLang(cat.description),
      order: cat.order, published: cat.published,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await saveCategory({
        id: draft.id.trim(),
        icon: draft.icon.trim(),
        color: draft.color.trim(),
        bgColor: draft.bgColor.trim(),
        title: cloneMultiLang(draft.title),
        description: cloneMultiLang(draft.description),
        order: Number(draft.order),
        published: draft.published,
      });
      reset();
      showNotice('success', 'Category saved.');
    } catch (err) {
      showNotice('error', `Could not save category. ${getFriendlyErrorMessage(err)}`);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete "${cat.title.en || cat.id}"?`)) return;
    try {
      await deleteCategory(cat.id);
      showNotice('success', 'Category deleted.');
    } catch (err) {
      showNotice('error', `Could not delete category. ${getFriendlyErrorMessage(err)}`);
    }
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
              <div className="form-grid">
                <label className="field">
                  <span>Category ID</span>
                  <input
                    value={draft.id}
                    onChange={(e) => set('id', e.target.value)}
                    placeholder="road-signs"
                    disabled={Boolean(editingId)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Order</span>
                  <input
                    type="number"
                    value={draft.order}
                    onChange={(e) => set('order', Number(e.target.value))}
                    min={1}
                    required
                  />
                </label>
                <label className="field">
                  <span>Icon</span>
                  <input
                    value={draft.icon}
                    onChange={(e) => set('icon', e.target.value)}
                    placeholder="book"
                    required
                  />
                </label>
                <label className="field">
                  <span>Accent color</span>
                  <input
                    value={draft.color}
                    onChange={(e) => set('color', e.target.value)}
                    placeholder="#1E3A8A"
                    required
                  />
                </label>
                <label className="field">
                  <span>Background color</span>
                  <input
                    value={draft.bgColor}
                    onChange={(e) => set('bgColor', e.target.value)}
                    placeholder="#EFF6FF"
                    required
                  />
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={draft.published}
                      onChange={(e) => set('published', e.target.checked)}
                    />
                    <span>Published</span>
                  </label>
                </div>
              </div>

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
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => void handleDelete(cat)}>
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
    </>
  );
}
