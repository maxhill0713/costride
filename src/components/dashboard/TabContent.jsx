import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays, getDay } from 'date-fns';
import {
  Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Zap, Heart, MessageCircle, Dumbbell,
  MoreHorizontal, Trash2, Sparkles, CheckCircle, Eye, Clock, Plus,
  AlertTriangle,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';
import PostCard from '../feed/PostCard';
import GymChallengeCard from '../challenges/GymChallengeCard';

/* ══════════════════════════════════════════════════════════════════
   DESIGN TOKENS — exact match to TabOverview
══════════════════════════════════════════════════════════════════ */
const C = {
  bg:        '#080e18',
  surface:   '#0c1422',
  surfaceEl: '#101929',

  border:   'rgba(255,255,255,0.07)',
  borderEl: 'rgba(255,255,255,0.12)',
  divider:  'rgba(255,255,255,0.04)',

  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#2d3f55',

  accent:    '#3b82f6',
  accentSub: 'rgba(59,130,246,0.12)',
  accentBrd: 'rgba(59,130,246,0.24)',

  danger:    '#ef4444',
  dangerSub: 'rgba(239,68,68,0.10)',
  dangerBrd: 'rgba(239,68,68,0.22)',

  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.10)',
  successBrd: 'rgba(16,185,129,0.22)',

  warn:    '#f59e0b',
  warnSub: 'rgba(245,158,11,0.10)',
  warnBrd: 'rgba(245,158,11,0.22)',

  purple:    '#8b5cf6',
  purpleSub: 'rgba(139,92,246,0.12)',
  purpleBrd: 'rgba(139,92,246,0.28)',
};

/* ── Shared card shadow + radius — exact match to TabOverview ───── */
const CARD_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)';
const CARD_RADIUS = 14;

/* ── Responsive CSS ──────────────────────────────────────────────── */
const MOBILE_CSS = `
  .tc-root { display: grid; grid-template-columns: minmax(0,1fr) clamp(260px,22%,300px); gap: 16px; }
  .tc-left  { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0; }
  .tc-tabs  { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 14px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0; }
  .tc-tabs::-webkit-scrollbar { display: none; }
  .tc-tab-btn { padding: 8px 16px; font-size: 12px; font-family: inherit; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
  .tc-feed  { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
  .tc-feed::-webkit-scrollbar { width: 4px; }
  .tc-feed::-webkit-scrollbar-track { background: transparent; }
  .tc-feed::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  .tc-feed::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
  .tc-sidebar { display: flex; flex-direction: column; gap: 12px; min-width: 260px; }
  @media (max-width: 900px) {
    .tc-root    { grid-template-columns: 1fr !important; }
    .tc-left    { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tc-feed    { overflow: visible !important; min-height: unset !important; flex: unset !important; }
    .tc-sidebar { height: auto !important; overflow: visible !important; min-width: unset !important; }
    .tc-tab-btn { padding: 7px 12px !important; font-size: 11px !important; }
  }
`;

/* ══════════════════════════════════════════════════════════════════
   CARD PRIMITIVES — mirrored from TabOverview style system
══════════════════════════════════════════════════════════════════ */
function Card({ children, style = {}, accentColor }) {
  return (
    <div style={{
      background:   C.surface,
      border:       `1px solid ${accentColor ? `${accentColor}28` : C.border}`,
      borderRadius: CARD_RADIUS,
      boxShadow:    CARD_SHADOW,
      overflow:     'hidden',
      position:     'relative',
      flexShrink:   0,
      ...style,
    }}>
      {accentColor && (
        <div style={{
          position:      'absolute',
          top:           0,
          left:          0,
          right:         0,
          height:        1.5,
          background:    `linear-gradient(90deg,${accentColor}60 0%,${accentColor}18 60%,transparent 100%)`,
          pointerEvents: 'none',
        }} />
      )}
      {children}
    </div>
  );
}

function CardBody({ children, style = {} }) {
  return <div style={{ padding: 18, ...style }}>{children}</div>;
}

function CardHeader({ title, sub, right }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     sub ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      marginBottom:   14,
    }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.04em', textTransform: 'uppercase' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* ── Small reusable atoms ───────────────────────────────────────── */
function Pill({ label, color }) {
  return (
    <span style={{
      fontSize:     9.5,
      fontWeight:   700,
      color,
      background:   `${color}12`,
      border:       `1px solid ${color}28`,
      borderRadius: 5,
      padding:      '2px 7px',
      flexShrink:   0,
    }}>
      {label}
    </span>
  );
}

function Chip({ val, label, color }) {
  return (
    <div style={{
      fontSize:     10,
      fontWeight:   700,
      padding:      '3px 8px',
      borderRadius: 6,
      background:   `${color}10`,
      border:       `1px solid ${color}20`,
      color,
    }}>
      {val} {label}
    </div>
  );
}

