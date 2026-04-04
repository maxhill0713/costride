import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import {
  Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Heart, MessageCircle, Dumbbell,
  MoreHorizontal, Trash2, CheckCircle, Eye, Plus,
  AlertTriangle, Users, Flame, Star, HelpCircle,
  List, ChevronLeft, Activity,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────────── */
const T = {
  bg:         '#0b1120',
  surface:    '#111827',
  surfaceEl:  '#1a2235',
  surfaceHov: '#1e2840',
  border:     'rgba(255,255,255,0.07)',
  borderEl:   'rgba(255,255,255,0.12)',
  divider:    'rgba(255,255,255,0.05)',

  accent:     '#3b82f6',
  accentGlow: 'rgba(59,130,246,0.15)',
  accentBrd:  'rgba(59,130,246,0.32)',
  accentHov:  '#60a5fa',

  orange:    '#f97316',
  orangeSub: 'rgba(249,115,22,0.12)',
  yellow:    '#eab308',
  yellowSub: 'rgba(234,179,8,0.12)',

  success:    '#22c55e',
  successSub: 'rgba(34,197,94,0.10)',
  warn:       '#f59e0b',
  warnSub:    'rgba(245,158,11,0.10)',
  danger:     '#ef4444',
  dangerSub:  'rgba(239,68,68,0.10)',

  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#334155',

  radius:   10,
  radiusLg: 14,
  shadow:   '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
  shadowLg: '0 4px 24px rgba(0,0,0,0.5)',
};

/* ─────────────────────────────────────────────────────────────────
   GLOBAL CSS  (scoped to .fg-wrap)
───────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

  .fg-wrap * { box-sizing:border-box; }
  .fg-wrap   { font-family:'DM Sans',sans-serif; background:${T.bg}; color:${T.t1}; display:flex; flex-direction:column; min-height:100%; width:100%; }

  /* METRICS BAR */
  .fg-metrics { display:grid; grid-template-columns:repeat(4,1fr); border-bottom:1px solid ${T.border}; flex-shrink:0; background:${T.surface}; }
  .fg-metric  { padding:16px 22px; border-right:1px solid ${T.border}; transition:background .15s; position:relative; cursor:default; }
  .fg-metric:last-child { border-right:none; }
  .fg-metric:hover { background:${T.surfaceEl}; }

  /* BODY GRID */
  .fg-body   { display:grid; grid-template-columns:1fr 296px; flex:1; overflow:hidden; }
  .fg-center { padding:22px 22px 60px; overflow-y:auto; display:flex; flex-direction:column; gap:18px; min-width:0; }
  .fg-right  { padding:18px 16px 48px; overflow-y:auto; border-left:1px solid ${T.border}; display:flex; flex-direction:column; gap:14px; background:${T.surface}; }

  /* SCROLLBARS */
  .fg-center::-webkit-scrollbar, .fg-right::-webkit-scrollbar { width:4px; }
  .fg-center::-webkit-scrollbar-track, .fg-right::-webkit-scrollbar-track { background:transparent; }
  .fg-center::-webkit-scrollbar-thumb, .fg-right::-webkit-scrollbar-thumb { background:${T.t4}; border-radius:99px; }

  /* VIEW TOGGLE */
  .fg-view-toggle  { display:inline-flex; gap:2px; background:${T.surfaceEl}; border:1px solid ${T.border}; border-radius:8px; padding:3px; }
  .fg-vt-btn       { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:6px; font-size:11.5px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:all .15s; }
  .fg-vt-btn.on    { background:${T.accent}; color:#fff; }
  .fg-vt-btn:not(.on) { background:transparent; color:${T.t3}; }
  .fg-vt-btn:not(.on):hover { color:${T.t2}; }

  /* TABS */
  .fg-tabs { display:flex; align-items:center; border-bottom:1px solid ${T.border}; overflow-x:auto; scrollbar-width:none; }
  .fg-tabs::-webkit-scrollbar { display:none; }
  .fg-tab  { padding:9px 16px; font-size:12.5px; font-family:inherit; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; transition:all .15s; white-space:nowrap; color:${T.t3}; font-weight:500; margin-bottom:-1px; }
  .fg-tab.on { color:${T.t1}; border-bottom-color:${T.accent}; font-weight:700; }
  .fg-tab:hover:not(.on) { color:${T.t2}; }

  /* FEED CARD */
  .fg-fc    { background:${T.surfaceEl}; border:1px solid ${T.border}; border-radius:${T.radiusLg}px; overflow:hidden; transition:border-color .15s; position:relative; }
  .fg-fc:hover { border-color:${T.borderEl}; }
  .fg-fc.top { border-color:${T.accentBrd}; }
  .fg-fc.top::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,${T.accent},${T.accentBrd} 60%,transparent); }

  /* IDEA CARD */
  .fg-ic { background:${T.surfaceEl}; border:1px solid ${T.border}; border-radius:${T.radius}px; padding:16px; cursor:pointer; transition:all .2s; }
  .fg-ic:hover { border-color:${T.accentBrd}; background:${T.surfaceHov}; transform:translateY(-2px); box-shadow:${T.shadowLg}; }

  /* AI CARD */
  .fg-ac { background:${T.bg}; border:1px solid ${T.border}; border-radius:${T.radius}px; padding:13px 12px; cursor:pointer; transition:all .15s; }
  .fg-ac:hover { border-color:${T.accentBrd}; background:${T.surfaceEl}; }

  /* PROGRESS */
  .fg-prog { height:3px; border-radius:99px; background:${T.divider}; overflow:hidden; }
  .fg-prog-fill { height:100%; border-radius:99px; background:${T.accent}; transition:width .8s ease; }

  /* BUTTONS */
  .fg-btn-p { display:inline-flex; align-items:center; gap:7px; padding:9px 16px; border-radius:${T.radius}px; background:${T.accent}; color:#fff; border:none; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; box-shadow:0 0 0 1px ${T.accentBrd},0 4px 14px rgba(59,130,246,.22); }
  .fg-btn-p:hover { background:${T.accentHov}; transform:translateY(-1px); }
  .fg-btn-s { display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:${T.radius}px; background:${T.surfaceEl}; color:${T.t1}; border:1px solid ${T.border}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .fg-btn-s:hover { border-color:${T.accentBrd}; color:${T.accent}; }
  .fg-cbtn-a { font-size:11px; font-weight:700; padding:5px 10px; border-radius:7px; cursor:pointer; font-family:inherit; background:${T.accentGlow}; border:1px solid ${T.accentBrd}; color:${T.accent}; transition:all .12s; }
  .fg-cbtn-a:hover { background:${T.accent}; color:#fff; }
  .fg-cbtn-m { font-size:11px; font-weight:600; padding:5px 10px; border-radius:7px; cursor:pointer; font-family:inherit; background:${T.surfaceEl}; border:1px solid ${T.border}; color:${T.t2}; transition:all .12s; }
  .fg-cbtn-m:hover { border-color:${T.borderEl}; color:${T.t1}; }

  /* FAB */
  .fg-fab { position:fixed; bottom:28px; right:28px; z-index:999; display:inline-flex; align-items:center; gap:8px; padding:13px 22px; border-radius:50px; background:${T.accent}; color:#fff; border:none; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 4px 22px rgba(59,130,246,.45); transition:all .2s; }
  .fg-fab:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(59,130,246,.55); }

  /* CALENDAR */
  .fg-cal-g { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
  .fg-cd    { aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:11.5px; border-radius:7px; transition:background .1s; position:relative; cursor:default; color:${T.t2}; font-weight:500; }
  .fg-cd.today { background:${T.accent}; color:#fff; font-weight:700; }
  .fg-cd:not(.today):hover { background:${T.surfaceEl}; }

  /* DELETE MENU */
  .fg-dm { position:absolute; top:28px; right:0; z-index:9999; background:#0d1528; border:1px solid ${T.borderEl}; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.6); min-width:110px; overflow:hidden; }

  @media(max-width:900px){
    .fg-body    { grid-template-columns:1fr; }
    .fg-right   { border-left:none; border-top:1px solid ${T.border}; }
    .fg-metrics { grid-template-columns:1fr 1fr; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────────── */
function Avatar({ name = '', size = 28, src = null }) {
  const letters = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const hue = (name.charCodeAt(0) || 72) % 360;
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},42%,23%)`, border: `1.5px solid hsl(${hue},42%,33%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 800, color: `hsl(${hue},70%,70%)`, flexShrink: 0 }}>
      {letters}
    </div>
  );
}

function Pill({ label, color = T.accent, bg = T.accentGlow, bdr = T.accentBrd }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: bg, border: `1px solid ${bdr}`, color, flexShrink: 0 }}>{label}</span>;
}

function IconBadge({ icon: Icon, color = T.accent, size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ width: size * 0.46, height: size * 0.46, color }} />
    </div>
  );
}

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
        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }}>
        <MoreHorizontal style={{ width: 12, height: 12, color: T.t3 }} />
      </button>
      {open && (
        <div className="fg-dm">
          <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, color: T.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = T.dangerSub}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Trash2 style={{ width: 12, height: 12 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   METRICS BAR
───────────────────────────────────────────────────────────────── */
function MetricsBar({ allPosts, allMemberships, now }) {
  const weekPosts  = allPosts.filter(p => new Date(p.created_date || 0) >= subDays(now, 7));
  const totalMem   = allMemberships.length;
  const totalInter = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
  const engRate    = totalMem > 0 ? Math.round((totalInter / totalMem) * 100) : 0;
  const activeMem  = new Set([
    ...allPosts.flatMap(p => p.likes || []),
    ...allPosts.flatMap(p => (p.comments || []).map(c => c.user_id).filter(Boolean)),
  ]).size;

  // best post type by engagement
  const typeMap = {};
  allPosts.forEach(p => {
    const type = (p.image_url || p.media_url) ? 'Photo post' : p.poll_options ? 'Poll' : 'Text post';
    typeMap[type] = (typeMap[type] || 0) + (p.likes?.length || 0) + (p.comments?.length || 0) * 2;
  });
  const bestType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const metrics = [
    {
      icon: Flame, iconColor: T.orange,
      label: 'Posts This Week', value: weekPosts.length,
      sub: 'Gyms that post 3x/week see +40% retention',
      dot: weekPosts.length === 0 ? T.danger : weekPosts.length < 3 ? T.warn : T.success,
    },
    {
      icon: Activity, iconColor: T.accent,
      label: 'Engagement Rate', value: `${engRate}%`,
      sub: totalMem > 0 ? `Across ${totalMem} members` : 'Add members to track',
      dot: engRate === 0 ? T.t4 : engRate >= 15 ? T.success : T.warn,
    },
    {
      icon: Users, iconColor: T.success,
      label: 'Actively Engaging', value: `${activeMem} Members`,
      sub: activeMem > 0 ? 'Liked or commented recently' : 'No interactions yet',
      dot: activeMem > 0 ? T.success : T.t4,
    },
    {
      icon: Star, iconColor: T.yellow,
      label: 'Top Post Type', value: allPosts.length > 0 ? bestType : '—',
      sub: allPosts.length > 0 ? 'Best for likes & saves' : 'Post to see insights',
      donut: allPosts.length > 0,
    },
  ];

  return (
    <div className="fg-metrics">
      {metrics.map((m, i) => (
        <div key={i} className="fg-metric">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <m.icon style={{ width: 12, height: 12, color: m.iconColor }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.t3 }}>{m.label}</span>
            {m.dot && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, marginLeft: 'auto', flexShrink: 0 }} />
            )}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>
            {m.value}
          </div>
          <div style={{ fontSize: 10.5, color: T.t3, fontWeight: 500, lineHeight: 1.45 }}>{m.sub}</div>
          {m.donut && (
            <div style={{ position: 'absolute', top: 14, right: 16, width: 36, height: 36 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="13" fill="none" stroke={T.divider}   strokeWidth="4" />
                <circle cx="18" cy="18" r="13" fill="none" stroke={T.accent}    strokeWidth="4" strokeDasharray="55 82" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   QUICK POST IDEAS
───────────────────────────────────────────────────────────────── */
const QUICK_IDEAS = [
  { icon: Flame,  color: T.orange, title: 'Motivation Monday', desc: 'Drives comments',      cta: 'Generate post',   modal: 'post'      },
  { icon: Users,  color: T.accent, title: 'Member Spotlight',  desc: 'Builds community',     cta: 'Create',          modal: 'post'      },
  { icon: Trophy, color: T.yellow, title: 'Start a weekend challenge', desc: 'Increases attendance', cta: 'Start challenge', modal: 'challenge' },
];

function QuickIdeas({ openModal }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>Quick post ideas</span>
        <HelpCircle style={{ width: 13, height: 13, color: T.t3 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {QUICK_IDEAS.map((card, i) => (
          <div key={i} className="fg-ic" onClick={() => openModal(card.modal)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${card.color}15`, border: `1px solid ${card.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <card.icon style={{ width: 14, height: 14, color: card.color }} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.t1, lineHeight: 1.25 }}>{card.title}</div>
                <div style={{ fontSize: 10.5, color: T.t3, marginTop: 2 }}>{card.desc}</div>
              </div>
            </div>
            <button
              style={{ width: '100%', padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: `${card.color}15`, border: `1px solid ${card.color}28`, color: card.color }}
              onClick={e => { e.stopPropagation(); openModal(card.modal); }}>
              {card.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FEED CARDS
───────────────────────────────────────────────────────────────── */
function FeedPostCard({ post, onDelete, isTop, totalMembers }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const engRate  = totalMembers > 0 ? Math.round(((likes + comments) / totalMembers) * 100) : 0;
  const title    = post.title || (post.content || '').split('\n')[0] || '';
  const body     = post.title ? (post.content || '') : '';

  return (
    <div className={`fg-fc${isTop ? ' top' : ''}`}>
      {isTop && <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}><Pill label="⭐ Top Post" /></div>}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={post.author_name || post.gym_name || 'G'} size={26} src={post.member_avatar || post.author_avatar || null} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'Gym Post'}
          </span>
          <span style={{ fontSize: 10, color: T.t3, flexShrink: 0 }}>{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
          <DeleteBtn onDelete={() => onDelete(post.id)} />
        </div>
      </div>
      {title && (
        <div style={{ padding: '10px 14px' }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: T.t1, margin: '0 0 4px', lineHeight: 1.4 }}>{title}</p>
          {body && <p style={{ fontSize: 12, color: T.t2, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</p>}
        </div>
      )}
      {(post.image_url || post.media_url) && (
        <div style={{ margin: '0 14px 10px', borderRadius: 8, overflow: 'hidden' }}>
          <img src={post.image_url || post.media_url} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }} onError={e => e.currentTarget.parentElement.style.display = 'none'} />
        </div>
      )}
      <div style={{ padding: '8px 14px 11px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${T.divider}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.t3 }}><Heart style={{ width: 11, height: 11 }} />{likes}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.t3 }}><MessageCircle style={{ width: 11, height: 11 }} />{comments}</span>
        {engRate > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: T.accent, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, borderRadius: 5, padding: '2px 7px' }}>{engRate}% engaged</span>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff   = Math.max(0, Math.floor((evDate - now) / 86400000));
  return (
    <div className="fg-fc">
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <IconBadge icon={Calendar} />
          <Pill label="Event" />
          <Pill label={diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`} color={diff <= 2 ? T.warn : T.t3} bg={diff <= 2 ? T.warnSub : 'rgba(255,255,255,.05)'} bdr={diff <= 2 ? 'rgba(245,158,11,.25)' : T.border} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 4px' }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 11, color: T.t2, margin: '0 0 8px', lineHeight: 1.5 }}>{event.description}</p>}
        <div style={{ fontSize: 10, color: T.t3 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start     = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD    = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed   = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalD - elapsed);
  const pct       = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts     = challenge.participants?.length || 0;
  return (
    <div className="fg-fc">
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <IconBadge icon={Trophy} color={T.yellow} />
          <Pill label="Challenge" />
          <Pill label={`${remaining}d left`} color={remaining <= 3 ? T.warn : T.t3} bg={remaining <= 3 ? T.warnSub : 'rgba(255,255,255,.05)'} bdr={remaining <= 3 ? 'rgba(245,158,11,.25)' : T.border} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 10px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: T.t3 }}>{parts} joined</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>{pct}%</span>
        </div>
        <div className="fg-prog"><div className="fg-prog-fill" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}

function PollCard({ poll, onDelete, allMemberships }) {
  const votes = poll.voters?.length || 0;
  const total = allMemberships?.length || 0;
  const pct   = total > 0 ? Math.round((votes / total) * 100) : 0;
  return (
    <div className="fg-fc">
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <IconBadge icon={BarChart2} />
          <Pill label="Poll" />
          {pct > 0 && <Pill label={`${pct}% voted`} color={T.t3} bg="rgba(255,255,255,.05)" bdr={T.border} />}
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 10px' }}>{poll.title}</p>
        <div className="fg-prog" style={{ marginBottom: 7 }}><div className="fg-prog-fill" style={{ width: `${pct}%` }} /></div>
        <div style={{ fontSize: 11, color: T.t3 }}>{votes} {votes === 1 ? 'vote' : 'votes'}{total > 0 ? ` of ${total} members` : ''}</div>
      </div>
    </div>
  );
}

const CLASS_IMGS = {
  hiit: 'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  default:  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
};
function getClassType(c) {
  const n = (c.class_type || c.name || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('flow'))     return 'yoga';
  if (n.includes('strength') || n.includes('lift')) return 'strength';
  return 'default';
}
function ClassCard({ gymClass, onDelete }) {
  const type = getClassType(gymClass);
  return (
    <div className="fg-fc">
      <div style={{ position: 'relative', height: 80, overflow: 'hidden', flexShrink: 0 }}>
        <img src={gymClass.image_url || CLASS_IMGS[type]} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,.04),${T.surfaceEl}cc)` }} />
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: T.accent, background: 'rgba(0,0,0,.55)', border: `1px solid ${T.accentBrd}`, borderRadius: 5, padding: '2px 7px' }}>
          {type.toUpperCase()}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DeleteBtn onDelete={() => onDelete(gymClass.id)} />
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 11, color: T.t3, marginTop: 3 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.instructor && <div style={{ fontSize: 11, color: T.t2, marginTop: 4 }}>{gymClass.instructor}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────── */
function EmptyState({ openModal, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 14, textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Flame style={{ width: 22, height: 22, color: T.accent }} />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 800, color: T.t1, margin: '0 0 6px' }}>🔥 Let's get your members engaged!</p>
        <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.6 }}>
          {label ? `No ${label} yet.` : 'Your feed is empty.'} Start by creating your first piece of content.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="fg-btn-p" style={{ fontSize: 12 }} onClick={() => openModal('post')}>
          <Plus style={{ width: 13, height: 13 }} /> Create first post
        </button>
        <button className="fg-btn-s" style={{ fontSize: 12 }} onClick={() => openModal('challenge')}>
          <Trophy style={{ width: 13, height: 13 }} /> Start a challenge
        </button>
        <button className="fg-btn-s" style={{ fontSize: 12 }} onClick={() => openModal('poll')}>
          <HelpCircle style={{ width: 13, height: 13 }} /> Ask a question
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CALENDAR VIEW
───────────────────────────────────────────────────────────────── */
function CalendarView({ allPosts, events, now, openModal }) {
  const [viewMonth, setViewMonth] = useState(now);
  const monthStart = startOfMonth(viewMonth);
  const monthEnd   = endOfMonth(viewMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const blanks     = Array(getDay(monthStart)).fill(null);
  const DOW        = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const postDates  = new Set(allPosts.map(p => format(new Date(p.created_date || 0), 'yyyy-MM-dd')));
  const evDates    = new Set(events.map(e => format(new Date(e.event_date    || 0), 'yyyy-MM-dd')));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => setViewMonth(subDays(monthStart, 1))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: T.t2, display: 'flex' }}>
          <ChevronLeft style={{ width: 14, height: 14 }} />
        </button>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.t1 }}>{format(viewMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setViewMonth(new Date(monthEnd.getTime() + 86400000))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: T.t2, display: 'flex' }}>
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div className="fg-cal-g" style={{ marginBottom: 4 }}>
        {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: T.t3, padding: '3px 0' }}>{d}</div>)}
      </div>
      <div className="fg-cal-g">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const key     = format(day, 'yyyy-MM-dd');
          const hasPost = postDates.has(key);
          const hasEv   = evDates.has(key);
          const today   = isToday(day);
          return (
            <div key={key} className={`fg-cd${today ? ' today' : ''}`}>
              {format(day, 'd')}
              {(hasPost || hasEv) && !today && (
                <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                  {hasPost && <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: T.accent }} />}
                  {hasEv   && <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: T.orange }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: T.surfaceEl, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.t3, marginTop: 4, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: T.t3, lineHeight: 1.5 }}>You have no content scheduled. Filling your calendar keeps members engaged.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle style={{ width: 11, height: 11, color: T.success, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.t3 }}>Best engagement time: <span style={{ color: T.success, fontWeight: 700 }}>5–7pm</span></span>
        </div>
      </div>
      <button className="fg-btn-p" style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: 12 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 13, height: 13 }} /> Schedule a Post
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RIGHT PANEL
───────────────────────────────────────────────────────────────── */
const AI_SUGGS = [
  {
    icon: Flame,  color: T.orange,
    label: 'Motivation Monday',
    sub:   'Share a motivating quote · Drives comments',
    btns:  [{ label: 'Generate post', p: true, modal: 'post' }, { label: 'Make it →', p: false, modal: 'post' }],
  },
  {
    icon: Users,  color: T.accent,
    label: 'Post a member spotlight',
    sub:   'Feature a dedicated member from your community',
    btns:  [{ label: 'Create', p: true, modal: 'post' }, { label: 'Refine', p: false, modal: 'post' }],
  },
  {
    icon: Trophy, color: T.yellow,
    label: 'Start a weekend challenge',
    sub:   'Clearly repeat a signature event',
    btns:  [{ label: 'Start challenge', p: true, modal: 'challenge' }, { label: 'Goals', p: false, modal: 'challenge' }],
  },
];

function AISuggestions({ openModal }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Flame style={{ width: 13, height: 13, color: T.orange }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.t1 }}>What should you post today?</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AI_SUGGS.map((s, i) => (
          <div key={i} className="fg-ac" onClick={() => openModal(s.btns[0].modal)}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}15`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon style={{ width: 16, height: 16, color: s.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 10.5, color: T.t3, lineHeight: 1.4, marginBottom: 9 }}>{s.sub}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {s.btns.map((b, j) => (
                    <button key={j} className={b.p ? 'fg-cbtn-a' : 'fg-cbtn-m'} onClick={e => { e.stopPropagation(); openModal(b.modal); }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngagementScore({ allPosts, polls, activeChallenges, events, now, openModal }) {
  const score = (s, e) =>
    allPosts.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; })
      .reduce((a, x) => a + (x.likes?.length || 0) + (x.comments?.length || 0), 0)
    + polls.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; })
      .reduce((a, x) => a + (x.voters?.length || 0), 0);

  const thisWeek = score(subDays(now, 7), now);
  const lastWeek = score(subDays(now, 14), subDays(now, 7));
  const change   = lastWeek === 0 ? 0 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  const up       = change >= 0;

  const total    = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
                 + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)
                 + activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const likes    = allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0);
  const comments = allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0);
  const challP   = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const pollV    = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Flame style={{ width: 13, height: 13, color: T.orange }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.t1 }}>Engagement Score</span>
        <HelpCircle style={{ width: 11, height: 11, color: T.t3 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
        <span style={{ fontSize: 40, fontWeight: 800, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{total}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: up ? T.success : T.danger }}>
          {up ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
          {up ? '+' : ''}{change}% this week
        </span>
      </div>
      <div style={{ fontSize: 11, color: T.t3, marginBottom: 14 }}>Total interactions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 14 }}>
        {[
          { l: `${likes} Likes`,    r: `${challP} Challenge Responses` },
          { l: `${comments} Comments`, r: `${pollV} Poll Votes`           },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '6px 0', borderBottom: i === 0 ? `1px solid ${T.divider}` : 'none' }}>
            <span style={{ color: T.t2, fontWeight: 600 }}>{row.l}</span>
            <span style={{ color: T.t3 }}>{row.r}</span>
          </div>
        ))}
      </div>
      {total === 0 && (
        <div style={{ fontSize: 11, color: T.t3, padding: '9px 11px', background: T.warnSub, border: `1px solid rgba(245,158,11,.2)`, borderRadius: 8, marginBottom: 12, lineHeight: 1.5 }}>
          Low engagement — try posting a poll question
        </div>
      )}
      <button className="fg-btn-p" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 13, height: 13 }} /> Create
      </button>
    </div>
  );
}

function RightPanel({ allPosts, polls, challenges, events, activeChallenges, allMemberships, now, openModal }) {
  const [view, setView] = useState('feed');
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="fg-view-toggle">
          <button className={`fg-vt-btn${view === 'feed' ? ' on' : ''}`} onClick={() => setView('feed')}>
            <Flame style={{ width: 11, height: 11 }} /> Feed
          </button>
          <button className={`fg-vt-btn${view === 'cal' ? ' on' : ''}`} onClick={() => setView('cal')}>
            <Calendar style={{ width: 11, height: 11 }} /> Calendar
          </button>
        </div>
      </div>
      <div style={{ height: 1, background: T.divider }} />
      {view === 'feed' ? (
        <>
          <AISuggestions openModal={openModal} />
          <div style={{ height: 1, background: T.divider }} />
          <EngagementScore allPosts={allPosts} polls={polls} activeChallenges={activeChallenges} events={events} now={now} openModal={openModal} />
        </>
      ) : (
        <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────── */
export default function TabContent({
  events = [], challenges = [], polls = [], posts = [], userPosts = [],
  checkIns, ci30, avatarMap,
  openModal        = () => {},
  now              = new Date(),
  allMemberships   = [],
  classes          = [],
  currentUser      = null,
  onDeletePost      = () => {},
  onDeleteEvent     = () => {},
  onDeleteChallenge = () => {},
  onDeleteClass     = () => {},
  onDeletePoll      = () => {},
  isCoach = false,
}) {
  const [activeFilter, setActiveFilter] = useState(isCoach ? 'classes' : 'gym');
  const [viewMode,     setViewMode]     = useState('feed');

  const allPosts         = [...(userPosts || []), ...(posts || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const gymPosts         = allPosts.filter(p => !p.user_id || p.gym_id || p.member_id);
  const memberPosts      = allPosts.filter(p => p.user_id && !p.gym_id);
  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalMembers     = allMemberships.length;

  const postScores = useMemo(() => allPosts.map(p => ({ id: p.id, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 })), [allPosts]);
  const maxScore   = Math.max(...postScores.map(p => p.score), 1);
  const topPostIds = new Set(postScores.filter(p => p.score >= maxScore * 0.7 && p.score > 0).map(p => p.id));

  const FILTERS = isCoach
    ? [{ id: 'classes', label: 'My Classes' }, { id: 'gym', label: 'Posts' }, { id: 'challenges', label: 'Challenges' }, { id: 'polls', label: 'Polls' }, { id: 'events', label: 'Events' }]
    : [{ id: 'gym', label: 'Feed' }, { id: 'members', label: 'Members' }, { id: 'challenges', label: 'Challenges' }, { id: 'classes', label: 'Classes' }, { id: 'polls', label: 'Polls' }];

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
    if (item.type === 'post')      return <FeedPostCard  key={item.data.id || i} post={item.data}      onDelete={onDeletePost}      isTop={topPostIds.has(item.data.id)} totalMembers={totalMembers} />;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     onDelete={onDeleteEvent}     now={now} />;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} onDelete={onDeleteChallenge} now={now} />;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}      allMemberships={allMemberships} />;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  const currentLabel = FILTERS.find(f => f.id === activeFilter)?.label;

  return (
    <>
      <style>{CSS}</style>
      <div className="fg-wrap">

        {/* ── 4-METRIC BAR ── */}
        <MetricsBar allPosts={allPosts} allMemberships={allMemberships} now={now} />

        {/* ── BODY ── */}
        <div className="fg-body">

          {/* CENTER */}
          <div className="fg-center">

            {/* Header + CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.t1, letterSpacing: '-0.02em', flex: 1, minWidth: 160 }}>
                🔥 Let's get your members engaged!
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="fg-btn-p" style={{ fontSize: 12 }} onClick={() => openModal('post')}>
                  <Plus style={{ width: 13, height: 13 }} /> Create first post
                </button>
                <button className="fg-btn-s" style={{ fontSize: 12 }} onClick={() => openModal('challenge')}>
                  <Trophy style={{ width: 13, height: 13 }} /> Start a challenge
                </button>
                <button className="fg-btn-s" style={{ fontSize: 12 }} onClick={() => openModal('poll')}>
                  <HelpCircle style={{ width: 13, height: 13 }} /> Ask a question
                </button>
              </div>
            </div>

            {/* Quick post ideas */}
            <QuickIdeas openModal={openModal} />

            {/* Feed / Calendar toggle */}
            <div>
              <div className="fg-view-toggle">
                <button className={`fg-vt-btn${viewMode === 'feed' ? ' on' : ''}`} onClick={() => setViewMode('feed')}>
                  <List style={{ width: 11, height: 11 }} /> Feed
                </button>
                <button className={`fg-vt-btn${viewMode === 'calendar' ? ' on' : ''}`} onClick={() => setViewMode('calendar')}>
                  <Calendar style={{ width: 11, height: 11 }} /> Calendar
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
              <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
            ) : (
              <>
                {/* Filter tabs */}
                <div className="fg-tabs" style={{ marginTop: -6 }}>
                  {FILTERS.map(f => (
                    <button key={f.id} className={`fg-tab${activeFilter === f.id ? ' on' : ''}`} onClick={() => setActiveFilter(f.id)}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Feed or empty */}
                {feedItems.length > 0
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{feedItems.map(renderItem)}</div>
                  : <EmptyState openModal={openModal} label={currentLabel !== 'Feed' ? currentLabel : null} />
                }
              </>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="fg-right">
            <RightPanel
              allPosts={allPosts}
              polls={polls}
              challenges={challenges}
              events={events}
              activeChallenges={activeChallenges}
              allMemberships={allMemberships}
              now={now}
              openModal={openModal}
            />
          </div>
        </div>
      </div>

      {/* Floating + Create FAB */}
      <button className="fg-fab" onClick={() => openModal('post')}>
        <Plus style={{ width: 15, height: 15 }} /> Create
      </button>
    </>
  );
}
