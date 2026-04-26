/**
 * TabActions — polished to match ContentPage quality
 * Fixes: 3-zone header, fixed card height, single-line CTAs, AI insight on demand
 */
import { useState, useEffect, useRef } from "react";
import {
  Shield, Send, Users, Calendar, Trophy, AlertTriangle,
  ChevronDown, Check, X, Star, Gift,
  TrendingUp, Plus, Eye, Sparkles,
  UserPlus, BarChart2, ChevronRight,
} from "lucide-react";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       "#000000",
  sidebar:  "#0f0f12",
  card:     "#141416",
  card2:    "#1a1a1f",
  brd:      "#222226",
  t1:       "#ffffff",
  t2:       "#8a8a94",
  t3:       "#444450",
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#f04a68",
  redDim:   "rgba(240,74,104,0.10)",
  redBrd:   "rgba(240,74,104,0.25)",
  amber:    "#e8940a",
  amberDim: "rgba(232,148,10,0.10)",
  amberBrd: "rgba(232,148,10,0.25)",
  green:    "#1eb85a",
  greenDim: "rgba(30,184,90,0.10)",
  greenBrd: "rgba(30,184,90,0.25)",
  blue:     "#4f97f5",
  blueDim:  "rgba(79,151,245,0.10)",
  blueBrd:  "rgba(79,151,245,0.25)",
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ─── DATA ───────────────────────────────────────────────────── */
const PRIORITY_ACTIONS = [
  {
    id:"pa1", urgency:"critical", icon:Users,
    title:"6 members haven't visited in 14+ days",
    subtitle:"Send a check-in message to re-engage before they churn.",
    tag:"Retention", tagColor:C.red,
    successRate:38, members:["MW","PS","DO","TR","JC","SR"],
    cta:"Message Them", ctaIcon:Send, secondaryCta:"View Members",
    stats:[{label:"At risk",val:"6"},{label:"Avg absent",val:"19d"},{label:"Success",val:"38%"}],
    detail:"These members are in the critical churn window. A personalised nudge now recovers 1 in 3.",
    timeAgo:"2 min ago",
  },
  {
    id:"pa2", urgency:"high", icon:Calendar,
    title:"Class underbooked — 4 / 15 spots filled",
    subtitle:"Promote this class to boost attendance tomorrow.",
    tag:"Engagement", tagColor:C.amber,
    successRate:62, members:[],
    cta:"Promote Class", ctaIcon:Send, secondaryCta:"View Class",
    stats:[{label:"Capacity",val:"27%"},{label:"Time left",val:"18h"},{label:"Success",val:"62%"}],
    detail:"Morning HIIT on Tuesday is below minimum. A quick post typically fills 6–8 spots.",
    timeAgo:"14 min ago",
  },
  {
    id:"pa3", urgency:"medium", icon:Trophy,
    title:"Create a Challenge for May",
    subtitle:"Boost engagement with a fitness challenge this month.",
    tag:"Challenge", tagColor:C.cyan,
    successRate:76, members:[],
    cta:"Create Challenge", ctaIcon:Plus, secondaryCta:"See Templates",
    stats:[{label:"Engagement lift",val:"+31%"},{label:"Duration",val:"30d"},{label:"Success",val:"76%"}],
    detail:"Members who join a challenge are 3× more likely to stay active the following month.",
    timeAgo:"1 hr ago",
  },
  {
    id:"pa4", urgency:"medium", icon:Gift,
    title:"3 members have birthdays this week",
    subtitle:"Send a personalised birthday message to boost loyalty.",
    tag:"Engagement", tagColor:C.blue,
    successRate:89, members:["CN","AP","JC"],
    cta:"Send Messages", ctaIcon:Send, secondaryCta:null,
    stats:[{label:"Members",val:"3"},{label:"LTV boost",val:"+18%"},{label:"Success",val:"89%"}],
    detail:"Birthday messages have the highest open rate of any automated message type.",
    timeAgo:"3 hr ago",
  },
  {
    id:"pa5", urgency:"low", icon:Star,
    title:"Priya Sharma hits 50 visits this week",
    subtitle:"Celebrate this milestone to boost loyalty and referrals.",
    tag:"Milestone", tagColor:C.green,
    successRate:94, members:["PS"],
    cta:"Send Congrats", ctaIcon:Send, secondaryCta:null,
    stats:[{label:"Total visits",val:"49"},{label:"Streak",val:"7d"},{label:"Success",val:"94%"}],
    detail:"Milestone celebrations convert 1 in 4 members into active referrers.",
    timeAgo:"5 hr ago",
  },
];

