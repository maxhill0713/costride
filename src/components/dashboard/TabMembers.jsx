/**
 * MembersPageAI — reskinned to match Forge Fitness Overview design system
 * Minimalistic · Cyan accent · DM Sans · Right sidebar with churn chart
 */
import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Users, UserPlus,
  Flame, Send, X, ChevronRight, ChevronDown, ChevronLeft, Search,
  Check, Bell, Activity, Star, Tag, MoreHorizontal, Plus,
  LayoutDashboard, FileText, BarChart2, Zap, Settings, Gift,
  ExternalLink, Eye, LogOut, QrCode, BookOpen, BrainCircuit, MessageCircle,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

/* ─── TOKENS — Forge Fitness palette ────────────────────────── */
const C = {
  bg:       "#0b0b0d",
  sidebar:  "#0f0f12",
  card:     "#141416",
  card2:    "#18181b",
  brd:      "#222226",
  brd2:     "#2a2a30",
  t1:       "#ffffff",
  t2:       "#8a8a94",
  t3:       "#444450",
  cyan:     "#00e5c8",
  cyanDim:  "rgba(0,229,200,0.08)",
  cyanBrd:  "rgba(0,229,200,0.22)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.12)",
  redBrd:   "rgba(255,77,109,0.3)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.12)",
  blue:     "#3b82f6",
  blueDim:  "rgba(59,130,246,0.12)",
  blueBrd:  "rgba(59,130,246,0.3)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.1)",
};

const FONT = "'DM Sans', 'Segoe UI', sans-serif";

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const NOW = new Date();
const daysAgo = (n) => new Date(NOW.getTime() - n * 864e5);

const MOCK_MEMBERS = [
  { id:"1", name:"Marcus Webb",    initials:"MW", ci:0, plan:"Premium", mv:120, lastVisit:daysAgo(22), ds:22,  v30:0,  pv30:8,  vt:47,  streak:0,  churn:84, jda:180, rc:38, reasons:["No visits in 22 days","Was averaging 8/mo → 0","Missed last 3 classes"],          action:"Send 'We miss you'",   status:"At risk",      seg:"atRisk"   },
  { id:"2", name:"Priya Sharma",   initials:"PS", ci:1, plan:"Monthly", mv:60,  lastVisit:daysAgo(16), ds:16,  v30:1,  pv30:4,  vt:31,  streak:0,  churn:71, jda:95,  rc:44, reasons:["16 days since last visit","Frequency down 75%","Usually comes Tues/Thurs"],     action:"Friendly check-in",    status:"Dropping off", seg:"atRisk"   },
  { id:"3", name:"Tyler Rhodes",   initials:"TR", ci:2, plan:"Monthly", mv:60,  lastVisit:daysAgo(9),  ds:9,   v30:1,  pv30:5,  vt:12,  streak:0,  churn:55, jda:28,  rc:52, reasons:["New member, not building habit","Only 1 visit this month","Week 4 — critical"], action:"Habit-building nudge", status:"New",          seg:"new"      },
  { id:"4", name:"Chloe Nakamura", initials:"CN", ci:3, plan:"Annual",  mv:90,  lastVisit:daysAgo(1),  ds:1,   v30:14, pv30:11, vt:203, streak:18, churn:4,  jda:420, rc:96, reasons:[],                                                                               action:"Challenge invite",     status:"Consistent",   seg:"active"   },
  { id:"5", name:"Devon Osei",     initials:"DO", ci:4, plan:"Monthly", mv:60,  lastVisit:daysAgo(19), ds:19,  v30:0,  pv30:3,  vt:8,   streak:0,  churn:78, jda:45,  rc:35, reasons:["19 days absent","Early-stage member at risk","Visited 3x then stopped"],         action:"Personal outreach",    status:"At risk",      seg:"atRisk"   },
  { id:"6", name:"Anya Petrov",    initials:"AP", ci:5, plan:"Premium", mv:120, lastVisit:daysAgo(0),  ds:0,   v30:9,  pv30:7,  vt:88,  streak:7,  churn:6,  jda:210, rc:94, reasons:[],                                                                               action:"Referral ask",         status:"Engaged",      seg:"active"   },
  { id:"7", name:"Jamie Collins",  initials:"JC", ci:6, plan:"Monthly", mv:60,  lastVisit:daysAgo(5),  ds:5,   v30:2,  pv30:4,  vt:19,  streak:0,  churn:42, jda:58,  rc:58, reasons:[],                                                                               action:"Motivate",             status:"Dropping off", seg:"inactive" },
  { id:"8", name:"Sam Rivera",     initials:"SR", ci:7, plan:"Monthly", mv:60,  lastVisit:null,        ds:999, v30:0,  pv30:0,  vt:1,   streak:0,  churn:91, jda:6,   rc:30, reasons:["Joined 6 days ago, 1 visit only","Critical first-week window","Has not returned"], action:"Week-1 welcome",       status:"New",          seg:"new"      },
];

