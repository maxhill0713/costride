/**
 * MembersPageAI — v2 "Tailwind Refactor"
 * Design: Stripe/Linear/Notion — high signal, low noise.
 */

import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Users, UserPlus,
  Flame, Send, X, ChevronRight, ChevronDown, ChevronLeft, Search,
  Check, Bell, Activity, Star, Tag, MoreHorizontal,
  Plus,
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { AppBadge } from "@/components/ui/AppBadge";
import { AppProgressBar } from "@/components/ui/AppProgressBar";
import { cn } from "@/lib/utils";

/* ── Mock Data ──────────────────────────────────────────────────── */
const NOW = new Date();
const daysAgo = (n) => new Date(NOW.getTime() - n * 864e5);

const MOCK_MEMBERS = [
  { id:"1", name:"Marcus Webb",    initials:"MW", colorIdx:0, plan:"Premium", monthlyValue:120, lastVisit:daysAgo(22), daysSince:22,  visits30:0,  prevVisits30:8,  visitsTotal:47,  streak:0,  churnPct:84, joinedDaysAgo:180, returnChance:38, reasons:["No visits in 22 days","Was averaging 8/mo → 0","Missed last 3 classes"],        bestAction:"Send 'We miss you'",   status:"At risk",      statusDetail:"No visits in 22 days · Dropped from 8/month",   segment:"atRisk" },
  { id:"2", name:"Priya Sharma",   initials:"PS", colorIdx:1, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(16), daysSince:16,  visits30:1,  prevVisits30:4,  visitsTotal:31,  streak:0,  churnPct:71, joinedDaysAgo:95,  returnChance:44, reasons:["16 days since last visit","Frequency down 75%","Usually comes Tues/Thurs"],   bestAction:"Friendly check-in",    status:"Dropping off", statusDetail:"Frequency dropped 75% · Pattern broken",        segment:"atRisk" },
  { id:"3", name:"Tyler Rhodes",   initials:"TR", colorIdx:2, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(9),  daysSince:9,   visits30:1,  prevVisits30:5,  visitsTotal:12,  streak:0,  churnPct:55, joinedDaysAgo:28,  returnChance:52, reasons:["New member not building habit","Only 1 visit this month","Week 4 — critical window"], bestAction:"Habit-building nudge", status:"New",          statusDetail:"28 days in · Only 1 visit this month",          segment:"new"    },
  { id:"4", name:"Chloe Nakamura", initials:"CN", colorIdx:3, plan:"Annual",  monthlyValue:90,  lastVisit:daysAgo(1),  daysSince:1,   visits30:14, prevVisits30:11, visitsTotal:203, streak:18, churnPct:4,  joinedDaysAgo:420, returnChance:96, reasons:[],                                                                                     bestAction:"Challenge invite",     status:"Consistent",   statusDetail:"18-day streak · Up 27% this month",             segment:"active" },
  { id:"5", name:"Devon Osei",     initials:"DO", colorIdx:4, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(19), daysSince:19,  visits30:0,  prevVisits30:3,  visitsTotal:8,   streak:0,  churnPct:78, joinedDaysAgo:45,  returnChance:35, reasons:["19 days absent","Early-stage member at risk","Visited 3x then stopped"],          bestAction:"Personal outreach",    status:"At risk",      statusDetail:"19 days absent · Joined & disappeared",         segment:"atRisk" },
  { id:"6", name:"Anya Petrov",    initials:"AP", colorIdx:5, plan:"Premium", monthlyValue:120, lastVisit:daysAgo(0),  daysSince:0,   visits30:9,  prevVisits30:7,  visitsTotal:88,  streak:7,  churnPct:6,  joinedDaysAgo:210, returnChance:94, reasons:[],                                                                                     bestAction:"Referral ask",         status:"Engaged",      statusDetail:"7-day streak · Consistent performer",           segment:"active" },
  { id:"7", name:"Jamie Collins",  initials:"JC", colorIdx:6, plan:"Monthly", monthlyValue:60,  lastVisit:daysAgo(5),  daysSince:5,   visits30:2,  prevVisits30:4,  visitsTotal:19,  streak:0,  churnPct:42, joinedDaysAgo:58,  returnChance:58, reasons:[],                                                                                     bestAction:"Motivate",             status:"Dropping off", statusDetail:"Frequency halved · Below target",               segment:"inactive"},
  { id:"8", name:"Sam Rivera",     initials:"SR", colorIdx:7, plan:"Monthly", monthlyValue:60,  lastVisit:null,        daysSince:999, visits30:0,  prevVisits30:0,  visitsTotal:1,   streak:0,  churnPct:91, joinedDaysAgo:6,   returnChance:30, reasons:["Joined 6 days ago, 1 visit only","Critical first-week window","Has not returned"], bestAction:"Week-1 welcome",       status:"New",          statusDetail:"6 days in · First week habit window",           segment:"new"    },
];

