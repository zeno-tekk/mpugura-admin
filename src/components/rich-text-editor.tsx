'use client';

import { useEffect, useRef, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { MultiLang } from '@/lib/types';

const LANGS: Array<{ key: keyof MultiLang; title: string }> = [
  { key: 'en', title: 'English' },
  { key: 'rw', title: 'Kinyarwanda' },
  { key: 'fr', title: 'French' },
];

function IcBold() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />
    </svg>
  );
}

function IcItalic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function IcHeading() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M6 12h12" />
    </svg>
  );
}

function IcParagraph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4H9a4 4 0 1 0 0 8h1" /><path d="M14 4v16M10 4v16" />
    </svg>
  );
}

function IcBulletList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
      <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function IcNumberedList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
      <text x="1" y="8.5" fontSize="7" fill="currentColor" stroke="none">1</text>
      <text x="1" y="14.5" fontSize="7" fill="currentColor" stroke="none">2</text>
      <text x="1" y="20.5" fontSize="7" fill="currentColor" stroke="none">3</text>
    </svg>
  );
}

function IcImage() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-block', width: size, height: size, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'currentColor',
        animation: 'spin 0.7s linear infinite', flexShrink: 0,
      }}
    />
  );
}

function IcEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IcPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const toolbarBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--input-border)', background: 'var(--input-bg)',
  color: 'var(--text-strong)', cursor: 'pointer',
};

interface RichTextEditorProps {
  label: string;
  value: MultiLang;
  onChange: (lang: keyof MultiLang, html: string) => void;
}

