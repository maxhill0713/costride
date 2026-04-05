/**
 * MembersPage — pixel-perfect rebuild matching TabEngagement design system
 * Same T tokens, same card primitives, same spatial language.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Users, UserPlus,
  Flame, Send, X, ChevronRight, ChevronDown, ChevronLeft, Search,
  Check, Bell, Activity, Star, Tag, MoreHorizontal,
  Plus, ArrowUpRight, DollarSign, Zap, CheckCircle, Trophy,
  ToggleRight, ToggleLeft, Clock, RefreshCw, Gift, MessageCircle,
  Filter, BarChart2,
} from "lucide-react";

/* ── Design tokens — exact match to TabEngagement ───────────────── */
const T = {
  bg:          "#08090e",
  surface:     "#0f1016",
  surfaceEl:   "#14151d",
  surfaceHov:  "#191a24",
  border:      "#1e2030",
  borderEl:    "#262840",
  divider:     "#141520",
  t1: "#ededf0", t2: "#9191a4", t3: "#525266", t4: "#2e2e42",
  accent:      "#4c6ef5",
  accentDim:   "#1a2048",
  accentBrd:   "#263070",
  red:         "#c0392b",
  redDim:      "#160f0d",
  redBrd:      "#2e1614",
  amber:       "#b07b30",
  amberDim:    "#161008",
  amberBrd:    "#2a2010",
  green:       "#2d8a62",
  greenDim:    "#091912",
  greenBrd:    "#132e20",
  r: "8px", rsm: "6px",
  sh: "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)",
};

/* ── Mock data ───────────────────────────────────────────────────── */
const NOW = new Date();
const daysAgo = n => new Date(NOW.getTime() - n * 864e5);

const MEMBERS = [
  { id:"1",  name:"Marcus Webb",    initials:"MW", ci:0, plan:"Premium", mv:120, daysSince:22, v30:0,  pv30:8,  vt:47,  streak:0,  churn:84, joined:180, rc:38, reasons:["No visits in 22 days","Was averaging 8/mo → 0","Missed last 3 booked classes"],     action:"Send 'We miss you'",   status:"At risk",      sd:"No visits in 22d · Down from 8/month",   seg:"atRisk"   },
  { id:"2",  name:"Priya Sharma",   initials:"PS", ci:1, plan:"Monthly", mv:60,  daysSince:16, v30:1,  pv30:4,  vt:31,  streak:0,  churn:71, joined:95,  rc:44, reasons:["16 days since last visit","Frequency down 75%","Usually comes Tues/Thurs"],      action:"Friendly check-in",    status:"Dropping off", sd:"Frequency −75% · Pattern broken",         seg:"atRisk"   },
  { id:"3",  name:"Tyler Rhodes",   initials:"TR", ci:2, plan:"Monthly", mv:60,  daysSince:9,  v30:1,  pv30:5,  vt:12,  streak:0,  churn:55, joined:28,  rc:52, reasons:["New member not building habit","Only 1 visit this month","Week 4 — critical"],     action:"Habit-building nudge", status:"New",          sd:"28 days in · 1 visit this month",         seg:"new"      },
  { id:"4",  name:"Chloe Nakamura", initials:"CN", ci:3, plan:"Annual",  mv:90,  daysSince:1,  v30:14, pv30:11, vt:203, streak:18, churn:4,  joined:420, rc:96, reasons:[],                                                                                  action:"Challenge invite",      status:"Consistent",   sd:"18-day streak · Up 27% this month",       seg:"active"   },
  { id:"5",  name:"Devon Osei",     initials:"DO", ci:4, plan:"Monthly", mv:60,  daysSince:19, v30:0,  pv30:3,  vt:8,   streak:0,  churn:78, joined:45,  rc:35, reasons:["19 days absent","Early-stage member at risk","Visited 3× then stopped"],            action:"Personal outreach",     status:"At risk",      sd:"19 days absent · Joined & disappeared",   seg:"atRisk"   },
  { id:"6",  name:"Anya Petrov",    initials:"AP", ci:5, plan:"Premium", mv:120, daysSince:0,  v30:9,  pv30:7,  vt:88,  streak:7,  churn:6,  joined:210, rc:94, reasons:[],                                                                                  action:"Referral ask",          status:"Engaged",      sd:"7-day streak · Consistent performer",     seg:"active"   },
  { id:"7",  name:"Jamie Collins",  initials:"JC", ci:6, plan:"Monthly", mv:60,  daysSince:5,  v30:2,  pv30:4,  vt:19,  streak:0,  churn:42, joined:58,  rc:58, reasons:["Frequency halved this month","Below personal average","Skipped usual Fri session"], action:"Motivate",              status:"Dropping off", sd:"Frequency halved · Below target",         seg:"inactive" },
  { id:"8",  name:"Sam Rivera",     initials:"SR", ci:7, plan:"Monthly", mv:60,  daysSince:999,v30:0,  pv30:0,  vt:1,   streak:0,  churn:91, joined:6,   rc:30, reasons:["Joined 6 days ago, 1 visit only","Critical first-week window","Has not returned"],  action:"Week-1 welcome",        status:"New",          sd:"6 days in · First week habit window",     seg:"new"      },
];

