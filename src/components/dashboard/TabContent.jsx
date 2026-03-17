import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import {
  Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Zap, Heart, MessageCircle, Dumbbell,
  MoreHorizontal, Trash2, Sparkles,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';

// ── Design tokens — identical to Overview ─────────────────────────────────────
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
  card:    '#0b1120',
  divider: 'rgba(255,255,255,0.05)',
};

// ── Responsive styles ──────────────────────────────────────────────────────────
const MOBILE_CSS = `
  .tc-root { display: grid; grid-template-columns: minmax(0,1fr) clamp(260px,22%,320px); gap: 16px; height: 100%; max-width: 100%; }
  .tc-left  { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0; }
  .tc-actions { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; flex-shrink: 0; padding-bottom: 14px; }
  .tc-action-btn { border-radius: 12px; padding: 16px 14px; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; min-height: 88px; }
  .tc-tabs  { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0; }
  .tc-tabs::-webkit-scrollbar { display: none; }
  .tc-tab-btn { padding: 7px 16px; font-size: 12px; font-family: inherit; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
  .tc-feed  { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; }
  .tc-feed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; padding-bottom: 24px; }
  .tc-sidebar { height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-width: 280px; }
  @media (max-width: 768px) {
    .tc-root       { grid-template-columns: 1fr !important; height: auto !important; overflow: visible !important; }
    .tc-left       { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tc-actions    { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; }
    .tc-action-btn { min-height: 72px !important; padding: 12px 10px !important; }
    .tc-feed       { overflow: visible !important; min-height: unset !important; flex: unset !important; }
    .tc-feed-grid  { grid-template-columns: 1fr !important; }
    .tc-feed-col   { display: contents !important; }
    .tc-sidebar    { height: auto !important; overflow: visible !important; min-width: unset !important; }
    .tc-tab-btn    { padding: 7px 12px !important; font-size: 11px !important; }
  }
  @media (max-width: 480px) {
    .tc-actions    { grid-template-columns: repeat(2,1fr) !important; }
    .tc-action-btn { min-height: 66px !important; }
  }
`;

// ── Shared primitives (match Overview) ────────────────────────────────────────

// The 1px top shimmer present on every Overview KPI card
const Shimmer = ({ color = T.blue }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}28,transparent)`, pointerEvents: 'none' }} />
);

// Standard card shell — same radius / bg / border / padding as Overview
function SCard({ children, style, accent }) {
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${accent ? `${accent}25` : T.border}`, padding: 20, position: 'relative', overflow: 'hidden', flexShrink: 0, ...style }}>
      <Shimmer color={accent || T.blue} />
      {children}
    </div>
  );
}

// Card title + optional sub + right slot — matches Overview sidebar card headers
function CardHeader({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: sub ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// Divider list row — identical to Overview StatRow
function SRow({ label, value, color, last, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}`, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={e => onClick && (e.currentTarget.style.opacity = '1')}>
      <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: color || T.text1 }}>{value}</span>
        {onClick && <ChevronRight style={{ width: 11, height: 11, color: T.text3 }} />}
      </div>
    </div>
  );
}

// Small coloured badge — used on feed cards
function Pill({ label, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}15`, border: `1px solid ${color}28`, borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>
      {label}
    </span>
  );
}

// Stat chip — matches Overview engagement score tags
function Chip({ val, label, color }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: T.divider, border: `1px solid ${T.border}`, color }}>
      {val} {label}
    </div>
  );
}

// Icon badge — small square icon holder used in action buttons + card headers
function IconBadge({ icon: Icon, color, size = 26 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 7, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ width: size * 0.5, height: size * 0.5, color }} />
    </div>
  );
}

// ── 3-dot delete menu ──────────────────────────────────────────────────────────
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
        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }}>
        <MoreHorizontal style={{ width: 13, height: 13, color: T.text3 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 28, right: 0, zIndex: 9999, background: '#0d1528', border: `1px solid ${T.borderM}`, borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 110, overflow: 'hidden' }}>
          <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
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

// ── Feed cards ─────────────────────────────────────────────────────────────────

