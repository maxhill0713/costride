import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import {
  Trophy, BarChart2, Calendar, ChevronRight, TrendingUp, TrendingDown,
  Heart, MessageCircle, MoreHorizontal, Trash2, CheckCircle, Plus,
  Users, Flame, Star, HelpCircle, ChevronLeft, Activity,
  Settings, Zap, LogOut, ExternalLink, LayoutGrid, Menu,
  AlertTriangle, Target, FileText, List, Eye, Dumbbell,
} from 'lucide-react';

/* ─── DESIGN TOKENS ─── */
const T = {
  bg:         '#070c18',
  sidebar:    '#060b16',
  surface:    '#0c1525',
  surfaceEl:  '#101d30',
  surfaceHov: '#142238',
  border:     'rgba(255,255,255,0.055)',
  borderEl:   'rgba(255,255,255,0.09)',
  divider:    'rgba(255,255,255,0.035)',
  accent:     '#2563eb',
  accentGlow: 'rgba(37,99,235,0.10)',
  accentBrd:  'rgba(37,99,235,0.26)',
  accentHov:  '#3b82f6',
  orange:    '#f97316',
  orangeSub: 'rgba(249,115,22,0.09)',
  yellow:    '#d97706',
  yellowSub: 'rgba(217,119,6,0.09)',
  teal:      '#0d9488',
  tealGlow:  'rgba(13,148,136,0.15)',
  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.09)',
  warn:       '#f59e0b',
  warnSub:    'rgba(245,158,11,0.07)',
  danger:     '#ef4444',
  dangerSub:  'rgba(239,68,68,0.07)',
  t1: '#eef2f7',
  t2: '#7d8fa8',
  t3: '#3d4e64',
  t4: '#1e2d42',
  radius:   7,
  radiusLg: 11,
};

