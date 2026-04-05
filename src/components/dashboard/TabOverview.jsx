/**
 * TabOverview — rebuilt to match TabEngagement visual system exactly.
 *
 * ✔ Same T tokens (verbatim from TabEngagement)
 * ✔ Same Card / GhostBtn / PrimaryBtn / StatCard / Pill / TinyBar components
 * ✔ Same border-left accent pattern on every card
 * ✔ Same pulsing live dots
 * ✔ Same SectionLabel uppercase style
 * ✔ Same 4-stat summary row at top
 * ✔ Same page header with icon + badge + subtitle
 * ✔ Same horizontal scroll Opportunities row (like Recommendations)
 * ✔ Same ActivityFeed structure for AutomationActivity
 * ✔ Layout from Overview (Image 1) — visual system from Automations (Image 2)
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Zap, UserPlus, Trophy, CheckCircle, Plus,
  ChevronRight, AlertTriangle, Send, ArrowUpRight,
  TrendingUp, TrendingDown, Bell,
  RefreshCw, DollarSign, Activity, Users, Calendar,
  MessageSquarePlus, Bot, Eye, ArrowRight,
} from "lucide-react";

/* ─── Design tokens — verbatim from TabEngagement ─────────────────── */
const T = {
  bg:         "#08090e",
  surface:    "#0f1016",
  surfaceEl:  "#14151d",
  surfaceHov: "#191a24",
  border:     "#1e2030",
  borderEl:   "#262840",
  divider:    "#141520",
  t1: "#ededf0", t2: "#9191a4", t3: "#525266", t4: "#2e2e42",
  accent:     "#4c6ef5",
  accentDim:  "#1a2048",
  accentBrd:  "#263070",
  red:        "#c0392b",
  redDim:     "#160f0d",
  redBrd:     "#2e1614",
  amber:      "#b07b30",
  amberDim:   "#161008",
  amberBrd:   "#2a2010",
  green:      "#2d8a62",
  greenDim:   "#091912",
  greenBrd:   "#132e20",
  r: "8px", rsm: "6px",
  sh: "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)",
};

/* ─── Mock data ────────────────────────────────────────────────────── */
const NOW        = new Date();
const MOCK_MRR   = 4320;
const MOCK_SPARK = [4, 6, 5, 8, 7, 10, 9];
const MOCK_AT_RISK = [
  { user_id: "u1", name: "Marcus Webb",   days_since_visit: 18 },
  { user_id: "u2", name: "Priya Sharma",  days_since_visit: 22 },
  { user_id: "u3", name: "Devon Osei",    days_since_visit: 15 },
  { user_id: "u4", name: "Jamie Collins", days_since_visit: 31 },
];
const MOCK_CHALLENGES = [{ id: "c1", title: "30-Day Consistency", status: "active", ended_at: null }];
const MOCK_POSTS      = [{ id: "p1", title: "Monday Motivation", created_date: new Date(NOW.getTime() - 2 * 86400000).toISOString() }];
const MOCK_ACTIVITY   = [
  { action: "checked in", member: "Chloe Nakamura", time: "10 min ago" },
  { action: "returned",   member: "Alex Turner",    time: "1 hr ago"   },
  { action: "checked in", member: "Sam Rivera",     time: "2 hrs ago"  },
];

/* ─── Helpers ──────────────────────────────────────────────────────── */
const fmt$ = n => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 900;
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p  = Math.min((ts - start) / duration, 1);
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

/* ─── Primitives — exact copies from TabEngagement ────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.r, boxShadow: T.sh, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function TinyBar({ pct, color, height = 3 }) {
  return (
    <div style={{ height, borderRadius: 99, background: T.divider, flex: 1 }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: 99, background: color, opacity: 0.75 }} />
    </div>
  );
}

function Pill({ children, color, bg, brd }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 500,
      color, background: bg, border: `1px solid ${brd}`,
    }}>{children}</span>
  );
}

function GhostBtn({ children, onClick, style = {}, danger = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 10px", borderRadius: T.rsm, fontSize: 11, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit", border: "1px solid",
        background: danger && hov ? T.redDim  : hov ? T.surfaceHov : T.surfaceEl,
        borderColor: danger && hov ? T.redBrd : hov ? T.borderEl   : T.border,
        color: danger && hov ? T.red : T.t2,
        transition: "all .12s", ...style,
      }}>{children}</button>
  );
}

function PrimaryBtn({ children, onClick, style = {}, danger = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: T.rsm, fontSize: 11, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", border: "1px solid transparent",
        background: danger ? T.red : T.accent, color: "#fff",
        opacity: hov ? 0.88 : 1, transition: "opacity .12s", ...style,
      }}>{children}</button>
  );
}

/* StatCard — exact copy from TabEngagement */
function StatCard({ icon: Icon, label, value, sub, prefix = "", suffix = "", delay = 0, highlight = false, redValue = false }) {
  const counted = useCountUp(typeof value === "number" ? value : 0, delay);
  const display = typeof value === "number" ? `${prefix}${counted.toLocaleString()}${suffix}` : value;
  const valueColor = redValue ? T.red : highlight ? T.accent : T.t1;
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: T.rsm, flexShrink: 0,
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} color={highlight ? T.accent : redValue ? T.red : T.t3} />
        </div>
        <ArrowUpRight size={11} color={T.t4} />
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
        color: valueColor, marginBottom: 5, fontVariantNumeric: "tabular-nums",
      }}>{display}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: T.t2 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{sub}</div>
    </Card>
  );
}

