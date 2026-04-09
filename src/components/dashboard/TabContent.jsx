import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, BarChart2, Zap, Settings,
  Gift, ExternalLink, Eye, LogOut, QrCode, ChevronDown, Bell,
  Search, Plus, Calendar, Flame, BookOpen, Clock, CheckCircle2,
  Facebook, Instagram, Sparkles, Send, MoreHorizontal, Heart,
  MessageCircle, TrendingUp, AlertTriangle, ChevronRight,
  Check, Image, AlignLeft, HelpCircle, Star, X, AlignJustify,
} from "lucide-react";

/* ── Design tokens ─────────────────────────────────────── */
const BG      = "#050810";
const SURFACE = "#0a0f1e";
const CARD    = "#0d1225";
const BORDER  = "rgba(255,255,255,0.045)";
const BORDER2 = "rgba(255,255,255,0.08)";
const TEXT    = "#eef2ff";
const MUTED   = "#8b95b3";
const DIM     = "#4b5578";
const DIMMER  = "#252d45";

/* ── Helpers ───────────────────────────────────────────── */
function Badge({ children, color = "blue" }) {
  const map = {
    blue:    { bg:"rgba(59,130,246,0.12)",  text:"#60a5fa", border:"rgba(59,130,246,0.22)" },
    green:   { bg:"rgba(16,185,129,0.12)",  text:"#34d399", border:"rgba(16,185,129,0.22)" },
    amber:   { bg:"rgba(245,158,11,0.12)",  text:"#fbbf24", border:"rgba(245,158,11,0.22)" },
    red:     { bg:"rgba(239,68,68,0.12)",   text:"#f87171", border:"rgba(239,68,68,0.22)"  },
    purple:  { bg:"rgba(139,92,246,0.12)",  text:"#c084fc", border:"rgba(139,92,246,0.22)" },
    neutral: { bg:CARD,                     text:MUTED,     border:BORDER                   },
  };
  const c = map[color] || map.neutral;
  return (
    <span style={{
      background:c.bg, color:c.text, border:`1px solid ${c.border}`,
      borderRadius:6, padding:"2px 8px", fontSize:10.5, fontWeight:700,
      display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

function Btn({ children, variant="primary", size="md", onClick, style={} }) {
  const base = {
    display:"inline-flex", alignItems:"center", gap:6,
    border:"none", cursor:"pointer", fontWeight:700,
    borderRadius:10, transition:"all 0.15s", whiteSpace:"nowrap",
    fontSize: size==="sm" ? 11.5 : 13,
    padding: size==="sm" ? "5px 12px" : "8px 16px",
  };
  const variants = {
    primary:   { background:"#3b82f6",                  color:"#fff",   border:"1px solid rgba(59,130,246,0.4)"   },
    secondary: { background:CARD,                        color:MUTED,    border:`1px solid ${BORDER2}`             },
    outline:   { background:"transparent",               color:MUTED,    border:`1px solid ${BORDER2}`             },
    ghost:     { background:"transparent",               color:MUTED,    border:"1px solid transparent"            },
    success:   { background:"rgba(16,185,129,0.12)",    color:"#34d399", border:"1px solid rgba(16,185,129,0.22)" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...(variants[variant]||variants.ghost), ...style }}>
      {children}
    </button>
  );
}

function Avatar({ name="", size=28 }) {
  const initials = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const hue = (name.charCodeAt(0)||72) % 360;
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.3,
      background:`hsl(${hue},38%,14%)`, border:`1.5px solid hsl(${hue},38%,26%)`,
      color:`hsl(${hue},60%,62%)`, fontSize:size*0.33, fontWeight:800,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0, letterSpacing:"0.02em",
    }}>{initials||"?"}</div>
  );
}

