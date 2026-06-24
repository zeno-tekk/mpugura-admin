'use client';

import React, { useRef, useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { cloneMultiLang } from '@/lib/utils';
import type { ExamQuestion, MultiLang } from '@/lib/types';

/* ── Icons ─────────────────────────────────────────────────── */

const IcUpload = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IcLink = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IcImage = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcPhone = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const IcFolder = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const IcRefresh = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IcX = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcCheck = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcChevronDown = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcEye = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IcGrid = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const IcImgSmall = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcClock = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IcCalendar = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/* ── Types ─────────────────────────────────────────────────── */

interface OptionDraft {
  en: string;
  rw: string;
  fr: string;
  imageUrl: string;
}

interface QuestionDraft {
  id: string;
  question: MultiLang;
  options: [OptionDraft, OptionDraft, OptionDraft, OptionDraft];
  correctIndex: number;
  explanation: MultiLang;
  categoryId: string;
  imageUrl: string;
}

type FormMode = 'manual' | 'import';
type ImageMode = 'upload' | 'url';

/* ── Helpers ───────────────────────────────────────────────── */

function emptyOption(): OptionDraft {
  return { en: '', rw: '', fr: '', imageUrl: '' };
}

function createDraft(): QuestionDraft {
  return {
    id: '',
    question: { en: '', fr: '', rw: '' },
    options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
    correctIndex: 0,
    explanation: { en: '', fr: '', rw: '' },
    categoryId: '',
    imageUrl: '',
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
      ...(opt.imageUrl.trim() ? { imageUrl: opt.imageUrl.trim() } : {}),
    })),
    explanation: cloneMultiLang(draft.explanation),
    ...(draft.categoryId ? { categoryId: draft.categoryId } : {}),
    ...(draft.imageUrl.trim() ? { imageUrl: draft.imageUrl.trim() } : {}),
  };
}

/* ── JSON import converter ─────────────────────────────────── */

interface RawAns {
  ans?: string;
  correctness?: string;
  img?: string;
  image?: string;
  img_url?: string;
}

interface RawImportQuestion {
  question?: string;
  question_id?: string | number;
  ans?: RawAns[];
  image?: string;
  image_url?: string;
  img_url?: string;
}

function convertRawQuestion(
  raw: RawImportQuestion,
  index: number,
  categoryId?: string,
): Omit<ExamQuestion, 'createdAt' | 'updatedAt'> {
  const id = raw.question_id != null ? `q-${raw.question_id}` : `q-${index + 1}`;
  const answers = Array.isArray(raw.ans) ? raw.ans : [];
  const qImg = raw.image ?? raw.image_url ?? raw.img_url ?? '';
  return {
    id,
    question: { rw: (raw.question ?? '').trim(), en: '', fr: '' },
    options: answers.slice(0, 4).map((a) => {
      const optImg = a.img ?? a.image ?? a.img_url ?? '';
      return {
        text: { rw: (a.ans ?? '').trim(), en: '', fr: '' },
        isCorrect: a.correctness === 'correct',
        ...(optImg ? { imageUrl: optImg } : {}),
      };
    }),
    explanation: { en: '', fr: '', rw: '' },
    ...(categoryId ? { categoryId } : {}),
    ...(qImg ? { imageUrl: qImg } : {}),
  };
}

/* ── PhonePreview ──────────────────────────────────────────── */

