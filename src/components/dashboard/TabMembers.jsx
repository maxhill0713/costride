/**
 * MembersPageAI — reskinned to match Content Hub design system exactly
 */

import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Users, UserPlus,
  Flame, Send, X, ChevronRight, ChevronDown, ChevronLeft, Search,
  Check, Bell, Activity, Star, Tag, MoreHorizontal, Plus,
  LayoutDashboard, FileText, BarChart2, Zap, Settings, Gift,
  ExternalLink, Eye, LogOut, QrCode, BookOpen,
} from "lucide-react";

/* ── Color tokens — exact Content Hub palette ──────────────────── */
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

/* ── Mock Data ──────────────────────────────────────────────────── */
const NOW = new Date();
const daysAgo = (n) => new Date(NOW.getTime() - n * 864e5);

const MOCK_MEMBERS = [
  { id:"1", name:"Marcus Webb",    initials:"MW", colorIdx:0, plan:"Premium", monthlyValue:120, lastVisit:daysAgo(22), daysSince:22,  visits30:0,  prevVisits30:8,  visitsTotal:47,  streak:0,  churnPct:84, joinedDaysAgo:180, returnChance:38, reasons:["No visits in 22 days","Was averaging 8/mo → 0","Missed last 3 classes"],          bestAction:"Send 'We miss you'",   status:"At risk",      statusDetail:"No visits in 22 days · Dropped from 8/month",   segment:"atRisk"  },
  { id:"2", name:"Priya Sharma",   initials:"PS", colorIdx:1, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(16), daysSince:16,  visits30:1,  prevVisits30:4,  visitsTotal:31,  streak:0,  churnPct:71, joinedDaysAgo:95,  returnChance:44, reasons:["16 days since last visit","Frequency down 75%","Usually comes Tues/Thurs"],     bestAction:"Friendly check-in",    status:"Dropping off", statusDetail:"Frequency dropped 75% · Pattern broken",         segment:"atRisk"  },
  { id:"3", name:"Tyler Rhodes",   initials:"TR", colorIdx:2, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(9),  daysSince:9,   visits30:1,  prevVisits30:5,  visitsTotal:12,  streak:0,  churnPct:55, joinedDaysAgo:28,  returnChance:52, reasons:["New member not building habit","Only 1 visit this month","Week 4 — critical window"],   bestAction:"Habit-building nudge", status:"New",          statusDetail:"28 days in · Only 1 visit this month",           segment:"new"     },
  { id:"4", name:"Chloe Nakamura", initials:"CN", colorIdx:3, plan:"Annual",  monthlyValue:90,  lastVisit:daysAgo(1),  daysSince:1,   visits30:14, prevVisits30:11, visitsTotal:203, streak:18, churnPct:4,  joinedDaysAgo:420, returnChance:96, reasons:[],                                                                                       bestAction:"Challenge invite",     status:"Consistent",   statusDetail:"18-day streak · Up 27% this month",               segment:"active"  },
  { id:"5", name:"Devon Osei",     initials:"DO", colorIdx:4, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(19), daysSince:19,  visits30:0,  prevVisits30:3,  visitsTotal:8,   streak:0,  churnPct:78, joinedDaysAgo:45,  returnChance:35, reasons:["19 days absent","Early-stage member at risk","Visited 3x then stopped"],              bestAction:"Personal outreach",    status:"At risk",      statusDetail:"19 days absent · Joined & disappeared",           segment:"atRisk"  },
  { id:"6", name:"Anya Petrov",    initials:"AP", colorIdx:5, plan:"Premium", monthlyValue:120, lastVisit:daysAgo(0),  daysSince:0,   visits30:9,  prevVisits30:7,  visitsTotal:88,  streak:7,  churnPct:6,  joinedDaysAgo:210, returnChance:94, reasons:[],                                                                                       bestAction:"Referral ask",         status:"Engaged",      statusDetail:"7-day streak · Consistent performer",             segment:"active"  },
  { id:"7", name:"Jamie Collins",  initials:"JC", colorIdx:6, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(5),  daysSince:5,   visits30:2,  prevVisits30:4,  visitsTotal:19,  streak:0,  churnPct:42, joinedDaysAgo:58,  returnChance:58, reasons:[],                                                                                       bestAction:"Motivate",             status:"Dropping off", statusDetail:"Frequency halved · Below target",                 segment:"inactive"},
  { id:"8", name:"Sam Rivera",     initials:"SR", colorIdx:7, plan:"Monthly", monthlyValue:60,  lastVisit:null,        daysSince:999, visits30:0,  prevVisits30:0,  visitsTotal:1,   streak:0,  churnPct:91, joinedDaysAgo:6,   returnChance:30, reasons:["Joined 6 days ago, 1 visit only","Critical first-week window","Has not returned"],     bestAction:"Week-1 welcome",       status:"New",          statusDetail:"6 days in · First week habit window",             segment:"new"     },
];

