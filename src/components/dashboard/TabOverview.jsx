/**
 * TabOverview — v6 "Control Panel"
 *
 * Design philosophy: Action-first. Every section = a problem + one blue button.
 * Matches Automations page DNA: clean dark, blue CTAs, minimal color, zero noise.
 *
 * Sections:
 *   Command Bar      — greeting + single most-important action
 *   Priority Actions — max 3 action cards, each with ONE blue CTA
 *   At-Risk Members  — individual cards, direct message action
 *   Opportunities    — 2 max, outcome-framed, blue CTA
 *   Sidebar:
 *     Live Pulse     — 3 key numbers only, no sparklines
 *     Action Queue   — sorted by urgency, blue CTAs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { differenceInDays, format } from 'date-fns';
import {
  AlertTriangle, ArrowRight, Bot, Calendar, CheckCircle,
  ChevronRight, DollarSign, MessageSquarePlus, Send,
  Trophy, UserPlus, Users, Zap, TrendingDown, TrendingUp,
  Activity, Star,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';
import { MetricCard } from '@/components/ui/MetricCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppBadge } from '@/components/ui/AppBadge';
import { cn } from '@/lib/utils';

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtMoney = (n) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ─── Shared blue CTA button (matches Automations "+ Create") ── */
function BlueCTA({ onClick, children, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg',
        'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
        'text-[12px] font-bold text-white cursor-pointer transition-colors duration-150',
        'border border-blue-500/30',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ─── Muted secondary action ─────────────────────────────────── */
function GhostCTA({ onClick, children, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg',
        'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]',
        'text-[11.5px] font-semibold text-slate-400 hover:text-slate-200',
        'cursor-pointer transition-all duration-150',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ─── Section container ──────────────────────────────────────── */
function Panel({ children, className, danger }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#0c1120] border',
        danger ? 'border-red-500/20' : 'border-white/[0.05]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-[0.14em]">
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMMAND BAR
   Purpose: One sentence, one action. No noise.
   Replaces: TodaysPlan (which had 3 competing actions + wall of text)
═══════════════════════════════════════════════════════════════ */
function CommandBar({ atRisk, newNoReturnCount, retentionRate, mrr, totalMembers, ownerName, now, openModal }) {
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk * revenuePerMember * 0.65);

  const { headline, sub, cta, fn, status } = useMemo(() => {
    if (atRisk > 0) {
      return {
        headline: `${atRisk} member${atRisk > 1 ? 's are' : ' is'} going quiet`,
        sub: `${fmtMoney(revenueAtRisk)}/mo at risk — a message today recovers ~73% of them`,
        cta: `Message ${atRisk > 1 ? `${atRisk} members` : 'them'} now`,
        fn: () => openModal('message'),
        status: 'action',
      };
    }
    if (newNoReturnCount > 0) {
      return {
        headline: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't come back`,
        sub: 'The week-1 window is closing — messaging now doubles 90-day retention',
        cta: 'Send welcome follow-up',
        fn: () => openModal('message'),
        status: 'watch',
      };
    }
    return {
      headline: 'Your gym is in great shape',
      sub: `Retention at ${retentionRate}% with no urgent issues — now grow it`,
      cta: 'Share referral link',
      fn: () => openModal('addMember'),
      status: 'clear',
    };
  }, [atRisk, newNoReturnCount, retentionRate, revenueAtRisk]);

  const statusColors = {
    action: 'text-red-400 bg-red-500/10 border-red-500/20',
    watch:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    clear:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };
  const statusLabels = { action: 'Action needed', watch: 'Watch closely', clear: 'On track' };

  return (
    <Panel className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Greeting + status badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-slate-500">{greeting}, {ownerName}</span>
            <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border', statusColors[status])}>
              {statusLabels[status]}
            </span>
          </div>
          {/* Primary headline — the ONE thing to know */}
          <h2 className="text-[20px] font-bold text-slate-100 tracking-tight leading-tight mb-1">
            {headline}
          </h2>
          <p className="text-[12.5px] text-slate-500 leading-relaxed">{sub}</p>
        </div>
        {/* Single primary CTA */}
        <BlueCTA onClick={fn} className="shrink-0 py-2.5 px-5 text-[13px]">
          {cta} <ArrowRight className="w-3 h-3" />
        </BlueCTA>
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRIORITY ACTIONS
   Purpose: Max 3. Each = problem + outcome + ONE blue button.
   Replaces: TodaysPlan's 3-column layout (kept the concept, cut the noise)
═══════════════════════════════════════════════════════════════ */
function PriorityActions({ atRisk, atRiskMembers, newNoReturnCount, mrr, totalMembers, challenges, checkIns, now, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk * revenuePerMember * 0.65);

  const actions = useMemo(() => {
    const list = [];

    if (atRisk > 0) {
      const top = atRiskMembers[0];
      const memberName = top ? (top.name || top.first_name || 'a member') : 'members';
      list.push({
        tag: 'Retention',
        tagColor: 'text-red-400 bg-red-500/10 border-red-500/20',
        title: `${atRisk} member${atRisk > 1 ? 's' : ''} inactive 14+ days`,
        outcome: `Recover ~${fmtMoney(revenueAtRisk)}/mo · 73% return when messaged`,
        cta: `Message ${atRisk > 1 ? `${atRisk} members` : memberName}`,
        fn: () => openModal('message'),
      });
    }

    if (newNoReturnCount > 0) {
      list.push({
        tag: 'New Members',
        tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't returned`,
        outcome: 'Week-1 message doubles their 90-day retention',
        cta: 'Send welcome message',
        fn: () => openModal('message'),
      });
    }

    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge && list.length < 3) {
      list.push({
        tag: 'Engagement',
        tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        title: 'No active challenge',
        outcome: 'Challenges drive 3× more weekly check-ins',
        cta: 'Launch a challenge',
        fn: () => openModal('challenge'),
      });
    }

    const rpmFmt = fmtMoney(Math.round(revenuePerMember));
    if (list.length < 3) {
      list.push({
        tag: 'Growth',
        tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        title: 'Grow with referrals',
        outcome: `Each referral adds ~${rpmFmt}/mo · 2× retention vs cold sign-ups`,
        cta: 'Share referral link',
        fn: () => openModal('addMember'),
      });
    }

    return list.slice(0, 3);
  }, [atRisk, atRiskMembers, newNoReturnCount, challenges, revenueAtRisk, revenuePerMember, openModal]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <SectionLabel>Today's priorities</SectionLabel>
        <span className="text-[10px] text-slate-600">·  {actions.length} action{actions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={cn('grid gap-2.5', actions.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2')}>
        {actions.map((act, i) => (
          <Panel key={i} className="p-4 flex flex-col gap-3">
            {/* Tag */}
            <span className={cn('self-start px-2 py-0.5 rounded-md text-[10px] font-bold border', act.tagColor)}>
              {act.tag}
            </span>
            {/* Content */}
            <div className="flex-1">
              <div className="text-[13.5px] font-bold text-slate-100 leading-snug mb-1.5">{act.title}</div>
              <div className="text-[11.5px] text-slate-500 leading-relaxed">{act.outcome}</div>
            </div>
            {/* Single blue CTA */}
            <BlueCTA onClick={act.fn} className="w-full">
              {act.cta} <ArrowRight className="w-3 h-3" />
            </BlueCTA>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AT-RISK MEMBERS
   Purpose: Named members, churn signal, direct message button.
   Replaces: PriorityMemberCards (same idea, cut noise — removed
   churn % bars, revenue-at-risk badges per card, redundant signals)
═══════════════════════════════════════════════════════════════ */
function AtRiskMembers({ atRiskMembers = [], totalMembers, mrr, now, openModal, setTab, nameMap = {}, avatarMap = {} }) {
  if (!atRiskMembers || atRiskMembers.length === 0) return null;
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const display = atRiskMembers.slice(0, 4);

  return (
    <Panel>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <SectionLabel>At-risk members</SectionLabel>
          <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400">
            {atRiskMembers.length}
          </span>
        </div>
        <button
          onClick={() => setTab('members')}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Member rows */}
      <div className="divide-y divide-white/[0.03]">
        {display.map((member, i) => {
          const name = nameMap[member.user_id] || member.name || member.first_name || 'Member';
          const daysSince = member.days_since_visit || member.daysSinceVisit || 14;
          const churnPct = Math.min(95, Math.round(40 + (daysSince / 30) * 55));
          const revenueRisk = Math.round(revenuePerMember * (churnPct / 100));
          const isHigh = churnPct >= 75;

          return (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              {/* Avatar */}
              <Avatar name={name} size={32} src={avatarMap?.[member.user_id] || null} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-100">{name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-500">
                    {daysSince}d without a visit
                  </span>
                  <span className="text-[11px] text-slate-700">·</span>
                  <span className={cn('text-[11px] font-semibold', isHigh ? 'text-red-400' : 'text-amber-400')}>
                    {churnPct}% churn risk
                  </span>
                </div>
              </div>

              {/* Revenue at risk — concise */}
              <span className="text-[12px] font-bold text-slate-400 shrink-0 mr-2">
                {fmtMoney(revenueRisk)}/mo
              </span>

              {/* Single action */}
              <BlueCTA onClick={() => openModal('message')} className="shrink-0 py-1.5 px-3 text-[11px]">
                <Send className="w-2.5 h-2.5" /> Message
              </BlueCTA>
            </div>
          );
        })}
      </div>

      {/* Footer CTA — message all */}
      {atRiskMembers.length > 1 && (
        <div className="px-5 py-3 border-t border-white/[0.04]">
          <BlueCTA onClick={() => openModal('message')} className="w-full py-2">
            <Zap className="w-3 h-3" />
            Message all {atRiskMembers.length} at-risk members at once
          </BlueCTA>
        </div>
      )}
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVENUE RECOVERY STRIP
   Purpose: One number. One sentence. One button.
   Replaces: RevenueAtRiskBanner (same, just cleaner + unified)
   Only shown if revenue is actually at risk.
═══════════════════════════════════════════════════════════════ */
function RevenueRecoveryStrip({ atRisk, mrr, totalMembers, newNoReturnCount, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const totalRisk = Math.round(atRisk * revenuePerMember * 0.65 + newNoReturnCount * revenuePerMember * 0.3);
  if (totalRisk === 0) return null;

  return (
    <Panel danger className="flex items-center gap-4 px-5 py-4">
      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
        <DollarSign className="w-3.5 h-3.5 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold text-red-400 tracking-tight leading-none">
            {fmtMoney(totalRisk)}
          </span>
          <span className="text-[12px] text-slate-500">/month at risk from {atRisk} inactive member{atRisk !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <BlueCTA onClick={() => openModal('message')} className="shrink-0 py-2 px-4">
        Recover it now <ArrowRight className="w-3 h-3" />
      </BlueCTA>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OPPORTUNITIES (max 2)
   Purpose: Surface 2 high-impact growth actions. No more.
   Replaces: Opportunities (4 items) + SmartInsights (4 items) —
   both merged, de-duplicated, reduced to 2.
═══════════════════════════════════════════════════════════════ */
function Opportunities({ newNoReturnCount, challenges, totalMembers, mrr, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;

  const items = useMemo(() => {
    const list = [];
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        icon: Trophy,
        title: 'Start a member challenge',
        detail: 'Active challenges drive 3× more check-ins. Members who complete them visit 40% more frequently.',
        impact: '+3× weekly check-ins',
        cta: 'Launch a challenge',
        fn: () => openModal('challenge'),
      });
    }
    list.push({
      icon: MessageSquarePlus,
      title: 'Post to your community',
      detail: 'A weekly update or announcement keeps members engaged between visits and increases visit frequency by ~25%.',
      impact: '2× longer membership tenure',
      cta: 'Create a post',
      fn: () => openModal('post'),
    });
    list.push({
      icon: UserPlus,
      title: 'Drive referrals this week',
      detail: `Referred members have 2× the retention rate. Each referral adds ~${fmtMoney(Math.round(revenuePerMember))}/mo MRR.`,
      impact: `~${fmtMoney(Math.round(revenuePerMember))}/mo per referral`,
      cta: 'Share referral link',
      fn: () => openModal('addMember'),
    });
    return list.slice(0, 2);
  }, [challenges, revenuePerMember, openModal]);

  return (
    <Panel>
      <div className="px-5 py-3.5 border-b border-white/[0.04]">
        <SectionLabel>Opportunities</SectionLabel>
      </div>
      <div className="divide-y divide-white/[0.03]">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-start gap-3.5 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-100 mb-0.5">{item.title}</div>
                <div className="text-[11.5px] text-slate-500 leading-relaxed mb-2">{item.detail}</div>
                <span className="text-[11px] font-bold text-emerald-400">{item.impact}</span>
              </div>
              <BlueCTA onClick={item.fn} className="shrink-0 py-1.5 px-3.5 text-[11px] mt-0.5">
                {item.cta}
              </BlueCTA>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR — LIVE PULSE
   Purpose: 3 numbers only. No sparklines. No redundancy.
   Replaces: LiveSignals (had sparklines, change%, too much)
═══════════════════════════════════════════════════════════════ */
function LivePulse({ todayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate }) {
  const activeRatio = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retColor = retentionRate >= 70 ? 'text-emerald-400' : retentionRate >= 50 ? 'text-amber-400' : 'text-red-400';

  const stats = [
    {
      label: 'Check-ins today',
      value: todayCI,
      meta: todayVsYest !== undefined && todayVsYest !== null
        ? { label: todayVsYest >= 0 ? `+${todayVsYest}% vs yesterday` : `${todayVsYest}% vs yesterday`, up: todayVsYest >= 0 }
        : null,
      valueClass: 'text-slate-100',
    },
    {
      label: 'Active this week',
      value: `${activeThisWeek}`,
      meta: { label: `${activeRatio}% of members`, up: activeRatio > 50 },
      valueClass: activeRatio > 50 ? 'text-emerald-400' : 'text-slate-100',
    },
    {
      label: 'Retention rate',
      value: `${retentionRate}%`,
      meta: {
        label: retentionRate >= 70 ? 'Healthy' : retentionRate >= 50 ? 'Average' : 'Below target',
        up: retentionRate >= 70,
      },
      valueClass: retColor,
    },
  ];

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <SectionLabel>Live pulse</SectionLabel>
        </div>
      </div>
      <div className="divide-y divide-white/[0.03]">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-[10.5px] text-slate-500 mb-0.5">{s.label}</div>
              <span className={cn('text-[20px] font-extrabold leading-none tracking-tight', s.valueClass)}>
                {s.value}
              </span>
            </div>
            {s.meta && (
              <div className={cn('flex items-center gap-1 text-[10.5px] font-semibold', s.meta.up ? 'text-emerald-400' : 'text-slate-500')}>
                {s.meta.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.meta.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR — ACTION QUEUE
   Purpose: Urgency-sorted, blue primary action, ghost secondary.
   Kept almost identical to v5 — this was already good.
═══════════════════════════════════════════════════════════════ */
function ActionQueue({ atRisk, newNoReturnCount, posts, challenges, now, openModal, setTab }) {
  const items = useMemo(() => {
    const list = [];

    if (atRisk > 0) {
      list.push({
        priority: 1,
        label: 'Retention',
        labelColor: 'text-red-400 bg-red-500/10 border-red-500/20',
        leftBorder: 'border-l-red-500',
        title: `${atRisk} member${atRisk > 1 ? 's' : ''} at risk`,
        detail: 'No visit in 14+ days',
        cta: 'Message',
        fn: () => openModal('message'),
        viewFn: () => setTab('members'),
      });
    }

    if (newNoReturnCount > 0) {
      list.push({
        priority: 2,
        label: 'New Members',
        labelColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        leftBorder: 'border-l-amber-500',
        title: `${newNoReturnCount} new — no return`,
        detail: 'Week-1 retention window',
        cta: 'Welcome',
        fn: () => openModal('message'),
        viewFn: () => setTab('members'),
      });
    }

    const recentPost = (posts || []).find(p =>
      differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7
    );
    if (!recentPost) {
      list.push({
        priority: 3,
        label: 'Engagement',
        labelColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        leftBorder: 'border-l-blue-500',
        title: 'No post this week',
        detail: '+25% engagement with weekly posts',
        cta: 'Post now',
        fn: () => openModal('post'),
        viewFn: () => setTab('content'),
      });
    }

    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      list.push({
        priority: 4,
        label: 'Engagement',
        labelColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        leftBorder: 'border-l-blue-500',
        title: 'No active challenge',
        detail: '3× check-ins during challenges',
        cta: 'Create',
        fn: () => openModal('challenge'),
        viewFn: () => setTab('content'),
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newNoReturnCount, posts, challenges, now]);

  return (
    <Panel>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
        <SectionLabel>Action queue</SectionLabel>
        {items.some(i => i.priority === 1) && (
          <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400">
            1 urgent
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2.5 px-4 py-4">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[12px] font-semibold text-slate-100">All clear today</span>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {items.map((item, i) => (
            <div key={i} className={cn('px-4 py-3.5 border-l-[3px]', item.leftBorder)}>
              <span className={cn('inline-block mb-1.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold border', item.labelColor)}>
                {item.label}
              </span>
              <div className="text-[12px] font-semibold text-slate-100 mb-0.5">{item.title}</div>
              <div className="text-[11px] text-slate-500 mb-2.5">{item.detail}</div>
              <div className="flex gap-1.5">
                <BlueCTA onClick={item.fn} className="flex-1 py-1.5 text-[11px]">
                  <Send className="w-2.5 h-2.5" /> {item.cta}
                </BlueCTA>
                <GhostCTA onClick={item.viewFn}>View</GhostCTA>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR — QUICK ACTIONS
   Unchanged from v5 — minimal, clean, useful.
═══════════════════════════════════════════════════════════════ */
function QuickActions({ openModal, setTab }) {
  const actions = [
    { icon: MessageSquarePlus, label: 'Create Post',     fn: () => openModal('post')      },
    { icon: UserPlus,          label: 'Add Member',      fn: () => openModal('addMember') },
    { icon: Trophy,            label: 'Challenge',       fn: () => openModal('challenge') },
    { icon: Calendar,          label: 'Create Event',    fn: () => openModal('event')     },
  ];
  return (
    <Panel className="p-4">
      <div className="mb-2.5">
        <SectionLabel>Quick actions</SectionLabel>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map(({ icon: Icon, label, fn }, i) => (
          <button
            key={i}
            onClick={fn}
            className="group flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-[#0d1428] hover:border-blue-500/20 transition-all duration-150 cursor-pointer"
          >
            <Icon className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="text-[11.5px] font-semibold text-slate-400 group-hover:text-slate-100 transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   Props interface fully backward-compatible with v5.

   WHAT WAS REMOVED vs v5:
   ✂ SmartInsights       — too passive, merged into Priority Actions
   ✂ WhatWorked          — belongs on Automations page, not Overview
   ✂ AutomationActivity  — belongs on Automations page, not Overview
   ✂ Core Metrics Grid   — 3 MetricCards removed (retention/active/risk
                           are surfaced inline in the relevant sections)
   ✂ Sparklines          — visual noise, removed from LivePulse
   ✂ Multi-CTA per card  — every section now has ONE blue primary CTA

   WHAT WAS SIMPLIFIED:
   ↓ Opportunities: 4 items → 2 items
   ↓ TodaysPlan summary text: wall of text → 1 sentence
   ↓ PriorityMemberCards: churn bars, badges → one clean row per member
   ↓ LiveSignals: sparklines + change% → 3 clean numbers
   ↓ SidebarActionQueue: identical shape, blue CTA system
═══════════════════════════════════════════════════════════════ */
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
    <div className={cn('grid gap-5 items-start', isMobile ? 'grid-cols-1' : 'grid-cols-[1fr_272px]')}>

      {/* ══ LEFT COLUMN ══ */}
      <div className="flex flex-col gap-3.5">

        {/* Mobile: quick actions first */}
        {isMobile && <QuickActions openModal={openModal} setTab={setTab} />}
        {isMobile && (
          <LivePulse
            todayCI={todayCI}
            todayVsYest={todayVsYest}
            activeThisWeek={activeThisWeek}
            totalMembers={totalMembers}
            retentionRate={retentionRate}
          />
        )}

        {/* 1 — Command Bar: the #1 thing to do right now */}
        <CommandBar
          atRisk={atRisk}
          newNoReturnCount={newNoReturnCount}
          retentionRate={retentionRate}
          mrr={mrr}
          totalMembers={totalMembers}
          ownerName={ownerName}
          now={now}
          openModal={openModal}
        />

        {/* 2 — Revenue Recovery Strip (only visible when revenue is at risk) */}
        <RevenueRecoveryStrip
          atRisk={atRisk}
          mrr={mrr}
          totalMembers={totalMembers}
          newNoReturnCount={newNoReturnCount}
          openModal={openModal}
        />

        {/* 3 — Priority Actions: max 3 cards, each with ONE blue CTA */}
        <PriorityActions
          atRisk={atRisk}
          atRiskMembers={atRiskMembers}
          newNoReturnCount={newNoReturnCount}
          mrr={mrr}
          totalMembers={totalMembers}
          challenges={challenges}
          checkIns={checkIns}
          now={now}
          openModal={openModal}
        />

        {/* 4 — At-Risk Members: named rows, direct message button */}
        <AtRiskMembers
          atRiskMembers={atRiskMembers}
          totalMembers={totalMembers}
          mrr={mrr}
          now={now}
          openModal={openModal}
          setTab={setTab}
          nameMap={nameMap}
          avatarMap={avatarMap}
        />

        {/* 5 — Opportunities: max 2, blue CTA, no noise */}
        <Opportunities
          newNoReturnCount={newNoReturnCount}
          challenges={challenges}
          totalMembers={totalMembers}
          mrr={mrr}
          openModal={openModal}
        />

      </div>

      {/* ══ RIGHT SIDEBAR ══ */}
      <div className="flex flex-col gap-3.5">
        {!isMobile && (
          <LivePulse
            todayCI={todayCI}
            todayVsYest={todayVsYest}
            activeThisWeek={activeThisWeek}
            totalMembers={totalMembers}
            retentionRate={retentionRate}
          />
        )}
        <ActionQueue
          atRisk={atRisk}
          newNoReturnCount={newNoReturnCount}
          posts={posts}
          challenges={challenges}
          now={now}
          openModal={openModal}
          setTab={setTab}
        />
        {!isMobile && <QuickActions openModal={openModal} setTab={setTab} />}
      </div>

    </div>
  );
}
