import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import {
  Trophy, BarChart2, Calendar, ChevronRight, TrendingUp, TrendingDown,
  Heart, MessageCircle, MoreHorizontal, Trash2, CheckCircle, Plus,
  Users, Flame, HelpCircle, ChevronLeft, List,
} from 'lucide-react';

/* ─── DESIGN TOKENS ─── */
const T = {
  bg:         '#050810',
  surface:    '#0a0f1e',
  surfaceEl:  '#0d1225',
  surfaceHov: '#101929',
  border:     'rgba(255,255,255,0.04)',
  borderEl:   'rgba(255,255,255,0.07)',
  divider:    'rgba(255,255,255,0.03)',
  accent:     '#3b82f6',
  accentGlow: 'rgba(59,130,246,0.10)',
  accentBrd:  'rgba(59,130,246,0.22)',
  accentHov:  '#60a5fa',
  orange:     '#f97316',
  yellow:     '#f59e0b',
  teal:       '#0d9488',
  success:    '#10b981',
  warn:       '#f59e0b',
  warnSub:    'rgba(245,158,11,0.07)',
  danger:     '#ef4444',
  dangerSub:  'rgba(239,68,68,0.07)',
  t1: '#eef2ff',
  t2: '#8b95b3',
  t3: '#4b5578',
  t4: '#252d45',
  radius:   16,
  radiusLg: 16,
};