const FEED_ITEMS = [
  {id:"f1",type:"alert",    icon:AlertTriangle,color:C.red,  member:"Marcus Webb",   action:"Hasn't visited in 22 days",         cta:"Message",  ago:"just now", isNew:true },
  {id:"f2",type:"insight",  icon:TrendingUp,   color:C.amber,member:null,            action:"Attendance dropped 18% this week",  cta:"Promote",  ago:"4 min ago",isNew:false},
  {id:"f3",type:"milestone",icon:Star,          color:C.cyan, member:"Chloe Nakamura",action:"18-day streak — recognition due",   cta:"Celebrate",ago:"11 min ago",isNew:false},
  {id:"f4",type:"alert",    icon:UserPlus,      color:C.blue, member:"Sam Rivera",    action:"New member · hasn't returned in 6d",cta:"Nudge",    ago:"23 min ago",isNew:false},
  {id:"f5",type:"insight",  icon:BarChart2,     color:C.amber,member:null,            action:"Tuesday HIIT is 27% full",          cta:"Promote",  ago:"1 hr ago", isNew:false},
  {id:"f6",type:"alert",    icon:AlertTriangle,color:C.red,  member:"Devon Osei",    action:"19 days absent — critical window",  cta:"Message",  ago:"2 hr ago", isNew:false},
  {id:"f7",type:"win",      icon:Check,         color:C.green,member:"Anya Petrov",   action:"Returned after re-engagement nudge",cta:null,       ago:"3 hr ago", isNew:false},
  {id:"f8",type:"win",      icon:Check,         color:C.green,member:"Jamie Collins", action:"Responded to check-in message",     cta:null,       ago:"4 hr ago", isNew:false},
];

const COMPLETED_TODAY = [
  {label:"Nudge sent to Marcus Webb",     time:"09:14"},
  {label:"Tuesday HIIT promoted to feed", time:"08:50"},
  {label:"Welcome sent to Sam Rivera",    time:"08:30"},
];

const AV_COLORS = ["#6366f1","#14b8a6","#8b5cf6","#e8940a","#f04a68","#4f97f5"];
const AV_MAP    = {MW:0,PS:1,DO:2,TR:3,JC:4,SR:5,CN:2,AP:4};

const URGENCY = {
  critical:{color:C.red,   leftBorder:"#f04a68"},
  high:    {color:C.amber, leftBorder:"#e8940a"},
  medium:  {color:C.cyan,  leftBorder:"#4d7fff"},
  low:     {color:C.green, leftBorder:"#1eb85a"},
};

const FILTERS = ["All","Retention","Engagement","Challenge","Milestone"];

