/**
 * TabAnalytics — fully dynamic, real data driven
 */
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Zap, Send, BarChart2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
} from "recharts";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg: "#000000", card: "#141416", card2: "#1a1a1f", brd: "#222226", brd2: "#2a2a30",
  t1: "#ffffff", t2: "#8a8a94", t3: "#444450",
  cyan: "#4d7fff", cyanD: "rgba(77,127,255,0.10)", cyanB: "rgba(77,127,255,0.28)",
  red: "#ff4d6d", redD: "rgba(255,77,109,0.09)", redB: "rgba(255,77,109,0.22)",
  amber: "#f59e0b", amberD: "rgba(245,158,11,0.09)", amberB: "rgba(245,158,11,0.22)",
  green: "#22c55e", greenD: "rgba(34,197,94,0.09)", greenB: "rgba(34,197,94,0.22)",
  blue: "#3b82f6", blueD: "rgba(59,130,246,0.09)", blueB: "rgba(59,130,246,0.22)",
};
const FONT = "'DM Sans','Segoe UI',sans-serif";
const tick = { fill: "#444450", fontSize: 9.5, fontFamily: FONT };
const mono = { fontVariantNumeric: "tabular-nums" };

/* ─── HELPERS ────────────────────────────────────────────────── */
const fillCol = p => p >= 75 ? C.cyan : p < 40 ? C.red : C.t2;
const trendCol = t => t > 0 ? C.cyan : t < 0 ? C.red : C.t3;
const riskCol = p => p >= 70 ? C.red : p >= 40 ? C.amber : C.green;

