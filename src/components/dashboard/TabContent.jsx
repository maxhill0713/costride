import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, BarChart2, Zap, Settings, Gift,
  ExternalLink, Eye, LogOut, QrCode, ChevronDown, Search, Plus,
  Calendar, Flame, BookOpen, CheckCircle2, Facebook, Instagram,
  Sparkles, Heart, MessageCircle, TrendingUp, AlertTriangle,
  ChevronRight, Check, AlignLeft, HelpCircle, Star, X, MoreHorizontal,
} from "lucide-react";

/* ─── tokens ──────────────────────────────────────────────────── */
const C = {
  bg:      "#0b0e17",
  surface: "#111520",
  card:    "#161b28",
  card2:   "#1a2030",
  border:  "rgba(255,255,255,0.06)",
  border2: "rgba(255,255,255,0.10)",
  text:    "#e8ecf4",
  muted:   "#7c879e",
  dim:     "#3e4a60",
  dimmer:  "#252d3d",
};

/* ─── primitives ──────────────────────────────────────────────── */
function Avatar({ name = "", size = 28, img = null }) {
  const letters = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const hue = ((name.charCodeAt(0) || 72) * 47) % 360;
  if (img) return (
    <img src={img} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      onError={e => { e.currentTarget.style.display = "none"; }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},40%,16%)`, border: `1.5px solid hsl(${hue},40%,28%)`,
      color: `hsl(${hue},65%,65%)`, fontSize: size * 0.35, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{letters}</div>
  );
}

function PlatformPill({ type }) {
  const styles = {
    instagram: { bg: "#25303e", border: "rgba(168,85,247,0.35)", Icon: Instagram, color: "#a855f7" },
    facebook:  { bg: "#1e2b3a", border: "rgba(59,130,246,0.35)",  Icon: Facebook,  color: "#3b82f6" },
  };
  const s = styles[type];
  if (!s) return null;
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <s.Icon size={11} color={s.color} />
    </div>
  );
}

function IaBadge() {
  return (
    <span style={{ padding: "1px 5px", borderRadius: 4, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 9.5, fontWeight: 800, color: "#818cf8", letterSpacing: "0.04em" }}>IA</span>
  );
}

function ScheduledBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", fontSize: 11, fontWeight: 700, color: "#34d399" }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />
      Scheduled
    </span>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 14, height: 14, borderRadius: 3, cursor: "pointer", flexShrink: 0, background: checked ? "#3b82f6" : "transparent", border: `1.5px solid ${checked ? "#3b82f6" : C.dim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {checked && <Check size={8} color="#fff" strokeWidth={3} />}
    </div>
  );
}