/* ─── GLOBAL CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
  .fg-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .fg-root { font-family: 'DM Sans', sans-serif; background: ${T.bg}; color: ${T.t1}; display: flex; width: 100%; height: 100%; min-height: 600px; overflow: hidden; }

  /* ─ SIDEBAR ─ */
  .fg-sidebar { width: 214px; min-width: 214px; height: 100%; background: ${T.sidebar}; border-right: 1px solid ${T.border}; display: flex; flex-direction: column; flex-shrink: 0; }
  .fg-sb-hd { padding: 14px 12px; border-bottom: 1px solid ${T.border}; display: flex; align-items: center; gap: 9px; }
  .fg-sb-label { padding: 14px 14px 5px; font-size: 9px; font-weight: 800; letter-spacing: .10em; text-transform: uppercase; color: ${T.t3}; }
  .fg-sb-link { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 14px; background: none; border: none; border-left: 2px solid transparent; font-family: inherit; font-size: 12px; font-weight: 500; color: ${T.t3}; cursor: pointer; transition: all .1s; text-align: left; }
  .fg-sb-link:hover { color: ${T.t2}; background: rgba(255,255,255,.018); }
  .fg-sb-link.on { color: ${T.t1}; font-weight: 700; background: ${T.accentGlow}; border-left-color: ${T.accent}; }
  .fg-sb-link.danger { color: ${T.danger}; }
  .fg-sb-link.danger:hover { background: ${T.dangerSub}; }
  .fg-sb-foot { margin-top: auto; border-top: 1px solid ${T.border}; padding: 6px 0; }

  /* ─ MAIN ─ */
  .fg-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  /* ─ HEADER ─ */
  .fg-hdr { height: 48px; min-height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; background: ${T.surface}; border-bottom: 1px solid ${T.border}; flex-shrink: 0; gap: 12px; }

  /* ─ METRICS ─ */
  .fg-metrics { display: grid; grid-template-columns: repeat(4,1fr); border-bottom: 1px solid ${T.border}; flex-shrink: 0; background: ${T.surface}; }
  .fg-met { padding: 11px 16px 12px; border-right: 1px solid ${T.border}; position: relative; }
  .fg-met:last-child { border-right: none; }

  /* ─ BODY ─ */
  .fg-body { display: grid; grid-template-columns: 1fr 284px; flex: 1; overflow: hidden; min-height: 0; }
  .fg-center { padding: 16px 16px 48px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
  .fg-right { padding: 14px 13px 40px; overflow-y: auto; border-left: 1px solid ${T.border}; display: flex; flex-direction: column; gap: 11px; background: ${T.surface}; }
  .fg-center::-webkit-scrollbar, .fg-right::-webkit-scrollbar { width: 3px; }
  .fg-center::-webkit-scrollbar-track, .fg-right::-webkit-scrollbar-track { background: transparent; }
  .fg-center::-webkit-scrollbar-thumb, .fg-right::-webkit-scrollbar-thumb { background: ${T.t4}; border-radius: 99px; }

  /* ─ TOGGLE ─ */
  .fg-toggle { display: inline-flex; gap: 2px; background: ${T.surfaceEl}; border: 1px solid ${T.border}; border-radius: 7px; padding: 2px; }
  .fg-tgl-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all .1s; }
  .fg-tgl-btn.on { background: ${T.accent}; color: #fff; }
  .fg-tgl-btn:not(.on) { background: transparent; color: ${T.t3}; }
  .fg-tgl-btn:not(.on):hover { color: ${T.t2}; }

  /* ─ TABS ─ */
  .fg-tabs { display: flex; align-items: center; border-bottom: 1px solid ${T.border}; overflow-x: auto; scrollbar-width: none; }
  .fg-tabs::-webkit-scrollbar { display: none; }
  .fg-tab { padding: 7px 13px; font-size: 12px; font-family: inherit; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all .1s; color: ${T.t3}; font-weight: 500; margin-bottom: -1px; white-space: nowrap; }
  .fg-tab.on { color: ${T.t1}; border-bottom-color: ${T.accent}; font-weight: 700; }
  .fg-tab:hover:not(.on) { color: ${T.t2}; }

  /* ─ CARDS ─ */
  .fg-fc { background: ${T.surfaceEl}; border: 1px solid ${T.border}; border-radius: ${T.radiusLg}px; overflow: hidden; transition: border-color .1s; position: relative; }
  .fg-fc:hover { border-color: ${T.borderEl}; }
  .fg-fc.top { border-color: ${T.accentBrd}; }
  .fg-fc.top::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,${T.accent},transparent 80%); }
  .fg-ic { background: ${T.surfaceEl}; border: 1px solid ${T.border}; border-radius: ${T.radius}px; padding: 13px; cursor: pointer; transition: all .14s; }
  .fg-ic:hover { border-color: ${T.accentBrd}; background: ${T.surfaceHov}; transform: translateY(-1px); }
  .fg-ac { background: ${T.bg}; border: 1px solid ${T.border}; border-radius: ${T.radius}px; padding: 10px 11px; cursor: pointer; transition: all .1s; }
  .fg-ac:hover { border-color: ${T.accentBrd}; background: ${T.surfaceEl}; }

  /* ─ PROGRESS ─ */
  .fg-prog { height: 2px; border-radius: 99px; background: ${T.divider}; overflow: hidden; }
  .fg-prog-fill { height: 100%; border-radius: 99px; background: ${T.accent}; }

  /* ─ BUTTONS ─ */
  .btn-p { display: inline-flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: ${T.radius}px; background: ${T.accent}; color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .1s; }
  .btn-p:hover { background: ${T.accentHov}; }
  .btn-s { display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: ${T.radius}px; background: ${T.surfaceEl}; color: ${T.t2}; border: 1px solid ${T.border}; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .1s; }
  .btn-s:hover { border-color: ${T.accentBrd}; color: ${T.t1}; }
  .cbtn-a { font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 5px; cursor: pointer; font-family: inherit; background: ${T.accentGlow}; border: 1px solid ${T.accentBrd}; color: ${T.accent}; transition: all .1s; }
  .cbtn-a:hover { background: ${T.accent}; color: #fff; }
  .cbtn-b { font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 5px; cursor: pointer; font-family: inherit; background: ${T.surfaceEl}; border: 1px solid ${T.border}; color: ${T.t2}; transition: all .1s; }
  .cbtn-b:hover { border-color: ${T.borderEl}; color: ${T.t1}; }

  /* ─ FAB ─ */
  .fg-fab { position: fixed; bottom: 20px; right: 20px; z-index: 999; display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 50px; background: ${T.accent}; color: #fff; border: none; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 18px rgba(37,99,235,.38); transition: all .14s; }
  .fg-fab:hover { background: ${T.accentHov}; transform: translateY(-2px); box-shadow: 0 8px 26px rgba(37,99,235,.48); }

  /* ─ CALENDAR ─ */
  .fg-cal-g { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
  .fg-cd { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 10.5px; border-radius: 5px; position: relative; color: ${T.t2}; font-weight: 500; cursor: default; }
  .fg-cd.today { background: ${T.accent}; color: #fff; font-weight: 800; }
  .fg-cd:not(.today):hover { background: ${T.surfaceEl}; }

  /* ─ DELETE MENU ─ */
  .fg-dm { position: absolute; top: 26px; right: 0; z-index: 9999; background: #07101f; border: 1px solid ${T.borderEl}; border-radius: 9px; box-shadow: 0 8px 24px rgba(0,0,0,.7); min-width: 100px; overflow: hidden; }

  /* ─ BADGE ─ */
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  @media(max-width:900px){
    .fg-sidebar { display: none; }
    .fg-body { grid-template-columns: 1fr; }
    .fg-right { display: none; }
    .fg-metrics { grid-template-columns: 1fr 1fr; }
  }
`;

/* ─── PRIMITIVES ─── */
function Av({ name = '', size = 28, src = null }) {
  const letters = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const hue = (name.charCodeAt(0) || 72) % 360;
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `hsl(${hue},40%,18%)`, border: `1.5px solid hsl(${hue},40%,26%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.32, fontWeight: 800, color: `hsl(${hue},65%,62%)`, flexShrink: 0 }}>
      {letters}
    </div>
  );
}

function Pill({ label, color = T.accent, bg = T.accentGlow, bdr = T.accentBrd }) {
  return <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: bg, border: `1px solid ${bdr}`, color, flexShrink: 0 }}>{label}</span>;
}

