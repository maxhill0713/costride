/**
 * CreatePollModal — Content Hub design system
 * Blue #60a5fa · DM Sans · #0d0d11 / #17171c / #1f1f26
 */
import React, { useState, useEffect } from 'react';
import {
  X, BarChart2, Plus, CheckCircle,
  MessageSquare, Trash2, Eye, Zap, ChevronDown, ChevronLeft,
} from 'lucide-react';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       '#0d0d11',
  surface:  '#17171c',
  card:     '#1f1f26',
  inset:    '#13131a',
  brd:      '#252530',
  brd2:     '#2e2e3a',
  brdHover: '#3a3a48',
  t1:       '#ffffff',
  t2:       '#9898a6',
  t3:       '#525260',
  blue:     '#60a5fa', blueDim:   'rgba(96,165,250,0.07)',  blueBrd:   'rgba(96,165,250,0.18)',
  red:    '#ff4d6d', redDim:    'rgba(255,77,109,0.08)',  redBrd:    'rgba(255,77,109,0.20)',
  amber:  '#f59e0b', amberDim:  'rgba(245,158,11,0.08)', amberBrd:  'rgba(245,158,11,0.20)',
  green:  '#22c55e', greenDim:  'rgba(34,197,94,0.08)',  greenBrd:  'rgba(34,197,94,0.20)',
  purple: '#a78bfa', purpleDim: 'rgba(167,139,250,0.08)',purpleBrd: 'rgba(167,139,250,0.20)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";
const MONO = { fontVariantNumeric: 'tabular-nums' };

/* ─── DATA ───────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'equipment_replacement', label: 'Equipment', emoji: '🔧', color: C.amber,  dim: C.amberDim,  border: C.amberBrd  },
  { value: 'favorite_equipment',    label: 'Fav. Kit',  emoji: '💪', color: C.blue,   dim: C.blueDim,   border: C.blueBrd   },
  { value: 'rewards',               label: 'Rewards',   emoji: '🎁', color: C.green,  dim: C.greenDim,  border: C.greenBrd  },
  { value: 'playlist',              label: 'Playlist',  emoji: '🎵', color: C.purple, dim: C.purpleDim, border: C.purpleBrd },
  { value: 'schedule',              label: 'Schedule',  emoji: '📅', color: C.blue,   dim: C.blueDim,   border: C.blueBrd   },
  { value: 'other',                 label: 'Other',     emoji: '💬', color: C.t2,     dim: 'rgba(152,152,166,0.07)', border: 'rgba(152,152,166,0.18)' },
];

const catFor = val => CATEGORIES.find(c => c.value === val) || null;

/* ─── MOBILE HOOK ────────────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

/* ─── SHARED INPUT BASE ──────────────────────────────────────── */
const baseInp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 12.5, fontWeight: 500, outline: 'none',
  fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s',
};

/* ─── DESKTOP PRIMITIVES ─────────────────────────────────────── */
function SL({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: C.red }}>*</span>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, Icon, accentColor = C.blue }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon size={12} color={focus ? accentColor : C.t3} style={{ transition: 'color 0.15s' }} />
        </div>
      )}
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
        onBlur={e =>  { setFocus(false); e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
        style={{ ...baseInp, paddingLeft: Icon ? 32 : 12 }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 2, accentColor = C.blue }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
      onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
      style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '11px 13px' }}
    />
  );
}

