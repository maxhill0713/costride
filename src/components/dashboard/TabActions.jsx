/**
 * TabActions — redesigned to match ContentPage quality
 */
import { useState, useEffect, useRef } from "react";
import {
  Shield, Zap, Send, Users, Calendar, Trophy, AlertTriangle,
  ChevronRight, ChevronDown, ArrowUpRight, Check, X, Clock,
  Flame, Star, Bell, Gift, TrendingUp, Activity,
  MessageCircle, Plus, Eye, RefreshCw, Sparkles,
  UserPlus, BookOpen, Target, DollarSign, BarChart2,
} from "lucide-react";

/* ─── TOKENS — identical to ContentPage palette ──────────────── */
const C = {
  bg:       "#000000",
  sidebar:  "#0f0f12",
  card:     "#141416",
  card2:    "#1a1a1f",
  brd:      "#222226",
  brd2:     "#2a2a30",
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
    impact:"$360/mo at risk",
    successRate:38, members:["MW","PS","DO","TR","JC","SR"],
    cta:"Message Them", ctaIcon:Send, secondaryCta:"View Members",
    stats:[{label:"At risk",val:"6"},{label:"Avg absent",val:"19d"},{label:"Success",val:"38%"}],
    detail:"These members are in the critical window for churn. A personalised nudge now recovers 1 in 3.",
    timeAgo:"2 min ago",
  },
  {
    id:"pa2", urgency:"high", icon:Calendar,
    title:"Class underbooked — 4 / 15 spots filled",
    subtitle:"Promote this class to boost attendance tomorrow.",
    tag:"Engagement", tagColor:C.amber,
    impact:"11 spots remaining",
    successRate:62, members:[],
    cta:"Promote Class", ctaIcon:Send, secondaryCta:"View Class",
    stats:[{label:"Capacity",val:"27%"},{label:"Time to class",val:"18h"},{label:"Success",val:"62%"}],
    detail:"Morning HIIT on Tuesday is below the minimum. A quick post typically fills 6–8 spots.",
    timeAgo:"14 min ago",
  },
  {
    id:"pa3", urgency:"medium", icon:Trophy,
    title:"Create a Challenge for May",
    subtitle:"Boost engagement with a fitness challenge this month.",
    tag:"Challenge", tagColor:C.cyan,
    impact:"+31% retention lift",
    successRate:76, members:[],
    cta:"Create Challenge", ctaIcon:Plus, secondaryCta:"See Templates",
    stats:[{label:"Avg engagement",val:"+31%"},{label:"Duration",val:"30d"},{label:"Success",val:"76%"}],
    detail:"Members who join a challenge are 3× more likely to stay active through the following month.",
    timeAgo:"1 hr ago",
  },
  {
    id:"pa4", urgency:"medium", icon:Gift,
    title:"3 members have birthdays this week",
    subtitle:"Send a personalised birthday message to boost loyalty.",
    tag:"Engagement", tagColor:C.blue,
    impact:"3× referral rate",
    successRate:89, members:["CN","AP","JC"],
    cta:"Send Birthday Messages", ctaIcon:Send, secondaryCta:null,
    stats:[{label:"Members",val:"3"},{label:"Avg LTV boost",val:"+18%"},{label:"Success",val:"89%"}],
    detail:"Birthday messages have the highest open rate of any automated message type.",
    timeAgo:"3 hr ago",
  },
  {
    id:"pa5", urgency:"low", icon:Star,
    title:"Priya Sharma hits 50 visits this week",
    subtitle:"Celebrate this milestone to boost loyalty and referrals.",
    tag:"Milestone", tagColor:C.green,
    impact:"High referral potential",
    successRate:94, members:["PS"],
    cta:"Send Congrats", ctaIcon:Send, secondaryCta:null,
    stats:[{label:"Total visits",val:"49"},{label:"Streak",val:"7d"},{label:"Success",val:"94%"}],
    detail:"Milestone celebrations convert 1 in 4 members into active referrers.",
    timeAgo:"5 hr ago",
  },
];