function IBadge({ icon: Icon, color = T.accent, size = 26 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 7, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5, cursor: 'pointer' }}>
        <MoreHorizontal style={{ width: 11, height: 11, color: T.t3 }} />
      </button>
      {open && (
        <div className="fg-dm">
          <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', fontSize: 11.5, fontWeight: 700, color: T.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = T.dangerSub}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Trash2 style={{ width: 11, height: 11 }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── SIDEBAR ─── */
const NAV = [
  { id: 'content',     icon: LayoutGrid,  label: 'Content'     },
  { id: 'members',     icon: Users,       label: 'Members'     },
  { id: 'analytics',   icon: BarChart2,   label: 'Analytics'   },
  { id: 'automations', icon: Zap,         label: 'Automations' },
  { id: 'settings',    icon: Settings,    label: 'Settings'    },
];

function Sidebar({ gymName = 'Your Gym' }) {
  const [activeNav, setActiveNav] = useState('content');
  return (
    <div className="fg-sidebar">
      <div className="fg-sb-hd">
        <Av name={gymName} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymName}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.07em' }}>Gym Owner</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, flexShrink: 0 }}>
          <Menu style={{ width: 13, height: 13, color: T.t3 }} />
        </button>
      </div>

      <div className="fg-sb-label">Navigation</div>
      <nav style={{ flex: 1 }}>
        {NAV.map(n => (
          <button key={n.id} className={`fg-sb-link${activeNav === n.id ? ' on' : ''}`} onClick={() => setActiveNav(n.id)}>
            <n.icon style={{ width: 13, height: 13, flexShrink: 0 }} /> {n.label}
          </button>
        ))}
      </nav>

      <div className="fg-sb-foot">
        <div className="fg-sb-label" style={{ paddingTop: 8 }}>Lines</div>
        <button className="fg-sb-link"><ExternalLink style={{ width: 12, height: 12, flexShrink: 0 }} /> View Gym Page</button>
        <button className="fg-sb-link danger"><LogOut style={{ width: 12, height: 12, flexShrink: 0 }} /> Log Out</button>
      </div>
    </div>
  );
}

/* ─── TOP HEADER ─── */
function TopHeader({ now, openModal, currentUser, gymName }) {
  const initials = (currentUser?.name || currentUser?.email || gymName || 'G').charAt(0).toUpperCase();
  return (
    <div className="fg-hdr">
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.t2 }}>{format(now, 'EEEE d MMMM')}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, background: T.dangerSub, border: `1px solid ${T.danger}28`, fontSize: 10.5, fontWeight: 700, color: T.danger }}>
          <AlertTriangle style={{ width: 9, height: 9 }} /> 2 Stars
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, background: T.surfaceEl, border: `1px solid ${T.border}`, fontSize: 10.5, fontWeight: 600, color: T.t2 }}>
          <Target style={{ width: 9, height: 9, color: T.t3 }} /> Scat OR
        </div>
        <button className="btn-p" style={{ fontSize: 11, padding: '5px 11px' }} onClick={() => openModal('post')}>
          <Plus style={{ width: 11, height: 11 }} /> New Post
        </button>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, border: `2px solid ${T.accentBrd}` }}>
          {initials}
        </div>
      </div>
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
    { labelText: 'Posts This Week', inlineVal: weekPosts.length, bigVal: String(weekPosts.length), sub: 'Gyms that post 3x/week see +40% more retention', dot: wkDot },
    { labelText: 'Engagement Rate', inlineVal: `${engRate}%`, bigVal: `${engRate}%`, sub: totalMem > 0 ? `Across ${totalMem} members` : 'Add members to track', dot: engRate > 0 ? T.success : T.t3 },
    { labelText: 'Actively Engaging', inlineVal: `${activeMem} Members`, bigVal: String(activeMem), suffix: ' Members', sub: activeMem > 0 ? 'Liked or commented recently' : 'No interactions yet', dot: activeMem > 0 ? T.success : T.t3 },
    { labelText: 'Top Post Type', bigVal: bestType, isDonut: true, sub: allPosts.length > 0 ? 'Best for likes & saves' : 'Post to see insights' },
  ];

  return (
    <div className="fg-metrics">
      {metrics.map((m, i) => (
        <div key={i} className="fg-met">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.t3 }}>
              {m.labelText}{m.inlineVal !== undefined ? ': ' : ''}<span style={{ color: T.t2 }}>{m.inlineVal}</span>
            </span>
            {m.dot && <div className="badge-dot" style={{ background: m.dot }} />}
            {m.isDonut && (
              <svg viewBox="0 0 34 34" style={{ width: 34, height: 34, transform: 'rotate(-90deg)', flexShrink: 0 }}>
                <circle cx="17" cy="17" r="12" fill="none" stroke={T.divider}  strokeWidth="4.5" />
                <circle cx="17" cy="17" r="12" fill="none" stroke={T.teal}     strokeWidth="4.5" strokeDasharray="48 75" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.t1, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
            {m.bigVal}{m.suffix && <span style={{ fontSize: 13, fontWeight: 600, color: T.t2, marginLeft: 3 }}>Members</span>}
          </div>
          <div style={{ fontSize: 9.5, color: T.t3, lineHeight: 1.5 }}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── QUICK POST IDEAS ─── */
const QUICK_IDEAS = [
  { icon: Flame,  color: T.orange, title: 'Motivation Monday',       desc: 'Drives comments',      cta: 'Generate post',   modal: 'post'      },
  { icon: Users,  color: T.accent, title: 'Member spotlight',        desc: 'Builds community',     cta: 'Create',          modal: 'post'      },
  { icon: Trophy, color: T.yellow, title: 'Start a weekend challenge', desc: 'Increases attendance', cta: 'Start challenge', modal: 'challenge' },
];

function QuickIdeas({ openModal }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Quick post ideas</span>
        <HelpCircle style={{ width: 12, height: 12, color: T.t3 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {QUICK_IDEAS.map((c, i) => (
          <div key={i} className="fg-ic" onClick={() => openModal(c.modal)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c.color}12`, border: `1px solid ${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <c.icon style={{ width: 13, height: 13, color: c.color }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, lineHeight: 1.3 }}>{c.title}</div>
                <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{c.desc}</div>
              </div>
            </div>
            <button
              style={{ width: '100%', padding: '5px 0', borderRadius: 6, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: `${c.color}12`, border: `1px solid ${c.color}22`, color: c.color }}
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
      {isTop && <div style={{ position: 'absolute', top: 9, left: 10, zIndex: 2 }}><Pill label="⭐ Top Post" /></div>}
      <div style={{ padding: '11px 13px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Av name={post.author_name || post.gym_name || 'G'} size={24} src={post.author_avatar || null} />
          <span style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: T.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'Gym Post'}
          </span>
          <span style={{ fontSize: 9.5, color: T.t3, flexShrink: 0 }}>{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
          <DelBtn onDelete={() => onDelete(post.id)} />
        </div>
      </div>
      {title && (
        <div style={{ padding: '9px 13px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 3px', lineHeight: 1.4 }}>{title}</p>
          {body && <p style={{ fontSize: 11.5, color: T.t2, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</p>}
        </div>
      )}
      {(post.image_url || post.media_url) && (
        <div style={{ margin: '0 13px 9px', borderRadius: 7, overflow: 'hidden' }}>
          <img src={post.image_url || post.media_url} alt="" style={{ width: '100%', maxHeight: 130, objectFit: 'cover', display: 'block' }} onError={e => e.currentTarget.parentElement.style.display = 'none'} />
        </div>
      )}
      <div style={{ padding: '7px 13px 10px', display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${T.divider}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: T.t3 }}><Heart style={{ width: 10, height: 10 }} />{likes}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: T.t3 }}><MessageCircle style={{ width: 10, height: 10 }} />{comments}</span>
        {engRate > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: T.accent, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, borderRadius: 4, padding: '2px 6px' }}>{engRate}% engaged</span>
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
      <div style={{ padding: '11px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
          <IBadge icon={Calendar} />
          <Pill label="Event" />
          <Pill label={diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`} color={diff <= 2 ? T.warn : T.t3} bg={diff <= 2 ? T.warnSub : 'rgba(255,255,255,.04)'} bdr={diff <= 2 ? 'rgba(245,158,11,.22)' : T.border} />
          <div style={{ marginLeft: 'auto' }}><DelBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: T.t1, margin: '0 0 3px' }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 11, color: T.t2, margin: '0 0 7px', lineHeight: 1.5 }}>{event.description}</p>}
        <div style={{ fontSize: 9.5, color: T.t3 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start    = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD   = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed  = Math.max(0, Math.floor((now - start) / 86400000));
  const rem      = Math.max(0, totalD - elapsed);
  const pct      = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts    = challenge.participants?.length || 0;
  return (
    <div className="fg-fc">
      <div style={{ padding: '11px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
          <IBadge icon={Trophy} color={T.yellow} />
          <Pill label="Challenge" />
          <Pill label={`${rem}d left`} color={rem <= 3 ? T.warn : T.t3} bg={rem <= 3 ? T.warnSub : 'rgba(255,255,255,.04)'} bdr={rem <= 3 ? 'rgba(245,158,11,.22)' : T.border} />
          <div style={{ marginLeft: 'auto' }}><DelBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: T.t1, margin: '0 0 9px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, color: T.t3 }}>{parts} joined</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: T.accent }}>{pct}%</span>
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
      <div style={{ padding: '11px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
          <IBadge icon={BarChart2} />
          <Pill label="Poll" />
          {pct > 0 && <Pill label={`${pct}% voted`} color={T.t3} bg="rgba(255,255,255,.04)" bdr={T.border} />}
          <div style={{ marginLeft: 'auto' }}><DelBtn onDelete={() => onDelete(poll.id)} /></div>
        </div>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: T.t1, margin: '0 0 9px' }}>{poll.title}</p>
        <div className="fg-prog" style={{ marginBottom: 6 }}><div className="fg-prog-fill" style={{ width: `${pct}%` }} /></div>
        <div style={{ fontSize: 10.5, color: T.t3 }}>{votes} vote{votes !== 1 ? 's' : ''}{total > 0 ? ` of ${total} members` : ''}</div>
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
      <div style={{ position: 'relative', height: 72, overflow: 'hidden' }}>
        <img src={gymClass.image_url || CLS_IMGS[type]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,.02),${T.surfaceEl}bb)` }} />
        <span style={{ position: 'absolute', top: 7, left: 8, fontSize: 8.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: T.accent, background: 'rgba(0,0,0,.5)', border: `1px solid ${T.accentBrd}`, borderRadius: 4, padding: '2px 6px' }}>
          {type.toUpperCase()}
        </span>
      </div>
      <div style={{ padding: '9px 11px 11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 5 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.t1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gymClass.name || gymClass.title}</div>
          <DelBtn onDelete={() => onDelete(gymClass.id)} />
        </div>
        {gymClass.duration_minutes && <div style={{ fontSize: 10.5, color: T.t3, marginTop: 2 }}>{gymClass.duration_minutes} min</div>}
        {gymClass.instructor && <div style={{ fontSize: 10.5, color: T.t2, marginTop: 3 }}>{gymClass.instructor}</div>}
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ─── */
function EmptyState({ openModal, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 20px', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Flame style={{ width: 20, height: 20, color: T.accent }} />
      </div>
      <div>
        <p style={{ fontSize: 14.5, fontWeight: 800, color: T.t1, margin: '0 0 5px' }}>🔥 Let's get your members engaged!</p>
        <p style={{ fontSize: 11.5, color: T.t3, margin: 0, lineHeight: 1.6 }}>
          {label ? `No ${label} yet.` : 'Your feed is empty.'} Create your first piece of content to get started.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
        <button className="btn-p" style={{ fontSize: 11.5 }} onClick={() => openModal('post')}><Plus style={{ width: 12, height: 12 }} /> Create first post</button>
        <button className="btn-s" style={{ fontSize: 11.5 }} onClick={() => openModal('challenge')}><Trophy style={{ width: 12, height: 12 }} /> Start a challenge</button>
        <button className="btn-s" style={{ fontSize: 11.5 }} onClick={() => openModal('poll')}><HelpCircle style={{ width: 12, height: 12 }} /> Ask a question</button>
      </div>
    </div>
  );
}

/* ─── CALENDAR VIEW ─── */
function CalendarView({ allPosts, events, now, openModal }) {
  const [viewMonth, setViewMonth] = useState(now);
  const ms  = startOfMonth(viewMonth), me = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: ms, end: me });
  const blanks = Array(getDay(ms)).fill(null);
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const postDates = new Set(allPosts.map(p => format(new Date(p.created_date || 0), 'yyyy-MM-dd')));
  const evDates   = new Set(events.map(e => format(new Date(e.event_date    || 0), 'yyyy-MM-dd')));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setViewMonth(subDays(ms, 1))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: T.t2, display: 'flex' }}>
          <ChevronLeft style={{ width: 13, height: 13 }} />
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.t1 }}>{format(viewMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setViewMonth(new Date(me.getTime() + 86400000))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: T.t2, display: 'flex' }}>
          <ChevronRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
      <div className="fg-cal-g" style={{ marginBottom: 3 }}>
        {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: T.t3, padding: '2px 0' }}>{d}</div>)}
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
                <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                  {hasPost && <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.accent }} />}
                  {hasEv   && <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.orange }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.t3, marginTop: 4, flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: T.t3, lineHeight: 1.5 }}>You have no content scheduled. Filling your calendar keeps members engaged.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle style={{ width: 10, height: 10, color: T.success, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: T.t3 }}>Best engagement time: <span style={{ color: T.success, fontWeight: 700 }}>5–7pm</span></span>
        </div>
      </div>
      <button className="btn-p" style={{ width: '100%', justifyContent: 'center', marginTop: 10, fontSize: 11.5 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 12, height: 12 }} /> Schedule a Post
      </button>
    </div>
  );
}

