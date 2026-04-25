/**
 * CreateEventModal — Content Hub design system
 * Mobile-first responsive: adapts on ≤768px, desktop layout unchanged.
 * Blue #60a5fa · DM Sans · #0d0d11 / #17171c / #1f1f26
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Calendar, Clock, MapPin, Upload,
  CheckCircle, Zap, Users, Eye,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       '#0d0d11', surface:  '#17171c', card:     '#1f1f26', inset:    '#13131a',
  brd:      '#252530', brd2:     '#2e2e3a', brdHover: '#3a3a48',
  t1:       '#ffffff', t2:       '#9898a6', t3:       '#525260',
  blue:     '#60a5fa', blueDim:  'rgba(96,165,250,0.07)',  blueBrd:  'rgba(96,165,250,0.18)',
  red:    '#ff4d6d', redDim:    'rgba(255,77,109,0.08)',  redBrd:    'rgba(255,77,109,0.20)',
  green:  '#22c55e', greenDim:  'rgba(34,197,94,0.08)',  greenBrd:  'rgba(34,197,94,0.20)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";
const MONO = { fontVariantNumeric: 'tabular-nums' };

/* ─── SHARED INPUT BASE ──────────────────────────────────────── */
const baseInp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 12.5, fontWeight: 500, outline: 'none',
  fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s',
  colorScheme: 'dark',
};

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
function SL({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: C.red }}>*</span>}
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      {label && <SL required={required}>{label}</SL>}
      {children}
      {hint && <div style={{ fontSize: 10, color: C.t3, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = 'text', disabled, Icon, accentColor = C.blue }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon size={12} color={focus ? accentColor : C.t3} style={{ transition: 'color 0.15s' }} />
        </div>
      )}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
        onBlur={e  => { setFocus(false); e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
        style={{
          ...baseInp,
          fontSize: 16,
          paddingLeft: Icon ? 32 : 12,
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, accentColor = C.blue }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
      onBlur={e  => { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
      style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '11px 13px', fontSize: 16 }}
    />
  );
}

/* ─── LIVE PREVIEW ───────────────────────────────────────────── */
function EventPreview({ form, gym }) {
  const hasContent = form.title || form.event_date;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Eye size={11} color={C.t3} />
        <span style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', background: C.card, border: `1px solid ${C.brd}` }}>
        {form.image_url ? (
          <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
            <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(13,13,17,0.88) 100%)' }} />
          </div>
        ) : (
          <div style={{ height: 96, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${C.brd}` }}>
            <Calendar size={26} color={C.t3} />
          </div>
        )}
        <div style={{ padding: '13px 15px 0' }}>
          {!hasContent ? (
            <div style={{ textAlign: 'center', padding: '16px 0 14px' }}>
              <div style={{ fontSize: 11.5, color: C.t3, fontWeight: 500 }}>Fill in details to preview your event</div>
            </div>
          ) : (
            <>
              {form.event_date && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, background: C.blueDim, border: `1px solid ${C.blueBrd}`, marginBottom: 8 }}>
                  <Calendar size={9} color={C.blue} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: C.blue }}>
                    {format(new Date(form.event_date), "EEE, MMM d 'at' h:mma")}
                  </span>
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', marginBottom: form.description ? 7 : 12, lineHeight: 1.35 }}>
                {form.title || 'Event Title'}
              </div>
              {form.description && (
                <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {form.description}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 0 14px', borderTop: `1px solid ${C.brd}` }}>
                <MapPin size={10} color={C.t3} />
                <span style={{ fontSize: 11, color: C.t3 }}>{gym?.name || 'Your Gym'}</span>
                <div style={{ flex: 1 }} />
                <Users size={10} color={C.t3} />
                <span style={{ fontSize: 10, color: C.t3 }}>0 going</span>
              </div>
            </>
          )}
        </div>
      </div>
      {hasContent && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {gym?.logo_url
              ? <img src={gym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 5 }} />
              : <Calendar size={10} color={C.blue} />}
          </div>
          <span style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>{gym?.name}</span>
          <span style={{ fontSize: 10, color: C.t3 }}>· Just now</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function CreateEventModal({ open, onClose, onSave, gym, isLoading }) {
  const [form, setForm] = useState({ title: '', description: '', event_date: '', end_time: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef();

  /* ── Mobile detection ──────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    e?.preventDefault();
    if (!canSubmit) return;
    onSave(form);
    setForm({ title: '', description: '', event_date: '', end_time: '', image_url: '' });
  };

  const handleClose = () => {
    setForm({ title: '', description: '', event_date: '', end_time: '', image_url: '' });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes ev-fade { from{opacity:0} to{opacity:1} }
        @keyframes ev-in   { from{opacity:0;transform:scale(0.975) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes ev-up   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ev-spin { to{transform:rotate(360deg)} }
        .ev-scroll::-webkit-scrollbar       { width:3px }
        .ev-scroll::-webkit-scrollbar-track { background:transparent }
        .ev-scroll::-webkit-scrollbar-thumb { background:${C.brd2}; border-radius:2px }
        .ev-cancel {
          padding:9px 18px; border-radius:8px; background:transparent; border:1px solid ${C.brd};
          color:${C.t2}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; transition:all 0.15s;
        }
        .ev-cancel:hover { border-color:${C.brdHover}; color:${C.t1}; background:${C.card}; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={e => e.target === e.currentTarget && handleClose()}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : 20,
          animation: 'ev-fade 0.15s ease', fontFamily: FONT,
        }}
      >

        {/* Shell */}
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 920,
          maxHeight: isMobile ? '96vh' : '92vh',
          height: isMobile ? '96vh' : 'auto',
          display: 'flex', flexDirection: 'column',
          background: C.bg,
          border: isMobile ? 'none' : `1px solid ${C.brd}`,
          borderRadius: isMobile ? '20px 20px 0 0' : 14,
          overflow: 'hidden',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(96,165,250,0.04)`,
          animation: isMobile ? 'ev-up 0.3s cubic-bezier(0.32,0.72,0,1)' : 'ev-in 0.24s cubic-bezier(0.16,1,0.3,1)',
          WebkitFontSmoothing: 'antialiased',
        }}>

          {/* ── HEADER ──────────────────────────────────────── */}
          <div style={{
            flexShrink: 0,
            padding: isMobile ? '0 16px' : '16px 20px',
            background: C.surface, borderBottom: `1px solid ${C.brd}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Mobile drag handle */}
            {isMobile && (
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: C.brd2 }} />
            )}

            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={13} color={C.blue} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>Create Event</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setShowPreview(v => !v)}
                    style={{
                      height: 30, padding: '0 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5,
                      background: showPreview ? C.blueDim : 'transparent',
                      border: `1px solid ${showPreview ? C.blueBrd : C.brd}`,
                      cursor: 'pointer', color: showPreview ? C.blue : C.t3, fontSize: 11, fontWeight: 600, fontFamily: FONT,
                    }}
                  >
                    <Eye size={11} /> {showPreview ? 'Edit' : 'Preview'}
                  </button>
                  <button onClick={handleClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={14} color={C.blue} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Create Event
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.t1; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.t3; }}
                >
                  <X size={16} />
                </button>
              </>
            )}
          </div>

          {/* ── BODY ────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >

            {(!isMobile || !showPreview) && (
              <div className="ev-scroll" style={{
                padding: isMobile ? '16px 16px' : '18px 20px',
                borderRight: isMobile ? 'none' : `1px solid ${C.brd}`,
                display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 18,
                overflowY: 'auto', background: C.bg,
                WebkitOverflowScrolling: 'touch',
              }}>

                {/* Title */}
                <Field label="Event Title" required>
                  <Inp value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Fitness Challenge" Icon={Zap} accentColor={C.blue} />
                </Field>

                {/* Description */}
                <Field label="Description">
                  <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell members what to expect, what to bring, and who it's for…" rows={isMobile ? 3 : 4} accentColor={C.blue} />
                </Field>

                {/* Date & Time + Finish Time */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 12 }}>
                  <Field label="Date & Time" required>
                    <Inp type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} Icon={Calendar} accentColor={C.blue} />
                    {form.event_date && (
                      <div style={{ fontSize: 10, color: C.blue, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={9} color={C.blue} />
                        {format(new Date(form.event_date), "EEE, MMM d 'at' h:mma")}
                      </div>
                    )}
                  </Field>
                  <Field label="Finish Time" hint="Optional end time (e.g. 18:00)">
                    <Inp type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} Icon={Clock} accentColor={C.blue} />
                  </Field>
                </div>

                {/* Location */}
                <Field label="Location" hint="Set to your gym by default">
                  <Inp value={gym?.name || ''} disabled Icon={MapPin} accentColor={C.blue} />
                </Field>

                {/* Banner image */}
                <Field label="Banner Image" hint="Recommended: 1200×630px · PNG or JPG">
                  {form.image_url ? (
                    <div style={{ position: 'relative', borderRadius: 9, overflow: 'hidden' }}>
                      <img src={form.image_url} alt="Banner" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', borderRadius: 9, border: `1px solid ${C.brd}` }} onError={e => e.target.style.display = 'none'} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)', borderRadius: 9, pointerEvents: 'none' }} />
                      <button type="button" onClick={() => set('image_url', '')} style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,17,0.82)', border: `1px solid ${C.brd}`, cursor: 'pointer' }}>
                        <X size={10} color={C.t1} />
                      </button>
                      <div style={{ position: 'absolute', bottom: 8, left: 11, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Banner attached ✓</div>
                    </div>
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      style={{ padding: '20px 14px', borderRadius: 9, border: `1.5px dashed ${dragOver ? C.blue + '60' : C.brd2}`, background: dragOver ? C.blueDim : C.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer', transition: 'all 0.18s' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {uploading
                          ? <div style={{ width: 14, height: 14, border: `2px solid ${C.blue}25`, borderTop: `2px solid ${C.blue}`, borderRadius: '50%', animation: 'ev-spin 0.8s linear infinite' }} />
                          : <Upload size={14} color={C.blue} />}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{uploading ? 'Uploading…' : 'Drop image or click to browse'}</div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>PNG, JPG · up to 10 MB</div>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
                    </div>
                  )}
                </Field>

                {isMobile && <div style={{ height: 8 }} />}
              </div>
            )}

            {/* ── PREVIEW panel ─────────────────────────────── */}
            {(!isMobile || showPreview) && (
              <div className="ev-scroll" style={{
                padding: isMobile ? '16px 16px' : '18px 16px',
                background: C.surface, overflowY: 'auto',
                borderLeft: isMobile ? 'none' : `1px solid ${C.brd}`,
                WebkitOverflowScrolling: 'touch',
              }}>
                <EventPreview form={form} gym={gym} />
              </div>
            )}
          </form>

          {/* ── FOOTER ──────────────────────────────────────── */}
          <div style={{
            flexShrink: 0,
            padding: isMobile ? '12px 16px' : '12px 20px',
            borderTop: `1px solid ${C.brd}`,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 8 : 10,
            background: C.surface,
          }}>

            {/* Status — desktop only */}
            {!isMobile && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {canSubmit ? (
                  <>
                    <CheckCircle size={11} color={C.green} />
                    <span style={{ fontSize: 10.5, color: C.t3, ...MONO }}>
                      {form.title}
                      {form.event_date ? ` · ${format(new Date(form.event_date), 'MMM d')}` : ''}
                      {form.image_url ? ' · banner attached' : ''}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 10.5, color: C.t3 }}>
                    {!form.title.trim() ? 'Add a title to continue' : 'Add a date to continue'}
                  </span>
                )}
              </div>
            )}

            {isMobile && canSubmit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={11} color={C.green} />
                <span style={{ fontSize: 10.5, color: C.t3 }}>
                  {form.title}{form.event_date ? ` · ${format(new Date(form.event_date), 'MMM d')}` : ''}
                </span>
              </div>
            )}

            {isMobile ? (
              <>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    width: '100%', height: 50, borderRadius: 12, border: 'none',
                    fontFamily: FONT, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
                    background: canSubmit ? C.blue : C.brd2,
                    color: canSubmit ? '#fff' : C.t3,
                    cursor: canSubmit ? 'pointer' : 'default',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: canSubmit ? `0 0 24px ${C.blue}40` : 'none',
                    opacity: canSubmit ? 1 : 0.4,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {isLoading
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ev-spin 0.7s linear infinite' }} /> Creating…</>
                    : <><Calendar size={15} /> Create Event</>}
                </button>
                <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: '6px 0', textAlign: 'center' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ev-cancel" onClick={handleClose}>Cancel</button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    padding: '9px 22px', borderRadius: 8, border: 'none',
                    fontFamily: FONT, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
                    background: canSubmit ? C.blue : C.brd2,
                    color: canSubmit ? '#fff' : C.t3,
                    cursor: canSubmit ? 'pointer' : 'default',
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    boxShadow: canSubmit ? `0 0 24px ${C.blue}40` : 'none',
                    opacity: canSubmit ? 1 : 0.4,
                    minWidth: 155, justifyContent: 'center',
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { if (canSubmit) e.currentTarget.style.opacity = '1'; }}
                >
                  {isLoading
                    ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ev-spin 0.7s linear infinite' }} /> Creating…</>
                    : <><Calendar size={13} /> Create Event</>}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}