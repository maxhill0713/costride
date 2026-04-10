/**
 * TabActions — Forge Fitness
 * Elite actions dashboard · Refined visual hierarchy · Cyan accent
 */
import { useState, useEffect, useRef } from "react";
import {
  Shield, Zap, Send, Users, Calendar, Trophy, AlertTriangle,
  ChevronRight, ChevronDown, ArrowUpRight, Check, X, Clock,
  Flame, Star, Bell, Gift, TrendingUp, TrendingDown, Activity,
  MessageCircle, Plus, Eye, RefreshCw, MoreHorizontal, Sparkles,
  UserPlus, BookOpen, Target, DollarSign, BarChart2, Filter,
} from "lucide-react";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       "#080809",
  sidebar:  "#0c0c0e",
  card:     "#111113",
  card2:    "#0c0c0e",
  cardHov:  "#161618",
  brd:      "#1e1e22",
  brdHov:   "#2a2a30",
  t1:       "#f0f0f2",
  t2:       "#72727c",
  t3:       "#3a3a42",
  t4:       "#28282f",
  cyan:     "#00e5c8",
  cyanDim:  "rgba(0,229,200,0.07)",
  cyanBrd:  "rgba(0,229,200,0.18)",
  cyanGlow: "rgba(0,229,200,0.12)",
  red:      "#f04a68",
  redDim:   "rgba(240,74,104,0.08)",
  redBrd:   "rgba(240,74,104,0.18)",
  amber:    "#e8940a",
  amberDim: "rgba(232,148,10,0.08)",
  amberBrd: "rgba(232,148,10,0.18)",
  green:    "#1eb85a",
  greenDim: "rgba(30,184,90,0.08)",
  greenBrd: "rgba(30,184,90,0.18)",
  blue:     "#4f97f5",
  blueDim:  "rgba(79,151,245,0.08)",
  blueBrd:  "rgba(79,151,245,0.18)",
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ─── DATA ───────────────────────────────────────────────────── */
const PRIORITY_ACTIONS = [
  {
    id: "pa1",
    urgency: "critical",
    icon: Users,
    title: "6 members haven't visited in 14+ days",
    subtitle: "Send a check-in message to re-engage before they churn.",
    tag: "Retention",
    tagColor: C.red,
    impact: "$360/mo at risk",
    impactColor: C.red,
    successRate: 38,
    members: ["MW","PS","DO","TR","JC","SR"],
    cta: "Message Them",
    ctaIcon: Send,
    secondaryCta: "View Members",
    stats: [{ label:"At risk", val:"6" },{ label:"Avg absent", val:"19d" },{ label:"Success", val:"38%" }],
    detail: "These members are in the critical window for churn. A personalised nudge now recovers 1 in 3.",
    timeAgo: "2 min ago",
  },
  {
    id: "pa2",
    urgency: "high",
    icon: Calendar,
    title: "Class underbooked — 4 / 15 spots filled",
    subtitle: "Promote this class to boost attendance tomorrow.",
    tag: "Engagement",
    tagColor: C.amber,
    impact: "11 spots remaining",
    impactColor: C.amber,
    successRate: 62,
    members: [],
    cta: "Promote Class",
    ctaIcon: Send,
    secondaryCta: "View Class",
    stats: [{ label:"Capacity", val:"27%" },{ label:"Time to class", val:"18h" },{ label:"Success", val:"62%" }],
    detail: "Morning HIIT on Tuesday is below the minimum. A quick post typically fills 6–8 spots.",
    timeAgo: "14 min ago",
  },
  {
    id: "pa3",
    urgency: "medium",
    icon: Trophy,
    title: "Create a Challenge for May",
    subtitle: "Boost engagement with a fitness challenge this month.",
    tag: "Challenge",
    tagColor: C.cyan,
    impact: "+31% retention lift",
    impactColor: C.cyan,
    successRate: 76,
    members: [],
    cta: "Create Challenge",
    ctaIcon: Plus,
    secondaryCta: "See Templates",
    stats: [{ label:"Avg engagement", val:"+31%" },{ label:"Duration", val:"30d" },{ label:"Success", val:"76%" }],
    detail: "Members who join a challenge are 3× more likely to stay active through the following month.",
    timeAgo: "1 hr ago",
  },
  {
    id: "pa4",
    urgency: "medium",
    icon: Gift,
    title: "3 members have birthdays this week",
    subtitle: "Send a personalised birthday message to boost loyalty.",
    tag: "Engagement",
    tagColor: C.blue,
    impact: "3× referral rate",
    impactColor: C.blue,
    successRate: 89,
    members: ["CN","AP","JC"],
    cta: "Send Birthday Messages",
    ctaIcon: Send,
    secondaryCta: null,
    stats: [{ label:"Members", val:"3" },{ label:"Avg LTV boost", val:"+18%" },{ label:"Success", val:"89%" }],
    detail: "Birthday messages have the highest open rate of any automated message type.",
    timeAgo: "3 hr ago",
  },
  {
    id: "pa5",
    urgency: "low",
    icon: Star,
    title: "Priya Sharma hits 50 visits this week",
    subtitle: "Celebrate this milestone to boost loyalty and referrals.",
    tag: "Milestone",
    tagColor: C.green,
    impact: "High referral potential",
    impactColor: C.green,
    successRate: 94,
    members: ["PS"],
    cta: "Send Congrats",
    ctaIcon: Send,
    secondaryCta: null,
    stats: [{ label:"Total visits", val:"49" },{ label:"Streak", val:"7d" },{ label:"Success", val:"94%" }],
    detail: "Milestone celebrations convert 1 in 4 members into active referrers.",
    timeAgo: "5 hr ago",
  },
];

