import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  Dumbbell, MessageSquarePlus, Calendar, BarChart2,
  Plus, Heart, MessageCircle, MoreHorizontal, Trash2,
  Star, TrendingUp, Zap, ClipboardList, Award,
  BookOpen, Bell,
} from 'lucide-react';
import { Card, Avatar } from './DashboardPrimitives';

// ── CSS ────────────────────────────────────────────────────────────────────────
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
    .tcc-root      { grid-template-columns: 1fr !important; height: auto !important; }
    .tcc-left      { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tcc-actions   { grid-template-columns: repeat(3,1fr) !important; }
    .tcc-feed      { overflow: visible !important; flex: unset !important; }
    .tcc-feed-grid { grid-template-columns: 1fr !important; }
    .tcc-sidebar   { height: auto !important; overflow: visible !important; min-width: unset !important; }
  }
`;

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

// ── Post card ──────────────────────────────────────────────────────────────────
function FeedCard({ post, onDelete }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const hasImage = post.image_url || post.media_url;
  const content  = post.content || post.title || '';
  return (
    <div style={{ borderRadius: 12, background: 'rgba(12,26,46,0.8)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={post.author_name || 'Me'} size={30}/>
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

// ── Member shoutout card ───────────────────────────────────────────────────────
function ShoutoutCard({ shoutout, onDelete }) {
  const likes = shoutout.likes?.length || 0;
  return (
    <div style={{ borderRadius: 12, background: 'rgba(12,26,46,0.8)', border: '1px solid rgba(251,191,36,0.18)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,191,36,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Award style={{ width: 14, height: 14, color: '#fbbf24' }}/>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 5, padding: '1px 7px' }}>Shoutout 🏆</span>
        <span style={{ fontSize: 11, color: '#3a5070', marginLeft: 'auto' }}>{shoutout.created_date ? format(new Date(shoutout.created_date), 'MMM d') : ''}</span>
        <DeleteBtn onDelete={() => onDelete(shoutout.id)}/>
      </div>
      {shoutout.member_name && (
        <div style={{ padding: '0 14px 6px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Avatar name={shoutout.member_name} size={22}/>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{shoutout.member_name}</span>
        </div>
      )}
      <div style={{ padding: '0 14px 10px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f4f8', margin: 0, lineHeight: 1.45 }}>{shoutout.content || shoutout.title || ''}</p>
      </div>
      <div style={{ padding: '6px 14px 10px', display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: likes > 0 ? '#f87171' : '#3a5070', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart style={{ width: 14, height: 14 }}/> {likes}
        </button>
      </div>
    </div>
  );
}

// ── Class recap card ──────────────────────────────────────────────────────────
function RecapCard({ recap, onDelete }) {
  return (
    <div style={{ borderRadius: 12, background: 'rgba(12,26,46,0.8)', border: '1px solid rgba(167,139,250,0.18)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(167,139,250,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClipboardList style={{ width: 14, height: 14, color: '#a78bfa' }}/>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 5, padding: '1px 7px' }}>Class Recap</span>
        {recap.class_name && <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{recap.class_name}</span>}
        <span style={{ fontSize: 11, color: '#3a5070', marginLeft: 'auto' }}>{recap.created_date ? format(new Date(recap.created_date), 'MMM d') : ''}</span>
        <DeleteBtn onDelete={() => onDelete(recap.id)}/>
      </div>
      {recap.attended !== undefined && (
        <div style={{ padding: '0 14px 6px', display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.09)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 6, padding: '2px 8px' }}>{recap.attended} attended</span>
          {recap.fill_pct !== undefined && <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.09)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 6, padding: '2px 8px' }}>{recap.fill_pct}% full</span>}
        </div>
      )}
      <div style={{ padding: '0 14px 10px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f4f8', margin: 0, lineHeight: 1.45 }}>{recap.content || recap.notes || ''}</p>
      </div>
    </div>
  );
}

// ── Event card ─────────────────────────────────────────────────────────────────
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

// ── Poll card ──────────────────────────────────────────────────────────────────
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
      {/* Show poll options with vote bars if available */}
      {poll.options && poll.options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
          {poll.options.map((opt, i) => {
            const optVotes = opt.votes || 0;
            const pct      = votes > 0 ? Math.round((optVotes / votes) * 100) : 0;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{opt.label || opt.text || `Option ${i+1}`}</span>
                  <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', borderRadius: 99 }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#3a5070', fontWeight: 600 }}>{votes} {votes === 1 ? 'vote' : 'votes'}</div>
    </div>
  );
}

// ── Class card ─────────────────────────────────────────────────────────────────
const CLASS_IMAGES = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  default:  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
};
const CLASS_COLORS = {
  hiit:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.25)',    label: 'HIIT'     },
  yoga:     { color: '#34d399', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.25)',   label: 'Yoga'     },
  strength: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)',   border: 'rgba(99,102,241,0.25)',   label: 'Strength' },
  default:  { color: '#38bdf8', bg: 'rgba(14,165,233,0.1)',    border: 'rgba(14,165,233,0.2)',    label: 'Class'    },
};
function getClassType(c) {
  const n = (c.class_type || c.name || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('flow'))     return 'yoga';
  if (n.includes('strength') || n.includes('lift') || n.includes('weight')) return 'strength';
  return 'default';
}
function ClassCard({ gymClass, onDelete }) {
  const typeKey = getClassType(gymClass);
  const cfg     = CLASS_COLORS[typeKey];
  const img     = gymClass.image_url || CLASS_IMAGES[typeKey] || CLASS_IMAGES.default;
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(160deg,#0d1535 0%,#080c1e 100%)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 110, overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(8,12,28,0.85) 100%)' }}/>
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.6)', border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '2px 7px' }}>{cfg.label}</div>
        {gymClass.schedule && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '2px 7px' }}>🕐 {gymClass.schedule}</div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)}/>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {gymClass.duration_minutes && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{gymClass.duration_minutes} min</span>}
          {gymClass.max_capacity    && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)',  fontWeight: 600 }}>cap {gymClass.max_capacity}</span>}
          {gymClass.difficulty      && <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>{gymClass.difficulty}</span>}
        </div>
        {gymClass.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{gymClass.description}</div>}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TabCoachContent({
  events, polls, posts, classes = [], recaps = [], shoutouts = [],
  checkIns, ci30, avatarMap, allMemberships = [],
  openModal, now,
  onDeletePost      = () => {},
  onDeleteEvent     = () => {},
  onDeleteClass     = () => {},
  onDeletePoll      = () => {},
  onDeleteRecap     = () => {},
  onDeleteShoutout  = () => {},
}) {
  const [activeFilter, setActiveFilter] = useState('classes');

  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.event_date) >= now), [events, now]);

  const FILTERS = [
    { id: 'classes',   label: 'My Classes'  },
    { id: 'posts',     label: 'Posts'       },
    { id: 'shoutouts', label: '🏆 Shoutouts' },
    { id: 'recaps',    label: 'Recaps'      },
    { id: 'events',    label: 'Events'      },
    { id: 'polls',     label: 'Polls'       },
  ];

  const flatItems = useMemo(() => {
    let items = [];
    if (activeFilter === 'classes')   items = classes.map(c       => ({ type: 'class',    data: c, date: new Date(c.created_date   || 0) }));
    if (activeFilter === 'posts')     items = posts.map(p         => ({ type: 'post',     data: p, date: new Date(p.created_date   || 0) }));
    if (activeFilter === 'shoutouts') items = shoutouts.map(s     => ({ type: 'shoutout', data: s, date: new Date(s.created_date   || 0) }));
    if (activeFilter === 'recaps')    items = recaps.map(r        => ({ type: 'recap',    data: r, date: new Date(r.created_date   || 0) }));
    if (activeFilter === 'events')    items = upcomingEvents.map(e => ({ type: 'event',   data: e, date: new Date(e.event_date     || 0) }));
    if (activeFilter === 'polls')     items = polls.map(p         => ({ type: 'poll',     data: p, date: new Date(p.created_date   || 0) }));
    return items.sort((a, b) => b.date - a.date);
  }, [activeFilter, classes, posts, shoutouts, recaps, upcomingEvents, polls]);

  const col1 = flatItems.filter((_, i) => i % 2 === 0);
  const col2 = flatItems.filter((_, i) => i % 2 === 1);

  const renderItem = (item, i) => {
    if (item.type === 'post')     return <FeedCard     key={item.data.id || i} post={item.data}     onDelete={onDeletePost}/>;
    if (item.type === 'shoutout') return <ShoutoutCard key={item.data.id || i} shoutout={item.data} onDelete={onDeleteShoutout}/>;
    if (item.type === 'recap')    return <RecapCard    key={item.data.id || i} recap={item.data}    onDelete={onDeleteRecap}/>;
    if (item.type === 'event')    return <EventCard    key={item.data.id || i} event={item.data}    now={now} onDelete={onDeleteEvent}/>;
    if (item.type === 'poll')     return <PollCard     key={item.data.id || i} poll={item.data}     onDelete={onDeletePoll}/>;
    if (item.type === 'class')    return <ClassCard    key={item.data.id || i} gymClass={item.data} onDelete={onDeleteClass}/>;
    return null;
  };

  // ── Sidebar: engagement on my content ─────────────────────────────────────
  const engagementScore = useMemo(() => {
    const postEng     = posts.reduce((s, p)     => s + (p.likes?.length    || 0) + (p.comments?.length || 0), 0);
    const shoutoutEng = shoutouts.reduce((s, sh) => s + (sh.likes?.length   || 0), 0);
    const pollEng     = polls.reduce((s, p)     => s + (p.voters?.length   || 0), 0);
    return postEng + shoutoutEng + pollEng;
  }, [posts, shoutouts, polls]);

  // Post cadence last 7 days
  const cadenceData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day   = subDays(now, 6 - i);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end   = new Date(start.getTime() + 86400000);
    const count = [...posts, ...shoutouts].filter(p => {
      const d = new Date(p.created_date);
      return d >= start && d < end;
    }).length;
    return { label: format(day, 'EEE'), count };
  }), [posts, shoutouts, now]);
  const cadenceMax = Math.max(...cadenceData.map(d => d.count), 1);

  // Clients not reached via content in 30 days
  const unreachedClients = useMemo(() => {
    const recentIds   = new Set(ci30.map(c => c.user_id));
    const pollVoterIds = new Set(polls.flatMap(p => p.voters || []));
    return allMemberships.filter(m => !recentIds.has(m.user_id) && !pollVoterIds.has(m.user_id)).slice(0, 4);
  }, [allMemberships, ci30, polls]);

  // Members who got a shoutout recently (encourage recognition)
  const shoutedOutIds = useMemo(() =>
    new Set(shoutouts.map(s => s.member_id).filter(Boolean)),
    [shoutouts]
  );
  const notYetShouteOut = useMemo(() =>
    allMemberships.filter(m => !shoutedOutIds.has(m.user_id)).slice(0, 3),
    [allMemberships, shoutedOutIds]
  );

  const cardStyle = { background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, flexShrink: 0 };

  return (
    <>
      <style>{CSS}</style>
      <div className="tcc-root">

        {/* ── LEFT ── */}
        <div className="tcc-left">

          {/* Quick action buttons — coach-specific: no Challenges */}
          <div className="tcc-actions">
            {[
              {
                icon: Dumbbell, label: 'My Classes', sub: `${classes.length} classes`,
                grad: 'linear-gradient(135deg,#1a0a3e 0%,#2d1060 50%,#7c3aed 100%)',
                border: 'rgba(167,139,250,0.3)', iconBg: 'rgba(167,139,250,0.2)', iconColor: '#c4b5fd',
                fn: () => openModal('classes'),
              },
              {
                icon: MessageSquarePlus, label: 'Post Update', sub: 'Engage clients',
                grad: 'linear-gradient(135deg,#0f2a4a 0%,#1a4a7a 50%,#0ea5e9 100%)',
                border: 'rgba(14,165,233,0.3)', iconBg: 'rgba(14,165,233,0.2)', iconColor: '#7dd3fc',
                fn: () => openModal('post'),
              },
              {
                icon: Award, label: 'Shoutout', sub: `${shoutouts.length} sent`,
                grad: 'linear-gradient(135deg,#3a2200 0%,#5a3a00 50%,#d97706 100%)',
                border: 'rgba(245,158,11,0.3)', iconBg: 'rgba(245,158,11,0.2)', iconColor: '#fcd34d',
                fn: () => openModal('shoutout'),
              },
              {
                icon: ClipboardList, label: 'Class Recap', sub: `${recaps.length} recaps`,
                grad: 'linear-gradient(135deg,#130a2e 0%,#200f4a 50%,#6d28d9 100%)',
                border: 'rgba(109,40,217,0.3)', iconBg: 'rgba(109,40,217,0.2)', iconColor: '#c4b5fd',
                fn: () => openModal('recap'),
              },
              {
                icon: BarChart2, label: 'New Poll', sub: `${polls.length} active`,
                grad: 'linear-gradient(135deg,#0a2e28 0%,#0d4a3a 50%,#059669 100%)',
                border: 'rgba(16,185,129,0.3)', iconBg: 'rgba(16,185,129,0.2)', iconColor: '#6ee7b7',
                fn: () => openModal('poll'),
              },
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

          {/* Two-column masonry feed */}
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
                { label: 'Poll votes', val: polls.reduce((s, p) => s + (p.voters?.length   || 0), 0), color: '#a78bfa' },
                { label: 'Shoutouts',  val: shoutouts.length,                                         color: '#fbbf24' },
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: s.color }}>
                  {s.val} {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* My content totals */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', marginBottom: 12 }}>Content Summary</div>
            {[
              { count: classes.length,        label: 'My Classes',      color: '#a78bfa' },
              { count: upcomingEvents.length,  label: 'Upcoming Events', color: '#34d399' },
              { count: shoutouts.length,       label: 'Member Shoutouts',color: '#fbbf24' },
              { count: recaps.length,          label: 'Class Recaps',    color: '#a78bfa' },
              { count: polls.length,           label: 'Active Polls',    color: '#38bdf8' },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', minWidth: 26 }}>{s.count}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#8ba0b8' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Posting cadence */}
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
              {cadenceData.filter(d => d.count > 0).length} active posting days this week
            </div>
          </div>

          {/* Who to shoutout next */}
          {notYetShouteOut.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Shoutout Someone?</div>
                <Award style={{ width: 14, height: 14, color: '#fbbf24' }}/>
              </div>
              <p style={{ fontSize: 10, color: '#3a5070', marginBottom: 10, fontWeight: 500, lineHeight: 1.4 }}>These members haven't been recognised yet.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {notYetShouteOut.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={m.user_name || '?'} size={26} src={avatarMap[m.user_id] || null}/>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#8ba0b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</span>
                    <button onClick={() => openModal('shoutout', m)} style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>🏆 Shout</button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Recent posts quick list */}
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