/* Avatar */
function Avatar({ name = "", size = 32 }) {
  const letters = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: T.rsm, flexShrink: 0,
      background: T.surfaceEl, border: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 600, color: T.t2,
    }}>{letters}</div>
  );
}

/* Mini sparkline */
function MiniSpark({ data = [], width = 52, height = 22, color }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const clr = color || T.t3;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const first = pts.split(" ")[0], last = pts.split(" ").slice(-1)[0];
  const area  = `${first.split(",")[0]},${height} ${pts} ${last.split(",")[0]},${height}`;
  const id    = `sg${clr.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={clr} stopOpacity="0.18" />
          <stop offset="100%" stopColor={clr} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Section label — verbatim uppercase style from TabEngagement */
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>
      {children}
    </div>
  );
}

/* Live pulse dot — exact copy from TabEngagement */
function LiveDot({ color = T.green }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: "50%", background: color,
      display: "inline-block", animation: "pulse 2s ease-in-out infinite", flexShrink: 0,
    }} />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 1 — TODAY'S PLAN
   Card styled like a TabEngagement rule card: border-left accent + same header chrome
══════════════════════════════════════════════════════════════════════ */
function TodaysPlan({ atRisk, atRiskMembers, newNoReturnCount, mrr, totalMembers,
  retentionRate, challenges, now, openModal, ownerName }) {

  const hour    = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const rpm         = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk  = Math.round(atRisk * rpm * 0.65);
  const predictedCancel = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  const actions = useMemo(() => {
    const list = [];
    if (atRisk > 0) {
      const top = atRiskMembers[0];
      const who = atRisk > 1 ? `${atRisk} at-risk members` : (top?.name || "a member");
      list.push({
        p: 1, urgent: true, who,
        why:     "No visit in 14+ days — churn probability climbing daily",
        kpi:     `${fmt$(revenueAtRisk)}/mo at risk`,
        action:  'Send a personal "we miss you" message',
        outcome: "73% chance they return this week",
        cta:     `Message ${atRisk > 1 ? atRisk + " members" : who}`,
        primary: true, fn: () => openModal("message"),
      });
    }
    if (newNoReturnCount > 0) {
      list.push({
        p: 2, urgent: false,
        who:     `${newNoReturnCount} new member${newNoReturnCount > 1 ? "s" : ""}`,
        why:     "Joined recently but no return visit — week-1 window is closing",
        kpi:     "Week-1 return doubles long-term retention",
        action:  "Send a personal welcome follow-up today",
        outcome: "68% return rate when messaged in week 1",
        cta:     "Send welcome message",
        primary: true, fn: () => openModal("message"),
      });
    }
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge && list.length < 3) {
      list.push({
        p: list.length + 1, urgent: false,
        who:     "All active members",
        why:     "No active challenge — engagement drifts without shared goals",
        kpi:     "Challenges boost weekly visits by ~40%",
        action:  "Start a 30-day fitness or habit challenge",
        outcome: "3× more check-ins during active challenges",
        cta:     "Launch a challenge",
        primary: false, fn: () => openModal("challenge"),
      });
    }
    if (list.length < 3) {
      list.push({
        p: list.length + 1, urgent: false,
        who:     "Your community",
        why:     "Retention is solid — now is the time to grow membership",
        kpi:     `Each referral adds ~${fmt$(Math.round(rpm))}/mo MRR`,
        action:  "Share a referral link or QR code",
        outcome: "Referred members have 2× retention rate",
        cta:     "Share referral link",
        primary: false, fn: () => openModal("addMember"),
      });
    }
    return list.slice(0, 3);
  }, [atRisk, atRiskMembers, newNoReturnCount, challenges, revenueAtRisk, rpm, openModal]);

  return (
    <div style={{
      background: T.surface,
      border:     `1px solid ${T.border}`,
      borderLeft: `2px solid ${T.accent}`,
      borderRadius: T.r,
      boxShadow:  T.sh,
      overflow:   "hidden",
    }}>
      {/* Header — matches TabEngagement page header style */}
      <div style={{ padding: "18px 22px 16px", borderBottom: `1px solid ${T.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: T.rsm,
              background: T.accentDim, border: `1px solid ${T.accentBrd}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={13} color={T.accent} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.t1, letterSpacing: "-0.02em" }}>AI Coach</span>
            {/* AI badge — exact style from TabEngagement Recommendations */}
            <span style={{
              fontSize: 10, fontWeight: 600, color: T.accent,
              background: T.accentDim, border: `1px solid ${T.accentBrd}`,
              padding: "1px 7px", borderRadius: 20,
            }}>AI</span>
            <span style={{ fontSize: 11, color: T.t3 }}>· Updated just now</span>
          </div>
          {atRisk > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LiveDot color={T.red} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.t2, textTransform: "uppercase", letterSpacing: ".08em" }}>Action Needed</span>
            </div>
          )}
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: T.t1, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {greeting}, {ownerName}
        </h2>

        <p style={{ margin: 0, fontSize: 12, color: T.t2, lineHeight: 1.65, maxWidth: 660 }}>
          {atRisk > 0 || newNoReturnCount > 0 ? (
            <>
              {atRisk > 0 && <>
                <strong style={{ color: T.t1 }}>{atRisk} member{atRisk > 1 ? "s" : ""}</strong>{" "}
                {atRisk > 1 ? "are" : "is"} showing churn signals — no visit in 14+ days
                {newNoReturnCount > 0 ? ", " : ". "}
              </>}
              {newNoReturnCount > 0 && <>
                <strong style={{ color: T.t1 }}>{newNoReturnCount} new member{newNoReturnCount > 1 ? "s" : ""}</strong>{" "}
                {newNoReturnCount > 1 ? "haven't" : "hasn't"} come back after their first visit.{" "}
              </>}
              {revenueAtRisk > 0 && <>That puts <span style={{ color: T.red, fontWeight: 600 }}>{fmt$(revenueAtRisk)}/month at risk.</span>{" "}</>}
              A direct message today is your highest-impact action.
            </>
          ) : (
            `Your gym is in good shape today. Retention sits at ${retentionRate}% and your active members are engaged.`
          )}
        </p>

        {/* Revenue at risk chip — same as TabEngagement's enabled badge */}
        {revenueAtRisk > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12,
            padding: "4px 12px", borderRadius: T.rsm,
            background: T.redDim, border: `1px solid ${T.redBrd}`,
          }}>
            <AlertTriangle size={10} color={T.red} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>{fmt$(revenueAtRisk)}/month at risk</span>
            <span style={{ fontSize: 11, color: T.t3 }}>· ~{predictedCancel} predicted cancellation{predictedCancel !== 1 ? "s" : ""} without action</span>
          </div>
        )}
      </div>

      {/* 3-column priority grid */}
      <div style={{ padding: "16px 22px 20px" }}>
        <SectionLabel>Your 3 highest-impact actions today</SectionLabel>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {actions.map((act, i) => (
            <div key={i} style={{
              padding:    "14px 13px 12px",
              background: T.bg,
              border:     `1px solid ${act.urgent ? T.redBrd : T.border}`,
              borderLeft: `2px solid ${act.urgent ? T.red : T.borderEl}`,
              borderRadius: T.r,
              display: "flex", flexDirection: "column",
              boxShadow: T.sh,
            }}>
              {/* Priority label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                {act.urgent && <LiveDot color={T.red} />}
                <span style={{
                  fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em",
                  color: act.urgent ? T.red : T.t3,
                }}>Priority {i + 1}</span>
              </div>

              {/* Who */}
              <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, lineHeight: 1.3, marginBottom: 4 }}>{act.who}</div>
              {/* Why */}
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5, marginBottom: 10, flex: 1 }}>{act.why}</div>

              {/* KPI block — matches TabEngagement's stat/revenue display */}
              <div style={{
                padding: "7px 10px", borderRadius: T.rsm, marginBottom: 10,
                background: act.urgent ? T.redDim : T.surfaceEl,
                border: `1px solid ${act.urgent ? T.redBrd : T.border}`,
                fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                color: act.urgent ? T.red : T.t1,
              }}>{act.kpi}</div>

              <div style={{ fontSize: 10, color: T.t3, marginBottom: 10, lineHeight: 1.45 }}>→ {act.action}</div>

              {act.primary
                ? <PrimaryBtn onClick={act.fn} style={{ width: "100%", justifyContent: "center", fontSize: 11 }}>
                    {act.cta} <ArrowRight size={9} />
                  </PrimaryBtn>
                : <GhostBtn onClick={act.fn} style={{ width: "100%", justifyContent: "center", fontSize: 11 }}>
                    {act.cta} <ArrowRight size={9} />
                  </GhostBtn>
              }
              <div style={{ fontSize: 9, color: T.t3, textAlign: "center", marginTop: 7 }}>{act.outcome}</div>
            </div>
          ))}
        </div>

        {/* Take-all button */}
        <GhostBtn onClick={() => openModal("message")}
          style={{ marginTop: 10, width: "100%", justifyContent: "center", fontSize: 11 }}>
          <Zap size={10} color={T.t3} /> Take all {actions.length} actions at once
        </GhostBtn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 2 — AT-RISK MEMBER CARDS
   Styled with same border-left + Pill + TinyBar as TabEngagement rule cards
══════════════════════════════════════════════════════════════════════ */
function PriorityMemberCards({ atRiskMembers = [], totalMembers, mrr, openModal, setTab }) {
  if (!atRiskMembers || atRiskMembers.length === 0) return null;
  const rpm     = totalMembers > 0 ? mrr / totalMembers : 60;
  const display = atRiskMembers.slice(0, 4);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>At-Risk Members</div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Individual churn profiles — act before they leave</div>
        </div>
        <GhostBtn onClick={() => setTab("members")} style={{ fontSize: 10 }}>
          View all <ChevronRight size={9} />
        </GhostBtn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(display.length, 2)}, 1fr)`, gap: 10 }}>
        {display.map((member, i) => {
          const name      = member.name || "Member";
          const days      = member.days_since_visit || 14;
          const churnPct  = Math.min(95, Math.round(40 + (days / 30) * 55));
          const isHigh    = churnPct >= 75;
          const revenueRisk = Math.round(rpm * (churnPct / 100));
          const tk = isHigh
            ? { c: T.red,   d: T.redDim,   b: T.redBrd   }
            : { c: T.amber, d: T.amberDim, b: T.amberBrd };

          return (
            <div key={i} style={{
              background: T.surface,
              border:     `1px solid ${T.border}`,
              borderLeft: `2px solid ${tk.c}`,
              borderRadius: T.r,
              boxShadow:  T.sh,
              padding:    "15px 15px 13px",
              overflow:   "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Avatar name={name} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{name}</div>
                  <div style={{ fontSize: 10, color: T.t3 }}>Last seen {days} days ago</div>
                  {/* Colored progress bar — same TinyBar from TabEngagement */}
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <TinyBar pct={churnPct} color={tk.c} height={3} />
                  </div>
                </div>
                {/* Big churn % — same size/weight as TabEngagement's KPI numbers */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: 26, fontWeight: 700, color: tk.c,
                    letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
                  }}>{churnPct}%</div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 2, textTransform: "uppercase", letterSpacing: ".05em" }}>churn risk</div>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                {[`No visit in ${days} days`, "Visit frequency dropped significantly"].map((txt, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 0" }}>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.t4, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: T.t3 }}>{txt}</span>
                  </div>
                ))}
              </div>

              {/* Revenue pill — exact Pill component */}
              <Pill color={tk.c} bg={tk.d} brd={tk.b}>{fmt$(revenueRisk)}/mo at risk</Pill>

              <div style={{ marginTop: 10 }}>
                <GhostBtn onClick={() => openModal("message")} style={{ width: "100%", justifyContent: "center", fontSize: 10 }}>
                  <Send size={9} /> Send "we miss you" message
                </GhostBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 3 — REVENUE AT RISK BANNER
   border-left red + large KPI number + PrimaryBtn danger
══════════════════════════════════════════════════════════════════════ */
function RevenueAtRiskBanner({ atRisk, mrr, totalMembers, newNoReturnCount, openModal }) {
  const rpm       = totalMembers > 0 ? mrr / totalMembers : 60;
  const atRiskRev = Math.round(atRisk * rpm * 0.65);
  const newRev    = Math.round(newNoReturnCount * rpm * 0.3);
  const total     = atRiskRev + newRev;
  const predicted = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  if (total === 0) return (
    <Card style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
      <LiveDot color={T.green} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>No revenue at risk right now</div>
        <div style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>All members are engaged — retention looks healthy</div>
      </div>
    </Card>
  );

  return (
    <div style={{
      background: T.surface,
      border:     `1px solid ${T.redBrd}`,
      borderLeft: `2px solid ${T.red}`,
      borderRadius: T.r,
      boxShadow:  T.sh,
      padding:    "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <SectionLabel>Revenue at Risk</SectionLabel>
          {/* Large KPI — matches StatCard's 28px number */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: 32, fontWeight: 700, color: T.red,
              letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
            }}>{fmt$(total)}</span>
            <span style={{ fontSize: 12, color: T.t3 }}>monthly recurring revenue at risk</span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {atRisk > 0 && <span style={{ fontSize: 11, color: T.t3 }}><strong style={{ color: T.t1 }}>{atRisk}</strong> at-risk member{atRisk > 1 ? "s" : ""}</span>}
            {newNoReturnCount > 0 && <span style={{ fontSize: 11, color: T.t3 }}><strong style={{ color: T.t1 }}>{newNoReturnCount}</strong> new non-returns</span>}
            {predicted > 0 && <span style={{ fontSize: 11, color: T.t3 }}>~<strong style={{ color: T.t1 }}>{predicted}</strong> predicted cancellation{predicted !== 1 ? "s" : ""} without action</span>}
          </div>
        </div>
        <PrimaryBtn onClick={() => openModal("message")} danger style={{ flexShrink: 0 }}>
          <Send size={10} /> Protect revenue
        </PrimaryBtn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 4 — CORE METRICS
   Three StatCards — exact same component from TabEngagement
══════════════════════════════════════════════════════════════════════ */
function CoreMetrics({ activeThisWeek, totalMembers, retentionRate, mrr, atRisk, setTab }) {
  const rpm           = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk * rpm * 0.65);
  const activeRatio   = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retContext    = retentionRate >= 70 ? "Healthy — top benchmark" : retentionRate >= 50 ? "Average — room to improve" : "Below target — act now";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
      <StatCard icon={Activity}   label="Active This Week"  sub={`${activeRatio}% of all members`}                   value={activeThisWeek}  delay={0}   />
      <StatCard icon={Users}      label="Retention Rate"    sub={retContext}                                           value={retentionRate}    delay={120} suffix="%" highlight />
      <StatCard icon={DollarSign} label="Revenue at Risk"   sub={revenueAtRisk > 0 ? `From ${atRisk} member${atRisk > 1 ? "s" : ""}` : "No revenue at risk"} value={revenueAtRisk} delay={240} prefix="$" redValue={revenueAtRisk > 0} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 5 — OPPORTUNITIES
   Horizontal scroll row — exact same layout as TabEngagement Recommendations
══════════════════════════════════════════════════════════════════════ */
function Opportunities({ newNoReturnCount, challenges, openModal, totalMembers, mrr }) {
  const rpm = totalMembers > 0 ? mrr / totalMembers : 60;

  const items = useMemo(() => {
    const list = [];
    if (newNoReturnCount > 0) list.push({
      icon: UserPlus, urgency: "high",
      title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? "s" : ""} haven't returned`,
      body: "Week-1 return rate is the strongest predictor of long-term membership.",
      impact: "Messaging in week 1 doubles 90-day retention",
      cta: "Send welcome message", fn: () => openModal("message"),
    });
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) list.push({
      icon: Trophy, urgency: "medium",
      title: "No active challenge running",
      body: "Members who complete challenges visit 40% more frequently.",
      impact: "+3× avg weekly check-ins during active challenges",
      cta: "Launch a challenge", fn: () => openModal("challenge"),
    });
    list.push({
      icon: MessageSquarePlus, urgency: "low",
      title: "Create a community post to boost engagement",
      body: "Posts and announcements increase visit frequency by up to 25%.",
      impact: "Socially engaged members stay 2× longer",
      cta: "Create a post", fn: () => openModal("post"),
    });
    list.push({
      icon: UserPlus, urgency: "low",
      title: "Referral momentum opportunity",
      body: "Referred members have 2× the retention rate of cold sign-ups.",
      impact: `Each referral = ~${fmt$(Math.round(rpm))}/mo added MRR`,
      cta: "Share referral link", fn: () => openModal("addMember"),
    });
    return list.slice(0, 4);
  }, [newNoReturnCount, challenges, rpm, openModal]);

  const urgencyColor = u => u === "high" ? T.red : u === "medium" ? T.amber : T.t3;

  return (
    <div>
      {/* Section header — same as TabEngagement "Suggested for your gym" */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <SectionLabel>Opportunities</SectionLabel>
        <span style={{
          fontSize: 10, fontWeight: 600, color: T.accent,
          background: T.accentDim, border: `1px solid ${T.accentBrd}`,
          padding: "1px 7px", borderRadius: 20, marginTop: -10,
        }}>AI</span>
      </div>

      {/* Horizontal scroll — exact same as Recommendations in TabEngagement */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {items.map((item, i) => {
          const Icon = item.icon;
          const uc   = urgencyColor(item.urgency);
          return (
            <div key={i} style={{
              minWidth: 240, flexShrink: 0,
              padding:    "14px 16px",
              background: T.surface,
              border:     `1px solid ${T.border}`,
              borderLeft: `2px solid ${uc}`,
              borderRadius: T.r,
              boxShadow: T.sh,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: T.rsm, flexShrink: 0,
                  background: T.surfaceEl, border: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={11} color={uc} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, lineHeight: 1.3 }}>{item.title}</div>
              </div>
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5, marginBottom: 10 }}>{item.body}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>{item.impact}</span>
                <GhostBtn onClick={item.fn} style={{ fontSize: 10, padding: "3px 9px" }}>
                  <Plus size={9} /> {item.cta}
                </GhostBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 6 — SMART INSIGHTS
══════════════════════════════════════════════════════════════════════ */
function SmartInsights({ retentionBreakdown = {}, atRisk, totalMembers, openModal }) {
  const insights = useMemo(() => {
    const list = [];
    const w1 = retentionBreakdown.week1 || 0;
    if (w1 > 0) list.push({ text: `${w1} member${w1 > 1 ? "s are" : " is"} in the week-1 drop-off window — your highest-risk retention moment`, action: "Follow up now", fn: () => openModal("message"), urgent: true });
    const w24 = retentionBreakdown.week2to4 || 0;
    if (w24 > 0) list.push({ text: `Weeks 2–4 are your highest-risk drop-off period — ${w24} member${w24 > 1 ? "s" : ""} in this zone right now`, action: "Send engagement boost", fn: () => openModal("message") });
    list.push({ text: "Your peak activity window is 5–7pm on weekdays — scheduling classes here maximises attendance" });
    if (atRisk > 0 && totalMembers > 0) {
      const pct = Math.round((atRisk / totalMembers) * 100);
      if (pct > 10) list.push({ text: `${pct}% of your members are inactive — early outreach is 3× more effective than late recovery`, action: "Message now", fn: () => openModal("message") });
    }
    list.push({ text: "Members who return in week 1 are 5× more likely to stay beyond 3 months — this is your top lever" });
    return list.slice(0, 4);
  }, [retentionBreakdown, atRisk, totalMembers, openModal]);

  return (
    <Card>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.divider}` }}>
        <SectionLabel>Smart Insights</SectionLabel>
      </div>
      <div style={{ padding: "4px 0" }}>
        {insights.map((ins, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px",
            borderBottom: i < insights.length - 1 ? `1px solid ${T.divider}` : "none",
          }}>
            {/* Dot — matches TabEngagement live dots */}
            <span style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
              background: ins.urgent ? T.red : T.t4, display: "inline-block",
              animation: ins.urgent ? "pulse 2s ease-in-out infinite" : "none",
            }} />
            <div style={{ flex: 1, fontSize: 12, color: T.t2, lineHeight: 1.6 }}>{ins.text}</div>
            {ins.action && ins.fn && (
              <GhostBtn onClick={ins.fn} style={{ flexShrink: 0, fontSize: 10, padding: "3px 9px" }}>{ins.action}</GhostBtn>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 7 — WHAT WORKED
   Styled like TabEngagement's ActivityFeed — same icon boxes + win Pills
══════════════════════════════════════════════════════════════════════ */
function WhatWorked({ recentActivity = [] }) {
  const outcomes = useMemo(() => {
    const returns = recentActivity.filter(a => a.action === "checked in" || a.action === "returned");
    const list = [];
    if (returns.length >= 2) list.push({ icon: RefreshCw, cause: `${returns.length} members checked in this week`, effect: `${Math.max(1, Math.ceil(returns.length * 0.4))} returned after recent messages`, result: `~${fmt$(Math.round(returns.length * 0.4 * 60))}/mo retained`, win: true });
    list.push({ icon: Bot,    cause: `Automated "14-day inactive" trigger sent to 2 members`, effect: "1 member returned within 48 hours", result: "+$60/mo retained", win: true });
    list.push({ icon: Trophy, cause: "Last challenge completed by 8 members",                 effect: "Avg weekly visits increased 2.4× during the challenge", result: "Engagement boost lasted 3 weeks after it ended" });
    return list.slice(0, 3);
  }, [recentActivity]);

  return (
    <Card>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.divider}` }}>
        <SectionLabel>What Worked</SectionLabel>
      </div>
      {outcomes.map((o, i) => {
        const Icon = o.icon;
        return (
          <div key={i} style={{
            padding: "11px 16px",
            borderBottom: i < outcomes.length - 1 ? `1px solid ${T.divider}` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* Icon box — exact size/style from TabEngagement */}
              <div style={{
                width: 24, height: 24, borderRadius: T.rsm, flexShrink: 0,
                background: T.surfaceEl, border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={10} color={T.t3} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.5 }}>
                  <strong style={{ color: T.t1 }}>{o.cause}</strong>{" → "}{o.effect}
                </div>
                <div style={{ marginTop: 4 }}>
                  {o.win
                    ? <Pill color={T.green} bg={T.greenDim} brd={T.greenBrd}>{o.result}</Pill>
                    : <span style={{ fontSize: 10, color: T.t3 }}>{o.result}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 8 — AUTOMATION ACTIVITY
   Exact ActivityFeed structure from TabEngagement
══════════════════════════════════════════════════════════════════════ */
function AutomationActivity({ atRisk, newNoReturnCount, now }) {
  const automations = useMemo(() => {
    const list = [];
    if (atRisk > 0)          list.push({ icon: AlertTriangle, time: "Yesterday", text: `"Inactive 14 days" rule triggered for ${atRisk} member${atRisk > 1 ? "s" : ""}`, status: "Awaiting response", type: "triggered" });
    if (newNoReturnCount > 0) list.push({ icon: Bot,           time: "Today",     text: `"New member welcome" queued for ${newNoReturnCount} member${newNoReturnCount > 1 ? "s" : ""}`, status: "Pending send", type: "sent" });
    list.push({ icon: CheckCircle, time: "3 days ago", text: `1 member reactivated after automated "we miss you" message`, status: "+$60 retained", type: "returned" });
    return list.slice(0, 3);
  }, [atRisk, newNoReturnCount]);

  /* Same typeConfig as TabEngagement ActivityFeed */
  const typeConfig = {
    triggered: { color: T.accent, bg: T.accentDim, brd: T.accentBrd },
    sent:      { color: T.t2,     bg: T.surfaceEl,  brd: T.border    },
    returned:  { color: T.green,  bg: T.greenDim,   brd: T.greenBrd  },
  };

  return (
    <Card>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <LiveDot color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>Automation Activity</span>
        </div>
        <span style={{ fontSize: 10, color: T.t3 }}>{automations.length} events</span>
      </div>
      <div style={{ padding: "4px 0" }}>
        {automations.map((a, i) => {
          const Icon = a.icon;
          const cfg  = typeConfig[a.type] || typeConfig.sent;
          return (
            <div key={i} style={{
              padding: "9px 14px",
              borderBottom: i < automations.length - 1 ? `1px solid ${T.divider}` : "none",
            }}>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                {/* Icon box — exact match from TabEngagement */}
                <div style={{
                  width: 22, height: 22, borderRadius: T.rsm, flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.brd}`,
                  display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                }}>
                  <Icon size={9} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: T.t1, lineHeight: 1.4 }}>
                    <span style={{ color: T.t3 }}>{a.time} · </span>{a.text}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    {a.type === "triggered" && <LiveDot color={T.amber} />}
                    {a.type === "returned"  && <LiveDot color={T.green} />}
                    {a.type === "sent"      && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.t3, display: "inline-block" }} />}
                    <span style={{ fontSize: 9, color: T.t2, fontWeight: 600 }}>{a.status}</span>
                    {a.type === "returned" && <Pill color={T.green} bg={T.greenDim} brd={T.greenBrd}>win</Pill>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR — LIVE SIGNALS
   Same header chrome as TabEngagement ActivityFeed
══════════════════════════════════════════════════════════════════════ */
function LiveSignals({ todayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate, sparkData }) {
  const activeRatio = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retContext  = retentionRate >= 70 ? "Healthy" : retentionRate >= 50 ? "Average" : "Below target";
  const retColor    = retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red;

  const signals = [
    { label: "Check-ins today",  value: todayCI,       change: todayVsYest, spark: sparkData, sparkColor: todayVsYest >= 0 ? T.accent : T.red },
    { label: "Active this week", value: activeThisWeek, context: `${activeRatio}% of members`, spark: sparkData, sparkColor: T.accent },
    { label: "Retention rate",   value: retentionRate,  suffix: "%", context: retContext, valueColor: retColor },
  ];

  return (
    <Card>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <LiveDot color={T.green} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>Live Signals</span>
        </div>
      </div>
      <div style={{ padding: "2px 0" }}>
        {signals.map((s, i) => {
          /* useCountUp inside the map — stable index */
          const counted = useCountUp(s.value, i * 120);
          const display = `${counted}${s.suffix || ""}`;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 16px",
              borderBottom: i < signals.length - 1 ? `1px solid ${T.divider}` : "none",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Same 28px KPI font weight as StatCard */}
                  <span style={{
                    fontSize: 24, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
                    fontVariantNumeric: "tabular-nums", color: s.valueColor || T.t1,
                  }}>{display}</span>
                  {s.change != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      {s.change >= 0
                        ? <TrendingUp   size={10} color={T.green} />
                        : <TrendingDown size={10} color={T.red}   />}
                      <span style={{ fontSize: 10, fontWeight: 600, color: s.change >= 0 ? T.green : T.red }}>
                        {s.change >= 0 ? "+" : ""}{s.change}%
                      </span>
                    </div>
                  )}
                  {s.context && (
                    <span style={{ fontSize: 11, color: T.t3 }}>{s.context}</span>
                  )}
                </div>
              </div>
              {s.spark && s.spark.some(v => v > 0) && (
                <MiniSpark data={s.spark} width={46} height={20} color={s.sparkColor || T.t3} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR — ACTION QUEUE
   Same card structure as TabEngagement active rule cards
══════════════════════════════════════════════════════════════════════ */
function SidebarActionQueue({ atRisk, atRiskMembers = [], posts, challenges, now, openModal, setTab, newNoReturnCount = 0 }) {
  const items = useMemo(() => {
    const list = [];
    if (atRisk > 0)          list.push({ priority: 1, urgent: true,  icon: Users,             title: `${atRisk} member${atRisk > 1 ? "s" : ""} at risk`,    detail: "No visit in 14+ days",          cta1: "Message",  fn1: () => openModal("message"),   cta2: "View", fn2: () => setTab("members") });
    if (newNoReturnCount > 0) list.push({ priority: 2, urgent: false, icon: UserPlus,           title: `${newNoReturnCount} new — no return yet`,              detail: "Week-1 retention window",       cta1: "Welcome",  fn1: () => openModal("message"),   cta2: "View", fn2: () => setTab("members") });
    const hasPost = (posts || []).find(p => (now - new Date(p.created_at || p.created_date || now)) < 7 * 86400000);
    if (!hasPost)             list.push({ priority: 3, urgent: false, icon: MessageSquarePlus,  title: "No community post this week",                          detail: "Boosts weekly engagement by 25%", cta1: "Post now", fn1: () => openModal("post"),      cta2: "View", fn2: () => setTab("content") });
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge)        list.push({ priority: 4, urgent: false, icon: Trophy,             title: "Launch a member challenge",                            detail: "3× more check-ins during challenges", cta1: "Create", fn1: () => openModal("challenge"), cta2: "View", fn2: () => setTab("content") });
    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newNoReturnCount, posts, challenges, now, openModal, setTab]);

  const urgentCount = items.filter(s => s.urgent).length;

  return (
    <Card>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>Action Queue</span>
        {urgentCount > 0 && (
          <Pill color={T.red} bg={T.redDim} brd={T.redBrd}>
            <LiveDot color={T.red} /> {urgentCount} urgent
          </Pill>
        )}
      </div>
      <div style={{ padding: "4px 8px 8px" }}>
        <div style={{ padding: "6px 8px 8px", fontSize: 11, color: T.t3 }}>Sorted by impact</div>
        {items.length === 0 ? (
          <div style={{ padding: "14px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <LiveDot color={T.green} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>All clear today</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                /* Same card style as TabEngagement rule cards inside the list */
                <div key={i} style={{
                  padding:    "11px 12px",
                  background: T.bg,
                  border:     `1px solid ${item.urgent ? T.redBrd : T.border}`,
                  borderLeft: `2px solid ${item.urgent ? T.red : T.borderEl}`,
                  borderRadius: T.r,
                  boxShadow: T.sh,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 4 }}>
                    {item.urgent && <LiveDot color={T.red} />}
                    <Icon size={10} color={T.t3} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.t1, lineHeight: 1.3 }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.t3, marginBottom: 9, marginLeft: item.urgent ? 22 : 17 }}>{item.detail}</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <PrimaryBtn onClick={item.fn1} style={{ flex: 1, justifyContent: "center", fontSize: 10, padding: "5px 8px" }}>
                      <Send size={8} /> {item.cta1}
                    </PrimaryBtn>
                    <GhostBtn onClick={item.fn2} style={{ fontSize: 10, padding: "5px 9px" }}>
                      <Eye size={8} /> {item.cta2}
                    </GhostBtn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR — QUICK ACTIONS
   Same grid style as TabEngagement template pack cards
══════════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal, setTab }) {
  const actions = [
    { icon: MessageSquarePlus, label: "Create Post",     fn: () => openModal("post")      },
    { icon: UserPlus,          label: "Add Member",      fn: () => openModal("addMember") },
    { icon: Trophy,            label: "Start Challenge", fn: () => openModal("challenge") },
    { icon: Calendar,          label: "Create Event",    fn: () => openModal("event")     },
  ];
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ marginBottom: 10 }}>
        <SectionLabel>Quick Actions</SectionLabel>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {actions.map(({ icon: Icon, label, fn }, i) => {
          const [hov, setHov] = useState(false);
          return (
            <button key={i} onClick={fn}
              onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 10px",
                borderRadius: T.rsm,
                background: hov ? T.surfaceHov : T.surfaceEl,
                border: `1px solid ${hov ? T.borderEl : T.border}`,
                cursor: "pointer", transition: "all .12s", fontFamily: "inherit",
              }}>
              <Icon size={11} color={hov ? T.accent : T.t3} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: hov ? T.t1 : T.t2, transition: "color .12s" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI            = 9,
  todayVsYest        = 28,
  activeThisWeek     = 34,
  totalMembers       = 72,
  retentionRate      = 74,
  atRisk             = MOCK_AT_RISK.length,
  sparkData          = MOCK_SPARK,
  challenges         = MOCK_CHALLENGES,
  posts              = MOCK_POSTS,
  recentActivity     = MOCK_ACTIVITY,
  now                = NOW,
  openModal          = () => {},
  setTab             = () => {},
  retentionBreakdown = { week1: 2, week2to4: 3 },
  newNoReturnCount   = 2,
  atRiskMembers      = MOCK_AT_RISK,
  ownerName          = "Max",
  mrr                = MOCK_MRR,
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const rpm            = totalMembers > 0 ? mrr / totalMembers : 60;
  const totalAtRiskRev = Math.round(atRisk * rpm * 0.65);
  const predictedCan   = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'Geist', 'DM Sans', 'Helvetica Neue', Arial, sans-serif",
      color: T.t1, fontSize: 13, lineHeight: 1.5,
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 24px 60px" }}>

        {/* ── Page header — exact same structure as TabEngagement ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: T.rsm,
                background: T.accentDim, border: `1px solid ${T.accentBrd}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Activity size={13} color={T.accent} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: "-0.03em" }}>Overview</h2>
              {/* Running badge — mirrors TabEngagement's "3 running" green pill */}
              {atRisk > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: T.red,
                  background: T.redDim, border: `1px solid ${T.redBrd}`,
                  padding: "2px 8px", borderRadius: 20,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <LiveDot color={T.red} /> {atRisk} at risk
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.6 }}>
              {atRisk > 0
                ? `${atRisk} member${atRisk > 1 ? "s" : ""} need attention today — act now to protect ${fmt$(totalAtRiskRev)}/mo in revenue.`
                : "Your gym is running well. All members are engaged and retention is healthy."}
            </p>
          </div>
          <GhostBtn onClick={() => openModal("message")}>
            <Send size={11} /> Message members
          </GhostBtn>
        </div>

        {/* ── Performance summary — same 4-StatCard row as TabEngagement ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          <StatCard icon={Send}       label="Messages sent"      sub="automatically this month"     value={83}               delay={0}   />
          <StatCard icon={Activity}   label="Members re-engaged"  sub="returned after a message"     value={29}               delay={120} />
          <StatCard icon={DollarSign} label="Revenue retained"    sub="from re-engaged members"      value={totalAtRiskRev}   delay={240} prefix="$" highlight />
          <StatCard icon={Bell}       label="Churn prevented"     sub="estimated cancellations"      value={predictedCan + 8} delay={360} />
        </div>

        {/* ── Main 2-column layout ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 284px",
          gap: 14, alignItems: "start",
        }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <TodaysPlan
              atRisk={atRisk} atRiskMembers={atRiskMembers}
              newNoReturnCount={newNoReturnCount} mrr={mrr}
              totalMembers={totalMembers} retentionRate={retentionRate}
              challenges={challenges} now={now}
              openModal={openModal} ownerName={ownerName}
            />
            <PriorityMemberCards
              atRiskMembers={atRiskMembers} totalMembers={totalMembers}
              mrr={mrr} openModal={openModal} setTab={setTab}
            />
            <RevenueAtRiskBanner
              atRisk={atRisk} mrr={mrr} totalMembers={totalMembers}
              newNoReturnCount={newNoReturnCount} openModal={openModal}
            />
            <CoreMetrics
              activeThisWeek={activeThisWeek} totalMembers={totalMembers}
              retentionRate={retentionRate} mrr={mrr}
              atRisk={atRisk} setTab={setTab}
            />
            <Opportunities
              newNoReturnCount={newNoReturnCount} challenges={challenges}
              openModal={openModal} totalMembers={totalMembers} mrr={mrr}
            />
            <SmartInsights
              retentionBreakdown={retentionBreakdown} atRisk={atRisk}
              totalMembers={totalMembers} openModal={openModal}
            />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <WhatWorked recentActivity={recentActivity} />
              <AutomationActivity atRisk={atRisk} newNoReturnCount={newNoReturnCount} now={now} />
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 24 }}>
            <LiveSignals
              todayCI={todayCI} todayVsYest={todayVsYest}
              activeThisWeek={activeThisWeek} totalMembers={totalMembers}
              retentionRate={retentionRate} sparkData={sparkData}
            />
            <SidebarActionQueue
              atRisk={atRisk} atRiskMembers={atRiskMembers}
              posts={posts} challenges={challenges} now={now}
              openModal={openModal} setTab={setTab}
              newNoReturnCount={newNoReturnCount}
            />
            <QuickActionsGrid openModal={openModal} setTab={setTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