const FEED_ITEMS = [
  { id:"f1",  type:"alert",     icon:AlertTriangle, color:C.red,   member:"Marcus Webb",    action:"Hasn't visited in 22 days",          cta:"Message",  ago:"just now",   isNew:true  },
  { id:"f2",  type:"insight",   icon:TrendingDown,  color:C.amber, member:null,             action:"Attendance dropped 18% this week",   cta:"Promote",  ago:"4 min ago",  isNew:false },
  { id:"f3",  type:"milestone", icon:Star,          color:C.cyan,  member:"Chloe Nakamura", action:"18-day streak — recognition due",    cta:"Celebrate",ago:"11 min ago", isNew:false },
  { id:"f4",  type:"alert",     icon:UserPlus,      color:C.blue,  member:"Sam Rivera",     action:"New member · hasn't returned in 6d", cta:"Nudge",    ago:"23 min ago", isNew:false },
  { id:"f5",  type:"insight",   icon:BarChart2,     color:C.amber, member:null,             action:"Tuesday HIIT is 27% full",           cta:"Promote",  ago:"1 hr ago",   isNew:false },
  { id:"f6",  type:"alert",     icon:AlertTriangle, color:C.red,   member:"Devon Osei",     action:"19 days absent — critical window",   cta:"Message",  ago:"2 hr ago",   isNew:false },
  { id:"f7",  type:"win",       icon:Check,         color:C.green, member:"Anya Petrov",    action:"Returned after re-engagement nudge", cta:null,       ago:"3 hr ago",   isNew:false },
  { id:"f8",  type:"win",       icon:Check,         color:C.green, member:"Jamie Collins",  action:"Responded to check-in message",      cta:null,       ago:"4 hr ago",   isNew:false },
];

const COMPLETED_TODAY = [
  { label:"Nudge sent to Marcus Webb", time:"09:14" },
  { label:"Tuesday HIIT promoted to feed", time:"08:50" },
  { label:"Welcome sent to Sam Rivera", time:"08:30" },
];

const AV_COLORS = ["#6366f1","#14b8a6","#8b5cf6","#e8940a","#f04a68","#4f97f5"];

const URGENCY = {
  critical: { color: C.red,   bg: C.redDim,   brd: C.redBrd,   label:"Critical", dot: true  },
  high:     { color: C.amber, bg: C.amberDim, brd: C.amberBrd, label:"High",     dot: true  },
  medium:   { color: C.cyan,  bg: C.cyanDim,  brd: C.cyanBrd,  label:"Medium",   dot: false },
  low:      { color: C.green, bg: C.greenDim, brd: C.greenBrd, label:"Low",      dot: false },
};

const FILTERS = ["All", "Retention", "Engagement", "Challenge", "Milestone"];

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
const AV_MAP = { MW:0, PS:1, DO:2, TR:3, JC:4, SR:5, CN:2, AP:4 };

function Av({ initials, size = 22 }) {
  const color = AV_COLORS[AV_MAP[initials] ?? (initials?.charCodeAt(0) ?? 0) % AV_COLORS.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`${color}18`, color, fontSize:size*0.34, fontWeight:700,
      display:"flex", alignItems:"center", justifyContent:"center",
      border:`1px solid ${color}28`,
    }}>
      {initials}
    </div>
  );
}

