import React, { useMemo, useState } from 'react';
import { format, isToday } from 'date-fns';
import {
  AlertCircle, MessageCircle, Calendar, Flame,
  TrendingDown, TrendingUp, CheckCircle, UserX,
  Plus, QrCode, AlertTriangle, Sun, Sunset,
  Dumbbell, RefreshCw, Minus, Trophy, Clock,
  Activity, RotateCcw,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:      '#060c16',
  surface: '#0b1220',
  card:    '#0e1826',
  border:  'rgba(255,255,255,0.065)',
  borderHi:'rgba(255,255,255,0.11)',
  t1: '#f0f4ff', t2: '#8fa0bc', t3: '#4a5e7a', t4: '#253045',
  red:    '#f04f4f',
  amber:  '#f5a623',
  green:  '#00c87a',
  blue:   '#4a9eff',
  purple: '#9b7df8',
  cyan:   '#00d4f0',
};

// ─── Inject styles once ────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('coach-today-styles')) {
  const s = document.createElement('style');
  s.id = 'coach-today-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=JetBrains+Mono:wght@500;700&display=swap');
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseRed {
      0%,100% { box-shadow: 0 0 0 0 rgba(240,79,79,0); }
      50%      { box-shadow: 0 0 0 6px rgba(240,79,79,0.12); }
    }
    @keyframes countUp {
      from { opacity: 0; transform: scale(0.8); }
      to   { opacity: 1; transform: scale(1); }
    }
    .ct-fade-up   { animation: fadeSlideUp 0.35s ease both; }
    .ct-count-up  { animation: countUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
    .ct-pulse-red { animation: pulseRed 3s ease-in-out infinite; }
    .ct-btn:hover { filter: brightness(1.15); }
  `;
  document.head.appendChild(s);
}

// ─── Retention score ───────────────────────────────────────────────────────────
function calcRetentionScore(userId, checkIns, now) {
  const uci   = checkIns.filter(c => c.user_id === userId);
  const ms    = d => now - new Date(d.check_in_date);

  const recent7  = uci.filter(c => ms(c) < 7  * 864e5).length;
  const recent30 = uci.filter(c => ms(c) < 30 * 864e5).length;
  const prev30   = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;

  const sorted  = [...uci].sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const last    = sorted[0];
  const daysAgo = last ? Math.floor(ms(last) / 864e5) : 999;
  const total   = uci.length;

  let score = 100;
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  else if (daysAgo > 3)    score -= 5;

  if      (recent30 === 0) score -= 25;
  else if (recent30 <= 2)  score -= 15;
  else if (recent30 <= 4)  score -= 5;

  if (recent7 >= 2) score += 5;
  score = Math.max(0, Math.min(100, score));

  const trend  = prev30 > 0
    ? (recent30 > prev30 * 1.1 ? 'improving' : recent30 < prev30 * 0.7 ? 'declining' : 'stable')
    : (recent30 >= 2 ? 'improving' : 'stable');

  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color  = status === 'safe' ? D.green : status === 'at_risk' ? D.amber : D.red;
  const label  = status === 'safe' ? 'Safe' : status === 'at_risk' ? 'At Risk' : 'High Risk';

  // 7-day spark data
  const spark = Array.from({ length: 7 }, (_, i) => {
    const s = new Date(now - (6 - i) * 864e5); s.setHours(0,0,0,0);
    const e = new Date(s); e.setHours(23,59,59,999);
    return uci.filter(c => { const d = new Date(c.check_in_date); return d >= s && d <= e; }).length;
  });

  return { score, status, trend, color, label, daysAgo, recent7, recent30, prev30, total, spark };
}

// ─── Sparkline bars ────────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 16, width = 52 }) {
  const max  = Math.max(...data, 1);
  const bw   = (width / data.length) - 1.5;
  return (
    <svg width={width} height={height} style={{ flexShrink: 0, display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        return <rect key={i} x={i*(bw+1.5)} y={height-h} width={bw} height={h} rx={1.5} fill={v > 0 ? color : 'rgba(255,255,255,0.07)'} opacity={v > 0 ? 0.9 : 1} />;
      })}
    </svg>
  );
}

// ─── Retention ring (SVG) ──────────────────────────────────────────────────────
function RetentionRing({ rs, size = 46 }) {
  const r    = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (rs.score / 100) * circ;
  const TIcon = rs.trend === 'improving' ? TrendingUp : rs.trend === 'declining' ? TrendingDown : Minus;
  const tc    = rs.trend === 'improving' ? D.green : rs.trend === 'declining' ? D.red : D.t3;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={rs.color} strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`}
            style={{ transition:'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize: size < 42 ? 9 : 11, fontWeight:800, color:rs.color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{rs.score}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:2 }}>
        <TIcon style={{ width:8, height:8, color:tc }}/>
        <span style={{ fontSize:8, color:tc, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{rs.trend.slice(0,3)}</span>
      </div>
    </div>
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
function Card({ children, style={}, accent, pulse, delay=0 }) {
  return (
    <div
      className={`ct-fade-up${pulse ? ' ct-pulse-red' : ''}`}
      style={{
        background: D.surface, border:`1px solid ${D.border}`, borderRadius:14,
        position:'relative', overflow:'hidden',
        animationDelay:`${delay}s`,
        fontFamily:"'DM Sans',sans-serif",
        ...style
      }}
    >
      {accent && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent},${accent}55,transparent)` }}/>}
      {children}
    </div>
  );
}

function SectionHeader({ icon:Icon, label, color=D.t2, count, sub, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:26, height:26, borderRadius:8, background:`${color}12`, border:`1px solid ${color}26`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon style={{ width:12, height:12, color }}/>
        </div>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:13, fontWeight:800, color:D.t1, letterSpacing:'-0.01em' }}>{label}</span>
            {count != null && count > 0 && (
              <span style={{ fontSize:9, fontWeight:800, color, background:`${color}14`, border:`1px solid ${color}28`, borderRadius:99, padding:'2px 7px', letterSpacing:'0.03em', fontFamily:"'JetBrains Mono',monospace" }}>{count}</span>
            )}
          </div>
          {sub && <div style={{ fontSize:10, color:D.t3, marginTop:1 }}>{sub}</div>}
        </div>
      </div>
      {onAction && (
        <button onClick={onAction} style={{ fontSize:10, fontWeight:700, color:D.blue, background:'rgba(74,158,255,0.07)', border:'1px solid rgba(74,158,255,0.18)', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          {action||'View all'}
        </button>
      )}
    </div>
  );
}

function Btn({ label, icon:Icon, color=D.blue, onClick, sm }) {
  return (
    <button
      className="ct-btn"
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap: sm?3:4,
        padding: sm?'4px 8px':'5px 11px', borderRadius:7,
        background:`${color}0e`, border:`1px solid ${color}22`,
        color, fontSize: sm?10:11, fontWeight:700, cursor:'pointer',
        whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif",
        transition:'filter 0.15s',
      }}
    >
      {Icon && <Icon style={{ width: sm?9:10, height: sm?9:10 }}/>}
      {label}
    </button>
  );
}

function QuickActions({ member, openModal }) {
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
      <Btn label="Message"    icon={MessageCircle} color={D.blue}   onClick={() => openModal('post',          { memberId: member.user_id })}/>
      <Btn label="Book"       icon={Calendar}      color={D.purple} onClick={() => openModal('bookIntoClass', { memberId: member.user_id, memberName: member.user_name })}/>
      <Btn label="Reschedule" icon={RefreshCw}     color={D.amber}  onClick={() => openModal('bookIntoClass', { memberId: member.user_id, memberName: member.user_name, reschedule: true })}/>
      <Btn label="Workout"    icon={Dumbbell}      color={D.green}  onClick={() => openModal('assignWorkout', { memberId: member.user_id, memberName: member.user_name })}/>
    </div>
  );
}

// ─── 1. Header ─────────────────────────────────────────────────────────────────
function TodayHeader({ currentUser, todayCI, noShows, attentionCount, atRiskCount, totalMembers }) {
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name    = currentUser?.display_name?.split(' ')[0] || currentUser?.full_name?.split(' ')[0] || 'Coach';
  const GIcon   = hour < 17 ? Sun : Sunset;

  const healthPct = totalMembers > 0
    ? Math.round(100 - ((atRiskCount / totalMembers) * 55) - (noShows > 0 ? 12 : 0) - (attentionCount / Math.max(totalMembers,1)) * 20)
    : 85;
  const hc = healthPct >= 70 ? D.green : healthPct >= 45 ? D.amber : D.red;
  const hl = healthPct >= 70 ? '● On track' : healthPct >= 45 ? '● Needs attention' : '● Critical';

  return (
    <Card style={{ padding:'20px 24px' }}>
      {/* Dot-grid texture */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(74,158,255,0.035) 1px, transparent 1px)', backgroundSize:'22px 22px', pointerEvents:'none' }}/>
      <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
            <GIcon style={{ width:13, height:13, color:D.amber }}/>
            <span style={{ fontSize:11, fontWeight:600, color:D.t3, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.04em' }}>
              {format(new Date(),'EEE · d MMM yyyy')}
            </span>
          </div>
          <h1 style={{ fontSize:23, fontWeight:900, color:D.t1, letterSpacing:'-0.04em', margin:'0 0 3px', fontFamily:"'DM Sans',sans-serif" }}>
            {greeting}, {name} 👋
          </h1>
          <p style={{ fontSize:12, color:D.t3, margin:0, fontWeight:500 }}>
            {atRiskCount > 0
              ? `${atRiskCount} client${atRiskCount>1?'s':''} need${atRiskCount===1?'s':''} your attention today.`
              : 'All clients engaging — great momentum.'}
          </p>
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-start' }}>
          {/* Gym health composite */}
          <div style={{ padding:'12px 16px', borderRadius:12, background:D.card, border:`1px solid ${D.border}`, minWidth:120 }}>
            <div style={{ fontSize:9, color:D.t4, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:"'JetBrains Mono',monospace", marginBottom:3 }}>GYM HEALTH</div>
            <div className="ct-count-up" style={{ fontSize:28, fontWeight:900, color:hc, lineHeight:1, letterSpacing:'-0.04em', fontFamily:"'JetBrains Mono',monospace" }}>{healthPct}</div>
            <div style={{ fontSize:9, color:hc, fontWeight:700, marginTop:2 }}>{hl}</div>
          </div>

          {[
            { label:'Sessions today', value:todayCI,       color:D.blue,  Icon:Activity,      d:'0s' },
            { label:'No-shows',       value:noShows,       color:noShows>0?D.red:D.t4,    Icon:UserX,         d:'0.08s' },
            { label:'Need attention', value:attentionCount, color:attentionCount>0?D.amber:D.t4, Icon:AlertTriangle, d:'0.16s' },
          ].map((s,i) => (
            <div key={i} style={{ padding:'12px 15px', borderRadius:12, background:D.card, border:`1px solid ${D.border}`, textAlign:'center', minWidth:80 }}>
              <s.Icon style={{ width:12, height:12, color:s.color, margin:'0 auto 4px', display:'block' }}/>
              <div className="ct-count-up" style={{ fontSize:24, fontWeight:900, color:s.color, lineHeight:1, letterSpacing:'-0.04em', fontFamily:"'JetBrains Mono',monospace", animationDelay:s.d }}>{s.value}</div>
              <div style={{ fontSize:9, color:D.t4, textTransform:'uppercase', letterSpacing:'0.07em', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── 2. Risk filter strip ──────────────────────────────────────────────────────
function RiskFilter({ active, setActive, counts }) {
  const filters = [
    { key:'all',       label:'All clients', color:D.t2 },
    { key:'high_risk', label:'🔴 High Risk', color:D.red,   count:counts.high_risk },
    { key:'at_risk',   label:'🟡 At Risk',   color:D.amber, count:counts.at_risk },
    { key:'safe',      label:'🟢 Safe',       color:D.green, count:counts.safe },
  ];
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
      <span style={{ fontSize:9, color:D.t4, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', marginRight:4 }}>Filter</span>
      {filters.map(f => {
        const on = active === f.key;
        return (
          <button key={f.key} onClick={() => setActive(f.key)}
            style={{
              padding:'5px 12px', borderRadius:99,
              background: on ? `${f.color}16` : 'transparent',
              border:`1px solid ${on ? f.color+'40' : D.border}`,
              color: on ? f.color : D.t3,
              fontSize:11, fontWeight:700, cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s',
              display:'flex', alignItems:'center', gap:5,
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span style={{ fontSize:9, background:`${f.color}18`, borderRadius:99, padding:'1px 5px', fontFamily:"'JetBrains Mono',monospace" }}>{f.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── 3. At-Risk Clients ────────────────────────────────────────────────────────
function AtRiskClients({ memberships, checkIns, now, openModal, setTab, filter }) {
  const atRisk = useMemo(() => {
    return memberships.map(m => {
      const rs = calcRetentionScore(m.user_id, checkIns, now);
      if (rs.status === 'safe') return null;
      if (filter && filter !== 'all' && rs.status !== filter) return null;
      const reason =
        rs.daysAgo >= 999 ? 'Has never visited — needs immediate outreach' :
        rs.daysAgo > 21   ? `No visit in ${rs.daysAgo} days — high churn risk` :
        rs.daysAgo > 14   ? `Inactive ${rs.daysAgo} days — losing momentum` :
                            'Low visit frequency this month';
      return { ...m, rs, reason };
    }).filter(Boolean).sort((a,b) => a.rs.score - b.rs.score).slice(0,6);
  }, [memberships, checkIns, now, filter]);

  if (atRisk.length === 0) return (
    <Card style={{ padding:'16px 18px' }} accent={D.green}>
      <SectionHeader icon={CheckCircle} label="Retention" color={D.green}/>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', borderRadius:9, background:`${D.green}08`, border:`1px solid ${D.green}18` }}>
        <CheckCircle style={{ width:13, height:13, color:D.green, flexShrink:0 }}/>
        <span style={{ fontSize:12, color:D.green, fontWeight:600 }}>All clients engaging well — great work!</span>
      </div>
    </Card>
  );

  const hasHighRisk = atRisk.some(m => m.rs.status === 'high_risk');

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.red} pulse={hasHighRisk}>
      <SectionHeader
        icon={AlertCircle} label="Retention Alerts" color={D.red} count={atRisk.length}
        sub={`${atRisk.filter(m=>m.rs.status==='high_risk').length} high risk · ${atRisk.filter(m=>m.rs.status==='at_risk').length} at risk`}
        action="View all" onAction={() => setTab('members')}
      />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {atRisk.map((m, i) => (
          <div key={m.user_id||i} className="ct-fade-up"
            style={{ padding:'12px 14px', borderRadius:10, background:D.card, border:`1px solid ${m.rs.color}22`, borderLeft:`3px solid ${m.rs.color}`, animationDelay:`${i*0.06}s` }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:`${m.rs.color}12`, border:`2px solid ${m.rs.color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:m.rs.color }}>
                {(m.user_name||'?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:D.t1, letterSpacing:'-0.01em' }}>{m.user_name||'Client'}</div>
                <div style={{ fontSize:10, color:D.t3, marginTop:1 }}>{m.reason}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                  <span style={{ fontSize:9, color:D.t4, fontFamily:"'JetBrains Mono',monospace" }}>7d</span>
                  <Sparkline data={m.rs.spark} color={m.rs.color} height={14} width={50}/>
                  <span style={{ fontSize:9, color:D.t4, fontFamily:"'JetBrains Mono',monospace" }}>{m.rs.recent30} visits/mo</span>
                </div>
              </div>
              <RetentionRing rs={m.rs} size={48}/>
            </div>
            <QuickActions member={m} openModal={openModal}/>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 4. Today's Sessions ───────────────────────────────────────────────────────
function TodaySessions({ classes, checkIns, now, openModal }) {
  const [status, setStatus] = useState({});

  const sessions = useMemo(() => classes.map(cls => {
    const attended = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;
    const capacity = cls.max_capacity || 20;
    const booked   = cls.bookings?.length || attended;
    return { ...cls, attended, booked, capacity };
  }), [classes, checkIns]);

  if (sessions.length === 0) return (
    <Card style={{ padding:'16px 18px' }}>
      <SectionHeader icon={Calendar} label="Today's Sessions" color={D.blue}/>
      <div style={{ padding:'20px', textAlign:'center' }}>
        <Calendar style={{ width:22, height:22, opacity:0.2, margin:'0 auto 10px', display:'block' }}/>
        <p style={{ fontSize:12, fontWeight:600, color:D.t3, margin:'0 0 10px' }}>No sessions today</p>
        <Btn label="Manage Classes" icon={Plus} color={D.blue} onClick={() => openModal('classes')}/>
      </div>
    </Card>
  );

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.blue}>
      <SectionHeader icon={Calendar} label="Today's Sessions" color={D.blue} count={sessions.length}
        sub={`${sessions.reduce((a,c)=>a+c.booked,0)} total bookings`}
      />
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {sessions.map((cls, i) => {
          const st    = status[cls.id] || (cls.attended >= cls.booked ? 'confirmed' : 'pending');
          const pct   = Math.min(100, Math.round((cls.booked / cls.capacity)*100));
          const stClr = st==='confirmed' ? D.green : st==='no-show' ? D.red : D.amber;
          const bClr  = pct >= 85 ? D.green : pct >= 55 ? D.blue : D.t3;

          return (
            <div key={cls.id||i} style={{ padding:'13px 14px', borderRadius:10, background:D.card, border:`1px solid ${D.border}` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:9 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:D.t1, marginBottom:4, letterSpacing:'-0.01em' }}>{cls.name}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    {cls.schedule && <span style={{ fontSize:10, color:D.t3, display:'flex', alignItems:'center', gap:3 }}><Clock style={{ width:9, height:9 }}/>{cls.schedule}</span>}
                    {cls.duration_minutes && <span style={{ fontSize:9, color:D.t4, fontFamily:"'JetBrains Mono',monospace" }}>{cls.duration_minutes}min</span>}
                    <span style={{ fontSize:9, fontWeight:700, color:stClr, background:`${stClr}10`, borderRadius:4, padding:'1px 6px', border:`1px solid ${stClr}22` }}>
                      {st==='confirmed'?'✓ Confirmed':st==='no-show'?'✗ No-show':'⏳ Pending'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:17, fontWeight:900, color:bClr, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'-0.02em', lineHeight:1 }}>
                    {cls.booked}<span style={{ fontSize:10, color:D.t4, fontWeight:500 }}>/{cls.capacity}</span>
                  </div>
                  <div style={{ fontSize:9, color:D.t4, marginTop:2 }}>{pct}% full</div>
                </div>
              </div>
              <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden', marginBottom:10 }}>
                <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${bClr}70,${bClr})`, borderRadius:99, transition:'width 0.6s ease' }}/>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Btn label="Check-in" icon={QrCode}       color={D.green}  onClick={() => openModal('qrScanner', cls)}/>
                <Btn label="Message"  icon={MessageCircle} color={D.blue}   onClick={() => openModal('post')}/>
                <Btn label="Confirm"  icon={CheckCircle}   color={D.green}  onClick={() => setStatus(p=>({...p,[cls.id]:'confirmed'}))}/>
                <Btn label="No-show"  icon={UserX}         color={D.red}    onClick={() => setStatus(p=>({...p,[cls.id]:'no-show'}))}/>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── 5. Needs Attention ────────────────────────────────────────────────────────
function NeedsAttention({ memberships, checkIns, now, openModal }) {
  const flagged = useMemo(() => {
    return memberships.map(m => {
      const tw  = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) < 7*864e5).length;
      const l30 = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) < 30*864e5).length;
      const l60 = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) < 60*864e5).length;
      const p30 = l60 - l30;

      let flag = null;
      if (tw===0 && l30>=3)
        flag = { reason:"Hasn't booked this week — regular going quiet", action:'Book a session to keep momentum', urgency:'high' };
      else if (p30>3 && l30 < p30/3)
        flag = { reason:'Visit rate dropped sharply vs last month', action:'Send a personal check-in or assign new workout', urgency:'medium' };
      else if (l30>=1 && l30<=2 && p30>=4)
        flag = { reason:'Engagement cooling — was active, now slowing down', action:'Re-engage with a challenge or free class', urgency:'medium' };

      if (!flag) return null;
      return { ...m, rs: calcRetentionScore(m.user_id, checkIns, now), ...flag };
    }).filter(Boolean).slice(0,5);
  }, [memberships, checkIns, now]);

  if (flagged.length === 0) return null;

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.amber}>
      <SectionHeader icon={AlertTriangle} label="Needs Attention" color={D.amber} count={flagged.length} sub="Warning signs — act before they churn"/>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {flagged.map((m,i) => (
          <div key={m.user_id||i} style={{ padding:'11px 13px', borderRadius:9, background:D.card, border:`1px solid ${m.urgency==='high'?D.amber+'25':D.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:`${D.amber}12`, border:`1px solid ${D.amber}26`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:D.amber }}>
                {(m.user_name||'?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:D.t1 }}>{m.user_name}</div>
                <div style={{ fontSize:10, color:D.t3, marginTop:1 }}>{m.reason}</div>
                <div style={{ fontSize:10, color:D.amber, marginTop:2, fontWeight:600 }}>→ {m.action}</div>
              </div>
              <RetentionRing rs={m.rs} size={40}/>
            </div>
            <QuickActions member={m} openModal={openModal}/>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 6. Broken Streaks ─────────────────────────────────────────────────────────
function BrokenStreaks({ memberships, checkIns, now, openModal }) {
  const broken = useMemo(() => {
    return memberships.map(m => {
      const r7  = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) < 7*864e5).length;
      const p14 = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) >= 7*864e5 && (now-new Date(c.check_in_date)) < 21*864e5).length;
      if (r7===0 && p14>=3) return { ...m, rs: calcRetentionScore(m.user_id, checkIns, now), prevStreak: p14 };
      return null;
    }).filter(Boolean).slice(0,4);
  }, [memberships, checkIns, now]);

  if (broken.length === 0) return null;

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.amber}>
      <SectionHeader icon={Flame} label="Broken Streaks" color={D.amber} count={broken.length} sub="Re-engage before they lose the habit"/>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {broken.map((m,i) => (
          <div key={m.user_id||i} style={{ padding:'11px 13px', borderRadius:9, background:D.card, border:`1px solid ${D.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:`${D.amber}10`, border:`1px solid ${D.amber}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Flame style={{ width:14, height:14, color:D.amber }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:D.t1 }}>{m.user_name}</div>
                <div style={{ fontSize:10, color:D.t3 }}>Visited <span style={{ fontFamily:"'JetBrains Mono',monospace", color:D.t2 }}>{m.prevStreak}×</span> last week — dropped off</div>
                <div style={{ fontSize:10, color:D.amber, marginTop:2, fontWeight:600 }}>→ A quick message reignites the habit</div>
              </div>
              <RetentionRing rs={m.rs} size={40}/>
            </div>
            <QuickActions member={m} openModal={openModal}/>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 7. Declining Engagement ───────────────────────────────────────────────────
function DecliningEngagement({ memberships, checkIns, now, openModal }) {
  const declining = useMemo(() => {
    return memberships.map(m => {
      const r30 = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) < 30*864e5).length;
      const p30 = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) >= 30*864e5 && (now-new Date(c.check_in_date)) < 60*864e5).length;
      if (p30 < 4 || r30 >= p30*0.6) return null;
      const drop = Math.round(((p30-r30)/p30)*100);
      return { ...m, rs: calcRetentionScore(m.user_id, checkIns, now), recent30:r30, prev30:p30, drop };
    }).filter(Boolean).sort((a,b) => b.drop-a.drop).slice(0,4);
  }, [memberships, checkIns, now]);

  if (declining.length === 0) return null;

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.red}>
      <SectionHeader icon={TrendingDown} label="Declining Engagement" color={D.red} count={declining.length} sub="Attendance falling — intervene now"/>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {declining.map((m,i) => (
          <div key={m.user_id||i} style={{ padding:'11px 13px', borderRadius:9, background:D.card, border:`1px solid ${D.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:`${D.red}10`, border:`1px solid ${D.red}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:D.red }}>
                  {(m.user_name||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ position:'absolute', bottom:-2, right:-2, width:13, height:13, borderRadius:'50%', background:D.red, display:'flex', alignItems:'center', justifyContent:'center', border:`1.5px solid ${D.card}` }}>
                  <TrendingDown style={{ width:7, height:7, color:'#fff' }}/>
                </div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:D.t1 }}>{m.user_name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span style={{ fontSize:10, color:D.t3 }}><span style={{ fontFamily:"'JetBrains Mono',monospace", color:D.t2 }}>{m.prev30}</span> last mo</span>
                  <TrendingDown style={{ width:9, height:9, color:D.red }}/>
                  <span style={{ fontSize:10, color:D.t3 }}><span style={{ fontFamily:"'JetBrains Mono',monospace", color:D.red }}>{m.recent30}</span> now</span>
                  <span style={{ fontSize:9, fontWeight:800, color:D.red, background:`${D.red}10`, borderRadius:4, padding:'1px 5px' }}>↓{m.drop}%</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                  <Sparkline data={m.rs.spark} color={D.red} height={13} width={50}/>
                </div>
                <div style={{ fontSize:10, color:D.red, marginTop:3, fontWeight:600 }}>→ Book or assign a fresh workout</div>
              </div>
              <RetentionRing rs={m.rs} size={40}/>
            </div>
            <QuickActions member={m} openModal={openModal}/>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 8. Empty Slots ────────────────────────────────────────────────────────────
function EmptySlots({ classes, memberships, checkIns, now, openModal }) {
  const open = classes.filter(cls => (cls.bookings?.length||0) < (cls.max_capacity||20));

  const suggestions = useMemo(() => {
    if (!classes.length) return [];
    return memberships.map(m => {
      const sorted = checkIns.filter(c=>c.user_id===m.user_id).sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
      const daysAgo = sorted[0] ? Math.floor((now-new Date(sorted[0].check_in_date))/864e5) : 999;
      if (daysAgo < 5) return null;
      return { ...m, rs: calcRetentionScore(m.user_id, checkIns, now), daysAgo };
    }).filter(Boolean).sort((a,b)=>b.daysAgo-a.daysAgo).slice(0,3);
  }, [classes, memberships, checkIns, now]);

  if (!open.length && !suggestions.length) return null;

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.green}>
      <SectionHeader icon={Plus} label="Open Slots — Fill Them" color={D.green} count={open.length} sub="Invite at-risk clients to fill capacity"/>
      {open.slice(0,2).map((cls,i) => {
        const spots = (cls.max_capacity||20) - (cls.bookings?.length||0);
        const pct   = Math.round(((cls.bookings?.length||0)/(cls.max_capacity||20))*100);
        return (
          <div key={i} style={{ padding:'10px 13px', borderRadius:9, background:D.card, border:`1px solid ${D.border}`, marginBottom:7 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div>
                <span style={{ fontSize:12, fontWeight:800, color:D.t1 }}>{cls.name}</span>
                {cls.schedule && <span style={{ fontSize:10, color:D.t3, marginLeft:8 }}>🕐 {cls.schedule}</span>}
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:D.green, fontFamily:"'JetBrains Mono',monospace" }}>{spots} open</span>
            </div>
            <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:`${D.green}55`, borderRadius:99 }}/>
            </div>
          </div>
        );
      })}
      {suggestions.length > 0 && (
        <>
          <div style={{ fontSize:9, fontWeight:800, color:D.t4, textTransform:'uppercase', letterSpacing:'0.1em', margin:'10px 0 7px' }}>Clients to invite</div>
          {suggestions.map((m,i) => (
            <div key={m.user_id||i} style={{ padding:'9px 12px', borderRadius:9, background:`${D.green}07`, border:`1px solid ${D.green}16`, display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:D.green }}>{m.user_name}</span>
                  <span style={{ fontSize:9, color:D.t4, fontFamily:"'JetBrains Mono',monospace" }}>{m.daysAgo===999?'never visited':`${m.daysAgo}d ago`}</span>
                </div>
                <div style={{ fontSize:10, color:D.t3, marginTop:1 }}>Perfect candidate — invite to fill the slot</div>
              </div>
              <Btn label="Book" icon={Calendar} color={D.green} sm onClick={() => openModal('bookIntoClass',{memberId:m.user_id,memberName:m.user_name})}/>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}

// ─── 9. Rebooking Window (NEW) ─────────────────────────────────────────────────
function ReBookingWindow({ memberships, checkIns, classes, now, openModal }) {
  const due = useMemo(() => {
    return memberships.map(m => {
      const sorted = checkIns.filter(c=>c.user_id===m.user_id).sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
      if (!sorted[0]) return null;
      const daysAgo = Math.floor((now-new Date(sorted[0].check_in_date))/864e5);
      if (daysAgo > 4 || daysAgo < 1) return null;
      const hasUpcoming = classes.some(cls => cls.bookings?.some(b => b.user_id===m.user_id && b.status==='booked'));
      if (hasUpcoming) return null;
      return { ...m, daysAgo };
    }).filter(Boolean).slice(0,4);
  }, [memberships, checkIns, classes, now]);

  if (!due.length) return null;

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.cyan}>
      <SectionHeader icon={RotateCcw} label="Rebooking Window" color={D.cyan} count={due.length} sub="Just finished — rebook while motivation is peak"/>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {due.map((m,i) => (
          <div key={m.user_id||i} style={{ padding:'10px 13px', borderRadius:9, background:`${D.cyan}06`, border:`1px solid ${D.cyan}16`, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:`${D.cyan}12`, border:`1px solid ${D.cyan}26`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:D.cyan }}>
              {(m.user_name||'?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:800, color:D.t1 }}>{m.user_name}</div>
              <div style={{ fontSize:10, color:D.t3 }}>Visited <span style={{ fontFamily:"'JetBrains Mono',monospace", color:D.cyan }}>{m.daysAgo}d ago</span> — no next session booked</div>
              <div style={{ fontSize:10, color:D.cyan, marginTop:1, fontWeight:600 }}>→ Strike while they're motivated</div>
            </div>
            <Btn label="Book now" icon={Calendar} color={D.cyan} sm onClick={() => openModal('bookIntoClass',{memberId:m.user_id,memberName:m.user_name})}/>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 10. Milestone Alerts (NEW) ────────────────────────────────────────────────
const MILESTONES = [5, 10, 25, 50, 100];

function MilestoneAlerts({ memberships, checkIns, now, openModal }) {
  const alerts = useMemo(() => {
    return memberships.map(m => {
      const uci   = checkIns.filter(c => c.user_id===m.user_id);
      const total = uci.length;
      const sorted = [...uci].sort((a,b)=>new Date(a.check_in_date)-new Date(b.check_in_date));

      const just = MILESTONES.find(ms => {
        if (sorted.length !== ms) return false;
        const hit = new Date(sorted[sorted.length-1].check_in_date);
        return (now-hit) < 3*864e5;
      });

      const next = MILESTONES.find(ms => total < ms);

      if (just)
        return { ...m, total, type:'achieved', milestone:just };
      if (next && next-total <= 2)
        return { ...m, total, type:'approaching', milestone:next, away:next-total };
      return null;
    }).filter(Boolean).slice(0,4);
  }, [memberships, checkIns, now]);

  if (!alerts.length) return null;

  return (
    <Card style={{ padding:'16px 18px' }} accent={D.purple}>
      <SectionHeader icon={Trophy} label="Milestone Alerts" color={D.purple} count={alerts.length} sub="Celebrate wins — boosts long-term retention"/>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {alerts.map((m,i) => (
          <div key={m.user_id||i}
            style={{ padding:'10px 13px', borderRadius:9, background: m.type==='achieved'?`${D.purple}08`:D.card, border:`1px solid ${m.type==='achieved'?D.purple+'28':D.border}` }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:`${D.purple}14`, border:`1px solid ${D.purple}26`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                {m.type==='achieved'?'🏆':'⚡'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:D.t1 }}>{m.user_name}</div>
                {m.type==='achieved' ? (
                  <div style={{ fontSize:10, color:D.purple, fontWeight:700, marginTop:1 }}>
                    🎉 Just hit <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{m.milestone}</span> visits! Celebrate with them
                  </div>
                ) : (
                  <div style={{ fontSize:10, color:D.t3, marginTop:1 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", color:D.purple }}>{m.away}</span> visit{m.away>1?'s':''} away from their <span style={{ fontFamily:"'JetBrains Mono',monospace", color:D.purple }}>{m.milestone}</span>-visit milestone
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                <Btn label="Message" icon={MessageCircle} color={D.purple} sm onClick={() => openModal('post',{memberId:m.user_id})}/>
                {m.type!=='achieved' && <Btn label="Book" icon={Calendar} color={D.purple} sm onClick={() => openModal('bookIntoClass',{memberId:m.user_id,memberName:m.user_name})}/>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function TabCoachToday({ allMemberships=[], checkIns=[], myClasses=[], currentUser, openModal, setTab, now }) {
  const safeNow = now instanceof Date ? now : new Date();
  const [filter, setFilter] = useState('all');

  const todayCI = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;

  const noShows = useMemo(() => myClasses.reduce((count, cls) => {
    const booked   = cls.bookings?.filter(b=>b.status==='booked').length || 0;
    const attended = checkIns.filter(c=>isToday(new Date(c.check_in_date))).length;
    return count + Math.max(0, booked - attended);
  }, 0), [myClasses, checkIns]);

  const attentionCount = useMemo(() => allMemberships.filter(m => {
    const tw  = checkIns.filter(c=>c.user_id===m.user_id&&(safeNow-new Date(c.check_in_date))<7*864e5).length;
    const l30 = checkIns.filter(c=>c.user_id===m.user_id&&(safeNow-new Date(c.check_in_date))<30*864e5).length;
    return tw===0 && l30>=2;
  }).length, [allMemberships, checkIns, safeNow]);

  const riskCounts = useMemo(() => {
    const c = { high_risk:0, at_risk:0, safe:0 };
    allMemberships.forEach(m => { c[calcRetentionScore(m.user_id, checkIns, safeNow).status]++; });
    return c;
  }, [allMemberships, checkIns, safeNow]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, fontFamily:"'DM Sans',sans-serif" }}>
      <TodayHeader
        currentUser={currentUser}
        todayCI={todayCI}
        noShows={noShows}
        attentionCount={attentionCount}
        atRiskCount={riskCounts.high_risk + riskCounts.at_risk}
        totalMembers={allMemberships.length}
      />

      <RiskFilter active={filter} setActive={setFilter} counts={riskCounts}/>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <AtRiskClients   memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} setTab={setTab} filter={filter}/>
          <NeedsAttention  memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal}/>
          <ReBookingWindow memberships={allMemberships} checkIns={checkIns} classes={myClasses} now={safeNow} openModal={openModal}/>
          <EmptySlots      classes={myClasses} memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal}/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <TodaySessions       classes={myClasses} checkIns={checkIns} now={safeNow} openModal={openModal}/>
          <BrokenStreaks       memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal}/>
          <DecliningEngagement memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal}/>
          <MilestoneAlerts     memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal}/>
        </div>
      </div>
    </div>
  );
}