function PhonePreview({ question, onClose }: { question: ExamQuestion; onClose: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<'question' | 'result'>('question');

  React.useEffect(() => {
    setSelectedIdx(null);
    setPhase('question');
  }, [question.id, question.question.rw]);

  const handleSelect = (idx: number) => {
    if (phase === 'result') return;
    setSelectedIdx(idx);
    setPhase('result');
  };

  const hasOptImages = question.options.some((o) => o.imageUrl);

  const getOptBg = (idx: number): string => {
    if (phase !== 'result') return '#fff';
    if (question.options[idx].isCorrect) return '#10B981';
    if (idx === selectedIdx) return '#EF4444';
    return '#fff';
  };

  const getOptBorder = (idx: number): string => {
    if (phase === 'result') {
      if (question.options[idx].isCorrect) return '#10B981';
      if (idx === selectedIdx) return '#EF4444';
      return '#E5E7EB';
    }
    if (idx === selectedIdx) return '#1E3A8A';
    return '#E5E7EB';
  };

  const getOptOpacity = (idx: number): number =>
    phase === 'result' && !question.options[idx].isCorrect && idx !== selectedIdx ? 0.45 : 1;

  const isLight = (idx: number) =>
    phase !== 'result' || (!question.options[idx].isCorrect && idx !== selectedIdx);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 16px' }}>
      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          Previewing <strong style={{ color: 'var(--text-strong)' }}>{question.id}</strong>
        </span>
        {phase === 'result' && (
          <button
            type="button"
            onClick={() => { setSelectedIdx(null); setPhase('question'); }}
            style={{ fontSize: '0.72rem', color: 'var(--brand)', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 'var(--radius-md)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <IcRefresh /> Reset
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          style={{ fontSize: '0.72rem', color: 'var(--muted)', background: 'transparent', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-md)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <IcX /> Close
        </button>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
        Tap an option to simulate the answer
      </p>

      {/* Phone frame */}
      <div style={{
        background: '#0f172a',
        borderRadius: 44,
        padding: 12,
        width: 304,
        flexShrink: 0,
        boxShadow: '0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
        position: 'relative',
      }}>
        {/* Buttons */}
        <div style={{ position: 'absolute', right: -3, top: 110, width: 3, height: 44, background: '#1e293b', borderRadius: '0 2px 2px 0' }} />
        <div style={{ position: 'absolute', left: -3, top: 90, width: 3, height: 32, background: '#1e293b', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: -3, top: 134, width: 3, height: 32, background: '#1e293b', borderRadius: '2px 0 0 2px' }} />

        {/* Screen */}
        <div style={{ background: '#F3F4F6', borderRadius: 34, overflow: 'hidden', height: 584, display: 'flex', flexDirection: 'column' }}>

          {/* Status bar */}
          <div style={{ background: '#1E3A8A', padding: '7px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, paddingBottom: 6 }}>9:41</span>
            {/* Camera notch */}
            <div style={{ width: 24, height: 24, borderRadius: 12, background: '#0f172a', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: '#1e293b' }} />
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', paddingBottom: 6 }}>
              {[6, 9, 12, 14].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, background: i < 3 ? '#fff' : 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
              ))}
              <span style={{ color: '#fff', fontSize: 9, marginLeft: 2 }}>100%</span>
            </div>
          </div>

          {/* App exam header */}
          <div style={{ background: '#1E3A8A', padding: '6px 14px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IcClock size={11} />
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>19:52</span>
            </div>
            <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>Ikizamini</span>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 8px', fontSize: 10, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
              <IcGrid size={9} /> 1/20
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* Question card */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                IKIBAZO 1 KURI 20
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937', lineHeight: 1.55 }}>
                {question.question.rw || question.question.en || <em style={{ color: '#9CA3AF' }}>No question text</em>}
              </div>
            </div>

            {/* Question image */}
            {question.imageUrl && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={question.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 110, objectFit: 'contain', borderRadius: 6 }} />
              </div>
            )}

            {/* Options - image grid */}
            {hasOptImages ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {question.options.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    style={{
                      background: getOptBg(idx),
                      border: `1.5px solid ${getOptBorder(idx)}`,
                      borderRadius: 10, padding: 6,
                      minHeight: 78, position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: phase === 'result' ? 'default' : 'pointer',
                      opacity: getOptOpacity(idx),
                      transition: 'all 150ms',
                    }}
                  >
                    <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 8, fontWeight: 700, color: isLight(idx) ? '#9CA3AF' : '#fff' }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={opt.imageUrl} alt="" style={{ width: '75%', height: 54, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 9, color: isLight(idx) ? '#1F2937' : '#fff', textAlign: 'center', padding: '14px 4px 0' }}>
                        {opt.text.rw || opt.text.en}
                      </span>
                    )}
                    {phase === 'result' && (opt.isCorrect || idx === selectedIdx) && (
                      <span style={{ position: 'absolute', bottom: 3, right: 5, color: '#fff', display: 'flex' }}>
                        {opt.isCorrect ? <IcCheck size={11} /> : <IcX size={11} />}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Options - text list */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {question.options.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    style={{
                      background: getOptBg(idx),
                      border: `1.5px solid ${getOptBorder(idx)}`,
                      borderRadius: 10, padding: '7px 10px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      cursor: phase === 'result' ? 'default' : 'pointer',
                      opacity: getOptOpacity(idx),
                      transition: 'all 150ms',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                      background: isLight(idx) ? '#F3F4F6' : 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: isLight(idx) ? '#1F2937' : '#fff' }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: isLight(idx) ? '#1F2937' : '#fff', lineHeight: 1.4, flex: 1 }}>
                      {opt.text.rw || opt.text.en || <em style={{ color: '#9CA3AF' }}>Empty</em>}
                    </span>
                    {phase === 'result' && opt.isCorrect && <span style={{ color: '#fff', display: 'flex' }}><IcCheck size={13} /></span>}
                    {phase === 'result' && idx === selectedIdx && !opt.isCorrect && <span style={{ color: '#fff', display: 'flex' }}><IcX size={13} /></span>}
                  </div>
                ))}
              </div>
            )}

            {/* Explanation */}
            {phase === 'result' && (question.explanation.rw || question.explanation.en) && (
              <div style={{
                background: '#fff', borderRadius: 12, padding: '8px 12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${question.options[selectedIdx ?? 0]?.isCorrect ? '#10B981' : '#EF4444'}`,
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  IBISOBANURO
                </div>
                <div style={{ fontSize: 10, color: '#1F2937', lineHeight: 1.45 }}>
                  {question.explanation.rw || question.explanation.en}
                </div>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: '#F3F4F6' }}>
            {(['← Garuka', 'Komeza →'] as const).map((label) => (
              <div key={label} style={{ border: '1.5px solid #1E3A8A', borderRadius: 20, padding: '4px 14px', fontSize: 10, fontWeight: 700, color: '#1E3A8A' }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', maxWidth: 280, margin: 0 }}>
        Green = correct · Red = wrong · Click Reset to try again
      </p>
    </div>
  );
}

/* ── OptionsEditor ─────────────────────────────────────────── */

const smallBtn: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)',
  background: 'transparent', border: '1px solid var(--input-border)',
  borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer', flexShrink: 0,
};

function OptionsEditor({
  options, correctIndex, onOptionChange, onCorrectChange, onOptionImageChange,
}: {
  options: QuestionDraft['options'];
  correctIndex: number;
  onOptionChange: (idx: number, val: string) => void;
  onCorrectChange: (idx: number) => void;
  onOptionImageChange: (idx: number, url: string) => void;
}) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const pendingIdxRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = (idx: number) => {
    pendingIdxRef.current = idx;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = pendingIdxRef.current;
    if (!file || idx === null) return;
    setUploadingIdx(idx);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      onOptionImageChange(idx, url);
    } catch (err) {
      alert(`Option image upload failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setUploadingIdx(null);
      pendingIdxRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-strong)' }}>Options</div>

      {options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isCorrect = correctIndex === idx;
        const isUploading = uploadingIdx === idx;
        return (
          <div key={idx} style={{ borderRadius: 'var(--radius-md)', border: `1.5px solid ${isCorrect ? 'var(--brand)' : 'var(--input-border)'}`, background: isCorrect ? 'rgba(79,110,247,0.06)' : 'var(--input-bg)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
              <input type="radio" name="correct-option" checked={isCorrect} onChange={() => onCorrectChange(idx)} style={{ accentColor: 'var(--brand)', flexShrink: 0, width: 16, height: 16 }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isCorrect ? 'var(--brand)' : 'var(--muted)', width: 20, flexShrink: 0 }}>{letter}</span>
              <input value={opt.rw} onChange={(e) => onOptionChange(idx, e.target.value)} placeholder={`Option ${letter}${opt.imageUrl ? ' (optional)' : ' text'}`} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--input-text)', fontSize: '0.95rem', padding: '2px 0' }} />
              {isCorrect && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand)', background: 'rgba(79,110,247,0.12)', padding: '3px 10px', borderRadius: 99, flexShrink: 0 }}>Correct</span>}
            </div>
            <div style={{ borderTop: '1px solid var(--divider)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.02)' }}>
              {opt.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={opt.imageUrl} alt="" style={{ width: 52, height: 40, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--input-border)', flexShrink: 0 }} />
                  <button type="button" onClick={() => triggerUpload(idx)} style={smallBtn}>Replace</button>
                  <button type="button" onClick={() => onOptionImageChange(idx, '')} style={{ ...smallBtn, display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', borderColor: '#ef4444' }}><IcX /> Remove</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => triggerUpload(idx)} disabled={isUploading} style={{ ...smallBtn, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isUploading ? <><span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(79,110,247,0.3)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Uploading…</> : <><IcUpload /> Upload image</>}
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>or</span>
                  <input type="url" value={opt.imageUrl} onChange={(e) => onOptionImageChange(idx, e.target.value)} placeholder="Paste image URL…" style={{ flex: 1, fontSize: '0.82rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--input-text)' }} />
                </>
              )}
            </div>
          </div>
        );
      })}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void handleFileChange(e)} />
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Select the radio next to the correct answer. Each option can have text, an image, or both.</p>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */

export default function QuestionsPage() {
  const { categories, examQuestions, isLoading, saveExamQuestion, deleteExamQuestion, importExamQuestions } = useAdminData();

  const [draft, setDraft] = useState<QuestionDraft>(createDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('manual');
  const [imageMode, setImageMode] = useState<ImageMode>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<ExamQuestion | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importPreview, setImportPreview] = useState<string | null>(null);
  const [importParsed, setImportParsed] = useState<RawImportQuestion[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterImage, setFilterImage] = useState<'all' | 'q-image' | 'opt-images'>('all');

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const reset = () => { setEditingId(null); setDraft(createDraft()); setImageMode('upload'); };

  const openPreview = (q: ExamQuestion) => {
    setPreviewQuestion(q);
    setShowPreview(true);
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const previewDraft = () => {
    const effectiveId = editingId ?? nextQuestionId(examQuestions);
    const q: ExamQuestion = { ...draftToExamQuestion({ ...draft, id: effectiveId }), createdAt: null, updatedAt: null };
    openPreview(q);
  };

  const startEdit = (q: ExamQuestion) => {
    const options = q.options.slice(0, 4);
    while (options.length < 4) options.push({ text: { en: '', fr: '', rw: '' }, isCorrect: false });
    const correctIndex = options.findIndex((o) => o.isCorrect);
    setEditingId(q.id);
    setDraft({
      id: q.id,
      question: cloneMultiLang(q.question),
      options: options.map((o) => ({ en: o.text.en, rw: o.text.rw, fr: o.text.fr, imageUrl: o.imageUrl ?? '' })) as QuestionDraft['options'],
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: cloneMultiLang(q.explanation),
      categoryId: q.categoryId ?? '',
      imageUrl: q.imageUrl ?? '',
    });
    setImageMode(q.imageUrl ? 'url' : 'upload');
    setFormMode('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      setDraft((d) => ({ ...d, imageUrl: url }));
    } catch (err) {
      showNotice('error', `Image upload failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsUploadingImage(false);
      if (imageFileRef.current) imageFileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = draft.question.rw.trim() || draft.question.en.trim();
    if (!hasText) return showNotice('error', 'Question text is required.');
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
      if (previewQuestion?.id === q.id) setPreviewQuestion(null);
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
      const converted = importParsed.map((raw, i) => convertRawQuestion(raw, i, importCategoryId || undefined));
      const count = await importExamQuestions(converted);
      showNotice('success', `${count} questions imported successfully.`);
      setImportFile(null); setImportParsed(null); setImportPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      showNotice('error', `Import failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const setQ = (key: keyof QuestionDraft, val: unknown) => setDraft((d) => ({ ...d, [key]: val }));
  const setOptionRw = (idx: number, val: string) => setDraft((d) => { const opts = d.options.map((o, i) => i === idx ? { ...o, rw: val } : o) as QuestionDraft['options']; return { ...d, options: opts }; });
  const setOptionImage = (idx: number, url: string) => setDraft((d) => { const opts = d.options.map((o, i) => i === idx ? { ...o, imageUrl: url } : o) as QuestionDraft['options']; return { ...d, options: opts }; });

  const filtered = examQuestions.filter((q) => {
    const s = search.toLowerCase();
    const matchSearch = !s || q.id.toLowerCase().includes(s) || q.question.rw.toLowerCase().includes(s) || q.question.en.toLowerCase().includes(s);
    const matchDate = !filterDate || (q.createdAt ?? '').startsWith(filterDate.toISOString().slice(0, 10));
    const matchImage =
      filterImage === 'all' ||
      (filterImage === 'q-image' && !!q.imageUrl) ||
      (filterImage === 'opt-images' && q.options.some((o) => o.imageUrl));
    return matchSearch && matchDate && matchImage;
  });

  const spinner = <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;

  return (
    <>
      <div className="page-header">
        <h1>Exam Questions</h1>
        <p>Create questions manually or import from JSON. All question and answer types are supported.</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      <div className="two-col">
        {/* ── Left: Form ──────────────────────────────────── */}
        <div className="card stack">
          <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--divider)', paddingBottom: 14 }}>
            {(['manual', 'import'] as FormMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => { setFormMode(mode); reset(); }} style={{ padding: '6px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--input-border)', background: formMode === mode ? 'var(--brand)' : 'var(--input-bg)', color: formMode === mode ? '#fff' : 'var(--muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                {mode === 'manual' ? 'Manual' : 'Import JSON'}
              </button>
            ))}
          </div>

          {isLoading ? <div className="loading-state">Loading…</div> : formMode === 'manual' ? (
            <form className="stack" onSubmit={(e) => void handleSave(e)}>
              <div className="section-header">
                <div>
                  <h2>{editingId ? 'Edit Question' : 'Create Question'}</h2>
                  <p>Question image + up to 4 options, each with optional image</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-strong)' }}>ID:</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, background: 'rgba(79,110,247,0.12)', color: 'var(--brand-light)', padding: '3px 12px', borderRadius: 99 }}>{editingId ?? nextQuestionId(examQuestions)}</span>
                {!editingId && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>auto-assigned</span>}
              </div>

              <label className="field">
                <span>Category (optional)</span>
                <select value={draft.categoryId} onChange={(e) => setQ('categoryId', e.target.value)}>
                  <option value="">- No category -</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.title.en || cat.id}</option>)}
                </select>
              </label>

              <label className="field">
                <span>Question text</span>
                <textarea rows={3} value={draft.question.rw} onChange={(e) => setDraft((d) => ({ ...d, question: { ...d.question, rw: e.target.value } }))} placeholder="Andika ikibazo hano…" required />
              </label>

              {/* Question image */}
              <div className="stack" style={{ gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-strong)' }}>Question image (optional)</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['upload', 'url'] as ImageMode[]).map((mode) => (
                      <button key={mode} type="button" onClick={() => setImageMode(mode)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--input-border)', background: imageMode === mode ? 'var(--brand)' : 'var(--input-bg)', color: imageMode === mode ? '#fff' : 'var(--muted)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {mode === 'upload' ? <><IcUpload size={12} /> Upload</> : <><IcLink size={12} /> URL</>}
                      </button>
                    ))}
                  </div>
                  {draft.imageUrl && <button type="button" onClick={() => setDraft((d) => ({ ...d, imageUrl: '' }))} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 'var(--radius-md)', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>}
                </div>
                {imageMode === 'upload' ? (
                  <>
                    <input ref={imageFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void handleQImageUpload(e)} />
                    <div onClick={() => !isUploadingImage && imageFileRef.current?.click()} style={{ border: `2px dashed ${isUploadingImage ? 'var(--brand)' : 'var(--input-border)'}`, borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', cursor: isUploadingImage ? 'default' : 'pointer', background: 'var(--input-bg)' }}
                      onMouseEnter={(e) => { if (!isUploadingImage) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand)'; }}
                      onMouseLeave={(e) => { if (!isUploadingImage) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--input-border)'; }}>
                      {isUploadingImage ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(79,110,247,0.3)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Uploading…</span></div>
                      ) : draft.imageUrl ? (
                        <div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={draft.imageUrl} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 6, marginBottom: 6, objectFit: 'contain' }} /><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Click to replace</div></div>
                      ) : (
                        <><div style={{ marginBottom: 6, color: 'var(--muted)' }}><IcImage size={32} /></div><div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Click to upload a question image</div></>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="field" style={{ marginBottom: 0 }}><input type="url" value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} placeholder="https://res.cloudinary.com/…" /></label>
                    {draft.imageUrl && (/* eslint-disable-next-line @next/next/no-img-element */<img src={draft.imageUrl} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, objectFit: 'contain', border: '1px solid var(--input-border)' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />)}
                  </>
                )}
              </div>

              <OptionsEditor options={draft.options} correctIndex={draft.correctIndex} onOptionChange={setOptionRw} onCorrectChange={(idx) => setQ('correctIndex', idx)} onOptionImageChange={setOptionImage} />

              <label className="field">
                <span>Explanation (optional)</span>
                <textarea rows={2} value={draft.explanation.rw} onChange={(e) => setDraft((d) => ({ ...d, explanation: { ...d.explanation, rw: e.target.value } }))} placeholder="Ibisobanuro (ntibisabwa)…" />
              </label>

              <div className="flex-row">
                <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? <>{spinner} Saving…</> : (editingId ? 'Update question' : 'Save question')}</button>
                <button className="btn btn-secondary" type="button" onClick={previewDraft} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IcPhone /> Preview</button>
                <button className="btn btn-secondary" type="button" onClick={reset} disabled={isSaving}>Reset</button>
              </div>
            </form>
          ) : (
            /* ── Import JSON ──────────────────────────────── */
            <div className="stack">
              <div className="section-header"><div><h2>Import from JSON</h2><p>Question text, question image, and per-option images are all imported automatically.</p></div></div>
              <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed var(--input-border)', borderRadius: 'var(--radius-lg)', padding: '32px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 180ms' }} onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand)')} onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--input-border)')}>
                <div style={{ marginBottom: 8, color: 'var(--muted)' }}><IcFolder size={40} /></div>
                <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>{importFile ? importFile.name : 'Click to choose a JSON file'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Array of {'{ question, question_id, image?, ans[]{img?} }'}</div>
              </div>
              <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleFileChange} />
              {importPreview && <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: importParsed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: importParsed ? '#10b981' : '#ef4444', fontSize: '0.875rem', fontWeight: 600, border: `1px solid ${importParsed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>{importPreview}</div>}
              <label className="field">
                <span>Assign category to all imported questions (optional)</span>
                <select value={importCategoryId} onChange={(e) => setImportCategoryId(e.target.value)}>
                  <option value="">- No category -</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.title.en || cat.id}</option>)}
                </select>
              </label>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-strong)' }}>JSON format:</strong>
                <pre style={{ marginTop: 6, padding: '10px 12px', background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', overflow: 'auto', color: 'var(--text)', border: '1px solid var(--input-border)' }}>{`[\n  {\n    "question_id": "249",\n    "question": "Icyapa gitanga…",\n    "image": "https://…",\n    "ans": [\n      { "ans": "", "img": "https://…", "correctness": "wrong" },\n      { "ans": "", "img": "https://…", "correctness": "correct" }\n    ]\n  }\n]`}</pre>
              </div>
              <button className="btn btn-primary btn-full" type="button" onClick={() => void handleImport()} disabled={!importParsed || importParsed.length === 0 || isImporting}>
                {isImporting ? <>{spinner} Importing…</> : `Import ${importParsed ? `${importParsed.length} Questions` : ''}`}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Question bank ─────────────────────────── */}
        <div className="card stack" style={{ position: 'sticky', top: 20, alignSelf: 'start', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden' }}>
          <div className="section-header"><div><h2>Question Bank</h2><p>{examQuestions.length} question{examQuestions.length !== 1 ? 's' : ''} in Firestore</p></div></div>

          {/* Search */}
          <label className="field" style={{ marginBottom: 0 }}><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID or question text…" /></label>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {([['all', 'All'], ['q-image', 'Q image'], ['opt-images', 'Opt images']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFilterImage(val)}
                  style={{
                    padding: '6px 10px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--input-border)',
                    background: filterImage === val ? 'var(--brand)' : 'var(--input-bg)',
                    color: filterImage === val ? '#fff' : 'var(--muted)',
                    fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {val !== 'all' && <IcImgSmall size={10} />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length < examQuestions.length && (
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              Showing {filtered.length} of {examQuestions.length} questions
            </div>
          )}

          {examQuestions.length === 0 ? (
            <div className="empty-state"><h3>No questions yet</h3><p>Create one manually or import from JSON.</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><h3>No matches</h3><p>Try a different search term.</p></div>
          ) : (
            <div className="list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {filtered.map((q) => {
                const correctOpt = q.options.find((o) => o.isCorrect);
                const preview = (q.question.rw || q.question.en || '').slice(0, 80) + ((q.question.rw || q.question.en || '').length > 80 ? '…' : '');
                const catName = categories.find((c) => c.id === q.categoryId)?.title.en;
                const hasOptImages = q.options.some((o) => o.imageUrl);
                const isCurrentPreview = previewQuestion?.id === q.id;
                return (
                  <div key={q.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, outline: isCurrentPreview ? '2px solid var(--brand)' : 'none', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(79,110,247,0.12)', color: 'var(--brand-light)', padding: '2px 8px', borderRadius: 99 }}>{q.id}</span>
                          {catName && <span className="badge badge-info">{catName}</span>}
                          {q.imageUrl && <span title="Has question image" style={{ color: 'var(--muted)', display: 'flex' }}><IcImgSmall /></span>}
                          {hasOptImages && <span title="Options have images" style={{ color: 'var(--muted)', display: 'flex' }}><IcGrid /></span>}
                          {isCurrentPreview && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand)', background: 'rgba(79,110,247,0.12)', padding: '1px 6px', borderRadius: 99 }}>previewing</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          {q.imageUrl && (/* eslint-disable-next-line @next/next/no-img-element */<img src={q.imageUrl} alt="" style={{ width: 48, height: 36, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--input-border)', flexShrink: 0 }} />)}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{preview || <em style={{ color: 'var(--muted)' }}>No text</em>}</p>
                            {hasOptImages && <div style={{ display: 'flex', gap: 4 }}>{q.options.map((o, i) => o.imageUrl ? (/* eslint-disable-next-line @next/next/no-img-element */<img key={i} src={o.imageUrl} alt={String.fromCharCode(65 + i)} style={{ width: 28, height: 22, objectFit: 'contain', borderRadius: 3, border: `1px solid ${o.isCorrect ? '#10b981' : 'var(--input-border)'}` }} />) : null)}</div>}
                            {!hasOptImages && correctOpt && <p style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><IcCheck size={11} /> {(correctOpt.text.rw || correctOpt.text.en || '').slice(0, 60)}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex-row" style={{ flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => openPreview(q)} title="Preview in mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IcEye /> Preview</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(q)}>Edit</button>
                        <button className="btn btn-danger btn-sm" type="button" onClick={() => void handleDelete(q)}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Preview (collapsible) ─────────────────────── */}
      <div ref={previewRef} style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 18px',
            background: 'var(--card-bg, var(--input-bg))',
            border: '1px solid var(--border, var(--input-border))',
            borderRadius: showPreview ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            color: 'var(--text-strong)', textAlign: 'left',
          }}
        >
          <IcPhone size={16} />
          <span>Mobile Preview</span>
          {previewQuestion && (
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
              - {previewQuestion.id}: {(previewQuestion.question.rw || previewQuestion.question.en || '').slice(0, 60)}
            </span>
          )}
          <span style={{ marginLeft: 'auto', color: 'var(--muted)', display: 'inline-flex', transition: 'transform 200ms', transform: showPreview ? 'rotate(180deg)' : 'none' }}><IcChevronDown /></span>
        </button>

        {showPreview && (
          <div style={{ border: '1px solid var(--border, var(--input-border))', borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)', background: 'var(--card-bg, var(--input-bg))' }}>
            {previewQuestion ? (
              <PhonePreview question={previewQuestion} onClose={() => { setPreviewQuestion(null); setShowPreview(false); }} />
            ) : (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><IcPhone size={40} /></div>
                <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>No question selected</p>
                <p style={{ fontSize: '0.85rem', maxWidth: 360, margin: '0 auto' }}>
                  Click <strong>Preview</strong> on any question in the bank, or click <strong>Preview</strong> in the form to see how it looks on the mobile app.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