const AVATAR_COLORS = [
  { bg:"rgba(59,130,246,0.14)",  text:"#60a5fa" },
  { bg:"rgba(16,185,129,0.14)",  text:"#34d399" },
  { bg:"rgba(139,92,246,0.14)",  text:"#a78bfa" },
  { bg:"rgba(245,158,11,0.14)",  text:"#fbbf24" },
  { bg:"rgba(239,68,68,0.14)",   text:"#f87171" },
  { bg:"rgba(6,182,212,0.14)",   text:"#22d3ee" },
  { bg:"rgba(168,85,247,0.14)",  text:"#d946ef" },
  { bg:"rgba(249,115,22,0.14)",  text:"#fb923c" },
];

/* ── Helpers ────────────────────────────────────────────────────── */
function churnColor(pct)    { return pct >= 70 ? "#f87171"  : pct >= 40 ? "#fbbf24" : "#34d399"; }
function churnBarColor(pct) { return pct >= 70 ? "#ef4444"  : pct >= 40 ? "#f59e0b" : "#22c55e"; }
function churnBorder(pct)   { return pct >= 70 ? "rgba(239,68,68,0.5)" : pct >= 40 ? "rgba(245,158,11,0.5)" : "rgba(34,197,94,0.5)"; }

function statusColors(status) {
  return {
    "At risk":      { bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.3)",  color:"#f87171" },
    "Dropping off": { bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.3)", color:"#fbbf24" },
    "Consistent":   { bg:"rgba(34,197,94,0.1)",  border:"rgba(34,197,94,0.3)",  color:"#4ade80" },
    "Engaged":      { bg:"rgba(34,197,94,0.1)",  border:"rgba(34,197,94,0.3)",  color:"#4ade80" },
    "New":          { bg:"rgba(59,130,246,0.1)", border:"rgba(59,130,246,0.3)", color:"#60a5fa" },
  }[status] || { bg: C.dimmer, border: C.border, color: C.muted };
}

/* ── Primitives ─────────────────────────────────────────────────── */
function Avatar({ m, size = 28 }) {
  const c = AVATAR_COLORS[m.colorIdx % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: c.bg, color: c.text,
      fontSize: size * 0.33, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", letterSpacing: "0.02em",
    }}>{m.initials}</div>
  );
}