function FeedCard({ post, onDelete, isTopPerformer, isLowPerformer }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const total    = likes + comments;
  const content  = post.content || post.title || '';
  const accent   = isTopPerformer ? T.green : isLowPerformer ? T.red : null;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${accent ? `${accent}30` : T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Shimmer color={accent || T.blue} />
      {isTopPerformer && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><Pill label="⭐ Top post" color={T.green} /></div>}
      {isLowPerformer && total === 0 && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><Pill label="No engagement" color={T.red} /></div>}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={post.author_name || post.gym_name || 'G'} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'GymPost'}
          </div>
        </div>
        <span style={{ fontSize: 10, color: T.text3, flexShrink: 0 }}>{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
        <DeleteBtn onDelete={() => onDelete(post.id)} />
      </div>
      {content && (
        <div style={{ padding: '0 14px 10px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: 0, lineHeight: 1.4 }}>{post.title || content.split('\n')[0]}</p>
          {post.title && content !== post.title && <p style={{ fontSize: 11, color: T.text2, margin: '3px 0 0', lineHeight: 1.5 }}>{content}</p>}
        </div>
      )}
      {(post.image_url || post.media_url) && (
        <div style={{ overflow: 'hidden' }}>
          <img src={post.image_url || post.media_url} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} onError={e => e.currentTarget.parentElement.style.display = 'none'} />
        </div>
      )}
      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${T.divider}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: likes > 0 ? T.red : T.text3 }}><Heart style={{ width: 12, height: 12 }} /> {likes}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: comments > 0 ? T.blue : T.text3 }}><MessageCircle style={{ width: 12, height: 12 }} /> {comments}</span>
        {total > 0 && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: total >= 5 ? T.green : T.text3 }}>{total} interactions</span>}
      </div>
    </div>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff   = Math.floor((evDate - now) / 86400000);
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.green}22`, overflow: 'hidden', position: 'relative' }}>
      <Shimmer color={T.green} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={Calendar} color={T.green} />
          <Pill label="Event" color={T.green} />
          <Pill label={diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`} color={diff <= 2 ? T.red : T.green} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 4px' }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 11, color: T.text2, margin: '0 0 8px', lineHeight: 1.4 }}>{event.description}</p>}
        <div style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalD - elapsed);
  const pct  = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts = challenge.participants?.length || 0;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.amber}22`, overflow: 'hidden', position: 'relative' }}>
      <Shimmer color={T.amber} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <IconBadge icon={Trophy} color={T.amber} />
          <Pill label="Challenge" color={T.amber} />
          <Pill label={`${remaining}d left`} color={remaining <= 3 ? T.red : T.text3} />
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

const CLASS_CFG = {
  hiit: { color: T.red, label: 'HIIT' }, yoga: { color: T.green, label: 'Yoga' },
  strength: { color: '#818cf8', label: 'Strength' }, cardio: { color: '#fb7185', label: 'Cardio' },
  spin: { color: T.blue, label: 'Spin' }, boxing: { color: T.amber, label: 'Boxing' },
  pilates: { color: T.purple, label: 'Pilates' }, default: { color: T.blue, label: 'Class' },
};
const CLASS_IMGS = {
  hiit: 'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  cardio: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  spin: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80',
  pilates: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
};
function getClassType(c) {
  const n = (c.class_type || c.name || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('flow') || n.includes('vinyasa')) return 'yoga';
  if (n.includes('strength') || n.includes('lift') || n.includes('weight')) return 'strength';
  if (n.includes('cardio') || n.includes('run') || n.includes('aerobic')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike')) return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox')) return 'boxing';
  if (n.includes('pilates') || n.includes('barre')) return 'pilates';
  return 'default';
}
function ClassCard({ gymClass, onDelete }) {
  const cfg = CLASS_CFG[getClassType(gymClass)];
  const img = gymClass.image_url || CLASS_IMGS[getClassType(gymClass)];
  const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: T.card, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Shimmer color={cfg.color} />
      <div style={{ position: 'relative', height: 96, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05),${T.card}e0)` }} />
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.55)', border: `1px solid ${cfg.color}40`, borderRadius: 5, padding: '2px 7px', backdropFilter: 'blur(6px)' }}>{cfg.label}</div>
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)} />
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.description && <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gymClass.description}</div>}
        {(gymClass.instructor || gymClass.coach_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>{initials(gymClass.instructor || gymClass.coach_name)}</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>{gymClass.instructor || gymClass.coach_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PollCard({ poll, onDelete, allMemberships }) {
  const votes   = poll.voters?.length || 0;
  const total   = allMemberships?.length || 0;
  const partPct = total > 0 ? Math.round((votes / total) * 100) : 0;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.purple}22`, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
      <Shimmer color={T.purple} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <IconBadge icon={BarChart2} color={T.purple} />
        <Pill label="Poll" color={T.purple} />
        {partPct > 0 && <Pill label={`${partPct}% voted`} color={partPct >= 50 ? T.green : T.amber} />}
        <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)} /></div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 10px' }}>{poll.title}</p>
      <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 7 }}>
        <div style={{ height: '100%', width: `${partPct}%`, borderRadius: 99, background: `linear-gradient(90deg,${T.purple},#a78bfa)`, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{votes} {votes === 1 ? 'vote' : 'votes'}{total > 0 ? ` of ${total} members` : ''}</div>
    </div>
  );
}

// ── Sidebar widgets ────────────────────────────────────────────────────────────

function WhatToPostPanel({ allPosts, polls, challenges, events, now, openModal }) {
  const suggestions = useMemo(() => {
    const items = [];
    const days = allPosts.length > 0 ? differenceInDays(now, new Date(allPosts[0]?.created_date || now)) : 999;
    if (days >= 3)                                         items.push({ color: T.amber,  icon: MessageSquarePlus, label: `No post in ${days} days — keep your feed active`,             action: 'Post now',    fn: () => openModal('post')      });
    if (!polls.filter(p => !p.ended_at).length)            items.push({ color: T.purple, icon: BarChart2,         label: 'No active poll — polls drive high engagement',                  action: 'Create poll', fn: () => openModal('poll')      });
    if (!challenges.find(c => c.status === 'active'))      items.push({ color: T.amber,  icon: Trophy,            label: 'No active challenge — members lose motivation without one',     action: 'Start one',   fn: () => openModal('challenge') });
    if (!events.find(e => new Date(e.event_date) >= now))  items.push({ color: T.green,  icon: Calendar,          label: 'No upcoming events — schedule something to build excitement',   action: 'Add event',   fn: () => openModal('event')     });
    return items.slice(0, 3);
  }, [allPosts, polls, challenges, events, now]);
  if (!suggestions.length) return null;
  return (
    <SCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Sparkles style={{ width: 13, height: 13, color: T.blue }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Content Suggestions</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {suggestions.map((s, i) => (
          <div key={i} onClick={s.fn}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, background: `${s.color}08`, border: `1px solid ${s.color}20`, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = `${s.color}12`}
            onMouseLeave={e => e.currentTarget.style.background = `${s.color}08`}>
            <s.icon style={{ width: 12, height: 12, color: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: T.text2, lineHeight: 1.4 }}>{s.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: s.color, whiteSpace: 'nowrap', padding: '2px 7px', borderRadius: 5, background: `${s.color}15`, flexShrink: 0 }}>{s.action}</span>
          </div>
        ))}
      </div>
    </SCard>
  );
}

function EngagementTrendWidget({ allPosts, polls, now }) {
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
    <SCard>
      <CardHeader title="Engagement Trend" sub="Week over week"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {up ? <TrendingUp style={{ width: 13, height: 13, color: T.green }} /> : <TrendingDown style={{ width: 13, height: 13, color: T.red }} />}
            <span style={{ fontSize: 14, fontWeight: 800, color: up ? T.green : T.red, letterSpacing: '-0.02em' }}>{up ? '+' : ''}{change}%</span>
          </div>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: change < 0 ? 10 : 0 }}>
        {[{ label: 'This week', val: thisWeek, color: up ? T.green : T.red }, { label: 'Last week', val: lastWeek, color: T.text3 }].map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: T.divider, border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.04em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: T.text3, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {change < 0 && (
        <div style={{ padding: '8px 10px', borderRadius: 8, background: `${T.red}08`, border: `1px solid ${T.red}18` }}>
          <div style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>Engagement dropped — consider a new challenge or poll</div>
        </div>
      )}
    </SCard>
  );
}