/* ─── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
  .fg-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
  .fg-wrap {
    font-family: 'DM Sans', sans-serif;
    background: ${T.bg};
    color: ${T.t1};
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 600px;
    overflow: hidden;
  }

  /* METRICS */
  .fg-metrics { display: grid; grid-template-columns: repeat(4,1fr); border-bottom: 1px solid ${T.border}; flex-shrink: 0; background: ${T.surface}; }
  .fg-met { padding: 14px 20px 15px; border-right: 1px solid ${T.border}; position: relative; cursor: default; transition: background .12s; }
  .fg-met:last-child { border-right: none; }
  .fg-met:hover { background: ${T.surfaceEl}; }

  /* BODY */
  .fg-body   { display: grid; grid-template-columns: 1fr 292px; flex: 1; overflow: hidden; min-height: 0; }
  .fg-center { padding: 20px 22px 48px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; }
  .fg-right  { padding: 16px 15px 40px; overflow-y: auto; border-left: 1px solid ${T.border}; display: flex; flex-direction: column; gap: 13px; background: ${T.surface}; }
  .fg-center::-webkit-scrollbar, .fg-right::-webkit-scrollbar { width: 3px; }
  .fg-center::-webkit-scrollbar-track, .fg-right::-webkit-scrollbar-track { background: transparent; }
  .fg-center::-webkit-scrollbar-thumb, .fg-right::-webkit-scrollbar-thumb { background: ${T.t4}; border-radius: 99px; }

  /* TOGGLE */
  .fg-toggle { display: inline-flex; gap: 2px; background: ${T.surfaceEl}; border: 1px solid ${T.border}; border-radius: 7px; padding: 2px; }
  .fg-tgl { display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: 5px; font-size: 11.5px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all .12s; letter-spacing: .005em; }
  .fg-tgl.on { background: ${T.accent}; color: #fff; }
  .fg-tgl:not(.on) { background: transparent; color: ${T.t3}; }
  .fg-tgl:not(.on):hover { color: ${T.t2}; }

  /* TABS */
  .fg-tabs { display: flex; align-items: center; border-bottom: 1px solid ${T.border}; overflow-x: auto; scrollbar-width: none; }
  .fg-tabs::-webkit-scrollbar { display: none; }
  .fg-tab { padding: 8px 14px; font-size: 12.5px; font-family: inherit; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all .1s; color: ${T.t3}; font-weight: 500; margin-bottom: -1px; white-space: nowrap; }
  .fg-tab.on { color: ${T.t1}; border-bottom-color: ${T.accent}; font-weight: 700; }
  .fg-tab:hover:not(.on) { color: ${T.t2}; }

  /* FEED CARD */
  .fg-fc { background: ${T.surfaceEl}; border: 1px solid ${T.border}; border-radius: ${T.radiusLg}px; overflow: hidden; transition: border-color .1s; position: relative; }
  .fg-fc:hover { border-color: ${T.borderEl}; }
  .fg-fc.top { border-color: ${T.accentBrd}; }
  .fg-fc.top::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,${T.accent},transparent 75%); }

  /* QUICK IDEA CARDS */
  .fg-ic {
    background: ${T.surfaceEl};
    border: 1px solid ${T.borderEl};
    border-radius: 11px;
    padding: 18px 16px 16px;
    cursor: pointer;
    transition: all .15s;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .fg-ic:hover { border-color: rgba(255,255,255,0.14); background: ${T.surfaceHov}; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.5); }

  /* AI SUGGESTION CARD */
  .fg-ac { background: ${T.bg}; border: 1px solid ${T.border}; border-radius: ${T.radius}px; padding: 11px 12px; cursor: pointer; transition: all .1s; }
  .fg-ac:hover { border-color: ${T.accentBrd}; background: ${T.surfaceEl}; }

  /* PROGRESS */
  .fg-prog { height: 2px; border-radius: 99px; background: ${T.divider}; overflow: hidden; }
  .fg-prog-fill { height: 100%; border-radius: 99px; background: ${T.accent}; }

  /* BUTTONS */
  .btn-p { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: ${T.radius}px; background: ${T.accent}; color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .12s; letter-spacing: .01em; }
  .btn-p:hover { background: ${T.accentHov}; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,.3); }
  .btn-s { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: ${T.radius}px; background: transparent; color: ${T.t2}; border: 1px solid ${T.border}; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .12s; }
  .btn-s:hover { border-color: ${T.borderEl}; color: ${T.t1}; background: ${T.surfaceEl}; }
  .cbtn-a { font-size: 10.5px; font-weight: 700; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; background: ${T.accentGlow}; border: 1px solid ${T.accentBrd}; color: ${T.accent}; transition: all .1s; }
  .cbtn-a:hover { background: ${T.accent}; color: #fff; }
  .cbtn-b { font-size: 10.5px; font-weight: 600; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; background: transparent; border: 1px solid ${T.border}; color: ${T.t2}; transition: all .1s; }
  .cbtn-b:hover { border-color: ${T.borderEl}; color: ${T.t1}; }

  /* CALENDAR */
  .fg-cal-g { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
  /* Fixed small height — no aspect-ratio so it doesn't balloon */
  .fg-cd {
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10.5px;
    border-radius: 5px;
    position: relative;
    color: ${T.t2};
    font-weight: 500;
    cursor: default;
    transition: background .1s;
  }
  .fg-cd.today { background: ${T.accent}; color: #fff; font-weight: 800; }
  .fg-cd:not(.today):hover { background: ${T.surfaceEl}; }

  /* DELETE MENU */
  .fg-dm { position: absolute; top: 26px; right: 0; z-index: 9999; background: #060d1c; border: 1px solid ${T.borderEl}; border-radius: 9px; box-shadow: 0 8px 28px rgba(0,0,0,.75); min-width: 100px; overflow: hidden; }

  @media(max-width:860px){
    .fg-body    { grid-template-columns: 1fr; }
    .fg-right   { display: none; }
    .fg-metrics { grid-template-columns: 1fr 1fr; }
  }
`;

/* ─── PRIMITIVES ─── */
function Av({ name = '', size = 28, src = null }) {
  const letters = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const hue = (name.charCodeAt(0) || 72) % 360;
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `hsl(${hue},38%,16%)`, border: `1.5px solid hsl(${hue},38%,24%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.32, fontWeight: 800, color: `hsl(${hue},60%,60%)`, flexShrink: 0 }}>
      {letters}
    </div>
  );
}

function Pill({ label, color = T.accent, bg = T.accentGlow, bdr = T.accentBrd }) {
  return <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: bg, border: `1px solid ${bdr}`, color, flexShrink: 0 }}>{label}</span>;
}

function IBadge({ icon: Icon, color = T.accent, size = 26 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 7, background: `${color}15`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ width: size * 0.44, height: size * 0.44, color }} />
    </div>
  );
}

