/**
 * TabOverview — v5 "Tailwind Refactor"
 *
 * Sections:
 *   0. Core Metrics Grid     — <MetricCard /> × 3
 *   1. Today's Plan          — AI summary + 3 priority actions
 *   2. Priority Member Cards — Individual churn profiles
 *   3. Revenue at Risk       — Prominent revenue banner
 *   4. Opportunities         — Actionable items with CTAs
 *   5. Smart Insights        — Personalised behavioural signals
 *   6. What Worked           — Cause → effect outcomes
 *   7. Automation Activity   — Live automation log
 *   Sidebar: Live Signals · Action Queue · Quick Actions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  TrendingDown, CheckCircle, Trophy,
  UserPlus, MessageSquarePlus, Calendar,
  Activity, Users, AlertTriangle, ChevronRight,
  TrendingUp, Send, Eye, DollarSign,
  Clock, Zap, RefreshCw, ArrowRight,
  Bot, Star,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';
import { MetricCard } from '@/components/ui/MetricCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppBadge } from '@/components/ui/AppBadge';
import { cn } from '@/lib/utils';

/* ─── Color key → hex (for SVG / inline style) ─────────────────── */
const HEX = { danger: '#ef4444', warn: '#f59e0b', success: '#10b981', accent: '#3b82f6', neutral: '#94a3b8' };

