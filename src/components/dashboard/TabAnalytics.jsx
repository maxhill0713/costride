/**
 * TabAnalytics — Forge Fitness
 * No sidebar/topbar — rendered inside existing dashboard shell.
 * Dependencies: recharts, lucide-react
 * Mobile responsive: stacks on ≤768px, desktop unchanged at ≥1024px
 */

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Activity, Zap, Send, BarChart2, Flame,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
} from "recharts";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:      "#0b0b0d",
  card:    "#0f1015",
  card2:   "#13131a",
  brd:     "#1c1c24",
  brd2:    "#242430",
  t1:      "#ffffff",
  t2:      "#8a8a94",
  t3:      "#444450",
  cyan:    "#00e5c8",
  cyanD:   "rgba(0,229,200,0.08)",
  cyanB:   "rgba(0,229,200,0.22)",
  red:     "#ff4d6d",
  redD:    "rgba(255,77,109,0.09)",
  redB:    "rgba(255,77,109,0.22)",
  amber:   "#f59e0b",
  amberD:  "rgba(245,158,11,0.09)",
  amberB:  "rgba(245,158,11,0.22)",
  green:   "#22c55e",
  greenD:  "rgba(34,197,94,0.09)",
  greenB:  "rgba(34,197,94,0.22)",
  blue:    "#3b82f6",
  blueD:   "rgba(59,130,246,0.09)",
  blueB:   "rgba(59,130,246,0.22)",
};
const FONT = "'DM Sans','Segoe UI',sans-serif";
const tick = { fill: "#444450", fontSize: 9.5, fontFamily: FONT };
const mono = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const VISIT_TREND = [
  { w: "W1 Jan", total: 112, avg: 2.9 }, { w: "W2", total: 128, avg: 3.4 },
  { w: "W3",     total: 119, avg: 3.1 }, { w: "W4", total: 134, avg: 3.5 },
  { w: "W1 Feb", total: 141, avg: 3.7 }, { w: "W2", total: 136, avg: 3.6 },
  { w: "W3",     total: 158, avg: 4.2 }, { w: "W4", total: 162, avg: 4.3 },
  { w: "W1 Mar", total: 170, avg: 4.5 }, { w: "W2", total: 155, avg: 4.1 },
  { w: "W3",     total: 178, avg: 4.7 }, { w: "W4 Apr", total: 192, avg: 5.1 },
];
const RETENTION_OVER_TIME = [
  { m: "Nov", w1: 68, m1: 54, m3: 41 }, { m: "Dec", m1: 57, w1: 71, m3: 44 },
  { m: "Jan", w1: 74, m1: 60, m3: 47 }, { m: "Feb", w1: 76, m1: 62, m3: 49 },
  { m: "Mar", w1: 80, m1: 67, m3: 53 }, { m: "Apr", w1: 84, m1: 72, m3: 58 },
];
const SEGMENTS_DATA = [
  { label: "Super Active", sub: "15+ visits/mo", val: 8,  pct: 21, trend: +3, col: C.cyan  },
  { label: "Consistent",   sub: "8–14 visits",   val: 14, pct: 37, trend: +1, col: C.blue  },
  { label: "Slipping",     sub: "3–7 visits",    val: 9,  pct: 24, trend: -4, col: C.amber },
  { label: "At Risk",      sub: "0–2 visits",    val: 7,  pct: 18, trend: -2, col: C.red   },
];
const SEGMENT_TREND_DATA = [
  { m: "Jan", super: 5,  cons: 11, slip: 12, risk: 10 },
  { m: "Feb", super: 6,  cons: 12, slip: 11, risk: 9  },
  { m: "Mar", super: 7,  cons: 13, slip: 10, risk: 8  },
  { m: "Apr", super: 8,  cons: 14, slip: 9,  risk: 7  },
];
const CLASS_DATA = [
  { name: "HIIT Circuit",   fill: 94, sessions: 12, trend: +12, peak: "6–7pm"  },
  { name: "Morning Flow",   fill: 78, sessions: 8,  trend: +4,  peak: "7–8am"  },
  { name: "Strength Forge", fill: 71, sessions: 10, trend: -3,  peak: "5–6pm"  },
  { name: "Spin Express",   fill: 55, sessions: 6,  trend: +8,  peak: "6–7am"  },
  { name: "Recovery Yoga",  fill: 38, sessions: 4,  trend: -7,  peak: "9–10am" },
];
const ENGAGEMENT_DATA = [
  { subject: "Check-ins",  A: 84 }, { subject: "Classes",    A: 61 },
  { subject: "Challenges", A: 47 }, { subject: "Community",  A: 38 },
  { subject: "App Usage",  A: 72 }, { subject: "Polls",      A: 29 },
];
const REVENUE_DATA = [
  { m: "Nov", retained: 2240, lost: 480, recovered: 160 },
  { m: "Dec", retained: 2360, lost: 400, recovered: 200 },
  { m: "Jan", retained: 2480, lost: 360, recovered: 240 },
  { m: "Feb", retained: 2400, lost: 420, recovered: 180 },
  { m: "Mar", retained: 2640, lost: 320, recovered: 260 },
  { m: "Apr", retained: 2760, lost: 240, recovered: 300 },
];
const CHURN_MEMBERS = [
  { name: "Marcus Webb",  days: 22, risk: 84, mv: 85 },
  { name: "Devon Osei",   days: 19, risk: 78, mv: 60 },
  { name: "Priya Sharma", days: 16, risk: 71, mv: 60 },
  { name: "Sam Rivera",   days: 14, risk: 55, mv: 60 },
];
const HOURS_DATA = [
  { h: "6am",  v: 14 }, { h: "7am",  v: 28 }, { h: "8am",  v: 22 },
  { h: "9am",  v: 16 }, { h: "12pm", v: 18 }, { h: "5pm",  v: 34 },
  { h: "6pm",  v: 42 }, { h: "7pm",  v: 38 }, { h: "8pm",  v: 20 },
];

