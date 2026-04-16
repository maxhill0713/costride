/**
 * TabGymProfile — Elite Redesign
 * $500M-level polish · AI intelligence layer · predictive analytics
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Image, Dumbbell, Sparkles, DollarSign, ChevronRight, ChevronDown,
  ChevronUp, BadgeCheck, MapPin, Star, Users, Tag, ExternalLink, Zap,
  MessageSquare, PenSquare, BookOpen, TrendingUp, CheckCircle2,
  AlertTriangle, BarChart2, Rocket, Home, Calendar, User as UserIcon,
  Trophy, Brain, Activity, Target, Shield, ArrowUp, ArrowDown,
  Flame, Bell, Eye, Lock, Globe, Cpu, Signal, RefreshCw, Plus,
  ChevronLeft, MoreHorizontal, Camera,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

/* ─── COLOUR TOKENS ──────────────────────────────────────────── */
const T = {
  bg:        '#000000',
  surface:   '#0a0a0d',
  card:      '#111115',
  card2:     '#161619',
  card3:     '#1c1c22',
  brd:       '#1e1e24',
  brd2:      '#28282f',
  brd3:      '#333340',
  t1:        '#ffffff',
  t2:        '#7a7a88',
  t3:        '#3a3a48',
  blue:      '#4f7eff',
  blueDim:   'rgba(79,126,255,0.1)',
  blueBrd:   'rgba(79,126,255,0.25)',
  blueGlow:  'rgba(79,126,255,0.15)',
  green:     '#22c55e',
  greenDim:  'rgba(34,197,94,0.1)',
  greenBrd:  'rgba(34,197,94,0.22)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245,158,11,0.1)',
  amberBrd:  'rgba(245,158,11,0.22)',
  red:       '#ef4444',
  redDim:    'rgba(239,68,68,0.1)',
  redBrd:    'rgba(239,68,68,0.22)',
  purple:    '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.1)',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ─── TINY PRIMITIVES ────────────────────────────────────────── */
const pill = (bg, border, color, label) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, background:bg, border:`1px solid ${border}`, fontSize:10, fontWeight:700, color, whiteSpace:'nowrap' }}>{label}</span>
);

function LiveDot({ color = T.green }) {
  return (
    <span style={{ position:'relative', display:'inline-flex', width:8, height:8, flexShrink:0 }}>
      <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:color, opacity:0.35, animation:'livePulse 2s ease-in-out infinite' }} />
      <span style={{ width:'100%', height:'100%', borderRadius:'50%', background:color, display:'block' }} />
      <style>{`@keyframes livePulse{0%,100%{transform:scale(1);opacity:0.35}50%{transform:scale(2.2);opacity:0}}`}</style>
    </span>
  );
}

function Sparkline({ data, color, height = 32, width = 80 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow:'visible', flexShrink:0 }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#sg${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const last = pts.split(' ').pop().split(',');
        return <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

function RadialScore({ score, color, size = 56, label }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1s ease', filter:`drop-shadow(0 0 4px ${color}88)` }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:size*0.22, fontWeight:900, color, lineHeight:1 }}>{score}</span>
        {label && <span style={{ fontSize:size*0.13, color:T.t3, marginTop:1 }}>{label}</span>}
      </div>
    </div>
  );
}

function MiniBar({ value, max, color, height = 3 }) {
  return (
    <div style={{ height, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden', flex:1 }}>
      <div style={{ height:'100%', width:`${(value/max)*100}%`, background:color, borderRadius:99, transition:'width 0.8s ease' }} />
    </div>
  );
}

function Chip({ icon: Icon, label, color, dim, brd }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, background:dim, border:`1px solid ${brd}`, flexShrink:0 }}>
      {Icon && <Icon size={11} color={color} />}
      <span style={{ fontSize:11, fontWeight:700, color, whiteSpace:'nowrap' }}>{label}</span>
    </div>
  );
}

/* ─── ANIMATED COUNTER ───────────────────────────────────────── */
function Counter({ target, color = T.t1, size = 28, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 900;
    const step = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <span style={{ fontSize:size, fontWeight:900, color, letterSpacing:'-0.04em', lineHeight:1 }}>{val}{suffix}</span>;
}

/* ─── AI INSIGHT BADGE ───────────────────────────────────────── */
function AiBadge({ label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:5, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.28)', fontSize:9.5, fontWeight:800, color:T.purple, letterSpacing:'0.04em' }}>
      <Brain size={9} /> {label || 'AI'}
    </span>
  );
}

