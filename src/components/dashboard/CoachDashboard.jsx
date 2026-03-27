import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfDay, differenceInDays } from 'date-fns';
import {
  QrCode, Users, TrendingUp, AlertCircle, MessageSquare,
  Calendar, Dumbbell, Clock, ChevronDown, ChevronUp, Check,
  Zap, Bell, ArrowUpRight, ArrowDownLeft, Minus, BarChart3,
} from 'lucide-react';
import { CoachCard, MiniAvatar } from './CoachHelpers';

const T = {
  bg:     '#080e18',
  card:   '#0c1a2e',
  border: 'rgba(255,255,255,0.07)',
  text1:  '#f0f4f8',
  text2:  '#94a3b8',
  text3:  '#3a5070',
  green:  '#10b981',
  blue:   '#3b82f6',
  amber:  '#f59e0b',
  purple:'#a78bfa',
};

// Quick card helper
function MetricCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
        {trend != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: trend > 0 ? T.green : trend < 0 ? '#f87171' : T.text3 }}>
            {trend > 0 ? <ArrowUpRight style={{ width: 10, height: 10 }} /> : trend < 0 ? <ArrowDownLeft style={{ width: 10, height: 10 }} /> : <Minus style={{ width: 10, height: 10 }} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: T.text1, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 10, color: T.text3, marginTop: 4, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: T.text2, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// Status pill
function StatusPill({ label, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}25`, borderRadius: 6, padding: '2px 7px' }}>
      {label}
    </span>
  );
}

// Section header
function SectionHeader({ label, icon: Icon, color = T.purple }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: color }} />
      <span style={{ fontSize: 13, fontWeight: 800, color: T.text1, letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}

export default function CoachDashboard({
  myClasses = [], checkIns = [], allMemberships = [], avatarMap = {}, openModal, now = new Date()
}) {
  const [expandedClass, setExpandedClass] = useState(null);

  // Quick stats
  const todayCheckIns = useMemo(() => {
    const today = startOfDay(now);
    return checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === today.getTime());
  }, [checkIns, now]);

  const yesterdayCheckIns = useMemo(() => {
    const yesterday = startOfDay(subDays(now, 1));
    return checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === yesterday.getTime());
  }, [checkIns, now]);

  const weekCheckIns = useMemo(() => {
    const weekAgo = startOfDay(subDays(now, 7));
    return checkIns.filter(c => {
      const d = startOfDay(new Date(c.check_in_date));
      return d.getTime() >= weekAgo.getTime() && d.getTime() <= startOfDay(now).getTime();
    });
  }, [checkIns, now]);

  const trend = yesterdayCheckIns.length > 0 ? Math.round(((todayCheckIns.length - yesterdayCheckIns.length) / yesterdayCheckIns.length) * 100) : 0;

  // Member insights
  const memberStatus = useMemo(() => {
    const last30 = subDays(now, 30);
    const active = allMemberships.filter(m => {
      const lastCI = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      if (!lastCI) return false;
      return differenceInDays(now, new Date(lastCI.check_in_date)) <= 14;
    });
    const atRisk = allMemberships.filter(m => {
      const lastCI = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      if (!lastCI) return false;
      const days = differenceInDays(now, new Date(lastCI.check_in_date));
      return days > 14 && days <= 30;
    });
    return { active: active.length, atRisk: atRisk.length };
  }, [allMemberships, checkIns, now]);

  // Classes with attendance
  const classesWithAttendance = useMemo(() => {
    return myClasses.map(cls => {
      const classCI = todayCheckIns.filter(c => {
        if (!cls.schedule) return false;
        const match = cls.schedule.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
        if (!match) return false;
        let h = parseInt(match[1]);
        if (match[3]?.toLowerCase() === 'pm' && h !== 12) h += 12;
        const ciHour = new Date(c.check_in_date).getHours();
        return ciHour === h || ciHour === h + 1;
      });
      const capacity = cls.max_capacity || 20;
      const booked = cls.bookings?.length || 0;
      const fill = Math.min(100, Math.round((classCI.length > 0 ? classCI.length : booked / capacity) * 100));
      return { ...cls, attended: classCI.length, booked, fill };
    });
  }, [myClasses, todayCheckIns]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
      
      {/* ════ LEFT ════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ─── TODAY AT A GLANCE ─── */}
        <div>
          <SectionHeader label="Today at a Glance" icon={Clock} color={T.blue} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <MetricCard icon={Users} label="Check-ins" value={todayCheckIns.length} sub="today" color={T.blue} trend={trend} />
            <MetricCard icon={Dumbbell} label="Classes" value={classesWithAttendance.length} sub="today" color={T.purple} />
            <MetricCard icon={BarChart3} label="Avg Fill" value={classesWithAttendance.length > 0 ? Math.round(classesWithAttendance.reduce((s, c) => s + c.fill, 0) / classesWithAttendance.length) + '%' : '—'} sub="this week" color={T.amber} />
            <MetricCard icon={TrendingUp} label="Active Members" value={memberStatus.active} sub={`of ${allMemberships.length}`} color={T.green} />
          </div>
        </div>

        {/* ─── CLASSES TODAY ─── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <SectionHeader label="Classes Today" icon={Dumbbell} color={T.blue} />
            <button onClick={() => openModal('classes')} style={{ fontSize: 10, fontWeight: 700, color: T.blue, background: `${T.blue}14`, border: `1px solid ${T.blue}28`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>+ Add Class</button>
          </div>
          
          {classesWithAttendance.length === 0 ? (
            <div style={{ borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, padding: '28px', textAlign: 'center' }}>
              <Clock style={{ width: 20, height: 20, color: T.text3, margin: '0 auto 10px' }}/>
              <p style={{ fontSize: 12, color: T.text3, fontWeight: 600, margin: 0 }}>No classes scheduled today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classesWithAttendance.map(cls => {
                const isOpen = expandedClass === cls.id;
                const fillColor = cls.fill >= 80 ? T.green : cls.fill >= 50 ? T.amber : T.blue;
                
                return (
                  <div key={cls.id} style={{ borderRadius: 14, background: T.card, border: `1px solid ${isOpen ? T.blue : T.border}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    
                    {/* Header */}
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', cursor: 'pointer' }} onClick={() => setExpandedClass(isOpen ? null : cls.id)}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.blue}66)` }}/>
                      
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${T.blue}14`, border: `1px solid ${T.blue}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Dumbbell style={{ width: 14, height: 14, color: T.blue }} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.text1 }}>{cls.name}</div>
                        <div style={{ fontSize: 10, color: T.text3, marginTop: 2, display: 'flex', gap: 8 }}>
                          {cls.schedule && <span>🕐 {cls.schedule}</span>}
                          {cls.duration_minutes && <span>{cls.duration_minutes}min</span>}
                        </div>
                      </div>

                      {/* Attendance badge */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: fillColor, lineHeight: 1 }}>{cls.attended}</div>
                        <div style={{ fontSize: 9, color: T.text3, marginTop: 2 }}>/ {cls.booked || 20}</div>
                      </div>

                      {/* Expand toggle */}
                      <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'transparent', border: 'none', color: T.text2, cursor: 'pointer', fontSize: 0 }} onClick={e => { e.stopPropagation(); }}>
                        {isOpen ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>

                    {/* Fill bar */}
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cls.fill}%`, background: fillColor, transition: 'width 0.6s ease' }}/>
                    </div>

                    {/* Expanded: Action buttons */}
                    {isOpen && (
                      <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, background: `${T.blue}04`, display: 'flex', gap: 8 }}>
                        <button onClick={() => openModal('qrScanner', cls)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, background: `${T.green}12`, border: `1px solid ${T.green}28`, color: T.green, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <QrCode style={{ width: 12, height: 12 }} /> Start Check-In
                        </button>
                        <button onClick={() => openModal('post', { classId: cls.id })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, background: `${T.blue}12`, border: `1px solid ${T.blue}28`, color: T.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <Bell style={{ width: 12, height: 12 }} /> Announcement
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── MEMBER ALERTS ─── */}
        {(memberStatus.atRisk > 0) && (
          <div style={{ borderRadius: 14, background: T.card, border: `1px solid rgba(248,113,113,0.2)`, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle style={{ width: 18, height: 18, color: '#f87171' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{memberStatus.atRisk} members at risk</div>
                <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>Haven't visited in 14+ days</div>
              </div>
              <button onClick={() => openModal('message')} style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Follow up
              </button>
            </div>
          </div>
        )}

        {/* ─── ACTIVITY TREND ─── */}
        <div>
          <SectionHeader label="Weekly Activity" icon={BarChart3} color={T.green} />
          <div style={{ borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = subDays(now, 6 - i);
                const dayCI = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length;
                const isToday = startOfDay(d).getTime() === startOfDay(now).getTime();
                const maxWeekly = Math.max(...Array.from({ length: 7 }, (_, j) => {
                  const date = subDays(now, 6 - j);
                  return checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(date).getTime()).length;
                }), 1);
                const h = dayCI === 0 ? 3 : Math.max(6, (dayCI / maxWeekly) * 56);
                
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ height: h, width: '100%', borderRadius: '3px 3px 1px 1px', background: isToday ? T.blue : `${T.blue}40`, transition: 'height 0.4s ease' }} title={`${format(d, 'EEE')}: ${dayCI}`}/>
                    <span style={{ fontSize: 8, color: T.text3, fontWeight: 600 }}>{format(d, 'd')}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 16, justifyContent: 'space-around' }}>
              {[
                { label: 'This week', value: weekCheckIns.length, color: T.blue },
                { label: 'Daily avg', value: (weekCheckIns.length / 7).toFixed(1), color: T.green },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: T.text3, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════ RIGHT SIDEBAR ════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 0 }}>

        {/* Quick Actions */}
        <div style={{ borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, background: `${T.blue}05` }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: T.text1 }}>QUICK ACTIONS</span>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: QrCode,   label: 'Start Check-In',    color: T.green,  fn: () => openModal('qrScanner') },
              { icon: Dumbbell, label: 'Manage Classes',    color: T.purple, fn: () => openModal('classes') },
              { icon: Calendar, label: 'Create Event',      color: T.blue,   fn: () => openModal('event') },
              { icon: MessageSquare, label: 'Send Message', color: T.amber,  fn: () => openModal('message') },
            ].map(({ icon: Icon, label, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left', fontSize: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}0f`; e.currentTarget.style.borderColor = `${color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}16`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 12, height: 12, color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text1, flex: 1 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Member Stats */}
        <div style={{ borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, padding: '14px 16px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.text3, textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Member Status</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Active', value: memberStatus.active, color: T.green },
              { label: 'At Risk', value: memberStatus.atRisk, color: '#f87171' },
              { label: 'Total', value: allMemberships.length, color: T.text2 },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: T.text2 }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div style={{ borderRadius: 14, background: `${T.blue}05`, border: `1px solid ${T.blue}20`, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.blue, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap style={{ width: 12, height: 12 }} /> PRO TIP
          </div>
          <div style={{ fontSize: 10, color: T.text2, lineHeight: 1.5 }}>
            Check in members early. Track attendance on the detail page for performance insights.
          </div>
        </div>
      </div>
    </div>
  );
}