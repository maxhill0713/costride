import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import {
  Plus, Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Zap, Heart, MessageCircle, Dumbbell,
  MoreHorizontal, Trash2, Eye, Flame, AlertTriangle, Star, Award,
  Users, Target, Sparkles, ArrowUpRight, Activity, Shield, CheckCircle,
  RefreshCw, Bell
} from 'lucide-react';
import { Card, Empty, Avatar } from './DashboardPrimitives';

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
  .tc-action-btn { border-radius: 14px; padding: 16px 14px; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.18s, box-shadow 0.18s; min-height: 96px; }
  .tc-tabs { display: flex; align-items: center; border-bottom: 1px solid var(--border); margin-bottom: 12px; gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0; }
  .tc-tabs::-webkit-scrollbar { display: none; }
  .tc-tab-btn { padding: 7px 16px; font-size: 12px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
  .tc-feed { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; }
  .tc-feed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; padding-bottom: 24px; }
  .tc-sidebar { height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-width: 280px; }
  @media (max-width: 768px) {
    .tc-root { grid-template-columns: 1fr !important; height: auto !important; overflow: visible !important; }
    .tc-left { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tc-actions { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
    .tc-action-btn { min-height: 80px !important; padding: 12px 10px !important; }
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
    .tc-action-btn { min-height: 72px !important; padding: 10px 9px !important; }
  }
`;

// ── 3-dot delete menu ──────────────────────────────────────────────────────────
function DeleteBtn({ onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 6, cursor: 'pointer' }}>
        <MoreHorizontal style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.5)' }}/>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 28, right: 0, zIndex: 9999, background: '#1a1f36', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 110, overflow: 'hidden' }}>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Trash2 style={{ width: 12, height: 12 }}/> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Feed post card — now with engagement tier indicator ───────────────────────
function FeedCard({ post, onDelete, isTopPerformer, isLowPerformer }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const hasImage = post.image_url || post.media_url;
  const content  = post.content || post.title || '';
  const total    = likes + comments;

  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: `1px solid ${isTopPerformer ? 'rgba(16,185,129,0.3)' : isLowPerformer ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {isTopPerformer && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, fontSize: 9, fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 5, padding: '2px 7px' }}>⭐ Top post</div>
      )}
      {isLowPerformer && total === 0 && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, fontSize: 9, fontWeight: 800, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, padding: '2px 7px' }}>No engagement</div>
      )}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={post.author_name || post.gym_name || 'G'} size={30}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'GymPost'}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
          {post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}
        </span>
        <DeleteBtn onDelete={() => onDelete(post.id)}/>
      </div>
      {content && (
        <div style={{ padding: '0 14px 10px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', margin: 0, lineHeight: 1.4 }}>
            {post.title || content.split('\n')[0]}
          </p>
          {post.title && content !== post.title && (
            <p style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0 0', lineHeight: 1.5 }}>{content}</p>
          )}
        </div>
      )}
      {hasImage && (
        <div style={{ overflow: 'hidden' }}>
          <img src={post.image_url || post.media_url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} onError={e => e.currentTarget.parentElement.style.display = 'none'}/>
        </div>
      )}
      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: likes > 0 ? '#f87171' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart style={{ width: 14, height: 14 }}/> {likes}
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: comments > 0 ? '#38bdf8' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle style={{ width: 14, height: 14 }}/> {comments}
        </button>
        {total > 0 && (
          <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: total >= 5 ? '#34d399' : 'var(--text3)' }}>
            {total} interactions
          </div>
        )}
      </div>
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, now, onDelete }) {
  const evDate   = new Date(event.event_date);
  const diffDays = Math.floor((evDate - now) / 86400000);
  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid rgba(16,185,129,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar style={{ width: 14, height: 14, color: '#34d399' }}/>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 5, padding: '1px 7px' }}>Event</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: diffDays <= 2 ? '#f87171' : '#34d399', background: diffDays <= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: 4, padding: '2px 6px' }}>
            {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d`}
          </span>
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(event.id)}/></div>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', margin: '0 0 4px' }}>{event.title}</p>
        {event.description && (
          <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 8px', lineHeight: 1.4 }}>{event.description}</p>
        )}
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{format(evDate, 'MMM d, h:mm a')}</div>
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
  return (
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid rgba(245,158,11,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 90, background: 'linear-gradient(135deg,#1a1033,#3b1a5e,#6d28d9)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Trophy style={{ width: 30, height: 30, color: 'rgba(245,158,11,0.6)' }}/>
        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 4, padding: '2px 7px' }}>Challenge</span>
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: remaining <= 3 ? '#f87171' : 'var(--text3)', background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '2px 7px' }}>{remaining}d left</span>
        <div style={{ position: 'absolute', bottom: 8, right: 8 }}><DeleteBtn onDelete={() => onDelete(challenge.id)}/></div>
      </div>
      <div style={{ padding: '10px 14px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', margin: '0 0 6px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{parts} participants</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 75 ? '#f59e0b' : '#a78bfa' }}>{pct}% done</span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.8s ease' }}/>
        </div>
      </div>
    </div>
  );
}

// ── Class type config ──────────────────────────────────────────────────────────
const CLASS_TYPE_CONFIG_DASH = {
  hiit:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   label: 'HIIT'     },
  yoga:     { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  label: 'Yoga'     },
  strength: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)',  label: 'Strength' },
  cardio:   { color: '#fb7185', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.25)',   label: 'Cardio'   },
  spin:     { color: '#38bdf8', bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.25)',  label: 'Spin'     },
  boxing:   { color: '#fb923c', bg: 'rgba(234,88,12,0.12)',   border: 'rgba(234,88,12,0.25)',   label: 'Boxing'   },
  pilates:  { color: '#c084fc', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.25)',  label: 'Pilates'  },
  default:  { color: '#38bdf8', bg: 'rgba(14,165,233,0.10)',  border: 'rgba(14,165,233,0.2)',   label: 'Class'    },
};
const CLASS_IMAGES_DASH = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  cardio:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  spin:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
  boxing:   'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80',
  pilates:  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
  default:  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
};
function getClassTypeDash(c) {
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
  const typeKey = getClassTypeDash(gymClass);
  const cfg = CLASS_TYPE_CONFIG_DASH[typeKey] || CLASS_TYPE_CONFIG_DASH.default;
  const img = gymClass.image_url || CLASS_IMAGES_DASH[typeKey] || CLASS_IMAGES_DASH.default;
  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(160deg,#0d1535 0%,#080c1e 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 110, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(8,12,28,0.85) 100%)' }}/>
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.6)', border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '2px 7px', backdropFilter: 'blur(6px)' }}>
          {cfg.label}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)}/>
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gymClass.description}</div>}
        {(gymClass.instructor || gymClass.coach_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${cfg.color}22`, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: cfg.color, flexShrink: 0 }}>
              {initials(gymClass.instructor || gymClass.coach_name)}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{gymClass.instructor || gymClass.coach_name}</span>
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
    <div style={{ borderRadius: 12, background: 'var(--card2)', border: '1px solid rgba(139,92,246,0.15)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <BarChart2 style={{ width: 13, height: 13, color: '#a78bfa' }}/>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, padding: '1px 7px' }}>Poll</span>
        {partPct > 0 && (
          <span style={{ fontSize: 9, fontWeight: 700, color: partPct >= 50 ? '#34d399' : '#f59e0b', background: partPct >= 50 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 4, padding: '1px 6px' }}>
            {partPct}% voted
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)}/></div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', margin: '0 0 8px' }}>{poll.title}</p>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${partPct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', transition: 'width 0.6s ease' }}/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{votes} {votes === 1 ? 'vote' : 'votes'}{total > 0 ? ` of ${total} members` : ''}</div>
    </div>
  );
}