export function RichTextEditor({ label, value, onChange }: RichTextEditorProps) {
  const [activeLang, setActiveLang] = useState<keyof MultiLang>('en');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Re-sync the editable area's DOM content only when the active language tab
  // changes - never on every keystroke, or the caret would jump to the start.
  useEffect(() => {
    if (mode === 'edit' && editorRef.current) {
      editorRef.current.innerHTML = valueRef.current[activeLang] || '';
    }
  }, [activeLang, mode]);

  const emitChange = () => {
    if (editorRef.current) onChange(activeLang, editorRef.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  // Image uploads are async, so the caret position has to be captured when the
  // toolbar button is clicked (while the editor still has a live selection) and
  // restored once the upload finishes and the file picker has closed.
  const openImagePicker = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    } else {
      savedRangeRef.current = null;
    }
    setUploadError('');
    fileInputRef.current?.click();
  };

  // Inserts at the caret captured in openImagePicker(). If the editor never had a
  // caret in it to begin with (e.g. "Insert image" clicked on a lesson that's still
  // empty, before typing anything), there's nothing for execCommand to insert into
  // and it silently does nothing - so this always falls back to a caret at the end
  // of the content, and to a plain DOM insert if execCommand still doesn't take.
  const insertImageAtCaret = (url: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeUrl = url.replace(/"/g, '&quot;');

    editor.focus();
    const selection = window.getSelection();
    let range: Range | null = null;

    if (savedRangeRef.current && editor.contains(savedRangeRef.current.startContainer)) {
      range = savedRangeRef.current;
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    document.execCommand('insertHTML', false, `<img src="${safeUrl}" alt="">`);

    if (!editor.innerHTML.includes(url)) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    emitChange();
  };

  const handleImageFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'mpugura/lessons');
      const res = await authedFetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      insertImageAtCaret(url);
    } catch (err) {
      setUploadError(`Could not upload the image. ${getFriendlyErrorMessage(err)}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-strong)' }}>{label}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setMode('edit')}
            style={{ ...toolbarBtn, width: 'auto', padding: '0 12px', gap: 6, display: 'flex', fontSize: '0.8rem', fontWeight: 600, background: mode === 'edit' ? 'var(--brand)' : 'var(--input-bg)', color: mode === 'edit' ? '#fff' : 'var(--muted)', borderColor: mode === 'edit' ? 'var(--brand)' : 'var(--input-border)' }}
          >
            <IcPencil /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            style={{ ...toolbarBtn, width: 'auto', padding: '0 12px', gap: 6, display: 'flex', fontSize: '0.8rem', fontWeight: 600, background: mode === 'preview' ? 'var(--brand)' : 'var(--input-bg)', color: mode === 'preview' ? '#fff' : 'var(--muted)', borderColor: mode === 'preview' ? 'var(--brand)' : 'var(--input-border)' }}
          >
            <IcEye /> Preview
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--input-border)' }}>
        {LANGS.map((lang) => (
          <button
            key={lang.key}
            type="button"
            onClick={() => setActiveLang(lang.key)}
            style={{
              padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              background: 'transparent', border: 'none',
              color: activeLang === lang.key ? 'var(--brand-light)' : 'var(--muted)',
              borderBottom: activeLang === lang.key ? '2px solid var(--brand)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {lang.title}
          </button>
        ))}
      </div>

      {mode === 'edit' ? (
        <div className="stack" style={{ gap: 0 }}>
          <div style={{ display: 'flex', gap: 6, padding: 8, border: '1px solid var(--input-border)', borderBottom: 'none', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', background: 'var(--input-bg)', flexWrap: 'wrap' }}>
            <button type="button" title="Bold" style={toolbarBtn} onClick={() => exec('bold')}><IcBold /></button>
            <button type="button" title="Italic" style={toolbarBtn} onClick={() => exec('italic')}><IcItalic /></button>
            <button type="button" title="Heading" style={toolbarBtn} onClick={() => exec('formatBlock', 'H3')}><IcHeading /></button>
            <button type="button" title="Paragraph" style={toolbarBtn} onClick={() => exec('formatBlock', 'P')}><IcParagraph /></button>
            <button type="button" title="Bullet list" style={toolbarBtn} onClick={() => exec('insertUnorderedList')}><IcBulletList /></button>
            <button type="button" title="Numbered list" style={toolbarBtn} onClick={() => exec('insertOrderedList')}><IcNumberedList /></button>
            <span style={{ width: 1, background: 'var(--input-border)', margin: '2px 2px' }} />
            <button
              type="button"
              title="Insert image"
              style={{ ...toolbarBtn, width: 'auto', padding: '0 10px', gap: 6, opacity: isUploadingImage ? 0.6 : 1, cursor: isUploadingImage ? 'default' : 'pointer' }}
              onClick={openImagePicker}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? <Spinner /> : <IcImage />} {isUploadingImage ? 'Uploading…' : 'Image'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void handleImageFile(e)} />
          </div>
          <div style={{ position: 'relative' }}>
            <div
              ref={editorRef}
              contentEditable={!isUploadingImage}
              onInput={emitChange}
              onBlur={emitChange}
              className="rte-content"
              style={{
                width: '100%', height: 420, padding: '14px 16px',
                border: '1px solid var(--input-border)', borderRadius: uploadError ? 0 : '0 0 var(--radius-sm) var(--radius-sm)',
                background: 'var(--input-bg)', color: 'var(--input-text)', fontSize: '0.9rem', lineHeight: 1.6,
                outline: 'none', overflowY: 'auto', opacity: isUploadingImage ? 0.5 : 1,
              }}
              suppressContentEditableWarning
            />
            {isUploadingImage ? (
              <div
                style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'rgba(0,0,0,0.05)', color: 'var(--text-strong)', fontSize: '0.85rem', fontWeight: 600,
                  pointerEvents: 'none',
                }}
              >
                <Spinner size={16} /> Uploading image…
              </div>
            ) : null}
          </div>
          {uploadError ? (
            <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid var(--input-border)', borderTop: 'none', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)' }}>
              {uploadError}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className="lesson-prose"
          style={{
            width: '100%', height: 420, padding: '14px 16px', overflowY: 'auto',
            border: '1px solid var(--input-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--input-bg)', color: 'var(--input-text)',
          }}
          dangerouslySetInnerHTML={{ __html: value[activeLang] || '<p style="color:var(--muted)">Nothing to preview yet.</p>' }}
        />
      )}
    </div>
  );
}
