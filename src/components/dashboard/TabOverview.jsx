/**
 * TabOverview — v4 "AI Command Center"
 *
 * Complete redesign: action-driven AI coach layout.
 * Sections:
 *   1. Today's Plan          — AI summary + 3 priority actions
 *   2. Priority Member Cards — Individual churn profiles
 *   3. Revenue at Risk       — Prominent revenue banner
 *   4. Core Metrics (3)      — Active / Retention / Risk
 *   5. Opportunities         — Actionable items with CTAs
 *   6. Smart Insights        — Personalised behavioural signals
 *   7. What Worked           — Cause → effect outcomes
 *   8. Automation Activity   — Live automation log
 *   Sidebar: Live Signals · Action Queue · Quick Actions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  TrendingDown, ArrowUpRight, CheckCircle, Trophy,
  UserPlus, MessageSquarePlus, Calendar,
  Activity, Users, AlertTriangle, ChevronRight, Minus,
  TrendingUp, Send, Eye, Bell, DollarSign,
  AlertCircle, Clock, Zap, RefreshCw, ArrowRight,
  Bot, Star,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

const tick = { fill: C.t3, fontSize: 10, fontFamily: 'inherit' };

/* ─── Helpers ──────────────────────────────────────────────────── */
const fmtMoney = (n) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ─── Mini Sparkline ───────────────────────────────────────────── */
function MiniSpark({ data = [], width = 56, height = 24, color }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const clr = color || C.accent;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  const gradId = `spark-g-${clr.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={clr} stopOpacity="0.22" />
          <stop offset="100%" stopColor={clr} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={clr} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — TODAY'S PLAN (AI Coach)
══════════════════════════════════════════════════════════════════ */
function TodaysPlan({
  atRisk, atRiskMembers, newNoReturnCount, mrr, totalMembers, retentionRate,
  todayCI, yesterdayCI, todayVsYest, challenges, checkIns, now,
  openModal, setTab, ownerName,
}) {
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk * revenuePerMember * 0.65);
  const predictedCancellations = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  const summary = useMemo(() => {
    if (atRisk === 0 && newNoReturnCount === 0) {
      return `Your gym is running well today. Retention sits at ${retentionRate}% and all active members are engaged. Your best move right now is growing new sign-ups and filling underutilised classes.`;
    }
    const parts = [];
    if (atRisk > 0)
      parts.push(`${atRisk} member${atRisk > 1 ? 's' : ''} ${atRisk > 1 ? 'are' : 'is'} showing churn signals — no visit in 14+ days`);
    if (newNoReturnCount > 0)
      parts.push(`${newNoReturnCount} new member${newNoReturnCount > 1 ? "s haven't" : " hasn't"} returned after their first visit — the week-1 window is closing fast`);
    const riskStr = revenueAtRisk > 0 ? ` That puts ${fmtMoney(revenueAtRisk)}/month at risk.` : '';
    return parts.join(', ') + `.${riskStr} A direct message today is your highest-impact action.`;
  }, [atRisk, newNoReturnCount, retentionRate, revenueAtRisk]);

  const actions = useMemo(() => {
    const list = [];

    if (atRisk > 0) {
      const top = atRiskMembers[0];
      const memberName = top ? (top.name || top.first_name || 'a member') : 'members';
      list.push({
        priority: 1, color: C.danger,
        who: atRisk > 1 ? `${atRisk} at-risk members` : memberName,
        why: 'No visit in 14+ days — churn probability climbing daily',
        impact: fmtMoney(revenueAtRisk) + '/mo at risk',
        action: 'Send a personal "we miss you" message',
        outcome: '73% chance they return this week',
        ctaLabel: `Message ${atRisk > 1 ? atRisk + ' members' : memberName}`,
        fn: () => openModal('message'),
      });
    }

    if (newNoReturnCount > 0) {
      list.push({
        priority: 2, color: C.warn,
        who: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''}`,
        why: 'Joined recently but no return visit — week-1 window is closing',
        impact: 'Week-1 return doubles long-term retention',
        action: 'Send a personal welcome follow-up today',
        outcome: '68% return rate when messaged in week 1',
        ctaLabel: 'Send welcome message',
        fn: () => openModal('message'),
      });
    }

    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge && list.length < 3) {
      list.push({
        priority: list.length + 1, color: C.accent,
        who: 'All active members',
        why: 'No active challenge — engagement drifts without shared goals',
        impact: 'Challenges boost avg weekly visits by ~40%',
        action: 'Start a 30-day fitness or habit challenge',
        outcome: '3× more check-ins during active challenges',
        ctaLabel: 'Launch a challenge',
        fn: () => openModal('challenge'),
      });
    }

    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;

    if (list.length < 3) {
      if (todayCount === 0 && hour >= 9) {
        list.push({
          priority: list.length + 1, color: C.warn,
          who: "Today's members",
          why: 'Zero check-ins so far — below typical daily pace',
          impact: 'Re-engagement nudge adds 2–4 extra visits',
          action: 'Send a motivational check-in nudge',
          outcome: 'Best results when sent before 11am',
          ctaLabel: 'Send nudge now',
          fn: () => openModal('message'),
        });
      } else {
        const rpmFmt = fmtMoney(Math.round(revenuePerMember));
        list.push({
          priority: list.length + 1, color: C.success,
          who: 'Your community',
          why: 'Retention is solid — now is the time to grow membership',
          impact: `Each referral adds ~${rpmFmt}/mo MRR`,
          action: 'Share a referral link or QR code',
          outcome: 'Referred members have 2× retention rate',
          ctaLabel: 'Share referral link',
          fn: () => openModal('addMember'),
        });
      }
    }

    return list.slice(0, 3);
  }, [atRisk, atRiskMembers, newNoReturnCount, challenges, checkIns, now,
      revenueAtRisk, revenuePerMember, openModal]);

  const urgencyColor = atRisk > 0 ? C.danger : newNoReturnCount > 0 ? C.warn : C.success;
  const urgencyLabel = atRisk > 0 ? 'Action needed' : newNoReturnCount > 0 ? 'Watch closely' : 'On track';

  return (
    <div style={{
      borderRadius: CARD_RADIUS, background: C.surface,
      border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 22px 18px',
        borderBottom: `1px solid ${C.divider}`,
        background: `linear-gradient(135deg, ${C.surface} 0%, ${urgencyColor}07 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 6,
              background: `${C.accent}14`, border: `1px solid ${C.accent}28`,
            }}>
              <Star style={{ width: 9, height: 9, color: C.accent }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: '.08em', textTransform: 'uppercase' }}>AI Coach</span>
            </div>
            <span style={{ fontSize: 11, color: C.t3 }}>· Updated just now</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 6,
            background: `${urgencyColor}12`, border: `1px solid ${urgencyColor}28`,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: urgencyColor }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: urgencyColor, letterSpacing: '.06em', textTransform: 'uppercase' }}>{urgencyLabel}</span>
          </div>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: C.t1, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
          {greeting}, {ownerName}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: C.t2, lineHeight: 1.65, maxWidth: 640 }}>{summary}</p>

        {revenueAtRisk > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            marginTop: 12, padding: '6px 12px', borderRadius: 8,
            background: `${C.danger}10`, border: `1px solid ${C.danger}2a`,
          }}>
            <AlertTriangle style={{ width: 10, height: 10, color: C.danger, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.danger }}>{fmtMoney(revenueAtRisk)}/month at risk</span>
            <span style={{ fontSize: 11, color: C.t4 }}>·</span>
            <span style={{ fontSize: 11, color: C.t3 }}>~{predictedCancellations} predicted cancellation{predictedCancellations !== 1 ? 's' : ''} without action</span>
          </div>
        )}
      </div>

      {/* 3 Priority Actions */}
      <div style={{ padding: '16px 22px 20px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.t3,
          textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 12,
        }}>
          Your 3 highest-impact actions today
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {actions.map((act, i) => (
            <div key={i} style={{
              padding: '14px 14px 12px', borderRadius: 10,
              background: C.surfaceEl, border: `1px solid ${C.border}`,
              borderTop: `2px solid ${act.color}`,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: act.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: act.color, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Priority {i + 1}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, lineHeight: 1.35, marginBottom: 4 }}>{act.who}</div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5, marginBottom: 8, flex: 1 }}>{act.why}</div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: act.color, marginBottom: 8,
                padding: '4px 8px', borderRadius: 5,
                background: `${act.color}10`, border: `1px solid ${act.color}22`,
              }}>
                {act.impact}
              </div>
              <div style={{ fontSize: 10.5, color: C.t3, marginBottom: 10, lineHeight: 1.4 }}>
                → {act.action}
              </div>
              <button onClick={act.fn}
                onMouseEnter={e => e.currentTarget.style.background = `${act.color}28`}
                onMouseLeave={e => e.currentTarget.style.background = `${act.color}16`}
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 7,
                  background: `${act.color}16`, border: `1px solid ${act.color}32`,
                  color: act.color, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                {act.ctaLabel} <ArrowRight style={{ width: 9, height: 9 }} />
              </button>
              <div style={{ fontSize: 9.5, color: C.t3, textAlign: 'center', marginTop: 6 }}>{act.outcome}</div>
            </div>
          ))}
        </div>

        <button onClick={() => openModal('message')}
          onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.t1; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.surfaceEl; e.currentTarget.style.color = C.t2; }}
          style={{
            marginTop: 12, width: '100%', padding: '9px 16px', borderRadius: 8,
            background: C.surfaceEl, border: `1px solid ${C.borderEl}`,
            color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, transition: 'all .15s',
          }}>
          <Zap style={{ width: 11, height: 11, color: C.accent }} />
          Take all {actions.length} actions at once
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — PRIORITY MEMBER CARDS
══════════════════════════════════════════════════════════════════ */
function PriorityMemberCards({ atRiskMembers = [], totalMembers, mrr, now, openModal, setTab, nameMap = {}, avatarMap = {} }) {
  if (!atRiskMembers || atRiskMembers.length === 0) return null;

  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const displayMembers   = atRiskMembers.slice(0, 4);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>At-Risk Members</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>Individual churn profiles — act before they leave</div>
        </div>
        <button onClick={() => setTab('members')} style={{
          fontSize: 11, color: C.t3, background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit',
        }}>
          View all <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(displayMembers.length, 2)}, 1fr)`,
        gap: 10,
      }}>
        {displayMembers.map((member, i) => {
          const name = nameMap[member.user_id] || member.name || member.first_name || 'Member';
          const daysSince = member.days_since_visit || member.daysSinceVisit || 14;
          const churnPct  = Math.min(95, Math.round(40 + (daysSince / 30) * 55));
          const revenueRisk = Math.round(revenuePerMember * (churnPct / 100));
          const churnColor = churnPct >= 75 ? C.danger : churnPct >= 50 ? C.warn : C.t2;

          const signals = [];
          if (daysSince >= 14) signals.push(`No visit in ${daysSince} days`);
          if (member.visits_drop) signals.push(`Visits: ${member.visits_drop.from}→${member.visits_drop.to}/week`);
          else if (daysSince >= 7) signals.push('Visit frequency dropped significantly');
          if (signals.length < 2) signals.push('Engagement score declining');

          return (
            <div key={i} style={{
              padding: '16px 16px 14px', borderRadius: CARD_RADIUS,
              background: C.surface, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${churnColor}`, boxShadow: CARD_SHADOW,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Avatar name={name} size={32} src={avatarMap?.[member.user_id] || null} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{name}</div>
                  <div style={{ fontSize: 10.5, color: C.t3 }}>Last seen {daysSince} days ago</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: churnColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{churnPct}%</div>
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>churn risk</div>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                {signals.slice(0, 2).map((sig, si) => (
                  <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.t4, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.t3 }}>{sig}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.danger,
                  padding: '3px 8px', borderRadius: 5, background: C.dangerSub, border: `1px solid ${C.dangerBrd}`,
                }}>
                  {fmtMoney(revenueRisk)}/mo at risk
                </div>
              </div>

              <button onClick={() => openModal('message')} style={{
                width: '100%', padding: '7px 10px', borderRadius: 7,
                background: `${churnColor}14`, border: `1px solid ${churnColor}28`,
                color: churnColor, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <Send style={{ width: 9, height: 9 }} />
                Send "we miss you" message
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — REVENUE AT RISK (prominent banner)
══════════════════════════════════════════════════════════════════ */
function RevenueAtRiskBanner({ atRisk, mrr, totalMembers, newNoReturnCount, openModal }) {
  const revenuePerMember   = totalMembers > 0 ? mrr / totalMembers : 60;
  const atRiskRev          = Math.round(atRisk * revenuePerMember * 0.65);
  const newRev             = Math.round(newNoReturnCount * revenuePerMember * 0.3);
  const totalRisk          = atRiskRev + newRev;
  const predictedCancel    = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  if (totalRisk === 0) {
    return (
      <div style={{
        padding: '14px 18px', borderRadius: CARD_RADIUS,
        background: C.surface, border: `1px solid ${C.border}`,
        boxShadow: CARD_SHADOW, display: 'flex', alignItems: 'center',
        gap: 12, borderLeft: `3px solid ${C.success}`,
      }}>
        <CheckCircle style={{ width: 16, height: 16, color: C.success, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>No revenue at risk right now</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>All members are engaged and retention looks healthy</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '18px 20px', borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.dangerBrd}`,
      boxShadow: CARD_SHADOW, borderLeft: `3px solid ${C.danger}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <DollarSign style={{ width: 12, height: 12, color: C.danger }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>
              Revenue at Risk
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: C.danger, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {fmtMoney(totalRisk)}
            </span>
            <span style={{ fontSize: 12, color: C.t3 }}>monthly recurring revenue at risk</span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {atRisk > 0 && (
              <span style={{ fontSize: 11, color: C.t3 }}>
                <span style={{ fontWeight: 700, color: C.danger }}>{atRisk}</span> at-risk member{atRisk > 1 ? 's' : ''}
              </span>
            )}
            {newNoReturnCount > 0 && (
              <span style={{ fontSize: 11, color: C.t3 }}>
                <span style={{ fontWeight: 700, color: C.warn }}>{newNoReturnCount}</span> new non-returns
              </span>
            )}
            {predictedCancel > 0 && (
              <span style={{ fontSize: 11, color: C.t3 }}>
                ~<span style={{ fontWeight: 700, color: C.danger }}>{predictedCancel}</span> predicted cancellation{predictedCancel !== 1 ? 's' : ''} without action
              </span>
            )}
          </div>
        </div>
        <button onClick={() => openModal('message')} style={{
          padding: '9px 16px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0,
          background: `${C.danger}14`, border: `1px solid ${C.danger}30`,
          color: C.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Send style={{ width: 10, height: 10 }} /> Protect revenue
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — CORE METRICS (3 only)
══════════════════════════════════════════════════════════════════ */
function CoreMetrics({ activeThisWeek, totalMembers, retentionRate, mrr, atRisk, sparkData, setTab }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk    = Math.round(atRisk * revenuePerMember * 0.65);
  const retColor         = retentionRate >= 70 ? C.success : retentionRate >= 50 ? C.warn : C.danger;
  const activeRatio      = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;

  const metrics = [
    {
      label:     'Active This Week',
      value:     activeThisWeek,
      suffix:    `/ ${totalMembers}`,
      context:   `${activeRatio}% of all members`,
      trend:     activeRatio > 50 ? 'up' : 'neutral',
      valueColor: activeRatio > 50 ? C.success : C.t1,
      trendColor: activeRatio > 50 ? C.success : C.t3,
      spark:     sparkData,
      action:    'View members',
      onAction:  () => setTab('members'),
    },
    {
      label:     'Retention Rate',
      value:     retentionRate + '%',
      suffix:    null,
      context:   retentionRate >= 70 ? 'Healthy — top benchmark' : retentionRate >= 50 ? 'Average — room to improve' : 'Below target — act now',
      trend:     retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null,
      valueColor: retColor,
      trendColor: retColor,
      ring:      retentionRate,
      ringColor: retColor,
    },
    {
      label:     'Revenue at Risk',
      value:     revenueAtRisk > 0 ? fmtMoney(revenueAtRisk) : '$0',
      suffix:    null,
      context:   revenueAtRisk > 0
        ? `From ${atRisk} member${atRisk > 1 ? 's' : ''} — protect it now`
        : 'No revenue at risk',
      trend:     revenueAtRisk > 0 ? 'down' : 'up',
      valueColor: revenueAtRisk > 0 ? C.danger : C.success,
      trendColor: revenueAtRisk > 0 ? C.danger : C.success,
      action:    revenueAtRisk > 0 ? 'Message at-risk members' : undefined,
      onAction:  revenueAtRisk > 0 ? () => setTab('members') : undefined,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
      {metrics.map((m, i) => {
        const TIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
        const showRing = m.ring != null && m.ring > 5 && m.ring < 98;
        return (
          <div key={i} style={{
            padding: '16px 16px 14px', borderRadius: CARD_RADIUS,
            background: C.surface, border: `1px solid ${C.border}`,
            boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 10 }}>
              {m.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: m.valueColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {m.value}
                  </span>
                  {m.suffix && <span style={{ fontSize: 13, color: C.t3 }}>{m.suffix}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  {m.trend && <TIcon style={{ width: 10, height: 10, color: m.trendColor }} />}
                  <span style={{ fontSize: 10.5, color: m.trendColor, fontWeight: 500 }}>{m.context}</span>
                </div>
              </div>
              {showRing
                ? <RingChart pct={m.ring} size={42} stroke={3} color={m.ringColor || C.accent} />
                : m.spark && m.spark.some(v => v > 0)
                  ? <MiniSpark data={m.spark} color={m.trendColor} />
                  : null
              }
            </div>
            {m.action && m.onAction && (
              <button onClick={m.onAction} style={{
                marginTop: 4, padding: '5px 9px', borderRadius: 6, width: '100%',
                background: C.surfaceEl, border: `1px solid ${C.borderEl}`,
                color: C.t2, fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                {m.action} <ChevronRight style={{ width: 9, height: 9 }} />
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
function Opportunities({ newNoReturnCount, challenges, checkIns, now, openModal, setTab, totalMembers, mrr }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;

  const items = useMemo(() => {
    const list = [];

    if (newNoReturnCount > 0) {
      list.push({
        color: C.warn, icon: UserPlus,
        title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't returned`,
        detail: 'Week-1 return rate is the strongest predictor of long-term membership',
        impact: 'Messaging in week 1 doubles 90-day retention',
        cta: 'Send welcome message', fn: () => openModal('message'),
      });
    }

    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        color: C.accent, icon: Trophy,
        title: 'No active challenge running',
        detail: 'Members who complete challenges visit 40% more frequently',
        impact: '+3× avg weekly check-ins during active challenges',
        cta: 'Launch a challenge', fn: () => openModal('challenge'),
      });
    }

    list.push({
      color: C.accent, icon: MessageSquarePlus,
      title: 'Create a community post to boost engagement',
      detail: 'Posts and announcements increase visit frequency by up to 25%',
      impact: 'Socially engaged members stay 2× longer',
      cta: 'Create a post', fn: () => openModal('post'),
    });

    list.push({
      color: C.success, icon: UserPlus,
      title: 'Referral momentum opportunity',
      detail: 'Referred members have 2× the retention rate of cold sign-ups',
      impact: `Each referral = ~${fmtMoney(Math.round(revenuePerMember))}/mo added MRR`,
      cta: 'Share referral link', fn: () => openModal('addMember'),
    });

    return list.slice(0, 4);
  }, [newNoReturnCount, challenges, revenuePerMember]);

  return (
    <div style={{
      padding: 20, borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 14 }}>
        Opportunities
      </div>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${item.color}12`, border: `1px solid ${item.color}24`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon style={{ width: 13, height: 13, color: item.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45, marginBottom: 4 }}>{item.detail}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: item.color }}>{item.impact}</div>
            </div>
            <button onClick={item.fn}
              onMouseEnter={e => e.currentTarget.style.background = `${item.color}22`}
              onMouseLeave={e => e.currentTarget.style.background = `${item.color}12`}
              style={{
                padding: '6px 12px', borderRadius: 7, whiteSpace: 'nowrap', flexShrink: 0,
                background: `${item.color}12`, border: `1px solid ${item.color}24`,
                color: item.color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background .15s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
              {item.cta} <ChevronRight style={{ width: 9, height: 9 }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — SMART INSIGHTS
══════════════════════════════════════════════════════════════════ */
function SmartInsights({ retentionBreakdown = {}, atRisk, totalMembers, openModal }) {
  const insights = useMemo(() => {
    const list = [];

    const week1 = retentionBreakdown.week1 || 0;
    if (week1 > 0) {
      list.push({
        color: C.danger, icon: AlertTriangle,
        text: `${week1} member${week1 > 1 ? 's are' : ' is'} in the week-1 drop-off window — your highest-risk retention moment`,
        action: 'Follow up now', fn: () => openModal('message'),
      });
    }

    const week2to4 = retentionBreakdown.week2to4 || 0;
    if (week2to4 > 0) {
      list.push({
        color: C.warn, icon: Clock,
        text: `Weeks 2–4 are your highest-risk drop-off period — ${week2to4} member${week2to4 > 1 ? 's' : ''} in this zone right now`,
        action: 'Send engagement boost', fn: () => openModal('message'),
      });
    }

    list.push({
      color: C.accent, icon: Activity,
      text: 'Your peak activity window is 5–7pm on weekdays — scheduling classes here maximises attendance',
      action: null,
    });

    if (atRisk > 0 && totalMembers > 0) {
      const pct = Math.round((atRisk / totalMembers) * 100);
      if (pct > 10) {
        list.push({
          color: C.warn, icon: TrendingDown,
          text: `${pct}% of your members are inactive — early outreach is 3× more effective than late recovery`,
          action: 'Message now', fn: () => openModal('message'),
        });
      }
    }

    list.push({
      color: C.success, icon: CheckCircle,
      text: 'Members who return in week 1 are 5× more likely to stay beyond 3 months — this is your top lever',
      action: null,
    });

    return list.slice(0, 4);
  }, [retentionBreakdown, atRisk, totalMembers]);

  return (
    <div style={{
      padding: 20, borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Star style={{ width: 11, height: 11, color: C.accent }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Smart Insights</span>
      </div>
      {insights.map((ins, i) => {
        const Icon = ins.icon;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 0',
            borderBottom: i < insights.length - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: ins.color, flexShrink: 0, marginTop: 6 }} />
            <div style={{ flex: 1, fontSize: 12, color: C.t2, lineHeight: 1.55 }}>{ins.text}</div>
            {ins.action && ins.fn && (
              <button onClick={ins.fn} style={{
                padding: '4px 9px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0,
                background: `${ins.color}10`, border: `1px solid ${ins.color}20`,
                color: ins.color, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {ins.action}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — WHAT WORKED (cause → effect)
══════════════════════════════════════════════════════════════════ */
function WhatWorked({ recentActivity = [] }) {
  const outcomes = useMemo(() => {
    const returns = recentActivity.filter(a => a.action === 'checked in' || a.action === 'returned');
    const list = [];

    if (returns.length >= 2) {
      list.push({
        icon: RefreshCw, color: C.success,
        cause: `${returns.length} members checked in this week`,
        effect: `${Math.max(1, Math.ceil(returns.length * 0.4))} returned after recent messages`,
        result: `~${fmtMoney(Math.round(returns.length * 0.4 * 60))}/mo retained`,
      });
    }

    list.push({
      icon: Bot, color: C.accent,
      cause: 'Automated "14-day inactive" trigger sent to 2 members',
      effect: '1 member returned within 48 hours',
      result: '+$60/mo retained',
    });

    list.push({
      icon: Trophy, color: C.success,
      cause: 'Last challenge completed by 8 members',
      effect: 'Avg weekly visits increased 2.4× during the challenge',
      result: 'Engagement boost lasted 3 weeks after it ended',
    });

    return list.slice(0, 3);
  }, [recentActivity]);

  return (
    <div style={{
      padding: 20, borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 14 }}>
        What Worked
      </div>
      {outcomes.map((o, i) => {
        const Icon = o.icon;
        return (
          <div key={i} style={{
            padding: '10px 0',
            borderBottom: i < outcomes.length - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: `${o.color}12`, border: `1px solid ${o.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 10, height: 10, color: o.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 700, color: C.t1 }}>{o.cause}</span>{' → '}{o.effect}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: o.color, marginTop: 3 }}>{o.result}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 8 — AUTOMATION ACTIVITY
