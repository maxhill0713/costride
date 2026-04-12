/**
 * CreatePollModal — Content Hub design system
 * Exact match to Content Center / Hub screenshot
 * Cyan #00e5c8 · DM Sans · #0d0d11 / #17171c / #1f1f26
 */
import React, { useState } from 'react';
import {
  X, BarChart2, Plus, CheckCircle,
  MessageSquare, Trash2, Eye, Zap,
} from 'lucide-react';

/* ─── TOKENS — Content Hub palette ──────────────────────────── */
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
  cyan:     '#00e5c8',
  cyanDim:  'rgba(0,229,200,0.07)',
  cyanBrd:  'rgba(0,229,200,0.18)',
  red:    '#ff4d6d', redDim:    'rgba(255,77,109,0.08)',  redBrd:    'rgba(255,77,109,0.20)',
  amber:  '#f59e0b', amberDim:  'rgba(245,158,11,0.08)', amberBrd:  'rgba(245,158,11,0.20)',
  green:  '#22c55e', greenDim:  'rgba(34,197,94,0.08)',  greenBrd:  'rgba(34,197,94,0.20)',
  blue:   '#60a5fa', blueDim:   'rgba(96,165,250,0.08)', blueBrd:   'rgba(96,165,250,0.20)',
  purple: '#a78bfa', purpleDim: 'rgba(167,139,250,0.08)',purpleBrd: 'rgba(167,139,250,0.20)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";
const MONO = { fontVariantNumeric: 'tabular-nums' };

/* ─── CATEGORIES ─────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'equipment_replacement', label: 'Equipment',   emoji: '🔧', color: C.amber,  dim: C.amberDim,  border: C.amberBrd  },
  { value: 'favorite_equipment',    label: 'Fav. Kit',    emoji: '💪', color: C.blue,   dim: C.blueDim,   border: C.blueBrd   },
  { value: 'rewards',               label: 'Rewards',     emoji: '🎁', color: C.green,  dim: C.greenDim,  border: C.greenBrd  },
  { value: 'playlist',              label: 'Playlist',    emoji: '🎵', color: C.purple, dim: C.purpleDim, border: C.purpleBrd },
  { value: 'schedule',              label: 'Schedule',    emoji: '📅', color: C.blue,   dim: C.blueDim,   border: C.blueBrd   },
  { value: 'other',                 label: 'Other',       emoji: '💬', color: C.t2,     dim: 'rgba(152,152,166,0.07)', border: 'rgba(152,152,166,0.18)' },
];

const catFor = val => CATEGORIES.find(c => c.value === val) || null;

/* ─── SHARED INPUT BASE ──────────────────────────────────────── */
const baseInp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`,
  color: C.t1, fontSize: 12.5, fontWeight: 500, outline: 'none',
  fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s',
};

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
function SL({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: C.red }}>*</span>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, Icon, accentColor = C.cyan }) {
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

function Textarea({ value, onChange, placeholder, rows = 2, accentColor = C.cyan }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}38`; e.target.style.background = C.inset; }}
      onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
      style={{ ...baseInp, resize: 'none', lineHeight: 1.7, padding: '11px 13px' }}
    />
  );
}