const AVATAR_PALETTE = [
  { bg:"rgba(59,130,246,0.12)",  text:"#6ea8fe" },
  { bg:"rgba(16,185,129,0.12)",  text:"#4ade80" },
  { bg:"rgba(139,92,246,0.12)",  text:"#c084fc" },
  { bg:"rgba(245,158,11,0.12)",  text:"#fbbf24" },
  { bg:"rgba(239,68,68,0.12)",   text:"#f87171" },
  { bg:"rgba(6,182,212,0.12)",   text:"#22d3ee" },
  { bg:"rgba(168,85,247,0.12)",  text:"#d946ef" },
  { bg:"rgba(249,115,22,0.12)",  text:"#fb923c" },
];

/* ── Color helpers ──────────────────────────────────────────────── */
function churnColorClass(pct) {
  if (pct >= 70) return "bg-red-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-emerald-500";
}
function churnTextClass(pct) {
  if (pct >= 70) return "text-red-500";
  if (pct >= 40) return "text-amber-500";
  return "text-emerald-500";
}
function churnLeftBorder(pct) {
  if (pct >= 70) return "border-l-red-500";
  if (pct >= 40) return "border-l-amber-500";
  return "border-l-emerald-500";
}
function statusBadgeVariant(status) {
  return { "At risk":"danger", "Dropping off":"dropping", "Consistent":"success", "Engaged":"success" }[status] || "neutral";
}

/* ── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ m, size = 30 }) {
  const c = AVATAR_PALETTE[m.colorIdx % AVATAR_PALETTE.length];
  // Inline styles are required here — colors come from a runtime data palette
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center font-mono font-semibold tracking-[0.02em]"
      style={{ width: size, height: size, background: c.bg, color: c.text, fontSize: size * 0.32 }}
    >
      {m.initials}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   METRICS BAR
══════════════════════════════════════════════════════════════════ */
function MetricsBar({ members }) {
  const atRiskCount = members.filter(m => m.churnPct >= 60).length;
  const atRiskValue = members.filter(m => m.churnPct >= 60).reduce((s, m) => s + m.monthlyValue, 0);
  const activeCount = members.filter(m => m.daysSince < 7).length;

  const stats = [
    { label:"Total Members",   val:members.length,   sub:"all time"                                                       },
    { label:"Active (7 days)", val:activeCount,       sub:`${Math.round(activeCount/members.length*100)}% of total`        },
    { label:"At Risk",         val:atRiskCount,       sub:"60%+ churn risk", highlight:atRiskCount > 0                     },
    { label:"Revenue at Risk", val:`$${atRiskValue}`, sub:"per month",       highlight:atRiskValue > 0                     },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
      {stats.map((s, i) => (
        <div key={i} className="px-4 py-4 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em] mb-2">{s.label}</div>
          <div className={cn("text-[26px] font-bold tracking-[-0.04em] leading-none mb-1", s.highlight ? "text-red-500" : "text-[#eef2ff]")}>
            {s.val}
          </div>
          <div className="text-[10px] text-slate-600">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1: PRIORITY MEMBERS
══════════════════════════════════════════════════════════════════ */
function ActOnToday({ members, onMessage, onSelect }) {
  const priority = useMemo(() =>
    members.filter(m => m.churnPct >= 40).sort((a, b) => b.churnPct - a.churnPct).slice(0, 4),
  [members]);

  if (!priority.length) return null;
  const totalAtRisk = priority.reduce((s, m) => s + m.monthlyValue, 0);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.1em]">Priority Today</span>
          <AppBadge variant="danger">{priority.length} need attention</AppBadge>
        </div>
        <span className="text-[11px] text-slate-600">${totalAtRisk}/mo at risk</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {priority.map(m => (
          <div
            key={m.id}
            onClick={() => onSelect(m)}
            className={cn(
              "px-4 py-4 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] border-l-2",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] cursor-pointer transition-colors duration-150 hover:bg-[#0d1225]",
              churnLeftBorder(m.churnPct),
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Avatar m={m} size={34} />
                <div>
                  <div className="text-[13px] font-semibold text-[#eef2ff]">{m.name}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {m.daysSince === 999 ? "Never visited" : `Last seen ${m.daysSince}d ago`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={cn("text-[13px] font-semibold tabular-nums", churnTextClass(m.churnPct))}>{m.churnPct}%</span>
                <div className="text-[9px] text-slate-600 mt-0.5">churn risk</div>
              </div>
            </div>

            <AppProgressBar value={m.churnPct} colorClass={churnColorClass(m.churnPct)} className="h-[2px]" />

            <div className="mt-2.5 flex flex-col gap-1">
              {m.reasons.slice(0, 2).map((r, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="text-[#252d45] text-[10px] mt-0.5">—</span>
                  <span className="text-[11px] text-slate-400 leading-relaxed">{r}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3.5">
              <span className="text-[11px] text-slate-600">
                <span className="text-slate-400 font-medium">${m.monthlyValue}</span>/mo · {m.returnChance}% return likelihood
              </span>
              <button
                onClick={e => { e.stopPropagation(); onMessage(m); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-[#0d1225] border border-white/[0.07] text-slate-400 text-[10px] font-medium cursor-pointer hover:border-white/[0.12] transition-colors"
              >
                <Send className="w-2 h-2" /> {m.bestAction}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2: SMART SEGMENTS
══════════════════════════════════════════════════════════════════ */
function SmartSegments({ members, activeFilter, onFilter, onBulkMessage }) {
  const segments = useMemo(() => [
    { id:"atRisk",   icon:AlertTriangle, label:"Need attention", textCls:"text-red-500",     count:members.filter(m => m.churnPct >= 60).length,                                           action:"Message all" },
    { id:"dropping", icon:TrendingDown,  label:"Dropping off",   textCls:"text-amber-500",   count:members.filter(m => m.prevVisits30 > 0 && m.visits30 <= m.prevVisits30 * 0.5).length,  action:"Nudge all"   },
    { id:"new",      icon:UserPlus,      label:"New members",    textCls:"text-blue-500",    count:members.filter(m => m.joinedDaysAgo <= 14).length,                                      action:"Welcome"     },
    { id:"active",   icon:Flame,         label:"On streak",      textCls:"text-emerald-500", count:members.filter(m => m.streak >= 5).length,                                              action:"Challenge"   },
  ], [members]);

  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {segments.map(s => {
        const Icon = s.icon;
        const on   = activeFilter === s.id;
        return (
          <div
            key={s.id}
            onClick={() => onFilter(on ? "all" : s.id)}
            className={cn(
              "flex-1 basis-40 min-w-[150px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border cursor-pointer transition-all duration-150",
              on ? "bg-[#131c2e] border-white/[0.07]" : "bg-[#0a0f1e] border-white/[0.04] hover:bg-[#0d1225]",
            )}
          >
            <div className="w-[30px] h-[30px] rounded-[7px] bg-[#0d1225] shrink-0 flex items-center justify-center">
              <Icon className={cn("w-3 h-3", on ? s.textCls : "text-slate-600")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("text-[17px] font-bold leading-none", on ? s.textCls : "text-[#eef2ff]")}>{s.count}</div>
              <div className="text-[10px] text-slate-600 mt-0.5 truncate">{s.label}</div>
            </div>
            {s.count > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onBulkMessage(s.id); }}
                className="px-2 py-0.5 rounded-md bg-transparent border border-white/[0.04] text-slate-600 text-[10px] cursor-pointer whitespace-nowrap shrink-0 hover:border-white/[0.07] hover:text-slate-400 transition-colors"
              >
                {s.action}
              </button>
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
    <div className="sticky top-0 z-10 px-3.5 py-2 bg-[#0a0f1e] border-b border-white/[0.04] flex items-center gap-0.5 flex-wrap">
      {tabs.map(t => {
        const on = filter === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition-all duration-100",
              on
                ? "bg-[#0d1225] text-[#eef2ff] font-semibold border border-white/[0.07]"
                : "text-slate-600 font-normal border border-transparent hover:text-slate-400",
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn("text-[9px]", on ? "text-slate-400" : "text-[#252d45]")}>{t.count}</span>
            )}
          </button>
        );
      })}
      <div className="flex-1" />

      {/* Sort */}
      <div className="relative">
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="appearance-none pl-2.5 pr-7 py-1 rounded-md bg-[#0d1225] border border-white/[0.04] text-slate-400 text-[11px] outline-none cursor-pointer"
        >
          <option value="churnDesc">Highest risk</option>
          <option value="lastVisit">Recently active</option>
          <option value="value">Highest value</option>
          <option value="name">Name A–Z</option>
        </select>
        <ChevronDown className="w-2 h-2 text-[#252d45] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-2.5 h-2.5 text-[#252d45] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          placeholder="Search members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-6 pr-2.5 py-1 rounded-md bg-[#0d1225] border border-white/[0.04] text-[#eef2ff] text-[11px] outline-none w-40 focus:border-white/[0.12] transition-colors"
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3: MEMBERS TABLE
══════════════════════════════════════════════════════════════════ */
// Complex fr-unit grid — kept as a JS constant, applied via style prop (static value, unavoidable with mixed fr units)
const COLS = "28px 1.8fr 1.1fr 70px 100px 90px 80px 130px";

const COL_DEFS = [
  { label:"MEMBER",    key:"name"      },
  { label:"STATUS",    key:null        },
  { label:"CHURN",     key:"churnDesc" },
  { label:"LAST SEEN", key:"lastVisit" },
  { label:"TREND",     key:null        },
  { label:"VALUE",     key:"value"     },
  { label:"ACTION",    key:null        },
];

function MembersTable({ members, filter, search, sort, setSort, selectedRows, toggleRow, toggleAll, previewMember, setPreviewMember, onMessage }) {
  const filtered = useMemo(() => {
    let list = members;
    if (filter === "atRisk")   list = list.filter(m => m.churnPct >= 60);
    if (filter === "dropping") list = list.filter(m => m.prevVisits30 > 0 && m.visits30 <= m.prevVisits30 * 0.5);
    if (filter === "new")      list = list.filter(m => m.joinedDaysAgo <= 14);
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

  return (
    <div>
      {/* Desktop: Column headers */}
      <div className="hidden sm:grid gap-2 px-4 py-1.5 border-b border-white/[0.04] bg-[#050810]" style={{ gridTemplateColumns: COLS }}>
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={sorted.length > 0 && selectedRows.size === sorted.length}
            onChange={() => toggleAll(sorted)}
            className="w-3 h-3 cursor-pointer accent-blue-500"
          />
        </div>
        {COL_DEFS.map((c, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              onClick={() => c.key && setSort(c.key)}
              className={cn(
                "text-[9px] font-semibold uppercase tracking-[0.1em]",
                sort === c.key ? "text-slate-400" : "text-[#252d45]",
                c.key ? "cursor-pointer" : "cursor-default",
              )}
            >
              {c.label}
            </span>
            {c.key && <ChevronDown className="w-1.5 h-1.5 text-[#252d45]" />}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="py-12 px-5 text-center">
          <Users className="w-8 h-8 text-[#252d45] mx-auto mb-3" />
          <div className="text-[13px] text-slate-400 font-medium mb-1">No members match</div>
          <div className="text-[11px] text-slate-600">Try a different filter or search term</div>
        </div>
      )}

      {sorted.map((m, idx) => {
        const isSel    = selectedRows.has(m.id);
        const isPrev   = previewMember?.id === m.id;
        const trendPct = m.prevVisits30 > 0 ? Math.round(((m.visits30 - m.prevVisits30) / m.prevVisits30) * 100) : 0;
        const lastSeenCls = m.daysSince >= 14 ? "text-red-500" : m.daysSince <= 1 ? "text-emerald-500" : "text-[#eef2ff]";
        const lastSeenLabel = m.daysSince === 999 ? "Never" : m.daysSince === 0 ? "Today" : `${m.daysSince}d ago`;

        return (
          <div key={m.id}>

            {/* ── Desktop row ── */}
            <div
              onClick={() => setPreviewMember(isPrev ? null : m)}
              className={cn(
                "hidden sm:grid items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors duration-100 border-l-2",
                idx < sorted.length - 1 && "border-b border-white/[0.03]",
                isPrev  ? "bg-[#0d1225] border-l-blue-500"
                : isSel ? "bg-blue-500/[0.03] border-l-blue-500/30"
                :          "border-l-transparent hover:bg-[#101929]",
              )}
              style={{ gridTemplateColumns: COLS }}
            >
              <div className="flex items-center justify-center" onClick={e => { e.stopPropagation(); toggleRow(m.id); }}>
                <input type="checkbox" checked={isSel} onChange={() => toggleRow(m.id)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <Avatar m={m} size={28} />
                  {m.streak >= 5 && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#0d1225] border border-white/[0.04] flex items-center justify-center">
                      <Flame className="w-1.5 h-1.5 text-amber-500" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className={cn("text-xs font-semibold truncate", isPrev ? "text-blue-500" : "text-[#eef2ff]")}>{m.name}</div>
                  <div className="text-[10px] text-slate-600">{m.plan} · {m.visitsTotal} visits</div>
                </div>
              </div>
              <div>
                <AppBadge variant={statusBadgeVariant(m.status)}>{m.status}</AppBadge>
                <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">{m.statusDetail}</div>
              </div>
              <div>
                <span className={cn("text-[13px] font-semibold tabular-nums", churnTextClass(m.churnPct))}>{m.churnPct}%</span>
                <AppProgressBar value={m.churnPct} colorClass={churnColorClass(m.churnPct)} className="h-[2px] mt-1.5" />
              </div>
              <div>
                <span className={cn("text-xs font-medium", lastSeenCls)}>{lastSeenLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                {trendPct > 10  ? <><TrendingUp   className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-500">+{trendPct}%</span></> :
                 trendPct < -10 ? <><TrendingDown  className="w-3 h-3 text-red-500"     /><span className="text-[10px] text-red-500">{trendPct}%</span></> :
                                   <span className="text-[10px] text-slate-600">—</span>}
              </div>
              <div>
                <div className="text-xs font-semibold text-[#eef2ff]">${m.monthlyValue}</div>
                <div className="text-[9px] text-slate-600">/month</div>
              </div>
              <div onClick={e => e.stopPropagation()}>
                <AppButton variant="outline" size="sm" onClick={() => onMessage(m)}>
                  {m.bestAction} <ChevronRight className="w-3 h-3" />
                </AppButton>
                <div className="text-[9px] text-slate-600 mt-0.5">~{m.returnChance}% success</div>
              </div>
            </div>

            {/* ── Mobile card ── */}
            <div
              onClick={() => setPreviewMember(isPrev ? null : m)}
              className={cn(
                "sm:hidden flex flex-col gap-2.5 px-4 py-3.5 cursor-pointer transition-colors border-l-2",
                idx < sorted.length - 1 && "border-b border-white/[0.03]",
                isPrev  ? "bg-[#0d1225] border-l-blue-500"
                : isSel ? "bg-blue-500/[0.03] border-l-blue-500/30"
                :          "border-l-transparent",
              )}
            >
              {/* Top row: avatar + name + churn % */}
              <div className="flex items-center gap-2.5">
                <div onClick={e => { e.stopPropagation(); toggleRow(m.id); }} className="relative shrink-0">
                  <Avatar m={m} size={34} />
                  {m.streak >= 5 && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#0d1225] border border-white/[0.04] flex items-center justify-center">
                      <Flame className="w-2 h-2 text-amber-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[12.5px] font-semibold truncate", isPrev ? "text-blue-500" : "text-[#eef2ff]")}>{m.name}</div>
                  <div className="text-[10.5px] text-slate-600 mt-0.5">{m.plan} · {m.visitsTotal} visits</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn("text-[17px] font-extrabold tabular-nums leading-none tracking-[-0.03em]", churnTextClass(m.churnPct))}>{m.churnPct}%</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">churn risk</div>
                </div>
              </div>

              {/* Bottom row: status badge + last seen + action */}
              <div className="flex items-center gap-2 flex-wrap">
                <AppBadge variant={statusBadgeVariant(m.status)}>{m.status}</AppBadge>
                <span className={cn("text-[10.5px] font-medium", lastSeenCls)}>{lastSeenLabel}</span>
                <div className="ml-auto" onClick={e => e.stopPropagation()}>
                  <AppButton variant="outline" size="sm" onClick={() => onMessage(m)}>
                    {m.bestAction} <ChevronRight className="w-2.5 h-2.5" />
                  </AppButton>
                </div>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4: BULK ACTION BAR
══════════════════════════════════════════════════════════════════ */
function BulkBar({ selectedRows, members, onClear, onBulkMessage }) {
  if (selectedRows.size === 0) return null;
  const sel      = members.filter(m => selectedRows.has(m.id));
  const totalVal = sel.reduce((s, m) => s + m.monthlyValue, 0);

  return (
    <div className="border-t border-white/[0.07] bg-[#0d1225]">
      <div className="px-4 py-1.5 border-b border-white/[0.03] flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          {selectedRows.size} selected
          <span className="text-slate-600 font-normal"> · ${totalVal}/mo combined</span>
        </span>
        <button
          onClick={onClear}
          className="text-[11px] text-slate-600 bg-transparent border-none cursor-pointer hover:text-slate-400 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="px-4 py-2 flex items-center gap-1.5">
        <AppButton size="sm" onClick={() => onBulkMessage(sel)}>
          <Send className="w-2.5 h-2.5" /> Message {selectedRows.size}
        </AppButton>
        <AppButton variant="secondary" size="sm"><Tag  className="w-2.5 h-2.5" /> Tag</AppButton>
        <AppButton variant="secondary" size="sm"><Star className="w-2.5 h-2.5" /> Add to list</AppButton>
        <div className="flex-1" />
        <span className="text-[11px] text-slate-600">
          {sel.filter(m => m.churnPct >= 60).length} at risk in selection
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5: MEMBER PREVIEW PANEL
══════════════════════════════════════════════════════════════════ */
function MemberPreview({ m, onClose, onMessage }) {
  if (!m) return null;
  const engScore   = Math.min(100, Math.round((m.visits30 / 12) * 100));
  const engCls     = engScore >= 60 ? "bg-emerald-500" : engScore >= 30 ? "bg-amber-500" : "bg-red-500";
  const engTextCls = engScore >= 60 ? "text-emerald-500" : engScore >= 30 ? "text-amber-500" : "text-red-500";

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-[#0a0f1e] border-l border-white/[0.04] z-[200] flex flex-col shadow-[-12px_0_40px_rgba(0,0,0,0.5)] animate-[panelIn_0.18s_ease]">
      <style>{`@keyframes panelIn{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar m={m} size={38} />
          <div>
            <div className="text-[13px] font-semibold text-[#eef2ff] mb-1">{m.name}</div>
            <AppBadge variant={statusBadgeVariant(m.status)}>{m.status}</AppBadge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md bg-[#0d1225] border border-white/[0.04] cursor-pointer flex items-center justify-center hover:border-white/[0.07] transition-colors"
        >
          <X className="w-2.5 h-2.5 text-slate-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Churn signal */}
        {m.churnPct >= 40 && (
          <div className={cn("px-3.5 py-3 rounded-2xl bg-[#0d1225] border border-white/[0.04] border-l-2", churnLeftBorder(m.churnPct))}>
            <div className="flex justify-between mb-2">
              <span className={cn("text-xs font-semibold", churnTextClass(m.churnPct))}>{m.churnPct}% churn risk</span>
              <span className="text-[10px] text-slate-600">${m.monthlyValue}/mo</span>
            </div>
            <AppProgressBar value={m.churnPct} colorClass={churnColorClass(m.churnPct)} className="h-[2px]" />
            <div className="mt-2 flex flex-col gap-1">
              {m.reasons.map((r, i) => (
                <div key={i} className="flex gap-1.5">
                  <span className="text-[#252d45] text-[10px] mt-0.5 shrink-0">—</span>
                  <span className="text-[11px] text-slate-400 leading-relaxed">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visit stats */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label:"This mo", val:m.visits30,      accent:false },
            { label:"Last mo", val:m.prevVisits30,   accent:false },
            { label:"Total",   val:m.visitsTotal,    accent:true  },
          ].map((s, i) => (
            <div key={i} className="px-2.5 py-2.5 rounded-[10px] bg-[#0d1225] border border-white/[0.04] text-center">
              <div className={cn("text-[18px] font-bold leading-none", s.accent ? "text-blue-500" : "text-[#eef2ff]")}>{s.val}</div>
              <div className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-[0.07em]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Engagement */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 uppercase tracking-[0.09em]">Engagement</span>
            <span className={cn("text-[11px] font-semibold", engTextCls)}>{engScore}%</span>
          </div>
          <AppProgressBar value={engScore} colorClass={engCls} className="h-[3px]" />
        </div>

        {/* Recommended action */}
        <div className="px-3.5 py-3 rounded-2xl bg-[#0d1225] border border-white/[0.04]">
          <div className="text-[9px] text-slate-600 uppercase tracking-[0.09em] mb-1">Recommended</div>
          <div className="text-xs font-semibold text-[#eef2ff] mb-0.5">{m.bestAction}</div>
          <div className="text-[10px] text-slate-600">{m.returnChance}% predicted success</div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.03] flex gap-1.5">
        <AppButton className="flex-1 justify-center" onClick={() => onMessage(m)}>
          <Send className="w-2.5 h-2.5" /> {m.bestAction}
        </AppButton>
        <AppButton variant="secondary" size="sm">
          <MoreHorizontal className="w-3 h-3" />
        </AppButton>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6: ALERTS SIDEBAR
══════════════════════════════════════════════════════════════════ */
function AlertsSidebar({ members, onFilter, onMessage }) {
  const highRisk = members.filter(m => m.churnPct >= 70);
  const newQuiet = members.filter(m => m.joinedDaysAgo <= 10 && m.visitsTotal < 2);
  const totalVal = highRisk.reduce((s, m) => s + m.monthlyValue, 0);

  const dropoffs = [
    { label:"Week 1", pct:25, colorCls:"bg-red-500"   },
    { label:"Week 2", pct:66, colorCls:"bg-amber-500" },
    { label:"Week 4", pct:41, colorCls:"bg-slate-600" },
  ];

  return (
    <div className="flex flex-col gap-2">

      {highRisk.length > 0 && (
        <div className="px-4 py-3.5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] border-l-2 border-l-red-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.56)] shrink-0" />
              <span className="text-xs font-semibold text-[#eef2ff]">{highRisk.length} likely to churn</span>
            </div>
          </div>
          <div className="flex gap-1 mb-2 flex-wrap">
            {highRisk.slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-center gap-1 py-0.5 pr-2 pl-0.5 rounded-full bg-[#0d1225] border border-white/[0.04]">
                <Avatar m={m} size={14} />
                <span className="text-[10px] text-slate-400">{m.name.split(" ")[0]}</span>
              </div>
            ))}
            {highRisk.length > 3 && <span className="text-[10px] text-slate-600 self-center">+{highRisk.length - 3}</span>}
          </div>
          <div className="text-[11px] text-slate-600 mb-2.5">${totalVal}/mo at risk</div>
          <div className="flex gap-1.5">
            <AppButton variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => { onFilter("atRisk"); onMessage(null, "atRisk"); }}>
              <Send className="w-2 h-2" /> Message
            </AppButton>
            <AppButton variant="outline" size="sm" onClick={() => onFilter("atRisk")}>View</AppButton>
          </div>
        </div>
      )}

      {newQuiet.length > 0 && (
        <div className="px-4 py-3.5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] border-l-2 border-l-amber-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
          <div className="flex items-center gap-1.5 mb-2">
            <UserPlus className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-xs font-semibold text-[#eef2ff]">New members going quiet</span>
          </div>
          <div className="flex gap-1 mb-2 flex-wrap">
            {newQuiet.map((m, i) => (
              <div key={i} className="flex items-center gap-1 py-0.5 pr-2 pl-0.5 rounded-full bg-[#0d1225] border border-white/[0.04]">
                <Avatar m={m} size={14} />
                <span className="text-[10px] text-slate-400">{m.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
            Week-1 follow-up has the highest retention impact.
          </div>
          <div className="flex gap-1.5">
            <AppButton variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => onFilter("new")}>
              <Send className="w-2 h-2" /> Follow up
            </AppButton>
            <AppButton variant="outline" size="sm" onClick={() => onFilter("new")}>View</AppButton>
          </div>
        </div>
      )}

      {/* Drop-off patterns */}
      <div className="px-4 py-3.5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <TrendingDown className="w-2.5 h-2.5 text-slate-600" />
          <span className="text-xs font-semibold text-[#eef2ff]">Drop-off patterns</span>
        </div>
        <div className="text-[11px] text-slate-600 mb-3 leading-relaxed">When members go quiet after joining.</div>
        {dropoffs.map((b, i) => (
          <div key={i} className={cn("flex items-center gap-2", i < 2 && "mb-2")}>
            <span className="text-[10px] text-slate-600 w-[42px] shrink-0">{b.label}</span>
            <div className="flex-1">
              <AppProgressBar value={b.pct} colorClass={b.colorCls} className="h-[3px]" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 w-[28px] text-right">{b.pct}%</span>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="px-4 py-3.5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
        <div className="text-[11px] font-semibold text-slate-400 mb-2.5">Insights</div>
        {[
          `${highRisk.length} members haven't engaged in 14+ days`,
          "Highly engaged members refer at 3× the rate",
          "New members respond best in days 3–7",
        ].map((s, i) => (
          <div key={i} className={cn("flex gap-1.5", i < 2 && "mb-1.5")}>
            <span className="text-[#252d45] text-[10px] mt-0.5 shrink-0">·</span>
            <span className="text-[11px] text-slate-600 leading-relaxed">{s}</span>
          </div>
        ))}
      </div>
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
    <div className="fixed bottom-[82px] right-4 sm:right-[26px] w-[calc(100vw-2rem)] max-w-[350px] bg-[#0a0f1e] border border-white/[0.07] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] z-[300] overflow-hidden animate-[toastIn_0.18s_ease]">
      <style>{`@keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div className="px-3.5 py-2.5 border-b border-white/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bell className="w-2.5 h-2.5 text-slate-600" />
          <span className="text-[11px] font-semibold text-[#eef2ff]">Push notification</span>
          <span className="text-[10px] text-slate-600">→ {member.name.split(" ")[0]}</span>
        </div>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-0">
          <X className="w-2.5 h-2.5 text-slate-600" />
        </button>
      </div>
      <div className="px-3.5 py-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          className="w-full bg-[#0d1225] border border-white/[0.04] rounded-[7px] px-2.5 py-2 text-[11px] text-[#eef2ff] resize-none outline-none leading-relaxed focus:border-white/[0.12] transition-colors"
        />
        <div className="mt-0.5 text-[10px] text-slate-600">{member.returnChance}% predicted return rate</div>
        <button
          onClick={() => { setSent(true); setTimeout(onClose, 1600); }}
          className={cn(
            "mt-2 w-full py-2 rounded-[7px] border-none text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200",
            sent ? "bg-[#0d1225] text-emerald-500" : "bg-blue-500 text-white",
          )}
        >
          {sent
            ? <><Check className="w-2.5 h-2.5" /> Sent</>
            : <><Send  className="w-2.5 h-2.5" /> Send to {member.name.split(" ")[0]}</>
          }
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
    atRisk:   members.filter(m => m.churnPct >= 60).length,
    dropping: members.filter(m => m.prevVisits30 > 0 && m.visits30 <= m.prevVisits30 * 0.5).length,
    new:      members.filter(m => m.joinedDaysAgo <= 14).length,
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

  const handleMessage     = useCallback(m => { setMessageTarget(m); setPreviewMember(null); }, []);
  const handleBulkMessage = useCallback(segId => {
    const seg = members.filter(m => {
      if (segId === "atRisk")   return m.churnPct >= 60;
      if (segId === "dropping") return m.prevVisits30 > 0 && m.visits30 <= m.prevVisits30 * 0.5;
      if (segId === "new")      return m.joinedDaysAgo <= 14;
      if (segId === "active")   return m.streak >= 5;
      return false;
    });
    if (seg.length) setMessageTarget(seg[0]);
  }, [members]);

  return (
    <div className="min-h-screen bg-[#050810] text-[#eef2ff] text-[13px] leading-relaxed">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-20">

        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#eef2ff] m-0 tracking-[-0.03em]">Members</h1>
            <p className="text-[11px] text-slate-600 mt-0.5 mb-0">AI-powered retention · know who needs you, act instantly</p>
          </div>
          <div className="flex gap-1.5">
            <AppButton variant="secondary" size="sm">
              <Activity className="w-2.5 h-2.5" /> Export
            </AppButton>
            <AppButton size="sm">
              <Plus className="w-3 h-3" /> Invite Member
            </AppButton>
          </div>
        </div>

        <MetricsBar members={members} />
        <ActOnToday
          members={members}
          onMessage={handleMessage}
          onSelect={m => setPreviewMember(prev => prev?.id === m.id ? null : m)}
        />
        <SmartSegments
          members={members}
          activeFilter={filter}
          onFilter={setFilter}
          onBulkMessage={handleBulkMessage}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3.5 items-start">

          {/* Table card */}
          <div className="rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] overflow-hidden">
            <FilterBar
              filter={filter} setFilter={setFilter}
              search={search} setSearch={setSearch}
              sort={sort}     setSort={setSort}
              counts={counts}
            />
            <div className="overflow-x-auto">
            <MembersTable
              members={members} filter={filter} search={search} sort={sort} setSort={setSort}
              selectedRows={selectedRows} toggleRow={toggleRow} toggleAll={toggleAll}
              previewMember={previewMember} setPreviewMember={setPreviewMember}
              onMessage={handleMessage}
            />
            </div>
            <BulkBar
              selectedRows={selectedRows}
              members={members}
              onClear={() => setSelectedRows(new Set())}
              onBulkMessage={sel => setMessageTarget(sel[0])}
            />

            {/* Pagination */}
            <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
              <div className="flex gap-1">
                {[ChevronLeft, ChevronRight].map((Icon, i) => (
                  <button key={i} className="w-6 h-6 rounded-md bg-transparent border border-white/[0.04] flex items-center justify-center cursor-pointer opacity-40">
                    <Icon className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                ))}
                <button className="w-6 h-6 rounded-md bg-[#0d1225] border border-white/[0.07] flex items-center justify-center cursor-pointer text-[11px] font-bold text-[#eef2ff]">
                  1
                </button>
              </div>
              <span className="text-[10px] text-slate-600">{members.length} members · page 1 of 1</span>
            </div>
          </div>

          <div className="order-first lg:order-last">
            <AlertsSidebar members={members} onFilter={setFilter} onMessage={handleMessage} />
          </div>
        </div>
      </div>

      {previewMember && (
        <MemberPreview m={previewMember} onClose={() => setPreviewMember(null)} onMessage={handleMessage} />
      )}
      {messageTarget && (
        <MessageToast member={messageTarget} onClose={() => setMessageTarget(null)} />
      )}

      {/* Floating CTA */}
      <button className="fixed bottom-[82px] sm:bottom-[26px] right-4 sm:right-[26px] z-[100] flex items-center gap-1.5 px-5 py-3 rounded-full bg-blue-500 text-white border-none text-xs font-semibold cursor-pointer shadow-[0_4px_20px_rgba(59,130,246,0.25)] hover:-translate-y-px hover:shadow-[0_6px_28px_rgba(59,130,246,0.35)] transition-all duration-150">
        <Plus className="w-3 h-3" /> Invite Member
      </button>
    </div>
  );
}