const FEED_ITEMS = [
  {id:"f1", type:"alert",     icon:AlertTriangle, color:C.red,   member:"Marcus Webb",    action:"Hasn't visited in 22 days",          cta:"Message",   ago:"just now",  isNew:true  },
  {id:"f2", type:"insight",   icon:TrendingUp,    color:C.amber, member:null,             action:"Attendance dropped 18% this week",   cta:"Promote",   ago:"4 min ago", isNew:false },
  {id:"f3", type:"milestone", icon:Star,          color:C.cyan,  member:"Chloe Nakamura", action:"18-day streak — recognition due",    cta:"Celebrate", ago:"11 min ago",isNew:false },
  {id:"f4", type:"alert",     icon:UserPlus,      color:C.blue,  member:"Sam Rivera",     action:"New member · hasn't returned in 6d", cta:"Nudge",     ago:"23 min ago",isNew:false },
  {id:"f5", type:"insight",   icon:BarChart2,     color:C.amber, member:null,             action:"Tuesday HIIT is 27% full",           cta:"Promote",   ago:"1 hr ago",  isNew:false },
  {id:"f6", type:"alert",     icon:AlertTriangle, color:C.red,   member:"Devon Osei",     action:"19 days absent — critical window",   cta:"Message",   ago:"2 hr ago",  isNew:false },
  {id:"f7", type:"win",       icon:Check,         color:C.green, member:"Anya Petrov",    action:"Returned after re-engagement nudge", cta:null,        ago:"3 hr ago",  isNew:false },
  {id:"f8", type:"win",       icon:Check,         color:C.green, member:"Jamie Collins",  action:"Responded to check-in message",      cta:null,        ago:"4 hr ago",  isNew:false },
];

const COMPLETED_TODAY = [
  {label:"Nudge sent to Marcus Webb",       time:"09:14"},
  {label:"Tuesday HIIT promoted to feed",   time:"08:50"},
  {label:"Welcome sent to Sam Rivera",       time:"08:30"},
];

const AV_COLORS = ["#6366f1","#14b8a6","#8b5cf6","#e8940a","#f04a68","#4f97f5"];
const AV_MAP    = {MW:0,PS:1,DO:2,TR:3,JC:4,SR:5,CN:2,AP:4};

const URGENCY = {
  critical:{color:C.red,   bg:C.redDim,   label:"Critical"},
  high:    {color:C.amber, bg:C.amberDim, label:"High"    },
  medium:  {color:C.cyan,  bg:C.cyanDim,  label:"Medium"  },
  low:     {color:C.green, bg:C.greenDim, label:"Low"     },
};

const FILTERS = ["All","Retention","Engagement","Challenge","Milestone"];

/* ─── SHARED PRIMITIVES ──────────────────────────────────────── */
function Av({ initials, size=22 }) {
  const color = AV_COLORS[AV_MAP[initials] ?? (initials?.charCodeAt(0) ?? 0) % AV_COLORS.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`${color}18`, color, fontSize:size*0.34, fontWeight:700,
      display:"flex", alignItems:"center", justifyContent:"center",
      border:`1px solid ${color}28`,
    }}>{initials}</div>
  );
}