/* ─── CATEGORY TABS — identical to Hub tab bar ───────────────── */
function CategoryTabs({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.brd}`, marginLeft: -2, overflowX: 'auto' }}>
      {CATEGORIES.map(cat => {
        const active = value === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            type="button"
            style={{
              padding: '8px 13px', background: 'none', border: 'none',
              borderBottom: active ? `2px solid ${cat.color}` : '2px solid transparent',
              color: active ? C.t1 : C.t2, fontSize: 12.5,
              fontWeight: active ? 700 : 500, cursor: 'pointer',
              fontFamily: FONT, whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5,
            }}
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

/* ─── LIVE PREVIEW ───────────────────────────────────────────── */
function PollPreview({ title, description, category, options }) {
  const cat = catFor(category);
  const accent = cat?.color || C.purple;
  const validOpts = options.filter(o => o.trim());
  const hasContent = title || validOpts.length > 0;

  const fakeVotes = validOpts.map((_, i) => [8, 5, 3, 2][i] || 1);
  const total = fakeVotes.reduce((a, b) => a + b, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Eye size={11} color={C.t3} />
        <span style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>

      {/* Card */}
      <div style={{ borderRadius: 12, overflow: 'hidden', background: C.card, border: `1px solid ${C.brd}` }}>
        {/* Accent top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44, transparent)`, transition: 'background 0.3s' }} />

        {!hasContent ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <BarChart2 size={22} color={`${accent}35`} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 11.5, color: C.t3, fontWeight: 500 }}>Fill in details to preview your poll</div>
          </div>
        ) : (
          <div style={{ padding: '14px 15px 0' }}>
            {/* Category badge */}
            {cat && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, background: cat.dim, border: `1px solid ${cat.border}`, marginBottom: 8 }}>
                <span style={{ fontSize: 11 }}>{cat.emoji}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: cat.color }}>{cat.label}</span>
              </div>
            )}

            {/* Question */}
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, lineHeight: 1.35, marginBottom: description ? 7 : 12 }}>
              {title || 'Poll question'}
            </div>

            {/* Context */}
            {description && (
              <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {description}
              </div>
            )}

            {/* Options */}
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

            {/* Footer */}
            <div style={{ marginTop: 12, paddingTop: 10, paddingBottom: 14, borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: C.t3 }}>0 votes · Open</span>
              {/* Vote button — solid cyan style */}
              <div style={{ padding: '5px 14px', borderRadius: 7, background: C.cyan, color: '#000', fontSize: 11, fontWeight: 700 }}>
                Vote
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function CreatePollModal({ open, onClose, onSave, isLoading }) {
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [options,     setOptions]     = useState(['', '']);
  const [description, setDescription] = useState('');

  const validOpts = options.filter(o => o.trim());
  const canSave   = title.trim() && category && validOpts.length >= 2 && !isLoading;
  const cat       = catFor(category);
  const accent    = cat?.color || C.purple;

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

      {/* Backdrop */}
      <div
        onClick={e => e.target === e.currentTarget && handleClose()}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'pl-fade 0.15s ease', fontFamily: FONT }}
      >

        {/* Shell */}
        <div style={{ width: '100%', maxWidth: 920, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,229,200,0.04)`, animation: 'pl-in 0.24s cubic-bezier(0.16,1,0.3,1)', WebkitFontSmoothing: 'antialiased' }}>

          {/* ── HEADER ──────────────────────────────────────── */}
          <div style={{ flexShrink: 0, padding: '0 20px', background: C.surface, borderBottom: `1px solid ${C.brd}`, position: 'relative', overflow: 'hidden' }}>


            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: cat?.dim || C.cyanDim, border: `1px solid ${cat?.border || C.cyanBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: cat ? 16 : 'inherit', transition: 'all 0.2s' }}>
                  {cat ? <span>{cat.emoji}</span> : <BarChart2 size={14} color={C.cyan} />}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Content Center <span style={{ color: C.cyan }}>/</span> <span style={{ color: C.cyan }}>Create Poll</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>Ask members what they think</div>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${C.brd}`, cursor: 'pointer', color: C.t3, flexShrink: 0, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.t1; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t3; }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Category tabs — identical Hub tab bar */}
            <div style={{ marginTop: 4, marginLeft: -2 }}>
              <CategoryTabs value={category} onChange={setCategory} />
            </div>
          </div>

          {/* ── BODY ────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0, overflow: 'hidden' }}>

            {/* Left — form */}
            <div className="pl-scroll" style={{ padding: '18px 20px', borderRight: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', background: C.bg }}>

              {/* Question */}
              <div>
                <SL required>Question</SL>
                <Inp value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Which equipment should we replace first?" Icon={MessageSquare} accentColor={accent} />
              </div>

              {/* Context */}
              <div>
                <SL>Additional Context</SL>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any helpful context or background for members…" rows={2} accentColor={accent} />
              </div>

              {/* Options */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <SL required>Answer Options</SL>
                  <span style={{ fontSize: 10, color: validOpts.length >= 2 ? C.green : C.t3, fontWeight: 700, marginTop: -8, ...MONO }}>
                    {validOpts.length} / {options.length} filled
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Number badge */}
                      <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: opt.trim() ? `${accent}14` : C.card, border: `1px solid ${opt.trim() ? accent + '30' : C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: opt.trim() ? accent : C.t3, ...MONO }}>{idx + 1}</span>
                      </div>

                      {/* Input */}
                      <input
                        className="pl-opt"
                        value={opt}
                        onChange={e => updateOption(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        onFocus={e => { e.target.style.borderColor = `${accent}38`; e.target.style.background = C.inset; }}
                        onBlur={e =>  { e.target.style.borderColor = C.brd; e.target.style.background = C.card; }}
                      />

                      {/* Remove */}
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.redDim, border: `1px solid ${C.redBrd}`, cursor: 'pointer', transition: 'all 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,109,0.16)'}
                          onMouseLeave={e => e.currentTarget.style.background = C.redDim}
                        >
                          <Trash2 size={11} color={C.red} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add option */}
                {options.length < 8 && (
                  <button
                    type="button"
                    onClick={addOption}
                    style={{ marginTop: 9, width: '100%', padding: '9px', borderRadius: 9, background: `${accent}07`, border: `1.5px dashed ${accent}28`, color: accent, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: FONT, transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${accent}12`}
                    onMouseLeave={e => e.currentTarget.style.background = `${accent}07`}
                  >
                    <Plus size={12} /> Add option
                  </button>
                )}
              </div>
            </div>

            {/* Right — live preview */}
            <div className="pl-scroll" style={{ padding: '18px 16px', background: C.surface, overflowY: 'auto', borderLeft: `1px solid ${C.brd}` }}>
              <PollPreview title={title} description={description} category={category} options={options} />
            </div>
          </div>

          {/* ── FOOTER ──────────────────────────────────────── */}
          <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 10, background: C.surface }}>
            {/* Status */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {canSave ? (
                <>
                  <CheckCircle size={11} color={C.green} />
                  <span style={{ fontSize: 10.5, color: C.t3 }}>
                    {title} · {validOpts.length} option{validOpts.length !== 1 ? 's' : ''}
                    {cat ? ` · ${cat.label}` : ''}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 10.5, color: C.t3 }}>
                  {!category ? 'Pick a category to continue' : !title.trim() ? 'Add a question to continue' : 'Add at least 2 options'}
                </span>
              )}
            </div>

            {/* Cancel */}
            <button className="pl-cancel" onClick={handleClose} type="button">Cancel</button>

            {/* Create Poll — solid cyan */}
            <button
              onClick={handleSubmit}
              disabled={!canSave}
              type="button"
              style={{
                padding: '9px 22px', borderRadius: 8, border: 'none',
                fontFamily: FONT, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
                background: canSave ? C.cyan : C.brd2,
                color: canSave ? '#000' : C.t3,
                cursor: canSave ? 'pointer' : 'default',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: canSave ? `0 0 24px ${C.cyan}40` : 'none',
                opacity: canSave ? 1 : 0.4,
                minWidth: 150, justifyContent: 'center',
                transition: 'opacity 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { if (canSave) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { if (canSave) e.currentTarget.style.opacity = '1'; }}
            >
              {isLoading
                ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'pl-spin 0.7s linear infinite' }} /> Creating…</>
                : <><Zap size={13} /> Create Poll</>}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}