const AVATAR_BG = ["#252a45","#1c2f28","#2e2540","#352e18","#2e1818","#173040","#2e2540","#302418"];

/* ── Helpers ─────────────────────────────────────────────────────── */
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 900, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(e * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

/* ── Primitives ──────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.r, boxShadow: T.sh, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function Avatar({ m, size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: AVATAR_BG[m.ci % AVATAR_BG.length],
      border: `1px solid ${T.border}`, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.31, fontWeight: 700, color: T.t2,
      letterSpacing: "0.02em", fontFamily: "monospace",
    }}>{m.initials}</div>
  );
}

function TinyBar({ pct, color, height = 3 }) {
  return (
    <div style={{ height, borderRadius: 99, background: T.divider, flex: 1 }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: 99, background: color, opacity: 0.75 }} />
    </div>
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
        cursor: "pointer", fontFamily: "inherit", border: "1px solid",
        background: danger && hov ? T.redDim : hov ? T.surfaceHov : T.surfaceEl,
        borderColor: danger && hov ? T.redBrd : hov ? T.borderEl : T.border,
        color: danger && hov ? T.red : T.t2, transition: "all .12s", ...style,
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
        transition: "opacity .12s", ...style,
      }}
    >{children}</button>
  );
}

/* ── Stat card — same as TabEngagement ──────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, prefix = "", delay = 0, highlight, alertRed }) {
  const counted = useCountUp(typeof value === "number" ? value : 0, delay);
  const display = typeof value === "number" ? `${prefix}${counted.toLocaleString()}` : value;
  const numColor = alertRed ? T.red : highlight ? T.accent : T.t1;
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: T.rsm,
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} color={alertRed ? T.red : highlight ? T.accent : T.t3} />
        </div>
        <ArrowUpRight size={11} color={T.t4} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: numColor, marginBottom: 5, fontVariantNumeric: "tabular-nums" }}>
        {display}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: T.t2 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{sub}</div>
    </Card>
  );
}

/* ── Churn card (2×2 priority grid) ─────────────────────────────── */
function ChurnCard({ m, onMessage, onSelect }) {
  const [hov, setHov] = useState(false);
  const barColor = m.churn >= 70 ? T.red : m.churn >= 40 ? T.amber : T.t3;
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(m)}
      style={{
        padding: "16px 18px",
        background: hov ? T.surfaceHov : T.surface,
        border: `1px solid ${T.border}`,
        borderLeft: `2px solid ${barColor}`,
        borderRadius: T.r, boxShadow: T.sh,
        cursor: "pointer", transition: "background .12s",
      }}
    >
      {/* Header */}
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
          <div style={{ fontSize: 20, fontWeight: 700, color: barColor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.churn}%</div>
          <div style={{ fontSize: 9, color: T.t3, marginTop: 2 }}>churn risk</div>
        </div>
      </div>

      {/* Risk bar */}
      <TinyBar pct={m.churn} color={barColor} />

      {/* Reasons */}
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 3 }}>
        {m.reasons.slice(0, 2).map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <span style={{ color: T.t4, fontSize: 10, marginTop: 1, flexShrink: 0 }}>—</span>
            <span style={{ fontSize: 11, color: T.t3, lineHeight: 1.5 }}>{r}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <span style={{ fontSize: 11, color: T.t3 }}>
          <span style={{ color: T.t2, fontWeight: 500 }}>${m.mv}</span>/mo · {m.rc}% return likelihood
        </span>
        <button
          onClick={e => { e.stopPropagation(); onMessage(m); }}
          onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.borderColor = T.borderEl; e.currentTarget.style.background = T.surfaceHov; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.t2; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surfaceEl; }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px", borderRadius: T.rsm,
            background: T.surfaceEl, border: `1px solid ${T.border}`,
            color: T.t2, fontSize: 10, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit", transition: "all .12s", whiteSpace: "nowrap",
          }}
        >
          <Send size={9} /> {m.action}
        </button>
      </div>
    </div>
  );
}

