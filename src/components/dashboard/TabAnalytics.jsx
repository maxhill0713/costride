/**
 * TabAnalytics — Forge Fitness design system
 * Clean, minimal, owner-focused analytics.
 * Dependencies: recharts, lucide-react
 */

import { useState, useMemo } from "react";
import {
  LayoutDashboard, Users, FileText, BarChart2, Zap, Settings,
  Eye, QrCode, BrainCircuit, MessageCircle, TrendingUp,
  TrendingDown, ArrowUpRight, ArrowDownRight, Activity,
  AlertTriangle, Shield, Clock, Calendar, Target, Send,
  ChevronRight, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, LineChart, Line,
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
  amberD:  "rgba(245,158,11,0.1)",
  green:   "#22c55e",
  greenD:  "rgba(34,197,94,0.1)",
  blue:    "#3b82f6",
};
const FONT = "'DM Sans','Segoe UI',sans-serif";
const tick = { fill: C.t3, fontSize: 9.5, fontFamily: FONT };

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const CHECK_IN_TREND = [
  { w: "W1 Jan", v: 112 }, { w: "W2",     v: 128 }, { w: "W3",     v: 119 },
  { w: "W4",     v: 134 }, { w: "W1 Feb", v: 141 }, { w: "W2",     v: 136 },
  { w: "W3",     v: 158 }, { w: "W4",     v: 162 }, { w: "W1 Mar", v: 170 },
  { w: "W2",     v: 155 }, { w: "W3",     v: 178 }, { w: "W4 Apr", v: 192 },
];

const RETENTION_TREND = [
  { m: "Nov", ret: 71, churn: 18 }, { m: "Dec", ret: 74, churn: 15 },
  { m: "Jan", ret: 78, churn: 14 }, { m: "Feb", ret: 76, churn: 16 },
  { m: "Mar", ret: 82, churn: 11 }, { m: "Apr", ret: 88, churn: 8  },
];

const MEMBER_GROWTH = [
  { m: "Nov", new: 6  }, { m: "Dec", new: 9  }, { m: "Jan", new: 14 },
  { m: "Feb", new: 11 }, { m: "Mar", new: 18 }, { m: "Apr", new: 22 },
];

const DROP_OFF = [
  { label: "Week 1–2", count: 12 },
  { label: "Week 3–4", count: 8  },
  { label: "Month 2",  count: 5  },
  { label: "Month 3+", count: 3  },
];

const PEAK_DAYS = [
  { day: "Mon", pct: 68 }, { day: "Tue", pct: 82 }, { day: "Wed", pct: 74 },
  { day: "Thu", pct: 91 }, { day: "Fri", pct: 78 }, { day: "Sat", pct: 55 },
  { day: "Sun", pct: 38 },
];

const PEAK_HOURS = [
  { h: "6–7a",  v: 14 }, { h: "7–8a",  v: 28 }, { h: "8–9a",  v: 22 },
  { h: "12–1p", v: 18 }, { h: "5–6p",  v: 34 }, { h: "6–7p",  v: 42 },
  { h: "7–8p",  v: 38 }, { h: "8–9p",  v: 20 },
];

const SEGMENTS = [
  { label: "Super active", sub: "15+ visits/mo", val: 8,  col: C.cyan,  pct: 21 },
  { label: "Active",       sub: "8–14 visits",   val: 14, col: C.blue,  pct: 37 },
  { label: "Casual",       sub: "1–7 visits",    val: 11, col: C.t2,    pct: 29 },
  { label: "Disengaged",   sub: "No visits",     val: 5,  col: C.amber, pct: 13 },
];

const TOP_CLASSES = [
  { name: "HIIT Circuit",    fill: 94, avg: 19, trend: +12 },
  { name: "Morning Flow",    fill: 78, avg: 16, trend: +4  },
  { name: "Strength Forge",  fill: 71, avg: 14, trend: -3  },
  { name: "Spin Express",    fill: 55, avg: 11, trend: +8  },
  { name: "Recovery Yoga",   fill: 38, avg: 8,  trend: -7  },
];

