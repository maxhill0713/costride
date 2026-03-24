import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Dumbbell, Calendar, Users, Star, Image as ImageIcon,
  MapPin, Tag, ShieldCheck, ChevronRight, ExternalLink,
  Settings, Camera, AlertTriangle, Copy, Check,
  Sparkles, CheckCircle, Info, Activity, TrendingUp,
  Bell, Lock, CreditCard, Plus, Edit2, Zap,
  ArrowUpRight, BarChart2, Clock, Shield, Gift, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';

const T = {
  blue:    '#06b6d4', green:  '#10b981', red:    '#ef4444',
  amber:   '#06b6d4', purple: '#06b6d4', cyan:   '#06b6d4',
  text1:   '#f0f4f8', text2:  '#94a3b8', text3:  '#475569',
  border:  'rgba(255,255,255,0.07)', borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120', card2:  '#0d1630', divider: 'rgba(255,255,255,0.05)',
};

function SCard({ children, style = {}, accent, noPad }) {
  const c = accent || T.cyan;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, position: 'relative', overflow: 'hidden', ...(noPad ? {} : { padding: 20 }), ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${c}30,transparent)`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

function Toggle({ value, onChange, color = T.cyan }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', background: value ? color : 'rgba(255,255,255,0.1)', fontFamily: 'inherit' }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(value || ''); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <button onClick={handleCopy}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: copied ? `${T.green}14` : T.divider, border: `1px solid ${copied ? T.green + '28' : T.border}`, color: copied ? T.green : T.text3, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
      {copied ? <Check style={{ width: 9, height: 9 }} /> : <Copy style={{ width: 9, height: 9 }} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// Circular SVG health gauge
function HealthGauge({ score, color }) {
  const r = 48, cx = 58, cy = 58, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const tier = score >= 80 ? 'Top 20%' : score >= 65 ? 'Above avg' : score >= 50 ? 'Needs work' : 'Starting';
  return (
    <div style={{ position: 'relative', width: 116, height: 116, flexShrink: 0 }}>
      <svg width="116" height="116" viewBox="0 0 116 116">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.divider} strokeWidth={7} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 5px ${color}55)` }} />
        {[25, 50, 75].map(v => {
          const angle = (v / 100) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + (r - 11) * Math.cos(rad), y1 = cy + (r - 11) * Math.sin(rad);
          const x2 = cx + (r - 6)  * Math.cos(rad), y2 = cy + (r - 6)  * Math.sin(rad);
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.border} strokeWidth={1.5} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: T.text1, letterSpacing: '-0.05em', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color, marginTop: 3 }}>{tier}</div>
      </div>
    </div>
  );
}

