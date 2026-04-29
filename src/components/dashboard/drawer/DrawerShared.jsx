/* Shared tokens, primitives, and mock data used across all drawer tabs */
export const C = {
  bg:     '#09090b',
  card:   '#111113',
  card2:  '#16161a',
  brd:    '#1f1f23',
  brd2:   '#2a2a30',
  t1:     '#f4f4f5',
  t2:     '#71717a',
  t3:     '#3f3f46',
  cyan:   '#4d7fff',
  cyanD:  'rgba(77,127,255,0.08)',
  cyanB:  'rgba(77,127,255,0.22)',
  red:    '#f43f5e',
  redD:   'rgba(244,63,94,0.08)',
  redB:   'rgba(244,63,94,0.22)',
  amber:  '#f59e0b',
  amberD: 'rgba(245,158,11,0.08)',
  amberB: 'rgba(245,158,11,0.22)',
  green:  '#22c55e',
  greenD: 'rgba(34,197,94,0.08)',
  greenB: 'rgba(34,197,94,0.22)',
  violet: '#a78bfa',
  violetD:'rgba(167,139,250,0.08)',
  violetB:'rgba(167,139,250,0.22)',
};
export const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

export function Card({ children, style = {}, highlight }) {
  const border = highlight === 'blue' ? C.cyanB : highlight === 'red' ? C.redB : highlight === 'amber' ? C.amberB : highlight === 'green' ? C.greenB : C.brd;
  const bg     = highlight === 'blue' ? C.cyanD : highlight === 'red' ? C.redD : highlight === 'green' ? C.greenD : C.card;
  return (
    <div style={{ borderRadius: 14, background: bg, border: `1px solid ${border}`, padding: '22px 24px', ...style }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, style = {} }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18, ...style }}>{children}</div>;
}

export function ProgressBar({ pct, color, height = 5 }) {
  return (
    <div style={{ height, background: C.brd, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .5s ease' }} />
    </div>
  );
}

export function StatPill({ label, val, col, bg, bdr }) {
  return (
    <div style={{ padding: '18px 16px', borderRadius: 13, background: bg || C.card2, border: `1px solid ${bdr || C.brd}`, textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: col, lineHeight: 1, letterSpacing: '-0.04em' }}>{val}</div>
      <div style={{ fontSize: 10, color: col, opacity: 0.65, marginTop: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

export function ChartTip({ active, payload, suffix = '', label: lbl }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111', border: `1px solid ${C.brd2}`, borderRadius: 7, padding: '5px 10px', fontSize: 11.5, color: C.t1 }}>
      {lbl && <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>{lbl}</div>}
      <span style={{ color: C.cyan, fontWeight: 700 }}>{payload[0].value}{suffix}</span>
    </div>
  );
}