const AV_COLORS = [
  "#6366f1","#14b8a6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#a855f7","#f97316",
];

const CHURN_TREND = [
  { m:"Nov", avg:28 }, { m:"Dec", avg:34 }, { m:"Jan", avg:40 },
  { m:"Feb", avg:35 }, { m:"Mar", avg:42 }, { m:"Apr", avg:31 },
];

const SEGMENT_DATA = [
  { label:"At Risk", count:3, color: C.red   },
  { label:"New",     count:2, color: C.blue  },
  { label:"Inactive",count:1, color: C.amber },
  { label:"Active",  count:2, color: C.cyan  },
];

/* ─── HELPERS ────────────────────────────────────────────────── */
function churnColor(p) { return p >= 70 ? C.red : p >= 40 ? C.amber : C.green; }
function statusStyle(s) {
  const m = {
    "At risk":      { bg:C.redDim,   brd:C.redBrd,   col:C.red   },
    "Dropping off": { bg:C.amberDim, brd:"rgba(245,158,11,0.3)", col:C.amber },
    "Consistent":   { bg:C.greenDim, brd:"rgba(34,197,94,0.3)",  col:C.green },
    "Engaged":      { bg:C.greenDim, brd:"rgba(34,197,94,0.3)",  col:C.green },
    "New":          { bg:C.blueDim,  brd:C.blueBrd,  col:C.blue  },
  };
  return m[s] || { bg:C.cyanDim, brd:C.cyanBrd, col:C.cyan };
}

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
function Av({ m, size = 26 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: AV_COLORS[m.ci % AV_COLORS.length] + "22",
      color: AV_COLORS[m.ci % AV_COLORS.length],
      fontSize: size * 0.33, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: `1.5px solid ${AV_COLORS[m.ci % AV_COLORS.length]}44`,
      fontFamily: "monospace",
    }}>{m.initials}</div>
  );
}

