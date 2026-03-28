import React, { useState, useMemo, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  format, subDays, addDays, startOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  differenceInMinutes, isWithinInterval, parseISO, isValid,
} from 'date-fns';
import {
  QrCode, Dumbbell, Calendar, Bell, Clock, Check, ChevronDown, ChevronUp,
  UserCheck, Users, AlertCircle, CheckCircle, RefreshCw, Pencil, Trash2,
  X, ClipboardList, User, DollarSign, Repeat, MapPin, Filter, ChevronLeft,
  ChevronRight, TrendingUp, Zap, BarChart2, Eye, Ban, AlertTriangle,
  Activity, Flame, ArrowRight, Info, MessageCircle, TrendingDown, UserX,
  ArrowUpRight, ArrowDownRight, Minus, Send, RotateCcw, XCircle, PhoneCall,
  Star, Wifi, WifiOff,
} from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  bgBase:    '#06101c',
  bgSurface: '#0b1524',
  bgCard:    '#0e1d30',
  bgHover:   '#111f35',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.13)',
  divider:   'rgba(255,255,255,0.045)',
  purple:    '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.10)',
  purpleBrd: 'rgba(139,92,246,0.25)',
  green:     '#10b981',
  greenDim:  'rgba(16,185,129,0.09)',
  greenBrd:  'rgba(16,185,129,0.22)',
  red:       '#ef4444',
  redDim:    'rgba(239,68,68,0.08)',
  redBrd:    'rgba(239,68,68,0.22)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245,158,11,0.09)',
  amberBrd:  'rgba(245,158,11,0.22)',
  blue:      '#38bdf8',
  blueDim:   'rgba(56,189,248,0.09)',
  blueBrd:   'rgba(56,189,248,0.22)',
  cyan:      '#06b6d4',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#2d3f55',
};

// ─── Class type config ────────────────────────────────────────────────────────
const CLASS_TYPE_CFG = {
  hiit:             { color: '#f87171', label: 'HIIT',       emoji: '🔥' },
  yoga:             { color: '#34d399', label: 'Yoga',       emoji: '🧘' },
  spin:             { color: '#38bdf8', label: 'Spin',       emoji: '🚴' },
  strength:         { color: '#fb923c', label: 'Strength',   emoji: '💪' },
  pilates:          { color: '#e879f9', label: 'Pilates',    emoji: '🌸' },
  boxing:           { color: '#fbbf24', label: 'Boxing',     emoji: '🥊' },
  crossfit:         { color: '#f97316', label: 'CrossFit',   emoji: '⚡' },
  cardio:           { color: '#f472b6', label: 'Cardio',     emoji: '❤️' },
  functional:       { color: '#a78bfa', label: 'Functional', emoji: '🎯' },
  personal_training:{ color: '#38bdf8', label: 'PT',         emoji: '👤' },
  default:          { color: '#a78bfa', label: 'Class',      emoji: '🏋️' },
};

