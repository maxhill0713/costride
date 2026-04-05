/**
 * MembersPageAI — restrained palette matching automations design system
 * Color used only for critical signals; everything else is neutral.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Users, UserPlus,
  Flame, Send, X, ChevronRight, ChevronDown, ChevronLeft, Search,
  Check, Bell, Activity, Star, Tag, MoreHorizontal,
  Plus, ArrowUpRight, DollarSign,
} from "lucide-react";

/* ── Design Tokens — restrained, automations-matching ───────────── */
const T = {
  bg:         "#08090e",
  surface:    "#0f1016",
  surfaceEl:  "#13141c",
  surfaceHov: "#171820",
  border:     "#1c1e2a",
  borderEl:   "#222436",
  divider:    "#111218",
  t1: "#e8e8ec", t2: "#7a7a8e", t3: "#454558", t4: "#252535",
  accent:    "#4c6ef5",
  accentDim: "#111828",
  // Status colors — muted, used only for dots, key numbers, trend values
  red:       "#c0392b",
  redMuted:  "#1e0f0d",
  amber:     "#8a6020",
  amberMuted:"#1a1408",
  green:     "#257a52",
  greenMuted:"#0a1a10",
  r:   "7px",
  rsm: "5px",
  sh:  "0 1px 2px rgba(0,0,0,0.6)",
  shMd:"0 4px 24px rgba(0,0,0,0.5)",
};

/* ── Mock Data ──────────────────────────────────────────────────── */
const NOW = new Date();
const daysAgo = (n) => new Date(NOW.getTime() - n * 864e5);

const MOCK_MEMBERS = [
  { id:"1", name:"Marcus Webb",    initials:"MW", colorIdx:0, plan:"Premium", monthlyValue:120, lastVisit:daysAgo(22), daysSince:22, visits30:0,  prevVisits30:8,  visitsTotal:47,  streak:0,  churnPct:84, joinedDaysAgo:180, returnChance:38, reasons:["No visits in 22 days","Was averaging 8/mo → 0","Missed last 3 classes"],       bestAction:"Send 'We miss you'",   status:"At risk",      statusDetail:"No visits in 22 days · Dropped from 8/month",   segment:"atRisk"   },
  { id:"2", name:"Priya Sharma",   initials:"PS", colorIdx:1, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(16), daysSince:16, visits30:1,  prevVisits30:4,  visitsTotal:31,  streak:0,  churnPct:71, joinedDaysAgo:95,  returnChance:44, reasons:["16 days since last visit","Frequency down 75%","Usually comes Tues/Thurs"],      bestAction:"Friendly check-in",    status:"Dropping off", statusDetail:"Frequency dropped 75% · Pattern broken",         segment:"atRisk"   },
  { id:"3", name:"Tyler Rhodes",   initials:"TR", colorIdx:2, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(9),  daysSince:9,  visits30:1,  prevVisits30:5,  visitsTotal:12,  streak:0,  churnPct:55, joinedDaysAgo:28,  returnChance:52, reasons:["New member not building habit","Only 1 visit this month","Week 4 — critical window"], bestAction:"Habit-building nudge",  status:"New",          statusDetail:"28 days in · Only 1 visit this month",           segment:"new"      },
  { id:"4", name:"Chloe Nakamura", initials:"CN", colorIdx:3, plan:"Annual",  monthlyValue:90,  lastVisit:daysAgo(1),  daysSince:1,  visits30:14, prevVisits30:11, visitsTotal:203, streak:18, churnPct:4,  joinedDaysAgo:420, returnChance:96, reasons:[],                                                                                       bestAction:"Challenge invite",      status:"Consistent",   statusDetail:"18-day streak · Up 27% this month",              segment:"active"   },
  { id:"5", name:"Devon Osei",     initials:"DO", colorIdx:4, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(19), daysSince:19, visits30:0,  prevVisits30:3,  visitsTotal:8,   streak:0,  churnPct:78, joinedDaysAgo:45,  returnChance:35, reasons:["19 days absent","Early-stage member at risk","Visited 3x then stopped"],               bestAction:"Personal outreach",     status:"At risk",      statusDetail:"19 days absent · Joined & disappeared",          segment:"atRisk"   },
  { id:"6", name:"Anya Petrov",    initials:"AP", colorIdx:5, plan:"Premium", monthlyValue:120, lastVisit:daysAgo(0),  daysSince:0,  visits30:9,  prevVisits30:7,  visitsTotal:88,  streak:7,  churnPct:6,  joinedDaysAgo:210, returnChance:94, reasons:[],                                                                                       bestAction:"Referral ask",          status:"Engaged",      statusDetail:"7-day streak · Consistent performer",            segment:"active"   },
  { id:"7", name:"Jamie Collins",  initials:"JC", colorIdx:6, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(5),  daysSince:5,  visits30:2,  prevVisits30:4,  visitsTotal:19,  streak:0,  churnPct:42, joinedDaysAgo:58,  returnChance:58, reasons:[],                                                                                       bestAction:"Motivate",              status:"Dropping off", statusDetail:"Frequency halved · Below target",                segment:"inactive" },
  { id:"8", name:"Sam Rivera",     initials:"SR", colorIdx:7, plan:"Monthly", monthlyValue:60,  lastVisit:null,        daysSince:999, visits30:0, prevVisits30:0,  visitsTotal:1,   streak:0,  churnPct:91, joinedDaysAgo:6,   returnChance:30, reasons:["Joined 6 days ago, 1 visit only","Critical first-week window","Has not returned"],       bestAction:"Week-1 welcome",        status:"New",          statusDetail:"6 days in · First week habit window",            segment:"new"      },
];

