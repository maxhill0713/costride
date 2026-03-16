import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  TrendingDown, Users, Trophy, AlertCircle, BarChart2,
  Eye, Menu, LayoutDashboard, FileText, BarChart3, Settings,
  LogOut, ChevronDown, AlertTriangle, QrCode, MessageSquarePlus,
  Plus, Dumbbell, Clock, Crown, Trash2, X, Download, Send, Bell,
  Sun, Zap, TrendingUp, Activity, Calendar, CheckCircle,
  MessageCircle, Star, UserCheck, Flame, ChevronRight, Pencil
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, subDays, startOfDay, isWithinInterval, formatDistanceToNow } from 'date-fns';
import ManageRewardsModal    from '../components/gym/ManageRewardsModal';
import ManageClassesModal    from '../components/gym/ManageClassesModal';
import ManageCoachesModal    from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal  from '../components/gym/ManageGymPhotosModal';
import EditGymPhotoModal     from '../components/gym/EditGymPhotoModal';
import ManageMembersModal    from '../components/gym/ManageMembersModal';
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';
import ManageEquipmentModal  from '../components/gym/ManageEquipmentModal';
import ManageAmenitiesModal  from '../components/gym/ManageAmenitiesModal';
import EditBasicInfoModal    from '../components/gym/EditBasicInfoModal';
import CreateEventModal      from '../components/events/CreateEventModal';
import CreateChallengeModal  from '../components/challenges/CreateChallengeModal';
import QRScanner             from '../components/gym/QRScanner';
import CreatePollModal       from '../components/polls/CreatePollModal';
import GymJoinPoster         from '../components/dashboard/GymJoinPoster';
import QRCode                from 'react-qr-code';
import { DASH_STYLE } from '../components/dashboard/DashboardPrimitives';
import TabOverview   from '../components/dashboard/TabOverview';
import TabMembersComponent from '../components/dashboard/TabMembers';
import TabContentComponent from '../components/dashboard/TabContent';
import TabAnalyticsComponent from '../components/dashboard/TabAnalytics';
import TabGym        from '../components/dashboard/TabGym';

// ── Nav filtered by role ──────────────────────────────────────────────────────
const ALL_NAV = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard, roles: ['gym_owner', 'coach'] },
  { id: 'schedule',  label: 'Schedule',  icon: Calendar,        roles: ['coach'] },
  { id: 'members',   label: 'Members',   icon: Users,           roles: ['gym_owner', 'coach'] },
  { id: 'content',   label: 'Content',   icon: FileText,        roles: ['gym_owner', 'coach'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3,       roles: ['gym_owner'] },
  { id: 'gym',       label: 'Settings',  icon: Settings,        roles: ['gym_owner'] },
];

// ── Sparkline ─────────────────────────────────────────────────────────────────
const Spark = ({ data = [], color = '#38bdf8', height = 32 }) => {
  if (!data.length) return null;
  const w = 100, h = height;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `${pts} ${w},${h} 0,${h}`;
  const id = `sg-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', marginTop: 8 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={area} fill={`url(#${id})`} />
    </svg>
  );
};

// ── Delta badge ───────────────────────────────────────────────────────────────
const Delta = ({ val }) => {
  const up = val > 0, flat = val === 0;
  const color = flat ? '#64748b' : up ? '#34d399' : '#f87171';
  const bg    = flat ? 'rgba(100,116,139,0.1)' : up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: bg, color }}>
      {flat ? '→' : up ? '↑' : '↓'} {Math.abs(val)}%
    </span>
  );
};

// ── Coach KPI card ────────────────────────────────────────────────────────────
function CoachKpiCard({ icon: Icon, label, value, sub, subColor = '#64748b', accentColor = '#a78bfa', footerBar, trend }) {
  return (
    <div style={{ borderRadius: 16, padding: '16px 18px', background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
      <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: accentColor, opacity: 0.07, filter: 'blur(24px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${accentColor}45,transparent)`, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#3a5070', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${accentColor}18`, border: `1px solid ${accentColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color: accentColor }}/>
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: subColor, fontWeight: 600 }}>{sub}</span>
        {trend != null && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: trend > 0 ? 'rgba(52,211,153,0.1)' : trend < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(100,116,139,0.1)', color: trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : '#64748b' }}>
            {trend > 0 ? `↑${trend}%` : trend < 0 ? `↓${Math.abs(trend)}%` : '→'}
          </span>
        )}
      </div>
      {footerBar != null && (
        <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: `${accentColor}18`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, footerBar)}%`, background: `linear-gradient(90deg,${accentColor},${accentColor}cc)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
        </div>
      )}
    </div>
  );
}

