import React, { useMemo, useState } from 'react';
import { format, isToday, subDays, isSameDay } from 'date-fns';
import {
  AlertCircle, MessageCircle, Calendar, TrendingDown,
  TrendingUp, CheckCircle, UserX, Plus, QrCode,
  AlertTriangle, Sun, Moon, Sunset, Dumbbell, Minus,
  Clock, Activity, ChevronRight, Users, Zap, Star,
  ArrowRight, Bell, Target, BarChart2, Send, RefreshCw,
  Flame, XCircle, Check, Eye, Coffee, Sunset as SunsetIcon,
} from 'lucide-react';

// ─── Styles ───────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('today-v3-css')) {
  const s = document.createElement('style');
  s.id = 'today-v3-css';
  s.textContent = `
    @keyframes t3FadeUp   { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
    @keyframes t3SlideIn  { from { opacity:0; transform:translateX(-4px) } to { opacity:1; transform:none } }
    @keyframes t3Pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes t3ScaleIn  { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
    .t3-fade { animation: t3FadeUp 0.28s ease both; }
    .t3-slide { animation: t3SlideIn 0.22s ease both; }
    .t3-scale { animation: t3ScaleIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both; }
    .t3-pulse { animation: t3Pulse 2.8s ease-in-out infinite; }
    .t3-row { transition: background 0.1s; }
    .t3-row:hover { background: rgba(255,255,255,0.022) !important; }
    .t3-btn { transition: all 0.13s; cursor: pointer; border: none; }
    .t3-btn:hover { filter: brightness(1.2); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.3); }
    .t3-btn:active { transform: translateY(0); }
    .t3-card { transition: border-color 0.18s; }
    .t3-card:hover { border-color: rgba(255,255,255,0.11) !important; }
    .t3-metric { animation: t3ScaleIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both; }
    .t3-section-enter { animation: t3FadeUp 0.3s ease both; }
  `;
  document.head.appendChild(s);
}

// ─── Design Tokens — deliberately restrained palette ─────────────────────────
const C = {
  // Backgrounds
  bg:       '#070e19',
  surface:  '#0b1422',
  card:     '#0e1929',
  cardHi:   '#111e30',
  inset:    '#091220',

  // Borders
  border:   'rgba(255,255,255,0.065)',
  borderMd: 'rgba(255,255,255,0.10)',
  divider:  'rgba(255,255,255,0.042)',

  // Accent — only 3: red, amber, action-blue. Use sparingly.
  red:      '#e5534b',
  redSub:   'rgba(229,83,75,0.10)',
  redBdr:   'rgba(229,83,75,0.20)',

  amber:    '#d4920a',
  amberSub: 'rgba(212,146,10,0.09)',
  amberBdr: 'rgba(212,146,10,0.20)',

  action:   '#4a7fa5',         // muted blue for action buttons only
  actionSub:'rgba(74,127,165,0.10)',
  actionBdr:'rgba(74,127,165,0.22)',

  ok:       '#2a8a5e',         // green, used minimally for "all clear"
  okSub:    'rgba(42,138,94,0.09)',

  // Text
  t1: '#edf2f7',
  t2: '#8a9bb0',
  t3: '#4a5d72',
  t4: '#2a3a4d',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcRS(userId, checkIns, now) {
  const uci    = checkIns.filter(c => c.user_id === userId);
  const ms     = d => now - new Date(d.check_in_date);
  const r7     = uci.filter(c => ms(c) < 7  * 864e5).length;
  const r30    = uci.filter(c => ms(c) < 30 * 864e5).length;
  const p30    = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const sorted = [...uci].sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const daysAgo = sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;

  let score = 100;
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  else if (daysAgo > 3)    score -= 5;
  if      (r30 === 0) score -= 25;
  else if (r30 <= 2)  score -= 15;
  else if (r30 <= 4)  score -= 5;
  if (r7 >= 2) score += 5;
  score = Math.max(0, Math.min(100, score));

  const trend  = p30 > 0 ? (r30 > p30*1.1 ? 'up' : r30 < p30*0.7 ? 'down' : 'flat') : (r30 >= 2 ? 'up' : 'flat');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'risk' : 'danger';
  return { score, status, trend, daysAgo, r7, r30, p30, total: uci.length };
}

function greetingFor(hour) {
  if (hour < 12) return { text: 'Good morning', Icon: Coffee };
  if (hour < 17) return { text: 'Good afternoon', Icon: Sun };
  return { text: 'Good evening', Icon: Moon };
}

// ─── Micro-components ────────────────────────────────────────────────────────
function Avatar({ name, size = 34, urgent }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg  = urgent === 'danger' ? C.redSub  : urgent === 'risk' ? C.amberSub : 'rgba(255,255,255,0.05)';
  const bdr = urgent === 'danger' ? C.redBdr  : urgent === 'risk' ? C.amberBdr : C.border;
  const col = urgent === 'danger' ? C.red     : urgent === 'risk' ? C.amber    : C.t2;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:bg, border:`1.5px solid ${bdr}`, display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:Math.round(size*0.35), fontWeight:800, color:col }}>
      {initials}
    </div>
  );
}

