import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, BarChart2, Zap, Settings,
  ExternalLink, Eye, LogOut, QrCode, ChevronDown, Search, Plus,
  Flame, Facebook, Instagram, Sparkles, Heart, MessageCircle,
  ChevronRight, Check, AlertTriangle, Star, X, MoreHorizontal,
  BrainCircuit, Gift, Bell,
} from "lucide-react";

/* ─── TOKENS (Forge Fitness) ─────────────────────────────────── */
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
  cyan:     "#00e5c8",
  cyanDim:  "rgba(0,229,200,0.1)",
  cyanBrd:  "rgba(0,229,200,0.25)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.15)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.15)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
};

const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
function Avatar({ name = "", size = 28 }) {
  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#ef4444","#3b82f6","#10b981"];
  const bg = palette[(name.charCodeAt(0) || 0) % palette.length];
  const letters = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: bg, border: `1.5px solid ${C.card}`,
      color: "#fff", fontSize: size * 0.36, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{letters}</div>
  );
}

function PlatformPill({ type }) {
  const map = {
    instagram: { bg: "rgba(168,85,247,0.12)", brd: "rgba(168,85,247,0.3)", Icon: Instagram, color: "#a855f7" },
    facebook:  { bg: "rgba(59,130,246,0.12)",  brd: "rgba(59,130,246,0.3)",  Icon: Facebook,  color: "#60a5fa" },
  };
  const s = map[type]; if (!s) return null;
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: s.bg, border: `1px solid ${s.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <s.Icon size={11} color={s.color} />
    </div>
  );
}

function AiBadge() {
  return (
    <span style={{ padding: "2px 6px", borderRadius: 4, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, fontSize: 9.5, fontWeight: 800, color: C.cyan, letterSpacing: "0.05em" }}>AI</span>
  );
}

function ScheduledBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: C.greenDim, border: "1px solid rgba(34,197,94,0.25)", fontSize: 11, fontWeight: 700, color: C.green }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />Scheduled
    </span>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 14, height: 14, borderRadius: 3, cursor: "pointer", flexShrink: 0, background: checked ? C.cyan : "transparent", border: `1.5px solid ${checked ? C.cyan : C.t3}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {checked && <Check size={8} color="#000" strokeWidth={3} />}
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: "Overview"         },
  { Icon: Eye,             label: "Views"            },
  { Icon: Users,           label: "Members"          },
  { Icon: FileText,        label: "Content", active: true },
  { Icon: BarChart2,       label: "Analytics"        },
  { Icon: MessageCircle,   label: "Community"        },
  { Icon: Zap,             label: "Automations"      },
  { Icon: BrainCircuit,    label: "AI Coach"         },
];