const CHURN_MEMBERS = [
  { name: "Marcus Webb",   days: 22, risk: 84 },
  { name: "Devon Osei",    days: 19, risk: 78 },
  { name: "Priya Sharma",  days: 16, risk: 71 },
  { name: "Sam Rivera",    days: 14, risk: 55 },
];

/* ─── HELPERS ────────────────────────────────────────────────── */
function riskCol(p) { return p >= 70 ? C.red : p >= 40 ? C.amber : C.green; }
function fillCol(p) { return p >= 75 ? C.cyan : p < 40 ? C.red : C.t2; }

/* ─── SHARED TOOLTIP ─────────────────────────────────────────── */
function Tip({ active, payload, label, suffix = "", prefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111c2a", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "5px 10px", fontSize: 11.5, color: C.t1, fontFamily: FONT }}>
      {label && <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.cyan, fontWeight: 700 }}>{prefix}{p.value}{suffix}</div>
      ))}
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: "Overview"    },
  { Icon: Eye,             label: "Views"       },
  { Icon: Users,           label: "Members"     },
  { Icon: FileText,        label: "Content"     },
  { Icon: BarChart2,       label: "Analytics", active: true },
  { Icon: MessageCircle,   label: "Community"   },
  { Icon: Zap,             label: "Automations" },
  { Icon: BrainCircuit,    label: "AI Coach"    },
];

function Sidebar() {
  return (
    <div style={{ width: 188, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", height: "100vh", fontFamily: FONT }}>
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
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 7, cursor: "pointer", marginBottom: 1, background: item.active ? C.cyanD : "transparent", borderLeft: item.active ? `2px solid ${C.cyan}` : "2px solid transparent", color: item.active ? C.t1 : C.t2, fontSize: 12.5, fontWeight: item.active ? 600 : 400 }}>
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
function TopBar({ range, setRange }) {
  const ranges = ["7D", "30D", "90D", "6M"];
  return (
    <div style={{ height: 46, background: C.sidebar, borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", gap: 12, flexShrink: 0, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>Analytics</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, fontSize: 11.5, color: C.t2 }}>
          📅 Friday 10 April 2026
        </div>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {ranges.map(r => (
          <button key={r} onClick={() => setRange(r)} style={{ padding: "5px 11px", borderRadius: 6, cursor: "pointer", background: range === r ? C.cyanD : "transparent", border: range === r ? `1px solid ${C.cyanB}` : `1px solid transparent`, color: range === r ? C.cyan : C.t3, fontSize: 11.5, fontWeight: range === r ? 700 : 400, fontFamily: FONT }}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── KPI STRIP ──────────────────────────────────────────────── */
function KpiCard({ label, value, sub, trend, trendLabel, accent }) {
  const up = trend > 0, down = trend < 0;
  const trendColor = up ? C.cyan : down ? C.red : C.t3;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || C.t1, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: trendColor, fontWeight: 600, marginTop: 6 }}>
          {up ? <ArrowUpRight style={{ width: 11, height: 11 }} /> : down ? <ArrowDownRight style={{ width: 11, height: 11 }} /> : null}
          {up ? "+" : ""}{trend}% {trendLabel || "vs last month"}
        </div>
      )}
    </div>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────── */
function SLabel({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>{children}</span>
      {right && <span style={{ fontSize: 10.5, color: C.t3 }}>{right}</span>}
    </div>
  );
}

/* ─── DIVIDER ────────────────────────────────────────────────── */
const Div = () => <div style={{ height: 1, background: C.brd, margin: "0 -16px" }} />;

/* ─── CARD WRAPPER ───────────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "16px", ...style }}>
      {children}
    </div>
  );
}

/* ─── CHECK-IN TREND CHART ───────────────────────────────────── */
function CheckInChart() {
  return (
    <Card>
      <SLabel right="12-week rolling">Check-in Trend</SLabel>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: C.cyan, letterSpacing: "-0.03em", lineHeight: 1 }}>192</span>
        <span style={{ fontSize: 12, color: C.cyan, fontWeight: 600 }}>+12% this week</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={CHECK_IN_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="cig" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.cyan} stopOpacity={0.3} />
              <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="w" tick={tick} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={tick} axisLine={false} tickLine={false} domain={[80, 220]} />
          <Tooltip content={<Tip suffix=" check-ins" />} />
          <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#cig)" dot={false}
            activeDot={{ r: 4, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ─── RETENTION CHART ────────────────────────────────────────── */
function RetentionChart() {
  return (
    <Card>
      <SLabel right="6 months">Retention vs Churn Rate</SLabel>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.cyan, letterSpacing: "-0.03em", lineHeight: 1 }}>88%</div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 3 }}>Retention rate</div>
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.red, letterSpacing: "-0.03em", lineHeight: 1 }}>8%</div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 3 }}>Churn rate</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 11, color: C.cyan, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
            <ArrowUpRight style={{ width: 11, height: 11 }} /> Best month yet
          </div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>vs 82% in March</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={RETENTION_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="m" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: "#111c2a", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, fontFamily: FONT }}>
                <div style={{ color: C.t3, marginBottom: 3 }}>{label}</div>
                {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}%</div>)}
              </div>
            );
          }} />
          <Line type="monotone" dataKey="ret"   name="Retention" stroke={C.cyan} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.cyan,  stroke: C.card, strokeWidth: 2 }} />
          <Line type="monotone" dataKey="churn" name="Churn"     stroke={C.red}  strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.red,   stroke: C.card, strokeWidth: 2 }} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
        {[{ col: C.cyan, label: "Retention" }, { col: C.red, label: "Churn" }].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.t3 }}>
            <div style={{ width: 18, height: 2, background: l.col, borderRadius: 1 }} /> {l.label}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── MEMBER GROWTH ──────────────────────────────────────────── */
