/**
 * CreateEventModal — Content Hub design system
 * Submit button updated to #2563eb to match ContentPage "New Post" button.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Calendar, Clock, MapPin, Upload,
  CheckCircle, Zap, Users, Eye,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

const C = {
  bg:       '#0d0d11', surface:  '#17171c', card:     '#1f1f26', inset:    '#13131a',
  brd:      '#252530', brd2:     '#2e2e3a', brdHover: '#3a3a48',
  t1:       '#ffffff', t2:       '#9898a6', t3:       '#525260',
  blue:     '#2563eb', blueDim:  'rgba(37,99,235,0.07)',  blueBrd:  'rgba(37,99,235,0.18)',
  red:    '#ff4d6d', redDim:    'rgba(255,77,109,0.08)',  redBrd:    'rgba(255,77,109,0.20)',
  green:  '#22c55e', greenDim:  'rgba(34,197,94,0.08)',  greenBrd:  'rgba(34,197,94,0.20)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";

const baseInp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 12.5, fontWeight: 500, outline: 'none',
  fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s',
  colorScheme: 'dark',
};

function SL({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: C.red }}>*</span>}
    </div>
  );
}

function Field({ label, required, hint, children, compactTop }) {
  return (
    <div style={compactTop ? { marginTop: -6 } : {}}>
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
        style={{ ...baseInp, fontSize: 16, paddingLeft: Icon ? 32 : 12, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, accentColor = C.blue }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
      onBlur={e  => { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
      style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '11px 13px', fontSize: 16 }}
    />
  );
}

function EventPreview({ form, gym }) {
  const hasContent = form.title || form.event_date;
  const formatDate = (dateStr) => { const d = new Date(dateStr); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };
  const formatTime = (dateStr, endTime) => { const d = new Date(dateStr); const start = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); return endTime ? `${start}–${endTime}` : start; };
  const cardBg = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Eye size={11} color={C.t3} />
        <span style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>
      {!hasContent ? (
        <div style={{ borderRadius: 12, background: C.card, border: `1px solid ${C.brd}`, padding: '28px 16px', textAlign: 'center' }}>
          <Calendar size={24} color={C.t3} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 11.5, color: C.t3, fontWeight: 500 }}>Fill in details to preview your event</div>
        </div>
      ) : (
        <div style={{ background: cardBg, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px 9px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar style={{ width: 13, height: 13, color: '#fff', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Upcoming Events</span>
          </div>
          {form.image_url ? (
            <>
              <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                <img src={form.image_url} alt={form.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,10,20,0.82) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                    {form.event_date ? `${formatDate(form.event_date)} - ` : ''}{form.title || 'Event Title'}
                  </h3>
                </div>
              </div>
              <div style={{ padding: '10px 14px 14px' }}>
                <BottomRowPreview form={form} formatTime={formatTime} />
              </div>
            </>
          ) : (
            <div style={{ padding: '14px 14px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 8px' }}>
                {form.event_date ? `${formatDate(form.event_date)} - ` : ''}{form.title || 'Event Title'}
              </h3>
              <BottomRowPreview form={form} formatTime={formatTime} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BottomRowPreview({ form, formatTime }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {form.description && (
          <p style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.6)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{form.description}</p>
        )}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>0 attending</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
        {form.event_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{formatTime(form.event_date, form.end_time)}</span>
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, background: '#2563eb', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.4)', pointerEvents: 'none', userSelect: 'none' }}>
          Join Event
        </div>
      </div>
    </div>
  );
}

export default function CreateEventModal({ open, onClose, onSave, gym, isLoading }) {
  const [form, setForm] = useState({ title: '', description: '', event_date: '', end_time: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
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

  const submitBtnStyle = {
    padding: '9px 22px', borderRadius: 10, border: 'none',
    fontFamily: FONT, fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em',
    background: canSubmit ? '#2563eb' : C.brd2,
    color: canSubmit ? '#fff' : C.t3,
    cursor: canSubmit ? 'pointer' : 'default',
    display: 'inline-flex', alignItems: 'center', gap: 7,
    boxShadow: 'none',
    opacity: canSubmit ? 1 : 0.4,
    minWidth: 100, justifyContent: 'center',
    transition: 'opacity 0.15s, box-shadow 0.15s',
  };

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
        .ev-cancel { padding:9px 18px; border-radius:8px; background:transparent; border:1px solid ${C.brd}; color:${C.t2}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; transition:all 0.15s; }
        .ev-cancel:hover { border-color:${C.brdHover}; color:${C.t1}; background:${C.card}; }
      `}</style>

      <div onClick={e => e.target === e.currentTarget && handleClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20, animation: 'ev-fade 0.15s ease', fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 920, maxHeight: isMobile ? '96vh' : '92vh', height: isMobile ? '96vh' : 'auto', display: 'flex', flexDirection: 'column', background: C.bg, border: isMobile ? 'none' : `1px solid ${C.brd}`, borderRadius: isMobile ? '20px 20px 0 0' : 14, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(37,99,235,0.04)', animation: isMobile ? 'ev-up 0.3s cubic-bezier(0.32,0.72,0,1)' : 'ev-in 0.24s cubic-bezier(0.16,1,0.3,1)', WebkitFontSmoothing: 'antialiased' }}>

          {/* HEADER */}
          <div style={{ flexShrink: 0, padding: isMobile ? '0 16px' : '16px 20px', background: C.surface, borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {isMobile && <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: C.brd2 }} />}
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {/* Standalone calendar icon, no box */}
                  <Calendar size={20} color="#ffffff" strokeWidth={1.75} />
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>Create Event</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setShowPreview(v => !v)} style={{ height: 30, padding: '0 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5, background: showPreview ? C.blueDim : 'transparent', border: `1px solid ${showPreview ? C.blueBrd : C.brd}`, cursor: 'pointer', color: showPreview ? C.blue : C.t3, fontSize: 11, fontWeight: 600, fontFamily: FONT }}>
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
                  {/* Standalone calendar icon, no box */}
                  <Calendar size={22} color="#ffffff" strokeWidth={1.75} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Create Event</div>
                </div>
                <button onClick={handleClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.t1; }} onMouseLeave={e => { e.currentTarget.style.color = C.t3; }}>
                  <X size={16} />
                </button>
              </>
            )}
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', minHeight: 0, overflow: 'hidden' }}>
            {(!isMobile || !showPreview) && (
              <div className="ev-scroll" style={{ padding: isMobile ? '16px 16px' : '18px 20px', borderRight: isMobile ? 'none' : `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 18, overflowY: 'auto', background: C.bg, WebkitOverflowScrolling: 'touch' }}>
                <Field label="Event Title" required>
                  <Inp value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Fitness Challenge" Icon={Zap} accentColor={C.blue} />
                </Field>
                <Field label="Description">
                  {/* rows reduced ~25% from original 4 */}
                  <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell members what to expect, what to bring, and who it's for…" rows={isMobile ? 2 : 3} accentColor={C.blue} />
                </Field>
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
                {/* compactTop reduces gap between this field and the date/time grid above it */}
                <Field label="Location" hint="Set to your gym by default" compactTop>
                  <Inp value={gym?.name || ''} disabled Icon={MapPin} accentColor={C.blue} />
                </Field>
                <Field label="Banner Image" hint="Recommended: 1200×630px · PNG or JPG">
                  {form.image_url ? (
                    <div style={{ position: 'relative', borderRadius: 9, overflow: 'hidden' }}>
                      {/* image height reduced from 119 to ~113 (further 5% shorter) */}
                      <img src={form.image_url} alt="Banner" style={{ width: '100%', height: 113, objectFit: 'cover', display: 'block', borderRadius: 9, border: `1px solid ${C.brd}` }} onError={e => e.target.style.display = 'none'} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)', borderRadius: 9, pointerEvents: 'none' }} />
                      <button type="button" onClick={() => set('image_url', '')} style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,17,0.82)', border: `1px solid ${C.brd}`, cursor: 'pointer' }}>
                        <X size={10} color={C.t1} />
                      </button>
                      <div style={{ position: 'absolute', bottom: 8, left: 11, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Banner attached ✓</div>
                    </div>
                  ) : (
                    // Drop zone: padding reduced to shrink overall height ~5%
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
                      style={{ padding: '11px 14px', borderRadius: 9, border: `1.5px dashed ${dragOver ? C.blue + '60' : C.brd2}`, background: dragOver ? C.blueDim : C.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.18s' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {uploading ? <div style={{ width: 14, height: 14, border: `2px solid ${C.blue}25`, borderTop: `2px solid ${C.blue}`, borderRadius: '50%', animation: 'ev-spin 0.8s linear infinite' }} /> : <Upload size={14} color={C.blue} />}
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
            {(!isMobile || showPreview) && (
              <div className="ev-scroll" style={{ padding: isMobile ? '16px 16px' : '18px 16px', background: C.surface, overflowY: 'auto', borderLeft: isMobile ? 'none' : `1px solid ${C.brd}`, WebkitOverflowScrolling: 'touch' }}>
                <EventPreview form={form} gym={gym} />
              </div>
            )}
          </form>

          {/* FOOTER */}
          <div style={{ flexShrink: 0, padding: isMobile ? '12px 16px' : '12px 20px', borderTop: `1px solid ${C.brd}`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'flex-end', gap: isMobile ? 8 : 10, background: C.surface }}>
            {isMobile ? (
              <>
                <button type="submit" onClick={handleSubmit} disabled={!canSubmit}
                  style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', fontFamily: FONT, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', background: canSubmit ? '#2563eb' : C.brd2, color: canSubmit ? '#fff' : C.t3, cursor: canSubmit ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: 'none', opacity: canSubmit ? 1 : 0.4, WebkitTapHighlightColor: 'transparent' }}>
                  {isLoading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ev-spin 0.7s linear infinite' }} /> Creating…</> : 'Create'}
                </button>
                <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: '6px 0', textAlign: 'center' }}>Cancel</button>
              </>
            ) : (
              <>
                <button type="button" className="ev-cancel" onClick={handleClose}>Cancel</button>
                <button type="submit" onClick={handleSubmit} disabled={!canSubmit} style={submitBtnStyle}
                  onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { if (canSubmit) e.currentTarget.style.opacity = '1'; }}>
                  {isLoading ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ev-spin 0.7s linear infinite' }} /> Creating…</> : 'Create'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}