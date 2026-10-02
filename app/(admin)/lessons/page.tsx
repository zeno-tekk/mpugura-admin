'use client';

import React, { useEffect, useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { cloneMultiLang } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { Lesson, MultiLang, Question } from '@/lib/types';

interface LessonDraft {
  id: string;
  categoryId: string;
  order: number;
  duration: number;
  icon: string;
  title: MultiLang;
  content: MultiLang;
  questionsJson: string;
  premiumOnly: boolean;
  published: boolean;
}

function createDraft(categoryId = '', order = 1): LessonDraft {
  return {
    id: '', categoryId, order, duration: 5, icon: 'book',
    title: { en: '', fr: '', rw: '' },
    content: { en: '', fr: '', rw: '' },
    questionsJson: '[]',
    premiumOnly: false, published: true,
  };
}

function nextLessonId(lessons: Lesson[]): string {
  let max = 0;
  for (const l of lessons) {
    const m = l.id.match(/^lesson-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `lesson-${max + 1}`;
}

function nextLessonOrder(lessons: Lesson[], categoryId: string): number {
  let max = 0;
  for (const l of lessons) {
    if (l.categoryId === categoryId) max = Math.max(max, l.order);
  }
  return max + 1;
}

function parseQuestions(raw: string): Question[] {
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Questions must be a JSON array.');
  return parsed as Question[];
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
              <textarea rows={5} value={value[l.key]} onChange={(e) => onChange(l.key, e.target.value)} />
            ) : (
              <input value={value[l.key]} onChange={(e) => onChange(l.key, e.target.value)} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function LessonsPage() {
  const { categories, lessons, isLoading, saveLesson, deleteLesson } = useAdminData();

  const [draft, setDraft]         = useState<LessonDraft>(createDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice]       = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!draft.categoryId && categories[0]?.id) {
      const categoryId = categories[0].id;
      setDraft((d) => ({ ...d, categoryId, order: nextLessonOrder(lessons, categoryId) }));
    }
  }, [categories, lessons, draft.categoryId]);

  // Keep the auto-assigned order current while creating (e.g. once lessons finish loading).
  useEffect(() => {
    if (editingId || !draft.categoryId) return;
    const order = nextLessonOrder(lessons, draft.categoryId);
    setDraft((d) => (d.order === order ? d : { ...d, order }));
  }, [lessons, editingId, draft.categoryId]);

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(createDraft(categories[0]?.id ?? '', nextLessonOrder(lessons, categories[0]?.id ?? '')));
  };

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setDraft({
      id: lesson.id, categoryId: lesson.categoryId, order: lesson.order,
      duration: lesson.duration, icon: lesson.icon,
      title: cloneMultiLang(lesson.title),
      content: cloneMultiLang(lesson.content),
      questionsJson: JSON.stringify(lesson.questions, null, 2),
      premiumOnly: lesson.premiumOnly, published: lesson.published,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await saveLesson({
        id: editingId ?? nextLessonId(lessons),
        categoryId: draft.categoryId,
        order: Number(draft.order),
        duration: Number(draft.duration),
        icon: draft.icon.trim(),
        title: cloneMultiLang(draft.title),
        content: cloneMultiLang(draft.content),
        questions: parseQuestions(draft.questionsJson),
        premiumOnly: draft.premiumOnly,
        published: draft.published,
      });
      reset();
      showNotice('success', 'Lesson saved.');
    } catch (err) {
      showNotice('error', `Could not save lesson. ${getFriendlyErrorMessage(err)}`);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!window.confirm(`Delete "${lesson.title.en || lesson.id}"?`)) return;
    try {
      await deleteLesson(lesson.id);
      showNotice('success', 'Lesson deleted.');
    } catch (err) {
      showNotice('error', `Could not delete lesson. ${getFriendlyErrorMessage(err)}`);
    }
  };

  const set = (key: keyof LessonDraft, val: unknown) =>
    setDraft((d) => ({ ...d, [key]: val }));

  return (
    <>
      <div className="page-header">
        <h1>Lessons</h1>
        <p>Create and manage the lesson content for the mobile app</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      <div className="two-col">
        {/* Form */}
        <form className="card stack" onSubmit={handleSave}>
          <div className="section-header">
            <div>
              <h2>{editingId ? 'Edit Lesson' : 'Create Lesson'}</h2>
              <p>Lessons are displayed to learners inside each category</p>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">Loading…</div>
          ) : !categories.length ? (
            <div className="empty-state">
              <h3>Create a category first</h3>
              <p>Lessons need a category before they can be saved.</p>
            </div>
          ) : (
            <>
              <div className="form-grid">
                <label className="field">
                  <span>Category</span>
                  <select value={draft.categoryId} onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value, ...(editingId ? {} : { order: nextLessonOrder(lessons, e.target.value) }) }))} required>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.title.en || c.id}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Order</span>
                  <input type="number" value={draft.order} onChange={(e) => set('order', Number(e.target.value))} min={1} required />
                </label>
                <label className="field">
                  <span>Duration (minutes)</span>
                  <input type="number" value={draft.duration} onChange={(e) => set('duration', Number(e.target.value))} min={1} required />
                </label>
                <label className="field">
                  <span>Icon</span>
                  <input value={draft.icon} onChange={(e) => set('icon', e.target.value)} placeholder="alert-circle" required />
                </label>
                <div className="toggle-cluster">
                  <label className="toggle-field">
                    <input type="checkbox" checked={draft.published} onChange={(e) => set('published', e.target.checked)} />
                    <span>Published</span>
                  </label>
                  <label className="toggle-field">
                    <input type="checkbox" checked={draft.premiumOnly} onChange={(e) => set('premiumOnly', e.target.checked)} />
                    <span>Premium only</span>
                  </label>
                </div>
              </div>

              <MultiLangFields
                label="Lesson title"
                value={draft.title}
                onChange={(lang, val) => setDraft((d) => ({ ...d, title: { ...d.title, [lang]: val } }))}
              />

              <MultiLangFields
                label="Lesson content"
                value={draft.content}
                onChange={(lang, val) => setDraft((d) => ({ ...d, content: { ...d.content, [lang]: val } }))}
                multiline
              />

              <label className="field">
                <span>Questions JSON</span>
                <textarea
                  value={draft.questionsJson}
                  onChange={(e) => set('questionsJson', e.target.value)}
                  rows={12}
                />
                <small>Array of question objects with id, question, options, and explanation.</small>
              </label>

              <div className="flex-row">
                <button className="btn btn-primary" type="submit">
                  {editingId ? 'Update lesson' : 'Save lesson'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={reset}>Reset</button>
              </div>
            </>
          )}
        </form>

        {/* List */}
        <div className="card stack">
          <div className="section-header">
            <div>
              <h2>Existing Lessons</h2>
              <p>Every lesson here is available in the mobile app</p>
            </div>
          </div>

          {lessons.length ? (
            <div className="list">
              {lessons.map((lesson) => {
                const cat = categories.find((c) => c.id === lesson.categoryId);
                return (
                  <div key={lesson.id} className="list-item">
                    <div>
                      <strong>{lesson.title.en || lesson.id}</strong>
                      <p>{cat?.title.en || lesson.categoryId} · {lesson.duration} min · {lesson.questions.length} questions</p>
                    </div>
                    <div className="flex-row">
                      <span className={`badge ${lesson.published ? 'badge-success' : 'badge-muted'}`}>
                        {lesson.published ? 'Published' : 'Hidden'}
                      </span>
                      {lesson.premiumOnly && <span className="badge badge-warning">Premium</span>}
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(lesson)}>Edit</button>
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => void handleDelete(lesson)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No lessons yet</h3>
              <p>Create a lesson or seed the catalog from the Dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
