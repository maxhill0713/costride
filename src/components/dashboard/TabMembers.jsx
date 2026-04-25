/**
 * TabMembers — fully dynamic, real data from GymOwnerDashboard props
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Users, Flame, Send, X,
  ChevronRight, ChevronDown, ChevronLeft, Search, Check,
  Bell, Plus, BarChart2, Zap,
  SlidersHorizontal, ArrowUpRight, ArrowDownRight,
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
  cyan:    "#4d7fff",
  cyanD:   "rgba(77,127,255,0.08)",
  cyanB:   "rgba(77,127,255,0.25)",
  red:     "#ff4d6d",
  redD:    "rgba(255,77,109,0.1)",
  redB:    "rgba(255,77,109,0.25)",
  amber:   "#f59e0b",
  green:   "#22c55e",
  blue:    "#3b82f6",
};
const FONT = "'DM Sans','Segoe UI',sans-serif";

const AV_COLORS = ["#6366f1","#14b8a6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#a855f7","#f97316"];

const ACTIONS = [
  "Send 'We miss you'","Friendly check-in","Habit-building nudge",
  "Challenge invite","Personal outreach","Referral ask","Motivate","Week-1 welcome",
];

/* ─── HELPERS ────────────────────────────────────────────────── */
function churnCol(p) { return p >= 70 ? C.red : p >= 40 ? C.amber : C.green; }

function statusSty(s) {
  return ({
    "At risk":      { bg:C.redD,                brd:C.redB,                       col:C.red   },
    "Dropping off": { bg:"rgba(245,158,11,0.1)", brd:"rgba(245,158,11,0.25)",      col:C.amber },
    "Consistent":   { bg:"rgba(34,197,94,0.1)",  brd:"rgba(34,197,94,0.25)",       col:C.green },
    "Engaged":      { bg:"rgba(34,197,94,0.1)",  brd:"rgba(34,197,94,0.25)",       col:C.green },
    "New":          { bg:"rgba(59,130,246,0.1)", brd:"rgba(59,130,246,0.25)",      col:C.blue  },
  })[s] || { bg:C.cyanD, brd:C.cyanB, col:C.cyan };
}

function lastLabel(ds) {
  if (ds === null || ds === undefined || ds >= 999) return "Never";
  if (ds === 0)   return "Today";
  if (ds === 1)   return "Yesterday";
  return `${ds}d ago`;
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    d = new Date(dateStr + "Z");
  }
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)        return "just now";
  if (s < 3600)      return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)     return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function computeDaysSince(dateStr) {
  if (!dateStr) return 999;
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return 999;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    d = new Date(dateStr + "Z");
  }
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function deriveStatus(member, checkIns, now) {
  const userId = member.user_id;
  const memberCIs = checkIns.filter(c => c.user_id === userId);
  const nowMs = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = nowMs - 30 * 86400000;
  const sevenDaysAgo  = nowMs - 7 * 86400000;
  const joinedMs = member.join_date ? new Date(member.join_date).getTime() : null;
  const isNew = joinedMs && (nowMs - joinedMs < 30 * 86400000) && memberCIs.length <= 3;
  if (isNew) return "New";
  const recent = memberCIs.filter(c => {
    const t = c.check_in_date || c.created_date;
    return t && new Date(t).getTime() >= sevenDaysAgo;
  }).length;
  const last = memberCIs.sort((a, b) =>
    new Date(b.check_in_date || b.created_date || 0) - new Date(a.check_in_date || a.created_date || 0)
  )[0];
  const daysSinceLast = last ? computeDaysSince(last.check_in_date || last.created_date) : 999;
  if (daysSinceLast >= 21) return "At risk";
  if (daysSinceLast >= 14) return "Dropping off";
  const v30 = memberCIs.filter(c => {
    const t = c.check_in_date || c.created_date;
    return t && new Date(t).getTime() >= thirtyDaysAgo;
  }).length;
  if (v30 >= 8 || recent >= 2) return "Engaged";
  return "Consistent";
}

function deriveChurnRisk(member, checkIns, now) {
  const userId = member.user_id;
  const memberCIs = checkIns.filter(c => c.user_id === userId);
  const nowMs = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = nowMs - 30 * 86400000;
  const last = memberCIs.sort((a, b) =>
    new Date(b.check_in_date || b.created_date || 0) - new Date(a.check_in_date || a.created_date || 0)
  )[0];
  const daysSinceLast = last ? computeDaysSince(last.check_in_date || last.created_date) : 999;
  const v30 = memberCIs.filter(c => {
    const t = c.check_in_date || c.created_date;
    return t && new Date(t).getTime() >= thirtyDaysAgo;
  }).length;
  // Churn risk: 0-100
  let risk = 0;
  if (daysSinceLast >= 30) risk = 90;
  else if (daysSinceLast >= 21) risk = 75;
  else if (daysSinceLast >= 14) risk = 55;
  else if (daysSinceLast >= 7)  risk = 35;
  else risk = 10;
  if (v30 === 0 && daysSinceLast < 30) risk = Math.min(risk + 20, 95);
  if (v30 >= 8) risk = Math.max(risk - 20, 5);
  return Math.min(100, Math.max(0, Math.round(risk)));
}

function deriveAction(status) {
  return ({
    "At risk":      "Send 'We miss you'",
    "Dropping off": "Friendly check-in",
    "New":          "Week-1 welcome",
    "Engaged":      "Referral ask",
    "Consistent":   "Challenge invite",
  })[status] || "Motivate";
}

function deriveSuccessRate(churn) {
  return Math.round(100 - churn * 0.7);
}

