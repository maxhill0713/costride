import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Calendar, Clock, MapPin, Image as ImageIcon,
  Upload, CheckCircle, Zap, Users, AlignLeft,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

// ── Design tokens — identical to every other modal / tab ─────────────────────
const T = {
  blue:    '#0ea5e9', green:  '#10b981', red:    '#ef4444',
  amber:   '#f59e0b', purple: '#8b5cf6',
  text1:   '#f0f4f8', text2:  '#94a3b8', text3:  '#475569',
  border:  'rgba(255,255,255,0.07)', borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120', card2:  '#0d1630', divider: 'rgba(255,255,255,0.05)',
  bg:      '#060c18',
};

function Shimmer({ color = T.green }) {
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}35,transparent)`, pointerEvents: 'none' }} />;
}

function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
      {children}{required && <span style={{ color: T.red }}>*</span>}
    </div>
  );
}

// Shared styled input — replaces the CSS class approach
function Field({ label, required, hint, children }) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      {children}
      {hint && <div style={{ fontSize: 10, color: T.text3, marginTop: 5, fontWeight: 500 }}>{hint}</div>}
    </div>
  );
}

// Input that matches the post modal
const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px',
  borderRadius: 10, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', color: T.text1,
  fontSize: 13, fontWeight: 500, outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'border-color 0.15s, background 0.15s',
};

function Inp({ value, onChange, placeholder, type = 'text', disabled, icon: Icon, color = T.green }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon style={{ width: 13, height: 13, color: focus ? color : T.text3, transition: 'color 0.15s' }} />
        </div>
      )}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${color}45`; e.target.style.background = `${color}05`; }}
        onBlur={e  => { setFocus(false); e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
        style={{ ...inputStyle, paddingLeft: Icon ? 34 : 13, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'text', colorScheme: 'dark' }} />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, color = T.green }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${color}45`; e.target.style.background = `${color}05`; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
      style={{ ...inputStyle, resize: 'none', lineHeight: 1.65 }} />
  );
}

// ── Live event card preview ────────────────────────────────────────────────────
function EventPreview({ form, gym }) {
  const hasContent = form.title || form.event_date;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>

      <div style={{ borderRadius: 12, background: T.card2, border: `1px solid ${T.green}20`, overflow: 'hidden', position: 'relative', flex: 1, minHeight: 0 }}>
        <Shimmer color={T.green} />

        {/* Banner image */}
        {form.image_url ? (
          <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
            <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(13,22,48,0.9) 100%)' }} />
          </div>
        ) : (
          <div style={{ height: 100, background: `linear-gradient(135deg,${T.green}10,${T.green}04)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${T.green}12` }}>
            <Calendar style={{ width: 28, height: 28, color: `${T.green}40` }} />
          </div>
        )}

        {/* Event content */}
        <div style={{ padding: '14px 16px' }}>
          {!hasContent ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>Fill in details to preview your event</div>
            </div>
          ) : (
            <>
              {/* Date badge */}
              {form.event_date && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: `${T.green}12`, border: `1px solid ${T.green}25`, marginBottom: 10 }}>
                  <Calendar style={{ width: 9, height: 9, color: T.green }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.green }}>
                    {format(new Date(form.event_date), "EEE, MMM d 'at' h:mma")}
                  </span>
                </div>
              )}

              {/* Title */}
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em', marginBottom: form.description ? 8 : 12, lineHeight: 1.3 }}>
                {form.title || 'Event Title'}
              </div>

              {/* Description */}
              {form.description && (
                <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {form.description}
                </div>
              )}

              {/* Location row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
                <MapPin style={{ width: 10, height: 10, color: T.text3 }} />
                <span style={{ fontSize: 11, color: T.text3 }}>{gym?.name || 'Your Gym'}</span>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users style={{ width: 10, height: 10, color: T.text3 }} />
                  <span style={{ fontSize: 10, color: T.text3 }}>0 going</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gym tag below preview */}
      {hasContent && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${T.green}14`, border: `1px solid ${T.green}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {gym?.logo_url
              ? <img src={gym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 5 }} />
              : <Calendar style={{ width: 10, height: 10, color: T.green }} />
            }
          </div>
          <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{gym?.name}</span>
          <span style={{ fontSize: 10, color: T.text3 }}>· Just now</span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function CreateEventModal({ open, onClose, onSave, gym, isLoading, initialEvent }) {
  const [form, setForm] = useState({ title: '', description: '', event_date: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  const isEditing = !!initialEvent?.id;

  useEffect(() => {
    if (open && initialEvent) {
      setForm({
        id:          initialEvent.id,
        title:       initialEvent.title       || '',
        description: initialEvent.description || '',
        event_date:  initialEvent.event_date  || '',
        image_url:   initialEvent.image_url   || '',
      });
    } else if (open) {
      setForm({ title: '', description: '', event_date: '', image_url: '' });
    }
  }, [open, initialEvent?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.title.trim() && form.event_date && !isLoading;

  const uploadMutation = useMutation({
    mutationFn: async (file) => { const r = await base44.integrations.Core.UploadFile({ file }); return r.file_url; },
    onSuccess:  (url) => { set('image_url', url); setUploading(false); },
    onError:    ()    => setUploading(false),
  });

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSave(form);
    setForm({ title: '', description: '', event_date: '', image_url: '' });
  };

  const handleClose = () => {
    setForm({ title: '', description: '', event_date: '', image_url: '' });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
        @keyframes ev-overlay-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ev-modal-in   { from { opacity: 0; transform: scale(0.97) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes ev-spin       { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .ev-submit:not(:disabled):hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.35) !important; }
        .ev-submit:not(:disabled):active { transform: translateY(0) !important; }
        .ev-cancel:hover { background: rgba(255,255,255,0.08) !important; color: #f0f4f8 !important; }
      `}</style>

      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,20,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'ev-overlay-in 0.18s ease', fontFamily: "'DM Sans', system-ui, sans-serif" }}
        onClick={e => e.target === e.currentTarget && handleClose()}>

        {/* Modal */}
        <div style={{ width: '100%', maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#07101f', border: `1px solid ${T.borderM}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04) inset', animation: 'ev-modal-in 0.22s cubic-bezier(0.34,1.4,0.64,1)' }}>

          {/* ── Header ── */}
          <div style={{ flexShrink: 0, padding: '18px 24px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <Shimmer color={T.green} />
            <div style={{ position: 'absolute', top: -40, left: -20, width: 180, height: 100, borderRadius: '50%', background: T.green, opacity: 0.04, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${T.green}14`, border: `1px solid ${T.green}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar style={{ width: 17, height: 17, color: T.green }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em' }}>{isEditing ? 'Edit Event' : 'Create Event'}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 1, fontWeight: 500 }}>{gym?.name || 'Your Gym'}</div>
              </div>
            </div>
            <button onClick={handleClose}
              style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.15s', color: T.text3 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = T.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.text3; }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* ── Body — two columns ── */}
          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0, overflow: 'hidden' }}>

            {/* Left — form fields */}
            <div style={{ padding: '20px 24px', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

              {/* Title */}
              <Field label="Event title" required>
                <Inp value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Fitness Challenge" icon={Zap} color={T.green} />
              </Field>

              {/* Description */}
              <Field label="Description">
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell members what to expect, what to bring, and who it's for…" rows={4} color={T.green} />
              </Field>

              {/* Date + Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Date & time" required>
                  <Inp type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} icon={Calendar} color={T.green} />
                  {form.event_date && (
                    <div style={{ fontSize: 10, color: T.green, fontWeight: 600, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock style={{ width: 9, height: 9 }} />
                      {format(new Date(form.event_date), "EEE, MMM d 'at' h:mma")}
                    </div>
                  )}
                </Field>
                <Field label="Location">
                  <Inp value={gym?.name || ''} disabled icon={MapPin} color={T.green} />
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 5 }}>Set to your gym by default</div>
                </Field>
              </div>

              {/* Banner image */}
              <Field label="Banner image" hint="Recommended: 1200×630px · PNG or JPG">
                {form.image_url ? (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                    <img src={form.image_url} alt="Banner" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', border: `1px solid ${T.border}`, borderRadius: 10 }} onError={e => e.target.style.display = 'none'} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)', borderRadius: 10, pointerEvents: 'none' }} />
                    <button type="button" onClick={() => set('image_url', '')}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', border: `1px solid ${T.borderM}`, cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
                      <X style={{ width: 11, height: 11, color: '#fff' }} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Banner attached ✓</div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{ padding: '20px 16px', borderRadius: 10, border: `2px dashed ${dragOver ? T.green + '55' : T.border}`, background: dragOver ? `${T.green}06` : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.green}10`, border: `1px solid ${T.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {uploading
                        ? <div style={{ width: 14, height: 14, border: `2px solid ${T.green}30`, borderTop: `2px solid ${T.green}`, borderRadius: '50%', animation: 'ev-spin 0.8s linear infinite' }} />
                        : <Upload style={{ width: 14, height: 14, color: T.green }} />
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text2, textAlign: 'center' }}>{uploading ? 'Uploading…' : 'Drop image or click to browse'}</div>
                      <div style={{ fontSize: 10, color: T.text3, textAlign: 'center', marginTop: 2 }}>PNG, JPG up to 10MB</div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
                  </div>
                )}
              </Field>
            </div>

            {/* Right — preview */}
            <div style={{ padding: '20px 18px', background: T.bg, overflowY: 'auto' }}>
              <EventPreview form={form} gym={gym} />
            </div>
          </form>

          {/* ── Footer ── */}
          <div style={{ flexShrink: 0, padding: '14px 24px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, background: '#07101f' }}>
            {/* Status */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
              {canSubmit ? (
                <>
                  <CheckCircle style={{ width: 12, height: 12, color: T.green, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.text3 }}>
                    {form.title}
                    {form.event_date ? ` · ${format(new Date(form.event_date), 'MMM d')}` : ''}
                    {form.image_url ? ' · banner attached' : ''}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: T.text3 }}>
                  {!form.title ? 'Add a title to continue' : 'Add a date to continue'}
                </span>
              )}
            </div>

            {/* Cancel */}
            <button type="button" className="ev-cancel" onClick={handleClose}
              style={{ padding: '10px 20px', borderRadius: 10, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              Cancel
            </button>

            {/* Create */}
            <button type="submit" form="" className="ev-submit" onClick={handleSubmit} disabled={!canSubmit}
              style={{ padding: '10px 24px', borderRadius: 10, background: canSubmit ? `linear-gradient(135deg,${T.green},#059669)` : 'rgba(255,255,255,0.06)', color: canSubmit ? '#fff' : T.text3, border: 'none', fontSize: 12, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s', letterSpacing: '-0.01em', boxShadow: canSubmit ? `0 4px 16px ${T.green}35` : 'none', minWidth: 148, justifyContent: 'center' }}>
              {isLoading
                ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ev-spin 0.7s linear infinite' }} /> {isEditing ? 'Saving…' : 'Creating…'}</>
                : <><Calendar style={{ width: 13, height: 13 }} /> {isEditing ? 'Save Changes' : 'Create Event'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
