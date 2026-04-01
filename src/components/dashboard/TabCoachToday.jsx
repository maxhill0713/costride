import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Activity, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Users, UserCheck, ShieldAlert, TrendingUp, TrendingDown,
  Calendar, Zap, MessageCircle, BarChart3, Bell,
  ChevronRight, ChevronDown, CheckCircle, Eye,
  Flame, Target, Plus, Trophy, Send, Star,
  Phone, Dumbbell, Heart, Minus, User,
  Clock, Sparkles, Info, Lightbulb, X,
  RefreshCw, Mail, MessageSquare, Award,
  UserPlus, Upload, BookOpen, Shield,
} from 'lucide-react';

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('today-css')) {
  const s = document.createElement('style');
  s.id = 'today-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .today { font-family: 'Instrument Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }

    @keyframes todayFadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes todaySlideIn { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:none } }
    @keyframes todayPulse   { 0%,100% { opacity:.6 } 50% { opacity:1 } }
    @keyframes todayGlow    { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0) } 50% { box-shadow: 0 0 0 4px rgba(239,68,68,.08) } }

    .t-fade   { animation: todayFadeUp  .3s  cubic-bezier(.4,0,.2,1) both; }
    .t-slide  { animation: todaySlideIn .25s cubic-bezier(.4,0,.2,1) both; }
    .t-pulse  { animation: todayPulse  2s   ease infinite; }
    .t-glow   { animation: todayGlow   2.5s ease infinite; }

    .t-btn { font-family: 'Instrument Sans', sans-serif; cursor: pointer; outline: none;
             transition: all .15s cubic-bezier(.4,0,.2,1); border: none; }
    .t-btn:active { transform: scale(.97); }

    .t-card {
      background: #0b1121;
      border: 1px solid rgba(255,255,255,.05);
      border-radius: 14px;
      position: relative;
      overflow: hidden;
      transition: border-color .15s;
    }
    .t-card:hover { border-color: rgba(255,255,255,.09); }

    .t-row { transition: all .15s cubic-bezier(.4,0,.2,1); cursor: pointer; }
    .t-row:hover { background: rgba(255,255,255,.018) !important; }

    .t-input { width: 100%; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
               color: #e2e8f0; font-size: 13px; font-family: 'Instrument Sans', sans-serif;
               outline: none; border-radius: 10px; padding: 10px 14px; transition: all .15s; }
    .t-input:focus { border-color: rgba(99,102,241,.4); background: rgba(255,255,255,.04);
                     box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
    .t-input::placeholder { color: rgba(148,163,184,.4); }

    .t-select { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
                color: #e2e8f0; font-size: 12px; font-family: 'Instrument Sans', sans-serif;
                outline: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;
                appearance: none; }

    .t-action-row {
      padding: 12px 14px; border-radius: 10px; border-left: 3px solid;
      background: rgba(255,255,255,.015); transition: background .12s; cursor: pointer; margin-bottom: 4px;
    }
    .t-action-row:hover { background: rgba(255,255,255,.03); }

    .t-bar-col { transition: height .4s cubic-bezier(.4,0,.2,1); }

    .t-scrollbar::-webkit-scrollbar { width: 4px; }
    .t-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .t-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 99px; }

    .t-tooltip { position: relative; }
    .t-tooltip::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px);
      left: 50%; transform: translateX(-50%); background: #1e293b; color: #e2e8f0;
      font-size: 11px; padding: 5px 10px; border-radius: 6px; white-space: nowrap;
      opacity: 0; pointer-events: none; transition: opacity .15s; z-index: 50;
      border: 1px solid rgba(255,255,255,.08); }
    .t-tooltip:hover::after { opacity: 1; }

    @media (max-width: 1024px) {
      .today-main-grid   { grid-template-columns: 1fr !important; }
      .today-sidebar     { display: none !important; }
      .today-stat-grid   { grid-template-columns: repeat(2,1fr) !important; }
    }
    @media (max-width: 640px) {
      .today-stat-grid   { grid-template-columns: 1fr !important; }
      .today-quick-grid  { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── DESIGN TOKENS (identical to Members page) ────────────────────────────────
const T = {
  bg:       '#06090f',
  surface:  '#0b1121',
  surfaceH: '#0e1528',
  card:     '#0d1424',
  border:   'rgba(255,255,255,.05)',
  borderH:  'rgba(255,255,255,.09)',
  borderA:  'rgba(255,255,255,.12)',

  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#1e293b',

  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,.08)',
  emeraldBdr: 'rgba(16,185,129,.18)',

  indigo:    '#6366f1',
  indigoDim: 'rgba(99,102,241,.08)',
  indigoBdr: 'rgba(99,102,241,.18)',

  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,.07)',
  amberBdr: 'rgba(245,158,11,.16)',

  red:      '#ef4444',
  redDim:   'rgba(239,68,68,.07)',
  redBdr:   'rgba(239,68,68,.16)',

  sky:      '#38bdf8',
  skyDim:   'rgba(56,189,248,.07)',
  skyBdr:   'rgba(56,189,248,.16)',

  mono: "'JetBrains Mono', monospace",
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Avatar({ name = '?', size = 36, src = null, status }) {
  const [imgFail, setImgFail] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const statusColors = { active: T.emerald, at_risk: T.red, paused: T.amber };
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 12, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(99,102,241,.04))',
        border: '1px solid rgba(99,102,241,.15)',
        fontSize: size * .32, fontWeight: 700, color: T.indigo, letterSpacing: '-.02em',
      }}>
        {src && !imgFail
          ? <img src={src} alt={name} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgFail(true)} />
          : initials}
      </div>
      {status && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 10, height: 10, borderRadius: '50%',
          background: statusColors[status] || T.t3,
          border: `2px solid ${T.bg}`,
        }} />
      )}
    </div>
  );
}

