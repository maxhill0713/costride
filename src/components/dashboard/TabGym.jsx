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
import InviteStaffPanel from './InviteStaffPanel';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

function SCard({ children, style = {}, noPad }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, position: 'relative', overflow: 'hidden', ...(noPad ? {} : { padding: 20 }), ...style }}>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, color = C.accent }) {
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
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: copied ? `${C.success}14` : C.divider, border: `1px solid ${copied ? C.success + '28' : C.border}`, color: copied ? C.success : C.t3, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }}>
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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.divider} strokeWidth={7} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 5px ${color}55)` }} />
        {[25, 50, 75].map(v => {
          const angle = (v / 100) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + (r - 11) * Math.cos(rad), y1 = cy + (r - 11) * Math.sin(rad);
          const x2 = cx + (r - 6)  * Math.cos(rad), y2 = cy + (r - 6)  * Math.sin(rad);
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.border} strokeWidth={1.5} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.t1, letterSpacing: '-0.05em', lineHeight: 1 }}>{score}</div>
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
    { label: 'Hero photo',         done: !!selectedGym?.image_url,   cta: 'Add photo',  action: 'heroPhoto' },
    { label: 'Class added',        done: (classes?.length||0) > 0,   cta: 'Add class',  action: 'classes'   },
    { label: 'Coach added',        done: (coaches?.length||0) > 0,   cta: 'Add coach',  action: 'coaches'   },
    { label: 'Members joined',     done: totalMembers > 0,           cta: 'Add member', action: 'members'   },
    { label: 'Retention ≥ 70%',    done: retentionRate >= 70,        cta: null,         action: null        },
    { label: 'No at-risk members', done: atRisk === 0,               cta: 'Message',    action: 'message'   },
    { label: 'Check-ins recorded', done: ci30.length > 0,            cta: 'Scan QR',    action: 'qrScanner' },
    { label: 'Gym verified',       done: !!selectedGym?.verified,    cta: null,         action: null        },
  ], [selectedGym, classes, coaches, totalMembers, retentionRate, atRisk, ci30]);

  const score = useMemo(() => {
    let s = 0;
    if (selectedGym?.image_url) s += 10; if (selectedGym?.logo_url) s += 5;
    if (classes?.length > 0)    s += 15; if (coaches?.length > 0)   s += 15;
    if (totalMembers > 0)       s += 20; if (retentionRate >= 70)    s += 20;
    if (atRisk === 0)           s += 10; if (ci30.length > 0)        s += 5;
    return Math.min(100, s);
  }, [selectedGym, classes, coaches, totalMembers, retentionRate, atRisk, ci30]);

  const scoreColor = score >= 75 ? C.success : score >= 50 ? C.accent : C.danger;
  const done = checks.filter(c => c.done).length;

  return (
    <SCard accent={scoreColor}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
        <HealthGauge score={score} color={scoreColor} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, marginBottom: 3 }}>Gym Health Score</div>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>Setup completion & live performance</div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {checks.map((c, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: c.done ? C.success : C.divider, transition: 'background 0.4s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: C.t3 }}>{done}/{checks.length} complete</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>
              {score >= 75 ? '✓ Fully configured' : `${checks.length - done} remaining`}
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: C.divider, border: `1px solid ${C.border}` }}>
            {c.done
              ? <CheckCircle style={{ width: 11, height: 11, color: C.success, flexShrink: 0 }} />
              : <div style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${C.border}`, flexShrink: 0 }} />
            }
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: c.done ? C.t2 : C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
            {!c.done && c.action && (
              <button onClick={() => openModal(c.action)}
                style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, color: C.accent, background: `${C.accent}12`, border: `1px solid ${C.accent}25`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit' }}>
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
    { label: 'Members',       value: totalMembers,        color: C.t1,                                icon: Users,     sub: 'enrolled',                                   semantic: false },
    { label: 'Active / week', value: weekSet.size,         color: C.t1,                                icon: Activity,  sub: 'last 7 days',                                semantic: false },
    { label: 'Check-ins',     value: ci30,                 color: C.t1,                                icon: BarChart2, sub: 'this month',                                 semantic: false },
    { label: 'Retention',     value: `${retentionRate}%`,  color: retentionRate >= 70 ? C.success : C.warn, icon: TrendingUp, sub: retentionRate >= 70 ? 'Healthy' : 'Below target', semantic: true },
    { label: 'At Risk',       value: atRisk,               color: atRisk > 0 ? C.danger : C.success,           icon: Zap,       sub: atRisk > 0 ? '14+ days out' : 'All clear',    semantic: true },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: '14px 14px 12px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.divider, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon style={{ width: 10, height: 10, color: C.t3 }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
          <div style={{ fontSize: 9, color: C.t3, fontWeight: 500 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function ManageGrid({ classes, coaches, selectedGym, openModal }) {
  const items = [
    { icon: Calendar, label: 'Classes',   count: classes.length,                      unit: 'on schedule',  color: C.accent, fn: () => openModal('classes'),   desc: 'Manage your class timetable and capacity'  },
    { icon: Users,    label: 'Coaches',   count: coaches.length,                      unit: 'active',       color: C.accent, fn: () => openModal('coaches'),   desc: 'Assign coaches to classes and members'     },
    { icon: Dumbbell, label: 'Equipment', count: selectedGym?.equipment?.length || 0, unit: 'items',        color: C.accent, fn: () => openModal('equipment'), desc: 'Keep your equipment inventory current'     },
    { icon: Star,     label: 'Amenities', count: selectedGym?.amenities?.length || 0, unit: 'listed',       color: C.accent, fn: () => openModal('amenities'), desc: 'Highlight what makes your gym stand out'   },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
      {items.map(({ icon: Icon, label, count, unit, fn, desc }, i) => (
        <button key={i} onClick={fn}
          style={{ padding: '16px 16px 14px', borderRadius: 11, cursor: 'pointer', background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'left', position: 'relative', fontFamily: 'inherit', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderEl; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surfaceEl; e.currentTarget.style.transform = ''; }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: C.divider, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 15, height: 15, color: C.t3 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: C.divider, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>{count}</span>
              <span style={{ fontSize: 9, color: C.t3 }}>{unit}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.4, marginBottom: 10 }}>{desc}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>Manage</span>
            <ChevronRight style={{ width: 11, height: 11, color: C.accent }} />
          </div>
        </button>
      ))}
    </div>
  );
}

function PricingSection({ selectedGym, openModal }) {
  const tiers = selectedGym?.membership_tiers || [];
  const display = tiers.length > 0 ? tiers : [
    { name: 'Monthly',  price: selectedGym?.price || null, description: 'Rolling monthly', color: C.accent   },
    { name: 'Annual',   price: null,                       description: 'Save 2 months',   color: C.success  },
    { name: 'Day Pass', price: null,                       description: 'Pay per visit',   color: C.accent },
  ];
  return (
    <SCard accent={C.accent}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.divider, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard style={{ width: 13, height: 13, color: C.t3 }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Membership Pricing</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Shown to prospects on your public page</div>
          </div>
        </div>
        <button onClick={() => openModal('pricing')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.accent, background: `${C.accent}10`, border: `1px solid ${C.accent}28`, borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Edit2 style={{ width: 10, height: 10 }} /> Edit
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {display.map((tier, i) => (
          <div key={i} style={{ padding: '16px 14px', borderRadius: 10, background: tier.price ? 'rgba(255,255,255,0.03)' : C.divider, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{tier.name}</div>
            {tier.price ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>£{tier.price}<span style={{ fontSize: 11, fontWeight: 500, color: C.t3 }}>/mo</span></div>
                <div style={{ fontSize: 10, color: C.t3 }}>{tier.description}</div>
              </>
            ) : (
              <>
                <button onClick={() => openModal('pricing')}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 4 }}>
                  <Plus style={{ width: 11, height: 11 }} /> Set price
                </button>
                <div style={{ fontSize: 10, color: C.t3 }}>{tier.description}</div>
              </>
            )}
          </div>
        ))}
      </div>
      {tiers.length === 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: `${C.warn}08`, border: `1px solid ${C.warn}18`, display: 'flex', alignItems: 'center', gap: 7 }}>
          <AlertTriangle style={{ width: 11, height: 11, color: C.warn, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.warn, fontWeight: 600 }}>No pricing set — prospects can't see what you charge</span>
        </div>
      )}
    </SCard>
  );
}

function NudgeSettings({ settings, onUpdate }) {
  const update = (key, val) => onUpdate({ ...settings, [key]: val });
  const sections = [
    { label: 'Dashboard panels', rows: [
      { key: 'showTodayPanel',         label: "Today's action panel",    sub: 'Daily priority actions on Overview',        color: C.accent   },
      { key: 'showContentSuggestions', label: 'Content suggestions',     sub: 'When to post, run polls, start challenges', color: C.accent },
      { key: 'showDropOffMap',         label: 'Drop-off risk map',       sub: 'Lifecycle churn breakdown',                 color: C.accent    },
    ]},
    { label: 'Member alerts', rows: [
      { key: 'showStreakRecovery', label: 'Streak recovery prompts',   sub: 'Surface members who broke a streak',      color: C.accent  },
      { key: 'showClassLoyalty',  label: 'Class dependency warnings', sub: 'Members attending only one coach/class',  color: C.accent },
      { key: 'showReferrals',     label: 'Referral tracking',         sub: 'Track who brings in new sign-ups',        color: C.accent },
    ]},
  ];
  return (
    <SCard accent={C.accent}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.divider, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell style={{ width: 13, height: 13, color: C.t3 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Notifications & Smart Nudges</div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Customise what the dashboard surfaces and when</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map((section, si) => (
          <div key={si}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.divider}` }}>{section.label}</div>
            {section.rows.map((r, i) => (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < section.rows.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{r.sub}</div>
                </div>
                <Toggle value={settings[r.key]} onChange={v => update(r.key, v)} color={r.color} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 8, background: C.divider, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        <Info style={{ width: 11, height: 11, color: C.t3, flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.5 }}>Disabling a nudge hides it from the dashboard — it does not affect the underlying data or automations.</div>
      </div>
    </SCard>
  );
}

function AdminCard({ selectedGym, openModal }) {
  const statusVerified = selectedGym?.verified;
  return (
    <SCard accent={C.accent} noPad>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Admin</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield style={{ width: 10, height: 10, color: C.t3 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>Owner email</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{selectedGym?.owner_email || '—'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock style={{ width: 10, height: 10, color: C.t3 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>Gym ID</div>
            <div style={{ fontSize: 9, color: C.t3, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{selectedGym?.id || '—'}</div>
          </div>
          <CopyButton value={selectedGym?.id} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: statusVerified ? `${C.success}14` : C.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck style={{ width: 10, height: 10, color: statusVerified ? C.success : C.t3 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>Verification</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: statusVerified ? C.success : C.t2, marginTop: 1 }}>
              {statusVerified ? '✓ Verified & live' : 'Pending — 1–2 business days'}
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: C.border }} />
      <div style={{ padding: '12px 18px' }}>
        <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
          <button style={{ width: '100%', padding: '9px 14px', borderRadius: 9, background: C.divider, color: C.t2, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.divider; e.currentTarget.style.color = C.t2; }}>
            <ExternalLink style={{ width: 11, height: 11 }} /> View Public Page
          </button>
        </Link>
      </div>
    </SCard>
  );
}

function PhotosCard({ selectedGym, openModal }) {
  return (
    <SCard accent={C.accent}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Photos</div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Hero image & gallery</div>
        </div>
        <button onClick={() => openModal('photos')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.accent, background: `${C.accent}0a`, border: `1px solid ${C.accent}22`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Camera style={{ width: 10, height: 10 }} /> Manage
        </button>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Hero</div>
      {selectedGym?.image_url ? (
        <div style={{ borderRadius: 9, overflow: 'hidden', height: 96, cursor: 'pointer', border: `1px solid ${C.border}`, marginBottom: 10 }} onClick={() => openModal('heroPhoto')}>
          <img src={selectedGym.image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div onClick={() => openModal('heroPhoto')}
          style={{ height: 96, borderRadius: 9, border: `2px dashed ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'border-color 0.15s', marginBottom: 10 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = `${C.accent}40`}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <ImageIcon style={{ width: 16, height: 16, color: `${C.accent}60` }} />
          <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>Add hero photo</span>
        </div>
      )}
      {selectedGym?.gallery?.length > 0 ? (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Gallery</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
            {selectedGym.gallery.slice(0, 6).map((url, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 7, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div onClick={() => openModal('photos')}
          style={{ height: 62, borderRadius: 8, border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = `${C.accent}40`}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <Plus style={{ width: 11, height: 11, color: C.t3 }} />
          <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>Add gallery photos</span>
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

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.t1, fontSize: 12, outline: 'none', fontFamily: 'inherit' };
  const selStyle   = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

  return (
    <SCard accent={C.accent}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${C.accent}14`, border: `1px solid ${C.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift style={{ width: 13, height: 13, color: C.accent }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Rewards Catalogue</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{rewards.length} reward{rewards.length !== 1 ? 's' : ''} available to members</div>
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: showForm ? C.t3 : C.accent, background: showForm ? C.divider : `${C.accent}10`, border: `1px solid ${showForm ? C.border : C.accent + '28'}`, borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
          <Plus style={{ width: 10, height: 10 }} /> {showForm ? 'Cancel' : 'Add Reward'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: `${C.accent}06`, border: `1px solid ${C.accent}18`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Title *</div>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Free Protein Shake" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Value</div>
              <input value={form.value} onChange={e => set('value', e.target.value)} placeholder="e.g. £10 off, 1 free class" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Type</div>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={selStyle}>
                {Object.entries(REWARD_TYPES).map(([k, v]) => <option key={k} value={k} style={{ background: '#0b1120' }}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Requirement</div>
              <select value={form.requirement} onChange={e => set('requirement', e.target.value)} style={selStyle}>
                {Object.entries(REWARD_REQS).map(([k, v]) => <option key={k} value={k} style={{ background: '#0b1120' }}>{v}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={!form.title.trim() || isLoading}
            style={{ alignSelf: 'flex-end', padding: '7px 18px', borderRadius: 8, background: form.title.trim() ? C.accent : 'rgba(255,255,255,0.06)', color: form.title.trim() ? '#fff' : C.t3, border: 'none', fontSize: 12, fontWeight: 700, cursor: form.title.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all .15s' }}>
            {isLoading ? 'Adding…' : 'Add Reward'}
          </button>
        </div>
      )}

      {/* Reward list */}
      {rewards.length === 0 && !showForm ? (
        <div style={{ padding: '20px', textAlign: 'center', border: `2px dashed ${C.border}`, borderRadius: 10 }}>
          <Gift style={{ width: 20, height: 20, color: C.t3, margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <div style={{ fontSize: 12, color: C.t3 }}>No rewards yet — add one to motivate members</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rewards.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: r.active ? `${C.accent}06` : C.divider, border: `1px solid ${r.active ? C.accent + '18' : C.border}`, opacity: r.active ? 1 : 0.55 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon || '🎁'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.accent, background: `${C.accent}12`, border: `1px solid ${C.accent}22`, borderRadius: 4, padding: '1px 5px' }}>{REWARD_TYPES[r.type] || r.type}</span>
                  <span style={{ fontSize: 9, color: C.t3 }}>{REWARD_REQS[r.requirement] || r.requirement}</span>
                  {r.value && <span style={{ fontSize: 9, color: C.success, fontWeight: 600 }}>{r.value}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: C.t3 }}>{(r.claimed_by || []).length} claimed</span>
                <button onClick={() => onDeleteReward(r.id)}
                  style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', color: C.danger }}
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
      <div style={{ borderRadius: CARD_RADIUS, overflow: 'hidden', background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW, position: 'relative' }}>
        <div style={{ height: 136, position: 'relative', background: 'linear-gradient(135deg,#070e1c 0%,#0d1a36 50%,#070e1c 100%)', overflow: 'hidden' }}>
          {selectedGym?.image_url && <img src={selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,${C.surface}e0 100%)` }} />
          <button onClick={() => openModal('heroPhoto')}
            style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit' }}>
            <Camera style={{ width: 10, height: 10 }} /> Edit Hero
          </button>
        </div>
        <div style={{ padding: '0 20px 18px', marginTop: -16, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div onClick={() => openModal('logo')}
                style={{ width: 56, height: 56, borderRadius: '50%', background: C.surfaceEl, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.accent}`, boxShadow: `0 0 10px rgba(59,130,246,0.45)`, flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}>
                {selectedGym?.logo_url || selectedGym?.image_url
                  ? <img src={selectedGym.logo_url || selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Dumbbell style={{ width: 22, height: 22, color: '#fff' }} />}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>{selectedGym?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  {selectedGym?.type && <span style={{ fontSize: 11, color: C.t3 }}>{selectedGym.type}</span>}
                  {selectedGym?.city && (<><span style={{ width: 3, height: 3, borderRadius: '50%', background: C.t3, display: 'inline-block' }} /><span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: C.t3 }}><MapPin style={{ width: 10, height: 10 }} />{selectedGym.city}</span></>)}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: statusVerified ? `${C.success}12` : `${C.accent}12`, border: `1px solid ${statusVerified ? C.success + '25' : C.accent + '25'}`, cursor: statusVerified ? 'default' : 'help' }}
                    title={statusVerified ? 'Your gym is live and visible to members' : 'Your gym will be visible once verified — typically 1–2 business days'}>
                    <ShieldCheck style={{ width: 9, height: 9, color: statusVerified ? C.success : C.accent }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: statusVerified ? C.success : C.accent }}>{statusVerified ? 'Verified' : 'Pending'}</span>
                    {!statusVerified && <Info style={{ width: 8, height: 8, color: C.accent, opacity: 0.7 }} />}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => openModal('editInfo')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: `${C.accent}12`, color: C.accent, border: `1px solid ${C.accent}25`, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.accent}22`}
              onMouseLeave={e => e.currentTarget.style.background = `${C.accent}12`}>
              <Settings style={{ width: 11, height: 11 }} /> Edit Info
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 16 }}>
            {[
              { label: 'Monthly Price', value: selectedGym?.price ? `£${selectedGym.price}/mo` : 'Not set', icon: Tag,         color: C.t1 },
              { label: 'Address',       value: selectedGym?.address || '—',                                  icon: MapPin,      color: C.t1 },
              { label: 'Postcode',      value: selectedGym?.postcode || '—',                                 icon: MapPin,      color: C.t1 },
              { label: 'Status',        value: statusVerified ? 'Verified' : 'Pending',                      icon: ShieldCheck, color: statusVerified ? C.success : C.t1 },
            ].map((f, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: C.divider, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <f.icon style={{ width: 9, height: 9, color: C.t3 }} />
                  <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.t3 }}>{f.label}</span>
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
          <SCard accent={C.accent} noPad style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px 10px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 1 }}>Manage</div>
              <div style={{ fontSize: 10, color: C.t3 }}>Classes, coaches, equipment and amenities</div>
            </div>
            <div style={{ padding: '0 12px 12px' }}>
              <ManageGrid classes={classes} coaches={coaches} selectedGym={selectedGym} openModal={openModal} />
            </div>
          </SCard>
          <PricingSection selectedGym={selectedGym} openModal={openModal} />
          <RewardsCatalogueCard rewards={rewards} onCreateReward={onCreateReward} onDeleteReward={onDeleteReward} isLoading={isLoading} />
          {/* Danger Zone */}
          <div style={{ borderRadius: 12, border: `1px solid ${C.danger}18`, background: `${C.danger}04`, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.danger}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: 12, height: 12, color: C.danger }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Danger Zone</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>These actions are permanent and cannot be undone</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { title: 'Delete Gym',     desc: 'Remove all gym data permanently',  fn: () => openModal('deleteGym')     },
                { title: 'Delete Account', desc: 'Remove account and all gyms',      fn: () => openModal('deleteAccount') },
              ].map((d, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 9, background: C.divider, border: `1px solid ${C.danger}10`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 3 }}>{d.title}</div>
                    <div style={{ fontSize: 10, color: C.t3 }}>{d.desc}</div>
                  </div>
                  <button onClick={d.fn}
                    style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 7, background: `${C.danger}10`, color: '#ef4444', border: `1px solid ${C.danger}20`, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${C.danger}22`; e.currentTarget.style.color = C.danger; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${C.danger}10`; e.currentTarget.style.color = '#ef4444'; }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <InviteStaffPanel gym={selectedGym} />
          <PhotosCard selectedGym={selectedGym} openModal={openModal} />
          <AdminCard selectedGym={selectedGym} openModal={openModal} />
          <SCard accent={C.accent}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { icon: Users,    label: 'Add a member',    color: C.accent, fn: () => openModal('members')   },
                { icon: Calendar, label: 'Add a class',     color: C.accent, fn: () => openModal('classes')   },
                { icon: Star,     label: 'Manage amenities',color: C.accent, fn: () => openModal('amenities') },
                { icon: Camera,   label: 'Upload photos',   color: C.accent, fn: () => openModal('photos')    },
              ].map(({ icon: Icon, label, color, fn }, i) => {
                const [hov, setHov] = useState(false);
                return (
                  <button key={i} onClick={fn}
                    onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 9, background: hov ? `${color}10` : C.divider, border: `1px solid ${hov ? color + '30' : C.border}`, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 11, height: 11, color }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: hov ? C.t1 : C.t2, flex: 1, textAlign: 'left' }}>{label}</span>
                    <ChevronRight style={{ width: 11, height: 11, color: hov ? color : C.t3 }} />
                  </button>
                );
              })}
            </div>
          </SCard>
        </div>
      </div>

      {/* ── SAVE BAR ── */}
      <div style={{ position: 'sticky', bottom: 16, zIndex: 20 }}>
        <div style={{ background: `${C.surface}f2`, backdropFilter: 'blur(20px)', border: `1px solid ${C.borderEl}`, borderRadius: 12, padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Settings updated</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Changes apply to your dashboard immediately</div>
          </div>
          <button onClick={handleSave}
            style={{ padding: '8px 20px', borderRadius: 9, background: saved ? `${C.success}14` : `${C.accent}18`, color: saved ? C.success : C.t1, border: saved ? `1px solid ${C.success}30` : `1px solid ${C.accent}35`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            {saved ? <><Check style={{ width: 12, height: 12 }} /> Saved</> : <><Settings style={{ width: 11, height: 11 }} /> Save Changes</>}
          </button>
        </div>
      </div>

    </div>
  );
}