/* ─── RIGHT PANEL: AI SUGGESTIONS ─── */
const SUGG_IMGS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&q=80',
  'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=120&q=80',
];

const AI_SUGGS = [
  {
    color: T.accent, label: 'Motivation Monday',
    sub:   'Share a motivating quote · Drives comments',
    btns:  [{ label: 'Generate post', p: true, modal: 'post' }, { label: 'Make it →', p: false, modal: 'post' }],
  },
  {
    color: T.success, label: 'Post a member spotlight',
    sub:   'Feature a dedicated member from your community',
    btns:  [{ label: 'Create', p: true, modal: 'post' }, { label: 'Refine', p: false, modal: 'post' }],
  },
  {
    color: T.yellow, label: 'Start a weekend challenge',
    sub:   'Clearly repeat a signature event',
    btns:  [{ label: 'Start challenge', p: true, modal: 'challenge' }, { label: 'Goals', p: false, modal: 'challenge' }],
  },
];

function AISuggestions({ openModal }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Flame style={{ width: 12, height: 12, color: T.orange }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>What should you post today?</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {AI_SUGGS.map((s, i) => (
          <div key={i} className="fg-ac" onClick={() => openModal(s.btns[0].modal)}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 9.5, color: T.t3, marginBottom: 8, paddingLeft: 10, lineHeight: 1.4 }}>{s.sub}</div>
                <div style={{ display: 'flex', gap: 5, paddingLeft: 10 }}>
                  {s.btns.map((b, j) => (
                    <button key={j} className={b.p ? 'cbtn-a' : 'cbtn-b'} onClick={e => { e.stopPropagation(); openModal(b.modal); }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                <img src={SUGG_IMGS[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.parentElement.style.display = 'none'} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── RIGHT PANEL: ENGAGEMENT SCORE ─── */
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
                polls.reduce((s, p) => s + (p.voters?.length || 0), 0) +
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{total}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: up ? T.success : T.danger }}>
          {up ? <TrendingUp style={{ width: 10, height: 10 }} /> : <TrendingDown style={{ width: 10, height: 10 }} />}
          {up ? '+' : ''}{chg}% this week
        </span>
      </div>
      <div style={{ fontSize: 10, color: T.t3, marginBottom: 12 }}>Total interactions</div>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
        {[
          { l: `${likes} Likes`,      r: `${challP} Challenge Responses` },
          { l: `${comments} Comments`, r: `${pollV} Poll Votes`            },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: i === 0 ? `1px solid ${T.divider}` : 'none' }}>
            <span style={{ color: T.t2, fontWeight: 600 }}>{row.l}</span>
            <span style={{ color: T.t3 }}>{row.r}</span>
          </div>
        ))}
      </div>
      {total === 0 && (
        <div style={{ fontSize: 10.5, color: T.t2, padding: '8px 10px', background: T.warnSub, border: `1px solid rgba(245,158,11,.18)`, borderRadius: 7, marginBottom: 10, lineHeight: 1.5 }}>
          Low engagement — try posting a poll question
        </div>
      )}
      <button className="btn-p" style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 12, height: 12 }} /> Create
      </button>
    </div>
  );
}

