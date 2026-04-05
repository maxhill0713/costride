import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import {
  Plus, Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Zap, Heart, MessageCircle, Dumbbell,
  MoreHorizontal, Trash2, Flame, AlertTriangle, Star, Award,
  Users, Target, Sparkles, ArrowUpRight, Activity, Shield, CheckCircle,
  RefreshCw, Bell,
} from 'lucide-react';
// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  blue:    '#0ea5e9',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1020',
  divider: 'rgba(255,255,255,0.05)',
};

// ── Layout primitives ──────────────────────────────────────────────────────────
export const Card = ({ children, style = {}, className = '', onClick }) => (
  <div className={className} onClick={onClick}
    style={{ background: 'var(--card,#0a0f1e)', border: '1px solid var(--border,rgba(255,255,255,0.07))', borderRadius: 16, ...style }}>
    {children}
  </div>
);

export const SectionTitle = ({ children, action, actionLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1,#f1f5f9)', margin: 0 }}>{children}</p>
    {action && (
      <button onClick={action} style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan,#00d4ff)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
        {actionLabel || 'View all'} <ChevronRight style={{ width: 11, height: 11 }}/>
      </button>
    )}
  </div>
);

export const Empty = ({ icon: Icon, label }) => (
  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
    <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.14)', margin: '0 auto 10px' }}>
      <Icon style={{ width: 18, height: 18, color: 'rgba(14,165,233,0.4)' }}/>
    </div>
    <p style={{ fontSize: 12, color: 'var(--text3,#475569)', fontWeight: 500, margin: 0 }}>{label}</p>
  </div>
);

export const RingChart = ({ pct = 70, size = 64, stroke = 5, color = '#0ea5e9' }) => {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}/>
    </svg>
  );
};

// ── StatusChip ─────────────────────────────────────────────────────────────────
export function StatusChip({ status }) {
  const map = {
    'Engaged':  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)'  },
    'New':      { color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.2)'  },
    'Casual':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
    'At Risk':  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
    'Banned':   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  };
  const s = map[status] || map['Casual'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
}

// ── FitnessScore ───────────────────────────────────────────────────────────────
export function FitnessScore({ score = 0, label = 'Score', sub = '' }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 22, stroke = 4, circ = 2 * Math.PI * r;
  const dash = circ * Math.min(100, Math.max(0, score)) / 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={56} height={56} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
          <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
          <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 14, fontWeight: 800, color, letterSpacing: '-0.03em', position: 'relative', zIndex: 1 }}>{score}</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,248,0.7)', textAlign: 'center' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: '#475569', textAlign: 'center' }}>{sub}</div>}
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
export function Avatar({ name = '?', size = 32, src = null }) {
  const colors = [
    ['#3b82f6','#06b6d4'], ['#8b5cf6','#ec4899'], ['#10b981','#0ea5e9'],
    ['#f59e0b','#ef4444'], ['#6366f1','#8b5cf6'], ['#14b8a6','#3b82f6'],
  ];
  const [c1, c2] = colors[(name || '?').charCodeAt(0) % colors.length];
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.38, fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
      {src && !imgFailed
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)}/>
        : (name || '?').charAt(0).toUpperCase()
      }
    </div>
  );
}

// ── Responsive styles ──────────────────────────────────────────────────────────
const MOBILE_CSS = `
  .tc-root {
    display: grid;
    grid-template-columns: minmax(0,1fr) clamp(260px,22%,320px);
    gap: 16px;
    height: 100%;
    max-width: 100%;
  }
  .tc-left { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0; }
  .tc-actions { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; flex-shrink: 0; padding-bottom: 12px; }
  .tc-action-btn { border-radius: 12px; padding: 14px 12px; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.18s, box-shadow 0.18s; min-height: 88px; }
  .tc-tabs { display: flex; align-items: center; border-bottom: 1px solid ${T.border}; margin-bottom: 12px; gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0; }
  .tc-tabs::-webkit-scrollbar { display: none; }
  .tc-tab-btn { padding: 7px 16px; font-size: 12px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; font-family: inherit; }
  .tc-feed { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; }
  .tc-feed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; padding-bottom: 24px; }
  .tc-sidebar { height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-width: 280px; }
  @media (max-width: 768px) {
    .tc-root { grid-template-columns: 1fr !important; height: auto !important; overflow: visible !important; }
    .tc-left { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tc-actions { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
    .tc-action-btn { min-height: 72px !important; padding: 12px 10px !important; }
    .tc-action-label { font-size: 11px !important; }
    .tc-action-sub { font-size: 9px !important; }
    .tc-feed { overflow: visible !important; min-height: unset !important; flex: unset !important; }
    .tc-feed-grid { grid-template-columns: 1fr !important; }
    .tc-feed-col { display: contents !important; }
    .tc-sidebar { height: auto !important; overflow: visible !important; min-width: unset !important; }
    .tc-tab-btn { padding: 7px 12px !important; font-size: 11px !important; }
  }
  @media (max-width: 480px) {
    .tc-actions { grid-template-columns: repeat(2, 1fr) !important; }
    .tc-action-btn { min-height: 66px !important; padding: 10px 9px !important; }
  }
`;