function IconBadge({ icon: Icon, color, size = 26 }) {
  return (
    <div style={{
      width:           size,
      height:          size,
      borderRadius:    7,
      background:      C.surfaceEl,
      border:          `1px solid ${C.border}`,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      flexShrink:      0,
    }}>
      <Icon style={{ width: size * 0.46, height: size * 0.46, color }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT NUDGE — 2px left border is only color (matches TabOverview)
══════════════════════════════════════════════════════════════════ */
function StatNudge({ color = C.accent, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      marginTop:    12,
      display:      'flex',
      alignItems:   'flex-start',
      gap:          9,
      padding:      '9px 11px',
      borderRadius: 8,
      background:   C.surfaceEl,
      border:       `1px solid ${C.border}`,
      borderLeft:   `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={e => { e.stopPropagation(); onAction(); }}
          style={{
            flexShrink:  0,
            fontSize:    10,
            fontWeight:  600,
            color,
            background:  'transparent',
            border:      'none',
            cursor:      'pointer',
            fontFamily:  'inherit',
            whiteSpace:  'nowrap',
            display:     'flex',
            alignItems:  'center',
            gap:         2,
            padding:     0,
          }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   3-DOT DELETE MENU
══════════════════════════════════════════════════════════════════ */
function DeleteBtn({ onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          width:           24,
          height:          24,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          background:      C.surfaceEl,
          border:          `1px solid ${C.border}`,
          borderRadius:    6,
          cursor:          'pointer',
        }}>
        <MoreHorizontal style={{ width: 12, height: 12, color: C.t3 }} />
      </button>
      {open && (
        <div style={{
          position:     'absolute',
          top:          28,
          right:        0,
          zIndex:       9999,
          background:   '#0d1528',
          border:       `1px solid ${C.borderEl}`,
          borderRadius: 10,
          boxShadow:    '0 8px 24px rgba(0,0,0,0.6)',
          minWidth:     110,
          overflow:     'hidden',
        }}>
          <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{
              width:      '100%',
              display:    'flex',
              alignItems: 'center',
              gap:        8,
              padding:    '9px 14px',
              fontSize:   12,
              fontWeight: 700,
              color:      C.danger,
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              textAlign:  'left',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.dangerSub}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Trash2 style={{ width: 12, height: 12 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function getEngagementRate(post, totalMembers) {
  const interactions = (post.likes?.length || 0) + (post.comments?.length || 0);
  if (!totalMembers) return null;
  return Math.round((interactions / totalMembers) * 100);
}

/* ══════════════════════════════════════════════════════════════════
   FEED CARDS — card shell matches TabOverview exactly
══════════════════════════════════════════════════════════════════ */
function FeedCard({ post, onDelete, isTopPerformer, totalMembers }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const content  = post.content || post.title || '';
  const engRate  = getEngagementRate(post, totalMembers);
  const seenBy   = post.view_count || post.member_views?.length || Math.max((likes + comments) * 3, 0);

  return (
    <Card accentColor={isTopPerformer ? C.success : null}>
      {isTopPerformer && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <Pill label="Top post" color={C.success} />
        </div>
      )}
      <CardBody style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={post.author_name || post.gym_name || 'G'} size={26} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'Gym Post'}
          </span>
          <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>
            {post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}
          </span>
          <DeleteBtn onDelete={() => onDelete(post.id)} />
        </div>
      </CardBody>

      {content && (
        <CardBody style={{ padding: '10px 14px 12px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.t1, margin: 0, lineHeight: 1.4 }}>
            {post.title || content.split('\n')[0]}
          </p>
          {post.title && content !== post.title && (
            <p style={{ fontSize: 12, color: C.t2, margin: '5px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {content}
            </p>
          )}
        </CardBody>
      )}

      {(post.image_url || post.media_url) && (
        <div style={{ overflow: 'hidden', margin: '0 14px 12px', borderRadius: 9 }}>
          <img src={post.image_url || post.media_url} alt=""
            style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }}
            onError={e => e.currentTarget.parentElement.style.display = 'none'} />
        </div>
      )}

      <div style={{ padding: '8px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${C.divider}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: likes > 0 ? C.danger : C.t3 }}>
          <Heart style={{ width: 11, height: 11 }} /> {likes}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: comments > 0 ? C.success : C.t3 }}>
          <MessageCircle style={{ width: 11, height: 11 }} /> {comments}
        </span>
        {seenBy > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.t3 }}>
            <Eye style={{ width: 10, height: 10 }} /> {seenBy}
          </span>
        )}
        {engRate !== null && engRate > 0 && (
          <span style={{
            marginLeft:   'auto',
            fontSize:     10,
            fontWeight:   700,
            color:        engRate >= 20 ? C.success : engRate >= 10 ? C.accent : C.t3,
            background:   C.surfaceEl,
            border:       `1px solid ${C.borderEl}`,
            borderRadius: 5,
            padding:      '2px 6px',
          }}>
            {engRate}% engaged
          </span>
        )}
      </div>
    </Card>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff   = Math.floor((evDate - now) / 86400000);
  return (
    <Card accentColor={C.success}>
      <CardBody style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={Calendar} color={C.success} />
          <Pill label="Event" color={C.success} />
          <Pill label={diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`} color={diff <= 2 ? C.danger : C.success} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.t1, margin: '0 0 5px', lineHeight: 1.3 }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 11, color: C.t2, margin: '0 0 8px', lineHeight: 1.5 }}>{event.description}</p>}
        <div style={{ fontSize: 10, color: C.t3, fontWeight: 500 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </CardBody>
    </Card>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start     = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD    = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed   = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalD - elapsed);
  const pct       = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts     = challenge.participants?.length || 0;
  const progressColor = pct >= 75 ? C.warn : C.accent;

  return (
    <Card accentColor={C.accent}>
      <CardBody style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={Trophy} color={C.warn} />
          <Pill label="Challenge" color={C.accent} />
          <Pill label={`${remaining}d left`} color={remaining <= 3 ? C.danger : C.t3} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.t1, margin: '0 0 10px', lineHeight: 1.3 }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 11, color: C.t3 }}>{parts} joined</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: progressColor }}>{pct}% complete</span>
        </div>
        <div style={{ height: 2.5, borderRadius: 99, background: C.divider, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: progressColor, transition: 'width 0.8s ease' }} />
        </div>
      </CardBody>
    </Card>
  );
}

