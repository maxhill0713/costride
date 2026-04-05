/**
 * TabOverview — rebuilt with TabEngagement design system
 * Self-contained: mock data included, no external token/primitive imports.
 */
import React, { useState, useEffect, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import {
  TrendingDown, ArrowUpRight, CheckCircle, Trophy,
  UserPlus, MessageSquarePlus, Calendar,
  Activity, Users, AlertTriangle, ChevronRight, Minus,
  TrendingUp, Send, Eye, Bell, DollarSign,
  AlertCircle, Clock, Zap, RefreshCw, ArrowRight,
  Bot, Star,
} from "lucide-react";

/* ── Design tokens ──────────────────────────────────────────────── */
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
  r:   "8px",
  rsm: "6px",
  sh:  "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)",
};

/* ── Mock data ──────────────────────────────────────────────────── */
const NOW      = new Date();
const MOCK_MRR = 4320;
const MOCK_SPARK = [4, 6, 5, 8, 7, 10, 9];

const MOCK_AT_RISK = [
  { user_id: "u1", name: "Marcus Webb",    days_since_visit: 18 },
  { user_id: "u2", name: "Priya Sharma",   days_since_visit: 22 },
  { user_id: "u3", name: "Devon Osei",     days_since_visit: 15 },
  { user_id: "u4", name: "Jamie Collins",  days_since_visit: 31 },
];

const MOCK_CHALLENGES = [
  { id: "c1", title: "30-Day Consistency", status: "active", ended_at: null },
];

const MOCK_POSTS = [
  { id: "p1", title: "Monday Motivation", created_date: new Date(NOW.getTime() - 2 * 86400000).toISOString() },
];

const MOCK_CHECKINS = Array.from({ length: 34 }, (_, i) => ({
  id: `ci${i}`,
  check_in_date: new Date(NOW.getTime() - Math.floor(Math.random() * 14) * 86400000).toISOString(),
}));

const MOCK_ACTIVITY = [
  { action: "checked in", member: "Chloe Nakamura", time: "10 min ago" },
  { action: "returned",   member: "Alex Turner",    time: "1 hr ago"   },
  { action: "checked in", member: "Sam Rivera",     time: "2 hrs ago"  },
];