function Pill({ children, color = T.t3, bg, border, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color,
      background: bg || `${color}0d`,
      border: `1px solid ${border || `${color}22`}`,
      borderRadius: 6, padding: '2px 8px',
      letterSpacing: '.02em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', lineHeight: '16px', ...style,
    }}>{children}</span>
  );
}

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 500, letterSpacing: '-.02em', ...style }}>
      {children}
    </span>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: T.t3,
      textTransform: 'uppercase', letterSpacing: '.07em', ...style,
    }}>{children}</div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function retentionColor(pct) {
  if (pct >= 80) return T.emerald;
  if (pct >= 60) return T.t2;
  if (pct >= 40) return T.amber;
  return T.red;
}

function daysSince(dateStr, nowMs) {
  if (!dateStr) return 999;
  return Math.floor((nowMs - new Date(dateStr).getTime()) / 86400000);
}

function buildLastVisitMap(checkIns) {
  const map = {};
  checkIns.forEach(c => {
    const uid = c.user_id;
    const d   = c.check_in_date;
    if (!uid || !d) return;
    if (!map[uid] || d > map[uid]) map[uid] = d;
  });
  return map;
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function BarChart({ data = [], h = 150, labels = [], todayIdx = -1, showAvgLine = true }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data, 1);
  const avg = data.length > 0 ? data.reduce((s, v) => s + v, 0) / data.length : 0;
  const effectiveTodayIdx = todayIdx >= 0 ? todayIdx : data.length - 1;

  return (
    <div style={{ width: '100%', userSelect: 'none' }}>
      <div style={{ position: 'relative', height: h }}>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${pct * 100}%`,
            borderTop: `1px solid rgba(255,255,255,.04)`,
          }} />
        ))}

        {/* Avg dashed line */}
        {showAvgLine && avg > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${(avg / max) * 100}%`,
            borderTop: `1px dashed ${T.t3}`, opacity: .45, zIndex: 2,
          }} />
        )}

        {/* Bars */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'flex-end', gap: 3,
        }}>
          {data.map((val, i) => {
            const isToday   = i === effectiveTodayIdx;
            const isHovered = hovered === i;
            const pct       = max > 0 ? (val / max) * 100 : 0;
            const barColor  = isToday
              ? T.indigo
              : isHovered
              ? 'rgba(99,102,241,.35)'
              : 'rgba(99,102,241,.18)';

            return (
              <div key={i}
                className="t-bar-col"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'flex-end',
                  height: '100%', position: 'relative', cursor: 'default',
                }}>
                <div style={{
                  width: '100%',
                  height: `${Math.max(pct, val > 0 ? 3 : 1)}%`,
                  background: barColor,
                  borderRadius: '3px 3px 0 0',
                  transition: 'height .35s cubic-bezier(.4,0,.2,1), background .12s',
                }} />
                {isHovered && val > 0 && (
                  <div style={{
                    position: 'absolute', bottom: `${Math.max(pct, 4) + 2}%`,
                    left: '50%', transform: 'translateX(-50%)',
                    background: T.card, border: `1px solid ${T.borderA}`,
                    borderRadius: 6, padding: '3px 8px',
                    fontSize: 11, fontWeight: 700, color: T.t1,
                    fontFamily: T.mono, whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,.4)',
                  }}>{val}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      {labels.length > 0 && (
        <div style={{ display: 'flex', gap: 3, paddingTop: 8 }}>
          {labels.map((lbl, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              fontSize: 9,
              color: i === effectiveTodayIdx ? T.indigo : T.t3,
              fontWeight: i === effectiveTodayIdx ? 700 : 400,
              fontFamily: T.mono,
            }}>{lbl}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({
  label, icon: Icon, value, subValue, valueColor,
  sub, subColor, sub2, sub2Color,
  badge, badgeColor, badgeBg, badgeBdr,
  cta, onCta, ctaColor, extra, delay = 0,
}) {
  return (
    <div className="t-card t-fade" style={{ padding: '18px 20px', animationDelay: `${delay}s` }}>
      {/* Radial glow accent */}
      {valueColor && valueColor !== T.t1 && (
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 120, height: 120,
          background: `radial-gradient(circle at top right, ${valueColor}07, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Label + icon row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && (
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${valueColor || T.t3}10`,
            }}>
              <Icon style={{ width: 11, height: 11, color: valueColor || T.t3 }} />
            </div>
          )}
          <SectionLabel>{label}</SectionLabel>
        </div>
        {badge && (
          <Pill color={badgeColor || T.indigo} bg={badgeBg} border={badgeBdr}>{badge}</Pill>
        )}
      </div>

      {/* Primary number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: T.mono, fontSize: 40, fontWeight: 700,
          color: valueColor || T.t1, lineHeight: 1, letterSpacing: '-.04em',
        }}>{value}</span>
        {subValue && (
          <span style={{ fontFamily: T.mono, fontSize: 18, color: T.t3 }}>{subValue}</span>
        )}
      </div>

      {sub  && <div style={{ fontSize: 12, color: subColor  || T.t3, fontWeight: 500, marginBottom: 3 }}>{sub}</div>}
      {sub2 && <div style={{ fontSize: 11, color: sub2Color || T.t3 }}>{sub2}</div>}
      {extra}

      {cta && (
        <button className="t-btn" onClick={onCta} style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 8,
          background: `${ctaColor || T.indigo}10`,
          border: `1px solid ${ctaColor || T.indigo}25`,
          color: ctaColor || T.indigo,
          fontSize: 11, fontWeight: 700,
        }}>
          {cta} <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  );
}

// ─── CHECK-IN ACTIVITY ────────────────────────────────────────────────────────
function CheckInActivitySection({ data7d, data30d, now }) {
  const [range, setRange] = useState('7D');
  const activeData = range === '7D' ? data7d : data30d;

  const avg = activeData.length > 0
    ? (activeData.reduce((s, v) => s + v, 0) / activeData.length).toFixed(1) : '0.0';

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const labels7d = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return dayNames[d.getDay()];
  });

  const labels30d = Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    if (daysAgo === 29 || daysAgo === 20 || daysAgo === 10 || daysAgo === 0) {
      return daysAgo === 0 ? 'Today' : `${daysAgo}d`;
    }
    return '';
  });

  const labels = range === '7D' ? labels7d : labels30d;

  return (
    <div className="t-card t-fade" style={{ padding: '18px 20px', animationDelay: '.1s' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 18,
      }}>
        <div>
          <SectionLabel style={{ marginBottom: 8 }}>Check-in Activity</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{
              fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.t1,
            }}>{avg}</span>
            <span style={{ fontSize: 12, color: T.t3 }}>daily avg</span>
            <span style={{ fontSize: 11, color: T.t3 }}>·  Peak usually 5–7pm</span>
          </div>
        </div>

        {/* Range toggle */}
        <div style={{
          display: 'flex', gap: 2, padding: '3px',
          background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`, borderRadius: 10,
        }}>
          {['7D', '30D'].map(r => (
            <button key={r} className="t-btn" onClick={() => setRange(r)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 11,
              fontWeight: range === r ? 700 : 500,
              background: range === r ? T.indigoDim : 'transparent',
              border: `1px solid ${range === r ? T.indigoBdr : 'transparent'}`,
              color: range === r ? T.indigo : T.t3,
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 14, fontSize: 10, color: T.t3, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: T.indigo }} />
          Today
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(99,102,241,.18)' }} />
          Past days
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 20, height: 1, borderTop: `1px dashed ${T.t3}`, opacity: .5 }} />
          Daily avg
        </div>
      </div>

      <BarChart data={activeData} h={160} labels={labels} todayIdx={activeData.length - 1} showAvgLine />
    </div>
  );
}

// ─── TODAY'S CHECK-INS LIST ───────────────────────────────────────────────────
function TodayCheckInsList({ checkInsToday = [], avatarMap = {} }) {
  const [open, setOpen] = useState(false);
  if (checkInsToday.length === 0) return null;

  const shown = open ? checkInsToday : checkInsToday.slice(0, 5);

  return (
    <div className="t-card t-fade" style={{ padding: 0, animationDelay: '.2s' }}>
      <button className="t-btn" onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', background: 'none', color: T.t1,
        borderBottom: open ? `1px solid ${T.border}` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCheck style={{ width: 13, height: 13, color: T.emerald }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.01em', color: T.t1 }}>
            Today's Check-ins
          </span>
          <Pill color={T.emerald} bg={T.emeraldDim} border={T.emeraldBdr}>
            {checkInsToday.length}
          </Pill>
        </div>
        <ChevronDown style={{
          width: 13, height: 13, color: T.t3,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
        }} />
      </button>

      {open && (
        <div className="t-slide" style={{ padding: '8px 10px' }}>
          {shown.map((ci, i) => {
            const timeStr = ci.check_in_date
              ? new Date(ci.check_in_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : '—';
            return (
              <div key={i} className="t-row" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px', borderRadius: 8,
              }}>
                <Avatar name={ci.user_name || 'Member'} src={avatarMap?.[ci.user_id] || null}
                  size={30} status="active" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: T.t1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{ci.user_name || 'Member'}</div>
                  {ci.class_name && <div style={{ fontSize: 10, color: T.t3 }}>{ci.class_name}</div>}
                </div>
                <Mono style={{ color: T.t3 }}>{timeStr}</Mono>
              </div>
            );
          })}
          {checkInsToday.length > 5 && (
            <button className="t-btn" onClick={() => setOpen(true)} style={{
              width: '100%', marginTop: 4, padding: '7px', borderRadius: 8,
              fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,.02)',
              border: `1px solid ${T.border}`, color: T.t3,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              All {checkInsToday.length} check-ins
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TODAY'S SESSIONS ─────────────────────────────────────────────────────────
function TodaySessionsSection({ sessions = [], now }) {
  if (sessions.length === 0) return null;

  return (
    <div className="t-card t-fade" style={{ padding: 0, animationDelay: '.24s' }}>
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <Calendar style={{ width: 13, height: 13, color: T.indigo }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1, letterSpacing: '.01em' }}>
          Today's Sessions
        </span>
        <Pill color={T.indigo} bg={T.indigoDim} border={T.indigoBdr}>{sessions.length}</Pill>
      </div>

      <div style={{ padding: '8px 10px' }}>
        {sessions.map((b, i) => {
          const timeStr = b.session_date
            ? new Date(b.session_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            : '—';
          const isPast = new Date(b.session_date) < now;
          return (
            <div key={i} className="t-row" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 10px', borderRadius: 8, opacity: isPast ? .5 : 1,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isPast ? 'rgba(255,255,255,.02)' : T.indigoDim,
                border: `1px solid ${isPast ? T.border : T.indigoBdr}`,
                fontSize: 10, fontWeight: 700, color: isPast ? T.t3 : T.indigo,
                fontFamily: T.mono,
              }}>{timeStr}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: T.t1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{b.session_name || b.class_name || 'Session'}</div>
                <div style={{ fontSize: 10, color: T.t3 }}>
                  {b.client_name || 'Member'}
                  {b.duration_minutes ? ` · ${b.duration_minutes}min` : ''}
                </div>
              </div>
              <Pill
                color={isPast ? T.t3 : T.emerald}
                bg={isPast ? 'transparent' : T.emeraldDim}
                border={isPast ? T.border : T.emeraldBdr}
                style={{ fontSize: 9 }}>
                {isPast ? 'Done' : 'Upcoming'}
              </Pill>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MEMBER GROWTH ────────────────────────────────────────────────────────────
function MemberGrowthSection({ monthlyGrowth = [], retainedPct = 100, totalMembers = 0, now }) {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const last6Labels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return monthNames[d.getMonth()];
  });

  const last6Data = monthlyGrowth.slice(-6);
  const thisMonth = last6Data[last6Data.length - 1] || 0;
  const lastMonth = last6Data[last6Data.length - 2] || 0;
  const delta = thisMonth - lastMonth;

  return (
    <div className="t-card t-fade" style={{ padding: '18px 20px', animationDelay: '.16s' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 18,
      }}>
        <div>
          <SectionLabel style={{ marginBottom: 8 }}>Member Growth</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: T.mono, fontSize: 40, fontWeight: 700,
              color: T.t1, lineHeight: 1, letterSpacing: '-.04em',
            }}>
              {thisMonth >= 0 ? '+' : ''}{thisMonth}
            </span>
            <span style={{ fontSize: 12, color: T.t3 }}>this month</span>
          </div>
          {delta !== 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              {delta > 0
                ? <ArrowUpRight style={{ width: 12, height: 12, color: T.emerald }} />
                : <ArrowDownRight style={{ width: 12, height: 12, color: T.red }} />}
              <span style={{
                fontSize: 11, fontWeight: 700, color: delta > 0 ? T.emerald : T.red,
              }}>
                {delta > 0 ? '+' : ''}{delta} vs last month
              </span>
            </div>
          )}
        </div>
        <Pill
          color={retentionColor(retainedPct)}
          bg={`${retentionColor(retainedPct)}0d`}
          border={`${retentionColor(retainedPct)}22`}>
          {retainedPct}% retained
        </Pill>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total Members',  value: totalMembers, color: T.t1 },
          { label: 'New This Month', value: thisMonth,    color: thisMonth > 0 ? T.emerald : T.t3 },
          { label: 'Retention Rate', value: `${retainedPct}%`, color: retentionColor(retainedPct) },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '10px 12px', borderRadius: 10, textAlign: 'center',
            background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <BarChart data={last6Data} h={120} labels={last6Labels} todayIdx={last6Data.length - 1} showAvgLine={false} />
    </div>
  );
}

// ─── INSIGHTS STRIP ───────────────────────────────────────────────────────────
function InsightsStrip({ insights = [] }) {
  if (insights.length === 0) return null;
  return (
    <div className="t-fade" style={{
      display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', animationDelay: '.06s',
    }}>
      {insights.map((ins, i) => {
        const Ic = ins.icon;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10, flex: '1 1 220px',
            background: `${ins.color}07`, border: `1px solid ${ins.color}18`,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${ins.color}12`,
            }}>
              <Ic style={{ width: 11, height: 11, color: ins.color }} />
            </div>
            <span style={{ fontSize: 12, color: T.t2, lineHeight: 1.45 }}>{ins.text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── ACTION ITEMS PANEL ───────────────────────────────────────────────────────
function ActionItemsPanel({ items = [], onViewAtRisk, challengeActive = false }) {
  const pending = items.filter(item => !item.done).length;

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}`,
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Bell style={{ width: 12, height: 12, color: T.indigo }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: '.02em' }}>
            Action Items
          </span>
        </div>
        {pending > 0 && (
          <Pill color={T.amber} bg={T.amberDim} border={T.amberBdr}>{pending} pending</Pill>
        )}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <SectionLabel style={{ marginBottom: 10, paddingLeft: 2 }}>Sorted by urgency</SectionLabel>

        {items.length === 0 ? (
          <div style={{
            padding: '24px 16px', textAlign: 'center', borderRadius: 10,
            background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
          }}>
            <CheckCircle style={{ width: 18, height: 18, color: T.emerald, margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: T.t2, fontWeight: 600, margin: '0 0 3px' }}>All clear</p>
            <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>No pending actions right now</p>
          </div>
        ) : items.map((item, i) => {
          const typeMap = {
            urgent:  { c: T.red,     dim: T.redDim,     bdr: T.red },
            warn:    { c: T.amber,   dim: T.amberDim,   bdr: T.amber },
            info:    { c: T.indigo,  dim: T.indigoDim,  bdr: T.indigo },
            success: { c: T.emerald, dim: T.emeraldDim, bdr: T.emerald },
          };
          const col = typeMap[item.type] || typeMap.info;
          const Ic = item.icon || AlertTriangle;

          return (
            <div key={i} className="t-action-row" style={{ borderLeftColor: col.bdr }}
              onClick={() => item.type === 'urgent' && onViewAtRisk?.()}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: col.dim, border: `1px solid ${col.bdr}22`, marginTop: 1,
                }}>
                  <Ic style={{ width: 11, height: 11, color: col.c }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 3 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.55, marginBottom: 8 }}>
                    {item.desc}
                  </div>
                  {item.cta && (
                    <button className="t-btn" style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '5px 12px', borderRadius: 7,
                      background: `${col.c}0d`, border: `1px solid ${col.c}22`,
                      color: col.c, fontSize: 11, fontWeight: 700,
                    }}>
                      {item.cta} <ChevronRight style={{ width: 10, height: 10 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Active challenge badge */}
        {challengeActive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 8, marginTop: 6,
            background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
          }}>
            <CheckCircle style={{ width: 12, height: 12, color: T.emerald, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.emerald, fontWeight: 600 }}>
              Active challenge running
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QUICK ACTIONS PANEL ──────────────────────────────────────────────────────
function QuickActionsPanel({ onAction }) {
  const actions = [
    { label: 'New Challenge', icon: Trophy,       color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr },
    { label: 'New Event',     icon: Calendar,     color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr },
    { label: 'Post Update',   icon: MessageSquare,color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr },
    { label: 'New Poll',      icon: BarChart3,    color: T.sky,     dim: T.skyDim,     bdr: T.skyBdr },
  ];

  return (
    <div style={{
      borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <Zap style={{ width: 12, height: 12, color: T.amber }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: '.02em' }}>
          Quick Actions
        </span>
      </div>

      <div className="today-quick-grid" style={{
        padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
      }}>
        {actions.map((a, i) => {
          const Ic = a.icon;
          return (
            <button key={i} className="t-btn" onClick={() => onAction?.(a.label)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              background: a.dim, border: `1px solid ${a.bdr}`, color: a.color,
            }}>
              <Ic style={{ width: 12, height: 12 }} />
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── DROP-OFF RISK PANEL ──────────────────────────────────────────────────────
function DropOffRiskPanel({ riskMembers = [], onViewAll }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? riskMembers : riskMembers.slice(0, 4);

  return (
    <div style={{
      borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <ShieldAlert style={{ width: 12, height: 12, color: T.red }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: '.02em' }}>
            Drop-off Risk
          </span>
          {riskMembers.length > 0 && (
            <Pill color={T.red} bg={T.redDim} border={T.redBdr}>{riskMembers.length}</Pill>
          )}
        </div>
        <button className="t-btn" onClick={onViewAll} style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 10, fontWeight: 700, color: T.t3,
          background: 'none', border: 'none', padding: 0,
        }}>
          View all <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 10, color: T.t3, marginBottom: 8, padding: '0 4px' }}>
          Where members go quiet
        </div>

        {riskMembers.length === 0 ? (
          <div style={{
            padding: '20px 16px', textAlign: 'center', borderRadius: 10,
            background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
          }}>
            <Shield style={{ width: 16, height: 16, color: T.emerald, margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: T.t2, fontWeight: 600, margin: '0 0 3px' }}>
              No members at risk
            </p>
            <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>Everyone's been active recently</p>
          </div>
        ) : (
          <>
            {shown.map((m, i) => {
              const rc = m.daysInactive >= 21 ? T.red : T.amber;
              const rl = m.daysInactive >= 21 ? 'High' : 'Medium';
              return (
                <div key={i} className="t-row" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 8px', borderRadius: 8,
                }}>
                  <Avatar name={m.name} src={m.avatar} size={30} status="at_risk" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: T.t1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: rc, fontWeight: 500 }}>
                      {m.daysInactive >= 999 ? 'Never visited' : `${m.daysInactive}d inactive`}
                    </div>
                  </div>
                  <Pill color={rc} bg={`${rc}0d`} border={`${rc}22`} style={{ fontSize: 9 }}>
                    {rl}
                  </Pill>
                </div>
              );
            })}
            {riskMembers.length > 4 && (
              <button className="t-btn" onClick={() => setExpanded(v => !v)} style={{
                width: '100%', marginTop: 6, padding: '7px', borderRadius: 8,
                fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                color: T.t3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                {expanded ? 'Show less' : `+${riskMembers.length - 4} more members`}
                <ChevronDown style={{
                  width: 12, height: 12,
                  transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
                }} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function TabCoachToday({
  coach               = null,
  members             = [],
  checkIns            = [],
  bookings            = [],
  avatarMap           = {},
  now                 = new Date(),
  onNavigateToClients,
}) {
  const msDay  = 86400000;
  const nowMs  = now.getTime();
  const todayStr = now.toISOString().slice(0, 10);

  // ── Last-visit map ─────────────────────────────────────────────────────────
  const lastVisitMap = useMemo(() => buildLastVisitMap(checkIns), [checkIns]);

  // ── Today's check-ins ──────────────────────────────────────────────────────
  const checkInsToday = useMemo(() =>
    checkIns
      .filter(c => c.check_in_date?.slice(0, 10) === todayStr)
      .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date)),
    [checkIns, todayStr]
  );
  const todayCount = checkInsToday.length;

  // ── Active / at-risk members ───────────────────────────────────────────────
  const totalMembers = members.length;

  const activeMembers = useMemo(() =>
    members.filter(m => {
      const uid = m.id || m.user_id;
      const last = lastVisitMap[uid];
      return last && daysSince(last, nowMs) <= 30;
    }),
    [members, lastVisitMap, nowMs]
  );

  const atRiskMembers = useMemo(() =>
    members
      .filter(m => {
        const uid = m.id || m.user_id;
        const last = lastVisitMap[uid];
        return !last || daysSince(last, nowMs) > 14;
      })
      .map(m => {
        const uid = m.id || m.user_id;
        const last = lastVisitMap[uid];
        return {
          ...m,
          name: m.full_name || m.name || 'Member',
          avatar: avatarMap?.[uid] || null,
          daysInactive: last ? daysSince(last, nowMs) : 999,
        };
      })
      .sort((a, b) => b.daysInactive - a.daysInactive),
    [members, lastVisitMap, nowMs, avatarMap]
  );

  const retainedPct = totalMembers > 0
    ? Math.round(((totalMembers - atRiskMembers.length) / totalMembers) * 100)
    : 100;

  // ── In-gym-now (checked in within last 90 min) ────────────────────────────
  const inGymNow = useMemo(() =>
    checkIns.filter(c =>
      c.check_in_date &&
      (nowMs - new Date(c.check_in_date).getTime()) < 90 * 60 * 1000
    ).length,
    [checkIns, nowMs]
  );

  // ── 7-day chart data ───────────────────────────────────────────────────────
  const data7d = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const day = new Date(nowMs - (6 - i) * msDay).toISOString().slice(0, 10);
      return checkIns.filter(c => c.check_in_date?.slice(0, 10) === day).length;
    }),
    [checkIns, nowMs]
  );

  // ── 30-day chart data ──────────────────────────────────────────────────────
  const data30d = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const day = new Date(nowMs - (29 - i) * msDay).toISOString().slice(0, 10);
      return checkIns.filter(c => c.check_in_date?.slice(0, 10) === day).length;
    }),
    [checkIns, nowMs]
  );

  const avgPerDay = (data7d.reduce((s, v) => s + v, 0) / 7).toFixed(1);

  // ── Monthly growth data ────────────────────────────────────────────────────
  const monthlyGrowth = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1).getTime();
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() - (11 - i) + 1, 1).getTime();
      return members.filter(m => {
        const joined = m.joined_date ? new Date(m.joined_date).getTime() : null;
        return joined && joined >= monthStart && joined < monthEnd;
      }).length;
    }),
    [members, now]
  );

  const thisMonthGrowth = monthlyGrowth[monthlyGrowth.length - 1] || 0;

  // ── Today's sessions ───────────────────────────────────────────────────────
  const todaysSessions = useMemo(() =>
    bookings
      .filter(b =>
        b.session_date?.slice(0, 10) === todayStr &&
        (b.status === 'confirmed' || b.status === 'attended')
      )
      .sort((a, b) => new Date(a.session_date) - new Date(b.session_date)),
    [bookings, todayStr]
  );

  // ── Action items ────────────────────────────────────────────────────────────
  const actionItems = useMemo(() => {
    const items = [];
    if (atRiskMembers.length > 0) {
      items.push({
        type: 'urgent', icon: AlertTriangle,
        title: `${atRiskMembers.length} member${atRiskMembers.length > 1 ? 's' : ''} inactive for 14+ days`,
        desc: `${Math.round((atRiskMembers.length / Math.max(totalMembers, 1)) * 100)}% of your gym. Direct outreach is the most effective re-engagement method.`,
        cta: 'View & message',
      });
    }
    if (todayCount === 0) {
      items.push({
        type: 'info', icon: MessageSquare,
        title: 'No community posts yet',
        desc: 'Regular posts lift engagement scores. Try a motivational post or a poll.',
        cta: 'Post now',
      });
    }
    if (thisMonthGrowth > 0) {
      items.push({
        type: 'success', icon: Sparkles,
        title: `${thisMonthGrowth} new member${thisMonthGrowth > 1 ? 's' : ''} this month`,
        desc: 'Make sure new members feel welcomed — send an intro message.',
        cta: 'Message them',
      });
    }
    return items;
  }, [atRiskMembers.length, todayCount, totalMembers, thisMonthGrowth]);

  // ── Insights strip ─────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list = [];
    const recentlyActive = members.filter(m => {
      const uid = m.id || m.user_id;
      const last = lastVisitMap[uid];
      return last && daysSince(last, nowMs) <= 3;
    }).length;

    if (recentlyActive > 0) list.push({
      icon: Flame, color: T.amber,
      text: `${recentlyActive} member${recentlyActive > 1 ? 's' : ''} active in the last 3 days`,
    });
    if (retainedPct >= 80) list.push({
      icon: TrendingUp, color: T.emerald,
      text: `Strong retention at ${retainedPct}% — top 20% of gyms`,
    });
    if (todayCount > 0) list.push({
      icon: Activity, color: T.indigo,
      text: `${todayCount} check-in${todayCount > 1 ? 's' : ''} so far today`,
    });
    list.push({
      icon: Lightbulb, color: T.sky,
      text: 'Members attending 2×/week retain 3× longer than 1×/week',
    });
    return list.slice(0, 3);
  }, [members, lastVisitMap, nowMs, retainedPct, todayCount]);

  // ── Challenge active (hook into real data when available) ──────────────────
  const challengeActive = false;

  return (
    <div className="today" style={{ background: T.bg, minHeight: '100vh', padding: '24px' }}>

      {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
      <div className="today-stat-grid t-fade" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10, marginBottom: 14,
      }}>
        <StatCard
          label="Today's Check-ins"
          icon={UserCheck}
          value={todayCount}
          valueColor={todayCount > 0 ? T.emerald : T.t1}
          sub={todayCount === 0 ? '— No check-ins yet today' : `${todayCount} checked in so far`}
          subColor={todayCount === 0 ? T.t3 : T.emerald}
          sub2={`Avg ${avgPerDay}/day`}
          sub2Color={T.t3}
          delay={0}
        />
        <StatCard
          label="Active Members"
          icon={Users}
          value={activeMembers.length}
          subValue={`/ ${totalMembers}`}
          valueColor={T.t1}
          sub={`↗ ${retainedPct}% retention`}
          subColor={retentionColor(retainedPct)}
          sub2={retainedPct >= 80 ? 'Top 20% — excellent' : retainedPct >= 60 ? 'On track' : 'Needs attention'}
          sub2Color={retentionColor(retainedPct)}
          delay={0.04}
        />
        <StatCard
          label="In Gym Now"
          icon={Activity}
          value={inGymNow}
          valueColor={inGymNow > 0 ? T.emerald : T.t1}
          sub={inGymNow === 0 ? 'Early — peak at 5–7pm' : `${inGymNow} active in last 90 min`}
          subColor={T.t3}
          delay={0.08}
        />
        <StatCard
          label="At-Risk Members"
          icon={ShieldAlert}
          value={atRiskMembers.length}
          valueColor={atRiskMembers.length > 0 ? T.red : T.t1}
          sub={atRiskMembers.length > 0
            ? `↘ ${Math.round((atRiskMembers.length / Math.max(totalMembers, 1)) * 100)}% of gym inactive`
            : 'No at-risk members'}
          subColor={atRiskMembers.length > 0 ? T.red : T.emerald}
          sub2={atRiskMembers.length > 0 ? '14+ days without a visit' : ''}
          sub2Color={T.t3}
          cta={atRiskMembers.length > 0 ? 'View & message' : undefined}
          ctaColor={T.red}
          onCta={onNavigateToClients}
          delay={0.12}
        />
      </div>

      {/* ── INSIGHTS STRIP ───────────────────────────────────────────────── */}
      <InsightsStrip insights={insights} />

      {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
      <div className="today-main-grid" style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px',
        gap: 16, alignItems: 'start',
      }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CheckInActivitySection data7d={data7d} data30d={data30d} now={now} />
          <TodayCheckInsList checkInsToday={checkInsToday} avatarMap={avatarMap} />
          <TodaySessionsSection sessions={todaysSessions} now={now} />
          <MemberGrowthSection
            monthlyGrowth={monthlyGrowth}
            retainedPct={retainedPct}
            totalMembers={totalMembers}
            now={now}
          />
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="today-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ActionItemsPanel
            items={actionItems}
            onViewAtRisk={onNavigateToClients}
            challengeActive={challengeActive}
          />
          <QuickActionsPanel />
          <DropOffRiskPanel riskMembers={atRiskMembers} onViewAll={onNavigateToClients} />
        </div>
      </div>
    </div>
  );
}
