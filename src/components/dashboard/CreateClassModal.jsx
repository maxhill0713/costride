/**
 * CreateClassModal — purple-themed, matches CreateEventModal structure.
 * Calendar preview section removed. Submit button labelled "Create".
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Dumbbell, Clock, Upload, Eye, Users, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const C = {
  bg: '#0d0d11', surface: '#17171c', card: '#1f1f26', inset: '#13131a',
  brd: '#252530', brd2: '#2e2e3a', brdHover: '#3a3a48',
  t1: '#ffffff', t2: '#9898a6', t3: '#525260',
  purple: '#a855f7', purpleDim: 'rgba(168,85,247,0.08)', purpleBrd: 'rgba(168,85,247,0.22)',
  red: '#ff4d6d', redDim: 'rgba(255,77,109,0.08)',
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.08)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'all_levels'];
const todayStr = new Date().toISOString().split('T')[0];

const CLASS_COLORS = [
  '#a855f7', // purple (default)
  '#4d7fff', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#f04a68', // red/pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#ec4899', // hot pink
  '#6366f1', // indigo
  '#84cc16', // lime
];

const baseInp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 16, fontWeight: 500, outline: 'none',
  fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s',
  colorScheme: 'dark',
};

function SL({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: C.red }}>*</span>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = 'text', disabled, Icon, min }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon size={12} color={focus ? C.purple : C.t3} style={{ transition: 'color 0.15s' }} />
        </div>
      )}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} min={min}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${C.purple}55`; e.target.style.background = C.inset; }}
        onBlur={e => { setFocus(false); e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
        style={{ ...baseInp, paddingLeft: Icon ? 32 : 12, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'text',
          ...(type === 'number' ? { MozAppearance: 'textfield' } : {}) }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${C.purple}55`; e.target.style.background = C.inset; }}
      onBlur={e => { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
      style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '11px 13px' }}
    />
  );
}

function ClassPreview({ form }) {
  const hasContent = form.name;
  if (!hasContent) {
    return (
      <div style={{ borderRadius: 12, background: C.card, border: `1px solid ${C.brd}`, padding: '28px 16px', textAlign: 'center' }}>
        <Dumbbell size={24} color={C.t3} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 11.5, color: C.t3 }}>Fill in details to preview your class</div>
      </div>
    );
  }
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 18, overflow: 'hidden', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Dumbbell size={16} color={C.purple} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{form.name}</div>
          {form.instructor && <div style={{ fontSize: 11, color: 'rgba(168,85,247,0.8)', fontWeight: 600, marginTop: 1 }}>with {form.instructor}</div>}
        </div>
      </div>
      {form.description && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 10 }}>{form.description}</div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {form.duration_minutes && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <Clock size={10} color={C.purple} />
            <span style={{ fontSize: 11, color: C.purple, fontWeight: 600 }}>{form.duration_minutes} min</span>
          </div>
        )}
        {form.max_capacity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <Users size={10} color={C.purple} />
            <span style={{ fontSize: 11, color: C.purple, fontWeight: 600 }}>{form.max_capacity} max</span>
          </div>
        )}
        {form.difficulty && (
          <div style={{ padding: '4px 9px', borderRadius: 7, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <span style={{ fontSize: 11, color: C.purple, fontWeight: 600, textTransform: 'capitalize' }}>{form.difficulty.replace('_', ' ')}</span>
          </div>
        )}
      </div>
      {form.date && form.time && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(168,85,247,0.15)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: C.purple, fontWeight: 600 }}>{new Date(form.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
            <span>at {form.time}</span>
            {form.weekly && <span style={{ color: C.purple, fontWeight: 600 }}>· Repeats weekly</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateClassModal({ open, onClose, onSave, gym, isLoading }) {
  const emptyForm = { name: '', description: '', instructor: '', duration_minutes: '', max_capacity: '', difficulty: 'all_levels', date: '', time: '', weekly: false, color: CLASS_COLORS[0] };
  const [form, setForm] = useState(emptyForm);
  const [showPreview, setShowPreview] = useState(false);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.name.trim() && form.instructor.trim() && form.duration_minutes && form.max_capacity && form.date && form.time && !isLoading;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    const dayName = new Date(form.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' });
    const payload = {
      ...form,
      duration_minutes: Number(form.duration_minutes),
      max_capacity: Number(form.max_capacity),
      schedule: [{ day: dayName, time: form.time, date: form.date, weekly: form.weekly === true }],
      color: form.color,
      gym_id: gym?.id,
      gym_name: gym?.name,
    };
    onSave(payload);
    setForm(emptyForm);
  };

  const handleClose = () => { setForm(emptyForm); onClose(); };

  if (!open) return null;

  const submitStyle = {
    padding: '9px 22px', borderRadius: 10, border: 'none', fontFamily: FONT,
    fontSize: 13, fontWeight: 800,
    background: canSubmit ? C.purple : '#2a2a30',
    color: canSubmit ? '#fff' : C.t3,
    cursor: canSubmit ? 'pointer' : 'default',
    display: 'inline-flex', alignItems: 'center', gap: 7, opacity: 1,
    minWidth: 100, justifyContent: 'center', transition: 'opacity 0.15s',
  };

  const selectStyle = { ...baseInp, appearance: 'none', cursor: 'pointer', paddingRight: 32 };

  return (
    <>
      <style>{`
        @keyframes cls-fade { from{opacity:0} to{opacity:1} }
        @keyframes cls-in   { from{opacity:0;transform:scale(0.975) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes cls-up   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cls-spin { to{transform:rotate(360deg)} }
        .cls-scroll::-webkit-scrollbar { width:3px }
        .cls-scroll::-webkit-scrollbar-thumb { background:${C.brd2}; border-radius:2px }
        .cls-cancel { padding:9px 18px; border-radius:8px; background:transparent; border:1px solid ${C.brd}; color:${C.t2}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; }
        .cls-cancel:hover { border-color:${C.brdHover}; color:${C.t1}; }
        .cls-sel-wrap { position:relative; }
        .cls-sel-wrap::after { content:''; position:absolute; right:10px; top:50%; transform:translateY(-50%); width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid ${C.t3}; pointer-events:none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div onClick={e => e.target === e.currentTarget && handleClose()}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20, animation: 'cls-fade 0.15s ease', fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 680, maxHeight: isMobile ? '96vh' : '90vh', height: isMobile ? '96vh' : 'auto', display: 'flex', flexDirection: 'column', background: C.bg, border: isMobile ? 'none' : `1px solid ${C.brd}`, borderRadius: isMobile ? '20px 20px 0 0' : 14, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.85)', animation: isMobile ? 'cls-up 0.3s cubic-bezier(0.32,0.72,0,1)' : 'cls-in 0.24s cubic-bezier(0.16,1,0.3,1)' }}>

          {/* HEADER */}
          <div style={{ flexShrink: 0, padding: isMobile ? '0 16px' : '16px 20px', background: C.surface, borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {isMobile && <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: C.brd2 }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, ...(isMobile ? { paddingTop: 22 } : {}) }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: C.purpleDim, border: `1px solid ${C.purpleBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Dumbbell size={14} color={C.purple} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>Create Class</div>
              {/* Colour picker swatches */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', maxWidth: 160 }}>
                {CLASS_COLORS.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => set('color', col)}
                    title={col}
                    style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: col, border: form.color === col ? `2px solid #fff` : '2px solid transparent',
                      cursor: 'pointer', outline: form.color === col ? `2px solid ${col}` : 'none',
                      outlineOffset: 1, transition: 'outline 0.1s, border 0.1s',
                      boxShadow: form.color === col ? `0 0 0 1px ${col}55` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isMobile && (
                <button onClick={() => setShowPreview(v => !v)} style={{ height: 30, padding: '0 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5, background: showPreview ? C.purpleDim : 'transparent', border: `1px solid ${showPreview ? C.purpleBrd : C.brd}`, cursor: 'pointer', color: showPreview ? C.purple : C.t3, fontSize: 11, fontWeight: 600, fontFamily: FONT }}>
                  <Eye size={11} /> {showPreview ? 'Edit' : 'Preview'}
                </button>
              )}
              <button onClick={handleClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3 }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* BODY — form only on desktop (no preview panel), preview toggle on mobile */}
          <form onSubmit={handleSubmit} style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {(!isMobile || !showPreview) && (
              <div className="cls-scroll" style={{ padding: isMobile ? '16px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', background: C.bg, flex: 1 }}>

                <div>
                  <SL required>Class Name</SL>
                  <Inp value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Morning HIIT, Yoga Flow" Icon={Dumbbell} />
                </div>

                <div>
                  <SL required>Instructor</SL>
                  <Inp value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="Instructor's name" />
                </div>

                <div>
                  <SL>Description</SL>
                  <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What members can expect from this class…" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <SL required>Duration (min)</SL>
                    <Inp type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} placeholder="" min="1" Icon={Clock} />
                  </div>
                  <div>
                    <SL required>Max Capacity</SL>
                    <Inp type="number" value={form.max_capacity} onChange={e => set('max_capacity', e.target.value)} placeholder="" min="1" Icon={Users} />
                  </div>
                  <div>
                    <SL>Difficulty</SL>
                    <div className="cls-sel-wrap">
                      <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} style={selectStyle}>
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <SL required>Date and Time</SL>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Inp type="date" value={form.date} onChange={e => set('date', e.target.value)} min={todayStr} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Inp type="time" value={form.time} onChange={e => set('time', e.target.value)} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <div onClick={() => set('weekly', !form.weekly)}
                      style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${form.weekly ? C.purple : C.brd}`, background: form.weekly ? C.purple : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer' }}>
                      {form.weekly && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Make class weekly</div>
                      <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>This class will repeat every week on the same day and time</div>
                    </div>
                  </label>
                </div>

              </div>
            )}

            {/* Mobile preview */}
            {isMobile && showPreview && (
              <div className="cls-scroll" style={{ padding: '16px', background: C.surface, overflowY: 'auto', flex: 1 }}>
                <ClassPreview form={form} />
              </div>
            )}
          </form>

          {/* FOOTER */}
          <div style={{ flexShrink: 0, padding: isMobile ? '12px 16px' : '12px 20px', borderTop: `1px solid ${C.brd}`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'flex-end', gap: isMobile ? 8 : 10, background: C.surface }}>
            {isMobile ? (
              <>
                <button type="submit" onClick={handleSubmit} disabled={!canSubmit}
                  style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', fontFamily: FONT, fontSize: 15, fontWeight: 800, background: canSubmit ? C.purple : '#2a2a30', color: canSubmit ? '#fff' : C.t3, cursor: canSubmit ? 'pointer' : 'default', opacity: 1 }}>
                  {isLoading ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: '6px 0', textAlign: 'center' }}>Cancel</button>
              </>
            ) : (
              <>
                <button type="button" className="cls-cancel" onClick={handleClose}>Cancel</button>
                <button type="submit" onClick={handleSubmit} disabled={!canSubmit} style={submitStyle}
                  onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { if (canSubmit) e.currentTarget.style.opacity = '1'; }}>
                  {isLoading ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'cls-spin 0.7s linear infinite' }} /> Creating…</> : 'Create'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}