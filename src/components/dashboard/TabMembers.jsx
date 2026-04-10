/**
 * MembersPageAI — Clean minimal redesign
 * Forge Fitness design system · Cyan accent · DM Sans
 */
import { useState, useMemo, useCallback } from "react";
import {
  TrendingDown, TrendingUp, Users, Flame, Send, X,
  ChevronRight, ChevronDown, ChevronLeft, Search, Check,
  Bell, Plus, LayoutDashboard, FileText,
  BarChart2, Zap, Settings, Eye, QrCode, BrainCircuit,
  MessageCircle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:      "#0b0b0d",
  sidebar: "#0f0f12",
  card:    "#141416",
  card2:   "#18181b",
  brd:     "#222226",
  brd2:    "#2a2a30",
  t1:      "#ffffff",
  t2:      "#8a8a94",
  t3:      "#444450",
  cyan:    "#00e5c8",
  cyanD:   "rgba(0,229,200,0.08)",
  cyanB:   "rgba(0,229,200,0.22)",
  red:     "#ff4d6d",
  redD:    "rgba(255,77,109,0.1)",
  redB:    "rgba(255,77,109,0.25)",
  amber:   "#f59e0b",
  green:   "#22c55e",
  blue:    "#3b82f6",
};
const FONT = "'DM Sans','Segoe UI',sans-serif";

/* ─── DATA ───────────────────────────────────────────────────── */
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

const MEMBERS = [
  { id:"1", name:"Marcus Webb",    initials:"MW", ci:0, plan:"Premium", mv:120, ds:22,  appDays:18, v30:0,  pv30:8,  vt:47,  streak:0,  churn:84, rc:38, action:"Send 'We miss you'",   status:"At risk",      seg:"atRisk"  },
  { id:"2", name:"Priya Sharma",   initials:"PS", ci:1, plan:"Monthly", mv:60,  ds:16,  appDays:14, v30:1,  pv30:4,  vt:31,  streak:0,  churn:71, rc:44, action:"Friendly check-in",    status:"Dropping off", seg:"atRisk"  },
  { id:"3", name:"Tyler Rhodes",   initials:"TR", ci:2, plan:"Monthly", mv:60,  ds:9,   appDays:7,  v30:1,  pv30:5,  vt:12,  streak:0,  churn:55, rc:52, action:"Habit-building nudge", status:"New",          seg:"new"     },
  { id:"4", name:"Chloe Nakamura", initials:"CN", ci:3, plan:"Annual",  mv:90,  ds:1,   appDays:0,  v30:14, pv30:11, vt:203, streak:18, churn:4,  rc:96, action:"Challenge invite",     status:"Consistent",   seg:"active"  },
  { id:"5", name:"Devon Osei",     initials:"DO", ci:4, plan:"Monthly", mv:60,  ds:19,  appDays:15, v30:0,  pv30:3,  vt:8,   streak:0,  churn:78, rc:35, action:"Personal outreach",    status:"At risk",      seg:"atRisk"  },
  { id:"6", name:"Anya Petrov",    initials:"AP", ci:5, plan:"Premium", mv:120, ds:0,   appDays:0,  v30:9,  pv30:7,  vt:88,  streak:7,  churn:6,  rc:94, action:"Referral ask",         status:"Engaged",      seg:"active"  },
  { id:"7", name:"Jamie Collins",  initials:"JC", ci:6, plan:"Monthly", mv:60,  ds:5,   appDays:3,  v30:2,  pv30:4,  vt:19,  streak:0,  churn:42, rc:58, action:"Motivate",             status:"Dropping off", seg:"inactive"},
  { id:"8", name:"Sam Rivera",     initials:"SR", ci:7, plan:"Monthly", mv:60,  ds:999, appDays:5,  v30:0,  pv30:0,  vt:1,   streak:0,  churn:91, rc:30, action:"Week-1 welcome",       status:"New",          seg:"new"     },
];

const CHURN_TREND = [
  { m:"Nov", v:28 },{ m:"Dec", v:34 },{ m:"Jan", v:40 },
  { m:"Feb", v:35 },{ m:"Mar", v:42 },{ m:"Apr", v:31 },
];

const VISIT_TREND = [
  { m:"Nov", v:120 },{ m:"Dec", v:134 },{ m:"Jan", v:128 },
  { m:"Feb", v:145 },{ m:"Mar", v:162 },{ m:"Apr", v:178 },
];

