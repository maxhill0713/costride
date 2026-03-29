import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, Phone, Calendar, Dumbbell, TrendingUp, TrendingDown,
  Minus, Activity, AlertTriangle, Zap, Star,
  CreditCard, Target, Clock, MessageCircle, User, UserPlus,
  ChevronRight, Bell, Edit3, Send, CheckCircle, Plus, Trash2,
  ShieldAlert, ChevronDown,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ─────────────────────────────────────────────────────────────────
   RESPONSIVE CSS
───────────────────────────────────────────────────────────────── */
const MOBILE_CSS = `
  .tc-root { display: grid; grid-template-columns: minmax(0,1fr) clamp(256px,24%,290px); gap: 16px; }
  .tc-left  { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0; }
  .tc-tabs  { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 14px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0; }
  .tc-tabs::-webkit-scrollbar { display: none; }
  .tc-tab-btn { padding: 8px 16px; font-size: 12px; font-family: inherit; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
  .tc-feed  { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
  .tc-feed::-webkit-scrollbar { width: 4px; }
  .tc-feed::-webkit-scrollbar-track { background: transparent; }
  .tc-feed::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  .tc-feed::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
  .tc-sidebar { display: flex; flex-direction: column; gap: 10px; min-width: 256px; overflow-y: auto; max-height: 100%; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
  .tc-sidebar::-webkit-scrollbar { width: 4px; }
  .tc-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  @media (max-width: 900px) {
    .tc-root    { grid-template-columns: 1fr !important; }
    .tc-left    { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tc-feed    { overflow: visible !important; min-height: unset !important; flex: unset !important; }
    .tc-sidebar { height: auto !important; overflow: visible !important; min-width: unset !important; max-height: unset !important; }
    .tc-tab-btn { padding: 7px 12px !important; font-size: 11px !important; }
  }
`;

