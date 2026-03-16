import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  Dumbbell, MessageSquarePlus, Calendar, Trophy, BarChart2,
  Plus, Heart, MessageCircle, MoreHorizontal, Trash2,
  ChevronRight, Zap, TrendingUp
} from 'lucide-react';
import { Card, Avatar } from './DashboardPrimitives';

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  .tcc-root { display: grid; grid-template-columns: minmax(0,1fr) clamp(260px,22%,310px); gap: 16px; height: 100%; }
  .tcc-left { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0; }
  .tcc-actions { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; flex-shrink: 0; padding-bottom: 12px; }
  .tcc-action-btn { border-radius: 14px; padding: 16px 14px; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.18s, box-shadow 0.18s; min-height: 96px; }
  .tcc-tabs { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 12px; gap: 0; overflow-x: auto; scrollbar-width: none; flex-shrink: 0; }
  .tcc-tabs::-webkit-scrollbar { display: none; }
  .tcc-tab-btn { padding: 7px 16px; font-size: 12px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
  .tcc-feed { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; }
  .tcc-feed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; padding-bottom: 24px; }
  .tcc-sidebar { height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-width: 260px; }
  @media (max-width: 768px) {
    .tcc-root { grid-template-columns: 1fr !important; height: auto !important; }
    .tcc-left { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tcc-actions { grid-template-columns: repeat(3,1fr) !important; }
    .tcc-feed { overflow: visible !important; flex: unset !important; }
    .tcc-feed-grid { grid-template-columns: 1fr !important; }
    .tcc-sidebar { height: auto !important; overflow: visible !important; min-width: unset !important; }
  }
`;

// ── 3-dot delete ──────────────────────────────────────────────────────────────
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

function FeedCard({ post, onDelete }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const hasImage = post.image_url || post.media_url;
  const content  = post.content || post.title || '';
  return (
    <div style={{ borderRadius: 12, background: 'rgba(12,26,46,0.8)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={post.author_name || post.gym_name || 'Me'} size={30}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author_name || 'My Post'}</div>
        </div>
        <span style={{ fontSize: 11, color: '#3a5070', flexShrink: 0 }}>{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
        <DeleteBtn onDelete={() => onDelete(post.id)}/>
      </div>
      {content && (
        <div style={{ padding: '0 14px 10px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8', margin: 0, lineHeight: 1.4 }}>{post.title || content.split('\n')[0]}</p>
          {post.title && content !== post.title && <p style={{ fontSize: 12, color: '#8ba0b8', margin: '4px 0 0', lineHeight: 1.5 }}>{content}</p>}
        </div>
      )}
      {hasImage && (
        <div style={{ overflow: 'hidden' }}>
          <img src={post.image_url || post.media_url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} onError={e => e.currentTarget.parentElement.style.display = 'none'}/>
        </div>
      )}
      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: likes > 0 ? '#f87171' : '#3a5070', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart style={{ width: 14, height: 14 }}/> {likes}
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: comments > 0 ? '#38bdf8' : '#3a5070', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle style={{ width: 14, height: 14 }}/> {comments}
        </button>
      </div>
    </div>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate   = new Date(event.event_date);
  const diffDays = Math.floor((evDate - now) / 86400000);
  return (
    <div style={{ borderRadius: 12, background: 'rgba(12,26,46,0.8)', border: '1px solid rgba(16,185,129,0.15)', overflow: 'hidden' }}>
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
        <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8', margin: '0 0 4px' }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 12, color: '#8ba0b8', margin: '0 0 8px', lineHeight: 1.4 }}>{event.description}</p>}
        <div style={{ fontSize: 11, color: '#3a5070', fontWeight: 500 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalDays = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed   = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalDays - elapsed);
  const pct       = Math.min(100, Math.round((elapsed / totalDays) * 100));
  return (
    <div style={{ borderRadius: 12, background: 'rgba(12,26,46,0.8)', border: '1px solid rgba(245,158,11,0.15)', overflow: 'hidden' }}>
      <div style={{ height: 90, background: 'linear-gradient(135deg,#1a1033,#3b1a5e,#6d28d9)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Trophy style={{ width: 30, height: 30, color: 'rgba(245,158,11,0.6)' }}/>
        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 4, padding: '2px 7px' }}>Challenge</span>
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: remaining <= 3 ? '#f87171' : '#3a5070', background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '2px 7px' }}>{remaining}d left</span>
        <div style={{ position: 'absolute', bottom: 8, right: 8 }}><DeleteBtn onDelete={() => onDelete(challenge.id)}/></div>
      </div>
      <div style={{ padding: '10px 14px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', margin: '0 0 6px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#3a5070' }}>{challenge.participants?.length || 0} participants</span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.8s ease' }}/>
        </div>
      </div>
    </div>
  );
}

const CLASS_IMAGES = {
  hiit: 'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
};
const CLASS_COLORS = {
  hiit: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', label: 'HIIT' },
  yoga: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Yoga' },
  strength: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', label: 'Strength' },
  default: { color: '#38bdf8', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.2)', label: 'Class' },
};
function getClassType(c) {
  const n = (c.class_type || c.name || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('flow')) return 'yoga';
  if (n.includes('strength') || n.includes('lift') || n.includes('weight')) return 'strength';
  return 'default';
}
function ClassCard({ gymClass, onDelete }) {
  const typeKey = getClassType(gymClass);
  const cfg = CLASS_COLORS[typeKey];
  const img = gymClass.image_url || CLASS_IMAGES[typeKey] || CLASS_IMAGES.default;
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(160deg,#0d1535 0%,#080c1e 100%)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 110, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(8,12,28,0.85) 100%)' }}/>
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.6)', border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '2px 7px' }}>{cfg.label}</div>
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)}/>
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gymClass.description}</div>}
      </div>
    </div>
  );
}

function PollCard({ poll, onDelete }) {
  const votes = poll.voters?.length || 0;
  return (
    <div style={{ borderRadius: 12, background: 'rgba(12,26,46,0.8)', border: '1px solid rgba(139,92,246,0.15)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <BarChart2 style={{ width: 13, height: 13, color: '#a78bfa' }}/>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, padding: '1px 7px' }}>Poll</span>
        <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)}/></div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', margin: '0 0 8px' }}>{poll.title}</p>
      <div style={{ fontSize: 11, color: '#3a5070', fontWeight: 600 }}>{votes} {votes === 1 ? 'vote' : 'votes'}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TabCoachContent({
  events, challenges, polls, posts, classes = [],
  checkIns, ci30, avatarMap, allMemberships = [],
  openModal, now,
  onDeletePost = () => {}, onDeleteEvent = () => {}, onDeleteChallenge = () => {},
  onDeleteClass = () => {}, onDeletePoll = () => {},
}) {
  const [activeFilter, setActiveFilter] = useState('classes');

  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalChalPart    = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);

  const FILTERS = [
    { id: 'classes',    label: 'My Classes'  },
    { id: 'posts',      label: 'My Posts'    },
    { id: 'events',     label: 'Events'      },
    { id: 'challenges', label: 'Challenges'  },
    { id: 'polls',      label: 'Polls'       },
  ];

  const flatItems = useMemo(() => {
    let items = [];
    if (activeFilter === 'classes')    items = classes.map(c     => ({ type: 'class',     data: c, date: new Date(c.created_date  || 0) }));
    if (activeFilter === 'posts')      items = posts.map(p       => ({ type: 'post',      data: p, date: new Date(p.created_date  || 0) }));
    if (activeFilter === 'events')     items = upcomingEvents.map(e => ({ type: 'event', data: e, date: new Date(e.event_date     || 0) }));
    if (activeFilter === 'challenges') items = activeChallenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date || 0) }));
    if (activeFilter === 'polls')      items = polls.map(p       => ({ type: 'poll',      data: p, date: new Date(p.created_date  || 0) }));
    return items.sort((a, b) => b.date - a.date);
  }, [activeFilter, classes, posts, upcomingEvents, activeChallenges, polls]);

  const col1 = flatItems.filter((_, i) => i % 2 === 0);
  const col2 = flatItems.filter((_, i) => i % 2 === 1);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <FeedCard      key={item.data.id || i} post={item.data}      onDelete={onDeletePost}/>;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     now={now} onDelete={onDeleteEvent}/>;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} now={now} onDelete={onDeleteChallenge}/>;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}/>;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass}/>;
    return null;
  };

  // Sidebar stats
  const engagementScore = useMemo(() => {
    const postEng = posts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
    const pollEng = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);
    return postEng + pollEng + totalChalPart;
  }, [posts, polls, totalChalPart]);

  const cadenceData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day   = subDays(now, 6 - i);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end   = new Date(start.getTime() + 86400000);
    return { label: format(day, 'EEE'), count: posts.filter(p => { const d = new Date(p.created_date); return d >= start && d < end; }).length };
  }), [posts, now]);
  const cadenceMax = Math.max(...cadenceData.map(d => d.count), 1);

  const unreachedClients = useMemo(() => {
    const recentIds   = new Set(ci30.map(c => c.user_id));
    const pollVoterIds = new Set(polls.flatMap(p => p.voters || []));
    return allMemberships.filter(m => !recentIds.has(m.user_id) && !pollVoterIds.has(m.user_id)).slice(0, 4);
  }, [allMemberships, ci30, polls]);

  const cardStyle = { background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, flexShrink: 0 };

  return (
    <>
      <style>{CSS}</style>
      <div className="tcc-root">

        {/* ── LEFT ── */}
        <div className="tcc-left">

          {/* Quick action buttons */}
          <div className="tcc-actions">
            {[
              { icon: Dumbbell,          label: 'My Classes',  sub: `${classes.length} classes`,         grad: 'linear-gradient(135deg,#1a0a3e 0%,#2d1060 50%,#7c3aed 100%)', border: 'rgba(167,139,250,0.3)', iconBg: 'rgba(167,139,250,0.2)', iconColor: '#c4b5fd', fn: () => openModal('classes') },
              { icon: MessageSquarePlus, label: 'New Post',    sub: 'Engage clients',                    grad: 'linear-gradient(135deg,#0f2a4a 0%,#1a4a7a 50%,#0ea5e9 100%)', border: 'rgba(14,165,233,0.3)',  iconBg: 'rgba(14,165,233,0.2)',  iconColor: '#7dd3fc', fn: () => openModal('post')    },
              { icon: Calendar,          label: 'New Event',   sub: `${upcomingEvents.length} upcoming`, grad: 'linear-gradient(135deg,#0a2e28 0%,#0d4a3a 50%,#059669 100%)', border: 'rgba(16,185,129,0.3)',  iconBg: 'rgba(16,185,129,0.2)',  iconColor: '#6ee7b7', fn: () => openModal('event')   },
              { icon: Trophy,            label: 'Challenge',   sub: `${activeChallenges.length} active`, grad: 'linear-gradient(135deg,#3a1010 0%,#5a1a1a 50%,#dc2626 100%)', border: 'rgba(239,68,68,0.3)',   iconBg: 'rgba(239,68,68,0.2)',   iconColor: '#fca5a5', fn: () => openModal('challenge') },
              { icon: BarChart2,         label: 'New Poll',    sub: `${polls.length} active`,            grad: 'linear-gradient(135deg,#1e0a3a 0%,#2d1060 50%,#7c3aed 100%)', border: 'rgba(139,92,246,0.3)',  iconBg: 'rgba(139,92,246,0.2)',  iconColor: '#c4b5fd', fn: () => openModal('poll')    },
            ].map(({ icon: Icon, label, sub, grad, border, iconBg, iconColor, fn }, i) => (
              <div key={i} onClick={fn} className="tcc-action-btn" style={{ background: grad, border: `1px solid ${border}` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: iconColor, opacity: 0.12, filter: 'blur(16px)' }}/>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon style={{ width: 13, height: 13, color: iconColor }}/>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, letterSpacing: '-0.02em' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="tcc-tabs">
            <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', padding: '7px 16px 7px 2px', marginBottom: -1, flexShrink: 0 }}>My Content</span>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className="tcc-tab-btn"
                style={{ fontWeight: activeFilter === f.id ? 700 : 500, color: activeFilter === f.id ? '#f0f4f8' : '#3a5070', borderBottom: activeFilter === f.id ? '2px solid #a78bfa' : '2px solid transparent', marginBottom: -1 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Two-column feed */}
          <div className="tcc-feed">
            {flatItems.length > 0 ? (
              <div className="tcc-feed-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{col1.map((item, i) => renderItem(item, i))}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{col2.map((item, i) => renderItem(item, i))}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquarePlus style={{ width: 20, height: 20, color: 'rgba(167,139,250,0.4)' }}/>
                </div>
                <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 500, margin: 0 }}>Nothing here yet</p>
                <button onClick={() => openModal('post')} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Create first post</button>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="tcc-sidebar">

          {/* My Content Impact */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>My Content Impact</div>
              <Zap style={{ width: 14, height: 14, color: '#a78bfa' }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.04em', lineHeight: 1 }}>{engagementScore}</span>
              <span style={{ fontSize: 11, color: '#3a5070', fontWeight: 600, paddingBottom: 4 }}>interactions</span>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {[
                { label: 'Likes',      val: posts.reduce((s, p) => s + (p.likes?.length    || 0), 0), color: '#f87171' },
                { label: 'Comments',   val: posts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: '#38bdf8' },
                { label: 'Poll votes', val: polls.reduce((s, p) => s + (p.voters?.length    || 0), 0), color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: s.color }}>
                  {s.val} {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* My Classes & Events */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 12 }}>My Classes & Events</div>
            {[
              { count: classes.length,          label: 'My Classes',        color: '#a78bfa' },
              { count: upcomingEvents.length,    label: 'Upcoming Events',   color: '#34d399' },
              { count: activeChallenges.length,  label: 'Active Challenges', color: '#fbbf24' },
              { count: polls.length,             label: 'Active Polls',      color: '#38bdf8' },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', minWidth: 26 }}>{s.count}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#8ba0b8' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Posting Cadence */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Posting Cadence</div>
              <TrendingUp style={{ width: 14, height: 14, color: '#38bdf8' }}/>
            </div>
            <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'flex-end' }}>
              {cadenceData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: d.count === 0 ? 3 : Math.max(6, (d.count / cadenceMax) * 32), borderRadius: 3, background: d.count === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(180deg,#a78bfa,#7c3aed)', transition: 'height 0.4s ease' }}/>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {cadenceData.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: '#3a5070' }}>{d.label}</div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#3a5070', fontWeight: 500 }}>
              {cadenceData.filter(d => d.count > 0).length} active days this week
            </div>
          </div>

          {/* Clients not reached */}
          {unreachedClients.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Clients Not Reached</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '2px 6px' }}>{unreachedClients.length}</div>
              </div>
              <p style={{ fontSize: 10, color: '#3a5070', marginBottom: 10, fontWeight: 500, lineHeight: 1.4 }}>No check-ins or poll votes in 30 days.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {unreachedClients.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={m.user_name || '?'} size={26} src={avatarMap[m.user_id] || null}/>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#8ba0b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</span>
                    <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Reach</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent posts */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>My Recent Posts</div>
              <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                <Plus style={{ width: 10, height: 10 }}/>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {posts.length > 0 ? posts.slice(0, 4).map((post) => (
                <div key={post.id} style={{ padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 600, color: '#8ba0b8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.content?.split('\n')[0] || post.title || 'Post'}
                </div>
              )) : (
                <div style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '12px 0' }}>No posts yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}