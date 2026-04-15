/**
 * TabGymProfile — Gym Owner Dashboard (Upgraded)
 * Matches the new dashboard design from screenshot, preserving original colour tokens.
 */
import React, { useState } from 'react';
import {
  Image, Camera, Dumbbell, Sparkles, DollarSign, Info,
  ChevronRight, ChevronDown, ChevronUp, BadgeCheck, MapPin,
  Star, Users, Tag, ExternalLink, Zap, MessageSquare,
  PenSquare, BookOpen, TrendingUp, CheckCircle2, AlertTriangle,
  BarChart2, Rocket, Home, Calendar, User as UserIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

/* ─────────────────────────── colour tokens ─────────────────────────── */
const T = {
  bg:       '#000000',
  card:     '#141416',
  card2:    '#1a1a1f',
  brd:      '#222226',
  brd2:     '#2a2a30',
  t1:       '#ffffff',
  t2:       '#8a8a94',
  t3:       '#444450',
  cyan:     '#4d7fff',
  cyanDim:  'rgba(77,127,255,0.12)',
  cyanBrd:  'rgba(77,127,255,0.28)',
  green:    '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
  greenBrd: 'rgba(34,197,94,0.25)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  amberBrd: 'rgba(245,158,11,0.25)',
};

/* ─────────────────────────── tiny helpers ──────────────────────────── */
function StatusBadge({ status, color }) {
  const cfg = {
    green: { bg: T.greenDim, border: T.greenBrd, text: T.green },
    amber: { bg: T.amberDim, border: T.amberBrd, text: T.amber },
    cyan:  { bg: T.cyanDim,  border: T.cyanBrd,  text: T.cyan  },
  }[color] || { bg: T.cyanDim, border: T.cyanBrd, text: T.cyan };

  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>{status}</span>
  );
}

function ActionBtn({ label, color = 'green', onClick }) {
  const cfg = {
    green: { bg: T.greenDim, border: T.greenBrd, text: T.green },
    amber: { bg: T.amberDim, border: T.amberBrd, text: T.amber },
    cyan:  { bg: T.cyanDim,  border: T.cyanBrd,  text: T.cyan  },
  }[color];
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
        background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >{label}</button>
  );
}

/* Donut SVG */
function Donut({ pct, color, size = 72 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

/* Progress bar */
function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 4, borderRadius: 9, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', borderRadius: 9, background: color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
    </div>
  );
}

/* Row inside a section */
function SectionRow({ icon: Icon, statusIcon, label, description, thumbnails, actionLabel, actionColor, onClick, last }) {
  const isOk = statusIcon === 'ok';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 20px',
      borderBottom: last ? 'none' : `1px solid ${T.brd}`,
      background: 'transparent',
    }}>
      {/* status icon */}
      <div style={{ flexShrink: 0 }}>
        {isOk
          ? <CheckCircle2 style={{ width: 18, height: 18, color: T.green }} />
          : <AlertTriangle style={{ width: 18, height: 18, color: T.amber }} />}
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{label}</div>
        <div style={{ fontSize: 11, color: T.t3, marginTop: 2, lineHeight: 1.4 }}>{description}</div>
      </div>

      {/* thumbnails */}
      {thumbnails && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {thumbnails.map((src, i) => (
            <div key={i} style={{
              width: 38, height: 38, borderRadius: 6, overflow: 'hidden',
              background: T.card2, border: `1px solid ${T.brd}`, flexShrink: 0,
            }}>
              {src
                ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image style={{ width: 12, height: 12, color: T.t3 }} />
                  </div>}
            </div>
          ))}
        </div>
      )}

      {/* action */}
      {actionLabel && (
        <ActionBtn label={actionLabel} color={actionColor || (isOk ? 'green' : 'amber')} onClick={onClick} />
      )}
    </div>
  );
}

/* Collapsible section card */
function Section({ title, subtitle, badge, pct, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.cyan;

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.brd}`,
      borderRadius: 14, overflow: 'hidden', marginBottom: 12,
    }}>
      {/* header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', background: 'transparent', border: 'none',
          borderBottom: open ? `1px solid ${T.brd}` : 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{title}</span>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5,
                background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyanBrd}`,
                letterSpacing: '0.05em',
              }}>{badge}</span>
            )}
          </div>
          {subtitle && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, marginRight: 8 }}>{pct}% Complete</span>
        {open
          ? <ChevronUp style={{ width: 14, height: 14, color: T.t3, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 14, height: 14, color: T.t3, flexShrink: 0 }} />}
      </button>

      {open && (
        <>
          {children}
          <ProgressBar pct={pct} color={color} />
          <div style={{ height: 8 }} />
        </>
      )}
    </div>
  );
}