const AVATAR_LETTERS = [
  "#3a3f5a", "#2a3d34", "#3a2f4a", "#3d3520", "#3a1f1f",
  "#1d3540", "#3a2f4a", "#3d3025",
];

/* ── Helpers ────────────────────────────────────────────────────── */
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 900;
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return val;
}

/* ── Primitives ─────────────────────────────────────────────────── */
function Avatar({ m, size = 30 }) {
  const bg = AVATAR_LETTERS[m.colorIdx % AVATAR_LETTERS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, border: `1px solid ${T.border}`,
      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 600, color: T.t2,
      fontFamily: "monospace", letterSpacing: "0.02em",
    }}>
      {m.initials}
    </div>
  );
}

function StatusDot({ color, pulse }) {
  return (
    <span style={{
      display: "inline-block", width: 5, height: 5, borderRadius: "50%",
      background: color, flexShrink: 0,
      animation: pulse ? "pulse 2s ease-in-out infinite" : "none",
    }} />
  );
}

function StatusPill({ m }) {
  const isUrgent = m.status === "At risk";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 500,
      background: T.surfaceEl, color: isUrgent ? T.red : T.t2,
      border: `1px solid ${T.border}`,
    }}>
      {isUrgent && <StatusDot color={T.red} pulse />}
      {m.status}
    </span>
  );
}

function ThinBar({ pct, color }) {
  return (
    <div style={{ height: 2, borderRadius: 99, background: T.divider, width: "100%", marginTop: 6 }}>

    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.r, boxShadow: T.sh, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function GhostBtn({ children, onClick, style = {}, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 10px", borderRadius: T.rsm, fontSize: 11, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit", border: `1px solid ${T.border}`,
        background: hov ? T.surfaceHov : T.surfaceEl,
        color: danger && hov ? T.red : T.t2,
        transition: "all .12s", ...style,
      }}
    >{children}</button>
  );
}

function PrimaryBtn({ children, onClick, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: T.rsm, fontSize: 11, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", border: "1px solid transparent",
        background: T.accent, color: "#fff", opacity: hov ? 0.88 : 1,
        transition: "opacity .12s", whiteSpace: "nowrap", ...style,
      }}
    >{children}</button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   METRICS BAR
══════════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, sub, prefix = "", delay = 0, valueRed }) {
  const counted = useCountUp(typeof value === "number" ? value : 0, delay);
  const display = typeof value === "number" ? `${prefix}${counted.toLocaleString()}` : value;
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: T.rsm,
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} color={T.t3} />
        </div>
        <ArrowUpRight size={11} color={T.t4} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: valueRed ? T.red : T.t1, marginBottom: 5, fontVariantNumeric: "tabular-nums" }}>
        {display}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: T.t2 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{sub}</div>
    </Card>
  );
}