function Sidebar() {
  return (
    <div style={{ width: 188, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", height: "100vh", fontFamily: FONT }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#00e5c8,#00a896)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🔥</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>Forge Fitness</div>
          <div style={{ fontSize: 9.5, color: C.t2, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>GYM OWNER</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "10px 8px", flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px 8px" }}>Navigation</div>
        {NAV.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 8px", borderRadius: 7, cursor: "pointer",
            background: item.active ? C.cyanDim : "transparent",
            borderLeft: item.active ? `2px solid ${C.cyan}` : "2px solid transparent",
            color: item.active ? C.t1 : C.t2,
            fontSize: 12.5, fontWeight: item.active ? 600 : 400,
            marginBottom: 1,
          }}>
            <item.Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>

      <div style={{ padding: "8px", borderTop: `1px solid ${C.brd}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 7, cursor: "pointer", color: C.t2, fontSize: 12.5 }}>
          <Settings style={{ width: 13, height: 13 }} /> Settings
        </div>
      </div>
    </div>
  );
}

/* ─── TOP BAR ────────────────────────────────────────────────── */
function TopBar() {
  return (
    <div style={{
      height: 46, flexShrink: 0, background: C.sidebar,
      borderBottom: `1px solid ${C.brd}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 18px", gap: 10, fontFamily: FONT,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t2 }}>Content Center</span>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, borderRadius: 7, padding: "5px 10px", width: 220 }}>
          <Search style={{ width: 12, height: 12, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t3 }}>Search members, content…</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, borderRadius: 7, padding: "5px 10px", fontSize: 11.5, color: C.t2 }}>
          <span>📅</span> Friday 10 April 2026
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.28)", cursor: "pointer" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.red }}>3 At Risk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 7, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, color: C.cyan, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <QrCode style={{ width: 12, height: 12 }} /> + Scan QR
        </div>
      </div>
    </div>
  );
}

/* ─── ALERT BANNER ───────────────────────────────────────────── */
function AlertBanner({ onDismiss }) {
  return (
    <div style={{ background: C.card2, border: `1px solid rgba(255,77,109,0.25)`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
      <AlertTriangle size={13} color={C.red} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>Attention Required: Critical Churn Interventions</span>
      <div style={{ flex: 1 }} />
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
        <X size={12} color={C.t3} />
      </button>
    </div>
  );
}

/* ─── JOURNEY CARD ───────────────────────────────────────────── */
function JourneyCard() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "11px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, whiteSpace: "nowrap" }}>Content Success Journey</span>
        <div style={{ flex: 1, position: "relative", height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "66%", background: `linear-gradient(90deg,${C.cyan},#00a896)`, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 11, color: C.cyan, fontWeight: 600, whiteSpace: "nowrap" }}>66%</span>
      </div>
      <div style={{ display: "flex", gap: 0, marginTop: 9 }}>
        {[
          { label: "Step 1: Connect Facebook",         done: true  },
          { label: "Step 2: Schedule your first Poll", done: true  },
          { label: "Step 3: Review Insights",          done: false },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, paddingRight: i < 2 ? 8 : 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.done ? C.cyan : C.t3, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: s.done ? C.cyan : C.t2, fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TABS ───────────────────────────────────────────────────── */
const TABS = ["Feed", "Calendar", "Drafts", "Scheduled", "Library", "Events", "Challenges", "Polls", "Posts"];

function Tabs({ active, setActive }) {
  const visible = ["Drafts", "Scheduled", "Events", "Challenges", "Polls", "Posts"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 14, borderBottom: `1px solid ${C.brd}` }}>
      {visible.map(tab => (
        <button key={tab} onClick={() => setActive(tab)} style={{
          padding: "7px 14px", fontSize: 12.5, background: "transparent", border: "none",
          borderBottom: `2px solid ${active === tab ? C.cyan : "transparent"}`,
          color: active === tab ? C.t1 : C.t2,
          fontWeight: active === tab ? 700 : 400,
          cursor: "pointer", marginBottom: -1,
          fontFamily: FONT, transition: "color 0.15s",
        }}>
          {tab}
        </button>
      ))}
    </div>
  );
}

/* ─── DRAFT CARDS ────────────────────────────────────────────── */
const DRAFTS = [
  { id: "d1", author: "AI Gym", title: "AI Draft: Motivation Monday", sub: "Ready to crush your goals with...", platforms: ["instagram", "facebook"], aiGen: true },
  { id: "d2", author: "Priya S", title: "Draft: New Class Poll", sub: "What class should we add next?...", platforms: ["instagram"], aiGen: false },
];

function DraftCard({ d }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
      <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "flex-start", gap: 9 }}>
        <Avatar name={d.author} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{d.title}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{d.sub}</div>
        </div>
      </div>
      <div style={{ padding: "9px 14px 12px", display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${C.brd}` }}>
        <div style={{ display: "flex", gap: 4 }}>
          {d.platforms.map(p => <PlatformPill key={p} type={p} />)}
        </div>
        {d.aiGen && <AiBadge />}
        <div style={{ flex: 1 }} />
        <button style={{ padding: "6px 13px", borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: C.cyan, color: "#000", border: "none", cursor: "pointer", fontFamily: FONT }}>
          Review &amp; Schedule
        </button>
      </div>
    </div>
  );
}

/* ─── CONTENT TABLE ──────────────────────────────────────────── */
const TABLE_ROWS = [
  { id: "r1", typeAvatar: "MG", typeLabel: "Motivation Monday AI", platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 70 },
  { id: "r2", typeAvatar: "NP", typeLabel: "Draft: New Class Poll", platforms: ["instagram"],            aiGen: false, date: "Apr 13, 9:00 AM", engBar: 0  },
  { id: "r3", typeAvatar: "MG", typeLabel: "Motivation Monday AI", platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 50 },
  { id: "r4", typeAvatar: "PS", typeLabel: "Priya Sharma",          platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 30 },
];

const COL = "28px 2fr 90px 110px 130px 100px 130px";

function TableHeader() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: COL, gap: 6, padding: "7px 12px", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.brd}` }}>
      {["", "TYPE", "CHANNEL", "STATUS", "PUBLISH DATE", "ENGAGEMENT", "ACTION"].map((c, i) => (
        <div key={i} style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c}</div>
      ))}
    </div>
  );
}