function MemberGrowthChart() {
  return (
    <Card>
      <SLabel right="monthly sign-ups">Member Growth</SLabel>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: C.cyan, letterSpacing: "-0.03em" }}>22</span>
        <span style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>new this month</span>
        <span style={{ fontSize: 11, color: C.t3, marginLeft: "auto" }}>+22% vs Mar</span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={MEMBER_GROWTH} barSize={18} margin={{ top: 2, right: 4, bottom: 0, left: -28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="m" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip suffix=" new members" />} />
          <Bar dataKey="new" radius={[3, 3, 0, 0]}>
            {MEMBER_GROWTH.map((d, i) => (
              <Cell key={i} fill={i === MEMBER_GROWTH.length - 1 ? C.cyan : C.cyan + "50"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ─── DROP-OFF PATTERN ───────────────────────────────────────── */
function DropOffChart() {
  const max = Math.max(...DROP_OFF.map(d => d.count));
  return (
    <Card>
      <SLabel>When Members Drop Off</SLabel>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 14, lineHeight: 1.5 }}>
        Most drop-off happens in <span style={{ color: C.amber, fontWeight: 600 }}>weeks 1–2</span> — a targeted welcome sequence recovers ~30%
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DROP_OFF.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: C.t2, width: 64, flexShrink: 0 }}>{d.label}</span>
            <div style={{ flex: 1, height: 6, background: C.brd, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(d.count / max) * 100}%`, height: "100%", background: i === 0 ? C.amber : C.cyan, borderRadius: 3, opacity: i === 0 ? 1 : 0.5 }} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: i === 0 ? C.amber : C.t2, width: 24, textAlign: "right" }}>{d.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── PEAK DAYS BAR ──────────────────────────────────────────── */
function PeakDaysChart() {
  const max = Math.max(...PEAK_DAYS.map(d => d.pct));
  return (
    <Card>
      <SLabel>Busiest Days</SLabel>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
        {PEAK_DAYS.map((d, i) => {
          const isPeak = d.pct === max;
          const h = Math.round((d.pct / max) * 72);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: h, background: isPeak ? C.cyan : C.cyan + "30", borderRadius: "3px 3px 0 0", transition: "height 0.3s" }} />
              <span style={{ fontSize: 9.5, color: isPeak ? C.cyan : C.t3, fontWeight: isPeak ? 700 : 400 }}>{d.day}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 10.5, color: C.t3 }}>
        Peak: <span style={{ color: C.cyan, fontWeight: 600 }}>Thursday</span> · Quietest: <span style={{ color: C.t2 }}>Sunday</span>
      </div>
    </Card>
  );
}

/* ─── PEAK HOURS ─────────────────────────────────────────────── */
function PeakHoursChart() {
  const max = Math.max(...PEAK_HOURS.map(d => d.v));
  return (
    <Card>
      <SLabel>Peak Hours</SLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {PEAK_HOURS.map((d, i) => {
          const isPeak = d.v === max;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10.5, color: isPeak ? C.t1 : C.t2, width: 36, flexShrink: 0, fontWeight: isPeak ? 600 : 400 }}>{d.h}</span>
              <div style={{ flex: 1, height: 4, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(d.v / max) * 100}%`, height: "100%", background: isPeak ? C.cyan : C.cyan + "50", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10.5, fontWeight: isPeak ? 700 : 400, color: isPeak ? C.cyan : C.t3, width: 22, textAlign: "right" }}>{d.v}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── MEMBER SEGMENTS ────────────────────────────────────────── */
function MemberSegmentsCard() {
  return (
    <Card>
      <SLabel right="38 total">Member Segments</SLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {SEGMENTS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < SEGMENTS.length - 1 ? `1px solid ${C.brd}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.col, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{s.sub}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 60, height: 3, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", background: s.col, borderRadius: 2, opacity: 0.8 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, width: 18, textAlign: "right" }}>{s.val}</span>
              <span style={{ fontSize: 10.5, color: C.t3, width: 30, textAlign: "right" }}>{s.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── CLASS PERFORMANCE ──────────────────────────────────────── */
function ClassPerformanceCard() {
  return (
    <Card>
      <SLabel right="last 30 days">Class Performance</SLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 48px 52px", gap: 8, padding: "0 0 7px", borderBottom: `1px solid ${C.brd}`, marginBottom: 4 }}>
        {["CLASS", "AVG", "FILL", "TREND"].map((h, i) => (
          <div key={i} style={{ fontSize: 9, fontWeight: 600, color: C.t3, letterSpacing: "0.07em", textAlign: i > 0 ? "center" : "left" }}>{h}</div>
        ))}
      </div>
      {TOP_CLASSES.map((cls, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 48px 48px 52px", gap: 8, padding: "8px 0", borderBottom: i < TOP_CLASSES.length - 1 ? `1px solid ${C.brd}` : "none", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{cls.name}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, textAlign: "center" }}>{cls.avg}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: fillCol(cls.fill), textAlign: "center" }}>{cls.fill}%</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 11, fontWeight: 600, color: cls.trend > 0 ? C.cyan : C.red }}>
            {cls.trend > 0
              ? <TrendingUp style={{ width: 10, height: 10 }} />
              : <TrendingDown style={{ width: 10, height: 10 }} />}
            {cls.trend > 0 ? "+" : ""}{cls.trend}%
          </div>
        </div>
      ))}
    </Card>
  );
}

/* ─── AT-RISK CARD ───────────────────────────────────────────── */
function AtRiskCard() {
  const totalRev = CHURN_MEMBERS.length * 75;
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 2 }}>Churn Risk</div>
          <div style={{ fontSize: 10.5, color: C.t3 }}>{CHURN_MEMBERS.length} members need attention</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.red, letterSpacing: "-0.03em", lineHeight: 1 }}>£{totalRev}</div>
          <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>monthly risk</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {CHURN_MEMBERS.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < CHURN_MEMBERS.length - 1 ? `1px solid ${C.brd}` : "none" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Last seen {m.days}d ago</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: riskCol(m.risk) }}>{m.risk}%</div>
              <button style={{ padding: "3px 9px", borderRadius: 5, background: "transparent", border: `1px solid ${C.brd2}`, color: C.t2, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
                Nudge
              </button>
            </div>
          </div>
        ))}
      </div>
      <button style={{ marginTop: 12, width: "100%", padding: "8px", borderRadius: 7, background: C.redD, border: `1px solid ${C.redB}`, color: C.red, fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: FONT }}>
        <Send style={{ width: 10, height: 10 }} /> Message All At-Risk
      </button>
    </Card>
  );
}

/* ─── RETENTION FUNNEL ───────────────────────────────────────── */
function RetentionFunnelCard() {
  const stages = [
    { label: "Joined",      val: 38, pct: 100 },
    { label: "Week 1 visit", val: 31, pct: 82  },
    { label: "Month 1 active", val: 24, pct: 63 },
    { label: "Month 3 retained", val: 19, pct: 50 },
  ];
  return (
    <Card>
      <SLabel>Retention Funnel</SLabel>
      <div style={{ fontSize: 10.5, color: C.t3, marginBottom: 14 }}>
        Biggest drop: <span style={{ color: C.amber, fontWeight: 600 }}>Month 1 → Month 3 (−13%)</span>
      </div>
      {stages.map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: C.t1, fontWeight: i === 0 ? 700 : 400 }}>{s.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{s.val}</span>
              <span style={{ fontSize: 10.5, color: C.t3, width: 32, textAlign: "right" }}>{s.pct}%</span>
            </div>
          </div>
          <div style={{ height: 4, background: C.brd, borderRadius: 2, overflow: "hidden", marginBottom: i < stages.length - 1 ? 12 : 0 }}>
            <div style={{ width: `${s.pct}%`, height: "100%", background: s.pct === 100 ? C.cyan : s.pct >= 75 ? C.cyan + "cc" : s.pct >= 50 ? C.amber : C.red, borderRadius: 2 }} />
          </div>
          {i < stages.length - 1 && (
            <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 8, paddingLeft: 2 }}>
              ↓ {stages[i].pct - stages[i + 1].pct}% drop-off
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

/* ─── RIGHT PANEL ────────────────────────────────────────────── */
function RightPanel() {
  return (
    <div style={{ width: 244, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, fontFamily: FONT }}>
      <AtRiskCard />
      <MemberSegmentsCard />
      <PeakHoursChart />
      <RetentionFunnelCard />
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function TabAnalytics() {
  const [range, setRange] = useState("30D");

  return (
    <div style={{ background: C.bg, color: C.t1, fontFamily: FONT }}>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
                Analytics <span style={{ color: C.t3, fontWeight: 300 }}>/</span> <span style={{ color: C.cyan }}>Overview</span>
              </div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Your gym's performance at a glance</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: C.amberD, border: `1px solid rgba(245,158,11,0.25)`, fontSize: 11.5, color: C.amber, fontWeight: 600 }}>
              <AlertTriangle style={{ width: 11, height: 11 }} /> 4 members need attention
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <KpiCard label="Total Members"      value={38}    sub="2 new this week"     trend={+12}  accent={C.cyan} />
            <KpiCard label="Weekly Check-ins"   value={192}   sub="avg 27/day"          trend={+8}                  />
            <KpiCard label="Retention Rate"     value="88%"   sub="30-day cohort"       trend={+6}   accent={C.cyan} />
            <KpiCard label="Avg Monthly Value"  value="£82"   sub="per member"          trend={+5}                  />
          </div>

          {/* Main content + right panel */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

            {/* Left/center content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <CheckInChart />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <RetentionChart />
                <MemberGrowthChart />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <DropOffChart />
                <PeakDaysChart />
              </div>

              <ClassPerformanceCard />
            </div>

            <RightPanel />
          </div>
        </div>
    </div>
  );
}