/* ─── DESKTOP: CATEGORY TABS ─────────────────────────────────── */
function CategoryTabs({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.brd}`, marginLeft: -2, overflowX: 'auto' }}>
      {CATEGORIES.map(cat => {
        const active = value === cat.value;
        return (
          <button key={cat.value} onClick={() => onChange(cat.value)} type="button"
            style={{ padding: '8px 13px', background: 'none', border: 'none', borderBottom: active ? `2px solid ${cat.color}` : '2px solid transparent', color: active ? C.t1 : C.t2, fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.t2; }}
          >
            <span style={{ fontSize: 13 }}>{cat.emoji}</span>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── SHARED: POLL PREVIEW CARD ──────────────────────────────── */
function PollPreview({ title, description, category, options }) {
  const cat = catFor(category);
  const accent = cat?.color || C.blue;
  const validOpts = options.filter(o => o.trim());
  const hasContent = title || validOpts.length > 0;

  const fakeVotes = validOpts.map((_, i) => [8, 5, 3, 2][i] || 1);
  const total = fakeVotes.reduce((a, b) => a + b, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Eye size={11} color={C.t3} />
        <span style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', background: C.card, border: `1px solid ${C.brd}` }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44, transparent)`, transition: 'background 0.3s' }} />
        {!hasContent ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <BarChart2 size={22} color={`${accent}35`} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 11.5, color: C.t3, fontWeight: 500 }}>Fill in details to preview your poll</div>
          </div>
        ) : (
          <div style={{ padding: '14px 15px 0' }}>
            {cat && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, background: cat.dim, border: `1px solid ${cat.border}`, marginBottom: 8 }}>
                <span style={{ fontSize: 11 }}>{cat.emoji}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: cat.color }}>{cat.label}</span>
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, lineHeight: 1.35, marginBottom: description ? 7 : 12 }}>{title || 'Poll question'}</div>
            {description && (
              <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</div>
            )}
            {validOpts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 0 }}>
                {validOpts.map((opt, i) => {
                  const pct = Math.round((fakeVotes[i] / total) * 100);
                  const isTop = i === 0;
                  return (
                    <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${isTop ? accent + '30' : C.brd}`, background: isTop ? `${accent}07` : C.surface }}>
                      <div style={{ padding: '8px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: isTop ? 700 : 500, color: isTop ? C.t1 : C.t2 }}>{opt}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isTop ? accent : C.t3, flexShrink: 0, ...MONO }}>{pct}%</span>
                      </div>
                      <div style={{ height: 3, background: C.brd }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isTop ? accent : `${accent}50` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '14px', borderRadius: 9, border: `1.5px dashed ${C.brd2}`, textAlign: 'center', marginBottom: 0 }}>
                <div style={{ fontSize: 11, color: C.t3 }}>Add options to see them here</div>
              </div>
            )}
            <div style={{ marginTop: 12, paddingTop: 10, paddingBottom: 14, borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: C.t3 }}>0 votes · Open</span>
              <div style={{ padding: '5px 14px', borderRadius: 7, background: C.blue, color: '#fff', fontSize: 11, fontWeight: 700 }}>Vote</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MOBILE-ONLY COMPONENTS
══════════════════════════════════════════════════════════════ */

/* ── MOBILE: PREVIEW BOTTOM SHEET ────────────────────────────── */
function MobilePollPreviewSheet({ open, onClose, title, description, category, options }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700, fontFamily: FONT }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
          opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: C.surface, borderRadius: '22px 22px 0 0',
        border: `1px solid ${C.brd}`, borderBottom: 'none',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        transform: `translateY(${visible ? '0' : '100%'})`,
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div style={{ padding: '14px 0 6px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.brd2 }} />
        </div>
        <div style={{ padding: '0 16px 12px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>Poll Preview</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color={C.t3} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <PollPreview title={title} description={description} category={category} options={options} />
        </div>
      </div>
    </div>
  );
}

/* ── MOBILE FULL-SCREEN MODAL ────────────────────────────────── */
function MobileCreatePollModal({ open, onClose, onSave, isLoading }) {
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [options,     setOptions]     = useState(['', '']);
  const [description, setDescription] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const validOpts = options.filter(o => o.trim());
  const canSave   = title.trim() && category && validOpts.length >= 2 && !isLoading;
  const cat       = catFor(category);
  const accent    = cat?.color || C.blue;

  const updateOption = (idx, val) => { const n = [...options]; n[idx] = val; setOptions(n); };
  const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx));
  const addOption    = () => setOptions([...options, '']);

  const handleSubmit = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(), description: description.trim(), category,
      options: validOpts.map(text => ({ id: Math.random().toString(36).substr(2, 9), text, votes: 0 })),
    });
    setTitle(''); setDescription(''); setCategory(''); setOptions(['', '']);
  };

  const handleClose = () => {
    setTitle(''); setDescription(''); setCategory(''); setOptions(['', '']);
    onClose();
  };

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    } else { setVisible(false); }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes pl-spin { to { transform: rotate(360deg) } }
        .pl-mobile-scroll::-webkit-scrollbar { display: none }
        .pl-cats-scroll::-webkit-scrollbar   { display: none }
        .pl-mobile-opt::placeholder { color: ${C.t3}; }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: C.bg, fontFamily: FONT,
        display: 'flex', flexDirection: 'column',
        transform: `translateY(${visible ? '0' : '100%'})`,
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>

        {/* ── HEADER ── */}
        <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 12px' }}>
            <button onClick={handleClose} style={{ width: 38, height: 38, borderRadius: 10, background: C.card, border: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronLeft size={18} color={C.t2} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>
                Create <span style={{ color: accent }}>Poll</span>
              </div>
            </div>
            <button onClick={() => setPreviewOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, color: C.blue, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
              <Eye size={13} /> Preview
            </button>
          </div>
          <div className="pl-cats-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {CATEGORIES.map(c => {
              const active = category === c.value;
              return (
                <button key={c.value} onClick={() => setCategory(c.value)} type="button"
                  style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 24, background: active ? c.dim : C.card, border: `1.5px solid ${active ? c.border : C.brd}`, color: active ? c.color : C.t2, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 14 }}>{c.emoji}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SCROLLABLE FORM ── */}
        <div className="pl-mobile-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              Question <span style={{ color: C.red }}>*</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <MessageSquare size={15} color={C.t3} />
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Which equipment should we replace first?"
                onFocus={e => { e.target.style.borderColor = `${accent}40`; e.target.style.background = C.inset; }}
                onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
                style={{ ...baseInp, paddingLeft: 40, paddingTop: 13, paddingBottom: 13, fontSize: 14, borderRadius: 12 }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Additional Context</div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any helpful context or background for members…" rows={3}
              onFocus={e => { e.target.style.borderColor = `${accent}40`; e.target.style.background = C.inset; }}
              onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
              style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '13px 14px', fontSize: 14, borderRadius: 12 }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', display: 'flex', alignItems: 'center', gap: 4 }}>
                Answer Options <span style={{ color: C.red }}>*</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: validOpts.length >= 2 ? C.green : C.t3, ...MONO }}>{validOpts.length}/{options.length} filled</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: opt.trim() ? `${accent}14` : C.card, border: `1.5px solid ${opt.trim() ? accent + '30' : C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: opt.trim() ? accent : C.t3, ...MONO }}>{idx + 1}</span>
                  </div>
                  <input className="pl-mobile-opt" value={opt} onChange={e => updateOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`}
                    onFocus={e => { e.target.style.borderColor = `${accent}40`; e.target.style.background = C.inset; }}
                    onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
                    style={{ ...baseInp, flex: 1, paddingTop: 13, paddingBottom: 13, fontSize: 14, borderRadius: 11 }} />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(idx)} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.redDim, border: `1.5px solid ${C.redBrd}`, cursor: 'pointer', transition: 'all 0.12s' }}>
                      <Trash2 size={15} color={C.red} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 8 && (
              <button type="button" onClick={addOption} style={{ marginTop: 12, width: '100%', padding: '14px', borderRadius: 12, background: `${accent}07`, border: `2px dashed ${accent}28`, color: accent, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
                <Plus size={15} /> Add option
              </button>
            )}
          </div>
          <div style={{ height: 8 }} />
        </div>

        {/* ── STICKY FOOTER ── */}
        <div style={{ flexShrink: 0, padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${C.brd}`, background: C.surface, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {canSave ? (
              <>
                <CheckCircle size={13} color={C.green} />
                <span style={{ fontSize: 12, color: C.t3 }}>{title} · {validOpts.length} option{validOpts.length !== 1 ? 's' : ''}{cat ? ` · ${cat.label}` : ''}</span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: C.t3 }}>
                {!category ? 'Pick a category to continue' : !title.trim() ? 'Add a question to continue' : 'Add at least 2 options'}
              </span>
            )}
          </div>
          <button onClick={handleSubmit} disabled={!canSave} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', fontFamily: FONT, fontSize: 15, fontWeight: 800, background: canSave ? C.blue : C.brd2, color: canSave ? '#fff' : C.t3, cursor: canSave ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: canSave ? `0 0 28px ${C.blue}40` : 'none', opacity: canSave ? 1 : 0.45, transition: 'all 0.2s' }}>
            {isLoading
              ? <><div style={{ width: 14, height: 14, border: '2.5px solid rgba(255,255,255,0.25)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'pl-spin 0.7s linear infinite' }} /> Creating…</>
              : <><Zap size={16} /> Create Poll</>}
          </button>
        </div>
      </div>

      <MobilePollPreviewSheet open={previewOpen} onClose={() => setPreviewOpen(false)} title={title} description={description} category={category} options={options} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   DESKTOP MODAL
══════════════════════════════════════════════════════════════ */
function DesktopCreatePollModal({ open, onClose, onSave, isLoading }) {
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [options,     setOptions]     = useState(['', '']);
  const [description, setDescription] = useState('');

  const validOpts = options.filter(o => o.trim());
  const canSave   = title.trim() && category && validOpts.length >= 2 && !isLoading;
  const cat       = catFor(category);
  const accent    = cat?.color || C.blue;

  const updateOption = (idx, val) => { const n = [...options]; n[idx] = val; setOptions(n); };
  const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx));
  const addOption    = () => setOptions([...options, '']);

  const handleSubmit = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(), description: description.trim(), category,
      options: validOpts.map(text => ({ id: Math.random().toString(36).substr(2, 9), text, votes: 0 })),
    });
    setTitle(''); setDescription(''); setCategory(''); setOptions(['', '']);
  };

  const handleClose = () => {
    setTitle(''); setDescription(''); setCategory(''); setOptions(['', '']);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes pl-fade { from{opacity:0} to{opacity:1} }
        @keyframes pl-in   { from{opacity:0;transform:scale(0.975) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes pl-spin { to{transform:rotate(360deg)} }
        .pl-scroll::-webkit-scrollbar       { width:3px }
        .pl-scroll::-webkit-scrollbar-track { background:transparent }
        .pl-scroll::-webkit-scrollbar-thumb { background:${C.brd2}; border-radius:2px }
        .pl-cancel { padding:9px 18px; border-radius:8px; background:transparent; border:1px solid ${C.brd}; color:${C.t2}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; transition:all 0.15s; }
        .pl-cancel:hover { border-color:${C.brdHover}; color:${C.t1}; background:${C.card}; }
        .pl-opt { width:100%; box-sizing:border-box; padding:9px 12px; border-radius:9px; background:${C.card}; border:1px solid ${C.brd}; color:${C.t1}; font-size:12px; font-weight:500; outline:none; font-family:${FONT}; transition:border-color 0.15s, background 0.15s; }
        .pl-opt::placeholder { color:${C.t3}; }
      `}</style>

      <div
        onClick={e => e.target === e.currentTarget && handleClose()}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'pl-fade 0.15s ease', fontFamily: FONT }}
      >
        <div style={{ width: '100%', maxWidth: 920, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(96,165,250,0.04)`, animation: 'pl-in 0.24s cubic-bezier(0.16,1,0.3,1)', WebkitFontSmoothing: 'antialiased' }}>

          {/* HEADER */}
          <div style={{ flexShrink: 0, padding: '0 20px', background: C.surface, borderBottom: `1px solid ${C.brd}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: cat?.dim || C.blueDim, border: `1px solid ${cat?.border || C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: cat ? 16 : 'inherit', transition: 'all 0.2s' }}>
                  {cat ? <span>{cat.emoji}</span> : <BarChart2 size={14} color={C.blue} />}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  Create Poll
                </div>
              </div>
              <button onClick={handleClose} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = C.t1; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.t3; }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ marginTop: 8, marginLeft: -2 }}>
              <CategoryTabs value={category} onChange={setCategory} />
            </div>
          </div>

          {/* BODY */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0, overflow: 'hidden' }}>
            <div className="pl-scroll" style={{ padding: '18px 20px', borderRight: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', background: C.bg }}>
              <div>
                <SL required>Question</SL>
                <Inp value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Which equipment should we replace first?" Icon={MessageSquare} accentColor={accent} />
              </div>
              <div>
                <SL>Additional Context</SL>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any helpful context or background for members…" rows={2} accentColor={accent} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <SL required>Answer Options</SL>
                  <span style={{ fontSize: 10, color: validOpts.length >= 2 ? C.green : C.t3, fontWeight: 700, marginTop: -8, ...MONO }}>{validOpts.length} / {options.length} filled</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: opt.trim() ? `${accent}14` : C.card, border: `1px solid ${opt.trim() ? accent + '30' : C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: opt.trim() ? accent : C.t3, ...MONO }}>{idx + 1}</span>
                      </div>
                      <input className="pl-opt" value={opt} onChange={e => updateOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`}
                        onFocus={e => { e.target.style.borderColor = `${accent}38`; e.target.style.background = C.inset; }}
                        onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }} />
                      {options.length > 2 && (
                        <button type="button" onClick={() => removeOption(idx)}
                          style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.redDim, border: `1px solid ${C.redBrd}`, cursor: 'pointer', transition: 'all 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,109,0.16)'}
                          onMouseLeave={e => e.currentTarget.style.background = C.redDim}>
                          <Trash2 size={11} color={C.red} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 8 && (
                  <button type="button" onClick={addOption}
                    style={{ marginTop: 9, width: '100%', padding: '9px', borderRadius: 9, background: `${accent}07`, border: `1.5px dashed ${accent}28`, color: accent, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: FONT, transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${accent}12`}
                    onMouseLeave={e => e.currentTarget.style.background = `${accent}07`}>
                    <Plus size={12} /> Add option
                  </button>
                )}
              </div>
            </div>

            <div className="pl-scroll" style={{ padding: '18px 16px', background: C.surface, overflowY: 'auto', borderLeft: `1px solid ${C.brd}` }}>
              <PollPreview title={title} description={description} category={category} options={options} />
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 10, background: C.surface }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {canSave ? (
                <>
                  <CheckCircle size={11} color={C.green} />
                  <span style={{ fontSize: 10.5, color: C.t3 }}>{title} · {validOpts.length} option{validOpts.length !== 1 ? 's' : ''}{cat ? ` · ${cat.label}` : ''}</span>
                </>
              ) : (
                <span style={{ fontSize: 10.5, color: C.t3 }}>{!category ? 'Pick a category to continue' : !title.trim() ? 'Add a question to continue' : 'Add at least 2 options'}</span>
              )}
            </div>
            <button className="pl-cancel" onClick={handleClose} type="button">Cancel</button>
            <button onClick={handleSubmit} disabled={!canSave} type="button"
              style={{ padding: '9px 22px', borderRadius: 8, border: 'none', fontFamily: FONT, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', background: canSave ? C.blue : C.brd2, color: canSave ? '#fff' : C.t3, cursor: canSave ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: canSave ? `0 0 24px ${C.blue}40` : 'none', opacity: canSave ? 1 : 0.4, minWidth: 150, justifyContent: 'center', transition: 'opacity 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { if (canSave) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { if (canSave) e.currentTarget.style.opacity = '1'; }}>
              {isLoading
                ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'pl-spin 0.7s linear infinite' }} /> Creating…</>
                : <><Zap size={13} /> Create Poll</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT EXPORT — branches on isMobile
══════════════════════════════════════════════════════════════ */
export default function CreatePollModal({ open, onClose, onSave, isLoading }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileCreatePollModal open={open} onClose={onClose} onSave={onSave} isLoading={isLoading} />;
  }
  return <DesktopCreatePollModal open={open} onClose={onClose} onSave={onSave} isLoading={isLoading} />;
}