function TableRow({ row, checked, onToggle, last }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COL, gap: 6, padding: "9px 12px",
      alignItems: "center", cursor: "pointer",
      background: checked ? C.cyanDim : "transparent",
      borderBottom: last ? "none" : `1px solid ${C.brd}`,
    }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
      onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Checkbox checked={checked} onChange={onToggle} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Avatar name={row.typeAvatar} size={24} />
        <span style={{ fontSize: 12, fontWeight: 500, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.typeLabel}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        {row.platforms.map(p => <PlatformPill key={p} type={p} />)}
        {row.aiGen && <AiBadge />}
      </div>
      <div><ScheduledBadge /></div>
      <div style={{ fontSize: 11.5, color: C.t2 }}>{row.date}</div>
      <div>
        <span style={{ fontSize: 11.5, color: C.t3 }}>N/A</span>
        {row.engBar > 0 && (
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 5, width: 60 }}>
            <div style={{ width: `${row.engBar}%`, height: "100%", background: C.cyan, borderRadius: 2 }} />
          </div>
        )}
      </div>
      <div onClick={e => e.stopPropagation()}>
        <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 500, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, color: C.t2, cursor: "pointer", fontFamily: FONT }}>
          Review, Edit <ChevronDown size={9} />
        </button>
      </div>
    </div>
  );
}

function ContentTable() {
  const [checked, setChecked] = useState(new Set());
  const toggle = id => setChecked(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
      <TableHeader />
      {TABLE_ROWS.map((row, i) => (
        <TableRow key={row.id} row={row} checked={checked.has(row.id)} onToggle={() => toggle(row.id)} last={i === TABLE_ROWS.length - 1} />
      ))}
    </div>
  );
}