function Btn({ label, icon: Icon, color = C.action, onClick, small, full }) {
  const bg  = color === C.red ? C.redSub : color === C.amber ? C.amberSub : C.actionSub;
  const bdr = color === C.red ? C.redBdr : color === C.amber ? C.amberBdr : C.actionBdr;
  return (
    <button className="t3-btn" onClick={onClick} style={{
      display:'flex', alignItems:'center', justifyContent:'center', gap:5,
      padding: small ? '4px 9px' : '6px 12px',
      borderRadius:7, background:bg, border:`1px solid ${bdr}`, color,
      fontSize: small ? 10 : 11, fontWeight:700,
      whiteSpace:'nowrap', width: full ? '100%' : undefined,
      fontFamily:'inherit',
    }}>
      {Icon && <Icon style={{ width: small ? 9 : 11, height: small ? 9 : 11 }}/>}
      {label}
    </button>
  );
}

function SectionHead({ icon: Icon, label, count, countColor, accent }) {
  const ac = accent || C.t3;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, padding:'13px 18px',
      borderBottom:`1px solid ${C.divider}`, background: accent ? `${accent}06` : 'transparent' }}>
      <div style={{ width:3, height:16, borderRadius:99, background:ac, flexShrink:0 }}/>
      <Icon style={{ width:13, height:13, color:ac, flexShrink:0 }}/>
      <span style={{ fontSize:12, fontWeight:800, color:C.t1, flex:1, letterSpacing:'-0.01em' }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{ fontSize:9, fontWeight:800, color: countColor || ac,
          background:`${countColor || ac}14`, border:`1px solid ${countColor || ac}28`,
          borderRadius:99, padding:'2px 8px' }}>{count}</span>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub, action }) {
  return (
    <div style={{ padding:'22px 18px', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:32, height:32, borderRadius:10, background:C.okSub,
        border:`1px solid rgba(42,138,94,0.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon style={{ width:14, height:14, color:C.ok }}/>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t2 }}>{message}</div>
        {sub && <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// Score ring — subtle, single stroke
function ScoreRing({ score, status, size = 36 }) {
  const color = status === 'danger' ? C.red : status === 'risk' ? C.amber : C.ok;
  const r     = (size - 5) / 2;
  const circ  = 2 * Math.PI * r;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeLinecap="round" strokeDasharray={`${(score/100)*circ} ${circ}`}
          style={{ transition:'stroke-dasharray 0.8s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:9, fontWeight:900, color, lineHeight:1 }}>{score}</span>
      </div>
    </div>
  );
}

// 7-day spark line (dots)
function Spark7({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:14, flexShrink:0 }}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * 13);
        return <div key={i} style={{ width:4, height:h, borderRadius:2,
          background: v > 0 ? (i === data.length-1 ? C.amber : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.06)' }}/>;
      })}
    </div>
  );
}

// ─── 1. HEADER ────────────────────────────────────────────────────────────────
function Header({ currentUser, now, openModal }) {
  const hour = now.getHours();
  const { text, Icon } = greetingFor(hour);
  const name = currentUser?.display_name?.split(' ')[0]
    || currentUser?.full_name?.split(' ')[0]
    || 'Coach';

  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
          <Icon style={{ width:11, height:11, color:C.t3 }}/>
          <span style={{ fontSize:10, fontWeight:600, color:C.t3, textTransform:'uppercase',
            letterSpacing:'0.09em' }}>{format(now, 'EEEE, MMMM d')}</span>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, color:C.t1, letterSpacing:'-0.035em',
          margin:0, lineHeight:1 }}>
          {text}, {name}.
        </h1>
        <p style={{ fontSize:12, color:C.t3, margin:'5px 0 0', fontWeight:400 }}>
          Here's what needs your attention today.
        </p>
      </div>
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <button className="t3-btn" onClick={() => openModal('qrScanner')} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8,
          background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
          color:C.t2, fontSize:12, fontWeight:700, fontFamily:'inherit',
        }}>
          <QrCode style={{ width:13, height:13 }}/> Scan Check-in
        </button>
        <button className="t3-btn" onClick={() => openModal('classes')} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8,
          background:C.actionSub, border:`1px solid ${C.actionBdr}`,
          color:C.action, fontSize:12, fontWeight:700, fontFamily:'inherit',
        }}>
          <Plus style={{ width:13, height:13 }}/> Add Session
        </button>
      </div>
    </div>
  );
}

// ─── 2. DAILY SUMMARY STRIP ───────────────────────────────────────────────────
function SummaryStrip({ sessions, todayCI, noShows, fillRate, atRisk, totalMembers }) {
  const metrics = [
    { label:'Sessions Today',    value: sessions,      note: sessions === 1 ? '1 class' : `${sessions} classes` },
    { label:'Attendees',         value: todayCI,       note: 'checked in' },
    { label:'No-shows',          value: noShows,       note: noShows > 0 ? 'need follow-up' : 'none today', alert: noShows > 0 },
    { label:'Fill Rate',         value: `${fillRate}%`, note: fillRate >= 70 ? 'on track' : fillRate >= 40 ? 'below target' : 'low', alert: fillRate < 50 },
    { label:'At Risk',           value: atRisk,        note: 'clients', alert: atRisk > 0 },
    { label:'Roster',            value: totalMembers,  note: 'active clients' },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)',
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          padding:'15px 16px',
          borderRight: i < metrics.length - 1 ? `1px solid ${C.divider}` : 'none',
        }}>
          <div className="t3-metric" style={{
            fontSize:28, fontWeight:900, letterSpacing:'-0.05em', lineHeight:1, marginBottom:4,
            color: m.alert ? C.red : C.t1,
            animationDelay:`${i * 0.04}s`,
          }}>{m.value}</div>
          <div style={{ fontSize:10, fontWeight:700, color: m.alert ? C.red : C.t2, marginBottom:1 }}>{m.label}</div>
          <div style={{ fontSize:9, color: m.alert ? `${C.red}90` : C.t3 }}>{m.note}</div>
        </div>
      ))}
    </div>
  );
}

// ─── 3. AT RISK CLIENTS ───────────────────────────────────────────────────────
function AtRiskSection({ members, checkIns, now, openModal }) {
  if (!members.length) return (
    <div className="t3-card t3-section-enter" style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      <SectionHead icon={AlertCircle} label="At Risk" count={0} accent={C.red}/>
      <EmptyState icon={CheckCircle} message="No high-risk clients right now"
        sub="Your roster is engaging well — keep it up."/>
    </div>
  );

  return (
    <div className="t3-card t3-section-enter" style={{
      background:C.surface, border:`1px solid ${C.redBdr}`, borderRadius:12, overflow:'hidden' }}>
      <SectionHead icon={AlertCircle} label="At Risk — Immediate Action" count={members.length} countColor={C.red} accent={C.red}/>
      <div>
        {members.map((m, i) => {
          const spark = Array.from({length:7}, (_, j) => {
            const d = subDays(now, 6 - j);
            return checkIns.filter(c => c.user_id === m.user_id && isSameDay(new Date(c.check_in_date), d)).length;
          });
          return (
            <div key={m.user_id || i} className="t3-row t3-slide" style={{
              display:'flex', alignItems:'center', gap:12, padding:'13px 18px',
              borderBottom: i < members.length - 1 ? `1px solid ${C.divider}` : 'none',
              background:'transparent', animationDelay:`${i * 0.05}s`,
            }}>
              <Avatar name={m.user_name} size={36} urgent={m.rs.status}/>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:800, color:C.t1 }}>{m.user_name || 'Client'}</span>
                  <span style={{ fontSize:9, fontWeight:800, color:C.red,
                    background:C.redSub, border:`1px solid ${C.redBdr}`,
                    borderRadius:4, padding:'1px 6px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                    {m.rs.status === 'danger' ? 'High Risk' : 'At Risk'}
                  </span>
                </div>
                <div style={{ fontSize:11, color:C.t2 }}>{m.reason}</div>
              </div>

              <Spark7 data={spark}/>
              <ScoreRing score={m.rs.score} status={m.rs.status}/>

              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <Btn label="Message" icon={MessageCircle} onClick={() => openModal('post', { memberId: m.user_id })} small/>
                <Btn label="Book" icon={Calendar} color={C.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id, memberName: m.user_name })} small/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 4. NEEDS ATTENTION ───────────────────────────────────────────────────────
function NeedsAttentionSection({ members, checkIns, now, openModal }) {
  if (!members.length) return null;

  return (
    <div className="t3-card t3-section-enter" style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      <SectionHead icon={AlertTriangle} label="Needs Attention" count={members.length} countColor={C.amber} accent={C.amber}/>
      <div>
        {members.map((m, i) => (
          <div key={m.user_id || i} className="t3-row" style={{
            display:'flex', alignItems:'center', gap:12, padding:'12px 18px',
            borderBottom: i < members.length - 1 ? `1px solid ${C.divider}` : 'none',
            background:'transparent',
          }}>
            <Avatar name={m.user_name} size={32} urgent={m.rs.status}/>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:2 }}>{m.user_name || 'Client'}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:10, color:C.t2 }}>{m.reason}</span>
                <span style={{ fontSize:9, fontWeight:700, color:C.amber,
                  background:C.amberSub, border:`1px solid ${C.amberBdr}`,
                  borderRadius:4, padding:'1px 6px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  {m.tag}
                </span>
              </div>
            </div>

            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              <Btn label={m.action} icon={m.actionIcon} color={C.action} onClick={m.actionFn} small/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. TODAY'S SESSIONS ─────────────────────────────────────────────────────
function SessionsSection({ classes, checkIns, now, openModal }) {
  const [expanded, setExpanded] = useState(null);
  const [overrides, setOverrides] = useState({});

  const sessions = useMemo(() => {
    const hour = now.getHours();
    return classes.map(cls => {
      const capacity = cls.max_capacity || cls.capacity || 20;
      const booked   = cls.bookings?.length || 0;
      const attended = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;
      const noShow   = Math.max(0, booked - attended);
      const fill     = booked > 0 ? Math.round((booked / capacity) * 100) : 0;

      const sched = typeof cls.schedule === 'string' ? cls.schedule : '';
      const match = sched.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      let classHour = null;
      if (match) {
        classHour = parseInt(match[1]);
        if (match[3].toLowerCase() === 'pm' && classHour !== 12) classHour += 12;
      }

      const status = overrides[cls.id] ||
        (classHour !== null ? (classHour < hour ? 'done' : classHour === hour ? 'live' : 'upcoming') : 'upcoming');

      return { ...cls, capacity, booked, attended, noShow, fill, status, classHour };
    }).sort((a,b) => (a.classHour ?? 99) - (b.classHour ?? 99));
  }, [classes, checkIns, now, overrides]);

  const statusMap = {
    live:     { label:'Live now', dot:C.ok,    text:C.ok    },
    upcoming: { label:'Upcoming', dot:C.action, text:C.action },
    done:     { label:'Completed',dot:C.t4,    text:C.t3    },
  };

  return (
    <div className="t3-card t3-section-enter" style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      <SectionHead icon={Calendar} label="Today's Sessions" count={sessions.length} countColor={C.action} accent={C.action}/>

      {sessions.length === 0 ? (
        <EmptyState icon={Calendar} message="No sessions scheduled today"
          action={<Btn label="Add session" icon={Plus} color={C.action} onClick={() => openModal('classes')} small/>}
          sub="Set up your classes to start tracking attendance"/>
      ) : sessions.map((cls, i) => {
        const sc     = statusMap[cls.status] || statusMap.upcoming;
        const isExp  = expanded === cls.id;
        const fillC  = cls.fill >= 80 ? C.ok : cls.fill >= 50 ? C.action : C.amber;

        return (
          <div key={cls.id || i}>
            <div className="t3-row" onClick={() => setExpanded(isExp ? null : cls.id)}
              style={{ padding:'13px 18px', cursor:'pointer', background:'transparent',
                borderBottom: (isExp || i < sessions.length - 1) ? `1px solid ${C.divider}` : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>

                {/* Status dot */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, width:14 }}>
                  <div className={cls.status === 'live' ? 't3-pulse' : ''} style={{
                    width:8, height:8, borderRadius:'50%', background:sc.dot,
                    boxShadow: cls.status === 'live' ? `0 0 0 3px ${sc.dot}22` : 'none',
                  }}/>
                  {i < sessions.length - 1 && (
                    <div style={{ width:1, height:14, background:C.divider }}/>
                  )}
                </div>

                {/* Time */}
                <div style={{ width:54, flexShrink:0 }}>
                  <div style={{ fontSize:11, fontWeight:800, color: cls.status === 'done' ? C.t4 : C.t1 }}>
                    {cls.schedule || '—'}
                  </div>
                  {cls.duration_minutes && (
                    <div style={{ fontSize:9, color:C.t4 }}>{cls.duration_minutes}m</div>
                  )}
                </div>

                {/* Name + fill */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:800, color: cls.status === 'done' ? C.t3 : C.t1,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cls.name}</span>
                    <span style={{ fontSize:9, fontWeight:700, color:sc.text,
                      background:`${sc.dot}12`, border:`1px solid ${sc.dot}28`,
                      borderRadius:4, padding:'1px 6px', textTransform:'uppercase',
                      letterSpacing:'0.04em', flexShrink:0 }}>{sc.label}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {/* Attendance indicators */}
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ height:3, borderRadius:99, width:70, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${cls.fill}%`, background:fillC, borderRadius:99, transition:'width 0.6s' }}/>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:fillC, whiteSpace:'nowrap' }}>
                        {cls.booked}/{cls.capacity}
                      </span>
                    </div>
                    {cls.noShow > 0 && (
                      <span style={{ fontSize:9, color:C.red, display:'flex', alignItems:'center', gap:3 }}>
                        <UserX style={{ width:9, height:9 }}/>{cls.noShow} no-show
                      </span>
                    )}
                    {cls.attended > 0 && (
                      <span style={{ fontSize:9, color:C.ok, display:'flex', alignItems:'center', gap:3 }}>
                        <Check style={{ width:9, height:9 }}/>{cls.attended} in
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                  <Btn label="Check-in" icon={QrCode} color={C.ok} onClick={() => openModal('qrScanner', cls)} small/>
                  <Btn label="Message" icon={MessageCircle} color={C.action} onClick={() => openModal('post', { classId: cls.id })} small/>
                </div>
                <ChevronRight style={{ width:12, height:12, color:C.t4, flexShrink:0,
                  transform: isExp ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}/>
              </div>
            </div>

            {/* Expanded row */}
            {isExp && (
              <div style={{ padding:'12px 18px 14px', background:C.card,
                borderBottom: i < sessions.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
                  {[
                    { label:'Booked',    value: cls.booked,   c: C.action },
                    { label:'Attended',  value: cls.attended, c: C.ok     },
                    { label:'No-shows',  value: cls.noShow,   c: cls.noShow > 0 ? C.red : C.t3 },
                    { label:'Open spots',value: Math.max(0, cls.capacity - cls.booked), c: C.t3 },
                  ].map((s, j) => (
                    <div key={j} style={{ padding:'9px 12px', borderRadius:9,
                      background:'rgba(255,255,255,0.022)', border:`1px solid ${C.border}`, textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:900, color:s.c, letterSpacing:'-0.04em', lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontSize:9, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  <Btn label="Start Live Check-in" icon={QrCode} color={C.ok}
                    onClick={() => { setOverrides(p => ({...p,[cls.id]:'live'})); openModal('qrScanner', cls); }}/>
                  <Btn label="Mark No-show" icon={UserX} color={C.red}
                    onClick={() => setOverrides(p => ({...p,[cls.id]:'done'}))}/>
                  <Btn label="Send Reminder" icon={Bell} color={C.amber}
                    onClick={() => openModal('post', { classId: cls.id })}/>
                  <Btn label="Mark Complete" icon={Check} color={C.action}
                    onClick={() => setOverrides(p => ({...p,[cls.id]:'done'}))}/>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 6. BROKEN CONSISTENCY ────────────────────────────────────────────────────
function BrokenConsistencySection({ members, openModal }) {
  if (!members.length) return null;
  return (
    <div className="t3-card t3-section-enter" style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      <SectionHead icon={RefreshCw} label="Broken Consistency" count={members.length} countColor={C.amber} accent={C.amber}/>
      <div>
        {members.map((m, i) => (
          <div key={m.user_id || i} className="t3-row" style={{
            display:'flex', alignItems:'center', gap:12, padding:'11px 18px',
            borderBottom: i < members.length - 1 ? `1px solid ${C.divider}` : 'none',
            background:'transparent',
          }}>
            <Avatar name={m.user_name} size={30} urgent="risk"/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>{m.user_name}</div>
              <div style={{ fontSize:10, color:C.t2, marginTop:1 }}>{m.reason}</div>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              <Btn label="Reach out" icon={Send} color={C.action} onClick={() => openModal('post', { memberId: m.user_id })} small/>
              <Btn label="Book" icon={Calendar} color={C.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} small/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 7. DECLINING ENGAGEMENT ─────────────────────────────────────────────────
function DecliningSection({ members, openModal }) {
  if (!members.length) return null;
  return (
    <div className="t3-card t3-section-enter" style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      <SectionHead icon={TrendingDown} label="Declining Engagement" count={members.length} countColor={C.t3} accent={C.t3}/>
      <div>
        {members.map((m, i) => (
          <div key={m.user_id || i} className="t3-row" style={{
            display:'flex', alignItems:'center', gap:12, padding:'11px 18px',
            borderBottom: i < members.length - 1 ? `1px solid ${C.divider}` : 'none',
            background:'transparent',
          }}>
            <Avatar name={m.user_name} size={30}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>{m.user_name}</div>
              <div style={{ fontSize:10, color:C.t2, marginTop:1 }}>{m.reason}</div>
            </div>
            <Btn label="Check in" icon={MessageCircle} color={C.action}
              onClick={() => openModal('post', { memberId: m.user_id })} small/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 8. EMPTY SLOTS / OPPORTUNITIES ──────────────────────────────────────────
function EmptySlotsSection({ slots, atRiskMembers, openModal }) {
  if (!slots.length) return null;
  return (
    <div className="t3-card t3-section-enter" style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      <SectionHead icon={Clock} label="Available Slots" count={slots.length} countColor={C.t3} accent={C.t3}/>
      <div style={{ padding:'10px 18px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {slots.map((slot, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 13px',
            borderRadius:9, background:C.card, border:`1px solid ${C.border}` }}>
            <Clock style={{ width:12, height:12, color:C.t4, flexShrink:0 }}/>
            <span style={{ fontSize:11, fontWeight:600, color:C.t3, flex:1 }}>{slot} — Available</span>
            {atRiskMembers[0] && (
              <span style={{ fontSize:9, color:C.amber }}>
                Suggested: {atRiskMembers[0].user_name}
              </span>
            )}
            <Btn label="Book client" icon={Plus} color={C.action}
              onClick={() => openModal('bookIntoClass', atRiskMembers[0] ? { memberId: atRiskMembers[0].user_id } : {})} small/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RIGHT SIDEBAR ────────────────────────────────────────────────────────────
function RetentionSnapshot({ allMemberships, checkIns, now }) {
  const stats = useMemo(() => {
    let safe = 0, risk = 0, danger = 0, totalScore = 0;
    allMemberships.forEach(m => {
      const rs = calcRS(m.user_id, checkIns, now);
      totalScore += rs.score;
      if (rs.status === 'safe')   safe++;
      else if (rs.status === 'risk') risk++;
      else danger++;
    });
    const total = allMemberships.length || 1;
    const avg   = Math.round(totalScore / total);
    return { safe, risk, danger, total, avg };
  }, [allMemberships, checkIns, now]);

  const avgC = stats.avg >= 65 ? C.ok : stats.avg >= 35 ? C.amber : C.red;
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <div className="t3-card" style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'13px 16px', borderBottom:`1px solid ${C.divider}`,
        display:'flex', alignItems:'center', gap:8 }}>
        <BarChart2 style={{ width:12, height:12, color:C.t3 }}/>
        <span style={{ fontSize:12, fontWeight:800, color:C.t1 }}>Roster Health</span>
      </div>
      <div style={{ padding:'16px' }}>
        {/* Average ring */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
            <svg width={52} height={52} style={{ transform:'rotate(-90deg)' }}>
              <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4}/>
              <circle cx={26} cy={26} r={r} fill="none" stroke={avgC} strokeWidth={4}
                strokeLinecap="round" strokeDasharray={`${(stats.avg/100)*circ} ${circ}`}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:12, fontWeight:900, color:avgC }}>{stats.avg}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.t1, marginBottom:2 }}>Avg Retention</div>
            <div style={{ fontSize:9, color:C.t3 }}>
              {Math.round(stats.safe / stats.total * 100)}% of clients on track
            </div>
          </div>
        </div>

        {/* Breakdown */}
        {[
          { label:'Healthy',  count:stats.safe,   pct:Math.round(stats.safe/stats.total*100),   c:C.ok    },
          { label:'At risk',  count:stats.risk,   pct:Math.round(stats.risk/stats.total*100),   c:C.amber },
          { label:'Danger',   count:stats.danger, pct:Math.round(stats.danger/stats.total*100), c:C.red   },
        ].map((row, i) => (
          <div key={i} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color:C.t2 }}>{row.label}</span>
              <span style={{ fontSize:10, color:C.t3 }}>{row.count} · {row.pct}%</span>
            </div>
            <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${row.pct}%`, background:row.c, borderRadius:99, transition:'width 0.8s' }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekPulse({ checkIns, now }) {
  const data = useMemo(() => Array.from({length:7}, (_, i) => {
    const d = subDays(now, 6 - i);
    return {
      day: format(d, 'EEE'),
      count: checkIns.filter(c => isSameDay(new Date(c.check_in_date), d)).length,
      isToday: i === 6,
    };
  }), [checkIns, now]);

  const max   = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const todayCount = data[6].count;
  const yestCount  = data[5].count;

  return (
    <div className="t3-card" style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'13px 16px', borderBottom:`1px solid ${C.divider}`,
        display:'flex', alignItems:'center', gap:8 }}>
        <Activity style={{ width:12, height:12, color:C.t3 }}/>
        <span style={{ fontSize:12, fontWeight:800, color:C.t1 }}>7-Day Pulse</span>
      </div>
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', gap:5, alignItems:'flex-end', height:52, marginBottom:8 }}>
          {data.map((d, i) => {
            const h = d.count === 0 ? 3 : Math.max(5, (d.count / max) * 48);
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:'100%', height:h, borderRadius:3,
                  background: d.isToday ? C.action : d.count > 0 ? `${C.action}40` : 'rgba(255,255,255,0.05)',
                  transition:'height 0.5s ease' }}/>
                <span style={{ fontSize:8, color: d.isToday ? C.action : C.t4,
                  fontWeight: d.isToday ? 800 : 400 }}>{d.day}</span>
              </div>
            );
          })}
        </div>
        <div style={{ paddingTop:10, borderTop:`1px solid ${C.divider}`,
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:C.t1, letterSpacing:'-0.04em' }}>{todayCount}</div>
            <div style={{ fontSize:9, color:C.t3 }}>Today</div>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:C.t2, letterSpacing:'-0.04em' }}>{total}</div>
            <div style={{ fontSize:9, color:C.t3 }}>This week</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotableToday({ allMemberships, checkIns, now, openModal }) {
  const notable = useMemo(() => {
    return allMemberships.map(m => {
      const uci   = checkIns.filter(c => c.user_id === m.user_id);
      const total = uci.length;
      const today = uci.some(c => isToday(new Date(c.check_in_date)));
      const milestones = [5, 10, 25, 50, 100];
      const hit = milestones.find(n => total === n);
      const rs  = calcRS(m.user_id, checkIns, now);

      if (hit)   return { ...m, badge:'Milestone', sub:`Just hit ${hit} visits`, bc:C.amber, p:0 };
      if (today) return { ...m, badge:'Here today', sub:'Checked in ✓', bc:C.ok, p:1 };
      if (rs.r30 >= 8) return { ...m, badge:'Consistent', sub:`${rs.r30} visits this month`, bc:C.action, p:2 };
      return null;
    }).filter(Boolean).sort((a,b) => a.p - b.p).slice(0, 5);
  }, [allMemberships, checkIns, now]);

  if (!notable.length) return null;

  return (
    <div className="t3-card" style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'13px 16px', borderBottom:`1px solid ${C.divider}`,
        display:'flex', alignItems:'center', gap:8 }}>
        <Star style={{ width:12, height:12, color:C.t3 }}/>
        <span style={{ fontSize:12, fontWeight:800, color:C.t1 }}>Notable Today</span>
      </div>
      <div>
        {notable.map((m, i) => (
          <div key={m.user_id || i} className="t3-row" style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
            borderBottom: i < notable.length - 1 ? `1px solid ${C.divider}` : 'none',
            background:'transparent',
          }}>
            <Avatar name={m.user_name} size={28}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.t1,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.user_name}</div>
              <div style={{ fontSize:9, color:C.t3, marginTop:1 }}>{m.sub}</div>
            </div>
            <span style={{ fontSize:8, fontWeight:800, color:m.bc,
              background:`${m.bc}12`, border:`1px solid ${m.bc}28`,
              borderRadius:4, padding:'2px 6px', textTransform:'uppercase',
              letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{m.badge}</span>
            <button className="t3-btn" onClick={() => openModal('post', { memberId: m.user_id })}
              style={{ width:24, height:24, borderRadius:6, display:'flex', alignItems:'center',
                justifyContent:'center', background:C.actionSub, border:`1px solid ${C.actionBdr}`,
                color:C.action, padding:0, flexShrink:0 }}>
              <MessageCircle style={{ width:10, height:10 }}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions({ openModal }) {
  const actions = [
    { label:'Scan check-in',   icon:QrCode,          color:C.ok,     fn:() => openModal('qrScanner') },
    { label:'New session',     icon:Plus,             color:C.action, fn:() => openModal('classes')   },
    { label:'Send message',    icon:MessageCircle,    color:C.action, fn:() => openModal('post')       },
    { label:'Book client',     icon:Calendar,         color:C.amber,  fn:() => openModal('bookIntoClass') },
    { label:'Assign workout',  icon:Dumbbell,         color:C.t3,     fn:() => openModal('assignWorkout') },
  ];
  return (
    <div className="t3-card" style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'13px 16px', borderBottom:`1px solid ${C.divider}` }}>
        <span style={{ fontSize:12, fontWeight:800, color:C.t1 }}>Quick Actions</span>
      </div>
      <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:4 }}>
        {actions.map(({ label, icon:Icon, color, fn }, i) => {
          const [hov, setHov] = useState(false);
          return (
            <button key={i} className="t3-btn" onClick={fn}
              onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px',
                borderRadius:9, background: hov ? `${color}0d` : 'rgba(255,255,255,0.02)',
                border:`1px solid ${hov ? `${color}25` : C.border}`, cursor:'pointer',
                textAlign:'left', width:'100%', fontFamily:'inherit', transition:'all 0.12s' }}>
              <div style={{ width:26, height:26, borderRadius:8, background:`${color}12`,
                border:`1px solid ${color}20`, display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0 }}>
                <Icon style={{ width:12, height:12, color }}/>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color: hov ? C.t1 : C.t2 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TabCoachToday({
  allMemberships = [], checkIns = [], myClasses = [],
  currentUser, openModal, setTab, now,
}) {
  const safeNow = now instanceof Date ? now : new Date();

  // ── Derived data ────────────────────────────────────────────────────────
  const todayCI = useMemo(() =>
    checkIns.filter(c => isToday(new Date(c.check_in_date))).length,
  [checkIns]);

  const noShows = useMemo(() => myClasses.reduce((sum, cls) => {
    const booked   = cls.bookings?.filter(b => b.status === 'booked').length || 0;
    const attended = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;
    return sum + Math.max(0, booked - attended);
  }, 0), [myClasses, checkIns]);

  const fillRate = useMemo(() => {
    const totalCap    = myClasses.reduce((s, c) => s + (c.max_capacity || c.capacity || 20), 0);
    const totalBooked = myClasses.reduce((s, c) => s + (c.bookings?.length || 0), 0);
    return totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0;
  }, [myClasses]);

  // ── At Risk ─────────────────────────────────────────────────────────────
  const atRiskMembers = useMemo(() => {
    return allMemberships.map(m => {
      const rs = calcRS(m.user_id, checkIns, safeNow);
      if (rs.status === 'safe') return null;
      let reason = '';
      if (rs.daysAgo >= 999)   reason = 'Never visited — reach out to introduce yourself';
      else if (rs.daysAgo > 21) reason = `No visit in ${rs.daysAgo} days — high churn risk`;
      else if (rs.daysAgo > 14) reason = `No visit in ${rs.daysAgo} days`;
      else if (rs.r30 === 0)   reason = 'Signed up but never checked in this month';
      else if (rs.p30 > 0 && rs.r30 < rs.p30 * 0.4) reason = `Visits dropped ${Math.round((1 - rs.r30/rs.p30)*100)}% vs last month`;
      else reason = `${rs.daysAgo} days since last visit`;
      return { ...m, rs, reason };
    }).filter(Boolean)
      .filter(m => m.rs.status === 'danger' || (m.rs.status === 'risk' && m.rs.daysAgo > 10))
      .sort((a,b) => a.rs.score - b.rs.score)
      .slice(0, 5);
  }, [allMemberships, checkIns, safeNow]);

  // ── Needs Attention ──────────────────────────────────────────────────────
  const attentionMembers = useMemo(() => {
    const result = [];
    allMemberships.forEach(m => {
      const rs  = calcRS(m.user_id, checkIns, safeNow);
      const r7  = checkIns.filter(c => c.user_id === m.user_id && (safeNow - new Date(c.check_in_date)) < 7 * 864e5).length;
      const r30 = rs.r30;

      // Skip already in at-risk
      if (atRiskMembers.some(x => x.user_id === m.user_id)) return;

      if (r7 === 0 && r30 >= 4) {
        result.push({ ...m, rs, tag:'Not this week', reason:`Active member — no session this week`, action:'Book', actionIcon:Calendar, actionFn:() => openModal('bookIntoClass', { memberId:m.user_id, memberName:m.user_name }) });
      } else if (r7 === 0 && r30 >= 2) {
        result.push({ ...m, rs, tag:'Quiet week', reason:`${r30} visits last month, none this week`, action:'Message', actionIcon:MessageCircle, actionFn:() => openModal('post', { memberId:m.user_id }) });
      } else if (rs.p30 > 3 && r30 < rs.p30 * 0.6 && rs.status === 'risk') {
        result.push({ ...m, rs, tag:'Declining', reason:`${r30} visits this month vs ${rs.p30} last`, action:'Follow up', actionIcon:Send, actionFn:() => openModal('post', { memberId:m.user_id }) });
      }
    });
    return result.sort((a,b) => a.rs.score - b.rs.score).slice(0, 6);
  }, [allMemberships, checkIns, safeNow, atRiskMembers]);

  // ── Broken Consistency ───────────────────────────────────────────────────
  const brokenConsistency = useMemo(() => {
    return allMemberships.map(m => {
      const rs   = calcRS(m.user_id, checkIns, safeNow);
      if (rs.daysAgo < 7 || rs.daysAgo > 30) return null;
      if (rs.p30 < 4) return null;  // wasn't consistent before either
      const dropPct = rs.p30 > 0 ? Math.round((1 - rs.r30 / rs.p30) * 100) : 0;
      if (dropPct < 30) return null;
      return {
        ...m, rs,
        reason: `No sessions in ${rs.daysAgo} days — was averaging ${Math.round(rs.p30/4)}x/week`,
      };
    }).filter(Boolean).sort((a,b) => a.rs.score - b.rs.score).slice(0, 4);
  }, [allMemberships, checkIns, safeNow]);

  // ── Declining ────────────────────────────────────────────────────────────
  const decliningMembers = useMemo(() => {
    return allMemberships.map(m => {
      const rs = calcRS(m.user_id, checkIns, safeNow);
      if (rs.trend !== 'down' || rs.p30 === 0) return null;
      if (brokenConsistency.some(x => x.user_id === m.user_id)) return null;
      if (atRiskMembers.some(x => x.user_id === m.user_id)) return null;
      const wkNow  = Math.round(rs.r30 / 4.3);
      const wkPrev = Math.round(rs.p30 / 4.3);
      return {
        ...m, rs,
        reason: `Down from ${wkPrev}×/week to ${Math.max(1, wkNow)}×/week`,
      };
    }).filter(Boolean).sort((a,b) => a.rs.score - b.rs.score).slice(0, 4);
  }, [allMemberships, checkIns, safeNow, atRiskMembers, brokenConsistency]);

  // ── Empty slots ──────────────────────────────────────────────────────────
  const emptySlots = useMemo(() => {
    const commonSlots = ['7:00 AM','9:00 AM','12:00 PM','5:30 PM','6:30 PM'];
    const occupied = myClasses.map(c => typeof c.schedule === 'string' ? c.schedule : '');
    return commonSlots.filter(s => !occupied.some(o => o.includes(s.replace(' AM','am').replace(' PM','pm')))).slice(0, 3);
  }, [myClasses]);

  const atRiskCount = atRiskMembers.length;
  const totalMembers = allMemberships.length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16,
      fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif' }}>

      {/* ── HEADER ── */}
      <Header currentUser={currentUser} now={safeNow} openModal={openModal}/>

      {/* ── SUMMARY STRIP ── */}
      <SummaryStrip
        sessions={myClasses.length}
        todayCI={todayCI}
        noShows={noShows}
        fillRate={fillRate}
        atRisk={atRiskCount}
        totalMembers={totalMembers}
      />

      {/* ── MAIN GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 268px', gap:16, alignItems:'start' }}>

        {/* ── LEFT: priority-ordered sections ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* 1. AT RISK — always first */}
          <AtRiskSection members={atRiskMembers} checkIns={checkIns} now={safeNow} openModal={openModal}/>

          {/* 2. NEEDS ATTENTION */}
          {attentionMembers.length > 0 && (
            <NeedsAttentionSection members={attentionMembers} checkIns={checkIns} now={safeNow} openModal={openModal}/>
          )}

          {/* 3. TODAY'S SESSIONS */}
          <SessionsSection classes={myClasses} checkIns={checkIns} now={safeNow} openModal={openModal}/>

          {/* 4. BROKEN CONSISTENCY */}
          <BrokenConsistencySection members={brokenConsistency} openModal={openModal}/>

          {/* 5. DECLINING ENGAGEMENT */}
          <DecliningSection members={decliningMembers} openModal={openModal}/>

          {/* 6. EMPTY SLOTS */}
          <EmptySlotsSection slots={emptySlots} atRiskMembers={atRiskMembers} openModal={openModal}/>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <QuickActions openModal={openModal}/>
          <RetentionSnapshot allMemberships={allMemberships} checkIns={checkIns} now={safeNow}/>
          <WeekPulse checkIns={checkIns} now={safeNow}/>
          <NotableToday allMemberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal}/>
        </div>
      </div>
    </div>
  );
}
