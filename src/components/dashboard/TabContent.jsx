import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays, getDay } from 'date-fns';
import {
  Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Zap, Heart, MessageCircle, Dumbbell,
  MoreHorizontal, Trash2, Sparkles, CheckCircle, Eye, Clock, Plus,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';
import PostCard from '../feed/PostCard';
import GymChallengeCard from '../challenges/GymChallengeCard';

/* ── Design tokens — matches Engagement + Members tabs ──────────────────── */
const C = {
  bg:        '#080e18',
  surface:   '#0c1422',
  surfaceHi: '#101929',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.12)',
  blue:      '#3b82f6',
  blueDim:   'rgba(59,130,246,0.12)',
  blueBrd:   'rgba(59,130,246,0.24)',
  red:       '#ef4444',
  redDim:    'rgba(239,68,68,0.10)',
  redBrd:    'rgba(239,68,68,0.25)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245,158,11,0.10)',
  amberBrd:  'rgba(245,158,11,0.25)',
  green:     '#10b981',
  greenDim:  'rgba(16,185,129,0.10)',
  greenBrd:  'rgba(16,185,129,0.22)',
  purple:    '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.12)',
  purpleBrd: 'rgba(139,92,246,0.28)',
  t1:        '#f1f5f9',
  t2:        '#94a3b8',
  t3:        '#475569',
  t4:        '#2d3f55',
  divider:   'rgba(255,255,255,0.05)',
};

/* ── Responsive CSS ──────────────────────────────────────────────────────── */
const MOBILE_CSS = `
  .tc-root { display: grid; grid-template-columns: minmax(0,1fr) clamp(260px,22%,300px); gap: 16px; }
  .tc-left  { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0; }
  .tc-tabs  { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 14px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0; }
  .tc-tabs::-webkit-scrollbar { display: none; }
  .tc-tab-btn { padding: 8px 16px; font-size: 12px; font-family: inherit; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
  .tc-feed  { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; }
  .tc-sidebar { display: flex; flex-direction: column; gap: 12px; min-width: 260px; }
  @media (max-width: 900px) {
    .tc-root    { grid-template-columns: 1fr !important; }
    .tc-left    { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tc-feed    { overflow: visible !important; min-height: unset !important; flex: unset !important; }
    .tc-sidebar { height: auto !important; overflow: visible !important; min-width: unset !important; }
    .tc-tab-btn { padding: 7px 12px !important; font-size: 11px !important; }
  }
`;

/* ── Shared primitives ───────────────────────────────────────────────────── */
function Card({ children, style = {}, accentColor }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${accentColor ? `${accentColor}28` : C.border}`,
      borderRadius: 14,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)`,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
      ...style,
    }}>
      {accentColor && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
          background: `linear-gradient(90deg,${accentColor}60 0%,${accentColor}18 60%,transparent 100%)`,
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
    <div style={{ display: 'flex', alignItems: sub ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color,
      background: `${color}12`, border: `1px solid ${color}28`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function Chip({ val, label, color }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      background: `${color}10`, border: `1px solid ${color}20`, color,
    }}>
      {val} {label}
    </div>
  );
}

function IconBadge({ icon: Icon, color, size = 26 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 7,
      background: `${color}14`, border: `1px solid ${color}28`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon style={{ width: size * 0.46, height: size * 0.46, color }} />
    </div>
  );
}

/* ── 3-dot delete menu ───────────────────────────────────────────────────── */
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
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          borderRadius: 6, cursor: 'pointer',
        }}>
        <MoreHorizontal style={{ width: 12, height: 12, color: C.t3 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 28, right: 0, zIndex: 9999,
          background: '#0d1528', border: `1px solid ${C.borderHi}`,
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          minWidth: 110, overflow: 'hidden',
        }}>
          <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', fontSize: 12, fontWeight: 700, color: C.red,
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.redDim}
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

