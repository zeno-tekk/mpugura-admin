'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAdminData } from '@/context/admin-data-context';
import { authedFetch } from '@/lib/authed-fetch';
import { cloneMultiLang } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { MultiLang, Video } from '@/lib/types';

interface VideoDraft {
  order: number;
  title: MultiLang;
  description: MultiLang;
  videoUrl: string;
  thumbnailUrl: string;
  published: boolean;
}

function createDraft(order = 1): VideoDraft {
  return {
    order,
    title: { en: '', fr: '', rw: '' },
    description: { en: '', fr: '', rw: '' },
    videoUrl: '',
    thumbnailUrl: '',
    published: true,
  };
}

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function nextVideoId(videos: Video[]): string {
  let max = 0;
  for (const v of videos) {
    const m = v.id.match(/^v-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `v-${max + 1}`;
}

const IcUpload = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IcLink = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

type SourceMode = 'upload' | 'url';

function ModeToggle({ mode, onChange }: { mode: SourceMode; onChange: (mode: SourceMode) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {(['upload', 'url'] as SourceMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          style={{
            padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--input-border)',
            background: mode === m ? 'var(--brand)' : 'var(--input-bg)', color: mode === m ? '#fff' : 'var(--muted)',
            fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {m === 'upload' ? <><IcUpload /> Upload</> : <><IcLink /> URL</>}
        </button>
      ))}
    </div>
  );
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
              <textarea rows={3} value={value[l.key]} onChange={(e) => onChange(l.key, e.target.value)} />
            ) : (
              <input value={value[l.key]} onChange={(e) => onChange(l.key, e.target.value)} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

interface CloudinarySignature {
  cloud: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

async function uploadVideoDirectToCloudinary(file: File, onProgress: (pct: number) => void): Promise<string> {
  const sigRes = await authedFetch('/api/upload-signature', { method: 'POST' });
  if (!sigRes.ok) throw new Error(await sigRes.text());
  const sig = (await sigRes.json()) as CloudinarySignature;

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloud}/video/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText) as { secure_url: string };
        resolve(data.secure_url);
      } else {
        reject(new Error(xhr.responseText || 'Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(form);
  });
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await authedFetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  const { url } = (await res.json()) as { url: string };
  return url;
}

export default function VideosPage() {
  const { videos, isLoading, saveVideo, deleteVideo } = useAdminData();

  const [draft, setDraft] = useState<VideoDraft>(createDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [videoMode, setVideoMode] = useState<SourceMode>('upload');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const [thumbnailMode, setThumbnailMode] = useState<SourceMode>('upload');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingId) setDraft((d) => ({ ...d, order: videos.reduce((max, v) => Math.max(max, v.order), 0) + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos.length]);

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(createDraft(videos.reduce((max, v) => Math.max(max, v.order), 0) + 1));
    setVideoMode('upload');
    setThumbnailMode('upload');
  };

  const startEdit = (video: Video) => {
    setEditingId(video.id);
    setDraft({
      order: video.order,
      title: cloneMultiLang(video.title),
      description: cloneMultiLang(video.description),
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl ?? '',
      published: video.published,
    });
    setVideoMode('url');
    setThumbnailMode(video.thumbnailUrl ? 'url' : 'upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      const url = await uploadVideoDirectToCloudinary(file, setVideoUploadProgress);
      setDraft((d) => ({ ...d, videoUrl: url }));
    } catch (err) {
      showNotice('error', `Could not upload the video. ${getFriendlyErrorMessage(err)}`);
    } finally {
      setIsUploadingVideo(false);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingThumbnail(true);
    try {
      const url = await uploadImage(file);
      setDraft((d) => ({ ...d, thumbnailUrl: url }));
    } catch (err) {
      showNotice('error', `Could not upload the thumbnail. ${getFriendlyErrorMessage(err)}`);
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.videoUrl.trim()) return showNotice('error', 'Add a video first.');
    const effectiveId = editingId ?? nextVideoId(videos);
    setIsSaving(true);
    try {
      await saveVideo({
        id: effectiveId,
        order: Number(draft.order),
        title: cloneMultiLang(draft.title),
        description: cloneMultiLang(draft.description),
        videoUrl: draft.videoUrl.trim(),
        ...(draft.thumbnailUrl.trim() ? { thumbnailUrl: draft.thumbnailUrl.trim() } : {}),
        published: draft.published,
      });
      reset();
      showNotice('success', 'Video saved.');
    } catch (err) {
      showNotice('error', `Could not save video. ${getFriendlyErrorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (video: Video) => {
    if (!window.confirm(`Delete "${video.title.en || video.id}"?`)) return;
    try {
      await deleteVideo(video.id);
      showNotice('success', 'Video deleted.');
    } catch (err) {
      showNotice('error', `Could not delete video. ${getFriendlyErrorMessage(err)}`);
    }
  };

  const set = (key: keyof VideoDraft, val: unknown) => setDraft((d) => ({ ...d, [key]: val }));

  return (
    <>
      <div className="page-header">
        <h1>Shorts</h1>
        <p>Upload and manage the short videos students see in the app and on the web</p>
      </div>

      {notice && <div className={`notice notice-${notice.tone}`}>{notice.text}</div>}

      <div className="two-col">
        {/* Form */}
        <form className="card stack" onSubmit={(e) => void handleSave(e)}>
          <div className="section-header">
            <div>
              <h2>{editingId ? 'Edit Video' : 'Upload Video'}</h2>
              <p>Free for every student - no premium gating</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-strong)' }}>ID:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, background: 'rgba(79,110,247,0.12)', color: 'var(--brand-light)', padding: '3px 12px', borderRadius: 99 }}>{editingId ?? nextVideoId(videos)}</span>
            {!editingId && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>auto-assigned</span>}
          </div>

          <div className="form-grid">
            <label className="toggle-field">
              <input type="checkbox" checked={draft.published} onChange={(e) => set('published', e.target.checked)} />
              <span>Published</span>
            </label>
          </div>

          <MultiLangFields
            label="Title"
            value={draft.title}
            onChange={(lang, val) => setDraft((d) => ({ ...d, title: { ...d.title, [lang]: val } }))}
          />

          <MultiLangFields
            label="Description (optional)"
            value={draft.description}
            onChange={(lang, val) => setDraft((d) => ({ ...d, description: { ...d.description, [lang]: val } }))}
            multiline
          />

          {/* Video source */}
          <div className="stack" style={{ gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-strong)' }}>Video</span>
              <ModeToggle mode={videoMode} onChange={setVideoMode} />
              {draft.videoUrl && <button type="button" onClick={() => setDraft((d) => ({ ...d, videoUrl: '' }))} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 'var(--radius-md)', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>}
            </div>

            {videoMode === 'upload' ? (
              <>
                <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => void handleVideoFileChange(e)} />
                <div
                  onClick={() => !isUploadingVideo && videoFileRef.current?.click()}
                  style={{
                    border: `2px dashed ${isUploadingVideo ? 'var(--brand)' : 'var(--input-border)'}`,
                    borderRadius: 'var(--radius-md)', padding: 20, textAlign: 'center',
                    cursor: isUploadingVideo ? 'default' : 'pointer', background: 'var(--input-bg)',
                  }}
                >
                  {isUploadingVideo ? (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 6 }}>Uploading… {videoUploadProgress}%</div>
                      <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${videoUploadProgress}%`, background: 'var(--brand)', transition: 'width 150ms' }} />
                      </div>
                    </div>
                  ) : draft.videoUrl ? (
                    <div>
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video src={draft.videoUrl} controls style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 6, marginBottom: 6 }} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Click to replace</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Click to upload a video file</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <label className="field" style={{ marginBottom: 0 }}>
                  <input type="url" value={draft.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://res.cloudinary.com/…" />
                </label>
                {draft.videoUrl && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={draft.videoUrl} controls style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 6, border: '1px solid var(--input-border)' }} onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }} />
                )}
              </>
            )}
          </div>

          {/* Thumbnail source */}
          <div className="stack" style={{ gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-strong)' }}>Thumbnail (optional)</span>
              <ModeToggle mode={thumbnailMode} onChange={setThumbnailMode} />
              {draft.thumbnailUrl && <button type="button" onClick={() => setDraft((d) => ({ ...d, thumbnailUrl: '' }))} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 'var(--radius-md)', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>}
            </div>

            {thumbnailMode === 'upload' ? (
              <>
                <input ref={thumbnailFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void handleThumbnailFileChange(e)} />
                <div
                  onClick={() => !isUploadingThumbnail && thumbnailFileRef.current?.click()}
                  style={{
                    border: `2px dashed ${isUploadingThumbnail ? 'var(--brand)' : 'var(--input-border)'}`,
                    borderRadius: 'var(--radius-md)', padding: 20, textAlign: 'center',
                    cursor: isUploadingThumbnail ? 'default' : 'pointer', background: 'var(--input-bg)',
                  }}
                >
                  {isUploadingThumbnail ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(79,110,247,0.3)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Uploading…</span>
                    </div>
                  ) : draft.thumbnailUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={draft.thumbnailUrl} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 6, marginBottom: 6, objectFit: 'contain' }} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Click to replace</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Click to upload a thumbnail image</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <label className="field" style={{ marginBottom: 0 }}>
                  <input type="url" value={draft.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} placeholder="https://…" />
                </label>
                {draft.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.thumbnailUrl} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, objectFit: 'contain', border: '1px solid var(--input-border)' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                )}
              </>
            )}
          </div>

          <div className="flex-row">
            <button className="btn btn-primary" type="submit" disabled={isSaving || isUploadingVideo || isUploadingThumbnail}>
              {isSaving ? 'Saving…' : editingId ? 'Update video' : 'Save video'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={reset}>Reset</button>
          </div>
        </form>

        {/* List */}
        <div className="card stack">
          <div className="section-header">
            <div>
              <h2>Existing Videos</h2>
              <p>{videos.length} video{videos.length !== 1 ? 's' : ''} available to students</p>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">Loading…</div>
          ) : videos.length ? (
            <div className="list">
              {videos.map((video) => (
                <div key={video.id} className="list-item">
                  <div>
                    <strong>{truncate(video.title.en || video.title.rw || video.id)}</strong>
                    <p>Order {video.order}</p>
                  </div>
                  <div className="flex-row">
                    <span className={`badge ${video.published ? 'badge-success' : 'badge-muted'}`}>
                      {video.published ? 'Published' : 'Hidden'}
                    </span>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(video)}>Edit</button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => void handleDelete(video)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No videos yet</h3>
              <p>Upload your first short video to get started.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