function CommunityActivityWidget({ allPosts, now }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i), s = new Date(day.getFullYear(), day.getMonth(), day.getDate()), e = new Date(s.getTime() + 86400000);
    const p = allPosts.filter(x => { const d = new Date(x.created_date); return d >= s && d < e; });
    const posts = p.length, likes = p.reduce((a, x) => a + (x.likes?.length || 0), 0), comments = p.reduce((a, x) => a + (x.comments?.length || 0), 0);
    return { label: format(day, 'EEE'), posts, likes, comments, total: posts + likes + comments };
  }), [allPosts, now]);
  const maxV = Math.max(...days.map(d => d.total), 1), sum = days.reduce((a, d) => a + d.total, 0), up = days[6].total >= days[0].total;
  return (
    <SCard>
      <CardHeader title="Community Activity" sub="Posts, likes & comments"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: up ? T.green : T.amber, letterSpacing: '-0.04em' }}>{sum}</span>
            {up ? <TrendingUp style={{ width: 12, height: 12, color: T.green }} /> : <TrendingDown style={{ width: 12, height: 12, color: T.amber }} />}
          </div>
        }
      />
      <div style={{ display: 'flex', gap: 4, height: 36, alignItems: 'flex-end', marginBottom: 6 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 32, gap: 1 }}>
            {d.total === 0
              ? <div style={{ height: 3, borderRadius: 2, background: T.divider }} />
              : <>
                  {d.comments > 0 && <div style={{ height: Math.max(3, (d.comments / maxV) * 28), borderRadius: 2, background: T.blue, opacity: 0.85 }} />}
                  {d.likes    > 0 && <div style={{ height: Math.max(3, (d.likes    / maxV) * 28), borderRadius: 2, background: T.red,  opacity: 0.85 }} />}
                  {d.posts    > 0 && <div style={{ height: Math.max(3, (d.posts    / maxV) * 28), borderRadius: 2, background: T.purple, opacity: 0.85 }} />}
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
    </SCard>
  );
}