/* Build visit trend data (monthly check-in counts for last 6 months) */
function buildVisitTrend(checkIns) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      m: d.toLocaleDateString("en-GB", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      v: 0,
    });
  }
  checkIns.forEach(c => {
    const dateStr = c.check_in_date || c.created_date;
    if (!dateStr) return;
    let d = new Date(dateStr);
    if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) d = new Date(dateStr + "Z");
    const entry = months.find(mo => mo.year === d.getFullYear() && mo.month === d.getMonth());
    if (entry) entry.v++;
  });
  return months;
}

/* Build churn risk trend (% of at-risk members per month based on activity) */
function buildChurnTrend(checkIns, allMemberships) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const d = monthStart;
    months.push({
      m: d.toLocaleDateString("en-GB", { month: "short" }),
      monthStart: monthStart.getTime(),
      monthEnd: monthEnd.getTime(),
      v: 0,
    });
  }
  if (!allMemberships.length) return months;
  months.forEach(mo => {
    // At-risk = members who had no check-in in the 30 days before month end
    const cutoff = mo.monthEnd - 30 * 86400000;
    let atRiskCount = 0;
    allMemberships.forEach(m => {
      const mCIs = checkIns.filter(c => c.user_id === m.user_id);
      const hadRecent = mCIs.some(c => {
        const t = c.check_in_date || c.created_date;
        if (!t) return false;
        const ts = new Date(t).getTime();
        return ts >= cutoff && ts <= mo.monthEnd;
      });
      if (!hadRecent) atRiskCount++;
    });
    mo.v = allMemberships.length > 0 ? Math.round((atRiskCount / allMemberships.length) * 100) : 0;
  });
  return months;
}

/* Build drop-off peaks: % of members who stopped after week 1/2/4 */
function buildDropOffPeaks(checkIns, allMemberships) {
  const now = Date.now();
  if (!allMemberships.length) return [
    { label: "Week 1", pct: 0, note: "Fresh starters" },
    { label: "Week 2", pct: 0, note: "Motivation dip" },
    { label: "Week 4", pct: 0, note: "Habit not formed" },
  ];
  let w1Dropped = 0, w2Dropped = 0, w4Dropped = 0;
  allMemberships.forEach(m => {
    const joinMs = m.join_date ? new Date(m.join_date).getTime() : null;
    if (!joinMs) return;
    const mCIs = checkIns.filter(c => c.user_id === m.user_id);
    const hasVisitAfterW1 = mCIs.some(c => {
      const t = c.check_in_date || c.created_date;
      return t && new Date(t).getTime() > joinMs + 7 * 86400000;
    });
    const hasVisitAfterW2 = mCIs.some(c => {
      const t = c.check_in_date || c.created_date;
      return t && new Date(t).getTime() > joinMs + 14 * 86400000;
    });
    const hasVisitAfterW4 = mCIs.some(c => {
      const t = c.check_in_date || c.created_date;
      return t && new Date(t).getTime() > joinMs + 28 * 86400000;
    });
    if (!hasVisitAfterW1) w1Dropped++;
    if (!hasVisitAfterW2) w2Dropped++;
    if (!hasVisitAfterW4) w4Dropped++;
  });
  const total = allMemberships.length;
  return [
    { label: "Week 1", pct: Math.round((w1Dropped / total) * 100), note: "Fresh starters" },
    { label: "Week 2", pct: Math.round((w2Dropped / total) * 100), note: "Motivation dip" },
    { label: "Week 4", pct: Math.round((w4Dropped / total) * 100), note: "Habit not formed" },
  ];
}