// ── Shared helpers ─────────────────────────────────────────────────────────────
// Top shimmer line used on every card
const Shimmer = ({ color = T.blue }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}28,transparent)`, pointerEvents: 'none' }} />
);

// Small badge pill
function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}15`, border: `1px solid ${color}28`, borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>
      {label}
    </span>
  );
}

// Stat tag (likes, comments etc in score pills)
function StatTag({ val, label, color }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: T.divider, border: `1px solid ${T.border}`, color }}>
      {val} {label}
    </div>
  );
}

// Divider row used in stat lists
function StatRow({ label, value, color, last, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}`, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => onClick && (e.currentTarget.style.opacity = '1')}>
      <span style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.04em', minWidth: 28 }}>{value}</span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text2 }}>{label}</span>
      {onClick && <ChevronRight style={{ width: 13, height: 13, color: T.text3 }} />}
    </div>
  );
}

// ── 3-dot delete menu ──────────────────────────────────────────────────────────
function DeleteBtn({ onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }}>
        <MoreHorizontal style={{ width: 13, height: 13, color: T.text3 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 28, right: 0, zIndex: 9999, background: '#0b1020', border: `1px solid ${T.borderM}`, borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 110, overflow: 'hidden' }}>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, color: T.red, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = `${T.red}12`}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Trash2 style={{ width: 12, height: 12 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Feed post card ─────────────────────────────────────────────────────────────
function FeedCard({ post, onDelete, isTopPerformer, isLowPerformer }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const hasImage = post.image_url || post.media_url;
  const content  = post.content || post.title || '';
  const total    = likes + comments;
  const borderColor = isTopPerformer ? `${T.green}40` : isLowPerformer ? `${T.red}20` : T.border;

  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${borderColor}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Shimmer color={isTopPerformer ? T.green : T.blue} />
      {isTopPerformer && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><Badge label="⭐ Top post" color={T.green} /></div>}
      {isLowPerformer && total === 0 && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><Badge label="No engagement" color={T.red} /></div>}

      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={post.author_name || post.gym_name || 'G'} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'GymPost'}
          </div>
        </div>
        <span style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>
          {post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}
        </span>
        <DeleteBtn onDelete={() => onDelete(post.id)} />
      </div>

      {content && (
        <div style={{ padding: '0 14px 10px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: 0, lineHeight: 1.4 }}>
            {post.title || content.split('\n')[0]}
          </p>
          {post.title && content !== post.title && (
            <p style={{ fontSize: 12, color: T.text2, margin: '4px 0 0', lineHeight: 1.5 }}>{content}</p>
          )}
        </div>
      )}

      {hasImage && (
        <div style={{ overflow: 'hidden' }}>
          <img src={post.image_url || post.media_url} alt=""
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
            onError={e => e.currentTarget.parentElement.style.display = 'none'} />
        </div>
      )}

      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 14, borderTop: `1px solid ${T.divider}` }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: likes > 0 ? T.red : T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart style={{ width: 13, height: 13 }} /> {likes}
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: comments > 0 ? T.blue : T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle style={{ width: 13, height: 13 }} /> {comments}
        </button>
        {total > 0 && (
          <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: total >= 5 ? T.green : T.text3 }}>
            {total} interactions
          </div>
        )}
      </div>
    </div>
  );
}

// ── Event card ─────────────────────────────────────────────────────────────────
function EventCard({ event, now, onDelete }) {
  const evDate   = new Date(event.event_date);
  const diffDays = Math.floor((evDate - now) / 86400000);
  const urgent   = diffDays <= 2;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.green}22`, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Shimmer color={T.green} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar style={{ width: 13, height: 13, color: T.green }} />
          </div>
          <Badge label="Event" color={T.green} />
          <Badge label={diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d`} color={urgent ? T.red : T.green} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 4px' }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 12, color: T.text2, margin: '0 0 8px', lineHeight: 1.4 }}>{event.description}</p>}
        <div style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

// ── Challenge card ─────────────────────────────────────────────────────────────
function ChallengeCard({ challenge, now, onDelete }) {
  const start     = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalDays = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed   = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalDays - elapsed);
  const pct       = Math.min(100, Math.round((elapsed / totalDays) * 100));
  const parts     = challenge.participants?.length || 0;
  const nearEnd   = remaining <= 3;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.amber}22`, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Shimmer color={T.amber} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.amber}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy style={{ width: 13, height: 13, color: T.amber }} />
          </div>
          <Badge label="Challenge" color={T.amber} />
          <Badge label={`${remaining}d left`} color={nearEnd ? T.red : T.text3} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 10px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 11, color: T.text3 }}>{parts} participants</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 75 ? T.amber : T.purple }}>{pct}% done</span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg,${T.purple},${T.amber})`, transition: 'width 0.8s ease' }} />
        </div>
      </div>
    </div>
  );
}

// ── Class type config ──────────────────────────────────────────────────────────
const CLASS_CFG = {
  hiit:     { color: T.red,     label: 'HIIT'     },
  yoga:     { color: T.green,   label: 'Yoga'     },
  strength: { color: '#818cf8', label: 'Strength' },
  cardio:   { color: '#fb7185', label: 'Cardio'   },
  spin:     { color: T.blue,    label: 'Spin'     },
  boxing:   { color: T.amber,   label: 'Boxing'   },
  pilates:  { color: T.purple,  label: 'Pilates'  },
  default:  { color: T.blue,    label: 'Class'    },
};
const CLASS_IMGS = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  cardio:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  spin:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
  boxing:   'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80',
  pilates:  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
  default:  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
};
function getClassType(c) {
  const n = (c.class_type || c.name || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('flow') || n.includes('vinyasa')) return 'yoga';
  if (n.includes('strength') || n.includes('lift') || n.includes('barbell') || n.includes('weight')) return 'strength';
  if (n.includes('cardio') || n.includes('run') || n.includes('aerobic')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike')) return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox')) return 'boxing';
  if (n.includes('pilates') || n.includes('barre')) return 'pilates';
  return 'default';
}

function ClassCard({ gymClass, onDelete }) {
  const typeKey  = getClassType(gymClass);
  const cfg      = CLASS_CFG[typeKey];
  const img      = gymClass.image_url || CLASS_IMGS[typeKey];
  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: T.card, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 100, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05),${T.card}e0)` }} />
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.55)', border: `1px solid ${cfg.color}40`, borderRadius: 5, padding: '2px 7px', backdropFilter: 'blur(6px)' }}>
          {cfg.label}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, letterSpacing: '-0.02em', lineHeight: 1.2, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gymClass.name || gymClass.title}
          </div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)} />
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.description && <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gymClass.description}</div>}
        {(gymClass.instructor || gymClass.coach_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${cfg.color}20`, border: `1px solid ${cfg.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
              {initials(gymClass.instructor || gymClass.coach_name)}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>{gymClass.instructor || gymClass.coach_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Poll card ──────────────────────────────────────────────────────────────────
function PollCard({ poll, onDelete, allMemberships }) {
  const votes   = poll.voters?.length || 0;
  const total   = allMemberships?.length || 0;
  const partPct = total > 0 ? Math.round((votes / total) * 100) : 0;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.purple}22`, padding: '12px 14px', position: 'relative' }}>
      <Shimmer color={T.purple} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BarChart2 style={{ width: 13, height: 13, color: T.purple }} />
        </div>
        <Badge label="Poll" color={T.purple} />
        {partPct > 0 && <Badge label={`${partPct}% voted`} color={partPct >= 50 ? T.green : T.amber} />}
        <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)} /></div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 10px' }}>{poll.title}</p>
      <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${partPct}%`, borderRadius: 99, background: `linear-gradient(90deg,${T.purple},#a78bfa)`, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>{votes} {votes === 1 ? 'vote' : 'votes'}{total > 0 ? ` of ${total} members` : ''}</div>
    </div>
  );
}

// ── Sidebar: Community Activity 7-day chart ────────────────────────────────────
function CommunityActivityWidget({ allPosts, now }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day   = subDays(now, 6 - i);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end   = new Date(start.getTime() + 86400000);
    const inDay = allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; });
    const posts    = inDay.length;
    const likes    = inDay.reduce((s, p) => s + (p.likes?.length    || 0), 0);
    const comments = inDay.reduce((s, p) => s + (p.comments?.length || 0), 0);
    return { label: format(day, 'EEE'), posts, likes, comments, total: posts + likes + comments };
  }), [allPosts, now]);
  const maxVal   = Math.max(...days.map(d => d.total), 1);
  const thisWeek = days.reduce((s, d) => s + d.total, 0);
  const trend    = days[6].total >= days[0].total;

  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Community Activity</div>
          <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>Posts, likes & comments</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: trend ? T.green : T.amber, letterSpacing: '-0.04em' }}>{thisWeek}</span>
          {trend ? <TrendingUp style={{ width: 12, height: 12, color: T.green }} /> : <TrendingDown style={{ width: 12, height: 12, color: T.amber }} />}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, height: 44, alignItems: 'flex-end', marginBottom: 6 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 40, gap: 1 }}>
            {d.total === 0
              ? <div style={{ height: 3, borderRadius: 2, background: T.divider }} />
              : <>
                  {d.comments > 0 && <div style={{ height: Math.max(3, (d.comments / maxVal) * 36), borderRadius: 2, background: T.blue, opacity: 0.9 }} />}
                  {d.likes    > 0 && <div style={{ height: Math.max(3, (d.likes    / maxVal) * 36), borderRadius: 2, background: T.red,  opacity: 0.9 }} />}
                  {d.posts    > 0 && <div style={{ height: Math.max(3, (d.posts    / maxVal) * 36), borderRadius: 2, background: T.purple, opacity: 0.9 }} />}
                </>
            }
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {days.map((d, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: T.text3 }}>{d.label}</div>)}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[{ color: T.purple, label: 'Posts' }, { color: T.red, label: 'Likes' }, { color: T.blue, label: 'Comments' }].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: T.text3 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar: Content Performance ───────────────────────────────────────────────
function ContentPerformanceWidget({ allPosts, openModal }) {
  const ranked = useMemo(() =>
    [...allPosts].map(p => ({ ...p, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 })).sort((a, b) => b.score - a.score)
  , [allPosts]);
  const top3 = ranked.slice(0, 3);
  const low3 = ranked.filter(p => p.score === 0).slice(0, 3);
  if (!allPosts.length) return null;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Content Performance</div>
      {top3.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>⭐ Top performing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            {top3.map((p, i) => (
              <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, background: `${T.green}08`, border: `1px solid ${T.green}15` }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: T.green, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(p.title || p.content || '').split('\n')[0].slice(0, 40) || 'Post'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: T.red }}>♥ {p.likes?.length || 0}</span>
                  <span style={{ fontSize: 10, color: T.blue }}>💬 {p.comments?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {low3.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>📉 No engagement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {low3.map((p, i) => (
              <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, background: `${T.red}06`, border: `1px solid ${T.red}12` }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(p.title || p.content || '').split('\n')[0].slice(0, 40) || 'Post'}
                </span>
                <span style={{ fontSize: 9, color: T.text3 }}>{p.created_date ? format(new Date(p.created_date), 'MMM d') : ''}</span>
              </div>
            ))}
          </div>
          <button onClick={() => openModal('post')}
            style={{ width: '100%', fontSize: 11, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}25`, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            Post something new →
          </button>
        </>
      )}
    </div>
  );
}

// ── Sidebar: Challenge Uptake ──────────────────────────────────────────────────
function ChallengeCompletionWidget({ challenges, allMemberships, now }) {
  const data = useMemo(() => challenges
    .filter(c => c.start_date && c.end_date)
    .map(c => {
      const parts   = c.participants?.length || 0;
      const members = allMemberships.length || 1;
      const joinPct = Math.round((parts / members) * 100);
      return { ...c, parts, joinPct };
    })
    .sort((a, b) => b.parts - a.parts)
    .slice(0, 4)
  , [challenges, allMemberships]);
  if (!data.length) return null;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Challenge Uptake</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((c, i) => (
          <div key={c.id || i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{c.title}</span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.amber }}>{c.parts} joined</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.joinPct >= 50 ? T.green : c.joinPct >= 25 ? T.amber : T.red }}>{c.joinPct}%</span>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.joinPct}%`, borderRadius: 99, background: c.joinPct >= 50 ? `linear-gradient(90deg,${T.green},#34d399)` : `linear-gradient(90deg,${T.purple},${T.amber})`, transition: 'width 0.6s ease' }} />
            </div>
            {c.joinPct < 25 && <div style={{ fontSize: 9, color: T.red, marginTop: 3, fontWeight: 600 }}>Low uptake — promote this challenge</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar: Engagement Trend WoW ─────────────────────────────────────────────
function EngagementTrendWidget({ allPosts, polls, now }) {
  const { thisWeek, lastWeek, change } = useMemo(() => {
    const weekStart = subDays(now, 7);
    const prevStart = subDays(now, 14);
    const score = (start, end) => {
      const p = allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; });
      return p.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
           + polls.filter(p => { const d = new Date(p.created_date || 0); return d >= start && d < end; }).reduce((s, p) => s + (p.voters?.length || 0), 0);
    };
    const thisWeek = score(weekStart, now);
    const lastWeek = score(prevStart, weekStart);
    return { thisWeek, lastWeek, change: lastWeek === 0 ? 0 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100) };
  }, [allPosts, polls, now]);
  const up = change >= 0;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Engagement Trend</div>
          <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>Week over week</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {up ? <TrendingUp style={{ width: 13, height: 13, color: T.green }} /> : <TrendingDown style={{ width: 13, height: 13, color: T.red }} />}
          <span style={{ fontSize: 14, fontWeight: 900, color: up ? T.green : T.red, letterSpacing: '-0.02em' }}>{up ? '+' : ''}{change}%</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[{ label: 'This week', val: thisWeek, color: up ? T.green : T.red }, { label: 'Last week', val: lastWeek, color: T.text3 }].map((s, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 9, background: T.divider, border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.04em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: T.text3, fontWeight: 600, marginTop: 2, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {change < 0 && (
        <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: `${T.red}08`, border: `1px solid ${T.red}18` }}>
          <div style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>Engagement dropped — consider a new challenge or poll to re-activate members</div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar: Member Engagement Leaderboard ─────────────────────────────────────
function MemberEngagementLeaderboard({ allPosts, avatarMap }) {
  const leaders = useMemo(() => {
    const scores = {};
    allPosts.forEach(p => {
      if (!p.user_id) return;
      if (!scores[p.user_id]) scores[p.user_id] = { userId: p.user_id, name: p.author_name || 'Member', posts: 0, comments: 0 };
      scores[p.user_id].posts++;
    });
    allPosts.forEach(p => {
      (p.comments || []).forEach(c => {
        const id = c.user_id || c.author_id;
        if (!id) return;
        if (!scores[id]) scores[id] = { userId: id, name: c.author_name || 'Member', posts: 0, comments: 0 };
        scores[id].comments++;
      });
    });
    return Object.values(scores)
      .map(s => ({ ...s, score: s.posts * 3 + s.comments * 2 }))
      .sort((a, b) => b.score - a.score).slice(0, 5);
  }, [allPosts]);
  if (!leaders.length) return null;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>🏆 Top Contributors</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leaders.map((m, i) => (
          <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? `${T.amber}25` : T.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? T.amber : T.text3, flexShrink: 0 }}>{i + 1}</div>
            <Avatar name={m.name} size={24} src={avatarMap?.[m.userId] || null} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {m.posts    > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: T.purple }}>{m.posts}p</span>}
              {m.comments > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: T.blue   }}>{m.comments}c</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar: Content Suggestions ──────────────────────────────────────────────