/* ─── RIGHT PANEL WRAPPER ─── */
function RightPanel({ allPosts, polls, challenges, events, activeChallenges, allMemberships, now, openModal }) {
  const [view, setView] = useState('feed');
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="fg-toggle">
          <button className={`fg-tgl-btn${view === 'feed' ? ' on' : ''}`} onClick={() => setView('feed')}>
            <Flame style={{ width: 10, height: 10 }} /> Feed
          </button>
          <button className={`fg-tgl-btn${view === 'cal' ? ' on' : ''}`} onClick={() => setView('cal')}>
            <Calendar style={{ width: 10, height: 10 }} /> Calendar
          </button>
        </div>
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
  gymName = 'Foundry Gym',
}) {
  const [activeFilter, setActiveFilter] = useState(isCoach ? 'classes' : 'gym');
  const [viewMode, setViewMode]         = useState('feed');

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
      <div className="fg-root">
        {/* ─ SIDEBAR ─ */}
        <Sidebar gymName={gymName || currentUser?.gym_name || 'Your Gym'} />

        {/* ─ MAIN AREA ─ */}
        <div className="fg-main">
          {/* Header */}
          <TopHeader now={now} openModal={openModal} currentUser={currentUser} gymName={gymName} />

          {/* Metrics */}
          <MetricsBar allPosts={allPosts} allMemberships={allMemberships} now={now} />

          {/* Content body */}
          <div className="fg-body">
            {/* Center */}
            <div className="fg-center">
              {/* CTAs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.t1, letterSpacing: '-0.02em', flex: 1, minWidth: 150 }}>
                  🔥 Let's get your members engaged!
                </h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn-p" style={{ fontSize: 11.5 }} onClick={() => openModal('post')}>
                    <Plus style={{ width: 12, height: 12 }} /> Create first post
                  </button>
                  <button className="btn-s" style={{ fontSize: 11.5 }} onClick={() => openModal('challenge')}>
                    <Trophy style={{ width: 12, height: 12 }} /> Start a challenge
                  </button>
                  <button className="btn-s" style={{ fontSize: 11.5 }} onClick={() => openModal('poll')}>
                    <HelpCircle style={{ width: 12, height: 12 }} /> Ask a question
                  </button>
                </div>
              </div>

              {/* Quick ideas */}
              <QuickIdeas openModal={openModal} />

              {/* Feed / Calendar toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="fg-toggle">
                  <button className={`fg-tgl-btn${viewMode === 'feed' ? ' on' : ''}`} onClick={() => setViewMode('feed')}>
                    <List style={{ width: 10, height: 10 }} /> Feed
                  </button>
                  <button className={`fg-tgl-btn${viewMode === 'calendar' ? ' on' : ''}`} onClick={() => setViewMode('calendar')}>
                    <Calendar style={{ width: 10, height: 10 }} /> Calendar
                  </button>
                </div>
              </div>

              {viewMode === 'calendar' ? (
                <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
              ) : (
                <>
                  <div className="fg-tabs" style={{ marginTop: -4 }}>
                    {FILTERS.map(f => (
                      <button key={f.id} className={`fg-tab${activeFilter === f.id ? ' on' : ''}`} onClick={() => setActiveFilter(f.id)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {feedItems.length > 0
                    ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{feedItems.map(renderItem)}</div>
                    : <EmptyState openModal={openModal} label={currentLabel !== 'Feed' ? currentLabel : null} />
                  }
                </>
              )}
            </div>

            {/* Right panel */}
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
      </div>

      {/* FAB */}

    </>
  );
}