function StatusBadge({ status }) {
  const s = statusColors(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 10.5, fontWeight: 700, color: s.color, whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

function ProgressBar({ value, color, height = 3 }) {
  return (
    <div style={{ height, background: C.dimmer, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 2 }} />
    </div>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <div onClick={e => { e.stopPropagation(); onChange(); }} style={{
      width: 14, height: 14, borderRadius: 3, cursor: "pointer", flexShrink: 0,
      background: checked ? "#3b82f6" : "transparent",
      border: `1.5px solid ${checked ? "#3b82f6" : C.dim}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {checked && <Check size={8} color="#fff" strokeWidth={3} />}
    </div>
  );
}

/* ── Sidebar — identical to Content Hub ────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: "Overview"         },
  { Icon: Users,           label: "Members", active: true },
  { Icon: FileText,        label: "Content"          },
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
    <div style={{
      width: 210, minHeight: "100vh", flexShrink: 0,
      background: C.surface, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", fontFamily: "inherit",
    }}>
      <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Flame size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text, lineHeight: 1.25 }}>Foundry Gym</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Gym Owner</div>
        </div>
      </div>
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

/* ── TopBar — identical to Content Hub ─────────────────────────── */
function TopBar({ atRiskCount }) {
  return (
    <div style={{
      height: 48, background: C.surface, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", padding: "0 18px", gap: 10, flexShrink: 0,
    }}>
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
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(59,130,246,0.14)", color: "#60a5fa", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>M</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Max</span>
        <ChevronDown size={9} color={C.dim} />
      </div>
      {atRiskCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", cursor: "pointer" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#f87171" }}>{atRiskCount} At Risk</span>
        </div>
      )}
    </div>
  );
}

/* ── Filter Bar ─────────────────────────────────────────────────── */
function FilterBar({ filter, setFilter, search, setSearch, sort, setSort, counts }) {
  const tabs = [
    { id:"all",      label:"All",      count: counts.all      },
    { id:"atRisk",   label:"At Risk",  count: counts.atRisk   },
    { id:"dropping", label:"Dropping", count: counts.dropping },
    { id:"new",      label:"New",      count: counts.new      },
    { id:"active",   label:"Active",   count: counts.active   },
    { id:"inactive", label:"Inactive", count: counts.inactive },
  ];

  return (
    <div style={{
      background: C.surface, borderBottom: `1px solid ${C.border}`,
      padding: "8px 14px", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
    }}>
      {/* Tab: prefix label matching Content Hub style */}
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, marginRight: 6 }}>Tab:</span>
      {tabs.map(t => {
        const on = filter === t.id;
        return (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: 7, cursor: "pointer",
            background: on ? C.card2 : "transparent",
            border: on ? `1px solid ${C.border2}` : "1px solid transparent",
            color: on ? C.text : C.muted,
            fontSize: 12, fontWeight: on ? 700 : 400,
          }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 9.5, color: on ? C.muted : C.dim }}>{t.count}</span>}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ position: "relative" }}>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          appearance: "none", paddingLeft: 10, paddingRight: 24, paddingTop: 5, paddingBottom: 5,
          borderRadius: 7, background: C.card, border: `1px solid ${C.border}`,
          color: C.muted, fontSize: 11.5, outline: "none", cursor: "pointer",
        }}>
          <option value="churnDesc">Highest risk</option>
          <option value="lastVisit">Recently active</option>
          <option value="value">Highest value</option>
          <option value="name">Name A–Z</option>
        </select>
        <ChevronDown size={9} color={C.dim} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
      <div style={{ position: "relative" }}>
        <Search size={11} color={C.dim} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)}
          style={{
            paddingLeft: 26, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
            borderRadius: 7, background: C.card, border: `1px solid ${C.border}`,
            color: C.text, fontSize: 11.5, outline: "none", width: 150,
          }}
          onFocus={e => e.target.style.borderColor = C.border2}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      </div>
    </div>
  );
}

/* ── Table Header ───────────────────────────────────────────────── */
const GRID = "28px 1.8fr 1.1fr 72px 90px 80px 80px 130px";

function TableHeader({ sort, setSort, allChecked, onToggleAll }) {
  const cols = [
    { label: "",           key: null        },
    { label: "MEMBER",     key: "name"      },
    { label: "STATUS",     key: null        },
    { label: "CHURN",      key: "churnDesc" },
    { label: "LAST SEEN",  key: "lastVisit" },
    { label: "TREND",      key: null        },
    { label: "VALUE",      key: "value"     },
    { label: "ACTION",     key: null        },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: GRID, gap: 6,
      padding: "7px 14px", background: C.surface, borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Checkbox checked={allChecked} onChange={onToggleAll} />
      </div>
      {cols.slice(1).map((c, i) => (
        <div key={i} onClick={() => c.key && setSort(c.key)} style={{
          display: "flex", alignItems: "center", gap: 3,
          fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          color: sort === c.key ? C.muted : C.dim,
          cursor: c.key ? "pointer" : "default",
        }}>
          {c.label}
          {c.key && <ChevronDown size={8} color={C.dim} />}
        </div>
      ))}
    </div>
  );
}

/* ── Members Table ──────────────────────────────────────────────── */
function MembersTable({ members, filter, search, sort, setSort, selectedRows, toggleRow, toggleAll, previewMember, setPreviewMember, onMessage }) {
  const filtered = useMemo(() => {
    let list = members;
    if (filter === "atRisk")   list = list.filter(m => m.churnPct >= 60);
    if (filter === "dropping") list = list.filter(m => m.prevVisits30 > 0 && m.visits30 <= m.prevVisits30 * 0.5);
    if (filter === "new")      list = list.filter(m => m.joinedDaysAgo <= 30);
    if (filter === "active")   list = list.filter(m => m.streak >= 5);
    if (filter === "inactive") list = list.filter(m => m.daysSince >= 14);
    if (search) list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [members, filter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === "churnDesc") return b.churnPct - a.churnPct;
    if (sort === "lastVisit") return a.daysSince - b.daysSince;
    if (sort === "value")     return b.monthlyValue - a.monthlyValue;
    if (sort === "name")      return a.name.localeCompare(b.name);
    return b.churnPct - a.churnPct;
  }), [filtered, sort]);

  const allChecked = sorted.length > 0 && selectedRows.size === sorted.length;

  return (
    <div style={{ overflowX: "auto" }}>
      <TableHeader sort={sort} setSort={setSort} allChecked={allChecked} onToggleAll={() => toggleAll(sorted)} />

      {sorted.length === 0 && (
        <div style={{ padding: "48px 16px", textAlign: "center" }}>
          <Users size={32} color={C.dim} style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 4 }}>No members match</div>
          <div style={{ fontSize: 11, color: C.dim }}>Try a different filter or search term</div>
        </div>
      )}

      {sorted.map((m, idx) => {
        const isSel    = selectedRows.has(m.id);
        const isPrev   = previewMember?.id === m.id;
        const trendPct = m.prevVisits30 > 0 ? Math.round(((m.visits30 - m.prevVisits30) / m.prevVisits30) * 100) : 0;
        const lastSeenColor = m.daysSince >= 14 ? "#f87171" : m.daysSince <= 1 ? "#34d399" : C.text;
        const lastSeenLabel = m.daysSince === 999 ? "Never" : m.daysSince === 0 ? "Today" : `${m.daysSince}d ago`;

        return (
          <div key={m.id} onClick={() => setPreviewMember(isPrev ? null : m)} style={{
            display: "grid", gridTemplateColumns: GRID, gap: 6,
            padding: "10px 14px", alignItems: "center", cursor: "pointer",
            background: isPrev ? C.card2 : isSel ? "rgba(59,130,246,0.04)" : "transparent",
            borderBottom: idx < sorted.length - 1 ? `1px solid ${C.border}` : "none",
            borderLeft: `2px solid ${isPrev ? "#3b82f6" : isSel ? "rgba(59,130,246,0.3)" : "transparent"}`,
            transition: "background 0.1s",
          }}
            onMouseEnter={e => { if (!isPrev) e.currentTarget.style.background = C.card; }}
            onMouseLeave={e => { e.currentTarget.style.background = isPrev ? C.card2 : isSel ? "rgba(59,130,246,0.04)" : "transparent"; }}
          >
            {/* Checkbox */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Checkbox checked={isSel} onChange={() => toggleRow(m.id)} />
            </div>

            {/* Member */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar m={m} size={28} />
                {m.streak >= 5 && (
                  <div style={{
                    position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: "50%",
                    background: C.card, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Flame size={7} color="#fbbf24" />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: isPrev ? "#60a5fa" : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>{m.plan} · {m.visitsTotal} visits</div>
              </div>
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={m.status} />
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{m.statusDetail}</div>
            </div>

            {/* Churn */}
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: churnColor(m.churnPct), fontVariantNumeric: "tabular-nums" }}>{m.churnPct}%</span>
              <div style={{ marginTop: 4 }}>
                <ProgressBar value={m.churnPct} color={churnBarColor(m.churnPct)} height={2} />
              </div>
            </div>

            {/* Last seen */}
            <div style={{ fontSize: 12, fontWeight: 600, color: lastSeenColor }}>{lastSeenLabel}</div>

            {/* Trend */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {trendPct > 10  ? <><TrendingUp   size={12} color="#34d399" /><span style={{ fontSize: 10.5, color: "#34d399" }}>+{trendPct}%</span></> :
               trendPct < -10 ? <><TrendingDown  size={12} color="#f87171" /><span style={{ fontSize: 10.5, color: "#f87171" }}>{trendPct}%</span></> :
                                 <span style={{ fontSize: 10.5, color: C.dim }}>—</span>}
            </div>

            {/* Value */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>${m.monthlyValue}</div>
              <div style={{ fontSize: 9.5, color: C.dim }}>/month</div>
            </div>

            {/* Action */}
            <div onClick={e => e.stopPropagation()}>
              <button onClick={() => onMessage(m)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                borderRadius: 7, background: C.surface, border: `1px solid ${C.border2}`,
                color: C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                {m.bestAction} <ChevronRight size={9} />
              </button>
              <div style={{ fontSize: 9.5, color: C.dim, marginTop: 3 }}>~{m.returnChance}% success</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Bulk Action Bar ────────────────────────────────────────────── */
function BulkBar({ selectedRows, members, onClear, onBulkMessage }) {
  if (selectedRows.size === 0) return null;
  const sel      = members.filter(m => selectedRows.has(m.id));
  const totalVal = sel.reduce((s, m) => s + m.monthlyValue, 0);

  return (
    <div style={{ borderTop: `1px solid ${C.border2}`, background: C.card2 }}>
      <div style={{ padding: "7px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>
          {selectedRows.size} selected
          <span style={{ color: C.dim, fontWeight: 400 }}> · ${totalVal}/mo combined</span>
        </span>
        <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: C.dim }}>Clear</button>
      </div>
      <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => onBulkMessage(sel)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: "#3b82f6", border: "1px solid #3b82f6", color: "#fff", fontSize: 11.5, fontWeight: 700 }}>
          <Send size={10} /> Message {selectedRows.size}
        </button>
        {[["Tag", <Tag size={10} />], ["Add to list", <Star size={10} />]].map(([lbl, icon]) => (
          <button key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 11.5, fontWeight: 600 }}>
            {icon} {lbl}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: C.dim }}>{sel.filter(m => m.churnPct >= 60).length} at risk in selection</span>
      </div>
    </div>
  );
}

/* ── Right Action Sidebar — mirrors Content Hub right panel ─────── */
function ActionSidebar({ members, onFilter, onMessage }) {
  const highRisk   = members.filter(m => m.churnPct >= 60);
  const newMembers = members.filter(m => m.joinedDaysAgo <= 30);
  const totalVal   = highRisk.reduce((s, m) => s + m.monthlyValue, 0);

  const dropBars = [
    { label: "Week 1", pct: 26, color: "#3b82f6"  },
    { label: "Week 2", pct: 66, color: "#ef4444"  },
    { label: "Week 4", pct: 41, color: "#6366f1"  },
  ];

  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: C.surface, borderLeft: `1px solid ${C.border}`,
      padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto",
    }}>

      {/* At-Risk Action Queue */}
      {highRisk.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.5)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>At-Risk Action Queue</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.dim, marginBottom: 9 }}>
            {highRisk.length} members – ${totalVal}/mo
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {highRisk.slice(0, 4).map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar m={m} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{m.bestAction} · <span style={{ color: churnColor(m.churnPct) }}>{m.returnChance}% success</span></div>
                </div>
                <button onClick={() => onMessage(m)} style={{ padding: "3px 9px", borderRadius: 6, cursor: "pointer", background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>
                  Message
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
            <button onClick={() => { onFilter("atRisk"); onMessage(highRisk[0]); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              <Send size={10} /> Message All
            </button>
            <button onClick={() => onFilter("atRisk")} style={{ padding: "6px 12px", borderRadius: 7, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
              View
            </button>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: C.border }} />

      {/* New Member Onboarding */}
      {newMembers.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <UserPlus size={12} color="#fbbf24" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>New Member Onboarding</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.dim, marginBottom: 9 }}>{newMembers.length} members in first-week window</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {newMembers.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar m={m} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Send {m.bestAction} · <span style={{ color: "#60a5fa" }}>{m.returnChance}% success</span></div>
                </div>
                <button onClick={() => onMessage(m)} style={{ padding: "3px 9px", borderRadius: 6, cursor: "pointer", background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>
                  Message
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
            <button onClick={() => onFilter("new")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", borderRadius: 7, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              <Send size={10} /> Follow up
            </button>
            <button onClick={() => onFilter("new")} style={{ padding: "6px 12px", borderRadius: 7, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
              View
            </button>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: C.border }} />

      {/* Drop-off Peaks & Insights */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <TrendingDown size={12} color={C.muted} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Drop-off Peaks &amp; Insights</span>
        </div>
        <div style={{ fontSize: 10.5, color: C.dim, marginBottom: 12 }}>When members go quiet after joining</div>

        {dropBars.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
            <span style={{ fontSize: 10, color: C.muted, width: 42, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1 }}>
              <ProgressBar value={b.pct} color={b.color} height={4} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, width: 26, textAlign: "right" }}>{b.pct}%</span>
          </div>
        ))}

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          {[
            `${highRisk.length} members haven't engaged in 14+ days`,
            "Engaged members refer at 3× the rate",
            "New members respond best in days 3–7",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: i < 2 ? 5 : 0 }}>
              <span style={{ color: C.dim, fontSize: 10, marginTop: 1, flexShrink: 0 }}>·</span>
              <span style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, cursor: "pointer" }}>
          <span style={{ fontSize: 11.5, color: "#60a5fa", fontWeight: 600 }}>Review Detailed Insights</span>
          <ChevronRight size={11} color="#60a5fa" />
        </div>
      </div>
    </div>
  );
}