function DelBtn({ onDelete }) {
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
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 5, cursor: 'pointer', transition: 'all .1s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.borderEl}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
        <MoreHorizontal style={{ width: 11, height: 11, color: T.t3 }} />
      </button>
      {open && (
        <div className="fg-dm">
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', fontSize: 11.5, fontWeight: 700, color: T.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = T.dangerSub}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Trash2 style={{ width: 11, height: 11 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── METRICS BAR ─── */
function MetricsBar({ allPosts, allMemberships, now }) {
  const weekPosts = allPosts.filter(p => new Date(p.created_date || 0) >= subDays(now, 7));
  const totalMem  = allMemberships.length;
  const totalInt  = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
  const engRate   = totalMem > 0 ? Math.round((totalInt / totalMem) * 100) : 0;
  const activeMem = new Set([
    ...allPosts.flatMap(p => p.likes || []),
    ...allPosts.flatMap(p => (p.comments || []).map(c => c.user_id).filter(Boolean)),
  ]).size;
  const typeMap = {};
  allPosts.forEach(p => {
    const type = (p.image_url || p.media_url) ? 'Photo' : p.poll_options ? 'Poll' : 'Text';
    typeMap[type] = (typeMap[type] || 0) + (p.likes?.length || 0) + (p.comments?.length || 0) * 2;
  });
  const bestType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const wkDot = weekPosts.length === 0 ? T.danger : weekPosts.length < 3 ? T.warn : T.success;

  const metrics = [
    { icon: Flame,    iconColor: T.orange,  label: 'Posts This Week',   display: String(weekPosts.length), sub: 'Gyms posting 3×/week see +40% retention', dot: wkDot },
    { icon: BarChart2,iconColor: T.accent,  label: 'Engagement Rate',   display: `${engRate}%`,           sub: totalMem > 0 ? `Across ${totalMem} members` : 'Add members to track', dot: engRate > 0 ? T.success : T.t3 },
    { icon: Users,    iconColor: T.success, label: 'Actively Engaging', display: String(activeMem), suffix: ' Members', sub: activeMem > 0 ? 'Liked or commented recently' : 'No interactions yet', dot: activeMem > 0 ? T.success : T.t3 },
    { icon: Trophy,   iconColor: T.yellow,  label: 'Top Post Type',     display: bestType, sub: allPosts.length > 0 ? 'Best for likes & saves' : 'Post to see insights', isDonut: true },
  ];

  return (
    <div className="fg-metrics">
      {metrics.map((m, i) => (
        <div key={i} className="fg-met">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <m.icon style={{ width: 11, height: 11, color: m.iconColor }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: T.t3, letterSpacing: '.01em' }}>{m.label}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              {m.dot && <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />}
              {m.isDonut && (
                <svg viewBox="0 0 34 34" style={{ width: 28, height: 28, transform: 'rotate(-90deg)' }}>
                  <circle cx="17" cy="17" r="12" fill="none" stroke={T.divider} strokeWidth="4" />
                  <circle cx="17" cy="17" r="12" fill="none" stroke={T.teal}    strokeWidth="4" strokeDasharray="46 75" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.t1, letterSpacing: '-0.035em', lineHeight: 1, marginBottom: 5 }}>
            {m.display}
            {m.suffix && <span style={{ fontSize: 14, fontWeight: 600, color: T.t2, marginLeft: 3 }}>{m.suffix}</span>}
          </div>
          <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.5 }}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── QUICK IDEAS ─── */
const QUICK_IDEAS = [
  { icon: Flame,  color: T.orange, title: 'Motivation Monday',         desc: 'Drives comments',      cta: 'Generate post',   modal: 'post'      },
  { icon: Users,  color: T.accent, title: 'Member Spotlight',          desc: 'Builds community',     cta: 'Create',          modal: 'post'      },
  { icon: Trophy, color: T.yellow, title: 'Start a weekend challenge', desc: 'Increases attendance', cta: 'Start challenge', modal: 'challenge' },
];

function QuickIdeas({ openModal }) {
  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Quick post ideas</span>
        <HelpCircle style={{ width: 12, height: 12, color: T.t3 }} />
      </div>

      {/* 3-column card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
        {QUICK_IDEAS.map((c, i) => (
          <div key={i} className="fg-ic" onClick={() => openModal(c.modal)}>
            {/* Icon + Title + Desc — large icon badge, left-aligned */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              {/* Icon badge — more opaque colour, bigger */}
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: `${c.color}20`,
                border: `1px solid ${c.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <c.icon style={{ width: 19, height: 19, color: c.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.t1, lineHeight: 1.25, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.4 }}>{c.desc}</div>
              </div>
            </div>

            {/* CTA Button — dark fill (page bg), bold coloured text, full width */}
            <button
              style={{
                width: '100%', padding: '10px 0',
                borderRadius: 7, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: T.bg,
                border: `1px solid rgba(255,255,255,0.07)`,
                color: c.color,
                transition: 'all .12s',
                letterSpacing: '.01em',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${c.color}12`; e.currentTarget.style.borderColor = `${c.color}28`; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.bg;           e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              onClick={e => { e.stopPropagation(); openModal(c.modal); }}>
              {c.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FEED CARDS ─── */
function FeedPostCard({ post, onDelete, isTop, totalMembers }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const engRate  = totalMembers > 0 ? Math.round(((likes + comments) / totalMembers) * 100) : 0;
  const title    = post.title || (post.content || '').split('\n')[0] || '';
  const body     = post.title ? (post.content || '') : '';
  return (
    <div className={`fg-fc${isTop ? ' top' : ''}`}>
      {isTop && <div style={{ position: 'absolute', top: 10, left: 11, zIndex: 2 }}><Pill label="⭐ Top Post" /></div>}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Av name={post.author_name || post.gym_name || 'G'} size={26} src={post.author_avatar || null} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'Gym Post'}
          </span>
          <span style={{ fontSize: 10, color: T.t3, flexShrink: 0 }}>{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
          <DelBtn onDelete={() => onDelete(post.id)} />
        </div>
      </div>
      {title && (
        <div style={{ padding: '10px 14px' }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: T.t1, margin: '0 0 4px', lineHeight: 1.4 }}>{title}</p>
          {body && <p style={{ fontSize: 12, color: T.t2, margin: 0, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</p>}
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
        {engRate > 0 && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: T.accent, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, borderRadius: 4, padding: '2px 7px' }}>{engRate}% engaged</span>}
      </div>
    </div>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff   = Math.max(0, Math.floor((evDate - now) / 86400000));
  return (
    <div className="fg-fc">
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <IBadge icon={Calendar} />
          <Pill label="Event" />
          <Pill label={diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`} color={diff <= 2 ? T.warn : T.t3} bg={diff <= 2 ? 'rgba(245,158,11,.07)' : 'rgba(255,255,255,.04)'} bdr={diff <= 2 ? 'rgba(245,158,11,.2)' : T.border} />
          <div style={{ marginLeft: 'auto' }}><DelBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 4px' }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 11, color: T.t2, margin: '0 0 7px', lineHeight: 1.5 }}>{event.description}</p>}
        <div style={{ fontSize: 10, color: T.t3 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD  = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed = Math.max(0, Math.floor((now - start) / 86400000));
  const rem = Math.max(0, totalD - elapsed);
  const pct = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts = challenge.participants?.length || 0;
  return (
    <div className="fg-fc">
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <IBadge icon={Trophy} color={T.yellow} />
          <Pill label="Challenge" />
          <Pill label={`${rem}d left`} color={rem <= 3 ? T.warn : T.t3} bg={rem <= 3 ? 'rgba(245,158,11,.07)' : 'rgba(255,255,255,.04)'} bdr={rem <= 3 ? 'rgba(245,158,11,.2)' : T.border} />
          <div style={{ marginLeft: 'auto' }}><DelBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 10px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
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
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <IBadge icon={BarChart2} />
          <Pill label="Poll" />
          {pct > 0 && <Pill label={`${pct}% voted`} color={T.t3} bg="rgba(255,255,255,.04)" bdr={T.border} />}
          <div style={{ marginLeft: 'auto' }}><DelBtn onDelete={() => onDelete(poll.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 10px' }}>{poll.title}</p>
        <div className="fg-prog" style={{ marginBottom: 6 }}><div className="fg-prog-fill" style={{ width: `${pct}%` }} /></div>
        <div style={{ fontSize: 11, color: T.t3 }}>{votes} vote{votes !== 1 ? 's' : ''}{total > 0 ? ` of ${total} members` : ''}</div>
      </div>
    </div>
  );
}

const CLS_IMGS = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  default:  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
};
function getClsType(c) {
  const n = (c.class_type || c.name || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('flow'))     return 'yoga';
  if (n.includes('strength') || n.includes('lift')) return 'strength';
  return 'default';
}
function ClassCard({ gymClass, onDelete }) {
  const type = getClsType(gymClass);
  return (
    <div className="fg-fc">
      <div style={{ position: 'relative', height: 80, overflow: 'hidden' }}>
        <img src={gymClass.image_url || CLS_IMGS[type]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,transparent,${T.surfaceEl}cc)` }} />
        <span style={{ position: 'absolute', top: 7, left: 9, fontSize: 8.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: T.accent, background: 'rgba(0,0,0,.5)', border: `1px solid ${T.accentBrd}`, borderRadius: 4, padding: '2px 6px' }}>
          {type.toUpperCase()}
        </span>
      </div>
      <div style={{ padding: '10px 13px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DelBtn onDelete={() => onDelete(gymClass.id)} />
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 11, color: T.t3, marginTop: 3 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.instructor       && <div style={{ fontSize: 11, color: T.t2, marginTop: 3 }}>{gymClass.instructor}</div>}
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ─── */
function EmptyState({ openModal, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 14, textAlign: 'center' }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Flame style={{ width: 22, height: 22, color: T.accent }} />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 800, color: T.t1, margin: '0 0 6px' }}>🔥 Let's get your members engaged!</p>
        <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.6 }}>
          {label ? `No ${label} yet.` : 'Your feed is empty. Create your first piece of content.'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn-p" style={{ fontSize: 12 }} onClick={() => openModal('post')}><Plus style={{ width: 13, height: 13 }} /> Create first post</button>
        <button className="btn-s" style={{ fontSize: 12 }} onClick={() => openModal('challenge')}><Trophy style={{ width: 13, height: 13 }} /> Start a challenge</button>
        <button className="btn-s" style={{ fontSize: 12 }} onClick={() => openModal('poll')}><HelpCircle style={{ width: 13, height: 13 }} /> Ask a question</button>
      </div>
    </div>
  );
}

/* ─── CALENDAR VIEW (compact) ─── */
function CalendarView({ allPosts, events, now, openModal }) {
  const [viewMonth, setViewMonth] = useState(now);
  const ms   = startOfMonth(viewMonth), me = endOfMonth(viewMonth);
  const days   = eachDayOfInterval({ start: ms, end: me });
  const blanks = Array(getDay(ms)).fill(null);
  const DOW    = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const postDates = new Set(allPosts.map(p => format(new Date(p.created_date || 0), 'yyyy-MM-dd')));
  const evDates   = new Set(events.map(e => format(new Date(e.event_date    || 0), 'yyyy-MM-dd')));
  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setViewMonth(subDays(ms, 1))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 7px', cursor: 'pointer', color: T.t2, display: 'flex' }}>
          <ChevronLeft style={{ width: 12, height: 12 }} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{format(viewMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setViewMonth(new Date(me.getTime() + 86400000))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 7px', cursor: 'pointer', color: T.t2, display: 'flex' }}>
          <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="fg-cal-g" style={{ marginBottom: 2 }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: T.t3, padding: '2px 0', letterSpacing: '.05em' }}>{d}</div>
        ))}
      </div>

      {/* Day cells — fixed 26px height, no aspect-ratio */}
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
                <div style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                  {hasPost && <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.accent }} />}
                  {hasEv   && <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.orange }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hints */}
      <div style={{ marginTop: 12, padding: 11, borderRadius: 7, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.t3, marginTop: 4, flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: T.t3, lineHeight: 1.5 }}>No content scheduled. Filling your calendar keeps members engaged.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle style={{ width: 9, height: 9, color: T.success, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: T.t3 }}>Best engagement time: <span style={{ color: T.success, fontWeight: 700 }}>5–7pm</span></span>
        </div>
      </div>

      <button className="btn-p" style={{ width: '100%', justifyContent: 'center', marginTop: 10, fontSize: 11.5 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 12, height: 12 }} /> Schedule a Post
      </button>
    </div>
  );
}

/* ─── RIGHT PANEL ─── */
const SUGG_IMGS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&q=80',
  'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=120&q=80',
];
const AI_SUGGS = [
  {
    dot: T.accent, label: 'Motivation Monday',
    sub: 'Share a motivating quote · Drives comments',
    btns: [{ label: 'Generate post', p: true, modal: 'post' }, { label: 'Make it →', p: false, modal: 'post' }],
  },
  {
    dot: T.success, label: 'Post a member spotlight',
    sub: 'Feature a dedicated member from your community',
    btns: [{ label: 'Create', p: true, modal: 'post' }, { label: 'Refine', p: false, modal: 'post' }],
  },
  {
    dot: T.yellow, label: 'Start a weekend challenge',
    sub: 'Clearly repeat a signature event',
    btns: [{ label: 'Start challenge', p: true, modal: 'challenge' }, { label: 'Goals', p: false, modal: 'challenge' }],
  },
];

function AISuggestions({ openModal }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Flame style={{ width: 12, height: 12, color: T.orange }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>What should you post today?</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {AI_SUGGS.map((s, i) => (
          <div key={i} className="fg-ac" onClick={() => openModal(s.btns[0].modal)}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              {/* Text side */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 9.5, color: T.t3, marginBottom: 8, paddingLeft: 10, lineHeight: 1.4 }}>{s.sub}</div>
                <div style={{ display: 'flex', gap: 5, paddingLeft: 10 }}>
                  {s.btns.map((b, j) => (
                    <button key={j} className={b.p ? 'cbtn-a' : 'cbtn-b'} onClick={e => { e.stopPropagation(); openModal(b.modal); }}>{b.label}</button>
                  ))}
                </div>
              </div>
              {/* Thumbnail */}
              <div style={{ width: 44, height: 44, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                <img src={SUGG_IMGS[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.parentElement.style.display = 'none'} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngagementScore({ allPosts, polls, activeChallenges, now, openModal }) {
  const score = (s, e) =>
    allPosts.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; })
      .reduce((a, x) => a + (x.likes?.length || 0) + (x.comments?.length || 0), 0) +
    polls.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; })
      .reduce((a, x) => a + (x.voters?.length || 0), 0);
  const thisW = score(subDays(now, 7), now);
  const lastW = score(subDays(now, 14), subDays(now, 7));
  const chg   = lastW === 0 ? 0 : Math.round(((thisW - lastW) / lastW) * 100);
  const up    = chg >= 0;
  const total = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0) +
                polls.reduce((s, p)   => s + (p.voters?.length    || 0), 0) +
                activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const likes    = allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0);
  const comments = allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0);
  const challP   = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const pollV    = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Flame style={{ width: 12, height: 12, color: T.orange }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Engagement Score</span>
        <HelpCircle style={{ width: 10, height: 10, color: T.t3 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 2 }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{total}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: up ? T.success : T.danger }}>
          {up ? <TrendingUp style={{ width: 10, height: 10 }} /> : <TrendingDown style={{ width: 10, height: 10 }} />}
          {up ? '+' : ''}{chg}% this week
        </span>
      </div>
      <div style={{ fontSize: 10, color: T.t3, marginBottom: 13 }}>Total interactions</div>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 13 }}>
        {[
          { l: `${likes} Likes`,       r: `${challP} Challenge Responses` },
          { l: `${comments} Comments`, r: `${pollV} Poll Votes`            },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: i === 0 ? `1px solid ${T.divider}` : 'none' }}>
            <span style={{ color: T.t2, fontWeight: 600 }}>{row.l}</span>
            <span style={{ color: T.t3 }}>{row.r}</span>
          </div>
        ))}
      </div>
      {total === 0 && (
        <div style={{ fontSize: 10.5, color: T.t2, padding: '8px 11px', background: T.warnSub, border: `1px solid rgba(245,158,11,.16)`, borderRadius: 7, marginBottom: 11, lineHeight: 1.5 }}>
          Low engagement — try posting a poll question
        </div>
      )}
      <button className="btn-p" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 12, height: 12 }} /> Create
      </button>
    </div>
  );
}