/* ─── MOBILE DETECTION ───────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Av({ m, size = 30, avatarMap = {} }) {
  const col = AV_COLORS[(m.user_id || m.id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
  const src = avatarMap[m.user_id] || m.avatar_url || null;
  const initials = (m.user_name || m.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (src) {
    return (
      <img src={src} alt={m.user_name || m.name} style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, objectFit: "cover", border: `1.5px solid ${col}55` }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: col + "1a", color: col, fontSize: size * 0.32, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${col}33`, fontFamily: "monospace" }}>{initials}</div>
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
function RightPanel({ enrichedMembers, checkIns, allMemberships, totalMembers, activeThisWeek, atRisk, newSignUps, weeklyChangePct }) {
  const visitTrend = useMemo(() => buildVisitTrend(checkIns), [checkIns]);
  const churnTrend = useMemo(() => buildChurnTrend(checkIns, allMemberships), [checkIns, allMemberships]);
  const dropOffPeaks = useMemo(() => buildDropOffPeaks(checkIns, allMemberships), [checkIns, allMemberships]);

  const membershipMap = { monthly: 60, annual: 90, premium: 120, lifetime: 0 };
  const avgMv = allMemberships.length > 0
    ? Math.round(allMemberships.reduce((sum, m) => sum + (membershipMap[m.membership_type] || 60), 0) / allMemberships.length)
    : 0;

  const total = totalMembers || allMemberships.length;
  const active = activeThisWeek || enrichedMembers.filter(m => m._ds <= 7).length;
  const risk = atRisk || enrichedMembers.filter(m => m._churn >= 60).length;
  const newM = newSignUps || enrichedMembers.filter(m => m.status === "New").length;

  return (
    <div style={{ width: 240, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", overflowY: "auto", fontFamily: FONT }}>
      <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Members</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontSize: 38, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1 }}>{total}</div>
          {weeklyChangePct != null && weeklyChangePct !== 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: weeklyChangePct > 0 ? C.green : C.red, fontWeight: 600, marginBottom: 4 }}>
              {weeklyChangePct > 0 ? <ArrowUpRight style={{ width: 13, height: 13 }} /> : <ArrowDownRight style={{ width: 13, height: 13 }} />}
              {weeklyChangePct > 0 ? "+" : ""}{weeklyChangePct}%
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>active memberships</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: C.brd, borderBottom: `1px solid ${C.brd}` }}>
        {[
          { label: "Active",  val: active,    col: C.cyan },
          { label: "At Risk", val: risk,       col: C.red  },
          { label: "New",     val: newM,       col: C.blue },
          { label: "Avg/mo",  val: `£${avgMv}`, col: C.t1  },
        ].map((s, i) => (
          <div key={i} style={{ padding: "12px 14px", background: C.sidebar }}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Visit Trend */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Visit Trend</span>
          <span style={{ fontSize: 10, color: C.t3 }}>6mo</span>
        </div>
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={visitTrend} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
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

      {/* Churn Risk */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Churn Risk</span>
          <span style={{ fontSize: 10, color: C.t3 }}>6mo avg</span>
        </div>
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={churnTrend} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.red} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.red} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<ChartTip suffix="%" />} />
            <Area type="monotone" dataKey="v" stroke={C.red} strokeWidth={2} fill="url(#cg)" dot={false}
              activeDot={{ r: 3, fill: C.red, strokeWidth: 2, stroke: C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 1, background: C.brd }} />

      {/* Drop-off Peaks */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 12 }}>Drop-off Peaks</div>
        {dropOffPeaks.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.t2, width: 38, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, height: 3, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${b.pct}%`, height: "100%", background: b.pct >= 60 ? C.red : b.pct >= 40 ? C.amber : C.cyan, borderRadius: 2, opacity: 0.65 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.t2, width: 24, textAlign: "right" }}>{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ACTION DROPDOWN ────────────────────────────────────────── */
function ActionDropdown({ member, onMessage }) {
  const [open, setOpen] = useState(false);
  const [sel,  setSel]  = useState(member._action);
  return (
    <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT }}>
        {sel.length > 20 ? sel.slice(0, 20) + "…" : sel}
        <ChevronDown style={{ width: 9, height: 9, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100, background: C.card2, border: `1px solid ${C.brd2}`, borderRadius: 8, overflow: "hidden", minWidth: 195, boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
          {ACTIONS.map(a => (
            <div key={a} onClick={() => { setSel(a); setOpen(false); onMessage({ ...member, _action: a }); }}
              style={{ padding: "8px 12px", fontSize: 12, color: a === sel ? C.cyan : C.t2, cursor: "pointer", fontFamily: FONT, background: a === sel ? C.cyanD : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              onMouseEnter={e => { if (a !== sel) e.currentTarget.style.background = C.card; }}
              onMouseLeave={e => { if (a !== sel) e.currentTarget.style.background = "transparent"; }}>
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
    <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "7px 18px", borderBottom: `1px solid ${C.brd}`, background: C.card, fontFamily: FONT, flexShrink: 0 }}>
      {cols.map((c, i) => (
        <div key={i} onClick={() => c.key && setSort(c.key)} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: sort === c.key ? C.t2 : C.t3, cursor: c.key ? "pointer" : "default", justifyContent: i === cols.length - 1 ? "flex-end" : "flex-start" }}>
          {c.label}
          {c.key && <ChevronDown style={{ width: 8, height: 8, color: C.t3 }} />}
        </div>
      ))}
    </div>
  );
}

function MemberRow({ m, isPrev, onPreview, onMessage, isLast, avatarMap }) {
  const visitCol = m._ds >= 14 ? C.red : m._ds <= 1 ? C.cyan : C.t2;
  const s = statusSty(m.status);
  const appLabel = m._appDays === null ? "—" : m._appDays === 0 ? "Today" : `${m._appDays}d ago`;
  const appCol   = m._appDays === null ? C.t3 : m._appDays >= 10 ? C.red : m._appDays <= 1 ? C.cyan : C.t2;

  return (
    <div onClick={() => onPreview(m)} style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "11px 18px", alignItems: "center", cursor: "pointer", background: isPrev ? "#1a1a1e" : "transparent", borderBottom: isLast ? "none" : `1px solid ${C.brd}`, borderLeft: `2px solid ${isPrev ? C.cyan : "transparent"}`, transition: "background 0.1s", fontFamily: FONT }}
      onMouseEnter={e => { if (!isPrev) e.currentTarget.style.background = C.card; }}
      onMouseLeave={e => { e.currentTarget.style.background = isPrev ? "#1a1a1e" : "transparent"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Av m={m} size={30} avatarMap={avatarMap} />
          {m._streak >= 5 && (
            <div style={{ position: "absolute", top: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame style={{ width: 7, height: 7, color: C.amber }} />
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isPrev ? C.cyan : C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.user_name || m.name || "Member"}</div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1 }}>{m.membership_type ? m.membership_type.charAt(0).toUpperCase() + m.membership_type.slice(1) : "Member"}</div>
        </div>
      </div>
      <div>
        <span style={{ padding: "3px 8px", borderRadius: 20, background: s.bg, border: `1px solid ${s.brd}`, fontSize: 10, fontWeight: 700, color: s.col, whiteSpace: "nowrap" }}>
          {m.status}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.t3, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gym</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: visitCol }}>{lastLabel(m._ds)}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.t3, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>App</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: appCol }}>{appLabel}</div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionDropdown member={m} onMessage={onMessage} />
      </div>
    </div>
  );
}

/* ─── FILTER TABS ────────────────────────────────────────────── */
function FilterTabs({ filter, setFilter, counts }) {
  const tabs = [
    { id:"all",      label:"All",      count:counts.all                  },
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
          <button key={t.id} onClick={() => setFilter(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 10px", cursor: "pointer", background: "transparent", border: "none", borderBottom: on ? `2px solid ${C.cyan}` : "2px solid transparent", color: on ? C.t1 : C.t2, fontSize: 12, fontWeight: on ? 700 : 400, fontFamily: FONT, transition: "color .15s" }}>
            {t.dot && <div style={{ width: 5, height: 5, borderRadius: "50%", background: t.dot, opacity: on ? 1 : 0.5 }} />}
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 9.5, color: on ? C.t2 : C.t3 }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── MEMBER PREVIEW ─────────────────────────────────────────── */
function MemberPreview({ m, onClose, onMessage, avatarMap }) {
  if (!m) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 240, bottom: 0, width: 264, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", fontFamily: FONT }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Av m={m} size={34} avatarMap={avatarMap} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{m.user_name || m.name || "Member"}</div>
            <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>{m.membership_type || "Member"} · {m._totalCI} visits</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${C.brd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X style={{ width: 10, height: 10, color: C.t3 }} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { label: "Last Visit",   val: lastLabel(m._ds),   col: m._ds >= 14 ? C.red : m._ds <= 1 ? C.cyan : C.t1 },
            { label: "App",          val: m._appDays === null ? "—" : m._appDays === 0 ? "Today" : `${m._appDays}d ago`, col: C.t1 },
            { label: "This Month",   val: `${m._v30} visits`, col: C.t1 },
            { label: "Churn Risk",   val: `${m._churn}%`,     col: m._churn >= 70 ? C.red : m._churn >= 40 ? C.amber : C.green },
          ].map((s, i) => (
            <div key={i} style={{ padding: "10px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.col }}>{s.val}</div>
            </div>
          ))}
        </div>
        {m._streak > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <Flame style={{ width: 13, height: 13, color: C.amber, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.amber }}>{m._streak}-day streak</span>
          </div>
        )}
        <div style={{ padding: "10px 12px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}` }}>
          <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Recommended Action</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, marginBottom: 6 }}>{m._action}</div>
          <div style={{ height: 2, background: C.brd, borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ width: `${m._rc}%`, height: "100%", background: C.cyan, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10.5, color: C.t3 }}>{m._rc}% predicted success</div>
        </div>
        {m.join_date && (
          <div style={{ fontSize: 11, color: C.t3 }}>Joined: {new Date(m.join_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
        )}
      </div>
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.brd}` }}>
        <button onClick={() => onMessage(m)} style={{ width: "100%", padding: "9px", borderRadius: 8, background: C.cyan, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: FONT }}>
          <Send style={{ width: 11, height: 11 }} /> {m._action}
        </button>
      </div>
    </div>
  );
}

/* ─── MESSAGE TOAST ──────────────────────────────────────────── */
function MessageToast({ member, onClose }) {
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState(
    member ? `Hey ${(member.user_name || member.name || "there").split(" ")[0]}, we've missed you at the gym. Your progress is waiting — come back and pick up where you left off.` : ""
  );
  if (!member) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", width: 330, background: C.sidebar, border: `1px solid ${C.brd2}`, borderRadius: 11, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 300, overflow: "hidden", fontFamily: FONT }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Bell style={{ width: 11, height: 11, color: C.t3 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Push notification</span>
          <span style={{ fontSize: 10.5, color: C.t3 }}>→ {(member.user_name || member.name || "Member").split(" ")[0]}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <X style={{ width: 11, height: 11, color: C.t3 }} />
        </button>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", background: C.card, border: `1px solid ${C.brd}`, borderRadius: 7, padding: "9px 11px", fontSize: 11.5, color: C.t1, resize: "none", outline: "none", lineHeight: 1.6, fontFamily: FONT }} />
        <div style={{ marginTop: 4, fontSize: 10.5, color: C.t3 }}>{member._rc}% predicted return rate</div>
        <button onClick={() => { setSent(true); setTimeout(onClose, 1600); }} style={{ marginTop: 9, width: "100%", padding: "8px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: sent ? C.card : C.cyan, color: sent ? C.cyan : "#fff", transition: "all 0.2s", fontFamily: FONT }}>
          {sent ? <><Check style={{ width: 11, height: 11 }} /> Sent</> : <><Send style={{ width: 11, height: 11 }} /> Send to {(member.user_name || member.name || "Member").split(" ")[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── BOTTOM SHEET (mobile) ──────────────────────────────────── */
function BottomSheet({ open, onClose, maxHeight = "88vh", children, noPadding = false }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, fontFamily: FONT }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.sidebar, borderRadius: "22px 22px 0 0", border: `1px solid ${C.brd}`, borderBottom: "none", maxHeight, display: "flex", flexDirection: "column", transform: `translateY(${visible ? "0" : "100%"})`, transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)", overflow: "hidden" }}>
        <div style={{ padding: "14px 0 6px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.brd2 }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: noPadding ? 0 : undefined }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── MOBILE COMPONENTS ──────────────────────────────────────── */
function MobileFilterChips({ filter, setFilter, counts }) {
  const chips = [
    { id: "all",      label: "All",      count: counts.all,      dot: null    },
    { id: "atRisk",   label: "At Risk",  count: counts.atRisk,   dot: C.red   },
    { id: "dropping", label: "Dropping", count: counts.dropping, dot: C.amber },
    { id: "new",      label: "New",      count: counts.new,      dot: C.blue  },
    { id: "active",   label: "Active",   count: counts.active,   dot: C.cyan  },
    { id: "inactive", label: "Inactive", count: counts.inactive, dot: null    },
  ];
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 16px", background: C.bg, flexShrink: 0, scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
      {chips.map(chip => {
        const on = filter === chip.id;
        return (
          <button key={chip.id} onClick={() => setFilter(chip.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 24, flexShrink: 0, whiteSpace: "nowrap", background: on ? C.cyanD : C.card, border: `1.5px solid ${on ? C.cyanB : C.brd}`, color: on ? C.cyan : C.t2, fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}>
            {chip.dot && <div style={{ width: 7, height: 7, borderRadius: "50%", background: chip.dot, opacity: on ? 1 : 0.6 }} />}
            {chip.label}
            {chip.count > 0 && <span style={{ padding: "1px 7px", borderRadius: 12, background: on ? C.cyanB : C.brd2, color: on ? C.cyan : C.t3, fontSize: 11, fontWeight: 700 }}>{chip.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function MobileMemberCard({ m, onPreview, onMessage, avatarMap }) {
  const s = statusSty(m.status);
  const visitCol = m._ds >= 14 ? C.red : m._ds <= 1 ? C.cyan : C.t2;
  const [pressed, setPressed] = useState(false);
  return (
    <div onClick={() => onPreview(m)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{ margin: "0 12px 10px", borderRadius: 16, background: pressed ? "#1a1a1e" : C.card, border: `1.5px solid ${pressed ? C.brd2 : C.brd}`, overflow: "hidden", cursor: "pointer", fontFamily: FONT, transition: "background 0.1s, border-color 0.1s" }}>
      <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Av m={m} size={44} avatarMap={avatarMap} />
          {m._streak >= 5 && (
            <div style={{ position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.brd}` }}>
              <Flame style={{ width: 10, height: 10, color: C.amber }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.user_name || m.name || "Member"}</div>
            <span style={{ padding: "4px 10px", borderRadius: 20, background: s.bg, border: `1px solid ${s.brd}`, fontSize: 10.5, fontWeight: 700, color: s.col, whiteSpace: "nowrap", flexShrink: 0 }}>{m.status}</span>
          </div>
          <div style={{ fontSize: 12, color: C.t3 }}>{m.membership_type ? m.membership_type.charAt(0).toUpperCase() + m.membership_type.slice(1) : "Member"} · {m._totalCI} visits total</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${C.brd}`, background: C.card2 }}>
        {[
          { label: "Gym Visit", val: lastLabel(m._ds), col: visitCol },
          { label: "App",       val: m._appDays === null ? "—" : m._appDays === 0 ? "Today" : `${m._appDays}d ago`, col: C.t2 },
          { label: "Churn",     val: `${m._churn}%`,  col: churnCol(m._churn) },
        ].map((stat, i) => (
          <div key={i} style={{ padding: "10px 12px", borderRight: i < 2 ? `1px solid ${C.brd}` : "none" }}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: stat.col }}>{stat.val}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.brd}` }}>
        <button onClick={(e) => { e.stopPropagation(); onMessage(m); }} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, background: C.cyanD, border: `1.5px solid ${C.cyanB}`, color: C.cyan, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Send style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>{m._action.length > 22 ? m._action.slice(0, 22) + "…" : m._action}</span>
          </div>
          <ChevronRight style={{ width: 14, height: 14, flexShrink: 0, opacity: 0.6 }} />
        </button>
      </div>
    </div>
  );
}

function MobilePreviewSheet({ m, onClose, onMessage, avatarMap }) {
  const [sheetOpen, setSheetOpen] = useState(true);
  const handleClose = () => { setSheetOpen(false); setTimeout(onClose, 400); };
  const handleAction = () => { handleClose(); setTimeout(() => onMessage(m), 50); };
  return (
    <BottomSheet open={sheetOpen} onClose={handleClose} maxHeight="90vh" noPadding>
      <div style={{ padding: "4px 18px 16px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Av m={m} size={48} avatarMap={avatarMap} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.t1 }}>{m.user_name || m.name || "Member"}</div>
            <div style={{ fontSize: 12.5, color: C.t3, marginTop: 3 }}>{m.membership_type || "Member"} · {m._totalCI} visits</div>
          </div>
        </div>
        <button onClick={handleClose} style={{ width: 34, height: 34, borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X style={{ width: 14, height: 14, color: C.t3 }} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Last Gym Visit", val: lastLabel(m._ds), col: m._ds >= 14 ? C.red : m._ds <= 1 ? C.cyan : C.t1, sub: m._ds >= 14 ? "Needs attention" : m._ds <= 1 ? "Great!" : "Moderate" },
            { label: "App Activity",   val: m._appDays === null ? "—" : m._appDays === 0 ? "Today" : `${m._appDays}d ago`, col: C.t1, sub: "Last active" },
            { label: "This Month",     val: `${m._v30} visits`, col: C.t1, sub: "30-day count" },
            { label: "Churn Risk",     val: `${m._churn}%`, col: m._churn >= 70 ? C.red : m._churn >= 40 ? C.amber : C.green, sub: m._churn >= 70 ? "High — act now" : m._churn >= 40 ? "Moderate" : "Low risk" },
          ].map((stat, i) => (
            <div key={i} style={{ padding: "14px", borderRadius: 12, background: C.card, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 10.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: stat.col, marginBottom: 4 }}>{stat.val}</div>
              <div style={{ fontSize: 11, color: C.t3 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px", borderRadius: 12, marginBottom: 16, background: C.cyanD, border: `1.5px solid ${C.cyanB}` }}>
          <div style={{ fontSize: 10.5, color: C.cyan, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, fontWeight: 700 }}>Recommended Action</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 12 }}>{m._action}</div>
          <div style={{ height: 4, background: "rgba(77,127,255,0.15)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${m._rc}%`, height: "100%", background: C.cyan, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 11.5, color: C.t2 }}><span style={{ color: C.cyan, fontWeight: 700 }}>{m._rc}%</span> predicted success rate</div>
        </div>
      </div>
      <div style={{ padding: "14px 16px 28px", borderTop: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <button onClick={handleAction} style={{ width: "100%", padding: "15px", borderRadius: 14, background: C.cyan, border: "none", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Send style={{ width: 15, height: 15 }} />{m._action}
        </button>
      </div>
    </BottomSheet>
  );
}

function MobileMessageToast({ member, onClose, avatarMap }) {
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(true);
  const [body, setBody] = useState(member ? `Hey ${(member.user_name || member.name || "there").split(" ")[0]}, we've missed you at the gym! Your progress is waiting — come back and pick up where you left off. 💪` : "");
  const handleClose = () => { setOpen(false); setTimeout(onClose, 400); };
  if (!member) return null;
  return (
    <BottomSheet open={open} onClose={handleClose} maxHeight="75vh" noPadding>
      <div style={{ padding: "4px 18px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.cyanD, border: `1px solid ${C.cyanB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell style={{ width: 16, height: 16, color: C.cyan }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>Push Notification</div>
            <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2 }}>→ {member.user_name || member.name || "Member"} · {member._action}</div>
          </div>
        </div>
        <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X style={{ width: 13, height: 13, color: C.t3 }} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} style={{ width: "100%", boxSizing: "border-box", background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, padding: "13px 14px", fontSize: 14, color: C.t1, resize: "none", outline: "none", lineHeight: 1.65, fontFamily: FONT }} />
        <div style={{ fontSize: 12, color: C.t3, marginBottom: 16, marginTop: 8 }}><span style={{ color: C.cyan, fontWeight: 700 }}>{member._rc}%</span> predicted return rate</div>
        <button onClick={() => { setSent(true); setTimeout(handleClose, 1800); }} disabled={sent}
          style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: sent ? C.card : C.cyan, color: sent ? C.cyan : "#fff", transition: "all 0.25s", fontFamily: FONT }}>
          {sent ? <><Check style={{ width: 15, height: 15 }} /> Sent!</> : <><Send style={{ width: 15, height: 15 }} /> Send to {(member.user_name || member.name || "Member").split(" ")[0]}</>}
        </button>
      </div>
    </BottomSheet>
  );
}

function MobileStatsSheet({ open, onClose, enrichedMembers, checkIns, allMemberships, totalMembers, activeThisWeek, atRisk, newSignUps, weeklyChangePct }) {
  const [sheetOpen, setSheetOpen] = useState(open);
  useEffect(() => { setSheetOpen(open); }, [open]);
  const handleClose = () => { setSheetOpen(false); setTimeout(onClose, 400); };

  const visitTrend = useMemo(() => buildVisitTrend(checkIns), [checkIns]);
  const churnTrend = useMemo(() => buildChurnTrend(checkIns, allMemberships), [checkIns, allMemberships]);
  const dropOffPeaks = useMemo(() => buildDropOffPeaks(checkIns, allMemberships), [checkIns, allMemberships]);

  const total = totalMembers || allMemberships.length;
  const active = activeThisWeek || enrichedMembers.filter(m => m._ds <= 7).length;
  const risk = atRisk || enrichedMembers.filter(m => m._churn >= 60).length;
  const newM = newSignUps || enrichedMembers.filter(m => m.status === "New").length;
  const membershipMap = { monthly: 60, annual: 90, premium: 120, lifetime: 0 };
  const avgMv = allMemberships.length > 0 ? Math.round(allMemberships.reduce((sum, m) => sum + (membershipMap[m.membership_type] || 60), 0) / allMemberships.length) : 0;

  if (!open) return null;
  return (
    <BottomSheet open={sheetOpen} onClose={handleClose} maxHeight="92vh" noPadding>
      <div style={{ padding: "4px 18px 16px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.t1 }}>Analytics</div>
          <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2 }}>Real-time member data</div>
        </div>
        <button onClick={handleClose} style={{ width: 34, height: 34, borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X style={{ width: 14, height: 14, color: C.t3 }} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ padding: "20px", borderRadius: 16, marginBottom: 14, background: C.card, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Members</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1 }}>{total}</div>
          </div>
          {weeklyChangePct != null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, color: weeklyChangePct >= 0 ? C.cyan : C.red, fontWeight: 700, justifyContent: "flex-end" }}>
                {weeklyChangePct >= 0 ? <ArrowUpRight style={{ width: 18, height: 18 }} /> : <ArrowDownRight style={{ width: 18, height: 18 }} />}
                {weeklyChangePct >= 0 ? "+" : ""}{weeklyChangePct}%
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Active",  val: active, col: C.cyan },
            { label: "At Risk", val: risk,   col: C.red  },
            { label: "New",     val: newM,   col: C.blue },
            { label: "Avg/mo",  val: `£${avgMv}`, col: C.t1 },
          ].map((s, i) => (
            <div key={i} style={{ padding: "16px", borderRadius: 14, background: C.card, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 10.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>Visit Trend</div>
            <div style={{ fontSize: 11, color: C.t3 }}>6 months</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: "14px 10px 8px" }}>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={visitTrend} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
                <defs>
                  <linearGradient id="vgm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t3, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip suffix=" visits" />} />
                <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2.5} fill="url(#vgm)" dot={false}
                  activeDot={{ r: 4, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 14 }}>Drop-off Peaks</div>
          <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, overflow: "hidden" }}>
            {dropOffPeaks.map((b, i) => (
              <div key={i} style={{ padding: "14px 16px", borderBottom: i < 2 ? `1px solid ${C.brd}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{b.label}</span>
                    <span style={{ fontSize: 11, color: C.t3, marginLeft: 8 }}>{b.note}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: b.pct >= 60 ? C.red : b.pct >= 40 ? C.amber : C.green }}>{b.pct}%</span>
                </div>
                <div style={{ height: 5, background: C.brd, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${b.pct}%`, height: "100%", background: b.pct >= 60 ? C.red : b.pct >= 40 ? C.amber : C.green, borderRadius: 3, opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT COMPONENT — receives real data from GymOwnerDashboard
══════════════════════════════════════════════════════════════ */
export default function TabMembers({
  allMemberships = [],
  checkIns = [],
  memberLastCheckIn = {},
  atRiskMembersList = [],
  totalMembers,
  activeThisWeek,
  newSignUps,
  atRisk,
  retentionRate,
  weeklyChangePct,
  avatarMap = {},
  now,
  memberFilter: externalFilter,
  setMemberFilter: setExternalFilter,
  memberSearch: externalSearch,
  setMemberSearch: setExternalSearch,
  memberSort: externalSort,
  setMemberSort: setExternalSort,
  openModal,
  Spark,
  Delta,
}) {
  const isMobile = useIsMobile();

  const [filter,       setFilter]      = useState(externalFilter || "all");
  const [sort,         setSort]        = useState(externalSort || "lastVisit");
  const [search,       setSearch]      = useState(externalSearch || "");
  const [preview,      setPreview]     = useState(null);
  const [msgTarget,    setMsgTarget]   = useState(null);
  const [statsOpen,    setStatsOpen]   = useState(false);
  const [actionTarget, setActionTarget] = useState(null);

  // Sync external filter/sort if provided
  useEffect(() => { if (externalFilter !== undefined) setFilter(externalFilter); }, [externalFilter]);
  useEffect(() => { if (externalSort !== undefined) setSort(externalSort); }, [externalSort]);
  useEffect(() => { if (externalSearch !== undefined) setSearch(externalSearch); }, [externalSearch]);

  const nowMs = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = nowMs - 30 * 86400000;

  /* ─ Enrich members with computed fields from real data ─ */
  const enrichedMembers = useMemo(() => {
    return allMemberships.map((m, idx) => {
      const userId = m.user_id;
      const memberCIs = checkIns.filter(c => c.user_id === userId);
      const sortedCIs = memberCIs.sort((a, b) =>
        new Date(b.check_in_date || b.created_date || 0) - new Date(a.check_in_date || a.created_date || 0)
      );
      const lastCI = memberLastCheckIn[userId] || (sortedCIs[0] ? (sortedCIs[0].check_in_date || sortedCIs[0].created_date) : null);
      const _ds = computeDaysSince(lastCI);
      const _v30 = memberCIs.filter(c => {
        const t = c.check_in_date || c.created_date;
        return t && new Date(t).getTime() >= thirtyDaysAgo;
      }).length;
      const _totalCI = memberCIs.length;
      const _churn = deriveChurnRisk(m, checkIns, now);
      const status = deriveStatus(m, checkIns, now);
      const _action = deriveAction(status);
      const _rc = deriveSuccessRate(_churn);
      // Streak: consecutive days with check-ins
      let _streak = 0;
      const ciDays = new Set(sortedCIs.map(c => {
        const t = c.check_in_date || c.created_date;
        return t ? new Date(t).toDateString() : null;
      }).filter(Boolean));
      for (let d = 0; d < 30; d++) {
        const dayStr = new Date(nowMs - d * 86400000).toDateString();
        if (ciDays.has(dayStr)) _streak++; else break;
      }
      // App days: use updated_date of member record as proxy for last app activity
      const appDate = m.updated_date || m.last_active || null;
      const _appDays = appDate ? computeDaysSince(appDate) : null;

      return { ...m, idx, _ds, _v30, _totalCI, _churn, _streak, _appDays, _action, _rc, status };
    });
  }, [allMemberships, checkIns, memberLastCheckIn, nowMs, thirtyDaysAgo]);

  /* ─ Segment counts ─ */
  const counts = useMemo(() => ({
    all:      enrichedMembers.length,
    atRisk:   enrichedMembers.filter(m => m.status === "At risk").length,
    dropping: enrichedMembers.filter(m => m.status === "Dropping off").length,
    new:      enrichedMembers.filter(m => m.status === "New").length,
    active:   enrichedMembers.filter(m => m.status === "Engaged" || m.status === "Consistent").length,
    inactive: enrichedMembers.filter(m => m._ds >= 14).length,
  }), [enrichedMembers]);

  /* ─ Filter + sort ─ */
  const visible = useMemo(() => {
    let list = [...enrichedMembers];
    if (filter === "atRisk")   list = list.filter(m => m.status === "At risk");
    if (filter === "dropping") list = list.filter(m => m.status === "Dropping off");
    if (filter === "new")      list = list.filter(m => m.status === "New");
    if (filter === "active")   list = list.filter(m => m.status === "Engaged" || m.status === "Consistent");
    if (filter === "inactive") list = list.filter(m => m._ds >= 14);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => (m.user_name || m.name || "").toLowerCase().includes(q) || (m.user_email || "").toLowerCase().includes(q));
    }
    return list.sort((a, b) =>
      sort === "name"  ? (a.user_name || a.name || "").localeCompare(b.user_name || b.name || "") :
      sort === "churn" ? b._churn - a._churn :
      a._ds - b._ds
    );
  }, [enrichedMembers, filter, sort, search]);

  const handleMsg = useCallback(m => { setMsgTarget(m); setPreview(null); }, []);
  const handleCardAction = useCallback(m => { setActionTarget(m); }, []);
  const handleActionConfirm = useCallback(m => { setActionTarget(null); setTimeout(() => setMsgTarget(m), 50); }, []);

  /* ─── MOBILE ─────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, color: C.t1, fontFamily: FONT, overflow: "hidden" }}>
        <div style={{ flexShrink: 0, position: "sticky", top: 0, zIndex: 100, background: C.bg, borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>Members CRM</div>
              <div style={{ fontSize: 11, color: C.t3 }}>{counts.all} total · {counts.atRisk} at risk</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {counts.atRisk > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, background: C.redD, border: `1px solid ${C.redB}`, fontSize: 12, color: C.red, fontWeight: 700 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red }} />{counts.atRisk}
                </div>
              )}
              <button onClick={() => setStatsOpen(true)} style={{ width: 40, height: 40, borderRadius: 11, background: C.cyanD, border: `1px solid ${C.cyanB}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <BarChart2 style={{ width: 16, height: 16, color: C.cyan }} />
              </button>
            </div>
          </div>
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, padding: "10px 14px" }}>
              <Search style={{ width: 14, height: 14, color: C.t3, flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 14, fontFamily: FONT }} />
            </div>
          </div>
          <MobileFilterChips filter={filter} setFilter={setFilter} counts={counts} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 8px", background: C.bg }}>
            <span style={{ fontSize: 12, color: C.t3 }}>{visible.length} member{visible.length !== 1 ? "s" : ""}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <SlidersHorizontal style={{ width: 12, height: 12, color: C.t3 }} />
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: "transparent", border: "none", color: C.t2, fontSize: 12, outline: "none", cursor: "pointer", fontFamily: FONT, appearance: "none" }}>
                <option value="lastVisit">Last visit</option>
                <option value="churn">Highest risk</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingTop: 10, paddingBottom: 20 }}>
          {visible.length === 0 ? (
            <div style={{ padding: "64px 16px", textAlign: "center" }}>
              <Users style={{ width: 36, height: 36, color: C.t3, margin: "0 auto 14px", display: "block" }} />
              <div style={{ fontSize: 15, color: C.t2, fontWeight: 600 }}>No members match</div>
              <div style={{ fontSize: 12.5, color: C.t3, marginTop: 6 }}>Try a different filter</div>
            </div>
          ) : visible.map(m => (
            <MobileMemberCard key={m.user_id || m.id} m={m} onPreview={mm => setPreview(preview?.user_id === mm.user_id ? null : mm)} onMessage={handleCardAction} avatarMap={avatarMap} />
          ))}
        </div>

        {preview && <MobilePreviewSheet m={preview} onClose={() => setPreview(null)} onMessage={handleMsg} avatarMap={avatarMap} />}
        {actionTarget && (
          <BottomSheet open={!!actionTarget} onClose={() => setActionTarget(null)} maxHeight="80vh" noPadding>
            <div style={{ padding: "4px 18px 14px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>Choose Action</div>
                <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>for {(actionTarget.user_name || actionTarget.name || "Member").split(" ")[0]}</div>
              </div>
              <button onClick={() => setActionTarget(null)} style={{ width: 32, height: 32, borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 13, height: 13, color: C.t3 }} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 0" }}>
              {ACTIONS.map(a => {
                const on = a === actionTarget._action;
                return (
                  <div key={a} onClick={() => handleActionConfirm({ ...actionTarget, _action: a })}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, marginBottom: 8, background: on ? C.cyanD : C.card, border: `1.5px solid ${on ? C.cyanB : C.brd}`, cursor: "pointer" }}>
                    <span style={{ fontSize: 14, fontWeight: on ? 700 : 500, color: on ? C.cyan : C.t1 }}>{a}</span>
                    {on && <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center" }}><Check style={{ width: 12, height: 12, color: "#fff" }} /></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "14px 14px 28px", borderTop: `1px solid ${C.brd}`, flexShrink: 0 }}>
              <button onClick={() => handleActionConfirm(actionTarget)} style={{ width: "100%", padding: "14px", borderRadius: 12, background: C.cyan, border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Send style={{ width: 14, height: 14 }} />Send "{actionTarget._action}"
              </button>
            </div>
          </BottomSheet>
        )}
        {msgTarget && <MobileMessageToast member={msgTarget} onClose={() => setMsgTarget(null)} avatarMap={avatarMap} />}
        {statsOpen && <MobileStatsSheet open={statsOpen} onClose={() => setStatsOpen(false)} enrichedMembers={enrichedMembers} checkIns={checkIns} allMemberships={allMemberships} totalMembers={totalMembers} activeThisWeek={activeThisWeek} atRisk={atRisk} newSignUps={newSignUps} weeklyChangePct={weeklyChangePct} />}
      </div>
    );
  }

  /* ─── DESKTOP ────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", height: "100%", background: C.bg, color: C.t1, fontFamily: FONT, overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <div style={{ padding: "14px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
                Members <span style={{ color: C.t3, fontWeight: 300 }}>/</span> <span style={{ color: C.cyan }}>CRM</span>
              </div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{counts.all} total members · live data</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.brd}`, borderRadius: 7, padding: "5px 10px" }}>
                <Search style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…" style={{ background: "transparent", border: "none", outline: "none", color: C.t1, fontSize: 12, width: 150, fontFamily: FONT }} />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "6px 10px", borderRadius: 7, background: C.card, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11.5, outline: "none", cursor: "pointer", fontFamily: FONT }}>
                <option value="lastVisit">Last visit</option>
                <option value="churn">Highest risk</option>
                <option value="name">Name A–Z</option>
              </select>
              {openModal && (
                <button onClick={() => openModal("members")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: C.cyan, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                  <Plus style={{ width: 12, height: 12 }} /> Manage
                </button>
              )}
            </div>
          </div>

          <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />

          <div style={{ flex: 1, overflowY: "auto" }}>
            <TableHead sort={sort} setSort={setSort} />
            {visible.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <Users style={{ width: 28, height: 28, color: C.t3, margin: "0 auto 10px", display: "block" }} />
                <div style={{ fontSize: 13, color: C.t2 }}>No members match</div>
              </div>
            ) : visible.map((m, i) => (
              <MemberRow key={m.user_id || m.id} m={m} isPrev={preview?.user_id === m.user_id} onPreview={mm => setPreview(preview?.user_id === mm.user_id ? null : mm)} onMessage={handleMsg} isLast={i === visible.length - 1} avatarMap={avatarMap} />
            ))}
            <div style={{ padding: "8px 18px", borderTop: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10.5, color: C.t3 }}>{visible.length} of {counts.all} members</span>
            </div>
          </div>
        </div>

        <RightPanel enrichedMembers={enrichedMembers} checkIns={checkIns} allMemberships={allMemberships} totalMembers={totalMembers || counts.all} activeThisWeek={activeThisWeek} atRisk={atRisk} newSignUps={newSignUps} weeklyChangePct={weeklyChangePct} />
      </div>

      {preview   && <MemberPreview m={preview} onClose={() => setPreview(null)} onMessage={handleMsg} avatarMap={avatarMap} />}
      {msgTarget && <MessageToast member={msgTarget} onClose={() => setMsgTarget(null)} />}
    </div>
  );
}