// ── NEW: Community Activity Insights ─────────────────────────────────────────
// Shows posts, likes, comments, poll votes trend over 7 days
function CommunityActivityWidget({ allPosts, polls, challenges, now }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day   = subDays(now, 6 - i);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end   = new Date(start.getTime() + 86400000);
    const posts  = allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; }).length;
    const likes  = allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; }).reduce((s, p) => s + (p.likes?.length || 0), 0);
    const comments = allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; }).reduce((s, p) => s + (p.comments?.length || 0), 0);
    return { label: format(day, 'EEE'), posts, likes, comments, total: posts + likes + comments };
  }), [allPosts, now]);

  const maxVal  = Math.max(...days.map(d => d.total), 1);
  const thisWeek = days.reduce((s, d) => s + d.total, 0);
  const trend    = days[6].total >= days[0].total;

  return (
    <Card style={{ padding: 16, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Community Activity</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Posts, likes & comments</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: trend ? '#10b981' : '#f59e0b', letterSpacing: '-0.04em' }}>{thisWeek}</span>
          {trend ? <TrendingUp style={{ width: 12, height: 12, color: '#10b981' }}/> : <TrendingDown style={{ width: 12, height: 12, color: '#f59e0b' }}/>}
        </div>
      </div>

      {/* Stacked bars by day */}
      <div style={{ display: 'flex', gap: 4, height: 48, alignItems: 'flex-end', marginBottom: 6 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 40, gap: 1 }}>
              {d.total === 0 ? (
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}/>
              ) : (
                <>
                  {d.comments > 0 && <div style={{ height: Math.max(3, (d.comments / maxVal) * 36), borderRadius: 2, background: '#38bdf8', opacity: 0.9 }}/>}
                  {d.likes > 0    && <div style={{ height: Math.max(3, (d.likes    / maxVal) * 36), borderRadius: 2, background: '#f87171', opacity: 0.9 }}/>}
                  {d.posts > 0    && <div style={{ height: Math.max(3, (d.posts    / maxVal) * 36), borderRadius: 2, background: '#a78bfa', opacity: 0.9 }}/>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{d.label}</div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[{ color: '#a78bfa', label: 'Posts' }, { color: '#f87171', label: 'Likes' }, { color: '#38bdf8', label: 'Comments' }].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }}/>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW: Top & Low Performing Content ─────────────────────────────────────────
function ContentPerformanceWidget({ allPosts, openModal }) {
  const ranked = useMemo(() => {
    return [...allPosts]
      .map(p => ({ ...p, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 }))
      .sort((a, b) => b.score - a.score);
  }, [allPosts]);

  const top3  = ranked.slice(0, 3);
  const low3  = ranked.filter(p => p.score === 0).slice(0, 3);

  if (allPosts.length === 0) return null;

  return (
    <Card style={{ padding: 16, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Content Performance</div>

      {/* Top performers */}
      {top3.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>⭐ Top performing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {top3.map((p, i) => (
              <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#34d399', flexShrink: 0 }}>{i + 1}</div>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(p.title || p.content || '').split('\n')[0].slice(0, 40) || 'Post'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#f87171' }}>♥ {p.likes?.length || 0}</span>
                  <span style={{ fontSize: 10, color: '#38bdf8' }}>💬 {p.comments?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Low performers / no engagement */}
      {low3.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>📉 No engagement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {low3.map((p, i) => (
              <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(p.title || p.content || '').split('\n')[0].slice(0, 40) || 'Post'}
                </span>
                <span style={{ fontSize: 9, color: '#64748b' }}>{p.created_date ? format(new Date(p.created_date), 'MMM d') : ''}</span>
              </div>
            ))}
          </div>
          <button onClick={() => openModal('post')} style={{ width: '100%', fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}>
            Post something new →
          </button>
        </>
      )}
    </Card>
  );
}

// ── NEW: Challenge Completion Rates ────────────────────────────────────────────
function ChallengeCompletionWidget({ challenges, allMemberships, now }) {
  const data = useMemo(() => {
    return challenges
      .filter(c => c.start_date && c.end_date)
      .map(c => {
        const end     = new Date(c.end_date);
        const isEnded = end < now;
        const parts   = c.participants?.length || 0;
        const members = allMemberships.length || 1;
        const joinPct = Math.round((parts / members) * 100);
        const compPct = c.completions ? Math.round((c.completions / Math.max(parts, 1)) * 100) : null;
        return { ...c, isEnded, parts, joinPct, compPct };
      })
      .sort((a, b) => b.parts - a.parts)
      .slice(0, 4);
  }, [challenges, allMemberships, now]);

  if (data.length === 0) return null;

  return (
    <Card style={{ padding: 16, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Challenge Uptake</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.map((c, i) => (
          <div key={c.id || i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{c.title}</span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>{c.parts} joined</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.joinPct >= 50 ? '#34d399' : c.joinPct >= 25 ? '#f59e0b' : '#f87171' }}>{c.joinPct}%</span>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.joinPct}%`, borderRadius: 99, background: c.joinPct >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.6s ease' }}/>
            </div>
            {c.joinPct < 25 && (
              <div style={{ fontSize: 9, color: '#f87171', marginTop: 2, fontWeight: 600 }}>Low uptake — promote this challenge</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW: Engagement Trend (week over week) ────────────────────────────────────
function EngagementTrendWidget({ allPosts, polls, challenges, now }) {
  const { thisWeek, lastWeek, change } = useMemo(() => {
    const weekStart = subDays(now, 7);
    const prevStart = subDays(now, 14);

    const scoreForPeriod = (start, end) => {
      const posts = allPosts.filter(p => {
        const d = new Date(p.created_date);
        return d >= start && d < end;
      });
      const postEng = posts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
      const pollEng = polls.filter(p => {
        const d = new Date(p.created_date || 0);
        return d >= start && d < end;
      }).reduce((s, p) => s + (p.voters?.length || 0), 0);
      return postEng + pollEng;
    };

    const thisWeek = scoreForPeriod(weekStart, now);
    const lastWeek = scoreForPeriod(prevStart, weekStart);
    const change   = lastWeek === 0 ? 0 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    return { thisWeek, lastWeek, change };
  }, [allPosts, polls, now]);

  const up = change >= 0;

  return (
    <Card style={{ padding: 16, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Engagement Trend</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Week over week</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {up ? <TrendingUp style={{ width: 14, height: 14, color: '#10b981' }}/> : <TrendingDown style={{ width: 14, height: 14, color: '#ef4444' }}/>}
          <span style={{ fontSize: 14, fontWeight: 900, color: up ? '#10b981' : '#ef4444', letterSpacing: '-0.02em' }}>
            {up ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'This week', val: thisWeek, color: up ? '#10b981' : '#ef4444' },
          { label: 'Last week', val: lastWeek, color: '#64748b' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.04em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {change < 0 && (
        <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>Engagement dropped — consider a new challenge or poll to re-activate members</div>
        </div>
      )}
    </Card>
  );
}

// ── NEW: Member Content Leaderboard ───────────────────────────────────────────
// Who in your community is posting and engaging most
function MemberEngagementLeaderboard({ allPosts, avatarMap, allMemberships }) {
  const leaders = useMemo(() => {
    const scores = {};
    allPosts.forEach(p => {
      if (!p.user_id) return;
      if (!scores[p.user_id]) scores[p.user_id] = { userId: p.user_id, name: p.author_name || 'Member', posts: 0, likes: 0, comments: 0 };
      scores[p.user_id].posts++;
    });
    allPosts.forEach(p => {
      (p.comments || []).forEach(c => {
        const id = c.user_id || c.author_id;
        if (!id) return;
        if (!scores[id]) scores[id] = { userId: id, name: c.author_name || 'Member', posts: 0, likes: 0, comments: 0 };
        scores[id].comments++;
      });
    });
    return Object.values(scores)
      .map(s => ({ ...s, score: s.posts * 3 + s.comments * 2 + s.likes }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [allPosts]);

  if (leaders.length === 0) return null;

  return (
    <Card style={{ padding: 16, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>🏆 Top Community Contributors</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {leaders.map((m, i) => (
          <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? '#f59e0b' : 'var(--text3)', flexShrink: 0 }}>
              {i + 1}
            </div>
            <Avatar name={m.name} size={24} src={avatarMap[m.userId] || null}/>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {m.posts > 0    && <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa' }}>{m.posts}p</span>}
              {m.comments > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8' }}>{m.comments}c</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW: What to post today smart panel ───────────────────────────────────────
function WhatToPostPanel({ allPosts, polls, challenges, events, now, openModal }) {
  const suggestions = useMemo(() => {
    const items = [];
    const daysSinceLastPost = allPosts.length > 0
      ? differenceInDays(now, new Date(allPosts[0]?.created_date || now))
      : 999;

    if (daysSinceLastPost >= 3) {
      items.push({ color: '#f59e0b', icon: MessageSquarePlus, label: `No post in ${daysSinceLastPost} days — keep your feed active`, action: 'Post now', fn: () => openModal('post') });
    }

    const activePollCount = polls.filter(p => !p.ended_at).length;
    if (activePollCount === 0) {
      items.push({ color: '#a78bfa', icon: BarChart2, label: 'No active poll — polls drive high engagement', action: 'Create poll', fn: () => openModal('poll') });
    }

    const activeChallenge = challenges.find(c => c.status === 'active');
    if (!activeChallenge) {
      items.push({ color: '#fbbf24', icon: Trophy, label: 'No active challenge — members lose motivation without one', action: 'Start one', fn: () => openModal('challenge') });
    }

    const upcomingEvent = events.find(e => new Date(e.event_date) >= now);
    if (!upcomingEvent) {
      items.push({ color: '#34d399', icon: Calendar, label: 'No upcoming events — schedule something to build excitement', action: 'Add event', fn: () => openModal('event') });
    }

    return items.slice(0, 3);
  }, [allPosts, polls, challenges, events, now]);

  if (suggestions.length === 0) return null;

  return (
    <Card style={{ padding: 16, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Sparkles style={{ width: 13, height: 13, color: '#0ea5e9' }}/>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Content suggestions</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {suggestions.map((s, i) => (
          <div key={i} onClick={s.fn} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, background: `${s.color}08`, border: `1px solid ${s.color}20`, cursor: 'pointer', transition: 'background 0.14s' }}>
            <s.icon style={{ width: 12, height: 12, color: s.color, flexShrink: 0 }}/>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4 }}>{s.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: s.color, whiteSpace: 'nowrap', padding: '2px 7px', borderRadius: 5, background: `${s.color}15`, flexShrink: 0 }}>{s.action}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabContent({
  events, challenges, polls, posts, userPosts = [], checkIns, ci30, avatarMap,
  openModal, now, leaderboardView, setLeaderboardView, allMemberships = [], classes = [],
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

  // Top/low performers for feed badge decoration
  const postScores = useMemo(() => {
    return allPosts.map(p => ({ id: p.id, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 }));
  }, [allPosts]);
  const maxScore = Math.max(...postScores.map(p => p.score), 1);
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
      case 'members':    return { posts: memberPosts, events: [], challenges: [], polls: [], classes: [] };
      case 'gym':        return { posts: gymPosts,    events: [], challenges: [], polls: [], classes: [] };
      case 'challenges': return { posts: [], events: [], challenges: activeChallenges, polls: [], classes: [] };
      case 'classes':    return { posts: [], events: [], challenges: [], polls: [], classes };
      case 'polls':      return { posts: [], events: [], challenges: [], polls, classes: [] };
      case 'events':     return { posts: [], events: upcomingEvents, challenges: [], polls: [], classes: [] };
      default:           return { posts: allPosts, events: upcomingEvents, challenges: activeChallenges, polls, classes };
    }
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const flatFeedItems = useMemo(() => {
    const items = [
      ...feedItems.posts.map(p      => ({ type: 'post',      data: p, date: new Date(p.created_date || 0) })),
      ...feedItems.events.map(e     => ({ type: 'event',     data: e, date: new Date(e.event_date    || 0) })),
      ...feedItems.challenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date    || 0) })),
      ...feedItems.polls.map(p      => ({ type: 'poll',      data: p, date: new Date(p.created_date  || 0) })),
      ...feedItems.classes.map(c    => ({ type: 'class',     data: c, date: new Date(c.created_date  || 0) })),
    ];
    return items.sort((a, b) => b.date - a.date);
  }, [feedItems]);

  const col1 = flatFeedItems.filter((_, i) => i % 2 === 0);
  const col2 = flatFeedItems.filter((_, i) => i % 2 === 1);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <FeedCard      key={item.data.id || i} post={item.data}      onDelete={onDeletePost} isTopPerformer={topPostIds.has(item.data.id)} isLowPerformer={lowPostIds.has(item.data.id)}/>;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     now={now} onDelete={onDeleteEvent}/>;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} now={now} onDelete={onDeleteChallenge}/>;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll} allMemberships={allMemberships}/>;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass}/>;
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
        const next   = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
        const recent = ci30.filter(c => c.user_name === name).length;
        return { name, total, next, toNext: next ? next - total : 0, recent, user_id: userIdByName[name] };
      })
      .filter(m => m.next && m.toNext <= 5)
      .sort((a, b) => a.toNext - b.toNext)
      .slice(0, 4);
  }, [checkIns, ci30]);

  const engagementScore = useMemo(() => {
    const postEng  = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
    const pollEng  = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);
    const chalEng  = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
    const eventEng = events.reduce((s, e) => s + (e.attendees || 0), 0);
    return postEng + pollEng + chalEng + eventEng;
  }, [allPosts, polls, activeChallenges, events]);

  const contentMix = useMemo(() => {
    const total = allPosts.length + events.length + polls.length + challenges.length;
    if (!total) return null;
    return [
      { label: 'Posts',      count: allPosts.length,   color: '#38bdf8', pct: Math.round((allPosts.length   / total) * 100) },
      { label: 'Events',     count: events.length,     color: '#34d399', pct: Math.round((events.length     / total) * 100) },
      { label: 'Polls',      count: polls.length,      color: '#a78bfa', pct: Math.round((polls.length      / total) * 100) },
      { label: 'Challenges', count: challenges.length, color: '#fbbf24', pct: Math.round((challenges.length / total) * 100) },
    ];
  }, [allPosts, events, polls, challenges]);

  const cadenceData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day   = subDays(now, 6 - i);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end   = new Date(start.getTime() + 86400000);
      const count = allPosts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; }).length;
      return { label: format(day, 'EEE'), count };
    });
  }, [allPosts, now]);
  const cadenceMax = Math.max(...cadenceData.map(d => d.count), 1);

  const pollParticipationRate = useMemo(() => {
    if (!polls.length || !allMemberships.length) return null;
    const totalVotes  = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);
    const maxPossible = polls.length * allMemberships.length;
    return Math.round((totalVotes / maxPossible) * 100);
  }, [polls, allMemberships]);

  const unreachedMembers = useMemo(() => {
    const recentCheckerIds = new Set(ci30.map(c => c.user_id));
    const challengeIds     = new Set(activeChallenges.flatMap(c => c.participants || []));
    const pollVoterIds     = new Set(polls.flatMap(p => p.voters || []));
    return allMemberships.filter(m =>
      !recentCheckerIds.has(m.user_id) &&
      !challengeIds.has(m.user_id) &&
      !pollVoterIds.has(m.user_id)
    ).slice(0, 4);
  }, [allMemberships, ci30, activeChallenges, polls]);

  return (
    <>
      <style>{MOBILE_CSS}</style>
      <div className="tc-root">

        {/* ── LEFT ── */}
        <div className="tc-left">
          {/* Action cards */}
          <div className="tc-actions" style={{ flexShrink: 0 }}>
            {(isCoach ? [
              { icon: Dumbbell,          label: 'My Classes',    sub: `${classes.length} classes`,         grad: 'linear-gradient(135deg,#1a0a3e 0%,#2d1060 50%,#7c3aed 100%)', border: 'rgba(167,139,250,0.3)', iconBg: 'rgba(167,139,250,0.2)', iconColor: '#c4b5fd', fn: () => openModal('classes')   },
              { icon: MessageSquarePlus, label: 'New Post',      sub: 'Engage members',                    grad: 'linear-gradient(135deg,#0f2a4a 0%,#1a4a7a 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)',  iconBg: 'rgba(14,165,233,0.2)',  iconColor: '#7dd3fc', fn: () => openModal('post')      },
              { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`, grad: 'linear-gradient(135deg,#0a2e28 0%,#0d4a3a 50%,#059669 100%)', border: 'rgba(16,185,129,0.3)',  iconBg: 'rgba(16,185,129,0.2)',  iconColor: '#6ee7b7', fn: () => openModal('event')     },
              { icon: Trophy,            label: 'Challenge',     sub: `${activeChallenges.length} active`, grad: 'linear-gradient(135deg,#3a1010 0%,#5a1a1a 50%,#dc2626 100%)', border: 'rgba(239,68,68,0.3)',   iconBg: 'rgba(239,68,68,0.2)',   iconColor: '#fca5a5', fn: () => openModal('challenge') },
              { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,            grad: 'linear-gradient(135deg,#1e0a3a 0%,#2d1060 50%,#7c3aed 100%)', border: 'rgba(139,92,246,0.3)', iconBg: 'rgba(139,92,246,0.2)', iconColor: '#c4b5fd', fn: () => openModal('poll')      },
            ] : [
              { icon: MessageSquarePlus, label: 'New Post',      sub: 'Share with members',                grad: 'linear-gradient(135deg,#0f2a4a 0%,#1a4a7a 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)',  iconBg: 'rgba(14,165,233,0.2)',  iconColor: '#7dd3fc', fn: () => openModal('post')      },
              { icon: Calendar,          label: 'New Event',     sub: `${upcomingEvents.length} upcoming`, grad: 'linear-gradient(135deg,#0a2e28 0%,#0d4a3a 50%,#059669 100%)', border: 'rgba(16,185,129,0.3)',  iconBg: 'rgba(16,185,129,0.2)',  iconColor: '#6ee7b7', fn: () => openModal('event')     },
              { icon: Dumbbell,          label: 'Classes',       sub: `${classes.length} total`,           grad: 'linear-gradient(135deg,#0a2038 0%,#0d3060 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)',  iconBg: 'rgba(14,165,233,0.2)',  iconColor: '#67e8f9', fn: () => openModal('classes')   },
              { icon: Trophy,            label: 'New Challenge', sub: `${activeChallenges.length} active`, grad: 'linear-gradient(135deg,#3a1010 0%,#5a1a1a 50%,#dc2626 100%)', border: 'rgba(239,68,68,0.3)',   iconBg: 'rgba(239,68,68,0.2)',   iconColor: '#fca5a5', fn: () => openModal('challenge') },
              { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,            grad: 'linear-gradient(135deg,#1e0a3a 0%,#2d1060 50%,#7c3aed 100%)', border: 'rgba(139,92,246,0.3)', iconBg: 'rgba(139,92,246,0.2)', iconColor: '#c4b5fd', fn: () => openModal('poll')      },
            ]).map(({ icon: Icon, label, sub, grad, border, iconBg, iconColor, fn }, i) => (
              <div key={i} onClick={fn} className="tc-action-btn"
                style={{ background: grad, border: `1px solid ${border}` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: iconColor, opacity: 0.12, filter: 'blur(16px)' }}/>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon style={{ width: 13, height: 13, color: iconColor }}/>
                </div>
                <div className="tc-action-label" style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, letterSpacing: '-0.02em' }}>{label}</div>
                <div className="tc-action-sub" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="tc-tabs">
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', padding: '7px 16px 7px 2px', marginBottom: -1, flexShrink: 0 }}>Feed</span>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className="tc-tab-btn"
                style={{ fontWeight: activeFilter === f.id ? 700 : 500, color: activeFilter === f.id ? 'var(--text1)' : 'var(--text3)', borderBottom: activeFilter === f.id ? '2px solid #a78bfa' : '2px solid transparent', marginBottom: -1 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Two-column feed */}
          <div className="tc-feed">
            {flatFeedItems.length > 0 ? (
              <div className="tc-feed-grid">
                <div className="tc-feed-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col1.map((item, i) => renderItem(item, i))}
                </div>
                <div className="tc-feed-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col2.map((item, i) => renderItem(item, i))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquarePlus style={{ width: 20, height: 20, color: 'rgba(14,165,233,0.4)' }}/>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, margin: 0 }}>Nothing here yet</p>
                <button onClick={() => openModal('post')} style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                  Create first post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="tc-sidebar">
          {isCoach ? (
            // ── COACH SIDEBAR ────────────────────────────────────────────────
            <>
              <Card style={{ padding: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>My Content Impact</div>
                  <Zap style={{ width: 14, height: 14, color: '#a78bfa' }}/>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.04em', lineHeight: 1 }}>{engagementScore}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, paddingBottom: 4 }}>interactions</span>
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Likes',      val: allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0), color: '#f87171' },
                    { label: 'Comments',   val: allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: '#38bdf8' },
                    { label: 'Poll votes', val: polls.reduce((s, p)   => s + (p.voters?.length    || 0), 0), color: '#a78bfa' },
                  ].map((s, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: s.color }}>
                      {s.val} {s.label}
                    </div>
                  ))}
                </div>
              </Card>

              <EngagementTrendWidget allPosts={allPosts} polls={polls} challenges={challenges} now={now}/>

              <Card style={{ padding: 16, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 12 }}>My Classes & Events</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { count: classes.length,         label: 'My Classes',        color: '#a78bfa' },
                    { count: upcomingEvents.length,   label: 'Upcoming Events',   color: '#34d399' },
                    { count: activeChallenges.length, label: 'Active Challenges', color: '#fbbf24' },
                    { count: polls.length,            label: 'Active Polls',      color: '#38bdf8' },
                  ].map((s, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', minWidth: 26 }}>{s.count}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {unreachedMembers.length > 0 && (
                <Card style={{ padding: 16, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Clients Not Reached</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '2px 6px' }}>{unreachedMembers.length}</div>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10, fontWeight: 500, lineHeight: 1.4 }}>No check-ins, poll votes, or challenge joins in 30 days.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {unreachedMembers.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={m.user_name || '?'} size={26} src={avatarMap[m.user_id] || null}/>
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</span>
                        <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Reach</button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {milestones.length > 0 && (
                <Card style={{ padding: 16, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>🎯 Client Milestones</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {milestones.map((m, i) => (
                      <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <Avatar name={m.name} size={30} src={avatarMap[m.user_id] || null}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: m.toNext === 1 ? '#34d399' : 'var(--text3)', marginTop: 1 }}>{m.toNext === 1 ? '🎉 1 visit to go!' : `${m.toNext} visits to go`}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{m.total}</div>
                          <div style={{ fontSize: 9, color: 'var(--text3)' }}>→ {m.next}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            // ── GYM OWNER SIDEBAR ─────────────────────────────────────────────
            <>
              {/* Content suggestions */}
              <WhatToPostPanel allPosts={allPosts} polls={polls} challenges={challenges} events={events} now={now} openModal={openModal}/>

              {/* Engagement Score */}
              <Card style={{ padding: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Engagement Score</div>
                  <Zap style={{ width: 14, height: 14, color: '#fbbf24' }}/>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.04em', lineHeight: 1 }}>{engagementScore}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, paddingBottom: 4 }}>total interactions</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Likes',        val: allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0), color: '#f87171' },
                    { label: 'Comments',     val: allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: '#38bdf8' },
                    { label: 'Poll votes',   val: polls.reduce((s, p)   => s + (p.voters?.length    || 0), 0), color: '#a78bfa' },
                    { label: 'In challenge', val: totalChalPart,                                                color: '#fbbf24' },
                  ].map((s, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: s.color }}>
                      {s.val} {s.label}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Engagement trend WoW */}
              <EngagementTrendWidget allPosts={allPosts} polls={polls} challenges={challenges} now={now}/>

              {/* Community activity 7-day chart */}
              <CommunityActivityWidget allPosts={allPosts} polls={polls} challenges={challenges} now={now}/>

              {/* Content performance: top & low */}
              <ContentPerformanceWidget allPosts={allPosts} openModal={openModal}/>

              {/* Challenge uptake rates */}
              <ChallengeCompletionWidget challenges={challenges} allMemberships={allMemberships} now={now}/>

              {/* Top community contributors */}
              <MemberEngagementLeaderboard allPosts={allPosts} avatarMap={avatarMap} allMemberships={allMemberships}/>

              {/* Posting Cadence */}
              <Card style={{ padding: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Posting Cadence</div>
                  <TrendingUp style={{ width: 14, height: 14, color: '#38bdf8' }}/>
                </div>
                <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'flex-end' }}>
                  {cadenceData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', height: d.count === 0 ? 3 : Math.max(6, (d.count / cadenceMax) * 32), borderRadius: 3, background: d.count === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(180deg,#38bdf8,#0ea5e9)', transition: 'height 0.4s ease' }}/>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {cadenceData.map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{d.label}</div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
                  {cadenceData.filter(d => d.count > 0).length} active days this week
                  {cadenceData.filter(d => d.count > 0).length < 3 && (
                    <span style={{ color: '#f59e0b', marginLeft: 6, fontWeight: 700 }}>— post more often</span>
                  )}
                </div>
              </Card>

              {/* Content Mix */}
              {contentMix && (
                <Card style={{ padding: 16, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 10 }}>Content Mix</div>
                  <div style={{ display: 'flex', height: 7, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 10 }}>
                    {contentMix.filter(c => c.pct > 0).map((c, i) => (
                      <div key={i} style={{ width: `${c.pct}%`, background: c.color, borderRadius: 99, transition: 'width 0.6s ease' }}/>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {contentMix.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }}/>
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{c.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1)' }}>{c.count}</span>
                        <span style={{ fontSize: 10, color: 'var(--text3)', width: 28, textAlign: 'right' }}>{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Poll Participation */}
              {pollParticipationRate !== null && (
                <Card style={{ padding: 16, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Poll Participation</div>
                    <BarChart2 style={{ width: 14, height: 14, color: '#a78bfa' }}/>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: pollParticipationRate >= 50 ? '#34d399' : pollParticipationRate >= 25 ? '#fbbf24' : '#f87171', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {pollParticipationRate}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, paddingBottom: 3 }}>of members voting</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pollParticipationRate}%`, borderRadius: 99, background: pollParticipationRate >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : pollParticipationRate >= 25 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', transition: 'width 0.8s ease' }}/>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, fontWeight: 500 }}>
                    {pollParticipationRate < 25 ? 'Low — try shorter, punchier polls' : pollParticipationRate < 50 ? 'Decent — pin polls to your feed' : 'Great engagement on polls!'}
                  </p>
                </Card>
              )}

              {/* Unreached Members */}
              {unreachedMembers.length > 0 && (
                <Card style={{ padding: 16, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Not Reached</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '2px 6px' }}>{unreachedMembers.length}</div>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10, fontWeight: 500, lineHeight: 1.4 }}>
                    Members with no check-ins, poll votes, or challenge joins in 30 days.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {unreachedMembers.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={m.user_name || m.user_id || '?'} size={26} src={avatarMap[m.user_id] || null}/>
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</span>
                        <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Reach</button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Content Stats */}
              <Card style={{ padding: 16, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Content Stats</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { count: upcomingEvents.length, label: 'Upcoming Events',        color: '#10b981' },
                    { count: totalChalPart,          label: 'Challenge Participants', color: '#f59e0b' },
                    { count: polls.length,           label: 'Active Polls',           color: '#8b5cf6' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', minWidth: 28 }}>{s.count}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{s.label}</span>
                      <ChevronRight style={{ width: 13, height: 13, color: 'var(--text3)' }}/>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Milestones */}
              {milestones.length > 0 && (
                <Card style={{ padding: 16, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Upcoming Member Milestones</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {milestones.map((m, i) => (
                      <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <Avatar name={m.name} size={34} src={avatarMap[m.user_id] || null}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{m.toNext === 1 ? '1 visit to go!' : `${m.toNext} visits to go`}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{m.total} visits</div>
                          <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>→ {m.next} visits</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