const CLASS_CFG = {
  hiit:     { color: C.danger,  label: 'HIIT'     },
  yoga:     { color: C.success, label: 'Yoga'     },
  strength: { color: C.accent,  label: 'Strength' },
  cardio:   { color: C.warn,    label: 'Cardio'   },
  spin:     { color: C.accent,  label: 'Spin'     },
  boxing:   { color: C.danger,  label: 'Boxing'   },
  pilates:  { color: C.success, label: 'Pilates'  },
  default:  { color: C.accent,  label: 'Class'    },
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
  if (n.includes('hiit') || n.includes('interval'))                        return 'hiit';
  if (n.includes('yoga') || n.includes('flow') || n.includes('vinyasa'))   return 'yoga';
  if (n.includes('strength') || n.includes('lift') || n.includes('weight')) return 'strength';
  if (n.includes('cardio') || n.includes('run') || n.includes('aerobic'))  return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike'))     return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox'))     return 'boxing';
  if (n.includes('pilates') || n.includes('barre'))                        return 'pilates';
  return 'default';
}

function ClassCard({ gymClass, onDelete }) {
  const type = getClassType(gymClass);
  const cfg  = CLASS_CFG[type];
  const img  = gymClass.image_url || CLASS_IMGS[type];
  const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card>
      <div style={{ position: 'relative', height: 90, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05),${C.surface}d8)` }} />
        <div style={{
          position:        'absolute',
          top:             8,
          left:            8,
          fontSize:        9,
          fontWeight:      800,
          letterSpacing:   '0.07em',
          textTransform:   'uppercase',
          color:           cfg.color,
          background:      'rgba(0,0,0,0.55)',
          border:          `1px solid ${cfg.color}40`,
          borderRadius:    5,
          padding:         '2px 7px',
          backdropFilter:  'blur(6px)',
        }}>
          {cfg.label}
        </div>
      </div>
      <CardBody style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gymClass.name || gymClass.title}
          </div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)} />
        </div>
        {gymClass.duration_minutes && (
          <div style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>{gymClass.duration_minutes} min</div>
        )}
        {gymClass.description && (
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {gymClass.description}
          </div>
        )}
        {(gymClass.instructor || gymClass.coach_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{
              width:           20,
              height:          20,
              borderRadius:    '50%',
              background:      C.surfaceEl,
              border:          `1px solid ${C.border}`,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        8,
              fontWeight:      800,
              color:           cfg.color,
              flexShrink:      0,
            }}>
              {initials(gymClass.instructor || gymClass.coach_name)}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.t2 }}>{gymClass.instructor || gymClass.coach_name}</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PollCard({ poll, onDelete, allMemberships }) {
  const votes   = poll.voters?.length || 0;
  const total   = allMemberships?.length || 0;
  const partPct = total > 0 ? Math.round((votes / total) * 100) : 0;
  const color   = partPct >= 50 ? C.success : C.accent;

  return (
    <Card accentColor={C.accent}>
      <CardBody style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={BarChart2} color={C.accent} />
          <Pill label="Poll" color={C.accent} />
          {partPct > 0 && <Pill label={`${partPct}% voted`} color={color} />}
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.t1, margin: '0 0 10px', lineHeight: 1.3 }}>{poll.title}</p>
        <div style={{ height: 2.5, borderRadius: 99, background: C.divider, overflow: 'hidden', marginBottom: 7 }}>
          <div style={{ height: '100%', width: `${partPct}%`, borderRadius: 99, background: color, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>
          {votes} {votes === 1 ? 'vote' : 'votes'}{total > 0 ? ` of ${total} members` : ''}
        </div>
      </CardBody>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BEST POST TIME HOOK
══════════════════════════════════════════════════════════════════ */
function useBestPostTime(allPosts) {
  return useMemo(() => {
    const dayStats = Array(7).fill(null).map(() => ({ posts: 0, interactions: 0 }));
    allPosts.forEach(p => {
      const day = getDay(new Date(p.created_date || Date.now()));
      dayStats[day].posts++;
      dayStats[day].interactions += (p.likes?.length || 0) + (p.comments?.length || 0);
    });
    const FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDay = -1, bestRate = -1;
    dayStats.forEach((s, i) => {
      if (s.posts === 0) return;
      const rate = s.interactions / s.posts;
      if (rate > bestRate) { bestRate = rate; bestDay = i; }
    });
    return {
      bestDay,
      bestDayName:  bestDay >= 0 ? FULL_NAMES[bestDay] : null,
      isTodayBest:  bestDay === new Date().getDay(),
    };
  }, [allPosts]);
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR CARDS — all use TabOverview card shell
══════════════════════════════════════════════════════════════════ */
function ContentSuggestions({ allPosts, polls, challenges, events, now, openModal }) {
  const { bestDayName, isTodayBest } = useBestPostTime(allPosts);
  const dayName = format(now, 'EEEE');

  const suggestions = useMemo(() => {
    const items = [];
    const days  = allPosts.length > 0 ? differenceInDays(now, new Date(allPosts[0]?.created_date || now)) : 999;
    if (days >= 3) {
      const label = isTodayBest
        ? `No post in ${days} days — ${dayName} is your best engagement day`
        : bestDayName
          ? `No post in ${days} days (best: ${bestDayName})`
          : `No post in ${days} days — keep your feed active`;
      items.push({ color: C.accent, icon: MessageSquarePlus, label, action: 'Post now', fn: () => openModal('post') });
    }
    if (!polls.filter(p => !p.ended_at).length)
      items.push({ color: C.accent, icon: BarChart2, label: 'No active poll — polls drive more replies than standard posts', action: 'Create', fn: () => openModal('poll') });
    if (!challenges.find(c => c.status === 'active'))
      items.push({ color: C.warn, icon: Trophy, label: 'No active challenge — challenges drive more consistent attendance', action: 'Start one', fn: () => openModal('challenge') });
    if (!events.find(e => new Date(e.event_date) >= now))
      items.push({ color: C.success, icon: Calendar, label: 'No upcoming events — give members something to look forward to', action: 'Add event', fn: () => openModal('event') });
    return items.slice(0, 3);
  }, [allPosts, polls, challenges, events, now, bestDayName, isTodayBest, dayName]);

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: suggestions.length ? 14 : 12 }}>
        <IconBadge icon={Sparkles} color={C.accent} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em' }}>Content Suggestions</span>
      </div>

      {!suggestions.length ? (
        <div style={{
          display:    'flex',
          alignItems: 'flex-start',
          gap:        9,
          padding:    '9px 11px',
          borderRadius: 8,
          background: C.surfaceEl,
          border:     `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.success}`,
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Content is up to date.</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Keep the cadence going.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={s.fn} style={{
              display:     'flex',
              alignItems:  'center',
              gap:         9,
              padding:     '9px 10px',
              borderRadius: 9,
              background:  C.surfaceEl,
              border:      `1px solid ${C.border}`,
              borderLeft:  `3px solid ${s.color}`,
              cursor:      'pointer',
              transition:  'background .12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(255,255,255,0.03)`}
              onMouseLeave={e => e.currentTarget.style.background = C.surfaceEl}>
              <s.icon style={{ width: 12, height: 12, color: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: C.t2, lineHeight: 1.4 }}>{s.label}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: s.color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                {s.action} <ChevronRight style={{ width: 9, height: 9 }} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BestTimeToPost({ allPosts, now, openModal }) {
  const { bestDayName, isTodayBest } = useBestPostTime(allPosts);
  const hour       = now.getHours();
  const todayName  = format(now, 'EEEE');
  const peakWindow = hour < 12
    ? 'Members engage most in the evening — 6–8pm is worth targeting'
    : hour < 17
      ? 'Evening is the most active window — worth posting before 8pm'
      : 'This is typically peak engagement for gym communities';

  if (!bestDayName && allPosts.length < 3) return null;

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconBadge icon={Clock} color={C.accent} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em' }}>Best Time to Post</span>
      </div>

      {bestDayName && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          9,
          padding:      '9px 11px',
          borderRadius: 9,
          marginBottom: 8,
          background:   C.surfaceEl,
          border:       `1px solid ${C.border}`,
          borderLeft:   `3px solid ${isTodayBest ? C.success : C.accent}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isTodayBest ? C.success : C.accent, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: C.t2, lineHeight: 1.4 }}>
            {isTodayBest
              ? <><span style={{ fontWeight: 700, color: C.t1 }}>{todayName}</span> is your best engagement day</>
              : <>Best engagement on <span style={{ fontWeight: 700, color: C.t1 }}>{bestDayName}</span></>
            }
          </span>
        </div>
      )}

      <div style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          9,
        padding:      '9px 11px',
        borderRadius: 9,
        background:   C.surfaceEl,
        border:       `1px solid ${C.border}`,
        marginBottom: 12,
      }}>
        <Eye style={{ width: 11, height: 11, color: C.t3, flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.4 }}>{peakWindow}</span>
      </div>

      <button onClick={() => openModal('post')} style={{
        width:           '100%',
        padding:         '7px 12px',
        borderRadius:    8,
        background:      C.surfaceEl,
        border:          `1px solid ${C.borderEl}`,
        color:           C.t1,
        fontSize:        11,
        fontWeight:      600,
        cursor:          'pointer',
        fontFamily:      'inherit',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             6,
        transition:      'border-color .12s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = `${C.accent}60`}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.borderEl}>
        <Plus style={{ width: 11, height: 11 }} /> Write a post
      </button>
    </div>
  );
}

function EngagementScoreCard({ allPosts, polls, activeChallenges, events, totalChalPart }) {
  const score = useMemo(() =>
    allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
    + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)
    + activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0)
    + events.reduce((s, e) => s + (e.attendees || 0), 0)
  , [allPosts, polls, activeChallenges, events]);

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em' }}>Engagement Score</span>
        <IconBadge icon={Zap} color={C.accent} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 12, color: C.t3, fontWeight: 400 }}>total interactions</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"        color={C.danger}  />
        <Chip val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"     color={C.success} />
        <Chip val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes"   color={C.accent}  />
        <Chip val={totalChalPart}                                                label="In challenge" color={C.warn}    />
      </div>
    </div>
  );
}

function EngagementTrend({ allPosts, polls, now }) {
  const { thisWeek, lastWeek, change } = useMemo(() => {
    const ws = subDays(now, 7), ps = subDays(now, 14);
    const score = (s, e) => {
      const p = allPosts.filter(x => { const d = new Date(x.created_date); return d >= s && d < e; });
      return p.reduce((a, x) => a + (x.likes?.length || 0) + (x.comments?.length || 0), 0)
           + polls.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; }).reduce((a, x) => a + (x.voters?.length || 0), 0);
    };
    const tw = score(ws, now), lw = score(ps, ws);
    return { thisWeek: tw, lastWeek: lw, change: lw === 0 ? 0 : Math.round(((tw - lw) / lw) * 100) };
  }, [allPosts, polls, now]);

  const up = change >= 0;

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em' }}>Engagement Trend</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {up
            ? <TrendingUp   style={{ width: 11, height: 11, color: C.success }} />
            : <TrendingDown style={{ width: 11, height: 11, color: C.danger  }} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: up ? C.success : C.danger, letterSpacing: '-0.02em' }}>
            {up ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>Week over week</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'This week', val: thisWeek, color: up ? C.success : C.danger },
          { label: 'Last week', val: lastWeek, color: C.t3 },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.04em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {change < 0 && (
        <StatNudge color={C.danger} icon={TrendingDown}
          stat="Engagement dropped this week."
          detail={thisWeek === 0
            ? 'No interactions — try a poll or question to invite a response.'
            : `Down from ${lastWeek} to ${thisWeek}. A new poll or challenge can re-engage members.`} />
      )}
      {change > 20 && thisWeek > 3 && (
        <StatNudge color={C.success} icon={TrendingUp}
          stat="Strong week."
          detail="Consistent posting is the most reliable way to maintain momentum." />
      )}
    </div>
  );
}

function ActivityChart({ allPosts, now }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const s   = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const e   = new Date(s.getTime() + 86400000);
    const p   = allPosts.filter(x => { const d = new Date(x.created_date); return d >= s && d < e; });
    return { label: format(day, 'EEE'), posts: p.length, likes: p.reduce((a, x) => a + (x.likes?.length || 0), 0), comments: p.reduce((a, x) => a + (x.comments?.length || 0), 0) };
  }).map(d => ({ ...d, total: d.posts + d.likes + d.comments })), [allPosts, now]);

  const maxV = Math.max(...days.map(d => d.total), 1);
  const sum  = days.reduce((a, d) => a + d.total, 0);

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em' }}>Community Activity</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: C.t1, letterSpacing: '-0.04em' }}>{sum}</span>
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>Posts, likes & comments</div>

      <div style={{ display: 'flex', gap: 4, height: 36, alignItems: 'flex-end', marginBottom: 6 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 32, gap: 1 }}>
            {d.total === 0
              ? <div style={{ height: 3, borderRadius: 2, background: C.divider }} />
              : <>
                  {d.comments > 0 && <div style={{ height: Math.max(3, (d.comments / maxV) * 28), borderRadius: 2, background: C.success, opacity: 0.85 }} />}
                  {d.likes    > 0 && <div style={{ height: Math.max(3, (d.likes    / maxV) * 28), borderRadius: 2, background: C.danger,  opacity: 0.85 }} />}
                  {d.posts    > 0 && <div style={{ height: Math.max(3, (d.posts    / maxV) * 28), borderRadius: 2, background: C.accent,  opacity: 0.85 }} />}
                </>
            }
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: C.t3 }}>{d.label}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
        {[{ color: C.accent, label: 'Posts' }, { color: C.danger, label: 'Likes' }, { color: C.success, label: 'Comments' }].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: C.t3 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {sum === 0 && (
        <StatNudge color={C.accent} icon={MessageSquarePlus}
          stat="No activity in the last 7 days."
          detail="Publishing a post now will start filling this chart." />
      )}
    </div>
  );
}

function TopPostsCard({ allPosts, openModal }) {
  const top3 = useMemo(() =>
    [...allPosts]
      .map(p => ({ ...p, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(p => p.score > 0)
  , [allPosts]);

  if (!top3.length) return null;

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Top Posts</div>
        <div style={{ fontSize: 11, color: C.t3 }}>Most engagement this period</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {top3.map((p, i) => (
          <div key={p.id || i} style={{
            display:     'flex',
            alignItems:  'center',
            gap:         8,
            padding:     '8px 10px',
            borderRadius: 8,
            background:  C.surfaceEl,
            border:      `1px solid ${C.border}`,
            borderLeft:  `3px solid ${C.success}`,
          }}>
            <div style={{
              width:           18,
              height:          18,
              borderRadius:    5,
              background:      C.successSub,
              border:          `1px solid ${C.successBrd}`,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        9,
              fontWeight:      800,
              color:           C.success,
              flexShrink:      0,
            }}>
              {i + 1}
            </div>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(p.title || p.content || '').split('\n')[0].slice(0, 38) || 'Post'}
            </span>
            <span style={{ fontSize: 10, color: C.danger,  flexShrink: 0 }}>{p.likes?.length    || 0} lk</span>
            <span style={{ fontSize: 10, color: C.success, flexShrink: 0 }}>{p.comments?.length || 0} cmt</span>
          </div>
        ))}
      </div>

      {(() => {
        const best     = top3[0];
        const comments = best.comments?.length || 0;
        const likes    = best.likes?.length    || 0;
        const hasImage = !!(best.image_url || best.media_url);
        if (comments > likes && comments > 2)
          return <StatNudge color={C.success} icon={CheckCircle} stat={`Top post got ${comments} comments.`} detail="Posts that invite a response drive the most conversation — repeat this format." />;
        if (hasImage && likes > 2)
          return <StatNudge color={C.success} icon={CheckCircle} stat="Top post included an image." detail="Visual posts tend to catch more attention in the feed." />;
        if (likes > 0 || comments > 0)
          return <StatNudge color={C.accent} icon={TrendingUp} stat="" detail="Look at what made your top post work — format, topic, or timing — and repeat it." />;
        return null;
      })()}
    </div>
  );
}

function ContentStatsCard({ allPosts, events, polls, challenges, now }) {
  const cadence = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const s   = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const e   = new Date(s.getTime() + 86400000);
    return { label: format(day, 'EEE'), count: allPosts.filter(p => { const d = new Date(p.created_date); return d >= s && d < e; }).length };
  }), [allPosts, now]);

  const cadenceMax = Math.max(...cadence.map(d => d.count), 1);
  const activeDays = cadence.filter(d => d.count > 0).length;

  const mix = useMemo(() => {
    const tot = allPosts.length + events.length + polls.length + challenges.length;
    if (!tot) return null;
    return [
      { label: 'Posts',      count: allPosts.length,   color: C.accent   },
      { label: 'Events',     count: events.length,     color: C.success  },
      { label: 'Polls',      count: polls.length,      color: C.accent   },
      { label: 'Challenges', count: challenges.length, color: C.warn     },
    ].filter(c => c.count > 0);
  }, [allPosts, events, polls, challenges]);

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Posting Cadence</div>
          <div style={{ fontSize: 11, color: C.t3 }}>Last 7 days</div>
        </div>
        <TrendingUp style={{ width: 12, height: 12, color: C.t3 }} />
      </div>

      <div style={{ display: 'flex', gap: 4, height: 32, alignItems: 'flex-end', marginBottom: 6 }}>
        {cadence.map((d, i) => (
          <div key={i} style={{
            flex:        1,
            height:      d.count === 0 ? 3 : Math.max(4, (d.count / cadenceMax) * 28),
            borderRadius: 3,
            background:  d.count === 0 ? C.divider : C.accent,
            opacity:     d.count === 0 ? 1 : 0.75,
            transition:  'height 0.4s ease',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {cadence.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: C.t3 }}>{d.label}</div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>
        {activeDays} active {activeDays === 1 ? 'day' : 'days'} this week
        {activeDays === 0                  && <span style={{ color: C.danger,  marginLeft: 6, fontWeight: 700 }}>— no posts this week</span>}
        {activeDays >= 1 && activeDays < 3 && <span style={{ color: C.warn,   marginLeft: 6, fontWeight: 700 }}>— spread posts across more days</span>}
        {activeDays >= 3                   && <span style={{ color: C.success, marginLeft: 6, fontWeight: 700 }}>— good consistency</span>}
      </div>

      {activeDays === 0 && (
        <StatNudge color={C.warn} icon={AlertTriangle}
          stat="" detail="Nothing posted this week. Even a short update keeps the community alive." />
      )}

      {mix && (
        <>
          <div style={{ height: 1, background: C.divider, margin: '14px 0' }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 8 }}>Content Mix</div>
          <div style={{ display: 'flex', height: 3.5, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 12 }}>
            {mix.map((c, i) => {
              const tot = mix.reduce((s, x) => s + x.count, 0);
              return <div key={i} style={{ width: `${Math.round((c.count / tot) * 100)}%`, background: c.color, borderRadius: 99 }} />;
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {mix.map((c, i) => {
              const tot = mix.reduce((s, x) => s + x.count, 0);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < mix.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: C.t2 }}>{c.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{c.count}</span>
                  <span style={{ fontSize: 10, color: C.t3, width: 28, textAlign: 'right' }}>{Math.round((c.count / tot) * 100)}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COACH SIDEBAR
══════════════════════════════════════════════════════════════════ */
function CoachSidebar({ allPosts, polls, challenges, events, classes, upcomingEvents, activeChallenges, openModal, now }) {
  return (
    <>
      <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em' }}>My Content Impact</span>
          <IconBadge icon={Zap} color={C.accent} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
           + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)}
          </span>
          <span style={{ fontSize: 12, color: C.t3 }}>interactions</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"      color={C.danger}  />
          <Chip val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"   color={C.success} />
          <Chip val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes" color={C.accent}  />
        </div>
      </div>

      <EngagementTrend allPosts={allPosts} polls={polls} now={now} />

      <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 14 }}>My Schedule</div>
        {[
          { label: 'My Classes',        value: classes.length,          color: C.accent  },
          { label: 'Upcoming Events',   value: upcomingEvents.length,   color: C.success },
          { label: 'Active Challenges', value: activeChallenges.length, color: C.warn    },
          { label: 'Active Polls',      value: polls.length,            color: C.accent  },
        ].map((s, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <BestTimeToPost allPosts={allPosts} now={now} openModal={openModal} />
      <ContentSuggestions allPosts={allPosts} polls={polls} challenges={challenges} events={events} now={now} openModal={openModal} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function TabContent({
  events, challenges, polls, posts, userPosts = [], checkIns, ci30, avatarMap,
  openModal, now, allMemberships = [], classes = [], currentUser = null,
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
  const totalMembers     = allMemberships.length;

  const postScores = useMemo(() => allPosts.map(p => ({ id: p.id, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 })), [allPosts]);
  const maxScore   = Math.max(...postScores.map(p => p.score), 1);
  const topPostIds = new Set(postScores.filter(p => p.score >= maxScore * 0.7 && p.score > 0).map(p => p.id));

  const FILTERS = isCoach
    ? [{ id: 'classes', label: 'My Classes' }, { id: 'gym', label: 'Posts' }, { id: 'challenges', label: 'Challenges' }, { id: 'polls', label: 'Polls' }, { id: 'events', label: 'Events' }]
    : [{ id: 'gym', label: 'Gym Posts' }, { id: 'members', label: 'Members' }, { id: 'challenges', label: 'Challenges' }, { id: 'classes', label: 'Classes' }, { id: 'polls', label: 'Polls' }];

  const feedItems = useMemo(() => {
    const fi = (() => {
      switch (activeFilter) {
        case 'members':    return { posts: memberPosts,   events: [],             challenges: [],               polls: [],  classes: []  };
        case 'gym':        return { posts: gymPosts,       events: [],             challenges: [],               polls: [],  classes: []  };
        case 'challenges': return { posts: [],             events: [],             challenges: activeChallenges, polls: [],  classes: []  };
        case 'classes':    return { posts: [],             events: [],             challenges: [],               polls: [],  classes      };
        case 'polls':      return { posts: [],             events: [],             challenges: [],               polls,      classes: []  };
        case 'events':     return { posts: [],             events: upcomingEvents, challenges: [],               polls: [],  classes: []  };
        default:           return { posts: allPosts,       events: upcomingEvents, challenges: activeChallenges, polls,      classes      };
      }
    })();
    return [
      ...fi.posts.map(p      => ({ type: 'post',      data: p, date: new Date(p.created_date || 0) })),
      ...fi.events.map(e     => ({ type: 'event',     data: e, date: new Date(e.event_date    || 0) })),
      ...fi.challenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date    || 0) })),
      ...fi.polls.map(p      => ({ type: 'poll',      data: p, date: new Date(p.created_date  || 0) })),
      ...fi.classes.map(c    => ({ type: 'class',     data: c, date: new Date(c.created_date  || 0) })),
    ].sort((a, b) => b.date - a.date);
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <PostCard key={item.data.id || i} post={item.data} currentUser={currentUser} isOwnProfile={item.data.created_by === currentUser?.id} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => onDeletePost(item.data.id)} fullWidth />;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     onDelete={onDeleteEvent}   now={now} />;
    if (item.type === 'challenge') return <GymChallengeCard key={item.data.id || i} challenge={item.data} isJoined={false} onJoin={null} currentUser={currentUser} isOwner={true} onDelete={id => onDeleteChallenge(id)} gymImageUrl={null} />;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}    allMemberships={allMemberships} />;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  const secondaryActions = isCoach ? [
    { icon: Dumbbell,          label: 'My Classes',    sub: `${classes.length} classes`,         color: C.accent,  fn: () => openModal('classes')   },
    { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`, color: C.success, fn: () => openModal('event')     },
    { icon: Trophy,            label: 'Challenge',     sub: `${activeChallenges.length} active`, color: C.warn,    fn: () => openModal('challenge') },
    { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,            color: C.accent,  fn: () => openModal('poll')      },
  ] : [
    { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`, color: C.success, fn: () => openModal('event')     },
    { icon: Dumbbell,          label: 'Classes',       sub: `${classes.length} total`,           color: C.accent,  fn: () => openModal('classes')   },
    { icon: Trophy,            label: 'New Challenge', sub: `${activeChallenges.length} active`, color: C.warn,    fn: () => openModal('challenge') },
    { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,            color: C.accent,  fn: () => openModal('poll')      },
  ];

  return (
    <>
      <style>{MOBILE_CSS}</style>
      <div className="tc-root">

        {/* ── LEFT ─────────────────────────────────────────────────── */}
        <div className="tc-left">

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 14, flexShrink: 0 }}>
            {/* Primary CTA */}
            <button onClick={() => openModal('post')} style={{
              display:     'flex',
              alignItems:  'center',
              gap:         10,
              padding:     '13px 20px',
              borderRadius: CARD_RADIUS,
              background:  C.accent,
              color:       '#fff',
              border:      'none',
              fontSize:    14,
              fontWeight:  800,
              cursor:      'pointer',
              flexShrink:  0,
              fontFamily:  'inherit',
              boxShadow:   `0 0 0 1px ${C.accentBrd}, 0 4px 14px rgba(59,130,246,0.25)`,
              transition:  'opacity 0.12s',
              position:    'relative',
              overflow:    'hidden',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.10),transparent)', pointerEvents: 'none' }} />
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <div>New Post</div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.72, marginTop: 1 }}>Share with members</div>
              </div>
            </button>

            {/* Secondary actions */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${secondaryActions.length},1fr)`, gap: 8 }}>
              {secondaryActions.map(({ icon: Icon, label, sub, color, fn }, i) => (
                <div key={i} onClick={fn} style={{
                  borderRadius: CARD_RADIUS,
                  padding:      '10px 12px',
                  cursor:       'pointer',
                  background:   C.surface,
                  border:       `1px solid ${C.border}`,
                  boxShadow:    CARD_SHADOW,
                  display:      'flex',
                  flexDirection: 'column',
                  gap:          5,
                  transition:   'all 0.13s',
                  position:     'relative',
                  overflow:     'hidden',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border;      e.currentTarget.style.transform = ''; }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{label}</div>
                  <div style={{ fontSize: 9, color: C.t3, fontWeight: 500 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="tc-tabs" style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.04em', padding: '8px 14px 8px 0', marginBottom: -1, flexShrink: 0 }}>Feed</span>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className="tc-tab-btn" style={{
                fontWeight:   activeFilter === f.id ? 700 : 500,
                color:        activeFilter === f.id ? C.t1 : C.t3,
                borderBottom: `2px solid ${activeFilter === f.id ? C.accent : 'transparent'}`,
                marginBottom: -1,
              }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Scrollable feed */}
          <div className="tc-feed">
            {feedItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 28, paddingRight: 4 }}>
                {feedItems.map(renderItem)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: CARD_RADIUS, background: C.accentSub, border: `1px solid ${C.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquarePlus style={{ width: 18, height: 18, color: C.accent, opacity: 0.6 }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.t2, margin: 0 }}>Nothing here yet</p>
                <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>Create your first post to get the community going</p>
                <button onClick={() => openModal('post')} style={{
                  fontSize: 12, fontWeight: 700, color: '#fff', background: C.accent,
                  border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Create first post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ──────────────────────────────────────────────── */}
        <div className="tc-sidebar">
          {isCoach ? (
            <CoachSidebar
              allPosts={allPosts} polls={polls} challenges={challenges} events={events}
              classes={classes} upcomingEvents={upcomingEvents} activeChallenges={activeChallenges}
              openModal={openModal} now={now}
            />
          ) : (
            <>
              <ContentSuggestions allPosts={allPosts} polls={polls} challenges={challenges} events={events} now={now} openModal={openModal} />
              <EngagementScoreCard allPosts={allPosts} polls={polls} activeChallenges={activeChallenges} events={events} totalChalPart={totalChalPart} />
              <EngagementTrend allPosts={allPosts} polls={polls} now={now} />
              <BestTimeToPost allPosts={allPosts} now={now} openModal={openModal} />
              <ActivityChart allPosts={allPosts} now={now} />
              <TopPostsCard allPosts={allPosts} openModal={openModal} />
              <ContentStatsCard allPosts={allPosts} events={events} polls={polls} challenges={challenges} now={now} />
            </>
          )}
        </div>
      </div>
    </>
  );
}