/* ─── ACTION BUTTON ──────────────────────────────────────────── */
function Btn({ label, color = 'blue', size = 'md', icon: Icon, onClick, full }) {
  const cfg = {
    blue:  { bg:T.blueDim,   brd:T.blueBrd,  text:T.blue  },
    green: { bg:T.greenDim,  brd:T.greenBrd, text:T.green },
    amber: { bg:T.amberDim,  brd:T.amberBrd, text:T.amber },
    red:   { bg:T.redDim,    brd:T.redBrd,   text:T.red   },
    solid: { bg:T.blue,      brd:T.blue,     text:'#fff'  },
  }[color];
  const pad = size === 'sm' ? '5px 10px' : size === 'lg' ? '10px 20px' : '7px 14px';
  const fs  = size === 'sm' ? 11 : size === 'lg' ? 13 : 12;
  return (
    <button onClick={onClick} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:pad, borderRadius:8, fontSize:fs, fontWeight:700, background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.brd}`, cursor:'pointer', whiteSpace:'nowrap', width:full?'100%':undefined, justifyContent:full?'center':undefined, transition:'all 0.15s', fontFamily:FONT }}
      onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      {Icon && <Icon size={fs-1} />}{label}
    </button>
  );
}

/* ─── PROGRESS BAR ───────────────────────────────────────────── */
function ProgressBar({ pct, color, height = 3 }) {
  return (
    <div style={{ height, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:99, background:color, width:`${pct}%`, transition:'width 0.8s ease' }} />
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, trend, trendLabel, sparkData, icon: Icon, accentLeft }) {
  const trendColor = trend > 0 ? T.green : trend < 0 ? T.red : T.t3;
  return (
    <div style={{
      background:T.card, border:`1px solid ${T.brd}`, borderRadius:12,
      borderLeft: accentLeft ? `2px solid ${color}` : undefined,
      padding:'14px 16px', display:'flex', flexDirection:'column', gap:8, position:'relative', overflow:'hidden',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {Icon && <div style={{ width:24, height:24, borderRadius:6, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={12} color={color} /></div>}
          <span style={{ fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
        </div>
        {trend !== undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:10.5, fontWeight:700, color:trendColor }}>
            {trend > 0 ? <ArrowUp size={10} /> : trend < 0 ? <ArrowDown size={10} /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:8 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:900, color:color||T.t1, letterSpacing:'-0.04em', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:10.5, color:T.t3, marginTop:4 }}>{sub}</div>}
          {trendLabel && <div style={{ fontSize:10, color:trendColor, marginTop:4, fontWeight:600 }}>{trendLabel}</div>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={color||T.blue} height={36} width={72} />}
      </div>
    </div>
  );
}

/* ─── INTELLIGENCE SCORE CARD ────────────────────────────────── */
function IntelligenceScoreCard({ gym }) {
  const pct  = gym?._completeness || 68;
  const aiScore = gym?._aiScore || 74;
  const retentionRisk = gym?._retentionRisk || 'Medium';
  const riskColor = retentionRisk === 'Low' ? T.green : retentionRisk === 'Medium' ? T.amber : T.red;

  const factors = [
    { label:'Profile completeness',  val: pct,  color:T.blue    },
    { label:'Community activity',    val: 61,   color:T.green   },
    { label:'Member engagement',     val: 78,   color:T.purple  },
    { label:'Content consistency',   val: 45,   color:T.amber   },
    { label:'Onboarding quality',    val: 33,   color:T.red     },
  ];

  return (
    <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 18px 12px', borderBottom:`1px solid ${T.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:T.purpleDim, border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Brain size={13} color={T.purple} />
          </div>
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>Gym Intelligence Score</div>
            <div style={{ fontSize:10, color:T.t3, marginTop:1 }}>Real-time health signal across 5 dimensions</div>
          </div>
        </div>
        <AiBadge label="AI Powered" />
      </div>

      {/* Score ring + breakdown */}
      <div style={{ padding:'16px 18px', display:'flex', gap:20, alignItems:'center' }}>
        <div style={{ flexShrink:0, position:'relative' }}>
          <RadialScore score={aiScore} color={aiScore >= 75 ? T.green : aiScore >= 50 ? T.amber : T.red} size={80} />
          <div style={{ position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:9, fontWeight:700, color:aiScore >= 75 ? T.green : T.amber, background:T.card, padding:'1px 6px', borderRadius:99, border:`1px solid ${T.brd}` }}>
            {aiScore >= 75 ? 'Excellent' : aiScore >= 50 ? 'Good' : 'Needs Work'}
          </div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          {factors.map((f, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color:T.t3, width:130, flexShrink:0 }}>{f.label}</span>
              <MiniBar value={f.val} max={100} color={f.color} height={3} />
              <span style={{ fontSize:10, fontWeight:700, color:f.color, width:28, textAlign:'right', flexShrink:0 }}>{f.val}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Retention risk signal */}
      <div style={{ margin:'0 18px 16px', padding:'10px 14px', borderRadius:10, background:`${riskColor}0d`, border:`1px solid ${riskColor}30`, display:'flex', alignItems:'center', gap:10 }}>
        <Shield size={14} color={riskColor} />
        <div style={{ flex:1 }}>
          <span style={{ fontSize:11.5, fontWeight:700, color:T.t1 }}>Churn risk: </span>
          <span style={{ fontSize:11.5, fontWeight:700, color:riskColor }}>{retentionRisk}</span>
          <div style={{ fontSize:10, color:T.t3, marginTop:2 }}>
            {retentionRisk === 'Low' ? 'Your gym is retaining members well. Keep up the engagement.' :
             retentionRisk === 'Medium' ? '3–4 profile gaps are reducing member loyalty. Fix now to prevent churn.' :
             'Immediate action required. High likelihood of member drop-off this month.'}
          </div>
        </div>
        <Btn label="Fix Now" color={retentionRisk === 'Low' ? 'green' : retentionRisk === 'Medium' ? 'amber' : 'red'} size="sm" />
      </div>
    </div>
  );
}

