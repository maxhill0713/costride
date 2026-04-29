import { useState, useMemo, useRef, useEffect } from "react";
import {
  X, Search, Plus, Users, Clock, Check, Dumbbell,
  Trash2, Copy, UserPlus, ChevronDown, MoreHorizontal,
  XCircle, TrendingUp, TrendingDown, MessageCircle,
  Zap, BarChart3, RefreshCw, Settings2,
  ChevronRight, Save, Calendar, ArrowRight,
} from "lucide-react";

/* ─── DESIGN TOKENS — identical to ContentPage ─────────────── */
const C = {
  bg:       "#000000",
  sidebar:  "#0f0f12",
  card:     "#141416",
  card2:    "#1a1a1f",
  card3:    "#1e1e24",
  brd:      "#222226",
  brd2:     "#2a2a30",
  t1:       "#ffffff",
  t2:       "#8a8a94",
  t3:       "#444450",
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  cyanM:    "rgba(77,127,255,0.18)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.12)",
  redBrd:   "rgba(255,77,109,0.28)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
  greenBrd: "rgba(34,197,94,0.28)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.12)",
  amberBrd: "rgba(245,158,11,0.28)",
  violet:   "#a855f7",
  violetDim:"rgba(168,85,247,0.12)",
  violetBrd:"rgba(168,85,247,0.28)",
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const CLASS_TYPES = ["HIIT","Yoga","Pilates","Strength","Cardio","Boxing","Spin","CrossFit","Mobility","Open Gym","Other"];

/* ─── GLOBAL STYLES ─────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("cmm3-css")) {
  const s = document.createElement("style");
  s.id = "cmm3-css";
  s.textContent = `
    @keyframes cmm3FadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    @keyframes cmm3SlideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
    .cmm3-panel { animation: cmm3SlideIn .22s cubic-bezier(.16,1,.3,1) both; }
    .cmm3-card  { transition: border-color .15s, box-shadow .15s; cursor:pointer; }
    .cmm3-card:hover { border-color: rgba(77,127,255,0.28) !important; box-shadow: 0 0 8px rgba(77,127,255,0.07) !important; }
    .cmm3-btn   { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; transition:all .16s; display:inline-flex; align-items:center; gap:6px; }
    .cmm3-btn:hover  { transform:translateY(-1px); }
    .cmm3-btn:active { transform:scale(.97); opacity:.85; }
    .cmm3-scr::-webkit-scrollbar { width:3px; }
    .cmm3-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    .cmm3-stat:hover { background: rgba(77,127,255,0.06) !important; }
    .cmm3-attendee:hover { background: rgba(77,127,255,0.04) !important; }
  `;
  document.head.appendChild(s);
}

/* ─── HELPERS ───────────────────────────────────────────────── */
function classColor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("hiit")||n.includes("boxing")||n.includes("kick")) return C.amber;
  if (n.includes("yoga")||n.includes("pilates")||n.includes("flow")) return "#14b8a6";
  if (n.includes("strength")||n.includes("weight")||n.includes("cond")) return C.red;
  if (n.includes("spin")||n.includes("cycle")||n.includes("cardio")) return "#6366f1";
  return C.cyan;
}

function fmtTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2,"0")} ${p}`;
}

function ini(name = "") {
  return (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
}

function capacityStatus(booked, max) {
  if (!max) return { label:"No Limit", color:C.t3, bg:"rgba(255,255,255,0.04)", brd:C.brd, pct:0 };
  const pct = booked / max;
  if (pct >= 1)   return { label:"Full",  color:C.red,   bg:C.redDim,   brd:C.redBrd,   pct:100 };
  if (pct >= 0.8) return { label:"Open",  color:C.amber, bg:C.amberDim, brd:C.amberBrd, pct:Math.round(pct*100) };
  if (booked > 0) return { label:"Open",  color:C.green, bg:C.greenDim, brd:C.greenBrd, pct:Math.round(pct*100) };
  return              { label:"Empty", color:C.cyan,  bg:C.cyanDim,  brd:C.cyanBrd,  pct:0 };
}

const BK_STATUS = {
  booked:    { label:"Booked",    color:C.cyan,  bg:C.cyanDim,  brd:C.cyanBrd  },
  attended:  { label:"Attended",  color:C.green, bg:C.greenDim, brd:C.greenBrd },
  no_show:   { label:"No-show",   color:C.red,   bg:C.redDim,   brd:C.redBrd   },
  waitlist:  { label:"Waitlist",  color:C.amber, bg:C.amberDim, brd:C.amberBrd },
  cancelled: { label:"Cancelled", color:C.t3,    bg:"rgba(255,255,255,0.04)", brd:C.brd },
};

function SortDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find(o => o.value === value) || options[0];
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button onClick={() => setOpen(o=>!o)} className="cmm3-btn"
        style={{ padding:"5px 11px", background:"rgba(255,255,255,0.04)", border:`1px solid ${open ? C.cyanBrd : C.brd}`, borderRadius:7, color:open ? C.t1 : C.t2, fontSize:12, fontWeight:600 }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.cyanBrd; e.currentTarget.style.color=C.t1; }}
        onMouseLeave={e=>{ if(!open){e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.color=C.t2;} }}>
        {current.label}
        <ChevronDown style={{ width:11, height:11, transition:"transform .2s", transform:open?"rotate(180deg)":"none" }} />
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 5px)", right:0, zIndex:300, background:C.card2, border:`1px solid ${C.brd}`, borderRadius:9, overflow:"hidden", minWidth:148, boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }} className="cmm3-btn"
              style={{ width:"100%", justifyContent:"flex-start", padding:"9px 13px", background:opt.value===value?C.cyanDim:"transparent", border:"none", color:opt.value===value?C.cyan:C.t2, fontSize:12, fontWeight:opt.value===value?700:500 }}
              onMouseEnter={e=>{ if(opt.value!==value){e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color=C.t1;} }}
              onMouseLeave={e=>{ if(opt.value!==value){e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.t2;} }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── KPI STRIP (5-col, same pattern as ContentPage sidebar stats) ─ */
function KpiStrip({ classes, bookings }) {
  const total     = classes.length;
  const allBooked = bookings.length;
  const attended  = bookings.filter(b=>b.status==="attended").length;
  const noShows   = bookings.filter(b=>b.status==="no_show").length;
  const fullCls   = classes.filter(c=>{ const b=(c.attendee_ids||[]).length,m=c.max_capacity||0; return m>0&&b>=m; }).length;
  const fillRates = classes.map(c=>{ const m=c.max_capacity||0,b=(c.attendee_ids||[]).length; return m>0?b/m:null; }).filter(v=>v!==null);
  const avgFill   = fillRates.length ? Math.round(fillRates.reduce((s,v)=>s+v,0)/fillRates.length*100) : 0;
  const noShowR   = allBooked > 0 ? Math.round(noShows/allBooked*100) : 0;

  const kpis = [
    { label:"Total Classes",   val:total,       sub:`${fullCls} at capacity`, color:C.t1,   accent:C.cyan  },
    { label:"Total Bookings",  val:allBooked,   sub:"all time",               color:C.cyan,  accent:C.cyan  },
    { label:"Attended",        val:attended,    sub:`of ${allBooked} booked`, color:C.green, accent:C.green },
    { label:"Avg Fill Rate",   val:`${avgFill}%`, sub:avgFill>=80?"Excellent":avgFill>=50?"Moderate":"Low", color:avgFill>=80?C.green:avgFill>=50?C.amber:C.red, accent:avgFill>=80?C.green:avgFill>=50?C.amber:C.red },
    { label:"No-show Rate",    val:`${noShowR}%`, sub:noShowR>=30?"Needs attention":noShowR>=15?"Monitor":"On target", color:noShowR>=30?C.red:noShowR>=15?C.amber:C.green, accent:noShowR>=30?C.red:noShowR>=15?C.amber:C.green },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"1px", background:C.brd, borderBottom:`1px solid ${C.brd}`, flexShrink:0 }}>
      {kpis.map((k,i) => (
        <div key={i} className="cmm3-stat" style={{ padding:"14px 18px", background:C.sidebar, cursor:"default", transition:"background .15s", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-18, right:-18, width:56, height:56, borderRadius:"50%", background:k.accent, opacity:0.07, pointerEvents:"none" }} />
          <div style={{ fontSize:9.5, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:8 }}>{k.label}</div>
          <div style={{ fontSize:28, fontWeight:800, color:k.color, lineHeight:1, letterSpacing:"-0.03em", marginBottom:5 }}>{k.val}</div>
          <div style={{ fontSize:10.5, color:C.t3, fontWeight:500 }}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── CLASS CARD (2-col grid, mirrors ContentPage post cards) ── */
function ClassCard({ cls, isSelected, onSelect, onDuplicate, onDelete, bookings }) {
  const color   = classColor(cls.name || "");
  const booked  = (cls.attendee_ids||[]).length;
  const max     = cls.max_capacity || 0;
  const status  = capacityStatus(booked, max);
  const fillPct = max > 0 ? Math.min(Math.round(booked/max*100),100) : 0;
  const [menuOpen, setMenuOpen] = useState(false);

  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return fmtTime(cls.time||"");
    const days = cls.schedule.map(x=>x.day).filter(Boolean).slice(0,2).join(", ");
    return `${days}${days?" · ":""}${fmtTime(s.time||cls.time||"")}`.trim();
  })();

  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
  const coachBg = palette[((cls.instructor||"").charCodeAt(0)||0) % palette.length];

  return (
    <div className="cmm3-card" onClick={() => onSelect(cls)}
      style={{ background:C.card, border:`1px solid ${isSelected ? C.cyanBrd : C.brd}`, borderRadius:12, height:138, display:"flex", overflow:"hidden", position:"relative",
               boxShadow: isSelected ? "0 0 0 1px rgba(77,127,255,0.18), 0 0 12px rgba(77,127,255,0.08)" : "none" }}>

      {/* Left color accent bar */}
      <div style={{ width:3, flexShrink:0, background:isSelected ? C.cyan : color, opacity:isSelected?1:0.7 }} />

      {/* Main content */}
      <div style={{ flex:1, minWidth:0, padding:"11px 10px 11px 12px", display:"flex", flexDirection:"column", gap:7 }}>

        {/* Top row: icon + name + type badge */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:`${color}18`, border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Dumbbell style={{ width:13, height:13, color }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:isSelected?C.cyan:C.t1, lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", transition:"color .15s" }}>{cls.name||"Unnamed"}</div>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
              {cls.class_type && (
                <span style={{ fontSize:9.5, fontWeight:700, padding:"1px 6px", borderRadius:4, background:`${color}18`, border:`1px solid ${color}28`, color, flexShrink:0 }}>{cls.class_type}</span>
              )}
              <span style={{ fontSize:9.5, fontWeight:700, padding:"1px 6px", borderRadius:4, background:status.bg, border:`1px solid ${status.brd}`, color:status.color, flexShrink:0 }}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Schedule + coach row */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <Clock style={{ width:10, height:10, color:C.t3, flexShrink:0 }} />
            <span style={{ fontSize:11, color:C.t2, fontWeight:500, whiteSpace:"nowrap" }}>{schedLabel||"—"}</span>
          </div>
          {(cls.instructor||cls.coach_name) && (
            <div style={{ display:"flex", alignItems:"center", gap:5, minWidth:0 }}>
              <div style={{ width:16, height:16, borderRadius:"50%", background:coachBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7.5, fontWeight:800, color:"#fff", flexShrink:0 }}>
                {ini(cls.instructor||cls.coach_name||"")}
              </div>
              <span style={{ fontSize:11, color:C.t2, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cls.instructor||cls.coach_name}</span>
            </div>
          )}
        </div>

        {/* Capacity bar */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:11, color:C.t3, fontWeight:500 }}>
              <span style={{ color:status.color, fontWeight:700 }}>{booked}</span>
              {max>0 && <span> / {max} booked</span>}
              {!max && <span> booked</span>}
            </span>
            {max>0 && <span style={{ fontSize:10, color:C.t3 }}>{fillPct}%</span>}
          </div>
          {max > 0 && (
            <div style={{ height:3, background:C.brd2, borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${fillPct}%`, height:"100%", background:status.color, borderRadius:4, transition:"width .5s ease", boxShadow:`0 0 5px ${status.color}50` }} />
            </div>
          )}
        </div>
      </div>

      {/* Quick actions panel — identical layout to ContentPage cards */}
      <div onClick={e=>e.stopPropagation()} style={{ width:110, flexShrink:0, borderLeft:`1px solid ${C.brd}`, padding:"10px 8px", display:"flex", flexDirection:"column", gap:7, justifyContent:"flex-start" }}>
        <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.10em", color:C.t3, marginBottom:2 }}>Quick Actions</div>

        <button className="cmm3-btn" onClick={() => onSelect(cls)}
          style={{ width:"100%", justifyContent:"flex-start", padding:"4px 8px", borderRadius:7, background:isSelected?C.cyanDim:"rgba(255,255,255,0.03)", border:`1px solid ${isSelected?C.cyanBrd:C.brd}`, color:isSelected?C.cyan:C.t2, fontSize:10.5, fontWeight:600 }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.cyanBrd; e.currentTarget.style.color=C.t1; e.currentTarget.style.background=C.cyanDim; }}
          onMouseLeave={e=>{ if(!isSelected){e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.color=C.t2; e.currentTarget.style.background="rgba(255,255,255,0.03)";} }}>
          <Users style={{ width:10, height:10, flexShrink:0 }} /><span>Manage</span>
        </button>

        <button className="cmm3-btn" onClick={() => onDuplicate(cls)}
          style={{ width:"100%", justifyContent:"flex-start", padding:"4px 8px", borderRadius:7, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`, color:C.t2, fontSize:10.5, fontWeight:600 }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.cyanBrd; e.currentTarget.style.color=C.t1; e.currentTarget.style.background=C.cyanDim; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.color=C.t2; e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}>
          <Copy style={{ width:10, height:10, flexShrink:0 }} /><span>Duplicate</span>
        </button>

        <button className="cmm3-btn" onClick={() => onDelete(cls.id)}
          style={{ width:"100%", justifyContent:"flex-start", padding:"4px 8px", borderRadius:7, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`, color:C.t2, fontSize:10.5, fontWeight:600 }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.redBrd; e.currentTarget.style.color=C.red; e.currentTarget.style.background=C.redDim; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.color=C.t2; e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}>
          <Trash2 style={{ width:10, height:10, flexShrink:0 }} /><span>Delete</span>
        </button>
      </div>
    </div>
  );
}