function ContentPerformanceWidget({ allPosts, openModal }) {
  const ranked = useMemo(() => [...allPosts].map(p => ({ ...p, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 })).sort((a, b) => b.score - a.score), [allPosts]);
  const top3 = ranked.slice(0, 3), low3 = ranked.filter(p => p.score === 0).slice(0, 3);
  if (!allPosts.length) return null;
  return (
    <SCard>
      <CardHeader title="Content Performance" />
      {top3.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>⭐ Top performing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            {top3.map((p, i) => (
              <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, background: `${T.green}08`, border: `1px solid ${T.green}15` }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: T.green, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.title || p.content || '').split('\n')[0].slice(0, 40) || 'Post'}</span>
                <span style={{ fontSize: 10, color: T.red, flexShrink: 0 }}>♥ {p.likes?.length || 0}</span>
                <span style={{ fontSize: 10, color: T.blue, flexShrink: 0 }}>💬 {p.comments?.length || 0}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {low3.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>📉 No engagement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {low3.map((p, i) => (
              <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, background: `${T.red}06`, border: `1px solid ${T.red}12` }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: T.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.title || p.content || '').split('\n')[0].slice(0, 40) || 'Post'}</span>
                <span style={{ fontSize: 9, color: T.text3 }}>{p.created_date ? format(new Date(p.created_date), 'MMM d') : ''}</span>
              </div>
            ))}
          </div>
          <button onClick={() => openModal('post')} style={{ width: '100%', fontSize: 11, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}25`, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            Post something new →
          </button>
        </>
      )}
    </SCard>
  );
}

function ChallengeCompletionWidget({ challenges, allMemberships, now }) {
  const data = useMemo(() => challenges.filter(c => c.start_date && c.end_date).map(c => {
    const parts = c.participants?.length || 0, joinPct = Math.round((parts / (allMemberships.length || 1)) * 100);
    return { ...c, parts, joinPct };
  }).sort((a, b) => b.parts - a.parts).slice(0, 4), [challenges, allMemberships]);
  if (!data.length) return null;
  return (
    <SCard>
      <CardHeader title="Challenge Uptake" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((c, i) => (
          <div key={c.id || i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{c.title}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.amber, flexShrink: 0 }}>{c.parts} joined</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.joinPct >= 50 ? T.green : c.joinPct >= 25 ? T.amber : T.red, marginLeft: 6, flexShrink: 0 }}>{c.joinPct}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.joinPct}%`, borderRadius: 99, background: c.joinPct >= 50 ? `linear-gradient(90deg,${T.green},#34d399)` : `linear-gradient(90deg,${T.purple},${T.amber})`, transition: 'width 0.6s ease' }} />
            </div>
            {c.joinPct < 25 && <div style={{ fontSize: 9, color: T.red, marginTop: 3, fontWeight: 600 }}>Low uptake — promote this challenge</div>}
          </div>
        ))}
      </div>
    </SCard>
  );
}