/* ─── HELPERS ────────────────────────────────────────────────── */
const riskCol = p => p >= 70 ? C.red   : p >= 40 ? C.amber : C.green;
const fillCol = p => p >= 75 ? C.cyan  : p < 40  ? C.red   : C.t2;
const trendCol = t => t > 0  ? C.cyan  : t < 0   ? C.red   : C.t3;

/* ─── SHARED COMPONENTS ──────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: "14px", ...style }}>
      {children}
    </div>
  );
}
function SLabel({ children, right, sub }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{children}</span>
        {right && <span style={{ fontSize: 10, color: C.t3 }}>{right}</span>}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.t3, marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}
function Pill({ children, color = C.cyan }) {
  return (
    <span style={{
      padding: "2px 7px", borderRadius: 20, fontSize: 9.5, fontWeight: 700,
      color, background: color + "15", border: `1px solid ${color}33`, display: "inline-block",
    }}>{children}</span>
  );
}
function LineTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a0e18", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, fontFamily: FONT }}>
      <div style={{ color: C.t3, marginBottom: 3, fontSize: 9.5 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ color: C.t3, fontWeight: 400 }}>{p.name}</span>{p.value}%
        </div>
      ))}
    </div>
  );
}
function ChartTip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a0e18", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, fontFamily: FONT, minWidth: 100 }}>
      {label && <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 3 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.cyan, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: C.t3, fontWeight: 400 }}>{p.name || ""}</span>
          <span>{p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}
function RangeTab({ range, setRange }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {["7D", "30D", "90D", "6M"].map(r => (
        <button key={r} onClick={() => setRange(r)} style={{
          padding: "3px 9px", borderRadius: 5, cursor: "pointer",
          background: range === r ? C.cyanD : "transparent",
          border: range === r ? `1px solid ${C.cyanB}` : "1px solid transparent",
          color: range === r ? C.cyan : C.t3,
          fontSize: 10.5, fontWeight: range === r ? 700 : 400, fontFamily: FONT,
        }}>{r}</button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — KPI STRIP
═══════════════════════════════════════════════════════════════ */
function KpiStrip({ isMobile }) {
  const kpis = [
    { label: "Week 1 Return",    value: "84%",  trend: +4,  sub: "of new members return in 7d",  accent: C.cyan  },
    { label: "Month 3 Retained", value: "58%",  trend: +5,  sub: "long-term cohort health",       accent: C.cyan  },
    { label: "At Risk",          value: "7",    trend: -2,  sub: "£265/mo potential loss",        accent: C.red,  trendInvert: true },
    { label: "Avg Visits / Week",value: "5.1",  trend: +11, sub: "per member, up from 3.8",      accent: C.blue  },
  ];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
      gap: 9,
    }}>
      {kpis.map((k, i) => {
        const up   = k.trendInvert ? k.trend < 0 : k.trend > 0;
        const tCol = up ? C.cyan : C.red;
        return (
          <div key={i} style={{
            background: C.card,
            border: "none",
            borderRadius: 10,
            padding: isMobile ? "11px 12px" : "13px 14px",
          }}>
            <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase",
              letterSpacing: "0.09em", fontWeight: 700, marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{
              fontSize: isMobile ? 22 : 26,
              fontWeight: 700, color: C.t1,
              letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 7, ...mono,
            }}>
              {k.value}
            </div>
            <div style={{ fontSize: 10.5, color: tCol, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 3 }}>
              {up
                ? <ArrowUpRight   style={{ width: 10, height: 10 }} />
                : <ArrowDownRight style={{ width: 10, height: 10 }} />}
              {k.trend > 0 ? "+" : ""}{k.trend}% vs last month
            </div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 3 }}>{k.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — RETENTION FUNNEL
═══════════════════════════════════════════════════════════════ */
function RetentionFunnelSection({ isMobile }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12,
      alignItems: "stretch",
    }}>
      {/* SVG Funnel */}
      <Card style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 5 }}>
          <SLabel sub="Member journey from join day to long-term retention">
            Retention Funnel
          </SLabel>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 1 }}>Reach month 3</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em", lineHeight: 1, ...mono }}>58%</div>
          </div>
        </div>

        <svg viewBox="0 0 460 131" width="100%" style={{ display: "block" }}
          role="img" aria-label="Retention funnel">
          <polygon points="65,6 395,6 368,35 92,35"     fill={C.cyan} fillOpacity={0.82}/>
          <polygon points="92,35 368,35 347,64 113,64"  fill={C.cyan} fillOpacity={0.56}/>
          <polygon points="113,64 347,64 326,93 134,93" fill={C.cyan} fillOpacity={0.35}/>
          <polygon points="134,93 326,93 326,122 134,122" fill={C.cyan} fillOpacity={0.20}/>

          <line x1="92"  y1="35"  x2="368" y2="35"  stroke={C.bg} strokeWidth="2"/>
          <line x1="113" y1="64"  x2="347" y2="64"  stroke={C.bg} strokeWidth="2"/>
          <line x1="134" y1="93"  x2="326" y2="93"  stroke={C.bg} strokeWidth="2"/>

          <text x="57" y="18"  textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="700" fill={C.t1}>Joined</text>
          <text x="57" y="48"  textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="600" fill={C.t2}>Week 1</text>
          <text x="57" y="77"  textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="600" fill={C.t2}>Month 1</text>
          <text x="57" y="109" textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="600" fill={C.t2}>Month 3</text>

          <text x="230" y="18"  textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">38</text>
          <text x="230" y="27"  textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">100%</text>
          <text x="230" y="47"  textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">32</text>
          <text x="230" y="56"  textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">84% · 6 lost</text>
          <text x="230" y="77"  textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">27</text>
          <text x="230" y="86"  textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">71% · 5 lost</text>
          <text x="230" y="106" textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">22</text>
          <text x="230" y="115" textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">58% · 5 lost</text>

          <line x1="368" y1="35" x2="398" y2="35" stroke={C.amber} strokeWidth="1.5"/>
          <circle cx="398" cy="35" r="2.5" fill={C.amber}/>
          <text x="404" y="33" fontFamily={FONT} fontSize="10" fontWeight="700" fill={C.amber}>−16%</text>
          <text x="404" y="43" fontFamily={FONT} fontSize="8"  fill={C.amber}>biggest drop</text>
          <line x1="347" y1="64" x2="398" y2="64" stroke={C.t3} strokeWidth="1"/>
          <circle cx="398" cy="64" r="2" fill={C.t3}/>
          <text x="404" y="67" fontFamily={FONT} fontSize="9.5" fill={C.t3}>−13%</text>
          <line x1="326" y1="93" x2="398" y2="93" stroke={C.t3} strokeWidth="1"/>
          <circle cx="398" cy="93" r="2" fill={C.t3}/>
          <text x="404" y="96" fontFamily={FONT} fontSize="9.5" fill={C.t3}>−13%</text>
        </svg>

        <div style={{ marginTop: 9, padding: "8px 10px", borderRadius: 7,
          background: C.amberD, border: `1px solid ${C.amberB}` }}>
          <div style={{ fontSize: 10.5, color: C.amber, fontWeight: 700, marginBottom: 2 }}>
            Biggest opportunity — Week 1 drop-off
          </div>
          <div style={{ fontSize: 10, color: C.t2, lineHeight: 1.5 }}>
            16% of new members don't return after their first visit. A welcome sequence on days 3–7 could close this gap by up to 40%.
          </div>
        </div>
      </Card>

      {/* Trend lines */}
      <Card style={{ padding: "13px 14px", display: "flex", flexDirection: "column" }}>
        <SLabel right="6 months" sub="How each cohort milestone has improved month-on-month">
          Retention Rate Trends
        </SLabel>
        <div style={{ flex: 1, minHeight: isMobile ? 160 : 0 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : "100%"}>
            <LineChart data={RETENTION_OVER_TIME} margin={{ top: 4, right: 6, bottom: 0, left: -28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="m" tick={tick} axisLine={false} tickLine={false}/>
              <YAxis tick={tick} axisLine={false} tickLine={false} domain={[30, 100]}/>
              <Tooltip content={<LineTip/>}/>
              <Line type="monotone" dataKey="w1" name="Week 1"  stroke={C.cyan}        strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.cyan,  stroke: C.card, strokeWidth: 2 }}/>
              <Line type="monotone" dataKey="m1" name="Month 1" stroke={C.blue}        strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.blue,  stroke: C.card, strokeWidth: 2 }}/>
              <Line type="monotone" dataKey="m3" name="Month 3" stroke={C.cyan + "77"} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.cyan,  stroke: C.card, strokeWidth: 2 }} strokeDasharray="4 3"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, flexShrink: 0 }}>
          {[{ col: C.cyan, label: "Week 1" }, { col: C.blue, label: "Month 1" }, { col: C.cyan + "77", label: "Month 3" }].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.t3 }}>
              <div style={{ width: 14, height: 2, background: l.col, borderRadius: 1 }}/> {l.label}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3 — KEY INSIGHTS