/* ─── LIVE SUMMARY TICKER — fills the center header zone ─────── */
function LiveTicker({ actions }) {
  const urgent  = actions.filter(a => a.urgency==="critical"||a.urgency==="high").length;
  const revenue = urgent * 180;
  const ticks   = [
    `${urgent} urgent action${urgent!==1?"s":""} need attention now`,
    `$${revenue}/mo in member revenue at risk`,
    `${COMPLETED_TODAY.length} actions completed this morning`,
    `${actions.length} total actions across all categories`,
  ];

  const [idx,     setIdx]     = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [sliding, setSliding] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (ticks.length <= 1) return;
    const t = setInterval(() => {
      const prev = idxRef.current;
      const next = (prev + 1) % ticks.length;
      idxRef.current = next;
      setPrevIdx(prev);
      setIdx(next);
      setSliding(true);
      setTimeout(() => { setPrevIdx(null); setSliding(false); }, 700);
    }, 5000);
    return () => clearInterval(t);
  }, [ticks.length]);

  return (
    <>
      <style>{`
        @keyframes tOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-110%)}}
        @keyframes tIn {from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
      `}</style>
      <div style={{
        flex:1, maxWidth:480, height:34,
        background:C.cyanDim, border:`1px solid ${C.cyanBrd}`,
        borderRadius:6, overflow:"hidden",
        position:"relative", display:"flex", alignItems:"center",
      }}>
        {sliding && prevIdx !== null && (
          <span style={{
            position:"absolute", left:0, right:0, textAlign:"center",
            fontSize:11.5, fontWeight:600, color:"#93c5fd",
            fontFamily:FONT, padding:"0 14px",
            animation:"tOut 0.7s cubic-bezier(0.4,0,0.2,1) forwards",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>{ticks[prevIdx]}</span>
        )}
        <span key={idx} style={{
          position:"absolute", left:0, right:0, textAlign:"center",
          fontSize:11.5, fontWeight:600, color:"#93c5fd",
          fontFamily:FONT, padding:"0 14px",
          animation: sliding ? "tIn 0.7s cubic-bezier(0.4,0,0.2,1) forwards" : "none",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{ticks[idx]}</span>
      </div>
    </>
  );
}

/* ─── TABS — identical to ContentPage ───────────────────────── */
function Tabs({ active, setActive }) {
  return (
    <div style={{ borderBottom:`1px solid ${C.brd}`, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActive(f)} style={{
            padding:"7px 14px", fontSize:12.5, background:"transparent", border:"none",
            borderBottom:`2px solid ${active===f ? C.cyan : "transparent"}`,
            color: active===f ? C.t1 : C.t2,
            fontWeight: active===f ? 700 : 400,
            cursor:"pointer", marginBottom:-1, fontFamily:FONT,
            transition:"color 0.15s", whiteSpace:"nowrap", minHeight:40,
          }}>{f}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── AVATAR STACK ───────────────────────────────────────────── */
function AvatarStack({ members }) {
  if (!members.length) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
      {members.slice(0,4).map((ini,i) => {
        const color = AV_COLORS[AV_MAP[ini] ?? ini.charCodeAt(0) % AV_COLORS.length];
        return (
          <div key={i} style={{
            width:18, height:18, borderRadius:"50%", flexShrink:0,
            background:`${color}20`, color, fontSize:6.5, fontWeight:700,
            display:"flex", alignItems:"center", justifyContent:"center",
            border:`1.5px solid ${C.card}`, marginLeft: i>0 ? -6 : 0,
          }}>{ini}</div>
        );
      })}
      {members.length > 4 && (
        <span style={{ fontSize:9.5, color:C.t3, marginLeft:5 }}>+{members.length-4}</span>
      )}
    </div>
  );
}

/* ─── PROGRESS BAR ───────────────────────────────────────────── */
function SuccessBar({ pct, color }) {
  return (
    <div style={{ height:2, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden", width:52, flexShrink:0 }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2 }}/>
    </div>
  );
}

/* ─── ACTION CARD — fixed 120px, 3 clean rows ───────────────── */
function ActionCard({ action, onDismiss }) {
  const [acted,    setActed]    = useState(false);
  const [expanded, setExpanded] = useState(false);
  const u = URGENCY[action.urgency];

  const cardHover = (e, enter) => {
    if (acted) return;
    e.currentTarget.style.borderColor    = enter ? C.cyanBrd : C.brd;
    e.currentTarget.style.borderLeftColor= u.leftBorder;
    e.currentTarget.style.boxShadow      = enter ? "0 0 8px rgba(77,127,255,0.07)" : "none";
  };

  return (
    <div
      style={{
        background:C.card, border:`1px solid ${C.brd}`,
        borderLeft:`2px solid ${u.leftBorder}`,
        borderRadius:12, overflow:"hidden",
        opacity: acted ? 0.4 : 1,
        transition:"opacity 0.3s, border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => cardHover(e, true)}
      onMouseLeave={e => cardHover(e, false)}
    >
      {/* ── Fixed-height body: exactly 120px ── */}
      <div style={{ display:"flex", height:120 }}>

        {/* Left: 3-row content */}
        <div style={{
          flex:1, minWidth:0, padding:"12px 14px",
          display:"flex", flexDirection:"column", justifyContent:"space-between",
        }}>
          {/* Row 1: icon + title + tag + time */}
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{
              width:28, height:28, borderRadius:7, flexShrink:0,
              background:`${u.color}10`, border:`1px solid ${u.color}22`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <action.icon size={12} color={u.color}/>
            </div>
            <span style={{
              fontSize:12.5, fontWeight:700, color:C.t1,
              flex:1, minWidth:0,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>{action.title}</span>
            <span style={{
              padding:"1px 7px", borderRadius:4, fontSize:9, fontWeight:700,
              color:action.tagColor, background:`${action.tagColor}12`,
              border:`1px solid ${action.tagColor}28`,
              textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", flexShrink:0,
            }}>{action.tag}</span>
            <span style={{ fontSize:9.5, color:C.t3, flexShrink:0 }}>{action.timeAgo}</span>
          </div>

          {/* Row 2: subtitle — single line, ellipsis */}
          <div style={{
            fontSize:11.5, color:C.t2, lineHeight:1.5,
            paddingLeft:37,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>{action.subtitle}</div>

          {/* Row 3: stats + avatars + bar */}
          <div style={{ display:"flex", alignItems:"center", gap:12, paddingLeft:37 }}>
            {action.stats.map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"baseline", gap:3, flexShrink:0 }}>
                <span style={{
                  fontSize:11.5, fontWeight:700,
                  color: i===2 ? u.color : C.t1,
                  fontVariantNumeric:"tabular-nums",
                }}>{s.val}</span>
                <span style={{ fontSize:9.5, color:C.t3 }}>{s.label}</span>
              </div>
            ))}
            {action.members.length > 0 && <AvatarStack members={action.members}/>}
            <div style={{ flex:1 }}/>
            <SuccessBar pct={action.successRate} color={u.color}/>
          </div>
        </div>

        {/* Right: Quick Actions — 128px, mirrors ContentPage panel */}
        <div style={{
          width:128, flexShrink:0,
          borderLeft:`1px solid ${C.brd}`,
          padding:"10px",
          display:"flex", flexDirection:"column", gap:6,
        }}>
          <div style={{
            fontSize:9, fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.10em", color:C.t3, marginBottom:2,
          }}>Quick Actions</div>

          {acted ? (
            <div style={{
              display:"flex", alignItems:"center", gap:5,
              padding:"6px 9px", borderRadius:7,
              background:C.greenDim, border:`1px solid ${C.greenBrd}`,
            }}>
              <Check size={10} color={C.green}/>
              <span style={{ fontSize:10.5, fontWeight:600, color:C.green }}>Done</span>
            </div>
          ) : (
            /* Primary CTA — always single line, text truncates if needed */
            <button
              onClick={() => setActed(true)}
              style={{
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:5, width:"100%", padding:"6px 0", borderRadius:7,
                background:C.cyan, border:"none", color:"#fff",
                fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:FONT,
                boxShadow:"0 0 10px rgba(77,127,255,0.22)",
                overflow:"hidden", whiteSpace:"nowrap",
              }}>
              <action.ctaIcon size={10} style={{ flexShrink:0 }}/>{action.cta}
            </button>
          )}

          {/* Secondary */}
          {action.secondaryCta && !acted && (
            <button style={{
              display:"flex", alignItems:"center", gap:5,
              width:"100%", padding:"5px 9px", borderRadius:7,
              background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`,
              color:C.t2, fontSize:11, fontWeight:600,
              cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
              overflow:"hidden", whiteSpace:"nowrap",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanBrd;e.currentTarget.style.color=C.t1;e.currentTarget.style.background=C.cyanDim;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background="rgba(255,255,255,0.03)";}}>
              <Eye size={10} style={{ flexShrink:0 }}/>{action.secondaryCta}
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={() => onDismiss?.(action.id)}
            style={{
              display:"flex", alignItems:"center", gap:5,
              width:"100%", padding:"5px 9px", borderRadius:7,
              background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`,
              color:C.t2, fontSize:11, fontWeight:600,
              cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redBrd;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redDim;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background="rgba(255,255,255,0.03)";}}>
            <X size={10} style={{ flexShrink:0 }}/>Dismiss
          </button>

          {/* AI Insight — tiny text link, bottom-anchored, NOT a full button */}
          <button
            onClick={() => setExpanded(v=>!v)}
            style={{
              marginTop:"auto", display:"flex", alignItems:"center", gap:4,
              background:"none", border:"none",
              color: expanded ? C.cyan : C.t3,
              fontSize:10, fontWeight:600, cursor:"pointer",
              fontFamily:FONT, padding:"2px 0", transition:"color 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.color=C.cyan}
            onMouseLeave={e=>e.currentTarget.style.color=expanded?C.cyan:C.t3}>
            <Sparkles size={9}/>AI insight
            <ChevronDown size={9} style={{ transform:expanded?"rotate(180deg)":"none", transition:"transform 0.2s" }}/>
          </button>
        </div>
      </div>

      {/* AI Insight panel — expands below fixed body on demand */}
      {expanded && (
        <div style={{
          padding:"10px 14px 12px", borderTop:`1px solid ${C.brd}`,
          background:"rgba(77,127,255,0.03)",
        }}>
          <span style={{ fontSize:11.5, color:C.cyan, fontWeight:600 }}>AI insight · </span>
          <span style={{ fontSize:11.5, color:C.t2, lineHeight:1.65 }}>{action.detail}</span>
        </div>
      )}
    </div>
  );
}

/* ─── FEED ROW ───────────────────────────────────────────────── */
function FeedRow({ item, i, total }) {
  const [sent, setSent] = useState(false);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:9, padding:"9px 12px",
      borderBottom: i < total-1 ? `1px solid ${C.brd}` : "none",
      background: item.isNew ? `${C.cyan}08` : "transparent",
      transition:"background 0.4s",
    }}>
      <div style={{
        width:24, height:24, borderRadius:6, flexShrink:0,
        background:`${item.color}10`, border:`1px solid ${item.color}22`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <item.icon size={10} color={item.color}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, color:C.t2, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {item.member && <span style={{ fontWeight:600, color:C.t1 }}>{item.member} </span>}
          <span style={{ color: item.type==="win" ? C.green : C.t2 }}>{item.action}</span>
        </div>
        <div style={{ fontSize:9.5, color:C.t3, marginTop:1 }}>{item.ago}</div>
      </div>
      {item.type==="win" ? (
        <span style={{ fontSize:9, fontWeight:700, color:C.green, background:C.greenDim, border:`1px solid ${C.greenBrd}`, borderRadius:4, padding:"2px 6px", flexShrink:0, textTransform:"uppercase" }}>win</span>
      ) : item.cta ? (
        <button onClick={()=>setSent(true)} style={{
          padding:"3px 8px", borderRadius:5, fontSize:10, fontWeight:600,
          cursor:"pointer", fontFamily:FONT, flexShrink:0, whiteSpace:"nowrap",
          background: sent?C.greenDim:"rgba(255,255,255,0.03)",
          border:`1px solid ${sent?C.greenBrd:C.brd}`,
          color: sent?C.green:C.t2, transition:"all 0.2s",
        }}>
          {sent ? "Done" : item.cta}
        </button>
      ) : null}
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
function RightSidebar({ actions }) {
  const urgentCount   = actions.filter(a => a.urgency==="critical"||a.urgency==="high").length;
  const revenueAtRisk = urgentCount * 180;

  const statCards = [
    {label:"Urgent Actions",  val:String(urgentCount),            col:C.red  },
    {label:"Revenue at Risk", val:`$${revenueAtRisk}`,            col:C.cyan },
    {label:"Done Today",      val:String(COMPLETED_TODAY.length), col:C.green},
    {label:"Avg Response",    val:"<2h",                          col:C.blue },
  ];

  return (
    <div style={{
      width:244, flexShrink:0,
      background:C.sidebar, borderLeft:`1px solid ${C.brd}`,
      display:"flex", flexDirection:"column",
      fontFamily:FONT, overflowY:"auto", alignSelf:"flex-start",
    }}>
      {/* Section header */}
      <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Actions Overview</div>
      </div>

      {/* 2×2 stat grid — ContentPage style */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1px", background:C.brd, borderBottom:`1px solid ${C.brd}` }}>
        {statCards.map((s,i) => (
          <div key={i} style={{ padding:"12px 14px", background:C.sidebar }}>
            <div style={{ fontSize:10, color:C.t3, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.col, lineHeight:1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* AI Coach card */}
      <div style={{ padding:"14px", borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ padding:"13px", borderRadius:10, background:C.card, border:`1px solid ${C.cyanBrd}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
            <div style={{ width:22, height:22, borderRadius:6, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Sparkles size={10} color={C.cyan}/>
            </div>
            <span style={{ fontSize:11.5, fontWeight:700, color:C.t1 }}>AI Coach</span>
            <span style={{ fontSize:9, fontWeight:700, color:C.cyan, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, padding:"1px 6px", borderRadius:20, marginLeft:"auto", letterSpacing:"0.04em", textTransform:"uppercase" }}>Live</span>
          </div>
          <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.65, marginBottom:10 }}>
            Your <span style={{ color:C.t1, fontWeight:600 }}>retention is strong</span> this week. Focus on the 6 inactive members — acting now protects <span style={{ color:C.cyan, fontWeight:700 }}>$360/mo</span>.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer" }}>
            <span style={{ fontSize:11, fontWeight:600, color:C.cyan }}>Ask AI Coach</span>
            <ChevronRight size={10} color={C.cyan}/>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div style={{ padding:"14px 14px 12px", borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block" }}/>
            <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Live Feed</span>
          </div>
          <span style={{ fontSize:10, color:C.t3 }}>{FEED_ITEMS.length} events</span>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, overflow:"hidden" }}>
          {FEED_ITEMS.slice(0,6).map((item,i) => (
            <FeedRow key={item.id} item={item} i={i} total={Math.min(FEED_ITEMS.length,6)}/>
          ))}
        </div>
      </div>

      {/* Done Today */}
      <div style={{ padding:"14px 14px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
          <Check size={11} color={C.green}/>
          <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Done Today</span>
          <span style={{ fontSize:10, color:C.t3, marginLeft:"auto" }}>{COMPLETED_TODAY.length} actions</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {COMPLETED_TODAY.map((c,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, background:C.greenDim, border:`1px solid ${C.greenBrd}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Check size={7} color={C.green}/>
              </div>
              <span style={{ fontSize:11, color:C.t2, flex:1, lineHeight:1.4 }}>{c.label}</span>
              <span style={{ fontSize:9.5, color:C.t3, flexShrink:0 }}>{c.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function TabActions() {
  const [actions,  setActions]  = useState(PRIORITY_ACTIONS);
  const [filter,   setFilter]   = useState("All");
  const [viewAll,  setViewAll]  = useState(false);
  const [showDone, setShowDone] = useState(false);

  const dismiss     = (id) => setActions(p => p.filter(a => a.id !== id));
  const filtered    = filter==="All" ? actions : actions.filter(a => a.tag===filter);
  const shown       = viewAll ? filtered : filtered.slice(0, 4);
  const urgentCount = actions.filter(a => a.urgency==="critical"||a.urgency==="high").length;

  return (
    <div style={{ display:"flex", height:"100%", background:C.bg, color:C.t1, fontFamily:FONT, overflow:"hidden" }}>
      <style>{`
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.brd};border-radius:2px}
      `}</style>

      {/* ── MAIN COLUMN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

        {/* ── HEADER: 3-zone balanced — matches ContentPage exactly ── */}
        <div style={{
          padding:"4px 16px 0 4px",
          display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:16,
        }}>
          {/* Zone 1: title + badge */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:0, letterSpacing:"-0.03em", lineHeight:1.2 }}>
              Actions <span style={{ color:C.cyan }}>/ Priority</span>
            </h1>
            {urgentCount > 0 && (
              <span style={{
                fontSize:10, fontWeight:700, color:C.red,
                background:C.redDim, border:`1px solid ${C.redBrd}`,
                padding:"2px 9px", borderRadius:20,
                display:"flex", alignItems:"center", gap:5, flexShrink:0,
              }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:C.red, display:"inline-block" }}/>
                {urgentCount} urgent
              </span>
            )}
          </div>

          {/* Zone 2: live summary ticker */}
          <LiveTicker actions={actions}/>

          {/* Zone 3: buttons */}
          <div style={{ display:"flex", gap:7, flexShrink:0 }}>
            <button
              onClick={() => setShowDone(v=>!v)}
              style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"9px 14px", borderRadius:9,
                fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:FONT,
                background:"rgba(255,255,255,0.02)", border:`1px solid ${C.brd}`,
                color:C.t2, transition:"all 0.15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanBrd;e.currentTarget.style.color=C.t1;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;}}>
              <Check size={12}/>{showDone ? "Hide" : "Show"} completed
            </button>
            <button
              onClick={() => setViewAll(v=>!v)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"9px 18px", borderRadius:9,
                fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:FONT,
                background:"#2563eb", border:"none", color:"#fff",
                transition:"opacity 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <Eye size={12}/>{viewAll ? "Show less" : `View all ${actions.length}`}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding:"0 4px" }}>
          <Tabs active={filter} setActive={f => { setFilter(f); setViewAll(false); }}/>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 16px 32px 4px" }}>

          <div style={{ display:"flex", alignItems:"center", marginBottom:10, marginTop:2 }}>
            <span style={{ fontSize:12, fontWeight:500, color:C.t2 }}>
              {filtered.length} action{filtered.length!==1?"s":""} · sorted by urgency
            </span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {shown.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"56px 0", gap:12 }}>
                <Check size={22} color={C.green} style={{ opacity:0.7 }}/>
                <div style={{ fontSize:13, fontWeight:600, color:C.t2 }}>All caught up</div>
                <div style={{ fontSize:11, color:C.t3 }}>No actions in this category.</div>
              </div>
            ) : shown.map(a => <ActionCard key={a.id} action={a} onDismiss={dismiss}/>)}

            {!viewAll && filtered.length > 4 && (
              <button
                onClick={() => setViewAll(true)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                  padding:"9px", borderRadius:9,
                  background:"rgba(255,255,255,0.015)", border:`1px solid ${C.brd}`,
                  color:C.t3, fontSize:12, fontWeight:500,
                  cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanBrd;e.currentTarget.style.color=C.t1;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t3;}}>
                Show {filtered.length-4} more <ChevronDown size={12}/>
              </button>
            )}
          </div>

          {showDone && (
            <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"11px 16px", borderBottom:`1px solid ${C.brd}`, display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.01)" }}>
                <Check size={12} color={C.green}/>
                <span style={{ fontSize:12.5, fontWeight:600, color:C.t1 }}>Completed Today</span>
                <span style={{ fontSize:10, color:C.t3 }}>{COMPLETED_TODAY.length} actions taken</span>
              </div>
              {COMPLETED_TODAY.map((c,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:i<COMPLETED_TODAY.length-1?`1px solid ${C.brd}`:"none" }}>
                  <div style={{ width:17, height:17, borderRadius:"50%", background:C.greenDim, border:`1px solid ${C.greenBrd}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Check size={8} color={C.green}/>
                  </div>
                  <span style={{ fontSize:12, color:C.t2, flex:1 }}>{c.label}</span>
                  <span style={{ fontSize:10, color:C.t3 }}>{c.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RightSidebar actions={actions}/>
    </div>
  );
}