// ── Coach card shell ──────────────────────────────────────────────────────────
function CoachCard({ children, style = {}, accent, title, action, onAction }) {
  return (
    <div style={{ background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, position: 'relative', overflow: 'hidden', ...style }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${accent}35,transparent)`, pointerEvents: 'none' }}/>}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>{title}</span>
          {onAction && <button onClick={onAction} style={{ fontSize: 11, fontWeight: 700, color: accent || '#a78bfa', background: `${accent || '#a78bfa'}12`, border: `1px solid ${accent || '#a78bfa'}25`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>{action || 'View all'}</button>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Class type helper ─────────────────────────────────────────────────────────
const CLASS_TYPE_COLORS = { hiit: '#f87171', yoga: '#34d399', strength: '#818cf8', spin: '#38bdf8', boxing: '#fb923c', cardio: '#fb7185', pilates: '#c084fc', default: '#a78bfa' };
function classColor(cls) {
  const n = (cls?.class_type || cls?.name || '').toLowerCase();
  return CLASS_TYPE_COLORS[Object.keys(CLASS_TYPE_COLORS).find(k => n.includes(k)) || 'default'];
}

// ── Mini avatar ───────────────────────────────────────────────────────────────
function MiniAvatar({ name, src, size = 30, color = '#a78bfa' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: src ? 'transparent' : `linear-gradient(135deg,${color}80,${color}40)`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Coach Overview ────────────────────────────────────────────────────────────
function TabCoachOverview({ myClasses, checkIns, allMemberships, avatarMap, openModal, now, selectedGym, posts, events, challenges, polls }) {
  const ci7   = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7), end: now }));
  const ci30  = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,30), end: now }));
  const ciPrev7 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,14), end: subDays(now,7) }));

  const todayCI  = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime());
  const totalM   = allMemberships.length;
  const activeW  = new Set(ci7.map(c => c.user_id)).size;
  const activePW = new Set(ciPrev7.map(c => c.user_id)).size;
  const weekTrend = activePW > 0 ? Math.round(((activeW - activePW) / activePW) * 100) : 0;

  const memberLastCI = {};
  checkIns.forEach(c => { if (!memberLastCI[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCI[c.user_id])) memberLastCI[c.user_id] = c.check_in_date; });
  const atRisk = allMemberships.filter(m => { const l = memberLastCI[m.user_id]; return !l || Math.floor((now - new Date(l)) / 86400000) >= 14; });

  // Attendance rate for my classes (30d)
  const attendanceRate = totalM > 0 ? Math.round((new Set(ci30.map(c => c.user_id)).size / totalM) * 100) : 0;

  // Classes this week (next 7 days) — show all since schedule is string-based
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= now).slice(0, 4);
  const activeChallenges = challenges.filter(c => c.status === 'active');

  // Spark: 7-day checkin trend
  const spark7 = Array.from({ length: 7 }, (_, i) =>
    checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 6-i)).getTime()).length
  );

  // Member milestones — close to round numbers
  const memberVisits = {};
  checkIns.forEach(c => { memberVisits[c.user_id] = (memberVisits[c.user_id] || 0) + 1; });
  const milestones = allMemberships.map(m => {
    const total = memberVisits[m.user_id] || 0;
    const next  = [5, 10, 25, 50, 100, 200].find(n => n > total);
    return { ...m, total, next, toNext: next ? next - total : 0 };
  }).filter(m => m.next && m.toNext <= 5).sort((a,b) => a.toNext - b.toNext).slice(0, 4);

  // Recent check-ins feed
  const recentFeed = [...checkIns].slice(0, 8).map(c => ({
    name: c.user_name || 'Member', user_id: c.user_id, time: c.check_in_date,
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <CoachKpiCard icon={Activity}    label="Today's Check-ins" value={todayCI.length}   sub={totalM > 0 ? `of ${totalM} members` : 'no members yet'} accentColor="#10b981" subColor={todayCI.length > 0 ? '#34d399' : '#64748b'} footerBar={totalM > 0 ? (todayCI.length / totalM) * 100 : 0}/>
          <CoachKpiCard icon={Users}       label="Active This Week"  value={activeW}          sub="members checked in" accentColor="#0ea5e9" trend={weekTrend} footerBar={totalM > 0 ? (activeW / totalM) * 100 : 0}/>
          <CoachKpiCard icon={BarChart2}   label="Attendance Rate"   value={`${attendanceRate}%`} sub="30-day average"  accentColor="#a78bfa" footerBar={attendanceRate}/>
          <CoachKpiCard icon={AlertCircle} label="At Risk"           value={atRisk.length}    sub="14+ days absent"   accentColor={atRisk.length > 0 ? '#ef4444' : '#10b981'} subColor={atRisk.length > 0 ? '#f87171' : '#34d399'}/>
        </div>

        {/* My Classes — schedule + performance */}
        <CoachCard accent="#a78bfa" title="My Classes" action="Manage" onAction={() => openModal('classes')}>
          <div style={{ padding: '14px 16px' }}>
            {myClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Dumbbell style={{ width: 22, height: 22, color: '#3a5070', margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: 0 }}>No classes in your schedule yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {myClasses.map((cls, i) => {
                  const c    = classColor(cls);
                  const attended = ci7.filter(ci => {
                    if (!cls.schedule) return false;
                    const h = new Date(ci.check_in_date).getHours();
                    const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
                    if (!match) return false;
                    let sh = parseInt(match[1]);
                    if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
                    return h === sh || h === sh + 1;
                  }).length;
                  return (
                    <div key={cls.id || i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${c}22`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: c, borderRadius: '12px 0 0 12px' }}/>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingLeft: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name || cls.title}</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            {cls.schedule && <span style={{ fontSize: 10, color: '#64748b' }}>{cls.schedule}</span>}
                            {cls.duration_minutes && <span style={{ fontSize: 10, color: '#3a5070' }}>{cls.duration_minutes}min</span>}
                            {cls.capacity && <span style={{ fontSize: 10, color: '#3a5070' }}>cap {cls.capacity}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: `${c}18`, color: c, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                          {(cls.class_type || cls.name || 'class').split(' ')[0].slice(0,8)}
                        </span>
                      </div>
                      {attended > 0 && (
                        <div style={{ marginTop: 8, paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ height: 3, flex: 1, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (attended / Math.max(cls.capacity || 20, 1)) * 100)}%`, background: `linear-gradient(90deg,${c},${c}88)`, borderRadius: 99 }}/>
                          </div>
                          <span style={{ fontSize: 9, color: '#64748b', flexShrink: 0 }}>{attended} this week</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CoachCard>

        {/* This week attendance chart */}
        <CoachCard accent="#38bdf8" title="Weekly Attendance" style={{ padding: 0 }}>
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64, marginTop: 14 }}>
              {spark7.map((val, i) => {
                const d = subDays(now, 6 - i);
                const isToday = startOfDay(d).getTime() === startOfDay(now).getTime();
                const maxVal = Math.max(...spark7, 1);
                const h = val === 0 ? 4 : Math.max(8, (val / maxVal) * 56);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: '100%', borderRadius: '4px 4px 2px 2px', height: h, background: isToday ? '#a78bfa' : val > 0 ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.05)', transition: 'height 0.4s ease', position: 'relative' }}>
                      {val > 0 && isToday && <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: '0 0 8px #a78bfa60' }}/>}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: isToday ? '#a78bfa' : '#3a5070' }}>{format(d, 'EEE')}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>This week: <strong style={{ color: '#f0f4f8' }}>{ci7.length}</strong> check-ins</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>Unique: <strong style={{ color: '#f0f4f8' }}>{new Set(ci7.map(c => c.user_id)).size}</strong> members</span>
            </div>
          </div>
        </CoachCard>

        {/* At-risk + upcoming events */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <CoachCard accent="#ef4444" title="At-Risk Members" action={atRisk.length > 0 ? `${atRisk.length} members` : undefined}>
            <div style={{ padding: '12px 16px' }}>
              {atRisk.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '14px 0' }}>
                  <CheckCircle style={{ width: 20, height: 20, color: '#34d399', margin: '0 auto 6px' }}/>
                  <p style={{ fontSize: 12, color: '#34d399', fontWeight: 700, margin: 0 }}>All members active</p>
                </div>
              ) : atRisk.slice(0, 5).map((m, i) => {
                const last = memberLastCI[m.user_id];
                const days = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < Math.min(atRisk.length,5)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color="#f87171"/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                      <div style={{ fontSize: 10, color: '#f87171' }}>{days !== null ? `${days}d absent` : 'Never visited'}</div>
                    </div>
                    <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', flexShrink: 0 }}>Reach</button>
                  </div>
                );
              })}
            </div>
          </CoachCard>

          <CoachCard accent="#34d399" title="Upcoming Events" action="+ New" onAction={() => openModal('event')}>
            <div style={{ padding: '12px 16px' }}>
              {upcomingEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '14px 0' }}>
                  <Calendar style={{ width: 20, height: 20, color: '#3a5070', margin: '0 auto 6px' }}/>
                  <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: 0 }}>No events scheduled</p>
                </div>
              ) : upcomingEvents.map((ev, i) => {
                const d = new Date(ev.event_date);
                const diff = Math.floor((d - now) / 86400000);
                return (
                  <div key={ev.id||i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < upcomingEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 8, padding: '4px 7px', textAlign: 'center', minWidth: 34 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d,'d')}</div>
                      <div style={{ fontSize: 7, fontWeight: 800, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d,'MMM')}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CoachCard>
        </div>

        {/* Active challenges */}
        {activeChallenges.length > 0 && (
          <CoachCard accent="#fbbf24" title="Active Challenges" action="+ New" onAction={() => openModal('challenge')}>
            <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {activeChallenges.slice(0, 4).map((ch, i) => {
                const start = new Date(ch.start_date), end = new Date(ch.end_date);
                const total = Math.max(1, Math.floor((end - start) / 86400000));
                const elapsed = Math.max(0, Math.floor((now - start) / 86400000));
                const pct = Math.min(100, Math.round((elapsed / total) * 100));
                const remaining = Math.max(0, total - elapsed);
                return (
                  <div key={ch.id||i} style={{ padding: '12px', borderRadius: 11, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.14)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Trophy style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ch.title}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 6 }}>
                      <span>{(ch.participants||[]).length} joined</span>
                      <span>{remaining}d left</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 99 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </CoachCard>
        )}
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Quick actions */}
        <CoachCard accent="#a78bfa" title="Quick Actions">
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {[
              { icon: QrCode,   label: 'Scan Check-in',  color: '#10b981', fn: () => openModal('qrScanner')  },
              { icon: FileText, label: 'Post Update',     color: '#38bdf8', fn: () => openModal('post')       },
              { icon: Calendar, label: 'Add Event',       color: '#34d399', fn: () => openModal('event')      },
              { icon: Trophy,   label: 'New Challenge',   color: '#fbbf24', fn: () => openModal('challenge')  },
              { icon: Dumbbell, label: 'My Classes',      color: '#a78bfa', fn: () => openModal('classes')    },
              { icon: BarChart2,label: 'Create Poll',     color: '#f87171', fn: () => openModal('poll')       },
            ].map(({ icon: Icon, label, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 10, height: 10, color }}/>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#d4e4f4', lineHeight: 1.2 }}>{label}</span>
              </button>
            ))}
          </div>
        </CoachCard>

        {/* Live feed */}
        <CoachCard accent="#38bdf8" title="Recent Check-ins">
          <div style={{ padding: '10px 14px' }}>
            {recentFeed.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '12px 0', margin: 0 }}>No activity yet</p>
            ) : recentFeed.map((a, i) => {
              const mins = Math.floor((now - new Date(a.time)) / 60000);
              const t = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: i < recentFeed.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <MiniAvatar name={a.name} src={avatarMap[a.user_id]} size={26} color="#38bdf8"/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize: 9, color: '#3a5070' }}>{t}</div>
                  </div>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981', flexShrink: 0 }}/>
                </div>
              );
            })}
          </div>
        </CoachCard>

        {/* Member milestones */}
        {milestones.length > 0 && (
          <CoachCard accent="#fbbf24" title="Close to Milestones">
            <div style={{ padding: '10px 14px' }}>
              {milestones.map((m, i) => (
                <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < milestones.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={30} color="#fbbf24"/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{m.toNext === 1 ? '1 visit to go!' : `${m.toNext} visits to go`}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{m.total}</div>
                    <div style={{ fontSize: 9, color: '#3a5070' }}>→ {m.next}</div>
                  </div>
                </div>
              ))}
            </div>
          </CoachCard>
        )}

        {/* My 30-day snapshot */}
        <CoachCard accent="#0ea5e9" title="30-Day Snapshot">
          <div style={{ padding: '10px 14px' }}>
            {[
              { label: 'Total check-ins',  value: ci30.length,                                         color: '#38bdf8' },
              { label: 'Unique members',   value: new Set(ci30.map(c => c.user_id)).size,               color: '#34d399' },
              { label: 'At-risk',          value: atRisk.length,                                        color: atRisk.length > 0 ? '#f87171' : '#34d399' },
              { label: 'Active challenges',value: activeChallenges.length,                              color: '#fbbf24' },
              { label: 'My classes',       value: myClasses.length,                                     color: '#a78bfa' },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}20`, borderRadius: 6, padding: '1px 8px' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </CoachCard>

        {/* Recent posts */}
        <CoachCard accent="#34d399" title="My Posts" action="+ New" onAction={() => openModal('post')}>
          <div style={{ padding: '10px 14px' }}>
            {posts.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>No posts yet</p>
            ) : posts.slice(0,4).map((p, i) => (
              <div key={p.id||i} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 5, fontSize: 11, fontWeight: 600, color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.content?.split('\n')[0] || p.title || 'Post'}
              </div>
            ))}
          </div>
        </CoachCard>
      </div>
    </div>
  );
}

