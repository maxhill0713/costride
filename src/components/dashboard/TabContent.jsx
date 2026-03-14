import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Plus, Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight, TrendingUp, Zap, Heart, MessageCircle, Dumbbell, MoreHorizontal, Trash2, FileText, Image } from 'lucide-react';
import { Card, Empty, Avatar } from './DashboardPrimitives';

// ── 3-dot menu delete button ──────────────────────────────────────────────────
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
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'transparent', transition: 'all 0.12s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'transparent'; } }}>
        <MoreHorizontal style={{ width: 14, height: 14 }}/>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 30, right: 0, zIndex: 9999, background: '#060c18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.6)', minWidth: 120, overflow: 'hidden' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', fontSize: 12, fontWeight: 700, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Trash2 style={{ width: 12, height: 12 }}/> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Post type badge ───────────────────────────────────────────────────────────
const TYPE_CFG = {
  post:         { label: 'Post',     color: '#64748b', bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.15)' },
  announcement: { label: 'Announce', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)'  },
  workout:      { label: 'Workout',  color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)'   },
  photo:        { label: 'Photo',    color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)'   },
  join_flyer:   { label: 'Flyer',    color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'   },
};
function getPostType(post) {
  if (post.post_type === 'join_flyer') return 'join_flyer';
  if (post.post_type === 'announcement') return 'announcement';
  if (post.post_type === 'workout' || post.workout_data) return 'workout';
  if (post.image_url || post.media_url || post.post_type === 'photo') return 'photo';
  return 'post';
}
function TypeBadge({ type }) {
  const c = TYPE_CFG[type] || TYPE_CFG.post;
  return (
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 5, background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0 }}>
      {c.label}
    </span>
  );
}