function GymHealthCard({ selectedGym, classes, coaches, checkIns, allMemberships, atRisk, retentionRate, now, openModal }) {
  const totalMembers = allMemberships?.length || 0;
  const ci30 = (checkIns || []).filter(c => {
    const d = new Date(c.check_in_date), cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30); return d >= cutoff;
  });
  const checks = useMemo(() => [
    { label: 'Hero photo',         done: !!selectedGym?.image_url,   color: T.cyan,    cta: 'Add photo',  action: 'heroPhoto' },
    { label: 'Class added',        done: (classes?.length||0) > 0,   color: T.green,   cta: 'Add class',  action: 'classes'   },
    { label: 'Coach added',        done: (coaches?.length||0) > 0,   color: T.cyan,  cta: 'Add coach',  action: 'coaches'   },
    { label: 'Members joined',     done: totalMembers > 0,           color: T.cyan,   cta: 'Add member', action: 'members'   },
    { label: 'Retention ≥ 70%',    done: retentionRate >= 70,        color: T.green,   cta: null,         action: null        },
    { label: 'No at-risk members', done: atRisk === 0,               color: T.red,     cta: 'Message',    action: 'message'   },
    { label: 'Check-ins recorded', done: ci30.length > 0,            color: '#06b6d4', cta: 'Scan QR',    action: 'qrScanner' },
    { label: 'Gym verified',       done: !!selectedGym?.verified,    color: T.cyan,    cta: null,         action: null        },
  ], [selectedGym, classes, coaches, totalMembers, retentionRate, atRisk, ci30]);

  const score = useMemo(() => {
    let s = 0;
    if (selectedGym?.image_url) s += 10; if (selectedGym?.logo_url) s += 5;
    if (classes?.length > 0)    s += 15; if (coaches?.length > 0)   s += 15;
    if (totalMembers > 0)       s += 20; if (retentionRate >= 70)    s += 20;
    if (atRisk === 0)           s += 10; if (ci30.length > 0)        s += 5;
    return Math.min(100, s);
  }, [selectedGym, classes, coaches, totalMembers, retentionRate, atRisk, ci30]);

  const scoreColor = score >= 75 ? T.green : score >= 50 ? T.cyan : T.red;
  const done = checks.filter(c => c.done).length;

  return (
    <SCard accent={scoreColor}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
        <HealthGauge score={score} color={scoreColor} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text1, marginBottom: 3 }}>Gym Health Score</div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>Setup completion & live performance</div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {checks.map((c, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: c.done ? c.color : T.divider, transition: 'background 0.4s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: T.text3 }}>{done}/{checks.length} complete</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>
              {score >= 75 ? '✓ Fully configured' : `${checks.length - done} remaining`}
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: c.done ? `${c.color}08` : T.divider, border: `1px solid ${c.done ? c.color + '18' : T.border}` }}>
            {c.done
              ? <CheckCircle style={{ width: 11, height: 11, color: c.color, flexShrink: 0 }} />
              : <div style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${T.border}`, flexShrink: 0 }} />
            }
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: c.done ? T.text2 : T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
            {!c.done && c.action && (
              <button onClick={() => openModal(c.action)}
                style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, color: c.color, background: `${c.color}12`, border: `1px solid ${c.color}25`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {c.cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </SCard>
  );
}

function LiveStatsStrip({ allMemberships, checkIns, atRisk, retentionRate, now }) {
  const totalMembers = allMemberships?.length || 0;
  const ci30 = (checkIns || []).filter(c => { const d = new Date(c.check_in_date), cut = new Date(now); cut.setDate(cut.getDate() - 30); return d >= cut; }).length;
  const weekSet = new Set((checkIns || []).filter(c => { const d = new Date(c.check_in_date), cut = new Date(now); cut.setDate(cut.getDate() - 7); return d >= cut; }).map(c => c.user_id));
  const stats = [
    { label: 'Members',       value: totalMembers, color: T.cyan,   icon: Users,     sub: 'enrolled' },
    { label: 'Active / week', value: weekSet.size,  color: T.green,  icon: Activity,  sub: 'last 7 days' },
    { label: 'Check-ins',     value: ci30,          color: T.cyan,   icon: BarChart2, sub: 'this month' },
    { label: 'Retention',     value: `${retentionRate}%`, color: retentionRate >= 70 ? T.green : T.cyan, icon: TrendingUp, sub: retentionRate >= 70 ? 'Healthy' : 'Below target' },
    { label: 'At Risk',       value: atRisk,         color: atRisk > 0 ? T.red : T.green, icon: Zap, sub: atRisk > 0 ? '14+ days out' : 'All clear' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: '14px 14px 12px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${s.color}28,transparent)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon style={{ width: 10, height: 10, color: s.color }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
          <div style={{ fontSize: 9, color: T.text3, fontWeight: 500 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function ManageGrid({ classes, coaches, selectedGym, openModal }) {
  const items = [
    { icon: Calendar, label: 'Classes',   count: classes.length,                      unit: 'on schedule',  color: T.green,  fn: () => openModal('classes'),   desc: 'Manage your class timetable and capacity'  },
    { icon: Users,    label: 'Coaches',   count: coaches.length,                      unit: 'active',       color: T.cyan,   fn: () => openModal('coaches'),   desc: 'Assign coaches to classes and members'     },
    { icon: Dumbbell, label: 'Equipment', count: selectedGym?.equipment?.length || 0, unit: 'items',        color: T.cyan, fn: () => openModal('equipment'), desc: 'Keep your equipment inventory current'     },
    { icon: Star,     label: 'Amenities', count: selectedGym?.amenities?.length || 0, unit: 'listed',       color: T.cyan,  fn: () => openModal('amenities'), desc: 'Highlight what makes your gym stand out'   },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
      {items.map(({ icon: Icon, label, count, unit, color, fn, desc }, i) => (
        <button key={i} onClick={fn}
          style={{ padding: '16px 16px 14px', borderRadius: 11, cursor: 'pointer', background: T.card2, border: `1px solid ${T.border}`, textAlign: 'left', position: 'relative', overflow: 'hidden', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card2; e.currentTarget.style.transform = ''; }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}25,transparent)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}14`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 15, height: 15, color }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: T.divider, border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 800, color }}>{count}</span>
              <span style={{ fontSize: 9, color: T.text3 }}>{unit}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.4, marginBottom: 10 }}>{desc}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>Manage</span>
            <ChevronRight style={{ width: 11, height: 11, color }} />
          </div>
        </button>
      ))}
    </div>
  );
}