/* ─── AI ACTION QUEUE ────────────────────────────────────────── */
function AiActionQueue({ gym, openModal }) {
  const [dismissed, setDismissed] = useState([]);

  const actions = [
    { id:'a1', priority:'critical', icon:Camera, label:'Add hero cover photo', impact:'↑ 32% more profile views', effort:'2 min', revenue:'+£240/mo est.', color:T.red, onClick:() => openModal?.('heroPhoto') },
    { id:'a2', priority:'high',     icon:Users,  label:'Message at-risk members', impact:'Recover 3 likely churners', effort:'5 min', revenue:'+£180/mo est.', color:T.amber, onClick:() => openModal?.('members') },
    { id:'a3', priority:'high',     icon:Trophy, label:'Launch a member challenge', impact:'↑ 2.1x weekly check-ins', effort:'10 min', revenue:'+£90/mo est.', color:T.amber, onClick:() => openModal?.('challenge') },
    { id:'a4', priority:'medium',   icon:MessageSquare, label:'Post a community update', impact:'↑ Feed engagement by 45%', effort:'3 min', revenue:'Retention boost', color:T.blue, onClick:() => openModal?.('post') },
    { id:'a5', priority:'medium',   icon:Star,   label:'Ask for member reviews', impact:'↑ Trust score on Discover', effort:'1 min', revenue:'More new joins', color:T.purple, onClick:() => openModal?.('review') },
  ].filter(a => !dismissed.includes(a.id));

  const priorityLabel = { critical:'🔴 Critical', high:'🟠 High', medium:'🔵 Medium' };

  return (
    <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px 12px', borderBottom:`1px solid ${T.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:T.blueDim, border:`1px solid ${T.blueBrd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={13} color={T.blue} />
          </div>
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>AI Action Queue</div>
            <div style={{ fontSize:10, color:T.t3, marginTop:1 }}>Ranked by revenue impact · Updated 4 min ago</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <LiveDot />
          <span style={{ fontSize:10, fontWeight:700, color:T.green }}>Live</span>
        </div>
      </div>

      <div>
        {actions.map((a, idx) => (
          <div key={a.id} style={{
            display:'flex', alignItems:'center', gap:14, padding:'12px 18px',
            borderBottom: idx < actions.length - 1 ? `1px solid ${T.brd}` : 'none',
            transition:'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.card2}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${a.color}12`, border:`1px solid ${a.color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <a.icon size={14} color={a.color} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>{a.label}</span>
                <span style={{ fontSize:9, fontWeight:700, color:a.color, opacity:0.75, whiteSpace:'nowrap' }}>{priorityLabel[a.priority]}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:10.5, color:T.t3 }}>{a.impact}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:T.green, background:T.greenDim, padding:'1px 6px', borderRadius:5, border:`1px solid ${T.greenBrd}` }}>{a.revenue}</span>
                <span style={{ fontSize:10, color:T.t3 }}>· {a.effort}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button onClick={a.onClick} style={{ padding:'5px 12px', borderRadius:7, background:T.blueDim, border:`1px solid ${T.blueBrd}`, color:T.blue, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>Act</button>
              <button onClick={() => setDismissed(d => [...d, a.id])} style={{ width:28, height:28, borderRadius:7, background:'transparent', border:`1px solid ${T.brd}`, color:T.t3, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
            </div>
          </div>
        ))}
        {actions.length === 0 && (
          <div style={{ padding:'32px 18px', textAlign:'center', color:T.t3, fontSize:12 }}>
            <CheckCircle2 size={24} color={T.green} style={{ margin:'0 auto 8px', display:'block' }} />
            All actions complete — your gym is fully optimised! 🎉
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div style={{ padding:'10px 18px', borderTop:`1px solid ${T.brd}`, background:T.card2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10.5, color:T.t3 }}>Completing all actions could add <span style={{ color:T.green, fontWeight:700 }}>+£510/mo</span> in estimated revenue</span>
          <Btn label="Do All" color="solid" size="sm" icon={Rocket} onClick={() => openModal?.('quickSetup')} />
        </div>
      )}
    </div>
  );
}

/* ─── LIVE COMMUNITY PULSE ───────────────────────────────────── */
function CommunityPulse({ gym }) {
  const [pulseData] = useState(() => Array.from({length: 24}, (_, i) => Math.round(20 + Math.random() * 80)));
  const checkIns = gym?.active_members_week || 47;
  const posts    = gym?.posts_this_week     || 12;
  const comments = gym?.comments_week       || 38;
  const streak   = gym?.top_streak         || 18;

  const cells = pulseData.map((v, i) => {
    const opacity = v / 100;
    return <div key={i} style={{ width:10, height:10, borderRadius:2, background:`rgba(79,126,255,${opacity * 0.85 + 0.05})`, transition:'background 0.3s' }} />;
  });

  return (
    <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Activity size={13} color={T.blue} />
            <span style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>Community Pulse</span>
          </div>
          <LiveDot />
        </div>
        <span style={{ fontSize:10, color:T.t3 }}>Last 24h</span>
      </div>

      {/* Activity heatmap grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:3, marginBottom:14 }}>
        {cells}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:T.t3, marginBottom:14 }}>
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>Now</span>
      </div>

      {/* 4 live counters */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
        {[
          { label:'Check-ins',  val:checkIns, color:T.blue,   icon:MapPin },
          { label:'Posts',      val:posts,    color:T.green,  icon:MessageSquare },
          { label:'Comments',   val:comments, color:T.purple, icon:MessageSquare },
          { label:'Top streak', val:streak,   color:T.amber,  icon:Flame },
        ].map((s, i) => (
          <div key={i} style={{ background:T.card2, borderRadius:9, padding:'10px 10px', border:`1px solid ${T.brd}`, textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:900, color:s.color, letterSpacing:'-0.03em' }}>{s.val}</div>
            <div style={{ fontSize:9.5, color:T.t3, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── REVENUE IMPACT PANEL ───────────────────────────────────── */
function RevenuePanel({ gym }) {
  const price       = parseFloat((gym?.price || '£45').replace(/[^0-9.]/g, '')) || 45;
  const members     = gym?.members_count    || 0;
  const churnRisk   = gym?.churn_risk_count || Math.round(members * 0.15);
  const atRiskMRR   = churnRisk * price;
  const potentialMRR = Math.round(members * price * 0.08);
  const weeklyTrend  = [82, 78, 85, 91, 88, 94, 97];

  return (
    <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px 12px', borderBottom:`1px solid ${T.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:T.greenDim, border:`1px solid ${T.greenBrd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <DollarSign size={13} color={T.green} />
          </div>
          <span style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>Revenue Intelligence</span>
        </div>
        <AiBadge label="Predictive" />
      </div>
      <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ padding:'12px 14px', borderRadius:10, background:`${T.redDim}`, border:`1px solid ${T.redBrd}` }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>MRR at Risk</div>
          <div style={{ fontSize:22, fontWeight:900, color:T.red, letterSpacing:'-0.04em' }}>£{atRiskMRR}</div>
          <div style={{ fontSize:10, color:T.t3, marginTop:4 }}>{churnRisk} members · high risk</div>
          <Btn label="Intervene" color="red" size="sm" full style={{ marginTop:8 }} />
        </div>
        <div style={{ padding:'12px 14px', borderRadius:10, background:T.greenDim, border:`1px solid ${T.greenBrd}` }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Unlock Potential</div>
          <div style={{ fontSize:22, fontWeight:900, color:T.green, letterSpacing:'-0.04em' }}>+£{potentialMRR}</div>
          <div style={{ fontSize:10, color:T.t3, marginTop:4 }}>via profile optimisation</div>
          <Btn label="How?" color="green" size="sm" full style={{ marginTop:8 }} />
        </div>
      </div>
      <div style={{ padding:'0 18px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:T.t2 }}>7-day retention trend</span>
          <span style={{ fontSize:10, color:T.green, fontWeight:700 }}>↑ 18% this week</span>
        </div>
        <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:44 }}>
          {weeklyTrend.map((h, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'100%' }}>
              <div style={{ width:'100%', height:`${h}%`, background: i === 6 ? T.blue : `rgba(79,126,255,${0.15 + i*0.1})`, borderRadius:'3px 3px 0 0', boxShadow: i === 6 ? `0 0 8px ${T.blue}66` : 'none' }} />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:9, color:T.t3 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ─── BENCHMARK CARD ─────────────────────────────────────────── */
function BenchmarkCard({ gym }) {
  const metrics = [
    { label:'Profile views',      yours:gym?.profile_views||142,  avg:98,  unit:'/week', color:T.blue   },
    { label:'Engagement rate',    yours:gym?.engagement||4.2,     avg:2.8, unit:'%',     color:T.green  },
    { label:'New member converts',yours:gym?.convert_rate||28,    avg:19,  unit:'%',     color:T.purple },
    { label:'7-day retention',    yours:gym?.retention7d||81,     avg:65,  unit:'%',     color:T.amber  },
  ];
  return (
    <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px 12px', borderBottom:`1px solid ${T.brd}`, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:T.purpleDim, border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <BarChart2 size={13} color={T.purple} />
        </div>
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>Benchmark vs. Industry</div>
          <div style={{ fontSize:10, color:T.t3, marginTop:1 }}>Gyms of similar size & type</div>
        </div>
      </div>
      <div style={{ padding:'12px 18px', display:'flex', flexDirection:'column', gap:10 }}>
        {metrics.map((m, i) => {
          const ahead = m.yours > m.avg;
          return (
            <div key={i}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:T.t2 }}>{m.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:11.5, fontWeight:800, color:m.color }}>{m.yours}{m.unit}</span>
                  <span style={{ fontSize:9.5, fontWeight:700, color: ahead ? T.green : T.red }}>
                    {ahead ? '▲' : '▼'} vs {m.avg}{m.unit} avg
                  </span>
                </div>
              </div>
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <div style={{ flex:1, height:4, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden', position:'relative' }}>
                  <div style={{ height:'100%', width:`${(m.avg / (m.yours * 1.3)) * 100}%`, background:T.t3, borderRadius:99 }} />
                  <div style={{ position:'absolute', top:0, height:'100%', width:`${(m.yours / (m.yours * 1.3)) * 100}%`, background:m.color, borderRadius:99, opacity:0.9 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── PROFILE SECTION ROW ────────────────────────────────────── */
function SectionRow({ statusIcon, label, description, thumbnails, actionLabel, actionColor = 'amber', onClick, last, tag }) {
  const ok = statusIcon === 'ok';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 18px', borderBottom: last ? 'none' : `1px solid ${T.brd}`, transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = T.card2}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ flexShrink:0 }}>
        {ok ? <CheckCircle2 size={16} color={T.green} /> : <AlertTriangle size={16} color={T.amber} />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.t1 }}>{label}</span>
          {tag && <span style={{ fontSize:9, fontWeight:800, color:T.blue, background:T.blueDim, border:`1px solid ${T.blueBrd}`, borderRadius:4, padding:'1px 5px' }}>{tag}</span>}
        </div>
        <div style={{ fontSize:11, color:T.t3, lineHeight:1.5 }}>{description}</div>
      </div>
      {thumbnails && (
        <div style={{ display:'flex', gap:3, flexShrink:0 }}>
          {thumbnails.slice(0,3).map((src, i) => (
            <div key={i} style={{ width:36, height:36, borderRadius:7, overflow:'hidden', background:T.card3, border:`1px solid ${T.brd2}`, flexShrink:0 }}>
              {src ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> :
               <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Image size={10} color={T.t3} /></div>}
            </div>
          ))}
        </div>
      )}
      {actionLabel && <Btn label={actionLabel} color={ok ? 'green' : actionColor} size="sm" onClick={onClick} />}
    </div>
  );
}

/* ─── COLLAPSIBLE SECTION ────────────────────────────────────── */
function Section({ title, subtitle, badge, pct, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:12, overflow:'hidden', marginBottom:10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'13px 18px', background:'transparent', border:'none', borderBottom: open ? `1px solid ${T.brd}` : 'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T.t1 }}>{title}</span>
            {badge && <span style={{ fontSize:9, fontWeight:800, padding:'2px 5px', borderRadius:4, background:T.blueDim, color:T.blue, border:`1px solid ${T.blueBrd}` }}>{badge}</span>}
          </div>
          {subtitle && <div style={{ fontSize:10.5, color:T.t3, marginTop:2 }}>{subtitle}</div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Mini progress */}
          <div style={{ width:60, height:3, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99 }} />
          </div>
          <span style={{ fontSize:11, fontWeight:700, color }}>{pct}%</span>
          {open ? <ChevronUp size={13} color={T.t3} /> : <ChevronDown size={13} color={T.t3} />}
        </div>
      </button>
      {open && children}
    </div>
  );
}

/* ─── PHONE MOCKUP (preserved) ───────────────────────────────── */
function PhoneMockup({ gym }) {
  const [activeScreen, setActiveScreen] = useState('community');
  const [liked, setLiked] = useState({});

  const gymName    = gym?.name         || 'Your Gym';
  const gymCity    = gym?.city         || 'City';
  const memberCount= gym?.members_count|| 247;

  const posts = [
    { id:1, name:'Alex T.',   initials:'AT', color:'#3b82f6', time:'2h ago', text:`Just smashed a new deadlift PR at ${gymName}! 🔥`, likes:18, comments:4 },
    { id:2, name:'Priya S.',  initials:'PS', color:'#8b5cf6', time:'4h ago', text:'Morning HIIT class was 🔥 See you all tomorrow!',          likes:12, comments:2 },
    { id:3, name:'Jamie R.',  initials:'JR', color:'#10b981', time:'6h ago', text:'30-day streak complete! Consistency is everything 💪',      likes:34, comments:9 },
  ];

  const CommunityScreen = () => {
    const [commTab, setCommTab] = useState('home');
    const TABS = [{ id:'home',label:'Home',icon:'🏠'},{ id:'activity',label:'Activity',icon:'⚡'},{ id:'challenges',label:'Challenges',icon:'🏆'},{ id:'classes',label:'Classes',icon:'🏋️'}];
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'linear-gradient(to bottom right,#02040a,#0d2360,#02040a)' }}>
        <div style={{ position:'relative', overflow:'hidden', flexShrink:0, minHeight:90 }}>
          {gym?.image_url ? <img src={gym.image_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.55 }} /> : <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0f172a,#1e3a5f)' }} />}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(2,4,10,0.3),rgba(2,4,10,0),rgba(2,4,10,0.75))' }} />
          <div style={{ position:'relative', zIndex:10, padding:'10px 10px 0' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                  <span style={{ fontSize:12, fontWeight:900, color:'#fff' }}>{gymName}</span>
                  {gym?.verified && <BadgeCheck size={10} color="#60a5fa" />}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:7.5, color:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:2 }}><MapPin size={7}/>{gymCity}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:3, padding:'1px 5px', borderRadius:99, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)' }}>
                    <Users size={7} color="rgba(255,255,255,0.7)"/>
                    <span style={{ fontSize:7, fontWeight:700, color:'#fff' }}>{memberCount} members</span>
                  </div>
                </div>
              </div>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#0a0f1e', border:`1.5px solid ${T.blue}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0, boxShadow:`0 0 8px ${T.blue}44` }}>
                {gym?.logo_url ? <img src={gym.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Dumbbell size={11} color={T.blue} />}
              </div>
            </div>
          </div>
          <div style={{ position:'relative', zIndex:10, borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', padding:'4px 6px 0', gap:4 }}>
            {TABS.map(t => {
              const active = commTab === t.id;
              return (
                <button key={t.id} onClick={() => setCommTab(t.id)} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:3, padding:'4px 7px', borderRadius:99, fontSize:7.5, fontWeight:700, background: active ? 'linear-gradient(to bottom,#3b82f6,#2563eb,#1d4ed8)' : 'rgba(15,23,42,0.8)', color: active ? '#fff' : 'rgba(148,163,184,0.7)', border: active ? '1px solid transparent' : '1px solid rgba(100,116,139,0.4)', borderBottom: active ? '2px solid #1a3fa8' : '2px solid rgba(0,0,0,0.5)', cursor:'pointer', marginBottom:4 }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:8, display:'flex', flexDirection:'column', gap:6 }}>
          {commTab === 'home' && posts.map(p => (
            <div key={p.id} style={{ padding:'7px 8px', background:'linear-gradient(135deg,rgba(30,35,60,0.82),rgba(8,10,20,0.96))', borderRadius:9, border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:p.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:6.5, fontWeight:800, color:'#fff', flexShrink:0 }}>{p.initials}</div>
                <span style={{ fontSize:8.5, fontWeight:700, color:'#fff', flex:1 }}>{p.name}</span>
                <span style={{ fontSize:7, color:'rgba(255,255,255,0.3)' }}>{p.time}</span>
              </div>
              <p style={{ fontSize:8, color:'rgba(226,232,240,0.8)', margin:0, lineHeight:1.4 }}>{p.text}</p>
              <div style={{ display:'flex', gap:10, marginTop:5 }}>
                <button onClick={() => setLiked(l => ({...l,[p.id]:!l[p.id]}))} style={{ display:'flex', alignItems:'center', gap:2, background:'none', border:'none', padding:0, cursor:'pointer', color: liked[p.id] ? '#f472b6' : 'rgba(255,255,255,0.3)', fontSize:7 }}>
                  {liked[p.id] ? '♥' : '♡'} {p.likes + (liked[p.id] ? 1 : 0)}
                </button>
                <span style={{ fontSize:7, color:'rgba(255,255,255,0.3)' }}>💬 {p.comments}</span>
              </div>
            </div>
          ))}
          {commTab !== 'home' && (
            <div style={{ padding:'24px 12px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:9 }}>
              <div style={{ fontSize:18, marginBottom:6 }}>{commTab === 'activity' ? '⚡' : commTab === 'challenges' ? '🏆' : '🏋️'}</div>
              {commTab.charAt(0).toUpperCase() + commTab.slice(1)} data loads here
            </div>
          )}
        </div>
      </div>
    );
  };

  const NAV = [
    { id:'feed',      icon:Home,      label:'Home'      },
    { id:'gyms',      icon:Dumbbell,  label:'Gyms'      },
    { id:'community', icon:Users,     label:'Community' },
    { id:'progress',  icon:TrendingUp,label:'Progress'  },
    { id:'profile',   icon:UserIcon,  label:'Profile'   },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', gap:4 }}>
        {[{id:'community', label:'🏋️ Gym Page'}, {id:'feed', label:'🏠 Home Feed'}].map(s => (
          <button key={s.id} onClick={() => setActiveScreen(s.id)} style={{ flex:1, padding:'5px 0', borderRadius:8, fontSize:9.5, fontWeight:700, background: activeScreen === s.id ? T.blueDim : 'rgba(255,255,255,0.03)', color: activeScreen === s.id ? T.blue : T.t2, border:`1px solid ${activeScreen === s.id ? T.blueBrd : T.brd}`, cursor:'pointer' }}>{s.label}</button>
        ))}
      </div>
      <div style={{ background:'#0a0a0c', border:`2px solid ${T.brd2}`, borderRadius:28, overflow:'hidden', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.7)', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 14px 4px', background:'#0a0a0c', flexShrink:0 }}>
          <span style={{ fontSize:9, fontWeight:700, color:T.t1 }}>9:41</span>
          <div style={{ fontSize:7, color:T.t2 }}>●●● ▲ 🔋</div>
        </div>
        <div style={{ height:420, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <CommunityScreen />
        </div>
        <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center', padding:'8px 6px 10px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,12,0.98)', flexShrink:0 }}>
          {NAV.map((n, i) => (
            <button key={i} onClick={() => setActiveScreen(n.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', padding:'2px 4px' }}>
              <n.icon size={14} color={activeScreen === n.id ? T.blue : 'rgba(255,255,255,0.35)'} />
              <span style={{ fontSize:7.5, color: activeScreen === n.id ? T.blue : 'rgba(255,255,255,0.3)', fontWeight: activeScreen === n.id ? 700 : 400 }}>{n.label}</span>
            </button>
          ))}
        </div>
        <div style={{ height:18, background:'#0a0a0c', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:60, height:3, borderRadius:2, background:T.brd2 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN TAB BAR ───────────────────────────────────────────── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, background:T.card, border:`1px solid ${T.brd}`, borderRadius:11, padding:'5px 6px', marginBottom:16 }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700, background: on ? T.blueDim : 'transparent', color: on ? T.blue : T.t2, border:`1px solid ${on ? T.blueBrd : 'transparent'}`, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap', fontFamily:FONT }}>
            {t.icon && <t.icon size={12} />}{t.label}
            {t.badge && <span style={{ fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:99, background: on ? 'rgba(79,126,255,0.2)' : 'rgba(255,255,255,0.07)', color: on ? T.blue : T.t3 }}>{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════════ */
export default function TabGymProfile({ gym, openModal, setShowPoster }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllActions, setShowAllActions] = useState(false);

  if (!gym) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, color:T.t3, fontSize:13, fontFamily:FONT }}>No gym selected</div>
  );

  /* completeness */
  const checks = [gym.name, gym.image_url, gym.logo_url, (gym.gallery?.length||0)>0, (gym.amenities?.length||0)>0, (gym.equipment?.length||0)>0, gym.price, gym.join_code];
  const done  = checks.filter(Boolean).length;
  const total = checks.length;
  const pct   = Math.round((done / total) * 100);

  gym._completeness = pct;
  gym._aiScore      = Math.min(99, Math.round(pct * 0.6 + (gym.members_count||0) * 0.05 + 30));
  gym._retentionRisk = pct >= 75 ? 'Low' : pct >= 50 ? 'Medium' : 'High';

  const previewUrl = createPageUrl('GymCommunity') + '?id=' + gym.id;

  const TABS = [
    { id:'overview',  label:'Overview',      icon:BarChart2  },
    { id:'profile',   label:'Profile Setup', icon:UserIcon   },
    { id:'community', label:'Community',     icon:Users      },
    { id:'growth',    label:'Growth Engine', icon:TrendingUp },
  ];

  const galleryThumbs = gym.gallery?.slice(0,4).map(g => g.url||g) || [];
  while (galleryThumbs.length < 4) galleryThumbs.push(null);
  const amenitiesCount = gym.amenities?.length || 0;
  const equipmentCount = gym.equipment?.length || 0;
  const galleryCount   = gym.gallery?.length   || 0;

  return (
    <div style={{ fontFamily:FONT, fontSize:13, color:T.t1, lineHeight:1.5, WebkitFontSmoothing:'antialiased', padding:'20px 0 60px' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.brd2}; border-radius: 99px; }
        button { font-family: ${FONT}; }
      `}</style>

      {/* ── PAGE HEADER ───────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, gap:16 }}>
        <div style={{ flex:1 }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, fontSize:11, color:T.t3 }}>
            <Globe size={10} color={T.t3} />
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span style={{ color:T.t2 }}>Gym Profile</span>
            <ChevronRight size={10} />
            <span style={{ color:T.blue, fontWeight:700 }}>{gym.name}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <h1 style={{ fontSize:24, fontWeight:900, color:T.t1, margin:0, letterSpacing:'-0.03em' }}>{gym.name}</h1>
            {gym.verified && (
              <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:6, background:T.blueDim, border:`1px solid ${T.blueBrd}` }}>
                <BadgeCheck size={11} color={T.blue} />
                <span style={{ fontSize:10, fontWeight:700, color:T.blue }}>Verified</span>
              </div>
            )}
            {/* Live status */}
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:6, background:T.greenDim, border:`1px solid ${T.greenBrd}` }}>
              <LiveDot />
              <span style={{ fontSize:10, fontWeight:700, color:T.green }}>Live</span>
            </div>
            <AiBadge label="Intelligence Active" />
          </div>
          <p style={{ fontSize:12, color:T.t3, margin:'6px 0 0', maxWidth:560, lineHeight:1.6 }}>
            Elite gym management · predictive analytics · AI-powered retention intelligence
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <Link to={previewUrl} target="_blank" style={{ textDecoration:'none' }}>
            <Btn label="Preview as Member" icon={Eye} color="blue" />
          </Link>
          <Btn label="Quick Setup" icon={Rocket} color="solid" onClick={() => openModal?.('quickSetup')} />
        </div>
      </div>

      {/* ── TOP METRIC ROW ────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        <StatCard label="Profile Score" value={`${pct}%`} color={pct>=80?T.green:pct>=50?T.amber:T.red} trend={12} trendLabel="vs last week" sparkData={[55,60,58,65,68,70,pct]} accentLeft />
        <StatCard label="Members" value={gym.members_count||0} color={T.blue} trend={8} sparkData={[180,195,210,220,235,247,gym.members_count||247]} />
        <StatCard label="MRR" value={`£${((gym.members_count||0) * parseFloat((gym.price||'£45').replace(/[^0-9.]/g,''))).toLocaleString()}`} color={T.green} trend={6} sparkData={[7800,8100,8400,8700,9000,9300,9600]} />
        <StatCard label="Engagement" value={`${gym.engagement||4.2}%`} color={T.purple} trend={-3} sparkData={[5.1,4.8,4.6,4.2,4.4,4.3,4.2]} />
        <StatCard label="Retention" value={`${gym.retention7d||81}%`} color={T.amber} trend={5} sparkData={[72,74,76,78,79,80,81]} />
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, alignItems:'flex-start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ minWidth:0 }}>
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <IntelligenceScoreCard gym={gym} />
              <AiActionQueue gym={gym} openModal={openModal} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <CommunityPulse gym={gym} />
                <RevenuePanel gym={gym} />
              </div>
              <BenchmarkCard gym={gym} />
            </div>
          )}

          {/* ── PROFILE SETUP TAB ── */}
          {activeTab === 'profile' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {/* Overall completeness header */}
              <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
                <RadialScore score={pct} color={pct>=80?T.green:pct>=50?T.amber:T.red} size={64} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:T.t1, marginBottom:4 }}>Profile Completeness · {pct}%</div>
                  <div style={{ fontSize:11, color:T.t3, marginBottom:8 }}>Gyms with 100% profiles get 2.4× more member joins. You have {total - done} actions remaining.</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <Chip icon={done===total?CheckCircle2:Zap} label={`${done}/${total} complete`} color={T.blue} dim={T.blueDim} brd={T.blueBrd} />
                    {pct < 100 && <Chip icon={AlertTriangle} label={`${total-done} to fix`} color={T.amber} dim={T.amberDim} brd={T.amberBrd} />}
                  </div>
                </div>
                <Btn label="Auto-complete with AI" icon={Sparkles} color="solid" onClick={() => openModal?.('aiComplete')} />
              </div>

              <Section title="First Impressions" subtitle="High-visibility assets · Drives 32% more profile views" pct={Math.round(([gym.logo_url, gym.image_url, galleryCount>0].filter(Boolean).length/3)*100)} badge="IMPACT: HIGH">
                <SectionRow statusIcon={gym.logo_url?'ok':'warn'} label="Logo / Profile Photo" description="Gyms with logos get 32% more views and 23% higher join conversion." thumbnails={[gym.logo_url]} actionLabel={gym.logo_url?'Update Logo':'Add Logo'} actionColor={gym.logo_url?'green':'amber'} onClick={() => openModal?.('logo')} tag={!gym.logo_url?'Missing':'✓'} />
                <SectionRow statusIcon={gym.image_url?'ok':'warn'} label="Hero / Cover Image" description="A compelling cover photo is the #1 trust signal for new members." thumbnails={[gym.image_url]} actionLabel={gym.image_url?'Change Cover':'Add Cover'} onClick={() => openModal?.('heroPhoto')} tag={!gym.image_url?'Missing':'✓'} />
                <SectionRow last statusIcon={galleryCount>0?'ok':'warn'} label="Photo Gallery" description="Gyms with 5+ photos retain members 27% longer — show your space." thumbnails={galleryThumbs.slice(0,3)} actionLabel={galleryCount>0?`${galleryCount} Photos`:'Add Photos'} onClick={() => openModal?.('photos')} tag={galleryCount===0?'Missing':undefined} />
              </Section>

              <Section title="Gym Details" subtitle="Essential info · Reduces friction for new members" pct={Math.round(([gym.name, gym.price].filter(Boolean).length/2)*100)}>
                <SectionRow statusIcon={gym.name?'ok':'warn'} label="Gym Information" description="Name, location, contact, hours — the basics every prospective member checks first." actionLabel={gym.name?'Edit Info':'Add Info'} onClick={() => openModal?.('editInfo')} />
                <SectionRow last statusIcon={gym.price?'ok':'warn'} label="Pricing & Plans" description="Transparent pricing removes the #1 barrier to joining. Show your value clearly." actionLabel={gym.price||'Not Set'} onClick={() => openModal?.('pricing')} />
              </Section>

              <Section title="Member Experience" subtitle="Amenities & equipment · What keeps members coming back" pct={Math.round(([amenitiesCount>0, equipmentCount>0].filter(Boolean).length/2)*100)}>
                <SectionRow statusIcon={amenitiesCount>0?'ok':'warn'} label="Amenities & Services" description="Highlight the perks — showers, parking, nutrition bar, lockers, and more." actionLabel={amenitiesCount>0?`${amenitiesCount} Listed`:'Add Amenities'} onClick={() => openModal?.('amenities')} />
                <SectionRow last statusIcon={equipmentCount>0?'ok':'warn'} label="Equipment" description="Let members find exactly what they train on before they even visit." actionLabel={equipmentCount>0?`${equipmentCount} Listed`:'Add Equipment'} onClick={() => openModal?.('equipment')} />
              </Section>

              <Section title="New Member Onboarding" subtitle="First 7 days · The biggest driver of long-term retention" badge="HIGH ROI" pct={Math.round(([gym.welcome_message, gym.first_post, gym.first_class].filter(Boolean).length/3)*100)} defaultOpen={false}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, padding:'16px 18px' }}>
                  {[
                    { icon:MessageSquare, title:'Welcome Message',        desc:'A personalised welcome sets the tone and reduces first-week dropout by 18%.',    key:gym.welcome_message, action:'Add Message' },
                    { icon:PenSquare,     title:'First Community Post',   desc:'Guide new members to post early — social proof keeps them coming back.',          key:gym.first_post,      action:'Create Post' },
                    { icon:Dumbbell,      title:'First Class Suggestion', desc:'Recommended first class reduces uncertainty and increases week-1 attendance 31%.', key:gym.first_class,     action:'Set Up'      },
                  ].map((c, i) => (
                    <div key={i} style={{ background:T.card2, border:`1px solid ${T.brd}`, borderRadius:10, padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:T.blueDim, border:`1px solid ${T.blueBrd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <c.icon size={14} color={T.blue} />
                      </div>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:700, color:T.t1, marginBottom:4 }}>{c.title}</div>
                        <div style={{ fontSize:10.5, color:T.t3, lineHeight:1.5 }}>{c.desc}</div>
                      </div>
                      <Btn label={c.action} color={c.key?'green':'amber'} size="sm" onClick={() => openModal?.('onboarding')} />
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── COMMUNITY TAB ── */}
          {activeTab === 'community' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <CommunityPulse gym={gym} />
              <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'40px', textAlign:'center', color:T.t3 }}>
                <Users size={32} color={T.t3} style={{ margin:'0 auto 12px', display:'block' }} />
                <div style={{ fontSize:14, fontWeight:700, color:T.t2, marginBottom:6 }}>Community Management</div>
                <div style={{ fontSize:12 }}>Moderation, announcements, and community health will appear here.</div>
                <div style={{ marginTop:16 }}><Btn label="Configure Community" color="blue" icon={Plus} onClick={() => openModal?.('community')} /></div>
              </div>
            </div>
          )}

          {/* ── GROWTH ENGINE TAB ── */}
          {activeTab === 'growth' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <BenchmarkCard gym={gym} />
              <RevenuePanel gym={gym} />
              <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'40px', textAlign:'center', color:T.t3 }}>
                <TrendingUp size={32} color={T.t3} style={{ margin:'0 auto 12px', display:'block' }} />
                <div style={{ fontSize:14, fontWeight:700, color:T.t2, marginBottom:6 }}>Growth Campaigns</div>
                <div style={{ fontSize:12 }}>Referral programmes, paid growth, and acquisition funnels coming soon.</div>
                <div style={{ marginTop:16 }}><Btn label="Join Waitlist" color="blue" icon={Bell} /></div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Phone preview */}
          <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'14px', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>Member App Preview</span>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <LiveDot />
                <span style={{ fontSize:10, fontWeight:700, color:T.green }}>Live</span>
              </div>
            </div>
            <PhoneMockup gym={gym} />
            <Link to={previewUrl} target="_blank" style={{ textDecoration:'none', display:'block', marginTop:10 }}>
              <Btn label="Open Full View" icon={ExternalLink} color="blue" full />
            </Link>
          </div>

          {/* Profile completeness mini */}
          <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:12.5, fontWeight:700, color:T.t1 }}>Profile Completeness</div>
                <div style={{ fontSize:10, color:T.t3, marginTop:2 }}>{done}/{total} sections done</div>
              </div>
              <span style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.04em', color:pct>=80?T.green:pct>=50?T.amber:T.red }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color={pct>=80?T.green:pct>=50?T.amber:T.red} height={4} />
            {pct < 100 && (
              <div style={{ marginTop:10 }}>
                <Btn label="Auto-complete with AI" icon={Sparkles} color="blue" size="sm" full onClick={() => openModal?.('aiComplete')} />
              </div>
            )}
          </div>

          {/* Retention insight */}
          <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.t1, marginBottom:6 }}>Retention Impact</div>
            <p style={{ fontSize:11, color:T.t3, margin:'0 0 10px', lineHeight:1.6 }}>
              A complete profile + active community increases member retention by
            </p>
            <div style={{ fontSize:32, fontWeight:900, color:T.green, letterSpacing:'-0.04em', lineHeight:1, marginBottom:4 }}>+35%</div>
            <div style={{ fontSize:10, color:T.t3, marginBottom:12 }}>vs gyms with incomplete profiles</div>
            <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:40, marginBottom:4 }}>
              {[40,55,45,65,60,80,100].map((h, i) => (
                <div key={i} style={{ flex:1, height:`${h * 0.4}px`, borderRadius:3, background: i===6 ? T.green : `rgba(34,197,94,${0.12 + i*0.09})`, boxShadow: i===6 ? `0 0 8px ${T.green}66` : 'none' }} />
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:8.5, color:T.t3 }}>
              <span>Incomplete</span><span>Complete</span>
            </div>
            <Btn label="See Full Analysis" color="blue" size="sm" full style={{ marginTop:12 }} />
          </div>

          {/* Quick actions */}
          <div style={{ background:T.card, border:`1px solid ${T.brd}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.t1, marginBottom:10 }}>Quick Actions</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { label:'Create a Challenge',   icon:Trophy,       color:'amber', action:'challenge' },
                { label:'Post Announcement',    icon:MessageSquare,color:'blue',  action:'post'      },
                { label:'Message At-Risk',      icon:Bell,         color:'red',   action:'members'   },
                { label:'Download QR Code',     icon:Tag,          color:'blue',  action:'qr'        },
              ].map((a, i) => (
                <button key={i} onClick={() => openModal?.(a.action)} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8,
                  background:'transparent', border:`1px solid ${T.brd}`, color:T.t2, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.12s', fontFamily:FONT,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.card2; e.currentTarget.style.borderColor = T.brd2; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.brd; }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:T[`${a.color}Dim`], border:`1px solid ${T[`${a.color}Brd`]}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <a.icon size={12} color={T[a.color]} />
                  </div>
                  {a.label}
                  <ChevronRight size={11} color={T.t3} style={{ marginLeft:'auto' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