/* ── Member Preview Slide-out ───────────────────────────────────── */
function MemberPreview({ m, onClose, onMessage }) {
  if (!m) return null;
  const engScore   = Math.min(100, Math.round((m.visits30 / 12) * 100));
  const engColor   = engScore >= 60 ? "#22c55e" : engScore >= 30 ? "#f59e0b" : "#ef4444";
  const engTextCol = engScore >= 60 ? "#34d399" : engScore >= 30 ? "#fbbf24" : "#f87171";

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 300,
      background: C.surface, borderLeft: `1px solid ${C.border}`,
      zIndex: 200, display: "flex", flexDirection: "column",
      boxShadow: "-16px 0 40px rgba(0,0,0,0.5)",
      animation: "panelIn 0.18s ease",
    }}>
      <style>{`@keyframes panelIn{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar m={m} size={36} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text, marginBottom: 4 }}>{m.name}</div>
            <StatusBadge status={m.status} />
          </div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={11} color={C.dim} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Churn signal */}
        {m.churnPct >= 40 && (
          <div style={{ padding: "12px 14px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, borderLeft: `2px solid ${churnBorder(m.churnPct)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: churnColor(m.churnPct) }}>{m.churnPct}% churn risk</span>
              <span style={{ fontSize: 10.5, color: C.dim }}>${m.monthlyValue}/mo</span>
            </div>
            <ProgressBar value={m.churnPct} color={churnBarColor(m.churnPct)} height={2} />
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {m.reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <span style={{ color: C.dim, fontSize: 10, marginTop: 1, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visit stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: "This mo", val: m.visits30,     accent: false },
            { label: "Last mo", val: m.prevVisits30,  accent: false },
            { label: "Total",   val: m.visitsTotal,   accent: true  },
          ].map((s, i) => (
            <div key={i} style={{ padding: "10px 8px", borderRadius: 9, background: C.card, border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.accent ? "#60a5fa" : C.text, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9.5, color: C.dim, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Engagement */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Engagement</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: engTextCol }}>{engScore}%</span>
          </div>
          <ProgressBar value={engScore} color={engColor} height={3} />
        </div>

        {/* Recommended action */}
        <div style={{ padding: "12px 14px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9.5, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Recommended</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 3 }}>{m.bestAction}</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>{m.returnChance}% predicted success</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
        <button onClick={() => onMessage(m)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", borderRadius: 8, background: "#3b82f6", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <Send size={11} /> {m.bestAction}
        </button>
        <button style={{ padding: "8px 10px", borderRadius: 8, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Message Toast ──────────────────────────────────────────────── */
function MessageToast({ member, onClose }) {
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState(
    member ? `Hey ${member.name.split(" ")[0]}, we've missed seeing you at the gym. Your progress is waiting — come back and pick up where you left off.` : ""
  );
  if (!member) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, right: 24,
      width: "min(350px, calc(100vw - 2rem))",
      background: C.surface, border: `1px solid ${C.border2}`,
      borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      zIndex: 300, overflow: "hidden",
      animation: "toastIn 0.18s ease",
    }}>
      <style>{`@keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Bell size={11} color={C.dim} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Push notification</span>
          <span style={{ fontSize: 10.5, color: C.dim }}>→ {member.name.split(" ")[0]}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
          <X size={11} color={C.dim} />
        </button>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} style={{
          width: "100%", boxSizing: "border-box",
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 7, padding: "9px 11px",
          fontSize: 11.5, color: C.text, resize: "none", outline: "none", lineHeight: 1.6,
        }}
          onFocus={e => e.target.style.borderColor = C.border2}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <div style={{ marginTop: 4, fontSize: 10.5, color: C.dim }}>{member.returnChance}% predicted return rate</div>
        <button onClick={() => { setSent(true); setTimeout(onClose, 1600); }} style={{
          marginTop: 9, width: "100%", padding: "8px",
          borderRadius: 8, border: "none",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: sent ? C.card : "#3b82f6",
          color: sent ? "#34d399" : "#fff",
          transition: "all 0.2s",
        }}>
          {sent ? <><Check size={11} /> Sent</> : <><Send size={11} /> Send to {member.name.split(" ")[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ── Root ───────────────────────────────────────────────────────── */
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
    atRisk:   members.filter(m => m.churnPct >= 60).length,
    dropping: members.filter(m => m.prevVisits30 > 0 && m.visits30 <= m.prevVisits30 * 0.5).length,
    new:      members.filter(m => m.joinedDaysAgo <= 30).length,
    active:   members.filter(m => m.streak >= 5).length,
    inactive: members.filter(m => m.daysSince >= 14).length,
  }), [members]);

  const toggleRow = useCallback(id => {
    setSelectedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const toggleAll = useCallback(rows => {
    if (selectedRows.size === rows.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(rows.map(m => m.id)));
  }, [selectedRows]);

  const handleMessage = useCallback(m => { setMessageTarget(m); setPreviewMember(null); }, []);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: "antialiased",
    }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Scrollable center */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 80px", minWidth: 0 }}>

          {/* Page heading */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", display: "flex", alignItems: "baseline", gap: 6 }}>
                Members
                <span style={{ color: C.muted, fontWeight: 300, fontSize: 17 }}>/</span>
                <span style={{ color: "#818cf8" }}>CRM</span>
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>AI-powered retention · know who needs you, act instantly</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                <Activity size={11} /> Export
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#3b82f6", border: "none", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <Plus size={13} /> Invite Member
              </button>
            </div>
          </div>

          {/* Main table card */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <FilterBar
              filter={filter} setFilter={setFilter}
              search={search} setSearch={setSearch}
              sort={sort}     setSort={setSort}
              counts={counts}
            />
            <MembersTable
              members={members} filter={filter} search={search} sort={sort} setSort={setSort}
              selectedRows={selectedRows} toggleRow={toggleRow} toggleAll={toggleAll}
              previewMember={previewMember} setPreviewMember={setPreviewMember}
              onMessage={handleMessage}
            />
            <BulkBar
              selectedRows={selectedRows} members={members}
              onClear={() => setSelectedRows(new Set())}
              onBulkMessage={sel => setMessageTarget(sel[0])}
            />
            {/* Pagination */}
            <div style={{ padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[ChevronLeft, ChevronRight].map((Icon, i) => (
                  <button key={i} style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.4 }}>
                    <Icon size={11} color={C.muted} />
                  </button>
                ))}
                <button style={{ width: 26, height: 26, borderRadius: 7, background: C.card2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11.5, fontWeight: 800, color: C.text }}>
                  1
                </button>
              </div>
              <span style={{ fontSize: 10.5, color: C.dim }}>{members.length} members · page 1 of 1</span>
            </div>
          </div>
        </div>

        {/* Right action sidebar */}
        <ActionSidebar members={members} onFilter={setFilter} onMessage={handleMessage} />
      </div>

      {/* Overlays */}
      {previewMember && (
        <MemberPreview m={previewMember} onClose={() => setPreviewMember(null)} onMessage={handleMessage} />
      )}
      {messageTarget && (
        <MessageToast member={messageTarget} onClose={() => setMessageTarget(null)} />
      )}

      {/* Floating CTA */}
      <button style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 100,
        display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
        borderRadius: "999px", background: "#3b82f6", color: "#fff",
        border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(59,130,246,0.3)", transition: "all 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(59,130,246,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.3)"; }}
      >
        <Plus size={13} /> Invite Member
      </button>
    </div>
  );
}