function PricingSection({ selectedGym, openModal }) {
  const tiers = selectedGym?.membership_tiers || [];
  const display = tiers.length > 0 ? tiers : [
    { name: 'Monthly',  price: selectedGym?.price || null, description: 'Rolling monthly', color: T.cyan   },
    { name: 'Annual',   price: null,                       description: 'Save 2 months',   color: T.green  },
    { name: 'Day Pass', price: null,                       description: 'Pay per visit',   color: T.cyan },
  ];
  return (
    <SCard accent={T.green}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${T.green}14`, border: `1px solid ${T.green}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard style={{ width: 13, height: 13, color: T.green }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Membership Pricing</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Shown to prospects on your public page</div>
          </div>
        </div>
        <button onClick={() => openModal('pricing')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: T.green, background: `${T.green}10`, border: `1px solid ${T.green}28`, borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Edit2 style={{ width: 10, height: 10 }} /> Edit
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {display.map((tier, i) => (
          <div key={i} style={{ padding: '16px 14px', borderRadius: 10, background: tier.price ? `${tier.color}08` : T.divider, border: `1px solid ${tier.price ? tier.color + '20' : T.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${tier.color}22,transparent)`, pointerEvents: 'none' }} />
            <div style={{ fontSize: 9, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{tier.name}</div>
            {tier.price ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: tier.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>£{tier.price}<span style={{ fontSize: 11, fontWeight: 500, color: T.text3 }}>/mo</span></div>
                <div style={{ fontSize: 10, color: T.text3 }}>{tier.description}</div>
              </>
            ) : (
              <>
                <button onClick={() => openModal('pricing')}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: tier.color, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 4 }}>
                  <Plus style={{ width: 11, height: 11 }} /> Set price
                </button>
                <div style={{ fontSize: 10, color: T.text3 }}>{tier.description}</div>
              </>
            )}
          </div>
        ))}
      </div>
      {tiers.length === 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: `${T.cyan}08`, border: `1px solid ${T.cyan}18`, display: 'flex', alignItems: 'center', gap: 7 }}>
          <AlertTriangle style={{ width: 11, height: 11, color: T.cyan, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.cyan, fontWeight: 600 }}>No pricing set — prospects can't see what you charge</span>
        </div>
      )}
    </SCard>
  );
}

