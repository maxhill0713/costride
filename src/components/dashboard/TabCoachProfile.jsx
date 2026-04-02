/**
 * ClientCommandCenter — Premium redesign of ClientProfile
 *
 * Design Language: "Precision Instrument"
 * Every pixel earns its place. Action-first. Insight-led.
 * Coaches should never wonder "what should I do next?"
 *
 * TOKEN ALIGNMENT (extended from original):
 *   bg #060b14 · surface #0a1020 · surfaceEl #0f1928
 *   t1 #f0f4f8 · t2 #8899aa · t3 #445566
 *   accent #3b82f6 · success #10b981 · danger #ef4444 · warn #f59e0b
 *
 * LAYOUT ARCHITECTURE:
 *   [COMMAND BAR] sticky — identity + KPIs + actions always visible
 *   [NEXT BEST ACTION] — AI recommendation, full-width, unmissable
 *   [GRID: left 2/3 + right 1/3]
 *     Left: Engagement Timeline → Attendance Heatmap → Sessions → Workouts
 *     Right: Critical Insights → Behavior Patterns → Client Info → Quick Actions
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Calendar, Dumbbell, AlertTriangle, AlertCircle,
  TrendingDown, TrendingUp, Minus, ChevronRight, ChevronDown,
  ChevronUp, Activity, BarChart2, User, Phone, Mail, MapPin,
  Target, Check, Edit2, Plus, X, Loader2, Save, Clock,
  Zap, ArrowRight, Brain, Flame, RefreshCw, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg:         '#060b14',
  surface:    '#0a1020',
  surfaceEl:  '#0f1928',
  surfaceHi:  '#141f30',
  border:     'rgba(255,255,255,0.06)',
  borderEl:   'rgba(255,255,255,0.10)',
  borderHi:   'rgba(255,255,255,0.16)',
  divider:    'rgba(255,255,255,0.035)',
  t1:         '#f0f4f8',
  t2:         '#7b90a8',
  t3:         '#3d5166',
  t4:         '#1a2a38',
  accent:     '#3b82f6',
  accentSub:  'rgba(59,130,246,0.08)',
  accentBrd:  'rgba(59,130,246,0.22)',
  accentGlow: '0 0 24px rgba(59,130,246,0.18)',
  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.08)',
  successBrd: 'rgba(16,185,129,0.20)',
  danger:     '#ef4444',
  dangerSub:  'rgba(239,68,68,0.08)',
  dangerBrd:  'rgba(239,68,68,0.22)',
  warn:       '#f59e0b',
  warnSub:    'rgba(245,158,11,0.08)',
  warnBrd:    'rgba(245,158,11,0.22)',
  purple:     '#8b5cf6',
  purpleSub:  'rgba(139,92,246,0.09)',
  purpleBrd:  'rgba(139,92,246,0.22)',
};

const RADIUS = 12;
const CARD_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.4)';

const EMPTY_CLIENT = {
  name: '', avatar_url: null, email: '', phone: '', location: '', joined: '',
  goal: '', tags: [], retention_status: 'healthy', trend: 'stable',
  last_visit: '—', visits_per_week: 0, completion_pct: 0,
  next_session: null, total_sessions: 0, no_show_rate: 0, streak: 0,
};

const ini = n => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
@keyframes fade-up   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes scan-line { from{transform:translateY(-100%)} to{transform:translateY(400%)} }
@keyframes bar-grow  { from{transform:scaleY(0)} to{transform:scaleY(1)} }
@keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

* { box-sizing: border-box; }

.ccc { font-family: 'Figtree', system-ui, sans-serif; color: ${C.t1}; }
.mono { font-family: 'DM Mono', 'Courier New', monospace; }

.ccc-btn {
  border: none; outline: none; cursor: pointer;
  font-family: 'Figtree', system-ui, sans-serif;
  transition: all .15s cubic-bezier(.2,.8,.3,1);
}
.ccc-btn:hover  { opacity: .88; }
.ccc-btn:active { transform: scale(.96); }

.ccc-card {
  border-radius: ${RADIUS}px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  box-shadow: ${CARD_SHADOW};
  overflow: hidden;
  animation: fade-up .3s ease both;
}

.row-hover { transition: background .1s; border-radius: 8px; }
.row-hover:hover { background: rgba(255,255,255,0.025) !important; }

.tag-pill {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 99px;
  font-size: 11px; font-weight: 700; letter-spacing: .02em;
  transition: all .15s;
}

.heatmap-cell {
  border-radius: 3px;
  transition: all .15s;
  cursor: default;
}
.heatmap-cell:hover { transform: scale(1.3); z-index: 10; position: relative; }

.action-primary {
  background: ${C.accent};
  box-shadow: 0 4px 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px; font-weight: 700;
  display: inline-flex; align-items: center; gap: 7px;
  cursor: pointer; font-family: inherit;
  transition: all .15s cubic-bezier(.2,.8,.3,1);
}
.action-primary:hover {
  background: #4f92ff;
  box-shadow: 0 6px 28px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
  transform: translateY(-1px);
}
.action-primary:active { transform: scale(.97); }

.action-ghost {
  background: rgba(255,255,255,0.04);
  border: 1px solid ${C.border};
  color: ${C.t2};
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 7px;
  cursor: pointer; font-family: inherit;
  transition: all .15s;
}
.action-ghost:hover { background: ${C.surfaceEl}; border-color: ${C.borderEl}; color: ${C.t1}; }
.action-ghost:active { transform: scale(.97); }

.nba-glow {
  position: relative;
  overflow: hidden;
}
.nba-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(139,92,246,0.04) 100%);
  pointer-events: none;
}

.signal-bar {
  border-radius: ${RADIUS}px;
  border: 1px solid ${C.border};
  transition: background .12s;
  cursor: pointer;
}
.signal-bar:hover { background: ${C.surfaceEl} !important; }

.scroll-x { overflow-x: auto; scrollbar-width: none; }
.scroll-x::-webkit-scrollbar { display: none; }

.command-bar-kpi {
  display: flex; flex-direction: column; align-items: flex-start;
  padding: 0 20px;
  border-left: 1px solid rgba(255,255,255,0.06);
}
`;

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Lbl({ children, style = {} }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.14em', ...style }}>
      {children}
    </div>
  );
}

function CardHead({ label, icon: Icon, iconColor, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: `1px solid ${C.divider}` }}>
      {Icon && (
        <div style={{ width: 24, height: 24, borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 11, height: 11, color: iconColor || C.t3 }} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <Lbl>{label}</Lbl>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{sub}</div>}
      </div>
      {action && onAction && (
        <button className="ccc-btn" onClick={onAction} style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 7, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

function Card({ label, icon, iconColor, sub, action, onAction, children, style = {}, leftBorder }) {
  return (
    <div className="ccc-card" style={{ ...style, ...(leftBorder ? { borderLeft: `2.5px solid ${leftBorder}` } : {}) }}>
      {label && <CardHead label={label} icon={icon} iconColor={iconColor} sub={sub} action={action} onAction={onAction} />}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function StatNum({ value, label, warn, mono = true }) {
  return (
    <div>
      <div className={mono ? 'mono' : ''} style={{ fontSize: 24, fontWeight: 500, color: warn ? C.danger : C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</div>
    </div>
  );
}

// ─── Command Bar ──────────────────────────────────────────────────────────────
function CommandBar({ cl, onMessage, onBook, onAssign, onEdit }) {
  const retention = {
    healthy:         { label: 'Healthy',          color: C.success },
    needs_attention: { label: 'Needs Attention',  color: C.warn },
    at_risk:         { label: 'At Risk',           color: C.danger },
  }[cl.retention_status] || { label: 'Healthy', color: C.success };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.getElementById('ccc-scroll-root');
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(6,11,20,0.96)' : C.bg,
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
      transition: 'all .2s',
    }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 0 }}>

        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 20, flexShrink: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${C.accent}18`, border: `2px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.accent, overflow: 'hidden' }}>
              {cl.avatar_url ? <img src={cl.avatar_url} alt={cl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(cl.name)}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: retention.color, border: `2px solid ${C.bg}`, animation: cl.retention_status === 'at_risk' ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{cl.name || 'Client Profile'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: retention.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: retention.color }}>{retention.label}</span>
              {cl.goal && <><span style={{ color: C.t4 }}>·</span><span style={{ fontSize: 11, color: C.t3 }}>{cl.goal}</span></>}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="command-bar-kpi">
          <Lbl>Last Visit</Lbl>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: cl.retention_status === 'at_risk' ? C.danger : C.t1, marginTop: 3 }}>{cl.last_visit}</div>
        </div>
        <div className="command-bar-kpi">
          <Lbl>Visits / Wk</Lbl>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: cl.visits_per_week < 2 ? C.warn : C.t1, marginTop: 3 }}>{cl.visits_per_week}×</div>
        </div>
        <div className="command-bar-kpi">
          <Lbl>Completion</Lbl>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: cl.completion_pct < 50 ? C.danger : C.t1, marginTop: 3 }}>{cl.completion_pct}%</div>
        </div>
        <div className="command-bar-kpi">
          <Lbl>Streak</Lbl>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: cl.streak === 0 ? C.t3 : C.success, marginTop: 3 }}>{cl.streak}d</div>
        </div>

        {/* Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
          <button className="action-ghost" onClick={onMessage}><MessageSquare style={{ width: 13, height: 13 }} /> Message</button>
          <button className="action-ghost" onClick={onAssign}><Dumbbell style={{ width: 13, height: 13 }} /> Assign</button>
          <button className="action-primary" onClick={onBook}><Calendar style={{ width: 13, height: 13 }} /> Book Session</button>
        </div>
      </div>
    </div>
  );
}

// ─── Next Best Action ─────────────────────────────────────────────────────────
function NextBestAction({ cl, insights, onAction }) {
  const nba = useMemo(() => {
    if (cl.retention_status === 'at_risk') return {
      priority: 'urgent',
      icon: Flame,
      title: `${cl.name?.split(' ')[0] || 'This client'} is at risk of churning`,
      body: `No activity in over a week and no upcoming sessions booked. A personal message now is 3× more likely to re-engage them than waiting.`,
      cta: 'Send Re-engagement Message',
      ctaKey: 'message',
      color: C.danger,
      colorSub: C.dangerSub,
      colorBrd: C.dangerBrd,
    };
    if (!cl.next_session) return {
      priority: 'high',
      icon: Calendar,
      title: `Book ${cl.name?.split(' ')[0] || 'this client'}'s next session`,
      body: `No upcoming sessions scheduled. Clients with sessions booked in advance are 60% more consistent. Lock in their next slot.`,
      cta: 'Book a Session',
      ctaKey: 'book',
      color: C.warn,
      colorSub: C.warnSub,
      colorBrd: C.warnBrd,
    };
    if (cl.completion_pct < 50) return {
      priority: 'medium',
      icon: Dumbbell,
      title: `Workout completion is low (${cl.completion_pct}%)`,
      body: `Less than half of assigned workouts are being completed. Consider simplifying the program or checking if it still fits their schedule.`,
      cta: 'Reassign Workout',
      ctaKey: 'assign',
      color: C.accent,
      colorSub: C.accentSub,
      colorBrd: C.accentBrd,
    };
    return {
      priority: 'low',
      icon: Check,
      title: `${cl.name?.split(' ')[0] || 'Client'} is on track — maintain momentum`,
      body: `Everything looks healthy. Keep the consistency going with a check-in message or scheduling their next milestone session.`,
      cta: 'Send Check-in',
      ctaKey: 'message',
      color: C.success,
      colorSub: C.successSub,
      colorBrd: C.successBrd,
    };
  }, [cl, insights]);

  const IconComp = nba.icon;

  return (
    <div className="nba-glow" style={{ borderRadius: RADIUS, background: C.surface, border: `1px solid ${nba.colorBrd}`, boxShadow: CARD_SHADOW, overflow: 'hidden', animation: 'fade-up .3s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px' }}>
        {/* Icon */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${nba.color}12`, border: `1px solid ${nba.colorBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconComp style={{ width: 20, height: 20, color: nba.color }} />
        </div>

        {/* Copy */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: nba.color, textTransform: 'uppercase', letterSpacing: '.14em', background: `${nba.color}12`, border: `1px solid ${nba.colorBrd}`, borderRadius: 99, padding: '2px 8px' }}>
              Next Best Action
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 4, letterSpacing: '-0.01em' }}>{nba.title}</div>
          <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{nba.body}</div>
        </div>

        {/* CTA */}
        <button className="ccc-btn" onClick={() => onAction(nba.ctaKey)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 10, background: nba.color, color: nba.priority === 'low' ? '#052' : '#fff', fontSize: 13, fontWeight: 700, boxShadow: `0 4px 18px ${nba.color}30`, border: 'none', fontFamily: 'inherit' }}>
          {nba.cta} <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Critical Insights ────────────────────────────────────────────────────────