function PlatformIcon({ type }) {
  if (type==="instagram") return (
    <div style={{ width:20, height:20, borderRadius:5, background:"rgba(168,85,247,0.15)", border:"1px solid rgba(168,85,247,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Instagram size={10} color="#c084fc" />
    </div>
  );
  if (type==="facebook") return (
    <div style={{ width:20, height:20, borderRadius:5, background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Facebook size={10} color="#60a5fa" />
    </div>
  );
  return null;
}

function PlatformIcons({ platforms=[] }) {
  return <div style={{ display:"flex", gap:4 }}>{platforms.map((p,i)=><PlatformIcon key={i} type={p} />)}</div>;
}

function TypeChip({ type }) {
  const map = {
    post: { Icon:AlignLeft,   bg:"rgba(59,130,246,0.12)",  color:"#60a5fa"  },
    poll: { Icon:HelpCircle,  bg:"rgba(245,158,11,0.12)",  color:"#fbbf24"  },
    event:{ Icon:Calendar,    bg:"rgba(16,185,129,0.12)",  color:"#34d399"  },
  };
  const t = map[type] || map.post;
  return (
    <div style={{ width:26, height:26, borderRadius:7, background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <t.Icon size={12} color={t.color} />
    </div>
  );
}

function AIChip() {
  return (
    <div style={{ padding:"1px 6px", borderRadius:4, background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", fontSize:9.5, fontWeight:800, color:"#818cf8" }}>IA</div>
  );
}

/* ── Mock data ─────────────────────────────────────────── */
const DRAFTS = [
  { id:"d1", author:"Foundry Gym", title:"AI Draft: Motivation Monday",
    preview:"Ready to crush your goals? This week we're pushing limits — every rep, every set, every second counts. Share your journey.",
    platforms:["instagram","facebook"], aiGen:true, scheduledFor:"Apr 13, 9:00 AM" },
  { id:"d2", author:"Priya Sharma", title:"Draft: New Class Poll",
    preview:"What class should we add next? Your vote shapes our timetable — HIIT, Yoga, or Strength? Cast your vote below!",
    platforms:["instagram"], aiGen:false, scheduledFor:"Apr 13, 9:00 AM" },
];

const ALL_CONTENT = [
  { id:"c1", type:"post", author:"Foundry Gym",  title:"Motivation Monday AI",  platforms:["instagram","facebook"], aiGen:true,  date:"Apr 13, 9:00 AM" },
  { id:"c2", type:"poll", author:"Foundry Gym",  title:"Draft: New Class Poll",  platforms:["instagram"],           aiGen:false, date:"Apr 13, 9:00 AM" },
  { id:"c3", type:"post", author:"Foundry Gym",  title:"Motivation Monday AI",  platforms:["instagram","facebook"], aiGen:true,  date:"Apr 13, 9:00 AM" },
  { id:"c4", type:"post", author:"Priya Sharma", title:"Priya Sharma",           platforms:["instagram","facebook"], aiGen:true,  date:"Apr 13, 9:00 AM" },
];

const FEED_POST = { author:"Sarah", text:"Finally nailed that pose! @foundrygym #yogagoals", likes:18, comments:4 };

const QUICK_ACTIONS = [
  { label:"Generate AI Motivation Monday", Icon:Sparkles, color:"#818cf8" },
  { label:"Post Member Spotlight",          Icon:Star,     color:"#fbbf24" },
  { label:"Create Weekend Challenge Poll",  Icon:Flame,    color:"#f97316" },
];

const BAR_DATA = [
  { h:55, color:"#3b82f6" }, { h:82, color:"#3b82f6" }, { h:38, color:"#6366f1" },
  { h:65, color:"#6366f1" }, { h:28, color:"#8b5cf6" }, { h:22, color:"#8b5cf6" },
  { h:18, color:"#8b5cf6" },
];

const NAV = [
  { Icon:LayoutDashboard, label:"Overview"        },
  { Icon:Users,           label:"Members"         },
  { Icon:FileText,        label:"Content", active:true },
  { Icon:BarChart2,       label:"Analytics"       },
  { Icon:Zap,             label:"Automations"     },
  { Icon:Settings,        label:"Settings"        },
  { Icon:Gift,            label:"Loyalty Programs"},
];

const BOTTOM_LINKS = [
  { Icon:ExternalLink, label:"View Gym Page" },
  { Icon:Eye,          label:"Member View"   },
  { Icon:LogOut,       label:"Log Out", red:true },
];

const TABS = ["Feed","Calendar","Drafts","Scheduled","Library"];
const STEPS = [
  { label:"Step 1: Connect Facebook",       done:true  },
  { label:"Step 2: Schedule your first Poll", done:true  },
  { label:"Step 3: Review Insights",        done:false },
];

/* ══════════════════════════════════════════════════════════
   LEFT SIDEBAR
══════════════════════════════════════════════════════════ */
function Sidebar() {
  return (
    <div style={{ width:216, minHeight:"100vh", flexShrink:0, background:SURFACE, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column" }}>

      {/* Logo */}
      <div style={{ padding:"18px 16px 14px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Flame size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize:12.5, fontWeight:800, color:TEXT, lineHeight:1.2 }}>Foundry Gym</div>
            <div style={{ fontSize:9, fontWeight:700, color:DIM, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>Gym Owner</div>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding:"14px 16px 6px" }}>
        <span style={{ fontSize:9, fontWeight:700, color:DIMMER, letterSpacing:"0.1em", textTransform:"uppercase" }}>Navigation</span>
      </div>

      {/* Nav items */}
      <div style={{ flex:1, padding:"0 8px" }}>
        {NAV.map(item => (
          <div key={item.label} style={{
            display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:9, marginBottom:2, cursor:"pointer",
            background:item.active ? "rgba(59,130,246,0.12)" : "transparent",
            border: item.active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
          }}>
            <item.Icon size={13} color={item.active ? "#60a5fa" : DIM} />
            <span style={{ fontSize:12.5, fontWeight:item.active ? 700 : 500, color:item.active ? "#60a5fa" : MUTED }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ padding:"10px 8px 20px", borderTop:`1px solid ${BORDER}` }}>
        <div style={{ padding:"0 10px 6px" }}>
          <span style={{ fontSize:9, fontWeight:700, color:DIMMER, letterSpacing:"0.1em", textTransform:"uppercase" }}>Links</span>
        </div>
        {BOTTOM_LINKS.map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 10px", borderRadius:8, cursor:"pointer" }}>
            <l.Icon size={12} color={l.red ? "#f87171" : DIM} />
            <span style={{ fontSize:12, fontWeight:500, color:l.red ? "#f87171" : DIM }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TOP HEADER
══════════════════════════════════════════════════════════ */
function Header() {
  return (
    <div style={{ height:52, borderBottom:`1px solid ${BORDER}`, background:SURFACE, display:"flex", alignItems:"center", padding:"0 20px", gap:12, flexShrink:0 }}>
      <span style={{ fontSize:12.5, fontWeight:700, color:MUTED, whiteSpace:"nowrap" }}>Thurs 9 Apr</span>

      <div style={{ flex:1, maxWidth:240, position:"relative" }}>
        <Search size={12} color={DIM} style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
        <input placeholder="Search members..." style={{
          width:"100%", padding:"6px 10px 6px 28px", borderRadius:8,
          background:CARD, border:`1px solid ${BORDER}`, color:TEXT,
          fontSize:11.5, outline:"none", boxSizing:"border-box",
        }} />
      </div>

      <div style={{ flex:1 }} />

      <button style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:8, background:CARD, border:`1px solid ${BORDER2}`, color:MUTED, fontSize:11.5, fontWeight:600, cursor:"pointer" }}>
        <QrCode size={12} /> Scan QR <ChevronDown size={10} />
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:8, background:CARD, border:`1px solid ${BORDER}`, cursor:"pointer" }}>
        <Avatar name="Max" size={22} />
        <span style={{ fontSize:12, fontWeight:600, color:TEXT }}>Max</span>
        <ChevronDown size={10} color={DIM} />
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", cursor:"pointer" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444" }} />
        <span style={{ fontSize:11.5, fontWeight:700, color:"#f87171" }}>3 At Risk</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   JOURNEY CARD
══════════════════════════════════════════════════════════ */
function JourneyCard() {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"14px 18px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <Star size={12} color="#fbbf24" />
        <span style={{ fontSize:12, fontWeight:800, color:TEXT }}>Content Success Journey</span>
      </div>
      {/* Track */}
      <div style={{ height:4, background:BORDER, borderRadius:4, overflow:"hidden", marginBottom:10 }}>
        <div style={{ width:"66%", height:"100%", background:"linear-gradient(90deg,#3b82f6,#6366f1)", borderRadius:4 }} />
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {STEPS.map((s,i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:5, padding:"4px 10px",
            borderRadius:20, fontSize:10.5, fontWeight:600,
            background: s.done ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${s.done ? "rgba(16,185,129,0.25)" : BORDER}`,
            color: s.done ? "#34d399" : DIM,
          }}>
            {s.done
              ? <CheckCircle2 size={10} color="#34d399" />
              : <div style={{ width:10, height:10, borderRadius:"50%", border:`1.5px solid ${DIM}` }} />
            }
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ALERT BANNER
══════════════════════════════════════════════════════════ */
function AlertBanner() {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div style={{
      background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:10,
      padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10,
    }}>
      <AlertTriangle size={13} color="#f87171" style={{ flexShrink:0 }} />
      <span style={{ fontSize:12, fontWeight:700, color:"#f87171" }}>Attention Required:</span>
      <span style={{ fontSize:12, color:MUTED, flex:1 }}>Critical Churn Interventions — 3 members need immediate outreach.</span>
      <button onClick={()=>setShow(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
        <X size={12} color={DIM} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DRAFT CARD
══════════════════════════════════════════════════════════ */
function DraftCard({ draft }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"12px 14px 10px", display:"flex", alignItems:"center", gap:8 }}>
        <Avatar name={draft.author} size={28} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{draft.title}</div>
          <div style={{ fontSize:10, color:DIM, marginTop:2 }}>Draft · {draft.scheduledFor}</div>
        </div>
        {draft.aiGen && <AIChip />}
      </div>

      <div style={{ padding:"0 14px 10px", fontSize:11.5, color:MUTED, lineHeight:1.55 }}>
        {draft.preview.slice(0,95)}…
      </div>

      <div style={{ padding:"10px 14px", borderTop:`1px solid ${BORDER}`, display:"flex", alignItems:"center", gap:8, marginTop:"auto" }}>
        <PlatformIcons platforms={draft.platforms} />
        <div style={{ flex:1 }} />
        <Btn variant="primary" size="sm" style={{ fontSize:11 }}>Review &amp; Schedule Now</Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONTENT TABLE
══════════════════════════════════════════════════════════ */
function ContentTable() {
  const [checked, setChecked] = useState(new Set());
  const toggle = id => setChecked(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });

  const COLS = "28px 2fr 80px 90px 130px 90px 120px";

  const colHeader = (label) => (
    <div style={{ fontSize:9, fontWeight:700, color:DIMMER, letterSpacing:"0.09em", textTransform:"uppercase", display:"flex", alignItems:"center" }}>
      {label}
    </div>
  );

  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"grid", gridTemplateColumns:COLS, gap:8, padding:"8px 14px", borderBottom:`1px solid ${BORDER}`, background:SURFACE }}>
        <div />
        {colHeader("TYPE")}
        {colHeader("CHANNEL")}
        {colHeader("STATUS")}
        {colHeader("PUBLISH DATE")}
        {colHeader("ENGAGEMENT %")}
        {colHeader("RECOMMENDED ACTION")}
      </div>

      {ALL_CONTENT.map((row, idx) => (
        <div key={row.id} style={{
          display:"grid", gridTemplateColumns:COLS, gap:8, padding:"10px 14px", alignItems:"center",
          borderBottom: idx < ALL_CONTENT.length-1 ? `1px solid ${BORDER}` : "none",
          background: checked.has(row.id) ? "rgba(59,130,246,0.04)" : "transparent",
          cursor:"pointer",
        }} onClick={()=>toggle(row.id)}>

          {/* Checkbox */}
          <div onClick={e=>{e.stopPropagation();toggle(row.id);}} style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{
              width:13, height:13, borderRadius:4,
              background: checked.has(row.id) ? "#3b82f6" : "transparent",
              border:`1.5px solid ${checked.has(row.id) ? "#3b82f6" : BORDER2}`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {checked.has(row.id) && <Check size={8} color="#fff" />}
            </div>
          </div>

          {/* Type */}
          <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
            <TypeChip type={row.type} />
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:11.5, fontWeight:600, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.title}</div>
              <div style={{ fontSize:10, color:DIM }}>{row.author}</div>
            </div>
            {row.aiGen && <AIChip />}
          </div>

          {/* Channel */}
          <div><PlatformIcons platforms={row.platforms} /></div>

          {/* Status */}
          <div>
            <Badge color="green">
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#34d399" }} />
              Scheduled
            </Badge>
          </div>

          {/* Date */}
          <div style={{ fontSize:11.5, color:MUTED }}>{row.date}</div>

          {/* Engagement */}
          <div>
            <div style={{ fontSize:11, color:DIM, marginBottom:4 }}>N/A</div>
            <div style={{ height:3, background:BORDER, borderRadius:2, width:52 }} />
          </div>

          {/* Action */}
          <div onClick={e=>e.stopPropagation()}>
            <button style={{
              display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
              borderRadius:7, fontSize:11, fontWeight:600,
              background:SURFACE, border:`1px solid ${BORDER2}`, color:MUTED, cursor:"pointer",
            }}>
              Review, Edit <ChevronDown size={9} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RIGHT SIDEBAR
══════════════════════════════════════════════════════════ */
function RightSidebar() {
  return (
    <div style={{
      width:272, flexShrink:0, borderLeft:`1px solid ${BORDER}`,
      background:SURFACE, display:"flex", flexDirection:"column",
      padding:"18px 14px", gap:14, overflowY:"auto",
    }}>

      {/* Quick Actions */}
      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"14px" }}>
        <div style={{ fontSize:12, fontWeight:800, color:TEXT, marginBottom:2 }}>What to Post Today?</div>
        <div style={{ fontSize:10.5, color:DIM, marginBottom:12 }}>Guided Ideas</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {QUICK_ACTIONS.map((a,i) => (
            <button key={i} style={{
              display:"flex", alignItems:"center", gap:9, padding:"9px 12px",
              borderRadius:10, background:SURFACE, border:`1px solid ${BORDER2}`,
              color:MUTED, fontSize:11, fontWeight:600, cursor:"pointer", textAlign:"left",
            }}>
              <div style={{ width:26, height:26, borderRadius:7, flexShrink:0, background:`${a.color}1a`, border:`1px solid ${a.color}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <a.Icon size={12} color={a.color} />
              </div>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"14px" }}>
        <div style={{ fontSize:12, fontWeight:800, color:TEXT, marginBottom:12 }}>Actionable Insights</div>

        {/* Bar chart */}
        <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:90, marginBottom:6 }}>
          {/* Y labels */}
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"space-between", height:"100%", marginRight:2 }}>
            {["12k","8k","4k","0"].map(l => <div key={l} style={{ fontSize:8.5, color:DIMMER, lineHeight:1 }}>{l}</div>)}
          </div>
          {/* Bars */}
          {BAR_DATA.map((b,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", height:"100%" }}>
              <div style={{ width:"100%", height:`${b.h}%`, background:b.color, borderRadius:"3px 3px 0 0", opacity:0.85 }} />
            </div>
          ))}
        </div>

        <div style={{ fontSize:11, color:MUTED, lineHeight:1.55, marginBottom:8 }}>
          Polls have <span style={{ color:TEXT, fontWeight:700 }}>2x more engagement</span> than text. Ask a question about new class ideas.
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
          <TrendingUp size={11} color="#60a5fa" />
          <span style={{ fontSize:11, color:"#60a5fa", fontWeight:600 }}>Review Detailed Insights</span>
          <ChevronRight size={10} color="#60a5fa" />
        </div>
      </div>

      {/* Feed Preview */}
      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"10px 14px", borderBottom:`1px solid ${BORDER}` }}>
          <span style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.08em", textTransform:"uppercase" }}>Content Feed Preview</span>
        </div>
        <div style={{ padding:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <Avatar name={FEED_POST.author} size={26} />
            <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{FEED_POST.author}</span>
          </div>
          <div style={{ fontSize:11.5, color:MUTED, lineHeight:1.55, marginBottom:10 }}>
            {FEED_POST.text.split(" ").map((word,i) =>
              word.startsWith("@")||word.startsWith("#")
                ? <span key={i} style={{ color:"#60a5fa" }}>{word} </span>
                : <span key={i}>{word} </span>
            )}
          </div>

          {/* Image placeholder */}
          <div style={{
            width:"100%", height:90, borderRadius:9, marginBottom:10,
            background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.07))",
            border:`1px solid ${BORDER}`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Image size={20} color={DIM} />
          </div>

          <div style={{ display:"flex", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, color:MUTED }}>
              <Heart size={12} color="#f87171" /> {FEED_POST.likes}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, color:MUTED }}>
              <MessageCircle size={12} color="#60a5fa" /> {FEED_POST.comments}
            </div>
          </div>
        </div>

        <div style={{ padding:"10px 14px", borderTop:`1px solid ${BORDER}` }}>
          <Btn variant="primary" size="sm" style={{ width:"100%", justifyContent:"center" }}>
            <Plus size={12} /> Add Member
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN CONTENT AREA
══════════════════════════════════════════════════════════ */
function MainContent() {
  const [activeTab, setActiveTab] = useState("Drafts");

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
      <Header />

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Center column */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 22px 40px", minWidth:0 }}>

          {/* Page header */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:TEXT, letterSpacing:"-0.025em", display:"flex", alignItems:"center", gap:8 }}>
                Content Center
                <span style={{ color:DIM, fontWeight:400, fontSize:16 }}>/</span>
                <span style={{ color:"#60a5fa" }}>Hub</span>
              </div>
              <div style={{ fontSize:11, color:DIM, marginTop:3 }}>AI-powered content · create, schedule &amp; track performance</div>
            </div>
            <Btn variant="primary">
              <Plus size={13} /> Create New <ChevronDown size={11} />
            </Btn>
          </div>

          <AlertBanner />
          <JourneyCard />

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${BORDER}`, marginBottom:16 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{
                padding:"8px 16px", fontSize:12.5, fontWeight: activeTab===tab ? 700 : 500,
                color: activeTab===tab ? TEXT : DIM,
                background:"transparent", border:"none",
                borderBottom:`2px solid ${activeTab===tab ? "#3b82f6" : "transparent"}`,
                cursor:"pointer", marginBottom:-1, transition:"all 0.15s",
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Drafts view */}
          {activeTab==="Drafts" && (
            <>
              <div style={{ fontSize:12, fontWeight:700, color:MUTED, marginBottom:10 }}>Draft Content</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {DRAFTS.map(d => <DraftCard key={d.id} draft={d} />)}
              </div>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:MUTED }}>All Content (Drafts &amp; Scheduled)</div>
              </div>
              <ContentTable />
            </>
          )}

          {/* Feed empty state */}
          {activeTab==="Feed" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 0", gap:12 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:"rgba(59,130,246,0.08)", border:`1px solid rgba(59,130,246,0.2)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Flame size={22} color="#60a5fa" />
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:MUTED }}>Your feed is empty</div>
              <div style={{ fontSize:12, color:DIM }}>Create your first post to start engaging members</div>
              <Btn variant="primary"><Plus size={13} /> Create Post</Btn>
            </div>
          )}

          {/* Other tabs empty state */}
          {!["Drafts","Feed"].includes(activeTab) && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 0", gap:12 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:"rgba(255,255,255,0.03)", border:`1px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <BookOpen size={22} color={DIM} />
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:MUTED }}>Nothing in {activeTab} yet</div>
              <div style={{ fontSize:12, color:DIM }}>Content you add will appear here</div>
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function ContentPage() {
  return (
    <div style={{
      display:"flex", minHeight:"100vh", background:BG, color:TEXT,
      fontFamily:"'DM Sans','Figtree','Sora',system-ui,sans-serif",
      fontSize:13, lineHeight:1.5,
    }}>
      <Sidebar />
      <MainContent />
    </div>
  );
}