// ── Feed post card ────────────────────────────────────────────────────────────
function FeedCard({ post, onDelete }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const hasImage = post.image_url || post.media_url;
  const content  = post.content || post.title || '';
  const type     = getPostType(post);
  const isFlyer  = type === 'join_flyer';
  return (
    <div style={{ borderRadius: 14, background: 'var(--card2)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ padding: '11px 13px 9px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={post.author_name || post.gym_name || 'G'} size={28}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.author_name || post.gym_name || 'GymPost'}
            </span>
            <TypeBadge type={type}/>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
            {post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}
          </div>
        </div>
        <DeleteBtn onDelete={() => onDelete(post.id)}/>
      </div>
      {/* Join flyer — compact preview instead of full embed */}
      {isFlyer ? (
        <div style={{ margin: '0 13px 10px', padding: '9px 11px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Image style={{ width: 14, height: 14, color: '#34d399' }}/>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>Join Flyer</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Shareable community poster</div>
          </div>
        </div>
      ) : (
        <>
          {content && (
            <div style={{ padding: '0 13px 9px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.title || content.split('\n')[0]}
              </p>
              {post.title && content !== post.title && (
                <p style={{ fontSize: 11, color: 'var(--text2)', margin: '3px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{content}</p>
              )}
            </div>
          )}
          {hasImage && (
            <div style={{ overflow: 'hidden' }}>
              <img src={post.image_url || post.media_url} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} onError={e => e.currentTarget.parentElement.style.display = 'none'}/>
            </div>
          )}
        </>
      )}
      <div style={{ padding: '7px 13px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 'auto' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: likes > 0 ? '#f87171' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart style={{ width: 12, height: 12 }}/>{likes}
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: comments > 0 ? '#38bdf8' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle style={{ width: 12, height: 12 }}/>{comments}
        </button>
      </div>
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, now, onDelete }) {
  const evDate   = new Date(event.event_date);
  const diffDays = Math.floor((evDate - now) / 86400000);
  const urgency  = diffDays >= 0 && diffDays <= 2;
  return (
    <div style={{ borderRadius: 14, background: 'var(--card2)', border: '1px solid rgba(52,211,153,0.12)', overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.12)'}>
      <div style={{ padding: '13px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          {/* Date block */}
          <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 9, padding: '6px 9px', textAlign: 'center', minWidth: 38 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(evDate, 'd')}</div>
            <div style={{ fontSize: 8, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 1 }}>{format(evDate, 'MMM')}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', margin: '0 0 4px', lineHeight: 1.3 }}>{event.title}</p>
            <span style={{ fontSize: 9, fontWeight: 700, color: urgency ? '#f87171' : '#34d399', background: urgency ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '2px 6px' }}>
              {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : diffDays < 0 ? 'Past' : `${diffDays}d away`}
            </span>
          </div>
          <DeleteBtn onDelete={() => onDelete(event.id)}/>
        </div>
        {event.description && <p style={{ fontSize: 11, color: 'var(--text2)', margin: '0 0 6px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.description}</p>}
        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

// ── Challenge card ────────────────────────────────────────────────────────────
function ChallengeCard({ challenge, now, onDelete }) {
  const start     = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalDays = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed   = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalDays - elapsed);
  const pct       = Math.min(100, Math.round((elapsed / totalDays) * 100));
  const statusColor = challenge.status === 'active' ? '#34d399' : challenge.status === 'upcoming' ? '#fbbf24' : '#64748b';
  return (
    <div style={{ borderRadius: 14, background: 'var(--card2)', border: '1px solid rgba(245,158,11,0.12)', overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.12)'}>
      <div style={{ padding: '13px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy style={{ width: 16, height: 16, color: '#fbbf24' }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{challenge.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, background: statusColor + '18', borderRadius: 4, padding: '2px 6px' }}>{challenge.status || 'draft'}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{challenge.participants?.length || 0} joined</span>
              {remaining > 0 && <span style={{ fontSize: 10, color: remaining <= 3 ? '#f87171' : 'var(--text3)' }}>{remaining}d left</span>}
            </div>
          </div>
          <DeleteBtn onDelete={() => onDelete(challenge.id)}/>
        </div>
        {challenge.description && <p style={{ fontSize: 11, color: 'var(--text2)', margin: '0 0 9px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{challenge.description}</p>}
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.8s ease' }}/>
        </div>
        <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4, textAlign: 'right' }}>{pct}% complete</div>
      </div>
    </div>
  );
}

// ── Class type config ─────────────────────────────────────────────────────────
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

// ── Class card ────────────────────────────────────────────────────────────────
function ClassCard({ gymClass, onDelete }) {
  const typeKey = getClassTypeDash(gymClass);
  const cfg = CLASS_TYPE_CONFIG_DASH[typeKey] || CLASS_TYPE_CONFIG_DASH.default;
  const img = gymClass.image_url || CLASS_IMAGES_DASH[typeKey] || CLASS_IMAGES_DASH.default;
  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(160deg,#0d1535 0%,#080c1e 100%)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
      <div style={{ position: 'relative', height: 100, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.04) 0%,rgba(8,12,28,0.88) 100%)' }}/>
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.6)', border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '2px 7px', backdropFilter: 'blur(6px)' }}>
          {cfg.label}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)}/>
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gymClass.description}</div>}
        {(gymClass.instructor || gymClass.coach_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${cfg.color}22`, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: cfg.color, flexShrink: 0 }}>
              {initials(gymClass.instructor || gymClass.coach_name)}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{gymClass.instructor || gymClass.coach_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Poll card ─────────────────────────────────────────────────────────────────
function PollCard({ poll, onDelete }) {
  const votes = poll.voters?.length || 0;
  return (
    <div style={{ borderRadius: 14, background: 'var(--card2)', border: '1px solid rgba(139,92,246,0.12)', padding: '13px 14px', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
          <BarChart2 style={{ width: 13, height: 13, color: '#a78bfa', flexShrink: 0 }}/>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{poll.title || poll.question}</span>
        </div>
        <DeleteBtn onDelete={() => onDelete(poll.id)}/>
      </div>
      {/* Per-option vote bars */}
      {(poll.options || []).slice(0, 3).map((opt, i) => {
        const label    = typeof opt === 'object' ? (opt.text || opt.label || String(opt)) : opt;
        const optVotes = typeof opt === 'object' ? (opt.votes || 0) : 0;
        const pct      = votes > 0 ? Math.round((optVotes / votes) * 100) : 0;
        return (
          <div key={i} style={{ marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: 99, transition: 'width 0.5s ease' }}/>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 4 }}>{votes} {votes === 1 ? 'vote' : 'votes'}</div>
    </div>
  );
}

// ── Empty state per tab ───────────────────────────────────────────────────────
const EMPTY_COPY = {
  members:    { label: 'No member posts yet',  sub: 'Members haven\'t posted anything yet.',             modal: null,        btn: null                },
  gym:        { label: 'No gym posts yet',     sub: 'Share updates and announcements with your members.', modal: 'post',     btn: 'Create first post' },
  challenges: { label: 'No challenges yet',   sub: 'Challenges boost check-ins by up to 40%.',           modal: 'challenge', btn: 'Create challenge'  },
  classes:    { label: 'No classes added',    sub: 'Add your schedule so members know what\'s on.',      modal: 'classes',   btn: 'Add classes'       },
  polls:      { label: 'No active polls',     sub: 'Polls are great for deciding on class times.',       modal: 'poll',      btn: 'Create poll'       },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function TabContent({
  events, challenges, polls, posts, userPosts = [], checkIns, ci30, avatarMap,
  openModal, now, leaderboardView, setLeaderboardView, allMemberships = [], classes = [],
  onDeletePost = () => {}, onDeleteEvent = () => {}, onDeleteChallenge = () => {},
  onDeleteClass = () => {}, onDeletePoll = () => {},
}) {
  const [activeFilter, setActiveFilter] = useState('gym');

  const allPosts         = [...(userPosts || []), ...(posts || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const gymPosts         = allPosts.filter(p => !p.user_id || p.gym_id || p.member_id);
  const memberPosts      = allPosts.filter(p => p.user_id && !p.gym_id);
  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalChalPart    = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);

  // Tab count badges
  const FILTERS = [
    { id: 'gym',        label: 'Gym Posts',   count: gymPosts.length        },
    { id: 'members',    label: 'Members',     count: memberPosts.length     },
    { id: 'challenges', label: 'Challenges',  count: challenges.length      },
    { id: 'classes',    label: 'Classes',     count: classes.length         },
    { id: 'polls',      label: 'Polls',       count: polls.length           },
  ];

  const feedItems = useMemo(() => {
    switch (activeFilter) {
      case 'members':    return { posts: memberPosts,     events: [], challenges: [],            polls: [],    classes: []     };
      case 'gym':        return { posts: gymPosts,        events: [], challenges: [],            polls: [],    classes: []     };
      case 'challenges': return { posts: [],              events: [], challenges: activeChallenges, polls: [], classes: []     };
      case 'classes':    return { posts: [],              events: [], challenges: [],            polls: [],    classes: classes };
      case 'polls':      return { posts: [],              events: [], challenges: [],            polls: polls, classes: []     };
      default:           return { posts: allPosts,        events: upcomingEvents, challenges: activeChallenges, polls, classes };
    }
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const flatFeedItems = useMemo(() => {
    return [
      ...feedItems.posts.map(p      => ({ type: 'post',      data: p, date: new Date(p.created_date || 0) })),
      ...feedItems.events.map(e     => ({ type: 'event',     data: e, date: new Date(e.event_date    || 0) })),
      ...feedItems.challenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date    || 0) })),
      ...feedItems.polls.map(p      => ({ type: 'poll',      data: p, date: new Date(p.created_date  || 0) })),
      ...feedItems.classes.map(c    => ({ type: 'class',     data: c, date: new Date(c.created_date  || 0) })),
    ].sort((a, b) => b.date - a.date);
  }, [feedItems]);

  const col1 = flatFeedItems.filter((_, i) => i % 2 === 0);
  const col2 = flatFeedItems.filter((_, i) => i % 2 === 1);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <FeedCard      key={item.data.id || i} post={item.data}      onDelete={onDeletePost}/>;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     now={now} onDelete={onDeleteEvent}/>;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} now={now} onDelete={onDeleteChallenge}/>;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}/>;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass}/>;
    return null;
  };

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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(260px,22%,320px)', gap: 16, height: '100%', maxWidth: '100%' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 }}>

        {/* Action row — compact buttons replacing the giant gradient panels */}
        <div style={{ flexShrink: 0, paddingBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {[
              { icon: FileText,          label: 'New Post',    sub: 'Share',                              color: '#38bdf8', border: 'rgba(56,189,248,0.15)',  fn: () => openModal('post')      },
              { icon: Calendar,          label: 'New Event',   sub: `${upcomingEvents.length} upcoming`,  color: '#34d399', border: 'rgba(52,211,153,0.15)',  fn: () => openModal('event')     },
              { icon: Dumbbell,          label: 'Classes',     sub: `${classes.length} total`,            color: '#67e8f9', border: 'rgba(56,189,248,0.15)',  fn: () => openModal('classes')   },
              { icon: Trophy,            label: 'Challenge',   sub: `${activeChallenges.length} active`,  color: '#fbbf24', border: 'rgba(245,158,11,0.15)',  fn: () => openModal('challenge') },
              { icon: BarChart2,         label: 'New Poll',    sub: `${polls.length} active`,             color: '#a78bfa', border: 'rgba(139,92,246,0.15)', fn: () => openModal('poll')      },
            ].map(({ icon: Icon, label, sub, color, border, fn }, i) => (
              <button key={i} onClick={fn} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7,
                padding: '11px 12px', borderRadius: 12,
                background: color + '0d', border: `1px solid ${border}`,
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = color + '44'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = border; }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 12, height: 12, color }}/>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{label}</div>
                <div style={{ fontSize: 9, color, opacity: 0.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pill tab bar with counts */}
        <div style={{ flexShrink: 0, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'rgba(255,255,255,0.02)', borderRadius: 11, border: '1px solid rgba(255,255,255,0.06)' }}>
            {FILTERS.map(f => {
              const active = activeFilter === f.id;
              return (
                <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '6px 6px', borderRadius: 8,
                  background: active ? 'var(--card2)' : 'transparent',
                  border: active ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                  color: active ? 'var(--text1)' : 'var(--text3)',
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text2)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text3)'; }}>
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span style={{ padding: '1px 5px', borderRadius: 4, background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)', color: active ? '#38bdf8' : 'var(--text3)', fontSize: 9, fontWeight: 800 }}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-column feed */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          {flatFeedItems.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start', paddingBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col1.map((item, i) => renderItem(item, i))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col2.map((item, i) => renderItem(item, i))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquarePlus style={{ width: 18, height: 18, color: 'rgba(56,189,248,0.45)' }}/>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', margin: 0 }}>{EMPTY_COPY[activeFilter]?.label || 'Nothing here yet'}</p>
              {EMPTY_COPY[activeFilter]?.sub && <p style={{ fontSize: 11, color: 'var(--text3)', opacity: 0.6, margin: 0, textAlign: 'center', maxWidth: 260 }}>{EMPTY_COPY[activeFilter].sub}</p>}
              {EMPTY_COPY[activeFilter]?.modal && (
                <button onClick={() => openModal(EMPTY_COPY[activeFilter].modal)} style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.09)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', marginTop: 2 }}>
                  {EMPTY_COPY[activeFilter].btn}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>

        {/* Engagement Score */}
        <Card style={{ padding: 16, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.28),transparent)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Engagement Score</div>
            <Zap style={{ width: 14, height: 14, color: '#fbbf24' }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.04em', lineHeight: 1 }}>{engagementScore}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, paddingBottom: 4 }}>total interactions</span>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {[
              { label: 'Likes',        val: allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0), color: '#f87171' },
              { label: 'Comments',     val: allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: '#38bdf8' },
              { label: 'Poll votes',   val: polls.reduce((s, p)   => s + (p.voters?.length    || 0), 0), color: '#a78bfa' },
              { label: 'In challenge', val: totalChalPart,                                                color: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: s.color }}>
                {s.val} {s.label}
              </div>
            ))}
          </div>
        </Card>

        {/* Posting Cadence — taller bars, coloured day labels */}
        <Card style={{ padding: 16, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: 'linear-gradient(90deg,transparent,rgba(56,189,248,0.18),transparent)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Posting Cadence</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{cadenceData.filter(d => d.count > 0).length} active days this week</div>
            </div>
            <TrendingUp style={{ width: 14, height: 14, color: '#38bdf8' }}/>
          </div>
          <div style={{ display: 'flex', gap: 5, height: 52, alignItems: 'flex-end', marginBottom: 6 }}>
            {cadenceData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', borderRadius: '4px 4px 2px 2px', background: d.count > 0 ? 'linear-gradient(180deg,#38bdf8,#0ea5e9)' : 'rgba(255,255,255,0.05)', height: d.count === 0 ? 3 : Math.max(7, (d.count / cadenceMax) * 44), transition: 'height 0.4s ease' }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {cadenceData.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: d.count > 0 ? '#38bdf8' : 'var(--text3)' }}>{d.label}</div>
            ))}
          </div>
        </Card>

        {/* Content Mix */}
        {contentMix && (
          <Card style={{ padding: 16, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.18),transparent)' }}/>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 10 }}>Content Mix</div>
            <div style={{ display: 'flex', height: 7, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 11 }}>
              {contentMix.filter(c => c.pct > 0).map((c, i) => (
                <div key={i} style={{ width: `${c.pct}%`, background: c.color, borderRadius: 99, transition: 'width 0.6s ease' }}/>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {contentMix.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: i < contentMix.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: 3, background: c.color, flexShrink: 0 }}/>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1)' }}>{c.count}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', width: 28, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Poll Participation Rate */}
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
            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${pollParticipationRate}%`, borderRadius: 99, background: pollParticipationRate >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : pollParticipationRate >= 25 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', transition: 'width 0.8s ease' }}/>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 0, fontWeight: 500 }}>
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

        {/* Recent Posts */}
        <Card style={{ padding: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Recent Posts</div>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.22)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 10, height: 10 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {posts.length > 0 ? posts.slice(0, 4).map((post) => (
              <div key={post.id}
                style={{ padding: '7px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'default', transition: 'background 0.15s', fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}>
                {post.content?.split('\n')[0] || post.title || 'Post'}
              </div>
            )) : (
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>No posts yet</div>
            )}
          </div>
        </Card>

        {/* Content Stats */}
        <Card style={{ padding: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Content Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { count: upcomingEvents.length, label: 'Upcoming Events',        color: '#10b981' },
              { count: totalChalPart,          label: 'Challenge Participants', color: '#f59e0b' },
              { count: polls.length,           label: 'Active Polls',           color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
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
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
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

      </div>
    </div>
  );
}