function UrgencyDot({ urgency }) {
  const u = URGENCY[urgency];
  if (!u?.dot) return null;
  return (
    <span style={{
      width:5, height:5, borderRadius:"50%", background:u.color,
      display:"inline-block", flexShrink:0,
      boxShadow:`0 0 8px ${u.color}`,
    }} />
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      padding:"2px 8px", borderRadius:4, fontSize:9.5, fontWeight:600,
      color, background:`${color}12`, border:`1px solid ${color}28`,
      letterSpacing:"0.04em", whiteSpace:"nowrap", textTransform:"uppercase",
    }}>
      {label}
    </span>
  );
}

function ImpactPill({ label, color }) {
  return (
    <span style={{
      display:"flex", alignItems:"center", gap:4, fontSize:10.5, fontWeight:600,
      color, background:`${color}10`, border:`1px solid ${color}25`,
      borderRadius:4, padding:"2px 8px", whiteSpace:"nowrap",
    }}>
      <TrendingUp size={9} color={color} />{label}
    </span>
  );
}

function SuccessBar({ pct, color }) {
  return (
    <div style={{ height:2, background:C.t4, borderRadius:2, overflow:"hidden", flex:1, minWidth:60 }}>
      <div style={{
        width:`${pct}%`, height:"100%",
        background:`linear-gradient(90deg, ${color}99, ${color})`,
        borderRadius:2,
      }} />
    </div>
  );
}

function CTA({ label, icon:Icon, primary, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:5,
      padding: primary ? "7px 15px" : "6px 12px",
      borderRadius:7, fontSize:11.5, fontWeight:600, cursor:"pointer",
      fontFamily:FONT,
      background: primary
        ? `linear-gradient(135deg, ${C.cyan}, #00c9b0)`
        : "rgba(255,255,255,0.03)",
      border: primary
        ? "none"
        : `1px solid ${C.brd}`,
      color: primary ? "#000" : C.t2,
      boxShadow: primary ? `0 2px 20px rgba(0,229,200,0.18)` : "none",
      flexShrink:0,
      letterSpacing: primary ? "0.01em" : "normal",
      transition:"all 0.15s",
    }}>
      {Icon && <Icon size={11} />}{label}
    </button>
  );
}