function CriticalInsights({ cl, clientBookings, clientCheckIns, onAction }) {
  const insights = useMemo(() => {
    const items = [];
    const now = Date.now();
    const lastCI = clientCheckIns.length
      ? clientCheckIns.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0]
      : null;
    const daysAgo = lastCI ? Math.floor((now - new Date(lastCI.check_in_date)) / 86400000) : null;

    if (daysAgo !== null && daysAgo >= 7)
      items.push({ id: 'inactive', sev: 'high', icon: AlertTriangle, color: C.danger, title: `Inactive for ${daysAgo} days`, body: 'Above the 7-day churn threshold. Personal outreach now.', cta: 'Message Now', key: 'message' });

    const noShows = clientBookings.filter(b => b.status === 'no_show').length;
    if (noShows >= 2)
      items.push({ id: 'noshows', sev: 'high', icon: XCircle, color: C.danger, title: `${noShows} no-shows recorded`, body: 'Pattern of missed sessions may indicate scheduling mismatch.', cta: 'Reschedule', key: 'book' });

    if (!cl.next_session)
      items.push({ id: 'nobook', sev: 'med', icon: Calendar, color: C.warn, title: 'No session booked', body: 'Client has no upcoming sessions scheduled.', cta: 'Book Now', key: 'book' });

    if (cl.visits_per_week < 2 && cl.visits_per_week > 0)
      items.push({ id: 'lowfreq', sev: 'med', icon: TrendingDown, color: C.warn, title: 'Visit frequency dropping', body: `Averaging ${cl.visits_per_week}×/week — below the recommended 2× minimum.`, cta: null, key: null });

    if (cl.completion_pct < 40)
      items.push({ id: 'lowcomp', sev: 'med', icon: Dumbbell, color: C.warn, title: `${cl.completion_pct}% workout completion`, body: 'Program may need simplification or rescheduling.', cta: 'Reassign', key: 'assign' });

    return items;
  }, [cl, clientBookings, clientCheckIns]);

  if (!insights.length) return (
    <Card label="Insights" icon={Brain} iconColor={C.success}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.successSub, border: `1px solid ${C.successBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check style={{ width: 13, height: 13, color: C.success }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>All clear</div>
          <div style={{ fontSize: 11, color: C.t3 }}>No issues detected for this client</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="ccc-card" style={{ borderLeft: `2.5px solid ${C.danger}` }}>
      <CardHead label="Critical Insights" icon={AlertTriangle} iconColor={C.danger} sub={`${insights.length} issue${insights.length > 1 ? 's' : ''} need attention`} />
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {insights.map((ins, i) => {
          const Ic = ins.icon;
          return (
            <div key={ins.id} className="signal-bar" style={{ padding: '10px 12px', background: i === 0 ? `${ins.color}06` : 'transparent', borderLeft: `2.5px solid ${ins.color}`, borderRadius: RADIUS, marginLeft: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <Ic style={{ width: 12, height: 12, color: ins.color, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{ins.title}</div>
                  <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.5 }}>{ins.body}</div>
                </div>
                {ins.cta && (
                  <button className="ccc-btn" onClick={() => onAction(ins.key)} style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: ins.color, background: `${ins.color}10`, border: `1px solid ${ins.color}25`, borderRadius: 7, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                    {ins.cta} <ArrowRight style={{ width: 9, height: 9 }} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Behavior Patterns ────────────────────────────────────────────────────────
function BehaviorPatterns({ cl, clientCheckIns, clientBookings }) {
  const patterns = useMemo(() => {
    const dayCount = { Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0,Sun:0 };
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    clientCheckIns.forEach(c => {
      const d = days[new Date(c.check_in_date).getDay()];
      if (dayCount[d] !== undefined) dayCount[d]++;
    });
    const topDay = Object.entries(dayCount).sort(([,a],[,b]) => b-a)[0];

    const items = [];
    if (topDay && topDay[1] > 0)
      items.push({ icon: '📅', text: `Most active on ${topDay[0]}s`, sub: `${topDay[1]} visits` });

    const noShowCount = clientBookings.filter(b => b.status === 'no_show').length;
    const total = clientBookings.length;
    if (total > 0 && noShowCount / total > 0.2)
      items.push({ icon: '⚠️', text: 'High no-show pattern', sub: `${Math.round((noShowCount/total)*100)}% of sessions missed` });

    if (cl.streak > 7)
      items.push({ icon: '🔥', text: `${cl.streak}-day active streak`, sub: 'Momentum is building' });

    if (cl.visits_per_week >= 3)
      items.push({ icon: '⚡', text: 'Power user frequency', sub: `${cl.visits_per_week}× per week average` });
    else if (cl.visits_per_week <= 1)
      items.push({ icon: '🌡️', text: 'Low engagement pattern', sub: 'Below 2× weekly threshold' });

    if (cl.completion_pct >= 80)
      items.push({ icon: '✅', text: 'High workout compliance', sub: `${cl.completion_pct}% completion rate` });

    return items.slice(0, 4);
  }, [cl, clientCheckIns, clientBookings]);

  return (
    <Card label="Behavior Patterns" icon={Brain} iconColor={C.purple}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {patterns.length === 0 && (
          <div style={{ fontSize: 12, color: C.t3, textAlign: 'center', padding: '12px 0' }}>Not enough data yet to detect patterns</div>
        )}
        {patterns.map((p, i) => (
          <div key={i} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{p.text}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Attendance Heatmap ───────────────────────────────────────────────────────
function AttendanceHeatmap({ clientCheckIns }) {
  // Build 12-week heatmap (Mon–Sun)
  const cells = useMemo(() => {
    const today = new Date();
    const weeks = 14;
    const grid = [];
    // Start from Monday 'weeks' weeks ago
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - (today.getDay() || 7) + 1 - (weeks - 1) * 7);

    const checkSet = new Set(
      clientCheckIns.map(c => {
        const d = new Date(c.check_in_date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDay);
        date.setDate(startDay.getDate() + w * 7 + d);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const isCheckedIn = checkSet.has(key);
        const isFuture = date > today;
        week.push({ date, checked: isCheckedIn, future: isFuture, key });
      }
      grid.push(week);
    }
    return grid;
  }, [clientCheckIns]);

  const totalCheckins = cells.flat().filter(c => c.checked).length;
  const DAYS = ['M','T','W','T','F','S','S'];

  return (
    <Card label="Attendance Heatmap" icon={Activity} sub={`${totalCheckins} check-ins in the last 14 weeks`}>
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 0 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ width: 12, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.t4, fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ display: 'flex', gap: 3, minWidth: 'max-content' }}>
            {cells.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((cell, di) => {
                  const intensity = cell.checked ? 1 : 0;
                  const bg = cell.future
                    ? 'transparent'
                    : cell.checked
                      ? C.accent
                      : C.surfaceEl;
                  const border = cell.future ? `1px dashed ${C.t4}` : `1px solid ${cell.checked ? C.accentBrd : C.border}`;
                  return (
                    <div
                      key={di}
                      className="heatmap-cell"
                      title={`${cell.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}${cell.checked ? ' ✓' : ''}`}
                      style={{ width: 14, height: 14, background: bg, border, opacity: cell.future ? 0.2 : cell.checked ? 1 : 0.7, boxShadow: cell.checked ? `0 0 6px ${C.accent}40` : 'none' }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: C.t4 }}>Less</span>
        {[C.surfaceEl, `${C.accent}40`, `${C.accent}70`, C.accent].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: `1px solid ${C.border}` }} />
        ))}
        <span style={{ fontSize: 9, color: C.t4 }}>More</span>
      </div>
    </Card>
  );
}

// ─── Engagement Timeline ──────────────────────────────────────────────────────
const TL_CONFIG = {
  attended:  { color: C.success, label: 'Attended',  icon: '✓' },
  no_show:   { color: C.danger,  label: 'No-show',   icon: '✗' },
  cancelled: { color: C.warn,    label: 'Cancelled', icon: '—' },
  message:   { color: C.accent,  label: 'Message',   icon: '✉' },
  workout:   { color: C.purple,  label: 'Workout',   icon: '⚡' },
};

function EngagementTimeline({ clientBookings, clientCheckIns }) {
  const [expanded, setExpanded] = useState(false);

  const events = useMemo(() => {
    const ev = [];
    clientBookings.forEach(b => {
      const type = b.status === 'attended' ? 'attended' : b.status === 'no_show' ? 'no_show' : 'cancelled';
      ev.push({ type, date: b.session_date ? new Date(b.session_date) : null, label: b.session_name || 'Session', sub: type === 'attended' ? 'Completed' : type === 'no_show' ? 'Client did not attend' : 'Session cancelled' });
    });
    clientCheckIns.forEach(c => {
      ev.push({ type: 'attended', date: new Date(c.check_in_date), label: 'Gym Check-in', sub: 'Visited the gym' });
    });
    return ev.sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, expanded ? 20 : 6);
  }, [clientBookings, clientCheckIns, expanded]);

  const timeStr = date => {
    if (!date) return '—';
    const mins = Math.floor((Date.now() - date) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <Card label="Engagement Timeline" icon={Activity}>
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: C.t3, fontSize: 12 }}>No activity recorded yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {events.map((ev, i) => {
            const cfg = TL_CONFIG[ev.type] || TL_CONFIG.attended;
            const isLast = i === events.length - 1;
            return (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 2 }}>
                {/* Timeline rail */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${cfg.color}14`, border: `1.5px solid ${cfg.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: cfg.color, fontWeight: 700, marginTop: 6, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  {!isLast && <div style={{ width: 1, flex: 1, minHeight: 14, background: C.divider, margin: '3px 0' }} />}
                </div>
                {/* Content */}
                <div className="row-hover" style={{ flex: 1, padding: '5px 8px', marginBottom: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{ev.label}</span>
                    <span className="mono" style={{ fontSize: 10, color: C.t4, marginLeft: 12, flexShrink: 0 }}>{timeStr(ev.date)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{ev.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {(clientBookings.length + clientCheckIns.length) > 6 && (
        <button className="ccc-btn" onClick={() => setExpanded(e => !e)}
          style={{ width: '100%', marginTop: 10, padding: '8px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.t2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit' }}>
          {expanded ? <><ChevronUp style={{ width: 11, height: 11 }} /> Show less</> : <><ChevronDown style={{ width: 11, height: 11 }} /> Show more events</>}
        </button>
      )}
    </Card>
  );
}

// ─── Session History ──────────────────────────────────────────────────────────
function SessionHistory({ clientBookings, onBook }) {
  const sessions = useMemo(() =>
    clientBookings.slice(0, 8).map(b => ({
      date: b.session_date ? new Date(b.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '—',
      time: b.session_date ? new Date(b.session_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
      name: b.session_name || 'Training Session',
      status: b.status === 'attended' ? 'attended' : b.status === 'no_show' ? 'no_show' : 'cancelled',
    })), [clientBookings]);

  const statusCfg = { attended: { color: C.success, label: 'Done' }, no_show: { color: C.danger, label: 'No-show' }, cancelled: { color: C.warn, label: 'Cancelled' } };

  return (
    <Card label="Session History" icon={Calendar} action="Book" onAction={onBook}>
      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Calendar style={{ width: 28, height: 28, color: C.t4, margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 4 }}>No sessions yet</div>
          <button className="action-primary" onClick={onBook} style={{ margin: '0 auto', fontSize: 12, padding: '8px 16px' }}>
            <Calendar style={{ width: 12, height: 12 }} /> Book first session
          </button>
        </div>
      ) : (
        <div>
          {/* Summary dots */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {sessions.map((s, i) => {
              const color = statusCfg[s.status]?.color || C.t3;
              return (
                <div key={i} title={`${s.date} — ${statusCfg[s.status]?.label}`}
                  style={{ flex: 1, height: 4, borderRadius: 99, background: color, opacity: 0.7 }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sessions.map((s, i) => (
              <div key={i} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg[s.status]?.color || C.t3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: C.t3 }}>{s.date} · {s.time}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: statusCfg[s.status]?.color, background: `${statusCfg[s.status]?.color}10`, border: `1px solid ${statusCfg[s.status]?.color}20`, borderRadius: 99, padding: '2px 9px', flexShrink: 0 }}>
                  {statusCfg[s.status]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Workout Engagement ───────────────────────────────────────────────────────
function WorkoutEngagement({ clientWorkouts, onAssign }) {
  const [open, setOpen] = useState(null);
  const workouts = useMemo(() =>
    clientWorkouts.map(w => ({
      name: w.workout_data?.name || 'Workout Plan',
      pct: w.is_activated ? 100 : 0,
      completed: w.is_activated ? (w.workout_data?.exercises?.length || 1) : 0,
      total: w.workout_data?.exercises?.length || 1,
      assigned: w.assigned_date ? new Date(w.assigned_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—',
      active: !!w.is_activated,
    })), [clientWorkouts]);

  const avgPct = workouts.length ? Math.round(workouts.reduce((a, w) => a + w.pct, 0) / workouts.length) : 0;

  return (
    <Card label="Workout Engagement" icon={Dumbbell} iconColor={C.purple} action="Assign" onAction={onAssign}
      sub={workouts.length ? `${avgPct}% avg completion · ${workouts.length} plans` : undefined}>
      {workouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Dumbbell style={{ width: 28, height: 28, color: C.t4, margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 4 }}>No workouts assigned</div>
          <button className="action-ghost" onClick={onAssign} style={{ margin: '0 auto', fontSize: 12, padding: '8px 16px' }}>
            <Plus style={{ width: 12, height: 12 }} /> Assign first workout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {workouts.map((w, i) => (
            <div key={i} style={{ borderRadius: 10, background: C.surfaceEl, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div className="row-hover" onClick={() => setOpen(open === i ? null : i)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', cursor: 'pointer' }}>
                {/* Color bar */}
                <div style={{ width: 3, height: 32, borderRadius: 99, background: w.pct >= 80 ? C.success : w.pct >= 40 ? C.accent : C.danger, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{w.name}</div>
                  {/* Progress */}
                  <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', width: `${w.pct}%`, borderRadius: 99, background: w.pct >= 80 ? C.success : w.pct >= 40 ? C.accent : C.danger, transition: 'width .6s' }} />
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: w.pct < 40 ? C.danger : C.t1, letterSpacing: '-0.03em', flexShrink: 0 }}>{w.pct}%</div>
                {open === i ? <ChevronUp style={{ width: 11, height: 11, color: C.t4 }} /> : <ChevronDown style={{ width: 11, height: 11, color: C.t4 }} />}
              </div>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                    style={{ overflow: 'hidden', borderTop: `1px solid ${C.divider}` }}>
                    <div style={{ padding: '10px 13px 11px 29px', display: 'flex', gap: 18 }}>
                      <div><Lbl style={{ marginBottom: 3 }}>Exercises</Lbl><div className="mono" style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>{w.completed}/{w.total}</div></div>
                      <div><Lbl style={{ marginBottom: 3 }}>Assigned</Lbl><div className="mono" style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>{w.assigned}</div></div>
                      <div><Lbl style={{ marginBottom: 3 }}>Status</Lbl><div style={{ fontSize: 11, fontWeight: 700, color: w.active ? C.success : C.warn }}>{w.active ? 'Active' : 'Not started'}</div></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Client Info Sidebar ──────────────────────────────────────────────────────
function ClientInfo({ cl }) {
  const rows = [
    { icon: Mail,   v: cl.email    || '—', label: 'Email' },
    { icon: Phone,  v: cl.phone    || '—', label: 'Phone' },
    { icon: MapPin, v: cl.location || '—', label: 'Location' },
    { icon: User,   v: cl.joined ? `Member since ${cl.joined}` : '—', label: 'Joined' },
    { icon: Target, v: cl.goal     || '—', label: 'Goal' },
  ];
  return (
    <Card label="Client Info" icon={User}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rows.map(({ icon: Ic, v, label }) => (
          <div key={label} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic style={{ width: 10, height: 10, color: C.t3 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 1 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
            </div>
          </div>
        ))}
        {cl.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
            {cl.tags.map(t => (
              <span key={t} className="tag-pill" style={{ background: C.accentSub, border: `1px solid ${C.accentBrd}`, color: C.accent }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Retention Risk Gauge ─────────────────────────────────────────────────────
function RetentionRisk({ cl }) {
  const score = cl.retention_status === 'at_risk' ? 82 : cl.retention_status === 'needs_attention' ? 48 : 18;
  const color = score >= 70 ? C.danger : score >= 40 ? C.warn : C.success;
  const label = score >= 70 ? 'High Risk' : score >= 40 ? 'Moderate' : 'Healthy';

  // SVG arc
  const r = 32, cx = 44, cy = 44, strokeW = 6;
  const startAngle = -210, endAngle = 30; // 240° arc
  const totalArc = endAngle - startAngle;
  const circ = 2 * Math.PI * r;
  const arcFraction = totalArc / 360;
  const dashTotal = circ * arcFraction;
  const dashFill = dashTotal * (score / 100);
  const toRad = deg => (deg * Math.PI) / 180;

  // Convert to SVG coords
  const arcPath = (start, end, radius) => {
    const s = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) };
    const e = { x: cx + radius * Math.cos(toRad(end)),   y: cy + radius * Math.sin(toRad(end)) };
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const factors = [
    cl.retention_status === 'at_risk'  && { label: 'Inactivity',       sev: 'H' },
    !cl.next_session                   && { label: 'No upcoming session', sev: 'H' },
    cl.completion_pct < 50             && { label: 'Low completion',    sev: 'M' },
    cl.visits_per_week < 2             && { label: 'Low frequency',     sev: 'M' },
    cl.no_show_rate > 15               && { label: 'No-show pattern',   sev: 'M' },
  ].filter(Boolean);

  return (
    <div className="ccc-card" style={{ borderLeft: score >= 70 ? `2.5px solid ${C.danger}` : 'none' }}>
      <CardHead label="Retention Risk" icon={AlertTriangle} iconColor={color} />
      <div style={{ padding: '14px 16px' }}>
        {/* Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <svg width={88} height={66} viewBox="0 0 88 66" style={{ flexShrink: 0, overflow: 'visible' }}>
            {/* Track */}
            <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} strokeLinecap="round" />
            {/* Fill */}
            <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
              strokeDasharray={`${dashFill} ${dashTotal - dashFill}`}
              style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
            {/* Score */}
            <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize={20} fontWeight={700} fontFamily="DM Mono,monospace">{score}</text>
          </svg>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{label}</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Risk score / 100</div>
          </div>
        </div>

        {/* Risk factors */}
        {factors.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {factors.map(({ label: fl, sev }) => (
              <div key={fl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: C.t2 }}>{fl}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: sev === 'H' ? C.danger : C.warn, background: sev === 'H' ? C.dangerSub : C.warnSub, border: `1px solid ${sev === 'H' ? C.dangerBrd : C.warnBrd}`, borderRadius: 99, padding: '2px 8px', letterSpacing: '.06em' }}>{sev}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Snapshot Stats ───────────────────────────────────────────────────────────
function SnapshotStats({ cl, clientCheckIns, clientBookings }) {
  const stats = [
    { label: 'Total Sessions',  value: cl.total_sessions || clientBookings.length, mono: true },
    { label: 'Check-ins',       value: clientCheckIns.length, mono: true },
    { label: 'No-show Rate',    value: `${cl.no_show_rate}%`,   warn: cl.no_show_rate > 15, mono: true },
    { label: 'Completion',      value: `${cl.completion_pct}%`, warn: cl.completion_pct < 50, mono: true },
  ];
  return (
    <Card label="Snapshot" icon={BarChart2}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {stats.map(({ label, value, warn, mono }) => (
          <div key={label} style={{ padding: '10px 11px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
            <Lbl style={{ marginBottom: 5 }}>{label}</Lbl>
            <div className={mono ? 'mono' : ''} style={{ fontSize: 18, fontWeight: 500, color: warn ? C.danger : C.t1, letterSpacing: '-0.03em' }}>{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ onMessage, onBook, onAssign }) {
  const actions = [
    { label: 'Send check-in message', icon: MessageSquare, fn: onMessage },
    { label: 'Book next session',     icon: Calendar,      fn: onBook    },
    { label: 'Assign workout',        icon: Dumbbell,      fn: onAssign  },
  ];
  return (
    <Card label="Quick Actions" icon={Zap} iconColor={C.warn}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {actions.map(({ label, icon: Ic, fn }) => {
          const [hov, setHov] = useState(false);
          return (
            <button key={label} onClick={fn} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, background: hov ? C.surfaceEl : 'rgba(255,255,255,0.02)', border: `1px solid ${hov ? C.borderEl : C.border}`, fontSize: 12, fontWeight: 600, color: hov ? C.t1 : C.t2, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s', textAlign: 'left', width: '100%' }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic style={{ width: 11, height: 11, color: C.t3 }} />
              </div>
              {label}
              <ChevronRight style={{ width: 10, height: 10, marginLeft: 'auto', color: C.t4 }} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Weekly Frequency Bars ────────────────────────────────────────────────────
function FrequencyBars({ clientCheckIns }) {
  const weeks = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const end   = new Date(Date.now() - i * 7 * 86400000);
    const start = new Date(+end - 7 * 86400000);
    const count = clientCheckIns.filter(c => { const d = new Date(c.check_in_date); return d >= start && d < end; }).length;
    return { label: `W${8-i}`, count };
  }).reverse(), [clientCheckIns]);

  const max = Math.max(...weeks.map(w => w.count), 1);

  return (
    <Card label="Weekly Frequency" icon={BarChart2} sub="Check-ins per week (last 8 weeks)">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56 }}>
        {weeks.map((w, i) => {
          const pct = Math.max((w.count / max) * 100, 4);
          const color = w.count === 0 ? C.t4 : w.count < 2 ? C.warn : C.accent;
          const isLast = i === weeks.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span className="mono" style={{ fontSize: 10, fontWeight: 500, color, lineHeight: 1 }}>{w.count || ''}</span>
              <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: color, opacity: isLast ? 1 : 0.35, height: `${pct}%`, minHeight: 3, transformOrigin: 'bottom', animation: 'bar-grow .4s ease both', animationDelay: `${i * 30}ms` }} />
              <span style={{ fontSize: 8, fontWeight: 600, color: C.t4 }}>{w.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Main Display ─────────────────────────────────────────────────────────────
function ClientCommandCenter({
  client:         cl             = EMPTY_CLIENT,
  onMessage,
  onBook,
  onAssign,
  openModal,
  selectedGym,
  currentUser,
  clientCheckIns  = [],
  clientBookings  = [],
  clientWorkouts  = [],
}) {
  const [toast_, setToast] = useState(null);

  const act = key => {
    // Use explicit handlers if provided, otherwise fall back to openModal
    const map = {
      message: onMessage ?? (() => openModal?.('post')),
      book:    onBook    ?? (() => openModal?.('bookAppointment')),
      assign:  onAssign  ?? (() => openModal?.('assignWorkout')),
    };
    map[key]?.();
    const labels = { message: 'Opening messages…', book: 'Opening booking…', assign: 'Opening workouts…' };
    setToast(labels[key] || 'Action triggered');
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="ccc" id="ccc-scroll-root" style={{ background: C.bg, minHeight: '100vh', overflowY: 'auto' }}>
      <style>{GLOBAL_CSS}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast_ && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            style={{ position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: C.surfaceEl, border: `1px solid ${C.borderEl}`, borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 700, color: C.t1, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <Check style={{ width: 12, height: 12, color: C.success }} /> {toast_}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Command Bar ─────────────────────────────────────────────────── */}
      <CommandBar
        cl={cl}
        onMessage={() => act('message')}
        onBook={() => act('book')}
        onAssign={() => act('assign')}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '20px 28px 80px' }}>

        {/* Next Best Action — full width, always first */}
        <div style={{ marginBottom: 16 }}>
          <NextBestAction cl={cl} insights={[]} onAction={act} />
        </div>

        {/* Main grid: left content + right sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AttendanceHeatmap clientCheckIns={clientCheckIns} />
            <FrequencyBars clientCheckIns={clientCheckIns} />
            <EngagementTimeline clientBookings={clientBookings} clientCheckIns={clientCheckIns} />
            <SessionHistory clientBookings={clientBookings} onBook={() => act('book')} />
            <WorkoutEngagement clientWorkouts={clientWorkouts} onAssign={() => act('assign')} />
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 76 }}>
            <CriticalInsights cl={cl} clientBookings={clientBookings} clientCheckIns={clientCheckIns} onAction={act} />
            <BehaviorPatterns cl={cl} clientCheckIns={clientCheckIns} clientBookings={clientBookings} />
            <RetentionRisk cl={cl} />
            <SnapshotStats cl={cl} clientCheckIns={clientCheckIns} clientBookings={clientBookings} />
            <ClientInfo cl={cl} />
            <QuickActions onMessage={() => act('message')} onBook={() => act('book')} onAssign={() => act('assign')} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Client Picker + Data Wrapper (default export) ────────────────────────────
export default function TabCoachProfile({ selectedGym, currentUser, openModal, coach, bookings = [], checkIns = [], avatarMap = {} }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [search, setSearch] = useState('');

  // Build deduplicated client list from bookings
  const clientMap = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!b.client_id) return;
      if (!map[b.client_id]) map[b.client_id] = { id: b.client_id, name: b.client_name || 'Client', bookings: [] };
      map[b.client_id].bookings.push(b);
    });
    return map;
  }, [bookings]);

  const clients = useMemo(() => {
    const list = Object.values(clientMap);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(c => c.name.toLowerCase().includes(q));
  }, [clientMap, search]);

  // Fetch selected client's check-ins and assigned workouts
  const { data: clientCheckIns = [] } = useQuery({
    queryKey: ['clientCheckIns', selectedClientId],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: selectedClientId }, '-check_in_date', 120),
    enabled: !!selectedClientId,
    staleTime: 3 * 60 * 1000,
  });

  const { data: clientWorkouts = [] } = useQuery({
    queryKey: ['clientWorkouts', selectedClientId],
    queryFn: () => base44.entities.AssignedWorkout.filter({ member_id: selectedClientId }, '-assigned_date', 50),
    enabled: !!selectedClientId,
    staleTime: 3 * 60 * 1000,
  });

  const clientBookings = useMemo(() => bookings.filter(b => b.client_id === selectedClientId), [bookings, selectedClientId]);

  // Build a client shape that ClientCommandCenter expects
  const clientObj = useMemo(() => {
    const c = selectedClientId ? clientMap[selectedClientId] : null;
    if (!c) return EMPTY_CLIENT;
    const lastCI = clientCheckIns[0];
    const lastVisitDays = lastCI ? Math.floor((Date.now() - new Date(lastCI.check_in_date)) / 86400000) : 999;
    const weeklyVisits = clientCheckIns.filter(ci => (Date.now() - new Date(ci.check_in_date)) < 7 * 86400000).length;
    return {
      ...EMPTY_CLIENT,
      name:             c.name,
      avatar_url:       avatarMap[selectedClientId] || null,
      last_visit:       lastVisitDays === 0 ? 'Today' : lastVisitDays === 999 ? 'Never' : `${lastVisitDays}d ago`,
      total_sessions:   clientBookings.length,
      visits_per_week:  weeklyVisits,
      retention_status: lastVisitDays > 14 ? 'at_risk' : lastVisitDays > 7 ? 'declining' : 'healthy',
      trend:            lastVisitDays > 14 ? 'declining' : 'stable',
      streak: clientCheckIns.reduce((n, _, i) => {
        if (i === 0) return 1;
        const diff = (new Date(clientCheckIns[i-1].check_in_date) - new Date(clientCheckIns[i].check_in_date)) / 86400000;
        return diff <= 2 ? n + 1 : n;
      }, clientCheckIns.length > 0 ? 1 : 0),
    };
  }, [selectedClientId, clientMap, clientCheckIns, clientBookings, avatarMap]);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!bookings.length) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <style>{GLOBAL_CSS}</style>
        <div className="ccc" style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.t1, marginBottom: 8 }}>No clients yet</div>
          <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, marginBottom: 20 }}>Book clients into your classes to see their performance here.</div>
          <button className="action-primary" onClick={() => openModal?.('classes')}>Manage Classes</button>
        </div>
      </div>
    );
  }

  // ── Client picker ────────────────────────────────────────────────────────────
  if (!selectedClientId) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 28px 80px' }}>
        <style>{GLOBAL_CSS}</style>
        <div className="ccc" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em', marginBottom: 4 }}>Client Profile</div>
            <div style={{ fontSize: 13, color: C.t2 }}>Select a client to view their full performance dashboard.</div>
          </div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 38px', borderRadius: 10, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t1, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.t3 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {clients.map(c => {
              const lastB = c.bookings.sort((a, b) => new Date(b.session_date) - new Date(a.session_date))[0];
              const lastDate = lastB?.session_date ? new Date(lastB.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
              return (
                <button key={c.id} onClick={() => setSelectedClientId(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.borderEl}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.accentSub, border: `1px solid ${C.accentBrd}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.accent, overflow: 'hidden' }}>
                    {avatarMap[c.id] ? <img src={avatarMap[c.id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : ini(c.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{c.bookings.length} session{c.bookings.length !== 1 ? 's' : ''} · Last: {lastDate}</div>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: C.t3, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Client detail ────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ background: C.bg, padding: '8px 28px 0', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setSelectedClientId(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.t2, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = C.t1}
          onMouseLeave={e => e.currentTarget.style.color = C.t2}
        >
          <ChevronRight style={{ width: 13, height: 13, transform: 'rotate(180deg)' }} /> All Clients
        </button>
      </div>
      <ClientCommandCenter
        client={clientObj}
        openModal={openModal}
        selectedGym={selectedGym}
        currentUser={currentUser}
        clientCheckIns={clientCheckIns}
        clientBookings={clientBookings}
        clientWorkouts={clientWorkouts}
      />
    </div>
  );
}