/* ─── sidebar ─────────────────────────────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: "Overview"         },
  { Icon: Users,           label: "Members"          },
  { Icon: FileText,        label: "Content", active: true },
  { Icon: BarChart2,       label: "Analytics"        },
  { Icon: Zap,             label: "Automations"      },
  { Icon: Settings,        label: "Settings"         },
  { Icon: Gift,            label: "Loyalty Programs" },
];
const LINKS = [
  { Icon: ExternalLink, label: "View Gym Page" },
  { Icon: Eye,          label: "Member View"   },
  { Icon: LogOut,       label: "Log Out", red: true },
];

function Sidebar() {
  return (
    <div style={{ width: 210, minHeight: "100vh", flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", fontFamily: "inherit" }}>

      {/* Brand */}
      <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Flame size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text, lineHeight: 1.25 }}>Foundry Gym</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Gym Owner</div>
        </div>
      </div>

      {/* Nav section */}
      <div style={{ padding: "13px 12px 8px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.dimmer, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Navigation</div>
        {NAV.map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8, marginBottom: 1, cursor: "pointer",
            background: item.active ? "rgba(59,130,246,0.13)" : "transparent",
            border: item.active ? "1px solid rgba(59,130,246,0.22)" : "1px solid transparent",
          }}>
            <item.Icon size={13} color={item.active ? "#60a5fa" : C.muted} strokeWidth={1.8} />
            <span style={{ fontSize: 12.5, fontWeight: item.active ? 700 : 400, color: item.active ? "#60a5fa" : C.muted }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Links section */}
      <div style={{ padding: "10px 12px 18px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.dimmer, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Links</div>
        {LINKS.map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 8, cursor: "pointer", marginBottom: 1 }}>
            <l.Icon size={12} color={l.red ? "#f87171" : C.muted} strokeWidth={1.8} />
            <span style={{ fontSize: 12, fontWeight: 400, color: l.red ? "#f87171" : C.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── header ──────────────────────────────────────────────────── */
function TopBar() {
  return (
    <div style={{ height: 48, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 10, flexShrink: 0 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>Thurs 9 Apr</span>

      <div style={{ position: "relative", flex: "0 0 220px" }}>
        <Search size={11} color={C.dim} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input placeholder="Search members..." style={{
          width: "100%", boxSizing: "border-box", padding: "5px 9px 5px 27px",
          borderRadius: 7, background: C.card, border: `1px solid ${C.border}`,
          color: C.text, fontSize: 12, outline: "none",
        }} />
      </div>

      <div style={{ flex: 1 }} />

      <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 7, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        <QrCode size={11} /> Scan QR <ChevronDown size={9} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer" }}>
        <Avatar name="Max" size={20} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Max</span>
        <ChevronDown size={9} color={C.dim} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", cursor: "pointer" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#f87171" }}>3 At Risk</span>
      </div>
    </div>
  );
}

/* ─── alert banner ────────────────────────────────────────────── */
function AlertBanner({ onDismiss }) {
  return (
    <div style={{
      background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "11px 16px", marginBottom: 10,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <AlertTriangle size={13} color="#f87171" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Attention Required: Critical Churn Interventions</span>
      <div style={{ flex: 1 }} />
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
        <X size={12} color={C.dim} />
      </button>
    </div>
  );
}

/* ─── journey card ────────────────────────────────────────────── */
function JourneyCard() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>Content Success Journey</span>
        {/* Progress track */}
        <div style={{ flex: 1, position: "relative", height: 6, background: C.dimmer, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "66%", background: "linear-gradient(90deg,#22c55e,#16a34a)", borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 0, marginTop: 9, position: "relative" }}>
        {[
          { label: "Step 1: Connect Facebook",         done: true  },
          { label: "Step 2: Schedule your first Poll", done: true  },
          { label: "Step 3: Review Insights",          done: false },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, paddingRight: i < 2 ? 8 : 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.done ? "#22c55e" : C.dim, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: s.done ? "#86efac" : C.muted, fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── tabs ────────────────────────────────────────────────────── */
const TABS = ["Feed", "Calendar", "Drafts", "Scheduled", "Library"];

function Tabs({ active, setActive }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, marginRight: 10 }}>Tab:</span>
      {TABS.map(tab => (
        <button key={tab} onClick={() => setActive(tab)} style={{
          padding: "6px 13px", fontSize: 12.5, background: "transparent", border: "none",
          borderBottom: `2px solid ${active === tab ? "#3b82f6" : "transparent"}`,
          color: active === tab ? C.text : C.muted,
          fontWeight: active === tab ? 700 : 400,
          cursor: "pointer", marginBottom: -1,
          textDecoration: active === tab ? "underline" : "none",
          textDecorationColor: "transparent",
        }}>
          {tab}
        </button>
      ))}
    </div>
  );
}

/* ─── draft cards ─────────────────────────────────────────────── */
const DRAFTS = [
  {
    id: "d1", author: "AI Gym", title: "AI Draft: Motivation Monday",
    sub: "Ready to crush your goals with...",
    platforms: ["instagram", "facebook"], aiGen: true,
  },
  {
    id: "d2", author: "Priya S", title: "Draft: New Class Poll",
    sub: "What class should we add next?...",
    platforms: ["instagram"], aiGen: false,
  },
];

function DraftCard({ d }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      {/* Row 1: avatar + title/sub */}
      <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "flex-start", gap: 9 }}>
        <Avatar name={d.author} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{d.title}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{d.sub}</div>
        </div>
      </div>
      {/* Row 2: platform icons + button */}
      <div style={{ padding: "9px 14px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {d.platforms.map(p => <PlatformPill key={p} type={p} />)}
        </div>
        {d.aiGen && <IaBadge />}
        <div style={{ flex: 1 }} />
        <button style={{
          padding: "6px 13px", borderRadius: 7, fontSize: 11.5, fontWeight: 700,
          background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer",
        }}>
          Review &amp; Schedule Now
        </button>
      </div>
    </div>
  );
}

/* ─── content table ───────────────────────────────────────────── */
const TABLE_ROWS = [
  { id: "r1", typeAvatar: "MG", typeLabel: "Motivation Monday AI", platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 70 },
  { id: "r2", typeAvatar: "NP", typeLabel: "Draft: New Class Poll", platforms: ["instagram"],            aiGen: false, date: "Apr 13, 9:00 AM", engBar: 0  },
  { id: "r3", typeAvatar: "MG", typeLabel: "Motivation Monday AI", platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 50 },
  { id: "r4", typeAvatar: "PS", typeLabel: "Priya Sharma",          platforms: ["instagram", "facebook"], aiGen: true,  date: "Apr 13, 9:00 AM", engBar: 30 },
];

const COL = "28px 2fr 90px 90px 130px 100px 120px";

function TableHeader() {
  const cols = ["", "TYPE", "CHANNEL", "STATUS", "PUBLISH DATE", "ENGAGEMENT %", "RECOMMENDED ACTION"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: COL, gap: 6, padding: "7px 12px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
      {cols.map((c, i) => (
        <div key={i} style={{ fontSize: 9.5, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center" }}>{c}</div>
      ))}
    </div>
  );
}

function TableRow({ row, checked, onToggle, last }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COL, gap: 6, padding: "9px 12px",
      alignItems: "center", cursor: "pointer",
      background: checked ? "rgba(59,130,246,0.05)" : "transparent",
      borderBottom: last ? "none" : `1px solid ${C.border}`,
    }} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Checkbox checked={checked} onChange={onToggle} />
      </div>

      {/* TYPE */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Avatar name={row.typeAvatar} size={24} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.typeLabel}</span>
      </div>

      {/* CHANNEL */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        {row.platforms.map(p => <PlatformPill key={p} type={p} />)}
        {row.aiGen && <IaBadge />}
      </div>

      {/* STATUS */}
      <div><ScheduledBadge /></div>

      {/* DATE */}
      <div style={{ fontSize: 11.5, color: C.muted }}>{row.date}</div>

      {/* ENGAGEMENT */}
      <div>
        <span style={{ fontSize: 11.5, color: C.muted }}>N/A</span>
        {row.engBar > 0 && (
          <div style={{ height: 3, background: C.dimmer, borderRadius: 2, marginTop: 4, width: 60 }}>
            <div style={{ width: `${row.engBar}%`, height: "100%", background: "#22c55e", borderRadius: 2 }} />
          </div>
        )}
      </div>

      {/* ACTION */}
      <div onClick={e => e.stopPropagation()}>
        <button style={{
          display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
          borderRadius: 6, fontSize: 11.5, fontWeight: 600,
          background: C.surface, border: `1px solid ${C.border2}`, color: C.muted, cursor: "pointer",
        }}>
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
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <TableHeader />
      {TABLE_ROWS.map((row, i) => (
        <TableRow key={row.id} row={row} checked={checked.has(row.id)} onToggle={() => toggle(row.id)} last={i === TABLE_ROWS.length - 1} />
      ))}
    </div>
  );
}

/* ─── feed row (below the table) ─────────────────────────────── */
function FeedRow() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 10 }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Feed</span>
      </div>
      <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <Checkbox checked={false} onChange={() => {}} />
        <Avatar name="Crushed" size={26} />
        <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>Crushed my personal best on deadlifts!</span>
          <span style={{ color: C.dim, fontSize: 11 }}> · 15 likes</span>
        </span>
        <MoreHorizontal size={14} color={C.dim} style={{ cursor: "pointer" }} />
      </div>
    </div>
  );
}

/* ─── right sidebar ───────────────────────────────────────────── */
const BAR_CHART = [
  { h: 60 }, { h: 85 }, { h: 35 }, { h: 60 }, { h: 28 }, { h: 22 }, { h: 18 },
];

const QUICK = [
  { label: "Generate AI Motivation Monday" },
  { label: "Post Member Spotlight"          },
  { label: "Create Weekend Challenge Poll"  },
];

function RightSidebar() {
  return (
    <div style={{
      width: 260, flexShrink: 0, background: C.surface, borderLeft: `1px solid ${C.border}`,
      padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto",
    }}>

      {/* What to Post Today */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 1 }}>What to Post Today?</div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 9 }}>(Guided Ideas)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {QUICK.map((q, i) => (
            <button key={i} style={{
              width: "100%", padding: "8px 12px", borderRadius: 7, textAlign: "left",
              background: C.card, border: `1px solid ${C.border2}`,
              color: C.text, fontSize: 11.5, fontWeight: 500, cursor: "pointer",
            }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border }} />

      {/* Actionable Insights */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 10 }}>Actionable Insights</div>

        {/* Bar chart */}
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 70, marginBottom: 3 }}>
          {/* Y axis */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", paddingBottom: 0, marginRight: 3 }}>
            {["12k", "8k", "4k", "0"].map(l => (
              <div key={l} style={{ fontSize: 8.5, color: C.dim, lineHeight: 1 }}>{l}</div>
            ))}
          </div>
          {/* Bars */}
          {BAR_CHART.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
              <div style={{
                width: "100%", height: `${b.h}%`,
                background: i < 2 ? "#3b82f6" : i < 4 ? "#6366f1" : "#8b5cf6",
                borderRadius: "2px 2px 0 0", opacity: 0.9,
              }} />
            </div>
          ))}
        </div>
        {/* X baseline */}
        <div style={{ height: 1, background: C.dimmer, marginBottom: 10, marginLeft: 24 }} />

        <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6, marginBottom: 8 }}>
          Polls have <span style={{ color: C.text, fontWeight: 700 }}>2x more engagement</span> than text. Ask a question about new class ideas.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <span style={{ fontSize: 11.5, color: "#60a5fa", fontWeight: 600 }}>Review Detailed Insights</span>
          <ChevronRight size={11} color="#60a5fa" />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border }} />

      {/* Content Feed Preview */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 10 }}>Content Feed Preview</div>

        {/* Post */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name="Sarah" size={26} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Sarah</span>
          </div>
          <div style={{ padding: "0 12px 8px", fontSize: 11.5, color: C.muted, lineHeight: 1.55 }}>
            Finally nailed that pose!{" "}
            <span style={{ color: "#60a5fa" }}>@foundrygym</span>{" "}
            <span style={{ color: "#60a5fa" }}>#yogagoals</span>
          </div>

          {/* Photo placeholder — gradient resembling workout image */}
          <div style={{
            margin: "0 12px 10px", borderRadius: 8, overflow: "hidden", height: 100,
            background: "linear-gradient(160deg,#1a2535,#0f1a2a)",
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* silhouette yoga figure */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <ellipse cx="24" cy="10" rx="5" ry="5" fill="#3e4a60" />
              <line x1="24" y1="15" x2="24" y2="32" stroke="#3e4a60" strokeWidth="3" strokeLinecap="round" />
              <line x1="24" y1="20" x2="10" y2="28" stroke="#3e4a60" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="20" x2="38" y2="14" stroke="#3e4a60" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="32" x2="16" y2="42" stroke="#3e4a60" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="32" x2="32" y2="42" stroke="#3e4a60" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ padding: "8px 12px 10px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.muted }}>
              <Heart size={12} color="#f87171" /> 18
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.muted }}>
              <MessageCircle size={12} color="#60a5fa" /> 4
            </div>
          </div>
        </div>

        {/* Add member button */}
        <button style={{
          width: "100%", marginTop: 9, padding: "9px", borderRadius: 8,
          background: "#3b82f6", color: "#fff", border: "none",
          fontSize: 12.5, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Plus size={13} /> Add Member
        </button>
      </div>
    </div>
  );
}

/* ─── main content area ───────────────────────────────────────── */
function ContentArea() {
  const [tab, setTab] = useState("Drafts");
  const [alert, setAlert] = useState(true);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* center column */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 40px", minWidth: 0 }}>

          {/* Page title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", display: "flex", alignItems: "baseline", gap: 6 }}>
                Content Center
                <span style={{ color: C.muted, fontWeight: 300, fontSize: 17 }}>/</span>
                <span style={{ color: "#818cf8" }}>Hub</span>
              </div>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 8, background: "#3b82f6", color: "#fff",
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              Create New <ChevronDown size={11} />
            </button>
          </div>

          {alert && <AlertBanner onDismiss={() => setAlert(false)} />}
          <JourneyCard />
          <Tabs active={tab} setActive={setTab} />

          {/* Drafts content */}
          {tab === "Drafts" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 9 }}>Draft Content</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {DRAFTS.map(d => <DraftCard key={d.id} d={d} />)}
              </div>

              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 9 }}>
                All Content (Drafts &amp; Scheduled)
              </div>
              <ContentTable />
              <FeedRow />
            </>
          )}

          {/* Other tab empty states */}
          {tab !== "Drafts" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59,130,246,0.08)", border: `1px solid rgba(59,130,246,0.18)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Flame size={20} color="#60a5fa" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>Nothing in {tab} yet</div>
              <button style={{ padding: "7px 16px", borderRadius: 8, background: "#3b82f6", color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={12} /> Create Content
              </button>
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

/* ─── root ────────────────────────────────────────────────────── */
export default function ContentPage() {
  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased",
    }}>
      <ContentArea />
    </div>
  );
}