/* Matches ContentPage tab style exactly */
function Tabs({ active, setActive }) {
  return (
    <div style={{ borderBottom:`1px solid ${C.brd}`, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActive(f)}
            style={{
              padding:"7px 14px", fontSize:12.5, background:"transparent", border:"none",
              borderBottom:`2px solid ${active===f ? C.cyan : "transparent"}`,
              color: active===f ? C.t1 : C.t2,
              fontWeight: active===f ? 700 : 400,
              cursor:"pointer", marginBottom:-1, fontFamily:FONT,
              transition:"color 0.15s", whiteSpace:"nowrap", minHeight:40,
            }}>
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

function SuccessBar({ pct, color }) {
  return (
    <div style={{ height:2, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2 }}/>
    </div>
  );
}

/* ─── ACTION CARD — clean, structured like ContentPage post cards ─ */
function ActionCard({ action, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const [acted,    setActed]    = useState(false);
  const u = URGENCY[action.urgency];

  return (
    <div
      style={{
        background:C.card, border:`1px solid ${C.brd}`,
        borderLeft:`2px solid ${u.color}`,
        borderRadius:12, overflow:"hidden",
        opacity: acted ? 0.4 : 1,
        transition:"opacity 0.3s, border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => { if (!acted) { e.currentTarget.style.borderColor=C.cyanBrd; e.currentTarget.style.borderLeftColor=u.color; e.currentTarget.style.boxShadow=`0 0 8px rgba(77,127,255,0.07)`; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.borderLeftColor=u.color; e.currentTarget.style.boxShadow="none"; }}
    >
      <div style={{ display:"flex", overflow:"hidden" }}>
        {/* Main content */}
        <div style={{ flex:1, minWidth:0, padding:"12px 14px", display:"flex", flexDirection:"column", gap:6 }}>

          {/* Row 1: icon + title + tag + time */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:`${u.color}10`, border:`1px solid ${u.color}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <action.icon size={13} color={u.color}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:3 }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:C.t1, lineHeight:1.3 }}>{action.title}</span>
                <span style={{
                  padding:"1px 7px", borderRadius:4, fontSize:9.5, fontWeight:700,
                  color:action.tagColor, background:`${action.tagColor}12`,
                  border:`1px solid ${action.tagColor}28`,
                  textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap",
                }}>{action.tag}</span>
              </div>
              <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.55 }}>{action.subtitle}</div>
            </div>
            <span style={{ fontSize:10, color:C.t3, flexShrink:0, paddingTop:2 }}>{action.timeAgo}</span>
          </div>

          {/* Row 2: avatars (if any) */}
          {action.members.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, paddingLeft:40 }}>
              <div style={{ display:"flex" }}>
                {action.members.slice(0,5).map((ini,i) => (
                  <div key={i} style={{ marginLeft: i>0 ? -7 : 0 }}><Av initials={ini} size={20}/></div>
                ))}
              </div>
              {action.members.length > 5 && <span style={{ fontSize:10, color:C.t3 }}>+{action.members.length-5}</span>}
              <span style={{ fontSize:10.5, color:C.t3 }}>{action.members.length} member{action.members.length!==1?"s":""}</span>
            </div>
          )}

          {/* Row 3: stats + bar */}
          <div style={{ display:"flex", gap:16, alignItems:"center", paddingLeft:40 }}>
            {action.stats.map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                <span style={{ fontSize:12, fontWeight:700, color: i===2 ? u.color : C.t1, fontVariantNumeric:"tabular-nums" }}>{s.val}</span>
                <span style={{ fontSize:10, color:C.t3 }}>{s.label}</span>
              </div>
            ))}
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:7 }}>
              <SuccessBar pct={action.successRate} color={u.color}/>
            </div>
          </div>

          {/* Expanded insight */}
          {expanded && (
            <div style={{ marginTop:4, padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.02)", border:`1px solid ${C.brd}`, paddingLeft:40 }}>
              <span style={{ fontSize:11.5, color:C.cyan, fontWeight:600 }}>AI Insight · </span>
              <span style={{ fontSize:11.5, color:C.t2, lineHeight:1.65 }}>{action.detail}</span>
            </div>
          )}
        </div>

        {/* Quick Actions — matches ContentPage QuickActions panel */}
        <div style={{
          width:130, flexShrink:0, borderLeft:`1px solid ${C.brd}`,
          padding:"12px 10px", display:"flex", flexDirection:"column", gap:7,
        }}>
          <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.10em", color:C.t3, marginBottom:2 }}>
            Quick Actions
          </div>

          {acted ? (
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 9px", borderRadius:7, background:C.greenDim, border:`1px solid ${C.greenBrd}` }}>
              <Check size={10} color={C.green}/>
              <span style={{ fontSize:10.5, fontWeight:600, color:C.green }}>Done</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setActed(true)}
                style={{ display:"flex", alignItems:"center", gap:5, width:"100%", padding:"5px 9px", borderRadius:8, background:C.cyan, border:"none", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:FONT, boxShadow:"0 0 10px rgba(77,127,255,0.22)" }}>
                <action.ctaIcon size={10}/><span>{action.cta}</span>
              </button>
              {action.secondaryCta && (
                <button
                  style={{ display:"flex", alignItems:"center", gap:5, width:"100%", padding:"5px 9px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`, color:C.t2, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanBrd;e.currentTarget.style.color=C.t1;e.currentTarget.style.background=C.cyanDim;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background="rgba(255,255,255,0.03)";}}>
                  <Eye size={10}/><span>{action.secondaryCta}</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setExpanded(v=>!v)}
            style={{ display:"flex", alignItems:"center", gap:5, width:"100%", padding:"5px 9px", borderRadius:8, background: expanded ? C.cyanDim : "rgba(255,255,255,0.03)", border:`1px solid ${expanded ? C.cyanBrd : C.brd}`, color: expanded ? C.cyan : C.t2, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}>
            <ChevronDown size={10} color="currentColor" style={{ transform: expanded?"rotate(180deg)":"none", transition:"transform 0.2s" }}/>
            <span>{expanded?"Less":"AI Insight"}</span>
          </button>

          <button
            onClick={() => onDismiss?.(action.id)}
            style={{ display:"flex", alignItems:"center", gap:5, width:"100%", padding:"5px 9px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`, color:C.t2, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redBrd;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redDim;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background="rgba(255,255,255,0.03)";}}>
            <X size={10}/><span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── RIGHT SIDEBAR ── mirrors ContentPage's RightSidebar structure */
function RightSidebar({ actions }) {
  const [sentMap, setSentMap] = useState({});
  const urgentCount   = actions.filter(a=>a.urgency==="critical"||a.urgency==="high").length;
  const revenueAtRisk = urgentCount * 180;

  const statCards = [
    { label:"Urgent Actions",   val: String(urgentCount),          col:C.red  },
    { label:"Revenue at Risk",  val:`$${revenueAtRisk}`,           col:C.cyan },
    { label:"Done Today",       val:String(COMPLETED_TODAY.length), col:C.green},
    { label:"Avg Response",     val:"<2h",                          col:C.blue },
  ];

  return (
    <div style={{
      width:244, flexShrink:0,
      background:C.sidebar, borderLeft:`1px solid ${C.brd}`,
      display:"flex", flexDirection:"column",
      fontFamily:FONT, overflowY:"auto",
      alignSelf:"flex-start",
    }}>
      {/* Stat grid — exact ContentPage style */}
      <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Actions Overview</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1px", background:C.brd, borderBottom:`1px solid ${C.brd}` }}>
        {statCards.map((s,i) => (
          <div key={i} style={{ padding:"12px 14px", background:C.sidebar }}>
            <div style={{ fontSize:10, color:C.t3, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.col, lineHeight:1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* AI Coach — same card as ContentPage */}
      <div style={{ padding:"14px" }}>
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

      <div style={{ height:1, background:C.brd }}/>

      {/* Action Feed — inside sidebar */}
      <div style={{ padding:"14px 14px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block" }}/>
            <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Live Feed</span>
          </div>
          <span style={{ fontSize:10, color:C.t3 }}>{FEED_ITEMS.length} events</span>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, overflow:"hidden" }}>
          {FEED_ITEMS.slice(0,6).map((item,i) => {
            const [sent, setSent] = useState(false);
            return (
              <div key={item.id} style={{
                display:"flex", alignItems:"center", gap:9,
                padding:"9px 12px",
                borderBottom: i < Math.min(FEED_ITEMS.length,6)-1 ? `1px solid ${C.brd}` : "none",
                background: item.isNew ? `${C.cyan}08` : "transparent",
              }}>
                <div style={{ width:24, height:24, borderRadius:6, flexShrink:0, background:`${item.color}10`, border:`1px solid ${item.color}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
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
                  <button onClick={()=>setSent(true)} style={{ padding:"3px 8px", borderRadius:5, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:FONT, flexShrink:0, background: sent?C.greenDim:"rgba(255,255,255,0.03)", border:`1px solid ${sent?C.greenBrd:C.brd}`, color: sent?C.green:C.t2, transition:"all 0.2s", whiteSpace:"nowrap" }}>
                    {sent ? <Check size={8}/> : item.cta}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height:1, background:C.brd }}/>

      {/* Completed Today */}
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

/* ─── DESKTOP ROOT ───────────────────────────────────────────── */
export default function TabActions() {
  const [actions,  setActions]  = useState(PRIORITY_ACTIONS);
  const [filter,   setFilter]   = useState("All");
  const [viewAll,  setViewAll]  = useState(false);
  const [showDone, setShowDone] = useState(false);
  const liveRef = useRef(0);

  const dismiss  = (id) => setActions(p => p.filter(a => a.id !== id));
  const filtered = filter==="All" ? actions : actions.filter(a => a.tag===filter);
  const shown    = viewAll ? filtered : filtered.slice(0, 4);
  const urgentCount = actions.filter(a => a.urgency==="critical" || a.urgency==="high").length;

  return (
    <div style={{ display:"flex", height:"100%", background:C.bg, color:C.t1, fontFamily:FONT, overflow:"hidden" }}>
      <style>{`
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${C.brd};border-radius:2px;}
      `}</style>

      {/* ── MAIN COLUMN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

        {/* Header — matches ContentPage exactly */}
        <div style={{ padding:"4px 16px 0 4px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:0, letterSpacing:"-0.03em", lineHeight:1.2 }}>
              Actions <span style={{ color:C.cyan }}>/ Priority</span>
            </h1>
            {urgentCount > 0 && (
              <span style={{ fontSize:10, fontWeight:700, color:C.red, background:C.redDim, border:`1px solid ${C.redBrd}`, padding:"2px 9px", borderRadius:20, display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:C.red, display:"inline-block" }}/>
                {urgentCount} urgent
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:7 }}>
            <button
              onClick={() => setShowDone(v=>!v)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"9px 14px", borderRadius:9, fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:FONT, background:"rgba(255,255,255,0.02)", border:`1px solid ${C.brd}`, color:C.t2, transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanBrd;e.currentTarget.style.color=C.t1;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;}}>
              <Check size={12}/>{showDone ? "Hide" : "Show"} completed
            </button>
            <button
              onClick={() => setViewAll(v=>!v)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:FONT, background:"#2563eb", border:"none", color:"#fff", transition:"opacity 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <Eye size={12}/>{viewAll ? `Show less` : `View all ${actions.length}`}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding:"0 4px" }}>
          <Tabs active={filter} setActive={f => { setFilter(f); setViewAll(false); }}/>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 16px 32px 4px" }}>

          {/* Subheading */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, marginTop:2 }}>
            <div style={{ fontSize:12, fontWeight:500, color:C.t2 }}>
              {filtered.length} action{filtered.length!==1?"s":""} · sorted by urgency
            </div>
          </div>

          {/* Action cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {shown.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"56px 0", gap:12 }}>
                <Check size={22} color={C.green} style={{ opacity:0.7 }}/>
                <div style={{ fontSize:13, fontWeight:600, color:C.t2 }}>All caught up</div>
                <div style={{ fontSize:11, color:C.t3 }}>No actions in this category.</div>
              </div>
            ) : shown.map(a => (
              <ActionCard key={a.id} action={a} onDismiss={dismiss}/>
            ))}

            {!viewAll && filtered.length > 4 && (
              <button
                onClick={() => setViewAll(true)}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px", borderRadius:9, background:"rgba(255,255,255,0.015)", border:`1px solid ${C.brd}`, color:C.t3, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanBrd;e.currentTarget.style.color=C.t1;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t3;}}>
                Show {filtered.length-4} more actions <ChevronDown size={12}/>
              </button>
            )}
          </div>

          {/* Completed today (toggleable) */}
          {showDone && (
            <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"11px 16px", borderBottom:`1px solid ${C.brd}`, display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.01)" }}>
                <Check size={12} color={C.green}/>
                <span style={{ fontSize:12.5, fontWeight:600, color:C.t1 }}>Completed Today</span>
                <span style={{ fontSize:10, color:C.t3 }}>{COMPLETED_TODAY.length} actions taken</span>
              </div>
              {COMPLETED_TODAY.map((c,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom: i<COMPLETED_TODAY.length-1 ? `1px solid ${C.brd}` : "none" }}>
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

      {/* ── RIGHT SIDEBAR ── */}
      <RightSidebar actions={actions}/>
    </div>
  );
}