function MemberLeaderboard({ allPosts, avatarMap }) {
  const leaders = useMemo(() => {
    const s = {};
    allPosts.forEach(p => { if (!p.user_id) return; if (!s[p.user_id]) s[p.user_id] = { userId: p.user_id, name: p.author_name || 'Member', posts: 0, comments: 0 }; s[p.user_id].posts++; });
    allPosts.forEach(p => (p.comments || []).forEach(c => { const id = c.user_id || c.author_id; if (!id) return; if (!s[id]) s[id] = { userId: id, name: c.author_name || 'Member', posts: 0, comments: 0 }; s[id].comments++; }));
    return Object.values(s).map(x => ({ ...x, score: x.posts * 3 + x.comments * 2 })).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [allPosts]);
  if (!leaders.length) return null;
  return (
    <SCard>
      <CardHeader title="🏆 Top Contributors" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leaders.map((m, i) => (
          <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? `${T.amber}22` : T.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? T.amber : T.text3, flexShrink: 0 }}>{i + 1}</div>
            <Avatar name={m.name} size={24} src={avatarMap?.[m.userId] || null} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {m.posts    > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: T.purple }}>{m.posts}p</span>}
              {m.comments > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: T.blue   }}>{m.comments}c</span>}
            </div>
          </div>
        ))}
      </div>
    </SCard>
  );
}