/* ── Feed cards ──────────────────────────────────────────────────────────── */
function FeedCard({ post, onDelete, isTopPerformer, isLowPerformer, totalMembers }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const total    = likes + comments;
  const content  = post.content || post.title || '';
  const engRate  = getEngagementRate(post, totalMembers);
  const seenBy   = post.view_count || post.member_views?.length || Math.max(total * 3, 0);

  return (
    <Card accentColor={isTopPerformer ? C.green : null}>
      {isTopPerformer && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <Pill label="Top post" color={C.green} />
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: likes > 0 ? C.red : C.t3 }}>
          <Heart style={{ width: 11, height: 11 }} /> {likes}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: comments > 0 ? C.green : C.t3 }}>
          <MessageCircle style={{ width: 11, height: 11 }} /> {comments}
        </span>
        {seenBy > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.t3 }}>
            <Eye style={{ width: 10, height: 10 }} /> {seenBy}
          </span>
        )}
        {engRate !== null && engRate > 0 && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            color:      engRate >= 20 ? C.green : engRate >= 10 ? C.blue : C.t3,
            background: engRate >= 20 ? C.greenDim : engRate >= 10 ? C.blueDim : C.divider,
            borderRadius: 5, padding: '2px 6px',
          }}>
            {engRate}% engaged
          </span>
        )}
        {isLowPerformer && total === 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, color: C.t3 }}>No engagement yet</span>
        )}
      </div>
    </Card>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff   = Math.floor((evDate - now) / 86400000);
  return (
    <Card accentColor={C.green}>
      <CardBody style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={Calendar} color={C.green} />
          <Pill label="Event" color={C.green} />
          <Pill label={diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`} color={diff <= 2 ? C.red : C.green} />
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
  const progressColor = pct >= 75 ? C.amber : C.blue;
  return (
    <Card accentColor={C.blue}>
      <CardBody style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={Trophy} color={C.blue} />
          <Pill label="Challenge" color={C.blue} />
          <Pill label={`${remaining}d left`} color={remaining <= 3 ? C.red : C.t3} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.t1, margin: '0 0 10px', lineHeight: 1.3 }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 11, color: C.t3 }}>{parts} joined</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: progressColor }}>{pct}% complete</span>
        </div>
        <div style={{ height: 2.5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: progressColor, transition: 'width 0.8s ease' }} />
        </div>
      </CardBody>
    </Card>
  );
}

const CLASS_CFG = {
  hiit:     { color: C.red,    label: 'HIIT'     },
  yoga:     { color: C.green,  label: 'Yoga'     },
  strength: { color: C.blue,   label: 'Strength' },
  cardio:   { color: C.amber,  label: 'Cardio'   },
  spin:     { color: C.blue,   label: 'Spin'     },
  boxing:   { color: C.red,    label: 'Boxing'   },
  pilates:  { color: C.green,  label: 'Pilates'  },
  default:  { color: C.blue,   label: 'Class'    },
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
  if (n.includes('hiit') || n.includes('interval'))                   return 'hiit';
  if (n.includes('yoga') || n.includes('flow') || n.includes('vinyasa')) return 'yoga';
  if (n.includes('strength') || n.includes('lift') || n.includes('weight')) return 'strength';
  if (n.includes('cardio') || n.includes('run') || n.includes('aerobic'))   return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike'))      return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox'))      return 'boxing';
  if (n.includes('pilates') || n.includes('barre'))                          return 'pilates';
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
        <img src={img} alt={gymClass.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05),${C.surface}d8)` }} />
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
          color: cfg.color, background: 'rgba(0,0,0,0.55)',
          border: `1px solid ${cfg.color}40`, borderRadius: 5, padding: '2px 7px',
          backdropFilter: 'blur(6px)',
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
              width: 20, height: 20, borderRadius: '50%',
              background: `${cfg.color}14`, border: `1px solid ${cfg.color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 800, color: cfg.color, flexShrink: 0,
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
  const color   = partPct >= 50 ? C.green : C.blue;
  return (
    <Card accentColor={C.blue}>
      <CardBody style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={BarChart2} color={C.blue} />
          <Pill label="Poll" color={C.blue} />
          {partPct > 0 && <Pill label={`${partPct}% voted`} color={color} />}
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.t1, margin: '0 0 10px', lineHeight: 1.3 }}>{poll.title}</p>
        <div style={{ height: 2.5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 7 }}>
          <div style={{ height: '100%', width: `${partPct}%`, borderRadius: 99, background: color, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>
          {votes} {votes === 1 ? 'vote' : 'votes'}{total > 0 ? ` of ${total} members` : ''}
        </div>
      </CardBody>
    </Card>
  );
}

/* ── Best post time hook ─────────────────────────────────────────────────── */
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
      bestDayName: bestDay >= 0 ? FULL_NAMES[bestDay] : null,
      isTodayBest: bestDay === new Date().getDay(),
    };
  }, [allPosts]);
}

/* ── Nudge strip ─────────────────────────────────────────────────────────── */
function StatNudge({ color = C.blue, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '9px 11px', borderRadius: 8,
      background: `${color}08`, border: `1px solid ${color}1a`,
    }}>
      {Icon && <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={e => { e.stopPropagation(); onAction(); }}
          style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}28`, borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ── Content suggestions ─────────────────────────────────────────────────── */
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
          ? `No post in ${days} days (best engagement: ${bestDayName})`
          : `No post in ${days} days — keep your feed active`;
      items.push({ color: C.blue, icon: MessageSquarePlus, label, action: 'Post now', fn: () => openModal('post') });
    }
    if (!polls.filter(p => !p.ended_at).length)
      items.push({ color: C.blue, icon: BarChart2, label: 'No active poll — polls tend to generate more replies than standard posts', action: 'Create poll', fn: () => openModal('poll') });
    if (!challenges.find(c => c.status === 'active'))
      items.push({ color: C.amber, icon: Trophy, label: 'No active challenge — challenges drive more consistent attendance', action: 'Start one', fn: () => openModal('challenge') });
    if (!events.find(e => new Date(e.event_date) >= now))
      items.push({ color: C.green, icon: Calendar, label: 'No upcoming events — events give members something to look forward to', action: 'Add event', fn: () => openModal('event') });
    return items.slice(0, 3);
  }, [allPosts, polls, challenges, events, now, bestDayName, isTodayBest, dayName]);

  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: suggestions.length ? 14 : 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: 12, height: 12, color: C.blue }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Content Suggestions</span>
        </div>
        {!suggestions.length ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 11px', borderRadius: 8, background: C.greenDim, border: `1px solid ${C.greenBrd}` }}>
            <CheckCircle style={{ width: 12, height: 12, color: C.green, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>Content is up to date.</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>Active poll, challenge, and recent posts — keep the cadence going.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={s.fn}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, background: `${s.color}08`, border: `1px solid ${s.color}20`, cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${s.color}12`}
                onMouseLeave={e => e.currentTarget.style.background = `${s.color}08`}>
                <s.icon style={{ width: 12, height: 12, color: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: C.t2, lineHeight: 1.4 }}>{s.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, whiteSpace: 'nowrap', padding: '2px 7px', borderRadius: 5, background: `${s.color}14`, flexShrink: 0 }}>
                  {s.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ── Best time to post card ───────────────────────────────────────────────── */
function BestTimeToPost({ allPosts, now, openModal }) {
  const { bestDayName, isTodayBest } = useBestPostTime(allPosts);
  const hour      = now.getHours();
  const todayName = format(now, 'EEEE');
  const peakWindow = hour < 12
    ? 'Members tend to engage more in the evening — 6–8pm is worth targeting'
    : hour < 17
      ? 'Evening is generally the most active window — worth posting before 8pm today'
      : 'This is typically the peak engagement window for gym communities';

  if (!bestDayName && allPosts.length < 3) return null;

  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock style={{ width: 12, height: 12, color: C.blue }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Best Time to Post</span>
        </div>

        {bestDayName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, marginBottom: 8,
            background: isTodayBest ? C.greenDim : C.blueDim,
            border: `1px solid ${isTodayBest ? C.greenBrd : C.blueBrd}`,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isTodayBest ? C.green : C.blue, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: C.t2, lineHeight: 1.4 }}>
              {isTodayBest
                ? <><span style={{ fontWeight: 700, color: C.t1 }}>{todayName}</span> is your best engagement day — post today for maximum reach</>
                : <>Your posts get most engagement on <span style={{ fontWeight: 700, color: C.t1 }}>{bestDayName}</span></>
              }
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <Eye style={{ width: 11, height: 11, color: C.t3, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.4 }}>{peakWindow}</span>
        </div>

        <button onClick={() => openModal('post')}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: C.blueDim, border: `1px solid ${C.blueBrd}`,
            color: C.blue, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.20)'}
          onMouseLeave={e => e.currentTarget.style.background = C.blueDim}>
          <Plus style={{ width: 12, height: 12 }} /> Write a post
        </button>
      </CardBody>
    </Card>
  );
}

/* ── Engagement score ────────────────────────────────────────────────────── */
function EngagementScoreCard({ allPosts, polls, activeChallenges, events, totalChalPart }) {
  const score = useMemo(() =>
    allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
    + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)
    + activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0)
    + events.reduce((s, e) => s + (e.attendees || 0), 0)
  , [allPosts, polls, activeChallenges, events]);

  return (
    <Card>
      <CardBody>
        <CardHeader title="Engagement Score"
          right={<div style={{ width: 26, height: 26, borderRadius: 7, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap style={{ width: 12, height: 12, color: C.blue }} /></div>}
        />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: C.t1, letterSpacing: '-0.05em', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 12, color: C.t3, fontWeight: 500 }}>total interactions</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"        color={C.red}   />
          <Chip val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"     color={C.green} />
          <Chip val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes"   color={C.blue}  />
          <Chip val={totalChalPart}                                                label="In challenge" color={C.amber} />
        </div>
      </CardBody>
    </Card>
  );
}

/* ── Engagement trend ────────────────────────────────────────────────────── */
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
    <Card>
      <CardBody>
        <CardHeader title="Engagement Trend" sub="Week over week"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {up
                ? <TrendingUp   style={{ width: 12, height: 12, color: C.green }} />
                : <TrendingDown style={{ width: 12, height: 12, color: C.red   }} />}
              <span style={{ fontSize: 14, fontWeight: 800, color: up ? C.green : C.red, letterSpacing: '-0.02em' }}>
                {up ? '+' : ''}{change}%
              </span>
            </div>
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: change < 0 ? 12 : 0 }}>
          {[
            { label: 'This week', val: thisWeek, color: up ? C.green : C.red },
            { label: 'Last week', val: lastWeek, color: C.t3 },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.04em' }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {change < 0 && (
          <StatNudge color={C.red} icon={TrendingDown}
            stat="Engagement dropped this week."
            detail={thisWeek === 0
              ? 'No interactions at all — try posting something that invites a response, like a poll or a question.'
              : `Down from ${lastWeek} to ${thisWeek} interactions. A new poll or challenge can give members a reason to respond.`}
          />
        )}
        {change > 20 && thisWeek > 3 && (
          <div style={{ marginTop: 10 }}>
            <StatNudge color={C.green} icon={TrendingUp}
              stat="Strong week."
              detail="Keep the momentum — consistent posting is the most reliable way to maintain it."
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ── Activity chart ──────────────────────────────────────────────────────── */
function ActivityChart({ allPosts, now }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const s   = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const e   = new Date(s.getTime() + 86400000);
    const p   = allPosts.filter(x => { const d = new Date(x.created_date); return d >= s && d < e; });
    return { label: format(day, 'EEE'), posts: p.length, likes: p.reduce((a, x) => a + (x.likes?.length || 0), 0), comments: p.reduce((a, x) => a + (x.comments?.length || 0), 0), total: 0 };
  }).map(d => ({ ...d, total: d.posts + d.likes + d.comments })), [allPosts, now]);

  const maxV = Math.max(...days.map(d => d.total), 1);
  const sum  = days.reduce((a, d) => a + d.total, 0);
  const up   = days[6].total >= days[0].total;

  return (
    <Card>
      <CardBody>
        <CardHeader title="Community Activity" sub="Posts, likes & comments"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: up ? C.green : C.t2, letterSpacing: '-0.04em' }}>{sum}</span>
              {up ? <TrendingUp style={{ width: 12, height: 12, color: C.green }} /> : <TrendingDown style={{ width: 12, height: 12, color: C.t3 }} />}
            </div>
          }
        />

        <div style={{ display: 'flex', gap: 4, height: 36, alignItems: 'flex-end', marginBottom: 6 }}>
          {days.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 32, gap: 1 }}>
              {d.total === 0
                ? <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
                : <>
                    {d.comments > 0 && <div style={{ height: Math.max(3, (d.comments / maxV) * 28), borderRadius: 2, background: C.green, opacity: 0.85 }} />}
                    {d.likes    > 0 && <div style={{ height: Math.max(3, (d.likes    / maxV) * 28), borderRadius: 2, background: C.red,   opacity: 0.85 }} />}
                    {d.posts    > 0 && <div style={{ height: Math.max(3, (d.posts    / maxV) * 28), borderRadius: 2, background: C.blue,  opacity: 0.85 }} />}
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

        <div style={{ display: 'flex', gap: 12 }}>
          {[{ color: C.blue, label: 'Posts' }, { color: C.red, label: 'Likes' }, { color: C.green, label: 'Comments' }].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: C.t3 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {sum === 0 && (
          <div style={{ marginTop: 12 }}>
            <StatNudge color={C.blue} icon={MessageSquarePlus}
              stat="No activity in the last 7 days."
              detail="Publishing a post now will start filling this chart."
            />
          </div>
        )}
        {sum > 0 && (() => {
          const bestDay     = days.reduce((best, d) => d.total > best.total ? d : best, days[0]);
          const quietDays   = days.filter(d => d.total === 0).length;
          if (quietDays >= 4) return (
            <div style={{ marginTop: 12 }}>
              <StatNudge color={C.amber} icon={TrendingDown}
                stat={`${quietDays} days with no activity.`}
                detail="Posting on quieter days keeps members engaged between high-activity periods."
              />
            </div>
          );
          if (bestDay && bestDay.total > 0) return (
            <div style={{ marginTop: 12 }}>
              <StatNudge color={C.green} icon={TrendingUp}
                stat={`${bestDay.label} was your most active day.`}
                detail={`Try posting on ${bestDay.label}s consistently to build a rhythm members expect.`}
              />
            </div>
          );
          return null;
        })()}
      </CardBody>
    </Card>
  );
}

/* ── Top posts card ──────────────────────────────────────────────────────── */
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
    <Card>
      <CardBody>
        <CardHeader title="Top Posts" sub="Most engagement this period" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {top3.map((p, i) => (
            <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, background: C.greenDim, border: `1px solid ${C.greenBrd}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: C.green, flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(p.title || p.content || '').split('\n')[0].slice(0, 38) || 'Post'}
              </span>
              <span style={{ fontSize: 10, color: C.red,   flexShrink: 0 }}>{p.likes?.length    || 0} lk</span>
              <span style={{ fontSize: 10, color: C.green, flexShrink: 0 }}>{p.comments?.length || 0} cmt</span>
            </div>
          ))}
        </div>

        {(() => {
          const best     = top3[0];
          const likes    = best.likes?.length    || 0;
          const comments = best.comments?.length || 0;
          const hasImage = !!(best.image_url || best.media_url);
          if (comments > likes && comments > 2)
            return <div style={{ marginTop: 10 }}><StatNudge color={C.green} icon={CheckCircle} stat={`Your top post got ${comments} comment${comments !== 1 ? 's' : ''}.`} detail="Posts that invite a response drive the most conversation — worth repeating this format." /></div>;
          if (hasImage && likes > 2)
            return <div style={{ marginTop: 10 }}><StatNudge color={C.green} icon={CheckCircle} stat="Your top post included an image." detail="Visual posts tend to catch more attention in the feed." /></div>;
          if (likes > 0 || comments > 0)
            return <div style={{ marginTop: 10 }}><StatNudge color={C.blue} icon={TrendingUp} stat="" detail="Look at what made your top post work — format, topic, or timing — and try repeating it." /></div>;
          return null;
        })()}
      </CardBody>
    </Card>
  );
}

