'use client';

import React, { useRef, useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { cloneMultiLang } from '@/lib/utils';
import type { ExamQuestion } from '@/lib/types';

/* ── Types ─────────────────────────────────────────────────── */

interface OptionDraft {
  en: string;
  rw: string;
  fr: string;
}

interface QuestionDraft {
  id: string;
  question: MultiLang;
  options: [OptionDraft, OptionDraft, OptionDraft, OptionDraft];
  correctIndex: number;
  explanation: MultiLang;
  categoryId: string;
}

type FormMode = 'manual' | 'import';

/* ── Helpers ───────────────────────────────────────────────── */

function emptyOption(): OptionDraft {
  return { en: '', rw: '', fr: '' };
}

function createDraft(): QuestionDraft {
  return {
    id: '',
    question: { en: '', fr: '', rw: '' },
    options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
    correctIndex: 0,
    explanation: { en: '', fr: '', rw: '' },
    categoryId: '',
  };
}

function nextQuestionId(questions: ExamQuestion[]): string {
  let max = 0;
  for (const q of questions) {
    const m = q.id.match(/^q-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `q-${max + 1}`;
}

function draftToExamQuestion(
  draft: QuestionDraft,
): Omit<ExamQuestion, 'createdAt' | 'updatedAt'> {
  return {
    id: draft.id.trim(),
    question: cloneMultiLang(draft.question),
    options: draft.options.map((opt, idx) => ({
      text: { en: opt.en.trim(), fr: opt.fr.trim(), rw: opt.rw.trim() },
      isCorrect: idx === draft.correctIndex,
    })),
    explanation: cloneMultiLang(draft.explanation),
    ...(draft.categoryId ? { categoryId: draft.categoryId } : {}),
  };
}

/* ── JSON import converter ─────────────────────────────────── */

interface RawImportQuestion {
  question?: string;
  question_id?: string | number;
  ans?: Array<{ ans?: string; correctness?: string }>;
}

function convertRawQuestion(
  raw: RawImportQuestion,
  index: number,
  categoryId?: string,
): Omit<ExamQuestion, 'createdAt' | 'updatedAt'> {
  const id = raw.question_id != null ? `q-${raw.question_id}` : `q-${index + 1}`;
  const answers = Array.isArray(raw.ans) ? raw.ans : [];
  return {
    id,
    question: { rw: (raw.question ?? '').trim(), en: '', fr: '' },
    options: answers.slice(0, 4).map((a) => ({
      text: { rw: (a.ans ?? '').trim(), en: '', fr: '' },
      isCorrect: a.correctness === 'correct',
    })),
    explanation: { en: '', fr: '', rw: '' },
    ...(categoryId ? { categoryId } : {}),
  };
}

/* ── Sub-components ────────────────────────────────────────── */

function OptionsEditor({
  options,
  correctIndex,
  onOptionChange,
  onCorrectChange,
}: {
  options: QuestionDraft['options'];
  correctIndex: number;
  onOptionChange: (idx: number, val: string) => void;
  onCorrectChange: (idx: number) => void;
}) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-strong)' }}>
        Options
      </div>

      {options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isCorrect = correctIndex === idx;
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${isCorrect ? 'var(--brand)' : 'var(--input-border)'}`,
              background: isCorrect ? 'rgba(79,110,247,0.06)' : 'var(--input-bg)',
            }}
          >
            <input
              type="radio"
              name="correct-option"
              checked={isCorrect}
              onChange={() => onCorrectChange(idx)}
              style={{ accentColor: 'var(--brand)', flexShrink: 0 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.8rem',
                color: isCorrect ? 'var(--brand)' : 'var(--muted)',
                width: 18,
                flexShrink: 0,
              }}
            >
              {letter}
            </span>
            <input
              value={opt.rw}
              onChange={(e) => onOptionChange(idx, e.target.value)}
              placeholder={`Option ${letter}`}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--input-text)',
                fontSize: '0.875rem',
              }}
            />
            {isCorrect && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--brand)',
                  background: 'rgba(79,110,247,0.12)',
                  padding: '2px 8px',
                  borderRadius: 99,
                  flexShrink: 0,
                }}
              >
                Correct
              </span>
            )}
          </div>
        );
      })}
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
        Select the radio button next to the correct answer.
      </p>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */

export default function QuestionsPage() {
  const { categories, examQuestions, isLoading, saveExamQuestion, deleteExamQuestion, importExamQuestions } =
    useAdminData();

  const [draft, setDraft] = useState<QuestionDraft>(createDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('manual');
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importPreview, setImportPreview] = useState<string | null>(null);
  const [importParsed, setImportParsed] = useState<RawImportQuestion[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Search/filter for list
  const [search, setSearch] = useState('');

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(createDraft());
  };

  const startEdit = (q: ExamQuestion) => {
    const options = q.options.slice(0, 4);
    while (options.length < 4) options.push({ text: { en: '', fr: '', rw: '' }, isCorrect: false });
    const correctIndex = options.findIndex((o) => o.isCorrect);
    setEditingId(q.id);
    setDraft({
      id: q.id,
      question: cloneMultiLang(q.question),
      options: options.map((o) => ({
        en: o.text.en,
        rw: o.text.rw,
        fr: o.text.fr,
      })) as QuestionDraft['options'],
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: cloneMultiLang(q.explanation),
      categoryId: q.categoryId ?? '',
    });
    setFormMode('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasQuestionText =
      draft.question.rw.trim() || draft.question.en.trim() || draft.question.fr.trim();
    if (!hasQuestionText) return showNotice('error', 'Question text is required in at least one language.');
    const effectiveId = editingId ?? nextQuestionId(examQuestions);
    setIsSaving(true);
    try {
      await saveExamQuestion(draftToExamQuestion({ ...draft, id: effectiveId }));
      reset();
      showNotice('success', 'Question saved.');
    } catch (err) {
      showNotice('error', `Could not save: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (q: ExamQuestion) => {
    if (!window.confirm(`Delete question "${q.id}"?`)) return;
    try {
      await deleteExamQuestion(q.id);
      showNotice('success', 'Question deleted.');
    } catch (err) {
      showNotice('error', `Could not delete: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportParsed(null);
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as unknown;
        if (!Array.isArray(raw)) throw new Error('Expected a JSON array.');
        setImportParsed(raw as RawImportQuestion[]);
        setImportPreview(`${(raw as RawImportQuestion[]).length} questions found in file.`);
      } catch (err) {
        setImportPreview(`Error: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
        setImportParsed(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importParsed || importParsed.length === 0) return;
    setIsImporting(true);
    try {
      const converted = importParsed.map((raw, i) =>
        convertRawQuestion(raw, i, importCategoryId || undefined),
      );
      const count = await importExamQuestions(converted);
      showNotice('success', `${count} questions imported successfully.`);
      setImportFile(null);
      setImportParsed(null);
      setImportPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      showNotice('error', `Import failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const setQ = (key: keyof QuestionDraft, val: unknown) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const setOptionRw = (idx: number, val: string) => {
    setDraft((d) => {
      const opts = d.options.map((o, i) =>
        i === idx ? { ...o, rw: val } : o,
      ) as QuestionDraft['options'];
      return { ...d, options: opts };
    });
  };

  const filtered = examQuestions.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.id.toLowerCase().includes(s) ||
      q.question.rw.toLowerCase().includes(s) ||
      q.question.en.toLowerCase().includes(s)
    );
  });

  return (
    <>
      <div className="page-header">
        <h1>Exam Questions</h1>
        <p>
          Create questions manually or import them from a JSON file. Questions are used in the mobile app exam.
        </p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      <div className="two-col">
        {/* ── Left: Form ─────────────────────────────────────── */}
        <div className="card stack">
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--divider)', paddingBottom: 14 }}>
            {(['manual', 'import'] as FormMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setFormMode(mode); reset(); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--input-border)',
                  background: formMode === mode ? 'var(--brand)' : 'var(--input-bg)',
                  color: formMode === mode ? '#fff' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {mode === 'manual' ? 'Manual' : 'Import JSON'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="loading-state">Loading…</div>
          ) : formMode === 'manual' ? (
            /* ── Manual form ─────────────────────────────────── */
            <form className="stack" onSubmit={(e) => void handleSave(e)}>
              <div className="section-header">
                <div>
                  <h2>{editingId ? 'Edit Question' : 'Create Question'}</h2>
                  <p>Add a single question with multilingual options</p>
                </div>
              </div>

              {/* Auto-ID display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-strong)' }}>
                  ID:
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'rgba(79,110,247,0.12)',
                    color: 'var(--brand-light)',
                    padding: '3px 12px',
                    borderRadius: 99,
                  }}
                >
                  {editingId ?? nextQuestionId(examQuestions)}
                </span>
                {!editingId && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    auto-assigned
                  </span>
                )}
              </div>

              <label className="field">
                <span>Category (optional)</span>
                <select
                  value={draft.categoryId}
                  onChange={(e) => setQ('categoryId', e.target.value)}
                >
                  <option value="">— No category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title.en || cat.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Question text</span>
                <textarea
                  rows={3}
                  value={draft.question.rw}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, question: { ...d.question, rw: e.target.value } }))
                  }
                  placeholder="Andika ikibazo hano…"
                  required
                />
              </label>

              <OptionsEditor
                options={draft.options}
                correctIndex={draft.correctIndex}
                onOptionChange={setOptionRw}
                onCorrectChange={(idx) => setQ('correctIndex', idx)}
              />

              <label className="field">
                <span>Explanation (optional)</span>
                <textarea
                  rows={2}
                  value={draft.explanation.rw}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, explanation: { ...d.explanation, rw: e.target.value } }))
                  }
                  placeholder="Ibisobanuro (ntibisabwa)…"
                />
              </label>

              <div className="flex-row">
                <button className="btn btn-primary" type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Saving…
                    </>
                  ) : (
                    editingId ? 'Update question' : 'Save question'
                  )}
                </button>
                <button className="btn btn-secondary" type="button" onClick={reset} disabled={isSaving}>
                  Reset
                </button>
              </div>
            </form>
          ) : (
            /* ── Import JSON form ───────────────────────────── */
            <div className="stack">
              <div className="section-header">
                <div>
                  <h2>Import from JSON</h2>
                  <p>
                    Upload a JSON file in the standard format. Questions in Kinyarwanda are mapped automatically.
                  </p>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed var(--input-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 180ms',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--input-border)')
                }
              >
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📂</div>
                <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>
                  {importFile ? importFile.name : 'Click to choose a JSON file'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Expected format: array of {'{'}question, question_id, ans[]{'}'}
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {importPreview && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: importParsed
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(239,68,68,0.08)',
                    color: importParsed ? '#10b981' : '#ef4444',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: `1px solid ${importParsed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}
                >
                  {importPreview}
                </div>
              )}

              <label className="field">
                <span>Assign category to all imported questions (optional)</span>
                <select
                  value={importCategoryId}
                  onChange={(e) => setImportCategoryId(e.target.value)}
                >
                  <option value="">— No category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title.en || cat.id}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-strong)' }}>JSON format expected:</strong>
                <pre
                  style={{
                    marginTop: 6,
                    padding: '10px 12px',
                    background: 'var(--input-bg)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    color: 'var(--text)',
                    border: '1px solid var(--input-border)',
                  }}
                >{`[
                    {
                      "question_id": "1",
                      "question": "Question text…",
                      "ans": [
                        { "ans": "Option A", "correctness": "wrong" },
                        { "ans": "Option B", "correctness": "correct" }
                      ]
                    }
                    ]`}
                  </pre>
              </div>

              <button
                className="btn btn-primary btn-full"
                type="button"
                onClick={() => void handleImport()}
                disabled={!importParsed || importParsed.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Importing…
                  </>
                ) : (
                  `Import ${importParsed ? `${importParsed.length} Questions` : ''}`
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Question list ─────────────────────────── */}
        <div className="card stack">
          <div className="section-header">
            <div>
              <h2>Question Bank</h2>
              <p>{examQuestions.length} question{examQuestions.length !== 1 ? 's' : ''} in Firestore</p>
            </div>
          </div>

          <label className="field">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or question text…"
            />
          </label>

          {examQuestions.length === 0 ? (
            <div className="empty-state">
              <h3>No questions yet</h3>
              <p>Create one manually or import from a JSON file.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No matches</h3>
              <p>Try a different search term.</p>
            </div>
          ) : (
            <div className="list" style={{ maxHeight: 600, overflowY: 'auto' }}>
              {filtered.map((q) => {
                const correctOpt = q.options.find((o) => o.isCorrect);
                const preview =
                  (q.question.rw || q.question.en || '').slice(0, 80) +
                  ((q.question.rw || q.question.en || '').length > 80 ? '…' : '');
                const catName = categories.find((c) => c.id === q.categoryId)?.title.en;
                return (
                  <div key={q.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'rgba(79,110,247,0.12)',
                              color: 'var(--brand-light)',
                              padding: '2px 8px',
                              borderRadius: 99,
                            }}
                          >
                            {q.id}
                          </span>
                          {catName && (
                            <span className="badge badge-info">{catName}</span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text)',
                            lineHeight: 1.4,
                            marginBottom: correctOpt ? 4 : 0,
                          }}
                        >
                          {preview || <em style={{ color: 'var(--muted)' }}>No text</em>}
                        </p>
                        {correctOpt && (
                          <p style={{ fontSize: '0.75rem', color: '#10b981' }}>
                            ✓ {(correctOpt.text.rw || correctOpt.text.en || '').slice(0, 60)}
                          </p>
                        )}
                      </div>
                      <div className="flex-row" style={{ flexShrink: 0 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => startEdit(q)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={() => void handleDelete(q)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