/* ─── FEED ROW ───────────────────────────────────────────────── */
function FeedRow() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, marginTop: 10 }}>
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.brd}` }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>Community Feed</span>
      </div>
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Checkbox checked={false} onChange={() => {}} />
        <Avatar name="Jamie" size={26} />
        <span style={{ fontSize: 12, color: C.t2, flex: 1 }}>
          <span style={{ color: C.t1, fontWeight: 600 }}>Crushed my personal best on deadlifts!</span>
          <span style={{ color: C.t3, fontSize: 11 }}> · 15 likes</span>
        </span>
        <MoreHorizontal size={14} color={C.t3} style={{ cursor: "pointer" }} />
      </div>
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
const BAR_DATA = [{ h: 60 }, { h: 85 }, { h: 35 }, { h: 60 }, { h: 28 }, { h: 22 }, { h: 18 }];

const QUICK_IDEAS = [
  "Generate AI Motivation Monday",
  "Post Member Spotlight",
  "Create Weekend Challenge Poll",
];

function RightSidebar() {
  return (
    <div style={{
      width: 252, flexShrink: 0, background: C.sidebar,
      borderLeft: `1px solid ${C.brd}`, padding: "14px 12px",
      display: "flex", flexDirection: "column", gap: 14, overflowY: "auto",
    }}>
      {/* What to Post */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 2 }}>What to Post Today?</div>
        <div style={{ fontSize: 10.5, color: C.t2, marginBottom: 9 }}>Guided ideas for today</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {QUICK_IDEAS.map((q, i) => (
            <button key={i} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, textAlign: "left", background: C.card, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: C.brd }} />

      {/* Insights chart */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 10 }}>Actionable Insights</div>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 70, marginBottom: 3 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", marginRight: 4 }}>
            {["12k", "8k", "4k", "0"].map(l => <div key={l} style={{ fontSize: 8.5, color: C.t3, lineHeight: 1 }}>{l}</div>)}
          </div>
          {BAR_DATA.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ width: "100%", height: `${b.h}%`, background: i < 2 ? C.cyan : i < 4 ? "rgba(0,229,200,0.5)" : "rgba(0,229,200,0.25)", borderRadius: "2px 2px 0 0" }} />
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C.brd, marginBottom: 10, marginLeft: 24 }} />
        <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6, marginBottom: 8 }}>
          Polls have <span style={{ color: C.t1, fontWeight: 600 }}>2× more engagement</span> than text posts. Try asking about new class ideas.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <span style={{ fontSize: 11.5, color: C.cyan, fontWeight: 600 }}>Review Detailed Insights</span>
          <ChevronRight size={11} color={C.cyan} />
        </div>
      </div>

      <div style={{ height: 1, background: C.brd }} />

      {/* Content feed preview */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 10 }}>Content Feed Preview</div>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name="Sarah" size={26} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Sarah</span>
          </div>
          <div style={{ padding: "0 12px 8px", fontSize: 11.5, color: C.t2, lineHeight: 1.55 }}>
            Finally nailed that pose!{" "}
            <span style={{ color: C.cyan }}>@forgefitness</span>{" "}
            <span style={{ color: C.cyan }}>#yogagoals</span>
          </div>
          <div style={{ margin: "0 12px 10px", borderRadius: 8, overflow: "hidden", height: 90, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <ellipse cx="24" cy="10" rx="5" ry="5" fill={C.t3} />
              <line x1="24" y1="15" x2="24" y2="32" stroke={C.t3} strokeWidth="3" strokeLinecap="round" />
              <line x1="24" y1="20" x2="10" y2="28" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="20" x2="38" y2="14" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="32" x2="16" y2="42" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="32" x2="32" y2="42" stroke={C.t3} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ padding: "8px 12px 10px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.t2 }}><Heart size={12} color={C.red} /> 18</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.t2 }}><MessageCircle size={12} color={C.cyan} /> 4</div>
          </div>
        </div>

        <button style={{ width: "100%", marginTop: 9, padding: "9px", borderRadius: 8, background: C.cyan, color: "#000", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 0 16px rgba(0,229,200,0.25)" }}>
          <Plus size={13} /> Add Member
        </button>
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ label, onAdd }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Flame size={20} color={C.cyan} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.t2 }}>No {label} yet</div>
      <button onClick={onAdd} style={{ padding: "7px 16px", borderRadius: 8, background: C.cyan, color: "#000", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
        <Plus size={12} /> Create
      </button>
    </div>
  );
}

/* ─── SECTION HEADER ─────────────────────────────────────────── */
function SectionHeader({ count, label, onAdd, btnLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>{count} {label}</div>
      <button onClick={onAdd} style={{ padding: "6px 14px", borderRadius: 7, background: C.cyan, color: "#000", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 5 }}>
        <Plus size={11} /> {btnLabel}
      </button>
    </div>
  );
}

/* ─── GENERIC LIST CARD ──────────────────────────────────────── */
function ListCard({ children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
      {children}
    </div>
  );
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, borderRadius: 6, padding: "4px 10px", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}>Delete</button>
  );
}

/* ─── CONTENT AREA ───────────────────────────────────────────── */
function ContentArea({ events = [], challenges = [], polls = [], posts = [], openModal, onDeleteEvent, onDeleteChallenge, onDeletePost }) {
  const [tab, setTab] = useState("Drafts");
  const [alert, setAlert] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px", minWidth: 0 }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, color: C.t1, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                Content Center <span style={{ color: C.t3, fontWeight: 300 }}>/</span> <span style={{ color: C.cyan }}>Hub</span>
              </h1>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>Manage posts, events, challenges and polls</div>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowCreateMenu(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: C.cyan, border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: "#000", cursor: "pointer", fontFamily: FONT, boxShadow: "0 0 20px rgba(0,229,200,0.3)", flexShrink: 0 }}>
                Create New <ChevronDown size={11} />
              </button>
              {showCreateMenu && (
                <>
                  <div onClick={() => setShowCreateMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden", minWidth: 175, boxShadow: "0 12px 36px rgba(0,0,0,0.7)" }}>
                    {[
                      { label: "📝 New Post",      action: () => { openModal?.("post");      setShowCreateMenu(false); setTab("Posts"); } },
                      { label: "📅 New Event",     action: () => { openModal?.("event");     setShowCreateMenu(false); setTab("Events"); } },
                      { label: "🏆 New Challenge", action: () => { openModal?.("challenge"); setShowCreateMenu(false); setTab("Challenges"); } },
                      { label: "📊 New Poll",      action: () => { openModal?.("poll");      setShowCreateMenu(false); setTab("Polls"); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={{ width: "100%", display: "block", padding: "9px 16px", background: "transparent", border: "none", color: C.t1, fontSize: 12.5, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: FONT }}
                        onMouseEnter={e => e.currentTarget.style.background = C.cyanDim}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alert */}
          {alert && <AlertBanner onDismiss={() => setAlert(false)} />}

          {/* Journey */}
          <JourneyCard />

          {/* Tabs */}
          <Tabs active={tab} setActive={setTab} />

          {/* ── DRAFTS ── */}
          {tab === "Drafts" && (
            <>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t2, marginBottom: 9 }}>Draft Content</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {DRAFTS.map(d => <DraftCard key={d.id} d={d} />)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 9 }}>All Content (Drafts &amp; Scheduled)</div>
              <ContentTable />
              <FeedRow />
            </>
          )}

          {/* ── SCHEDULED ── */}
          {tab === "Scheduled" && (
            <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
              <TableHeader />
              {TABLE_ROWS.map((row, i) => {
                const [checked, setChecked] = useState(false);
                return <TableRow key={row.id} row={row} checked={checked} onToggle={() => setChecked(p => !p)} last={i === TABLE_ROWS.length - 1} />;
              })}
            </div>
          )}

          {/* ── EVENTS ── */}
          {tab === "Events" && (
            <>
              <SectionHeader count={events.length} label="Events" onAdd={() => openModal?.("event")} btnLabel="Add Event" />
              {events.length === 0 ? <EmptyState label="events" onAdd={() => openModal?.("event")} /> : (
                events.map(ev => (
                  <ListCard key={ev.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{ev.title}</div>
                      {ev.description && <div style={{ fontSize: 11.5, color: C.t2, marginTop: 3 }}>{ev.description}</div>}
                      {ev.event_date && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{new Date(ev.event_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.t2 }}>{ev.attendees || 0} attending</div>
                    {onDeleteEvent && <DeleteBtn onClick={() => onDeleteEvent(ev.id)} />}
                  </ListCard>
                ))
              )}
            </>
          )}

          {/* ── CHALLENGES ── */}
          {tab === "Challenges" && (
            <>
              <SectionHeader count={challenges.length} label="Challenges" onAdd={() => openModal?.("challenge")} btnLabel="New Challenge" />
              {challenges.length === 0 ? <EmptyState label="challenges" onAdd={() => openModal?.("challenge")} /> : (
                challenges.map(ch => (
                  <ListCard key={ch.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{ch.title}</div>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: ch.status === "active" ? C.cyanDim : "rgba(255,255,255,0.06)", color: ch.status === "active" ? C.cyan : C.t2, border: `1px solid ${ch.status === "active" ? C.cyanBrd : C.brd}` }}>{ch.status}</span>
                      </div>
                      {ch.description && <div style={{ fontSize: 11.5, color: C.t2 }}>{ch.description}</div>}
                      <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>{ch.start_date} → {ch.end_date}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.t2 }}>{(ch.participants || []).length} joined</div>
                    {onDeleteChallenge && <DeleteBtn onClick={() => onDeleteChallenge(ch.id)} />}
                  </ListCard>
                ))
              )}
            </>
          )}

          {/* ── POLLS ── */}
          {tab === "Polls" && (
            <>
              <SectionHeader count={polls.length} label="Polls" onAdd={() => openModal?.("poll")} btnLabel="New Poll" />
              {polls.length === 0 ? <EmptyState label="polls" onAdd={() => openModal?.("poll")} /> : (
                polls.map(poll => (
                  <div key={poll.id} style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "13px 16px", marginBottom: 8 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{poll.question || poll.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: C.t2 }}>{(poll.voters || []).length} votes</span>
                        {onDeleteChallenge && <DeleteBtn onClick={() => onDeleteChallenge(poll.id)} />}
                      </div>
                    </div>
                    {(poll.options || []).map((opt, i) => {
                      const optText = typeof opt === "object" ? (opt.text || opt.label || String(i + 1)) : opt;
                      const optVotes = typeof opt === "object" ? (opt.votes || 0) : ((poll.votes || {})[opt] || 0);
                      const total = Math.max((poll.voters || []).length, 1);
                      const pct = Math.round(optVotes / total * 100);
                      return (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.t2, marginBottom: 3 }}>
                            <span>{optText}</span><span style={{ color: C.cyan }}>{pct}%</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: C.cyan, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </>
          )}

          {/* ── POSTS ── */}
          {tab === "Posts" && (
            <>
              <SectionHeader count={posts.length} label="Posts" onAdd={() => openModal?.("post")} btnLabel="New Post" />
              {posts.length === 0 ? <EmptyState label="posts" onAdd={() => openModal?.("post")} /> : (
                posts.map(p => (
                  <ListCard key={p.id}>
                    {p.image_url && <img src={p.image_url} alt="" style={{ width: 52, height: 52, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>{p.member_name}</div>
                      <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.content}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.t3 }}>{Object.keys(p.reactions || {}).length} reactions</div>
                    {onDeletePost && <DeleteBtn onClick={() => onDeletePost(p.id)} />}
                  </ListCard>
                ))
              )}
            </>
          )}

        </div>
        <RightSidebar />
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function ContentPage({ events = [], challenges = [], polls = [], posts = [], openModal, onDeleteEvent, onDeleteChallenge, onDeletePost }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar />
        <ContentArea
          events={events} challenges={challenges} polls={polls} posts={posts}
          openModal={openModal} onDeleteEvent={onDeleteEvent}
          onDeleteChallenge={onDeleteChallenge} onDeletePost={onDeletePost}
        />
      </div>
    </div>
  );
}