function getClassTypeCfg(cls) {
  const name = (cls.name || cls.class_type || cls.type || '').toLowerCase();
  for (const [key, cfg] of Object.entries(CLASS_TYPE_CFG)) {
    if (name.includes(key)) return cfg;
  }
  return CLASS_TYPE_CFG.default;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LATE_CANCEL_WINDOW_HRS = 24;

function getLateCancel(cls, now) {
  if (!cls.late_cancels || !Array.isArray(cls.late_cancels)) return [];
  return cls.late_cancels.filter(lc => {
    const cancelledAt = lc.cancelled_at ? new Date(lc.cancelled_at) : null;
    const classTime   = cls.start_time  ? new Date(cls.start_time)  : null;
    if (!cancelledAt || !classTime) return false;
    return differenceInMinutes(classTime, cancelledAt) < LATE_CANCEL_WINDOW_HRS * 60;
  });
}

function calcRevenue(cls, allMemberships) {
  const booked = cls.bookings?.length || cls.attended?.length || 0;
  if (booked === 0) return 0;
  const prices = allMemberships.map(m => m.membership_price || m.price || 0).filter(p => p > 0);
  const avg    = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
  if (cls.drop_in_price) return Math.round(booked * cls.drop_in_price);
  if (avg > 0) return Math.round((avg / 4.3) * booked);
  return null;
}

function calcRS(userId, checkIns, now) {
  const uci    = checkIns.filter(c => c.user_id === userId);
  const ms     = d => now - new Date(d.check_in_date);
  const r30    = uci.filter(c => ms(c) < 30 * 864e5).length;
  const p30    = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const sorted = [...uci].sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const daysAgo= sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;
  let score = 100;
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  if      (r30 === 0)      score -= 25;
  else if (r30 <= 2)       score -= 15;
  score = Math.max(0, Math.min(100, score));
  const trend  = p30 > 0 ? (r30 > p30*1.1 ? 'improving' : r30 < p30*0.7 ? 'declining' : 'stable') : (r30 >= 2 ? 'improving' : 'stable');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color  = status === 'safe' ? D.green : status === 'at_risk' ? D.amber : D.red;
  const emoji  = status === 'safe' ? '🟢' : status === 'at_risk' ? '🟡' : '🔴';
  return { score, status, trend, color, emoji, daysAgo, recent30: r30, prev30: p30 };
}

// ─── Micro components ─────────────────────────────────────────────────────────
function Pill({ label, color, size = 'sm' }) {
  const fs = size === 'xs' ? 8 : 9;
  const px = size === 'xs' ? 5 : 7;
  const py = size === 'xs' ? 1 : 2;
  return (
    <span style={{ fontSize: fs, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 6, padding: `${py}px ${px}px`, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
      {label}
    </span>
  );
}

function TrendBadge({ trend }) {
  if (trend === 'improving')  return <span style={{ fontSize: 9, color: D.green, display:'flex', alignItems:'center', gap:2, fontWeight:700 }}><ArrowUpRight style={{ width:9, height:9 }}/> Improving</span>;
  if (trend === 'declining')  return <span style={{ fontSize: 9, color: D.red,   display:'flex', alignItems:'center', gap:2, fontWeight:700 }}><ArrowDownRight style={{ width:9, height:9 }}/> Declining</span>;
  return <span style={{ fontSize: 9, color: D.t3, display:'flex', alignItems:'center', gap:2, fontWeight:600 }}><Minus style={{ width:9, height:9 }}/> Stable</span>;
}

function ActionBtn({ icon: Ic, label, color, onClick, size = 'sm' }) {
  const [hov, setHov] = useState(false);
  const pad = size === 'xs' ? '3px 7px' : '5px 10px';
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:4, padding:pad, borderRadius:7, background: hov ? `${color}1e` : `${color}0e`, border:`1px solid ${color}${hov?'40':'22'}`, color, fontSize: size === 'xs' ? 9 : 10, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'all 0.12s' }}>
      {Ic && <Ic style={{ width: size === 'xs' ? 9 : 10, height: size === 'xs' ? 9 : 10 }}/>}
      {label}
    </button>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Cancel Class', confirmColor = '#f87171' }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#0d1526', border:`1px solid ${confirmColor}40`, borderRadius:18, padding:'28px', maxWidth:340, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:`${confirmColor}12`, border:`1px solid ${confirmColor}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <AlertCircle style={{ width:20, height:20, color:confirmColor }}/>
        </div>
        <p style={{ fontSize:13, fontWeight:700, color:'#f0f4f8', textAlign:'center', margin:'0 0 20px', lineHeight:1.6 }}>{message}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Go Back</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'10px', borderRadius:10, background:`${confirmColor}18`, border:`1px solid ${confirmColor}40`, color:confirmColor, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Daily Summary Bar ────────────────────────────────────────────────────────
function DailySummaryBar({ totalSessions, totalExpected, noShows, fillRate, totalRevenue, lateCancels, isToday, dateLabel }) {
  const items = [
    { label: 'Sessions', value: totalSessions, color: D.purple,    icon: Dumbbell  },
    { label: 'Expected', value: totalExpected,  color: D.blue,      icon: Users     },
    { label: 'No-Shows', value: noShows,        color: noShows > 0 ? D.red : D.t3,  icon: UserX    },
    { label: 'Fill Rate', value: `${fillRate}%`, color: fillRate >= 70 ? D.green : fillRate >= 40 ? D.amber : D.red, icon: Activity },
    { label: 'Late Cancels', value: lateCancels, color: lateCancels > 0 ? D.amber : D.t3, icon: Ban },
    ...(totalRevenue > 0 ? [{ label: 'Est. Revenue', value: `£${totalRevenue}`, color: D.green, icon: DollarSign }] : []),
  ];

  return (
    <div style={{ borderRadius:14, background:`linear-gradient(135deg, #0e1d30 0%, #0b1928 100%)`, border:`1px solid ${D.border}`, padding:'0', overflow:'hidden', marginBottom:16 }}>
      {/* Header strip */}
      <div style={{ padding:'10px 18px', borderBottom:`1px solid ${D.divider}`, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background: isToday ? D.green : D.t4, boxShadow: isToday ? `0 0 8px ${D.green}` : 'none' }}/>
        <span style={{ fontSize:11, fontWeight:800, color: isToday ? D.t1 : D.t2, letterSpacing:'-0.01em' }}>
          {isToday ? 'Today' : dateLabel} — Daily Overview
        </span>
      </div>
      {/* Metrics row */}
      <div style={{ display:'flex', overflow:'hidden' }}>
        {items.map((item, i) => (
          <div key={i} style={{ flex:1, padding:'14px 16px', borderRight: i < items.length - 1 ? `1px solid ${D.divider}` : 'none', minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
              <item.icon style={{ width:11, height:11, color:item.color, flexShrink:0 }}/>
              <span style={{ fontSize:9, fontWeight:700, color:D.t4, textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:item.color, letterSpacing:'-0.04em', lineHeight:1 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Session Detail Side Panel ────────────────────────────────────────────────
function SessionDetailPanel({ cls, allMemberships, checkIns, avatarMap, attendance, onToggleAttendance, onMarkAllPresent, onClearAttendance, onSaveNote, onSaveAnnounce, notes, classAnnounce, selDateStr, now, openModal, onClose, onCancelClass, onReinstateClass }) {
  const [tab, setTab] = useState('attendees');
  const { typeCfg } = cls;
  const c = typeCfg.color;
  const key = `${cls.id}-${selDateStr}`;
  const manualIds  = attendance[key] || [];
  const checkedIds = cls.attended.map(ci => ci.user_id);
  const totalPresent = [...new Set([...manualIds, ...checkedIds])].length;
  const [rosterSearch, setRosterSearch] = useState('');

  const filteredRoster = allMemberships.filter(m =>
    !rosterSearch || (m.user_name || '').toLowerCase().includes(rosterSearch.toLowerCase())
  );

  const tabs = [
    { id: 'attendees', label: `Attendees (${cls.booked.length || cls.attended.length})` },
    { id: 'attendance', label: `Check-in (${totalPresent})` },
    { id: 'waitlist',  label: `Waitlist (${cls.waitlist.length})` },
    { id: 'notes',     label: 'Notes' },
  ];

  // No-shows = booked but not checked in
  const noShowList = cls.booked.filter(b => !checkedIds.includes(b.user_id) && !manualIds.includes(b.user_id));

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:400, zIndex:9000, background:'#070f1e', borderLeft:`1px solid ${c}30`, display:'flex', flexDirection:'column', boxShadow:'-24px 0 80px rgba(0,0,0,0.5)' }}>
      {/* Panel header */}
      <div style={{ padding:'18px 20px', borderBottom:`1px solid ${c}20`, background:`linear-gradient(135deg, ${c}08 0%, transparent 100%)`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`${c}18`, border:`1px solid ${c}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              {typeCfg.emoji}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:900, color:D.t1, letterSpacing:'-0.02em' }}>{cls.name}</div>
              <div style={{ fontSize:10, color:D.t3, marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
                {cls.scheduleStr && <span style={{ color:c, fontWeight:700 }}>🕐 {cls.scheduleStr}</span>}
                {cls.duration_minutes && <span>{cls.duration_minutes}min</span>}
                {cls.room && <span><MapPin style={{ width:8, height:8 }}/> {cls.room}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${D.border}`, color:D.t3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X style={{ width:13, height:13 }}/>
          </button>
        </div>

        {/* Capacity bar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ flex:1, height:6, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${cls.fill}%`, background:`linear-gradient(90deg,${c},${c}80)`, borderRadius:99, transition:'width 0.6s ease' }}/>
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:c, flexShrink:0 }}>
            {cls.booked.length > 0 ? cls.booked.length : cls.attended.length}/{cls.capacity} · {cls.fill}%
          </span>
        </div>

        {/* Stat pills */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <Pill label={`✓ ${totalPresent} present`} color={D.green}/>
          {noShowList.length > 0 && <Pill label={`✗ ${noShowList.length} no-show`} color={D.red}/>}
          {cls.waitlist.length > 0 && <Pill label={`⏳ ${cls.waitlist.length} waitlist`} color={D.amber}/>}
          {cls.lateCancels.length > 0 && <Pill label={`⚠ ${cls.lateCancels.length} late cancel`} color={D.amber}/>}
          {cls.isCancelled && <Pill label="CANCELLED" color={D.red}/>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${D.divider}`, flexShrink:0, overflowX:'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:'10px 6px', background:'none', border:'none', borderBottom: tab === t.id ? `2px solid ${c}` : '2px solid transparent', color: tab === t.id ? c : D.t3, fontSize:9, fontWeight: tab === t.id ? 800 : 600, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.12s', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>

        {/* ── ATTENDEES ── */}
        {tab === 'attendees' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {/* No-shows warning */}
            {noShowList.length > 0 && (
              <div style={{ padding:'10px 12px', borderRadius:10, background:D.redDim, border:`1px solid ${D.redBrd}`, marginBottom:4 }}>
                <div style={{ fontSize:10, fontWeight:800, color:D.red, marginBottom:6 }}>⚠ {noShowList.length} No-Show{noShowList.length !== 1 ? 's' : ''}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {noShowList.map((m, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={22} color={D.red}/>
                      <span style={{ fontSize:11, color:D.t1, fontWeight:600, flex:1 }}>{m.user_name}</span>
                      <ActionBtn icon={MessageCircle} label="Message" color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} size="xs"/>
                      <ActionBtn icon={Calendar} label="Rebook" color={D.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs"/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full attendee list */}
            {(cls.booked.length > 0 ? cls.booked : cls.regulars).map((m, j) => {
              const isCheckedIn = checkedIds.includes(m.user_id) || manualIds.includes(m.user_id);
              const isCancelled = (cls.late_cancels || []).some(lc => lc.user_id === m.user_id);
              const rs = calcRS(m.user_id, checkIns, now);
              const lastCi = [...checkIns].filter(c => c.user_id === m.user_id).sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
              const daysAgo = lastCi ? Math.floor((now - new Date(lastCi.check_in_date)) / 864e5) : null;

              const status = isCheckedIn ? 'confirmed' : isCancelled ? 'cancelled' : 'booked';
              const sCfg = {
                confirmed: { label: '✓ In', color: D.green },
                cancelled: { label: '✗ Cancelled', color: D.red },
                booked:    { label: 'Booked', color: D.purple },
              }[status];

              return (
                <div key={m.user_id || j} style={{ padding:'11px 13px', borderRadius:12, background: isCheckedIn ? 'rgba(16,185,129,0.05)' : isCancelled ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.025)', border:`1px solid ${isCheckedIn ? 'rgba(16,185,129,0.18)' : isCancelled ? 'rgba(239,68,68,0.15)' : D.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={32} color={sCfg.color}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:D.t1 }}>{m.user_name || 'Member'}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                        {daysAgo !== null && (
                          <span style={{ fontSize:9, color:daysAgo > 14 ? D.red : daysAgo > 7 ? D.amber : D.t3 }}>
                            Last visit: {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                          </span>
                        )}
                        <TrendBadge trend={rs.trend}/>
                      </div>
                    </div>
                    <Pill label={sCfg.label} color={sCfg.color} size="xs"/>
                  </div>
                  {/* Quick actions row */}
                  <div style={{ display:'flex', gap:5, marginTop:8 }}>
                    <ActionBtn icon={MessageCircle} label="Message" color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} size="xs"/>
                    {!isCheckedIn && !isCancelled && (
                      <ActionBtn icon={Check} label="Check In" color={D.green} onClick={() => {}} size="xs"/>
                    )}
                    {status !== 'confirmed' && (
                      <ActionBtn icon={Calendar} label="Rebook" color={D.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs"/>
                    )}
                  </div>
                </div>
              );
            })}

            {cls.booked.length === 0 && cls.regulars.length === 0 && (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <Users style={{ width:20, height:20, color:D.t4, margin:'0 auto 8px' }}/>
                <p style={{ fontSize:11, color:D.t3, margin:0 }}>No bookings yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── CHECK-IN ── */}
        {tab === 'attendance' && (
          <div>
            <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
              <input value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} placeholder="Search…"
                style={{ flex:1, padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${D.border}`, color:D.t1, fontSize:10, outline:'none', fontFamily:'inherit', minWidth:100 }}/>
              <ActionBtn icon={CheckCircle} label="All Present" color={D.green} onClick={() => onMarkAllPresent(key)} size="xs"/>
              <ActionBtn icon={X} label="Clear" color={D.red} onClick={() => onClearAttendance(key)} size="xs"/>
            </div>
            <div style={{ borderRadius:10, border:`1px solid ${D.border}`, overflow:'hidden' }}>
              {filteredRoster.map((m, mi) => {
                const isManual = manualIds.includes(m.user_id);
                const isQR     = checkedIds.includes(m.user_id);
                const present  = isManual || isQR;
                return (
                  <div key={m.user_id || mi}
                    onClick={() => !isQR && onToggleAttendance(key, m.user_id)}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderBottom: mi < filteredRoster.length - 1 ? `1px solid ${D.divider}` : 'none', cursor: isQR ? 'default' : 'pointer', background: present ? 'rgba(16,185,129,0.04)' : 'transparent', transition:'background 0.1s' }}>
                    <div style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${present ? D.green : 'rgba(255,255,255,0.15)'}`, background: present ? D.green : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.1s' }}>
                      {present && <Check style={{ width:9, height:9, color:'#fff' }}/>}
                    </div>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={26} color={present ? D.green : D.t4}/>
                    <span style={{ flex:1, fontSize:11, fontWeight:600, color: present ? '#d4fae8' : D.t2 }}>{m.user_name || 'Member'}</span>
                    {isQR      && <Pill label="QR ✓" color={D.green} size="xs"/>}
                    {isManual && !isQR && <Pill label="Manual" color={D.purple} size="xs"/>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color:D.t3 }}>{totalPresent} present · {Math.max(0, filteredRoster.length - totalPresent)} absent</span>
              <div style={{ flex:1, height:3, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${filteredRoster.length > 0 ? (totalPresent/filteredRoster.length)*100 : 0}%`, background:`linear-gradient(90deg,${D.green},#10b981)`, borderRadius:99 }}/>
              </div>
            </div>
          </div>
        )}

        {/* ── WAITLIST ── */}
        {tab === 'waitlist' && (
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {cls.waitlist.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <CheckCircle style={{ width:20, height:20, color:D.green, margin:'0 auto 8px' }}/>
                <p style={{ fontSize:11, color:D.green, fontWeight:700, margin:0 }}>No one on the waitlist</p>
              </div>
            ) : cls.waitlist.map((w, j) => (
              <div key={w.user_id || j} style={{ padding:'10px 12px', borderRadius:11, background:'rgba(248,113,113,0.05)', border:'1px solid rgba(248,113,113,0.15)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(248,113,113,0.15)', border:'1px solid rgba(248,113,113,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#f87171', flexShrink:0 }}>{j+1}</div>
                  <MiniAvatar name={w.user_name} src={avatarMap[w.user_id]} size={28} color="#f87171"/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:D.t1 }}>{w.user_name || 'Member'}</div>
                    {w.wait_since && <div style={{ fontSize:9, color:D.t3 }}>Since {format(new Date(w.wait_since), 'MMM d, h:mm a')}</div>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <ActionBtn icon={ArrowUpRight} label="Promote" color={D.green} onClick={() => openModal('promoteWaitlist', w)} size="xs"/>
                  <ActionBtn icon={Bell} label="Notify" color={D.blue} onClick={() => openModal('post', { memberId: w.user_id })} size="xs"/>
                </div>
              </div>
            ))}
            <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(255,255,255,0.02)', border:`1px solid ${D.border}`, fontSize:10, color:D.t3, textAlign:'center' }}>
              {cls.capacity - (cls.booked.length || cls.attended.length) <= 0 ? '🔴 Class full' : `🟢 ${cls.capacity - (cls.booked.length || cls.attended.length)} spots open`}
            </div>
          </div>
        )}

        {/* ── NOTES ── */}
        {tab === 'notes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:D.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                📢 Class Announcement {classAnnounce[key] && <span style={{ color:D.green }}>✓ saved</span>}
              </div>
              <textarea value={classAnnounce[key] || ''} onChange={e => onSaveAnnounce(key, e.target.value)}
                placeholder="Message visible to members before this class…"
                style={{ width:'100%', minHeight:70, padding:'9px 11px', borderRadius:9, background:'rgba(255,255,255,0.03)', border:`1px solid ${D.border}`, color:D.t2, fontSize:11, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = `${c}40`}
                onBlur={e  => e.target.style.borderColor = D.border}
              />
              <button onClick={() => openModal('post', { classId: cls.id, announcement: classAnnounce[key] })}
                style={{ marginTop:7, display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:9, background:`${c}0f`, border:`1px solid ${c}25`, color:c, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                <Send style={{ width:10, height:10 }}/> Push to members
              </button>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:D.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                <ClipboardList style={{ width:9, height:9 }}/> Coach Notes (Private) {notes[key] && <span style={{ color:D.green }}>✓ saved</span>}
              </div>
              <textarea value={notes[key] || ''} onChange={e => onSaveNote(key, e.target.value)}
                placeholder="Cues, modifications, what worked, improvements…"
                style={{ width:'100%', minHeight:70, padding:'9px 11px', borderRadius:9, background:'rgba(255,255,255,0.03)', border:`1px solid ${D.border}`, color:D.t2, fontSize:11, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = `${c}40`}
                onBlur={e  => e.target.style.borderColor = D.border}
              />
            </div>
          </div>
        )}
      </div>

      {/* Panel footer actions */}
      <div style={{ padding:'12px 16px', borderTop:`1px solid ${c}18`, background:`${c}03`, display:'flex', gap:7, flexWrap:'wrap', flexShrink:0 }}>
        <ActionBtn icon={QrCode}    label="Scan QR"     color={D.green}  onClick={() => openModal('qrScanner', cls)}/>
        <ActionBtn icon={Bell}      label="Remind All"  color={D.blue}   onClick={() => openModal('post', { classId: cls.id })}/>
        <ActionBtn icon={Pencil}    label="Edit"        color={c}        onClick={() => openModal('editClass', cls)}/>
        {cls.isCancelled
          ? <ActionBtn icon={RefreshCw} label="Reinstate" color={D.green} onClick={() => { onReinstateClass(cls); onClose(); }}/>
          : <ActionBtn icon={XCircle}   label="Cancel"    color={D.red}   onClick={() => openModal('confirmCancel', cls)}/>
        }
      </div>
    </div>
  );
}

// ─── Enhanced Session Block ───────────────────────────────────────────────────
function SessionBlock({ cls, checkIns, allMemberships, avatarMap, selDateStr, onOpen, isSelected, now }) {
  const [hov, setHov] = useState(false);
  const { typeCfg } = cls;
  const c = typeCfg.color;
  const key = `${cls.id}-${selDateStr}`;

  const checkedIds  = cls.attended.map(ci => ci.user_id);
  const manualIds   = [];
  const totalPresent = checkedIds.length;
  const booked      = cls.booked.length || cls.attended.length;
  const noShows     = Math.max(0, cls.booked.length - totalPresent);
  const spotsLeft   = cls.capacity - booked;
  const isNearFull  = cls.fill >= 80 && !cls.isCancelled;
  const isUnderbook = cls.fill < 40 && !cls.isCancelled;
  const isFull      = spotsLeft <= 0 && !cls.isCancelled;

  const fillColor = isFull ? D.red : isNearFull ? D.amber : isUnderbook ? D.blue : D.green;

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:12, background: isSelected ? `${c}0a` : hov ? D.bgHover : D.bgSurface,
        border:`1px solid ${isSelected ? c : hov ? D.borderHi : D.border}`,
        overflow:'hidden', transition:'all 0.15s', cursor:'pointer',
        boxShadow: isSelected ? `0 0 0 1px ${c}20, 0 4px 20px ${c}10` : hov ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
        opacity: cls.isCancelled ? 0.6 : 1,
      }}>
      {/* Color accent bar */}
      <div style={{ height:3, background: cls.isCancelled ? 'linear-gradient(90deg,#ef4444,#f87171)' : `linear-gradient(90deg,${c},${c}55)` }}/>

      <div style={{ padding:'13px 15px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:11 }}>
          {/* Emoji icon */}
          <div style={{ width:40, height:40, borderRadius:11, background:`${c}16`, border:`1px solid ${c}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
            {typeCfg.emoji}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            {/* Name + badges */}
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:5 }}>
              <span style={{ fontSize:14, fontWeight:900, color: cls.isCancelled ? D.t4 : D.t1, letterSpacing:'-0.01em' }}>{cls.name}</span>
              <Pill label={typeCfg.label} color={c} size="xs"/>
              {cls.isCancelled && <Pill label="CANCELLED" color={D.red} size="xs"/>}
              {isNearFull && !cls.isCancelled && <Pill label="Almost Full" color={D.amber} size="xs"/>}
              {isFull    && !cls.isCancelled && <Pill label="Full" color={D.red} size="xs"/>}
              {isUnderbook && <Pill label="Underbooked" color={D.blue} size="xs"/>}
            </div>

            {/* Meta */}
            <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
              {cls.scheduleStr && (
                <span style={{ fontSize:10, fontWeight:800, color:c, background:`${c}10`, border:`1px solid ${c}22`, borderRadius:6, padding:'2px 8px' }}>
                  🕐 {cls.scheduleStr}
                </span>
              )}
              {cls.duration_minutes && <span style={{ fontSize:10, color:D.t3 }}>{cls.duration_minutes}min</span>}
              {cls.room && <span style={{ fontSize:10, color:D.t3, display:'flex', alignItems:'center', gap:3 }}><MapPin style={{ width:8, height:8 }}/>{cls.room}</span>}
            </div>

            {/* Attendance row: core at-a-glance info */}
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              {/* Capacity */}
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:`1px solid ${D.border}` }}>
                <Users style={{ width:9, height:9, color:fillColor }}/>
                <span style={{ fontSize:10, fontWeight:800, color:fillColor }}>{booked}</span>
                <span style={{ fontSize:10, color:D.t4 }}>/ {cls.capacity}</span>
              </div>
              {/* Confirmed */}
              {totalPresent > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:7, background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)' }}>
                  <Check style={{ width:9, height:9, color:D.green }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:D.green }}>{totalPresent} in</span>
                </div>
              )}
              {/* No-shows */}
              {noShows > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:7, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)' }}>
                  <UserX style={{ width:9, height:9, color:D.red }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:D.red }}>{noShows} no-show</span>
                </div>
              )}
              {/* Waitlist */}
              {cls.waitlist.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:7, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)' }}>
                  <Clock style={{ width:9, height:9, color:D.amber }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:D.amber }}>{cls.waitlist.length} wait</span>
                </div>
              )}
              {/* Late cancels */}
              {cls.lateCancels.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:7, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)' }}>
                  <AlertTriangle style={{ width:9, height:9, color:D.amber }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:D.amber }}>{cls.lateCancels.length} late cancel</span>
                </div>
              )}
              {/* Revenue */}
              {cls.revenue > 0 && (
                <span style={{ fontSize:10, fontWeight:800, color:D.green, background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)', borderRadius:7, padding:'3px 8px' }}>
                  £{cls.revenue}
                </span>
              )}
            </div>

            {/* Fill bar */}
            {!cls.isCancelled && (
              <div style={{ height:4, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${cls.fill}%`, background:`linear-gradient(90deg,${fillColor},${fillColor}88)`, borderRadius:99, transition:'width 0.6s' }}/>
              </div>
            )}
          </div>

          {/* Right side: open indicator + hover actions */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              {(hov || isSelected) && (
                <button onClick={e => { e.stopPropagation(); onOpen(); }}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:9, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', color:D.green, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                  <QrCode style={{ width:10, height:10 }}/> Check-In
                </button>
              )}
              <div style={{ width:28, height:28, borderRadius:8, background: isSelected ? `${c}16` : 'rgba(255,255,255,0.04)', border:`1px solid ${isSelected ? `${c}35` : D.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ArrowRight style={{ width:12, height:12, color: isSelected ? c : D.t3 }}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Attention Panel ──────────────────────────────────────────────────────────
function AttentionPanel({ allMemberships, checkIns, myClasses, now, openModal }) {
  const [section, setSection] = useState('issues');

  const noShows = useMemo(() => {
    return myClasses.flatMap(cls => {
      const booked   = cls.bookings || [];
      const attended = checkIns.filter(c => isSameDay(new Date(c.check_in_date), now));
      return booked
        .filter(b => !attended.some(a => a.user_id === b.user_id))
        .map(b => ({ ...b, className: cls.name, type: 'no_show' }));
    }).slice(0, 8);
  }, [myClasses, checkIns, now]);

  const lateCancels = useMemo(() => {
    return myClasses.flatMap(cls =>
      (cls.late_cancels || [])
        .filter(lc => { const d = lc.cancelled_at ? new Date(lc.cancelled_at) : null; return d && isSameDay(d, now); })
        .map(lc => ({ ...lc, className: cls.name, type: 'late_cancel' }))
    ).slice(0, 6);
  }, [myClasses, now]);

  const notScheduled = useMemo(() => {
    const bookedThisWeek = new Set(myClasses.flatMap(cls => (cls.bookings || []).map(b => b.user_id)));
    return allMemberships.filter(m => {
      if (bookedThisWeek.has(m.user_id)) return false;
      const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
      return r30 >= 2;
    }).slice(0, 6);
  }, [allMemberships, myClasses, checkIns, now]);

  const brokenConsistency = useMemo(() => {
    return allMemberships.map(m => {
      const rs = calcRS(m.user_id, checkIns, now);
      if (rs.status === 'safe') return null;
      let reason = '';
      if (rs.daysAgo > 21) reason = `No visit in ${rs.daysAgo} days`;
      else if (rs.prev30 > 0 && rs.recent30 < rs.prev30 * 0.5) reason = `Visits dropped ${Math.round((1 - rs.recent30/rs.prev30)*100)}% vs last month`;
      else reason = 'Low engagement this month';
      return { ...m, rs, reason };
    }).filter(Boolean).sort((a,b) => a.rs.score - b.rs.score).slice(0, 5);
  }, [allMemberships, checkIns, now]);

  const decliningAttendance = useMemo(() => {
    return allMemberships.map(m => {
      const rs = calcRS(m.user_id, checkIns, now);
      if (rs.trend !== 'declining') return null;
      return { ...m, rs };
    }).filter(Boolean).sort((a,b) => a.rs.score - b.rs.score).slice(0, 5);
  }, [allMemberships, checkIns, now]);

  const totalIssues = noShows.length + lateCancels.length;

  const secDef = [
    { id: 'issues', label: "Issues", count: totalIssues,              color: D.red   },
    { id: 'unbooked', label: "Unbooked", count: notScheduled.length,  color: D.amber },
    { id: 'broken', label: "Fading", count: brokenConsistency.length, color: D.red   },
    { id: 'declining', label: "Dropping", count: decliningAttendance.length, color: D.amber },
  ];

  const itemCard = (key, colorBorder, children) => (
    <div key={key} style={{ padding:'10px 12px', borderRadius:10, background:D.bgCard, border:`1px solid ${D.border}`, borderLeft:`2px solid ${colorBorder}`, marginBottom:7 }}>
      {children}
    </div>
  );

  return (
    <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
      <div style={{ padding:'13px 16px', borderBottom:`1px solid ${D.divider}` }}>
        <div style={{ fontSize:12, fontWeight:800, color:D.t1, marginBottom:10 }}>⚡ Action Centre</div>
        <div style={{ display:'flex', gap:3 }}>
          {secDef.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ flex:1, padding:'5px 4px', borderRadius:7, background: section === s.id ? `${s.color}14` : 'transparent', border: section === s.id ? `1px solid ${s.color}30` : '1px solid transparent', color: section === s.id ? s.color : D.t4, fontSize:8.5, fontWeight: section === s.id ? 800 : 600, cursor:'pointer', position:'relative', fontFamily:'inherit', transition:'all 0.12s' }}>
              {s.label}
              {s.count > 0 && (
                <span style={{ position:'absolute', top:-4, right:-2, width:14, height:14, borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:900, color:'#fff' }}>{s.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'10px 12px', maxHeight:520, overflowY:'auto' }}>

        {section === 'issues' && (
          <>
            {noShows.length === 0 && lateCancels.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 2px' }}>
                <CheckCircle style={{ width:12, height:12, color:D.green }}/>
                <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>No issues today</span>
              </div>
            ) : (
              <>
                {noShows.length > 0 && <div style={{ fontSize:9, fontWeight:700, color:D.t4, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>No-Shows</div>}
                {noShows.map((m, i) =>
                  itemCard(i, D.red, (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{m.user_name || 'Client'}</div>
                      <div style={{ fontSize:9, color:D.t3, margin:'2px 0 7px' }}>Booked "{m.className}" — didn't attend</div>
                      <div style={{ display:'flex', gap:5 }}>
                        <ActionBtn icon={MessageCircle} label="Message" color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} size="xs"/>
                        <ActionBtn icon={Calendar} label="Rebook" color={D.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs"/>
                      </div>
                    </>
                  ))
                )}
                {lateCancels.length > 0 && <div style={{ fontSize:9, fontWeight:700, color:D.t4, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, marginTop:8 }}>Late Cancellations</div>}
                {lateCancels.map((lc, i) =>
                  itemCard(`lc${i}`, D.amber, (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{lc.user_name || 'Client'}</div>
                      <div style={{ fontSize:9, color:D.t3, margin:'2px 0 7px' }}>Late cancel — "{lc.className}"</div>
                      <div style={{ display:'flex', gap:5 }}>
                        <ActionBtn icon={MessageCircle} label="Policy reminder" color={D.amber} onClick={() => openModal('post', { memberId: lc.user_id })} size="xs"/>
                      </div>
                    </>
                  ))
                )}
              </>
            )}
          </>
        )}

        {section === 'unbooked' && (
          notScheduled.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 2px' }}>
              <CheckCircle style={{ width:12, height:12, color:D.green }}/>
              <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>All active clients are booked</span>
            </div>
          ) : notScheduled.map((m, i) => {
            const rs = calcRS(m.user_id, checkIns, now);
            return itemCard(i, D.amber, (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{m.user_name || 'Client'}</div>
                    <div style={{ fontSize:9, color:D.t3 }}>{rs.emoji} {rs.recent30} visits this month · {rs.daysAgo < 999 ? `last ${rs.daysAgo}d ago` : 'never'}</div>
                  </div>
                  <TrendBadge trend={rs.trend}/>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <ActionBtn icon={Calendar} label="Book Session" color={D.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs"/>
                  <ActionBtn icon={MessageCircle} label="Message" color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} size="xs"/>
                </div>
              </>
            ));
          })
        )}

        {section === 'broken' && (
          brokenConsistency.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 2px' }}>
              <CheckCircle style={{ width:12, height:12, color:D.green }}/>
              <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>Attendance looks healthy</span>
            </div>
          ) : brokenConsistency.map((m, i) =>
            itemCard(i, m.rs.color, (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{m.user_name || 'Client'}</div>
                    <div style={{ fontSize:9, color:D.t3, marginTop:1 }}>{m.reason}</div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:900, color:m.rs.color }}>{m.rs.score}</div>
                    <div style={{ fontSize:7, color:D.t4, textTransform:'uppercase' }}>score</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <ActionBtn icon={MessageCircle} label="Message" color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} size="xs"/>
                  <ActionBtn icon={Calendar} label="Book" color={D.purple} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs"/>
                  <ActionBtn icon={Dumbbell} label="Workout" color={D.green} onClick={() => openModal('assignWorkout', { memberId: m.user_id })} size="xs"/>
                </div>
              </>
            ))
          )
        )}

        {section === 'declining' && (
          decliningAttendance.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 2px' }}>
              <CheckCircle style={{ width:12, height:12, color:D.green }}/>
              <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>No declining members</span>
            </div>
          ) : decliningAttendance.map((m, i) =>
            itemCard(i, D.red, (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{m.user_name || 'Client'}</div>
                    <div style={{ fontSize:9, color:D.t3, display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                      <ArrowDownRight style={{ width:9, height:9, color:D.red }}/>
                      {m.rs.recent30} visits this month vs {m.rs.prev30} last month
                    </div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:900, color:D.red }}>{m.rs.score}</div>
                    <div style={{ fontSize:7, color:D.t4, textTransform:'uppercase' }}>score</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <ActionBtn icon={MessageCircle} label="Check-in" color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} size="xs"/>
                  <ActionBtn icon={Calendar} label="Book" color={D.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs"/>
                </div>
              </>
            ))
          )
        )}
      </div>
    </div>
  );
}

// ─── Upcoming Sessions compact list ──────────────────────────────────────────
function UpcomingList({ classes, now, avatarMap, onSelect }) {
  const upcoming = useMemo(() => {
    return [...classes]
      .filter(cls => {
        const sched = cls.scheduleStr || cls.schedule || '';
        if (!sched) return false;
        const match = String(sched).match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return false;
        let h = parseInt(match[1]);
        if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        return h >= now.getHours();
      })
      .sort((a, b) => {
        const getH = s => {
          const m = String(s.scheduleStr || '').match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
          if (!m) return 99;
          let h = parseInt(m[1]);
          if (m[2].toLowerCase() === 'pm' && h !== 12) h += 12;
          return h;
        };
        return getH(a) - getH(b);
      })
      .slice(0, 5);
  }, [classes, now]);

  if (upcoming.length === 0) return null;

  return (
    <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${D.divider}` }}>
        <span style={{ fontSize:12, fontWeight:800, color:D.t1 }}>⏰ Upcoming Today</span>
      </div>
      <div style={{ padding:'6px 12px 10px' }}>
        {upcoming.map((cls, i) => {
          const { typeCfg } = cls;
          const c = typeCfg.color;
          const booked = cls.booked.length || cls.attended.length;
          const fill = cls.fill || 0;
          return (
            <div key={cls.id || i} onClick={() => onSelect(cls)}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 6px', borderBottom: i < upcoming.length - 1 ? `1px solid ${D.divider}` : 'none', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0, boxShadow:`0 0 6px ${c}` }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:D.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cls.name}</div>
                <div style={{ fontSize:9, color:D.t3 }}>{cls.scheduleStr} · {booked}/{cls.capacity}</div>
              </div>
              <div style={{ width:36, height:4, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden', flexShrink:0 }}>
                <div style={{ height:'100%', width:`${fill}%`, background:fill >= 80 ? D.amber : fill >= 50 ? D.green : D.blue, borderRadius:99 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month Cell ───────────────────────────────────────────────────────────────
function MonthCell({ date, isCurrentMonth, isSelected, isToday, classCount, checkInCount, onClick }) {
  return (
    <div onClick={onClick}
      style={{ padding:'6px 5px', borderRadius:10, cursor:'pointer', textAlign:'center', background: isSelected ? D.purpleDim : isToday ? 'rgba(139,92,246,0.07)' : 'transparent', border: isSelected ? `1px solid ${D.purpleBrd}` : isToday ? `1px solid rgba(139,92,246,0.2)` : `1px solid transparent`, transition:'all 0.12s', opacity: isCurrentMonth ? 1 : 0.28 }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(139,92,246,0.07)' : 'transparent'; }}>
      <div style={{ fontSize:13, fontWeight: isToday || isSelected ? 900 : 600, color: isSelected ? D.purple : isToday ? D.t1 : D.t3, lineHeight:1, marginBottom:4 }}>{format(date, 'd')}</div>
      {classCount > 0 && (
        <div style={{ display:'flex', justifyContent:'center', gap:2, marginBottom:2 }}>
          {Array.from({ length: Math.min(classCount, 3) }, (_, j) => (
            <div key={j} style={{ width:4, height:4, borderRadius:'50%', background: isSelected ? D.purple : `${D.purple}55` }}/>
          ))}
        </div>
      )}
      {checkInCount > 0 && <div style={{ fontSize:8, fontWeight:700, color: isSelected ? D.purple : D.t4 }}>{checkInCount}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachSchedule({
  myClasses, checkIns, events, allMemberships = [], avatarMap, openModal, now,
}) {
  const [calView,       setCalView]       = useState('week');
  const [selectedDate,  setSelectedDate]  = useState(now);
  const [monthDate,     setMonthDate]     = useState(now);
  const [detailCls,     setDetailCls]     = useState(null);   // session detail panel
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [confirmCancel, setConfirmCancel] = useState(null);

  const gymId = allMemberships[0]?.gym_id || null;

  // ── Persisted data ───────────────────────────────────────────────────────
  const [attendance,       setAttendance]       = useState(() => { try { return JSON.parse(localStorage.getItem('coachAttendanceSheets')   || '{}'); } catch { return {}; } });
  const [notes,            setNotes]            = useState(() => { try { return JSON.parse(localStorage.getItem('coachSessionNotes')        || '{}'); } catch { return {}; } });
  const [cancelledClasses, setCancelledClasses] = useState(() => { try { return JSON.parse(localStorage.getItem('coachCancelledClasses')   || '[]'); } catch { return []; } });
  const [classAnnounce,    setClassAnnounce]    = useState(() => { try { return JSON.parse(localStorage.getItem('coachClassAnnouncements') || '{}'); } catch { return {}; } });

  useEffect(() => {
    if (!gymId) return;
    base44.functions.invoke('coachData', { action: 'read', gymId })
      .then(result => {
        if (!result?.data) return;
        const d = result.data;
        if (d.attendance_sheets   && Object.keys(d.attendance_sheets).length)   { setAttendance(d.attendance_sheets);    try { localStorage.setItem('coachAttendanceSheets',   JSON.stringify(d.attendance_sheets)); } catch {} }
        if (d.session_notes       && Object.keys(d.session_notes).length)       { setNotes(d.session_notes);             try { localStorage.setItem('coachSessionNotes',        JSON.stringify(d.session_notes)); } catch {} }
        if (Array.isArray(d.cancelled_classes) && d.cancelled_classes.length)   { setCancelledClasses(d.cancelled_classes); try { localStorage.setItem('coachCancelledClasses', JSON.stringify(d.cancelled_classes)); } catch {} }
        if (d.class_announcements && Object.keys(d.class_announcements).length) { setClassAnnounce(d.class_announcements); try { localStorage.setItem('coachClassAnnouncements', JSON.stringify(d.class_announcements)); } catch {} }
      })
      .catch(() => {});
  }, [gymId]);

  const writeThrough = (field, data, lsKey) => {
    try { localStorage.setItem(lsKey, JSON.stringify(data)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field, data }).catch(() => {});
  };

  const saveNote     = (key, val) => { const u = { ...notes, [key]: val }; setNotes(u); writeThrough('session_notes', u, 'coachSessionNotes'); };
  const saveAnnounce = (key, val) => { const u = { ...classAnnounce, [key]: val }; setClassAnnounce(u); writeThrough('class_announcements', u, 'coachClassAnnouncements'); };

  const toggleAttendance = (rosterKey, uid) => {
    const sheet = attendance[rosterKey] || [];
    const u     = { ...attendance, [rosterKey]: sheet.includes(uid) ? sheet.filter(id => id !== uid) : [...sheet, uid] };
    setAttendance(u); writeThrough('attendance_sheets', u, 'coachAttendanceSheets');
  };
  const markAllPresent = (rosterKey) => {
    const u = { ...attendance, [rosterKey]: allMemberships.map(m => m.user_id) };
    setAttendance(u); writeThrough('attendance_sheets', u, 'coachAttendanceSheets');
  };
  const clearAttendance = (rosterKey) => {
    const u = { ...attendance, [rosterKey]: [] };
    setAttendance(u); writeThrough('attendance_sheets', u, 'coachAttendanceSheets');
  };
  const cancelClass = (cls, dateStr) => {
    const key = `${cls.id}-${dateStr}`;
    const u   = [...cancelledClasses, key];
    setCancelledClasses(u); writeThrough('cancelled_classes', u, 'coachCancelledClasses');
    setConfirmCancel(null); setDetailCls(null);
  };
  const reinstateClass = (cls) => {
    const key = `${cls.id}-${selDateStr}`;
    const u   = cancelledClasses.filter(k => k !== key);
    setCancelledClasses(u); writeThrough('cancelled_classes', u, 'coachCancelledClasses');
  };

  // ── Calendar helpers ────────────────────────────────────────────────────
  const selDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday    = isSameDay(selectedDate, now);
  const weekStart  = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const week       = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(monthDate);
  const monthEnd   = endOfMonth(monthDate);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const monthDays  = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const dayCheckIns = (day) => checkIns.filter(c => isSameDay(new Date(c.check_in_date), day));
  const selCIs      = dayCheckIns(selectedDate);
  const dayCounts   = useMemo(() => week.map(d => dayCheckIns(d).length), [week, checkIns]);

  const navigate = (dir) => {
    if (calView === 'day')   setSelectedDate(d => dir > 0 ? addDays(d, 1) : subDays(d, 1));
    if (calView === 'week')  setSelectedDate(d => dir > 0 ? addDays(d, 7) : subDays(d, 7));
    if (calView === 'month') setMonthDate(d => dir > 0 ? addDays(startOfMonth(d), 32) : subDays(startOfMonth(d), 1));
  };

  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), count: dayCheckIns(d).length };
  }), [checkIns, now]);
  const maxCount30 = Math.max(...last30.map(d => d.count), 1);

  // ── Class enrichment ────────────────────────────────────────────────────
  const appointments = useMemo(() => myClasses.filter(c => c.type === 'personal_training' || c.is_appointment || c.type === 'pt'), [myClasses]);
  const groupClasses = useMemo(() => myClasses.filter(c => !c.type || (c.type !== 'personal_training' && !c.is_appointment && c.type !== 'pt')), [myClasses]);

  const classesWithData = useMemo(() => {
    let cls = groupClasses;
    if (typeFilter !== 'all') cls = cls.filter(c => {
      const name = (c.name || c.class_type || c.type || '').toLowerCase();
      return name.includes(typeFilter);
    });
    return cls.map(cls => {
      const typeCfg     = getClassTypeCfg(cls);
      const capacity    = cls.max_capacity || cls.capacity || 20;
      const booked      = cls.bookings || [];
      const waitlist    = cls.waitlist || [];
      const isCancelled = cancelledClasses.includes(`${cls.id}-${selDateStr}`);
      const lateCancels = getLateCancel(cls, now);
      const revenue     = calcRevenue(cls, allMemberships);
      const _schedStr   = typeof cls.schedule === 'string' ? cls.schedule : (Array.isArray(cls.schedule) && cls.schedule[0]?.time ? cls.schedule[0].time : '');
      const attended    = selCIs.filter(ci => {
        if (!_schedStr) return false;
        const match = _schedStr.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return false;
        let sh = parseInt(match[1]);
        if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
        const h = new Date(ci.check_in_date).getHours();
        return h === sh || h === sh + 1;
      });
      const classHour = (() => {
        if (!_schedStr) return null;
        const match = _schedStr.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return null;
        let h = parseInt(match[1]);
        if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        return h;
      })();
      const freq = {};
      if (classHour !== null) {
        checkIns.forEach(ci => {
          const h = new Date(ci.check_in_date).getHours();
          if (h === classHour || h === classHour + 1) freq[ci.user_id] = (freq[ci.user_id] || 0) + 1;
        });
      }
      const regulars = allMemberships.filter(m => (freq[m.user_id] || 0) >= 2);
      const fill     = booked.length > 0
        ? Math.min(100, Math.round((booked.length / capacity) * 100))
        : Math.min(100, Math.round((attended.length / capacity) * 100));
      return { ...cls, attended, capacity, booked, waitlist, regulars, fill, isCancelled, typeCfg, revenue, lateCancels, scheduleStr: _schedStr };
    });
  }, [groupClasses, selCIs, checkIns, allMemberships, cancelledClasses, selDateStr, typeFilter, now]);

  // ── Summary KPIs ────────────────────────────────────────────────────────
  const totalBookedToday  = classesWithData.reduce((s, c) => s + (c.booked.length || c.attended.length), 0);
  const totalNoShows      = classesWithData.reduce((s, c) => {
    const checkedIds = c.attended.map(ci => ci.user_id);
    return s + Math.max(0, c.booked.length - checkedIds.length);
  }, 0);
  const avgFill           = classesWithData.length > 0 ? Math.round(classesWithData.reduce((s, c) => s + c.fill, 0) / classesWithData.length) : 0;
  const totalRevToday     = classesWithData.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalLateCancels  = classesWithData.reduce((s, c) => s + c.lateCancels.length, 0);
  const totalPresent      = classesWithData.reduce((s, c) => { const checkedIds = c.attended.map(ci => ci.user_id); const manualIds = attendance[`${c.id}-${selDateStr}`] || []; return s + [...new Set([...checkedIds, ...manualIds])].length; }, 0);

  const classTypes = useMemo(() => {
    const types = new Set(groupClasses.map(c => {
      const name = (c.name || c.class_type || c.type || '').toLowerCase();
      for (const key of Object.keys(CLASS_TYPE_CFG)) {
        if (name.includes(key) && key !== 'default') return key;
      }
      return null;
    }).filter(Boolean));
    return [...types];
  }, [groupClasses]);

  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.event_date) >= now)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 3),
    [events, now]);

  // Keep detail panel in sync when classes update
  useEffect(() => {
    if (detailCls) {
      const updated = classesWithData.find(c => c.id === detailCls.id);
      if (updated) setDetailCls(updated);
    }
  }, [classesWithData]);

  const openDetail = (cls) => {
    setDetailCls(prev => (prev?.id === cls.id ? null : cls));
  };

  return (
    <>
      {/* Confirm cancel dialog */}
      {confirmCancel && (
        <ConfirmDialog
          message={`Cancel "${confirmCancel.name}" on ${format(selectedDate, 'EEE, MMM d')}? Members must be notified manually.`}
          onConfirm={() => cancelClass(confirmCancel, selDateStr)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {/* Session detail slide-in panel */}
      {detailCls && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:8999, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(2px)' }} onClick={() => setDetailCls(null)}/>
          <SessionDetailPanel
            cls={detailCls}
            allMemberships={allMemberships}
            checkIns={checkIns}
            avatarMap={avatarMap}
            attendance={attendance}
            onToggleAttendance={toggleAttendance}
            onMarkAllPresent={markAllPresent}
            onClearAttendance={clearAttendance}
            onSaveNote={saveNote}
            onSaveAnnounce={saveAnnounce}
            notes={notes}
            classAnnounce={classAnnounce}
            selDateStr={selDateStr}
            now={now}
            openModal={(type, data) => {
              if (type === 'confirmCancel') { setConfirmCancel(data); return; }
              openModal(type, data);
            }}
            onClose={() => setDetailCls(null)}
            onCancelClass={(cls) => setConfirmCancel(cls)}
            onReinstateClass={reinstateClass}
          />
        </>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>

        {/* ── DAILY SUMMARY BAR ────────────────────────────────────────────── */}
        <DailySummaryBar
          totalSessions={classesWithData.length}
          totalExpected={totalBookedToday}
          noShows={totalNoShows}
          fillRate={avgFill}
          totalRevenue={totalRevToday}
          lateCancels={totalLateCancels}
          isToday={isToday}
          dateLabel={format(selectedDate, 'EEE, MMM d')}
        />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 288px', gap:16, alignItems:'start' }}>

          {/* ══ LEFT ═══════════════════════════════════════════════════════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* ── CALENDAR CARD ── */}
            <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, padding:'16px 18px' }}>

              {/* Navigation row */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                {/* View toggle */}
                <div style={{ display:'flex', gap:2, padding:3, background:'rgba(255,255,255,0.02)', border:`1px solid ${D.border}`, borderRadius:10, flexShrink:0 }}>
                  {[{ id:'day', label:'Day' }, { id:'week', label:'Week' }, { id:'month', label:'Month' }].map(v => (
                    <button key={v.id} onClick={() => setCalView(v.id)}
                      style={{ padding:'5px 12px', borderRadius:7, border: calView===v.id ? `1px solid ${D.purpleBrd}` : '1px solid transparent', background: calView===v.id ? D.purpleDim : 'transparent', color: calView===v.id ? D.purple : D.t3, fontSize:11, fontWeight: calView===v.id ? 700 : 500, cursor:'pointer', transition:'all 0.12s', fontFamily:'inherit' }}>
                      {v.label}
                    </button>
                  ))}
                </div>

                <button onClick={() => navigate(-1)} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${D.border}`, color:D.t3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ChevronLeft style={{ width:13, height:13 }}/>
                </button>
                <span style={{ fontSize:13, fontWeight:800, color:D.t1, flex:1 }}>
                  {calView === 'month' ? format(monthDate, 'MMMM yyyy') : calView === 'week' ? `${format(week[0], 'MMM d')} – ${format(week[6], 'MMM d, yyyy')}` : format(selectedDate, 'EEEE, MMM d, yyyy')}
                </span>
                <button onClick={() => navigate(1)} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${D.border}`, color:D.t3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ChevronRight style={{ width:13, height:13 }}/>
                </button>
                <button onClick={() => { setSelectedDate(now); setMonthDate(now); }} style={{ padding:'5px 12px', borderRadius:8, background:D.purpleDim, border:`1px solid ${D.purpleBrd}`, color:D.purple, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Today</button>
              </div>

              {/* ── Week strip ── */}
              {(calView === 'week' || calView === 'day') && (
                <div style={{ display:'flex', gap:5 }}>
                  {week.map((d, i) => {
                    const isT    = isSameDay(d, now);
                    const active = isSameDay(d, selectedDate);
                    const count  = dayCounts[i];
                    return (
                      <button key={i} onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }}
                        style={{ flex:1, padding:'11px 4px 10px', borderRadius:10, border: active ? `1px solid ${D.purpleBrd}` : isT ? `1px solid rgba(139,92,246,0.2)` : `1px solid ${D.divider}`, background: active ? D.purpleDim : isT ? 'rgba(139,92,246,0.05)' : 'transparent', cursor:'pointer', textAlign:'center', transition:'all 0.15s', position:'relative', fontFamily:'inherit' }}>
                        <div style={{ fontSize:8, fontWeight:800, color: active ? D.purple : D.t4, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{format(d, 'EEE')}</div>
                        <div style={{ fontSize:20, fontWeight:900, color: active ? D.purple : isT ? D.t1 : D.t3, lineHeight:1, marginBottom:5 }}>{format(d, 'd')}</div>
                        <div style={{ display:'flex', justifyContent:'center', gap:2, marginBottom:3 }}>
                          {Array.from({ length: Math.min(groupClasses.length, 4) }, (_, j) => (
                            <div key={j} style={{ width:4, height:4, borderRadius:'50%', background: active ? D.purple : `${D.purple}40` }}/>
                          ))}
                        </div>
                        {count > 0 && <div style={{ fontSize:9, fontWeight:700, color: active ? D.purple : D.t4 }}>{count} in</div>}
                        {isT && !active && <div style={{ position:'absolute', top:5, right:7, width:5, height:5, borderRadius:'50%', background:D.purple }}/>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Month grid ── */}
              {calView === 'month' && (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                      <div key={d} style={{ textAlign:'center', fontSize:9, fontWeight:800, color:D.t4, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 0' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                    {monthDays.map((d, i) => (
                      <MonthCell key={i} date={d} isCurrentMonth={isSameMonth(d, monthDate)} isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)} classCount={groupClasses.length} checkInCount={dayCheckIns(d).length} onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }}/>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── CLASS LIST HEADER ── */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, flex:1 }}>
                <div style={{ width:3, height:16, borderRadius:99, background:D.purple, flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:800, color:D.t1 }}>
                  {isToday ? `Today's Sessions` : `${format(selectedDate, 'EEE, MMM d')} Sessions`}
                </span>
                <span style={{ fontSize:11, color:D.t3 }}>{selCIs.length} checked in · {classesWithData.length} class{classesWithData.length !== 1 ? 'es' : ''}</span>
              </div>
              {/* Type filter chips */}
              <div style={{ display:'flex', gap:4, overflowX:'auto' }}>
                {['all', ...classTypes].map(type => {
                  const cfg = type === 'all' ? { color:D.purple, label:'All', emoji:'📋' } : CLASS_TYPE_CFG[type] || CLASS_TYPE_CFG.default;
                  return (
                    <button key={type} onClick={() => setTypeFilter(type)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:99, border: typeFilter===type ? `1px solid ${cfg.color}45` : `1px solid ${D.border}`, background: typeFilter===type ? `${cfg.color}12` : 'transparent', color: typeFilter===type ? cfg.color : D.t3, fontSize:10, fontWeight: typeFilter===type ? 700 : 500, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.12s', fontFamily:'inherit' }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => openModal('classes')} style={{ fontSize:10, fontWeight:700, color:D.purple, background:D.purpleDim, border:`1px solid ${D.purpleBrd}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}>+ Add</button>
            </div>

            {/* ── SESSION BLOCKS ── */}
            {classesWithData.length === 0 ? (
              <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, padding:'40px', textAlign:'center' }}>
                <Clock style={{ width:22, height:22, color:D.t4, margin:'0 auto 12px' }}/>
                <p style={{ fontSize:13, color:D.t2, fontWeight:700, margin:'0 0 4px' }}>No classes on this day</p>
                <p style={{ fontSize:11, color:D.t3, margin:'0 0 16px' }}>{typeFilter !== 'all' ? 'Try clearing the type filter' : 'Add your first class to get started'}</p>
                {/* Empty slot placeholder */}
                {[{ t:'6:00 AM' }, { t:'9:00 AM' }, { t:'12:00 PM' }, { t:'5:30 PM' }].map((slot, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, background:'rgba(255,255,255,0.015)', border:`1px dashed ${D.border}`, marginBottom:6, textAlign:'left' }}>
                    <Clock style={{ width:11, height:11, color:D.t4, flexShrink:0 }}/>
                    <span style={{ fontSize:10, color:D.t4, flex:1 }}>{slot.t} — Available</span>
                    <button onClick={() => openModal('classes')} style={{ fontSize:9, fontWeight:700, color:D.purple, background:D.purpleDim, border:`1px solid ${D.purpleBrd}`, borderRadius:6, padding:'3px 8px', cursor:'pointer', fontFamily:'inherit' }}>+ Add</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {classesWithData.map((cls, idx) => (
                  <SessionBlock
                    key={cls.id || idx}
                    cls={cls}
                    checkIns={checkIns}
                    allMemberships={allMemberships}
                    avatarMap={avatarMap}
                    selDateStr={selDateStr}
                    isSelected={detailCls?.id === cls.id}
                    onOpen={() => openDetail(cls)}
                    now={now}
                  />
                ))}
              </div>
            )}

            {/* ── PT / APPOINTMENTS ── */}
            {appointments.length > 0 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:3, height:16, borderRadius:99, background:D.blue, flexShrink:0 }}/>
                  <span style={{ fontSize:13, fontWeight:800, color:D.t1, flex:1 }}>PT / 1:1 Appointments</span>
                  <button onClick={() => openModal('bookAppointment')} style={{ fontSize:10, fontWeight:700, color:D.blue, background:D.blueDim, border:`1px solid ${D.blueBrd}`, borderRadius:7, padding:'5px 11px', cursor:'pointer', fontFamily:'inherit' }}>+ Book</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:10 }}>
                  {appointments.map((apt, i) => {
                    const m = allMemberships.find(x => x.user_id === apt.client_id || x.user_id === apt.user_id);
                    return (
                      <div key={apt.id || i} style={{ borderRadius:13, background:D.bgCard, border:`1px solid rgba(56,189,248,0.2)`, padding:'13px 15px', display:'flex', alignItems:'center', gap:11 }}>
                        <div style={{ position:'relative' }}>
                          <MiniAvatar name={apt.client_name || m?.user_name || 'Client'} src={avatarMap[apt.client_id || apt.user_id]} size={38} color={D.blue}/>
                          <div style={{ position:'absolute', bottom:0, right:0, width:10, height:10, borderRadius:'50%', background:D.blue, border:`2px solid ${D.bgCard}` }}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:D.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{apt.client_name || m?.user_name || 'Client'}</div>
                          <div style={{ fontSize:10, color:D.t3, marginTop:2 }}>🕐 {apt.schedule || apt.time || 'TBD'} {apt.session_type && `· ${apt.session_type}`} {apt.duration_minutes && `· ${apt.duration_minutes}min`}</div>
                          {apt.notes && <div style={{ fontSize:9, color:D.t4, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{apt.notes}</div>}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                          <ActionBtn icon={QrCode} label="Check In" color={D.green} onClick={() => openModal('qrScanner')} size="xs"/>
                          <ActionBtn icon={ClipboardList} label="Note" color={D.purple} onClick={() => openModal('memberNote', m)} size="xs"/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT SIDEBAR ═══════════════════════════════════════════════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Quick Actions */}
            <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
              <div style={{ padding:'12px 15px', borderBottom:`1px solid ${D.divider}` }}>
                <span style={{ fontSize:12, fontWeight:800, color:D.t1 }}>Quick Actions</span>
              </div>
              <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:5 }}>
                {[
                  { icon: QrCode,   label:'Scan Check-In',  sub:'Start a class',         color:D.green,  fn:() => openModal('qrScanner') },
                  { icon: Calendar, label:'Create Event',   sub:'Add to calendar',       color:D.green,  fn:() => openModal('event') },
                  { icon: Dumbbell, label:'Manage Classes', sub:'Edit your timetable',   color:D.purple, fn:() => openModal('classes') },
                  { icon: Bell,     label:'Send Reminder',  sub:'Post to members',       color:D.blue,   fn:() => openModal('post') },
                  { icon: Ban,      label:'Late Cancels',   sub:`${totalLateCancels} flagged`, color: totalLateCancels > 0 ? D.red : D.t3, fn:() => {} },
                ].map(({ icon: Ic, label, sub, color, fn }, i) => {
                  const [h, setH] = useState(false);
                  return (
                    <button key={i} onClick={fn}
                      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
                      style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:10, background: h ? `${color}0f` : 'rgba(255,255,255,0.025)', border:`1px solid ${h ? `${color}30` : D.border}`, cursor:'pointer', transition:'all 0.12s', textAlign:'left', width:'100%', fontFamily:'inherit' }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`${color}16`, border:`1px solid ${color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Ic style={{ width:12, height:12, color }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{label}</div>
                        <div style={{ fontSize:9, color: totalLateCancels > 0 && label === 'Late Cancels' ? color : D.t4 }}>{sub}</div>
                      </div>
                      {label === 'Late Cancels' && totalLateCancels > 0 && (
                        <span style={{ fontSize:9, fontWeight:900, color:D.red, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:99, padding:'1px 7px' }}>{totalLateCancels}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── ATTENTION PANEL ── */}
            <AttentionPanel allMemberships={allMemberships} checkIns={checkIns} myClasses={myClasses} now={now} openModal={openModal}/>

            {/* Upcoming sessions today */}
            <UpcomingList classes={classesWithData} now={now} avatarMap={avatarMap} onSelect={openDetail}/>

            {/* Week Summary */}
            <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
              <div style={{ padding:'12px 15px', borderBottom:`1px solid ${D.divider}` }}>
                <span style={{ fontSize:12, fontWeight:800, color:D.t1 }}>Day Summary</span>
              </div>
              <div style={{ padding:'8px 14px' }}>
                {[
                  { label:'Sessions',       value: classesWithData.length,   color:D.purple },
                  { label:'Expected',       value: totalBookedToday,          color:D.blue   },
                  { label:'Checked In',     value: totalPresent,              color:D.green  },
                  { label:'No-Shows',       value: totalNoShows,              color: totalNoShows > 0 ? D.red : D.t3 },
                  { label:'Avg Fill',       value:`${avgFill}%`,              color: avgFill >= 70 ? D.green : avgFill >= 40 ? D.amber : D.red },
                  { label:'Est. Revenue',   value: totalRevToday > 0 ? `£${totalRevToday}` : '—', color:D.green },
                  { label:'PT Sessions',    value: appointments.length,       color:D.blue   },
                ].map((s, i, arr) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom: i < arr.length - 1 ? `1px solid ${D.divider}` : 'none' }}>
                    <span style={{ fontSize:10, color:D.t2 }}>{s.label}</span>
                    <span style={{ fontSize:12, fontWeight:800, color:s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Class type breakdown */}
            {classTypes.length > 0 && (
              <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
                <div style={{ padding:'12px 15px', borderBottom:`1px solid ${D.divider}` }}>
                  <span style={{ fontSize:12, fontWeight:800, color:D.t1 }}>Class Mix</span>
                </div>
                <div style={{ padding:'8px 14px', display:'flex', flexDirection:'column', gap:7 }}>
                  {classTypes.map(type => {
                    const cfg       = CLASS_TYPE_CFG[type] || CLASS_TYPE_CFG.default;
                    const count     = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).length;
                    const avgFillT  = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).reduce((s, c) => s + c.fill, 0) / Math.max(count, 1);
                    return (
                      <div key={type} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:13 }}>{cfg.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                            <span style={{ fontSize:10, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                            <span style={{ fontSize:9, color:D.t3 }}>{count} · {Math.round(avgFillT)}%</span>
                          </div>
                          <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${avgFillT}%`, background:cfg.color, borderRadius:99 }}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
                <div style={{ padding:'12px 15px', borderBottom:`1px solid ${D.divider}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, fontWeight:800, color:D.t1 }}>Upcoming Events</span>
                  <button onClick={() => openModal('event')} style={{ fontSize:9, fontWeight:700, color:D.green, background:D.greenDim, border:`1px solid ${D.greenBrd}`, borderRadius:6, padding:'3px 7px', cursor:'pointer', fontFamily:'inherit' }}>+ New</button>
                </div>
                <div style={{ padding:'7px 14px' }}>
                  {upcomingEvents.map((ev, i) => {
                    const d    = new Date(ev.event_date);
                    const diff = Math.floor((d - now) / 86400000);
                    return (
                      <div key={ev.id || i} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 0', borderBottom: i < upcomingEvents.length - 1 ? `1px solid ${D.divider}` : 'none' }}>
                        <div style={{ flexShrink:0, background:D.greenDim, border:`1px solid ${D.greenBrd}`, borderRadius:9, padding:'5px 7px', textAlign:'center', minWidth:32 }}>
                          <div style={{ fontSize:13, fontWeight:900, color:D.green, lineHeight:1 }}>{format(d,'d')}</div>
                          <div style={{ fontSize:7, fontWeight:800, color:'#1a5a3a', textTransform:'uppercase' }}>{format(d,'MMM')}</div>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:D.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                          <div style={{ fontSize:9, color: diff <= 2 ? D.red : D.t3 }}>{diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 30-Day Activity Sparkline */}
            <div style={{ borderRadius:14, background:D.bgSurface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
              <div style={{ padding:'12px 15px', borderBottom:`1px solid ${D.divider}` }}>
                <span style={{ fontSize:12, fontWeight:800, color:D.t1 }}>30-Day Activity</span>
              </div>
              <div style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:50 }}>
                  {last30.map((d, i) => {
                    const h = d.count === 0 ? 2 : Math.max(4, (d.count / maxCount30) * 46);
                    const isLast3 = i >= 27;
                    return (
                      <div key={i} title={`${d.label}: ${d.count}`}
                        style={{ flex:1, height:h, borderRadius:'2px 2px 1px 1px', background: isLast3 ? D.blue : `${D.blue}28`, transition:'height 0.4s ease' }}/>
                    );
                  })}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:8, color:D.t4 }}>{format(subDays(now, 29), 'MMM d')}</span>
                  <span style={{ fontSize:8, color:D.blue, fontWeight:700 }}>Today</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginTop:9, paddingTop:9, borderTop:`1px solid ${D.divider}` }}>
                  {[
                    { label:'total',   value: last30.reduce((s, d) => s + d.count, 0), color:D.blue },
                    { label:'peak',    value: maxCount30,                                color:D.purple },
                    { label:'avg/day', value: (last30.reduce((s, d) => s + d.count, 0) / 30).toFixed(1), color:D.green },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:15, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontSize:8, color:D.t4, marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