function RightPanel({ allPosts, polls, challenges, events, activeChallenges, allMemberships, now, openModal }) {
  const [view, setView] = useState('feed');
  return (
    <>
      {/* Feed / Calendar toggle */}
      <div className="fg-toggle">
        <button className={`fg-tgl${view === 'feed' ? ' on' : ''}`} onClick={() => setView('feed')}>
          <Flame style={{ width: 10, height: 10 }} /> Feed
        </button>
        <button className={`fg-tgl${view === 'cal' ? ' on' : ''}`} onClick={() => setView('cal')}>
          <Calendar style={{ width: 10, height: 10 }} /> Calendar
        </button>
      </div>

      <div style={{ height: 1, background: T.divider }} />

      {view === 'feed' ? (
        <>
          <AISuggestions openModal={openModal} />
          <div style={{ height: 1, background: T.divider }} />
          <EngagementScore allPosts={allPosts} polls={polls} activeChallenges={activeChallenges} now={now} openModal={openModal} />
        </>
      ) : (
        <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
      )}
    </>
  );
}

/* ─── MAIN EXPORT ─── */
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
        case 'members':    return { posts: memberPosts,   events: [],             challenges: [],               polls: [],  classes: [] };
        case 'gym':        return { posts: gymPosts,       events: [],             challenges: [],               polls: [],  classes: [] };
        case 'challenges': return { posts: [],             events: [],             challenges: activeChallenges, polls: [],  classes: [] };
        case 'classes':    return { posts: [],             events: [],             challenges: [],               polls: [],  classes };
        case 'polls':      return { posts: [],             events: [],             challenges: [],               polls,      classes: [] };
        case 'events':     return { posts: [],             events: upcomingEvents, challenges: [],               polls: [],  classes: [] };
        default:           return { posts: allPosts,       events: upcomingEvents, challenges: activeChallenges, polls,      classes };
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

        {/* ── METRICS BAR ── */}
        <MetricsBar allPosts={allPosts} allMemberships={allMemberships} now={now} />

        {/* ── BODY ── */}
        <div className="fg-body">

          {/* ══ CENTER ══ */}
          <div className="fg-center">

            {/* Header row — title LEFT, buttons RIGHT, all on one line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.t1, letterSpacing: '-0.025em', flex: 1, minWidth: 160, whiteSpace: 'nowrap' }}>
                🔥 Let's get your members engaged!
              </h2>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button className="btn-p" style={{ fontSize: 12 }} onClick={() => openModal('post')}>
                  <Plus style={{ width: 13, height: 13 }} /> Create first post
                </button>
                <button className="btn-s" style={{ fontSize: 12 }} onClick={() => openModal('challenge')}>
                  <Trophy style={{ width: 13, height: 13 }} /> Start a challenge
                </button>
                <button className="btn-s" style={{ fontSize: 12 }} onClick={() => openModal('poll')}>
                  <HelpCircle style={{ width: 13, height: 13 }} /> Ask a question
                </button>
              </div>
            </div>

            {/* Quick post ideas */}
            <QuickIdeas openModal={openModal} />

            {/* Feed / Calendar toggle */}
            <div className="fg-toggle" style={{ alignSelf: 'flex-start' }}>
              <button className={`fg-tgl${viewMode === 'feed' ? ' on' : ''}`} onClick={() => setViewMode('feed')}>
                <List style={{ width: 10, height: 10 }} /> Feed
              </button>
              <button className={`fg-tgl${viewMode === 'calendar' ? ' on' : ''}`} onClick={() => setViewMode('calendar')}>
                <Calendar style={{ width: 10, height: 10 }} /> Calendar
              </button>
            </div>

            {/* Calendar or Feed */}
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

                {/* Feed items or empty state */}
                {feedItems.length > 0
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{feedItems.map(renderItem)}</div>
                  : <EmptyState openModal={openModal} label={currentLabel !== 'Feed' ? currentLabel : null} />
                }
              </>
            )}
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="fg-right">
            <RightPanel
              allPosts={allPosts} polls={polls} challenges={challenges}
              events={events} activeChallenges={activeChallenges}
              allMemberships={allMemberships} now={now} openModal={openModal}
            />
          </div>

        </div>
      </div>
    </>
  );
}