function MetricsBar({ members }) {
  const atRiskCount = members.filter(m => m.churnPct >= 60).length;
  const atRiskValue = members.filter(m => m.churnPct >= 60).reduce((s, m) => s + m.monthlyValue, 0);
  const activeCount = members.filter(m => m.daysSince < 7).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
      <StatCard icon={Users}         label="Total Members"   sub="all time"            value={members.length} delay={0}   />
      <StatCard icon={Activity}      label="Active (7 days)" sub={`${Math.round(activeCount/members.length*100)}% of total`} value={activeCount} delay={100} />
      <StatCard icon={AlertTriangle} label="At Risk"         sub="60%+ churn risk"     value={atRiskCount}    delay={200} valueRed={atRiskCount > 0} />
      <StatCard icon={DollarSign}    label="Revenue at Risk" sub="per month"            value={atRiskValue}    delay={300} prefix="$" valueRed={atRiskValue > 0} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRIORITY MEMBERS
══════════════════════════════════════════════════════════════════ */
function ActOnToday({ members, onMessage, onSelect }) {
  const priority = useMemo(() =>
    members.filter(m => m.churnPct >= 40).sort((a, b) => b.churnPct - a.churnPct).slice(0, 4),
  [members]);

  if (!priority.length) return null;
  const totalAtRisk = priority.reduce((s, m) => s + m.monthlyValue, 0);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>
            Priority Today
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "1px 7px", borderRadius: 20, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
            <StatusDot color={T.red} pulse />
            <span style={{ fontSize: 10, fontWeight: 600, color: T.red }}>{priority.length} need attention</span>
          </div>
        </div>
        <span style={{ fontSize: 11, color: T.t3 }}>${totalAtRisk}/mo at risk</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        {priority.map(m => {
          const barColor = m.churnPct >= 70 ? T.red : T.amber;
          return (
            <div
              key={m.id}
              onClick={() => onSelect(m)}
              style={{
                padding: "16px 18px",
                background: T.surface, borderRadius: T.r,
                border: `1px solid ${T.border}`,
                boxShadow: T.sh, cursor: "pointer", transition: "background .12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
              onMouseLeave={e => e.currentTarget.style.background = T.surface}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar m={m} size={34} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>
                      {m.daysSince === 999 ? "Never visited" : `Last seen ${m.daysSince}d ago`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: m.churnPct >= 70 ? T.red : T.t2, fontVariantNumeric: "tabular-nums" }}>{m.churnPct}%</div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 1 }}>churn risk</div>
                </div>
              </div>

              <ThinBar pct={m.churnPct} color={barColor} />

              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 3 }}>
                {m.reasons.slice(0, 2).map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: T.t4, fontSize: 10, marginTop: 2 }}>—</span>
                    <span style={{ fontSize: 11, color: T.t2, lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <span style={{ fontSize: 11, color: T.t3 }}>
                  <span style={{ color: T.t2, fontWeight: 500 }}>${m.monthlyValue}</span>/mo · {m.returnChance}% return likelihood
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onMessage(m); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 11px", borderRadius: T.rsm,
                    background: T.surfaceEl, border: `1px solid ${T.borderEl}`,
                    color: T.t2, fontSize: 10, fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit", transition: "all .12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.background = T.surfaceHov; }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.t2; e.currentTarget.style.background = T.surfaceEl; }}
                >
                  <Send size={9} /> {m.bestAction}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SMART SEGMENTS
══════════════════════════════════════════════════════════════════ */
function SmartSegments({ members, activeFilter, onFilter, onBulkMessage }) {
  const segments = useMemo(() => [
    { id:"atRisk",   icon:AlertTriangle, label:"Need attention", count: members.filter(m=>m.churnPct>=60).length,                                   action:"Message all", urgentDot: true },
    { id:"dropping", icon:TrendingDown,  label:"Dropping off",   count: members.filter(m=>m.prevVisits30>0&&m.visits30<=m.prevVisits30*0.5).length,  action:"Nudge all"   },
    { id:"new",      icon:UserPlus,      label:"New members",    count: members.filter(m=>m.joinedDaysAgo<=14).length,                               action:"Welcome"     },
    { id:"active",   icon:Flame,         label:"On streak",      count: members.filter(m=>m.streak>=5).length,                                       action:"Challenge"   },
  ], [members]);

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {segments.map(s => {
        const Icon = s.icon;
        const on = activeFilter === s.id;
        return (
          <div
            key={s.id}
            onClick={() => onFilter(on ? "all" : s.id)}
            style={{
              flex: "1 1 160px", minWidth: 150,
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: T.r,
              background: on ? T.surfaceHov : T.surface,
              border: `1px solid ${on ? T.borderEl : T.border}`,
              boxShadow: T.sh, cursor: "pointer", transition: "all .12s",
            }}
            onMouseEnter={e => { if (!on) e.currentTarget.style.background = T.surfaceEl; }}
            onMouseLeave={e => { if (!on) e.currentTarget.style.background = T.surface; }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: T.rsm,
              background: T.surfaceEl, border: `1px solid ${T.border}`, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={13} color={T.t3} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.urgentDot && s.count > 0 ? T.red : T.t1, lineHeight: 1.1 }}>{s.count}</div>
                {s.urgentDot && s.count > 0 && <StatusDot color={T.red} />}
              </div>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
            </div>
            {s.count > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onBulkMessage(s.id); }}
                style={{
                  padding: "3px 8px", borderRadius: T.rsm,
                  background: "transparent", border: `1px solid ${T.border}`,
                  color: T.t3, fontSize: 10, cursor: "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                  transition: "color .12s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = T.t2}
                onMouseLeave={e => e.currentTarget.style.color = T.t3}
              >{s.action}</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FILTER BAR
══════════════════════════════════════════════════════════════════ */
function FilterBar({ filter, setFilter, search, setSearch, sort, setSort, counts }) {
  const tabs = [
    { id:"all",      label:"All",      count:counts.all      },
    { id:"atRisk",   label:"At Risk",  count:counts.atRisk   },
    { id:"dropping", label:"Dropping", count:counts.dropping },
    { id:"new",      label:"New",      count:counts.new      },
    { id:"active",   label:"Active",   count:counts.active   },
    { id:"inactive", label:"Inactive", count:counts.inactive },
  ];

  return (
    <div style={{
      padding: "9px 14px", borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
      position: "sticky", top: 0, background: T.surface, zIndex: 10,
    }}>
      {tabs.map(t => {
        const on = filter === t.id;
        return (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: T.rsm, fontSize: 11,
            fontWeight: on ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
            background: on ? T.surfaceEl : "transparent",
            color: on ? T.t1 : T.t3,
            border: `1px solid ${on ? T.borderEl : "transparent"}`,
            transition: "all .1s",
          }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 9, color: on ? T.t2 : T.t4 }}>{t.count}</span>}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />

      <div style={{ position: "relative" }}>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          padding: "5px 26px 5px 9px", borderRadius: T.rsm,
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          color: T.t2, fontSize: 11, outline: "none",
          cursor: "pointer", fontFamily: "inherit", appearance: "none",
        }}>
          <option value="churnDesc">Highest risk</option>
          <option value="lastVisit">Recently active</option>
          <option value="value">Highest value</option>
          <option value="name">Name A–Z</option>
        </select>
        <ChevronDown size={9} color={T.t4} style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
      </div>

      <div style={{ position: "relative" }}>
        <Search size={11} color={T.t4} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
        <input
          placeholder="Search members…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: "5px 10px 5px 26px", borderRadius: T.rsm,
            background: T.surfaceEl, border: `1px solid ${T.border}`,
            color: T.t1, fontSize: 11, outline: "none", fontFamily: "inherit", width: 160,
            transition: "border-color .12s",
          }}
          onFocus={e => e.target.style.borderColor = T.borderEl}
          onBlur={e => e.target.style.borderColor = T.border}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBERS TABLE
══════════════════════════════════════════════════════════════════ */
function MembersTable({ members, filter, search, sort, setSort, selectedRows, toggleRow, toggleAll, previewMember, setPreviewMember, onMessage }) {
  const filtered = useMemo(() => {
    let list = members;
    if (filter==="atRisk")   list = list.filter(m=>m.churnPct>=60);
    if (filter==="dropping") list = list.filter(m=>m.prevVisits30>0&&m.visits30<=m.prevVisits30*0.5);
    if (filter==="new")      list = list.filter(m=>m.joinedDaysAgo<=14);
    if (filter==="active")   list = list.filter(m=>m.streak>=5);
    if (filter==="inactive") list = list.filter(m=>m.daysSince>=14);
    if (search) list = list.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [members, filter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sort==="churnDesc") return b.churnPct-a.churnPct;
    if (sort==="lastVisit") return a.daysSince-b.daysSince;
    if (sort==="value")     return b.monthlyValue-a.monthlyValue;
    if (sort==="name")      return a.name.localeCompare(b.name);
    return b.churnPct-a.churnPct;
  }), [filtered, sort]);

  const COLS = "28px 1.8fr 1.1fr 70px 100px 90px 80px 130px";
  const colDefs = [
    { label:"MEMBER",    key:"name"      },
    { label:"STATUS",    key:null        },
    { label:"CHURN",     key:"churnDesc" },
    { label:"LAST SEEN", key:"lastVisit" },
    { label:"TREND",     key:null        },
    { label:"VALUE",     key:"value"     },
    { label:"ACTION",    key:null        },
  ];

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: COLS, gap: 8,
        padding: "7px 16px", borderBottom: `1px solid ${T.border}`,
        background: T.bg,
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
          <input type="checkbox"
            checked={sorted.length>0 && selectedRows.size===sorted.length}
            onChange={() => toggleAll(sorted)}
            style={{ width:12, height:12, accentColor:T.accent, cursor:"pointer" }}
          />
        </div>
        {colDefs.map((c, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
            <span
              style={{ fontSize:9, fontWeight:600, color:sort===c.key ? T.t2 : T.t4, textTransform:"uppercase", letterSpacing:".1em", cursor:c.key?"pointer":"default" }}
              onClick={() => c.key && setSort(c.key)}
            >{c.label}</span>
            {c.key && <ChevronDown size={7} color={T.t4} />}
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding:"52px 20px", textAlign:"center" }}>
          <Users size={32} color={T.t4} style={{ margin:"0 auto 12px" }} />
          <div style={{ fontSize:13, color:T.t2, fontWeight:500, marginBottom:4 }}>No members match</div>
          <div style={{ fontSize:11, color:T.t3 }}>Try a different filter or search term</div>
        </div>
      ) : sorted.map((m, idx) => {
        const isSel  = selectedRows.has(m.id);
        const isPrev = previewMember?.id === m.id;
        const trendPct = m.prevVisits30 > 0 ? Math.round(((m.visits30-m.prevVisits30)/m.prevVisits30)*100) : 0;
        const barColor = m.churnPct >= 70 ? T.red : m.churnPct >= 40 ? T.amber : T.t3;

        return (
          <div
            key={m.id}
            onClick={() => setPreviewMember(isPrev ? null : m)}
            style={{
              display: "grid", gridTemplateColumns: COLS, gap: 8,
              padding: "10px 16px",
              borderBottom: idx < sorted.length-1 ? `1px solid ${T.divider}` : "none",
              borderLeft: isPrev ? `2px solid ${T.accent}` : "2px solid transparent",
              background: isPrev ? T.surfaceEl : isSel ? `${T.accent}08` : "transparent",
              cursor: "pointer", transition: "background .1s", alignItems: "center",
            }}
            onMouseEnter={e => { if (!isPrev&&!isSel) e.currentTarget.style.background = T.surfaceHov; }}
            onMouseLeave={e => { e.currentTarget.style.background = isPrev ? T.surfaceEl : isSel ? `${T.accent}08` : "transparent"; }}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}
              onClick={e => { e.stopPropagation(); toggleRow(m.id); }}>
              <input type="checkbox" checked={isSel} onChange={() => toggleRow(m.id)}
                style={{ width:12, height:12, accentColor:T.accent, cursor:"pointer" }} />
            </div>

            {/* Member */}
            <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <Avatar m={m} size={28} />
                {m.streak >= 5 && (
                  <div style={{ position:"absolute", top:-2, right:-2, width:10, height:10, borderRadius:"50%", background:T.surfaceEl, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Flame size={6} color={T.t3} />
                  </div>
                )}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:isPrev ? T.accent : T.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                <div style={{ fontSize:10, color:T.t3 }}>{m.plan} · {m.visitsTotal} visits</div>
              </div>
            </div>

            {/* Status */}
            <div>
              <StatusPill m={m} />
              <div style={{ fontSize:10, color:T.t3, marginTop:3, lineHeight:1.4 }}>{m.statusDetail}</div>
            </div>

            {/* Churn — only this number gets color */}
            <div>
              <span style={{ fontSize:13, fontWeight:600, color: m.churnPct >= 70 ? T.red : m.churnPct >= 40 ? T.amber : T.t2, fontVariantNumeric:"tabular-nums" }}>
                {m.churnPct}%
              </span>
              <ThinBar pct={m.churnPct} color={barColor} />
            </div>

            {/* Last seen */}
            <div>
              <span style={{ fontSize:12, fontWeight:500, color: m.daysSince >= 14 ? T.red : m.daysSince <= 1 ? T.green : T.t1 }}>
                {m.daysSince===999 ? "Never" : m.daysSince===0 ? "Today" : `${m.daysSince}d ago`}
              </span>
            </div>

            {/* Trend */}
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              {trendPct>10
                ? <><TrendingUp size={11} color={T.green}/><span style={{ fontSize:10, color:T.green }}>+{trendPct}%</span></>
                : trendPct<-10
                ? <><TrendingDown size={11} color={T.red}/><span style={{ fontSize:10, color:T.red }}>{trendPct}%</span></>
                : <span style={{ fontSize:10, color:T.t3 }}>—</span>
              }
            </div>

            {/* Value */}
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:T.t1 }}>${m.monthlyValue}</div>
              <div style={{ fontSize:9, color:T.t3 }}>/month</div>
            </div>

            {/* Action */}
            <div onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onMessage(m)}
                onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.borderColor = T.borderEl; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.t2; e.currentTarget.style.borderColor = T.border; }}
                style={{
                  display:"flex", alignItems:"center", gap:4,
                  padding:"4px 9px", borderRadius:T.rsm,
                  background:"transparent", border:`1px solid ${T.border}`,
                  color:T.t2, fontSize:10, fontWeight:500,
                  cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
                  transition:"all .12s",
                }}
              >
                {m.bestAction} <ChevronRight size={7} />
              </button>
              <div style={{ fontSize:9, color:T.t3, marginTop:3 }}>~{m.returnChance}% success</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BULK ACTION BAR
══════════════════════════════════════════════════════════════════ */
function BulkBar({ selectedRows, members, onClear, onBulkMessage }) {
  if (selectedRows.size === 0) return null;
  const sel = members.filter(m => selectedRows.has(m.id));
  const totalVal = sel.reduce((s, m) => s + m.monthlyValue, 0);

  return (
    <div style={{ borderTop:`1px solid ${T.borderEl}`, background:T.surfaceEl }}>
      <div style={{ padding:"7px 16px", borderBottom:`1px solid ${T.divider}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:11, color:T.t2, fontWeight:500 }}>
          {selectedRows.size} selected
          <span style={{ color:T.t3, fontWeight:400 }}> · ${totalVal}/mo combined</span>
        </span>
        <button onClick={onClear} style={{ fontSize:11, color:T.t3, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", transition:"color .12s" }}
          onMouseEnter={e => e.currentTarget.style.color = T.t2}
          onMouseLeave={e => e.currentTarget.style.color = T.t3}>Clear</button>
      </div>
      <div style={{ padding:"9px 16px", display:"flex", alignItems:"center", gap:6 }}>
        <PrimaryBtn onClick={() => onBulkMessage(sel)}><Send size={11}/> Message {selectedRows.size}</PrimaryBtn>
        <GhostBtn><Tag size={11}/> Tag</GhostBtn>
        <GhostBtn><Star size={11}/> Add to list</GhostBtn>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:T.t3 }}>{sel.filter(m=>m.churnPct>=60).length} at risk in selection</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER PREVIEW PANEL
══════════════════════════════════════════════════════════════════ */
function MemberPreview({ m, onClose, onMessage }) {
  if (!m) return null;
  const barColor = m.churnPct >= 70 ? T.red : m.churnPct >= 40 ? T.amber : T.t3;
  const engScore = Math.min(100, Math.round((m.visits30 / 12) * 100));
  const engColor = engScore >= 60 ? T.green : engScore >= 30 ? T.amber : T.red;

  return (
    <div style={{
      position:"fixed", top:0, right:0, bottom:0, width:320,
      background:T.surface, borderLeft:`1px solid ${T.border}`,
      zIndex:200, display:"flex", flexDirection:"column",
      boxShadow:"-12px 0 40px rgba(0,0,0,0.6)",
      animation:"panelIn .18s ease",
    }}>
      <style>{`@keyframes panelIn{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      <div style={{ padding:"15px 18px", borderBottom:`1px solid ${T.divider}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Avatar m={m} size={38} />
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.t1, marginBottom:3 }}>{m.name}</div>
            <StatusPill m={m} />
          </div>
        </div>
        <button onClick={onClose} style={{ width:26, height:26, borderRadius:T.rsm, background:T.surfaceEl, border:`1px solid ${T.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <X size={11} color={T.t3} />
        </button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>
        {m.churnPct >= 40 && (
          <div style={{ padding:"12px 14px", borderRadius:T.r, marginBottom:12, background:T.surfaceEl, border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:600, color: m.churnPct >= 70 ? T.red : T.amber }}>{m.churnPct}% churn risk</span>
              <span style={{ fontSize:10, color:T.t3 }}>${m.monthlyValue}/mo</span>
            </div>
            <ThinBar pct={m.churnPct} color={barColor} />
            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4 }}>
              {m.reasons.map((r, i) => (
                <div key={i} style={{ display:"flex", gap:7 }}>
                  <span style={{ color:T.t4, fontSize:10, marginTop:2, flexShrink:0 }}>—</span>
                  <span style={{ fontSize:11, color:T.t2, lineHeight:1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 }}>
          {[{label:"This mo",val:m.visits30},{label:"Last mo",val:m.prevVisits30},{label:"Total",val:m.visitsTotal}].map((s, i) => (
            <div key={i} style={{ padding:"10px", borderRadius:T.rsm, background:T.surfaceEl, border:`1px solid ${T.border}`, textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color:T.t1, lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{s.val}</div>
              <div style={{ fontSize:9, color:T.t3, marginTop:3, textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:10, color:T.t3, textTransform:"uppercase", letterSpacing:".09em" }}>Engagement</span>
            <span style={{ fontSize:11, fontWeight:600, color:engColor }}>{engScore}%</span>
          </div>
          <div style={{ height:3, borderRadius:99, background:T.divider }}>
            <div style={{ height:"100%", width:`${engScore}%`, borderRadius:99, background:engColor, opacity:0.7 }} />
          </div>
        </div>

        <div style={{ padding:"12px 14px", borderRadius:T.r, background:T.surfaceEl, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:9, color:T.t3, textTransform:"uppercase", letterSpacing:".09em", marginBottom:4 }}>Recommended</div>
          <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:3 }}>{m.bestAction}</div>
          <div style={{ fontSize:10, color:T.t3 }}>{m.returnChance}% predicted success</div>
        </div>
      </div>

      <div style={{ padding:"13px 18px", borderTop:`1px solid ${T.divider}`, display:"flex", gap:7 }}>
        <button
          onClick={() => onMessage(m)}
          style={{ flex:1, padding:"8px", borderRadius:T.rsm, background:T.accent, border:"none", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
        >
          <Send size={11} /> {m.bestAction}
        </button>
        <button style={{ padding:"8px 11px", borderRadius:T.rsm, background:T.surfaceEl, border:`1px solid ${T.border}`, color:T.t2, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
          <MoreHorizontal size={13} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ALERTS SIDEBAR
══════════════════════════════════════════════════════════════════ */
function AlertsSidebar({ members, onFilter, onMessage }) {
  const highRisk = members.filter(m => m.churnPct >= 70);
  const newQuiet = members.filter(m => m.joinedDaysAgo <= 10 && m.visitsTotal < 2);
  const totalVal = highRisk.reduce((s, m) => s + m.monthlyValue, 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

      {highRisk.length > 0 && (
        <Card style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <StatusDot color={T.red} pulse />
            <span style={{ fontSize:12, fontWeight:600, color:T.t1 }}>{highRisk.length} likely to churn</span>
          </div>
          <div style={{ display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" }}>
            {highRisk.slice(0,3).map((m, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 7px 2px 3px", borderRadius:20, background:T.surfaceEl, border:`1px solid ${T.border}` }}>
                <Avatar m={m} size={14} />
                <span style={{ fontSize:10, color:T.t2 }}>{m.name.split(" ")[0]}</span>
              </div>
            ))}
            {highRisk.length > 3 && <span style={{ fontSize:10, color:T.t3, alignSelf:"center" }}>+{highRisk.length-3}</span>}
          </div>
          <div style={{ fontSize:11, color:T.t3, marginBottom:10 }}><span style={{ color:T.red, fontWeight:600 }}>${totalVal}</span>/mo at risk</div>
          <div style={{ display:"flex", gap:6 }}>
            <GhostBtn style={{ flex:1, justifyContent:"center" }} onClick={() => { onFilter("atRisk"); onMessage(null,"atRisk"); }}>
              <Send size={9} /> Message
            </GhostBtn>
            <GhostBtn onClick={() => onFilter("atRisk")}>View</GhostBtn>
          </div>
        </Card>
      )}

      {newQuiet.length > 0 && (
        <Card style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <UserPlus size={11} color={T.t3} />
            <span style={{ fontSize:12, fontWeight:600, color:T.t1 }}>New members going quiet</span>
          </div>
          <div style={{ display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" }}>
            {newQuiet.map((m, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 7px 2px 3px", borderRadius:20, background:T.surfaceEl, border:`1px solid ${T.border}` }}>
                <Avatar m={m} size={14} />
                <span style={{ fontSize:10, color:T.t2 }}>{m.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:T.t3, lineHeight:1.5, marginBottom:10 }}>
            Week-1 follow-up has the highest retention impact.
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <GhostBtn style={{ flex:1, justifyContent:"center" }} onClick={() => onFilter("new")}>
              <Send size={9} /> Follow up
            </GhostBtn>
            <GhostBtn onClick={() => onFilter("new")}>View</GhostBtn>
          </div>
        </Card>
      )}

      <Card style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
          <TrendingDown size={11} color={T.t3} />
          <span style={{ fontSize:12, fontWeight:600, color:T.t1 }}>Drop-off patterns</span>
        </div>
        <div style={{ fontSize:11, color:T.t3, marginBottom:12, lineHeight:1.5 }}>
          When members go quiet after joining.
        </div>
        {[
          { label:"Week 1", pct:25, color:T.red   },
          { label:"Week 2", pct:66, color:T.amber  },
          { label:"Week 4", pct:41, color:T.t3     },
        ].map((b, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:i<2?8:0 }}>
            <span style={{ fontSize:10, color:T.t3, minWidth:42 }}>{b.label}</span>
            <div style={{ flex:1, height:2, borderRadius:99, background:T.divider }}>
              <div style={{ height:"100%", width:`${b.pct}%`, background:b.color, borderRadius:99, opacity:0.5 }} />
            </div>
            <span style={{ fontSize:10, fontWeight:600, color:T.t2, minWidth:28, textAlign:"right" }}>{b.pct}%</span>
          </div>
        ))}
      </Card>

      <Card style={{ padding:"14px 16px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:T.t2, marginBottom:10, textTransform:"uppercase", letterSpacing:".1em" }}>Insights</div>
        {[
          `${highRisk.length} members haven't engaged in 14+ days`,
          "Highly engaged members refer at 3× the rate",
          "New members respond best in days 3–7",
        ].map((s, i) => (
          <div key={i} style={{ display:"flex", gap:7, marginBottom:7 }}>
            <span style={{ color:T.t4, fontSize:10, marginTop:2, flexShrink:0 }}>·</span>
            <span style={{ fontSize:11, color:T.t3, lineHeight:1.5 }}>{s}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MESSAGE TOAST
══════════════════════════════════════════════════════════════════ */
function MessageToast({ member, onClose }) {
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState(
    member ? `Hey ${member.name.split(" ")[0]}, we've missed seeing you at the gym. Your progress is waiting — come back and pick up where you left off.` : ""
  );
  if (!member) return null;

  return (
    <div style={{
      position:"fixed", bottom:82, right:26, width:350,
      background:T.surface, border:`1px solid ${T.borderEl}`,
      borderRadius:T.r, boxShadow:T.shMd, zIndex:300, overflow:"hidden",
      animation:"toastIn .18s ease",
    }}>
      <style>{`@keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div style={{ padding:"11px 14px", borderBottom:`1px solid ${T.divider}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <Bell size={11} color={T.t3} />
          <span style={{ fontSize:11, fontWeight:600, color:T.t1 }}>Push notification</span>
          <span style={{ fontSize:10, color:T.t3 }}>→ {member.name.split(" ")[0]}</span>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}>
          <X size={11} color={T.t3} />
        </button>
      </div>
      <div style={{ padding:"12px 14px" }}>
        <textarea
          value={body} onChange={e => setBody(e.target.value)} rows={3}
          style={{
            width:"100%", boxSizing:"border-box",
            background:T.surfaceEl, border:`1px solid ${T.border}`,
            borderRadius:T.rsm, padding:"8px 10px", fontSize:11,
            color:T.t1, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.6,
          }}
          onFocus={e => e.target.style.borderColor = T.borderEl}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <div style={{ marginTop:3, fontSize:10, color:T.t3 }}>
          {member.returnChance}% predicted return rate
        </div>
        <button
          onClick={() => { setSent(true); setTimeout(onClose, 1600); }}
          style={{
            marginTop:9, width:"100%", padding:"8px",
            borderRadius:T.rsm, border:"none",
            background: sent ? T.surfaceEl : T.accent,
            color: sent ? T.green : "#fff",
            fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            transition:"all .2s",
          }}
        >
          {sent ? <><Check size={11}/> Sent</> : <><Send size={11}/> Send to {member.name.split(" ")[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════ */
export default function MembersPageAI() {
  const members = MOCK_MEMBERS;
  const [filter,        setFilter]        = useState("all");
  const [search,        setSearch]        = useState("");
  const [sort,          setSort]          = useState("churnDesc");
  const [selectedRows,  setSelectedRows]  = useState(new Set());
  const [previewMember, setPreviewMember] = useState(null);
  const [messageTarget, setMessageTarget] = useState(null);

  const counts = useMemo(() => ({
    all:      members.length,
    atRisk:   members.filter(m=>m.churnPct>=60).length,
    dropping: members.filter(m=>m.prevVisits30>0&&m.visits30<=m.prevVisits30*0.5).length,
    new:      members.filter(m=>m.joinedDaysAgo<=14).length,
    active:   members.filter(m=>m.streak>=5).length,
    inactive: members.filter(m=>m.daysSince>=14).length,
  }), [members]);

  const toggleRow = useCallback(id => {
    setSelectedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const toggleAll = useCallback(rows => {
    if (selectedRows.size === rows.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(rows.map(m => m.id)));
  }, [selectedRows]);

  const handleMessage = useCallback(m => { setMessageTarget(m); setPreviewMember(null); }, []);

  const handleBulkMessage = useCallback(segId => {
    const seg = members.filter(m => {
      if (segId==="atRisk")   return m.churnPct>=60;
      if (segId==="dropping") return m.prevVisits30>0&&m.visits30<=m.prevVisits30*0.5;
      if (segId==="new")      return m.joinedDaysAgo<=14;
      if (segId==="active")   return m.streak>=5;
      return false;
    });
    if (seg.length) setMessageTarget(seg[0]);
  }, [members]);

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      fontFamily:"'Geist', 'DM Sans', 'Helvetica Neue', Arial, sans-serif",
      color:T.t1, fontSize:13, lineHeight:1.5,
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
      `}</style>

      <div style={{ maxWidth:1380, margin:"0 auto", padding:"24px 24px 80px" }}>

        {/* Page header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, gap:12 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:4 }}>
              <div style={{ width:28, height:28, borderRadius:T.rsm, background:T.surfaceEl, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Users size={13} color={T.t3} />
              </div>
              <h1 style={{ fontSize:18, fontWeight:700, color:T.t1, margin:0, letterSpacing:"-0.03em" }}>Members</h1>
            </div>
            <p style={{ fontSize:12, color:T.t3, margin:0, lineHeight:1.6 }}>
              AI-powered retention · know who needs you, act instantly
            </p>
          </div>
          <div style={{ display:"flex", gap:7, flexShrink:0 }}>
            <GhostBtn><Activity size={11}/> Export</GhostBtn>
            <PrimaryBtn><Plus size={11}/> Invite Member</PrimaryBtn>
          </div>
        </div>

        <MetricsBar members={members} />
        <ActOnToday
          members={members}
          onMessage={handleMessage}
          onSelect={m => setPreviewMember(prev => prev?.id === m.id ? null : m)}
        />
        <SmartSegments members={members} activeFilter={filter} onFilter={setFilter} onBulkMessage={handleBulkMessage} />

        {/* Main grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:14, alignItems:"start" }}>
          <Card style={{ overflow:"hidden" }}>
            <FilterBar filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} sort={sort} setSort={setSort} counts={counts} />
            <MembersTable
              members={members} filter={filter} search={search} sort={sort} setSort={setSort}
              selectedRows={selectedRows} toggleRow={toggleRow} toggleAll={toggleAll}
              previewMember={previewMember} setPreviewMember={setPreviewMember}
              onMessage={handleMessage}
            />
            <BulkBar selectedRows={selectedRows} members={members} onClear={() => setSelectedRows(new Set())} onBulkMessage={sel => setMessageTarget(sel[0])} />

            <div style={{ padding:"9px 16px", borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", gap:3 }}>
                {[ChevronLeft, ChevronRight].map((Icon, i) => (
                  <button key={i} style={{ width:26, height:26, borderRadius:T.rsm, background:"transparent", border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", opacity:0.4 }}>
                    <Icon size={11} color={T.t2} />
                  </button>
                ))}
                <button style={{ width:26, height:26, borderRadius:T.rsm, background:T.surfaceEl, border:`1px solid ${T.borderEl}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:11, fontWeight:700, color:T.t1, fontFamily:"inherit" }}>
                  1
                </button>
              </div>
              <span style={{ fontSize:10, color:T.t3 }}>{members.length} members · page 1 of 1</span>
            </div>
          </Card>

          <div style={{ position:"sticky", top:24 }}>
            <AlertsSidebar members={members} onFilter={setFilter} onMessage={handleMessage} />
          </div>
        </div>
      </div>

      {previewMember && <MemberPreview m={previewMember} onClose={() => setPreviewMember(null)} onMessage={handleMessage} />}
      {messageTarget && <MessageToast member={messageTarget} onClose={() => setMessageTarget(null)} />}

      <button
        style={{
          position:"fixed", bottom:26, right:26, zIndex:100,
          display:"flex", alignItems:"center", gap:7,
          padding:"12px 20px", borderRadius:50,
          background:T.accent, color:"#fff", border:"none",
          fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 4px 20px ${T.accent}40`, transition:"all .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 6px 28px ${T.accent}55`; }}
        onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=`0 4px 20px ${T.accent}40`; }}
      >
        <Plus size={13}/> Invite Member
      </button>
    </div>
  );
}