// ── Coach Schedule Tab ────────────────────────────────────────────────────────
function TabCoachSchedule({ myClasses, checkIns, events, challenges, avatarMap, openModal, now }) {
  const [selectedDay, setSelectedDay] = useState(0); // 0 = today
  const [notes, setNotes]             = useState({});

  const week = Array.from({ length: 7 }, (_, i) => subDays(now, 3 - i)); // 3 days back + today + 3 ahead

  const dayCheckIns = (day) => checkIns.filter(c =>
    startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(day).getTime()
  );

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= subDays(now, 1))
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 6);

  // Performance: attendance per day for last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return {
      label: format(d, 'MMM d'),
      day: format(d, 'd'),
      count: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length,
    };
  });
  const maxCount = Math.max(...last30.map(d => d.count), 1);

  const selDay    = week[selectedDay];
  const selCIs    = dayCheckIns(selDay);
  const isToday   = startOfDay(selDay).getTime() === startOfDay(now).getTime();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Week strip */}
        <CoachCard accent="#a78bfa" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', marginBottom: 12 }}>Weekly View</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {week.map((d, i) => {
              const isT   = startOfDay(d).getTime() === startOfDay(now).getTime();
              const count = dayCheckIns(d).length;
              const active = i === selectedDay;
              return (
                <button key={i} onClick={() => setSelectedDay(i)} style={{ flex: 1, padding: '10px 4px', borderRadius: 12, border: active ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)', background: active ? 'rgba(167,139,250,0.1)' : isT ? 'rgba(255,255,255,0.03)' : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{format(d,'EEE')}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: active ? '#a78bfa' : isT ? '#f0f4f8' : '#64748b', lineHeight: 1 }}>{format(d,'d')}</div>
                  {count > 0 && (
                    <div style={{ marginTop: 5, fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#64748b' }}>{count}</div>
                  )}
                  {isT && !active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', margin: '4px auto 0' }}/>}
                </button>
              );
            })}
          </div>
        </CoachCard>

        {/* Selected day detail */}
        <CoachCard accent="#38bdf8" title={`${isToday ? 'Today' : format(selDay, 'EEEE, MMM d')} · ${selCIs.length} check-ins`}>
          <div style={{ padding: '12px 16px' }}>
            {myClasses.length === 0 && selCIs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a5070' }}>
                <Clock style={{ width: 20, height: 20, opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Nothing scheduled</p>
              </div>
            ) : (
              <>
                {/* Classes for this day */}
                {myClasses.map((cls, i) => {
                  const c = classColor(cls);
                  return (
                    <div key={cls.id||i} style={{ marginBottom: 12, padding: '12px 14px', borderRadius: 12, background: `${c}06`, border: `1px solid ${c}20` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Dumbbell style={{ width: 12, height: 12, color: c }}/>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{cls.schedule || 'No schedule set'}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: c, background: `${c}15`, borderRadius: 5, padding: '2px 7px' }}>
                          {selCIs.length} attended
                        </span>
                      </div>
                      {/* Session notes */}
                      <textarea
                        placeholder="Add session notes…"
                        value={notes[`${cls.id}-${format(selDay,'yyyy-MM-dd')}`] || ''}
                        onChange={e => setNotes(n => ({ ...n, [`${cls.id}-${format(selDay,'yyyy-MM-dd')}`]: e.target.value }))}
                        style={{ width: '100%', minHeight: 56, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                    </div>
                  );
                })}
                {/* Members who checked in */}
                {selCIs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Checked In</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selCIs.map((ci, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                          <MiniAvatar name={ci.user_name} src={avatarMap[ci.user_id]} size={20} color="#34d399"/>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#f0f4f8' }}>{ci.user_name || 'Member'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CoachCard>

        {/* 30-day attendance chart */}
        <CoachCard accent="#0ea5e9" title="30-Day Attendance" style={{ padding: 0 }}>
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 14 }}>
              {last30.map((d, i) => {
                const h = d.count === 0 ? 3 : Math.max(6, (d.count / maxCount) * 72);
                const isT = i === 29;
                return (
                  <div key={i} title={`${d.label}: ${d.count}`} style={{ flex: 1, height: h, borderRadius: '3px 3px 1px 1px', background: isT ? '#a78bfa' : d.count > 0 ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.04)', transition: 'height 0.3s ease' }}/>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 9, color: '#3a5070' }}>{format(subDays(now,29),'MMM d')}</span>
              <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>Today</span>
            </div>
          </div>
        </CoachCard>
      </div>

      {/* ── RIGHT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Quick actions */}
        <CoachCard accent="#a78bfa" title="Quick Actions">
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { icon: QrCode,    label: 'Scan Check-in',   color: '#10b981', fn: () => openModal('qrScanner')  },
              { icon: Calendar,  label: 'Schedule Event',  color: '#34d399', fn: () => openModal('event')      },
              { icon: Trophy,    label: 'New Challenge',   color: '#fbbf24', fn: () => openModal('challenge')  },
              { icon: Dumbbell,  label: 'Manage Classes',  color: '#a78bfa', fn: () => openModal('classes')    },
            ].map(({ icon: Icon, label, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 12, height: 12, color }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#d4e4f4' }}>{label}</span>
              </button>
            ))}
          </div>
        </CoachCard>

        {/* Upcoming events */}
        <CoachCard accent="#34d399" title="Upcoming Events" action="+ New" onAction={() => openModal('event')}>
          <div style={{ padding: '10px 14px' }}>
            {upcomingEvents.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>None scheduled</p>
            ) : upcomingEvents.map((ev, i) => {
              const d = new Date(ev.event_date);
              const diff = Math.floor((d - now) / 86400000);
              return (
                <div key={ev.id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < upcomingEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', borderRadius: 7, padding: '4px 6px', textAlign: 'center', minWidth: 30 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d,'d')}</div>
                    <div style={{ fontSize: 7, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d,'MMM')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: diff <= 2 ? '#f87171' : '#64748b' }}>
                      {diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CoachCard>

        {/* My classes summary */}
        <CoachCard accent="#a78bfa" title="My Classes">
          <div style={{ padding: '10px 14px' }}>
            {myClasses.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>No classes yet</p>
            ) : myClasses.map((cls, i) => {
              const c = classColor(cls);
              return (
                <div key={cls.id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < myClasses.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell style={{ width: 11, height: 11, color: c }}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{cls.schedule || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CoachCard>
      </div>
    </div>
  );
}

// ── Coach Members Tab ─────────────────────────────────────────────────────────
function TabCoachMembers({ allMemberships, checkIns, ci30, avatarMap, openModal, now }) {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [sort, setSort]         = useState('recentlyActive');
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes]       = useState({});

  const memberLastCI = {};
  checkIns.forEach(c => { if (!memberLastCI[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCI[c.user_id])) memberLastCI[c.user_id] = c.check_in_date; });

  const enriched = allMemberships.map(m => {
    const last    = memberLastCI[m.user_id];
    const daysAgo = last ? Math.floor((now - new Date(last)) / 86400000) : null;
    const visits  = ci30.filter(c => c.user_id === m.user_id).length;
    const visitsPrev = checkIns.filter(c => c.user_id === m.user_id && isWithinInterval(new Date(c.check_in_date), { start: subDays(now,60), end: subDays(now,30) })).length;
    const trend   = visitsPrev > 0 ? Math.round(((visits - visitsPrev) / visitsPrev) * 100) : 0;

    // Streak: consecutive days with a check-in
    const ciDays = new Set(checkIns.filter(c => c.user_id === m.user_id).map(c => startOfDay(new Date(c.check_in_date)).getTime()));
    let streak = 0;
    for (let i = 0; i <= 60; i++) {
      if (ciDays.has(startOfDay(subDays(now, i)).getTime())) streak++;
      else break;
    }

    const status = !last ? 'inactive' : daysAgo >= 14 ? 'at_risk' : daysAgo <= 2 ? 'active' : 'regular';

    // Check-in history last 14 days for spark
    const spark = Array.from({ length: 14 }, (_, i) =>
      checkIns.filter(c => c.user_id === m.user_id && startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now,13-i)).getTime()).length
    );

    // Total all-time visits
    const totalVisits = checkIns.filter(c => c.user_id === m.user_id).length;
    const nextMilestone = [5,10,25,50,100,200,500].find(n => n > totalVisits);

    return { ...m, last, daysAgo, visits, visitsPrev, trend, streak, status, spark, totalVisits, nextMilestone };
  });

  const STATUS_CFG = {
    active:   { color: '#34d399', label: 'Active',   bg: 'rgba(52,211,153,0.1)'  },
    regular:  { color: '#38bdf8', label: 'Regular',  bg: 'rgba(56,189,248,0.1)'  },
    at_risk:  { color: '#f87171', label: 'At Risk',  bg: 'rgba(248,113,113,0.1)' },
    inactive: { color: '#64748b', label: 'Inactive', bg: 'rgba(100,116,139,0.1)' },
  };

  const counts = {
    all:      enriched.length,
    active:   enriched.filter(m => m.status === 'active' || m.status === 'regular').length,
    at_risk:  enriched.filter(m => m.status === 'at_risk').length,
    inactive: enriched.filter(m => m.status === 'inactive').length,
  };

  const filtered = enriched
    .filter(m => {
      const matchSearch = !search || (m.user_name || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || (filter === 'active' ? (m.status === 'active' || m.status === 'regular') : m.status === filter);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sort === 'recentlyActive') {
        if (!a.last && !b.last) return 0;
        if (!a.last) return 1;
        if (!b.last) return -1;
        return new Date(b.last) - new Date(a.last);
      }
      if (sort === 'mostVisits') return b.visits - a.visits;
      if (sort === 'atRisk') {
        const order = { at_risk: 0, inactive: 1, regular: 2, active: 3 };
        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
      }
      if (sort === 'streak') return b.streak - a.streak;
      return 0;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <CoachKpiCard icon={Users}       label="My Members"      value={allMemberships.length}                                  sub="assigned to you"       accentColor="#0ea5e9"/>
        <CoachKpiCard icon={Activity}    label="Active This Week" value={new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date),{start:subDays(now,7),end:now})).map(c=>c.user_id)).size} sub="checked in"    accentColor="#10b981" footerBar={allMemberships.length > 0 ? (new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:subDays(now,7),end:now})).map(c=>c.user_id)).size / allMemberships.length)*100 : 0}/>
        <CoachKpiCard icon={AlertCircle} label="At Risk"          value={enriched.filter(m=>m.status==='at_risk').length}      sub="14+ days absent"       accentColor="#ef4444" subColor={enriched.filter(m=>m.status==='at_risk').length > 0 ? '#f87171' : '#34d399'}/>
        <CoachKpiCard icon={Flame}       label="Avg Streak"       value={enriched.length > 0 ? Math.round(enriched.reduce((s,m)=>s+m.streak,0)/enriched.length) : 0} sub="days consecutive" accentColor="#f59e0b"/>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          style={{ flex: 1, minWidth: 160, padding: '9px 14px', borderRadius: 10, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 12, outline: 'none' }}
        />
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {[{id:'all',label:'All'},{id:'active',label:'Active'},{id:'at_risk',label:'At Risk'},{id:'inactive',label:'Inactive'}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '5px 10px', borderRadius: 8, border: filter===f.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', background: filter===f.id ? '#0c1a2e' : 'transparent', color: filter===f.id ? '#f0f4f8' : '#3a5070', fontSize: 11, fontWeight: filter===f.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {f.label}{f.id!=='all' && counts[f.id] > 0 && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 800, color: filter===f.id ? '#a78bfa' : '#3a5070' }}>{counts[f.id]}</span>}
            </button>
          ))}
        </div>
        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 10px', borderRadius: 9, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <option value="recentlyActive">Recently Active</option>
          <option value="mostVisits">Most Visits</option>
          <option value="atRisk">At Risk First</option>
          <option value="streak">Longest Streak</option>
        </select>
      </div>

      {/* Member cards */}
      <CoachCard style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#3a5070' }}>
            <Users style={{ width: 24, height: 24, opacity: 0.3, margin: '0 auto 8px' }}/>
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No members found</p>
          </div>
        ) : filtered.map((m, i) => {
          const sc      = STATUS_CFG[m.status] || STATUS_CFG.regular;
          const pct     = Math.min(100, (m.visits / 20) * 100);
          const isExp   = expanded === (m.user_id || i);
          const sparkMax = Math.max(...m.spark, 1);

          return (
            <div key={m.user_id || i}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.12s', background: isExp ? 'rgba(167,139,250,0.04)' : 'transparent' }}
                onClick={() => setExpanded(isExp ? null : (m.user_id || i))}
                onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = 'transparent'; }}>

                {/* Avatar + status dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={36} color="#a78bfa"/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: sc.color, border: '2px solid #0c1a2e' }}/>
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: sc.color, background: sc.bg, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{sc.label}</span>
                    {m.streak >= 3 && <span style={{ fontSize: 9, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>🔥 {m.streak}d</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{m.visits} visits this month</span>
                    {m.daysAgo !== null && <span style={{ fontSize: 10, color: '#3a5070' }}>Last: {m.daysAgo === 0 ? 'today' : `${m.daysAgo}d ago`}</span>}
                    {m.trend !== 0 && <span style={{ fontSize: 10, color: m.trend > 0 ? '#34d399' : '#f87171' }}>{m.trend > 0 ? `↑${m.trend}%` : `↓${Math.abs(m.trend)}%`}</span>}
                  </div>
                </div>

                {/* Mini spark */}
                <div style={{ width: 52, flexShrink: 0 }}>
                  <svg viewBox="0 0 52 20" style={{ width: 52, height: 20 }}>
                    {m.spark.map((v, si) => {
                      const x = (si / (m.spark.length - 1)) * 48 + 2;
                      const y = 18 - (v / sparkMax) * 14;
                      return <circle key={si} cx={x} cy={y} r={1.5} fill={v > 0 ? sc.color : 'rgba(255,255,255,0.1)'}/>;
                    })}
                  </svg>
                </div>

                {/* Visit bar */}
                <div style={{ flexShrink: 0, width: 56 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', textAlign: 'right', marginBottom: 3 }}>{m.visits}<span style={{ fontSize: 9, color: '#3a5070', fontWeight: 400 }}>/mo</span></div>
                  <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${sc.color},${sc.color}88)`, borderRadius: 99 }}/>
                  </div>
                </div>

                {/* Message */}
                <button onClick={e => { e.stopPropagation(); openModal('post'); }} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', color: '#38bdf8', cursor: 'pointer', flexShrink: 0 }}>
                  <MessageCircle style={{ width: 11, height: 11 }}/>
                </button>

                {/* Expand arrow */}
                <ChevronRight style={{ width: 13, height: 13, color: '#3a5070', flexShrink: 0, transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}/>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div style={{ padding: '14px 16px 16px', background: 'rgba(167,139,250,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'Total Visits',   value: m.totalVisits,  color: '#a78bfa' },
                      { label: 'This Month',     value: m.visits,       color: '#38bdf8' },
                      { label: 'Streak',         value: `${m.streak}d`, color: '#f59e0b' },
                      { label: 'Next Milestone', value: m.nextMilestone ? `${m.nextMilestone} visits` : '—', color: '#34d399' },
                    ].map((s, si) => (
                      <div key={si} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: '#3a5070', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 14-day check-in dots */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Last 14 Days</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {m.spark.map((v, si) => (
                        <div key={si} title={format(subDays(now,13-si),'MMM d')} style={{ flex: 1, aspectRatio: '1', borderRadius: 5, background: v > 0 ? `${sc.color}cc` : 'rgba(255,255,255,0.05)', border: `1px solid ${v > 0 ? sc.color+'40' : 'rgba(255,255,255,0.06)'}`, maxWidth: 20 }}/>
                      ))}
                    </div>
                  </div>

                  {/* Coach note */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Coach Note</div>
                    <textarea
                      placeholder={`Add a note about ${m.user_name || 'this member'}…`}
                      value={notes[m.user_id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [m.user_id]: e.target.value }))}
                      style={{ width: '100%', minHeight: 64, padding: '9px 11px', borderRadius: 9, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CoachCard>
    </div>
  );
}

// ── GRADIENT OVERRIDE ─────────────────────────────────────────────────────────
const GRADIENT_OVERRIDE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900&family=DM+Mono:wght@400;500&display=swap');
  .dash-root, .dash-root * { font-family: 'DM Sans', system-ui, sans-serif !important; }
  .dash-root code, .dash-root .mono { font-family: 'DM Mono', monospace !important; }
  .dash-root {
    --bg: #060c18; --sidebar: #0a1628; --card: #0c1a2e; --card2: #0d1b2e;
    --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
    --text1: #f0f4f8; --text2: #8ba0b8; --text3: #3a5070;
    --cyan: #38bdf8; --green: #34d399; --red: #f87171; --purple: #a78bfa; --amber: #fbbf24;
  }
  .dash-root .card-hover { position: relative !important; overflow: hidden !important; transition: border-color 0.2s ease, transform 0.2s ease !important; }
  .dash-root .card-hover:hover { border-color: rgba(56,189,248,0.18) !important; transform: translateY(-1px) !important; }
  .dash-root .card-hover::before { content: ''; position: absolute; top: 0; left: 16px; right: 16px; height: 1px; background: linear-gradient(90deg, transparent, rgba(56,189,248,0.22), transparent); pointer-events: none; }
  .dash-root .stat-card { position: relative; overflow: hidden; border-radius: 14px !important; padding: 16px 18px !important; background: #0c1a2e !important; border: 1px solid rgba(255,255,255,0.07) !important; transition: border-color 0.2s ease, transform 0.15s ease !important; cursor: default; }
  .dash-root .stat-card:hover { border-color: rgba(56,189,248,0.2) !important; transform: translateY(-2px) !important; }
  .dash-root .stat-card::before { content: ''; position: absolute; top: 0; left: 16px; right: 16px; height: 1px; background: linear-gradient(90deg, transparent, rgba(56,189,248,0.28), transparent); pointer-events: none; }
  .dash-root .stat-num { font-size: 30px !important; font-weight: 900 !important; letter-spacing: -0.04em !important; line-height: 1 !important; color: #f0f4f8 !important; margin: 6px 0 3px !important; }
  .dash-root .stat-label { font-size: 9px !important; font-weight: 800 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; color: var(--text3) !important; display: flex !important; align-items: center !important; justify-content: space-between !important; }
  .dash-root .stat-icon { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dash-root .stat-sub { font-size: 11px !important; color: var(--text3) !important; display: flex !important; align-items: center !important; gap: 5px !important; }
  .dash-root .nav-item { border-left: 3px solid transparent !important; border-radius: 0 10px 10px 0 !important; padding-left: 9px !important; transition: all 0.14s ease !important; }
  .dash-root .nav-item:not(.active) { color: #5a7a96 !important; }
  .dash-root .nav-item:not(.active):hover { color: #c2d4e8 !important; background: rgba(255,255,255,0.04) !important; border-left-color: rgba(56,189,248,0.2) !important; }
  .dash-root .nav-item.active { background: rgba(56,189,248,0.08) !important; color: #38bdf8 !important; border-left-color: #38bdf8 !important; font-weight: 800 !important; }
  .dash-root .qa-btn { border-left: 2px solid transparent !important; transition: all 0.14s ease !important; }
  .dash-root .qa-btn:hover { background: rgba(255,255,255,0.06) !important; border-left-color: rgba(56,189,248,0.45) !important; transform: translateX(2px); }
  .dash-root .priority-row { border-left: 2px solid transparent !important; border-radius: 10px !important; transition: all 0.14s ease !important; }
  .dash-root .priority-row:hover { background: rgba(255,255,255,0.03) !important; border-left-color: rgba(56,189,248,0.35) !important; }
  .dash-root .filter-tab { color: #5a7a96 !important; transition: all 0.14s ease !important; }
  .dash-root .filter-tab:hover { color: #c2d4e8 !important; }
  .dash-root .filter-tab.active { color: #38bdf8 !important; background: rgba(56,189,248,0.1) !important; border-color: rgba(56,189,248,0.25) !important; }
  .dash-root .member-row { transition: background 0.12s ease !important; }
  .dash-root .member-row:hover { background: rgba(255,255,255,0.025) !important; cursor: pointer; }
  .dash-root .panel-glow::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent); pointer-events: none; }
  .dash-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .dash-root ::-webkit-scrollbar-track { background: transparent; }
  .dash-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  .dash-root ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
  .dash-root .pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .dash-root .pill-cyan  { background: rgba(56,189,248,0.1);  color: #38bdf8; }
  .dash-root .pill-green { background: rgba(52,211,153,0.1);  color: #34d399; }
  .dash-root .pill-red   { background: rgba(248,113,113,0.1); color: #f87171; }
  .dash-root .pill-amber { background: rgba(251,191,36,0.1);  color: #fbbf24; }
  @keyframes dashFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .dash-root .fade-up { animation: dashFadeUp 0.35s ease both; }
`;

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [tab, setTab]               = useState('overview');
  const [collapsed, setCollapsed]   = useState(false);
  const [isMobile, setIsMobile]     = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymOpen, setGymOpen]       = useState(false);
  const [modal, setModal]           = useState(null);
  const [showPoster, setShowPoster] = useState(false);
  const [chartRange, setChartRange] = useState(7);
  const [leaderboardView, setLeaderboardView] = useState('checkins');
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort]     = useState('recentlyActive');
  const [memberPage, setMemberPage]     = useState(1);
  const [memberPageSize]                = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const openModal  = (name) => setModal(name);
  const closeModal = ()     => setModal(null);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  useEffect(() => { if (currentUser && !currentUser.onboarding_completed) navigate(createPageUrl('Onboarding')); }, [currentUser, navigate]);

  const [roleOverride, setRoleOverride] = useState(() => localStorage.getItem('dashRoleOverride') || null);
  const toggleRole = () => {
    const next = roleOverride === 'coach' ? 'gym_owner' : roleOverride === 'gym_owner' ? null : 'coach';
    if (next) localStorage.setItem('dashRoleOverride', next); else localStorage.removeItem('dashRoleOverride');
    setRoleOverride(next);
  };
  const effectiveAccountType = roleOverride || currentUser?.account_type;
  const isCoach    = effectiveAccountType === 'coach';
  const isGymOwner = effectiveAccountType === 'gym_owner';
  const dashRole   = isCoach ? 'coach' : 'gym_owner';
  const roleLabel  = isCoach ? 'Coach' : 'Gym Owner';
  const NAV        = ALL_NAV.filter(item => item.roles.includes(dashRole));

  const { data: gyms = [], error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn:  async () => {
      if (isCoach) {
        const coachRecords = await base44.entities.Coach.filter({ user_email: currentUser.email });
        if (!coachRecords.length) return [];
        const gymIds = [...new Set(coachRecords.map(c => c.gym_id))];
        const results = await Promise.allSettled(gymIds.map(id => base44.entities.Gym.filter({ id })));
        return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      }
      return base44.entities.Gym.filter({ owner_email: currentUser.email });
    },
    enabled: !!currentUser?.email, retry: 3, staleTime: 5 * 60 * 1000,
  });

  const myGyms       = isCoach ? gyms : gyms.filter(g => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter(g => g.status === 'approved');
  const pendingGyms  = isCoach ? [] : myGyms.filter(g => g.status === 'pending');
  useEffect(() => { if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]); }, [approvedGyms, selectedGym]);
  useEffect(() => { const iv = setInterval(() => queryClient.invalidateQueries({ queryKey: ['ownerGyms'] }), 10000); return () => clearInterval(iv); }, [queryClient]);

  const qo = { staleTime: 3 * 60 * 1000, placeholderData: p => p };
  const on  = !!selectedGym;
  const { data: allMemberships = [] } = useQuery({ queryKey: ['memberships', selectedGym?.id], queryFn: () => base44.entities.GymMembership.filter({ gym_id: selectedGym.id, status: 'active' }), enabled: on && !!currentUser, ...qo });
  const { data: checkIns   = [] }     = useQuery({ queryKey: ['checkIns',   selectedGym?.id], queryFn: () => base44.entities.CheckIn.filter({ gym_id: selectedGym.id }, '-check_in_date', 2000), enabled: on, ...qo });
  const { data: rewards    = [] }     = useQuery({ queryKey: ['rewards',    selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: classes    = [] }     = useQuery({ queryKey: ['classes',    selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: coaches    = [] }     = useQuery({ queryKey: ['coaches',    selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: events     = [] }     = useQuery({ queryKey: ['events',     selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date'), enabled: on, ...qo });
  const { data: posts      = [] }     = useQuery({ queryKey: ['posts',      selectedGym?.id], queryFn: () => base44.entities.Post.filter({ member_id: selectedGym.id }, '-created_date', 20), enabled: on, ...qo });
  const { data: challenges = [] }     = useQuery({ queryKey: ['challenges', selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date'), enabled: on, ...qo });
  const { data: polls      = [] }     = useQuery({ queryKey: ['polls',      selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled: on, ...qo });

  const inv     = (...keys) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] }));
  const invGyms = () => queryClient.invalidateQueries({ queryKey: ['gyms'] });

  const createRewardM    = useMutation({ mutationFn: d  => base44.entities.Reward.create(d),     onSuccess: () => inv('rewards') });
  const deleteRewardM    = useMutation({ mutationFn: id => base44.entities.Reward.delete(id),    onSuccess: () => inv('rewards') });
  const createClassM     = useMutation({ mutationFn: d  => base44.entities.GymClass.create(d),   onSuccess: () => inv('classes') });
  const deleteClassM     = useMutation({ mutationFn: id => base44.entities.GymClass.delete(id),  onSuccess: () => inv('classes') });
  const updateClassM     = useMutation({ mutationFn: ({id,data}) => base44.entities.GymClass.update(id, data), onSuccess: () => inv('classes') });
  const createCoachM     = useMutation({ mutationFn: d  => base44.entities.Coach.create(d),      onSuccess: () => inv('coaches') });
  const deleteCoachM     = useMutation({ mutationFn: id => base44.entities.Coach.delete(id),     onSuccess: () => inv('coaches') });
  const updateGalleryM   = useMutation({ mutationFn: g  => base44.entities.Gym.update(selectedGym.id, { gallery: g }), onSuccess: () => { invGyms(); closeModal(); } });
  const updateGymM       = useMutation({ mutationFn: d  => base44.entities.Gym.update(selectedGym.id, d), onSuccess: () => { invGyms(); closeModal(); } });
  const createEventM     = useMutation({ mutationFn: d  => base44.entities.Event.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, attendees: 0 }), onSuccess: () => { inv('events'); closeModal(); } });
  const createChallengeM = useMutation({ mutationFn: d  => base44.entities.Challenge.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, participants: [], status: 'upcoming' }), onSuccess: () => { inv('challenges'); closeModal(); } });
  const banMemberM       = useMutation({ mutationFn: uid => base44.entities.Gym.update(selectedGym.id, { banned_members: [...(selectedGym?.banned_members||[]), uid] }), onSuccess: invGyms });
  const unbanMemberM     = useMutation({ mutationFn: uid => base44.entities.Gym.update(selectedGym.id, { banned_members: (selectedGym?.banned_members||[]).filter(id=>id!==uid) }), onSuccess: invGyms });
  const deleteGymM       = useMutation({ mutationFn: () => base44.entities.Gym.delete(selectedGym.id), onSuccess: () => { invGyms(); closeModal(); window.location.href = createPageUrl('Gyms'); } });
  const deleteAccountM   = useMutation({ mutationFn: () => base44.functions.invoke('deleteUserAccount'), onSuccess: () => { closeModal(); base44.auth.logout(); } });
  const createPollM      = useMutation({ mutationFn: d  => base44.entities.Poll.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, created_by: currentUser.id, voters: [] }), onSuccess: () => { inv('polls'); closeModal(); } });
  const deletePostM      = useMutation({ mutationFn: id => base44.entities.Post.delete(id),      onSuccess: () => inv('posts') });
  const deleteEventM     = useMutation({ mutationFn: id => base44.entities.Event.delete(id),     onSuccess: () => inv('events') });
  const deleteChallengeM = useMutation({ mutationFn: id => base44.entities.Challenge.delete(id), onSuccess: () => inv('challenges') });
  const deletePollM      = useMutation({ mutationFn: id => base44.entities.Poll.delete(id),      onSuccess: () => inv('polls') });

  const now = new Date();

  const memberUserIds = useMemo(() => { const s = new Set(); checkIns.forEach(c => { if (c.user_id) s.add(c.user_id); }); allMemberships.forEach(m => { if (m.user_id) s.add(m.user_id); }); return [...s].slice(0, 100); }, [checkIns, allMemberships]);
  const { data: memberUsers = [] } = useQuery({ queryKey: ['memberUsers', selectedGym?.id, memberUserIds.length], queryFn: async () => { if (!memberUserIds.length) return []; const r = await Promise.allSettled(memberUserIds.map(uid => base44.entities.User.filter({ id: uid }).then(x => x?.[0] || null))); return r.filter(x => x.status === 'fulfilled' && x.value).map(x => x.value); }, enabled: memberUserIds.length > 0 && on, staleTime: 10 * 60 * 1000 });
  const avatarMap = useMemo(() => { const m = {}; memberUsers.forEach(u => { if (u?.id) { const av = u.avatar_url || u.profile_picture || u.photo_url || null; if (av) m[u.id] = av; } }); return m; }, [memberUsers]);

  // Classes this coach teaches (match by name/email/id)
  const myClasses = useMemo(() => {
    if (!isCoach || !currentUser) return classes;
    return classes.filter(c =>
      c.instructor === currentUser.full_name ||
      c.instructor === currentUser.email ||
      c.coach_name === currentUser.full_name ||
      c.coach_email === currentUser.email ||
      c.coach_id === currentUser.id
    );
  }, [classes, currentUser, isCoach]);

  // ── Coach-scoped data: only what's relevant to this coach ─────────────────
  // Members who have ever checked in during one of the coach's class time slots
  const coachMemberIds = useMemo(() => {
    if (!isCoach) return null;
    // If coach has no classes, show all members so the dashboard isn't empty
    if (!myClasses.length) return new Set(allMemberships.map(m => m.user_id));
    // Build hour sets for each class schedule
    const classHours = new Set(
      myClasses.flatMap(cls => {
        const s = cls.schedule || '';
        const match = s.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return [];
        let h = parseInt(match[1]);
        if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        if (match[2].toLowerCase() === 'am' && h === 12) h = 0;
        return [h, h + 1];
      })
    );
    // Fall back to all members if we can't parse any schedule
    if (!classHours.size) return new Set(allMemberships.map(m => m.user_id));
    const ids = new Set();
    checkIns.forEach(c => {
      const h = new Date(c.check_in_date).getHours();
      if (classHours.has(h)) ids.add(c.user_id);
    });
    // Always include members with no check-ins so they're visible as at-risk
    allMemberships.forEach(m => { if (!ids.has(m.user_id)) ids.add(m.user_id); });
    return ids;
  }, [isCoach, myClasses, checkIns, allMemberships]);

  // Filtered versions passed to coach tabs — coaches only see their slice
  const coachMemberships = useMemo(() =>
    isCoach && coachMemberIds
      ? allMemberships.filter(m => coachMemberIds.has(m.user_id))
      : allMemberships,
    [isCoach, allMemberships, coachMemberIds]
  );
  const coachCheckIns = useMemo(() =>
    isCoach && coachMemberIds
      ? checkIns.filter(c => coachMemberIds.has(c.user_id))
      : checkIns,
    [isCoach, checkIns, coachMemberIds]
  );
  // Coach sees only their own posts, events, challenges, polls
  const coachPosts = useMemo(() =>
    isCoach
      ? posts.filter(p => p.author_id === currentUser?.id || p.created_by === currentUser?.id || !p.author_id)
      : posts,
    [isCoach, posts, currentUser]
  );
  const coachEvents = useMemo(() =>
    isCoach
      ? events.filter(e => e.created_by === currentUser?.id || e.coach_id === currentUser?.id || !e.created_by)
      : events,
    [isCoach, events, currentUser]
  );
  const coachChallenges = useMemo(() =>
    isCoach
      ? challenges.filter(c => c.created_by === currentUser?.id || c.coach_id === currentUser?.id || !c.created_by)
      : challenges,
    [isCoach, challenges, currentUser]
  );
  const coachPolls = useMemo(() =>
    isCoach
      ? polls.filter(p => p.created_by === currentUser?.id || !p.created_by)
      : polls,
    [isCoach, polls, currentUser]
  );
  // Coach-scoped ci30
  const coachCi30 = useMemo(() =>
    isCoach ? coachCheckIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 30), end: now })) : ci30,
    [isCoach, coachCheckIns, now, ci30]
  );

  const ci7              = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7),  end: now }));
  const ci30             = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,30), end: now }));
  const ciPrev30         = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,60), end: subDays(now,30) }));
  const todayCI          = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime()).length;
  const yesterdayCI      = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now,1)).getTime()).length;
  const todayVsYest      = yesterdayCI > 0 ? Math.round(((todayCI - yesterdayCI) / yesterdayCI) * 100) : 0;
  const totalMembers     = allMemberships.length;
  const activeThisWeek   = new Set(ci7.map(c => c.user_id)).size;
  const activeLastWeek   = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,14), end: subDays(now,7) })).map(c => c.user_id)).size;
  const weeklyChangePct  = activeLastWeek > 0 ? Math.round(((activeThisWeek - activeLastWeek) / activeLastWeek) * 100) : 0;
  const activeThisMonth  = new Set(ci30.map(c => c.user_id)).size;
  const retentionRate    = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
  const monthCiPer       = (() => { const acc={}; ci30.forEach(c=>{acc[c.user_id]=(acc[c.user_id]||0)+1;}); return Object.values(acc); })();
  const memberLastCheckIn = {};
  checkIns.forEach(c => { if (!memberLastCheckIn[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCheckIn[c.user_id])) memberLastCheckIn[c.user_id] = c.check_in_date; });
  const atRiskMembersList = allMemberships.filter(m => { const last = memberLastCheckIn[m.user_id]; if (!last) return true; return Math.floor((now - new Date(last)) / 86400000) >= 14; });
  const atRisk           = atRiskMembersList.length;
  const monthChangePct   = ciPrev30.length > 0 ? Math.round(((ci30.length - ciPrev30.length) / ciPrev30.length) * 100) : 0;
  const newSignUps       = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,30), end: now })).length;
  const newSignUpsPrev   = allMemberships.filter(m => isWithinInterval(new Date(m.join_date || m.created_date || now), { start: subDays(now,60), end: subDays(now,30) })).length;
  const cancelledEst     = Math.max(0, newSignUpsPrev - newSignUps);
  const sparkData7 = Array.from({ length: 7 }, (_, i) =>
    checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 6 - i)).getTime()).length
  );
  const monthGrowthData  = Array.from({length:6},(_,i)=>{ const e=subDays(now,i*30), s=subDays(e,30); return { label: format(e,'MMM'), value: new Set(checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).map(c=>c.user_id)).size }; }).reverse();
  const hourAcc = {};
  checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h]||0)+1; });
  const peakEntry    = Object.entries(hourAcc).sort(([,a],[,b])=>b-a)[0];
  const peakLabel    = peakEntry ? (() => { const h = parseInt(peakEntry[0]); return h < 12 ? `${h || 12}AM` : `${h===12?12:h-12}PM`; })() : null;
  const peakEndLabel = peakEntry ? (() => { const h = parseInt(peakEntry[0]) + 1; return h < 12 ? `${h}AM` : `${h===12?12:h-12}PM`; })() : null;
  const satCI    = checkIns.filter(c => new Date(c.check_in_date).getDay() === 6);
  const otherCI  = checkIns.filter(c => new Date(c.check_in_date).getDay() !== 6);
  const satAvg   = satCI.length / Math.max(Math.ceil(checkIns.length / 7), 1);
  const otherAvg = otherCI.length / Math.max(Math.ceil(checkIns.length / 7) * 6, 1);
  const satVsAvg = otherAvg > 0 ? Math.round(((satAvg - otherAvg) / otherAvg) * 100) : 0;
  const chartDays = useMemo(() => {
    const days = chartRange <= 7 ? 7 : chartRange <= 30 ? 30 : 90;
    return Array.from({length: days}, (_, i) => {
      const d = subDays(now, days - 1 - i);
      return { day: format(d, days <= 7 ? 'EEE' : 'MMM d'), value: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length };
    });
  }, [chartRange, checkIns]);
  const streaks = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => { acc[c.user_name] = (acc[c.user_name] || new Set()); acc[c.user_name].add(startOfDay(new Date(c.check_in_date)).getTime()); });
    return Object.entries(acc).map(([name, days]) => ({ name, streak: days.size })).sort((a,b)=>b.streak-a.streak).slice(0,5);
  }, [checkIns]);
  const recentActivity = useMemo(() => {
    return [...checkIns].slice(0, 8).map(c => ({ name: c.user_name || 'Member', user_id: c.user_id, action: 'checked in', time: c.check_in_date, color: '#10b981' }));
  }, [checkIns]);
  const priorities = [
    atRisk > 0        && { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: `${atRisk} Members Inactive`, action: 'Send Message', fn: () => setTab('members') },
    !challenges.some(c=>c.status==='active') && { icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'No Active Challenges', action: 'Create One', fn: () => openModal('challenge') },
    polls.length===0  && { icon: BarChart2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'No Active Polls', action: 'Create Poll', fn: () => openModal('poll') },
    monthChangePct < 0 && { icon: TrendingDown, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Attendance Down', action: 'View Insight', fn: () => setTab('analytics') },
  ].filter(Boolean).slice(0, 4);

  // ── Tab content — coach gets scoped data, owner gets full data ───────────
  const tabContent = {
    overview: isCoach
      ? <TabCoachOverview
          myClasses={myClasses}
          checkIns={coachCheckIns}
          allMemberships={coachMemberships}
          avatarMap={avatarMap}
          openModal={openModal}
          now={now}
          selectedGym={selectedGym}
          posts={coachPosts}
          events={coachEvents}
          challenges={coachChallenges}
          polls={coachPolls}
        />
      : <TabOverview
          todayCI={todayCI} yesterdayCI={yesterdayCI} todayVsYest={todayVsYest}
          activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate}
          newSignUps={newSignUps} monthChangePct={monthChangePct} ciPrev30={ciPrev30}
          atRisk={atRisk} sparkData={sparkData7} monthGrowthData={monthGrowthData}
          cancelledEst={cancelledEst} peakLabel={peakLabel} peakEndLabel={peakEndLabel}
          peakEntry={peakEntry} satVsAvg={satVsAvg} monthCiPer={monthCiPer}
          checkIns={checkIns} allMemberships={allMemberships} challenges={challenges}
          posts={posts} polls={polls} classes={classes} coaches={coaches}
          streaks={streaks} recentActivity={recentActivity} chartDays={chartDays}
          chartRange={chartRange} setChartRange={setChartRange} avatarMap={avatarMap}
          priorities={priorities} selectedGym={selectedGym} now={now}
          openModal={openModal} setTab={setTab} Spark={Spark} Delta={Delta}
        />,
    schedule: isCoach
      ? <TabCoachSchedule
          myClasses={myClasses}
          checkIns={coachCheckIns}
          events={coachEvents}
          challenges={coachChallenges}
          avatarMap={avatarMap}
          openModal={openModal}
          now={now}
        />
      : null,
    members: isCoach
      ? <TabCoachMembers
          allMemberships={coachMemberships}
          checkIns={coachCheckIns}
          ci30={coachCi30}
          avatarMap={avatarMap}
          openModal={openModal}
          now={now}
        />
      : <TabMembersComponent
          allMemberships={allMemberships} checkIns={checkIns} ci30={ci30}
          memberLastCheckIn={memberLastCheckIn} selectedGym={selectedGym}
          atRisk={atRisk} atRiskMembersList={atRiskMembersList}
          retentionRate={retentionRate} totalMembers={totalMembers}
          activeThisWeek={activeThisWeek} newSignUps={newSignUps}
          weeklyChangePct={weeklyChangePct} avatarMap={avatarMap}
          memberFilter={memberFilter} setMemberFilter={setMemberFilter}
          memberSearch={memberSearch} setMemberSearch={setMemberSearch}
          memberSort={memberSort} setMemberSort={setMemberSort}
          memberPage={memberPage} setMemberPage={setMemberPage}
          memberPageSize={memberPageSize} selectedRows={selectedRows}
          setSelectedRows={setSelectedRows} openModal={openModal} now={now}
          Spark={Spark} Delta={Delta}
        />,
    content: <TabContentComponent
      events={isCoach ? coachEvents : events}
      challenges={isCoach ? coachChallenges : challenges}
      polls={isCoach ? coachPolls : polls}
      posts={isCoach ? coachPosts : posts}
      classes={isCoach ? myClasses : classes}
      checkIns={isCoach ? coachCheckIns : checkIns}
      ci30={isCoach ? coachCi30 : ci30}
      avatarMap={avatarMap}
      leaderboardView={leaderboardView}
      setLeaderboardView={setLeaderboardView}
      openModal={openModal}
      now={now}
      onDeletePost={id=>deletePostM.mutate(id)}
      onDeleteEvent={id=>deleteEventM.mutate(id)}
      onDeleteChallenge={id=>deleteChallengeM.mutate(id)}
      onDeleteClass={id=>deleteClassM.mutate(id)}
      onDeletePoll={id=>deletePollM.mutate(id)}
    />,
    analytics: <TabAnalyticsComponent
      checkIns={isCoach ? coachCheckIns : checkIns}
      ci30={isCoach ? coachCi30 : ci30}
      totalMembers={isCoach ? coachMemberships.length : totalMembers}
      monthCiPer={monthCiPer}
      monthChangePct={monthChangePct}
      monthGrowthData={monthGrowthData}
      retentionRate={retentionRate}
      activeThisMonth={activeThisMonth}
      newSignUps={newSignUps}
      atRisk={atRisk}
      gymId={selectedGym?.id}
      sparkData={sparkData7}
      Spark={Spark}
      Delta={Delta}
    />,
    gym: <TabGym selectedGym={selectedGym} classes={classes} coaches={coaches} openModal={openModal}/>,
  };

  // ── Splash screens ────────────────────────────────────────────────────────
  const Splash = ({ children }) => (
    <div className="dash-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060c18' }}>
      <div style={{ background: 'rgba(12,26,46,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>{children}</div>
    </div>
  );
  if (gymsError) return <Splash><X style={{width:28,height:28,color:'#ef4444',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:900,marginBottom:8}}>Error</h2><p style={{color:'#5a7a96',fontSize:13,marginBottom:20}}>{gymsError.message}</p><button onClick={()=>window.location.reload()} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Retry</button></Splash>;
  if (approvedGyms.length===0 && pendingGyms.length>0) return <Splash><Clock style={{width:28,height:28,color:'#f59e0b',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:900,marginBottom:8}}>Pending Approval</h2><p style={{color:'#5a7a96',fontSize:13,marginBottom:20}}>Your gym <strong style={{color:'#fbbf24'}}>{pendingGyms[0].name}</strong> is under review.</p><Link to={createPageUrl('Home')}><button style={{background:'rgba(255,255,255,0.07)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Back to Home</button></Link></Splash>;
  if (myGyms.length===0 && !isCoach) return <Splash><Dumbbell style={{width:28,height:28,color:'#38bdf8',margin:'0 auto 12px'}}/><h2 style={{color:'#f1f5f9',fontWeight:900,marginBottom:8}}>No Gyms</h2><p style={{color:'#5a7a96',fontSize:13,marginBottom:20}}>Register your gym to get started.</p><Link to={createPageUrl('GymSignup')}><button style={{background:'linear-gradient(135deg,#0ea5e9,#06b6d4)',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontWeight:700,cursor:'pointer'}}>Register Your Gym</button></Link></Splash>;

  // ── SHARED MODALS ────────────────────────────────────────────────────────
  const sharedModals = (
    <>
      <ManageClassesModal    open={modal==='classes'}    onClose={closeModal} classes={classes}   onCreateClass={d=>createClassM.mutate(d)}    onUpdateClass={(id,data)=>updateClassM.mutate({id,data})} onDeleteClass={id=>deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending||updateClassM.isPending}/>
      <CreateGymOwnerPostModal open={modal==='post'}     onClose={closeModal} gym={selectedGym}   onSuccess={()=>inv('posts')}/>
      <CreateEventModal      open={modal==='event'}      onClose={closeModal} onSave={d=>createEventM.mutate(d)} gym={selectedGym} isLoading={createEventM.isPending}/>
      <CreateChallengeModal  open={modal==='challenge'}  onClose={closeModal} gyms={gyms}         onSave={d=>createChallengeM.mutate(d)}       isLoading={createChallengeM.isPending}/>
      <QRScanner             open={modal==='qrScanner'}  onClose={closeModal}/>
      <CreatePollModal       open={modal==='poll'}       onClose={closeModal} onSave={d=>createPollM.mutate(d)} isLoading={createPollM.isPending}/>
      {/* Owner-only modals */}
      {isGymOwner && <>
        <ManageRewardsModal    open={modal==='rewards'}    onClose={closeModal} rewards={rewards}   onCreateReward={d=>createRewardM.mutate(d)}  onDeleteReward={id=>deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending}/>
        <ManageCoachesModal    open={modal==='coaches'}    onClose={closeModal} coaches={coaches}   onCreateCoach={d=>createCoachM.mutate(d)}    onDeleteCoach={id=>deleteCoachM.mutate(id)}  gym={selectedGym} isLoading={createCoachM.isPending}/>
        <EditGymPhotoModal     open={modal==='heroPhoto'}  onClose={closeModal} gym={selectedGym}   onSave={url=>updateGymM.mutate({image_url:url})} isLoading={updateGymM.isPending}/>
        <ManageGymPhotosModal  open={modal==='photos'}     onClose={closeModal} gallery={selectedGym?.gallery||[]} onSave={g=>updateGalleryM.mutate(g)} isLoading={updateGalleryM.isPending}/>
        <ManageMembersModal    open={modal==='members'}    onClose={closeModal} gym={selectedGym}   onBanMember={id=>banMemberM.mutate(id)}      onUnbanMember={id=>unbanMemberM.mutate(id)}/>
        <ManageEquipmentModal  open={modal==='equipment'}  onClose={closeModal} equipment={selectedGym?.equipment||[]} onSave={e=>updateGymM.mutate({equipment:e})} isLoading={updateGymM.isPending}/>
        <ManageAmenitiesModal  open={modal==='amenities'}  onClose={closeModal} amenities={selectedGym?.amenities||[]} onSave={a=>updateGymM.mutate({amenities:a})} isLoading={updateGymM.isPending}/>
        <EditBasicInfoModal    open={modal==='editInfo'}   onClose={closeModal} gym={selectedGym}   onSave={d=>updateGymM.mutate(d)} isLoading={updateGymM.isPending}/>
        <AlertDialog open={modal==='deleteGym'} onOpenChange={v=>!v&&closeModal()}>
          <AlertDialogContent style={{background:'rgba(4,10,22,0.96)',backdropFilter:'blur(20px)',border:'1px solid rgba(239,68,68,0.25)'}} className="max-w-md">
            <AlertDialogHeader><AlertDialogTitle style={{color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:17,height:17,color:'#f87171'}}/>Delete Gym Permanently?</AlertDialogTitle><AlertDialogDescription style={{color:'#5a7a96',fontSize:13}}>Deletes <strong style={{color:'#f1f5f9'}}>{selectedGym?.name}</strong> and all its data. <span style={{color:'#f87171',fontWeight:700}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.09)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteGymM.mutate()} disabled={deleteGymM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteGymM.isPending?'Deleting…':'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={modal==='deleteAccount'} onOpenChange={v=>!v&&closeModal()}>
          <AlertDialogContent style={{background:'rgba(4,10,22,0.96)',backdropFilter:'blur(20px)',border:'1px solid rgba(239,68,68,0.25)'}} className="max-w-md">
            <AlertDialogHeader><AlertDialogTitle style={{color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Trash2 style={{width:17,height:17,color:'#f87171'}}/>Delete Account?</AlertDialogTitle><AlertDialogDescription style={{color:'#5a7a96',fontSize:13}}>Deletes your account, all gyms, and personal data. <span style={{color:'#f87171',fontWeight:700}}>Cannot be undone.</span></AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel style={{background:'rgba(255,255,255,0.05)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.09)'}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>deleteAccountM.mutate()} disabled={deleteAccountM.isPending} style={{background:'#dc2626',color:'#fff'}}>{deleteAccountM.isPending?'Deleting…':'Delete Account'}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <GymJoinPoster gym={selectedGym} open={showPoster} onClose={() => setShowPoster(false)}/>
      </>}
    </>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="dash-root" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#060c18', overflow: 'hidden' }}>
      <style>{DASH_STYLE}</style>
      <style>{GRADIENT_OVERRIDE}</style>
      <header style={{ flexShrink: 0, background: '#080f1e', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: isCoach ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isCoach ? <Star style={{ width: 14, height: 14, color: '#fff' }}/> : <Dumbbell style={{ width: 14, height: 14, color: '#fff' }}/>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.02em', lineHeight: 1 }}>{selectedGym?.name || 'Dashboard'}</div>
            <div style={{ fontSize: 9, color: isCoach ? '#a78bfa' : '#38bdf8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>{roleLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={toggleRole} style={{ background: isCoach ? 'rgba(167,139,250,0.1)' : 'rgba(56,189,248,0.08)', border: `1px solid ${isCoach ? 'rgba(167,139,250,0.25)' : 'rgba(56,189,248,0.2)'}`, color: isCoach ? '#a78bfa' : '#38bdf8', borderRadius: 8, fontSize: 10, fontWeight: 800, padding: '4px 8px', cursor: 'pointer' }}>
            {isCoach ? '🎓' : '🏢'}
          </button>
          {atRisk > 0 && (
            <button onClick={() => setTab('members')} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '4px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle style={{ width: 9, height: 9 }}/>{atRisk}
            </button>
          )}
          <button onClick={() => openModal('qrScanner')} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.16)', color: '#38bdf8', cursor: 'pointer' }}>
            <QrCode style={{ width: 14, height: 14 }}/>
          </button>
          <button onClick={() => openModal('post')} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4f8', cursor: 'pointer' }}>
            <Plus style={{ width: 14, height: 14 }}/>
          </button>
        </div>
      </header>
      <main style={{ flex: 1, overflow: 'auto', padding: '14px 12px 8px', WebkitOverflowScrolling: 'touch' }}>
        {tabContent[tab] || tabContent.overview}
      </main>
      <nav style={{ flexShrink: 0, background: '#080f1e', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(item => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', color: active ? (isCoach ? '#a78bfa' : '#38bdf8') : '#3a5070', transition: 'color 0.12s' }}>
              <item.icon style={{ width: 18, height: 18 }}/>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}>{item.label}</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isCoach ? '#a78bfa' : '#38bdf8', boxShadow: `0 0 6px ${isCoach ? '#a78bfa' : '#38bdf8'}` }}/>}
            </button>
          );
        })}
      </nav>
      {sharedModals}
    </div>
  );

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  const accentColor = isCoach ? '#a78bfa' : '#38bdf8';

  return (
    <div className="dash-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#060c18' }}>
      <style>{DASH_STYLE}</style>
      <style>{GRADIENT_OVERRIDE}</style>

      {/* ─── SIDEBAR ── */}
      <aside style={{ width: collapsed ? 60 : 224, flexShrink: 0, height: '100%', overflow: 'hidden', background: '#080f1e', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding: collapsed ? '18px 0' : '18px 14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isCoach ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${isCoach ? 'rgba(167,139,250,0.3)' : 'rgba(14,165,233,0.3)'}` }}>
              {isCoach ? <Star style={{ width: 16, height: 16, color: '#fff' }}/> : <Dumbbell style={{ width: 16, height: 16, color: '#fff' }}/>}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.03em' }}>{selectedGym?.name || 'Dashboard'}</div>
                <div style={{ fontSize: 9, color: accentColor, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>{roleLabel}</div>
              </div>
            )}
          </div>
          {!collapsed && approvedGyms.length > 1 && (
            <div style={{ position: 'relative', marginTop: 10 }}>
              <button onClick={() => setGymOpen(o=>!o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#8ba0b8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGym?.name}</span>
                <ChevronDown style={{ width: 12, height: 12, flexShrink: 0, transform: gymOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
              </button>
              {gymOpen && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '110%', borderRadius: 10, overflow: 'hidden', background: '#060c18', border: `1px solid ${accentColor}33`, zIndex: 20, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                  {approvedGyms.map(g => <button key={g.id} onClick={() => { setSelectedGym(g); setGymOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12, fontWeight: 700, background: selectedGym?.id===g.id?`${accentColor}12`:'transparent', color: selectedGym?.id===g.id?accentColor:'#8ba0b8', border: 'none', cursor: 'pointer' }}>{g.name}</button>)}
                </div>
              )}
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {!collapsed && <div style={{ fontSize: 9, fontWeight: 800, color: '#1e3550', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 16px', marginBottom: 6 }}>Menu</div>}
          {NAV.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, padding: collapsed ? '11px 0' : '9px 14px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', cursor: 'pointer', marginBottom: 1, fontSize: 13, background: 'transparent',
                  ...(active ? { background: `${accentColor}12 !important`, color: `${accentColor} !important`, borderLeftColor: `${accentColor} !important` } : {}) }}>
                <item.icon style={{ width: 15, height: 15, flexShrink: 0 }}/>
                {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                {!collapsed && active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}`, flexShrink: 0 }}/>}
              </button>
            );
          })}
        </nav>

        {!collapsed && isGymOwner && (
          <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <Link to={createPageUrl('Plus')}>
              <div style={{ padding: '12px 13px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(139,92,246,0.14),rgba(236,72,153,0.07))', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.35),transparent)' }}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}><Crown style={{ width: 12, height: 12, color: '#a78bfa' }}/><span style={{ fontSize: 12, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.02em' }}>Retention Pro</span></div>
                <div style={{ fontSize: 10, color: '#7c5db8', fontWeight: 600 }}>Advanced analytics · From £49.99/mo</div>
              </div>
            </Link>
          </div>
        )}

        {!collapsed && isCoach && (
          <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <div style={{ padding: '11px 13px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(124,58,237,0.06))', border: '1px solid rgba(167,139,250,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}><Star style={{ width: 11, height: 11, color: '#a78bfa' }}/><span style={{ fontSize: 11, fontWeight: 800, color: '#f0f4f8' }}>Coach View</span></div>
              <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>Viewing {selectedGym?.name}</div>
            </div>
          </div>
        )}

        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div style={{ padding: '10px 10px 4px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#1e3550', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 4 }}>Links</div>
              {[
                { icon: Eye,   label: 'View Gym Page', to: createPageUrl('GymCommunity')+'?id='+selectedGym?.id },
                { icon: Users, label: 'Member View',   to: createPageUrl('Home') },
              ].map((l, i) => (
                <Link key={i} to={l.to}>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', border: 'none', background: 'transparent', color: '#3a5070', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 8, marginBottom: 1, transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#8ba0b8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#3a5070'}>
                    <l.icon style={{ width: 13, height: 13 }}/><span>{l.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
          {collapsed && (
            <div style={{ padding: '8px 0' }}>
              {[{ icon: Eye, to: createPageUrl('GymCommunity')+'?id='+selectedGym?.id }, { icon: Users, to: createPageUrl('Home') }].map((l, i) => (
                <Link key={i} to={l.to}><button style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '9px 0', border: 'none', background: 'transparent', color: '#3a5070', cursor: 'pointer' }}><l.icon style={{ width: 14, height: 14 }}/></button></Link>
              ))}
            </div>
          )}
          <div style={{ padding: collapsed ? '4px 0 14px' : '0 10px 14px' }}>
            <button onClick={() => base44.auth.logout()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: collapsed ? '9px 0' : '7px 8px', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', background: 'transparent', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, opacity: 0.7, transition: 'opacity 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
              <LogOut style={{ width: 13, height: 13 }}/>{!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', background: '#080f1e', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent 0%,${accentColor}18 30%,${accentColor}18 70%,transparent 100%)`, pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setCollapsed(o=>!o)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#5a7a96', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#f0f4f8'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#5a7a96'; }}>
              <Menu style={{ width: 14, height: 14 }}/>
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {{ members:'Members', content:'Content', analytics:'Analytics', gym:'Settings', schedule:'Schedule' }[tab] || selectedGym?.name || 'Dashboard'}
              </div>
              <div style={{ fontSize: 11, color: '#1e3a54', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                {tab === 'members'
                  ? <><span style={{ color: accentColor, fontWeight: 800 }}>{allMemberships.length}</span><span> members · {selectedGym?.name}</span></>
                  : <><span>{format(now, 'EEEE, d MMMM yyyy')}</span><span style={{ color: '#112030' }}>·</span><Sun style={{ width: 10, height: 10 }}/><span>18°C</span></>
                }
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGymOwner && selectedGym?.join_code && (
              <button onClick={() => setShowPoster(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 8, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                <QrCode style={{ width: 11, height: 11 }}/><span style={{ fontFamily: 'DM Mono,monospace', letterSpacing: '0.12em' }}>{selectedGym.join_code}</span><span style={{ fontSize: 9, opacity: 0.55 }}>· Flyer</span>
              </button>
            )}
            {atRisk > 0 && (
              <button onClick={() => setTab('members')} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle style={{ width: 11, height: 11 }}/>{atRisk} at risk
              </button>
            )}
            <button onClick={() => openModal('qrScanner')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}28`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background=`${accentColor}20`}
              onMouseLeave={e => e.currentTarget.style.background=`${accentColor}12`}>
              <QrCode style={{ width: 13, height: 13 }}/> Scan QR
            </button>
            <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: '#f0f4f8', border: '1px solid rgba(255,255,255,0.09)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
              <Plus style={{ width: 13, height: 13 }}/> New Post
            </button>
            {/* Role toggle */}
            <button onClick={toggleRole} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: isCoach ? 'rgba(167,139,250,0.1)' : 'rgba(56,189,248,0.08)', border: `1px solid ${isCoach ? 'rgba(167,139,250,0.25)' : 'rgba(56,189,248,0.2)'}`, color: isCoach ? '#a78bfa' : '#38bdf8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              {isCoach ? '🎓 Coach' : '🏢 Owner'} <span style={{ opacity: 0.5, fontSize: 9 }}>preview</span>
            </button>
            <Link to={createPageUrl('NotificationsHub')}>
              <button style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#5a7a96', cursor: 'pointer', position: 'relative', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#f0f4f8'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#5a7a96'; }}>
                <Bell style={{ width: 13, height: 13 }}/>
                {atRisk > 0 && <div style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #080f1e' }}/>}
              </button>
            </Link>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 9px 4px 5px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: isCoach ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>
                {(currentUser?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c2d4e8' }}>{(currentUser?.full_name || currentUser?.email || 'User').split(' ')[0]}</span>
              <ChevronDown style={{ width: 10, height: 10, color: '#3a5070' }}/>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'hidden', padding: '20px 22px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1600, overflowY: 'auto' }}>
            {tabContent[tab] || tabContent.overview}
          </div>
        </main>
      </div>

      {sharedModals}
    </div>
  );
}