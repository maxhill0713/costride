import React, { useState } from 'react';
import {
  X, BarChart2, Plus, CheckCircle, ChevronDown,
  MessageSquare, Trash2, Eye,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  blue:    '#0ea5e9', green:  '#10b981', red:    '#ef4444',
  amber:   '#f59e0b', purple: '#8b5cf6',
  text1:   '#f0f4f8', text2:  '#94a3b8', text3:  '#475569',
  border:  'rgba(255,255,255,0.07)', borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120', card2:  '#0d1630', divider: 'rgba(255,255,255,0.05)',
  bg:      '#060c18',
};

function Shimmer({ color = T.purple }) {
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}35,transparent)`, pointerEvents: 'none' }} />;
}

const CATEGORIES = [
  { value: 'equipment_replacement', label: 'Equipment Replacement', emoji: '🔧', color: T.amber  },
  { value: 'favorite_equipment',    label: 'Favourite Equipment',   emoji: '💪', color: T.blue   },
  { value: 'rewards',               label: 'Rewards & Perks',       emoji: '🎁', color: T.green  },
  { value: 'playlist',              label: 'Gym Playlist',          emoji: '🎵', color: T.purple },
  { value: 'schedule',              label: 'Class Schedule',        emoji: '📅', color: T.blue   },
  { value: 'other',                 label: 'Other',                 emoji: '💬', color: T.text3  },
];

function catFor(val) { return CATEGORIES.find(c => c.value === val) || null; }

// ── Shared inputs ─────────────────────────────────────────────────────────────
const baseInput = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px',
  borderRadius: 10, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: T.text1, fontSize: 13, fontWeight: 500, outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'border-color 0.15s, background 0.15s',
};

function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: T.red }}>*</span>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, icon: Icon, accentColor = T.purple }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Icon style={{ width: 12, height: 12, color: focus ? accentColor : T.text3, transition: 'color 0.15s' }} /></div>}
      <input value={value} onChange={onChange} placeholder={placeholder}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${accentColor}45`; e.target.style.background = `${accentColor}06`; }}
        onBlur={e  => { setFocus(false); e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
        style={{ ...baseInput, paddingLeft: Icon ? 33 : 13 }} />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, accentColor = T.purple }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={e => { e.target.style.borderColor = `${accentColor}45`; e.target.style.background = `${accentColor}06`; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
      style={{ ...baseInput, resize: 'none', lineHeight: 1.65 }} />
  );
}

// ── Category picker grid ──────────────────────────────────────────────────────
function CategoryPicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
      {CATEGORIES.map(cat => {
        const active = value === cat.value;
        return (
          <button key={cat.value} onClick={() => onChange(cat.value)} type="button"
            style={{ padding: '10px 8px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${active ? cat.color + '35' : T.border}`, background: active ? `${cat.color}12` : T.divider, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.15s', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.emoji}</span>
            <span style={{ fontSize: 9, fontWeight: active ? 800 : 500, color: active ? cat.color : T.text3, textAlign: 'center', lineHeight: 1.3, transition: 'color 0.15s' }}>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Live poll preview ─────────────────────────────────────────────────────────
function PollPreview({ title, description, category, options }) {
  const cat        = catFor(category);
  const validOpts  = options.filter(o => o.trim());
  const hasContent = title || validOpts.length > 0;

  // Simulate a slight vote spread for visual interest in preview
  const fakeVotes  = validOpts.map((_, i) => [8, 5, 3, 2][i] || 1);
  const total      = fakeVotes.reduce((a, b) => a + b, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat?.color || T.purple, boxShadow: `0 0 6px ${cat?.color || T.purple}` }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>

      {/* Poll card */}
      <div style={{ borderRadius: 12, background: T.card2, border: `1px solid ${(cat?.color || T.purple) + '22'}`, overflow: 'hidden', position: 'relative' }}>
        <Shimmer color={cat?.color || T.purple} />
        <div style={{ height: 3, background: `linear-gradient(90deg,${cat?.color || T.purple},${(cat?.color || T.purple) + '50'})` }} />

        <div style={{ padding: '16px 16px 14px' }}>
          {!hasContent ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <BarChart2 style={{ width: 28, height: 28, color: `${T.purple}40`, margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>Fill in details to preview your poll</div>
            </div>
          ) : (
            <>
              {/* Category badge */}
              {cat && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: `${cat.color}12`, border: `1px solid ${cat.color}25`, marginBottom: 12 }}>
                  <span style={{ fontSize: 11 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cat.color }}>{cat.label}</span>
                </div>
              )}

              {/* Question */}
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text1, letterSpacing: '-0.02em', marginBottom: description ? 8 : 14, lineHeight: 1.3 }}>
                {title || 'Poll question'}
              </div>

              {/* Context */}
              {description && (
                <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {description}
                </div>
              )}

              {/* Options with fake vote bars */}
              {validOpts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {validOpts.map((opt, i) => {
                    const pct    = Math.round((fakeVotes[i] / total) * 100);
                    const isTop  = i === 0;
                    const accent = cat?.color || T.purple;
                    return (
                      <div key={i} style={{ borderRadius: 9, overflow: 'hidden', border: `1px solid ${isTop ? accent + '30' : T.border}`, background: isTop ? `${accent}06` : 'rgba(255,255,255,0.02)' }}>
                        <div style={{ padding: '8px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: isTop ? 700 : 500, color: isTop ? T.text1 : T.text2 }}>{opt}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isTop ? accent : T.text3, flexShrink: 0 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 3, background: T.divider }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isTop ? accent : `${accent}50`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '14px', borderRadius: 9, border: `2px dashed ${T.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.text3 }}>Add options to see them here</div>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: T.text3 }}>0 votes · Open</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: cat?.color || T.purple, background: `${(cat?.color || T.purple)}10`, border: `1px solid ${(cat?.color || T.purple)}22`, borderRadius: 5, padding: '2px 7px' }}>Vote</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function CreatePollModal({ open, onClose, onSave, isLoading }) {
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [options,     setOptions]     = useState(['', '']);
  const [description, setDescription] = useState('');

  const validOpts  = options.filter(o => o.trim());
  const canSave    = title.trim() && category && validOpts.length >= 2 && !isLoading;
  const cat        = catFor(category);
  const accent     = cat?.color || T.purple;

  const updateOption = (idx, val) => { const n = [...options]; n[idx] = val; setOptions(n); };
  const removeOption = (idx)      => setOptions(options.filter((_, i) => i !== idx));
  const addOption    = ()         => setOptions([...options, '']);

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
        @keyframes pl-overlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pl-modal   { from { opacity: 0; transform: scale(0.97) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes pl-spin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .pl-body::-webkit-scrollbar { width: 3px } .pl-body::-webkit-scrollbar-track { background: transparent } .pl-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px }
        .pl-save:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }
        .pl-save:not(:disabled):active { transform: translateY(0); }
        .pl-cancel:hover { background: rgba(255,255,255,0.08) !important; color: #f0f4f8 !important; }
        .pl-opt-inp { width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #f0f4f8; font-size: 12px; font-weight: 500; outline: none; font-family: 'DM Sans', system-ui, sans-serif; transition: border-color 0.15s, background 0.15s; }
        .pl-opt-inp::placeholder { color: rgba(71,85,105,0.7); }
      `}</style>

      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,20,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'pl-overlay 0.18s ease', fontFamily: "'DM Sans', system-ui, sans-serif" }}
        onClick={e => e.target === e.currentTarget && handleClose()}>

        {/* Modal */}
        <div style={{ width: '100%', maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#07101f', border: `1px solid ${T.borderM}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04) inset', animation: 'pl-modal 0.22s cubic-bezier(0.34,1.4,0.64,1)' }}>

          {/* ── Header ── */}
          <div style={{ flexShrink: 0, padding: '18px 24px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <Shimmer color={accent} />
            <div style={{ position: 'absolute', top: -40, left: -20, width: 180, height: 100, borderRadius: '50%', background: accent, opacity: 0.04, filter: 'blur(40px)', pointerEvents: 'none', transition: 'background 0.3s' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}14`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: cat ? 18 : 'inherit', transition: 'all 0.2s' }}>
                {cat ? <span>{cat.emoji}</span> : <BarChart2 style={{ width: 17, height: 17, color: T.purple }} />}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em' }}>Create Poll</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>Ask members what they think</div>
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
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0, overflow: 'hidden' }}>

            {/* Left — form */}
            <div className="pl-body" style={{ padding: '20px 24px', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

              {/* Category */}
              <div>
                <FieldLabel required>Category</FieldLabel>
                <CategoryPicker value={category} onChange={setCategory} />
              </div>

              {/* Question */}
              <div>
                <FieldLabel required>Question</FieldLabel>
                <Inp value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Which equipment should we replace first?" icon={MessageSquare} accentColor={accent} />
              </div>

              {/* Context */}
              <div>
                <FieldLabel>Additional context</FieldLabel>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any helpful context or background for members…" rows={2} accentColor={accent} />
              </div>

              {/* Options */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <FieldLabel required>Answer options</FieldLabel>
                  <span style={{ fontSize: 10, color: validOpts.length >= 2 ? T.green : T.text3, fontWeight: 700 }}>
                    {validOpts.length} / {options.length} filled
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Number badge */}
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: opt.trim() ? `${accent}14` : T.divider, border: `1px solid ${opt.trim() ? accent + '30' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: opt.trim() ? accent : T.text3 }}>{idx + 1}</span>
                      </div>
                      {/* Input */}
                      <input className="pl-opt-inp" value={opt} onChange={e => updateOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`}
                        onFocus={e => { e.target.style.borderColor = `${accent}45`; e.target.style.background = `${accent}06`; }}
                        onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} />
                      {/* Remove */}
                      {options.length > 2 && (
                        <button type="button" onClick={() => removeOption(idx)}
                          style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${T.red}08`, border: `1px solid ${T.red}18`, cursor: 'pointer', transition: 'all 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = `${T.red}18`}
                          onMouseLeave={e => e.currentTarget.style.background = `${T.red}08`}>
                          <Trash2 style={{ width: 11, height: 11, color: T.red }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add option */}
                {options.length < 8 && (
                  <button type="button" onClick={addOption}
                    style={{ marginTop: 9, width: '100%', padding: '9px', borderRadius: 10, background: `${accent}06`, border: `1px dashed ${accent}25`, color: accent, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', transition: 'all 0.15s', opacity: 0.8 }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${accent}12`; e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${accent}06`; e.currentTarget.style.opacity = '0.8'; }}>
                    <Plus style={{ width: 12, height: 12 }} /> Add option
                  </button>
                )}
              </div>
            </div>

            {/* Right — live preview */}
            <div style={{ padding: '20px 18px', background: T.bg, overflowY: 'auto' }}>
              <PollPreview title={title} description={description} category={category} options={options} />
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ flexShrink: 0, padding: '14px 24px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, background: '#07101f' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
              {canSave ? (
                <>
                  <CheckCircle style={{ width: 12, height: 12, color: T.green, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.text3 }}>
                    {title} · {validOpts.length} option{validOpts.length !== 1 ? 's' : ''}
                    {cat ? ` · ${cat.label}` : ''}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: T.text3 }}>
                  {!category ? 'Pick a category to continue' : !title.trim() ? 'Add a question to continue' : 'Add at least 2 options'}
                </span>
              )}
            </div>
            <button className="pl-cancel" onClick={handleClose}
              style={{ padding: '10px 20px', borderRadius: 10, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              Cancel
            </button>
            <button className="pl-save" onClick={handleSubmit} disabled={!canSave}
              style={{ padding: '10px 24px', borderRadius: 10, background: canSave ? `linear-gradient(135deg,${accent},${accent}cc)` : 'rgba(255,255,255,0.06)', color: canSave ? '#fff' : T.text3, border: 'none', fontSize: 12, fontWeight: 800, cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s', letterSpacing: '-0.01em', boxShadow: canSave ? `0 4px 16px ${accent}35` : 'none', minWidth: 150, justifyContent: 'center' }}>
              {isLoading
                ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'pl-spin 0.7s linear infinite' }} /> Creating…</>
                : <>{cat?.emoji || '📊'} Create Poll</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