const AV_COLORS = ["#6366f1","#14b8a6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#a855f7","#f97316"];

const ACTIONS = [
  "Send 'We miss you'","Friendly check-in","Habit-building nudge",
  "Challenge invite","Personal outreach","Referral ask","Motivate","Week-1 welcome",
];

/* ─── HELPERS ────────────────────────────────────────────────── */
function churnCol(p) { return p >= 70 ? C.red : p >= 40 ? C.amber : C.green; }

function statusSty(s) {
  return ({
    "At risk":      { bg:C.redD,                  brd:C.redB,                        col:C.red   },
    "Dropping off": { bg:"rgba(245,158,11,0.1)",   brd:"rgba(245,158,11,0.25)",        col:C.amber },
    "Consistent":   { bg:"rgba(34,197,94,0.1)",    brd:"rgba(34,197,94,0.25)",         col:C.green },
    "Engaged":      { bg:"rgba(34,197,94,0.1)",    brd:"rgba(34,197,94,0.25)",         col:C.green },
    "New":          { bg:"rgba(59,130,246,0.1)",   brd:"rgba(59,130,246,0.25)",        col:C.blue  },
  })[s] || { bg:C.cyanD, brd:C.cyanB, col:C.cyan };
}

function lastLabel(ds) {
  if (ds === 999) return "Never";
  if (ds === 0)   return "Today";
  if (ds === 1)   return "Yesterday";
  return `${ds}d ago`;
}

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Av({ m, size = 30 }) {
  const col = AV_COLORS[m.ci % AV_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: col + "1a", color: col,
      fontSize: size * 0.32, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: `1.5px solid ${col}33`, fontFamily: "monospace",
    }}>{m.initials}</div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: "Overview"    },
  { Icon: Eye,             label: "Views"       },
  { Icon: Users,           label: "Members", active: true },
  { Icon: FileText,        label: "Content"     },
  { Icon: BarChart2,       label: "Analytics"   },
  { Icon: MessageCircle,   label: "Community"   },
  { Icon: Zap,             label: "Automations" },
  { Icon: BrainCircuit,    label: "AI Coach"    },
];

