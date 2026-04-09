/**
 * TabOverview — v8 "Automations Integrated"
 *
 * New from automations page:
 * - AutomationStatsStrip: 4-col impact metrics (msgs sent, re-engaged, revenue, churn prevented)
 * - AISuggestions: replaces Opportunities — amber/left-border accent cards with AI badge
 * - LiveActivity: sidebar feed showing real-time member events (returned, inactive, triggered)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, Bot, Calendar, CheckCircle,
  ChevronRight, DollarSign, MessageSquarePlus, Send,
  Trophy, UserPlus, Users, Zap, TrendingDown, TrendingUp,
  Activity, Star, Sparkles, Bell, RotateCcw, MessageCircle,
} from 'lucide-react';

function cn(...args) { return args.filter(Boolean).join(' '); }
const fmtMoney = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg:          '#080e1c',
  surface:     '#0b1221',
  surfaceHigh: '#0e1628',
  border:      'rgba(255,255,255,0.05)',
  borderMid:   'rgba(255,255,255,0.08)',
  textPrimary:   '#f0f4ff',
  textSecondary: '#8892a4',
  textMuted:     '#4d5a6e',
  blue:        '#2f7cf6',
  blueDim:     'rgba(47,124,246,0.12)',
  blueHover:   '#4a8ef7',
  blueBorder:  'rgba(47,124,246,0.25)',
  red:         '#f0544f',
  redDim:      'rgba(240,84,79,0.10)',
  redBorder:   'rgba(240,84,79,0.20)',
  amber:       '#f5a623',
  amberDim:    'rgba(245,166,35,0.10)',
  amberBorder: 'rgba(245,166,35,0.20)',
  green:       '#3ecf8e',
  greenDim:    'rgba(62,207,142,0.10)',
  greenBorder: 'rgba(62,207,142,0.20)',
};

const panel = (extra = {}) => ({
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  ...extra,
});
const dangerPanel = () => ({
  ...panel(),
  border: `1px solid ${T.redBorder}`,
  background: `linear-gradient(135deg, ${T.surface} 0%, rgba(240,84,79,0.04) 100%)`,
});

/* ─── Avatar ─────────────────────────────────────────────────── */
function Avatar({ name = '?', size = 32, src, color }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = color ?? ([...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},45%,22%)`, border: `1px solid hsl(${hue},45%,32%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: `hsl(${hue},60%,72%)`,
      letterSpacing: '0.02em',
    }}>{initials}</div>
  );
}

/* ─── Buttons ────────────────────────────────────────────────── */
function PrimaryBtn({ onClick, children, style = {}, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: small ? '6px 14px' : '9px 18px',
        background: hov ? T.blueHover : T.blue, border: `1px solid ${T.blueBorder}`,
        borderRadius: 8, cursor: 'pointer', color: '#fff', fontWeight: 700,
        fontSize: small ? 11 : 12.5, letterSpacing: '0.01em',
        transition: 'background 0.15s, box-shadow 0.15s',
        boxShadow: hov ? `0 0 16px rgba(47,124,246,0.35)` : `0 0 0 rgba(47,124,246,0)`,
        whiteSpace: 'nowrap', flexShrink: 0, ...style,
      }}>{children}</button>
  );
}

function GhostBtn({ onClick, children, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, padding: '6px 12px',
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        color: hov ? T.textSecondary : T.textMuted,
        fontWeight: 600, fontSize: 11.5, transition: 'all 0.15s',
        whiteSpace: 'nowrap', flexShrink: 0, ...style,
      }}>{children}</button>
  );
}

function Label({ children }) {
  return <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.13em', color: T.textMuted, textTransform: 'uppercase' }}>{children}</span>;
}