/* ── Posting cadence + content mix ───────────────────────────────────────── */
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
      { label: 'Posts',      count: allPosts.length,    color: C.blue,   pct: Math.round(allPosts.length    / tot * 100) },
      { label: 'Events',     count: events.length,      color: C.green,  pct: Math.round(events.length      / tot * 100) },
      { label: 'Polls',      count: polls.length,       color: C.blue,   pct: Math.round(polls.length       / tot * 100) },
      { label: 'Challenges', count: challenges.length,  color: C.amber,  pct: Math.round(challenges.length  / tot * 100) },
    ].filter(c => c.count > 0);
  }, [allPosts, events, polls, challenges]);

  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Posting Cadence</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Last 7 days</div>
          </div>
          <TrendingUp style={{ width: 13, height: 13, color: C.t3 }} />
        </div>

        <div style={{ display: 'flex', gap: 4, height: 32, alignItems: 'flex-end', marginBottom: 6 }}>
          {cadence.map((d, i) => (
            <div key={i} style={{
              flex: 1,
              height: d.count === 0 ? 3 : Math.max(4, (d.count / cadenceMax) * 28),
              borderRadius: 3,
              background: d.count === 0 ? 'rgba(255,255,255,0.06)' : C.blue,
              transition: 'height 0.4s ease',
              opacity: d.count === 0 ? 1 : 0.85,
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {cadence.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: C.t3 }}>{d.label}</div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: C.t3, fontWeight: 500, marginBottom: activeDays === 0 ? 12 : 0 }}>
          {activeDays} active {activeDays === 1 ? 'day' : 'days'} this week
          {activeDays === 0    && <span style={{ color: C.red,   marginLeft: 6, fontWeight: 700 }}>— no posts this week</span>}
          {activeDays >= 1 && activeDays < 3 && <span style={{ color: C.amber, marginLeft: 6, fontWeight: 700 }}>— spread posts across more days</span>}
          {activeDays >= 3 && <span style={{ color: C.green, marginLeft: 6, fontWeight: 700 }}>— good consistency</span>}
        </div>

        {activeDays === 0 && (
          <StatNudge color={C.amber} icon={TrendingDown}
            stat=""
            detail="Nothing posted this week. Even a short update keeps the community feeling alive."
          />
        )}

        {mix && (
          <>
            <div style={{ height: 1, background: C.divider, margin: '14px 0' }} />
            <Label>Content Mix</Label>
            <div style={{ display: 'flex', height: 3.5, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 12 }}>
              {mix.map((c, i) => <div key={i} style={{ width: `${c.pct}%`, background: c.color, borderRadius: 99 }} />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {mix.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: C.t2 }}>{c.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{c.count}</span>
                  <span style={{ fontSize: 10, color: C.t3, width: 28, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

/* ── Coach sidebar ───────────────────────────────────────────────────────── */
function CoachSidebar({ allPosts, polls, challenges, events, classes, upcomingEvents, activeChallenges, openModal, now }) {
  const score = useMemo(() =>
    allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
    + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)
  , [allPosts, polls]);

  return (
    <>
      <Card>
        <CardBody>
          <CardHeader title="My Content Impact"
            right={<div style={{ width: 26, height: 26, borderRadius: 7, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap style={{ width: 12, height: 12, color: C.blue }} /></div>}
          />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: C.t1, letterSpacing: '-0.05em', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 12, color: C.t3, fontWeight: 500 }}>interactions</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"      color={C.red}   />
            <Chip val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"   color={C.green} />
            <Chip val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes" color={C.blue}  />
          </div>
        </CardBody>
      </Card>

      <EngagementTrend allPosts={allPosts} polls={polls} now={now} />

      <Card>
        <CardBody>
          <CardHeader title="My Schedule" />
          {[
            { label: 'My Classes',        value: classes.length,          color: C.blue   },
            { label: 'Upcoming Events',   value: upcomingEvents.length,   color: C.green  },
            { label: 'Active Challenges', value: activeChallenges.length, color: C.amber  },
            { label: 'Active Polls',      value: polls.length,            color: C.blue   },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
              <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <BestTimeToPost allPosts={allPosts} now={now} openModal={openModal} />
      <ContentSuggestions allPosts={allPosts} polls={polls} challenges={challenges} events={events} now={now} openModal={openModal} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
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
  const lowPostIds = new Set(postScores.filter(p => p.score === 0).map(p => p.id));

  const FILTERS = isCoach
    ? [{ id: 'classes', label: 'My Classes' }, { id: 'gym', label: 'Posts' }, { id: 'challenges', label: 'Challenges' }, { id: 'polls', label: 'Polls' }, { id: 'events', label: 'Events' }]
    : [{ id: 'gym', label: 'Gym Posts' }, { id: 'members', label: 'Members' }, { id: 'challenges', label: 'Challenges' }, { id: 'classes', label: 'Classes' }, { id: 'polls', label: 'Polls' }];

  const feedItems = useMemo(() => {
    const fi = (() => {
      switch (activeFilter) {
        case 'members':    return { posts: memberPosts,   events: [],             challenges: [],               polls: [],  classes: []     };
        case 'gym':        return { posts: gymPosts,       events: [],             challenges: [],               polls: [],  classes: []     };
        case 'challenges': return { posts: [],             events: [],             challenges: activeChallenges, polls: [],  classes: []     };
        case 'classes':    return { posts: [],             events: [],             challenges: [],               polls: [],  classes             };
        case 'polls':      return { posts: [],             events: [],             challenges: [],               polls,      classes: []     };
        case 'events':     return { posts: [],             events: upcomingEvents, challenges: [],               polls: [],  classes: []     };
        default:           return { posts: allPosts,       events: upcomingEvents, challenges: activeChallenges, polls,      classes             };
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
    if (item.type === 'post')      return <PostCard       key={item.data.id || i} post={item.data}      currentUser={currentUser} isOwnProfile={item.data.created_by === currentUser?.id} onLike={() => {}} onComment={() => {}} onSave={() => {}} onDelete={() => onDeletePost(item.data.id)} fullWidth={true} />;
    if (item.type === 'event')     return <EventCard      key={item.data.id || i} event={item.data}     onDelete={onDeleteEvent}   now={now} />;
    if (item.type === 'challenge') return <GymChallengeCard key={item.data.id || i} challenge={item.data} isJoined={false} onJoin={null} currentUser={currentUser} isOwner={true} onDelete={id => onDeleteChallenge(id)} gymImageUrl={null} />;
    if (item.type === 'poll')      return <PollCard       key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}    allMemberships={allMemberships} />;
    if (item.type === 'class')     return <ClassCard      key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  const secondaryActions = isCoach ? [
    { icon: Dumbbell,  label: 'My Classes',   sub: `${classes.length} classes`,         color: C.blue,  fn: () => openModal('classes')   },
    { icon: Calendar,  label: 'New Event',    sub: `${upcomingEvents.length} upcoming`, color: C.green, fn: () => openModal('event')     },
    { icon: Trophy,    label: 'Challenge',    sub: `${activeChallenges.length} active`, color: C.amber, fn: () => openModal('challenge') },
    { icon: BarChart2, label: 'New Poll',     sub: `${polls.length} active`,            color: C.blue,  fn: () => openModal('poll')      },
  ] : [
    { icon: Calendar,  label: 'New Event',    sub: `${upcomingEvents.length} upcoming`, color: C.green, fn: () => openModal('event')     },
    { icon: Dumbbell,  label: 'Classes',      sub: `${classes.length} total`,           color: C.blue,  fn: () => openModal('classes')   },
    { icon: Trophy,    label: 'New Challenge',sub: `${activeChallenges.length} active`, color: C.amber, fn: () => openModal('challenge') },
    { icon: BarChart2, label: 'New Poll',     sub: `${polls.length} active`,            color: C.blue,  fn: () => openModal('poll')      },
  ];

  return (
    <>
      <style>{MOBILE_CSS}</style>
      <div className="tc-root">

        {/* ── LEFT ──────────────────────────────────────────────────── */}
        <div className="tc-left">

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 14 }}>
            {/* Primary CTA */}
            <button onClick={() => openModal('post')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 20px', borderRadius: 13,
                background: C.blue, color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                flexShrink: 0, fontFamily: 'inherit',
                boxShadow: `0 0 0 1px rgba(59,130,246,0.4), 0 4px 14px rgba(59,130,246,0.25)`,
                transition: 'opacity 0.12s', position: 'relative', overflow: 'hidden',
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
                <div key={i} onClick={fn}
                  style={{
                    borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
                    background: C.surface, border: `1px solid ${color}20`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
                    display: 'flex', flexDirection: 'column', gap: 5,
                    transition: 'all 0.13s', position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.transform = ''; }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg,${color}50 0%,${color}18 60%,transparent 100%)`, pointerEvents: 'none' }} />
                  <IconBadge icon={Icon} color={color} size={24} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{label}</div>
                  <div style={{ fontSize: 9, color: C.t3, fontWeight: 500 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="tc-tabs">
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, padding: '8px 14px 8px 0', marginBottom: -1, flexShrink: 0 }}>Feed</span>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className="tc-tab-btn"
                style={{
                  fontWeight: activeFilter === f.id ? 700 : 500,
                  color: activeFilter === f.id ? C.t1 : C.t3,
                  borderBottom: `2px solid ${activeFilter === f.id ? C.blue : 'transparent'}`,
                  marginBottom: -1,
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="tc-feed">
            {feedItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 28 }}>
                {feedItems.map(renderItem)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquarePlus style={{ width: 18, height: 18, color: C.blue, opacity: 0.6 }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.t2, margin: 0 }}>Nothing here yet</p>
                <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>Create your first post to get the community going</p>
                <button onClick={() => openModal('post')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: C.blue, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Create first post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
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