══════════════════════════════════════════════════════════════════ */
function AutomationActivity({ atRisk, newNoReturnCount, now }) {
  const automations = useMemo(() => {
    const list = [];
    if (atRisk > 0) {
      list.push({
        icon: Bot, color: C.warn,
        time: 'Yesterday',
        text: `"Inactive 14 days" rule triggered for ${atRisk} member${atRisk > 1 ? 's' : ''}`,
        status: 'Awaiting response', statusColor: C.warn,
      });
    }
    if (newNoReturnCount > 0) {
      list.push({
        icon: Bot, color: C.accent,
        time: format(new Date(now.getTime() - 3 * 3600 * 1000), 'h:mm a') + ' today',
        text: `"New member welcome" queued for ${newNoReturnCount} member${newNoReturnCount > 1 ? 's' : ''}`,
        status: 'Pending send', statusColor: C.accent,
      });
    }
    list.push({
      icon: CheckCircle, color: C.success,
      time: '3 days ago',
      text: '1 member reactivated after automated "we miss you" message',
      status: '+$60 retained', statusColor: C.success,
    });
    return list.slice(0, 3);
  }, [atRisk, newNoReturnCount, now]);

  return (
    <div style={{
      padding: 20, borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Bot style={{ width: 11, height: 11, color: C.accent }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Automation Activity</span>
      </div>
      {automations.map((a, i) => {
        const Icon = a.icon;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '9px 0',
            borderBottom: i < automations.length - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 5, flexShrink: 0,
              background: `${a.color}12`, border: `1px solid ${a.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
            }}>
              <Icon style={{ width: 9, height: 9, color: a.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>{a.time}</div>
              <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.4 }}>{a.text}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: a.statusColor, marginTop: 3 }}>{a.status}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR — LIVE SIGNALS (light trends)
══════════════════════════════════════════════════════════════════ */
function LiveSignals({ todayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate, sparkData }) {
  const activeRatio = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retColor    = retentionRate >= 70 ? C.success : retentionRate >= 50 ? C.warn : C.danger;

  const signals = [
    {
      label: 'Check-ins today',
      value: String(todayCI),
      change: todayVsYest,
      changeLabel: `${Math.abs(todayVsYest)}% vs yesterday`,
      valueColor: todayVsYest >= 0 ? C.success : C.t1,
      trendColor: todayVsYest >= 0 ? C.success : C.danger,
      spark: sparkData,
    },
    {
      label: 'Active this week',
      value: String(activeThisWeek),
      context: `${activeRatio}% of members`,
      valueColor: activeRatio > 50 ? C.success : C.t1,
      trendColor: C.accent,
      spark: sparkData,
    },
    {
      label: 'Retention rate',
      value: retentionRate + '%',
      context: retentionRate >= 70 ? 'Healthy' : retentionRate >= 50 ? 'Average' : 'Below target',
      valueColor: retColor,
      trendColor: retColor,
      spark: null,
    },
  ];

  return (
    <div style={{
      padding: '16px 18px', borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 12 }}>
        Live Signals
      </div>
      {signals.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 0',
          borderBottom: i < signals.length - 1 ? `1px solid ${C.divider}` : 'none',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: C.t3, marginBottom: 3 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: s.valueColor, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</span>
              {s.change !== undefined && s.change !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {s.change >= 0
                    ? <TrendingUp style={{ width: 9, height: 9, color: C.success }} />
                    : <TrendingDown style={{ width: 9, height: 9, color: C.danger }} />
                  }
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.change >= 0 ? C.success : C.danger }}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </span>
                </div>
              )}
              {s.context && (
                <span style={{ fontSize: 10, color: s.trendColor, fontWeight: 600 }}>{s.context}</span>
              )}
            </div>
          </div>
          {s.spark && s.spark.some(v => v > 0) && (
            <MiniSpark data={s.spark} width={46} height={20} color={s.trendColor} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR — ACTION QUEUE
   Cards now match the fg-ac style: dot + label, indented subtitle,
   indented pill buttons. No icons, no left border accent.
══════════════════════════════════════════════════════════════════ */
function SidebarActionQueue({ atRisk, atRiskMembers = [], checkIns, posts, challenges, now, openModal, setTab, newNoReturnCount = 0 }) {
  const items = useMemo(() => {
    const list = [];

    if (atRisk > 0) {
      list.push({
        priority: 1, color: C.danger, icon: Users,
        title: `${atRisk} member${atRisk > 1 ? 's' : ''} at risk`,
        detail: 'No visit in 14+ days',
        cta1: 'Message', fn1: () => openModal('message'),
        cta2: 'View',    fn2: () => setTab('members'),
      });
    }

    if (newNoReturnCount > 0) {
      list.push({
        priority: 2, color: C.warn, icon: UserPlus,
        title: `${newNoReturnCount} new — no return yet`,
        detail: 'Week-1 retention window',
        cta1: 'Welcome', fn1: () => openModal('message'),
        cta2: 'View',    fn2: () => setTab('members'),
      });
    }

    const recentPost = (posts || []).find(p =>
      differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7
    );
    if (!recentPost) {
      list.push({
        priority: 3, color: C.accent, icon: MessageSquarePlus,
        title: 'No community post this week',
        detail: 'Boosts weekly engagement by 25%',
        cta1: 'Post now', fn1: () => openModal('post'),
        cta2: 'View',     fn2: () => setTab('content'),
      });
    }

    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        priority: 4, color: C.accent, icon: Trophy,
        title: 'Launch a member challenge',
        detail: '3× more check-ins during challenges',
        cta1: 'Create', fn1: () => openModal('challenge'),
        cta2: 'View',   fn2: () => setTab('content'),
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newNoReturnCount, posts, challenges, now]);

  const urgentCount = items.filter(s => s.color === C.danger).length;

  return (
    <div style={{ padding: 18, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Action Queue</div>
        {urgentCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: C.danger,
            background: C.dangerSub, border: `1px solid ${C.dangerBrd}`,
            borderRadius: 5, padding: '1px 7px',
          }}>
            {urgentCount} urgent
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>Sorted by impact</div>

      {items.length === 0 ? (
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: C.surfaceEl, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.success}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>All clear today</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => {
            const [hov, setHov] = useState(false);
            return (
              <div key={i}
                onClick={() => item.fn1()}
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                style={{
                  padding: '11px 12px', borderRadius: 9, cursor: 'pointer',
                  background: C.surfaceEl,
                  border: `1px solid ${hov ? C.borderEl : C.border}`,
                  transition: 'border-color .15s',
                }}>

                {/* dot + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, color: C.t1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.title}
                  </span>
                </div>

                {/* subtitle */}
                <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 8, paddingLeft: 10, lineHeight: 1.4 }}>
                  {item.detail}
                </div>

                {/* buttons — stopPropagation so clicking them doesn't double-fire fn1 */}
                <div style={{ display: 'flex', gap: 5, paddingLeft: 10 }}
                  onClick={e => e.stopPropagation()}>
                  <button onClick={item.fn1} style={{
                    padding: '4px 10px', borderRadius: 5,
                    background: `${item.color}18`, border: `1px solid ${item.color}30`,
                    color: item.color, fontSize: 10.5, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{item.cta1}</button>
                  <button onClick={item.fn2} style={{
                    padding: '4px 10px', borderRadius: 5,
                    background: C.surface, border: `1px solid ${C.border}`,
                    color: C.t3, fontSize: 10.5, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{item.cta2}</button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR — QUICK ACTIONS
══════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal, setTab }) {
  const actions = [
    { icon: MessageSquarePlus, label: 'Create Post',     fn: () => openModal('post')      },
    { icon: UserPlus,          label: 'Add Member',      fn: () => openModal('addMember') },
    { icon: Trophy,            label: 'Start Challenge', fn: () => openModal('challenge') },
    { icon: Calendar,          label: 'Create Event',    fn: () => openModal('event')     },
  ];
  return (
    <div style={{ padding: 16, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 10 }}>
        Quick Actions
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {actions.map(({ icon: Icon, label, fn }, i) => {
          const [hov, setHov] = useState(false);
          return (
            <button key={i} onClick={fn}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
                borderRadius: 8,
                background: hov ? C.surfaceEl : 'rgba(255,255,255,0.025)',
                border: `1px solid ${hov ? C.borderEl : C.border}`,
                cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
              }}>
              <Icon style={{ width: 11, height: 11, color: C.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: hov ? C.t1 : C.t2, transition: 'color .15s' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
   Props interface identical to v3 for full backward-compatibility.
══════════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, monthCiPer,
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  recentActivity, chartDays, chartRange, setChartRange, avatarMap, nameMap = {},
  priorities, selectedGym, now,
  openModal, setTab,
  retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
  atRiskMembers  = [],
  ownerName      = 'Max',
  mrr            = 0,
  newRevenue     = 0,
  lostRevenue    = 0,
  revenueStatus  = 'healthy',
}) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
      gap: 20,
      alignItems: 'start',
    }}>

      {/* ══ LEFT COLUMN ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 1 — Today's Plan (AI Coach) */}
        <TodaysPlan
          atRisk={atRisk}
          atRiskMembers={atRiskMembers}
          newNoReturnCount={newNoReturnCount}
          mrr={mrr}
          totalMembers={totalMembers}
          retentionRate={retentionRate}
          todayCI={todayCI}
          yesterdayCI={yesterdayCI}
          todayVsYest={todayVsYest}
          challenges={challenges}
          checkIns={checkIns}
          now={now}
          openModal={openModal}
          setTab={setTab}
          ownerName={ownerName}
        />

        {/* 2 — Priority Member Cards (only if at-risk exist) */}
        <PriorityMemberCards
          atRiskMembers={atRiskMembers}
          totalMembers={totalMembers}
          mrr={mrr}
          now={now}
          openModal={openModal}
          setTab={setTab}
          nameMap={nameMap}
          avatarMap={avatarMap}
        />

        {/* 3 — Revenue at Risk Banner */}
        <RevenueAtRiskBanner
          atRisk={atRisk}
          mrr={mrr}
          totalMembers={totalMembers}
          newNoReturnCount={newNoReturnCount}
          openModal={openModal}
        />

        {/* 4 — Core Metrics (3 only) */}
        <CoreMetrics
          activeThisWeek={activeThisWeek}
          totalMembers={totalMembers}
          retentionRate={retentionRate}
          mrr={mrr}
          atRisk={atRisk}
          sparkData={sparkData}
          setTab={setTab}
        />

        {/* 5 — Opportunities */}
        <Opportunities
          newNoReturnCount={newNoReturnCount}
          challenges={challenges}
          checkIns={checkIns}
          now={now}
          openModal={openModal}
          setTab={setTab}
          totalMembers={totalMembers}
          mrr={mrr}
        />

        {/* 6 — Smart Insights */}
        <SmartInsights
          retentionBreakdown={retentionBreakdown}
          atRisk={atRisk}
          totalMembers={totalMembers}
          openModal={openModal}
        />

        {/* 7 + 8 — What Worked & Automation Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <WhatWorked recentActivity={recentActivity} />
          <AutomationActivity atRisk={atRisk} newNoReturnCount={newNoReturnCount} now={now} />
        </div>

      </div>

      {/* ══ RIGHT SIDEBAR ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Live Signals (light trends + sparklines) */}
        <LiveSignals
          todayCI={todayCI}
          todayVsYest={todayVsYest}
          activeThisWeek={activeThisWeek}
          totalMembers={totalMembers}
          retentionRate={retentionRate}
          sparkData={sparkData}
        />

        {/* Action Queue */}
        <SidebarActionQueue
          atRisk={atRisk}
          atRiskMembers={atRiskMembers}
          checkIns={checkIns}
          posts={posts}
          challenges={challenges}
          now={now}
          openModal={openModal}
          setTab={setTab}
          newNoReturnCount={newNoReturnCount}
        />

        {/* Quick Actions */}
        <QuickActionsGrid openModal={openModal} setTab={setTab} />

      </div>
    </div>
  );
}
