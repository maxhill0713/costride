/**
 * TabCoachMembers — redesigned to match TabMembers gold standard exactly.
 * Table layout · fixed right panel (recharts) · slide-in client preview
 * · action dropdown · message toast · mobile bottom sheets.
 * Zero external dependencies. Fully prop-driven.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, X, UserPlus, ChevronRight, ChevronDown,
  Send, CheckCircle, ShieldAlert, ArrowUpRight,
  ArrowDownRight, Users, Flame, Bell,
  BarChart2, SlidersHorizontal, Check,
  XCircle, MoreHorizontal, Phone, Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
/* ─── TOKENS ────────────────────────────────────────────────── */
const C = {
  bg:     '
#0b0b0d',
  sidebar:'
#0f0f12',
  card:   '
#141416',
  card2:  '
#18181b',
  brd:    '
#222226',
  brd2:   '
#2a2a30',
  t1:     '
#ffffff',
  t2:     '
#8a8a94',
  t3:     '
#444450',
  cyan:   '
#4d7fff',
  cyanD:  'rgba(77,127,255,0.08)',
  cyanB:  'rgba(77,127,255,0.25)',
  red:    '
#ff4d6d',
  redD:   'rgba(255,77,109,0.1)',
  redB:   'rgba(255,77,109,0.25)',
  amber:  '
#f59e0b',
  amberD: 'rgba(245,158,11,0.1)',
  amberB: 'rgba(245,158,11,0.25)',
  green:  '
#22c55e',
  greenD: 'rgba(34,197,94,0.1)',
  greenB: 'rgba(34,197,94,0.25)',
  blue:   '
#3b82f6',
  blueD:  'rgba(59,130,246,0.1)',
  blueB:  'rgba(59,130,246,0.25)',
};
const FONT      = "'DM Sans','Segoe UI',sans-serif";
const AV_COLORS = ['
#4d7fff','
#22c55e','
#f59e0b','
#ff4d6d','
#a78bfa','
#06b6d4','
#f97316','
#14b8a6'];
const W_LABELS  = ['-7w','-6w','-5w','-4w','-3w','-2w','-1w','Now'];
/* ─── CSS ────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tcm2-css')) {
  const s = document.createElement('style');
  [s.id](http://s.id) = 'tcm2-css';
  s.textContent = 
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .tcm2 * { box-sizing:border-box; }
    .tcm2 { font-family:'DM Sans','Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; }
    @keyframes tcm2Pulse   { 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes tcm2SlideIn { from{transform:translateX(100%);opacity:0} to{transform:none;opacity:1} }
    @keyframes tcm2ModalIn { from{opacity:0;transform:scale(.95) translateY(8px)} to{opacity:1;transform:none} }
    @keyframes tcm2FadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    .tcm2-row { transition:background .1s; cursor:pointer; }
    .tcm2-row:hover { background:#1a1a1e !important; }
    .tcm2-row:hover .tcm2-act { opacity:1 !important; pointer-events:auto !important; }
    .tcm2-act { opacity:0; pointer-events:none; transition:opacity .15s; }
    .tcm2-btn { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; transition:all .18s cubic-bezier(.16,1,.3,1); display:inline-flex; align-items:center; gap:6px; }
    .tcm2-btn:hover  { transform:translateY(-1px); }
    .tcm2-btn:active { transform:scale(.97); }
    .tcm2-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid #222226; color:#fff; font-size:13px; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:10px 14px; transition:all .18s; }
    .tcm2-input:focus { border-color:rgba(77,127,255,0.4); background:rgba(77,127,255,0.04); }
    .tcm2-input::placeholder { color:#444450; }
    .tcm2-scr::-webkit-scrollbar { width:3px; }
    .tcm2-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    .tcm2-preview { animation:tcm2SlideIn .22s cubic-bezier(.16,1,.3,1) both; }
    .tcm2-fu { animation:tcm2FadeUp .35s cubic-bezier(.16,1,.3,1) both; }
    @media(max-width:900px){.tcm2-rpanel{display:none!important}}
  ;
  document.head.appendChild(s);
}
/* ─── HELPERS ────────────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return [C.green](http://C.green);
  if (s >= 60) return C.t2;
  if (s >= 40) return C.amber;
  return [C.red](http://C.red);
}
function scoreTier(s) {
  if (s >= 80) return { label:'Healthy', color:[C.green](http://C.green), bg:C.greenD, bdr:C.greenB };
  if (s >= 60) return { label:'Stable',  color:C.t2,   bg:'rgba(138,138,148,0.08)', bdr:'rgba(138,138,148,0.2)' };
  if (s >= 40) return { label:'Caution', color:C.amber, bg:C.amberD, bdr:C.amberB };
  return             { label:'At Risk', color:[C.red](http://C.red),   bg:C.redD,   bdr:C.redB };
}
function trendOf(hist) {
  if (!hist || hist.length < 4) return { dir:'flat', delta:0 };
  const d = hist[hist.length-1] - hist[hist.length-4];
  if (d > 4)  return { dir:'up',   delta:d };
  if (d < -4) return { dir:'down', delta:d };
  return { dir:'flat', delta:0 };
}
function riskReasons(client) {
  const r = [];
  if (client.lastVisit >= 21)  r.push('No visit in 3+ weeks');
  else if (client.lastVisit >= 14) r.push('No visit in 2+ weeks');
  if (client.sessionsThisMonth === 0 && client.sessionsLastMonth === 0) r.push('Zero sessions in 2 months');
  else if (client.sessionsThisMonth < client.sessionsLastMonth) r.push('Sessions declining');
  if (client.consecutiveMissed >= 2) r.push(${client.consecutiveMissed} no-shows);
  if (!r.length && client.retentionScore < 40) r.push('Low engagement');
  return r;
}
function deriveAction(client) {
  if (client.lastVisit >= 21)  return "Send 'We miss you'";
  if (client.lastVisit >= 14)  return 'Friendly check-in';
  if (client.isNew)            return 'Week-1 welcome';
  if (client.retentionScore >= 80) return 'Celebrate progress';
  if (client.sessionsThisMonth < client.sessionsLastMonth) return 'Book session';
  return 'Check in';
}
function successRate(client) {
  return Math.max(20, Math.min(95, Math.round(100 - (100 - client.retentionScore) * 0.6)));
}
/* ─── BUILD CLIENT ───────────────────────────────────────────── */
function buildClientFromBookings(userId, clientName, clientBookings, checkIns, now) {
  const now_    = now ? now.getTime() : [Date.now](http://Date.now)();
  const msDay   = 86400000;
  const msMonth = 30 * msDay;
  const noShows   = clientBookings.filter(b => b.status === 'no_show');
  const confirmed = clientBookings.filter(b => b.status === 'confirmed');
  const sessionsThisMonth = clientBookings.filter(b => b.session_date && (now_ - new Date(b.session_date)) < msMonth).length;
  const sessionsLastMonth = clientBookings.filter(b => {
    const d = b.session_date ? now_ - new Date(b.session_date) : null;
    return d !== null && d >= msMonth && d < 2 * msMonth;
  }).length;
  const userCI = (checkIns || []).filter(c => c.user_id === userId).sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const lastCIDate    = userCI[0] ? new Date(userCI[0].check_in_date) : null;
  const lastVisitDays = lastCIDate ? Math.floor((now_ - lastCIDate.getTime()) / msDay) : 999;
  let streak = 0;
  for (let i = 0; i < userCI.length; i++) {
    const dd = Math.floor((now_ - new Date(userCI[i].check_in_date).getTime()) / msDay);
    if (dd <= streak + 2) streak = dd + 1; else break;
  }
  let score = 70;
  if      (lastVisitDays === 999)  score -= 40;
  else if (lastVisitDays > 21)     score -= 30;
  else if (lastVisitDays > 14)     score -= 20;
  else if (lastVisitDays > 7)      score -= 10;
  if (sessionsThisMonth === 0 && sessionsLastMonth === 0) score -= 20;
  else if (sessionsThisMonth > sessionsLastMonth)         score += 10;
  else if (sessionsThisMonth < sessionsLastMonth)         score -= 10;
  score = Math.max(5, Math.min(98, score));
  const retentionHistory = Array.from({ length:8 }, (_, i) => {
    const ws  = now_ - (7-i) * 7 * msDay;
    const cnt = userCI.filter(c => { const t = new Date(c.check_in_date).getTime(); return t >= ws && t < ws + 7*msDay; }).length;
    return Math.min(100, 40 + cnt * 15);
  });
  const status = score >= 65 ? 'active' : score >= 35 ? 'paused' : 'at_risk';
  const nextBooking = confirmed.filter(b => b.session_date && new Date(b.session_date) > now).sort((a,b) => new Date(a.session_date) - new Date(b.session_date))[0];
  const firstBooking = [...clientBookings].sort((a,b) => new Date(a.session_date||a.created_date) - new Date(b.session_date||b.created_date))[0];
  const joinDateRaw = firstBooking ? new Date(firstBooking.session_date || firstBooking.created_date) : null;
  const isNew = joinDateRaw && (now_ - joinDateRaw.getTime()) < msMonth;
  const lv = lastVisitDays === 999 ? 999 : lastVisitDays;
  const _action = deriveAction({ lastVisit:lv, isNew, retentionScore:score, sessionsThisMonth, sessionsLastMonth });
  return {
    id:userId, name:clientName||'Client', status, goal:'General Fitness',
    retentionScore:score, retentionHistory,
    sessionsThisMonth, sessionsLastMonth,
    lastVisit:lv, streak, consecutiveMissed:noShows.length,
    joinDate: firstBooking ? new Date(firstBooking.session_date||firstBooking.created_date).toLocaleDateString('en-GB',{month:'short',year:'numeric'}) : '—',
    isNew, injuries:[], notes:'', _action,
    nextSession: nextBooking ? new Date(nextBooking.session_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) : null,
  };
}
/* ─── CONSTANTS ──────────────────────────────────────────────── */
const COACH_ACTIONS = [
  'Check in','Book session','Send message',
  'Celebrate progress','Missed sessions',
  'Custom plan offer','Upgrade plan','Welcome back',
];
const MSG_PRESET = {
  'Check in':           fn => Hey ${fn}, just checking in — how are things going? Let me know if you need anything.,
  'Book session':       fn => Hi ${fn}, I have some slots available this week. Want to book in for a session?,
  'Send message':       fn => Hi ${fn}, hope you're well! Wanted to touch base and see how training's going.,
  'Celebrate progress': fn => ${fn} — you've been absolutely crushing it lately! Your consistency is seriously impressive.,
  'Missed sessions':    fn => Hi ${fn}, we noticed you haven't been in for a bit. Just checking everything's okay.,
  'Custom plan offer':  fn => Hey ${fn}, I've been thinking about your goals and have ideas for a custom plan. Interested?,
  'Upgrade plan':       fn => Hey ${fn}, given how consistent you've been, I think you'd benefit from stepping up your plan.,
  'Welcome back':       fn => Hi ${fn}, great to have you back! We've got exciting sessions lined up — let's pick up where you left off.,
};
/* ─── DATA ───────────────────────────────────────────────────── */
function buildRetentionTrend(clients) {
  if (!clients.length) return W_[LABELS.map](http://LABELS.map)(w => ({ w, v:0 }));
  return W_[LABELS.map](http://LABELS.map)((w, i) => ({
    w,
    v: Math.round(clients.reduce((s,c) => s + (c.retentionHistory?.[i]||0), 0) / clients.length),
  }));
}
function buildScoreDist(clients) {
  const total = clients.length || 1;
  return [
    { label:'Healthy', pct:Math.round(clients.filter(c=>c.retentionScore>=80).length/total*100), note:'Thriving', color:[C.green](http://C.green) },
    { label:'Stable',  pct:Math.round(clients.filter(c=>c.retentionScore>=60&&c.retentionScore<80).length/total*100), note:'Consistent', color:C.t2 },
    { label:'Caution', pct:Math.round(clients.filter(c=>c.retentionScore>=40&&c.retentionScore<60).length/total*100), note:'Watch closely', color:C.amber },
    { label:'At Risk', pct:Math.round(clients.filter(c=>c.retentionScore<40).length/total*100), note:'Act now', color:[C.red](http://C.red) },
  ];
}
/* ─── MOBILE HOOK ────────────────────────────────────────────── */
function useIsMobile() {
  const [m, setM] = useState(typeof window!=='undefined' ? window.innerWidth<768 : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth<768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}
/* ─── AV ─────────────────────────────────────────────────────── */
function Av({ client, size=30, avatarMap={} }) {
  const col  = AV_COLORS[([client.id](http://client.id)||[client.name](http://client.name)||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_COLORS.length];
  const src  = avatarMap[[client.id](http://client.id)] || client.avatar || null;
  const ini  = ([client.name](http://client.name)||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  if (src) return <img src={src} alt={[client.name](http://client.name)} style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, objectFit:'cover', border:1.5px solid ${col}55 }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:col+'1a', color:col, fontSize:size*0.32, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:1.5px solid ${col}33, fontFamily:'monospace' }}>
      {ini}
    </div>
  );
}
/* ─── CHART TOOLTIP ──────────────────────────────────────────── */
function ChartTip({ active, payload, suffix='' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'
#111c2a', border:1px solid ${C.cyanB}, borderRadius:7, padding:'5px 10px', fontSize:11.5, color:C.t1 }}>
      <span style={{ color:C.cyan, fontWeight:700 }}>{payload[0].value}{suffix}</span>
    </div>
  );
}
/* ─── RIGHT PANEL ────────────────────────────────────────────── */
function RightPanel({ allClients, totalClients, activeCount, atRiskCount, newCount, avgScore }) {
  const retentionTrend = useMemo(() => buildRetentionTrend(allClients), [allClients]);
  const atRiskTrend    = useMemo(() => W_[LABELS.map](http://LABELS.map)((w,i) => ({
    w, v: allClients.length
      ? Math.round(allClients.filter(c => (c.retentionHistory?.[i]||0) < 40).length / allClients.length * 100)
      : 0,
  })), [allClients]);
  const scoreDist = useMemo(() => buildScoreDist(allClients), [allClients]);
  const sc = scoreColor(avgScore);
  return (
    <div className="tcm2-rpanel" style={{ width:240, flexShrink:0, background:C.sidebar, borderLeft:1px solid ${C.brd}, display:'flex', flexDirection:'column', overflowY:'auto', fontFamily:FONT }}>
      {/* Total */}
      <div style={{ padding:'16px 16px 14px', borderBottom:1px solid ${C.brd} }}>
        <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Total Clients</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div style={{ fontSize:38, fontWeight:700, color:C.t1, letterSpacing:'-0.03em', lineHeight:1 }}>{totalClients}</div>
          {avgScore > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:4 }}>
              <span style={{ fontSize:9, color:C.t3, textTransform:'uppercase', letterSpacing:'.04em' }}>avg</span>
              <span style={{ fontSize:16, fontWeight:700, color:sc }}>{avgScore}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize:11, color:C.t3, marginTop:5 }}>active roster</div>
      </div>
      {/* 4-stat grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:C.brd, borderBottom:1px solid ${C.brd} }}>
        {[
          { label:'Active',    val:activeCount, col:C.cyan },
          { label:'At Risk',   val:atRiskCount, col:[C.red](http://C.red)  },
          { label:'New',       val:newCount,    col:[C.blue](http://C.blue) },
          { label:'Avg Score', val:avgScore,    col:sc     },
        ].map((s,i) => (
          <div key={i} style={{ padding:'12px 14px', background:C.sidebar }}>
            <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.col, lineHeight:1 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {/* Retention Trend */}
      <div style={{ padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.t1 }}>Retention Trend</span>
          <span style={{ fontSize:10, color:C.t3 }}>8wk</span>
        </div>
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={retentionTrend} margin={{ top:4, right:4, bottom:0, left:-28 }}>
            <defs>
              <linearGradient id="rtcg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="w" tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} domain={[0,100]} />
            <Tooltip content={<ChartTip suffix="%" />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#rtcg)" dot={false}
              activeDot={{ r:3, fill:C.cyan, strokeWidth:2, stroke:C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height:1, background:C.brd }} />
      {/* At-Risk Trend */}
      <div style={{ padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.t1 }}>Churn Risk</span>
          <span style={{ fontSize:10, color:C.t3 }}>8wk avg</span>
        </div>
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={atRiskTrend} margin={{ top:4, right:4, bottom:0, left:-28 }}>
            <defs>
              <linearGradient id="rrcg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={[C.red](http://C.red)} stopOpacity={0.35} />
                <stop offset="100%" stopColor={[C.red](http://C.red)} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="w" tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} domain={[0,100]} />
            <Tooltip content={<ChartTip suffix="%" />} />
            <Area type="monotone" dataKey="v" stroke={[C.red](http://C.red)} strokeWidth={2} fill="url(#rrcg)" dot={false}
              activeDot={{ r:3, fill:[C.red](http://C.red), strokeWidth:2, stroke:C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height:1, background:C.brd }} />
      {/* Score Distribution */}
      <div style={{ padding:'14px 16px 16px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:C.t1, marginBottom:12 }}>Score Distribution</div>
        {[scoreDist.map](http://scoreDist.map)((b,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:10, color:C.t2, width:42, flexShrink:0 }}>{b.label}</span>
            <div style={{ flex:1, height:3, background:C.brd, borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:${b.pct}%, height:'100%', background:b.color, borderRadius:2, opacity:.7, transition:'width .5s cubic-bezier(.16,1,.3,1)' }} />
            </div>
            <span style={{ fontSize:10, fontWeight:600, color:C.t2, width:24, textAlign:'right' }}>{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
/* ─── ACTION DROPDOWN ────────────────────────────────────────── */
function ActionDropdown({ client, onMessage }) {
  const [open, setOpen] = useState(false);
  const [sel,  setSel]  = useState(client._action || 'Check in');
  return (
    <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o=>!o)} style={{
        display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
        borderRadius:6, background:C.cyanD, border:1px solid ${C.cyanB},
        color:C.cyan, fontSize:11, fontWeight:600, cursor:'pointer',
        whiteSpace:'nowrap', fontFamily:FONT,
      }}>
        {sel.length > 18 ? sel.slice(0,18)+'…' : sel}
        <ChevronDown style={{ width:9, height:9, flexShrink:0 }} />
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }} />
          <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, zIndex:100, background:C.card2, border:1px solid ${C.brd2}, borderRadius:8, overflow:'hidden', minWidth:185, boxShadow:'0 8px 24px rgba(0,0,0,0.45)' }}>
            {COACH_[ACTIONS.map](http://ACTIONS.map)(a => (
              <div key={a} onClick={() => { setSel(a); setOpen(false); onMessage({ ...client, _action:a }); }}
                style={{ padding:'8px 12px', fontSize:12, color:a===sel?C.cyan:C.t2, cursor:'pointer', fontFamily:FONT, background:a===sel?C.cyanD:'transparent', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'background .1s' }}
                onMouseEnter={e=>{ if(a!==sel) [e.currentTarget.style](http://e.currentTarget.style).background=C.card; }}
                onMouseLeave={e=>{ if(a!==sel) [e.currentTarget.style](http://e.currentTarget.style).background='transparent'; }}>
                {a}
                {a === sel && <Check style={{ width:10, height:10, color:C.cyan }} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
/* ─── TABLE LAYOUT ───────────────────────────────────────────── */
const GRID = '1.7fr 112px 100px 88px 100px 190px';
function TableHead({ sort, setSort }) {
  const cols = [
    { label:'CLIENT',     key:'name'      },
    { label:'STATUS',     key:null        },
    { label:'LAST VISIT', key:'lastVisit' },
    { label:'SESSIONS',   key:'sessions'  },
    { label:'SCORE',      key:'score'     },
    { label:'ACTION',     key:null        },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:GRID, gap:12, padding:'7px 18px', borderBottom:1px solid ${C.brd}, background:C.card, fontFamily:FONT, flexShrink:0 }}>
      {[cols.map](http://cols.map)((c,i) => (
        <div key={i} onClick={()=>c.key&&setSort(c.key)} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:sort===c.key?C.t2:C.t3, cursor:c.key?'pointer':'default', justifyContent:i===cols.length-1?'flex-end':'flex-start' }}>
          {c.label}
          {c.key && <ChevronDown style={{ width:8, height:8, color:C.t3 }} />}
        </div>
      ))}
    </div>
  );
}
/* ─── CLIENT ROW ─────────────────────────────────────────────── */
function ClientRow({ client, isPrev, onPreview, onMessage, isLast, avatarMap }) {
  const sc   = scoreColor(client.retentionScore);
  const tier = scoreTier(client.retentionScore);
  const delta = client.sessionsThisMonth - client.sessionsLastMonth;
  const visitLabel = client.lastVisit===0?'Today':client.lastVisit===1?'Yesterday':client.lastVisit>=999?'Never':${client.lastVisit}d ago;
  const visitCol   = client.lastVisit>=14?[C.red](http://C.red):client.lastVisit<=1?C.cyan:C.t2;
  return (
    <div onClick={()=>onPreview(client)} className="tcm2-row" style={{ display:'grid', gridTemplateColumns:GRID, gap:12, padding:'11px 18px', alignItems:'center', background:isPrev?'
#1a1a1e':'transparent', borderBottom:isLast?'none':1px solid ${C.brd}, borderLeft:2px solid ${isPrev?C.cyan:client.status==='at_risk'?[C.red](http://C.red):'transparent'}, fontFamily:FONT }}>
      {/* CLIENT */}
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <Av client={client} size={30} avatarMap={avatarMap} />
          {client.streak >= 5 && (
            <div style={{ position:'absolute', top:-2, right:-2, width:11, height:11, borderRadius:'50%', background:C.card, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Flame style={{ width:7, height:7, color:C.amber }} />
            </div>
          )}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:isPrev?C.cyan:C.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{[client.name](http://client.name)}</div>
          <div style={{ fontSize:10.5, color:C.t3, marginTop:1 }}>{client.isNew?'New client':client.goal||'Member'}</div>
        </div>
      </div>
      {/* STATUS */}
      <div>
        <span style={{ padding:'3px 8px', borderRadius:20, background:[tier.bg](http://tier.bg), border:1px solid ${tier.bdr}, fontSize:10, fontWeight:700, color:tier.color, whiteSpace:'nowrap' }}>
          {tier.label}
        </span>
      </div>
      {/* LAST VISIT */}
      <div>
        <div style={{ fontSize:11, color:C.t3, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>Gym</div>
        <div style={{ fontSize:12.5, fontWeight:600, color:visitCol }}>{visitLabel}</div>
      </div>
      {/* SESSIONS */}
      <div>
        <div style={{ fontSize:11, color:C.t3, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>This mo.</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
          <span style={{ fontSize:12.5, fontWeight:700, color:C.t1 }}>{client.sessionsThisMonth}</span>
          {delta!==0 && <span style={{ fontSize:9.5, fontWeight:700, color:delta>0?[C.green](http://C.green):[C.red](http://C.red) }}>{delta>0?'+':''}{delta}</span>}
        </div>
      </div>
      {/* SCORE */}
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:sc, lineHeight:1 }}>{client.retentionScore}</div>
        <div style={{ fontSize:9.5, color:C.t3, marginTop:2 }}>{tier.label.toLowerCase()}</div>
      </div>
      {/* ACTION */}
      <div onClick={e=>e.stopPropagation()} style={{ display:'flex', justifyContent:'flex-end' }}>
        <ActionDropdown client={client} onMessage={onMessage} />
      </div>
    </div>
  );
}
/* ─── PENDING ROW ────────────────────────────────────────────── */
function PendingRow({ invite, onCancel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ini = (n='') => (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const col = AV_COLORS[(invite.member_name||'').charCodeAt(0) % AV_COLORS.length];
  return (
    <div style={{ display:'grid', gridTemplateColumns:GRID, gap:12, padding:'11px 18px', alignItems:'center', borderBottom:1px solid ${C.brd}, opacity:0.65, fontFamily:FONT, background:'transparent' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:col+'1a', color:col, fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:1.5px solid ${col}33, fontFamily:'monospace' }}>{ini(invite.member_name)}</div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{invite.member_name}</div>
          <div style={{ fontSize:10.5, color:C.t3, marginTop:1 }}>Invite sent · awaiting response</div>
        </div>
      </div>
      <div><span style={{ padding:'3px 8px', borderRadius:20, background:C.cyanD, border:1px solid ${C.cyanB}, fontSize:10, fontWeight:700, color:C.cyan }}>Pending</span></div>
      <div /><div /><div />
      <div style={{ display:'flex', justifyContent:'flex-end', position:'relative' }}>
        <button onClick={e=>{e.stopPropagation();setMenuOpen(v=>!v);}} style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:1px solid ${C.brd}, color:C.t3, cursor:'pointer' }}>
          <MoreHorizontal style={{ width:12 }} />
        </button>
        {menuOpen && (
          <>
            <div onClick={()=>setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }} />
            <div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', zIndex:100, background:C.card2, border:1px solid ${C.brd2}, borderRadius:8, overflow:'hidden', minWidth:140, boxShadow:'0 8px 24px rgba(0,0,0,0.45)' }}>
              <button className="tcm2-btn" onClick={()=>{setMenuOpen(false);onCancel?.(invite);}} style={{ width:'100%', justifyContent:'flex-start', gap:8, padding:'10px 14px', background:'transparent', color:[C.red](http://C.red), fontSize:12, fontWeight:600 }}>
                <XCircle style={{ width:12 }} /> Cancel Invite
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
/* ─── FILTER TABS ────────────────────────────────────────────── */
function FilterTabs({ filter, setFilter, counts }) {
  const tabs = [
    { id:'all',        label:'All',        count:counts.all                    },
    { id:'at_risk',    label:'At Risk',    count:counts.atRisk,   dot:[C.red](http://C.red)    },
    { id:'dropping',   label:'Dropping',   count:counts.dropping, dot:C.amber  },
    { id:'new',        label:'New',        count:[counts.new](http://counts.new),      dot:[C.blue](http://C.blue)   },
    { id:'high_value', label:'High Value', count:counts.highValue, dot:[C.green](http://C.green) },
    { id:'inactive',   label:'Inactive',   count:counts.inactive               },
  ];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, borderBottom:1px solid ${C.brd}, padding:'0 18px', background:C.card, fontFamily:FONT, flexShrink:0 }}>
      {[tabs.map](http://tabs.map)(t => {
        const on = filter === [t.id](http://t.id);
        return (
          <button key={[t.id](http://t.id)} onClick={()=>setFilter([t.id](http://t.id))} style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 10px', cursor:'pointer', background:'transparent', border:'none', borderBottom:on?2px solid ${C.cyan}:'2px solid transparent', color:on?C.t1:C.t2, fontSize:12, fontWeight:on?700:400, fontFamily:FONT, transition:'color .15s', marginBottom:-1 }}>
            {[t.dot](http://t.dot) && <div style={{ width:5, height:5, borderRadius:'50%', background:[t.dot](http://t.dot), opacity:on?1:0.5 }} />}
            {t.label}
            {t.count>0 && <span style={{ fontSize:9.5, color:on?C.t2:C.t3 }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
/* ─── CLIENT PREVIEW (slide-in) ──────────────────────────────── */
function ClientPreview({ client, onClose, onMessage, avatarMap }) {
  const sc      = scoreColor(client.retentionScore);
  const tier    = scoreTier(client.retentionScore);
  const trend   = trendOf(client.retentionHistory);
  const reasons = riskReasons(client);
  const sr      = successRate(client);
  const activeInj = (client.injuries||[]).filter(i=>i.severity!=='Cleared').length;
  return (
    <div className="tcm2-preview" style={{ position:'fixed', top:0, right:240, bottom:0, width:264, background:C.sidebar, borderLeft:1px solid ${C.brd}, zIndex:200, display:'flex', flexDirection:'column', boxShadow:'-10px 0 30px rgba(0,0,0,0.5)', fontFamily:FONT }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Av client={client} size={34} avatarMap={avatarMap} />
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.t1 }}>{[client.name](http://client.name)}</div>
            <div style={{ fontSize:10.5, color:C.t3, marginTop:2 }}>Since {client.joinDate} · {client.sessionsThisMonth+client.sessionsLastMonth} sessions</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width:24, height:24, borderRadius:6, background:'transparent', border:1px solid ${C.brd}, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X style={{ width:10, height:10, color:C.t3 }} />
        </button>
      </div>
      {/* Body */}
      <div className="tcm2-scr" style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:10 }}>
        {/* Stat grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {[
            { label:'Last Visit',  val:client.lastVisit>=999?'Never':client.lastVisit===0?'Today':${client.lastVisit}d ago, col:client.lastVisit>=14?[C.red](http://C.red):client.lastVisit<=1?C.cyan:C.t1 },
            { label:'Sessions/mo', val:${client.sessionsThisMonth}, col:C.t1 },
            { label:'Streak',      val:client.streak>0?${client.streak}d:'—', col:client.streak>=14?C.amber:C.t1 },
            { label:'Score',       val:${client.retentionScore}, col:sc },
          ].map((s,i) => (
            <div key={i} style={{ padding:'10px', borderRadius:8, background:C.card, border:1px solid ${C.brd} }}>
              <div style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:s.col }}>{s.val}</div>
            </div>
          ))}
        </div>
        {/* Streak badge */}
        {client.streak >= 7 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)' }}>
            <Flame style={{ width:13, height:13, color:C.amber, flexShrink:0 }} />
            <span style={{ fontSize:12, fontWeight:600, color:C.amber }}>{client.streak}-day streak</span>
          </div>
        )}
        {/* Risk */}
        {client.status === 'at_risk' && (
          <div style={{ padding:'10px 12px', borderRadius:8, background:C.redD, border:1px solid ${C.redB}, borderLeft:3px solid ${[C.red](http://C.red)} }}>
            <div style={{ fontSize:11, fontWeight:700, color:[C.red](http://C.red), marginBottom:3 }}>High churn risk</div>
            <div style={{ fontSize:10.5, color:C.t2, lineHeight:1.5 }}>{reasons[0]||'Low engagement'}</div>
          </div>
        )}
        {/* Injuries */}
        {activeInj > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, background:C.amberD, border:1px solid ${C.amberB} }}>
            <ShieldAlert style={{ width:13, height:13, color:C.amber, flexShrink:0 }} />
            <span style={{ fontSize:12, fontWeight:600, color:C.amber }}>{activeInj} active restriction{activeInj>1?'s':''}</span>
          </div>
        )}
        {/* Recommended action */}
        <div style={{ padding:'10px 12px', borderRadius:8, background:C.card, border:1px solid ${C.brd} }}>
          <div style={{ fontSize:9.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Recommended Action</div>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.t1, marginBottom:6 }}>{client._action}</div>
          <div style={{ height:2, background:C.brd, borderRadius:2, overflow:'hidden', marginBottom:4 }}>
            <div style={{ width:${sr}%, height:'100%', background:C.cyan, borderRadius:2 }} />
          </div>
          <div style={{ fontSize:10.5, color:C.t3 }}>{sr}% predicted success</div>
        </div>
        {/* Tier badge */}
        <div style={{ padding:'8px 12px', borderRadius:8, background:[tier.bg](http://tier.bg), border:1px solid ${tier.bdr}, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, fontWeight:600, color:tier.color }}>{tier.label}</span>
          <span style={{ fontSize:10, color:C.t3 }}>retention tier</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ padding:'12px 14px', borderTop:1px solid ${C.brd} }}>
        <button onClick={()=>onMessage(client)} style={{ width:'100%', padding:'9px', borderRadius:8, background:C.cyan, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontFamily:FONT }}>
          <Send style={{ width:11, height:11 }} /> {client._action}
        </button>
      </div>
    </div>
  );
}
/* ─── MESSAGE TOAST ──────────────────────────────────────────── */
function MessageToast({ client, onClose }) {
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState('');
  useEffect(() => {
    if (client) {
      const fn = ([client.name](http://client.name)||'there').split(' ')[0];
      setBody(MSG_PRESET[client._action]?.(fn) || Hi ${fn}, just checking in!);
      setSent(false);
    }
  }, [client?.id, client?._action]);
  if (!client) return null;
  const fn = ([client.name](http://client.name)||'there').split(' ')[0];
  return (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', width:330, background:C.sidebar, border:1px solid ${C.brd2}, borderRadius:11, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:300, overflow:'hidden', fontFamily:FONT }}>
      <div style={{ padding:'10px 14px', borderBottom:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Bell style={{ width:11, height:11, color:C.t3 }} />
          <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Message</span>
          <span style={{ fontSize:10.5, color:C.t3 }}>→ {fn}</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}>
          <X style={{ width:11, height:11, color:C.t3 }} />
        </button>
      </div>
      <div style={{ padding:'12px 14px' }}>
        <textarea value={body} onChange={e=>setBody([e.target](http://e.target).value)} rows={3} style={{ width:'100%', boxSizing:'border-box', background:C.card, border:1px solid ${C.brd}, borderRadius:7, padding:'9px 11px', fontSize:11.5, color:C.t1, resize:'none', outline:'none', lineHeight:1.6, fontFamily:FONT }} />
        <div style={{ marginTop:4, fontSize:10.5, color:C.t3 }}>{successRate(client)}% predicted response rate</div>
        <button onClick={()=>{ setSent(true); setTimeout(onClose, 1600); }} style={{ marginTop:9, width:'100%', padding:'8px', borderRadius:8, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:sent?C.card:C.cyan, color:sent?C.cyan:'#fff', transition:'all 0.2s', fontFamily:FONT }}>
          {sent ? <><Check style={{ width:11 }} /> Sent</> : <><Send style={{ width:11 }} /> Send to {fn}</>}
        </button>
      </div>
    </div>
  );
}
/* ─── ADD CLIENT MODAL ───────────────────────────────────────── */
function AddClientModal({ open, onClose, availableMembers=[], existingClientIds=[], pendingClientIds=[], onAdd }) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(null);
  const [added,  setAdded]  = useState(new Set());
  useEffect(() => { if (open) { setSearch(''); setAdded(new Set()); } }, [open]);
  if (!open) return null;
  const filtered = availableMembers.filter(m => {
    const id = m.user_id || [m.id](http://m.id);
    if (existingClientIds.includes(id) || pendingClientIds.includes(id) || added.has(id)) return false;
    return !search.trim() || (m.user_name||[m.name](http://m.name)||'').toLowerCase().includes(search.toLowerCase());
  });
  async function handleAdd(m) {
    const id = m.user_id || [m.id](http://m.id);
    setAdding(id);
    await new Promise(r => setTimeout(r, 500));
    setAdded(p => new Set([...p, id]));
    setAdding(null);
    onAdd?.(m);
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:460, background:C.card, borderRadius:16, border:1px solid ${C.brd}, overflow:'hidden', animation:'tcm2ModalIn .28s cubic-bezier(.16,1,.3,1) both', boxShadow:'0 24px 60px rgba(0,0,0,0.6)', fontFamily:FONT }}>
        <div style={{ padding:'18px 20px 16px', borderBottom:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.t1 }}>Add Client</div>
            <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>Invite a member to your coaching roster</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, background:'transparent', border:1px solid ${C.brd}, color:C.t3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X style={{ width:12 }} />
          </button>
        </div>
        <div style={{ padding:'14px 20px 10px' }}>
          <div style={{ position:'relative' }}>
            <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:C.t3, pointerEvents:'none' }} />
            <input value={search} onChange={e=>setSearch([e.target](http://e.target).value)} placeholder="Search members…" className="tcm2-input" style={{ paddingLeft:36 }} autoFocus />
          </div>
        </div>
        <div className="tcm2-scr" style={{ maxHeight:320, overflowY:'auto', padding:'0 12px 16px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 20px', color:C.t3, fontSize:12 }}>No members available</div>
          ) : [filtered.map](http://filtered.map)((m,i) => {
            const id = m.user_id||[m.id](http://m.id);
            const name = m.user_name||[m.name](http://m.name)||'Member';
            const isAdded = added.has(id);
            const isBusy  = adding === id;
            const col = AV_COLORS[name.charCodeAt(0)%AV_COLORS.length];
            return (
              <div key={id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 8px', borderRadius:8, marginBottom:2, transition:'background .13s' }}
                onMouseEnter={e=>[e.currentTarget.style](http://e.currentTarget.style).background='#1a1a1e'}
                onMouseLeave={e=>[e.currentTarget.style](http://e.currentTarget.style).background='transparent'}>
                <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:col+'1a', color:col, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:1.5px solid ${col}33, fontFamily:'monospace' }}>
                  {name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.t1 }}>{name}</div>
                  {[m.email](http://m.email) && <div style={{ fontSize:11, color:C.t3, marginTop:1 }}>{[m.email](http://m.email)}</div>}
                </div>
                <button onClick={()=>handleAdd(m)} disabled={isAdded||isBusy} style={{ padding:'6px 14px', borderRadius:7, fontSize:11.5, fontWeight:600, background:isAdded?C.greenD:C.cyanD, border:1px solid ${isAdded?C.greenB:C.cyanB}, color:isAdded?[C.green](http://C.green):C.cyan, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:FONT }}>
                  {isAdded ? <><CheckCircle style={{ width:10 }} /> Added</> : isBusy ? 'Adding…' : <><UserPlus style={{ width:10 }} /> Add</>}
                </button>
              </div>
            );
          })}
        </div>
        {added.size > 0 && (
          <div style={{ padding:'12px 20px', borderTop:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:[C.green](http://C.green) }}>{added.size} client{added.size>1?'s':''} added</span>
            <button onClick={onClose} style={{ padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:700, background:C.cyan, color:'#fff', border:'none', cursor:'pointer', fontFamily:FONT }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
/* ─── BOTTOM SHEET ───────────────────────────────────────────── */
function BottomSheet({ open, onClose, maxHeight='88vh', children, noPadding=false }) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (open) { const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setV(true))); return ()=>cancelAnimationFrame(id); }
    else setV(false);
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, fontFamily:FONT }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', opacity:v?1:0, transition:'opacity 0.3s ease' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:C.sidebar, borderRadius:'22px 22px 0 0', border:1px solid ${C.brd}, borderBottom:'none', maxHeight, display:'flex', flexDirection:'column', transform:translateY(${v?'0':'100%'}), transition:'transform 0.38s cubic-bezier(0.32,0.72,0,1)', overflow:'hidden' }}>
        <div style={{ padding:'14px 0 6px', display:'flex', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.brd2 }} />
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>{children}</div>
      </div>
    </div>
  );
}
/* ─── MOBILE FILTER CHIPS ────────────────────────────────────── */
function MobileFilterChips({ filter, setFilter, counts }) {
  const chips = [
    { id:'all',        label:'All',        count:counts.all,       dot:null    },
    { id:'at_risk',    label:'At Risk',    count:counts.atRisk,    dot:[C.red](http://C.red)   },
    { id:'dropping',   label:'Dropping',   count:counts.dropping,  dot:C.amber },
    { id:'new',        label:'New',        count:[counts.new](http://counts.new),       dot:[C.blue](http://C.blue)  },
    { id:'high_value', label:'High Value', count:counts.highValue, dot:[C.green](http://C.green) },
    { id:'inactive',   label:'Inactive',   count:counts.inactive,  dot:null    },
  ];
  return (
    <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'10px 16px', background:[C.bg](http://C.bg), flexShrink:0, scrollbarWidth:'none' }}>
      {[chips.map](http://chips.map)(chip => {
        const on = filter === [chip.id](http://chip.id);
        return (
          <button key={[chip.id](http://chip.id)} onClick={()=>setFilter([chip.id](http://chip.id))} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:24, flexShrink:0, whiteSpace:'nowrap', background:on?C.cyanD:C.card, border:1.5px solid ${on?C.cyanB:C.brd}, color:on?C.cyan:C.t2, fontSize:13, fontWeight:on?700:500, cursor:'pointer', fontFamily:FONT, transition:'all 0.15s' }}>
            {[chip.dot](http://chip.dot) && <div style={{ width:7, height:7, borderRadius:'50%', background:[chip.dot](http://chip.dot), opacity:on?1:0.6 }} />}
            {chip.label}
            {chip.count>0 && <span style={{ padding:'1px 7px', borderRadius:12, background:on?C.cyanB:C.brd2, color:on?C.cyan:C.t3, fontSize:11, fontWeight:700 }}>{chip.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
/* ─── MOBILE CLIENT CARD ─────────────────────────────────────── */
function MobileClientCard({ client, onPreview, onMessage, avatarMap }) {
  const sc   = scoreColor(client.retentionScore);
  const tier = scoreTier(client.retentionScore);
  const vl   = client.lastVisit===0?'Today':client.lastVisit>=999?'Never':${client.lastVisit}d ago;
  const vc   = client.lastVisit>=14?[C.red](http://C.red):client.lastVisit<=1?C.cyan:C.t2;
  return (
    <div onClick={()=>onPreview(client)} style={{ margin:'0 12px 10px', borderRadius:16, background:C.card, border:1.5px solid ${C.brd}, overflow:'hidden', cursor:'pointer', fontFamily:FONT }}>
      <div style={{ padding:'14px 14px 12px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <Av client={client} size={44} avatarMap={avatarMap} />
          {client.streak>=5 && <div style={{ position:'absolute', top:-3, right:-3, width:18, height:18, borderRadius:'50%', background:C.card, display:'flex', alignItems:'center', justifyContent:'center', border:1px solid ${C.brd} }}><Flame style={{ width:10, height:10, color:C.amber }} /></div>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <div style={{ fontSize:15.5, fontWeight:700, color:C.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{[client.name](http://client.name)}</div>
            <span style={{ padding:'4px 10px', borderRadius:20, background:[tier.bg](http://tier.bg), border:1px solid ${tier.bdr}, fontSize:10.5, fontWeight:700, color:tier.color, whiteSpace:'nowrap', flexShrink:0 }}>{tier.label}</span>
          </div>
          <div style={{ fontSize:12, color:C.t3 }}>{client.isNew?'New client':client.goal} · {client.sessionsThisMonth} sessions/mo</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:1px solid ${C.brd}, background:C.card2 }}>
        {[
          { label:'Last Visit', val:vl, col:vc },
          { label:'Sessions',   val:client.sessionsThisMonth, col:C.t2 },
          { label:'Score',      val:client.retentionScore, col:sc },
        ].map((stat,i) => (
          <div key={i} style={{ padding:'10px 12px', borderRight:i<2?1px solid ${C.brd}:'none' }}>
            <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{stat.label}</div>
            <div style={{ fontSize:13.5, fontWeight:700, color:stat.col }}>{stat.val}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:'12px 14px', borderTop:1px solid ${C.brd} }}>
        <button onClick={e=>{e.stopPropagation();onMessage(client);}} style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:C.cyanD, border:1.5px solid ${C.cyanB}, color:C.cyan, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Send style={{ width:14, height:14, flexShrink:0 }} />
            <span>{(client._action||'').length>22?client._action.slice(0,22)+'…':client._action}</span>
          </div>
          <ChevronRight style={{ width:14, height:14, flexShrink:0, opacity:0.6 }} />
        </button>
      </div>
    </div>
  );
}
/* ─── MOBILE PREVIEW SHEET ───────────────────────────────────── */
function MobilePreviewSheet({ client, onClose, onMessage, avatarMap }) {
  const [sheetOpen, setSheetOpen] = useState(true);
  const sc      = scoreColor(client.retentionScore);
  const tier    = scoreTier(client.retentionScore);
  const reasons = riskReasons(client);
  const sr      = successRate(client);
  const handleClose  = () => { setSheetOpen(false); setTimeout(onClose,400); };
  const handleAction = () => { handleClose(); setTimeout(()=>onMessage(client),50); };
  return (
    <BottomSheet open={sheetOpen} onClose={handleClose} maxHeight="90vh" noPadding>
      <div style={{ padding:'4px 18px 16px', borderBottom:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Av client={client} size={48} avatarMap={avatarMap} />
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:C.t1 }}>{[client.name](http://client.name)}</div>
            <div style={{ fontSize:12.5, color:C.t3, marginTop:3 }}>Since {client.joinDate} · score {client.retentionScore}</div>
          </div>
        </div>
        <button onClick={handleClose} style={{ width:34, height:34, borderRadius:9, background:C.card, border:1px solid ${C.brd}, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X style={{ width:14, height:14, color:C.t3 }} />
        </button>
      </div>
      <div className="tcm2-scr" style={{ flex:1, overflowY:'auto', padding:'16px 16px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          {[
            { label:'Last Visit',  val:client.lastVisit>=999?'Never':client.lastVisit===0?'Today':${client.lastVisit}d ago, col:client.lastVisit>=14?[C.red](http://C.red):client.lastVisit<=1?C.cyan:C.t1, sub:client.lastVisit>=14?'Needs attention':'Good' },
            { label:'Sessions/mo', val:${client.sessionsThisMonth}, col:C.t1, sub:was ${client.sessionsLastMonth} last month },
            { label:'Streak',      val:client.streak>0?${client.streak}d:'—', col:client.streak>=14?C.amber:C.t1, sub:'consecutive days' },
            { label:'Score',       val:${client.retentionScore}, col:sc, sub:tier.label },
          ].map((s,i) => (
            <div key={i} style={{ padding:'14px', borderRadius:12, background:C.card, border:1px solid ${C.brd} }}>
              <div style={{ fontSize:10.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:19, fontWeight:700, color:s.col, marginBottom:4 }}>{s.val}</div>
              <div style={{ fontSize:11, color:C.t3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        {reasons.length>0 && client.retentionScore<50 && (
          <div style={{ padding:'14px 16px', borderRadius:12, marginBottom:14, background:C.redD, border:1px solid ${C.redB} }}>
            <div style={{ fontSize:11, fontWeight:700, color:[C.red](http://C.red), marginBottom:4 }}>High churn risk</div>
            <div style={{ fontSize:12, color:C.t2, lineHeight:1.55 }}>{reasons.join(' · ')}</div>
          </div>
        )}
        <div style={{ padding:'16px', borderRadius:12, marginBottom:16, background:C.cyanD, border:1.5px solid ${C.cyanB} }}>
          <div style={{ fontSize:10.5, color:C.cyan, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8, fontWeight:700 }}>Recommended Action</div>
          <div style={{ fontSize:15, fontWeight:700, color:C.t1, marginBottom:12 }}>{client._action}</div>
          <div style={{ height:4, background:'rgba(77,127,255,0.15)', borderRadius:2, overflow:'hidden', marginBottom:6 }}>
            <div style={{ width:${sr}%, height:'100%', background:C.cyan, borderRadius:2 }} />
          </div>
          <div style={{ fontSize:11.5, color:C.t2 }}><span style={{ color:C.cyan, fontWeight:700 }}>{sr}%</span> predicted success rate</div>
        </div>
      </div>
      <div style={{ padding:'14px 16px 28px', borderTop:1px solid ${C.brd}, flexShrink:0 }}>
        <button onClick={handleAction} style={{ width:'100%', padding:'15px', borderRadius:14, background:C.cyan, border:'none', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <Send style={{ width:15, height:15 }} />{client._action}
        </button>
      </div>
    </BottomSheet>
  );
}
/* ─── MOBILE MESSAGE SHEET ───────────────────────────────────── */
function MobileMessageSheet({ client, onClose }) {
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(true);
  const fn = (client?.name||'there').split(' ')[0];
  const [body, setBody] = useState(() => MSG_PRESET[client?._action]?.(fn) || Hi ${fn}, just checking in!);
  const handleClose = () => { setOpen(false); setTimeout(onClose,400); };
  if (!client) return null;
  return (
    <BottomSheet open={open} onClose={handleClose} maxHeight="75vh" noPadding>
      <div style={{ padding:'4px 18px 14px', borderBottom:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:C.cyanD, border:1px solid ${C.cyanB}, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bell style={{ width:16, height:16, color:C.cyan }} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.t1, fontFamily:FONT }}>Send Message</div>
            <div style={{ fontSize:11.5, color:C.t3, marginTop:2, fontFamily:FONT }}>→ {[client.name](http://client.name)} · {client._action}</div>
          </div>
        </div>
        <button onClick={handleClose} style={{ width:32, height:32, borderRadius:8, background:C.card, border:1px solid ${C.brd}, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X style={{ width:13, height:13, color:C.t3 }} />
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
        <textarea value={body} onChange={e=>setBody([e.target](http://e.target).value)} rows={4} style={{ width:'100%', boxSizing:'border-box', background:C.card, border:1px solid ${C.brd}, borderRadius:12, padding:'13px 14px', fontSize:14, color:C.t1, resize:'none', outline:'none', lineHeight:1.65, fontFamily:FONT }} />
        <div style={{ fontSize:12, color:C.t3, marginBottom:16, marginTop:8 }}><span style={{ color:C.cyan, fontWeight:700 }}>{successRate(client)}%</span> predicted response rate</div>
        <button onClick={()=>{ setSent(true); setTimeout(handleClose,1800); }} disabled={sent} style={{ width:'100%', padding:'15px', borderRadius:14, border:'none', fontSize:15, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:sent?C.card:C.cyan, color:sent?C.cyan:'#fff', transition:'all 0.25s', fontFamily:FONT }}>
          {sent ? <><Check style={{ width:15, height:15 }} /> Sent!</> : <><Send style={{ width:15, height:15 }} /> Send to {fn}</>}
        </button>
      </div>
    </BottomSheet>
  );
}
/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabCoachMembers({
  coach            = null,
  bookings         = [],
  checkIns         = [],
  avatarMap        = {},
  now              = new Date(),
  pendingInvites   = [],
  acceptedInvites  = [],
  availableMembers = [],
  onAddClient      = null,
  onCancelInvite   = null,
  onSetTab         = null,
  openModal        = () => {},
}) {
  const isMobile = useIsMobile();
  const [filter,       setFilter]      = useState('all');
  const [sort,         setSort]        = useState('lastVisit');
  const [search,       setSearch]      = useState('');
  const [preview,      setPreview]     = useState(null);
  const [msgTarget,    setMsgTarget]   = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statsOpen,    setStatsOpen]   = useState(false);
  const [localPending, setLocalPending] = useState(pendingInvites);
  useEffect(() => setLocalPending(pendingInvites), [pendingInvites]);
  useEffect(() => {
    const h = () => setShowAddModal(true);
    window.addEventListener('coachOpenAddClient', h);
    return () => window.removeEventListener('coachOpenAddClient', h);
  }, []);
  /* Build clients */
  const allClients = useMemo(() => {
    const byClient = {};
    bookings.forEach(b => {
      if (!b.client_id) return;
      if (!byClient[b.client_id]) byClient[b.client_id] = { name:b.client_name||'Client', bookings:[] };
      byClient[b.client_id].bookings.push(b);
    });
    acceptedInvites.forEach(inv => {
      if (!byClient[inv.member_id]) byClient[inv.member_id] = { name:inv.member_name||'Client', bookings:[] };
    });
    return Object.entries(byClient).map(([userId, { name, bookings:cb }]) => ({
      ...buildClientFromBookings(userId, name, cb, checkIns, now),
      avatar: avatarMap?.[userId] || null,
    }));
  }, [bookings, acceptedInvites, checkIns, avatarMap, now]);
  /* Derived stats */
  const totalClients = allClients.length;
  const activeCount  = allClients.filter(c => c.status === 'active').length;
  const atRiskCount  = allClients.filter(c => c.status === 'at_risk').length;
  const newCount     = allClients.filter(c => c.isNew).length;
  const avgScore     = totalClients ? Math.round(allClients.reduce((s,c)=>s+c.retentionScore,0)/totalClients) : 0;
  const counts = useMemo(() => ({
    all:       totalClients + localPending.length,
    atRisk:    atRiskCount,
    dropping:  allClients.filter(c => c.status==='paused' && c.lastVisit>=14).length,
    new:       newCount,
    highValue: allClients.filter(c => c.retentionScore>=80).length,
    inactive:  allClients.filter(c => c.lastVisit>=14||c.lastVisit>=999).length,
  }), [allClients, localPending.length, atRiskCount, newCount, totalClients]);
  /* Filter + sort */
  const visible = useMemo(() => {
    let list = [...allClients];
    if (filter==='at_risk')    list=list.filter(c=>c.status==='at_risk');
    if (filter==='dropping')   list=list.filter(c=>c.status==='paused'&&c.lastVisit>=14);
    if (filter==='new')        list=list.filter(c=>c.isNew);
    if (filter==='high_value') list=list.filter(c=>c.retentionScore>=80);
    if (filter==='inactive')   list=list.filter(c=>c.lastVisit>=14||c.lastVisit>=999);
    if (search.trim()) { const q=search.toLowerCase(); list=list.filter(c=>([c.name](http://c.name)||'').toLowerCase().includes(q)); }
    return list.sort((a,b) =>
      sort==='name'     ? [a.name](http://a.name).localeCompare([b.name](http://b.name)) :
      sort==='score'    ? b.retentionScore-a.retentionScore :
      sort==='sessions' ? b.sessionsThisMonth-a.sessionsThisMonth :
      a.lastVisit-b.lastVisit
    );
  }, [allClients, filter, sort, search]);
  const handleMsg     = useCallback(c => { setMsgTarget(c); setPreview(null); }, []);
  const handlePreview = useCallback(c => { setPreview(p => p?.id===[c.id](http://c.id) ? null : c); }, []);
  const acceptedIds   = [allClients.map](http://allClients.map)(c => [c.id](http://c.id));
  const pendingIds    = [localPending.map](http://localPending.map)(i => i.member_id);
  const showPending   = filter === 'all';
  /* ── MOBILE ──────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="tcm2" style={{ display:'flex', flexDirection:'column', height:'100%', background:[C.bg](http://C.bg), color:C.t1, overflow:'hidden' }}>
        <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:100, background:[C.bg](http://C.bg), borderBottom:1px solid ${C.brd} }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 10px' }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.t1 }}>Members CRM</div>
              <div style={{ fontSize:11, color:C.t3 }}>{totalClients} clients · {atRiskCount} at risk</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {atRiskCount>0 && <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, background:C.redD, border:1px solid ${C.redB}, fontSize:12, color:[C.red](http://C.red), fontWeight:700 }}><div style={{ width:6, height:6, borderRadius:'50%', background:[C.red](http://C.red) }} />{atRiskCount}</div>}
              <button onClick={()=>setStatsOpen(true)} style={{ width:40, height:40, borderRadius:11, background:C.cyanD, border:1px solid ${C.cyanB}, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <BarChart2 style={{ width:16, height:16, color:C.cyan }} />
              </button>
            </div>
          </div>
          <div style={{ padding:'0 16px 12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:C.card, border:1px solid ${C.brd}, borderRadius:12, padding:'10px 14px' }}>
              <Search style={{ width:14, height:14, color:C.t3, flexShrink:0 }} />
              <input value={search} onChange={e=>setSearch([e.target](http://e.target).value)} placeholder="Search clients…" style={{ flex:1, background:'none', border:'none', outline:'none', color:C.t1, fontSize:14, fontFamily:FONT }} />
            </div>
          </div>
          <MobileFilterChips filter={filter} setFilter={setFilter} counts={counts} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 16px 8px' }}>
            <span style={{ fontSize:12, color:C.t3 }}>{visible.length} client{visible.length!==1?'s':''}</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <SlidersHorizontal style={{ width:12, height:12, color:C.t3 }} />
              <select value={sort} onChange={e=>setSort([e.target](http://e.target).value)} style={{ background:'transparent', border:'none', color:C.t2, fontSize:12, outline:'none', cursor:'pointer', fontFamily:FONT, appearance:'none' }}>
                <option value="lastVisit">Last visit</option>
                <option value="score">Score</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
        </div>
        <div className="tcm2-scr" style={{ flex:1, overflowY:'auto', paddingTop:10, paddingBottom:20 }}>
          {visible.length===0 ? (
            <div style={{ padding:'64px 16px', textAlign:'center' }}>
              <Users style={{ width:36, height:36, color:C.t3, margin:'0 auto 14px', display:'block' }} />
              <div style={{ fontSize:15, color:C.t2, fontWeight:600, fontFamily:FONT }}>No clients match</div>
              <div style={{ fontSize:12.5, color:C.t3, marginTop:6, fontFamily:FONT }}>Try a different filter</div>
            </div>
          ) : [visible.map](http://visible.map)(c => <MobileClientCard key={[c.id](http://c.id)} client={c} onPreview={handlePreview} onMessage={c=>setMsgTarget(c)} avatarMap={avatarMap} />)}
        </div>
        {preview   && <MobilePreviewSheet client={preview}   onClose={()=>setPreview(null)}   onMessage={handleMsg} avatarMap={avatarMap} />}
        {msgTarget && <MobileMessageSheet client={msgTarget} onClose={()=>setMsgTarget(null)} />}
        {statsOpen && (
          <BottomSheet open={statsOpen} onClose={()=>setStatsOpen(false)} maxHeight="92vh" noPadding>
            <div style={{ padding:'4px 18px 16px', borderBottom:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div><div style={{ fontSize:16, fontWeight:700, color:C.t1, fontFamily:FONT }}>Analytics</div><div style={{ fontSize:11.5, color:C.t3, marginTop:2, fontFamily:FONT }}>Client retention data</div></div>
              <button onClick={()=>setStatsOpen(false)} style={{ width:34, height:34, borderRadius:9, background:C.card, border:1px solid ${C.brd}, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X style={{ width:14, height:14, color:C.t3 }} /></button>
            </div>
            <div className="tcm2-scr" style={{ flex:1, overflowY:'auto', padding:'16px', fontFamily:FONT }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  { label:'Total Clients', val:totalClients, col:C.t1, full:true },
                  { label:'Active',    val:activeCount, col:C.cyan },
                  { label:'At Risk',   val:atRiskCount, col:[C.red](http://C.red)  },
                  { label:'New',       val:newCount,    col:[C.blue](http://C.blue) },
                  { label:'Avg Score', val:avgScore,    col:scoreColor(avgScore) },
                ].filter((_,i)=>i>0).map((s,i) => (
                  <div key={i} style={{ padding:'16px', borderRadius:14, background:C.card, border:1px solid ${C.brd} }}>
                    <div style={{ fontSize:10.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{s.label}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:s.col, lineHeight:1 }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.t1 }}>Retention Trend</div>
                  <div style={{ fontSize:11, color:C.t3 }}>8 weeks</div>
                </div>
                <div style={{ background:C.card, border:1px solid ${C.brd}, borderRadius:14, padding:'14px 10px 8px' }}>
                  <ResponsiveContainer width="100%" height={110}>
                    <AreaChart data={buildRetentionTrend(allClients)} margin={{ top:4, right:4, bottom:0, left:-26 }}>
                      <defs><linearGradient id="rtcgm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="w" tick={{ fill:C.t3, fontSize:10, fontFamily:FONT }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.t3, fontSize:10, fontFamily:FONT }} axisLine={false} tickLine={false} domain={[0,100]} />
                      <Tooltip content={<ChartTip suffix="%" />} />
                      <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2.5} fill="url(#rtcgm)" dot={false} activeDot={{ r:4, fill:C.cyan, strokeWidth:2, stroke:C.card }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.t1, marginBottom:14 }}>Score Distribution</div>
                <div style={{ background:C.card, border:1px solid ${C.brd}, borderRadius:14, overflow:'hidden' }}>
                  {buildScoreDist(allClients).map((b,i,arr) => (
                    <div key={i} style={{ padding:'14px 16px', borderBottom:i<arr.length-1?1px solid ${C.brd}:'none' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div><span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>{b.label}</span><span style={{ fontSize:11, color:C.t3, marginLeft:8 }}>{b.note}</span></div>
                        <span style={{ fontSize:14, fontWeight:700, color:b.color }}>{b.pct}%</span>
                      </div>
                      <div style={{ height:5, background:C.brd, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:${b.pct}%, height:'100%', background:b.color, borderRadius:3, opacity:.75 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BottomSheet>
        )}
        <AddClientModal open={showAddModal} onClose={()=>setShowAddModal(false)} availableMembers={availableMembers} existingClientIds={acceptedIds} pendingClientIds={pendingIds} onAdd={onAddClient} />
      </div>
    );
  }
  /* ── DESKTOP ─────────────────────────────────────────────── */
  return (
    <div className="tcm2" style={{ display:'flex', height:'100%', background:[C.bg](http://C.bg), color:C.t1, fontFamily:FONT, overflow:'hidden' }}>
      <AddClientModal open={showAddModal} onClose={()=>setShowAddModal(false)} availableMembers={availableMembers} existingClientIds={acceptedIds} pendingClientIds={pendingIds} onAdd={onAddClient} />
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          {/* Header */}
          <div style={{ padding:'14px 18px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:1px solid ${C.brd}, flexShrink:0 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:C.t1, letterSpacing:'-0.02em' }}>
                Members <span style={{ color:C.t3, fontWeight:300 }}>/</span>{' '}
                <span style={{ color:C.cyan }}>CRM</span>
              </div>
              <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{totalClients} clients · AI-powered retention</div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {atRiskCount>0 && (
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, background:C.redD, border:1px solid ${C.redB}, fontSize:11.5, color:[C.red](http://C.red), fontWeight:600 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:[C.red](http://C.red), animation:'tcm2Pulse 2s ease infinite' }} />
                  {atRiskCount} At Risk
                </div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.04)', border:1px solid ${C.brd}, borderRadius:7, padding:'5px 10px' }}>
                <Search style={{ width:11, height:11, color:C.t3, flexShrink:0 }} />
                <input value={search} onChange={e=>setSearch([e.target](http://e.target).value)} placeholder="Search clients…" style={{ background:'transparent', border:'none', outline:'none', color:C.t1, fontSize:12, width:150, fontFamily:FONT }} />
              </div>
              <select value={sort} onChange={e=>setSort([e.target](http://e.target).value)} style={{ padding:'6px 10px', borderRadius:7, background:C.card, border:1px solid ${C.brd}, color:C.t2, fontSize:11.5, outline:'none', cursor:'pointer', fontFamily:FONT }}>
                <option value="lastVisit">Last visit</option>
                <option value="score">Highest score</option>
                <option value="sessions">Sessions</option>
                <option value="name">Name A–Z</option>
              </select>
              <button onClick={()=>setShowAddModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:7, background:C.cyan, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>
                <UserPlus style={{ width:12, height:12 }} /> Add Client
              </button>
            </div>
          </div>
          <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />
          {/* Table */}
          <div className="tcm2-scr" style={{ flex:1, overflowY:'auto' }}>
            <TableHead sort={sort} setSort={setSort} />
            {showPending && [localPending.map](http://localPending.map)(inv => (
              <PendingRow key={[inv.id](http://inv.id)} invite={inv} onCancel={c => { setLocalPending(p=>p.filter(i=>[i.id](http://i.id)!==[c.id](http://c.id))); onCancelInvite?.(c); }} />
            ))}
            {visible.length === 0 && !(showPending && localPending.length) ? (
              <div style={{ padding:'48px 16px', textAlign:'center' }}>
                <Users style={{ width:28, height:28, color:C.t3, margin:'0 auto 10px', display:'block' }} />
                <div style={{ fontSize:13, color:C.t2, fontFamily:FONT }}>
                  {totalClients === 0 ? 'No clients yet — add your first client above' : 'No clients match this filter'}
                </div>
              </div>
            ) : [visible.map](http://visible.map)((c,i) => (
              <ClientRow
                key={[c.id](http://c.id)} client={c}
                isPrev={preview?.id === [c.id](http://c.id)}
                onPreview={handlePreview}
                onMessage={handleMsg}
                isLast={i === visible.length-1}
                avatarMap={avatarMap}
              />
            ))}
            <div style={{ padding:'8px 18px', borderTop:1px solid ${C.brd}, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
              <span style={{ fontSize:10.5, color:C.t3 }}>{visible.length} of {totalClients} clients{showPending&&localPending.length? · ${localPending.length} pending:''}</span>
            </div>
          </div>
        </div>
        <RightPanel
          allClients={allClients}
          totalClients={totalClients}
          activeCount={activeCount}
          atRiskCount={atRiskCount}
          newCount={newCount}
          avgScore={avgScore}
        />
      </div>
      {preview   && <ClientPreview client={preview}   onClose={()=>setPreview(null)}   onMessage={handleMsg} avatarMap={avatarMap} />}
      {msgTarget && <MessageToast  client={msgTarget} onClose={()=>setMsgTarget(null)} />}
    </div>
  );
}       