function SeverityDot({ level }) {
  const color = level === 'high' ? T.red : level === 'medium' ? T.amber : T.blue;
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}` }} />;
}

function Tag({ label, color }) {
  const map = { red: [T.red, T.redDim, T.redBorder], amber: [T.amber, T.amberDim, T.amberBorder], blue: [T.blue, T.blueDim, T.blueBorder], green: [T.green, T.greenDim, T.greenBorder] };
  const [fg, bg, bd] = map[color] || map.blue;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5,
      background: bg, border: `1px solid ${bd}`, fontSize: 9.5, fontWeight: 800, color: fg,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>{label}</span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW: AUTOMATION STATS STRIP
   4 impact metrics from automated engagement.
   Mirrors the hero stat cards on the automations tab.
═══════════════════════════════════════════════════════════════ */
function AutomationStatsStrip({ automationStats = {}, openModal }) {
  const {
    messagesSent = 0,
    membersReengaged = 0,
    revenueRetained = 0,
    churnPrevented = 0,
    activeRules = 0,
  } = automationStats;

  const stats = [
    {
      Icon: Send, value: String(messagesSent),
      label: 'Messages sent', sub: 'automatically this month',
      valueColor: T.textPrimary,
    },
    {
      Icon: Users, value: String(membersReengaged),
      label: 'Members re-engaged', sub: 'returned after a message',
      valueColor: T.green,
    },
    {
      Icon: DollarSign, value: fmtMoney(revenueRetained),
      label: 'Revenue retained', sub: 'from re-engaged members',
      valueColor: T.blue,
    },
    {
      Icon: Activity, value: String(churnPrevented),
      label: 'Churn prevented', sub: 'estimated cancellations',
      valueColor: T.textPrimary,
    },
  ];

  const hasActivity = messagesSent > 0 || membersReengaged > 0;

  return (
    <div style={panel({ padding: '16px 20px' })}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: T.blueDim, border: `1px solid ${T.blueBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={12} color={T.blue} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>Automated engagement</span>
          {activeRules > 0 && (
            <span style={{
              padding: '2px 8px', borderRadius: 20,
              background: T.greenDim, border: `1px solid ${T.greenBorder}`,
              fontSize: 10.5, fontWeight: 700, color: T.green,
            }}>
              <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: T.green, marginRight: 5, verticalAlign: 'middle' }} />
              {activeRules} running
            </span>
          )}
        </div>
        <GhostBtn onClick={() => openModal?.('automations')}>
          Manage rules <ChevronRight size={12} />
        </GhostBtn>
      </div>

      {/* Sub-line */}
      {hasActivity && (
        <p style={{ margin: '0 0 14px', fontSize: 11.5, color: T.textSecondary }}>
          Your gym is running itself. Messages go out automatically — no manual work required.
        </p>
      )}

      {/* 4-stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {stats.map(({ Icon, value, label, sub, valueColor }, i) => (
          <div key={i} style={{
            background: T.surfaceHigh,
            border: `1px solid ${T.border}`,
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={12} color={T.textMuted} />
              </div>
              <ArrowUpRight size={11} color={T.textMuted} style={{ opacity: 0.5 }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: valueColor, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.textPrimary, marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 2 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW: AI SUGGESTIONS
   Replaces Opportunities. Mirrors the "Suggested for your gym" 
   section on the automations tab — amber left border, AI badge,
   green impact stat, blue "+ Create" CTA.
═══════════════════════════════════════════════════════════════ */
function AISuggestions({ challenges, totalMembers, mrr, atRiskMembers, newNoReturnCount, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;

  const suggestions = useMemo(() => {
    const list = [];

    if (newNoReturnCount > 0) list.push({
      accentColor: T.amber,
      Icon: AlertTriangle,
      title: `Catch members going quiet in week 1`,
      detail: `${newNoReturnCount} member${newNoReturnCount > 1 ? 's' : ''} in their first 2 weeks haven't been back. A habit-nudge on day 5 helps.`,
      impact: '+22% week-1 retention',
      cta: 'Create automation',
      fn: () => openModal('automation_new_member'),
    });

    const approaching50 = Math.floor(totalMembers * 0.05);
    if (approaching50 >= 1) list.push({
      accentColor: T.blue,
      Icon: Trophy,
      title: 'Celebrate your milestone members',
      detail: `${approaching50} member${approaching50 > 1 ? 's are' : ' is'} approaching their 50th visit. Recognition converts to referrals.`,
      impact: '3× referral rate',
      cta: 'Create automation',
      fn: () => openModal('automation_milestone'),
    });

    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) list.push({
      accentColor: T.green,
      Icon: Zap,
      title: 'Start a streak recognition rule',
      detail: 'Automatically message members when they hit a 7-day or 30-day visit streak.',
      impact: '3× more weekly check-ins',
      cta: 'Launch challenge',
      fn: () => openModal('challenge'),
    });

    list.push({
      accentColor: T.blue,
      Icon: MessageSquarePlus,
      title: 'Drive referrals with automation',
      detail: `Trigger a referral ask after a member's 10th visit. Each referral adds ~${fmtMoney(Math.round(revenuePerMember))}/mo.`,
      impact: `~${fmtMoney(Math.round(revenuePerMember))}/mo per referral`,
      cta: 'Create automation',
      fn: () => openModal('automation_referral'),
    });

    return list.slice(0, 2);
  }, [challenges, totalMembers, mrr, newNoReturnCount, revenuePerMember, openModal]);

  return (
    <div style={panel()}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
      }}>
        <Label>Suggested for your gym</Label>
        <span style={{
          padding: '2px 7px', borderRadius: 5,
          background: T.blueDim, border: `1px solid ${T.blueBorder}`,
          fontSize: 9.5, fontWeight: 800, color: T.blue,
          letterSpacing: '0.08em',
        }}>AI</span>
      </div>

      {/* Suggestion cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
        {suggestions.map((item, i) => {
          const { Icon } = item;
          return (
            <div key={i} style={{
              padding: '18px 20px',
              borderRight: i === 0 ? `1px solid ${T.border}` : 'none',
              borderLeft: `3px solid ${item.accentColor}`,
              display: 'flex', flexDirection: 'column', gap: 10,
              borderRadius: i === 0 ? '0 0 0 12px' : '0 0 12px 0',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `rgba(${item.accentColor === T.amber ? '245,166,35' : item.accentColor === T.green ? '62,207,142' : '47,124,246'},0.12)`,
                border: `1px solid rgba(${item.accentColor === T.amber ? '245,166,35' : item.accentColor === T.green ? '62,207,142' : '47,124,246'},0.22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={13} color={item.accentColor} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.textPrimary, lineHeight: 1.35, marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.55 }}>
                  {item.detail}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>{item.impact}</span>
                <PrimaryBtn onClick={item.fn} small>+ {item.cta}</PrimaryBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW: LIVE ACTIVITY FEED
   Sidebar panel mirroring the automations page right panel.
   Real-time events: returned, inactive, triggered, messaged.
═══════════════════════════════════════════════════════════════ */
function LiveActivityFeed({ activityFeed = [], nameMap = {}, avatarMap = {} }) {
  const defaultFeed = useMemo(() => {
    if (activityFeed.length > 0) return activityFeed;
    return [];
  }, [activityFeed]);

  if (defaultFeed.length === 0) return null;

  const eventStyle = (type) => {
    switch (type) {
      case 'returned':   return { color: T.green,  bg: T.greenDim,  border: T.greenBorder,  Icon: CheckCircle };
      case 'inactive':   return { color: T.amber,  bg: T.amberDim,  border: T.amberBorder,  Icon: AlertTriangle };
      case 'triggered':  return { color: T.blue,   bg: T.blueDim,   border: T.blueBorder,   Icon: Zap };
      case 'message':    return { color: T.textMuted, bg: 'rgba(255,255,255,0.04)', border: T.border, Icon: Send };
      default:           return { color: T.textMuted, bg: 'rgba(255,255,255,0.04)', border: T.border, Icon: Activity };
    }
  };

  return (
    <div style={panel()}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: T.green, boxShadow: `0 0 6px ${T.green}`,
          flexShrink: 0,
        }} />
        <Label>Live activity</Label>
      </div>

      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {defaultFeed.slice(0, 8).map((event, i) => {
          const name = nameMap[event.userId] || event.name || 'Member';
          const { color, bg, border, Icon } = eventStyle(event.type);
          const actionLabel = {
            returned:  'returned via automation',
            inactive:  `— Inactive`,
            triggered: 'triggered',
            message:   '— message sent',
          }[event.type] || event.label || '';

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              borderBottom: i < defaultFeed.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              {/* Event icon badge */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: bg, border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={11} color={color} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.textPrimary, lineHeight: 1.3 }}>
                  <span style={{ fontWeight: 700 }}>{name}</span>
                  <span style={{ color: T.textSecondary, fontWeight: 400 }}> {actionLabel}</span>
                </div>
                <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 2 }}>{event.time || 'just now'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMMAND BAR (unchanged from v7)
═══════════════════════════════════════════════════════════════ */
function CommandBar({ atRisk, newNoReturnCount, retentionRate, mrr, totalMembers, ownerName, now, openModal }) {
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk * revenuePerMember * 0.65);

  const { headline, sub, cta, fn, status } = useMemo(() => {
    if (atRisk > 0) return {
      headline: `${atRisk} member${atRisk > 1 ? 's are' : ' is'} going quiet`,
      sub: `${fmtMoney(revenueAtRisk)}/mo at risk — a message today recovers ~73% of them`,
      cta: `Message ${atRisk > 1 ? `${atRisk} members` : 'them'} now`,
      fn: () => openModal('message'), status: 'action',
    };
    if (newNoReturnCount > 0) return {
      headline: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't come back`,
      sub: 'The week-1 window is closing — messaging now doubles 90-day retention',
      cta: 'Send welcome follow-up',
      fn: () => openModal('message'), status: 'watch',
    };
    return {
      headline: 'Your gym is in great shape',
      sub: `Retention at ${retentionRate}% — no urgent issues. Time to grow.`,
      cta: 'Share referral link',
      fn: () => openModal('addMember'), status: 'clear',
    };
  }, [atRisk, newNoReturnCount, retentionRate, revenueAtRisk]);

  const statusStyle = {
    action: { color: T.red,   bg: T.redDim,   border: T.redBorder,   label: 'Action needed' },
    watch:  { color: T.amber, bg: T.amberDim, border: T.amberBorder, label: 'Watch closely' },
    clear:  { color: T.green, bg: T.greenDim, border: T.greenBorder, label: 'On track' },
  }[status];

  return (
    <div style={{
      ...panel(),
      padding: '20px 24px',
      background: status === 'action'
        ? `linear-gradient(135deg, ${T.surface} 60%, rgba(240,84,79,0.05) 100%)`
        : T.surface,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>{greeting}, {ownerName}</span>
            <span style={{
              padding: '2px 8px', borderRadius: 5,
              background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
              fontSize: 9.5, fontWeight: 800, color: statusStyle.color,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{statusStyle.label}</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {headline}
          </h2>
          <p style={{ margin: 0, fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6 }}>{sub}</p>
        </div>
        <PrimaryBtn onClick={fn} style={{ fontSize: 13, padding: '11px 22px', flexShrink: 0 }}>
          {cta} <ArrowRight size={13} />
        </PrimaryBtn>
      </div>
    </div>
  );
}

/* ─── Revenue Recovery Strip ─────────────────────────────────── */
function RevenueRecoveryStrip({ atRisk, mrr, totalMembers, newNoReturnCount, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const totalRisk = Math.round(atRisk * revenuePerMember * 0.65 + newNoReturnCount * revenuePerMember * 0.3);
  if (totalRisk === 0) return null;
  return (
    <div style={{ ...dangerPanel(), display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: T.redDim, border: `1px solid ${T.redBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <DollarSign size={14} color={T.red} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: T.red, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {fmtMoney(totalRisk)}
        </span>
        <span style={{ fontSize: 12, color: T.textMuted }}>
          /month at risk from {atRisk} inactive member{atRisk !== 1 ? 's' : ''}
        </span>
      </div>
      <PrimaryBtn onClick={() => openModal('message')} small>Recover now <ArrowRight size={11} /></PrimaryBtn>
    </div>
  );
}

/* ─── Priority Actions ───────────────────────────────────────── */
function PriorityActions({ atRisk, atRiskMembers, newNoReturnCount, mrr, totalMembers, challenges, now, openModal }) {
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk * revenuePerMember * 0.65);

  const actions = useMemo(() => {
    const list = [];
    if (atRisk > 0) {
      const top = atRiskMembers[0];
      const mn = top ? (top.name || top.first_name || 'a member') : 'members';
      list.push({
        tag: 'Retention', tagColor: 'red',
        title: `${atRisk} member${atRisk > 1 ? 's' : ''} inactive 14+ days`,
        outcome: `Recover ~${fmtMoney(revenueAtRisk)}/mo · 73% return when messaged`,
        cta: `Message ${atRisk > 1 ? `${atRisk} members` : mn}`,
        fn: () => openModal('message'),
      });
    }
    if (newNoReturnCount > 0) list.push({
      tag: 'New Members', tagColor: 'amber',
      title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't returned`,
      outcome: 'Week-1 message doubles their 90-day retention',
      cta: 'Send welcome message',
      fn: () => openModal('message'),
    });
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge && list.length < 3) list.push({
      tag: 'Engagement', tagColor: 'blue',
      title: 'No active challenge running',
      outcome: 'Challenges drive 3× more weekly check-ins',
      cta: 'Launch a challenge',
      fn: () => openModal('challenge'),
    });
    if (list.length < 3) list.push({
      tag: 'Growth', tagColor: 'green',
      title: 'Grow with referrals',
      outcome: `Each referral adds ~${fmtMoney(Math.round(revenuePerMember))}/mo · 2× retention vs cold sign-ups`,
      cta: 'Share referral link',
      fn: () => openModal('addMember'),
    });
    return list.slice(0, 3);
  }, [atRisk, atRiskMembers, newNoReturnCount, challenges, revenueAtRisk, revenuePerMember, openModal]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Label>Today's priorities</Label>
        <span style={{ fontSize: 10, color: T.textMuted }}>· {actions.length} action{actions.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${actions.length}, 1fr)`, gap: 10 }}>
        {actions.map((act, i) => (
          <div key={i} style={{ ...panel(), padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Tag label={act.tag} color={act.tagColor} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.textPrimary, lineHeight: 1.35, marginBottom: 6 }}>{act.title}</div>
              <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.55 }}>{act.outcome}</div>
            </div>
            <PrimaryBtn onClick={act.fn} style={{ width: '100%' }}>{act.cta} <ArrowRight size={12} /></PrimaryBtn>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── At-Risk Members ────────────────────────────────────────── */
function AtRiskMembers({ atRiskMembers = [], totalMembers, mrr, openModal, setTab, nameMap = {}, avatarMap = {} }) {
  if (!atRiskMembers || atRiskMembers.length === 0) return null;
  const revenuePerMember = totalMembers > 0 ? mrr / totalMembers : 60;
  const display = atRiskMembers.slice(0, 4);

  return (
    <div style={panel()}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Label>At-risk members</Label>
          <span style={{ padding: '2px 7px', borderRadius: 5, background: T.redDim, border: `1px solid ${T.redBorder}`, fontSize: 10, fontWeight: 800, color: T.red }}>{atRiskMembers.length}</span>
        </div>
        <GhostBtn onClick={() => setTab('members')}>View all <ChevronRight size={12} /></GhostBtn>
      </div>

      {display.map((member, i) => {
        const name = nameMap[member.user_id] || member.name || member.first_name || 'Member';
        const daysSince = member.days_since_visit || member.daysSinceVisit || 14;
        const churnPct = Math.min(95, Math.round(40 + (daysSince / 30) * 55));
        const revenueRisk = Math.round(revenuePerMember * (churnPct / 100));
        const severity = churnPct >= 75 ? 'high' : 'medium';

        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
            borderBottom: i < display.length - 1 ? `1px solid ${T.border}` : 'none',
          }}>
            <Avatar name={name} size={32} src={avatarMap?.[member.user_id]} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <SeverityDot level={severity} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{name}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                {daysSince}d without a visit ·{' '}
                <span style={{ color: severity === 'high' ? T.red : T.amber, fontWeight: 600 }}>{churnPct}% churn risk</span>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, flexShrink: 0, marginRight: 4 }}>{fmtMoney(revenueRisk)}/mo</span>
            <PrimaryBtn onClick={() => openModal('message')} small><Send size={10} /> Message</PrimaryBtn>
          </div>
        );
      })}

      {atRiskMembers.length > 1 && (
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.border}` }}>
          <PrimaryBtn onClick={() => openModal('message')} style={{ width: '100%', justifyContent: 'center' }}>
            <Zap size={12} /> Message all {atRiskMembers.length} at-risk members
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}

/* ─── Live Pulse ─────────────────────────────────────────────── */
function LivePulse({ todayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate }) {
  const activeRatio = totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0;
  const retColor = retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red;

  const stats = [
    {
      label: 'Check-ins today', value: String(todayCI), valueColor: T.textPrimary,
      meta: todayVsYest != null ? { label: `${todayVsYest >= 0 ? '+' : ''}${todayVsYest}% vs yesterday`, up: todayVsYest >= 0 } : null,
    },
    {
      label: 'Active this week', value: String(activeThisWeek),
      valueColor: activeRatio > 50 ? T.green : T.textPrimary,
      meta: { label: `${activeRatio}% of members`, up: activeRatio > 50 },
    },
    {
      label: 'Retention rate', value: `${retentionRate}%`, valueColor: retColor,
      meta: { label: retentionRate >= 70 ? 'Healthy' : retentionRate >= 50 ? 'Average' : 'Below target', up: retentionRate >= 70 },
      bench: { avg: 71, diff: retentionRate - 71 },
    },
  ];

  return (
    <div style={panel()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}`, flexShrink: 0 }} />
        <Label>Live pulse</Label>
      </div>
      {stats.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: i < stats.length - 1 ? `1px solid ${T.border}` : 'none',
        }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 4 }}>{s.label}</div>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.valueColor, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</span>
            {s.bench && (
              <div style={{ marginTop: 4, fontSize: 10, color: T.textMuted }}>
                Avg gym: <span style={{ fontWeight: 700, color: T.textSecondary }}>{s.bench.avg}%</span>
                {' · '}
                <span style={{ fontWeight: 700, color: s.bench.diff >= 0 ? T.green : T.red }}>
                  {s.bench.diff >= 0 ? '+' : ''}{s.bench.diff}pp
                </span>
              </div>
            )}
          </div>
          {s.meta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: s.meta.up ? T.green : T.textMuted }}>
              {s.meta.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {s.meta.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Action Queue ───────────────────────────────────────────── */
function ActionQueue({ atRisk, newNoReturnCount, posts, challenges, now, openModal, setTab }) {
  const items = useMemo(() => {
    const list = [];
    if (atRisk > 0) list.push({
      priority: 1, tag: 'Retention', tagColor: 'red', accentBorder: T.red,
      title: `${atRisk} member${atRisk > 1 ? 's' : ''} at risk`,
      detail: 'No visit in 14+ days',
      cta: 'Message', fn: () => openModal('message'), viewFn: () => setTab('members'),
    });
    if (newNoReturnCount > 0) list.push({
      priority: 2, tag: 'New Members', tagColor: 'amber', accentBorder: T.amber,
      title: `${newNoReturnCount} new — no return`,
      detail: 'Week-1 retention window',
      cta: 'Welcome', fn: () => openModal('message'), viewFn: () => setTab('members'),
    });
    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7);
    if (!recentPost) list.push({
      priority: 3, tag: 'Engagement', tagColor: 'blue', accentBorder: T.blue,
      title: 'No post this week',
      detail: '+25% engagement with weekly posts',
      cta: 'Post now', fn: () => openModal('post'), viewFn: () => setTab('content'),
    });
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) list.push({
      priority: 4, tag: 'Engagement', tagColor: 'blue', accentBorder: T.blue,
      title: 'No active challenge',
      detail: '3× check-ins during challenges',
      cta: 'Create', fn: () => openModal('challenge'), viewFn: () => setTab('content'),
    });
    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newNoReturnCount, posts, challenges, now]);

  const urgentCount = items.filter(i => i.priority === 1).length;

  return (
    <div style={panel()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
        <Label>Action queue</Label>
        {urgentCount > 0 && (
          <span style={{ padding: '2px 7px', borderRadius: 5, background: T.redDim, border: `1px solid ${T.redBorder}`, fontSize: 9.5, fontWeight: 800, color: T.red }}>{urgentCount} urgent</span>
        )}
      </div>
      {items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px' }}>
          <CheckCircle size={15} color={T.green} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>All clear today</span>
        </div>
      ) : items.map((item, i) => (
        <div key={i} style={{
          padding: '14px 16px',
          borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
          borderLeft: `3px solid ${item.accentBorder}`,
        }}>
          <div style={{ marginBottom: 6 }}><Tag label={item.tag} color={item.tagColor} /></div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, marginBottom: 3 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>{item.detail}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <PrimaryBtn onClick={item.fn} small style={{ flex: 1 }}><Send size={10} /> {item.cta}</PrimaryBtn>
            <GhostBtn onClick={item.viewFn}>View</GhostBtn>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Quick Actions ──────────────────────────────────────────── */
function QuickActions({ openModal, setTab }) {
  const actions = [
    { Icon: MessageSquarePlus, label: 'Create Post',  fn: () => openModal('post')      },
    { Icon: UserPlus,          label: 'Add Member',   fn: () => openModal('addMember') },
    { Icon: Trophy,            label: 'Challenge',    fn: () => openModal('challenge') },
    { Icon: Calendar,          label: 'Create Event', fn: () => openModal('event')     },
  ];
  return (
    <div style={{ ...panel(), padding: 14 }}>
      <div style={{ marginBottom: 10 }}><Label>Quick actions</Label></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {actions.map(({ Icon, label, fn }, i) => {
          const [hov, setHov] = useState(false);
          return (
            <button key={i} onClick={fn} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px',
                background: hov ? T.surfaceHigh : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hov ? T.blueBorder : T.border}`,
                borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              }}>
              <Icon size={12} color={T.blue} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: hov ? T.textPrimary : T.textSecondary, transition: 'color 0.15s' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   New props:
     automationStats  — { messagesSent, membersReengaged, revenueRetained, churnPrevented, activeRules }
     activityFeed     — [{ userId, name, type: 'returned'|'inactive'|'triggered'|'message', time }]
═══════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI = 0, yesterdayCI = 0, todayVsYest = 0, activeThisWeek = 0,
  totalMembers = 0, retentionRate = 100,
  newSignUps = 0, monthChangePct = 0,
  atRisk = 0,
  checkIns = [], allMemberships = [], challenges = [], posts = [],
  avatarMap = {}, nameMap = {},
  now = new Date(),
  openModal = () => {}, setTab = () => {},
  newNoReturnCount = 0,
  atRiskMembers = [],
  ownerName = 'Max',
  mrr = 0,
  /* ── NEW in v8 ── */
  automationStats = {},
  activityFeed = [],
}) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    const id = 'tab-overview-v8-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tab-ov8-col > * { animation: fadeUp 0.3s ease both; }
        .tab-ov8-col > *:nth-child(1){animation-delay:0ms}
        .tab-ov8-col > *:nth-child(2){animation-delay:50ms}
        .tab-ov8-col > *:nth-child(3){animation-delay:100ms}
        .tab-ov8-col > *:nth-child(4){animation-delay:150ms}
        .tab-ov8-col > *:nth-child(5){animation-delay:200ms}
        .tab-ov8-col > *:nth-child(6){animation-delay:250ms}
        .tab-ov8-col > *:nth-child(7){animation-delay:300ms}
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 272px',
      gap: 16, alignItems: 'start',
      background: T.bg, minHeight: '100vh',
      padding: 20,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      boxSizing: 'border-box',
    }}>

      {/* ══ LEFT COLUMN ══ */}
      <div className="tab-ov8-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {isMobile && <QuickActions openModal={openModal} setTab={setTab} />}
        {isMobile && (
          <LivePulse todayCI={todayCI} todayVsYest={todayVsYest}
            activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} />
        )}

        <CommandBar
          atRisk={atRisk} newNoReturnCount={newNoReturnCount}
          retentionRate={retentionRate} mrr={mrr}
          totalMembers={totalMembers} ownerName={ownerName}
          now={now} openModal={openModal}
        />

        {/* ── NEW: Automation impact strip ── */}
        <AutomationStatsStrip
          automationStats={automationStats}
          openModal={openModal}
        />

        <RevenueRecoveryStrip
          atRisk={atRisk} mrr={mrr} totalMembers={totalMembers}
          newNoReturnCount={newNoReturnCount} openModal={openModal}
        />

        <PriorityActions
          atRisk={atRisk} atRiskMembers={atRiskMembers}
          newNoReturnCount={newNoReturnCount} mrr={mrr}
          totalMembers={totalMembers} challenges={challenges}
          checkIns={checkIns} now={now} openModal={openModal}
        />

        <AtRiskMembers
          atRiskMembers={atRiskMembers} totalMembers={totalMembers}
          mrr={mrr} now={now} openModal={openModal} setTab={setTab}
          nameMap={nameMap} avatarMap={avatarMap}
        />

        {/* ── NEW: AI Suggestions (replaces plain Opportunities) ── */}
        <AISuggestions
          challenges={challenges} totalMembers={totalMembers}
          mrr={mrr} atRiskMembers={atRiskMembers}
          newNoReturnCount={newNoReturnCount} openModal={openModal}
        />

      </div>

      {/* ══ RIGHT SIDEBAR ══ */}
      <div className="tab-ov8-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isMobile && (
          <LivePulse todayCI={todayCI} todayVsYest={todayVsYest}
            activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} />
        )}

        {/* ── NEW: Live activity feed ── */}
        <LiveActivityFeed
          activityFeed={activityFeed}
          nameMap={nameMap} avatarMap={avatarMap}
        />

        <ActionQueue
          atRisk={atRisk} newNoReturnCount={newNoReturnCount}
          posts={posts} challenges={challenges}
          now={now} openModal={openModal} setTab={setTab}
        />

        {!isMobile && <QuickActions openModal={openModal} setTab={setTab} />}
      </div>

    </div>
  );
}