function Sidebar() {
  return (
    <div style={{
      width: 188, flexShrink: 0, background: C.sidebar,
      borderRight: `1px solid ${C.brd}`,
      display: "flex", flexDirection: "column", height: "100vh", fontFamily: FONT,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#00e5c8,#00a896)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🔥</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>Forge Fitness</div>
          <div style={{ fontSize: 10, color: C.t2 }}>GYM OWNER</div>
        </div>
      </div>
      <div style={{ padding: "10px 8px", flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px 8px" }}>Navigation</div>
        {NAV.map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 8px", borderRadius: 7, cursor: "pointer", marginBottom: 1,
            background: item.active ? C.cyanD : "transparent",
            borderLeft: item.active ? `2px solid ${C.cyan}` : "2px solid transparent",
            color: item.active ? C.t1 : C.t2,
            fontSize: 12.5, fontWeight: item.active ? 600 : 400,
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

/* ─── TOPBAR ─────────────────────────────────────────────────── */
function TopBar() {
  return (
    <div style={{
      height: 46, background: C.sidebar, borderBottom: `1px solid ${C.brd}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 18px", gap: 12, flexShrink: 0, fontFamily: FONT,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>Members / CRM</span>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, borderRadius: 7, padding: "5px 10px", width: 190 }}>
          <Search style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t3 }}>Search members…</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, fontSize: 11.5, color: C.t2 }}>
          📅 Friday 10 April 2026
        </div>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: C.redD, border: `1px solid ${C.redB}`, fontSize: 11.5, color: C.red, fontWeight: 600, cursor: "pointer" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} /> 3 At Risk
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <QrCode style={{ width: 11, height: 11 }} /> Scan QR
        </div>
      </div>
    </div>
  );
}

/* ─── ACTION DROPDOWN ────────────────────────────────────────── */
function ActionDropdown({ member, onMessage }) {
  const [open, setOpen] = useState(false);
  const [sel,  setSel]  = useState(member.action);

  return (
    <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 6,
          background: C.cyanD, border: `1px solid ${C.cyanB}`,
          color: C.cyan, fontSize: 11, fontWeight: 600,
          cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT,
        }}
      >
        {sel.length > 20 ? sel.slice(0, 20) + "…" : sel}
        <ChevronDown style={{ width: 9, height: 9, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100,
          background: C.card2, border: `1px solid ${C.brd2}`,
          borderRadius: 8, overflow: "hidden", minWidth: 195,
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        }}>
          {ACTIONS.map(a => (
            <div
              key={a}
              onClick={() => { setSel(a); setOpen(false); onMessage({ ...member, action: a }); }}
              style={{
                padding: "8px 12px", fontSize: 12,
                color: a === sel ? C.cyan : C.t2,
                cursor: "pointer", fontFamily: FONT,
                background: a === sel ? C.cyanD : "transparent",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={e => { if (a !== sel) e.currentTarget.style.background = C.card; }}
              onMouseLeave={e => { if (a !== sel) e.currentTarget.style.background = "transparent"; }}
            >
              {a}
              {a === sel && <Check style={{ width: 10, height: 10, color: C.cyan }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── TABLE ──────────────────────────────────────────────────── */
const GRID = "1.6fr 110px 110px 110px 200px";

function TableHead({ sort, setSort }) {
  const cols = [
    { label: "MEMBER",     key: "name"      },
    { label: "STATUS",     key: null        },
    { label: "LAST VISIT", key: "lastVisit" },
    { label: "APP",        key: null        },
    { label: "ACTION",     key: null        },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: GRID, gap: 12,
      padding: "7px 18px", borderBottom: `1px solid ${C.brd}`,
      background: C.card, fontFamily: FONT, flexShrink: 0,
    }}>
      {cols.map((c, i) => (
        <div key={i} onClick={() => c.key && setSort(c.key)} style={{
          display: "flex", alignItems: "center", gap: 3,
          fontSize: 9.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase",
          color: sort === c.key ? C.t2 : C.t3,
          cursor: c.key ? "pointer" : "default",
          justifyContent: i === cols.length - 1 ? "flex-end" : "flex-start",
        }}>
          {c.label}
          {c.key && <ChevronDown style={{ width: 8, height: 8, color: C.t3 }} />}
        </div>
      ))}
    </div>
  );
}

function MemberRow({ m, isPrev, onPreview, onMessage, isLast }) {
  const visitCol = m.ds >= 14 ? C.red : m.ds <= 1 ? C.cyan : C.t2;
  const appCol   = m.appDays >= 10 ? C.red : m.appDays <= 1 ? C.cyan : C.t2;
  const appLabel = m.appDays === 0 ? "Today" : m.appDays === 1 ? "Yesterday" : `${m.appDays}d ago`;
  const s        = statusSty(m.status);

  return (
    <div
      onClick={() => onPreview(m)}
      style={{
        display: "grid", gridTemplateColumns: GRID, gap: 12,
        padding: "11px 18px", alignItems: "center", cursor: "pointer",
        background: isPrev ? "#1a1a1e" : "transparent",
        borderBottom: isLast ? "none" : `1px solid ${C.brd}`,
        borderLeft: `2px solid ${isPrev ? C.cyan : "transparent"}`,
        transition: "background 0.1s", fontFamily: FONT,
      }}
      onMouseEnter={e => { if (!isPrev) e.currentTarget.style.background = C.card; }}
      onMouseLeave={e => { e.currentTarget.style.background = isPrev ? "#1a1a1e" : "transparent"; }}
    >
      {/* Member */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Av m={m} size={30} />
          {m.streak >= 5 && (
            <div style={{ position: "absolute", top: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame style={{ width: 7, height: 7, color: C.amber }} />
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isPrev ? C.cyan : C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1 }}>{m.plan}</div>
        </div>
      </div>

      {/* Status badge */}
      <div>
        <span style={{ padding: "3px 8px", borderRadius: 20, background: s.bg, border: `1px solid ${s.brd}`, fontSize: 10, fontWeight: 700, color: s.col, whiteSpace: "nowrap" }}>
          {m.status}
        </span>
      </div>

      {/* Last gym visit */}
      <div>
        <div style={{ fontSize: 11, color: C.t3, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gym</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: visitCol }}>{lastLabel(m.ds)}</div>
      </div>

      {/* Last app engagement */}
      <div>
        <div style={{ fontSize: 11, color: C.t3, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>App</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: appCol }}>{appLabel}</div>
      </div>

      {/* Action dropdown */}
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionDropdown member={m} onMessage={onMessage} />
      </div>
    </div>
  );
}

/* ─── FILTER TABS ────────────────────────────────────────────── */
function FilterTabs({ filter, setFilter, counts }) {
  const tabs = [
    { id:"all",      label:"All",      count:counts.all                 },
    { id:"atRisk",   label:"At Risk",  count:counts.atRisk,  dot:C.red   },
    { id:"dropping", label:"Dropping", count:counts.dropping, dot:C.amber },
    { id:"new",      label:"New",      count:counts.new,     dot:C.blue  },
    { id:"active",   label:"Active",   count:counts.active,  dot:C.cyan  },
    { id:"inactive", label:"Inactive", count:counts.inactive              },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, borderBottom: `1px solid ${C.brd}`, padding: "0 18px", background: C.card, fontFamily: FONT, flexShrink: 0 }}>
      {tabs.map(t => {
        const on = filter === t.id;
        return (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "9px 10px",
            cursor: "pointer", background: "transparent", border: "none",
            borderBottom: on ? `2px solid ${C.cyan}` : "2px solid transparent",
            color: on ? C.t1 : C.t2, fontSize: 12, fontWeight: on ? 700 : 400,
            fontFamily: FONT, transition: "color .15s",
          }}>
            {t.dot && <div style={{ width: 5, height: 5, borderRadius: "50%", background: t.dot, opacity: on ? 1 : 0.5 }} />}
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 9.5, color: on ? C.t2 : C.t3 }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── CHART TOOLTIP ──────────────────────────────────────────── */
function ChartTip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111c2a", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "5px 10px", fontSize: 11.5, color: C.t1 }}>
      <span style={{ color: C.cyan, fontWeight: 700 }}>{payload[0].value}{suffix}</span>
    </div>
  );
}

/* ─── RIGHT PANEL ────────────────────────────────────────────── */
function RightPanel({ members }) {
  const total  = members.length;
  const active = members.filter(m => m.ds <= 7).length;
  const atRisk = members.filter(m => m.churn >= 60).length;
  const newM   = members.filter(m => m.seg === "new").length;
  const avgMv  = Math.round(members.reduce((s, m) => s + m.mv, 0) / members.length);

  return (
    <div style={{
      width: 240, flexShrink: 0, background: C.sidebar,
      borderLeft: `1px solid ${C.brd}`,
      display: "flex", flexDirection: "column", overflowY: "auto",
      fontFamily: FONT,
    }}>

      {/* Total members */}
      <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Members</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontSize: 38, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1 }}>{total}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: C.cyan, fontWeight: 600, marginBottom: 4 }}>
            <ArrowUpRight style={{ width: 13, height: 13 }} /> +12%
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>vs last month</div>
      </div>

      {/* Mini stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: C.brd, borderBottom: `1px solid ${C.brd}` }}>
        {[
          { label: "Active",  val: active,  col: C.cyan, pct: "+8%",  up: true  },
          { label: "At Risk", val: atRisk,  col: C.red,  pct: "-2%",  up: false },
          { label: "New",     val: newM,    col: C.blue, pct: "+24%", up: true  },
          { label: "Avg/mo",  val: `$${avgMv}`, col: C.t1, pct: "+5%", up: true },
        ].map((s, i) => (
          <div key={i} style={{ padding: "12px 14px", background: C.sidebar }}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: s.up ? C.cyan : C.red, marginTop: 4 }}>
              {s.up ? <ArrowUpRight style={{ width: 10, height: 10 }} /> : <ArrowDownRight style={{ width: 10, height: 10 }} />}
              {s.pct}
            </div>
          </div>
        ))}
      </div>

      {/* Visit trend */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Visit Trend</span>
          <span style={{ fontSize: 10, color: C.t3 }}>6mo</span>
        </div>
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={VISIT_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip suffix=" visits" />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#vg)" dot={false}
              activeDot={{ r: 3, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 1, background: C.brd }} />

      {/* Churn risk trend */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Churn Risk</span>
          <span style={{ fontSize: 10, color: C.t3 }}>6mo avg</span>
        </div>
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={CHURN_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} domain={[0,60]} />
            <Tooltip content={<ChartTip suffix="%" />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#cg)" dot={false}
              activeDot={{ r: 3, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 1, background: C.brd }} />

      {/* Drop-off peaks */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 12 }}>Drop-off Peaks</div>
        {[
          { label: "Week 1", pct: 26 },
          { label: "Week 2", pct: 66 },
          { label: "Week 4", pct: 41 },
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.t2, width: 38, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, height: 3, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${b.pct}%`, height: "100%", background: C.cyan, borderRadius: 2, opacity: 0.65 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.t2, width: 24, textAlign: "right" }}>{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MEMBER PREVIEW ─────────────────────────────────────────── */
function MemberPreview({ m, onClose, onMessage }) {
  if (!m) return null;
  return (
    <div style={{
      position: "fixed", top: 0, right: 240, bottom: 0, width: 264,
      background: C.sidebar, borderLeft: `1px solid ${C.brd}`,
      zIndex: 200, display: "flex", flexDirection: "column",
      boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", fontFamily: FONT,
    }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Av m={m} size={34} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{m.name}</div>
            <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>{m.plan} · {m.vt} visits</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${C.brd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X style={{ width: 10, height: 10, color: C.t3 }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { label: "Last Visit",  val: lastLabel(m.ds),   col: m.ds >= 14 ? C.red : m.ds <= 1 ? C.cyan : C.t1 },
            { label: "App",         val: m.appDays === 0 ? "Today" : `${m.appDays}d ago`, col: m.appDays >= 10 ? C.red : m.appDays <= 1 ? C.cyan : C.t1 },
            { label: "This Month",  val: `${m.v30} visits`, col: C.t1 },
            { label: "Churn Risk",  val: `${m.churn}%`,     col: m.churn >= 70 ? C.red : m.churn >= 40 ? C.amber : C.green },
          ].map((s, i) => (
            <div key={i} style={{ padding: "10px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.col }}>{s.val}</div>
            </div>
          ))}
        </div>

        {m.streak > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <Flame style={{ width: 13, height: 13, color: C.amber, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.amber }}>{m.streak}-day streak</span>
          </div>
        )}

        <div style={{ padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}` }}>
          <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Recommended Action</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, marginBottom: 6 }}>{m.action}</div>
          <div style={{ height: 2, background: C.brd, borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ width: `${m.rc}%`, height: "100%", background: C.cyan, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10.5, color: C.t3 }}>{m.rc}% predicted success</div>
        </div>
      </div>

      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.brd}` }}>
        <button onClick={() => onMessage(m)} style={{
          width: "100%", padding: "9px", borderRadius: 8,
          background: C.cyan, border: "none", color: "#000",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          fontFamily: FONT,
        }}>
          <Send style={{ width: 11, height: 11 }} /> {m.action}
        </button>
      </div>
    </div>
  );
}

/* ─── MESSAGE TOAST ──────────────────────────────────────────── */
function MessageToast({ member, onClose }) {
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState(
    member ? `Hey ${member.name.split(" ")[0]}, we've missed you at the gym. Your progress is waiting — come back and pick up where you left off.` : ""
  );
  if (!member) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      width: 330, background: C.sidebar, border: `1px solid ${C.brd2}`,
      borderRadius: 11, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      zIndex: 300, overflow: "hidden", fontFamily: FONT,
    }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Bell style={{ width: 11, height: 11, color: C.t3 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Push notification</span>
          <span style={{ fontSize: 10.5, color: C.t3 }}>→ {member.name.split(" ")[0]}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <X style={{ width: 11, height: 11, color: C.t3 }} />
        </button>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} style={{
          width: "100%", boxSizing: "border-box",
          background: C.card, border: `1px solid ${C.brd}`,
          borderRadius: 7, padding: "9px 11px",
          fontSize: 11.5, color: C.t1, resize: "none", outline: "none", lineHeight: 1.6,
          fontFamily: FONT,
        }} />
        <div style={{ marginTop: 4, fontSize: 10.5, color: C.t3 }}>{member.rc}% predicted return rate</div>
        <button onClick={() => { setSent(true); setTimeout(onClose, 1600); }} style={{
          marginTop: 9, width: "100%", padding: "8px", borderRadius: 8, border: "none",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: sent ? C.card : C.cyan, color: sent ? C.cyan : "#000",
          transition: "all 0.2s", fontFamily: FONT,
        }}>
          {sent ? <><Check style={{ width: 11, height: 11 }} /> Sent</> : <><Send style={{ width: 11, height: 11 }} /> Send to {member.name.split(" ")[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function MembersPageAI() {
  const members = MEMBERS;
  const [filter,    setFilter]    = useState("all");
  const [sort,      setSort]      = useState("lastVisit");
  const [preview,   setPreview]   = useState(null);
  const [msgTarget, setMsgTarget] = useState(null);

  const counts = useMemo(() => ({
    all:      members.length,
    atRisk:   members.filter(m => m.churn >= 60).length,
    dropping: members.filter(m => m.pv30 > 0 && m.v30 <= m.pv30 * 0.5).length,
    new:      members.filter(m => m.seg === "new").length,
    active:   members.filter(m => m.streak >= 5).length,
    inactive: members.filter(m => m.ds >= 14).length,
  }), [members]);

  const visible = useMemo(() => {
    let list = [...members];
    if (filter === "atRisk")   list = list.filter(m => m.churn >= 60);
    if (filter === "dropping") list = list.filter(m => m.pv30 > 0 && m.v30 <= m.pv30 * 0.5);
    if (filter === "new")      list = list.filter(m => m.seg === "new");
    if (filter === "active")   list = list.filter(m => m.streak >= 5);
    if (filter === "inactive") list = list.filter(m => m.ds >= 14);
    return list.sort((a, b) =>
      sort === "name"  ? a.name.localeCompare(b.name) :
      sort === "churn" ? b.churn - a.churn :
      a.ds - b.ds
    );
  }, [members, filter, sort]);

  const handleMsg = useCallback(m => { setMsgTarget(m); setPreview(null); }, []);

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.t1, fontFamily: FONT, overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Center */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {/* Page header */}
            <div style={{ padding: "14px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
                  Members <span style={{ color: C.t3, fontWeight: 300 }}>/</span> <span style={{ color: C.cyan }}>CRM</span>
                </div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>AI-powered retention</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={sort} onChange={e => setSort(e.target.value)} style={{
                  padding: "6px 10px", borderRadius: 7, background: C.card, border: `1px solid ${C.brd}`,
                  color: C.t2, fontSize: 11.5, outline: "none", cursor: "pointer", fontFamily: FONT,
                }}>
                  <option value="lastVisit">Last visit</option>
                  <option value="churn">Highest risk</option>
                  <option value="name">Name A–Z</option>
                </select>
                <button style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                  borderRadius: 7, background: C.cyan, border: "none",
                  color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                }}>
                  <Plus style={{ width: 12, height: 12 }} /> Invite Member
                </button>
              </div>
            </div>

            <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />

            {/* Table */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <TableHead sort={sort} setSort={setSort} />
              {visible.length === 0 ? (
                <div style={{ padding: "48px 16px", textAlign: "center" }}>
                  <Users style={{ width: 28, height: 28, color: C.t3, margin: "0 auto 10px", display: "block" }} />
                  <div style={{ fontSize: 13, color: C.t2 }}>No members match</div>
                </div>
              ) : visible.map((m, i) => (
                <MemberRow
                  key={m.id} m={m}
                  isPrev={preview?.id === m.id}
                  onPreview={mm => setPreview(preview?.id === mm.id ? null : mm)}
                  onMessage={handleMsg}
                  isLast={i === visible.length - 1}
                />
              ))}

              {/* Pagination */}
              <div style={{ padding: "8px 18px", borderTop: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[ChevronLeft, ChevronRight].map((Icon, i) => (
                    <button key={i} style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.4 }}>
                      <Icon style={{ width: 10, height: 10, color: C.t2 }} />
                    </button>
                  ))}
                  <button style={{ width: 24, height: 24, borderRadius: 6, background: C.cyanD, border: `1px solid ${C.cyanB}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.cyan }}>1</button>
                </div>
                <span style={{ fontSize: 10.5, color: C.t3 }}>{visible.length} members</span>
              </div>
            </div>
          </div>

          <RightPanel members={members} />
        </div>
      </div>

      {preview   && <MemberPreview m={preview} onClose={() => setPreview(null)} onMessage={handleMsg} />}
      {msgTarget && <MessageToast member={msgTarget} onClose={() => setMsgTarget(null)} />}
    </div>
  );
}