function pct(n, d) { return d > 0 ? Math.round((n / d) * 100) : 0; }
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function weekLabel(date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ─── DATA DERIVATION ────────────────────────────────────────── */
function useAnalytics({
  checkIns = [], allMemberships = [], classes = [], coaches = [],
  challenges = [], polls = [], posts = [], totalMembers = 0,
  membershipPlans = null, classHistory = null,
}) {
  return useMemo(() => {
    const now = Date.now();
    const MS_DAY = 86400000;
    const MS_WEEK = 7 * MS_DAY;

    // ── 1. DYNAMIC REVENUE PER MEMBER ────────────────────────────
    const extractRevenue = () => {
      const prices = [];
      // Scan membershipPlans prop first
      if (membershipPlans?.length) {
        membershipPlans.forEach(plan => {
          const p = parseFloat(plan.price || 0);
          if (p > 0) prices.push(plan.interval === "year" ? p / 12 : p);
        });
      }
      // Scan allMemberships for price fields
      allMemberships.forEach(m => {
        const raw = parseFloat(m.price || m.monthly_fee || m.plan_price || 0);
        if (raw > 0) {
          prices.push(m.interval === "year" || m.billing_cycle === "annual" ? raw / 12 : raw);
        }
      });
      if (!prices.length) return 60; // fallback
      prices.sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      return prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
    };
    const estMonthlyValue = Math.round(extractRevenue());

    // ── Member check-in map ──────────────────────────────────────
    const ciByUser = {};
    checkIns.forEach(c => {
      const uid = c.user_id;
      if (!uid) return;
      if (!ciByUser[uid]) ciByUser[uid] = [];
      ciByUser[uid].push(new Date(c.check_in_date || c.created_date).getTime());
    });

    // ── Member join dates ────────────────────────────────────────
    const joinMap = {};
    allMemberships.forEach(m => {
      if (m.user_id && m.join_date) joinMap[m.user_id] = new Date(m.join_date).getTime();
    });

    // ── Week 1 return rate ───────────────────────────────────────
    const w1Eligible = allMemberships.filter(m => {
      const jt = joinMap[m.user_id];
      return jt && (now - jt) > MS_WEEK;
    });
    const w1Returned = w1Eligible.filter(m => {
      const jt = joinMap[m.user_id];
      const cis = ciByUser[m.user_id] || [];
      return cis.some(t => t > jt && t <= jt + MS_WEEK);
    });
    const week1ReturnRate = pct(w1Returned.length, w1Eligible.length);

    // ── 8. W1 Return Rate real trend (30d vs prior 30d) ─────────
    const MS30 = 30 * MS_DAY;
    const w1Recent = allMemberships.filter(m => {
      const jt = joinMap[m.user_id];
      return jt && (now - jt) > MS_WEEK && (now - jt) <= MS30 + MS_WEEK;
    });
    const w1Prior = allMemberships.filter(m => {
      const jt = joinMap[m.user_id];
      return jt && (now - jt) > MS30 + MS_WEEK && (now - jt) <= 2 * MS30 + MS_WEEK;
    });
    const w1RecentReturned = w1Recent.filter(m => {
      const jt = joinMap[m.user_id];
      return (ciByUser[m.user_id] || []).some(t => t > jt && t <= jt + MS_WEEK);
    });
    const w1PriorReturned = w1Prior.filter(m => {
      const jt = joinMap[m.user_id];
      return (ciByUser[m.user_id] || []).some(t => t > jt && t <= jt + MS_WEEK);
    });
    const w1RecentRate = pct(w1RecentReturned.length, Math.max(w1Recent.length, 1));
    const w1PriorRate = pct(w1PriorReturned.length, Math.max(w1Prior.length, 1));
    const week1ReturnTrend = w1Prior.length > 0 ? w1RecentRate - w1PriorRate : 0;

    // ── Month 3 retention ────────────────────────────────────────
    const m3Eligible = allMemberships.filter(m => {
      const jt = joinMap[m.user_id];
      return jt && (now - jt) > 90 * MS_DAY;
    });
    const m3Active = m3Eligible.filter(m => {
      const cis = ciByUser[m.user_id] || [];
      const start = (joinMap[m.user_id] || 0) + 75 * MS_DAY;
      const end = (joinMap[m.user_id] || 0) + 105 * MS_DAY;
      return cis.some(t => t >= start && t <= end);
    });
    const month3Rate = pct(m3Active.length, m3Eligible.length);

    // Month 1 funnel
    const m1Eligible = allMemberships.filter(m => {
      const jt = joinMap[m.user_id];
      return jt && (now - jt) > 30 * MS_DAY;
    });
    const m1Active = m1Eligible.filter(m => {
      const cis = ciByUser[m.user_id] || [];
      const jt = joinMap[m.user_id] || 0;
      return cis.some(t => t >= jt + 20 * MS_DAY && t <= jt + 45 * MS_DAY);
    });
    const funnelM1 = pct(m1Active.length, m1Eligible.length);

    // ── 2. COMPOSITE CHURN SCORE for at-risk members ─────────────
    const calcChurnScore = (m) => {
      const cis = (ciByUser[m.user_id] || []).sort((a, b) => a - b);
      const days = m.daysSinceLastCheckIn;

      // Recency (35pts): 0–35 based on days, capped at 60
      const recency = Math.min(35, (Math.min(days, 60) / 60) * 35);

      // Frequency drop (35pts): last 30d vs lifetime avg
      const MS30 = 30 * MS_DAY;
      const last30 = cis.filter(t => t >= now - MS30).length;
      const lifetimeWeeks = cis.length > 0 ? Math.max(1, (now - cis[0]) / MS_WEEK) : 1;
      const lifetimeAvgPer30 = (cis.length / lifetimeWeeks) * 4.33;
      let freqDrop = 0;
      if (lifetimeAvgPer30 > 0) {
        const dropRatio = Math.max(0, (lifetimeAvgPer30 - last30) / lifetimeAvgPer30);
        freqDrop = Math.min(35, dropRatio * 35);
        if (dropRatio >= 0.5) freqDrop = 35; // full score at 50%+ drop
      } else {
        freqDrop = 17; // no history — moderate
      }

      // Tenure risk (15pts): new members (<90d) going inactive = higher risk
      const tenureMs = joinMap[m.user_id] ? now - joinMap[m.user_id] : MS30 * 12;
      const tenure = tenureMs < 90 * MS_DAY ? 15 : tenureMs < 180 * MS_DAY ? 8 : 0;

      // Streak break (15pts): had 3+ consecutive active weeks, now broken
      let streakBreak = 0;
      if (cis.length >= 3) {
        // Check prior 12 weeks for 3+ consecutive weeks with check-ins
        let maxStreak = 0, streak = 0;
        for (let w = 11; w >= 1; w--) {
          const wStart = now - w * MS_WEEK;
          const wEnd = wStart + MS_WEEK;
          const hadCI = cis.some(t => t >= wStart && t < wEnd);
          if (hadCI) streak++;
          else { maxStreak = Math.max(maxStreak, streak); streak = 0; }
        }
        maxStreak = Math.max(maxStreak, streak);
        // Last week no check-in + had prior streak
        const lastWeekCI = cis.some(t => t >= now - MS_WEEK);
        if (maxStreak >= 3 && !lastWeekCI) streakBreak = 15;
      }

      return Math.round(recency + freqDrop + tenure + streakBreak);
    };

    const atRiskMembers = allMemberships.map(m => {
      const cis = ciByUser[m.user_id] || [];
      const last = cis.length ? Math.max(...cis) : null;
      const daysSince = last ? Math.floor((now - last) / MS_DAY) : 999;
      return { ...m, daysSinceLastCheckIn: daysSince };
    }).filter(m => m.daysSinceLastCheckIn >= 14)
      .map(m => ({ ...m, riskScore: calcChurnScore(m) }))
      .sort((a, b) => b.riskScore - a.riskScore);

    // ── Avg visits per member last 7 days ────────────────────────
    const weekAgo = now - MS_WEEK;
    const totalCiThisWeek = checkIns.filter(c => new Date(c.check_in_date || c.created_date).getTime() > weekAgo).length;
    const memberCount = Math.max(totalMembers || allMemberships.length, 1);
    const avgVisitsPerWeek = (totalCiThisWeek / memberCount).toFixed(1);

    // ── 7. SMOOTHED week-over-week KPI trend ─────────────────────
    const ciCount = (weeksBack, numWeeks = 1) => {
      const end = now - weeksBack * MS_WEEK;
      const start = end - numWeeks * MS_WEEK;
      return checkIns.filter(c => {
        const t = new Date(c.check_in_date || c.created_date).getTime();
        return t >= start && t < end;
      }).length;
    };
    // 3-week rolling average: weeks 0-2 (current) vs weeks 3-5 (prior)
    const smoothedCurrent = (ciCount(0) + ciCount(1) + ciCount(2)) / 3;
    const smoothedPrior   = (ciCount(3) + ciCount(4) + ciCount(5)) / 3;
    const weekChangePct = smoothedPrior > 0 ? Math.round(((smoothedCurrent - smoothedPrior) / smoothedPrior) * 100) : 0;
    const totalWindowCIs = ciCount(0, 6);
    const trendConfidence = totalWindowCIs < 15 ? "low" : totalWindowCIs > 50 ? "high" : "medium";

    // ── 4. GYM-ADAPTIVE SEGMENT THRESHOLDS ───────────────────────
    const monthAgo = now - 30 * MS_DAY;
    const memberVisitCounts = allMemberships.map(m =>
      (ciByUser[m.user_id] || []).filter(t => t > monthAgo).length
    ).filter(n => n > 0);

    let threshSuperActive = 15, threshConsistent = 8, threshSlipping = 3;
    if (memberVisitCounts.length >= 5) {
      const sorted = [...memberVisitCounts].sort((a, b) => a - b);
      const medianVisits = sorted[Math.floor(sorted.length / 2)];
      if (medianVisits > 0) {
        threshSuperActive = Math.round(medianVisits * 2);
        threshConsistent  = medianVisits;
        threshSlipping    = Math.max(1, Math.round(medianVisits * 0.3));
      }
    }

    const segments = { superActive: 0, consistent: 0, slipping: 0, atRisk: 0 };
    allMemberships.forEach(m => {
      const count = (ciByUser[m.user_id] || []).filter(t => t > monthAgo).length;
      if (count >= threshSuperActive) segments.superActive++;
      else if (count >= threshConsistent) segments.consistent++;
      else if (count >= threshSlipping) segments.slipping++;
      else segments.atRisk++;
    });
    const totalSeg = allMemberships.length || 1;
    const segmentsData = [
      { label: "Super Active", sub: `${threshSuperActive}+ visits/mo`, val: segments.superActive, pct: pct(segments.superActive, totalSeg), col: C.cyan },
      { label: "Consistent",   sub: `${threshConsistent}–${threshSuperActive - 1} visits`,  val: segments.consistent,  pct: pct(segments.consistent, totalSeg),  col: C.blue },
      { label: "Slipping",     sub: `${threshSlipping}–${threshConsistent - 1} visits`,     val: segments.slipping,    pct: pct(segments.slipping, totalSeg),    col: C.amber },
      { label: "At Risk",      sub: `0–${threshSlipping - 1} visits`,                       val: segments.atRisk,      pct: pct(segments.atRisk, totalSeg),      col: C.red },
    ];

    // ── Segment trends — last 4 months (adaptive thresholds) ─────
    const segmentTrend = Array.from({ length: 4 }, (_, i) => {
      const mEnd   = now - i * 30 * MS_DAY;
      const mStart = mEnd - 30 * MS_DAY;
      const label  = new Date(mStart).toLocaleDateString("en-GB", { month: "short" });
      const counts = { super: 0, cons: 0, slip: 0, risk: 0 };
      allMemberships.forEach(m => {
        const n = (ciByUser[m.user_id] || []).filter(t => t >= mStart && t < mEnd).length;
        if (n >= threshSuperActive) counts.super++;
        else if (n >= threshConsistent) counts.cons++;
        else if (n >= threshSlipping) counts.slip++;
        else counts.risk++;
      });
      return { m: label, ...counts };
    }).reverse();

    // ── Weekly visit trend — last 12 weeks ───────────────────────
    const visitTrend = Array.from({ length: 12 }, (_, i) => {
      const wEnd   = now - i * MS_WEEK;
      const wStart = wEnd - MS_WEEK;
      const wCis   = checkIns.filter(c => {
        const t = new Date(c.check_in_date || c.created_date).getTime();
        return t >= wStart && t < wEnd;
      });
      const total = wCis.length;
      const avgV  = memberCount > 0 ? parseFloat((total / memberCount).toFixed(2)) : 0;
      return { w: weekLabel(new Date(wStart)), total, avg: avgV };
    }).reverse();

    // ── 5. PEAK HOURS + PEAK DAY OF WEEK ─────────────────────────
    const hourBuckets = {};
    const dayBuckets = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    checkIns.forEach(c => {
      const d = new Date(c.check_in_date || c.created_date);
      const h = d.getHours();
      const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      hourBuckets[label] = (hourBuckets[label] || 0) + 1;
      const dayName = DAY_NAMES[d.getDay()];
      if (dayName !== "Sun") dayBuckets[dayName] = (dayBuckets[dayName] || 0) + 1;
      else dayBuckets["Sun"] = (dayBuckets["Sun"] || 0) + 1;
    });
    const hoursData = Object.entries(hourBuckets)
      .map(([h, v]) => ({ h, v }))
      .sort((a, b) => {
        const toMins = s => {
          const isPm = s.includes("pm");
          let h = parseInt(s);
          if (isPm && h !== 12) h += 12;
          if (!isPm && h === 12) h = 0;
          return h * 60;
        };
        return toMins(a.h) - toMins(b.h);
      });
    // peakDayData: Mon–Sun order
    const peakDayData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => ({ d, v: dayBuckets[d] || 0 }));
    const peakDay = peakDayData.reduce((best, cur) => cur.v > best.v ? cur : best, { d: "—", v: 0 }).d;

    // ── 3. RETENTION OVER TIME — true join-month cohorts ─────────
    const joined = allMemberships.length;
    const funnelM3 = month3Rate;

    // Build cohort key: "YYYY-MM"
    const cohortMap = {};
    allMemberships.forEach(m => {
      const jt = joinMap[m.user_id];
      if (!jt) return;
      const d = new Date(jt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!cohortMap[key]) cohortMap[key] = [];
      cohortMap[key].push(m);
    });

    // Last 6 calendar months
    const retentionOverTime = Array.from({ length: 6 }, (_, i) => {
      const refDate = new Date(now);
      refDate.setDate(1);
      refDate.setMonth(refDate.getMonth() - (5 - i));
      const key = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}`;
      const label = refDate.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      const cohort = cohortMap[key] || [];
      if (!cohort.length) return { m: label, w1: null, m1: null, m3: null };

      const cohortJoinStart = refDate.getTime();
      const cohortJoinEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1).getTime();
      const msElapsed = now - cohortJoinStart;

      const cW1 = cohort.filter(m => {
        const jt = joinMap[m.user_id];
        return (ciByUser[m.user_id] || []).some(t => t > jt && t <= jt + MS_WEEK);
      });
      // M1: only if ≥30 days have elapsed since cohort joined
      const m1Rate = msElapsed >= 30 * MS_DAY
        ? pct(cohort.filter(m => {
            const jt = joinMap[m.user_id];
            return (ciByUser[m.user_id] || []).some(t => t >= jt + 20 * MS_DAY && t <= jt + 45 * MS_DAY);
          }).length, cohort.length)
        : null;
      // M3: only if ≥90 days have elapsed
      const m3Rate = msElapsed >= 90 * MS_DAY
        ? pct(cohort.filter(m => {
            const jt = joinMap[m.user_id];
            return (ciByUser[m.user_id] || []).some(t => t >= jt + 75 * MS_DAY && t <= jt + 105 * MS_DAY);
          }).length, cohort.length)
        : null;

      return { m: label, w1: pct(cW1.length, cohort.length), m1: m1Rate, m3: m3Rate };
    });

    // ── 6. CLASS PERFORMANCE with real trend ─────────────────────
    const classData = classes.map(cls => {
      const capacity = cls.max_capacity || 0;
      const sessions = (cls.schedule || []).length || 1;
      const booked = cls.booked ?? cls.attendees ?? 0;
      const fillRate = capacity > 0 ? pct(booked, capacity) : 0;

      let trend = 0;
      if (classHistory?.length) {
        // Use snapshot data if available
        const snapshots = classHistory
          .filter(h => h.class_id === cls.id && h.capacity > 0)
          .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
        if (snapshots.length >= 2) {
          const recent = snapshots[0];
          const MS4W = 28 * MS_DAY;
          const prior = snapshots.find(h => new Date(recent.recorded_at) - new Date(h.recorded_at) >= MS4W);
          if (prior && prior.capacity > 0) {
            const recentFill = pct(recent.booked, recent.capacity);
            const priorFill  = pct(prior.booked, prior.capacity);
            trend = recentFill - priorFill;
          }
        }
      } else {
        // Infer from checkIns: class-attributed CIs last 2 weeks vs prior 2 weeks
        const name = (cls.name || "").toLowerCase();
        const classCI = checkIns.filter(c =>
          c.class_name?.toLowerCase().includes(name) || c.class_id === cls.id
        );
        const MS2W = 14 * MS_DAY;
        const recent2w = classCI.filter(c => new Date(c.check_in_date || c.created_date).getTime() >= now - MS2W).length;
        const prior2w  = classCI.filter(c => {
          const t = new Date(c.check_in_date || c.created_date).getTime();
          return t >= now - 2 * MS2W && t < now - MS2W;
        }).length;
        if (capacity > 0 && (recent2w > 0 || prior2w > 0)) {
          const recentFill = pct(recent2w, capacity);
          const priorFill  = pct(prior2w, capacity);
          trend = recentFill - priorFill;
        }
      }

      return { name: cls.name, sessions, fill: fillRate, trend, capacity, booked };
    }).sort((a, b) => b.fill - a.fill);

    // ── Engagement radar ─────────────────────────────────────────
    const activeUsers = new Set(checkIns.filter(c => new Date(c.check_in_date || c.created_date).getTime() > monthAgo).map(c => c.user_id)).size;
    const challengeParticipants = challenges.reduce((s, ch) => s + (ch.participants || []).length, 0);
    const communityPostUsers = new Set(posts.filter(p => !p.is_hidden && !p.is_draft).map(p => p.member_id)).size;
    const pollVoters = polls.reduce((s, p) => s + (p.voters || []).length, 0);
    const classParticipants = classes.reduce((s, cls) => s + (cls.booked ?? cls.attendees ?? 0), 0);
    const engMemberBase = Math.max(totalSeg, 1);
    const activePct = pct(activeUsers, engMemberBase);
    const engagementData = [
      { subject: "Check-ins",  A: activePct },
      { subject: "Classes",    A: pct(classParticipants, engMemberBase) },
      { subject: "Challenges", A: pct(challengeParticipants, engMemberBase) },
      { subject: "Community",  A: pct(communityPostUsers, engMemberBase) },
      { subject: "Polls",      A: pct(pollVoters, engMemberBase) },
    ];

    // ── 10. GYM HEALTH SCORE ─────────────────────────────────────
    const retentionScore = Math.min(30, ((week1ReturnRate / 100) * 10 + (funnelM1 / 100) * 10 + (month3Rate / 100) * 10));
    const engagementScore = Math.min(25, (avg(engagementData.map(d => d.A)) / 100) * 25);
    const activityScore = Math.min(25, (activePct / 100) * 25);
    const riskScore30 = Math.max(0, 20 - (atRiskMembers.length / Math.max(totalSeg, 1)) * 20);
    const gymHealthScore = Math.round(retentionScore + engagementScore + activityScore + riskScore30);
    const gymHealthLabel = gymHealthScore >= 80 ? "Excellent" : gymHealthScore >= 60 ? "Good" : gymHealthScore >= 40 ? "Needs Work" : "Critical";

    // ── 9. RANKED SIGNAL INSIGHTS ────────────────────────────────
    const signals = [];
    // Generate all signals with impact scores
    const pushSignal = (impact, category, isPositive, icon, color, bgD, brdD, tag, title, body) => {
      signals.push({ impact, category, isPositive, icon, color, bg: bgD, brd: brdD, tag, title, body });
    };

    // Retention signals
    if (week1ReturnRate >= 65) {
      pushSignal(w1Eligible.length * 1.5, "retention", true, TrendingUp, C.cyan, C.cyanD, C.cyanB,
        "Positive signal", `${week1ReturnRate}% of new members return in Week 1`,
        `Members who check in within their first 7 days show strong early habit formation. Keep nurturing them through week 2–4.`);
    } else {
      pushSignal((100 - week1ReturnRate) * w1Eligible.length, "retention", false, AlertTriangle, C.amber, C.amberD, C.amberB,
        "Needs attention", `Week 1 return rate is only ${week1ReturnRate}%`,
        `${100 - week1ReturnRate}% of new members don't return after their first visit. A welcome message on days 3–5 could improve this significantly.`);
    }
    if (month3Rate >= 50) {
      pushSignal(m3Eligible.length * 1.2, "retention", true, TrendingUp, C.green, C.greenD, C.greenB,
        "Positive signal", `Strong long-term retention — ${month3Rate}% reach Month 3`,
        `Over half your members are still active three months after joining. This is above industry average and signals strong community health.`);
    } else if (m3Eligible.length > 0) {
      pushSignal((50 - month3Rate) * m3Eligible.length, "retention", false, AlertTriangle, C.amber, C.amberD, C.amberB,
        "Drop-off point", `Only ${month3Rate}% retention at Month 3`,
        `${m3Eligible.length - m3Active.length} members dropped off by month 3. Structured check-in programmes or milestone rewards in months 2–3 can reverse this.`);
    }

    // At-risk signal
    if (atRiskMembers.length > 0) {
      pushSignal(atRiskMembers.length * estMonthlyValue, "retention", false, AlertTriangle, C.red, C.redD, C.redB,
        "Churn risk", `${atRiskMembers.length} members inactive 14+ days`,
        `~£${atRiskMembers.length * estMonthlyValue}/mo at risk. These members are in the critical churn window — targeted outreach now recovers ~1 in 3.`);
    }

    // Engagement signals
    if (segments.slipping > 0) {
      pushSignal(segments.slipping * estMonthlyValue * 0.5, "engagement", false, Zap, C.blue, C.blueD, C.blueB,
        "Opportunity", `${segments.slipping} members slipping toward At Risk`,
        `Re-engage with a challenge invite or personal message before they drop below ${threshSlipping} visits/mo.`);
    }
    if (activePct >= 60) {
      pushSignal(activeUsers, "engagement", true, TrendingUp, C.green, C.greenD, C.greenB,
        "Positive signal", `${activePct}% of members active in the last 30 days`,
        `Strong engagement — ${activeUsers} members checked in recently. This signals a healthy, active community.`);
    }
    const avgEngScore = Math.round(avg(engagementData.map(d => d.A)));
    if (avgEngScore < 30) {
      pushSignal(totalSeg * 20, "engagement", false, BarChart2, C.amber, C.amberD, C.amberB,
        "Engagement gap", `Community engagement averaging only ${avgEngScore}%`,
        `Low participation across challenges, polls, and classes. A single coordinated campaign can lift all three metrics simultaneously.`);
    }

    // Segment signals
    if (segments.superActive > 0) {
      pushSignal(segments.superActive * 2, "engagement", true, TrendingUp, C.cyan, C.cyanD, C.cyanB,
        "Positive signal", `${segments.superActive} super-active members forming your backbone`,
        `${segments.superActive} members exceed ${threshSuperActive} visits/mo. Celebrate them publicly — they drive referrals and culture.`);
    }

    // Sort by impact descending
    signals.sort((a, b) => b.impact - a.impact);

    // Pick top 3 across different categories; ensure at most 2 negatives if any positives exist
    const chosen = [];
    const usedCategories = new Set();
    const hasPositiveSignal = signals.some(s => s.isPositive);
    let positiveIncluded = false;

    for (const sig of signals) {
      if (chosen.length >= 3) break;
      if (usedCategories.has(sig.category + sig.isPositive)) continue; // avoid same cat+polarity twice
      if (chosen.length === 2 && !positiveIncluded && hasPositiveSignal && !sig.isPositive) continue;
      chosen.push(sig);
      usedCategories.add(sig.category + sig.isPositive);
      if (sig.isPositive) positiveIncluded = true;
    }
    // Fallback if < 3 chosen
    if (chosen.length < 3) {
      for (const sig of signals) {
        if (chosen.length >= 3) break;
        if (!chosen.includes(sig)) chosen.push(sig);
      }
    }
    const insights = chosen.slice(0, 3);

    return {
      estMonthlyValue,
      week1ReturnRate,
      week1ReturnTrend,
      month3Rate,
      atRiskMembers,
      atRiskCount: atRiskMembers.length,
      avgVisitsPerWeek,
      totalCiThisWeek,
      weekChangePct,
      trendConfidence,
      segmentsData,
      segmentTrend,
      visitTrend,
      hoursData,
      peakDayData,
      peakDay,
      funnelJoined: joined,
      funnelW1Pct: pct(w1Returned.length, w1Eligible.length),
      funnelW1Count: w1Returned.length,
      funnelM1Pct: funnelM1,
      funnelM1Count: m1Active.length,
      funnelM3Pct: funnelM3,
      funnelM3Count: m3Active.length,
      retentionOverTime,
      classData,
      engagementData,
      insights,
      challengePct: pct(challengeParticipants, engMemberBase),
      pollPct: pct(pollVoters, engMemberBase),
      classFillPct: classData.length > 0 ? Math.round(avg(classData.map(c => c.fill))) : 0,
      activePct,
      gymHealthScore,
      gymHealthLabel,
    };
  }, [checkIns, allMemberships, classes, challenges, polls, posts, totalMembers, membershipPlans, classHistory]);
}

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
    <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 9.5, fontWeight: 700, color, background: color + "15", border: `1px solid ${color}33`, display: "inline-block" }}>{children}</span>
  );
}
function LineTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a0e18", border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, fontFamily: FONT }}>
      <div style={{ color: C.t3, marginBottom: 3, fontSize: 9.5 }}>{label}</div>
      {payload.map((p, i) => p.value != null && (
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

/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — KPI STRIP
═══════════════════════════════════════════════════════════════ */
function KpiStrip({ isMobile, data }) {
  const { week1ReturnRate, week1ReturnTrend, month3Rate, atRiskCount, avgVisitsPerWeek, weekChangePct } = data;
  const kpis = [
    { label: "Week 1 Return",    value: `${week1ReturnRate}%`, trend: week1ReturnTrend, sub: "of new members return in 7d", accent: C.cyan },
    { label: "Month 3 Retained", value: `${month3Rate}%`,      trend: 0, sub: "long-term cohort health",     accent: C.cyan },
    { label: "At Risk",          value: `${atRiskCount}`,       trend: atRiskCount > 0 ? -1 : 1, sub: `inactive 14+ days`, accent: C.red, trendInvert: true },
    { label: "Avg Visits / Week",value: avgVisitsPerWeek,       trend: weekChangePct, sub: "per member this week",  accent: C.blue },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 9 }}>
      {kpis.map((k, i) => {
        const up = k.trendInvert ? k.trend < 0 : k.trend > 0;
        const tCol = up ? C.cyan : C.red;
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: isMobile ? "11px 12px" : "13px 14px" }}>
            <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 7, ...mono }}>{k.value}</div>
            {k.trend !== 0 && (
              <div style={{ fontSize: 10.5, color: tCol, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                {up ? <ArrowUpRight style={{ width: 10, height: 10 }}/> : <ArrowDownRight style={{ width: 10, height: 10 }}/>}
                {k.trend > 0 ? "+" : ""}{k.trend}% vs last week
              </div>
            )}
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
function RetentionFunnelSection({ isMobile, data }) {
  const { funnelJoined, funnelW1Pct, funnelW1Count, funnelM1Pct, funnelM1Count, funnelM3Pct, funnelM3Count, retentionOverTime, month3Rate } = data;
  const biggestDropPct = Math.max(100 - funnelW1Pct, funnelW1Pct - funnelM1Pct, funnelM1Pct - funnelM3Pct);
  const biggestDropStage = (100 - funnelW1Pct) >= Math.max(funnelW1Pct - funnelM1Pct, funnelM1Pct - funnelM3Pct) ? "Week 1" : (funnelW1Pct - funnelM1Pct) >= (funnelM1Pct - funnelM3Pct) ? "Month 1" : "Month 3";

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, alignItems: "stretch" }}>
      <Card style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 5 }}>
          <SLabel sub="Member journey from join day to long-term retention">Retention Funnel</SLabel>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 1 }}>Reach month 3</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em", lineHeight: 1, ...mono }}>{funnelM3Pct}%</div>
          </div>
        </div>
        <svg viewBox="0 0 460 131" width="100%" style={{ display: "block" }} role="img" aria-label="Retention funnel">
          <polygon points="65,6 395,6 368,35 92,35"    fill={C.cyan} fillOpacity={0.82}/>
          <polygon points={`92,35 368,35 ${368 - (100 - funnelW1Pct) * 1.3},64 ${92 + (100 - funnelW1Pct) * 1.3},64`} fill={C.cyan} fillOpacity={0.56}/>
          <polygon points={`${92 + (100 - funnelW1Pct) * 1.3},64 ${368 - (100 - funnelW1Pct) * 1.3},64 ${368 - (100 - funnelM1Pct) * 1.5},93 ${92 + (100 - funnelM1Pct) * 1.5},93`} fill={C.cyan} fillOpacity={0.35}/>
          <polygon points={`${92 + (100 - funnelM1Pct) * 1.5},93 ${368 - (100 - funnelM1Pct) * 1.5},93 ${368 - (100 - funnelM3Pct) * 1.5},122 ${92 + (100 - funnelM3Pct) * 1.5},122`} fill={C.cyan} fillOpacity={0.20}/>
          <line x1="92" y1="35" x2="368" y2="35" stroke={C.bg} strokeWidth="2"/>
          <line x1="113" y1="64" x2="347" y2="64" stroke={C.bg} strokeWidth="2"/>
          <line x1="134" y1="93" x2="326" y2="93" stroke={C.bg} strokeWidth="2"/>
          <text x="57" y="18"  textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="700" fill={C.t1}>Joined</text>
          <text x="57" y="48"  textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="600" fill={C.t2}>Week 1</text>
          <text x="57" y="77"  textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="600" fill={C.t2}>Month 1</text>
          <text x="57" y="109" textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="600" fill={C.t2}>Month 3</text>
          <text x="230" y="18"  textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">{funnelJoined}</text>
          <text x="230" y="27"  textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">100%</text>
          <text x="230" y="47"  textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">{funnelW1Count}</text>
          <text x="230" y="56"  textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">{funnelW1Pct}% · {funnelJoined - funnelW1Count} lost</text>
          <text x="230" y="77"  textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">{funnelM1Count}</text>
          <text x="230" y="86"  textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">{funnelM1Pct}%</text>
          <text x="230" y="106" textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#fff">{funnelM3Count}</text>
          <text x="230" y="115" textAnchor="middle" fontFamily={FONT} fontSize="8.5" fill="rgba(255,255,255,0.6)">{funnelM3Pct}%</text>
          <line x1="368" y1="35" x2="398" y2="35" stroke={C.amber} strokeWidth="1.5"/>
          <circle cx="398" cy="35" r="2.5" fill={C.amber}/>
          <text x="404" y="33" fontFamily={FONT} fontSize="10" fontWeight="700" fill={C.amber}>−{100 - funnelW1Pct}%</text>
          <text x="404" y="43" fontFamily={FONT} fontSize="8" fill={C.amber}>{biggestDropStage === "Week 1" ? "biggest drop" : "drop"}</text>
        </svg>
        <div style={{ marginTop: 9, padding: "8px 10px", borderRadius: 7, background: C.amberD, border: `1px solid ${C.amberB}` }}>
          <div style={{ fontSize: 10.5, color: C.amber, fontWeight: 700, marginBottom: 2 }}>
            Biggest opportunity — {biggestDropStage} drop-off
          </div>
          <div style={{ fontSize: 10, color: C.t2, lineHeight: 1.5 }}>
            {biggestDropPct}% loss at this stage. A targeted follow-up sequence can help close this gap.
          </div>
        </div>
      </Card>
      <Card style={{ padding: "13px 14px", display: "flex", flexDirection: "column" }}>
        <SLabel right="6 months" sub="How each cohort milestone has changed month-on-month">Retention Rate Trends</SLabel>
        <div style={{ flex: 1, minHeight: isMobile ? 160 : 0 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : "100%"}>
            <LineChart data={retentionOverTime} margin={{ top: 4, right: 6, bottom: 0, left: -28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="m" tick={tick} axisLine={false} tickLine={false}/>
              <YAxis tick={tick} axisLine={false} tickLine={false} domain={[0, 100]}/>
              <Tooltip content={<LineTip/>}/>
              <Line type="monotone" dataKey="w1" name="Week 1"  stroke={C.cyan}        strokeWidth={2} dot={false} connectNulls activeDot={{ r: 3, fill: C.cyan,  stroke: C.card, strokeWidth: 2 }}/>
              <Line type="monotone" dataKey="m1" name="Month 1" stroke={C.blue}        strokeWidth={2} dot={false} connectNulls activeDot={{ r: 3, fill: C.blue,  stroke: C.card, strokeWidth: 2 }}/>
              <Line type="monotone" dataKey="m3" name="Month 3" stroke={C.cyan + "77"} strokeWidth={2} dot={false} connectNulls activeDot={{ r: 3, fill: C.cyan,  stroke: C.card, strokeWidth: 2 }} strokeDasharray="4 3"/>
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
function KeyInsights({ isMobile, data }) {
  const { insights } = data;
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
      {insights.map((ins, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.brd}`, borderLeft: `2px solid ${ins.color}`, borderRadius: 10, padding: "13px 14px" }}>
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
function MemberSegmentsSection({ isMobile, data }) {
  const { segmentsData, segmentTrend } = data;
  const slippingEntry = segmentsData.find(s => s.label === "Slipping");
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
      <Card>
        <SLabel sub="Who your members are right now based on last 30 days activity">Member Segments</SLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {segmentsData.map((s, i) => (
            <div key={i} style={{ padding: "9px 0", borderBottom: i < segmentsData.length - 1 ? `1px solid ${C.brd}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.col, flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{s.label}</span>
                  <span style={{ fontSize: 9.5, color: C.t3 }}>{s.sub}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, width: 22, textAlign: "right", ...mono }}>{s.val}</span>
                  <span style={{ fontSize: 10, color: C.t3, width: 30, textAlign: "right", ...mono }}>{s.pct}%</span>
                </div>
              </div>
              <div style={{ height: 3, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", background: s.col, borderRadius: 2, opacity: 0.75 }}/>
              </div>
            </div>
          ))}
        </div>
        {slippingEntry && slippingEntry.val > 0 && (
          <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: C.amberD, border: `1px solid ${C.amberB}` }}>
            <div style={{ fontSize: 10.5, color: C.amber, fontWeight: 600, marginBottom: 2 }}>{slippingEntry.val} members in the Slipping segment</div>
            <div style={{ fontSize: 10, color: C.t2, lineHeight: 1.5 }}>A targeted re-engagement campaign now prevents them becoming At Risk.</div>
          </div>
        )}
      </Card>
      <Card>
        <SLabel sub="How each segment has changed month by month" right="4 months">Segment Trends</SLabel>
        <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
          <LineChart data={segmentTrend} margin={{ top: 4, right: 6, bottom: 0, left: -28 }}>
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
function VisitTrendsSection({ isMobile, data }) {
  const { visitTrend, hoursData, peakDay, totalCiThisWeek, avgVisitsPerWeek, weekChangePct } = data;
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 12 }}>
      <Card>
        <SLabel sub="Weekly check-ins (bars) and average visits per member (line)" right="12 weeks">Visit Habits</SLabel>
        <div style={{ display: "flex", flexWrap: isMobile ? "wrap" : "nowrap", gap: 18, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1, ...mono }}>{totalCiThisWeek}</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>check-ins this week</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1, ...mono }}>{avgVisitsPerWeek}</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>avg visits/member/wk</div>
          </div>
          {weekChangePct !== 0 && (
            <div style={{ marginLeft: isMobile ? 0 : "auto", textAlign: isMobile ? "left" : "right" }}>
              <div style={{ fontSize: 10.5, color: weekChangePct >= 0 ? C.cyan : C.red, fontWeight: 600 }}>
                {weekChangePct >= 0 ? "↑" : "↓"} {weekChangePct >= 0 ? "+" : ""}{weekChangePct}% vs last week
              </div>
              <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>week-over-week trend</div>
            </div>
          )}
        </div>
        <div style={{ width: "100%", overflow: "hidden" }}>
          <ResponsiveContainer width="100%" height={isMobile ? 110 : 140}>
            <ComposedChart data={visitTrend} margin={{ top: 4, right: 28, bottom: 0, left: -26 }}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.cyan} stopOpacity={0.25}/>
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="w" tick={tick} axisLine={false} tickLine={false} interval={2}/>
              <YAxis yAxisId="left"  tick={tick} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="right" tick={tick} axisLine={false} tickLine={false} orientation="right"/>
              <Tooltip content={<ChartTip/>}/>
              <Bar  yAxisId="left"  dataKey="total" name="Check-ins"  fill={C.cyan + "30"} radius={[2,2,0,0]} barSize={12}/>
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
        {hoursData.length === 0 ? (
          <div style={{ fontSize: 12, color: C.t3, textAlign: "center", padding: "24px 0" }}>No check-in time data available</div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {hoursData.map((d, i) => {
                const max = Math.max(...hoursData.map(x => x.v));
                const isPeak = d.v === max;
                const p = (d.v / max) * 100;
                const barCol = isPeak ? C.cyan : p > 60 ? C.cyan + "99" : p > 30 ? C.cyan + "55" : C.cyan + "25";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 10, color: isPeak ? C.t1 : C.t2, width: 30, flexShrink: 0, fontWeight: isPeak ? 700 : 400 }}>{d.h}</span>
                    <div style={{ flex: 1, height: 16, background: C.brd, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div style={{ width: `${p}%`, height: "100%", background: barCol, borderRadius: 3 }}/>
                      {isPeak && <span style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: "#fff", fontWeight: 700 }}>PEAK</span>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: isPeak ? 700 : 400, color: isPeak ? C.cyan : C.t3, width: 20, textAlign: "right", ...mono }}>{d.v}</span>
                  </div>
                );
              })}
            </div>
            {hoursData.length > 0 && (
              <div style={{ marginTop: 9, fontSize: 10, color: C.t3, lineHeight: 1.5 }}>
                {hoursData.reduce((a, b) => a.v > b.v ? a : b).h} is your peak hour.
                {peakDay && peakDay !== "—" && <span> {peakDay} is your busiest day.</span>}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — CLASS PERFORMANCE
═══════════════════════════════════════════════════════════════ */
function ClassPerformanceSection({ isMobile, data }) {
  const { classData } = data;
  if (!classData.length) return (
    <Card><div style={{ fontSize: 12, color: C.t3, textAlign: "center", padding: "24px 0" }}>No class data available</div></Card>
  );
  const topClass = classData[0];
  return (
    <Card>
      <SLabel sub="Fill rate and session count based on class configuration">Class Performance</SLabel>
      <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: isMobile ? 520 : "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 60px 80px 160px", gap: 10, padding: "0 0 7px", borderBottom: `1px solid ${C.brd}`, marginBottom: 3 }}>
            {["CLASS", "SESSIONS", "FILL RATE", "CAPACITY"].map((h, i) => (
              <div key={i} style={{ fontSize: 8.5, fontWeight: 600, color: C.t3, letterSpacing: "0.07em", textAlign: i > 0 ? "center" : "left" }}>{h}</div>
            ))}
          </div>
          {classData.map((cls, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 60px 80px 160px", gap: 10, padding: "9px 0", borderBottom: i < classData.length - 1 ? `1px solid ${C.brd}` : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{cls.name}</div>
                {cls.capacity > 0 && <div style={{ fontSize: 9.5, color: C.t3, marginTop: 1 }}>{cls.booked}/{cls.capacity} spots filled</div>}
              </div>
              <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: C.t2, ...mono }}>{cls.sessions}</div>
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: fillCol(cls.fill), ...mono }}>{cls.fill > 0 ? `${cls.fill}%` : "—"}</div>
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
      {topClass && topClass.fill >= 80 && (
        <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: C.cyanD, border: `1px solid ${C.cyanB}` }}>
          <div style={{ fontSize: 10.5, color: C.cyan, fontWeight: 600, marginBottom: 2 }}>{topClass.name} is at {topClass.fill}% capacity</div>
          <div style={{ fontSize: 10, color: C.t2 }}>Consider adding additional sessions for high-demand classes.</div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — ENGAGEMENT
═══════════════════════════════════════════════════════════════ */
function EngagementSection({ isMobile, data }) {
  const { engagementData, challengePct, pollPct, classFillPct, activePct } = data;
  const engMetrics = [
    { label: "Active Members",          val: activePct,    sub: "visited in last 30 days"          },
    { label: "Challenge Participation", val: challengePct, sub: "in at least one challenge"         },
    { label: "Poll Participation",      val: pollPct,      sub: "responded to polls"               },
    { label: "Class Fill Rate",         val: classFillPct, sub: "avg capacity filled"              },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
      <Card>
        <SLabel sub="How members engage across every touchpoint">Engagement Breakdown</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 11 }}>
          {engMetrics.map((m, i) => (
            <div key={i} style={{ padding: "9px 10px", borderRadius: 7, background: C.card2, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: m.val >= 60 ? C.cyan : m.val >= 40 ? C.t1 : C.amber, letterSpacing: "-0.02em", lineHeight: 1, ...mono }}>{m.val}%</div>
              <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 120 : 148}>
          <RadarChart data={engagementData} margin={{ top: 6, right: 14, bottom: 6, left: 14 }}>
            <PolarGrid stroke="rgba(255,255,255,0.06)"/>
            <PolarAngleAxis dataKey="subject" tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }}/>
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false}/>
            <Radar name="Engagement" dataKey="A" stroke={C.cyan} fill={C.cyan} fillOpacity={0.12} strokeWidth={1.5}/>
            <Tooltip content={<ChartTip suffix="%"/>}/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SLabel sub="Engagement patterns across your community">Engagement Summary</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {engagementData.map((d, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t1 }}>{d.subject}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: d.A >= 60 ? C.cyan : d.A >= 30 ? C.amber : C.red, ...mono }}>{d.A}%</span>
              </div>
              <div style={{ height: 6, background: C.brd, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${d.A}%`, height: "100%", background: d.A >= 60 ? C.cyan : d.A >= 30 ? C.amber : C.red, borderRadius: 3, opacity: 0.8 }}/>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — AT-RISK / REVENUE IMPACT
═══════════════════════════════════════════════════════════════ */
function AtRiskSection({ isMobile, data }) {
  const { atRiskMembers, estMonthlyValue } = data;
  const shown = atRiskMembers.slice(0, 6);
  // Use ALL at-risk members for total revenue exposure (not just the 6 shown)
  const totalRisk = atRiskMembers.length * estMonthlyValue;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 11 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 2 }}>At-Risk Members</div>
          <div style={{ fontSize: 10, color: C.t3 }}>~£{totalRisk}/mo potential exposure</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.red, lineHeight: 1, ...mono }}>~£{totalRisk}</div>
          <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>monthly risk estimate</div>
        </div>
      </div>
      {shown.length === 0 ? (
        <div style={{ fontSize: 12, color: C.green, textAlign: "center", padding: "16px 0" }}>✓ No members currently at risk</div>
      ) : (
        shown.map((m, i) => {
          // Use composite churn score attached by useAnalytics
          const riskScore = m.riskScore ?? Math.min(100, Math.round((m.daysSinceLastCheckIn / 60) * 100));
          const name = m.user_name || m.name || "Member";
          return (
            <div key={m.user_id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < shown.length - 1 ? `1px solid ${C.brd}` : "none" }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t1 }}>{name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <div style={{ width: 44, height: 3, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${riskScore}%`, height: "100%", background: riskCol(riskScore), borderRadius: 2 }}/>
                  </div>
                  <span style={{ fontSize: 9.5, color: riskCol(riskScore), fontWeight: 700, ...mono }}>{riskScore}%</span>
                  <span style={{ fontSize: 9.5, color: C.t3 }}>{m.daysSinceLastCheckIn === 999 ? "never visited" : `${m.daysSinceLastCheckIn}d absent`}</span>
                </div>
              </div>
              <span style={{ fontSize: 10.5, color: C.t2, ...mono }}>~£{estMonthlyValue}/mo</span>
            </div>
          );
        })
      )}
      {shown.length > 0 && (
        <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: C.redD, border: `1px solid ${C.redB}` }}>
          <div style={{ fontSize: 10.5, color: C.red, fontWeight: 600, marginBottom: 2 }}>{atRiskMembers.length} members need attention</div>
          <div style={{ fontSize: 10, color: C.t2 }}>Sending a personal message to at-risk members can significantly improve re-engagement rates.</div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function TabAnalytics({
  checkIns = [], allMemberships = [], classes = [], coaches = [],
  challenges = [], polls = [], posts = [], totalMembers = 0,
  membershipPlans = null, classHistory = null,
  sparkData, Spark, Delta, gymId,
  // legacy props passed through but not needed
  ...rest
}) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const data = useAnalytics({ checkIns, allMemberships, classes, challenges, polls, posts, totalMembers, membershipPlans, classHistory });

  return (
    <div style={{ padding: isMobile ? "12px 12px" : "16px 18px", display: "flex", flexDirection: "column", gap: 18, fontFamily: FONT, color: C.t1 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 0 }}>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
            Analytics <span style={{ color: C.t3, fontWeight: 300 }}>/</span>{" "}
            <span style={{ color: C.cyan }}>Overview</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>Retention, engagement and visit habits — live from your data</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {data.atRiskCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: C.amberD, border: `1px solid ${C.amberB}`, fontSize: 11, color: C.amber, fontWeight: 600 }}>
              <AlertTriangle style={{ width: 10, height: 10 }}/> {data.atRiskCount} members need attention
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
            background: data.gymHealthScore >= 80 ? C.cyanD : data.gymHealthScore >= 60 ? C.cyanD : data.gymHealthScore >= 40 ? C.amberD : C.redD,
            border: `1px solid ${data.gymHealthScore >= 80 ? C.cyanB : data.gymHealthScore >= 60 ? C.cyanB : data.gymHealthScore >= 40 ? C.amberB : C.redB}`,
            color: data.gymHealthScore >= 80 ? C.cyan : data.gymHealthScore >= 60 ? C.cyan : data.gymHealthScore >= 40 ? C.amber : C.red,
          }}>
            {data.gymHealthScore}/100 — {data.gymHealthLabel}
          </div>
        </div>
      </div>

      <KpiStrip isMobile={isMobile} data={data}/>

      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Retention Health</div>
        <RetentionFunnelSection isMobile={isMobile} data={data}/>
      </div>

      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Key Insights</div>
        <KeyInsights isMobile={isMobile} data={data}/>
      </div>

      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Member Segments</div>
        <MemberSegmentsSection isMobile={isMobile} data={data}/>
      </div>

      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Visit Habits</div>
        <VisitTrendsSection isMobile={isMobile} data={data}/>
      </div>

      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Class Performance</div>
        <ClassPerformanceSection isMobile={isMobile} data={data}/>
      </div>

      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Engagement</div>
        <EngagementSection isMobile={isMobile} data={data}/>
      </div>

      <div style={{ paddingBottom: 24 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>At-Risk Members</div>
        <AtRiskSection isMobile={isMobile} data={data}/>
      </div>
    </div>
  );
}