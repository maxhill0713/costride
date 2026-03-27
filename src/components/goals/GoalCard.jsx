import React, { useState, useRef } from 'react';

// ─── SVG Arc Ring ─────────────────────────────────────────────────────────────
function ArcRing({ pct, size = 130, stroke = 10 }) {
  const r    = (size - stroke * 2) / 2;
  const c    = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const off  = arc * (1 - Math.min(pct, 100) / 100);

  const gradId = 'ring-grad';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Track */}
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke="rgba(34,211,238,0.1)"
        strokeWidth={stroke}
        strokeDasharray={`${arc} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(135 ${c} ${c})`}
      />

      {/* Progress */}
      {pct > 0 && (
        <circle
          cx={c} cy={c} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circ}`}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(135 ${c} ${c})`}
          style={{
            filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.45))',
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      )}

      {/* Milestone ticks */}
      {[25, 50, 75].map((p) => {
        const angle = (135 + (270 * p) / 100) * (Math.PI / 180);
        const inner = r - stroke / 2 - 1;
        const outer = r + stroke / 2 + 1;
        const reached = pct >= p;
        return (
          <line
            key={p}
            x1={c + inner * Math.cos(angle)}
            y1={c + inner * Math.sin(angle)}
            x2={c + outer * Math.cos(angle)}
            y2={c + outer * Math.sin(angle)}
            stroke={reached ? '#22d3ee' : 'rgba(34,211,238,0.18)'}
            strokeWidth={1.5}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.4s ease' }}
          />
        );
      })}
    </svg>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────
function DotMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          color: open ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
          transition: 'color 0.15s',
          padding: 0,
        }}
        aria-label="Options"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <circle cx="9" cy="3.5" r="1.5" />
          <circle cx="9" cy="9"   r="1.5" />
          <circle cx="9" cy="14.5" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute', right: 0, top: 36,
              zIndex: 20, minWidth: 148, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(22,26,50,0.98) 0%, rgba(6,8,18,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              overflow: 'hidden',
            }}
          >
            {['Edit goal', 'Set reminder', 'Delete goal'].map((item, i) => (
              <button
                key={item}
                onClick={() => setOpen(false)}
                style={{
                  width: '100%', padding: '10px 14px',
                  textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.03em',
                  color: i === 2 ? '#f87171' : 'rgba(255,255,255,0.6)',
                  borderTop: i === 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    i === 2 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Milestone bar ────────────────────────────────────────────────────────────
function MilestoneBar({ progress }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginTop: 12 }}>
      {[25, 50, 75, 100].map((m) => {
        const filled = progress >= m;
        return (
          <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div
              style={{
                width: '100%', height: 3, borderRadius: 99,
                background: filled ? '#22d3ee' : 'rgba(255,255,255,0.07)',
                boxShadow: filled ? '0 0 6px rgba(34,211,238,0.5)' : 'none',
                transition: 'background 0.5s ease, box-shadow 0.5s ease',
              }}
            />
            <span style={{
              fontSize: 8.5, fontWeight: 700,
              color: filled ? '#22d3ee' : 'rgba(255,255,255,0.15)',
              transition: 'color 0.5s ease',
            }}>
              {m}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main GoalCard ────────────────────────────────────────────────────────────
export default function GoalCard() {
  const INITIAL_VALUE = 100;
  const TARGET        = 120;
  const INCREMENT     = 5;
  const UNIT          = 'kg';

  const [current,   setCurrent]   = useState(INITIAL_VALUE);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal,   setEditVal]   = useState('');
  const inputRef = useRef(null);

  const progress = Math.min((current / TARGET) * 100, 100);

  const handleStep = (delta) => {
    setCurrent((v) => Math.max(0, Math.min(v + delta, TARGET)));
  };

  const openEdit = () => {
    setEditVal(String(current));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const saveEdit = () => {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) setCurrent(Math.min(val, TARGET));
    setIsEditing(false);
  };

  return (
    /* ── Wrapper: centres the card on the page ── */
    <div
      style={{
        minHeight: '100vh',
        background: '#060a14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily:
          "'DM Sans', 'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Card ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 24,
          background:
            'linear-gradient(160deg, rgba(26,32,58,0.80) 0%, rgba(8,10,22,0.96) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          boxShadow:
            '0 4px 40px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute', inset: '0 0 auto 0', height: 2,
            background:
              'linear-gradient(90deg, transparent 5%, #22d3ee 40%, #06b6d4 60%, transparent 95%)',
            opacity: 0.5,
          }}
        />

        <div style={{ padding: '20px 20px 0' }}>

          {/* ── Header ── */}
          <div
            style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: 8, marginBottom: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 19, fontWeight: 800, letterSpacing: -0.5,
                  color: '#fff', lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                Squat 120kg
              </h2>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {/* LIFT TARGET — blue tint */}
                <span
                  style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                    textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999,
                    background: 'rgba(34,211,238,0.10)',
                    color: '#22d3ee',
                    border: '1px solid rgba(34,211,238,0.22)',
                  }}
                >
                  Lift Target
                </span>

                {/* SQUAT — neutral grey */}
                <span
                  style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                    textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.40)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {/* dumbbell icon */}
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12"/>
                  </svg>
                  Squat
                </span>
              </div>
            </div>

            <DotMenu />
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.055)', margin: '0 -20px' }} />

          {/* ── Progress section ── */}
          <div
            style={{
              display: 'flex', alignItems: 'center',
              gap: 18, padding: '20px 0 18px',
            }}
          >
            {/* Ring + center text */}
            <div
              style={{
                position: 'relative', width: 130, height: 130,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ArcRing pct={progress} size={130} stroke={9} />

              {/* Center label */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 17, fontWeight: 800,
                    color: '#fff', letterSpacing: -0.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {current} / {TARGET}
                </span>
                <span
                  style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#22d3ee',
                    marginTop: 3,
                  }}
                >
                  {UNIT}
                </span>
                <span
                  style={{
                    fontSize: 8.5, fontWeight: 600,
                    letterSpacing: '0.09em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)',
                    marginTop: 4,
                  }}
                >
                  of target
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: '0 0 3px',
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.09em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                Progress
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: 30, fontWeight: 800,
                  color: '#fff', letterSpacing: -1, lineHeight: 1,
                }}
              >
                {Math.round(progress)}
                <sup style={{ fontSize: 14, fontWeight: 700, opacity: 0.5, verticalAlign: 'super' }}>
                  %
                </sup>
              </p>

              <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 600, color: '#22d3ee', opacity: 0.7 }}>
                {TARGET - current > 0
                  ? `${TARGET - current}${UNIT} remaining`
                  : 'Target reached!'}
              </p>

              <MilestoneBar progress={progress} />
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.055)', margin: '0 -20px' }} />

          {/* ── Controls ── */}
          <div style={{ padding: '16px 0 20px' }}>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.09em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.28)',
              }}
            >
              Update Progress
            </p>

            {isEditing ? (
              /* Edit mode */
              <div
                style={{
                  display: 'flex', alignItems: 'center',
                  borderRadius: 14, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(34,211,238,0.30)',
                }}
              >
                <input
                  ref={inputRef}
                  type="number"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  style={{
                    flex: 1, height: 46, padding: '0 14px',
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#fff', fontSize: 16, fontWeight: 700,
                  }}
                  placeholder="Enter value…"
                />
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    width: 36, height: 46,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                  </svg>
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    height: 46, padding: '0 18px',
                    background: '#22d3ee', border: 'none', cursor: 'pointer',
                    color: '#061820', fontSize: 13, fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 5,
                    letterSpacing: '0.02em',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1.5,6 4.5,9 10.5,3"/>
                  </svg>
                  Save
                </button>
              </div>
            ) : (
              /* Normal mode: minus | value box | +5kg */
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                {/* Minus button — visible, high-contrast */}
                <button
                  onClick={() => handleStep(-INCREMENT)}
                  disabled={current <= 0}
                  style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: 'rgba(255,255,255,0.11)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: current <= 0 ? 'not-allowed' : 'pointer',
                    opacity: current <= 0 ? 0.35 : 1,
                    transition: 'opacity 0.15s, background 0.15s',
                    color: 'rgba(255,255,255,0.80)',
                  }}
                  onMouseEnter={(e) => {
                    if (current > 0)
                      e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.11)';
                  }}
                  aria-label={`Decrease by ${INCREMENT}`}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="2.5" y1="7.5" x2="12.5" y2="7.5"/>
                  </svg>
                </button>

                {/* Central value box */}
                <button
                  onClick={openEdit}
                  style={{
                    flex: 1, height: 46, borderRadius: 13,
                    background: 'rgba(34,211,238,0.07)',
                    border: '1px solid rgba(34,211,238,0.16)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(34,211,238,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(34,211,238,0.07)';
                  }}
                  aria-label="Edit current value"
                >
                  <span
                    style={{
                      fontSize: 18, fontWeight: 800,
                      color: '#fff', letterSpacing: -0.3,
                    }}
                  >
                    {current}
                  </span>
                  <span
                    style={{
                      fontSize: 12, fontWeight: 700,
                      color: '#22d3ee', opacity: 0.65,
                    }}
                  >
                    {UNIT}
                  </span>
                  {/* Edit pencil */}
                  <svg
                    width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="rgba(34,211,238,0.35)"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>

                {/* +5 kg primary button */}
                <button
                  onClick={() => handleStep(+INCREMENT)}
                  disabled={current >= TARGET}
                  style={{
                    height: 46, padding: '0 17px', borderRadius: 13, flexShrink: 0,
                    background: current >= TARGET
                      ? 'rgba(34,211,238,0.25)'
                      : 'linear-gradient(160deg, #22d3ee 0%, #0891b2 100%)',
                    border: 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                    cursor: current >= TARGET ? 'not-allowed' : 'pointer',
                    color: '#061820',
                    fontSize: 13.5, fontWeight: 800,
                    letterSpacing: '0.01em',
                    boxShadow: current >= TARGET
                      ? 'none'
                      : '0 3px 0 rgba(6,117,158,0.55), 0 5px 18px rgba(34,211,238,0.22)',
                    transition: 'box-shadow 0.15s, transform 0.1s, opacity 0.15s',
                    opacity: current >= TARGET ? 0.45 : 1,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (current < TARGET)
                      e.currentTarget.style.boxShadow =
                        '0 3px 0 rgba(6,117,158,0.7), 0 7px 24px rgba(34,211,238,0.32)';
                  }}
                  onMouseLeave={(e) => {
                    if (current < TARGET)
                      e.currentTarget.style.boxShadow =
                        '0 3px 0 rgba(6,117,158,0.55), 0 5px 18px rgba(34,211,238,0.22)';
                  }}
                  onMouseDown={(e) => {
                    if (current < TARGET) e.currentTarget.style.transform = 'translateY(2px) scale(0.97)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  }}
                  aria-label={`Add ${INCREMENT} ${UNIT}`}
                >
                  <svg
                    width="13" height="13" viewBox="0 0 13 13"
                    fill="none" stroke="currentColor"
                    strokeWidth="2.8" strokeLinecap="round"
                  >
                    <line x1="6.5" y1="1.5" x2="6.5" y2="11.5"/>
                    <line x1="1.5" y1="6.5" x2="11.5" y2="6.5"/>
                  </svg>
                  +{INCREMENT} {UNIT}
                </button>
              </div>
            )}

            {/* Complete CTA when at 100% */}
            {progress >= 100 && (
              <div
                style={{
                  marginTop: 10,
                  height: 44, borderRadius: 13,
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  color: '#fff', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #14532d, 0 5px 18px rgba(34,197,94,0.18)',
                  letterSpacing: '0.02em',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Mark as Complete
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