/* ══════════════════════════════════════════════════════════════════
   DESIGN PRIMITIVES — mirrored from TabContent
══════════════════════════════════════════════════════════════════ */
function Card({ children, style = {}, highlight = false }) {
  return (
    <div style={{
      background:   C.surface,
      border:       `1px solid ${highlight ? `${C.accent}50` : C.border}`,
      borderRadius: CARD_RADIUS,
      boxShadow:    highlight ? `0 0 0 1px ${C.accent}18, ${CARD_SHADOW}` : CARD_SHADOW,
      overflow:     'hidden',
      position:     'relative',
      flexShrink:   0,
      transition:   'border-color 0.15s, box-shadow 0.15s',
      ...style,
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg,${C.accent}70 0%,${C.accent}18 55%,transparent 100%)`,
          pointerEvents: 'none', zIndex: 1,
        }} />
      )}
      {children}
    </div>
  );
}

function CardBody({ children, style = {}, ...rest }) {
  return <div style={{ padding: 16, ...style }} {...rest}>{children}</div>;
}

function Pill({ label, muted = false }) {
  const color = muted ? C.t3 : C.accent;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color,
      background: `${color}12`, border: `1px solid ${color}24`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>{label}</span>
  );
}

function UrgencyPill({ label, urgent }) {
  const color = urgent ? C.warn : C.t3;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color,
      background: `${color}10`, border: `1px solid ${color}20`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>{label}</span>
  );
}

function DangerPill({ label }) {
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color: C.danger,
      background: `${C.danger}10`, border: `1px solid ${C.danger}22`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>{label}</span>
  );
}

function Chip({ val, label, color }) {
  const c = color || C.accent;
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      background: `${c}10`, border: `1px solid ${c}20`, color: C.t2,
    }}>
      <span style={{ color: c }}>{val}</span> {label}
    </div>
  );
}

function IconBadge({ icon: Icon, size = 26, tint }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 7,
      background: C.surfaceEl, border: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon style={{ width: size * 0.46, height: size * 0.46, color: tint || C.accent }} />
    </div>
  );
}

function StatNudge({ positive = true, icon: Icon, stat, detail, action, onAction }) {
  const color = positive ? C.success : C.warn;
  return (
    <div style={{
      marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '9px 11px', borderRadius: 8,
      background: C.surfaceEl, border: `1px solid ${C.border}`,
      borderLeft: `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {stat && <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{stat} </span>}
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={e => { e.stopPropagation(); onAction(); }} style={{
          flexShrink: 0, fontSize: 10, fontWeight: 600, color: C.accent,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 2, padding: 0,
        }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

function SideCard({ children, style = {} }) {
  return (
    <div style={{
      padding: 16, borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.border}`,
      boxShadow: CARD_SHADOW, flexShrink: 0, ...style,
    }}>{children}</div>
  );
}

function SideLabel({ children }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, color: C.t3,
      textTransform: 'uppercase', letterSpacing: '.13em',
    }}>{children}</span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SPARKLINE
══════════════════════════════════════════════════════════════════ */
function Sparkline({ data = [], color, width = 68, height = 24 }) {
  const id = useRef(`sp-${Math.random().toString(36).slice(2)}`);
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
  const px = 2, py = 3;
  const pts = data.map((v, i) => [
    px + (i / (data.length - 1)) * (width - px * 2),
    py + (1 - (v - min) / rng) * (height - py * 2),
  ]);
  const poly = pts.map(p => p.join(',')).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  const c = color || C.accent;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id.current} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={c} stopOpacity="0.2" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${px},${height} ${poly} ${width - px},${height}`} fill={`url(#${id.current})`} />
      <polyline points={poly} stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.2" fill={c} />
    </svg>
  );
}

/* ── Color helpers ───────────────────────────────────────────────── */
function retentionColor(score) {
  if (score >= 80) return C.success;
  if (score >= 60) return C.t1;
  if (score >= 40) return C.warn;
  return C.danger;
}
function retentionMeta(score) {
  if (score >= 80) return { label: 'Healthy',         color: C.success };
  if (score >= 60) return { label: 'Stable',          color: C.t1     };
  if (score >= 40) return { label: 'Needs Attention', color: C.warn   };
  return                  { label: 'At Risk',         color: C.danger  };
}
function scoreTrend(history) {
  if (!history || history.length < 4) return { dir: 'flat', delta: 0 };
  const delta = history[history.length - 1] - history[history.length - 4];
  if (delta > 4)  return { dir: 'up',   delta };
  if (delta < -4) return { dir: 'down', delta };
  return               { dir: 'flat', delta: 0 };
}

/* ── Injury severity colours ─────────────────────────────────────── */
const SEVERITY_STYLE = {
  Active:  { color: C.danger,  bg: `${C.danger}10`,  border: `${C.danger}22`  },
  Monitor: { color: C.warn,    bg: `${C.warn}10`,    border: `${C.warn}22`    },
  Mild:    { color: C.accent,  bg: `${C.accent}10`,  border: `${C.accent}22`  },
  Cleared: { color: C.success, bg: `${C.success}10`, border: `${C.success}22` },
};

function SeverityBadge({ level }) {
  const s = SEVERITY_STYLE[level] || SEVERITY_STYLE.Mild;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap',
    }}>{level}</span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════════ */
const CLIENTS = [
  {
    id: 1, name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '+44 7911 123 456',
    tier: 'Premium', status: 'active', goal: 'Weight Loss',
    retentionScore: 88, retentionHistory: [68, 72, 74, 78, 80, 83, 86, 88],
    sessionsThisMonth: 9, sessionsLastMonth: 7,
    lastVisit: 1, streak: 14, consecutiveMissed: 0,
    joinDate: 'Sep 2023', membership: 'Unlimited Monthly', monthlySpend: 149,
    tags: ['HIIT', 'Yoga'],
    notes: 'Responds exceptionally well to HIIT circuits. Prefers early morning slots and positive reinforcement over critique. Strong candidate for a challenge feature testimonial.',
    nextSession: 'Tomorrow, 7:00 AM',
    upcomingClasses: ['HIIT Thursday', 'Yoga Sunday'],
    injuries: [
      { id: 1, area: 'Left Knee', severity: 'Monitor', note: 'Post-ACL sensitivity. Avoid high-impact lunges and deep single-leg squats.', logged: 'Mar 2024' },
    ],
  },
  {
    id: 2, name: 'James Chen', email: 'j.chen@example.com', phone: '+44 7700 234 567',
    tier: 'Standard', status: 'active', goal: 'Muscle Gain',
    retentionScore: 73, retentionHistory: [78, 77, 76, 75, 74, 74, 73, 73],
    sessionsThisMonth: 5, sessionsLastMonth: 7,
    lastVisit: 4, streak: 2, consecutiveMissed: 0,
    joinDate: 'Feb 2024', membership: '3× Week', monthlySpend: 89,
    tags: ['Strength', 'CrossFit'],
    notes: 'Highly competitive — responds extremely well to performance benchmarks. Interested in adding nutrition coaching. Missed 2 sessions this month without notice.',
    nextSession: 'Friday, 6:30 PM',
    upcomingClasses: ['Strength Friday'],
    injuries: [],
  },
  {
    id: 3, name: 'Olivia Hartley', email: 'olivia.h@example.com', phone: '+44 7733 345 678',
    tier: 'Premium', status: 'at_risk', goal: 'Stress Relief',
    retentionScore: 38, retentionHistory: [82, 79, 70, 61, 53, 46, 41, 38],
    sessionsThisMonth: 1, sessionsLastMonth: 5,
    lastVisit: 18, streak: 0, consecutiveMissed: 3,
    joinDate: 'Jan 2023', membership: 'Unlimited Monthly', monthlySpend: 149,
    tags: ['Yoga', 'Pilates'],
    notes: 'Was one of the most consistent members. Significant engagement drop over the last 6 weeks. Mentioned work stress in her last session. A warm, personal check-in is strongly recommended.',
    nextSession: null, upcomingClasses: [],
    injuries: [
      { id: 1, area: 'Right Shoulder', severity: 'Mild', note: 'Mild impingement flagged by physio. Avoid overhead pressing until cleared.', logged: 'Jan 2024' },
    ],
  },
  {
    id: 4, name: 'Marcus Williams', email: 'marcus.w@example.com', phone: '+44 7808 456 789',
    tier: 'Elite', status: 'active', goal: 'Athletic Performance',
    retentionScore: 96, retentionHistory: [88, 89, 91, 92, 93, 94, 95, 96],
    sessionsThisMonth: 12, sessionsLastMonth: 11,
    lastVisit: 0, streak: 28, consecutiveMissed: 0,
    joinDate: 'Mar 2022', membership: 'Unlimited + PT', monthlySpend: 299,
    tags: ['Strength', 'HIIT', 'Boxing'],
    notes: 'Star client. Exceptional discipline — never misses a session. Ask about marathon prep plans in Q3. Great brand ambassador candidate.',
    nextSession: 'Today, 5:30 PM',
    upcomingClasses: ['Boxing Today', 'HIIT Wednesday', 'Strength Friday'],
    injuries: [],
  },
  {
    id: 5, name: 'Priya Sharma', email: 'p.sharma@example.com', phone: '+44 7912 567 890',
    tier: 'Standard', status: 'paused', goal: 'General Fitness',
    retentionScore: 54, retentionHistory: [65, 63, 60, 57, 54, 51, 53, 54],
    sessionsThisMonth: 2, sessionsLastMonth: 4,
    lastVisit: 9, streak: 1, consecutiveMissed: 2,
    joinDate: 'Nov 2023', membership: 'Pay As You Go', monthlySpend: 55,
    tags: ['Cardio', 'Pilates'],
    notes: 'Membership paused due to travel — returns mid-month. Send a personalised welcome-back message. Responds well to class recommendations and milestone tracking.',
    nextSession: 'Returns 15th', upcomingClasses: [],
    injuries: [
      { id: 1, area: 'Lower Back', severity: 'Monitor', note: 'Recurring tightness after long flights. Prioritise mobility work on return.', logged: 'Feb 2024' },
    ],
  },
  {
    id: 6, name: 'Tom Gallagher', email: 't.gallagher@example.com', phone: '+44 7765 678 901',
    tier: 'Standard', status: 'active', goal: 'Weight Loss',
    retentionScore: 67, retentionHistory: [55, 57, 60, 62, 64, 65, 66, 67],
    sessionsThisMonth: 4, sessionsLastMonth: 3,
    lastVisit: 3, streak: 3, consecutiveMissed: 0,
    joinDate: 'Apr 2024', membership: '2× Week', monthlySpend: 69,
    tags: ['Cardio', 'Functional'],
    notes: 'Newer member with solid upward progress. Consider suggesting a trial upgrade to 3× per week next month. Enjoys friendly competition and benchmarks.',
    nextSession: 'Wednesday, 12:00 PM',
    upcomingClasses: ['Functional Wednesday'],
    injuries: [],
  },
  {
    id: 7, name: 'Aisha Okonkwo', email: 'a.okonkwo@example.com', phone: '+44 7890 789 012',
    tier: 'Elite', status: 'active', goal: 'Endurance & Toning',
    retentionScore: 91, retentionHistory: [84, 85, 87, 88, 89, 90, 90, 91],
    sessionsThisMonth: 10, sessionsLastMonth: 10,
    lastVisit: 1, streak: 21, consecutiveMissed: 0,
    joinDate: 'Jul 2022', membership: 'Unlimited + PT', monthlySpend: 299,
    tags: ['Spin', 'Yoga', 'Pilates'],
    notes: 'Always asks thoughtful questions about form and technique. Excellent candidate for the upcoming 8-week challenge. Has referred two friends this quarter.',
    nextSession: 'Tomorrow, 9:30 AM',
    upcomingClasses: ['Spin Tuesday', 'Yoga Thursday', 'Pilates Saturday'],
    injuries: [
      { id: 1, area: 'Left Hip Flexor', severity: 'Cleared', note: 'Fully recovered from tightness reported in December. No restrictions.', logged: 'Dec 2023' },
    ],
  },
  {
    id: 8, name: 'Daniel Foster', email: 'd.foster@example.com', phone: '+44 7700 890 123',
    tier: 'Standard', status: 'at_risk', goal: 'Strength Building',
    retentionScore: 27, retentionHistory: [74, 66, 57, 47, 39, 34, 30, 27],
    sessionsThisMonth: 0, sessionsLastMonth: 3,
    lastVisit: 31, streak: 0, consecutiveMissed: 5,
    joinDate: 'Aug 2023', membership: '3× Week', monthlySpend: 89,
    tags: ['Strength'],
    notes: 'Has not attended in over a month. Last two messages went unanswered. Risk of churn is very high. Consider a personal phone call.',
    nextSession: null, upcomingClasses: [],
    injuries: [
      { id: 1, area: 'Right Wrist',   severity: 'Active',  note: 'Sprain from October. Barbell pressing is restricted until physio clearance.', logged: 'Oct 2023' },
      { id: 2, area: 'Left Shoulder', severity: 'Monitor', note: 'General instability. Recommend band work before loading overhead movements.', logged: 'Jan 2024' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════
   SEND BUTTON
══════════════════════════════════════════════════════════════════ */
function SendBtn({ onClick, disabled, sending, sent, label }) {
  return (
    <button onClick={onClick} disabled={disabled || sending || sent} style={{
      width: '100%', padding: '8px 14px', borderRadius: 8,
      background: sent ? `${C.success}14` : disabled ? C.surfaceEl : C.accent,
      border: `1px solid ${sent ? `${C.success}30` : disabled ? C.border : `${C.accent}60`}`,
      color: sent ? C.success : disabled ? C.t3 : '#fff',
      fontSize: 11, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 6, transition: 'all 0.18s',
    }}>
      {sent ? <><CheckCircle style={{ width: 11, height: 11 }} /> Sent</>
       : sending ? 'Sending…'
       : <><Send style={{ width: 11, height: 11 }} /> {label}</>}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   INLINE DROP PANEL — opens inside the card
══════════════════════════════════════════════════════════════════ */
const DROP_TABS = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'notes',     label: 'Notes'     },
  { id: 'injuries',  label: 'Injuries'  },
  { id: 'schedule',  label: 'Schedule'  },
  { id: 'actions',   label: 'Actions'   },
];

const PRESETS = [
  { id: 'checkin',  label: 'Check-in',       text: fn => `Hey ${fn} 👋 Just checking in — how are things going? Would love to see you back this week.` },
  { id: 'missed',   label: 'Missed sessions', text: fn => `Hi ${fn}, we noticed you haven't been in for a bit. Just checking everything's okay — we're here if you need anything.` },
  { id: 'congrats', label: 'Celebrate',       text: fn => `${fn} — you've been absolutely crushing it lately! Your consistency is seriously impressive. Keep it up 💪` },
  { id: 'upgrade',  label: 'Upgrade offer',   text: fn => `Hey ${fn}, given how consistent you've been, I think you'd get a lot from stepping up your plan. Let me know if you'd like to chat options.` },
  { id: 'welcome',  label: 'Welcome back',    text: fn => `Hi ${fn}, great to have you back! We've got some exciting sessions lined up — let's pick up right where you left off.` },
];

function InlineDropPanel({ client, onClose, openModal }) {
  const [tab,        setTab]       = useState('overview');
  const [noteVal,    setNoteVal]   = useState(client.notes);
  const [noteSaved,  setNoteSaved] = useState(false);
  const [custom,     setCustom]    = useState('');
  const [preset,     setPreset]    = useState(null);
  const [sending,    setSending]   = useState(false);
  const [sent,       setSent]      = useState(false);
  const [injuries,   setInjuries]  = useState(client.injuries || []);
  const [addInj,     setAddInj]    = useState(false);
  const [injForm,    setInjForm]   = useState({ area: '', severity: 'Monitor', note: '' });

  const firstName      = client.name.split(' ')[0];
  const isRisk         = client.status === 'at_risk';
  const isPaused       = client.status === 'paused';
  const accentColor    = isRisk ? C.danger : C.accent;
  const activeInjuries = injuries.filter(i => i.severity !== 'Cleared');
  const injBadgeColor  = activeInjuries.some(i => i.severity === 'Active') ? C.danger : C.warn;

  const message = preset
    ? (PRESETS.find(p => p.id === preset)?.text(firstName) || '')
    : custom;

  function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 900);
    setTimeout(() => { setSent(false); setCustom(''); setPreset(null); }, 2800);
  }

  function saveNote() {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  function addInjury() {
    if (!injForm.area.trim()) return;
    const logged = new Date().toLocaleString('en-GB', { month: 'short', year: 'numeric' });
    setInjuries(p => [...p, { id: Date.now(), ...injForm, logged }]);
    setInjForm({ area: '', severity: 'Monitor', note: '' });
    setAddInj(false);
  }

  useEffect(() => { setAddInj(false); setPreset(null); }, [tab]);
  useEffect(() => { setNoteVal(client.notes); setTab('overview'); }, [client.id]);

  const score      = client.retentionScore;
  const sColor     = retentionColor(score);
  const rmeta      = retentionMeta(score);
  const trend      = scoreTrend(client.retentionHistory);
  const delta      = client.sessionsThisMonth - client.sessionsLastMonth;
  const TrendIc    = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;
  const trendColor = trend.dir === 'up' ? C.success : trend.dir === 'down' ? C.danger : C.t3;

  return (
    <div style={{
      background:   C.surfaceEl,
      borderTop:    `1px solid ${accentColor}28`,
      borderLeft:   `3px solid ${accentColor}`,
    }}>

      {/* ── Drop Header — mirrors the push notification snippet ── */}
      <div style={{
        padding:        '12px 16px',
        background:     `${accentColor}05`,
        borderBottom:   `1px solid ${C.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={client.name} size={22} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{client.name}</div>
            <div style={{ fontSize: 10, color: C.t3 }}>{client.membership} · Since {client.joinDate}</div>
          </div>
          <div style={{ display: 'flex', gap: 5, marginLeft: 4 }}>
            <Pill label={client.tier} />
            {isRisk   && <DangerPill label="At Risk" />}
            {isPaused && <UrgencyPill label="Paused" urgent={false} />}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          style={{
            width: 24, height: 24, borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: `1px solid ${C.border}`, cursor: 'pointer',
          }}>
          <X style={{ width: 10, height: 10, color: C.t3 }} />
        </button>
      </div>

      {/* ── Inner Tab Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', background: C.surface,
        borderBottom: `1px solid ${C.border}`, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {DROP_TABS.map(t => {
          const isActive   = tab === t.id;
          const isInjTab   = t.id === 'injuries';
          const badge      = isInjTab ? activeInjuries.length : 0;
          return (
            <button
              key={t.id}
              onClick={e => { e.stopPropagation(); setTab(t.id); }}
              style={{
                padding:      '9px 14px',
                fontSize:     11, fontFamily: 'inherit',
                background:   'none', border: 'none',
                borderBottom: `2px solid ${isActive ? accentColor : 'transparent'}`,
                cursor:       'pointer', transition: 'all 0.15s',
                whiteSpace:   'nowrap', flexShrink: 0, marginBottom: -1,
                fontWeight:   isActive ? 700 : 500,
                color:        isActive ? accentColor : C.t3,
                display:      'flex', alignItems: 'center', gap: 5,
              }}>
              {t.label}
              {badge > 0 && (
                <span style={{
                  fontSize: 8.5, fontWeight: 800,
                  background: `${injBadgeColor}15`, color: injBadgeColor,
                  border: `1px solid ${injBadgeColor}28`,
                  padding: '0 5px', borderRadius: 99,
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div onClick={e => e.stopPropagation()} style={{ padding: '14px 16px 16px' }}>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div>
            {/* Retention hero */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 12px', borderRadius: 9, marginBottom: 12,
              background: `${sColor}08`, border: `1px solid ${sColor}1e`,
            }}>
              <div style={{ textAlign: 'center', minWidth: 50 }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: sColor, lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</div>
                <div style={{ fontSize: 8, color: sColor, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{rmeta.label}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                  <TrendIc style={{ width: 10, height: 10, color: trendColor }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: trendColor }}>
                    {trend.dir === 'up' ? `+${trend.delta} pts — Improving`
                     : trend.dir === 'down' ? `${trend.delta} pts — Declining`
                     : 'Stable — holding steady'}
                  </span>
                </div>
                <Sparkline data={client.retentionHistory} color={sColor} width={160} height={28} />
              </div>
            </div>

            {/* Chip row */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <Chip val={client.sessionsThisMonth} label="sessions"
                color={delta > 0 ? C.success : delta < 0 ? C.danger : C.accent} />
              <Chip val={`£${client.monthlySpend}`} label="/mo" />
              <Chip val={client.streak > 0 ? `${client.streak}d` : '—'} label="streak"
                color={client.streak >= 14 ? C.success : C.accent} />
              {activeInjuries.length > 0 && (
                <Chip val={activeInjuries.length} label={activeInjuries.length === 1 ? 'restriction' : 'restrictions'}
                  color={injBadgeColor} />
              )}
            </div>

            {/* Smart nudge */}
            {isRisk && (
              <StatNudge positive={false} icon={AlertTriangle}
                stat="High churn risk."
                detail={`Last visit ${client.lastVisit} days ago. A personal call beats any automated message here.`}
                action="Go to Actions" onAction={() => setTab('actions')} />
            )}
            {client.streak >= 21 && (
              <StatNudge positive icon={Zap}
                stat={`${client.streak}-day streak.`}
                detail="Acknowledge this milestone — recognition is the highest-retention action you can take."
                action="Send message" onAction={() => setTab('actions')} />
            )}
            {client.consecutiveMissed >= 3 && !isRisk && (
              <StatNudge positive={false} icon={Bell}
                stat={`${client.consecutiveMissed} consecutive sessions missed.`}
                detail="A warm check-in now keeps the door open."
                action="Message" onAction={() => setTab('actions')} />
            )}
            {!isRisk && client.consecutiveMissed < 3 && client.streak < 21 && (
              <div style={{
                marginTop: 8, padding: '8px 10px', borderRadius: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                borderLeft: `2px solid ${C.success}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle style={{ width: 11, height: 11, color: C.success, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.t3 }}>Tracking well — no action needed right now.</span>
              </div>
            )}
          </div>
        )}

        {/* ═══ NOTES ═══ */}
        {tab === 'notes' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Coach Notes — Private
            </div>
            <textarea
              value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              rows={6}
              placeholder={`Add coaching notes for ${firstName}…`}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '10px 12px',
                fontSize: 11, color: C.t1, resize: 'vertical',
                outline: 'none', fontFamily: 'inherit', lineHeight: 1.65,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = `${accentColor}50`}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
            <button onClick={saveNote} style={{
              marginTop: 8, display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 8,
              background: noteSaved ? `${C.success}12` : `${C.accent}10`,
              border: `1px solid ${noteSaved ? `${C.success}30` : `${C.accent}28`}`,
              color: noteSaved ? C.success : C.accent,
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.18s',
            }}>
              {noteSaved ? <><CheckCircle style={{ width: 10, height: 10 }} /> Saved</> : <><Edit3 style={{ width: 10, height: 10 }} /> Save Notes</>}
            </button>

            {/* Quick reference */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Quick Reference</div>
              {[
                { label: 'Membership', value: client.membership          },
                { label: 'Since',      value: client.joinDate            },
                { label: 'Goal',       value: client.goal                },
                { label: 'Classes',    value: client.tags.join(', ') || '—' },
                { label: 'Email',      value: client.email               },
                { label: 'Phone',      value: client.phone               },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <span style={{ fontSize: 10, color: C.t3 }}>{r.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.t1 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ INJURIES ═══ */}
        {tab === 'injuries' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Injury & Limitation Log</div>
                {activeInjuries.length > 0 && (
                  <div style={{ fontSize: 10, color: injBadgeColor, fontWeight: 600, marginTop: 2 }}>
                    {activeInjuries.length} active {activeInjuries.length === 1 ? 'restriction' : 'restrictions'}
                  </div>
                )}
              </div>
              <button onClick={() => setAddInj(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7,
                background: `${C.accent}10`, border: `1px solid ${C.accent}24`,
                color: C.accent, fontSize: 9.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Plus style={{ width: 9, height: 9 }} /> Log Injury
              </button>
            </div>

            {/* Add form */}
            {addInj && (
              <div style={{ padding: 12, borderRadius: 9, marginBottom: 12, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accent}` }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
                  <input
                    value={injForm.area}
                    onChange={e => setInjForm(f => ({ ...f, area: e.target.value }))}
                    placeholder="Body area (e.g. Left Knee)"
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: 7,
                      background: C.surfaceEl, border: `1px solid ${C.border}`,
                      color: C.t1, fontSize: 11, outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => e.target.style.borderColor = `${C.accent}50`}
                    onBlur={e  => e.target.style.borderColor = C.border}
                  />
                  <select
                    value={injForm.severity}
                    onChange={e => setInjForm(f => ({ ...f, severity: e.target.value }))}
                    style={{
                      padding: '7px 10px', borderRadius: 7,
                      background: C.surfaceEl, border: `1px solid ${C.border}`,
                      color: C.t1, fontSize: 11, outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                    {['Active', 'Monitor', 'Mild', 'Cleared'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <textarea
                  value={injForm.note}
                  onChange={e => setInjForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Describe the limitation or restriction…"
                  rows={2}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, marginBottom: 8,
                    background: C.surfaceEl, border: `1px solid ${C.border}`,
                    color: C.t1, fontSize: 11, resize: 'none', outline: 'none',
                    fontFamily: 'inherit', lineHeight: 1.6,
                  }}
                  onFocus={e => e.target.style.borderColor = `${C.accent}50`}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={addInjury} style={{ flex: 1, padding: '6px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700, background: C.accent, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Save Entry
                  </button>
                  <button onClick={() => setAddInj(false)} style={{ padding: '6px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700, background: 'transparent', border: `1px solid ${C.border}`, color: C.t3, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Injury entries */}
            {injuries.length === 0 ? (
              <div style={{ padding: '22px 16px', textAlign: 'center', borderRadius: 9, background: C.surface, border: `1px solid ${C.border}` }}>
                <ShieldAlert style={{ width: 18, height: 18, color: C.t3, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: C.t2, fontWeight: 600, margin: '0 0 3px' }}>No injuries logged</p>
                <p style={{ fontSize: 10, color: C.t3, margin: 0 }}>{firstName} has no active restrictions on file.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {injuries.map(inj => (
                  <div key={inj.id} style={{
                    padding: '10px 12px', borderRadius: 9,
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderLeft: `2px solid ${SEVERITY_STYLE[inj.severity]?.color || C.accent}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, flex: 1 }}>{inj.area}</span>
                      <SeverityBadge level={inj.severity} />
                      <button onClick={() => setInjuries(p => p.filter(i => i.id !== inj.id))} style={{ width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = C.danger}
                        onMouseLeave={e => e.currentTarget.style.color = C.t3}>
                        <Trash2 style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                    {inj.note && <p style={{ fontSize: 11, color: C.t2, margin: '0 0 5px', lineHeight: 1.55 }}>{inj.note}</p>}
                    <span style={{ fontSize: 9.5, color: C.t3 }}>Logged {inj.logged}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SCHEDULE ═══ */}
        {tab === 'schedule' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Sessions & Classes
            </div>
            {client.nextSession ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 9, marginBottom: 10, background: `${C.accent}08`, border: `1px solid ${C.accent}1e` }}>
                <Calendar style={{ width: 13, height: 13, color: C.accent, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.t2 }}>Next session</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{client.nextSession}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', borderRadius: 9, marginBottom: 10, background: C.surface, border: `1px solid ${C.border}`, borderLeft: isPaused ? `2px solid ${C.warn}` : `2px solid ${C.t3}` }}>
                <p style={{ fontSize: 11, color: C.t2, margin: 0, fontWeight: 600 }}>
                  {isPaused ? `${firstName}'s membership is paused.` : 'No upcoming sessions booked.'}
                </p>
              </div>
            )}

            {client.upcomingClasses?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                {client.upcomingClasses.map((cls, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11, color: C.t1, fontWeight: 500 }}>{cls}</span>
                    <Pill label="Booked" muted />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 12 }}>
              {[
                { label: 'This Month', value: client.sessionsThisMonth, color: C.t1 },
                { label: 'Last Month', value: client.sessionsLastMonth, color: C.t2 },
                { label: 'Change',     value: `${delta >= 0 ? '+' : ''}${delta}`,   color: delta >= 0 ? C.success : C.danger },
              ].map((s, i) => (
                <div key={i} style={{ padding: '9px 10px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 8.5, color: C.t3, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => openModal?.('bookIntoClass', { memberId: client.id })} style={{
              width: '100%', padding: '8px 14px', borderRadius: 8,
              background: `${C.accent}10`, border: `1px solid ${C.accent}28`,
              color: C.accent, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Calendar style={{ width: 11, height: 11 }} /> Book into a Class
            </button>
          </div>
        )}

        {/* ═══ ACTIONS ═══ */}
        {tab === 'actions' && (
          <div>
            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { icon: Phone,    label: 'Call',    color: C.success, fn: () => {} },
                { icon: Calendar, label: 'Book',    color: C.accent,  fn: () => openModal?.('bookIntoClass', { memberId: client.id }) },
                { icon: Dumbbell, label: 'Workout', color: C.warn,    fn: () => openModal?.('assignWorkout', { memberId: client.id }) },
              ].map(({ icon: Icon, label, color, fn }, i) => (
                <button key={i} onClick={fn} style={{
                  flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '8px 10px', borderRadius: 8,
                  background: `${color}0d`, border: `1px solid ${color}22`,
                  color, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.13s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
                  onMouseLeave={e => e.currentTarget.style.background = `${color}0d`}>
                  <Icon style={{ width: 11, height: 11 }} /> {label}
                </button>
              ))}
            </div>

            {/* Message composer */}
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Send Push Message to {firstName}
            </div>

            {/* Preset chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => setPreset(prev => prev === p.id ? null : p.id)} style={{
                  padding: '4px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  background: preset === p.id ? `${C.accent}14` : C.surface,
                  border: `1px solid ${preset === p.id ? `${C.accent}40` : C.border}`,
                  color: preset === p.id ? C.accent : C.t3,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s',
                }}>{p.label}</button>
              ))}
            </div>

            {/* Preview or custom */}
            {preset ? (
              <div style={{
                marginBottom: 10, padding: '9px 11px', borderRadius: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                borderLeft: `2px solid ${C.accent}`,
                fontSize: 11, color: C.t2, lineHeight: 1.6,
              }}>
                {message}
              </div>
            ) : (
              <textarea
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder={`Write a message to ${firstName}…`}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: 10,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '8px 10px', fontSize: 11,
                  color: C.t1, resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6, transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = `${C.accent}50`}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            )}
            <SendBtn onClick={handleSend} disabled={!message.trim()} sending={sending} sent={sent} label={`Send to ${firstName}`} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CLIENT CARD — summary row + inline accordion
══════════════════════════════════════════════════════════════════ */
function ClientCard({ client, isOpen, onToggle, openModal }) {
  const [hov, setHov] = useState(false);
  const score     = client.retentionScore;
  const sColor    = retentionColor(score);
  const trend     = scoreTrend(client.retentionHistory);
  const isRisk    = client.status === 'at_risk';
  const isPaused  = client.status === 'paused';
  const delta     = client.sessionsThisMonth - client.sessionsLastMonth;
  const TrendIc   = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;
  const activeInj = (client.injuries || []).filter(i => i.severity !== 'Cleared').length;
  const hasActive = (client.injuries || []).some(i => i.severity === 'Active');

  return (
    <Card highlight={isOpen} style={{
      borderLeft: isRisk && !isOpen ? `3px solid ${C.danger}` : isOpen ? undefined : `3px solid transparent`,
    }}>
      {/* ── Summary row ── */}
      <CardBody
        style={{ padding: '12px 15px', cursor: 'pointer' }}
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* Avatar with online dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={client.name} size={36} />
            {client.lastVisit === 0 && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: C.success, border: `1.5px solid ${C.surface}` }} />
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.t1, letterSpacing: '-0.015em' }}>{client.name}</span>
              <Pill label={client.tier} />
              {isRisk   && <DangerPill label="At Risk" />}
              {isPaused && <UrgencyPill label="Paused" urgent={false} />}
              {client.streak >= 14 && <UrgencyPill label={`🔥 ${client.streak}d`} urgent={false} />}
              {activeInj > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, color: hasActive ? C.danger : C.warn, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ShieldAlert style={{ width: 9, height: 9 }} /> {activeInj}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: C.t3 }}>{client.goal}</span>
              <span style={{ fontSize: 10, color: C.border }}>·</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: client.lastVisit === 0 ? C.success : client.lastVisit > 14 ? C.danger : client.lastVisit > 7 ? C.warn : C.t3,
              }}>
                {client.lastVisit === 0 ? 'Seen today' : client.lastVisit === 1 ? 'Yesterday' : `${client.lastVisit}d ago`}
              </span>
              <span style={{ fontSize: 10, color: C.border }}>·</span>
              <span style={{ fontSize: 10, color: C.t3 }}>
                {client.sessionsThisMonth} sessions
                {delta !== 0 && (
                  <span style={{ color: delta > 0 ? C.success : C.danger, fontWeight: 700, marginLeft: 3 }}>
                    ({delta > 0 ? '+' : ''}{delta})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Sparkline + score + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{ opacity: hov || isOpen ? 1 : 0.55, transition: 'opacity 0.15s' }}>
              <Sparkline data={client.retentionHistory} color={sColor} />
            </div>
            <div style={{ textAlign: 'right', minWidth: 30 }}>
              <div style={{ fontSize: 21, fontWeight: 900, color: sColor, lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
                <TrendIc style={{ width: 8, height: 8, color: trend.dir === 'up' ? C.success : trend.dir === 'down' ? C.danger : C.t3 }} />
                <span style={{ fontSize: 7.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{trend.dir}</span>
              </div>
            </div>
            <ChevronDown style={{
              width: 13, height: 13, flexShrink: 0,
              color: isOpen ? C.accent : hov ? C.t2 : C.t3,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.22s ease, color 0.15s',
            }} />
          </div>
        </div>
      </CardBody>

      {/* ── Inline drop panel ── */}
      {isOpen && (
        <InlineDropPanel client={client} onClose={onToggle} openModal={openModal} />
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SUMMARY BAR
══════════════════════════════════════════════════════════════════ */
function SummaryBar({ clients }) {
  const mrr      = clients.reduce((s, c) => s + c.monthlySpend, 0);
  const avgScore = Math.round(clients.reduce((s, c) => s + c.retentionScore, 0) / (clients.length || 1));
  const active   = clients.filter(c => c.status === 'active').length;
  const atRisk   = clients.filter(c => c.status === 'at_risk').length;
  const avgMeta  = retentionMeta(avgScore);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
      {[
        { label: 'Monthly Revenue', value: `£${mrr.toLocaleString()}`, sub: 'total MRR',         color: C.success      },
        { label: 'Avg Retention',   value: avgScore,                    sub: avgMeta.label,        color: avgMeta.color  },
        { label: 'Active Clients',  value: active,                      sub: 'regularly attending', color: C.accent       },
        { label: 'Need Outreach',   value: atRisk,                      sub: 'at churn risk',       color: atRisk > 0 ? C.danger : C.t3 },
      ].map((s, i) => (
        <div key={i} style={{ padding: '11px 14px', borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>{s.label}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 3 }}>{s.value}</div>
          <div style={{ fontSize: 9.5, color: C.t3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PERSISTENT SIDEBAR
══════════════════════════════════════════════════════════════════ */
function PersistentSidebar({ clients, openClient }) {
  const atRisk    = clients.filter(c => c.status === 'at_risk');
  const topClient = [...clients].sort((a, b) => b.retentionScore - a.retentionScore)[0];
  const withActiveInj = clients.filter(c => (c.injuries || []).some(i => i.severity === 'Active'));

  return (
    <div className="tc-sidebar">

      {/* Priority outreach */}
      {atRisk.length > 0 && (
        <SideCard style={{ borderLeft: `3px solid ${C.danger}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <IconBadge icon={AlertTriangle} tint={C.danger} />
            <div>
              <SideLabel>Priority Outreach</SideLabel>
              <div style={{ fontSize: 10, color: C.danger, fontWeight: 600, marginTop: 1 }}>{atRisk.length} at churn risk</div>
            </div>
          </div>
          {atRisk.map((c, i) => (
            <div key={c.id} onClick={() => openClient(c)} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px', borderRadius: 8,
              marginBottom: i < atRisk.length - 1 ? 5 : 0,
              background: C.surfaceEl, border: `1px solid ${C.border}`,
              cursor: 'pointer', transition: 'border-color 0.14s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${C.danger}30`}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <Avatar name={c.name} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 9.5, color: C.t3 }}>{c.lastVisit}d since last visit</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: retentionColor(c.retentionScore), letterSpacing: '-0.03em' }}>{c.retentionScore}</div>
            </div>
          ))}
        </SideCard>
      )}

      {/* Retention health breakdown */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <IconBadge icon={Activity} />
          <SideLabel>Retention Health</SideLabel>
        </div>
        {[
          { label: 'Healthy (80+)',   count: clients.filter(c => c.retentionScore >= 80).length, color: C.success },
          { label: 'Stable (60–79)', count: clients.filter(c => c.retentionScore >= 60 && c.retentionScore < 80).length, color: C.t1 },
          { label: 'Caution (40–59)',count: clients.filter(c => c.retentionScore >= 40 && c.retentionScore < 60).length, color: C.warn },
          { label: 'At Risk (<40)',   count: clients.filter(c => c.retentionScore < 40).length, color: C.danger },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.t2 }}>{r.label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.count}</span>
          </div>
        ))}
      </SideCard>

      {/* Top performer */}
      {topClient && (
        <SideCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <IconBadge icon={Star} tint={C.success} />
            <SideLabel>Top Performer</SideLabel>
          </div>
          <div onClick={() => openClient(topClient)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <Avatar name={topClient.name} size={34} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{topClient.name}</div>
                <div style={{ fontSize: 10, color: C.t3 }}>{topClient.membership}</div>
              </div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: `${C.success}08`, border: `1px solid ${C.success}1e`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 30, fontWeight: 900, color: C.success, letterSpacing: '-0.04em', lineHeight: 1 }}>{topClient.retentionScore}</div>
              <Sparkline data={topClient.retentionHistory} color={C.success} width={100} height={24} />
            </div>
          </div>
        </SideCard>
      )}

      {/* Active injury alerts */}
      {withActiveInj.length > 0 && (
        <SideCard style={{ borderLeft: `3px solid ${C.danger}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <IconBadge icon={ShieldAlert} tint={C.danger} />
            <div>
              <SideLabel>Active Injuries</SideLabel>
              <div style={{ fontSize: 10, color: C.danger, fontWeight: 600, marginTop: 1 }}>{withActiveInj.length} client{withActiveInj.length > 1 ? 's' : ''} restricted</div>
            </div>
          </div>
          {withActiveInj.map((c, i) => {
            const active = (c.injuries || []).filter(i => i.severity === 'Active');
            return (
              <div key={c.id} onClick={() => openClient(c)} style={{
                padding: '7px 9px', borderRadius: 8,
                background: `${C.danger}07`, border: `1px solid ${C.danger}18`,
                marginBottom: i < withActiveInj.length - 1 ? 5 : 0, cursor: 'pointer',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.t1, marginBottom: 3 }}>{c.name}</div>
                {active.map(inj => (
                  <div key={inj.id} style={{ fontSize: 10, color: C.danger, fontWeight: 600 }}>⚠ {inj.area}</div>
                ))}
              </div>
            );
          })}
        </SideCard>
      )}

      {/* Revenue split */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IconBadge icon={CreditCard} />
          <SideLabel>Revenue Split</SideLabel>
        </div>
        {[
          { label: 'Elite',    value: CLIENTS.filter(c => c.tier === 'Elite').reduce((s, c) => s + c.monthlySpend, 0)    },
          { label: 'Premium',  value: CLIENTS.filter(c => c.tier === 'Premium').reduce((s, c) => s + c.monthlySpend, 0)  },
          { label: 'Standard', value: CLIENTS.filter(c => c.tier === 'Standard').reduce((s, c) => s + c.monthlySpend, 0) },
        ].map((r, i, arr) => {
          const total = arr.reduce((s, x) => s + x.value, 0);
          const pct   = total > 0 ? Math.round((r.value / total) * 100) : 0;
          return (
            <div key={i} style={{ marginBottom: i < arr.length - 1 ? 9 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: C.t2 }}>{r.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.t1 }}>£{r.value} <span style={{ color: C.t3, fontWeight: 400 }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: C.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: C.accent, opacity: 0.5 + (i * 0.2) }} />
              </div>
            </div>
          );
        })}
      </SideCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function TabCoachMembers({ openModal = () => {} }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('risk');
  const [openId,       setOpenId]       = useState(null);

  const atRiskCount = CLIENTS.filter(c => c.status === 'at_risk').length;

  const FILTERS = [
    { id: 'all',      label: 'All Clients', count: CLIENTS.length },
    { id: 'active',   label: 'Active',      count: CLIENTS.filter(c => c.status === 'active').length },
    { id: 'at_risk',  label: 'At Risk',     count: atRiskCount, urgent: true },
    { id: 'paused',   label: 'Paused',      count: CLIENTS.filter(c => c.status === 'paused').length },
    { id: 'elite',    label: 'Elite',       count: CLIENTS.filter(c => c.tier === 'Elite').length },
    { id: 'injuries', label: 'Injured',     count: CLIENTS.filter(c => (c.injuries || []).some(i => i.severity !== 'Cleared')).length },
  ];

  const visible = useMemo(() => {
    let list = [...CLIENTS];
    if (activeFilter === 'active')   list = list.filter(c => c.status === 'active');
    if (activeFilter === 'at_risk')  list = list.filter(c => c.status === 'at_risk');
    if (activeFilter === 'paused')   list = list.filter(c => c.status === 'paused');
    if (activeFilter === 'elite')    list = list.filter(c => c.tier === 'Elite');
    if (activeFilter === 'injuries') list = list.filter(c => (c.injuries || []).some(i => i.severity !== 'Cleared'));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.goal.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'risk')      list.sort((a, b) => a.retentionScore - b.retentionScore);
    if (sortBy === 'score')     list.sort((a, b) => b.retentionScore - a.retentionScore);
    if (sortBy === 'lastVisit') list.sort((a, b) => b.lastVisit - a.lastVisit);
    if (sortBy === 'name')      list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [activeFilter, search, sortBy]);

  function openClient(c) {
    setOpenId(c.id);
    setTimeout(() => {
      document.getElementById(`client-row-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 40);
  }

  return (
    <>
      <style>{MOBILE_CSS}</style>
      <SummaryBar clients={CLIENTS} />

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.t3, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or goal…"
            style={{ width: '100%', padding: '9px 34px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.t1, fontSize: 11, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = `${C.accent}50`}
            onBlur={e  => e.target.style.borderColor = C.border} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.t3, display: 'flex', padding: 0 }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 9 }}>
          {[{ id: 'risk', label: 'Priority' }, { id: 'score', label: 'Score' }, { id: 'lastVisit', label: 'Last Seen' }, { id: 'name', label: 'Name' }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)} style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 10,
              fontWeight: sortBy === s.id ? 700 : 500,
              background: sortBy === s.id ? `${C.accent}10` : 'transparent',
              border: `1px solid ${sortBy === s.id ? `${C.accent}24` : 'transparent'}`,
              color: sortBy === s.id ? C.accent : C.t3,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.12s',
            }}>{s.label}</button>
          ))}
        </div>
        <button onClick={() => openModal?.('addClient')} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
          background: C.accent, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          boxShadow: `0 0 0 1px ${C.accent}60, 0 4px 14px ${C.accent}28`, transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <UserPlus style={{ width: 12, height: 12 }} /> Add Client
        </button>
      </div>

      <div className="tc-root">
        <div className="tc-left">

          {/* Filter tabs */}
          <div className="tc-tabs">
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', padding: '8px 14px 8px 0', marginBottom: -1, flexShrink: 0 }}>Clients</span>
            {FILTERS.map(f => {
              const isActive = activeFilter === f.id;
              const isUrgent = f.urgent && f.count > 0;
              const tabColor = isActive ? (isUrgent ? C.danger : C.accent) : C.t3;
              return (
                <button key={f.id} onClick={() => setActiveFilter(f.id)} className="tc-tab-btn" style={{
                  fontWeight: isActive ? 700 : 500, color: tabColor,
                  borderBottom: `2px solid ${isActive ? tabColor : 'transparent'}`,
                  marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {f.label}
                  {f.count > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 800, background: isActive ? (isUrgent ? `${C.danger}18` : `${C.accent}18`) : 'rgba(255,255,255,0.05)', color: isActive ? tabColor : C.t3, padding: '1px 5px', borderRadius: 99 }}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Column hint */}
          {visible.length > 0 && (
            <div style={{ display: 'flex', padding: '0 15px 8px', flexShrink: 0 }}>
              <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 22 }}>8-week · Score</span>
            </div>
          )}

          {/* Accordion list */}
          <div className="tc-feed">
            {visible.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 12, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: CARD_RADIUS, background: `${C.accent}14`, border: `1px solid ${C.accent}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search style={{ width: 18, height: 18, color: C.accent, opacity: 0.6 }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.t2, margin: 0 }}>No clients found</p>
                <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>Try adjusting your search or filter</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingBottom: 28, paddingRight: 4 }}>
                {visible.map(c => (
                  <div key={c.id} id={`client-row-${c.id}`}>
                    <ClientCard
                      client={c}
                      isOpen={openId === c.id}
                      onToggle={() => setOpenId(prev => prev === c.id ? null : c.id)}
                      openModal={openModal}
                    />
                  </div>
                ))}
                <p style={{ textAlign: 'center', fontSize: 10, color: C.t3, margin: 0 }}>
                  {visible.length} of {CLIENTS.length} clients
                </p>
              </div>
            )}
          </div>
        </div>

        <PersistentSidebar clients={visible} openClient={openClient} />
      </div>
    </>
  );
}