function Badge({ status }) {
  const s = statusStyle(status);
  return (
    <span style={{
      padding: "2px 7px", borderRadius: 20, display: "inline-block",
      background: s.bg, border: `1px solid ${s.brd}`,
      fontSize: 10, fontWeight: 700, color: s.col, whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

function Bar2({ value, color, h = 2 }) {
  return (
    <div style={{ height: h, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 2 }} />
    </div>
  );
}

function Cb({ checked, onChange }) {
  return (
    <div onClick={e => { e.stopPropagation(); onChange(); }} style={{
      width: 13, height: 13, borderRadius: 3, cursor: "pointer", flexShrink: 0,
      background: checked ? C.cyan : "transparent",
      border: `1.5px solid ${checked ? C.cyan : C.t3}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {checked && <Check size={7} color="#000" strokeWidth={3} />}
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: "Overview"    },
  { Icon: Eye,             label: "Views"       },
  { Icon: Users,           label: "Members",  active: true },
  { Icon: FileText,        label: "Content"      },
  { Icon: BarChart2,       label: "Analytics"    },
  { Icon: MessageCircle,   label: "Community"    },
  { Icon: Zap,             label: "Automations"  },
  { Icon: BrainCircuit,    label: "AI Coach"     },
];

function Sidebar() {
  return (
    <div style={{
      width: 188, flexShrink: 0, background: C.sidebar,
      borderRight: `1px solid ${C.brd}`,
      display: "flex", flexDirection: "column", height: "100vh",
      fontFamily: FONT,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "14px 14px 14px",
        borderBottom: `1px solid ${C.brd}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #00e5c8, #00a896)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>🔥</div>
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

/* ─── TOPBAR ─────────────────────────────────────────────────── */
function TopBar() {
  return (
    <div style={{
      height: 46, flexShrink: 0, background: C.sidebar,
      borderBottom: `1px solid ${C.brd}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 18px", gap: 12, fontFamily: FONT,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>Members / CRM</span>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`,
          borderRadius: 7, padding: "5px 10px", width: 200,
        }}>
          <Search style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t3 }}>Search members…</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
          borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`,
          fontSize: 11.5, color: C.t2, cursor: "pointer",
        }}>
          <span>📅</span> Friday 10 April 2026
        </div>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
          borderRadius: 7, background: "rgba(255,77,109,0.1)", border: `1px solid rgba(255,77,109,0.25)`,
          fontSize: 11.5, color: C.red, fontWeight: 600, cursor: "pointer",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} />
          3 At Risk
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
          borderRadius: 7, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
          color: C.cyan, fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <QrCode style={{ width: 11, height: 11 }} /> Scan QR
        </div>
      </div>
    </div>
  );
}

/* ─── TABLE ──────────────────────────────────────────────────── */
const GRID = "16px 1.7fr 100px 60px 80px 70px 70px 120px";

function MemberRow({ m, isSel, isPrev, onSelect, onPreview, onMessage, isLast }) {
  const trend = m.pv30 > 0 ? Math.round(((m.v30 - m.pv30) / m.pv30) * 100) : 0;
  const lastLabel = m.ds === 999 ? "Never" : m.ds === 0 ? "Today" : `${m.ds}d ago`;
  const lastColor = m.ds >= 14 ? C.red : m.ds <= 1 ? C.cyan : C.t1;

  return (
    <div
      onClick={() => onPreview(m)}
      style={{
        display: "grid", gridTemplateColumns: GRID, gap: 8,
        padding: "10px 16px", alignItems: "center", cursor: "pointer",
        background: isPrev ? C.card2 : "transparent",
        borderBottom: isLast ? "none" : `1px solid ${C.brd}`,
        borderLeft: `2px solid ${isPrev ? C.cyan : isSel ? "rgba(0,229,200,0.25)" : "transparent"}`,
        transition: "background 0.1s",
        fontFamily: FONT,
      }}
      onMouseEnter={e => { if (!isPrev) e.currentTarget.style.background = C.card; }}
      onMouseLeave={e => { e.currentTarget.style.background = isPrev ? C.card2 : "transparent"; }}
    >
      <Cb checked={isSel} onChange={() => onSelect(m.id)} />

      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Av m={m} size={26} />
          {m.streak >= 5 && (
            <div style={{
              position: "absolute", top: -2, right: -2, width: 11, height: 11,
              borderRadius: "50%", background: C.card,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Flame style={{ width: 7, height: 7, color: C.amber }} />
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: isPrev ? C.cyan : C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
          <div style={{ fontSize: 10.5, color: C.t2 }}>{m.plan} · {m.vt} visits</div>
        </div>
      </div>

      <div><Badge status={m.status} /></div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: churnColor(m.churn), fontVariantNumeric: "tabular-nums" }}>{m.churn}%</div>
        <div style={{ marginTop: 3 }}><Bar2 value={m.churn} color={churnColor(m.churn)} h={2} /></div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: lastColor }}>{lastLabel}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        {trend > 10  ? <><TrendingUp   style={{ width: 11, height: 11, color: C.cyan }} /><span style={{ fontSize: 10.5, color: C.cyan }}>+{trend}%</span></> :
         trend < -10 ? <><TrendingDown  style={{ width: 11, height: 11, color: C.red  }} /><span style={{ fontSize: 10.5, color: C.red  }}>{trend}%</span></> :
                       <span style={{ fontSize: 10.5, color: C.t3 }}>—</span>}
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>${m.mv}</div>
        <div style={{ fontSize: 9.5, color: C.t3 }}>/month</div>
      </div>

      <div onClick={e => e.stopPropagation()}>
        <button onClick={() => onMessage(m)} style={{
          display: "flex", alignItems: "center", gap: 4, padding: "4px 9px",
          borderRadius: 6, background: C.cyanDim,
          border: `1px solid ${C.cyanBrd}`,
          color: C.cyan, fontSize: 10.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          fontFamily: FONT,
        }}>
          {m.action} <ChevronRight style={{ width: 8, height: 8 }} />
        </button>
        <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>{m.rc}% success</div>
      </div>
    </div>
  );
}

/* ─── RIGHT SIDEBAR WITH CHART ───────────────────────────────── */
const ChurnTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#111c2a", border: `1px solid ${C.cyanBrd}`,
      borderRadius: 7, padding: "5px 10px", fontSize: 11.5, color: C.t1,
    }}>
      <span style={{ color: churnColor(payload[0].value), fontWeight: 700 }}>{payload[0].value}% avg churn</span>
    </div>
  );
};

function RightPanel({ members, onFilter, onMessage }) {
  const highRisk = members.filter(m => m.churn >= 60);

  return (
    <div style={{
      width: 252, flexShrink: 0, background: C.sidebar,
      borderLeft: `1px solid ${C.brd}`,
      padding: "16px 14px",
      display: "flex", flexDirection: "column", gap: 14,
      overflowY: "auto", fontFamily: FONT,
    }}>

      {/* Churn Risk Chart */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>Avg Churn Risk</span>
          <span style={{ fontSize: 10.5, color: C.t2 }}>6mo trend</span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={CHURN_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.red} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.red} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 9.5, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 9.5, fontFamily: FONT }} axisLine={false} tickLine={false} domain={[0, 60]} />
            <Tooltip content={<ChurnTip />} />
            <Area type="monotone" dataKey="avg" stroke={C.red} strokeWidth={2}
              fill="url(#cg)" dot={false}
              activeDot={{ r: 3, fill: C.red, strokeWidth: 2, stroke: C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Segment breakdown */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 10 }}>Member Segments</div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={SEGMENT_DATA} margin={{ top: 2, right: 4, bottom: 0, left: -28 }}>
            <XAxis dataKey="label" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background: "#111c2a", border: `1px solid ${C.brd2}`, borderRadius: 6, padding: "4px 9px", fontSize: 11, color: C.t1 }}>
                  <span style={{ fontWeight: 700 }}>{payload[0].payload.label}:</span> {payload[0].value}
                </div>
              );
            }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {SEGMENT_DATA.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 1, background: C.brd }} />

      {/* At-risk queue */}
      {highRisk.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>At-Risk Queue</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.t3, marginBottom: 10 }}>
            {highRisk.length} members · ${highRisk.reduce((s, m) => s + m.mv, 0)}/mo at risk
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {highRisk.slice(0, 3).map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Av m={m} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: C.t2 }}><span style={{ color: churnColor(m.churn) }}>{m.churn}%</span> · {m.rc}% success</div>
                </div>
                <button onClick={() => onMessage(m)} style={{
                  padding: "3px 8px", borderRadius: 5, cursor: "pointer",
                  background: "transparent", border: `1px solid ${C.brd2}`,
                  color: C.t2, fontSize: 10, fontWeight: 600, flexShrink: 0, fontFamily: FONT,
                }}>Nudge</button>
              </div>
            ))}
          </div>
          <button onClick={() => onFilter("atRisk")} style={{
            marginTop: 10, width: "100%", padding: "7px",
            borderRadius: 7, background: C.redDim, border: `1px solid ${C.redBrd}`,
            color: C.red, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            fontFamily: FONT,
          }}>
            <Send style={{ width: 10, height: 10 }} /> Message All At-Risk
          </button>
        </div>
      )}

      <div style={{ height: 1, background: C.brd }} />

      {/* Drop-off insight */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <TrendingDown style={{ width: 12, height: 12, color: C.t2 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>Drop-off Peaks</span>
        </div>
        {[
          { label: "Week 1", pct: 26, color: C.blue  },
          { label: "Week 2", pct: 66, color: C.red   },
          { label: "Week 4", pct: 41, color: C.amber },
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: C.t2, width: 40, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1 }}><Bar2 value={b.pct} color={b.color} h={4} /></div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.t2, width: 26, textAlign: "right" }}>{b.pct}%</span>
          </div>
        ))}
        <div style={{ marginTop: 10, fontSize: 10.5, color: C.t3, lineHeight: 1.6 }}>
          New members respond best in days 3–7. Engaged members refer at 3× the rate.
        </div>
      </div>
    </div>
  );
}

/* ─── MEMBER PREVIEW PANEL ───────────────────────────────────── */
function MemberPreview({ m, onClose, onMessage }) {
  if (!m) return null;
  const eng = Math.min(100, Math.round((m.v30 / 12) * 100));
  return (
    <div style={{
      position: "fixed", top: 0, right: 252, bottom: 0, width: 280,
      background: C.sidebar, borderLeft: `1px solid ${C.brd}`,
      zIndex: 200, display: "flex", flexDirection: "column",
      boxShadow: "-12px 0 32px rgba(0,0,0,0.5)",
      fontFamily: FONT,
    }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Av m={m} size={34} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 3 }}>{m.name}</div>
            <Badge status={m.status} />
          </div>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${C.brd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X style={{ width: 10, height: 10, color: C.t3 }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>

        {m.churn >= 40 && (
          <div style={{ padding: "11px 13px", borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, borderLeft: `2px solid ${churnColor(m.churn)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: churnColor(m.churn) }}>{m.churn}% churn risk</span>
              <span style={{ fontSize: 10.5, color: C.t3 }}>${m.mv}/mo</span>
            </div>
            <Bar2 value={m.churn} color={churnColor(m.churn)} h={2} />
            {m.reasons.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                {m.reasons.map((r, i) => (
                  <div key={i} style={{ fontSize: 10.5, color: C.t2, lineHeight: 1.5 }}>— {r}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: "This mo", val: m.v30  },
            { label: "Last mo", val: m.pv30 },
            { label: "Total",   val: m.vt   },
          ].map((s, i) => (
            <div key={i} style={{ padding: "9px 8px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: i === 2 ? C.cyan : C.t1, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9.5, color: C.t3, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Engagement</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: eng >= 60 ? C.cyan : eng >= 30 ? C.amber : C.red }}>{eng}%</span>
          </div>
          <Bar2 value={eng} color={eng >= 60 ? C.cyan : eng >= 30 ? C.amber : C.red} h={3} />
        </div>

        <div style={{ padding: "11px 13px", borderRadius: 9, background: C.card, border: `1px solid ${C.brd}` }}>
          <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Recommended Action</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{m.action}</div>
          <div style={{ fontSize: 10.5, color: C.t2 }}>{m.rc}% predicted success rate</div>
        </div>
      </div>

      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 6 }}>
        <button onClick={() => onMessage(m)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: "8px", borderRadius: 7, background: C.cyan, border: "none",
          color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
        }}>
          <Send style={{ width: 11, height: 11 }} /> {m.action}
        </button>
        <button style={{ padding: "8px 10px", borderRadius: 7, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, cursor: "pointer" }}>
          <MoreHorizontal style={{ width: 13, height: 13 }} />
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
      width: 340, background: C.sidebar, border: `1px solid ${C.brd2}`,
      borderRadius: 11, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      zIndex: 300, overflow: "hidden", fontFamily: FONT,
    }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Bell style={{ width: 11, height: 11, color: C.t3 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Push notification</span>
          <span style={{ fontSize: 10.5, color: C.t3 }}>→ {member.name.split(" ")[0]}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
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
          marginTop: 9, width: "100%", padding: "8px",
          borderRadius: 8, border: "none",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: sent ? C.card : C.cyan,
          color: sent ? C.cyan : "#000",
          transition: "all 0.2s", fontFamily: FONT,
        }}>
          {sent ? <><Check style={{ width: 11, height: 11 }} /> Sent</> : <><Send style={{ width: 11, height: 11 }} /> Send to {member.name.split(" ")[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── FILTER TABS ────────────────────────────────────────────── */
function FilterTabs({ filter, setFilter, counts }) {
  const tabs = [
    { id: "all",      label: "All",       count: counts.all      },
    { id: "atRisk",   label: "At Risk",   count: counts.atRisk,  dot: C.red   },
    { id: "dropping", label: "Dropping",  count: counts.dropping, dot: C.amber },
    { id: "new",      label: "New",       count: counts.new,     dot: C.blue  },
    { id: "active",   label: "Active",    count: counts.active,  dot: C.cyan  },
    { id: "inactive", label: "Inactive",  count: counts.inactive              },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 2,
      borderBottom: `1px solid ${C.brd}`, padding: "0 16px",
      background: C.card, fontFamily: FONT,
    }}>
      {tabs.map(t => {
        const on = filter === t.id;
        return (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "9px 10px", cursor: "pointer",
            background: "transparent", border: "none",
            borderBottom: on ? `2px solid ${C.cyan}` : "2px solid transparent",
            color: on ? C.t1 : C.t2,
            fontSize: 12, fontWeight: on ? 700 : 400,
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

/* ─── TABLE HEADER ───────────────────────────────────────────── */
function TableHead({ sort, setSort }) {
  const cols = [
    { label: "", key: null },
    { label: "MEMBER",    key: "name"      },
    { label: "STATUS",    key: null        },
    { label: "CHURN",     key: "churnDesc" },
    { label: "LAST SEEN", key: "lastVisit" },
    { label: "TREND",     key: null        },
    { label: "VALUE",     key: "value"     },
    { label: "ACTION",    key: null        },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: GRID, gap: 8,
      padding: "7px 16px", background: C.card,
      borderBottom: `1px solid ${C.brd}`, fontFamily: FONT,
    }}>
      <div />
      {cols.slice(1).map((c, i) => (
        <div key={i} onClick={() => c.key && setSort(c.key)} style={{
          display: "flex", alignItems: "center", gap: 3,
          fontSize: 9.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase",
          color: sort === c.key ? C.t2 : C.t3,
          cursor: c.key ? "pointer" : "default",
        }}>
          {c.label}
          {c.key && <ChevronDown style={{ width: 8, height: 8, color: C.t3 }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── BULK BAR ───────────────────────────────────────────────── */
function BulkBar({ selected, members, onClear, onMsg }) {
  if (selected.size === 0) return null;
  const sel = members.filter(m => selected.has(m.id));
  const tv  = sel.reduce((s, m) => s + m.mv, 0);
  return (
    <div style={{ padding: "8px 16px", background: C.card2, borderTop: `1px solid ${C.brd}`, display: "flex", alignItems: "center", gap: 8, fontFamily: FONT }}>
      <span style={{ fontSize: 11.5, color: C.t2, fontWeight: 600 }}>
        {selected.size} selected
        <span style={{ color: C.t3, fontWeight: 400 }}> · ${tv}/mo</span>
      </span>
      <button onClick={() => onMsg(sel[0])} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: C.cyan, border: "none", color: "#000", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>
        <Send style={{ width: 10, height: 10 }} /> Message {selected.size}
      </button>
      <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: C.t3, fontFamily: FONT }}>Clear</button>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: C.t3 }}>{sel.filter(m => m.churn >= 60).length} at risk in selection</span>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function MembersPageAI() {
  const members = MOCK_MEMBERS;
  const [filter, setFilter]       = useState("all");
  const [sort, setSort]           = useState("churnDesc");
  const [selected, setSelected]   = useState(new Set());
  const [preview, setPreview]     = useState(null);
  const [msgTarget, setMsgTarget] = useState(null);

  const counts = useMemo(() => ({
    all:      members.length,
    atRisk:   members.filter(m => m.churn >= 60).length,
    dropping: members.filter(m => m.pv30 > 0 && m.v30 <= m.pv30 * 0.5).length,
    new:      members.filter(m => m.jda <= 30).length,
    active:   members.filter(m => m.streak >= 5).length,
    inactive: members.filter(m => m.ds >= 14).length,
  }), [members]);

  const visible = useMemo(() => {
    let list = members;
    if (filter === "atRisk")   list = list.filter(m => m.churn >= 60);
    if (filter === "dropping") list = list.filter(m => m.pv30 > 0 && m.v30 <= m.pv30 * 0.5);
    if (filter === "new")      list = list.filter(m => m.jda <= 30);
    if (filter === "active")   list = list.filter(m => m.streak >= 5);
    if (filter === "inactive") list = list.filter(m => m.ds >= 14);
    return [...list].sort((a, b) =>
      sort === "lastVisit" ? a.ds - b.ds :
      sort === "value"     ? b.mv - a.mv :
      sort === "name"      ? a.name.localeCompare(b.name) :
      b.churn - a.churn
    );
  }, [members, filter, sort]);

  const toggleRow = useCallback(id =>
    setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; })
  , []);

  const handleMsg = useCallback(m => { setMsgTarget(m); setPreview(null); }, []);

  return (
    <div style={{ display: "flex", height: "100%", background: C.bg, color: C.t1, fontFamily: FONT, overflow: "hidden" }}>
      {/* Center */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Page header */}
        <div style={{ padding: "14px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.brd}` }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
              Members <span style={{ color: C.t3, fontWeight: 300 }}>/</span> <span style={{ color: C.cyan }}>CRM</span>
            </div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>AI-powered retention · know who needs you, act instantly</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              padding: "6px 10px", borderRadius: 7, background: C.card, border: `1px solid ${C.brd}`,
              color: C.t2, fontSize: 11.5, outline: "none", cursor: "pointer", fontFamily: FONT,
            }}>
              <option value="churnDesc">Highest risk</option>
              <option value="lastVisit">Recently active</option>
              <option value="value">Highest value</option>
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

        <div style={{ flex: 1, overflowY: "auto" }}>
          <TableHead sort={sort} setSort={setSort} />
          {visible.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center" }}>
              <Users style={{ width: 28, height: 28, color: C.t3, margin: "0 auto 10px", display: "block" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t2 }}>No members match</div>
            </div>
          ) : (
            visible.map((m, i) => (
              <MemberRow
                key={m.id} m={m}
                isSel={selected.has(m.id)}
                isPrev={preview?.id === m.id}
                onSelect={toggleRow}
                onPreview={mm => setPreview(preview?.id === mm.id ? null : mm)}
                onMessage={handleMsg}
                isLast={i === visible.length - 1}
              />
            ))
          )}
          <BulkBar selected={selected} members={members} onClear={() => setSelected(new Set())} onMsg={handleMsg} />
          <div style={{ padding: "8px 16px", borderTop: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[ChevronLeft, ChevronRight].map((Icon, i) => (
                <button key={i} style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.4 }}>
                  <Icon style={{ width: 10, height: 10, color: C.t2 }} />
                </button>
              ))}
              <button style={{ width: 24, height: 24, borderRadius: 6, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.cyan }}>1</button>
            </div>
            <span style={{ fontSize: 10.5, color: C.t3 }}>{visible.length} members · page 1 of 1</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <RightPanel members={members} onFilter={setFilter} onMessage={handleMsg} />

      {preview && <MemberPreview m={preview} onClose={() => setPreview(null)} onMessage={handleMsg} />}
      {msgTarget && <MessageToast member={msgTarget} onClose={() => setMsgTarget(null)} />}
    </div>
  );
}