function WhatToPostPanel({ allPosts, polls, challenges, events, now, openModal }) {
  const suggestions = useMemo(() => {
    const items = [];
    const daysSinceLast = allPosts.length > 0 ? differenceInDays(now, new Date(allPosts[0]?.created_date || now)) : 999;
    if (daysSinceLast >= 3)               items.push({ color: T.amber,  icon: MessageSquarePlus, label: `No post in ${daysSinceLast} days — keep your feed active`,            action: 'Post now',    fn: () => openModal('post')      });
    if (!polls.filter(p => !p.ended_at).length) items.push({ color: T.purple, icon: BarChart2,         label: 'No active poll — polls drive high engagement',                        action: 'Create poll', fn: () => openModal('poll')      });
    if (!challenges.find(c => c.status === 'active')) items.push({ color: T.amber,  icon: Trophy,            label: 'No active challenge — members lose motivation without one',           action: 'Start one',   fn: () => openModal('challenge') });
    if (!events.find(e => new Date(e.event_date) >= now)) items.push({ color: T.green,  icon: Calendar,          label: 'No upcoming events — schedule something to build excitement',          action: 'Add event',   fn: () => openModal('event')     });
    return items.slice(0, 3);
  }, [allPosts, polls, challenges, events, now]);
  if (!suggestions.length) return null;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Sparkles style={{ width: 13, height: 13, color: T.blue }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Content Suggestions</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {suggestions.map((s, i) => (
          <div key={i} onClick={s.fn} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, background: `${s.color}08`, border: `1px solid ${s.color}20`, cursor: 'pointer' }}>
            <s.icon style={{ width: 12, height: 12, color: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text2, lineHeight: 1.4 }}>{s.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: s.color, whiteSpace: 'nowrap', padding: '2px 7px', borderRadius: 5, background: `${s.color}15`, flexShrink: 0 }}>{s.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar: Unreached Members ─────────────────────────────────────────────────
function UnreachedMembers({ members, avatarMap, openModal, label = 'Not Reached', desc = 'No check-ins, poll votes, or challenge joins in 30 days.' }) {
  if (!members.length) return null;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{label}</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.red, background: `${T.red}12`, border: `1px solid ${T.red}22`, borderRadius: 6, padding: '2px 7px' }}>{members.length}</span>
      </div>
      <p style={{ fontSize: 11, color: T.text3, marginBottom: 10, fontWeight: 500, lineHeight: 1.4 }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={m.user_name || '?'} size={26} src={avatarMap?.[m.user_id] || null} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</span>
            <button onClick={() => openModal('post')}
              style={{ fontSize: 9, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}22`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Reach
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar: Milestones ────────────────────────────────────────────────────────
function MilestonesWidget({ milestones, avatarMap, label = 'Upcoming Member Milestones' }) {
  if (!milestones.length) return null;
  return (
    <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>🎯 {label}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {milestones.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <Avatar name={m.name} size={30} src={avatarMap?.[m.user_id] || null} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: m.toNext === 1 ? T.green : T.text3, marginTop: 1 }}>{m.toNext === 1 ? '🎉 1 visit to go!' : `${m.toNext} visits to go`}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.amber }}>{m.total}</div>
              <div style={{ fontSize: 9, color: T.text3 }}>→ {m.next}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabContent({
  events, challenges, polls, posts, userPosts = [], checkIns, ci30, avatarMap,
  openModal, now, allMemberships = [], classes = [],
  onDeletePost = () => {}, onDeleteEvent = () => {}, onDeleteChallenge = () => {},
  onDeleteClass = () => {}, onDeletePoll = () => {},
  isCoach = false,
}) {
  const [activeFilter, setActiveFilter] = useState(isCoach ? 'classes' : 'gym');

  const allPosts         = [...(userPosts || []), ...(posts || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const gymPosts         = allPosts.filter(p => !p.user_id || p.gym_id || p.member_id);
  const memberPosts      = allPosts.filter(p => p.user_id && !p.gym_id);
  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalChalPart    = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);

  // Top/low performers
  const postScores = useMemo(() =>
    allPosts.map(p => ({ id: p.id, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 }))
  , [allPosts]);
  const maxScore   = Math.max(...postScores.map(p => p.score), 1);
  const topPostIds = new Set(postScores.filter(p => p.score >= maxScore * 0.7 && p.score > 0).map(p => p.id));
  const lowPostIds = new Set(postScores.filter(p => p.score === 0).map(p => p.id));

  const FILTERS = isCoach ? [
    { id: 'classes',    label: 'My Classes'  },
    { id: 'gym',        label: 'Posts'       },
    { id: 'challenges', label: 'Challenges'  },
    { id: 'polls',      label: 'Polls'       },
    { id: 'events',     label: 'Events'      },
  ] : [
    { id: 'gym',        label: 'Gym Posts'   },
    { id: 'members',    label: 'Members'     },
    { id: 'challenges', label: 'Challenges'  },
    { id: 'classes',    label: 'Classes'     },
    { id: 'polls',      label: 'Polls'       },
  ];

  const feedItems = useMemo(() => {
    switch (activeFilter) {
      case 'members':    return { posts: memberPosts,      events: [],            challenges: [],             polls: [],  classes: []  };
      case 'gym':        return { posts: gymPosts,         events: [],            challenges: [],             polls: [],  classes: []  };
      case 'challenges': return { posts: [],               events: [],            challenges: activeChallenges, polls: [], classes: []  };
      case 'classes':    return { posts: [],               events: [],            challenges: [],             polls: [],  classes       };
      case 'polls':      return { posts: [],               events: [],            challenges: [],             polls,      classes: []  };
      case 'events':     return { posts: [],               events: upcomingEvents, challenges: [],            polls: [],  classes: []  };
      default:           return { posts: allPosts,         events: upcomingEvents, challenges: activeChallenges, polls,   classes       };
    }
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const flatFeedItems = useMemo(() => [
    ...feedItems.posts.map(p      => ({ type: 'post',      data: p, date: new Date(p.created_date || 0) })),
    ...feedItems.events.map(e     => ({ type: 'event',     data: e, date: new Date(e.event_date    || 0) })),
    ...feedItems.challenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date    || 0) })),
    ...feedItems.polls.map(p      => ({ type: 'poll',      data: p, date: new Date(p.created_date  || 0) })),
    ...feedItems.classes.map(c    => ({ type: 'class',     data: c, date: new Date(c.created_date  || 0) })),
  ].sort((a, b) => b.date - a.date), [feedItems]);

  const col1 = flatFeedItems.filter((_, i) => i % 2 === 0);
  const col2 = flatFeedItems.filter((_, i) => i % 2 === 1);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <FeedCard      key={item.data.id || i} post={item.data}      onDelete={onDeletePost}      isTopPerformer={topPostIds.has(item.data.id)} isLowPerformer={lowPostIds.has(item.data.id)} />;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     onDelete={onDeleteEvent}     now={now} />;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} onDelete={onDeleteChallenge} now={now} />;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}      allMemberships={allMemberships} />;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  // Milestones
  const milestones = useMemo(() => {
    const acc = {}, userIdByName = {};
    checkIns.forEach(c => {
      if (!acc[c.user_name]) acc[c.user_name] = 0;
      acc[c.user_name]++;
      if (c.user_id) userIdByName[c.user_name] = c.user_id;
    });
    return Object.entries(acc)
      .map(([name, total]) => {
        const next = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
        return { name, total, next, toNext: next ? next - total : 0, user_id: userIdByName[name] };
      })
      .filter(m => m.next && m.toNext <= 5)
      .sort((a, b) => a.toNext - b.toNext)
      .slice(0, 4);
  }, [checkIns]);

  const engagementScore = useMemo(() => {
    return allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
         + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)
         + activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0)
         + events.reduce((s, e) => s + (e.attendees || 0), 0);
  }, [allPosts, polls, activeChallenges, events]);

  const contentMix = useMemo(() => {
    const total = allPosts.length + events.length + polls.length + challenges.length;
    if (!total) return null;
    return [
      { label: 'Posts',      count: allPosts.length,   color: T.blue,   pct: Math.round((allPosts.length   / total) * 100) },
      { label: 'Events',     count: events.length,     color: T.green,  pct: Math.round((events.length     / total) * 100) },
      { label: 'Polls',      count: polls.length,      color: T.purple, pct: Math.round((polls.length      / total) * 100) },
      { label: 'Challenges', count: challenges.length, color: T.amber,  pct: Math.round((challenges.length / total) * 100) },
    ];
  }, [allPosts, events, polls, challenges]);

  const cadenceData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day   = subDays(now, 6 - i);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end   = new Date(start.getTime() + 86400000);
    return { label: format(day, 'EEE'), count: allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; }).length };
  }), [allPosts, now]);
  const cadenceMax = Math.max(...cadenceData.map(d => d.count), 1);

  const pollParticipationRate = useMemo(() => {
    if (!polls.length || !allMemberships.length) return null;
    return Math.round((polls.reduce((s, p) => s + (p.voters?.length || 0), 0) / (polls.length * allMemberships.length)) * 100);
  }, [polls, allMemberships]);

  const unreachedMembers = useMemo(() => {
    const checkerIds   = new Set(ci30.map(c => c.user_id));
    const challengeIds = new Set(activeChallenges.flatMap(c => c.participants || []));
    const pollIds      = new Set(polls.flatMap(p => p.voters || []));
    return allMemberships.filter(m => !checkerIds.has(m.user_id) && !challengeIds.has(m.user_id) && !pollIds.has(m.user_id)).slice(0, 4);
  }, [allMemberships, ci30, activeChallenges, polls]);

  // Action button configs
  const coachActions = [
    { icon: Dumbbell,          label: 'My Classes',    sub: `${classes.length} classes`,          color: T.purple, fn: () => openModal('classes')   },
    { icon: MessageSquarePlus, label: 'New Post',      sub: 'Engage members',                     color: T.blue,   fn: () => openModal('post')      },
    { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`,  color: T.green,  fn: () => openModal('event')     },
    { icon: Trophy,            label: 'Challenge',     sub: `${activeChallenges.length} active`,  color: T.red,    fn: () => openModal('challenge') },
    { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,             color: T.purple, fn: () => openModal('poll')      },
  ];
  const gymActions = [
    { icon: MessageSquarePlus, label: 'New Post',      sub: 'Share with members',                 color: T.blue,   fn: () => openModal('post')      },
    { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`,  color: T.green,  fn: () => openModal('event')     },
    { icon: Dumbbell,          label: 'Classes',       sub: `${classes.length} total`,            color: T.blue,   fn: () => openModal('classes')   },
    { icon: Trophy,            label: 'New Challenge', sub: `${activeChallenges.length} active`,  color: T.red,    fn: () => openModal('challenge') },
    { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,             color: T.purple, fn: () => openModal('poll')      },
  ];
  const actions = isCoach ? coachActions : gymActions;

  return (
    <>
      <style>{MOBILE_CSS}</style>
      <div className="tc-root">

        {/* ── LEFT COLUMN ── */}
        <div className="tc-left">

          {/* Quick-action buttons */}
          <div className="tc-actions">
            {actions.map(({ icon: Icon, label, sub, color, fn }, i) => (
              <div key={i} onClick={fn} className="tc-action-btn"
                style={{ background: T.card, border: `1px solid ${color}28` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.4)`; e.currentTarget.style.borderColor = `${color}50`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = `${color}28`; }}>
                {/* Subtle colour glow in corner */}
                <div style={{ position: 'absolute', bottom: -12, right: -12, width: 56, height: 56, borderRadius: '50%', background: color, opacity: 0.08, filter: 'blur(14px)', pointerEvents: 'none' }} />
                <div style={{ width: 28, height: 28, borderRadius: 9, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon style={{ width: 13, height: 13, color }} />
                </div>
                <div className="tc-action-label" style={{ fontSize: 12, fontWeight: 700, color: T.text1, marginBottom: 3, letterSpacing: '-0.01em' }}>{label}</div>
                <div className="tc-action-sub"   style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="tc-tabs">
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text1, padding: '7px 16px 7px 2px', marginBottom: -1, flexShrink: 0 }}>Feed</span>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className="tc-tab-btn"
                style={{ fontWeight: activeFilter === f.id ? 700 : 500, color: activeFilter === f.id ? T.text1 : T.text3, borderBottom: `2px solid ${activeFilter === f.id ? T.purple : 'transparent'}`, marginBottom: -1 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Two-column feed */}
          <div className="tc-feed">
            {flatFeedItems.length > 0 ? (
              <div className="tc-feed-grid">
                <div className="tc-feed-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{col1.map(renderItem)}</div>
                <div className="tc-feed-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{col2.map(renderItem)}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${T.blue}0a`, border: `1px solid ${T.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquarePlus style={{ width: 18, height: 18, color: `${T.blue}60` }} />
                </div>
                <p style={{ fontSize: 12, color: T.text3, fontWeight: 500, margin: 0 }}>Nothing here yet</p>
                <button onClick={() => openModal('post')}
                  style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}22`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Create first post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="tc-sidebar">
          {isCoach ? (
            <>
              {/* Coach: impact score */}
              <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', flexShrink: 0 }}>
                <Shimmer />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>My Content Impact</div>
                  <Zap style={{ width: 14, height: 14, color: T.purple }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: T.text1, letterSpacing: '-0.05em', lineHeight: 1 }}>{engagementScore}</span>
                  <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>interactions</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <StatTag val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"      color={T.red}    />
                  <StatTag val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"   color={T.blue}   />
                  <StatTag val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes" color={T.purple} />
                </div>
              </div>

              <EngagementTrendWidget allPosts={allPosts} polls={polls} now={now} />

              {/* Coach: classes & events summary */}
              <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4 }}>My Classes & Events</div>
                <StatRow label="My Classes"        value={classes.length}          color={T.purple} />
                <StatRow label="Upcoming Events"   value={upcomingEvents.length}   color={T.green}  />
                <StatRow label="Active Challenges" value={activeChallenges.length} color={T.amber}  />
                <StatRow label="Active Polls"      value={polls.length}            color={T.blue} last />
              </div>

              <UnreachedMembers members={unreachedMembers} avatarMap={avatarMap} openModal={openModal} label="Clients Not Reached" desc="No check-ins, poll votes, or challenge joins in 30 days." />
              <MilestonesWidget milestones={milestones} avatarMap={avatarMap} label="Client Milestones" />
            </>
          ) : (
            <>
              <WhatToPostPanel allPosts={allPosts} polls={polls} challenges={challenges} events={events} now={now} openModal={openModal} />

              {/* Engagement score */}
              <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', flexShrink: 0 }}>
                <Shimmer />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Engagement Score</div>
                  <Zap style={{ width: 14, height: 14, color: T.amber }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: T.text1, letterSpacing: '-0.05em', lineHeight: 1 }}>{engagementScore}</span>
                  <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>total interactions</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <StatTag val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"         color={T.red}    />
                  <StatTag val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"      color={T.blue}   />
                  <StatTag val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes"    color={T.purple} />
                  <StatTag val={totalChalPart}                                                label="In challenge"  color={T.amber}  />
                </div>
              </div>

              <EngagementTrendWidget allPosts={allPosts} polls={polls} now={now} />
              <CommunityActivityWidget allPosts={allPosts} now={now} />
              <ContentPerformanceWidget allPosts={allPosts} openModal={openModal} />
              <ChallengeCompletionWidget challenges={challenges} allMemberships={allMemberships} now={now} />
              <MemberEngagementLeaderboard allPosts={allPosts} avatarMap={avatarMap} />

              {/* Posting cadence */}
              <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Posting Cadence</div>
                  <TrendingUp style={{ width: 13, height: 13, color: T.blue }} />
                </div>
                <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'flex-end', marginBottom: 6 }}>
                  {cadenceData.map((d, i) => (
                    <div key={i} style={{ flex: 1 }}>
                      <div style={{ width: '100%', height: d.count === 0 ? 3 : Math.max(6, (d.count / cadenceMax) * 32), borderRadius: 3, background: d.count === 0 ? T.divider : `linear-gradient(180deg,${T.blue},#0284c7)`, transition: 'height 0.4s ease' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {cadenceData.map((d, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: T.text3 }}>{d.label}</div>)}
                </div>
                <div style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>
                  {cadenceData.filter(d => d.count > 0).length} active days this week
                  {cadenceData.filter(d => d.count > 0).length < 3 && (
                    <span style={{ color: T.amber, marginLeft: 6, fontWeight: 700 }}>— post more often</span>
                  )}
                </div>
              </div>

              {/* Content mix */}
              {contentMix && (
                <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 12 }}>Content Mix</div>
                  <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 12 }}>
                    {contentMix.filter(c => c.pct > 0).map((c, i) => (
                      <div key={i} style={{ width: `${c.pct}%`, background: c.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {contentMix.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text2 }}>{c.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: T.text1 }}>{c.count}</span>
                        <span style={{ fontSize: 10, color: T.text3, width: 28, textAlign: 'right' }}>{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Poll participation */}
              {pollParticipationRate !== null && (
                <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Poll Participation</div>
                    <BarChart2 style={{ width: 13, height: 13, color: T.purple }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: pollParticipationRate >= 50 ? T.green : pollParticipationRate >= 25 ? T.amber : T.red, letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {pollParticipationRate}%
                    </span>
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>of members voting</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${pollParticipationRate}%`, borderRadius: 99, background: pollParticipationRate >= 50 ? `linear-gradient(90deg,${T.green},#34d399)` : pollParticipationRate >= 25 ? `linear-gradient(90deg,#d97706,${T.amber})` : `linear-gradient(90deg,${T.red},#f87171)`, transition: 'width 0.8s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: T.text3, margin: 0, fontWeight: 500 }}>
                    {pollParticipationRate < 25 ? 'Low — try shorter, punchier polls' : pollParticipationRate < 50 ? 'Decent — pin polls to your feed' : 'Great engagement on polls!'}
                  </p>
                </div>
              )}

              <UnreachedMembers members={unreachedMembers} avatarMap={avatarMap} openModal={openModal} />

              {/* Content stats */}
              <div style={{ padding: 16, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4 }}>Content Stats</div>
                <StatRow label="Upcoming Events"        value={upcomingEvents.length}   color={T.green}  onClick={() => {}} />
                <StatRow label="Challenge Participants" value={totalChalPart}            color={T.amber}  onClick={() => {}} />
                <StatRow label="Active Polls"           value={polls.length}            color={T.purple} onClick={() => {}} last />
              </div>

              <MilestonesWidget milestones={milestones} avatarMap={avatarMap} />
            </>
          )}
        </div>
      </div>
    </>
  );
}