/* ─── ATTENDEE ROW ──────────────────────────────────────────── */
function AttendeeRow({ attendee, onStatusChange, onRemove }) {
  const st   = BK_STATUS[attendee.status] || BK_STATUS.booked;
  const [busy, setBusy] = useState(false);
  async function mark(s) { setBusy(true); await onStatusChange(attendee.id, s); setBusy(false); }
  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
  const bg = palette[(attendee.name?.charCodeAt(0)||0)%palette.length];
  return (
    <div className="cmm3-attendee" style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 14px", borderBottom:`1px solid ${C.brd}`, fontFamily:FONT, transition:"background .12s" }}>
      <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:800, color:"#fff" }}>
        {ini(attendee.name)}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{attendee.name||"Member"}</div>
        {attendee.email && <div style={{ fontSize:10, color:C.t3, marginTop:1 }}>{attendee.email}</div>}
      </div>
      <span style={{ padding:"2px 7px", borderRadius:20, fontSize:9.5, fontWeight:700, background:st.bg, border:`1px solid ${st.brd}`, color:st.color, flexShrink:0, whiteSpace:"nowrap" }}>{st.label}</span>
      <div style={{ display:"flex", gap:3, flexShrink:0 }}>
        {attendee.status !== "attended" && (
          <button className="cmm3-btn" onClick={()=>mark("attended")} disabled={busy} title="Mark Attended"
            style={{ width:24, height:24, borderRadius:6, background:C.greenDim, border:`1px solid ${C.greenBrd}`, color:C.green, justifyContent:"center" }}>
            <Check style={{ width:9, height:9 }} />
          </button>
        )}
        {attendee.status !== "no_show" && (
          <button className="cmm3-btn" onClick={()=>mark("no_show")} disabled={busy} title="No-show"
            style={{ width:24, height:24, borderRadius:6, background:C.redDim, border:`1px solid ${C.redBrd}`, color:C.red, justifyContent:"center" }}>
            <XCircle style={{ width:9, height:9 }} />
          </button>
        )}
        <button className="cmm3-btn" onClick={()=>onRemove(attendee.id)} title="Remove"
          style={{ width:24, height:24, borderRadius:6, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`, color:C.t3, justifyContent:"center" }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.redBrd; e.currentTarget.style.color=C.red; e.currentTarget.style.background=C.redDim; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.color=C.t3; e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}>
          <X style={{ width:9, height:9 }} />
        </button>
      </div>
    </div>
  );
}

/* ─── CLASS CONTROL CENTRE (right panel = ContentPage RightSidebar) */
function ClassControlCenter({ cls, bookings, allMemberships, onClose, onUpdateClass, onDeleteClass, onEditClass }) {
  const color   = classColor(cls.name||"");
  const booked  = (cls.attendee_ids||[]).length;
  const max     = cls.max_capacity || 0;
  const status  = capacityStatus(booked, max);
  const fillPct = max > 0 ? Math.min(Math.round(booked/max*100),100) : 0;
  const isFull  = max > 0 && booked >= max;

  const [attendees, setAttendees] = useState(() => {
    const ids = cls.attendee_ids || [];
    return ids.map((id,i) => {
      const bk = bookings.find(b=>b.client_id===id||b.user_id===id);
      const mb = allMemberships.find(m=>m.user_id===id);
      return { id, name:bk?.client_name||mb?.user_name||`Member ${i+1}`, email:bk?.client_email||mb?.user_email||"", status:bk?.status||"booked" };
    });
  });

  const [addSearch, setAddSearch] = useState("");
  const [showAdd,   setShowAdd]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  const attended    = attendees.filter(a=>a.status==="attended").length;
  const noShows     = attendees.filter(a=>a.status==="no_show").length;
  const stillBooked = attendees.filter(a=>a.status==="booked").length;

  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return fmtTime(cls.time||"");
    const days = cls.schedule.map(x=>x.day).filter(Boolean).join(", ");
    return `${days}${days?" · ":""}${fmtTime(s.time||cls.time||"")}`.trim();
  })();

  async function handleStatusChange(id, newStatus) {
    setAttendees(prev => prev.map(a=>a.id===id?{...a,status:newStatus}:a));
  }

  async function handleRemove(id) {
    const updated = (cls.attendee_ids||[]).filter(x=>x!==id);
    setSaving(true);
    await onUpdateClass(cls.id, { attendee_ids:updated });
    setAttendees(prev=>prev.filter(a=>a.id!==id));
    setSaving(false);
  }

  async function handleAdd(member) {
    if (isFull) return;
    const id = member.user_id||member.id;
    if ((cls.attendee_ids||[]).includes(id)) return;
    const updated = [...(cls.attendee_ids||[]), id];
    setSaving(true);
    await onUpdateClass(cls.id, { attendee_ids:updated });
    setAttendees(prev=>[...prev,{ id, name:member.user_name||member.name||"Member", email:member.user_email||"", status:"booked" }]);
    setShowAdd(false); setAddSearch(""); setSaving(false);
  }

  const filteredMembers = (allMemberships||[]).filter(m => {
    const name = (m.user_name||"").toLowerCase();
    const q    = addSearch.toLowerCase();
    return (!q||name.includes(q)) && !(cls.attendee_ids||[]).includes(m.user_id);
  }).slice(0,8);

  const quickStats = [
    { label:"Booked",   val:stillBooked, color:C.cyan,  bg:C.cyanDim,  brd:C.cyanBrd  },
    { label:"Attended", val:attended,    color:C.green, bg:C.greenDim, brd:C.greenBrd },
    { label:"No-shows", val:noShows,     color:noShows>0?C.red:C.t3, bg:noShows>0?C.redDim:"rgba(255,255,255,0.03)", brd:noShows>0?C.redBrd:C.brd },
  ];

  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];

  return (
    <div className="cmm3-panel" style={{ width:320, flexShrink:0, background:C.sidebar, borderLeft:`1px solid ${C.brd}`, display:"flex", flexDirection:"column", height:"100%", fontFamily:FONT }}>

      {/* Header */}
      <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${C.brd}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:11 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:`${color}18`, border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Dumbbell style={{ width:12, height:12, color }} />
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.02em" }}>{cls.name}</div>
            </div>
            {schedLabel && (
              <div style={{ display:"flex", alignItems:"center", gap:4, paddingLeft:38 }}>
                <Clock style={{ width:9, height:9, color:C.t3 }} />
                <span style={{ fontSize:11, color:C.t2 }}>{schedLabel}</span>
              </div>
            )}
            {(cls.instructor||cls.coach_name) && (
              <div style={{ display:"flex", alignItems:"center", gap:4, paddingLeft:38, marginTop:3 }}>
                <Users style={{ width:9, height:9, color:C.t3 }} />
                <span style={{ fontSize:11, color:C.t2 }}>{cls.instructor||cls.coach_name}</span>
              </div>
            )}
          </div>
          <button className="cmm3-btn" onClick={onClose}
            style={{ width:26, height:26, borderRadius:7, background:"transparent", border:`1px solid ${C.brd}`, color:C.t3, justifyContent:"center", flexShrink:0, marginLeft:8 }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.brd2; e.currentTarget.style.color=C.t2; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.color=C.t3; }}>
            <X style={{ width:11, height:11 }} />
          </button>
        </div>

        {/* Capacity block */}
        <div style={{ padding:"10px 12px", borderRadius:9, background:C.card, border:`1px solid ${C.brd}`, marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ fontSize:9.5, color:C.t3, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Capacity</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12, fontWeight:800, color:status.color }}>{booked}</span>
              {max>0 && <span style={{ fontSize:10.5, color:C.t3 }}>/ {max}</span>}
              <span style={{ padding:"1px 7px", borderRadius:20, fontSize:9.5, fontWeight:700, background:status.bg, border:`1px solid ${status.brd}`, color:status.color }}>{status.label}</span>
            </div>
          </div>
          {max > 0 && (
            <div style={{ height:5, background:C.brd2, borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${fillPct}%`, height:"100%", background:status.color, borderRadius:4, transition:"width .5s ease", boxShadow:`0 0 7px ${status.color}50` }} />
            </div>
          )}
        </div>

        {/* Quick stats 3-col */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {quickStats.map((s,i) => (
            <div key={i} style={{ padding:"7px 9px", borderRadius:8, background:s.bg, border:`1px solid ${s.brd}`, textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:9, color:C.t3, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:3, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendees header */}
      <div style={{ padding:"9px 14px 8px", borderBottom:`1px solid ${C.brd}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <span style={{ fontSize:10.5, fontWeight:800, color:C.t1, textTransform:"uppercase", letterSpacing:"0.07em" }}>
          Attendees
          <span style={{ marginLeft:6, padding:"1px 6px", borderRadius:20, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, color:C.cyan, fontSize:9.5, fontWeight:700 }}>{attendees.length}</span>
        </span>
        <button className="cmm3-btn" onClick={()=>setShowAdd(o=>!o)} disabled={isFull}
          style={{ padding:"4px 10px", borderRadius:7, background:showAdd?C.cyanDim:isFull?"rgba(255,255,255,0.03)":C.cyanDim, border:`1px solid ${showAdd?C.cyan:isFull?C.brd:C.cyanBrd}`, color:isFull?C.t3:C.cyan, fontSize:10.5, fontWeight:700, cursor:isFull?"not-allowed":"pointer" }}>
          <UserPlus style={{ width:9, height:9 }} />
          {isFull?"Full":showAdd?"Close":"Add"}
        </button>
      </div>

      {/* Add member search */}
      {showAdd && (
        <div style={{ padding:"9px 10px", borderBottom:`1px solid ${C.brd}`, flexShrink:0, background:C.card2 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:C.card, border:`1px solid ${C.brd}`, borderRadius:8, padding:"6px 10px", marginBottom:6 }}>
            <Search style={{ width:10, height:10, color:C.t3, flexShrink:0 }} />
            <input value={addSearch} onChange={e=>setAddSearch(e.target.value)} placeholder="Search members…" autoFocus
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.t1, fontSize:11.5, fontFamily:FONT }} />
          </div>
          <div style={{ maxHeight:150, overflowY:"auto" }}>
            {filteredMembers.length === 0
              ? <div style={{ fontSize:11, color:C.t3, textAlign:"center", padding:"10px 0" }}>No members found</div>
              : filteredMembers.map(m => {
                  const bg = palette[((m.user_name||"").charCodeAt(0)||0)%palette.length];
                  return (
                    <div key={m.user_id} onClick={()=>handleAdd(m)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 7px", borderRadius:7, cursor:"pointer", transition:"background .1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.cyanDim}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{ width:26, height:26, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff", flexShrink:0 }}>{ini(m.user_name||"")}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:C.t1 }}>{m.user_name||"Member"}</div>
                        {m.user_email && <div style={{ fontSize:9.5, color:C.t3 }}>{m.user_email}</div>}
                      </div>
                      <ChevronRight style={{ width:11, height:11, color:C.t3 }} />
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      {/* Attendees list */}
      <div className="cmm3-scr" style={{ flex:1, overflowY:"auto" }}>
        {attendees.length === 0 ? (
          <div style={{ padding:"32px 16px", textAlign:"center" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
              <Users style={{ width:16, height:16, color:C.cyan }} />
            </div>
            <div style={{ fontSize:12.5, color:C.t2, fontWeight:700, marginBottom:3 }}>No attendees yet</div>
            <div style={{ fontSize:11, color:C.t3 }}>Use the Add button above</div>
          </div>
        ) : attendees.map(a => (
          <AttendeeRow key={a.id} attendee={a} onStatusChange={handleStatusChange} onRemove={handleRemove} />
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ padding:"11px 12px", borderTop:`1px solid ${C.brd}`, display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
        <div style={{ fontSize:9.5, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:2 }}>Class Actions</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          <button className="cmm3-btn" onClick={()=>onEditClass(cls)}
            style={{ padding:"8px 10px", borderRadius:8, justifyContent:"center", background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, color:C.cyan, fontSize:11, fontWeight:700 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.cyanM; e.currentTarget.style.borderColor=C.cyan; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.cyanDim; e.currentTarget.style.borderColor=C.cyanBrd; }}>
            <Settings2 style={{ width:10, height:10 }} /> Edit Class
          </button>
          <button className="cmm3-btn"
            style={{ padding:"8px 10px", borderRadius:8, justifyContent:"center", background:C.amberDim, border:`1px solid ${C.amberBrd}`, color:C.amber, fontSize:11, fontWeight:700 }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(245,158,11,0.2)"; e.currentTarget.style.borderColor=C.amber; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.amberDim; e.currentTarget.style.borderColor=C.amberBrd; }}>
            <MessageCircle style={{ width:10, height:10 }} /> Message All
          </button>
        </div>
        <button className="cmm3-btn" onClick={()=>onDeleteClass(cls.id)}
          style={{ width:"100%", padding:"8px 12px", borderRadius:8, justifyContent:"center", background:C.redDim, border:`1px solid ${C.redBrd}`, color:C.red, fontSize:11.5, fontWeight:700 }}
          onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,77,109,0.2)"; e.currentTarget.style.borderColor=C.red; }}
          onMouseLeave={e=>{ e.currentTarget.style.background=C.redDim; e.currentTarget.style.borderColor=C.redBrd; }}>
          <Trash2 style={{ width:11, height:11 }} /> Cancel Class
        </button>
      </div>
    </div>
  );
}

/* ─── CLASS EDITOR MODAL ─────────────────────────────────────── */
function ClassEditorModal({ cls, coaches, onClose, onSave }) {
  const isEdit = !!cls?.id;
  const [form, setForm] = useState({
    name:                  cls?.name || "",
    class_type:            cls?.class_type || "",
    description:           cls?.description || "",
    instructor:            cls?.instructor || cls?.coach_name || "",
    location:              cls?.location || "",
    max_capacity:          cls?.max_capacity || "",
    duration_minutes:      cls?.duration_minutes || 60,
    schedule_type:         cls?.schedule_type || "recurring",
    schedule:              cls?.schedule?.length ? cls.schedule : [{ day:"Monday", time:"09:00" }],
    single_date:           cls?.single_date || "",
    single_time:           cls?.single_time || cls?.time || "09:00",
    bookings_enabled:      cls?.bookings_enabled !== false,
    booking_deadline_hours:cls?.booking_deadline_hours || "",
    status:                cls?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const inputStyle = {
    width:"100%", boxSizing:"border-box",
    background:"rgba(255,255,255,0.03)", border:`1px solid ${C.brd}`,
    color:C.t1, fontSize:13, fontFamily:FONT, outline:"none",
    borderRadius:8, padding:"8px 11px", transition:"border-color .18s",
  };
  const labelStyle = { fontSize:10, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:5 };

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      max_capacity:           form.max_capacity ? Number(form.max_capacity) : null,
      duration_minutes:       Number(form.duration_minutes)||60,
      booking_deadline_hours: form.booking_deadline_hours ? Number(form.booking_deadline_hours) : null,
      schedule: form.schedule_type==="single"
        ? [{ date:form.single_date, time:form.single_time }]
        : form.schedule,
      time: form.schedule_type==="single" ? form.single_time : (form.schedule[0]?.time||"09:00"),
    };
    await onSave(payload);
    setSaving(false);
  }

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:FONT }}>
      <div style={{ width:540, maxWidth:"94vw", maxHeight:"88vh", background:C.card, border:`1px solid ${C.brd2}`, borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 40px 80px rgba(0,0,0,0.8)", animation:"cmm3FadeIn .2s ease both" }}>

        {/* Modal header */}
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.brd}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:C.violetDim, border:`1px solid ${C.violetBrd}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Dumbbell style={{ width:11, height:11, color:C.violet }} />
            </div>
            <span style={{ fontSize:14, fontWeight:800, color:C.t1, letterSpacing:"-0.02em" }}>{isEdit?"Edit Class":"Create Class"}</span>
          </div>
          <button className="cmm3-btn" onClick={onClose}
            style={{ width:26, height:26, borderRadius:7, background:"transparent", border:`1px solid ${C.brd}`, color:C.t3, justifyContent:"center" }}>
            <X style={{ width:12, height:12 }} />
          </button>
        </div>

        <div className="cmm3-scr" style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>

          <div style={{ display:"flex", gap:11 }}>
            <div style={{ flex:1 }}>
              <div style={labelStyle}>Class Name *</div>
              <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Morning HIIT" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
            </div>
            <div style={{ flex:1 }}>
              <div style={labelStyle}>Class Type</div>
              <select value={form.class_type} onChange={e=>set("class_type",e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                <option value="">Select type…</option>
                {CLASS_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={labelStyle}>Description</div>
            <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={2} placeholder="Brief description…"
              style={{ ...inputStyle, resize:"vertical" }}
              onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
          </div>

          <div style={{ display:"flex", gap:11 }}>
            <div style={{ flex:1 }}>
              <div style={labelStyle}>Instructor</div>
              {coaches?.length > 0 ? (
                <select value={form.instructor} onChange={e=>set("instructor",e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                  <option value="">Select coach…</option>
                  {coaches.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <input value={form.instructor} onChange={e=>set("instructor",e.target.value)} placeholder="Coach name" style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
              )}
            </div>
            <div style={{ flex:1 }}>
              <div style={labelStyle}>Location</div>
              <input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="e.g. Studio A" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
            </div>
          </div>

          <div style={{ display:"flex", gap:11 }}>
            <div style={{ flex:1 }}>
              <div style={labelStyle}>Max Capacity</div>
              <input type="number" value={form.max_capacity} onChange={e=>set("max_capacity",e.target.value)} placeholder="Unlimited" min={1} style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
            </div>
            <div style={{ flex:1 }}>
              <div style={labelStyle}>Duration (minutes)</div>
              <input type="number" value={form.duration_minutes} onChange={e=>set("duration_minutes",e.target.value)} min={15} step={15} style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
            </div>
          </div>

          {/* Schedule type toggle */}
          <div>
            <div style={labelStyle}>Schedule Type</div>
            <div style={{ display:"flex", gap:6 }}>
              {[{v:"recurring",label:"Recurring (Weekly)",icon:RefreshCw},{v:"single",label:"Single Date",icon:Calendar}].map(opt => {
                const Ic = opt.icon;
                const active = form.schedule_type === opt.v;
                return (
                  <button key={opt.v} className="cmm3-btn" onClick={()=>set("schedule_type",opt.v)}
                    style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${active?C.cyanBrd:C.brd}`, background:active?C.cyanDim:"transparent", color:active?C.cyan:C.t2, fontSize:12, fontWeight:600, justifyContent:"center" }}>
                    <Ic style={{ width:11, height:11 }} />{opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {form.schedule_type === "recurring" ? (
            <div>
              <div style={labelStyle}>Days & Times</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {form.schedule.map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:7, alignItems:"center" }}>
                    <select value={s.day} onChange={e=>setForm(f=>({...f,schedule:f.schedule.map((x,idx)=>idx===i?{...x,day:e.target.value}:x)}))} style={{ ...inputStyle, flex:1 }}>
                      {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={s.time} onChange={e=>setForm(f=>({...f,schedule:f.schedule.map((x,idx)=>idx===i?{...x,time:e.target.value}:x)}))} style={{ ...inputStyle, width:110, flex:"none" }}
                      onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
                    {form.schedule.length > 1 && (
                      <button className="cmm3-btn" onClick={()=>setForm(f=>({...f,schedule:f.schedule.filter((_,idx)=>idx!==i)}))}
                        style={{ width:26, height:26, borderRadius:7, background:C.redDim, border:`1px solid ${C.redBrd}`, color:C.red, justifyContent:"center", flexShrink:0 }}>
                        <X style={{ width:10, height:10 }} />
                      </button>
                    )}
                  </div>
                ))}
                <button className="cmm3-btn" onClick={()=>setForm(f=>({...f,schedule:[...f.schedule,{day:"Monday",time:"09:00"}]}))}
                  style={{ padding:"6px 12px", borderRadius:7, background:"transparent", border:`1px dashed ${C.brd2}`, color:C.t3, fontSize:12 }}>
                  <Plus style={{ width:10, height:10 }} /> Add another day
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", gap:11 }}>
              <div style={{ flex:1 }}>
                <div style={labelStyle}>Date</div>
                <input type="date" value={form.single_date} onChange={e=>set("single_date",e.target.value)} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
              </div>
              <div style={{ flex:1 }}>
                <div style={labelStyle}>Time</div>
                <input type="time" value={form.single_time} onChange={e=>set("single_time",e.target.value)} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
              </div>
            </div>
          )}

          {/* Booking controls */}
          <div style={{ padding:"11px 13px", borderRadius:9, background:C.card2, border:`1px solid ${C.brd}` }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Booking Controls</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.t1 }}>Enable Bookings</div>
                <div style={{ fontSize:11, color:C.t3 }}>Allow members to book this class</div>
              </div>
              <button className="cmm3-btn" onClick={()=>set("bookings_enabled",!form.bookings_enabled)}
                style={{ width:42, height:22, borderRadius:11, background:form.bookings_enabled?C.green:C.brd2, border:"none", padding:2, justifyContent:"flex-start", cursor:"pointer" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", transition:"transform .2s", transform:form.bookings_enabled?"translateX(20px)":"none" }} />
              </button>
            </div>
            <div>
              <div style={labelStyle}>Booking Deadline (hours before)</div>
              <input type="number" value={form.booking_deadline_hours} onChange={e=>set("booking_deadline_hours",e.target.value)} placeholder="No deadline" min={0} style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.cyanBrd} onBlur={e=>e.target.style.borderColor=C.brd} />
            </div>
          </div>

          {isEdit && (
            <div>
              <div style={labelStyle}>Status</div>
              <select value={form.status} onChange={e=>set("status",e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ padding:"11px 18px", borderTop:`1px solid ${C.brd}`, display:"flex", gap:8, justifyContent:"flex-end", flexShrink:0 }}>
          <button className="cmm3-btn" onClick={onClose}
            style={{ padding:"8px 16px", borderRadius:8, background:"transparent", border:`1px solid ${C.brd}`, color:C.t2, fontSize:12.5, fontWeight:600 }}>
            Cancel
          </button>
          <button className="cmm3-btn" onClick={handleSave} disabled={!form.name.trim()||saving}
            style={{ padding:"8px 20px", borderRadius:8, background:form.name.trim()?"#7c3aed":C.brd, border:"none", color:form.name.trim()?"#fff":C.t3, fontSize:12.5, fontWeight:700, opacity:saving?0.7:1 }}>
            <Save style={{ width:12, height:12 }} />
            {saving?"Saving…":isEdit?"Save Changes":"Create Class"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function ClassManagementModal({
  open, onClose,
  classes = [], bookings = [], coaches = [], allMemberships = [],
  onCreateClass, onUpdateClass, onDeleteClass,
  initialClassId = null,
}) {
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [sort,        setSort]        = useState("name");
  const [coachFilter, setCoachFilter] = useState("all");
  const [selected,    setSelected]    = useState(null);
  const [editing,     setEditing]     = useState(null);

  useEffect(() => {
    if (!open) { setSelected(null); setSearch(""); setEditing(null); return; }
    if (initialClassId) {
      const match = classes.find(c=>c.id===initialClassId);
      if (match) setSelected(match);
    }
  }, [open, initialClassId]);

  async function handleSaveClass(data) {
    if (editing?.id) await onUpdateClass?.(editing.id, data);
    else await onCreateClass?.(data);
    setEditing(null);
  }

  async function handleDuplicate(cls) {
    const { id, created_date, updated_date, attendee_ids, ...rest } = cls;
    await onCreateClass?.({ ...rest, name:`${cls.name} (copy)`, attendee_ids:[] });
  }

  const coachNames = [...new Set(classes.map(c=>c.instructor||c.coach_name).filter(Boolean))];

  const visible = useMemo(() => {
    let list = [...classes];
    if (filter === "full")  list = list.filter(c=>{ const b=(c.attendee_ids||[]).length,m=c.max_capacity||0; return m>0&&b>=m; });
    if (filter === "open")  list = list.filter(c=>{ const b=(c.attendee_ids||[]).length,m=c.max_capacity||0; return !m||b<m; });
    if (filter === "empty") list = list.filter(c=>(c.attendee_ids||[]).length===0);
    if (coachFilter!=="all") list = list.filter(c=>(c.instructor||c.coach_name)===coachFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c=>(c.name||"").toLowerCase().includes(q)||(c.instructor||"").toLowerCase().includes(q));
    }
    list.sort((a,b) => {
      if (sort==="capacity") return (b.attendee_ids||[]).length-(a.attendee_ids||[]).length;
      if (sort==="coach") return (a.instructor||"").localeCompare(b.instructor||"");
      return (a.name||"").localeCompare(b.name||"");
    });
    return list;
  }, [classes, filter, coachFilter, search, sort]);

  const filterOptions = [
    { id:"all",   label:"All"   },
    { id:"open",  label:"Open"  },
    { id:"full",  label:"Full"  },
    { id:"empty", label:"Empty" },
  ];

  if (!open) return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, display:"flex", background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)", fontFamily:FONT }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, animation:"cmm3FadeIn .2s ease both" }}>

        {/* ── Top bar (mirrors ContentPage header) ── */}
        <div style={{ height:54, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", background:C.sidebar, borderBottom:`1px solid ${C.brd}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:C.violetDim, border:`1px solid ${C.violetBrd}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Dumbbell style={{ width:13, height:13, color:C.violet }} />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:C.t1, letterSpacing:"-0.02em" }}>Class Management</div>
              <div style={{ fontSize:10.5, color:C.t3 }}>{classes.length} classes · {bookings.length} total bookings</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <button className="cmm3-btn" onClick={()=>setEditing("new")}
              style={{ padding:"7px 16px", borderRadius:8, background:"#7c3aed", border:"none", color:"#fff", fontSize:12.5, fontWeight:700, boxShadow:"0 2px 10px rgba(124,58,237,0.35)" }}>
              <Plus style={{ width:12, height:12 }} /> New Class
            </button>
            <button className="cmm3-btn" onClick={onClose}
              style={{ width:32, height:32, borderRadius:8, background:"transparent", border:`1px solid ${C.brd}`, color:C.t3, justifyContent:"center" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.brd2; e.currentTarget.style.color=C.t2; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.brd; e.currentTarget.style.color=C.t3; }}>
              <X style={{ width:14, height:14 }} />
            </button>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <KpiStrip classes={classes} bookings={bookings} />

        {/* ── Controls bar (identical to ContentPage controls) ── */}
        <div style={{ padding:"9px 18px", display:"flex", alignItems:"center", gap:9, borderBottom:`1px solid ${C.brd}`, flexShrink:0, background:C.card, flexWrap:"wrap" }}>

          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card2, border:`1px solid ${C.brd}`, borderRadius:8, padding:"6px 11px", flex:1, minWidth:200 }}>
            <Search style={{ width:11, height:11, color:C.t3, flexShrink:0 }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search classes or coaches…"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.t1, fontSize:12.5, fontFamily:FONT }} />
            {search && (
              <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", padding:0 }}>
                <X style={{ width:10, height:10, color:C.t3 }} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{ display:"flex", gap:2, padding:"3px", background:C.card2, border:`1px solid ${C.brd}`, borderRadius:8 }}>
            {filterOptions.map(f => (
              <button key={f.id} className="cmm3-btn" onClick={()=>setFilter(f.id)}
                style={{ padding:"4px 11px", borderRadius:6, fontSize:11.5, fontWeight:filter===f.id?700:400, background:filter===f.id?C.cyanDim:"transparent", border:`1px solid ${filter===f.id?C.cyanBrd:"transparent"}`, color:filter===f.id?C.cyan:C.t3, transition:"all .15s" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Coach filter */}
          {coachNames.length > 0 && (
            <select value={coachFilter} onChange={e=>setCoachFilter(e.target.value)}
              style={{ padding:"6px 11px", borderRadius:8, background:C.card2, border:`1px solid ${C.brd}`, color:C.t2, fontSize:12, outline:"none", cursor:"pointer", fontFamily:FONT }}>
              <option value="all">All Coaches</option>
              {coachNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          )}

          {/* Sort */}
          <SortDropdown value={sort} onChange={setSort} options={[
            { value:"name",     label:"Name A–Z"  },
            { value:"capacity", label:"Capacity"  },
            { value:"coach",    label:"Coach"     },
          ]} />

          <span style={{ fontSize:11, color:C.t3, marginLeft:"auto", whiteSpace:"nowrap" }}>
            {visible.length} result{visible.length!==1?"s":""}
          </span>
        </div>

        {/* ── Main area ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Card grid (scrollable) */}
          <div className="cmm3-scr" style={{ flex:1, overflowY:"auto", padding:"14px 18px 28px" }}>
            {visible.length === 0 ? (
              <div style={{ padding:"72px 24px", textAlign:"center" }}>
                <div style={{ width:50, height:50, borderRadius:"50%", background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                  <Dumbbell style={{ width:20, height:20, color:C.cyan }} />
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:C.t2, marginBottom:6 }}>
                  {classes.length===0?"No classes yet":"No classes match"}
                </div>
                <div style={{ fontSize:12.5, color:C.t3, marginBottom:20 }}>
                  {classes.length===0?"Create your first class to get started":"Try adjusting your filters"}
                </div>
                {classes.length===0 && (
                  <button className="cmm3-btn" onClick={()=>setEditing("new")}
                    style={{ padding:"9px 20px", borderRadius:8, background:"#7c3aed", border:"none", color:"#fff", fontSize:13, fontWeight:700, margin:"0 auto", display:"inline-flex", boxShadow:"0 4px 14px rgba(124,58,237,0.4)" }}>
                    <Plus style={{ width:13, height:13 }} /> Create First Class
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {visible.map(cls => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    isSelected={selected?.id===cls.id}
                    onSelect={c=>setSelected(prev=>prev?.id===c.id?null:c)}
                    onDuplicate={handleDuplicate}
                    onDelete={id=>{ onDeleteClass?.(id); if(selected?.id===id) setSelected(null); }}
                    bookings={bookings.filter(b=>b.class_id===cls.id||b.session_id===cls.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right panel ── */}
          {selected && (
            <ClassControlCenter
              cls={selected}
              bookings={bookings}
              allMemberships={allMemberships}
              onClose={()=>setSelected(null)}
              onUpdateClass={async(id,data)=>{ await onUpdateClass?.(id,data); }}
              onDeleteClass={id=>{ onDeleteClass?.(id); setSelected(null); }}
              onEditClass={cls=>setEditing(cls)}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"7px 18px", borderTop:`1px solid ${C.brd}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:C.card }}>
          <span style={{ fontSize:10.5, color:C.t3 }}>Showing {visible.length} of {classes.length} classes</span>
          {selected && (
            <button className="cmm3-btn" onClick={()=>setSelected(null)}
              style={{ padding:"3px 9px", borderRadius:6, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, color:C.cyan, fontSize:10.5, fontWeight:700 }}>
              <X style={{ width:8, height:8 }} /> Deselect
            </button>
          )}
        </div>
      </div>

      {/* Editor modal */}
      {editing && (
        <ClassEditorModal
          cls={editing==="new"?null:editing}
          coaches={coaches}
          onClose={()=>setEditing(null)}
          onSave={handleSaveClass}
        />
      )}
    </div>
  );
}