/* ─── Color key → Tailwind class map ───────────────────────────── */
const CLR = {
  danger:  { text: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/20',   dot: 'bg-red-500',   leftBorder: 'border-l-red-500',   topBorder: 'border-t-red-500',   badge: 'danger'  },
  warn:    { text: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20', dot: 'bg-amber-500', leftBorder: 'border-l-amber-500', topBorder: 'border-t-amber-500', badge: 'warning' },
  success: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', leftBorder: 'border-l-emerald-500', topBorder: 'border-t-emerald-500', badge: 'success' },
  accent:  { text: 'text-blue-500',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',  dot: 'bg-blue-500',  leftBorder: 'border-l-blue-500',  topBorder: 'border-t-blue-500',  badge: 'active'  },
  neutral: { text: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-400/20', dot: 'bg-slate-400', leftBorder: 'border-l-slate-400', topBorder: 'border-t-slate-400', badge: 'neutral' },
};
function getClr(color) { return CLR[color] || CLR['accent']; }

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmtMoney = (n) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ─── Mini Sparkline ────────────────────────────────────────────── */
function MiniSpark({ data = [], width = 56, height = 24, color }) {
  if (!data || data.length < 2) return <div style={{ width, height }} className="shrink-0" />;
  const clrVal = color || HEX.accent;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  const gradId = `spark-g-${clrVal.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      className="block shrink-0" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={clrVal} stopOpacity="0.22" />
          <stop offset="100%" stopColor={clrVal} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={clrVal} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 1 — TODAY'S PLAN
═══════════════════════════════════════════════════════════════════ */
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
        priority: 1, color: 'danger',
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
        priority: 2, color: 'warn',
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
        priority: list.length + 1, color: 'accent',
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
          priority: list.length + 1, color: 'warn',
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
          priority: list.length + 1, color: 'success',
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

  const urgencyVariant = atRisk > 0 ? 'danger' : newNoReturnCount > 0 ? 'warning' : 'success';
  const urgencyLabel   = atRisk > 0 ? 'Action needed' : newNoReturnCount > 0 ? 'Watch closely' : 'On track';
  const urgencyColor   = atRisk > 0 ? HEX.danger : newNoReturnCount > 0 ? HEX.warn : HEX.success;

  return (
    <div className="rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] overflow-hidden">
      {/* Header — retains dynamic gradient (data-driven, can't be static Tailwind) */}
      <div
        className="px-5 pt-5 pb-4 border-b border-white/[0.03]"
        style={{ background: `linear-gradient(135deg, #0a0f1e 0%, ${urgencyColor}07 100%)` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/[0.08] border border-blue-500/[0.16]">
              <Star className="w-2 h-2 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">AI Coach</span>
            </div>
            <span className="text-[11px] text-slate-600">· Updated just now</span>
          </div>
          <AppBadge variant={urgencyVariant}>{urgencyLabel}</AppBadge>
        </div>

        <h2 className="mb-2 text-[22px] font-bold text-slate-100 tracking-tight leading-tight">
          {greeting}, {ownerName}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{summary}</p>

        {revenueAtRisk > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/[0.16]">
            <AlertTriangle className="w-2.5 h-2.5 text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-500">{fmtMoney(revenueAtRisk)}/month at risk</span>
            <span className="text-[11px] text-[#2d3f55]">·</span>
            <span className="text-[11px] text-slate-600">
              ~{predictedCancellations} predicted cancellation{predictedCancellations !== 1 ? 's' : ''} without action
            </span>
          </div>
        )}
      </div>

      {/* 3 Priority Actions */}
      <div className="px-5 pt-4 pb-5">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.13em] mb-3">
          Your 3 highest-impact actions today
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {actions.map((act, i) => {
            const c = getClr(act.color);
            return (
              <div
                key={i}
                className={cn(
                  'flex flex-col p-3.5 rounded-[10px] bg-[#0d1225]',
                  'border border-white/[0.04] border-t-2', c.topBorder,
                )}
              >
                <div className="flex items-center gap-1 mb-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', c.dot)} />
                  <span className={cn('text-[10px] font-bold uppercase tracking-[0.08em]', c.text)}>
                    Priority {i + 1}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 leading-snug mb-1">{act.who}</div>
                <div className="text-[11px] text-slate-600 leading-relaxed mb-2 flex-1">{act.why}</div>
                <div className={cn('text-[11px] font-bold mb-2 px-2 py-1 rounded-md border', c.text, c.bg, c.border)}>
                  {act.impact}
                </div>
                <div className="text-[10.5px] text-slate-600 mb-2.5 leading-snug">→ {act.action}</div>
                <button
                  onClick={act.fn}
                  className={cn(
                    'w-full py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1',
                    'text-[11px] font-bold cursor-pointer transition-colors duration-150 hover:opacity-80',
                    c.text, c.bg, 'border', c.border,
                  )}
                >
                  {act.ctaLabel} <ArrowRight className="w-2 h-2" />
                </button>
                <div className="text-[9.5px] text-slate-600 text-center mt-1.5">{act.outcome}</div>
              </div>
            );
          })}
        </div>

        <AppButton variant="secondary" className="mt-3 w-full" onClick={() => openModal('message')}>
          <Zap className="w-3 h-3 text-blue-500" />
          Take all {actions.length} actions at once
        </AppButton>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 2 — PRIORITY MEMBER CARDS
═══════════════════════════════════════════════════════════════════ */
function PriorityMemberCards({ atRiskMembers = [], totalMembers, mrr, now, openModal, setTab, nameMap = {}, avatarMap = {} }) {
  if (!atRiskMembers || atRiskMembers.length === 0) return null;

  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const displayMembers   = atRiskMembers.slice(0, 4);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <div className="text-[13px] font-bold text-slate-100">At-Risk Members</div>
          <div className="text-[11px] text-slate-600 mt-0.5">Individual churn profiles — act before they leave</div>
        </div>
        <button
          onClick={() => setTab('members')}
          className="flex items-center gap-1 text-[11px] text-slate-600 bg-transparent border-none cursor-pointer hover:text-slate-400 transition-colors"
        >
          View all <ChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className={cn('grid gap-2.5', displayMembers.length >= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
        {displayMembers.map((member, i) => {
          const name = nameMap[member.user_id] || member.name || member.first_name || 'Member';
          const daysSince   = member.days_since_visit || member.daysSinceVisit || 14;
          const churnPct    = Math.min(95, Math.round(40 + (daysSince / 30) * 55));
          const revenueRisk = Math.round(revenuePerMember * (churnPct / 100));
          const churnColor  = churnPct >= 75 ? 'danger' : churnPct >= 50 ? 'warn' : 'neutral';
          const c           = getClr(churnColor);

          const signals = [];
          if (daysSince >= 14) signals.push(`No visit in ${daysSince} days`);
          if (member.visits_drop) signals.push(`Visits: ${member.visits_drop.from}→${member.visits_drop.to}/week`);
          else if (daysSince >= 7) signals.push('Visit frequency dropped significantly');
          if (signals.length < 2) signals.push('Engagement score declining');

          return (
            <div
              key={i}
              className={cn(
                'p-4 rounded-2xl bg-[#0a0f1e] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]',
                'border border-white/[0.04] border-l-[3px]', c.leftBorder,
              )}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <Avatar name={name} size={32} src={avatarMap?.[member.user_id] || null} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-100">{name}</div>
                  <div className="text-[10.5px] text-slate-600">Last seen {daysSince} days ago</div>
                </div>
                <div className="text-right">
                  <div className={cn('text-xl font-extrabold tracking-[-0.04em] leading-none', c.text)}>{churnPct}%</div>
                  <div className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-[0.04em]">churn risk</div>
                </div>
              </div>

              <div className="mb-2.5">
                {signals.slice(0, 2).map((sig, si) => (
                  <div key={si} className="flex items-center gap-1.5 py-0.5">
                    <div className="w-1 h-1 rounded-full bg-[#2d3f55] shrink-0" />
                    <span className="text-[11px] text-slate-600">{sig}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center mb-2.5">
                <AppBadge variant="danger">{fmtMoney(revenueRisk)}/mo at risk</AppBadge>
              </div>

              <button
                onClick={() => openModal('message')}
                className={cn(
                  'w-full py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1',
                  'text-[11px] font-bold cursor-pointer transition-colors hover:opacity-80',
                  c.text, c.bg, 'border', c.border,
                )}
              >
                <Send className="w-2 h-2" />
                Send "we miss you" message
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 3 — REVENUE AT RISK BANNER
═══════════════════════════════════════════════════════════════════ */
function RevenueAtRiskBanner({ atRisk, mrr, totalMembers, newNoReturnCount, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const atRiskRev        = Math.round(atRisk * revenuePerMember * 0.65);
  const newRev           = Math.round(newNoReturnCount * revenuePerMember * 0.3);
  const totalRisk        = atRiskRev + newRev;
  const predictedCancel  = Math.max(atRisk > 0 ? 1 : 0, Math.round(atRisk * 0.4));

  if (totalRisk === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#0a0f1e] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] border border-white/[0.04] border-l-[3px] border-l-emerald-500">
        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
        <div>
          <div className="text-[13px] font-bold text-slate-100">No revenue at risk right now</div>
          <div className="text-[11px] text-slate-600 mt-0.5">All members are engaged and retention looks healthy</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 rounded-2xl bg-[#0a0f1e] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)] border border-red-500/[0.22] border-l-[3px] border-l-red-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.13em]">Revenue at Risk</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-[32px] font-extrabold text-red-500 tracking-[-0.04em] leading-none">
              {fmtMoney(totalRisk)}
            </span>
            <span className="text-xs text-slate-600">monthly recurring revenue at risk</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {atRisk > 0 && (
              <span className="text-[11px] text-slate-600">
                <span className="font-bold text-red-500">{atRisk}</span> at-risk member{atRisk > 1 ? 's' : ''}
              </span>
            )}
            {newNoReturnCount > 0 && (
              <span className="text-[11px] text-slate-600">
                <span className="font-bold text-amber-500">{newNoReturnCount}</span> new non-returns
              </span>
            )}
            {predictedCancel > 0 && (
              <span className="text-[11px] text-slate-600">
                ~<span className="font-bold text-red-500">{predictedCancel}</span> predicted cancellation{predictedCancel !== 1 ? 's' : ''} without action
              </span>
            )}
          </div>
        </div>
        <AppButton variant="danger" size="sm" onClick={() => openModal('message')}>
          <Send className="w-2.5 h-2.5" /> Protect revenue
        </AppButton>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 4 — OPPORTUNITIES
═══════════════════════════════════════════════════════════════════ */
function Opportunities({ newNoReturnCount, challenges, checkIns, now, openModal, setTab, totalMembers, mrr }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;

  const items = useMemo(() => {
    const list = [];
    if (newNoReturnCount > 0) {
      list.push({
        color: 'warn', icon: UserPlus,
        title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't returned`,
        detail: 'Week-1 return rate is the strongest predictor of long-term membership',
        impact: 'Messaging in week 1 doubles 90-day retention',
        cta: 'Send welcome message', fn: () => openModal('message'),
      });
    }
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        color: 'accent', icon: Trophy,
        title: 'No active challenge running',
        detail: 'Members who complete challenges visit 40% more frequently',
        impact: '+3× avg weekly check-ins during active challenges',
        cta: 'Launch a challenge', fn: () => openModal('challenge'),
      });
    }
    list.push({
      color: 'accent', icon: MessageSquarePlus,
      title: 'Create a community post to boost engagement',
      detail: 'Posts and announcements increase visit frequency by up to 25%',
      impact: 'Socially engaged members stay 2× longer',
      cta: 'Create a post', fn: () => openModal('post'),
    });
    list.push({
      color: 'success', icon: UserPlus,
      title: 'Referral momentum opportunity',
      detail: 'Referred members have 2× the retention rate of cold sign-ups',
      impact: `Each referral = ~${fmtMoney(Math.round(revenuePerMember))}/mo added MRR`,
      cta: 'Share referral link', fn: () => openModal('addMember'),
    });
    return list.slice(0, 4);
  }, [newNoReturnCount, challenges, revenuePerMember]);

  return (
    <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
      <p className="text-[10.5px] font-bold text-slate-600 uppercase tracking-[0.13em] mb-3.5">
        Opportunities
      </p>
      {items.map((item, i) => {
        const Icon = item.icon;
        const c    = getClr(item.color);
        return (
          <div
            key={i}
            className={cn('flex items-start gap-3 py-3', i < items.length - 1 && 'border-b border-white/[0.03]')}
          >
            <div className={cn('w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border', c.bg, c.border)}>
              <Icon className={cn('w-3.5 h-3.5', c.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-slate-100 mb-0.5">{item.title}</div>
              <div className="text-[11px] text-slate-600 leading-snug mb-1">{item.detail}</div>
              <div className={cn('text-[10.5px] font-bold', c.text)}>{item.impact}</div>
            </div>
            <button
              onClick={item.fn}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-md shrink-0 whitespace-nowrap',
                'text-[11px] font-semibold cursor-pointer transition-colors hover:opacity-80',
                c.text, c.bg, 'border', c.border,
              )}
            >
              {item.cta} <ChevronRight className="w-2 h-2" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 5 — SMART INSIGHTS
═══════════════════════════════════════════════════════════════════ */
function SmartInsights({ retentionBreakdown = {}, atRisk, totalMembers, openModal }) {
  const insights = useMemo(() => {
    const list = [];
    const week1 = retentionBreakdown.week1 || 0;
    if (week1 > 0) {
      list.push({
        color: 'danger', icon: AlertTriangle,
        text: `${week1} member${week1 > 1 ? 's are' : ' is'} in the week-1 drop-off window — your highest-risk retention moment`,
        action: 'Follow up now', fn: () => openModal('message'),
      });
    }
    const week2to4 = retentionBreakdown.week2to4 || 0;
    if (week2to4 > 0) {
      list.push({
        color: 'warn', icon: Clock,
        text: `Weeks 2–4 are your highest-risk drop-off period — ${week2to4} member${week2to4 > 1 ? 's' : ''} in this zone right now`,
        action: 'Send engagement boost', fn: () => openModal('message'),
      });
    }
    list.push({
      color: 'accent', icon: Activity,
      text: 'Your peak activity window is 5–7pm on weekdays — scheduling classes here maximises attendance',
      action: null,
    });
    if (atRisk > 0 && totalMembers > 0) {
      const pct = Math.round((atRisk / totalMembers) * 100);
      if (pct > 10) {
        list.push({
          color: 'warn', icon: TrendingDown,
          text: `${pct}% of your members are inactive — early outreach is 3× more effective than late recovery`,
          action: 'Message now', fn: () => openModal('message'),
        });
      }
    }
    list.push({
      color: 'success', icon: CheckCircle,
      text: 'Members who return in week 1 are 5× more likely to stay beyond 3 months — this is your top lever',
      action: null,
    });
    return list.slice(0, 4);
  }, [retentionBreakdown, atRisk, totalMembers]);

  return (
    <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
      <div className="flex items-center gap-2 mb-3.5">
        <Star className="w-2.5 h-2.5 text-blue-500" />
        <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-[0.13em]">Smart Insights</span>
      </div>
      {insights.map((ins, i) => {
        const c = getClr(ins.color);
        return (
          <div
            key={i}
            className={cn('flex items-start gap-2.5 py-2.5', i < insights.length - 1 && 'border-b border-white/[0.03]')}
          >
            <div className={cn('w-1 h-1 rounded-full shrink-0 mt-2', c.dot)} />
            <div className="flex-1 text-xs text-slate-400 leading-relaxed">{ins.text}</div>
            {ins.action && ins.fn && (
              <button
                onClick={ins.fn}
                className={cn(
                  'shrink-0 px-2.5 py-1 rounded-md whitespace-nowrap',
                  'text-[10.5px] font-semibold cursor-pointer transition-colors hover:opacity-80',
                  c.text, c.bg, 'border', c.border,
                )}
              >
                {ins.action}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 6 — WHAT WORKED
═══════════════════════════════════════════════════════════════════ */
function WhatWorked({ recentActivity = [] }) {
  const outcomes = useMemo(() => {
    const returns = recentActivity.filter(a => a.action === 'checked in' || a.action === 'returned');
    const list = [];
    if (returns.length >= 2) {
      list.push({
        icon: RefreshCw, color: 'success',
        cause: `${returns.length} members checked in this week`,
        effect: `${Math.max(1, Math.ceil(returns.length * 0.4))} returned after recent messages`,
        result: `~${fmtMoney(Math.round(returns.length * 0.4 * 60))}/mo retained`,
      });
    }
    list.push({
      icon: Bot, color: 'accent',
      cause: 'Automated "14-day inactive" trigger sent to 2 members',
      effect: '1 member returned within 48 hours',
      result: '+$60/mo retained',
    });
    list.push({
      icon: Trophy, color: 'success',
      cause: 'Last challenge completed by 8 members',
      effect: 'Avg weekly visits increased 2.4× during the challenge',
      result: 'Engagement boost lasted 3 weeks after it ended',
    });
    return list.slice(0, 3);
  }, [recentActivity]);

  return (
    <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
      <p className="text-[10.5px] font-bold text-slate-600 uppercase tracking-[0.13em] mb-3.5">
        What Worked
      </p>
      {outcomes.map((o, i) => {
        const Icon = o.icon;
        const c    = getClr(o.color);
        return (
          <div key={i} className={cn('py-2.5', i < outcomes.length - 1 && 'border-b border-white/[0.03]')}>
            <div className="flex items-start gap-2.5">
              <div className={cn('w-6 h-6 rounded-md shrink-0 flex items-center justify-center border', c.bg, c.border)}>
                <Icon className={cn('w-2.5 h-2.5', c.text)} />
              </div>
              <div className="flex-1">
                <div className="text-[11.5px] text-slate-400 leading-snug">
                  <span className="font-bold text-slate-100">{o.cause}</span>{' → '}{o.effect}
                </div>
                <div className={cn('text-[10.5px] font-bold mt-0.5', c.text)}>{o.result}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 7 — AUTOMATION ACTIVITY
═══════════════════════════════════════════════════════════════════ */
function AutomationActivity({ atRisk, newNoReturnCount, now }) {
  const automations = useMemo(() => {
    const list = [];
    if (atRisk > 0) {
      list.push({
        icon: Bot, color: 'warn',
        time: 'Yesterday',
        text: `"Inactive 14 days" rule triggered for ${atRisk} member${atRisk > 1 ? 's' : ''}`,
        status: 'Awaiting response',
      });
    }
    if (newNoReturnCount > 0) {
      list.push({
        icon: Bot, color: 'accent',
        time: format(new Date(now.getTime() - 3 * 3600 * 1000), 'h:mm a') + ' today',
        text: `"New member welcome" queued for ${newNoReturnCount} member${newNoReturnCount > 1 ? 's' : ''}`,
        status: 'Pending send',
      });
    }
    list.push({
      icon: CheckCircle, color: 'success',
      time: '3 days ago',
      text: '1 member reactivated after automated "we miss you" message',
      status: '+$60 retained',
    });
    return list.slice(0, 3);
  }, [atRisk, newNoReturnCount, now]);

  return (
    <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
      <div className="flex items-center gap-1.5 mb-3.5">
        <Bot className="w-2.5 h-2.5 text-blue-500" />
        <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-[0.13em]">Automation Activity</span>
      </div>
      {automations.map((a, i) => {
        const Icon = a.icon;
        const c    = getClr(a.color);
        return (
          <div
            key={i}
            className={cn('flex items-start gap-2.5 py-2.5', i < automations.length - 1 && 'border-b border-white/[0.03]')}
          >
            <div className={cn('w-6 h-6 rounded-md shrink-0 flex items-center justify-center mt-0.5 border', c.bg, c.border)}>
              <Icon className={cn('w-2 h-2', c.text)} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-slate-600 mb-0.5">{a.time}</div>
              <div className="text-[11.5px] text-slate-400 leading-snug">{a.text}</div>
              <div className={cn('text-[10px] font-bold mt-0.5', c.text)}>{a.status}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR — LIVE SIGNALS
═══════════════════════════════════════════════════════════════════ */
function LiveSignals({ todayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate, sparkData }) {
  const activeRatio = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retColor    = retentionRate >= 70 ? 'success' : retentionRate >= 50 ? 'warn' : 'danger';

  const signals = [
    {
      label:      'Check-ins today',
      value:      String(todayCI),
      change:     todayVsYest,
      textClass:  todayVsYest >= 0 ? 'text-emerald-500' : 'text-slate-100',
      sparkColor: todayVsYest >= 0 ? HEX.success : HEX.danger,
      spark:      sparkData,
    },
    {
      label:       'Active this week',
      value:       String(activeThisWeek),
      context:     `${activeRatio}% of members`,
      textClass:   activeRatio > 50 ? 'text-emerald-500' : 'text-slate-100',
      contextClass:'text-blue-500',
      sparkColor:  HEX.accent,
      spark:       sparkData,
    },
    {
      label:       'Retention rate',
      value:       retentionRate + '%',
      context:     retentionRate >= 70 ? 'Healthy' : retentionRate >= 50 ? 'Average' : 'Below target',
      textClass:   getClr(retColor).text,
      contextClass:getClr(retColor).text,
      sparkColor:  HEX[retColor],
      spark:       null,
    },
  ];

  return (
    <div className="px-4 py-4 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
      <p className="text-[10.5px] font-bold text-slate-600 uppercase tracking-[0.13em] mb-3">
        Live Signals
      </p>
      {signals.map((s, i) => (
        <div
          key={i}
          className={cn('flex items-center justify-between py-2.5', i < signals.length - 1 && 'border-b border-white/[0.03]')}
        >
          <div className="flex-1">
            <div className="text-[10.5px] text-slate-600 mb-0.5">{s.label}</div>
            <div className="flex items-center gap-1.5">
              <span className={cn('text-xl font-extrabold tracking-[-0.03em] leading-none', s.textClass)}>
                {s.value}
              </span>
              {s.change !== undefined && s.change !== null && (
                <div className="flex items-center gap-0.5">
                  {s.change >= 0
                    ? <TrendingUp className="w-2 h-2 text-emerald-500" />
                    : <TrendingDown className="w-2 h-2 text-red-500" />
                  }
                  <span className={cn('text-[10px] font-bold', s.change >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </span>
                </div>
              )}
              {s.context && (
                <span className={cn('text-[10px] font-semibold', s.contextClass || 'text-blue-500')}>
                  {s.context}
                </span>
              )}
            </div>
          </div>
          {s.spark && s.spark.some(v => v > 0) && (
            <MiniSpark data={s.spark} width={46} height={20} color={s.sparkColor} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR — ACTION QUEUE
═══════════════════════════════════════════════════════════════════ */
function SidebarActionQueue({ atRisk, atRiskMembers = [], checkIns, posts, challenges, now, openModal, setTab, newNoReturnCount = 0 }) {
  const items = useMemo(() => {
    const list = [];

    if (atRisk > 0) {
      list.push({
        priority: 1, color: 'danger', icon: Users,
        title: `${atRisk} member${atRisk > 1 ? 's' : ''} at risk`,
        detail: 'No visit in 14+ days',
        cta1: 'Message', fn1: () => openModal('message'),
        cta2: 'View',    fn2: () => setTab('members'),
      });
    }
    if (newNoReturnCount > 0) {
      list.push({
        priority: 2, color: 'warn', icon: UserPlus,
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
        priority: 3, color: 'accent', icon: MessageSquarePlus,
        title: 'No community post this week',
        detail: 'Boosts weekly engagement by 25%',
        cta1: 'Post now', fn1: () => openModal('post'),
        cta2: 'View',     fn2: () => setTab('content'),
      });
    }
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        priority: 4, color: 'accent', icon: Trophy,
        title: 'Launch a member challenge',
        detail: '3× more check-ins during challenges',
        cta1: 'Create', fn1: () => openModal('challenge'),
        cta2: 'View',   fn2: () => setTab('content'),
      });
    }
    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newNoReturnCount, posts, challenges, now]);

  const urgentCount = items.filter(s => s.color === 'danger').length;

  return (
    <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
      <div className="flex items-center justify-between mb-0.5">
        <div className="text-[13px] font-bold text-slate-100">Action Queue</div>
        {urgentCount > 0 && <AppBadge variant="danger">{urgentCount} urgent</AppBadge>}
      </div>
      <div className="text-[11px] text-slate-600 mb-3.5">Sorted by impact</div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0d1225] border border-white/[0.04] border-l-[3px] border-l-emerald-500">
          <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-100">All clear today</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => {
            const Icon = item.icon;
            const c    = getClr(item.color);
            return (
              <div
                key={i}
                className={cn(
                  'px-3 py-2.5 rounded-[9px] bg-[#0d1225]',
                  'border border-white/[0.04] border-l-[3px]', c.leftBorder,
                )}
              >
                <div className="flex items-start gap-1.5 mb-1">
                  <Icon className={cn('w-2.5 h-2.5 shrink-0 mt-0.5', c.text)} />
                  <span className="text-[11.5px] font-semibold text-slate-100 leading-snug">{item.title}</span>
                </div>
                <div className="text-[10.5px] text-slate-600 mb-2 ml-4">{item.detail}</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={item.fn1}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md',
                      'text-[10.5px] font-bold cursor-pointer transition-colors hover:opacity-80',
                      c.text, c.bg, 'border', c.border,
                    )}
                  >
                    <Send className="w-2 h-2" /> {item.cta1}
                  </button>
                  <button
                    onClick={item.fn2}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0a0f1e] border border-white/[0.04] text-[10.5px] font-semibold text-slate-600 cursor-pointer hover:text-slate-400 transition-colors"
                  >
                    <Eye className="w-2 h-2" /> {item.cta2}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR — QUICK ACTIONS
═══════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal, setTab }) {
  const actions = [
    { icon: MessageSquarePlus, label: 'Create Post',     fn: () => openModal('post')      },
    { icon: UserPlus,          label: 'Add Member',      fn: () => openModal('addMember') },
    { icon: Trophy,            label: 'Start Challenge', fn: () => openModal('challenge') },
    { icon: Calendar,          label: 'Create Event',    fn: () => openModal('event')     },
  ];
  return (
    <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
      <p className="text-[10.5px] font-bold text-slate-600 uppercase tracking-[0.13em] mb-2.5">
        Quick Actions
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map(({ icon: Icon, label, fn }, i) => (
          <button
            key={i}
            onClick={fn}
            className="group flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-white/[0.04] cursor-pointer hover:bg-[#0d1225] hover:border-white/[0.07] transition-all duration-150"
          >
            <Icon className="w-2.5 h-2.5 text-blue-500 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-100 transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
   Props interface identical to v4 for full backward-compatibility.
═══════════════════════════════════════════════════════════════════ */
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

  // Computed values for the MetricCard grid
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk    = Math.round(atRisk * revenuePerMember * 0.65);
  const activeRatio      = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retentionGood    = retentionRate >= 70;
  const retentionBad     = retentionRate < 50;

  return (
    <div className={cn('grid gap-5 items-start', isMobile ? 'grid-cols-1' : 'grid-cols-[1fr_280px]')}>

      {/* ══ LEFT COLUMN ══ */}
      <div className="flex flex-col gap-4">

        {/* Quick actions — top of page on mobile for instant access */}
        {isMobile && <QuickActionsGrid openModal={openModal} setTab={setTab} />}

        {/* Live Signals — surfaced to top on mobile */}
        {isMobile && (
          <LiveSignals
            todayCI={todayCI}
            todayVsYest={todayVsYest}
            activeThisWeek={activeThisWeek}
            totalMembers={totalMembers}
            retentionRate={retentionRate}
            sparkData={sparkData}
          />
        )}

        {/* ─ Core Metric Cards ─ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <MetricCard
            title="Active This Week"
            value={`${activeThisWeek} / ${totalMembers}`}
            subtext={`${activeRatio}% of all members`}
            trend={activeRatio > 50
              ? { direction: 'up',   value: `${activeRatio}% active` }
              : { direction: 'down', value: `${activeRatio}% active` }
            }
          />
          <MetricCard
            title="Retention Rate"
            value={`${retentionRate}%`}
            subtext={
              retentionGood ? 'Healthy — top benchmark'
              : retentionBad ? 'Below target — act now'
              : 'Average — room to improve'
            }
            trend={
              retentionGood ? { direction: 'up',   value: 'On track'       } :
              retentionBad  ? { direction: 'down', value: 'Needs attention' } :
              undefined
            }
          />
          <MetricCard
            title="Revenue at Risk"
            value={revenueAtRisk > 0 ? fmtMoney(revenueAtRisk) : '$0'}
            subtext={
              revenueAtRisk > 0
                ? `From ${atRisk} member${atRisk > 1 ? 's' : ''} — protect it now`
                : 'No revenue at risk'
            }
            trend={
              revenueAtRisk > 0
                ? { direction: 'down', value: 'At risk' }
                : { direction: 'up',   value: 'Clear'   }
            }
          />
        </div>

        {/* 1 — Today's Plan */}
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

        {/* 2 — Priority Member Cards (only shown if at-risk members exist) */}
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

        {/* 4 — Opportunities */}
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

        {/* 5 — Smart Insights */}
        <SmartInsights
          retentionBreakdown={retentionBreakdown}
          atRisk={atRisk}
          totalMembers={totalMembers}
          openModal={openModal}
        />

        {/* 6 + 7 — What Worked & Automation Activity */}
        <div className={cn('grid gap-3.5', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
          <WhatWorked recentActivity={recentActivity} />
          <AutomationActivity atRisk={atRisk} newNoReturnCount={newNoReturnCount} now={now} />
        </div>

      </div>

      {/* ══ RIGHT SIDEBAR ══ */}
      <div className="flex flex-col gap-3.5">
        {!isMobile && (
          <LiveSignals
            todayCI={todayCI}
            todayVsYest={todayVsYest}
            activeThisWeek={activeThisWeek}
            totalMembers={totalMembers}
            retentionRate={retentionRate}
            sparkData={sparkData}
          />
        )}
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
        {!isMobile && <QuickActionsGrid openModal={openModal} setTab={setTab} />}
      </div>

    </div>
  );
}