═══════════════════════════════════════════════════════════════ */
function KeyInsights({ isMobile }) {
  const insights = [
    {
      icon: TrendingUp, color: C.cyan, bg: C.cyanD, brd: C.cyanB,
      title: "Week-1 habit is driving long-term retention",
      body: "Members who check in within their first 7 days are 3× more likely to still be active at month 3. Your week-1 rate improved from 68% → 84% over 6 months — this is your biggest retention lever.",
      tag: "Positive signal",
    },
    {
      icon: AlertTriangle, color: C.amber, bg: C.amberD, brd: C.amberB,
      title: "Month 1 → Month 3 is your biggest drop-off window",
      body: "You lose 13% of members between month 1 and month 3. A targeted challenge or personal check-in at week 6–8 can close this gap by up to 40%.",
      tag: "Needs attention",
    },
    {
      icon: Zap, color: C.blue, bg: C.blueD, brd: C.blueB,
      title: "Engaged members have 2× longer retention",
      body: "Members in at least one challenge/class per month stay 8.2 months vs 3.9 months for those who don't. Raising challenge participation from 47% → 65% could recover ~£180/month.",
      tag: "Opportunity",
    },
  ];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
      gap: 12,
    }}>
      {insights.map((ins, i) => (
        <div key={i} style={{
          background: C.card, border: `1px solid ${C.brd}`,
          borderLeft: `2px solid ${ins.color}`, borderRadius: 10, padding: "13px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
            <ins.icon style={{ width: 11, height: 11, color: ins.color, flexShrink: 0 }}/>
            <Pill color={ins.color}>{ins.tag}</Pill>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, lineHeight: 1.4, marginBottom: 5 }}>{ins.title}</div>
          <div style={{ fontSize: 10.5, color: C.t2, lineHeight: 1.6 }}>{ins.body}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — MEMBER SEGMENTS
═══════════════════════════════════════════════════════════════ */
function MemberSegmentsSection({ isMobile }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12,
    }}>
      <Card>
        <SLabel sub="Who your members are right now and how segments are shifting">Member Segments</SLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SEGMENTS_DATA.map((s, i) => (
            <div key={i} style={{ padding: "9px 0", borderBottom: i < SEGMENTS_DATA.length - 1 ? `1px solid ${C.brd}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.col, flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{s.label}</span>
                  <span style={{ fontSize: 9.5, color: C.t3 }}>{s.sub}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: s.trend > 0 ? C.cyan : C.red, fontWeight: 600 }}>
                    {s.trend > 0 ? <ArrowUpRight style={{ width: 10, height: 10 }}/> : <ArrowDownRight style={{ width: 10, height: 10 }}/>}
                    {s.trend > 0 ? "+" : ""}{s.trend}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, width: 18, textAlign: "right", ...mono }}>{s.val}</span>
                  <span style={{ fontSize: 10, color: C.t3, width: 28, textAlign: "right", ...mono }}>{s.pct}%</span>
                </div>
              </div>
              <div style={{ height: 3, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", background: s.col, borderRadius: 2, opacity: 0.75 }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: C.amberD, border: `1px solid ${C.amberB}` }}>
          <div style={{ fontSize: 10.5, color: C.amber, fontWeight: 600, marginBottom: 2 }}>Slipping segment grew +4 last quarter</div>
          <div style={{ fontSize: 10, color: C.t2, lineHeight: 1.5 }}>9 members dropping from Consistent → Slipping. A targeted re-engagement campaign now prevents them becoming At Risk.</div>
        </div>
      </Card>

      <Card>
        <SLabel sub="How each segment has changed month by month" right="4 months">Segment Trends</SLabel>
        <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
          <LineChart data={SEGMENT_TREND_DATA} margin={{ top: 4, right: 6, bottom: 0, left: -28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="m" tick={tick} axisLine={false} tickLine={false}/>
            <YAxis tick={tick} axisLine={false} tickLine={false}/>
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background: "#0a0e18", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, fontFamily: FONT }}>
                  <div style={{ color: C.t3, marginBottom: 3, fontSize: 9.5 }}>{label}</div>
                  {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ color: C.t3, fontWeight: 400 }}>{p.name}</span>{p.value}
                    </div>
                  ))}
                </div>
              );
            }}/>
            <Line type="monotone" dataKey="super" name="Super Active" stroke={C.cyan}  strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.cyan,  stroke: C.card, strokeWidth: 2 }}/>
            <Line type="monotone" dataKey="cons"  name="Consistent"  stroke={C.blue}  strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.blue,  stroke: C.card, strokeWidth: 2 }}/>
            <Line type="monotone" dataKey="slip"  name="Slipping"    stroke={C.amber} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.amber, stroke: C.card, strokeWidth: 2 }} strokeDasharray="4 3"/>
            <Line type="monotone" dataKey="risk"  name="At Risk"     stroke={C.red}   strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.red,   stroke: C.card, strokeWidth: 2 }} strokeDasharray="4 3"/>
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
          {[{ col: C.cyan, label: "Super Active" }, { col: C.blue, label: "Consistent" }, { col: C.amber, label: "Slipping" }, { col: C.red, label: "At Risk" }].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.t3 }}>
              <div style={{ width: 14, height: 2, background: l.col, borderRadius: 1 }}/> {l.label}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — VISIT TRENDS + PEAK HOURS
═══════════════════════════════════════════════════════════════ */
function VisitTrendsSection({ isMobile }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
      gap: 12,
    }}>
      <Card>
        <SLabel sub="Weekly check-ins (bars) and average visits per member (line)" right="12 weeks">Visit Habits</SLabel>
        <div style={{
          display: "flex",
          flexWrap: isMobile ? "wrap" : "nowrap",
          gap: 18,
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1, ...mono }}>192</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>check-ins this week</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1, ...mono }}>5.1</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>avg visits/member/wk</div>
          </div>
          <div style={{ marginLeft: isMobile ? 0 : "auto", textAlign: isMobile ? "left" : "right" }}>
            <div style={{ fontSize: 10.5, color: C.cyan, fontWeight: 600 }}>↑ +32% avg visits since Jan</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>habits improving across the board</div>
          </div>
        </div>
        <div style={{ width: "100%", overflow: "hidden" }}>
          <ResponsiveContainer width="100%" height={isMobile ? 110 : 140}>
            <ComposedChart data={VISIT_TREND} margin={{ top: 4, right: 28, bottom: 0, left: -26 }}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.cyan} stopOpacity={0.25}/>
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="w" tick={tick} axisLine={false} tickLine={false} interval={2}/>
              <YAxis yAxisId="left"  tick={tick} axisLine={false} tickLine={false} domain={[80, 220]}/>
              <YAxis yAxisId="right" tick={tick} axisLine={false} tickLine={false} orientation="right" domain={[2, 6]}/>
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: "#0a0e18", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, fontFamily: FONT }}>
                    <div style={{ color: C.t3, marginBottom: 3, fontSize: 9.5 }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: p.color, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ color: C.t3, fontWeight: 400 }}>{p.name}</span>{p.value}
                      </div>
                    ))}
                  </div>
                );
              }}/>
              <Bar  yAxisId="left"  dataKey="total" name="Check-ins"  fill={C.cyan + "30"} radius={[2, 2, 0, 0]} barSize={12}/>
              <Line yAxisId="right" type="monotone" dataKey="avg" name="Avg/member" stroke={C.cyan} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: C.cyan, stroke: C.card, strokeWidth: 2 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.t3 }}>
            <div style={{ width: 11, height: 11, background: C.cyan + "30", borderRadius: 2 }}/> Check-ins
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.t3 }}>
            <div style={{ width: 14, height: 2, background: C.cyan, borderRadius: 1 }}/> Avg per member
          </div>
        </div>
      </Card>

      <Card>
        <SLabel sub="When your gym is busiest">Peak Hours</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {HOURS_DATA.map((d, i) => {
            const max = Math.max(...HOURS_DATA.map(x => x.v));
            const isPeak = d.v === max;
            const pct = (d.v / max) * 100;
            const barCol = isPeak ? C.cyan : pct > 60 ? C.cyan + "99" : pct > 30 ? C.cyan + "55" : C.cyan + "25";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 10, color: isPeak ? C.t1 : C.t2, width: 30, flexShrink: 0, fontWeight: isPeak ? 700 : 400 }}>{d.h}</span>
                <div style={{ flex: 1, height: 16, background: C.brd, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: barCol, borderRadius: 3 }}/>
                  {isPeak && (
                    <span style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: C.card, fontWeight: 700 }}>PEAK</span>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: isPeak ? 700 : 400, color: isPeak ? C.cyan : C.t3, width: 20, textAlign: "right", ...mono }}>{d.v}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 9, fontSize: 10, color: C.t3, lineHeight: 1.5 }}>
          6–7pm is your peak. Consider adding a second HIIT session or extending class capacity.
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — CLASS PERFORMANCE
═══════════════════════════════════════════════════════════════ */
function ClassPerformanceSection({ isMobile }) {
  return (
    <Card>
      <SLabel sub="Fill rate, session count and attendance trend · last 30 days">Class Performance</SLabel>
      {/* Horizontal scroll wrapper on mobile only */}
      <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: isMobile ? 520 : "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 60px 80px 60px 160px", gap: 10,
            padding: "0 0 7px", borderBottom: `1px solid ${C.brd}`, marginBottom: 3 }}>
            {["CLASS", "SESSIONS", "FILL RATE", "TREND", "CAPACITY"].map((h, i) => (
              <div key={i} style={{ fontSize: 8.5, fontWeight: 600, color: C.t3, letterSpacing: "0.07em", textAlign: i > 0 ? "center" : "left" }}>{h}</div>
            ))}
          </div>
          {CLASS_DATA.map((cls, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 60px 80px 60px 160px", gap: 10,
              padding: "9px 0", borderBottom: i < CLASS_DATA.length - 1 ? `1px solid ${C.brd}` : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{cls.name}</div>
                <div style={{ fontSize: 9.5, color: C.t3, marginTop: 1 }}>Peak: {cls.peak}</div>
              </div>
              <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: C.t2, ...mono }}>{cls.sessions}</div>
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: fillCol(cls.fill), ...mono }}>{cls.fill}%</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, fontSize: 10.5, fontWeight: 700, color: trendCol(cls.trend) }}>
                {cls.trend > 0 ? <TrendingUp style={{ width: 10, height: 10 }}/> : <TrendingDown style={{ width: 10, height: 10 }}/>}
                {cls.trend > 0 ? "+" : ""}{cls.trend}%
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ flex: 1, height: 5, background: C.brd, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${cls.fill}%`, height: "100%", background: fillCol(cls.fill), borderRadius: 3, opacity: 0.85 }}/>
                </div>
                {cls.fill >= 90 && <span style={{ fontSize: 8.5, color: C.cyan, fontWeight: 700, flexShrink: 0 }}>FULL</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: C.cyanD, border: `1px solid ${C.cyanB}` }}>
        <div style={{ fontSize: 10.5, color: C.cyan, fontWeight: 600, marginBottom: 2 }}>HIIT Circuit is at 94% capacity every session</div>
        <div style={{ fontSize: 10, color: C.t2 }}>Adding one extra session per week could generate ~£380/month. Recovery Yoga at 38% fill — consider rescheduling or merging.</div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — ENGAGEMENT
═══════════════════════════════════════════════════════════════ */
function EngagementSection({ isMobile }) {
  const engMetrics = [
    { label: "Overall Engagement",      val: 72, trend: +6,  sub: "members using app weekly"          },
    { label: "Challenge Participation", val: 47, trend: +12, sub: "of total members in a challenge"   },
    { label: "Poll Participation",      val: 29, trend: -4,  sub: "responded to last poll"            },
    { label: "Class Attendance Rate",   val: 61, trend: +3,  sub: "of capacity filled across classes" },
  ];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12,
    }}>
      <Card>
        <SLabel sub="How members are engaging across every touchpoint">Engagement Breakdown</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 11 }}>
          {engMetrics.map((m, i) => {
            const up = m.trend > 0;
            return (
              <div key={i} style={{ padding: "9px 10px", borderRadius: 7, background: C.card2, border: `1px solid ${C.brd}` }}>
                <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.val >= 60 ? C.cyan : m.val >= 40 ? C.t1 : C.amber, letterSpacing: "-0.02em", lineHeight: 1, ...mono }}>{m.val}%</div>
                <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9.5, color: up ? C.cyan : C.red, fontWeight: 600, marginTop: 3 }}>
                  {up ? <ArrowUpRight style={{ width: 9, height: 9 }}/> : <ArrowDownRight style={{ width: 9, height: 9 }}/>}
                  {up ? "+" : ""}{m.trend}%
                </div>
                <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>{m.sub}</div>
              </div>
            );
          })}
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 120 : 148}>
          <RadarChart data={ENGAGEMENT_DATA} margin={{ top: 6, right: 14, bottom: 6, left: 14 }}>
            <PolarGrid stroke="rgba(255,255,255,0.06)"/>
            <PolarAngleAxis dataKey="subject" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }}/>
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false}/>
            <Radar name="Engagement" dataKey="A" stroke={C.cyan} fill={C.cyan} fillOpacity={0.12} strokeWidth={1.5}/>
            <Tooltip content={<ChartTip suffix="%"/>}/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SLabel sub="Members who engage more stay significantly longer">Engagement → Retention</SLabel>
        {[
          { label: "Engaged members",     months: 8.2, pct: 82, col: C.cyan },
          { label: "Non-engaged members", months: 3.9, pct: 39, col: C.t3  },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t1 }}>{r.label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: r.col, ...mono }}>{r.months} mo avg</span>
            </div>
            <div style={{ height: 8, background: C.brd, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${r.pct}%`, height: "100%", background: r.col, borderRadius: 4, opacity: i === 0 ? 0.85 : 0.4 }}/>
            </div>
          </div>
        ))}
        <div style={{ height: 1, background: C.brd, margin: "4px 0 10px" }}/>
        {[
          { label: "Challenge participants retain", val: "2.1×", sub: "longer than non-participants",     col: C.cyan  },
          { label: "App-active members churn at",   val: "4%",   sub: "vs 22% for non-app users",        col: C.cyan  },
          { label: "Raise challenge rate to 65%",   val: "£180", sub: "+/mo projected retention revenue", col: C.green },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9,
            padding: "7px 0", borderBottom: i < 2 ? `1px solid ${C.brd}` : "none" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: s.col, lineHeight: 1, flexShrink: 0, minWidth: 36, ...mono }}>{s.val}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — REVENUE
═══════════════════════════════════════════════════════════════ */
function RevenueSection({ isMobile }) {
  const latest  = REVENUE_DATA[REVENUE_DATA.length - 1];
  const prev    = REVENUE_DATA[REVENUE_DATA.length - 2];
  const lostDelta = Math.round(((latest.lost     - prev.lost)      / prev.lost)     * 100);
  const recDelta  = Math.round(((latest.recovered - prev.recovered) / prev.recovered) * 100);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
      gap: 12,
    }}>
      <Card>
        <SLabel sub="Monthly revenue retained vs lost to churn vs recovered through re-engagement">Revenue Breakdown</SLabel>
        <div style={{
          display: "flex",
          flexWrap: isMobile ? "wrap" : "nowrap",
          gap: 18,
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1, ...mono }}>£{latest.retained.toLocaleString()}</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>retained this month</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.red, letterSpacing: "-0.03em", lineHeight: 1, ...mono }}>£{latest.lost}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9.5, color: lostDelta < 0 ? C.cyan : C.red, fontWeight: 600, marginTop: 2 }}>
              {lostDelta < 0 ? <ArrowDownRight style={{ width: 9, height: 9 }}/> : <ArrowUpRight style={{ width: 9, height: 9 }}/>}
              {lostDelta}% vs last mo
            </div>
            <div style={{ fontSize: 9.5, color: C.t3 }}>lost to churn</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.green, letterSpacing: "-0.03em", lineHeight: 1, ...mono }}>£{latest.recovered}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9.5, color: C.cyan, fontWeight: 600, marginTop: 2 }}>
              <ArrowUpRight style={{ width: 9, height: 9 }}/> +{recDelta}% vs last mo
            </div>
            <div style={{ fontSize: 9.5, color: C.t3 }}>re-engaged / recovered</div>
          </div>
        </div>
        <div style={{ width: "100%", overflow: "hidden" }}>
          <ResponsiveContainer width="100%" height={isMobile ? 100 : 130}>
            <ComposedChart data={REVENUE_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="retainedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.cyan} stopOpacity={0.2}/>
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="m" tick={tick} axisLine={false} tickLine={false}/>
              <YAxis tick={tick} axisLine={false} tickLine={false}/>
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: "#0a0e18", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, fontFamily: FONT }}>
                    <div style={{ color: C.t3, marginBottom: 3, fontSize: 9.5 }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: p.color, fontWeight: 700, display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ color: C.t3, fontWeight: 400 }}>{p.name}</span>£{p.value}
                      </div>
                    ))}
                  </div>
                );
              }}/>
              <Area type="monotone" dataKey="retained"  name="Retained"  stroke={C.cyan}  strokeWidth={2}   fill="url(#retainedGrad)"/>
              <Bar             dataKey="lost"      name="Lost"      fill={C.red}   fillOpacity={0.6} radius={[2, 2, 0, 0]} barSize={9}/>
              <Bar             dataKey="recovered" name="Recovered" fill={C.green} fillOpacity={0.7} radius={[2, 2, 0, 0]} barSize={9}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 7 }}>
          {[{ col: C.cyan, label: "Retained" }, { col: C.red, label: "Lost" }, { col: C.green, label: "Recovered" }].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.t3 }}>
              <div style={{ width: 11, height: 11, background: l.col, borderRadius: 2, opacity: 0.7 }}/> {l.label}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 11 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 2 }}>At-Risk Members</div>
            <div style={{ fontSize: 10, color: C.t3 }}>£{CHURN_MEMBERS.reduce((s, m) => s + m.mv, 0)}/mo exposure</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.red, lineHeight: 1, ...mono }}>£{CHURN_MEMBERS.reduce((s, m) => s + m.mv, 0)}</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>monthly risk</div>
          </div>
        </div>
        {CHURN_MEMBERS.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 0", borderBottom: i < CHURN_MEMBERS.length - 1 ? `1px solid ${C.brd}` : "none" }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t1 }}>{m.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <div style={{ width: 44, height: 3, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${m.risk}%`, height: "100%", background: riskCol(m.risk), borderRadius: 2 }}/>
                </div>
                <span style={{ fontSize: 9.5, color: riskCol(m.risk), fontWeight: 700, ...mono }}>{m.risk}%</span>
                <span style={{ fontSize: 9.5, color: C.t3 }}>{m.days}d absent</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10.5, color: C.t2, ...mono }}>£{m.mv}</span>
              <button style={{ padding: "3px 8px", borderRadius: 5, background: "transparent",
                border: `1px solid ${C.brd2}`, color: C.t2, fontSize: 10, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT }}>Nudge</button>
            </div>
          </div>
        ))}
        <button style={{ marginTop: 10, width: "100%", padding: "8px", borderRadius: 7,
          background: C.redD, border: `1px solid ${C.redB}`, color: C.red,
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: FONT }}>
          <Send style={{ width: 11, height: 11 }}/> Message All At-Risk
        </button>
        <div style={{ marginTop: 9, padding: "8px 10px", borderRadius: 7, background: C.greenD, border: `1px solid ${C.greenB}` }}>
          <div style={{ fontSize: 10.5, color: C.green, fontWeight: 600, marginBottom: 2 }}>£300 recovered last month</div>
          <div style={{ fontSize: 10, color: C.t2 }}>4 members re-engaged after personal outreach. Recovery up 15% vs last month.</div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function TabAnalytics() {
  const [range, setRange] = useState("30D");

  // ── Mobile detection with resize listener ──────────────────
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      padding: isMobile ? "12px 12px" : "16px 18px",
      display: "flex", flexDirection: "column", gap: 18,
      fontFamily: FONT, color: C.t1,
    }}>

      {/* Page header */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 10 : 0,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
            Analytics <span style={{ color: C.t3, fontWeight: 300 }}>/</span>{" "}
            <span style={{ color: C.cyan }}>Overview</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>
            Retention, engagement and revenue — at a glance
          </div>
        </div>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 9,
          width: isMobile ? "100%" : "auto",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
            borderRadius: 7, background: C.amberD, border: `1px solid ${C.amberB}`,
            fontSize: 11, color: C.amber, fontWeight: 600,
            width: isMobile ? "100%" : "auto",
            boxSizing: "border-box",
          }}>
            <AlertTriangle style={{ width: 10, height: 10 }}/> 4 members need attention
          </div>
          <RangeTab range={range} setRange={setRange}/>
        </div>
      </div>

      {/* 1 · KPI strip */}
      <KpiStrip isMobile={isMobile}/>

      {/* 2 · Retention health */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 9 }}>Retention Health</div>
        <RetentionFunnelSection isMobile={isMobile}/>
      </div>

      {/* 3 · Key insights */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 9 }}>Key Insights</div>
        <KeyInsights isMobile={isMobile}/>
      </div>

      {/* 4 · Member segments */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 9 }}>Member Segments</div>
        <MemberSegmentsSection isMobile={isMobile}/>
      </div>

      {/* 5 · Visit habits */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 9 }}>Visit Habits</div>
        <VisitTrendsSection isMobile={isMobile}/>
      </div>

      {/* 6 · Class performance */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 9 }}>Class Performance</div>
        <ClassPerformanceSection isMobile={isMobile}/>
      </div>

      {/* 7 · Engagement */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 9 }}>Engagement</div>
        <EngagementSection isMobile={isMobile}/>
      </div>

      {/* 8 · Revenue */}
      <div style={{ paddingBottom: 24 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em",
          textTransform: "uppercase", marginBottom: 9 }}>Revenue</div>
        <RevenueSection isMobile={isMobile}/>
      </div>

    </div>
  );
}
