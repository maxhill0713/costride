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
  BarChart2, Rocket, Home, Calendar, User as UserIcon, Trophy,
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
  const [activeScreen, setActiveScreen] = useState('feed');
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

  // Faithful Home screen — matches actual Home page layout
  const HomeScreen = () => (
    <div style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }}>
      {/* CoStride header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px 4px', position: 'relative' }}>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', position: 'absolute', left: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>12</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 900, background: 'linear-gradient(to right,#3b82f6,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CoStride</span>
        <Users style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)', position: 'absolute', right: 12 }} />
      </div>

      {/* Weekly circles — identical to real app */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '8px 10px 4px', alignItems: 'flex-end' }}>
        {[
          { done: true,  rest: false, today: false },
          { done: true,  rest: false, today: false },
          { done: false, rest: true,  today: false },
          { done: true,  rest: false, today: true  },
          { done: false, rest: false, today: false },
          { done: false, rest: true,  today: false },
          { done: false, rest: false, today: false },
        ].map((d, i) => {
          const size = d.today ? 32 : 26;
          const bg = d.rest
            ? (d.done ? 'linear-gradient(to bottom,#4ade80,#22c55e,#16a34a)' : 'linear-gradient(to bottom,#2d3748,#1a202c)')
            : d.done ? 'linear-gradient(to bottom,#60a5fa,#3b82f6,#1d4ed8)'
            : d.today ? 'linear-gradient(to bottom,#2d3748,#1a202c)'
            : 'linear-gradient(to bottom,#2d3748,#0f172a)';
          const wave = [0, 4, 7, 6, 3, -1, -3];
          return (
            <div key={i} style={{ position: 'relative', marginBottom: wave[i] }}>
              {d.today && <div style={{ position: 'absolute', width: size + 8, height: size + 8, top: -4, left: -4, borderRadius: '50%', border: '2px solid rgba(148,163,184,0.4)', animation: 'todayRingPulse 2s ease-in-out infinite' }} />}
              <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: d.done ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(71,85,105,0.6)', boxShadow: d.done ? '0 3px 0 #1a3fa8' : '0 3px 0 #111827' }}>
                {d.rest ? <span style={{ fontSize: 9 }}>🌿</span>
                  : d.done ? <span style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>✓</span>
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid rgba(100,116,139,0.5)' }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Community card — identical to real app */}
      <div style={{ margin: '6px 8px', borderRadius: 10, overflow: 'hidden', height: 70, position: 'relative', border: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))' }}>
        {gym?.image_url && <img src={gym.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>Your Community</div>
            <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{gymName}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex' }}>
              {['AT','PS'].map((i, idx) => (
                <div key={idx} style={{ width: 14, height: 14, borderRadius: '50%', background: ['#3b82f6','#8b5cf6'][idx], border: '1.5px solid #0d2360', marginLeft: idx > 0 ? -4 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, fontWeight: 800, color: '#fff' }}>{i}</div>
              ))}
            </div>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>›</span>
          </div>
        </div>
      </div>

      {/* Social feed posts */}
      <div style={{ padding: '4px 8px 8px' }}>
        {posts.map((p) => (
          <div key={p.id} style={{ marginBottom: 6, padding: '7px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <div style={{ width: 17, height: 17, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{p.initials}</div>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: '#fff', flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>{p.time}</span>
            </div>
            <p style={{ fontSize: 8, color: 'rgba(226,232,240,0.75)', margin: 0, lineHeight: 1.4 }}>{p.text}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setLiked(l => ({ ...l, [p.id]: !l[p.id] }))}
                style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: liked[p.id] ? '#f472b6' : 'rgba(255,255,255,0.3)', fontSize: 7, padding: 0 }}>
                ♡ {p.likes + (liked[p.id] ? 1 : 0)}
              </button>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>💬 {p.comments}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Faithful Gym Community screen — identical to the real GymCommunity page
  const CommunityScreen = () => {
    const [commTab, setCommTab] = useState('home');

    const TABS = [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'activity', label: 'Activity', icon: '⚡' },
      { id: 'challenges', label: 'Challenges', icon: '🏆' },
      { id: 'classes', label: 'Classes', icon: '🏋️' },
    ];

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(to bottom right,#02040a,#0d2360,#02040a)' }}>

        {/* ── Hero — identical to real page ── */}
        <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, minHeight: 90 }}>
          {/* Background image */}
          {gym?.image_url
            ? <img src={gym.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.55 }} />
            : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} />
          }
          {/* Gradients matching real page exactly */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,4,10,0.3) 0%, rgba(2,4,10,0.0) 40%, rgba(2,4,10,0.75) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(2,4,10,0.5) 0%, transparent 60%)' }} />

          {/* Gym name + city row */}
          <div style={{ position: 'relative', zIndex: 10, padding: '10px 10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{gymName}</span>
                  {gym?.verified && <BadgeCheck style={{ width: 10, height: 10, color: '#60a5fa', flexShrink: 0 }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MapPin style={{ width: 7, height: 7 }} />{gymCity}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '1px 5px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <Users style={{ width: 7, height: 7, color: 'rgba(255,255,255,0.7)' }} />
                    <span style={{ fontSize: 7, fontWeight: 700, color: '#fff' }}>{memberCount} members</span>
                  </div>
                </div>
              </div>
              {/* Logo */}
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0a0f1e', border: `1.5px solid ${T.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: `0 0 8px ${T.cyan}44` }}>
                {gym?.logo_url
                  ? <img src={gym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Dumbbell style={{ width: 11, height: 11, color: T.cyan }} />}
              </div>
            </div>
          </div>

          {/* Tab bar — exact same tabs as real page */}
          <div style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', padding: '4px 6px 0', gap: 4 }}>
            {TABS.map(t => {
              const active = commTab === t.id;
              return (
                <button key={t.id} onClick={() => setCommTab(t.id)} style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
                  padding: '4px 7px', borderRadius: 99, fontSize: 7.5, fontWeight: 700,
                  background: active ? 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)' : 'rgba(15,23,42,0.8)',
                  color: active ? '#fff' : 'rgba(148,163,184,0.7)',
                  border: active ? '1px solid transparent' : '1px solid rgba(100,116,139,0.4)',
                  borderBottom: active ? '2px solid #1a3fa8' : '2px solid rgba(0,0,0,0.5)',
                  boxShadow: active ? '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(37,99,235,0.35)' : '0 2px 0 rgba(0,0,0,0.35)',
                  cursor: 'pointer', marginBottom: 4,
                }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* HOME tab */}
          {commTab === 'home' && (
            <>
              {/* Busy times bar chart mock */}
              <div style={{ padding: '8px 9px', background: 'rgba(255,255,255,0.04)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Gym Traffic · Live
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28 }}>
                  {[20, 35, 50, 75, 90, 100, 85, 60, 45, 30, 20, 15].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: i === 5 ? '#3b82f6' : 'rgba(59,130,246,0.3)', transition: 'height 0.3s' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)' }}>6am</span>
                  <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)' }}>12pm</span>
                  <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)' }}>6pm</span>
                </div>
              </div>

              {/* Member spotlight */}
              <div style={{ padding: '8px 9px', background: 'rgba(251,191,36,0.06)', borderRadius: 9, border: '1px solid rgba(251,191,36,0.2)' }}>
                <div style={{ fontSize: 7.5, fontWeight: 800, color: '#fbbf24', marginBottom: 5 }}>⭐ Member Spotlight</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#fff', border: '2px solid #fbbf24' }}>JR</div>
                  <div>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: '#fff' }}>Jamie R.</div>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)' }}>🔥 30-day streak · Most active this month</div>
                  </div>
                </div>
              </div>

              {/* Community posts */}
              {posts.map(p => (
                <div key={p.id} style={{ padding: '7px 8px', background: 'linear-gradient(135deg, rgba(30,35,60,0.82), rgba(8,10,20,0.96))', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6.5, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{p.initials}</div>
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: '#fff', flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>{p.time}</span>
                  </div>
                  <p style={{ fontSize: 8, color: 'rgba(226,232,240,0.8)', margin: 0, lineHeight: 1.4 }}>{p.text}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                    <button onClick={() => setLiked(l => ({ ...l, [p.id]: !l[p.id] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: liked[p.id] ? '#f472b6' : 'rgba(255,255,255,0.3)', fontSize: 7 }}>
                      {liked[p.id] ? '♥' : '♡'} {p.likes + (liked[p.id] ? 1 : 0)}
                    </button>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>💬 {p.comments}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ACTIVITY tab */}
          {commTab === 'activity' && (
            <>
              {/* Active Now strip */}
              <div style={{ padding: '7px 9px', background: 'linear-gradient(135deg, rgba(30,35,60,0.82), rgba(8,10,20,0.96))', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 5px rgba(34,197,94,0.8)' }} />
                  <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>5 Active Now</span>
                </div>
                <div style={{ display: 'flex' }}>
                  {['AT','PS','JR','MK','SC'].map((ini, i) => (
                    <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: ['#1a2a4a','#2a1a3a','#1a2e20','#2e1a1a','#1a2535'][i], border: '2px solid rgba(6,8,18,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: ['#93c5fd','#c4b5fd','#86efac','#fca5a5','#7dd3fc'][i], marginLeft: i > 0 ? -5 : 0 }}>{ini}</div>
                  ))}
                </div>
              </div>

              {/* Gym Activity Feed */}
              <div style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.82), rgba(8,10,20,0.96))', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '7px 9px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 900, color: '#fff' }}>Gym Activity Feed</span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)' }}>4 activities</span>
                </div>
                {[
                  { ini: 'AT', color: '#1a2a4a', textColor: '#93c5fd', name: 'Alex T.', verb: 'checked in', badge: '📍', badgeColor: '#60a5fa', time: '10m', detail: 'At the gym' },
                  { ini: 'PS', color: '#2a1a3a', textColor: '#c4b5fd', name: 'Priya S.', verb: 'hit a new PR 🔥', badge: '🏆', badgeColor: '#eab308', time: '1h', detail: 'Squat · 100 kg' },
                  { ini: 'JR', color: '#1a2e20', textColor: '#86efac', name: 'Jamie R.', verb: 'joined a challenge 🏆', badge: '🎯', badgeColor: '#f97316', time: '2h', detail: '30-Day Consistency' },
                  { ini: 'MK', color: '#2e1a1a', textColor: '#fca5a5', name: 'Marcus K.', verb: 'logged a workout', badge: '🏋️', badgeColor: '#a78bfa', time: '3h', detail: 'Deadlift · 45 min' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, padding: '7px 9px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.045)' : 'none' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: a.textColor, border: '1.5px solid rgba(255,255,255,0.08)' }}>{a.ini}</div>
                      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6 }}>{a.badge}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 8, color: 'rgba(226,232,240,0.9)', lineHeight: 1.35 }}>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{a.name}</span>{' '}
                        <span style={{ color: 'rgba(226,232,240,0.7)' }}>{a.verb}</span>
                      </div>
                      <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{a.detail}</span>
                    </div>
                    <span style={{ fontSize: 7, color: 'rgba(148,163,184,0.45)', fontWeight: 600, flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>

              {/* Leaderboard teaser */}
              <div style={{ padding: '9px 10px', background: 'linear-gradient(135deg, rgba(30,35,60,0.82), rgba(8,10,20,0.96))', borderRadius: 9, border: '1px solid rgba(255,215,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trophy style={{ width: 12, height: 12, color: '#FFD700' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8.5, fontWeight: 900, color: '#fff' }}>Community Leaderboard</div>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>12 athletes ranked this week</div>
                </div>
                <ChevronRight style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              </div>
            </>
          )}

          {/* CHALLENGES tab */}
          {commTab === 'challenges' && (
            <>
              {[
                { title: '30-Day Consistency', desc: 'Log 30 workouts this month', reward: '£10 gift card 🎁', progress: 18, target: 30, color: '#f59e0b', joined: true },
                { title: 'Squat Challenge', desc: 'Hit 5 squat PRs this month', reward: 'Free protein shake 🥤', progress: 3, target: 5, color: '#8b5cf6', joined: false },
                { title: 'Weekend Warrior', desc: 'Train on 5 weekends', reward: '2× Streak Freezes ❄️', progress: 1, target: 5, color: '#3b82f6', joined: false },
              ].map((c, i) => (
                <div key={i} style={{ padding: '9px 10px', background: 'linear-gradient(135deg, rgba(30,35,60,0.82), rgba(8,10,20,0.96))', borderRadius: 9, border: `1px solid ${c.joined ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', marginBottom: 1 }}>{c.title}</div>
                      <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)' }}>{c.desc}</div>
                    </div>
                    {c.joined
                      ? <span style={{ fontSize: 7, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 99, padding: '2px 6px' }}>✓ Joined</span>
                      : <button style={{ fontSize: 7, fontWeight: 800, color: '#fff', background: 'linear-gradient(to bottom,#3b82f6,#1d4ed8)', border: 'none', borderBottom: '2px solid #1a3fa8', borderRadius: 99, padding: '3px 8px', cursor: 'pointer' }}>Join</button>
                    }
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', marginBottom: 3 }}>
                    <div style={{ height: '100%', borderRadius: 99, background: c.color, width: `${(c.progress / c.target) * 100}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>{c.progress}/{c.target} complete</span>
                    <span style={{ fontSize: 7, color: c.color, fontWeight: 700 }}>{c.reward}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* CLASSES tab */}
          {commTab === 'classes' && (
            <>
              {/* Day selector strip */}
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                  <div key={d} style={{ flexShrink: 0, minWidth: 28, padding: '4px 2px', borderRadius: 8, textAlign: 'center', background: i === 2 ? 'linear-gradient(to bottom,#3b82f6,#1d4ed8)' : 'rgba(20,28,60,0.8)', border: i === 2 ? '1px solid transparent' : '1px solid rgba(255,255,255,0.09)', borderBottom: i === 2 ? '2px solid #1a3fa8' : '2px solid rgba(0,0,0,0.5)' }}>
                    <div style={{ fontSize: 6, fontWeight: 700, color: i === 2 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{d}</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: i === 2 ? '#fff' : 'rgba(255,255,255,0.45)' }}>{15 + i}</div>
                  </div>
                ))}
              </div>

              {/* Class cards — matching PremiumClassCard style */}
              {[
                { name: 'Morning HIIT', instructor: 'Sam T.', time: '06:30', emoji: '⚡', color: '#f87171', bg: 'rgba(239,68,68,0.12)', left: 3, cap: 12, img: 'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=300&q=60' },
                { name: 'Strength & Conditioning', instructor: 'Coach Dan', time: '10:00', emoji: '🏋️', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', left: 8, cap: 8, img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=60' },
                { name: 'Evening CrossFit', instructor: 'Alex R.', time: '18:00', emoji: '⚡', color: '#f87171', bg: 'rgba(239,68,68,0.12)', left: 2, cap: 16, img: 'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=300&q=60' },
              ].map((c, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(30,35,60,0.82), rgba(8,10,20,0.96))', border: '1px solid rgba(255,255,255,0.07)', borderBottom: '2px solid rgba(0,0,0,0.55)' }}>
                  {/* Color accent bar */}
                  <div style={{ height: 2, background: `linear-gradient(90deg,${c.color}cc,${c.color}44)` }} />
                  {/* Image */}
                  <div style={{ position: 'relative', height: 65, overflow: 'hidden' }}>
                    <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(8,10,22,0.97) 100%)' }} />
                    <div style={{ position: 'absolute', top: 5, left: 7, display: 'flex', alignItems: 'center', gap: 3, fontSize: 7, fontWeight: 900, color: c.color, background: 'rgba(0,0,0,0.65)', border: `1px solid ${c.color}55`, borderRadius: 99, padding: '1px 6px' }}>
                      <span style={{ fontSize: 9 }}>{c.emoji}</span> HIIT
                    </div>
                    {c.left <= 3 && <div style={{ position: 'absolute', top: 5, right: 7, fontSize: 7, fontWeight: 900, color: '#fbbf24', background: 'rgba(0,0,0,0.68)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 99, padding: '1px 6px' }}>🔥 {c.left} left</div>}
                    <div style={{ position: 'absolute', bottom: 5, left: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{c.name}</div>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>with {c.instructor}</div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, color: '#60a5fa' }}>{c.time}</span>
                      <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginLeft: 5 }}>{c.left} spots left</span>
                    </div>
                    <button style={{ padding: '4px 10px', borderRadius: 8, background: 'linear-gradient(to bottom,#3b82f6,#1d4ed8)', border: 'none', borderBottom: '2px solid #1a3fa8', color: '#fff', fontSize: 7.5, fontWeight: 900, cursor: 'pointer' }}>
                      Book Spot
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    );
  };

  // Faithful Gyms screen — matches actual Gyms page discover tab
  const GymsScreen = () => (
    <div style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(to bottom right,#02040a,#0d2360,#02040a)', padding: '8px' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>Discover Gyms</div>
      {/* My gym */}
      <div style={{ marginBottom: 8, borderRadius: 10, overflow: 'hidden', height: 60, position: 'relative', border: '1px solid rgba(77,127,255,0.4)' }}>
        {gym?.image_url && <img src={gym.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.9),transparent)' }} />
        <div style={{ position: 'absolute', top: 5, left: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: T.cyan, background: T.cyanDim, border: `1px solid ${T.cyanBrd}`, borderRadius: 99, padding: '1px 5px' }}>YOUR GYM</div>
        </div>
        <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>{gymName}</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <MapPin style={{ width: 6, height: 6 }} />{gymCity}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 7, color: '#f59e0b' }}>★</span>)}
          </div>
        </div>
      </div>
      {/* Nearby gyms */}
      <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nearby</div>
      {[
        { name: 'Iron Forge', city: 'Manchester', type: 'powerlifting', dist: '0.3km', rating: 4.7, members: 189 },
        { name: 'CrossFit Central', city: 'Manchester', type: 'crossfit', dist: '0.8km', rating: 4.9, members: 342 },
        { name: 'Boxing Club MCR', city: 'Manchester', type: 'boxing', dist: '1.2km', rating: 4.6, members: 124 },
      ].map((g, i) => (
        <div key={i} style={{ marginBottom: 6, padding: '7px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: ['#1e3a5f','#2a1a3a','#1a2e1a'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Dumbbell style={{ width: 10, height: 10, color: ['#60a5fa','#a78bfa','#34d399'][i] }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: '#fff' }}>{g.name}</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin style={{ width: 6, height: 6 }} />{g.dist} · {g.members} members
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 7, color: '#f59e0b', fontWeight: 700 }}>★ {g.rating}</div>
            <button style={{ fontSize: 6.5, padding: '2px 6px', borderRadius: 5, background: T.cyanDim, border: `1px solid ${T.cyanBrd}`, color: T.cyan, fontWeight: 700, cursor: 'pointer', marginTop: 2 }}>Join</button>
          </div>
        </div>
      ))}
    </div>
  );

  const SCREENS = { feed: <HomeScreen />, community: <CommunityScreen />, gyms: <GymsScreen /> };

  const NAV = [
    { id: 'feed',      icon: Home,     label: 'Home'      },
    { id: 'gyms',      icon: Dumbbell, label: 'Gyms'      },
    { id: 'community', icon: Users,    label: 'Community' },
    { id: 'progress',  icon: TrendingUp, label: 'Progress'  },
    { id: 'profile',   icon: UserIcon, label: 'Profile'   },
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
        {SCREENS[activeScreen] || SCREENS.feed}
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