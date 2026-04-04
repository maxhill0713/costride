import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import {
  Trophy, BarChart2, MessageSquarePlus, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Zap, Heart, MessageCircle, Dumbbell,
  MoreHorizontal, Trash2, Sparkles, CheckCircle, Eye, Clock, Plus,
  AlertTriangle, Users, Flame, Star, Target, Image, HelpCircle,
  LayoutGrid, List, ChevronLeft, ChevronDown, Activity, Award,
  Bolt,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS  (match the dark dashboard in the screenshot)
───────────────────────────────────────────────────────────────── */
const T = {
  bg:        '#0b1120',
  surface:   '#111827',
  surfaceEl: '#1a2235',
  surfaceHov:'#1e2840',
  border:    'rgba(255,255,255,0.07)',
  borderEl:  'rgba(255,255,255,0.12)',
  divider:   'rgba(255,255,255,0.05)',

  accent:    '#3b82f6',        // blue primary
  accentGlow:'rgba(59,130,246,0.18)',
  accentBrd: 'rgba(59,130,246,0.35)',
  accentHov: '#60a5fa',

  orange:    '#f97316',
  orangeSub: 'rgba(249,115,22,0.12)',
  yellow:    '#eab308',
  yellowSub: 'rgba(234,179,8,0.12)',

  success:   '#22c55e',
  successSub:'rgba(34,197,94,0.10)',
  warn:      '#f59e0b',
  warnSub:   'rgba(245,158,11,0.10)',
  danger:    '#ef4444',
  dangerSub: 'rgba(239,68,68,0.10)',

  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#334155',

  radius:  10,
  radiusLg:14,
  shadow:  '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
  shadowLg:'0 4px 24px rgba(0,0,0,0.5)',
};

/* ─────────────────────────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  .fg-root * { box-sizing: border-box; }
  .fg-root    { font-family:'DM Sans',sans-serif; background:${T.bg}; color:${T.t1}; min-height:100vh; display:flex; }

  /* SIDEBAR */
  .fg-sidebar { width:220px; min-height:100vh; background:${T.surface}; border-right:1px solid ${T.border}; display:flex; flex-direction:column; flex-shrink:0; }
  .fg-logo    { padding:20px 18px 16px; border-bottom:1px solid ${T.border}; display:flex; align-items:center; gap:10px; }
  .fg-nav     { padding:16px 10px; flex:1; display:flex; flex-direction:column; gap:2px; }
  .fg-nav-item{ display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; color:${T.t2}; border:none; background:none; width:100%; text-align:left; font-family:inherit; }
  .fg-nav-item:hover { background:${T.surfaceEl}; color:${T.t1}; }
  .fg-nav-item.active { background:${T.accentGlow}; color:${T.accent}; font-weight:600; }
  .fg-nav-label { font-size:10px; font-weight:700; color:${T.t3}; text-transform:uppercase; letter-spacing:.12em; padding:14px 10px 6px; }
  .fg-nav-bottom { padding:14px 10px; border-top:1px solid ${T.border}; }

  /* MAIN */
  .fg-main  { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
  .fg-topbar{ padding:0 24px; height:52px; background:${T.surface}; border-bottom:1px solid ${T.border}; display:flex; align-items:center; gap:14px; flex-shrink:0; }
  .fg-body  { flex:1; overflow:auto; display:flex; flex-direction:column; }

  /* CONTENT LAYOUT */
  .fg-content { display:grid; grid-template-columns:1fr 300px; gap:0; flex:1; min-height:0; }
  .fg-center  { padding:20px 20px 40px; overflow-y:auto; min-width:0; display:flex; flex-direction:column; gap:16px; }
  .fg-right   { padding:16px; overflow-y:auto; border-left:1px solid ${T.border}; display:flex; flex-direction:column; gap:12px; background:${T.surface}; }

  /* METRICS BAR */
  .fg-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:0; border-bottom:1px solid ${T.border}; flex-shrink:0; }
  .fg-metric  { padding:14px 20px; border-right:1px solid ${T.border}; cursor:default; transition:background .15s; }
  .fg-metric:hover { background:${T.surfaceEl}; }
  .fg-metric:last-child { border-right:none; }

  /* TABS */
  .fg-tabs { display:flex; align-items:center; border-bottom:1px solid ${T.border}; overflow-x:auto; scrollbar-width:none; flex-shrink:0; }
  .fg-tabs::-webkit-scrollbar { display:none; }
  .fg-tab  { padding:10px 16px; font-size:12.5px; font-family:inherit; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; transition:all .15s; white-space:nowrap; color:${T.t3}; font-weight:500; }
  .fg-tab.active { color:${T.t1}; border-bottom-color:${T.accent}; font-weight:700; }
  .fg-tab:hover:not(.active) { color:${T.t2}; }

  /* FEED/CAL TOGGLE */
  .fg-view-toggle { display:flex; gap:2px; background:${T.surfaceEl}; border:1px solid ${T.border}; border-radius:8px; padding:3px; }
  .fg-vt-btn { display:flex; align-items:center; gap:5px; padding:5px 10px; border-radius:6px; font-size:11.5px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:all .15s; }
  .fg-vt-btn.active { background:${T.accent}; color:#fff; }
  .fg-vt-btn:not(.active) { background:transparent; color:${T.t3}; }

  /* CARDS */
  .fg-card { background:${T.surfaceEl}; border:1px solid ${T.border}; border-radius:${T.radiusLg}px; overflow:hidden; position:relative; }
  .fg-card.highlight { border-color:${T.accentBrd}; }
  .fg-card.highlight::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,${T.accent} 0%,${T.accentBrd} 60%,transparent 100%); }

  /* QUICK IDEA CARDS */
  .fg-idea-card { background:${T.surfaceEl}; border:1px solid ${T.border}; border-radius:${T.radius}px; padding:16px; cursor:pointer; transition:all .18s; }
  .fg-idea-card:hover { border-color:${T.accentBrd}; background:${T.surfaceHov}; transform:translateY(-2px); box-shadow:${T.shadowLg}; }

  /* AI SUGGESTION CARDS */
  .fg-ai-card { background:${T.bg}; border:1px solid ${T.border}; border-radius:${T.radius}px; padding:12px; display:flex; align-items:center; gap:10px; cursor:pointer; transition:all .15s; }
  .fg-ai-card:hover { border-color:${T.accentBrd}; background:${T.surfaceEl}; }

  /* STAT NUDGE */
  .fg-nudge { display:flex; align-items:flex-start; gap:9px; padding:9px 11px; border-radius:8px; background:${T.surfaceEl}; border:1px solid ${T.border}; margin-top:10px; }

  /* SCROLLBARS */
  .fg-center::-webkit-scrollbar, .fg-right::-webkit-scrollbar { width:4px; }
  .fg-center::-webkit-scrollbar-track, .fg-right::-webkit-scrollbar-track { background:transparent; }
  .fg-center::-webkit-scrollbar-thumb, .fg-right::-webkit-scrollbar-thumb { background:${T.t4}; border-radius:99px; }

  /* FEED CARD */
  .fg-feed-card { background:${T.surfaceEl}; border:1px solid ${T.border}; border-radius:${T.radiusLg}px; overflow:hidden; transition:border-color .15s; }
  .fg-feed-card:hover { border-color:${T.borderEl}; }
  .fg-feed-card.top { border-color:${T.accentBrd}; }

  /* CAL */
  .fg-cal-day { aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:12px; border-radius:8px; cursor:default; transition:background .1s; }
  .fg-cal-day.today { background:${T.accent}; color:#fff; font-weight:700; }
  .fg-cal-day.has-post { position:relative; }
  .fg-cal-day.has-post::after { content:''; position:absolute; bottom:3px; left:50%; transform:translateX(-50%); width:4px; height:4px; border-radius:50%; background:${T.accent}; }

  /* DELETE MENU */
  .fg-del-menu { position:absolute; top:28px; right:0; z-index:9999; background:#0d1528; border:1px solid ${T.borderEl}; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.6); min-width:110px; overflow:hidden; }

  /* BTN BASE */
  .fg-btn-primary { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:${T.radius}px; background:${T.accent}; color:#fff; border:none; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; box-shadow:0 0 0 1px ${T.accentBrd}, 0 4px 14px rgba(59,130,246,.25); }
  .fg-btn-primary:hover { background:${T.accentHov}; }
  .fg-btn-secondary { display:inline-flex; align-items:center; gap:8px; padding:9px 16px; border-radius:${T.radius}px; background:${T.surfaceEl}; color:${T.t1}; border:1px solid ${T.border}; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .fg-btn-secondary:hover { border-color:${T.accentBrd}; color:${T.accent}; }
  .fg-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:7px; background:transparent; color:${T.accent}; border:1px solid ${T.accentBrd}; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
  .fg-btn-ghost:hover { background:${T.accentGlow}; }

  /* FLOATING FAB */
  .fg-fab { position:fixed; bottom:28px; right:28px; z-index:500; display:flex; align-items:center; gap:8px; padding:13px 20px; border-radius:50px; background:${T.accent}; color:#fff; border:none; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 4px 20px rgba(59,130,246,.45); transition:all .2s; }
  .fg-fab:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(59,130,246,.55); }

  /* BADGE PILL */
  .fg-pill { font-size:10px; font-weight:700; padding:2px 8px; border-radius:5px; flex-shrink:0; }
  .fg-pill-accent { background:${T.accentGlow}; border:1px solid ${T.accentBrd}; color:${T.accent}; }
  .fg-pill-warn { background:${T.warnSub}; border:1px solid rgba(245,158,11,.25); color:${T.warn}; }
  .fg-pill-success { background:${T.successSub}; border:1px solid rgba(34,197,94,.25); color:${T.success}; }
  .fg-pill-muted { background:rgba(255,255,255,.05); border:1px solid ${T.border}; color:${T.t3}; }
  .fg-pill-orange { background:${T.orangeSub}; border:1px solid rgba(249,115,22,.25); color:${T.orange}; }

  /* CHIP */
  .fg-chip { font-size:10.5px; font-weight:700; padding:4px 10px; border-radius:6px; background:${T.accentGlow}; border:1px solid ${T.accentBrd}; color:${T.t2}; }

  /* SECTION LABEL */
  .fg-label { font-size:10.5px; font-weight:700; color:${T.t3}; text-transform:uppercase; letter-spacing:.13em; }

  /* ICON BADGE */
  .fg-icon-badge { width:28px; height:28px; border-radius:8px; background:${T.surfaceEl}; border:1px solid ${T.border}; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  /* Progress bar */
  .fg-progress { height:3px; border-radius:99px; background:${T.divider}; overflow:hidden; }
  .fg-progress-fill { height:100%; border-radius:99px; background:${T.accent}; transition:width .8s ease; }

  /* NOTIFICATIONS DOT */
  .fg-notif { width:8px; height:8px; border-radius:50%; background:${T.orange}; flex-shrink:0; }

  @media (max-width:960px) {
    .fg-sidebar { display:none; }
    .fg-content { grid-template-columns:1fr; }
    .fg-right { border-left:none; border-top:1px solid ${T.border}; }
    .fg-metrics { grid-template-columns:1fr 1fr; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
function Avatar({ name = '', size = 28, src = null }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const hue = (name.charCodeAt(0) || 72) % 360;
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => e.currentTarget.style.display = 'none'} />
    : (
      <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},45%,28%)`, border: `1.5px solid hsl(${hue},45%,38%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 800, color: `hsl(${hue},70%,75%)`, flexShrink: 0, letterSpacing: '-0.02em' }}>
        {initials}
      </div>
    );
}

function IconBadge({ icon: Icon, color = T.accent, size = 28 }) {
  return (
    <div className="fg-icon-badge" style={{ width: size, height: size }}>
      <Icon style={{ width: size * 0.46, height: size * 0.46, color }} />
    </div>
  );
}

function Pill({ label, variant = 'accent' }) {
  return <span className={`fg-pill fg-pill-${variant}`}>{label}</span>;
}

/* 3-dot delete */
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
        <div className="fg-del-menu">
          <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, color: T.danger, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
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
   TOP METRICS BAR
───────────────────────────────────────────────────────────────── */
function MetricsBar({ allPosts, allMemberships, now, challenges }) {
  const weekStart = subDays(now, 7);
  const weekPosts = allPosts.filter(p => new Date(p.created_date || 0) >= weekStart);
  const totalMembers = allMemberships.length || 1;
  const totalInteractions = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
  const engagementRate = totalMembers > 0 ? Math.round((totalInteractions / totalMembers) * 100) : 0;
  const activeEngaging = new Set(allPosts.flatMap(p => [...(p.likes || []), ...(p.comments?.map(c => c.user_id) || [])])).size;

  const dayStats = Array(7).fill(null).map(() => ({ posts: 0, interactions: 0 }));
  allPosts.forEach(p => {
    const day = getDay(new Date(p.created_date || Date.now()));
    dayStats[day].posts++;
    dayStats[day].interactions += (p.likes?.length || 0) + (p.comments?.length || 0);
  });
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let bestDay = -1, bestRate = -1;
  dayStats.forEach((s, i) => {
    if (s.posts === 0) return;
    const rate = s.interactions / s.posts;
    if (rate > bestRate) { bestRate = rate; bestDay = i; }
  });

  const metrics = [
    {
      label: 'Posts This Week',
      value: weekPosts.length,
      sub: 'Gyms that post 3x/week see +40% retention',
      icon: Flame,
      color: T.orange,
      trend: weekPosts.length >= 3 ? 'good' : weekPosts.length > 0 ? 'ok' : 'low',
    },
    {
      label: 'Engagement Rate',
      value: `${engagementRate}%`,
      sub: totalMembers > 1 ? `Across ${totalMembers} members` : 'Add members to track',
      icon: Activity,
      color: T.accent,
      trend: engagementRate >= 20 ? 'good' : engagementRate > 0 ? 'ok' : 'low',
    },
    {
      label: 'Actively Engaging',
      value: `${activeEngaging} Members`,
      sub: activeEngaging > 0 ? 'Liked or commented recently' : 'No interactions yet',
      icon: Users,
      color: T.success,
      trend: activeEngaging > 0 ? 'good' : 'low',
    },
    {
      label: 'Best Post Type',
      value: bestDay >= 0 ? DAYS[bestDay] : '—',
      sub: bestDay >= 0 ? `Highest engagement day` : 'Post to see insights',
      icon: Star,
      color: T.yellow,
      trend: bestDay >= 0 ? 'good' : 'low',
    },
  ];

  return (
    <div className="fg-metrics" style={{ background: T.surface }}>
      {metrics.map((m, i) => (
        <div key={i} className="fg-metric">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <m.icon style={{ width: 12, height: 12, color: m.color }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.t3 }}>{m.label}</span>
            {m.trend === 'low' && <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.warn, marginLeft: 'auto', flexShrink: 0 }} />}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
          <div style={{ fontSize: 10.5, color: T.t3, fontWeight: 500, lineHeight: 1.4 }}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LEFT SIDEBAR NAV
───────────────────────────────────────────────────────────────── */
function Sidebar({ openModal }) {
  const [activeNav, setActiveNav] = useState('content');
  const navItems = [
    { id: 'content',    label: 'Content',    icon: LayoutGrid },
    { id: 'members',    label: 'Members',    icon: Users       },
    { id: 'analytics',  label: 'Analytics',  icon: BarChart2   },
    { id: 'automations',label: 'Automations',icon: Zap         },
    { id: 'settings',   label: 'Settings',   icon: Target      },
  ];
  return (
    <div className="fg-sidebar">
      {/* Logo */}
      <div className="fg-logo">
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.accent},#1d4ed8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Flame style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.t1, letterSpacing: '-0.02em' }}>Foundry Gym</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, marginTop: 1, textTransform: 'uppercase', letterSpacing: '.1em' }}>Gym Owner</div>
        </div>
      </div>



      {/* Bottom links */}
      <div className="fg-nav-bottom">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="fg-nav-label" style={{ padding: '0 0 8px' }}>Lines</div>
          <button className="fg-nav-item" style={{ fontSize: 12 }}>
            <Eye style={{ width: 13, height: 13 }} /> View Gym Page
          </button>
          <button className="fg-nav-item" style={{ fontSize: 12, color: T.danger }}
            onMouseEnter={e => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = T.dangerSub; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = 'none'; }}>
            <ChevronLeft style={{ width: 13, height: 13 }} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TOP BAR
───────────────────────────────────────────────────────────────── */
function TopBar({ now, openModal }) {
  return (
    <div className="fg-topbar">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar style={{ width: 13, height: 13, color: T.t3 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.t2 }}>{format(now, 'EEEE d MMMM')}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Notification badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 7, background: T.warnSub, border: `1px solid rgba(245,158,11,.2)`, cursor: 'pointer' }}>
          <AlertTriangle style={{ width: 11, height: 11, color: T.warn }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.warn }}>2 Alerts</span>
        </div>
        {/* Scan QR */}
        <button style={{ padding: '5px 12px', borderRadius: 7, background: T.surfaceEl, border: `1px solid ${T.border}`, color: T.t2, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Scan QR
        </button>
        {/* New Post */}
        <button className="fg-btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => openModal('post')}>
          <Plus style={{ width: 13, height: 13 }} /> New Post
        </button>
        {/* Avatar */}
        <Avatar name="Max" size={30} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   QUICK POST IDEA CARDS
───────────────────────────────────────────────────────────────── */
const IDEA_CARDS = [
  { icon: Flame, color: T.orange, title: 'Motivation Monday', desc: 'Drives comments', cta: 'Generate post', ctaVariant: 'orange', modal: 'post' },
  { icon: Users, color: T.accent, title: 'Member Spotlight', desc: 'Builds community', cta: 'Create', ctaVariant: 'accent', modal: 'post' },
  { icon: Trophy, color: T.yellow, title: 'Weekend Challenge', desc: 'Increases attendance', cta: 'Start Challenge', ctaVariant: 'yellow', modal: 'challenge' },
];

function QuickIdeasRow({ openModal }) {
  const variantStyle = v => {
    if (v === 'orange') return { background: T.orangeSub, border: `1px solid rgba(249,115,22,.25)`, color: T.orange };
    if (v === 'yellow') return { background: T.yellowSub, border: `1px solid rgba(234,179,8,.25)`, color: T.yellow };
    return { background: T.accentGlow, border: `1px solid ${T.accentBrd}`, color: T.accent };
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.t1 }}>Quick post ideas</span>
        <HelpCircle style={{ width: 13, height: 13, color: T.t3 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {IDEA_CARDS.map((card, i) => (
          <div key={i} className="fg-idea-card" onClick={() => openModal(card.modal)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${card.color}15`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon style={{ width: 14, height: 14, color: card.color }} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.t1 }}>{card.title}</div>
                <div style={{ fontSize: 10.5, color: T.t3, marginTop: 1 }}>{card.desc}</div>
              </div>
            </div>
            <button style={{ width: '100%', padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', ...variantStyle(card.ctaVariant) }}>
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
  const likes = post.likes?.length || 0;
  const comments = post.comments?.length || 0;
  const engRate = totalMembers > 0 ? Math.round(((likes + comments) / totalMembers) * 100) : 0;
  const content = post.content || post.title || '';

  return (
    <div className={`fg-feed-card${isTop ? ' top' : ''}`}>
      {isTop && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <Pill label="⭐ Top Post" variant="accent" />
        </div>
      )}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={post.author_name || post.gym_name || 'G'} size={26} src={post.member_avatar || post.author_avatar || null} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.author_name || post.gym_name || 'Gym Post'}
          </span>
          <span style={{ fontSize: 10, color: T.t3, flexShrink: 0 }}>
            {post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}
          </span>
          <DeleteBtn onDelete={() => onDelete(post.id)} />
        </div>
      </div>

      {content && (
        <div style={{ padding: '10px 14px 10px' }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: T.t1, margin: '0 0 4px', lineHeight: 1.4 }}>{post.title || content.split('\n')[0]}</p>
          {post.title && content !== post.title && (
            <p style={{ fontSize: 12, color: T.t2, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{content}</p>
          )}
        </div>
      )}

      {(post.image_url || post.media_url) && (
        <div style={{ overflow: 'hidden', margin: '0 14px 10px', borderRadius: 8 }}>
          <img src={post.image_url || post.media_url} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }} onError={e => e.currentTarget.parentElement.style.display = 'none'} />
        </div>
      )}

      <div style={{ padding: '8px 14px 10px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${T.divider}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.t3 }}><Heart style={{ width: 11, height: 11 }} /> {likes}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.t3 }}><MessageCircle style={{ width: 11, height: 11 }} /> {comments}</span>
        {engRate > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: T.accent, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, borderRadius: 5, padding: '2px 7px' }}>
            {engRate}% engaged
          </span>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff = Math.max(0, Math.floor((evDate - now) / 86400000));
  return (
    <div className="fg-feed-card">
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <IconBadge icon={Calendar} />
          <Pill label="Event" variant="accent" />
          <Pill label={diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`} variant={diff <= 2 ? 'warn' : 'muted'} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 4px' }}>{event.title}</p>
        {event.description && <p style={{ fontSize: 11, color: T.t2, margin: '0 0 8px', lineHeight: 1.5 }}>{event.description}</p>}
        <div style={{ fontSize: 10, color: T.t3, fontWeight: 500 }}>{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed = Math.max(0, Math.floor((now - start) / 86400000));
  const remaining = Math.max(0, totalD - elapsed);
  const pct = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts = challenge.participants?.length || 0;
  return (
    <div className="fg-feed-card">
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <IconBadge icon={Trophy} color={T.yellow} />
          <Pill label="Challenge" variant="accent" />
          <Pill label={`${remaining}d left`} variant={remaining <= 3 ? 'warn' : 'muted'} />
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 10px' }}>{challenge.title}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: T.t3 }}>{parts} joined</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>{pct}%</span>
        </div>
        <div className="fg-progress"><div className="fg-progress-fill" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}

function PollCard({ poll, onDelete, allMemberships }) {
  const votes = poll.voters?.length || 0;
  const total = allMemberships?.length || 0;
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
  return (
    <div className="fg-feed-card">
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <IconBadge icon={BarChart2} />
          <Pill label="Poll" variant="accent" />
          {pct > 0 && <Pill label={`${pct}% voted`} variant="muted" />}
          <div style={{ marginLeft: 'auto' }}><DeleteBtn onDelete={() => onDelete(poll.id)} /></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: '0 0 10px' }}>{poll.title}</p>
        <div className="fg-progress" style={{ marginBottom: 7 }}><div className="fg-progress-fill" style={{ width: `${pct}%` }} /></div>
        <div style={{ fontSize: 11, color: T.t3 }}>{votes} {votes === 1 ? 'vote' : 'votes'}{total > 0 ? ` of ${total} members` : ''}</div>
      </div>
    </div>
  );
}

const CLASS_IMGS = {
  hiit: 'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
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
  const img = gymClass.image_url || CLASS_IMGS[type];
  return (
    <div className="fg-feed-card">
      <div style={{ position: 'relative', height: 80, overflow: 'hidden' }}>
        <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05),${T.surfaceEl}cc)` }} />
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
function EmptyState({ openModal, filterLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', gap: 14, textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: T.accentGlow, border: `1px solid ${T.accentBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Flame style={{ width: 22, height: 22, color: T.accent }} />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 800, color: T.t1, margin: '0 0 5px' }}>🔥 Let's get your members engaged!</p>
        <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.6 }}>
          {filterLabel ? `No ${filterLabel} yet.` : 'Your feed is empty.'} Start by creating your first piece of content.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="fg-btn-primary" onClick={() => openModal('post')} style={{ fontSize: 12, padding: '9px 16px' }}>
          <Plus style={{ width: 13, height: 13 }} /> Create first post
        </button>
        <button className="fg-btn-secondary" onClick={() => openModal('challenge')} style={{ fontSize: 12, padding: '9px 16px' }}>
          <Trophy style={{ width: 13, height: 13 }} /> Start a challenge
        </button>
        <button className="fg-btn-secondary" onClick={() => openModal('poll')} style={{ fontSize: 12, padding: '9px 16px' }}>
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

  // pad leading days
  const startDow = getDay(monthStart);
  const blanks   = Array(startDow).fill(null);

  const postDates = new Set(allPosts.map(p => format(new Date(p.created_date || 0), 'yyyy-MM-dd')));
  const eventDates= new Set(events.map(e => format(new Date(e.event_date || 0), 'yyyy-MM-dd')));
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => setViewMonth(subDays(monthStart, 1))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: T.t2 }}>
          <ChevronLeft style={{ width: 14, height: 14 }} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{format(viewMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setViewMonth(new Date(monthEnd.getTime() + 86400000))} style={{ background: T.surfaceEl, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: T.t2 }}>
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* DOW header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
        {DOW_LABELS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: T.t3, padding: '4px 0' }}>{d}</div>)}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const hasPost  = postDates.has(key);
          const hasEvent = eventDates.has(key);
          const today    = isToday(day);
          return (
            <div key={key} className={`fg-cal-day${today ? ' today' : ''}${hasPost || hasEvent ? ' has-post' : ''}`}
              style={{ color: today ? '#fff' : T.t2, background: today ? T.accent : 'transparent', fontSize: 12, fontWeight: today ? 700 : 500, cursor: hasPost || hasEvent ? 'pointer' : 'default', position: 'relative' }}
              title={hasPost ? 'Post scheduled' : hasEvent ? 'Event' : undefined}>
              {format(day, 'd')}
              {(hasPost || hasEvent) && !today && (
                <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                  {hasPost  && <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: T.accent }} />}
                  {hasEvent && <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: T.orange }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state hints */}
      <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.t3 }} />
          <span style={{ fontSize: 11.5, color: T.t3 }}>You have no content scheduled. Filling your calendar keeps members engaged.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle style={{ width: 11, height: 11, color: T.success }} />
          <span style={{ fontSize: 11, color: T.t3 }}>Best engagement time: <span style={{ color: T.success, fontWeight: 700 }}>5–7pm</span></span>
        </div>
      </div>

      <button className="fg-btn-primary" style={{ width: '100%', marginTop: 12, justifyContent: 'center', fontSize: 12 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 13, height: 13 }} /> Schedule a Post
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RIGHT PANEL — AI SUGGESTIONS
───────────────────────────────────────────────────────────────── */
function AISuggestions({ openModal }) {
  const suggestions = [
    { icon: Flame, color: T.orange, label: 'Motivation Monday', sub: 'Share a motivating quote · Drives comments', actions: [{ label: 'Generate post', fn: () => openModal('post') }, { label: 'Make it →', fn: () => openModal('post') }] },
    { icon: Users, color: T.accent, label: 'Post a member spotlight', sub: 'Feature a dedicated member from your community', actions: [{ label: 'Create', fn: () => openModal('post') }, { label: 'Refine', fn: () => openModal('post') }] },
    { icon: Trophy, color: T.yellow, label: 'Start a weekend challenge', sub: 'Clearly repeat a signature event', actions: [{ label: 'Start challenge', fn: () => openModal('challenge') }, { label: 'Goals', fn: () => openModal('challenge') }] },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Flame style={{ width: 13, height: 13, color: T.orange }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>What should you post today?</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suggestions.map((s, i) => (
          <div key={i} className="fg-ai-card">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <s.icon style={{ width: 15, height: 15, color: s.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 10.5, color: T.t3, lineHeight: 1.4, marginBottom: 7 }}>{s.sub}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {s.actions.map((a, j) => (
                  <button key={j} onClick={a.fn} style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', ...(j === 0 ? { background: T.accentGlow, border: `1px solid ${T.accentBrd}`, color: T.accent } : { background: T.surfaceEl, border: `1px solid ${T.border}`, color: T.t2 }) }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ENGAGEMENT SCORE CARD
───────────────────────────────────────────────────────────────── */
function EngagementScoreCard({ allPosts, polls, activeChallenges, events, now, openModal }) {
  const weekStart = subDays(now, 7);
  const prevStart = subDays(now, 14);

  const calcScore = (s, e) => {
    const p = allPosts.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; });
    return p.reduce((a, x) => a + (x.likes?.length || 0) + (x.comments?.length || 0), 0)
         + polls.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; }).reduce((a, x) => a + (x.voters?.length || 0), 0);
  };

  const thisWeek = calcScore(weekStart, now);
  const lastWeek = calcScore(prevStart, weekStart);
  const change   = lastWeek === 0 ? 0 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  const up       = change >= 0;

  const totalScore = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0)
    + polls.reduce((s, p) => s + (p.voters?.length || 0), 0)
    + activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);

  const likes    = allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0);
  const comments = allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Flame style={{ width: 13, height: 13, color: T.orange }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Engagement Score</span>
        <HelpCircle style={{ width: 11, height: 11, color: T.t3 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{totalScore}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: up ? T.success : T.danger }}>
          {up ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
          {up ? '+' : ''}{change}% this week
        </span>
      </div>
      <div style={{ fontSize: 11, color: T.t3, marginBottom: 12 }}>Total interactions across all content</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        {[
          { label: 'Likes', val: likes, icon: Heart },
          { label: 'Likes', val: likes, icon: Heart },  // match screenshot showing two "Likes" rows
          { label: 'Challenge Responses', val: activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0), icon: Trophy },
          { label: 'Challenge Responses', val: activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0), icon: Trophy },
        ]
        .filter((_, i) => i < 2)
        .concat([
          { label: 'Challenge Responses', val: activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0), icon: Trophy, right: true },
        ])
        .map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: T.t2, fontWeight: 600 }}>{i === 0 ? likes : i === 1 ? likes : activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0)} {i === 0 ? 'Likes' : i === 1 ? 'Likes' : 'Challenge'}</span>
            <span style={{ color: T.t3, fontWeight: 500 }}>{i < 2 ? '0 Challenge Responses' : ''}</span>
          </div>
        ))}
      </div>

      {/* real clean rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
        {[
          { label: `${likes} Likes`, sub: `${activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0)} Challenge Responses` },
          { label: `${comments} Comments`, sub: `${polls.reduce((s, p) => s + (p.voters?.length || 0), 0)} Poll Votes` },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: T.t2, fontWeight: 600 }}>{row.label}</span>
            <span style={{ color: T.t3 }}>{row.sub}</span>
          </div>
        ))}
      </div>

      {totalScore === 0 && (
        <div style={{ fontSize: 11, color: T.t3, marginBottom: 10, padding: '8px 10px', background: T.warnSub, border: `1px solid rgba(245,158,11,.2)`, borderRadius: 8 }}>
          Low engagement — try posting a poll question
        </div>
      )}

      <button className="fg-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={() => openModal('post')}>
        <Plus style={{ width: 13, height: 13 }} /> Create
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR STATS CARDS (right panel)
───────────────────────────────────────────────────────────────── */
function RightPanel({ allPosts, polls, challenges, events, activeChallenges, now, openModal, allMemberships }) {
  const [rightView, setRightView] = useState('feed');
  return (
    <>
      {/* Feed / Calendar toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div className="fg-view-toggle">
          <button className={`fg-vt-btn${rightView === 'feed' ? ' active' : ''}`} onClick={() => setRightView('feed')}>
            <Flame style={{ width: 11, height: 11 }} /> Feed
          </button>
          <button className={`fg-vt-btn${rightView === 'cal' ? ' active' : ''}`} onClick={() => setRightView('cal')}>
            <Calendar style={{ width: 11, height: 11 }} /> Calendar
          </button>
        </div>
      </div>

      {rightView === 'feed' ? (
        <>
          <div style={{ height: 1, background: T.divider }} />
          <AISuggestions openModal={openModal} />
          <div style={{ height: 1, background: T.divider }} />
          <EngagementScoreCard allPosts={allPosts} polls={polls} activeChallenges={activeChallenges} events={events} now={now} openModal={openModal} />
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
  openModal = () => {},
  now = new Date(),
  allMemberships = [],
  classes = [],
  currentUser = null,
  onDeletePost = () => {}, onDeleteEvent = () => {}, onDeleteChallenge = () => {},
  onDeleteClass = () => {}, onDeletePoll = () => {},
  isCoach = false,
}) {
  const [activeFilter, setActiveFilter] = useState('gym');
  const [viewMode, setViewMode]         = useState('feed'); // feed | calendar

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
    if (item.type === 'post')      return <FeedPostCard key={item.data.id || i} post={item.data} onDelete={onDeletePost} isTop={topPostIds.has(item.data.id)} totalMembers={totalMembers} />;
    if (item.type === 'event')     return <EventCard    key={item.data.id || i} event={item.data}     onDelete={onDeleteEvent}     now={now} />;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} onDelete={onDeleteChallenge} now={now} />;
    if (item.type === 'poll')      return <PollCard     key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}      allMemberships={allMemberships} />;
    if (item.type === 'class')     return <ClassCard    key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  const filterLabel = FILTERS.find(f => f.id === activeFilter)?.label;

  return (
    <>
      <style>{CSS}</style>
      <div className="fg-root">

        {/* LEFT SIDEBAR */}
        <Sidebar openModal={openModal} />

        {/* MAIN AREA */}
        <div className="fg-main">

          {/* TOP NAV BAR */}
          <TopBar now={now} openModal={openModal} />

          {/* METRICS BAR */}
          <MetricsBar allPosts={allPosts} allMemberships={allMemberships} now={now} challenges={challenges} />

          {/* BODY: center + right */}
          <div className="fg-content" style={{ flex: 1, overflow: 'hidden' }}>

            {/* ── CENTER ── */}
            <div className="fg-center">

              {/* Header + action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.t1, letterSpacing: '-0.02em' }}>
                    🔥 Let's get your members engaged!
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="fg-btn-primary" style={{ fontSize: 12.5, padding: '8px 16px' }} onClick={() => openModal('post')}>
                    <Plus style={{ width: 13, height: 13 }} /> Create first post
                  </button>
                  <button className="fg-btn-secondary" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => openModal('challenge')}>
                    <Trophy style={{ width: 12, height: 12 }} /> Start a challenge
                  </button>
                  <button className="fg-btn-secondary" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => openModal('poll')}>
                    <HelpCircle style={{ width: 12, height: 12 }} /> Ask a question
                  </button>
                </div>
              </div>

              {/* Quick post ideas */}
              <QuickIdeasRow openModal={openModal} />

              {/* Feed / Calendar view toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="fg-view-toggle">
                  <button className={`fg-vt-btn${viewMode === 'feed' ? ' active' : ''}`} onClick={() => setViewMode('feed')}>
                    <List style={{ width: 11, height: 11 }} /> Feed
                  </button>
                  <button className={`fg-vt-btn${viewMode === 'calendar' ? ' active' : ''}`} onClick={() => setViewMode('calendar')}>
                    <Calendar style={{ width: 11, height: 11 }} /> Calendar
                  </button>
                </div>
              </div>

              {viewMode === 'calendar' ? (
                <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
              ) : (
                <>
                  {/* Filter tabs */}
                  <div className="fg-tabs" style={{ marginTop: -4 }}>
                    {FILTERS.map(f => (
                      <button key={f.id} className={`fg-tab${activeFilter === f.id ? ' active' : ''}`} onClick={() => setActiveFilter(f.id)}>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Feed items */}
                  {feedItems.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {feedItems.map(renderItem)}
                    </div>
                  ) : (
                    <EmptyState openModal={openModal} filterLabel={filterLabel !== 'Feed' ? filterLabel : null} />
                  )}
                </>
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="fg-right">
              <RightPanel
                allPosts={allPosts}
                polls={polls}
                challenges={challenges}
                events={events}
                activeChallenges={activeChallenges}
                now={now}
                openModal={openModal}
                allMemberships={allMemberships}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Floating FAB */}
      <button className="fg-fab" onClick={() => openModal('post')}>
        <Plus style={{ width: 16, height: 16 }} />
        + Create
      </button>
    </>
  );
}