/* ── Helpers ────────────────────────────────────────────────────── */
const fmtMoney = n => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ── Local primitives ───────────────────────────────────────────── */
function Avatar({ name = "", size = 32 }) {
  const letters = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const hue = (name.charCodeAt(0) || 72) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: T.rsm, flexShrink: 0,
      background: `hsl(${hue},25%,10%)`, border: `1px solid hsl(${hue},25%,18%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: `hsl(${hue},50%,55%)`,
    }}>{letters}</div>
  );
}

function RingChart({ pct = 0, size = 42, stroke = 3, color = T.accent }) {
  const r  = (size - stroke * 2) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.divider}  strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}      strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
    </svg>
  );
}

function MiniSpark({ data = [], width = 56, height = 24, color }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const clr = color || T.accent;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const first = pts.split(" ")[0], last = pts.split(" ").slice(-1)[0];
  const area  = `${first.split(",")[0]},${height} ${pts} ${last.split(",")[0]},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${clr.replace(/[^a-z0-9]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={clr} stopOpacity="0.22" />
          <stop offset="100%" stopColor={clr} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${clr.replace(/[^a-z0-9]/gi,"")})`} />
      <polyline points={pts} fill="none" stroke={clr} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Shared card wrapper ─────────────────────────────────────────── */
function Card({ children, style = {}, accentColor = null }) {
  return (
    <div style={{
      borderRadius: T.r, background: T.surface, boxShadow: T.sh, overflow: "hidden",
      border:     `1px solid ${accentColor ? accentColor + "40" : T.border}`,
      borderLeft: accentColor ? `2px solid ${accentColor}` : `1px solid ${T.border}`,
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 12 }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — TODAY'S PLAN
══════════════════════════════════════════════════════════════════ */
function TodaysPlan({ atRisk, atRiskMembers, newNoReturnCount, mrr, totalMembers, retentionRate,
  todayCI, checkIns, challenges, now, openModal, setTab, ownerName }) {

  const hour   = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk    = Math.round(atRisk * revenuePerMember * 0.65);
  const predictedCancel  = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  const summary = useMemo(() => {
    if (atRisk === 0 && newNoReturnCount === 0)
      return `Your gym is in good shape today. Retention sits at ${retentionRate}% and your active members are engaged. Focus on growing new sign-ups and filling any underutilised classes.`;
    const parts = [];
    if (atRisk > 0) parts.push(`${atRisk} member${atRisk > 1 ? "s" : ""} ${atRisk > 1 ? "are" : "is"} showing churn signals — no visit in 14+ days`);
    if (newNoReturnCount > 0) parts.push(`${newNoReturnCount} new member${newNoReturnCount > 1 ? "s haven't" : " hasn't"} come back after their first visit`);
    const riskStr = revenueAtRisk > 0 ? ` That puts ${fmtMoney(revenueAtRisk)}/month at risk.` : "";
    return parts.join(", ") + `.${riskStr} A direct message today is your highest-impact action.`;
  }, [atRisk, newNoReturnCount, retentionRate, revenueAtRisk]);

  const actions = useMemo(() => {
    const list = [];
    if (atRisk > 0) {
      const top = atRiskMembers[0];
      const memberName = top ? (top.name || top.first_name || "a member") : "members";
      list.push({
        priority: 1, color: T.red,
        who: atRisk > 1 ? `${atRisk} at-risk members` : memberName,
        why: "No visit in 14+ days — churn probability climbing daily",
        impact: fmtMoney(revenueAtRisk) + "/mo at risk",
        action: 'Send a personal "we miss you" message',
        outcome: "73% chance they return this week",
        ctaLabel: `Message ${atRisk > 1 ? atRisk + " members" : memberName}`,
        fn: () => openModal("message"),
      });
    }
    if (newNoReturnCount > 0) {
      list.push({
        priority: 2, color: T.amber,
        who: `${newNoReturnCount} new member${newNoReturnCount > 1 ? "s" : ""}`,
        why: "Joined recently but no return visit — week-1 window is closing",
        impact: "Week-1 return doubles long-term retention",
        action: "Send a personal welcome follow-up today",
        outcome: "68% return rate when messaged in week 1",
        ctaLabel: "Send welcome message",
        fn: () => openModal("message"),
      });
    }
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge && list.length < 3) {
      list.push({
        priority: list.length + 1, color: T.accent,
        who: "All active members",
        why: "No active challenge — engagement drifts without shared goals",
        impact: "Challenges boost avg weekly visits by ~40%",
        action: "Start a 30-day fitness or habit challenge",
        outcome: "3× more check-ins during active challenges",
        ctaLabel: "Launch a challenge",
        fn: () => openModal("challenge"),
      });
    }
    if (list.length < 3) {
      list.push({
        priority: list.length + 1, color: T.green,
        who: "Your community",
        why: "Retention is solid — now is the time to grow membership",
        impact: `Each referral adds ~${fmtMoney(Math.round(revenuePerMember))}/mo MRR`,
        action: "Share a referral link or QR code",
        outcome: "Referred members have 2× retention rate",
        ctaLabel: "Share referral link",
        fn: () => openModal("addMember"),
      });
    }
    return list.slice(0, 3);
  }, [atRisk, atRiskMembers, newNoReturnCount, challenges, revenueAtRisk, revenuePerMember, openModal]);

  const urgencyColor = atRisk > 0 ? T.red : newNoReturnCount > 0 ? T.amber : T.green;
  const urgencyLabel = atRisk > 0 ? "Action needed" : newNoReturnCount > 0 ? "Watch closely" : "On track";

  return (
    <div style={{ borderRadius: T.r, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.sh, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "20px 22px 18px", borderBottom: `1px solid ${T.divider}`,
        background: `linear-gradient(135deg, ${T.surface} 0%, ${urgencyColor}08 100%)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, background: T.accentDim, border: `1px solid ${T.accentBrd}` }}>
              <Star size={9} color={T.accent} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.accent, letterSpacing: ".08em", textTransform: "uppercase" }}>AI Coach</span>
            </div>
            <span style={{ fontSize: 11, color: T.t3 }}>· Updated just now</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, background: urgencyColor + "14", border: `1px solid ${urgencyColor}28` }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: urgencyColor, animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: urgencyColor, letterSpacing: ".06em", textTransform: "uppercase" }}>{urgencyLabel}</span>
          </div>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: T.t1, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          {greeting}, {ownerName}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: T.t2, lineHeight: 1.65, maxWidth: 640 }}>{summary}</p>
        {revenueAtRisk > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 12, padding: "6px 12px", borderRadius: T.rsm, background: T.redDim, border: `1px solid ${T.redBrd}` }}>
            <AlertTriangle size={10} color={T.red} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>{fmtMoney(revenueAtRisk)}/month at risk</span>
            <span style={{ fontSize: 11, color: T.t4 }}>·</span>
            <span style={{ fontSize: 11, color: T.t3 }}>~{predictedCancel} predicted cancellation{predictedCancel !== 1 ? "s" : ""} without action</span>
          </div>
        )}
      </div>

      {/* 3 Priority Actions */}
      <div style={{ padding: "16px 22px 20px" }}>
        <SectionLabel>Your 3 highest-impact actions today</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {actions.map((act, i) => (
            <div key={i} style={{
              padding: "14px 14px 12px", borderRadius: T.r,
              background: T.surfaceEl, border: `1px solid ${T.border}`,
              borderTop: `2px solid ${act.color}`,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: act.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: act.color, textTransform: "uppercase", letterSpacing: ".08em" }}>
                  Priority {i + 1}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, lineHeight: 1.35, marginBottom: 4 }}>{act.who}</div>
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5, marginBottom: 8, flex: 1 }}>{act.why}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: act.color, marginBottom: 8, padding: "4px 8px", borderRadius: T.rsm, background: act.color + "12", border: `1px solid ${act.color}24` }}>
                {act.impact}
              </div>
              <div style={{ fontSize: 10, color: T.t3, marginBottom: 10, lineHeight: 1.4 }}>→ {act.action}</div>
              <button onClick={act.fn}
                onMouseEnter={e => e.currentTarget.style.background = act.color + "28"}
                onMouseLeave={e => e.currentTarget.style.background = act.color + "16"}
                style={{
                  width: "100%", padding: "7px 10px", borderRadius: T.rsm,
                  background: act.color + "16", border: `1px solid ${act.color}30`,
                  color: act.color, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", transition: "background .12s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                {act.ctaLabel} <ArrowRight size={9} />
              </button>
              <div style={{ fontSize: 9, color: T.t3, textAlign: "center", marginTop: 6 }}>{act.outcome}</div>
            </div>
          ))}
        </div>
        <button onClick={() => openModal("message")}
          onMouseEnter={e => { e.currentTarget.style.background = T.surfaceHov; e.currentTarget.style.color = T.t1; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surfaceEl;  e.currentTarget.style.color = T.t2; }}
          style={{
            marginTop: 10, width: "100%", padding: "9px 16px", borderRadius: T.r,
            background: T.surfaceEl, border: `1px solid ${T.borderEl}`,
            color: T.t2, fontSize: 11, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, transition: "all .12s",
          }}>
          <Zap size={11} color={T.accent} /> Take all {actions.length} actions at once
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — PRIORITY MEMBER CARDS
══════════════════════════════════════════════════════════════════ */
function PriorityMemberCards({ atRiskMembers = [], totalMembers, mrr, now, openModal, setTab }) {
  if (!atRiskMembers || atRiskMembers.length === 0) return null;
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const displayMembers   = atRiskMembers.slice(0, 4);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>At-Risk Members</div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Individual churn profiles — act before they leave</div>
        </div>
        <button onClick={() => setTab("members")} style={{ fontSize: 11, color: T.t3, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontFamily: "inherit" }}>
          View all <ChevronRight size={10} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(displayMembers.length, 2)}, 1fr)`, gap: 10 }}>
        {displayMembers.map((member, i) => {
          const name = member.name || member.first_name || "Member";
          const daysSince   = member.days_since_visit || 14;
          const churnPct    = Math.min(95, Math.round(40 + (daysSince / 30) * 55));
          const revenueRisk = Math.round(revenuePerMember * (churnPct / 100));
          const churnColor  = churnPct >= 75 ? T.red : churnPct >= 50 ? T.amber : T.t2;
          const churnDim    = churnPct >= 75 ? T.redDim : churnPct >= 50 ? T.amberDim : T.surfaceEl;
          const churnBrd    = churnPct >= 75 ? T.redBrd : churnPct >= 50 ? T.amberBrd : T.border;
          const signals = [];
          if (daysSince >= 14) signals.push(`No visit in ${daysSince} days`);
          signals.push("Visit frequency dropped significantly");

          return (
            <div key={i} style={{
              padding: "15px 15px 13px", borderRadius: T.r,
              background: T.surface, border: `1px solid ${T.border}`,
              borderLeft: `2px solid ${churnColor}`, boxShadow: T.sh,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Avatar name={name} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{name}</div>
                  <div style={{ fontSize: 10, color: T.t3 }}>Last seen {daysSince} days ago</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: churnColor, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{churnPct}%</div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 2, textTransform: "uppercase", letterSpacing: ".04em" }}>churn risk</div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                {signals.slice(0, 2).map((sig, si) => (
                  <div key={si} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.t4, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: T.t3 }}>{sig}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: churnColor, padding: "3px 8px", borderRadius: T.rsm, background: churnDim, border: `1px solid ${churnBrd}` }}>
                  {fmtMoney(revenueRisk)}/mo at risk
                </span>
              </div>
              <button onClick={() => openModal("message")} style={{
                width: "100%", padding: "7px 10px", borderRadius: T.rsm,
                background: churnColor + "14", border: `1px solid ${churnColor}28`,
                color: churnColor, fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                <Send size={9} /> Send "we miss you" message
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — REVENUE AT RISK BANNER
══════════════════════════════════════════════════════════════════ */
function RevenueAtRiskBanner({ atRisk, mrr, totalMembers, newNoReturnCount, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const atRiskRev     = Math.round(atRisk * revenuePerMember * 0.65);
  const newRev        = Math.round(newNoReturnCount * revenuePerMember * 0.3);
  const totalRisk     = atRiskRev + newRev;
  const predictedCan  = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  if (totalRisk === 0) {
    return (
      <Card accentColor={T.green} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <CheckCircle size={16} color={T.green} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>No revenue at risk right now</div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>All members are engaged and retention looks healthy</div>
        </div>
      </Card>
    );
  }

  return (
    <Card accentColor={T.red} style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <DollarSign size={11} color={T.red} />
            <SectionLabel>Revenue at Risk</SectionLabel>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: T.red, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {fmtMoney(totalRisk)}
            </span>
            <span style={{ fontSize: 12, color: T.t3 }}>monthly recurring revenue at risk</span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {atRisk > 0 && <span style={{ fontSize: 11, color: T.t3 }}><span style={{ fontWeight: 600, color: T.red }}>{atRisk}</span> at-risk member{atRisk > 1 ? "s" : ""}</span>}
            {newNoReturnCount > 0 && <span style={{ fontSize: 11, color: T.t3 }}><span style={{ fontWeight: 600, color: T.amber }}>{newNoReturnCount}</span> new non-returns</span>}
            {predictedCan > 0 && <span style={{ fontSize: 11, color: T.t3 }}>~<span style={{ fontWeight: 600, color: T.red }}>{predictedCan}</span> predicted cancellation{predictedCan !== 1 ? "s" : ""} without action</span>}
          </div>
        </div>
        <button onClick={() => openModal("message")} style={{
          padding: "8px 14px", borderRadius: T.rsm, whiteSpace: "nowrap", flexShrink: 0,
          background: T.redDim, border: `1px solid ${T.redBrd}`,
          color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
        }}>
          <Send size={10} /> Protect revenue
        </button>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — CORE METRICS
══════════════════════════════════════════════════════════════════ */
function CoreMetrics({ activeThisWeek, totalMembers, retentionRate, mrr, atRisk, sparkData, setTab }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk    = Math.round(atRisk * revenuePerMember * 0.65);
  const retColor = retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red;
  const activeRatio = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;

  const metrics = [
    {
      label: "Active This Week", value: activeThisWeek, suffix: `/ ${totalMembers}`,
      context: `${activeRatio}% of all members`, trend: activeRatio > 50 ? "up" : "neutral",
      valueColor: activeRatio > 50 ? T.green : T.t1,
      trendColor: activeRatio > 50 ? T.green : T.t3,
      spark: sparkData, action: "View members", onAction: () => setTab("members"),
    },
    {
      label: "Retention Rate", value: retentionRate + "%", suffix: null,
      context: retentionRate >= 70 ? "Healthy — top benchmark" : retentionRate >= 50 ? "Average — room to improve" : "Below target — act now",
      trend: retentionRate >= 70 ? "up" : retentionRate < 50 ? "down" : null,
      valueColor: retColor, trendColor: retColor, ring: retentionRate, ringColor: retColor,
    },
    {
      label: "Revenue at Risk", value: revenueAtRisk > 0 ? fmtMoney(revenueAtRisk) : "$0", suffix: null,
      context: revenueAtRisk > 0 ? `From ${atRisk} member${atRisk > 1 ? "s" : ""} — protect it now` : "No revenue at risk",
      trend: revenueAtRisk > 0 ? "down" : "up",
      valueColor: revenueAtRisk > 0 ? T.red : T.green,
      trendColor: revenueAtRisk > 0 ? T.red : T.green,
      action: revenueAtRisk > 0 ? "Message at-risk members" : undefined,
      onAction: revenueAtRisk > 0 ? () => setTab("members") : undefined,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {metrics.map((m, i) => {
        const TIcon = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
        const showRing = m.ring != null && m.ring > 5 && m.ring < 98;
        return (
          <div key={i} style={{
            padding: "16px 16px 14px", borderRadius: T.r,
            background: T.surface, border: `1px solid ${T.border}`,
            boxShadow: T.sh, display: "flex", flexDirection: "column",
          }}>
            <SectionLabel>{m.label}</SectionLabel>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color: m.valueColor, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
                  {m.suffix && <span style={{ fontSize: 13, color: T.t3 }}>{m.suffix}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                  {m.trend && <TIcon size={10} color={m.trendColor} />}
                  <span style={{ fontSize: 10, color: m.trendColor, fontWeight: 500 }}>{m.context}</span>
                </div>
              </div>
              {showRing
                ? <RingChart pct={m.ring} size={42} stroke={3} color={m.ringColor || T.accent} />
                : m.spark && m.spark.some(v => v > 0)
                  ? <MiniSpark data={m.spark} color={m.trendColor} />
                  : null
              }
            </div>
            {m.action && m.onAction && (
              <button onClick={m.onAction} style={{
                marginTop: 4, padding: "5px 9px", borderRadius: T.rsm, width: "100%",
                background: T.surfaceEl, border: `1px solid ${T.borderEl}`,
                color: T.t2, fontSize: 10, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                {m.action} <ChevronRight size={9} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — OPPORTUNITIES
══════════════════════════════════════════════════════════════════ */
function Opportunities({ newNoReturnCount, challenges, now, openModal, setTab, totalMembers, mrr }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const items = useMemo(() => {
    const list = [];
    if (newNoReturnCount > 0) {
      list.push({
        color: T.amber, icon: UserPlus,
        title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? "s" : ""} haven't returned`,
        detail: "Week-1 return rate is the strongest predictor of long-term membership",
        impact: "Messaging in week 1 doubles 90-day retention",
        cta: "Send welcome message", fn: () => openModal("message"),
      });
    }
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        color: T.accent, icon: Trophy,
        title: "No active challenge running",
        detail: "Members who complete challenges visit 40% more frequently",
        impact: "+3× avg weekly check-ins during active challenges",
        cta: "Launch a challenge", fn: () => openModal("challenge"),
      });
    }
    list.push({
      color: T.accent, icon: MessageSquarePlus,
      title: "Create a community post to boost engagement",
      detail: "Posts and announcements increase visit frequency by up to 25%",
      impact: "Socially engaged members stay 2× longer",
      cta: "Create a post", fn: () => openModal("post"),
    });
    list.push({
      color: T.green, icon: UserPlus,
      title: "Referral momentum opportunity",
      detail: "Referred members have 2× the retention rate of cold sign-ups",
      impact: `Each referral = ~${fmtMoney(Math.round(revenuePerMember))}/mo added MRR`,
      cta: "Share referral link", fn: () => openModal("addMember"),
    });
    return list.slice(0, 4);
  }, [newNoReturnCount, challenges, revenuePerMember]);

  return (
    <Card style={{ padding: 20 }}>
      <SectionLabel>Opportunities</SectionLabel>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0",
            borderBottom: i < items.length - 1 ? `1px solid ${T.divider}` : "none",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: T.rsm, flexShrink: 0,
              background: item.color + "14", border: `1px solid ${item.color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={13} color={item.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.45, marginBottom: 4 }}>{item.detail}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: item.color }}>{item.impact}</div>
            </div>
            <button onClick={item.fn}
              onMouseEnter={e => e.currentTarget.style.background = item.color + "22"}
              onMouseLeave={e => e.currentTarget.style.background = item.color + "12"}
              style={{
                padding: "5px 11px", borderRadius: T.rsm, whiteSpace: "nowrap", flexShrink: 0,
                background: item.color + "12", border: `1px solid ${item.color}24`,
                color: item.color, fontSize: 11, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "background .12s",
                display: "flex", alignItems: "center", gap: 4,
              }}>
              {item.cta} <ChevronRight size={9} />
            </button>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — SMART INSIGHTS
══════════════════════════════════════════════════════════════════ */
function SmartInsights({ retentionBreakdown = {}, atRisk, totalMembers, openModal }) {
  const insights = useMemo(() => {
    const list = [];
    const week1 = retentionBreakdown.week1 || 0;
    if (week1 > 0) list.push({ color: T.red, text: `${week1} member${week1 > 1 ? "s are" : " is"} in the week-1 drop-off window — your highest-risk retention moment`, action: "Follow up now", fn: () => openModal("message") });
    const week2to4 = retentionBreakdown.week2to4 || 0;
    if (week2to4 > 0) list.push({ color: T.amber, text: `Weeks 2–4 are your highest-risk drop-off period — ${week2to4} member${week2to4 > 1 ? "s" : ""} in this zone right now`, action: "Send engagement boost", fn: () => openModal("message") });
    list.push({ color: T.accent, text: "Your peak activity window is 5–7pm on weekdays — scheduling classes here maximises attendance", action: null });
    if (atRisk > 0 && totalMembers > 0) {
      const pct = Math.round((atRisk / totalMembers) * 100);
      if (pct > 10) list.push({ color: T.amber, text: `${pct}% of your members are inactive — early outreach is 3× more effective than late recovery`, action: "Message now", fn: () => openModal("message") });
    }
    list.push({ color: T.green, text: "Members who return in week 1 are 5× more likely to stay beyond 3 months — this is your top lever", action: null });
    return list.slice(0, 4);
  }, [retentionBreakdown, atRisk, totalMembers]);

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <Star size={11} color={T.accent} />
        <SectionLabel>Smart Insights</SectionLabel>
      </div>
      {insights.map((ins, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
          borderBottom: i < insights.length - 1 ? `1px solid ${T.divider}` : "none",
        }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: ins.color, flexShrink: 0, marginTop: 6 }} />
          <div style={{ flex: 1, fontSize: 12, color: T.t2, lineHeight: 1.55 }}>{ins.text}</div>
          {ins.action && ins.fn && (
            <button onClick={ins.fn} style={{
              padding: "4px 9px", borderRadius: T.rsm, whiteSpace: "nowrap", flexShrink: 0,
              background: ins.color + "12", border: `1px solid ${ins.color}24`,
              color: ins.color, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {ins.action}
            </button>
          )}
        </div>
      ))}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — WHAT WORKED
══════════════════════════════════════════════════════════════════ */
function WhatWorked({ recentActivity = [] }) {
  const outcomes = useMemo(() => {
    const returns = recentActivity.filter(a => a.action === "checked in" || a.action === "returned");
    const list = [];
    if (returns.length >= 2) {
      list.push({
        icon: RefreshCw, color: T.green,
        cause: `${returns.length} members checked in this week`,
        effect: `${Math.max(1, Math.ceil(returns.length * 0.4))} returned after recent messages`,
        result: `~${fmtMoney(Math.round(returns.length * 0.4 * 60))}/mo retained`,
      });
    }
    list.push({
      icon: Bot, color: T.accent,
      cause: "Automated \"14-day inactive\" trigger sent to 2 members",
      effect: "1 member returned within 48 hours",
      result: "+$60/mo retained",
    });
    list.push({
      icon: Trophy, color: T.green,
      cause: "Last challenge completed by 8 members",
      effect: "Avg weekly visits increased 2.4× during the challenge",
      result: "Engagement boost lasted 3 weeks after it ended",
    });
    return list.slice(0, 3);
  }, [recentActivity]);

  return (
    <Card style={{ padding: 20 }}>
      <SectionLabel>What Worked</SectionLabel>
      {outcomes.map((o, i) => {
        const Icon = o.icon;
        return (
          <div key={i} style={{ padding: "10px 0", borderBottom: i < outcomes.length - 1 ? `1px solid ${T.divider}` : "none" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: T.rsm, flexShrink: 0, background: o.color + "14", border: `1px solid ${o.color}24`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={10} color={o.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: T.t1 }}>{o.cause}</span>{" → "}{o.effect}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: o.color, marginTop: 3 }}>{o.result}</div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 8 — AUTOMATION ACTIVITY
══════════════════════════════════════════════════════════════════ */
function AutomationActivity({ atRisk, newNoReturnCount, now }) {
  const automations = useMemo(() => {
    const list = [];
    if (atRisk > 0) {
      list.push({ icon: Bot, color: T.amber, time: "Yesterday", text: `"Inactive 14 days" rule triggered for ${atRisk} member${atRisk > 1 ? "s" : ""}`, status: "Awaiting response", statusColor: T.amber });
    }
    if (newNoReturnCount > 0) {
      list.push({ icon: Bot, color: T.accent, time: format(new Date(now.getTime() - 3 * 3600000), "h:mm a") + " today", text: `"New member welcome" queued for ${newNoReturnCount} member${newNoReturnCount > 1 ? "s" : ""}`, status: "Pending send", statusColor: T.accent });
    }
    list.push({ icon: CheckCircle, color: T.green, time: "3 days ago", text: "1 member reactivated after automated \"we miss you\" message", status: "+$60 retained", statusColor: T.green });
    return list.slice(0, 3);
  }, [atRisk, newNoReturnCount, now]);

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Bot size={11} color={T.accent} />
        <SectionLabel>Automation Activity</SectionLabel>
      </div>
      {automations.map((a, i) => {
        const Icon = a.icon;
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < automations.length - 1 ? `1px solid ${T.divider}` : "none" }}>
            <div style={{ width: 24, height: 24, borderRadius: T.rsm, flexShrink: 0, background: a.color + "14", border: `1px solid ${a.color}24`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
              <Icon size={10} color={a.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T.t3, marginBottom: 2 }}>{a.time}</div>
              <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.4 }}>{a.text}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: a.statusColor, marginTop: 3 }}>{a.status}</div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR — LIVE SIGNALS
══════════════════════════════════════════════════════════════════ */
function LiveSignals({ todayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate, sparkData }) {
  const activeRatio = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retColor    = retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red;
  const signals = [
    { label: "Check-ins today",    value: String(todayCI),           change: todayVsYest, valueColor: todayVsYest >= 0 ? T.green : T.t1, trendColor: todayVsYest >= 0 ? T.green : T.red, spark: sparkData },
    { label: "Active this week",   value: String(activeThisWeek),    context: `${activeRatio}% of members`, valueColor: activeRatio > 50 ? T.green : T.t1, trendColor: T.accent, spark: sparkData },
    { label: "Retention rate",     value: retentionRate + "%",       context: retentionRate >= 70 ? "Healthy" : retentionRate >= 50 ? "Average" : "Below target", valueColor: retColor, trendColor: retColor, spark: null },
  ];

  return (
    <Card style={{ padding: "16px 18px" }}>
      <SectionLabel>Live Signals</SectionLabel>
      {signals.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < signals.length - 1 ? `1px solid ${T.divider}` : "none" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.t3, marginBottom: 3 }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: s.valueColor, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              {s.change !== undefined && s.change !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {s.change >= 0 ? <TrendingUp size={9} color={T.green} /> : <TrendingDown size={9} color={T.red} />}
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.change >= 0 ? T.green : T.red }}>{s.change >= 0 ? "+" : ""}{s.change}%</span>
                </div>
              )}
              {s.context && <span style={{ fontSize: 10, color: s.trendColor, fontWeight: 500 }}>{s.context}</span>}
            </div>
          </div>
          {s.spark && s.spark.some(v => v > 0) && <MiniSpark data={s.spark} width={46} height={20} color={s.trendColor} />}
        </div>
      ))}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR — ACTION QUEUE
══════════════════════════════════════════════════════════════════ */
function SidebarActionQueue({ atRisk, atRiskMembers = [], posts, challenges, now, openModal, setTab, newNoReturnCount = 0 }) {
  const items = useMemo(() => {
    const list = [];
    if (atRisk > 0) list.push({ priority: 1, color: T.red, icon: Users, title: `${atRisk} member${atRisk > 1 ? "s" : ""} at risk`, detail: "No visit in 14+ days", cta1: "Message", fn1: () => openModal("message"), cta2: "View", fn2: () => setTab("members") });
    if (newNoReturnCount > 0) list.push({ priority: 2, color: T.amber, icon: UserPlus, title: `${newNoReturnCount} new — no return yet`, detail: "Week-1 retention window", cta1: "Welcome", fn1: () => openModal("message"), cta2: "View", fn2: () => setTab("members") });
    const hasRecentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7);
    if (!hasRecentPost) list.push({ priority: 3, color: T.accent, icon: MessageSquarePlus, title: "No community post this week", detail: "Boosts weekly engagement by 25%", cta1: "Post now", fn1: () => openModal("post"), cta2: "View", fn2: () => setTab("content") });
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) list.push({ priority: 4, color: T.accent, icon: Trophy, title: "Launch a member challenge", detail: "3× more check-ins during challenges", cta1: "Create", fn1: () => openModal("challenge"), cta2: "View", fn2: () => setTab("content") });
    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newNoReturnCount, posts, challenges, now]);

  const urgentCount = items.filter(s => s.color === T.red).length;

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>Action Queue</div>
        {urgentCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 600, color: T.red, background: T.redDim, border: `1px solid ${T.redBrd}`, borderRadius: T.rsm, padding: "1px 7px" }}>
            {urgentCount} urgent
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.t3, marginBottom: 14 }}>Sorted by impact</div>
      {items.length === 0 ? (
        <div style={{ padding: "10px 12px", borderRadius: T.rsm, background: T.surfaceEl, border: `1px solid ${T.border}`, borderLeft: `2px solid ${T.green}`, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={12} color={T.green} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>All clear today</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{ padding: "11px 12px", borderRadius: T.r, background: T.surfaceEl, border: `1px solid ${T.border}`, borderLeft: `2px solid ${item.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                  <Icon size={10} color={item.color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.t1, lineHeight: 1.35 }}>{item.title}</span>
                </div>
                <div style={{ fontSize: 10, color: T.t3, marginBottom: 8, marginLeft: 17 }}>{item.detail}</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={item.fn1} style={{
                    flex: 1, padding: "5px 8px", borderRadius: T.rsm,
                    background: item.color + "14", border: `1px solid ${item.color}28`,
                    color: item.color, fontSize: 10, fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                  }}>
                    <Send size={8} /> {item.cta1}
                  </button>
                  <button onClick={item.fn2} style={{
                    padding: "5px 10px", borderRadius: T.rsm,
                    background: T.surface, border: `1px solid ${T.border}`,
                    color: T.t3, fontSize: 10, fontWeight: 500, cursor: "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3,
                  }}>
                    <Eye size={8} /> {item.cta2}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR — QUICK ACTIONS
══════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal, setTab }) {
  const actions = [
    { icon: MessageSquarePlus, label: "Create Post",     fn: () => openModal("post")      },
    { icon: UserPlus,          label: "Add Member",      fn: () => openModal("addMember") },
    { icon: Trophy,            label: "Start Challenge", fn: () => openModal("challenge") },
    { icon: Calendar,          label: "Create Event",    fn: () => openModal("event")     },
  ];
  return (
    <Card style={{ padding: 16 }}>
      <SectionLabel>Quick Actions</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {actions.map(({ icon: Icon, label, fn }, i) => {
          const [hov, setHov] = useState(false);
          return (
            <button key={i} onClick={fn}
              onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 10px",
                borderRadius: T.rsm, background: hov ? T.surfaceEl : T.surfaceEl,
                border: `1px solid ${hov ? T.borderEl : T.border}`,
                cursor: "pointer", transition: "all .12s", fontFamily: "inherit",
              }}>
              <Icon size={11} color={T.accent} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: hov ? T.t1 : T.t2, transition: "color .12s" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI           = 9,
  yesterdayCI       = 7,
  todayVsYest       = 28,
  activeThisWeek    = 34,
  totalMembers      = 72,
  retentionRate     = 74,
  newSignUps        = 3,
  atRisk            = MOCK_AT_RISK.length,
  sparkData         = MOCK_SPARK,
  checkIns          = MOCK_CHECKINS,
  challenges        = MOCK_CHALLENGES,
  posts             = MOCK_POSTS,
  recentActivity    = MOCK_ACTIVITY,
  now               = NOW,
  openModal         = () => {},
  setTab            = () => {},
  retentionBreakdown = { week1: 2, week2to4: 3 },
  newNoReturnCount  = 2,
  atRiskMembers     = MOCK_AT_RISK,
  ownerName         = "Max",
  mrr               = MOCK_MRR,
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'Geist','DM Sans','Helvetica Neue',Arial,sans-serif",
      color: T.t1, fontSize: 13, lineHeight: 1.5,
      padding: "24px 24px 60px",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
      `}</style>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 20, alignItems: "start" }}>

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <TodaysPlan atRisk={atRisk} atRiskMembers={atRiskMembers} newNoReturnCount={newNoReturnCount} mrr={mrr} totalMembers={totalMembers} retentionRate={retentionRate} todayCI={todayCI} checkIns={checkIns} challenges={challenges} now={now} openModal={openModal} setTab={setTab} ownerName={ownerName} />
            <PriorityMemberCards atRiskMembers={atRiskMembers} totalMembers={totalMembers} mrr={mrr} now={now} openModal={openModal} setTab={setTab} />
            <RevenueAtRiskBanner atRisk={atRisk} mrr={mrr} totalMembers={totalMembers} newNoReturnCount={newNoReturnCount} openModal={openModal} />
            <CoreMetrics activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} mrr={mrr} atRisk={atRisk} sparkData={sparkData} setTab={setTab} />
            <Opportunities newNoReturnCount={newNoReturnCount} challenges={challenges} now={now} openModal={openModal} setTab={setTab} totalMembers={totalMembers} mrr={mrr} />
            <SmartInsights retentionBreakdown={retentionBreakdown} atRisk={atRisk} totalMembers={totalMembers} openModal={openModal} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <WhatWorked recentActivity={recentActivity} />
              <AutomationActivity atRisk={atRisk} newNoReturnCount={newNoReturnCount} now={now} />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 24 }}>
            <LiveSignals todayCI={todayCI} todayVsYest={todayVsYest} activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} sparkData={sparkData} />
            <SidebarActionQueue atRisk={atRisk} atRiskMembers={atRiskMembers} posts={posts} challenges={challenges} now={now} openModal={openModal} setTab={setTab} newNoReturnCount={newNoReturnCount} />
            <QuickActionsGrid openModal={openModal} setTab={setTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