/* ── Smart segments ──────────────────────────────────────────────── */
function SmartSegments({ members, active, onFilter, onBulk }) {
  const segs = useMemo(() => [
    { id:"atRisk",   Icon:AlertTriangle, label:"Need attention", count: members.filter(m=>m.churn>=60).length,                                   action:"Message all", urgent:true },
    { id:"dropping", Icon:TrendingDown,  label:"Dropping off",   count: members.filter(m=>m.pv30>0&&m.v30<=m.pv30*0.5).length,                  action:"Nudge all"               },
    { id:"new",      Icon:UserPlus,      label:"New members",    count: members.filter(m=>m.joined<=14).length,                                  action:"Welcome"                 },
    { id:"active",   Icon:Flame,         label:"On streak",      count: members.filter(m=>m.streak>=5).length,                                   action:"Challenge"               },
  ], [members]);

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {segs.map(s => {
        const on = active === s.id;
        return (
          <div
            key={s.id}
            onClick={() => onFilter(on ? "all" : s.id)}
            style={{
              flex: "1 1 140px", minWidth: 140,
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: T.r,
              background: on ? T.surfaceHov : T.surface,
              border: `1px solid ${on ? T.borderEl : T.border}`,
              boxShadow: T.sh, cursor: "pointer", transition: "all .12s",
            }}
            onMouseEnter={e => { if (!on) e.currentTarget.style.background = T.surfaceEl; }}
            onMouseLeave={e => { if (!on) e.currentTarget.style.background = T.surface; }}
          >
            <div style={{ width: 30, height: 30, borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={13} color={T.t3} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.urgent && s.count > 0 ? T.red : T.t1, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{s.count}</div>
                {s.urgent && s.count > 0 && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.red, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />}
              </div>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
            </div>
            {s.count > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onBulk(s.id); }}
                style={{
                  padding: "3px 8px", borderRadius: T.rsm,
                  background: "transparent", border: `1px solid ${T.border}`,
                  color: T.t3, fontSize: 10, cursor: "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, transition: "color .12s",
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

/* ── Members table ───────────────────────────────────────────────── */
function MembersTable({ members, filter, search, sort, setSort, selectedRows, toggleRow, toggleAll, preview, setPreview, onMessage }) {
  const filtered = useMemo(() => {
    let list = members;
    if (filter==="atRisk")   list = list.filter(m=>m.churn>=60);
    if (filter==="dropping") list = list.filter(m=>m.pv30>0&&m.v30<=m.pv30*0.5);
    if (filter==="new")      list = list.filter(m=>m.joined<=14);
    if (filter==="active")   list = list.filter(m=>m.streak>=5);
    if (filter==="inactive") list = list.filter(m=>m.daysSince>=14);
    if (search) list = list.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [members, filter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sort==="churnDesc") return b.churn - a.churn;
    if (sort==="lastVisit") return a.daysSince - b.daysSince;
    if (sort==="value")     return b.mv - a.mv;
    if (sort==="name")      return a.name.localeCompare(b.name);
    return b.churn - a.churn;
  }), [filtered, sort]);

  const COLS = "28px 1.8fr 1fr 70px 90px 80px 80px 140px";

  return (
    <div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, padding: "7px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <input type="checkbox"
            checked={sorted.length > 0 && selectedRows.size === sorted.length}
            onChange={() => toggleAll(sorted)}
            style={{ width: 12, height: 12, accentColor: T.accent, cursor: "pointer" }}
          />
        </div>
        {[
          { label:"MEMBER",    key:"name"      },
          { label:"STATUS",    key:null        },
          { label:"CHURN",     key:"churnDesc" },
          { label:"LAST SEEN", key:"lastVisit" },
          { label:"TREND",     key:null        },
          { label:"VALUE",     key:"value"     },
          { label:"ACTION",    key:null        },
        ].map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              onClick={() => c.key && setSort(c.key)}
              style={{ fontSize: 9, fontWeight: 600, color: sort === c.key ? T.t2 : T.t4, textTransform: "uppercase", letterSpacing: ".1em", cursor: c.key ? "pointer" : "default" }}
            >{c.label}</span>
            {c.key && <ChevronDown size={7} color={T.t4} />}
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "52px 20px", textAlign: "center" }}>
          <Users size={32} color={T.t4} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: T.t2, fontWeight: 500, marginBottom: 4 }}>No members match</div>
          <div style={{ fontSize: 11, color: T.t3 }}>Try a different filter or search term</div>
        </div>
      ) : sorted.map((m, idx) => {
        const isSel  = selectedRows.has(m.id);
        const isPrev = preview?.id === m.id;
        const trend  = m.pv30 > 0 ? Math.round(((m.v30 - m.pv30) / m.pv30) * 100) : 0;
        const barColor = m.churn >= 70 ? T.red : m.churn >= 40 ? T.amber : T.t3;

        return (
          <div
            key={m.id}
            onClick={() => setPreview(isPrev ? null : m)}
            style={{
              display: "grid", gridTemplateColumns: COLS, gap: 8,
              padding: "10px 16px",
              borderBottom: idx < sorted.length - 1 ? `1px solid ${T.divider}` : "none",
              borderLeft: isPrev ? `2px solid ${T.accent}` : "2px solid transparent",
              background: isPrev ? T.surfaceEl : isSel ? `${T.accent}08` : "transparent",
              cursor: "pointer", transition: "background .1s", alignItems: "center",
            }}
            onMouseEnter={e => { if (!isPrev && !isSel) e.currentTarget.style.background = T.surfaceHov; }}
            onMouseLeave={e => { e.currentTarget.style.background = isPrev ? T.surfaceEl : isSel ? `${T.accent}08` : "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={e => { e.stopPropagation(); toggleRow(m.id); }}>
              <input type="checkbox" checked={isSel} onChange={() => toggleRow(m.id)}
                style={{ width: 12, height: 12, accentColor: T.accent, cursor: "pointer" }} />
            </div>

            {/* Member */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar m={m} size={28} />
                {m.streak >= 5 && (
                  <div style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Flame size={6} color={T.t3} />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isPrev ? T.accent : T.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 10, color: T.t3 }}>{m.plan} · {m.vt} visits</div>
              </div>
            </div>

            {/* Status */}
            <div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 500,
                background: T.surfaceEl, color: m.status === "At risk" ? T.red : T.t2,
                border: `1px solid ${T.border}`,
              }}>
                {m.status === "At risk" && <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.red, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />}
                {m.status}
              </span>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 3, lineHeight: 1.4 }}>{m.sd}</div>
            </div>

            {/* Churn */}
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: m.churn >= 70 ? T.red : m.churn >= 40 ? T.amber : T.t2, fontVariantNumeric: "tabular-nums" }}>{m.churn}%</span>
              <div style={{ marginTop: 5 }}><TinyBar pct={m.churn} color={barColor} height={2} /></div>
            </div>

            {/* Last seen */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 500, color: m.daysSince >= 14 ? T.red : m.daysSince <= 1 ? T.green : T.t1 }}>
                {m.daysSince === 999 ? "Never" : m.daysSince === 0 ? "Today" : `${m.daysSince}d ago`}
              </span>
            </div>

            {/* Trend */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {trend > 10
                ? <><TrendingUp size={11} color={T.green} /><span style={{ fontSize: 10, color: T.green }}>+{trend}%</span></>
                : trend < -10
                ? <><TrendingDown size={11} color={T.red} /><span style={{ fontSize: 10, color: T.red }}>{trend}%</span></>
                : <span style={{ fontSize: 10, color: T.t3 }}>—</span>}
            </div>

            {/* Value */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>${m.mv}</div>
              <div style={{ fontSize: 9, color: T.t3 }}>/month</div>
            </div>

            {/* Action */}
            <div onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onMessage(m)}
                onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.borderColor = T.borderEl; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.t2; e.currentTarget.style.borderColor = T.border; }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 9px", borderRadius: T.rsm,
                  background: "transparent", border: `1px solid ${T.border}`,
                  color: T.t2, fontSize: 10, fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .12s",
                }}
              >{m.action} <ChevronRight size={7} /></button>
              <div style={{ fontSize: 9, color: T.t3, marginTop: 3 }}>~{m.rc}% success</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Bulk action bar ─────────────────────────────────────────────── */
function BulkBar({ selectedRows, members, onClear, onBulkMessage }) {
  if (selectedRows.size === 0) return null;
  const sel = members.filter(m => selectedRows.has(m.id));
  const totalVal = sel.reduce((s, m) => s + m.mv, 0);
  return (
    <div style={{ borderTop: `1px solid ${T.borderEl}`, background: T.surfaceEl }}>
      <div style={{ padding: "7px 16px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: T.t2, fontWeight: 500 }}>
          {selectedRows.size} selected <span style={{ color: T.t3, fontWeight: 400 }}>· ${totalVal}/mo combined</span>
        </span>
        <button onClick={onClear} style={{ fontSize: 11, color: T.t3, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={e => e.currentTarget.style.color = T.t2}
          onMouseLeave={e => e.currentTarget.style.color = T.t3}>Clear</button>
      </div>
      <div style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 6 }}>
        <PrimaryBtn onClick={() => onBulkMessage(sel)}><Send size={11} /> Message {selectedRows.size}</PrimaryBtn>
        <GhostBtn><Tag size={11} /> Tag</GhostBtn>
        <GhostBtn><Star size={11} /> Add to list</GhostBtn>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: T.t3 }}>{sel.filter(m => m.churn >= 60).length} at risk in selection</span>
      </div>
    </div>
  );
}

/* ── Alerts sidebar ──────────────────────────────────────────────── */
function AlertsSidebar({ members, onFilter, onMessage }) {
  const highRisk = members.filter(m => m.churn >= 70);
  const newQuiet = members.filter(m => m.joined <= 10 && m.vt < 2);
  const totalVal = highRisk.reduce((s, m) => s + m.mv, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {highRisk.length > 0 && (
        <Card style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.red, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{highRisk.length} likely to churn</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
            {highRisk.slice(0, 3).map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px 2px 3px", borderRadius: 20, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
                <Avatar m={m} size={14} />
                <span style={{ fontSize: 10, color: T.t2 }}>{m.name.split(" ")[0]}</span>
              </div>
            ))}
            {highRisk.length > 3 && <span style={{ fontSize: 10, color: T.t3, alignSelf: "center" }}>+{highRisk.length - 3}</span>}
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginBottom: 10 }}>
            <span style={{ color: T.red, fontWeight: 600 }}>${totalVal}</span>/mo at risk
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <GhostBtn style={{ flex: 1, justifyContent: "center" }} onClick={() => { onFilter("atRisk"); }}>
              <Send size={9} /> Message
            </GhostBtn>
            <GhostBtn onClick={() => onFilter("atRisk")}>View</GhostBtn>
          </div>
        </Card>
      )}

      {newQuiet.length > 0 && (
        <Card style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <UserPlus size={11} color={T.t3} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>New members going quiet</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
            {newQuiet.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px 2px 3px", borderRadius: 20, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
                <Avatar m={m} size={14} />
                <span style={{ fontSize: 10, color: T.t2 }}>{m.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5, marginBottom: 10 }}>
            Week-1 follow-up has the highest retention impact.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <GhostBtn style={{ flex: 1, justifyContent: "center" }} onClick={() => onFilter("new")}>
              <Send size={9} /> Follow up
            </GhostBtn>
            <GhostBtn onClick={() => onFilter("new")}>View</GhostBtn>
          </div>
        </Card>
      )}

      <Card style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <TrendingDown size={11} color={T.t3} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>Drop-off patterns</span>
        </div>
        <div style={{ fontSize: 11, color: T.t3, marginBottom: 12, lineHeight: 1.5 }}>When members go quiet after joining.</div>
        {[
          { label: "Week 1", pct: 25, color: T.red   },
          { label: "Week 2", pct: 66, color: T.amber },
          { label: "Week 4", pct: 41, color: T.t3    },
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
            <span style={{ fontSize: 10, color: T.t3, minWidth: 42 }}>{b.label}</span>
            <div style={{ flex: 1, height: 2, borderRadius: 99, background: T.divider }}>
              <div style={{ height: "100%", width: `${b.pct}%`, background: b.color, borderRadius: 99, opacity: 0.55 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.t2, minWidth: 28, textAlign: "right" }}>{b.pct}%</span>
          </div>
        ))}
      </Card>

      <Card style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.t2, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".1em" }}>Insights</div>
        {[
          `${highRisk.length} members haven't engaged in 14+ days`,
          "Highly engaged members refer at 3× the rate",
          "New members respond best in days 3–7",
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
            <span style={{ color: T.t4, fontSize: 10, marginTop: 2, flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 11, color: T.t3, lineHeight: 1.5 }}>{s}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ── Member preview panel ────────────────────────────────────────── */
function MemberPreview({ m, onClose, onMessage }) {
  if (!m) return null;
  const barColor = m.churn >= 70 ? T.red : m.churn >= 40 ? T.amber : T.t3;
  const engScore = Math.min(100, Math.round((m.v30 / 12) * 100));
  const engColor = engScore >= 60 ? T.green : engScore >= 30 ? T.amber : T.red;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 320,
      background: T.surface, borderLeft: `1px solid ${T.border}`,
      zIndex: 200, display: "flex", flexDirection: "column",
      boxShadow: "-12px 0 40px rgba(0,0,0,0.6)",
      animation: "panelIn .18s ease",
    }}>
      <div style={{ padding: "15px 18px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar m={m} size={38} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 3 }}>{m.name}</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 500, background: T.surfaceEl, color: m.status === "At risk" ? T.red : T.t2, border: `1px solid ${T.border}` }}>
              {m.status === "At risk" && <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.red, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />}
              {m.status}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={11} color={T.t3} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        {m.churn >= 40 && (
          <div style={{ padding: "12px 14px", borderRadius: T.r, marginBottom: 12, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: m.churn >= 70 ? T.red : T.amber }}>{m.churn}% churn risk</span>
              <span style={{ fontSize: 10, color: T.t3 }}>${m.mv}/mo</span>
            </div>
            <TinyBar pct={m.churn} color={barColor} />
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {m.reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 7 }}>
                  <span style={{ color: T.t4, fontSize: 10, marginTop: 2, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 11, color: T.t2, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          {[{ label: "This mo", val: m.v30 }, { label: "Last mo", val: m.pv30 }, { label: "Total", val: m.vt }].map((s, i) => (
            <div key={i} style={{ padding: "10px", borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.t1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
              <div style={{ fontSize: 9, color: T.t3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".07em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: T.t3, textTransform: "uppercase", letterSpacing: ".09em" }}>Engagement</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: engColor }}>{engScore}%</span>
          </div>
          <div style={{ height: 3, borderRadius: 99, background: T.divider }}>
            <div style={{ height: "100%", width: `${engScore}%`, borderRadius: 99, background: engColor, opacity: 0.7 }} />
          </div>
        </div>

        <div style={{ padding: "12px 14px", borderRadius: T.r, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.t3, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>Recommended</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 3 }}>{m.action}</div>
          <div style={{ fontSize: 10, color: T.t3 }}>{m.rc}% predicted success</div>
        </div>
      </div>

      <div style={{ padding: "13px 18px", borderTop: `1px solid ${T.divider}`, display: "flex", gap: 7 }}>
        <button
          onClick={() => onMessage(m)}
          style={{ flex: 1, padding: "8px", borderRadius: T.rsm, background: T.accent, border: "none", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Send size={11} /> {m.action}
        </button>
        <button style={{ padding: "8px 11px", borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, color: T.t2, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
          <MoreHorizontal size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Message toast ───────────────────────────────────────────────── */
function MessageToast({ member, onClose }) {
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState(
    member ? `Hey ${member.name.split(" ")[0]}, we've missed seeing you at the gym. Your progress is waiting — come back and pick up where you left off.` : ""
  );
  if (!member) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, right: 26, width: 350,
      background: T.surface, border: `1px solid ${T.borderEl}`,
      borderRadius: T.r, boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      zIndex: 300, overflow: "hidden", animation: "toastIn .18s ease",
    }}>
      <div style={{ padding: "11px 14px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Bell size={11} color={T.t3} />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>Push notification</span>
          <span style={{ fontSize: 10, color: T.t3 }}>→ {member.name.split(" ")[0]}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <X size={11} color={T.t3} />
        </button>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <textarea
          value={body} onChange={e => setBody(e.target.value)} rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            background: T.surfaceEl, border: `1px solid ${T.border}`,
            borderRadius: T.rsm, padding: "8px 10px", fontSize: 11,
            color: T.t1, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6,
          }}
          onFocus={e => e.target.style.borderColor = T.borderEl}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <div style={{ marginTop: 3, fontSize: 10, color: T.t3 }}>{member.rc}% predicted return rate</div>
        <button
          onClick={() => { setSent(true); setTimeout(onClose, 1600); }}
          style={{
            marginTop: 9, width: "100%", padding: "8px",
            borderRadius: T.rsm, border: "none",
            background: sent ? T.surfaceEl : T.accent,
            color: sent ? T.green : "#fff",
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all .2s",
          }}
        >
          {sent ? <><Check size={11} /> Sent</> : <><Send size={11} /> Send to {member.name.split(" ")[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════ */
export default function MembersPage() {
  const members = MEMBERS;
  const [filter,        setFilter]        = useState("all");
  const [search,        setSearch]        = useState("");
  const [sort,          setSort]          = useState("churnDesc");
  const [selectedRows,  setSelectedRows]  = useState(new Set());
  const [preview,       setPreview]       = useState(null);
  const [msgTarget,     setMsgTarget]     = useState(null);

  const counts = useMemo(() => ({
    all:      members.length,
    atRisk:   members.filter(m => m.churn >= 60).length,
    dropping: members.filter(m => m.pv30 > 0 && m.v30 <= m.pv30 * 0.5).length,
    new:      members.filter(m => m.joined <= 14).length,
    active:   members.filter(m => m.streak >= 5).length,
    inactive: members.filter(m => m.daysSince >= 14).length,
  }), [members]);

  const atRiskCount = members.filter(m => m.churn >= 60).length;
  const atRiskVal   = members.filter(m => m.churn >= 60).reduce((s, m) => s + m.mv, 0);
  const activeCount = members.filter(m => m.daysSince < 7).length;

  const toggleRow = useCallback(id => {
    setSelectedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);
  const toggleAll = useCallback(rows => {
    if (selectedRows.size === rows.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(rows.map(m => m.id)));
  }, [selectedRows]);

  const priorityMembers = useMemo(() =>
    members.filter(m => m.churn >= 55).sort((a, b) => b.churn - a.churn).slice(0, 4)
  , [members]);

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
      minHeight: "100vh", background: T.bg,
      fontFamily: "'Geist', 'DM Sans', 'Helvetica Neue', Arial, sans-serif",
      color: T.t1, fontSize: 13, lineHeight: 1.5,
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes panelIn { from{transform:translateX(24px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes toastIn { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
      `}</style>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ── Page header ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={13} color={T.t3} />
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: "-0.03em" }}>Members</h1>
            </div>
            <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.6 }}>
              AI-powered retention · know who needs you, act instantly
            </p>
          </div>
          <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
            <GhostBtn><Activity size={11} /> Export</GhostBtn>
            <PrimaryBtn><Plus size={11} /> Invite Member</PrimaryBtn>
          </div>
        </div>

        {/* ── KPI cards ───────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          <StatCard icon={Users}         label="Total Members"   sub="all time"                                              value={members.length} delay={0}   />
          <StatCard icon={Activity}      label="Active (7 days)" sub={`${Math.round(activeCount/members.length*100)}% of total`} value={activeCount}    delay={120} />
          <StatCard icon={AlertTriangle} label="At Risk"         sub="60%+ churn probability"                                value={atRiskCount}    delay={240} alertRed={atRiskCount > 0} />
          <StatCard icon={DollarSign}    label="Revenue at Risk" sub="per month"                                             value={atRiskVal}      delay={360} prefix="$" alertRed={atRiskVal > 0} />
        </div>

        {/* ── Priority today header ────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>Priority Today</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "1px 7px", borderRadius: 20, background: T.surfaceEl, border: `1px solid ${T.border}` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.red, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.red }}>{priorityMembers.length} need attention</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: T.t3 }}>${priorityMembers.reduce((s, m) => s + m.mv, 0)}/mo at risk</span>
        </div>

        {/* ── 2×2 churn grid ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 16 }}>
          {priorityMembers.map(m => (
            <ChurnCard key={m.id} m={m} onMessage={setMsgTarget} onSelect={m => setPreview(prev => prev?.id === m.id ? null : m)} />
          ))}
        </div>

        {/* ── Smart segments ──────────────────────────────────────── */}
        <SmartSegments members={members} active={filter} onFilter={setFilter} onBulk={id => {
          const seg = members.filter(m => {
            if (id==="atRisk")   return m.churn>=60;
            if (id==="dropping") return m.pv30>0&&m.v30<=m.pv30*0.5;
            if (id==="new")      return m.joined<=14;
            if (id==="active")   return m.streak>=5;
            return false;
          });
          if (seg.length) setMsgTarget(seg[0]);
        }} />

        {/* ── Main grid: table + sidebar ──────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, alignItems: "start" }}>

          {/* Table card */}
          <Card style={{ overflow: "hidden" }}>
            {/* Filter + search bar */}
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
                <ChevronDown size={9} color={T.t4} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>

              <div style={{ position: "relative" }}>
                <Search size={11} color={T.t4} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  placeholder="Search members…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{
                    padding: "5px 10px 5px 26px", borderRadius: T.rsm,
                    background: T.surfaceEl, border: `1px solid ${T.border}`,
                    color: T.t1, fontSize: 11, outline: "none", fontFamily: "inherit", width: 160,
                  }}
                  onFocus={e => e.target.style.borderColor = T.borderEl}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>
            </div>

            <MembersTable
              members={members} filter={filter} search={search} sort={sort} setSort={setSort}
              selectedRows={selectedRows} toggleRow={toggleRow} toggleAll={toggleAll}
              preview={preview} setPreview={setPreview} onMessage={setMsgTarget}
            />

            <BulkBar selectedRows={selectedRows} members={members} onClear={() => setSelectedRows(new Set())} onBulkMessage={sel => setMsgTarget(sel[0])} />

            {/* Pagination */}
            <div style={{ padding: "9px 16px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 3 }}>
                {[ChevronLeft, ChevronRight].map((Icon, i) => (
                  <button key={i} style={{ width: 26, height: 26, borderRadius: T.rsm, background: "transparent", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.4 }}>
                    <Icon size={11} color={T.t2} />
                  </button>
                ))}
                <button style={{ width: 26, height: 26, borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.borderEl}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: T.t1, fontFamily: "inherit" }}>
                  1
                </button>
              </div>
              <span style={{ fontSize: 10, color: T.t3 }}>{members.length} members · page 1 of 1</span>
            </div>
          </Card>

          {/* Sticky sidebar */}
          <div style={{ position: "sticky", top: 24 }}>
            <AlertsSidebar members={members} onFilter={setFilter} onMessage={setMsgTarget} />
          </div>
        </div>
      </div>

      {preview && <MemberPreview m={preview} onClose={() => setPreview(null)} onMessage={setMsgTarget} />}
      {msgTarget && <MessageToast member={msgTarget} onClose={() => setMsgTarget(null)} />}

      {/* FAB */}
      <button
        style={{
          position: "fixed", bottom: 26, right: 26, zIndex: 100,
          display: "flex", alignItems: "center", gap: 7,
          padding: "12px 20px", borderRadius: 50,
          background: T.accent, color: "#fff", border: "none",
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 4px 20px ${T.accent}40`, transition: "all .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 28px ${T.accent}55`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 20px ${T.accent}40`; }}
      >
        <Plus size={13} /> Invite Member
      </button>
    </div>
  );
}