function NudgeSettings({ settings, onUpdate }) {
  const update = (key, val) => onUpdate({ ...settings, [key]: val });
  const sections = [
    { label: 'Dashboard panels', rows: [
      { key: 'showTodayPanel',         label: "Today's action panel",    sub: 'Daily priority actions on Overview',        color: T.cyan   },
      { key: 'showContentSuggestions', label: 'Content suggestions',     sub: 'When to post, run polls, start challenges', color: T.cyan },
      { key: 'showDropOffMap',         label: 'Drop-off risk map',       sub: 'Lifecycle churn breakdown',                 color: T.red    },
    ]},
    { label: 'Member alerts', rows: [
      { key: 'showStreakRecovery', label: 'Streak recovery prompts',   sub: 'Surface members who broke a streak',      color: T.cyan  },
      { key: 'showClassLoyalty',  label: 'Class dependency warnings', sub: 'Members attending only one coach/class',  color: '#06b6d4'},
      { key: 'showReferrals',     label: 'Referral tracking',         sub: 'Track who brings in new sign-ups',        color: T.cyan },
    ]},
  ];
  return (
    <SCard accent={T.cyan}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${T.cyan}14`, border: `1px solid ${T.cyan}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell style={{ width: 13, height: 13, color: T.cyan }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Notifications & Smart Nudges</div>
          <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Customise what the dashboard surfaces and when</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map((section, si) => (
          <div key={si}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.divider}` }}>{section.label}</div>
            {section.rows.map((r, i) => (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < section.rows.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{r.sub}</div>
                </div>
                <Toggle value={settings[r.key]} onChange={v => update(r.key, v)} color={r.color} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 8, background: `${T.cyan}06`, border: `1px solid ${T.cyan}14`, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        <Info style={{ width: 11, height: 11, color: T.cyan, flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.5 }}>Disabling a nudge hides it from the dashboard — it does not affect the underlying data or automations.</div>
      </div>
    </SCard>
  );
}

function AdminCard({ selectedGym, openModal }) {
  const statusVerified = selectedGym?.verified;
  return (
    <SCard accent={T.cyan} noPad>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Admin</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: `1px solid ${T.divider}` }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${T.cyan}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield style={{ width: 10, height: 10, color: T.cyan }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>Owner email</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{selectedGym?.owner_email || '—'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: `1px solid ${T.divider}` }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${T.cyan}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock style={{ width: 10, height: 10, color: T.cyan }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>Gym ID</div>
            <div style={{ fontSize: 9, color: T.text3, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{selectedGym?.id || '—'}</div>
          </div>
          <CopyButton value={selectedGym?.id} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${statusVerified ? T.green : T.cyan}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck style={{ width: 10, height: 10, color: statusVerified ? T.green : T.cyan }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>Verification</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: statusVerified ? T.green : T.cyan, marginTop: 1 }}>
              {statusVerified ? '✓ Verified & live' : 'Pending — 1–2 business days'}
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: T.border }} />
      <div style={{ padding: '12px 18px' }}>
        <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
          <button style={{ width: '100%', padding: '9px 14px', borderRadius: 9, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.text1; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.divider; e.currentTarget.style.color = T.text2; }}>
            <ExternalLink style={{ width: 11, height: 11 }} /> View Public Page
          </button>
        </Link>
      </div>
    </SCard>
  );
}

function PhotosCard({ selectedGym, openModal }) {
  return (
    <SCard accent={T.cyan}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Photos</div>
          <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Hero image & gallery</div>
        </div>
        <button onClick={() => openModal('photos')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: T.cyan, background: `${T.cyan}0a`, border: `1px solid ${T.cyan}22`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Camera style={{ width: 10, height: 10 }} /> Manage
        </button>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Hero</div>
      {selectedGym?.image_url ? (
        <div style={{ borderRadius: 9, overflow: 'hidden', height: 96, cursor: 'pointer', border: `1px solid ${T.border}`, marginBottom: 10 }} onClick={() => openModal('heroPhoto')}>
          <img src={selectedGym.image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div onClick={() => openModal('heroPhoto')}
          style={{ height: 96, borderRadius: 9, border: `2px dashed ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'border-color 0.15s', marginBottom: 10 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = `${T.cyan}40`}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
          <ImageIcon style={{ width: 16, height: 16, color: `${T.cyan}60` }} />
          <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>Add hero photo</span>
        </div>
      )}
      {selectedGym?.gallery?.length > 0 ? (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Gallery</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
            {selectedGym.gallery.slice(0, 6).map((url, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div onClick={() => openModal('photos')}
          style={{ height: 62, borderRadius: 8, border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = `${T.cyan}40`}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
          <Plus style={{ width: 11, height: 11, color: T.text3 }} />
          <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>Add gallery photos</span>
        </div>
      )}
    </SCard>
  );
}

const REWARD_TYPES = { discount: 'Discount', free_class: 'Free Class', merchandise: 'Merchandise', free_day_pass: 'Day Pass', personal_training: 'PT Session', custom: 'Custom' };
const REWARD_REQS  = { check_ins_10: '10 Check-ins', check_ins_50: '50 Check-ins', streak_30: '30-day Streak', challenge_winner: 'Challenge Winner', referral: 'Referral', points: 'Points', none: 'Always Available' };

function RewardsCatalogueCard({ rewards = [], onCreateReward, onDeleteReward, isLoading }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'discount', requirement: 'check_ins_10', value: '', points_required: 0, icon: '🎁', active: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.title.trim()) return;
    onCreateReward(form);
    setForm({ title: '', type: 'discount', requirement: 'check_ins_10', value: '', points_required: 0, icon: '🎁', active: true });
    setShowForm(false);
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.text1, fontSize: 12, outline: 'none', fontFamily: 'inherit' };
  const selStyle   = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

  return (
    <SCard accent={T.cyan}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${T.cyan}14`, border: `1px solid ${T.cyan}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift style={{ width: 13, height: 13, color: T.cyan }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Rewards Catalogue</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{rewards.length} reward{rewards.length !== 1 ? 's' : ''} available to members</div>
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: showForm ? T.text3 : T.cyan, background: showForm ? T.divider : `${T.cyan}10`, border: `1px solid ${showForm ? T.border : T.cyan + '28'}`, borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
          <Plus style={{ width: 10, height: 10 }} /> {showForm ? 'Cancel' : 'Add Reward'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: `${T.cyan}06`, border: `1px solid ${T.cyan}18`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Title *</div>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Free Protein Shake" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Value</div>
              <input value={form.value} onChange={e => set('value', e.target.value)} placeholder="e.g. £10 off, 1 free class" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Type</div>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={selStyle}>
                {Object.entries(REWARD_TYPES).map(([k, v]) => <option key={k} value={k} style={{ background: '#0b1120' }}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Requirement</div>
              <select value={form.requirement} onChange={e => set('requirement', e.target.value)} style={selStyle}>
                {Object.entries(REWARD_REQS).map(([k, v]) => <option key={k} value={k} style={{ background: '#0b1120' }}>{v}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={!form.title.trim() || isLoading}
            style={{ alignSelf: 'flex-end', padding: '7px 18px', borderRadius: 8, background: form.title.trim() ? T.cyan : 'rgba(255,255,255,0.06)', color: form.title.trim() ? '#fff' : T.text3, border: 'none', fontSize: 12, fontWeight: 700, cursor: form.title.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            {isLoading ? 'Adding…' : 'Add Reward'}
          </button>
        </div>
      )}

      {/* Reward list */}
      {rewards.length === 0 && !showForm ? (
        <div style={{ padding: '20px', textAlign: 'center', border: `2px dashed ${T.border}`, borderRadius: 10 }}>
          <Gift style={{ width: 20, height: 20, color: T.text3, margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <div style={{ fontSize: 12, color: T.text3 }}>No rewards yet — add one to motivate members</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rewards.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: r.active ? `${T.cyan}06` : T.divider, border: `1px solid ${r.active ? T.cyan + '18' : T.border}`, opacity: r.active ? 1 : 0.55 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon || '🎁'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.cyan, background: `${T.cyan}12`, border: `1px solid ${T.cyan}22`, borderRadius: 4, padding: '1px 5px' }}>{REWARD_TYPES[r.type] || r.type}</span>
                  <span style={{ fontSize: 9, color: T.text3 }}>{REWARD_REQS[r.requirement] || r.requirement}</span>
                  {r.value && <span style={{ fontSize: 9, color: T.green, fontWeight: 600 }}>{r.value}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: T.text3 }}>{(r.claimed_by || []).length} claimed</span>
                <button onClick={() => onDeleteReward(r.id)}
                  style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', color: T.red }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}>
                  <Trash2 style={{ width: 10, height: 10 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabGym({
  selectedGym, classes, coaches, openModal,
  checkIns = [], allMemberships = [], atRisk = 0, retentionRate = 0,
  rewards = [], onCreateReward, onDeleteReward, isLoading,
  atRiskDays: atRiskDaysProp = 14, onAtRiskDaysChange,
}) {
  const now = new Date();
  const statusVerified = selectedGym?.verified;
  const [nudgeSettings, setNudgeSettings] = useState({
    showTodayPanel: true, showContentSuggestions: true,
    showStreakRecovery: true, showDropOffMap: true,
    showReferrals: true, showClassLoyalty: true,
  });
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── HERO ── */}
      <div style={{ borderRadius: 14, overflow: 'hidden', background: T.card, border: `1px solid ${T.border}`, position: 'relative' }}>
        <div style={{ height: 136, position: 'relative', background: 'linear-gradient(135deg,#070e1c 0%,#0d1a36 50%,#070e1c 100%)', overflow: 'hidden' }}>
          {selectedGym?.image_url && <img src={selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,${T.card}e0 100%)` }} />
          <button onClick={() => openModal('heroPhoto')}
            style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit' }}>
            <Camera style={{ width: 10, height: 10 }} /> Edit Hero
          </button>
        </div>
        <div style={{ padding: '0 20px 18px', marginTop: -16, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div onClick={() => openModal('logo')}
                style={{ width: 56, height: 56, borderRadius: 14, background: T.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${T.cyan}35`, border: `3px solid ${T.card}`, flexShrink: 0, cursor: 'pointer' }}>
                {selectedGym?.logo_url
                  ? <img src={selectedGym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }} />
                  : <Dumbbell style={{ width: 22, height: 22, color: '#fff' }} />}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.text1, letterSpacing: '-0.03em', lineHeight: 1 }}>{selectedGym?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  {selectedGym?.type && <span style={{ fontSize: 11, color: T.text3 }}>{selectedGym.type}</span>}
                  {selectedGym?.city && (<><span style={{ width: 3, height: 3, borderRadius: '50%', background: T.text3, display: 'inline-block' }} /><span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.text3 }}><MapPin style={{ width: 10, height: 10 }} />{selectedGym.city}</span></>)}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: statusVerified ? `${T.green}12` : `${T.cyan}12`, border: `1px solid ${statusVerified ? T.green + '25' : T.cyan + '25'}`, cursor: statusVerified ? 'default' : 'help' }}
                    title={statusVerified ? 'Your gym is live and visible to members' : 'Your gym will be visible once verified — typically 1–2 business days'}>
                    <ShieldCheck style={{ width: 9, height: 9, color: statusVerified ? T.green : T.cyan }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: statusVerified ? T.green : T.cyan }}>{statusVerified ? 'Verified' : 'Pending'}</span>
                    {!statusVerified && <Info style={{ width: 8, height: 8, color: T.cyan, opacity: 0.7 }} />}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => openModal('editInfo')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: `${T.cyan}12`, color: T.cyan, border: `1px solid ${T.cyan}25`, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = `${T.cyan}22`}
              onMouseLeave={e => e.currentTarget.style.background = `${T.cyan}12`}>
              <Settings style={{ width: 11, height: 11 }} /> Edit Info
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 16 }}>
            {[
              { label: 'Monthly Price', value: selectedGym?.price ? `£${selectedGym.price}/mo` : 'Not set', icon: Tag,         color: selectedGym?.price ? T.text1 : T.cyan },
              { label: 'Address',       value: selectedGym?.address || '—',                                  icon: MapPin,      color: T.text1 },
              { label: 'Postcode',      value: selectedGym?.postcode || '—',                                 icon: MapPin,      color: T.text1 },
              { label: 'Status',        value: statusVerified ? 'Verified' : 'Pending',                      icon: ShieldCheck, color: statusVerified ? T.green : T.cyan },
            ].map((f, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: T.divider, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <f.icon style={{ width: 9, height: 9, color: T.text3 }} />
                  <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text3 }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: f.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIVE STATS ── */}
      <LiveStatsStrip allMemberships={allMemberships} checkIns={checkIns} atRisk={atRisk} retentionRate={retentionRate} now={now} />

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GymHealthCard
            selectedGym={selectedGym} classes={classes} coaches={coaches}
            checkIns={checkIns} allMemberships={allMemberships}
            atRisk={atRisk} retentionRate={retentionRate} now={now} openModal={openModal}
          />
          <SCard accent={T.cyan} noPad style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px 10px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 1 }}>Manage</div>
              <div style={{ fontSize: 10, color: T.text3 }}>Classes, coaches, equipment and amenities</div>
            </div>
            <div style={{ padding: '0 12px 12px' }}>
              <ManageGrid classes={classes} coaches={coaches} selectedGym={selectedGym} openModal={openModal} />
            </div>
          </SCard>
          <PricingSection selectedGym={selectedGym} openModal={openModal} />
          {/* Danger Zone */}
          <div style={{ borderRadius: 12, border: `1px solid ${T.red}18`, background: `${T.red}04`, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${T.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: 12, height: 12, color: T.red }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Danger Zone</div>
                <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>These actions are permanent and cannot be undone</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { title: 'Delete Gym',     desc: 'Remove all gym data permanently',  fn: () => openModal('deleteGym')     },
                { title: 'Delete Account', desc: 'Remove account and all gyms',      fn: () => openModal('deleteAccount') },
              ].map((d, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 9, background: T.divider, border: `1px solid ${T.red}10`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, marginBottom: 3 }}>{d.title}</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>{d.desc}</div>
                  </div>
                  <button onClick={d.fn}
                    style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 7, background: `${T.red}10`, color: '#ef4444', border: `1px solid ${T.red}20`, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${T.red}22`; e.currentTarget.style.color = T.red; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${T.red}10`; e.currentTarget.style.color = '#ef4444'; }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PhotosCard selectedGym={selectedGym} openModal={openModal} />
          <AdminCard selectedGym={selectedGym} openModal={openModal} />
          <SCard accent={T.cyan}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { icon: Users,    label: 'Add a member',    color: T.green,  fn: () => openModal('members')   },
                { icon: Calendar, label: 'Add a class',     color: T.cyan,   fn: () => openModal('classes')   },
                { icon: Star,     label: 'Manage amenities',color: T.cyan,  fn: () => openModal('amenities') },
                { icon: Camera,   label: 'Upload photos',   color: T.cyan, fn: () => openModal('photos')    },
              ].map(({ icon: Icon, label, color, fn }, i) => {
                const [hov, setHov] = useState(false);
                return (
                  <button key={i} onClick={fn}
                    onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 9, background: hov ? `${color}10` : T.divider, border: `1px solid ${hov ? color + '30' : T.border}`, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 11, height: 11, color }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: hov ? T.text1 : T.text2, flex: 1, textAlign: 'left' }}>{label}</span>
                    <ChevronRight style={{ width: 11, height: 11, color: hov ? color : T.text3 }} />
                  </button>
                );
              })}
            </div>
          </SCard>
        </div>
      </div>

      {/* ── SAVE BAR ── */}
      <div style={{ position: 'sticky', bottom: 16, zIndex: 20 }}>
        <div style={{ background: `${T.card}f2`, backdropFilter: 'blur(20px)', border: `1px solid ${T.borderM}`, borderRadius: 12, padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>Settings updated</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Changes apply to your dashboard immediately</div>
          </div>
          <button onClick={handleSave}
            style={{ padding: '8px 20px', borderRadius: 9, background: saved ? `${T.green}14` : `${T.cyan}18`, color: saved ? T.green : T.text1, border: saved ? `1px solid ${T.green}30` : `1px solid ${T.cyan}35`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            {saved ? <><Check style={{ width: 12, height: 12 }} /> Saved</> : <><Settings style={{ width: 11, height: 11 }} /> Save Changes</>}
          </button>
        </div>
      </div>

    </div>
  );
}