/* ─── DIVIDER ────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height:1, background:C.brd, margin:"0" }} />;
}

/* ─── KPI STRIP ──────────────────────────────────────────────── */
function KpiStrip() {
  const stats = [
    {
      icon: AlertTriangle,
      label: "Urgent Actions",
      val: "3",
      sub: "need attention now",
      accentColor: C.red,
      valColor: C.t1,      // white
    },
    {
      icon: DollarSign,
      label: "Revenue at Risk",
      val: "$540",
      sub: "from inactive members",
      accentColor: C.cyan,
      valColor: C.cyan,    // cyan — the primary page colour
    },
    {
      icon: Check,
      label: "Completed Today",
      val: "3",
      sub: "actions taken this morning",
      accentColor: C.green,
      valColor: C.t1,      // white
    },
    {
      icon: Activity,
      label: "Avg Response Time",
      val: "<2h",
      sub: "across all action types",
      accentColor: C.blue,
      valColor: C.t1,      // white
    },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: C.card,
          border: `1px solid ${C.brd}`,
          borderRadius:10,
          padding:"14px 16px",
          position:"relative",
          overflow:"hidden",
        }}>
          {/* Subtle top-edge accent */}
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:1,
            background:`linear-gradient(90deg, transparent, ${s.accentColor}40, transparent)`,
          }} />

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{
              width:28, height:28, borderRadius:7,
              background:`${s.accentColor}10`,
              border:`1px solid ${s.accentColor}22`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <s.icon size={12} color={s.accentColor} />
            </div>
            <ArrowUpRight size={11} color={C.t3} />
          </div>

          <div style={{
            fontSize:26, fontWeight:700,
            color: s.valColor,
            letterSpacing:"-0.04em",
            lineHeight:1,
            marginBottom:5,
            fontVariantNumeric:"tabular-nums",
            ...(s.valColor === C.cyan ? { textShadow:`0 0 24px ${C.cyanGlow}` } : {}),
          }}>
            {s.val}
          </div>

          <div style={{ fontSize:11, fontWeight:600, color:C.t2, marginBottom:1 }}>{s.label}</div>
          <div style={{ fontSize:10, color:C.t3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── PRIORITY ACTION CARD ───────────────────────────────────── */
function ActionCard({ action, onDismiss, onAct }) {
  const [expanded, setExpanded] = useState(false);
  const [acted, setActed]       = useState(false);
  const u = URGENCY[action.urgency];

  const handleAct = (e) => {
    e.stopPropagation();
    setActed(true);
    onAct?.(action);
  };

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.brd}`,
      borderLeft: `2px solid ${u.color}`,
      borderRadius: 10,
      overflow: "hidden",
      opacity: acted ? 0.45 : 1,
      transition: "opacity 0.3s, border-color 0.15s",
    }}>
      {/* Main row */}
      <div style={{ padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
        {/* Icon */}
        <div style={{
          width:34, height:34, borderRadius:9, flexShrink:0,
          background:`${u.color}10`,
          border:`1px solid ${u.color}22`,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginTop:1,
        }}>
          <action.icon size={14} color={u.color} />
        </div>

        {/* Body */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:5 }}>
            <div style={{ flex:1, minWidth:0 }}>
              {/* Title row */}
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5, flexWrap:"wrap" }}>
                <UrgencyDot urgency={action.urgency} />
                <span style={{ fontSize:13, fontWeight:700, color:C.t1, lineHeight:1.3 }}>{action.title}</span>
                <Tag label={action.tag} color={action.tagColor} />
                <ImpactPill label={action.impact} color={action.impactColor} />
              </div>

              {/* Subtitle */}
              <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.55, marginBottom:9 }}>
                {action.subtitle}
              </div>

              {/* Member avatars */}
              {action.members.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
                  <div style={{ display:"flex" }}>
                    {action.members.slice(0,5).map((ini, i) => (
                      <div key={i} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                        <Av initials={ini} size={20} />
                      </div>
                    ))}
                  </div>
                  {action.members.length > 5 && (
                    <span style={{ fontSize:10, color:C.t3 }}>+{action.members.length - 5}</span>
                  )}
                  <span style={{ fontSize:10.5, color:C.t3 }}>
                    {action.members.length} member{action.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Stats row */}
              <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                {action.stats.map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                    <span style={{
                      fontSize:12.5, fontWeight:700,
                      color: i === 2 ? u.color : C.t1,
                      fontVariantNumeric:"tabular-nums",
                    }}>{s.val}</span>
                    <span style={{ fontSize:10, color:C.t3 }}>{s.label}</span>
                  </div>
                ))}
                <div style={{ display:"flex", alignItems:"center", gap:5, flex:1, minWidth:60 }}>
                  <SuccessBar pct={action.successRate} color={u.color} />
                </div>
              </div>
            </div>

            {/* Timestamp + controls */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
              <span style={{ fontSize:10, color:C.t3, letterSpacing:"0.01em" }}>{action.timeAgo}</span>
              <button
                onClick={e => { e.stopPropagation(); onDismiss?.(action.id); }}
                style={{
                  width:22, height:22, borderRadius:5,
                  background:"rgba(255,255,255,0.02)",
                  border:`1px solid ${C.brd}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer",
                }}>
                <X size={9} color={C.t3} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                style={{
                  width:22, height:22, borderRadius:5,
                  background: expanded ? C.cyanDim : "rgba(255,255,255,0.02)",
                  border:`1px solid ${expanded ? C.cyanBrd : C.brd}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer",
                }}>
                <ChevronDown
                  size={10}
                  color={expanded ? C.cyan : C.t3}
                  style={{ transform: expanded ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}
                />
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:4 }}>
            {acted ? (
              <div style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"6px 12px", borderRadius:7,
                background:C.greenDim, border:`1px solid ${C.greenBrd}`,
              }}>
                <Check size={11} color={C.green} />
                <span style={{ fontSize:11.5, fontWeight:600, color:C.green }}>Done — tracking response</span>
              </div>
            ) : (
              <>
                <CTA label={action.cta} icon={action.ctaIcon} primary onClick={handleAct} />
                {action.secondaryCta && (
                  <CTA label={action.secondaryCta} primary={false} onClick={e => e.stopPropagation()} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding:"12px 16px 14px",
          borderTop:`1px solid ${C.brd}`,
          background:"rgba(255,255,255,0.012)",
        }}>
          <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.65, marginBottom:10 }}>
            <span style={{ color:C.cyan, fontWeight:600 }}>AI Insight · </span>
            {action.detail}
          </div>
          <div style={{ display:"flex", gap:5 }}>
            {["View history","Snooze 24h","Mark irrelevant"].map(t => (
              <button key={t} style={{
                padding:"3px 9px", borderRadius:4, fontSize:10, fontWeight:500,
                cursor:"pointer", fontFamily:FONT,
                background:"rgba(255,255,255,0.02)",
                border:`1px solid ${C.brd}`,
                color:C.t3,
                letterSpacing:"0.02em",
              }}>{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ACTION FEED ROW ────────────────────────────────────────── */
function FeedRow({ item, i, total }) {
  const [sent, setSent] = useState(false);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 14px",
      borderBottom: i < total - 1 ? `1px solid ${C.brd}` : "none",
      background: item.isNew ? `${C.cyan}05` : "transparent",
      transition:"background 0.4s",
    }}>
      <div style={{
        width:28, height:28, borderRadius:7, flexShrink:0,
        background:`${item.color}10`,
        border:`1px solid ${item.color}22`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <item.icon size={11} color={item.color} />
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, color:C.t2, lineHeight:1.45 }}>
          {item.member && <span style={{ fontWeight:600, color:C.t1 }}>{item.member} </span>}
          <span style={{ color: item.type === "win" ? C.green : C.t2 }}>{item.action}</span>
        </div>
        <div style={{ fontSize:9.5, color:C.t3, marginTop:2 }}>{item.ago}</div>
      </div>

      {item.type === "win" ? (
        <span style={{
          fontSize:9.5, fontWeight:700, color:C.green,
          background:C.greenDim, border:`1px solid ${C.greenBrd}`,
          borderRadius:4, padding:"2px 8px", flexShrink:0,
          letterSpacing:"0.04em", textTransform:"uppercase",
        }}>win</span>
      ) : item.cta ? (
        <button
          onClick={() => setSent(true)}
          style={{
            display:"flex", alignItems:"center", gap:4,
            padding:"4px 10px", borderRadius:5,
            fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FONT, flexShrink:0,
            background: sent ? C.greenDim : "rgba(255,255,255,0.03)",
            border:`1px solid ${sent ? C.greenBrd : C.brd}`,
            color: sent ? C.green : C.t2,
            transition:"all 0.2s",
          }}>
          {sent ? <><Check size={9} />Done</> : item.cta}
        </button>
      ) : null}
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
function RightSidebar() {
  const [showMore, setShowMore] = useState(false);
  const [sentMap, setSentMap]   = useState({});

  const quickWins = [
    { id:"qw1", label:"Send motivational message to all active members", cta:"Send Post"   },
    { id:"qw2", label:"Post a reminder about this week's top class",     cta:"Create Post" },
    { id:"qw3", label:"Share Anya's 7-day streak as a community highlight", cta:"Share"   },
    { id:"qw4", label:"Ask members to vote on next month's challenge theme", cta:"Poll"   },
  ];

  const shown = showMore ? quickWins : quickWins.slice(0, 2);

  const sideSection = (icon, label, children) => (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
        <div style={{
          width:20, height:20, borderRadius:5,
          background:"rgba(255,255,255,0.03)",
          border:`1px solid ${C.brd}`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {icon}
        </div>
        <span style={{ fontSize:11.5, fontWeight:600, color:C.t1, letterSpacing:"0.01em" }}>{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{
      width:252, flexShrink:0,
      background:C.card2,
      borderLeft:`1px solid ${C.brd}`,
      padding:"16px 14px",
      display:"flex", flexDirection:"column", gap:16,
      overflowY:"auto",
    }}>

      {/* AI Coach */}
      <div style={{
        padding:"13px 13px",
        borderRadius:10,
        background:C.card,
        border:`1px solid ${C.cyanBrd}`,
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Top accent glow */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:1,
          background:`linear-gradient(90deg, transparent, ${C.cyan}60, transparent)`,
        }} />

        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
          <div style={{
            width:22, height:22, borderRadius:6,
            background:C.cyanDim, border:`1px solid ${C.cyanBrd}`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Sparkles size={10} color={C.cyan} />
          </div>
          <span style={{ fontSize:11.5, fontWeight:700, color:C.t1 }}>AI Coach</span>
          <span style={{
            fontSize:9, fontWeight:700, color:C.cyan,
            background:C.cyanDim, border:`1px solid ${C.cyanBrd}`,
            padding:"1px 6px", borderRadius:20, marginLeft:"auto",
            letterSpacing:"0.04em", textTransform:"uppercase",
          }}>Live</span>
        </div>

        <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.65, marginBottom:10 }}>
          Your <span style={{ color:C.t1, fontWeight:600 }}>retention is strong</span> this week. Focus on the 6 inactive members — acting now protects{" "}
          <span style={{ color:C.cyan, fontWeight:700 }}>$360/mo</span> in revenue.
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer" }}>
          <span style={{ fontSize:11, fontWeight:600, color:C.cyan }}>Ask AI Coach</span>
          <ChevronRight size={10} color={C.cyan} />
        </div>
      </div>

      <Divider />

      {/* Automations */}
      {sideSection(
        <Zap size={9} color={C.t3} />,
        "Automations",
        <>
          {[
            {
              title:"Missing a welcome workflow",
              body:"Engage new members with a same-day welcome that increases 2nd-visit rate by 30%.",
              cta:"Create Automation",
            },
            {
              title:"Win-back rule: inactive 30d",
              body:"Members inactive 30+ days have 91% churn risk. Automated re-engagement recovers 1 in 4.",
              cta:"Add Rule",
            },
          ].map((s, i) => (
            <div key={i} style={{
              padding:"11px 12px", borderRadius:8,
              background:C.card, border:`1px solid ${C.brd}`,
              marginBottom:7,
            }}>
              <div style={{ fontSize:11.5, fontWeight:600, color:C.t1, marginBottom:4 }}>{s.title}</div>
              <div style={{ fontSize:10.5, color:C.t2, lineHeight:1.55, marginBottom:9 }}>{s.body}</div>
              <CTA label={s.cta} icon={Plus} primary={false} />
            </div>
          ))}
        </>
      )}

      <Divider />

      {/* Content Suggestions */}
      {sideSection(
        <BookOpen size={9} color={C.t3} />,
        "Content Suggestions",
        <>
          {[
            { title:"Reminder for Tuesday HIIT", sub:"Post now to fill remaining 11 spots.", cta:"Send Reminder" },
            { title:"Recovery workshop — tomorrow", sub:"Quick class preview gets more sign-ups.", cta:"Create Post" },
          ].map((s, i) => (
            <div key={i} style={{
              padding:"11px 12px", borderRadius:8,
              background:C.card, border:`1px solid ${C.brd}`,
              marginBottom:7,
            }}>
              <div style={{ fontSize:11.5, fontWeight:600, color:C.t1, marginBottom:3 }}>{s.title}</div>
              <div style={{ fontSize:10.5, color:C.t2, lineHeight:1.5, marginBottom:8 }}>{s.sub}</div>
              <CTA label={s.cta} primary={false} />
            </div>
          ))}
        </>
      )}

      <Divider />

      {/* Quick Wins */}
      {sideSection(
        <Flame size={9} color={C.t3} />,
        "Quick Wins",
        <>
          {shown.map(qw => (
            <div key={qw.id} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:11, color:C.t2, flex:1, lineHeight:1.5, paddingTop:1 }}>{qw.label}</span>
              <button
                onClick={() => setSentMap(p => ({ ...p, [qw.id]: true }))}
                style={{
                  padding:"3px 9px", borderRadius:5, fontSize:10, fontWeight:600,
                  cursor:"pointer", fontFamily:FONT, flexShrink:0, whiteSpace:"nowrap",
                  background: sentMap[qw.id] ? C.greenDim : "rgba(255,255,255,0.03)",
                  border:`1px solid ${sentMap[qw.id] ? C.greenBrd : C.brd}`,
                  color: sentMap[qw.id] ? C.green : C.t2,
                  transition:"all 0.2s",
                }}>
                {sentMap[qw.id] ? "Done" : qw.cta}
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowMore(v => !v)}
            style={{
              display:"flex", alignItems:"center", gap:4,
              background:"none", border:"none", cursor:"pointer",
              fontSize:11, color:C.cyan, fontWeight:600,
              padding:0, fontFamily:FONT,
            }}>
            {showMore ? "Show less" : `Show ${quickWins.length - 2} more`}
            <ChevronRight size={10} color={C.cyan} style={{ transform: showMore ? "rotate(90deg)" : "none", transition:"0.2s" }} />
          </button>
        </>
      )}
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function TabActions() {
  const [actions, setActions]   = useState(PRIORITY_ACTIONS);
  const [filter, setFilter]     = useState("All");
  const [feed, setFeed]         = useState(FEED_ITEMS);
  const [showDone, setShowDone] = useState(false);
  const [viewAll, setViewAll]   = useState(false);
  const liveRef = useRef(0);

  const LIVE_INJECT = [
    { id:`l0`, type:"alert", icon:AlertTriangle, color:C.red,   member:"Tyler Rhodes", action:"Hasn't visited this week",           cta:"Message", ago:"just now", isNew:true },
    { id:`l1`, type:"win",   icon:Check,         color:C.green, member:"Sam Rivera",   action:"Visited for the first time in 7 days", cta:null,     ago:"just now", isNew:true },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      if (liveRef.current >= LIVE_INJECT.length) return;
      const ev = { ...LIVE_INJECT[liveRef.current], id:`live_${Date.now()}`, ago:"just now" };
      liveRef.current++;
      setFeed(p => [ev, ...p.slice(0, 12)]);
      setTimeout(() => setFeed(p => p.map(e => e.id === ev.id ? { ...e, isNew:false } : e)), 1500);
    }, 9000);
    return () => clearInterval(t);
  }, []);

  const dismiss  = (id) => setActions(p => p.filter(a => a.id !== id));
  const filtered = filter === "All" ? actions : actions.filter(a => a.tag === filter);
  const shown    = viewAll ? filtered : filtered.slice(0, 4);
  const urgentCount = actions.filter(a => a.urgency === "critical" || a.urgency === "high").length;

  return (
    <div style={{
      display:"flex", height:"100%",
      background:C.bg, color:C.t1,
      fontFamily:FONT, overflow:"hidden",
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.brd}; border-radius:2px; }
      `}</style>

      {/* ── Main content ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px 52px" }}>

          {/* Page header */}
          <div style={{
            display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", marginBottom:16,
          }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:8,
                  background:C.cyanDim, border:`1px solid ${C.cyanBrd}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <Shield size={13} color={C.cyan} />
                </div>
                <h1 style={{
                  fontSize:18, fontWeight:700, color:C.t1,
                  margin:0, letterSpacing:"-0.025em",
                }}>
                  Actions
                  <span style={{ color:C.t3, fontWeight:300, margin:"0 6px" }}>/</span>
                  <span style={{ color:C.cyan }}>Priority</span>
                </h1>
                {urgentCount > 0 && (
                  <span style={{
                    fontSize:9.5, fontWeight:700, color:C.red,
                    background:C.redDim, border:`1px solid ${C.redBrd}`,
                    padding:"2px 8px", borderRadius:20,
                    display:"flex", alignItems:"center", gap:5,
                    letterSpacing:"0.02em",
                  }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:C.red, display:"inline-block", boxShadow:`0 0 6px ${C.red}` }} />
                    {urgentCount} urgent
                  </span>
                )}
              </div>
              <div style={{ fontSize:12, color:C.t3, letterSpacing:"0.01em" }}>
                Boost member engagement and reduce churn with AI-suggested actions.
              </div>
            </div>

            <div style={{ display:"flex", gap:7, flexShrink:0 }}>
              <button
                onClick={() => setShowDone(v => !v)}
                style={{
                  display:"flex", alignItems:"center", gap:5,
                  padding:"7px 12px", borderRadius:7,
                  background:"rgba(255,255,255,0.02)",
                  border:`1px solid ${C.brd}`,
                  color:C.t2, fontSize:11.5, fontWeight:500,
                  cursor:"pointer", fontFamily:FONT,
                }}>
                <Check size={10} /> {showDone ? "Hide" : "Show"} completed
              </button>
              <button
                onClick={() => setViewAll(v => !v)}
                style={{
                  display:"flex", alignItems:"center", gap:5,
                  padding:"7px 14px", borderRadius:7,
                  background:C.cyanDim,
                  border:`1px solid ${C.cyanBrd}`,
                  color:C.cyan, fontSize:11.5, fontWeight:600,
                  cursor:"pointer", fontFamily:FONT,
                  boxShadow:`0 0 12px ${C.cyanGlow}`,
                }}>
                <Eye size={10} /> View All {actions.length}
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <KpiStrip />

          {/* ── Priority Actions panel ── */}
          <div style={{
            background:C.card, border:`1px solid ${C.brd}`,
            borderRadius:12, overflow:"hidden", marginBottom:10,
          }}>
            {/* Panel header */}
            <div style={{
              padding:"11px 16px",
              borderBottom:`1px solid ${C.brd}`,
              display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"rgba(255,255,255,0.01)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Shield size={12} color={C.t3} />
                <span style={{ fontSize:12.5, fontWeight:600, color:C.t1 }}>Priority Actions</span>
                <span style={{ fontSize:10, color:C.t3 }}>sorted by urgency</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:10, color:C.t3 }}>last 24 hours</span>
                {/* Filter pills */}
                <div style={{ display:"flex", gap:3 }}>
                  {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding:"3px 10px", borderRadius:20,
                      fontSize:10, fontWeight: filter === f ? 600 : 500,
                      cursor:"pointer", fontFamily:FONT,
                      background: filter === f ? C.cyanDim : "transparent",
                      border:`1px solid ${filter === f ? C.cyanBrd : C.brd}`,
                      color: filter === f ? C.cyan : C.t3,
                      transition:"all 0.15s",
                      letterSpacing:"0.01em",
                    }}>{f}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cards */}
            <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
              {shown.length === 0 ? (
                <div style={{ padding:"40px", textAlign:"center" }}>
                  <Check size={22} color={C.green} style={{ margin:"0 auto 10px", display:"block", opacity:0.7 }} />
                  <div style={{ fontSize:13, fontWeight:600, color:C.t2 }}>All caught up</div>
                  <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>No priority actions in this category.</div>
                </div>
              ) : (
                shown.map(a => (
                  <ActionCard key={a.id} action={a} onDismiss={dismiss} onAct={() => {}} />
                ))
              )}

              {!viewAll && filtered.length > 4 && (
                <button
                  onClick={() => setViewAll(true)}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                    padding:"8px", borderRadius:7,
                    background:"rgba(255,255,255,0.015)",
                    border:`1px solid ${C.brd}`,
                    color:C.t3, fontSize:11.5, fontWeight:500,
                    cursor:"pointer", fontFamily:FONT,
                  }}>
                  Show {filtered.length - 4} more actions <ChevronDown size={11} />
                </button>
              )}
            </div>
          </div>

          {/* ── Completed today ── */}
          {showDone && (
            <div style={{
              background:C.card, border:`1px solid ${C.brd}`,
              borderRadius:12, overflow:"hidden", marginBottom:10,
            }}>
              <div style={{
                padding:"11px 16px", borderBottom:`1px solid ${C.brd}`,
                display:"flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,0.01)",
              }}>
                <Check size={12} color={C.green} />
                <span style={{ fontSize:12.5, fontWeight:600, color:C.t1 }}>Completed Today</span>
                <span style={{ fontSize:10, color:C.t3 }}>{COMPLETED_TODAY.length} actions taken</span>
              </div>
              {COMPLETED_TODAY.map((c, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 16px",
                  borderBottom: i < COMPLETED_TODAY.length - 1 ? `1px solid ${C.brd}` : "none",
                }}>
                  <div style={{
                    width:17, height:17, borderRadius:"50%",
                    background:C.greenDim, border:`1px solid ${C.greenBrd}`,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>
                    <Check size={8} color={C.green} />
                  </div>
                  <span style={{ fontSize:12, color:C.t2, flex:1 }}>{c.label}</span>
                  <span style={{ fontSize:10, color:C.t3 }}>{c.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Action Feed ── */}
          <div style={{
            background:C.card, border:`1px solid ${C.brd}`,
            borderRadius:12, overflow:"hidden",
          }}>
            <div style={{
              padding:"11px 16px", borderBottom:`1px solid ${C.brd}`,
              display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"rgba(255,255,255,0.01)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{
                  width:6, height:6, borderRadius:"50%", background:C.green,
                  display:"inline-block", boxShadow:`0 0 6px ${C.green}`,
                }} />
                <span style={{ fontSize:12.5, fontWeight:600, color:C.t1 }}>Action Feed</span>
                <span style={{ fontSize:10, color:C.t3 }}>{feed.length} events</span>
              </div>
              <span style={{ fontSize:10, color:C.t3 }}>last 24 hours</span>
            </div>
            <div>
              {feed.map((item, i) => (
                <FeedRow key={item.id} item={item} i={i} total={feed.length} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Right sidebar ── */}
      <RightSidebar />
    </div>
  );
}