function UnreachedWidget({ members, avatarMap, openModal, title, desc }) {
  if (!members.length) return null;
  return (
    <SCard accent={T.red}>
      <CardHeader title={title}
        right={<span style={{ fontSize: 10, fontWeight: 700, color: T.red, background: `${T.red}12`, border: `1px solid ${T.red}22`, borderRadius: 6, padding: '2px 7px' }}>{members.length}</span>}
      />
      <p style={{ fontSize: 11, color: T.text3, marginBottom: 12, fontWeight: 500, lineHeight: 1.4 }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={m.user_name || '?'} size={26} src={avatarMap?.[m.user_id] || null} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</span>
            <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}22`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Reach</button>
          </div>
        ))}
      </div>
    </SCard>
  );
}

function MilestonesWidget({ milestones, avatarMap, title }) {
  if (!milestones.length) return null;
  return (
    <SCard>
      <CardHeader title={`🎯 ${title}`} />
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
    </SCard>
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

  const postScores = useMemo(() => allPosts.map(p => ({ id: p.id, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 })), [allPosts]);
  const maxScore   = Math.max(...postScores.map(p => p.score), 1);
  const topPostIds = new Set(postScores.filter(p => p.score >= maxScore * 0.7 && p.score > 0).map(p => p.id));
  const lowPostIds = new Set(postScores.filter(p => p.score === 0).map(p => p.id));

  const FILTERS = isCoach
    ? [{ id: 'classes', label: 'My Classes' }, { id: 'gym', label: 'Posts' }, { id: 'challenges', label: 'Challenges' }, { id: 'polls', label: 'Polls' }, { id: 'events', label: 'Events' }]
    : [{ id: 'gym', label: 'Gym Posts' }, { id: 'members', label: 'Members' }, { id: 'challenges', label: 'Challenges' }, { id: 'classes', label: 'Classes' }, { id: 'polls', label: 'Polls' }];

  const feedItems = useMemo(() => {
    switch (activeFilter) {
      case 'members':    return { posts: memberPosts,   events: [],            challenges: [],             polls: [],  classes: []  };
      case 'gym':        return { posts: gymPosts,       events: [],            challenges: [],             polls: [],  classes: []  };
      case 'challenges': return { posts: [],             events: [],            challenges: activeChallenges, polls: [], classes: []  };
      case 'classes':    return { posts: [],             events: [],            challenges: [],             polls: [],  classes       };
      case 'polls':      return { posts: [],             events: [],            challenges: [],             polls,      classes: []  };
      case 'events':     return { posts: [],             events: upcomingEvents, challenges: [],            polls: [],  classes: []  };
      default:           return { posts: allPosts,       events: upcomingEvents, challenges: activeChallenges, polls,   classes       };
    }
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const flatItems = useMemo(() => [
    ...feedItems.posts.map(p      => ({ type: 'post',      data: p, date: new Date(p.created_date || 0) })),
    ...feedItems.events.map(e     => ({ type: 'event',     data: e, date: new Date(e.event_date    || 0) })),
    ...feedItems.challenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date    || 0) })),
    ...feedItems.polls.map(p      => ({ type: 'poll',      data: p, date: new Date(p.created_date  || 0) })),
    ...feedItems.classes.map(c    => ({ type: 'class',     data: c, date: new Date(c.created_date  || 0) })),
  ].sort((a, b) => b.date - a.date), [feedItems]);

  const col1 = flatItems.filter((_, i) => i % 2 === 0);
  const col2 = flatItems.filter((_, i) => i % 2 === 1);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <FeedCard      key={item.data.id || i} post={item.data}      onDelete={onDeletePost}      isTopPerformer={topPostIds.has(item.data.id)} isLowPerformer={lowPostIds.has(item.data.id)} />;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     onDelete={onDeleteEvent}     now={now} />;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} onDelete={onDeleteChallenge} now={now} />;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}      allMemberships={allMemberships} />;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  const milestones = useMemo(() => {
    const acc = {}, uid = {};
    checkIns.forEach(c => { if (!acc[c.user_name]) acc[c.user_name] = 0; acc[c.user_name]++; if (c.user_id) uid[c.user_name] = c.user_id; });
    return Object.entries(acc).map(([name, total]) => {
      const next = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
      return { name, total, next, toNext: next ? next - total : 0, user_id: uid[name] };
    }).filter(m => m.next && m.toNext <= 5).sort((a, b) => a.toNext - b.toNext).slice(0, 4);
  }, [checkIns]);

  const engagementScore = useMemo(() =>
    allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
    + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)
    + activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0)
    + events.reduce((s, e) => s + (e.attendees || 0), 0)
  , [allPosts, polls, activeChallenges, events]);

  const contentMix = useMemo(() => {
    const tot = allPosts.length + events.length + polls.length + challenges.length;
    if (!tot) return null;
    return [
      { label: 'Posts',      count: allPosts.length,   color: T.blue,   pct: Math.round(allPosts.length   / tot * 100) },
      { label: 'Events',     count: events.length,     color: T.green,  pct: Math.round(events.length     / tot * 100) },
      { label: 'Polls',      count: polls.length,      color: T.purple, pct: Math.round(polls.length      / tot * 100) },
      { label: 'Challenges', count: challenges.length, color: T.amber,  pct: Math.round(challenges.length / tot * 100) },
    ];
  }, [allPosts, events, polls, challenges]);

  const cadence = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i), s = new Date(day.getFullYear(), day.getMonth(), day.getDate()), e = new Date(s.getTime() + 86400000);
    return { label: format(day, 'EEE'), count: allPosts.filter(p => { const d = new Date(p.created_date); return d >= s && d < e; }).length };
  }), [allPosts, now]);
  const cadenceMax = Math.max(...cadence.map(d => d.count), 1);

  const pollRate = useMemo(() => {
    if (!polls.length || !allMemberships.length) return null;
    return Math.round(polls.reduce((s, p) => s + (p.voters?.length || 0), 0) / (polls.length * allMemberships.length) * 100);
  }, [polls, allMemberships]);

  const unreached = useMemo(() => {
    const ci = new Set(ci30.map(c => c.user_id)), ch = new Set(activeChallenges.flatMap(c => c.participants || [])), pv = new Set(polls.flatMap(p => p.voters || []));
    return allMemberships.filter(m => !ci.has(m.user_id) && !ch.has(m.user_id) && !pv.has(m.user_id)).slice(0, 4);
  }, [allMemberships, ci30, activeChallenges, polls]);

  // Action buttons — flat T.card style, coloured accent border, matches Overview Quick Actions aesthetic
  const actions = (isCoach ? [
    { icon: Dumbbell,          label: 'My Classes',    sub: `${classes.length} classes`,          color: T.purple, fn: () => openModal('classes')   },
    { icon: MessageSquarePlus, label: 'New Post',      sub: 'Engage members',                     color: T.blue,   fn: () => openModal('post')      },
    { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`,  color: T.green,  fn: () => openModal('event')     },
    { icon: Trophy,            label: 'Challenge',     sub: `${activeChallenges.length} active`,  color: T.red,    fn: () => openModal('challenge') },
    { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,             color: T.purple, fn: () => openModal('poll')      },
  ] : [
    { icon: MessageSquarePlus, label: 'New Post',      sub: 'Share with members',                 color: T.blue,   fn: () => openModal('post')      },
    { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`,  color: T.green,  fn: () => openModal('event')     },
    { icon: Dumbbell,          label: 'Classes',       sub: `${classes.length} total`,            color: T.blue,   fn: () => openModal('classes')   },
    { icon: Trophy,            label: 'New Challenge', sub: `${activeChallenges.length} active`,  color: T.red,    fn: () => openModal('challenge') },
    { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,             color: T.purple, fn: () => openModal('poll')      },
  ]);

  return (
    <>
      <style>{MOBILE_CSS}</style>
      <div className="tc-root">

        {/* ── LEFT ── */}
        <div className="tc-left">

          {/* Action buttons */}
          <div className="tc-actions">
            {actions.map(({ icon: Icon, label, sub, color, fn }, i) => (
              <div key={i} onClick={fn} className="tc-action-btn"
                style={{ background: T.card, border: `1px solid ${color}22` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.35)'; e.currentTarget.style.borderColor = `${color}44`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = `${color}22`; }}>
                {/* Shimmer — same as KPI cards */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}30,transparent)`, pointerEvents: 'none' }} />
                {/* Soft glow */}
                <div style={{ position: 'absolute', bottom: -12, right: -12, width: 48, height: 48, borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(14px)', pointerEvents: 'none' }} />
                <IconBadge icon={Icon} color={color} size={28} />
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: T.text1, letterSpacing: '-0.01em' }}>{label}</div>
                <div style={{ fontSize: 10, color: T.text3, fontWeight: 500, marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="tc-tabs">
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text1, padding: '7px 14px 7px 0', marginBottom: -1, flexShrink: 0 }}>Feed</span>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className="tc-tab-btn"
                style={{ fontWeight: activeFilter === f.id ? 700 : 500, color: activeFilter === f.id ? T.text1 : T.text3, borderBottom: `2px solid ${activeFilter === f.id ? T.purple : 'transparent'}`, marginBottom: -1 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="tc-feed">
            {flatItems.length > 0 ? (
              <div className="tc-feed-grid">
                <div className="tc-feed-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{col1.map(renderItem)}</div>
                <div className="tc-feed-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{col2.map(renderItem)}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${T.blue}0a`, border: `1px solid ${T.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquarePlus style={{ width: 18, height: 18, color: `${T.blue}55` }} />
                </div>
                <p style={{ fontSize: 12, color: T.text3, fontWeight: 500, margin: 0 }}>Nothing here yet</p>
                <button onClick={() => openModal('post')} style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}22`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Create first post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="tc-sidebar">
          {isCoach ? (
            <>
              {/* Impact score — matches Overview's KPI card aesthetic */}
              <SCard>
                <CardHeader title="My Content Impact" right={<Zap style={{ width: 14, height: 14, color: T.purple }} />} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: T.text1, letterSpacing: '-0.05em', lineHeight: 1 }}>{engagementScore}</span>
                  <span style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>interactions</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Chip val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"      color={T.red}    />
                  <Chip val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"   color={T.blue}   />
                  <Chip val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes" color={T.purple} />
                </div>
              </SCard>
              <EngagementTrendWidget allPosts={allPosts} polls={polls} now={now} />
              <SCard>
                <CardHeader title="My Classes & Events" />
                <SRow label="My Classes"        value={classes.length}          color={T.purple} />
                <SRow label="Upcoming Events"   value={upcomingEvents.length}   color={T.green}  />
                <SRow label="Active Challenges" value={activeChallenges.length} color={T.amber}  />
                <SRow label="Active Polls"      value={polls.length}            color={T.blue}   last />
              </SCard>
              <UnreachedWidget members={unreached} avatarMap={avatarMap} openModal={openModal} title="Clients Not Reached" desc="No check-ins, poll votes, or challenge joins in 30 days." />
              <MilestonesWidget milestones={milestones} avatarMap={avatarMap} title="Client Milestones" />
            </>
          ) : (
            <>
              <WhatToPostPanel allPosts={allPosts} polls={polls} challenges={challenges} events={events} now={now} openModal={openModal} />

              {/* Engagement score */}
              <SCard>
                <CardHeader title="Engagement Score" right={<Zap style={{ width: 14, height: 14, color: T.amber }} />} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: T.text1, letterSpacing: '-0.05em', lineHeight: 1 }}>{engagementScore}</span>
                  <span style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>total interactions</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Chip val={allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0)} label="Likes"        color={T.red}    />
                  <Chip val={allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0)} label="Comments"     color={T.blue}   />
                  <Chip val={polls.reduce((s, p)    => s + (p.voters?.length   || 0), 0)} label="Poll votes"   color={T.purple} />
                  <Chip val={totalChalPart}                                                label="In challenge" color={T.amber}  />
                </div>
              </SCard>

              <EngagementTrendWidget allPosts={allPosts} polls={polls} now={now} />
              <CommunityActivityWidget allPosts={allPosts} now={now} />
              <ContentPerformanceWidget allPosts={allPosts} openModal={openModal} />
              <ChallengeCompletionWidget challenges={challenges} allMemberships={allMemberships} now={now} />
              <MemberLeaderboard allPosts={allPosts} avatarMap={avatarMap} />

              {/* Posting cadence */}
              <SCard>
                <CardHeader title="Posting Cadence" right={<TrendingUp style={{ width: 13, height: 13, color: T.blue }} />} />
                <div style={{ display: 'flex', gap: 4, height: 36, alignItems: 'flex-end', marginBottom: 6 }}>
                  {cadence.map((d, i) => (
                    <div key={i} style={{ flex: 1, height: d.count === 0 ? 3 : Math.max(5, (d.count / cadenceMax) * 30), borderRadius: 3, background: d.count === 0 ? T.divider : `linear-gradient(180deg,${T.blue},#0284c7)`, transition: 'height 0.4s ease' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {cadence.map((d, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: T.text3 }}>{d.label}</div>)}
                </div>
                <div style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>
                  {cadence.filter(d => d.count > 0).length} active days this week
                  {cadence.filter(d => d.count > 0).length < 3 && <span style={{ color: T.amber, marginLeft: 6, fontWeight: 700 }}>— post more often</span>}
                </div>
              </SCard>

              {/* Content mix */}
              {contentMix && (
                <SCard>
                  <CardHeader title="Content Mix" />
                  <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 14 }}>
                    {contentMix.filter(c => c.pct > 0).map((c, i) => <div key={i} style={{ width: `${c.pct}%`, background: c.color, borderRadius: 99 }} />)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {contentMix.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: T.text2 }}>{c.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{c.count}</span>
                        <span style={{ fontSize: 10, color: T.text3, width: 28, textAlign: 'right' }}>{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                </SCard>
              )}

              {/* Poll participation */}
              {pollRate !== null && (
                <SCard>
                  <CardHeader title="Poll Participation" right={<BarChart2 style={{ width: 13, height: 13, color: T.purple }} />} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: pollRate >= 50 ? T.green : pollRate >= 25 ? T.amber : T.red, letterSpacing: '-0.05em', lineHeight: 1 }}>{pollRate}%</span>
                    <span style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>of members voting</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${pollRate}%`, borderRadius: 99, background: pollRate >= 50 ? `linear-gradient(90deg,${T.green},#34d399)` : pollRate >= 25 ? `linear-gradient(90deg,#d97706,${T.amber})` : `linear-gradient(90deg,${T.red},#f87171)`, transition: 'width 0.8s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: T.text3, margin: 0, fontWeight: 500 }}>{pollRate < 25 ? 'Low — try shorter, punchier polls' : pollRate < 50 ? 'Decent — pin polls to your feed' : 'Great engagement on polls!'}</p>
                </SCard>
              )}

              <UnreachedWidget members={unreached} avatarMap={avatarMap} openModal={openModal} title="Not Reached" desc="Members with no check-ins, poll votes, or challenge joins in 30 days." />

              {/* Content stats */}
              <SCard>
                <CardHeader title="Content Stats" />
                <SRow label="Upcoming Events"        value={upcomingEvents.length}   color={T.green}  onClick={() => {}} />
                <SRow label="Challenge Participants" value={totalChalPart}            color={T.amber}  onClick={() => {}} />
                <SRow label="Active Polls"           value={polls.length}            color={T.purple} onClick={() => {}} last />
              </SCard>

              <MilestonesWidget milestones={milestones} avatarMap={avatarMap} title="Upcoming Member Milestones" />
            </>
          )}
        </div>
      </div>
    </>
  );
}