/* Tab pill */
function Tab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
        background: active ? T.cyanDim : 'transparent',
        color: active ? T.cyan : T.t2,
        border: active ? `1px solid ${T.cyanBrd}` : '1px solid transparent',
        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
      }}
    >
      {Icon && <Icon style={{ width: 12, height: 12 }} />}
      {label}
    </button>
  );
}

/* ─────────────────────────── mini phone mockup ─────────────────────── */
function PhoneMockup({ gym }) {
  const [activeScreen, setActiveScreen] = useState('home');
  const [liked, setLiked] = useState({});

  const gymName = gym?.name || 'Your Gym';
  const gymCity = gym?.city || 'City';
  const gymType = gym?.type || 'General';
  const memberCount = gym?.members_count || 247;
  const rating = gym?.rating || 4.8;
  const price = gym?.price || '£45/mo';

  const posts = [
    { id: 1, name: 'Alex T.', initials: 'AT', color: '#3b82f6', time: '2h ago', text: `Just smashed a new deadlift PR at ${gymName}! 🔥 Community here is unreal.`, likes: 18, comments: 4 },
    { id: 2, name: 'Priya S.', initials: 'PS', color: '#8b5cf6', time: '4h ago', text: 'Morning HIIT class was 🔥 Coach Sam never lets us slack. See you all tomorrow!', likes: 12, comments: 2 },
    { id: 3, name: 'Jamie R.', initials: 'JR', color: '#10b981', time: '6h ago', text: '30-day streak complete! Consistency is everything 💪', likes: 34, comments: 9 },
  ];

  const SCREEN = {
    home: (
      <div style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(to bottom, #02040a, #0d2360 50%, #02040a)' }}>
        {/* Hero */}
        <div style={{ position: 'relative', height: 100, overflow: 'hidden' }}>
          {gym?.image_url
            ? <img src={gym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1e3a8a,#0f172a)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,4,10,0.9), transparent)' }} />
          <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0a0f1e', border: `2px solid ${T.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {gym?.logo_url ? <img src={gym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Dumbbell style={{ width: 11, height: 11, color: T.cyan }} />}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{gymName}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{gymCity} · {gymType}</div>
            </div>
          </div>
          {gym?.claim_status === 'claimed' && (
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 3, background: T.greenDim, border: `1px solid ${T.greenBrd}`, borderRadius: 99, padding: '2px 6px' }}>
              <BadgeCheck style={{ width: 7, height: 7, color: T.green }} />
              <span style={{ fontSize: 7, fontWeight: 700, color: T.green }}>Official</span>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          {[
            { label: 'Members', value: memberCount },
            { label: 'Rating', value: rating },
            { label: 'Price', value: price },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '7px 4px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Check in button */}
        <div style={{ padding: '8px 10px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <button style={{ width: '100%', padding: '7px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', color: '#fff', fontSize: 9, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em' }}>
            ✓ CHECK IN
          </button>
        </div>

        {/* Feed */}
        <div style={{ padding: '8px 10px 4px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Community Feed</div>
          {posts.map((p, i) => (
            <div key={p.id} style={{ marginBottom: 8, padding: '8px 9px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{p.initials}</div>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>{p.time}</span>
              </div>
              <p style={{ fontSize: 8.5, color: 'rgba(226,232,240,0.8)', margin: 0, lineHeight: 1.45 }}>{p.text}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                <button onClick={() => setLiked(l => ({ ...l, [p.id]: !l[p.id] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: liked[p.id] ? '#f472b6' : 'rgba(255,255,255,0.3)', fontSize: 7.5, fontWeight: 700, padding: 0 }}>
                  ♡ {p.likes + (liked[p.id] ? 1 : 0)}
                </button>
                <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)' }}>💬 {p.comments}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    members: (
      <div style={{ flex: 1, overflowY: 'auto', background: '#02040a', padding: '10px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Members ({memberCount})</div>
        {[
          { initials: 'AT', name: 'Alex T.', color: '#3b82f6', streak: 14, pr: 'Deadlift 180kg' },
          { initials: 'PS', name: 'Priya S.', color: '#8b5cf6', streak: 8, pr: 'Squat 100kg' },
          { initials: 'JR', name: 'Jamie R.', color: '#10b981', streak: 30, pr: 'Bench 120kg' },
          { initials: 'MK', name: 'Marcus K.', color: '#f59e0b', streak: 5, pr: 'OHP 80kg' },
          { initials: 'SC', name: 'Sara C.', color: '#ef4444', streak: 22, pr: 'Row 140kg' },
        ].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{m.name}</div>
              <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)' }}>🔥 {m.streak}d streak · {m.pr}</div>
            </div>
          </div>
        ))}
      </div>
    ),
    classes: (
      <div style={{ flex: 1, overflowY: 'auto', background: '#02040a', padding: '10px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Today's Classes</div>
        {[
          { name: 'Morning HIIT', time: '06:30', coach: 'Sam T.', spots: 3, color: '#ef4444' },
          { name: 'Strength & Power', time: '09:00', coach: 'Alex R.', spots: 8, color: '#8b5cf6' },
          { name: 'Lunchtime Yoga', time: '12:30', coach: 'Lisa M.', spots: 12, color: '#10b981' },
          { name: 'Evening CrossFit', time: '18:00', coach: 'Sam T.', spots: 2, color: '#f59e0b' },
        ].map((c, i) => (
          <div key={i} style={{ marginBottom: 7, padding: '8px 9px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{c.name}</div>
                <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{c.time} · {c.coach}</div>
              </div>
              <button style={{ padding: '3px 8px', borderRadius: 6, background: c.spots <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${c.spots <= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`, color: c.spots <= 3 ? '#f87171' : '#60a5fa', fontSize: 7.5, fontWeight: 700, cursor: 'pointer' }}>
                {c.spots <= 3 ? `${c.spots} left` : 'Book'}
              </button>
            </div>
          </div>
        ))}
      </div>
    ),
  };

  const NAV = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: null, icon: null, label: '+', special: true },
    { id: 'classes', icon: Calendar, label: 'Classes' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div style={{
      background: '#0a0a0c', border: `2px solid ${T.brd2}`, borderRadius: 28,
      overflow: 'hidden', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px 4px', background: '#0a0a0c', flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: T.t1 }}>9:41</span>
        <div style={{ fontSize: 7, color: T.t2 }}>●●● ▲ 🔋</div>
      </div>

      {/* Screen content */}
      <div style={{ height: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {SCREEN[activeScreen] || SCREEN.home}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 6px 10px', borderTop: `1px solid rgba(255,255,255,0.06)`, background: 'rgba(10,10,12,0.98)', flexShrink: 0 }}>
        {NAV.map((n, i) => (
          <button key={i} onClick={() => n.id && setActiveScreen(n.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: n.id ? 'pointer' : 'default', padding: '2px 4px' }}>
            {n.special
              ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>+</div>
              : n.icon && <n.icon style={{ width: 14, height: 14, color: activeScreen === n.id ? T.cyan : 'rgba(255,255,255,0.35)' }} />}
            <span style={{ fontSize: 7.5, color: activeScreen === n.id ? T.cyan : 'rgba(255,255,255,0.3)', fontWeight: activeScreen === n.id ? 700 : 400 }}>{n.label}</span>
          </button>
        ))}
      </div>

      {/* Home bar */}
      <div style={{ height: 18, background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 60, height: 3, borderRadius: 2, background: T.brd2 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function TabGymProfile({ gym, openModal, setShowPoster }) {
  const [activeTab, setActiveTab] = useState('highImpact');

  if (!gym) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: T.t3, fontSize: 13 }}>
      No gym selected
    </div>
  );

  const amenitiesCount = gym.amenities?.length || 0;
  const equipmentCount = gym.equipment?.length || 0;
  const galleryCount   = gym.gallery?.length   || 0;

  /* completeness */
  const checks = [
    gym.name, gym.image_url, gym.logo_url,
    galleryCount > 0, amenitiesCount > 0, equipmentCount > 0,
    gym.price, gym.join_code,
  ];
  const done     = checks.filter(Boolean).length;
  const total    = checks.length;
  const pct      = Math.round((done / total) * 100);
  const actionsLeft = total - done;

  /* derived mini-stats (use real fields when available) */
  const communityStr  = gym.community_strength  || pct;
  const activeMembers = gym.active_members_week || gym.members_count || 0;
  const postsWeek     = gym.posts_this_week     || 0;
  const engScore      = gym.engagement_score    || Math.min(99, Math.round(communityStr * 1.1));
  const engLabel      = engScore >= 75 ? 'High' : engScore >= 40 ? 'Mid' : 'Low';
  const engColor      = engScore >= 75 ? T.green : engScore >= 40 ? T.amber : T.cyan;
  const communityColor = communityStr >= 80 ? T.green : communityStr >= 50 ? T.amber : T.cyan;

  const previewUrl = createPageUrl('GymCommunity') + '?id=' + gym.id;

  /* gallery thumbnails (up to 4) */
  const galleryThumbs = gym.gallery?.slice(0, 4).map(g => g.url || g) || [];
  while (galleryThumbs.length < 4) galleryThumbs.push(null);

  /* tabs config */
  const TABS = [
    { id: 'highImpact',   label: 'High Impact',   icon: Zap },
    { id: 'profileSetup', label: 'Profile Setup',  icon: BarChart2 },
    { id: 'community',    label: 'Community',      icon: Users },
    { id: 'onboarding',   label: 'Onboarding',     icon: Rocket },
  ];

  /* ── content per tab ── */
  const renderContent = () => {
    if (activeTab === 'highImpact' || activeTab === 'profileSetup') {
      return (
        <>
          {/* ── First Impressions ── */}
          <Section
            title="First Impressions"
            subtitle="Help members discover and trust your gym."
            pct={Math.round(([gym.logo_url, gym.image_url, galleryCount > 0].filter(Boolean).length / 3) * 100)}
          >
            <SectionRow
              statusIcon={gym.logo_url ? 'ok' : 'warn'}
              label="Logo / Profile Photo"
              description="Gyms with a logo get 32% more profile views and 23% higher join rate."
              thumbnails={[gym.logo_url]}
              actionLabel={gym.logo_url ? 'Update' : 'Add Logo'}
              actionColor={gym.logo_url ? 'green' : 'amber'}
              onClick={() => openModal('logo')}
            />
            <SectionRow
              statusIcon={gym.image_url ? 'ok' : 'warn'}
              label="Hero / Cover Image"
              description="A strong cover photo builds trust and showcases your gym's vibe."
              thumbnails={[gym.image_url]}
              actionLabel={gym.image_url ? 'Change' : 'Add Cover'}
              actionColor={gym.image_url ? 'green' : 'amber'}
              onClick={() => openModal('heroPhoto')}
            />
            <SectionRow
              last
              statusIcon={galleryCount > 0 ? 'ok' : 'warn'}
              label="Photo Gallery"
              description="Gyms with 5+ photos retain members 27% longer."
              thumbnails={galleryThumbs.slice(0, 4)}
              actionLabel={galleryCount > 0 ? `${galleryCount} Photos` : 'Add Photos'}
              actionColor={galleryCount > 0 ? 'green' : 'amber'}
              onClick={() => openModal('photos')}
            />
          </Section>

          {/* ── Gym Details ── */}
          <Section
            title="Gym Details"
            subtitle="Give members the information they need to choose and stay with you."
            pct={Math.round(([gym.name, gym.price].filter(Boolean).length / 2) * 100)}
          >
            <SectionRow
              statusIcon={gym.name ? 'ok' : 'warn'}
              label="Gym Info"
              description="Name, address, contact, and key details that members rely on."
              actionLabel={gym.name ? 'Set' : 'Add Info'}
              actionColor={gym.name ? 'green' : 'amber'}
              onClick={() => openModal('editInfo')}
            />
            <SectionRow
              last
              statusIcon={gym.price ? 'ok' : 'warn'}
              label="Pricing"
              description="Transparent pricing reduces early drop-off and builds trust."
              actionLabel={gym.price ? gym.price : 'Not Set'}
              actionColor={gym.price ? 'green' : 'amber'}
              onClick={() => openModal('pricing')}
            />
          </Section>

          {/* ── Member Experience ── */}
          <Section
            title="Member Experience"
            subtitle="Show members what makes your gym unique and worth coming back to."
            pct={Math.round(([amenitiesCount > 0, equipmentCount > 0].filter(Boolean).length / 2) * 100)}
          >
            <SectionRow
              statusIcon={amenitiesCount > 0 ? 'ok' : 'warn'}
              label="Amenities & Services"
              description="Highlight what members can access and enjoy at your gym."
              actionLabel={amenitiesCount > 0 ? `${amenitiesCount} Listed` : 'Add'}
              actionColor={amenitiesCount > 0 ? 'green' : 'amber'}
              onClick={() => openModal('amenities')}
            />
            <SectionRow
              last
              statusIcon={equipmentCount > 0 ? 'ok' : 'warn'}
              label="Equipment"
              description="Help members find the classes and equipment they care about."
              actionLabel={equipmentCount > 0 ? `${equipmentCount} Listed` : 'Add'}
              actionColor={equipmentCount > 0 ? 'green' : 'amber'}
              onClick={() => openModal('equipment')}
            />
          </Section>

          {/* ── New Member Experience ── */}
          <Section
            title="New Member Experience"
            subtitle="Create a great first 7 days that turn new members into long-term members."
            badge="NEW"
            pct={Math.round(([gym.welcome_message, gym.first_post, gym.first_class].filter(Boolean).length / 3) * 100)}
            defaultOpen={false}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '16px 20px 8px' }}>
              {[
                { icon: MessageSquare, title: 'Welcome Message', desc: 'Send a warm welcome and set expectations for success.', action: 'Add Message', key: gym.welcome_message },
                { icon: PenSquare,     title: 'First Post',      desc: 'Guide new members with a first post in their feed.',   action: 'Create Post', key: gym.first_post },
                { icon: Dumbbell,      title: 'First Class Suggestion', desc: 'Recommend their first class to kickstart their journey.', action: 'Set Up', key: gym.first_class },
              ].map((c, i) => (
                <div key={i} style={{
                  background: T.card2, border: `1px solid ${T.brd}`,
                  borderRadius: 10, padding: '14px 14px 12px', display: 'flex',
                  flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: T.cyanDim, border: `1px solid ${T.cyanBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <c.icon style={{ width: 13, height: 13, color: T.cyan }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{c.title}</div>
                    <div style={{ fontSize: 10, color: T.t3, marginTop: 3, lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                  <ActionBtn label={c.action} color={c.key ? 'green' : 'amber'} onClick={() => openModal('onboarding')} />
                </div>
              ))}
            </div>
          </Section>
        </>
      );
    }

    if (activeTab === 'community') {
      return (
        <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, padding: 40, textAlign: 'center', color: T.t3 }}>
          <Users style={{ width: 32, height: 32, margin: '0 auto 12px', color: T.t3 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: T.t2, marginBottom: 6 }}>Community Settings</div>
          <div style={{ fontSize: 12, color: T.t3 }}>Manage posts, announcements, and community moderation.</div>
        </div>
      );
    }

    if (activeTab === 'onboarding') {
      return (
        <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, padding: 40, textAlign: 'center', color: T.t3 }}>
          <Rocket style={{ width: 32, height: 32, margin: '0 auto 12px', color: T.t3 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: T.t2, marginBottom: 6 }}>Onboarding Flow</div>
          <div style={{ fontSize: 12, color: T.t3 }}>Configure the first-week experience for new members.</div>
        </div>
      );
    }
  };

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1100, margin: '0 auto' }}>

      {/* ══ LEFT / MAIN ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: T.t1, margin: 0, letterSpacing: '-0.03em' }}>{gym.name}</h2>
              <ChevronDown style={{ width: 16, height: 16, color: T.t2, cursor: 'pointer' }} />
            </div>
            <p style={{ fontSize: 12, color: T.t3, margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
              Build a stronger gym experience. A complete profile and an active community lead to higher engagement, longer retention, and a thriving gym culture.
            </p>
          </div>
          <Link to={previewUrl} target="_blank" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
              background: T.card, border: `1px solid ${T.brd}`, color: T.t1,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              <ExternalLink style={{ width: 12, height: 12 }} /> Preview as Member
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 16 }}>

          {/* Community Strength */}
          <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Donut pct={communityStr} color={communityColor} size={64} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: communityColor }}>{communityStr}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.t1 }}>Community Strength</div>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 3, lineHeight: 1.4 }}>
                {communityStr >= 70 ? 'Great progress! Keep going to unlock even higher retention.' : 'Keep improving your profile to grow community strength.'}
              </div>
              {gym.community_change && (
                <div style={{ fontSize: 10, color: T.green, marginTop: 4, fontWeight: 700 }}>↑ {gym.community_change}% vs last month</div>
              )}
            </div>
          </div>

          {/* Active Members */}
          <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Users style={{ width: 10, height: 10 }} /> Active Members This Week
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{activeMembers}</div>
            {gym.members_change && (
              <div style={{ fontSize: 10, color: T.green, marginTop: 6, fontWeight: 700 }}>↑ {gym.members_change}%</div>
            )}
          </div>

          {/* Posts This Week */}
          <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <MessageSquare style={{ width: 10, height: 10 }} /> Posts This Week
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{postsWeek}</div>
            {gym.posts_change && (
              <div style={{ fontSize: 10, color: T.green, marginTop: 6, fontWeight: 700 }}>↑ {gym.posts_change}%</div>
            )}
          </div>

          {/* Engagement Score */}
          <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Zap style={{ width: 10, height: 10 }} /> Engagement Score
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: engColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{engScore}</div>
            <div style={{ fontSize: 10, color: engColor, marginTop: 6, fontWeight: 700 }}>{engLabel}</div>
          </div>

          {/* Retention callout */}
          <div style={{
            background: 'linear-gradient(135deg, #050c1a 0%, #071225 100%)',
            border: `1px solid ${T.cyanBrd}`, borderRadius: 12, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 150,
          }}>
            <TrendingUp style={{ width: 18, height: 18, color: T.cyan, marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.4 }}>Gyms with high community engagement retain</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.cyan, letterSpacing: '-0.03em', marginTop: 4 }}>2.3x more</div>
            <div style={{ fontSize: 10, color: T.t3 }}>members.</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.card, border: `1px solid ${T.brd}`,
          borderRadius: 11, padding: '6px 8px', marginBottom: 16,
        }}>
          {TABS.map(t => (
            <Tab key={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: T.t3, whiteSpace: 'nowrap', paddingRight: 4 }}>
            {actionsLeft} action{actionsLeft !== 1 ? 's' : ''} remaining
          </div>
        </div>

        {/* Section content */}
        {renderContent()}

        {/* Profile Strength Checklist footer */}
        <div style={{
          background: T.card, border: `1px solid ${T.brd}`, borderRadius: 12,
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
          marginTop: 4,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: T.cyanDim, border: `1px solid ${T.cyanBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Rocket style={{ width: 14, height: 14, color: T.cyan }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Profile Strength Checklist</div>
            <div style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>Complete all recommended actions to reach 100% and maximise member retention</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.amber, whiteSpace: 'nowrap' }}>{actionsLeft} action{actionsLeft !== 1 ? 's' : ''} left</span>
          <ChevronRight style={{ width: 14, height: 14, color: T.t3, flexShrink: 0 }} />
        </div>
      </div>

      {/* ══ RIGHT SIDEBAR ════════════════════════════════════════════ */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Member App Preview */}
        <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, padding: '14px 14px 16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Member App Preview</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: T.green }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, display: 'inline-block' }} /> Live
            </span>
          </div>
          <PhoneMockup gym={gym} />
          <Link to={previewUrl} target="_blank" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', marginTop: 12, padding: '8px 0', borderRadius: 9,
              background: T.cyanDim, border: `1px solid ${T.cyanBrd}`,
              color: T.cyan, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <ExternalLink style={{ width: 11, height: 11 }} /> Open Full View
            </button>
          </Link>
        </div>

        {/* Retention Impact */}
        <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Retention Impact</span>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: T.brd2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: T.t3, cursor: 'pointer' }}>i</span>
          </div>
          <p style={{ fontSize: 11, color: T.t3, margin: '0 0 12px', lineHeight: 1.5 }}>
            Completing your profile and staying active with your community can increase retention by
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: T.green, letterSpacing: '-0.04em', lineHeight: 1 }}>+35%</div>
            {/* Mini bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, paddingBottom: 4 }}>
              {[40, 55, 45, 65, 60, 80, 100].map((h, i) => (
                <div key={i} style={{
                  width: 8, height: h * 0.32 + 8, borderRadius: 3,
                  background: i === 6 ? T.green : `rgba(34,197,94,${0.15 + i * 0.08})`,
                  transition: 'height 0.4s',
                }} />
              ))}
            </div>
          </div>
          <button style={{
            width: '100%', marginTop: 14, padding: '9px 0', borderRadius: 9,
            background: T.cyanDim, border: `1px solid ${T.cyanBrd}`,
            color: T.cyan, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            Learn More
          </button>
        </div>

        {/* Profile completeness */}
        <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Profile Completeness</div>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>Complete profiles get more member joins</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.cyan, letterSpacing: '-0.04em' }}>{pct}%</div>
          </div>
          <ProgressBar pct={pct} color={pct >= 80 ? T.green : pct >= 50 ? T.amber : T.cyan} />
          <div style={{ fontSize: 10, color: T.t3, marginTop: 8 }}>{done} of {total} sections complete</div>
        </div>
      </div>
    </div>
  );
}