import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Dumbbell, Calendar, Users, Star, Image as ImageIcon,
  MapPin, Tag, ShieldCheck, ChevronRight, ExternalLink,
  Settings, Camera, AlertTriangle, Copy, Check,
  Sparkles, CheckCircle, Info,
} from 'lucide-react';

// ── Design tokens — identical to Overview ─────────────────────────────────────
const T = {
  blue:    '#0ea5e9',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
  cyan:    '#06b6d4',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  divider: 'rgba(255,255,255,0.05)',
};

// ── Shared card shell ──────────────────────────────────────────────────────────
function SCard({ children, style = {}, accent }) {
  const c = accent || T.blue;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, position: 'relative', overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${c}28,transparent)`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(value || ''); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <button onClick={handleCopy}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: copied ? `${T.green}14` : T.divider, border: `1px solid ${copied ? T.green + '28' : T.border}`, color: copied ? T.green : T.text3, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', marginLeft: 6, fontFamily: 'inherit' }}>
      {copied ? <Check style={{ width: 9, height: 9 }} /> : <Copy style={{ width: 9, height: 9 }} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, color, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────────
function ToggleRow({ label, sub, value, onChange, color = T.blue, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', background: value ? color : 'rgba(255,255,255,0.1)' }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  );
}

// ── Gym Health Overview ────────────────────────────────────────────────────────
function GymHealthOverview({ selectedGym, classes, coaches, checkIns, allMemberships, atRisk, retentionRate, now }) {
  const totalMembers = allMemberships?.length || 0;
  const ci30 = (checkIns || []).filter(c => {
    const d = new Date(c.check_in_date), cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return d >= cutoff;
  });
  const healthScore = useMemo(() => {
    let s = 0;
    if (selectedGym?.image_url)  s += 10;
    if (selectedGym?.logo_url)   s += 5;
    if (classes?.length > 0)     s += 15;
    if (coaches?.length > 0)     s += 15;
    if (totalMembers > 0)        s += 20;
    if (retentionRate >= 70)     s += 20;
    if (atRisk === 0)            s += 10;
    if (ci30.length > 0)         s += 5;
    return Math.min(100, s);
  }, [selectedGym, classes, coaches, totalMembers, retentionRate, atRisk, ci30]);

  const checks = [
    { label: 'Hero photo uploaded',    done: !!selectedGym?.image_url,       color: T.blue   },
    { label: 'At least 1 class added', done: (classes?.length || 0) > 0,     color: T.green  },
    { label: 'At least 1 coach added', done: (coaches?.length || 0) > 0,     color: T.purple },
    { label: 'Members joined',         done: totalMembers > 0,               color: T.amber  },
    { label: 'Retention above 70%',    done: retentionRate >= 70,            color: T.green  },
    { label: 'No at-risk members',     done: atRisk === 0,                   color: T.red    },
    { label: 'Check-ins this month',   done: ci30.length > 0,                color: '#fb923c'},
    { label: 'Gym verified',           done: !!selectedGym?.verified,        color: T.blue   },
  ];
  const done       = checks.filter(c => c.done).length;
  const scoreColor = healthScore >= 75 ? T.green : healthScore >= 50 ? T.amber : T.red;

  return (
    <SCard accent={T.blue} style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>Gym Health Score</div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Your gym's overall setup & performance</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, letterSpacing: '-0.05em', lineHeight: 1 }}>{healthScore}</div>
          <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 1 }}>/ 100</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${healthScore}%`, borderRadius: 99, background: healthScore >= 75 ? `linear-gradient(90deg,${T.green},#34d399)` : healthScore >= 50 ? `linear-gradient(90deg,#d97706,${T.amber})` : `linear-gradient(90deg,${T.red},#f87171)`, transition: 'width 0.8s ease' }} />
      </div>

      {/* Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 8, background: c.done ? `${c.color}08` : T.divider, border: `1px solid ${c.done ? c.color + '20' : T.border}` }}>
            {c.done
              ? <CheckCircle style={{ width: 12, height: 12, color: c.color, flexShrink: 0 }} />
              : <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${T.border}`, flexShrink: 0 }} />
            }
            <span style={{ fontSize: 11, fontWeight: 600, color: c.done ? T.text1 : T.text3 }}>{c.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 9, background: T.divider, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>{done} of {checks.length} completed</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: healthScore >= 75 ? T.green : T.amber }}>
          {healthScore >= 75 ? '✓ Fully set up' : `${checks.length - done} action${checks.length - done !== 1 ? 's' : ''} remaining`}
        </span>
      </div>
    </SCard>
  );
}

// ── Smart Nudge Settings ──────────────────────────────────────────────────────
function SmartNudgeSettings({ settings, onUpdate }) {
  const update = (key, val) => onUpdate({ ...settings, [key]: val });
  const rows = [
    { key: 'showTodayPanel',          label: "Show 'What to do today' panel",  sub: 'Daily action recommendations on the Overview page',        color: T.blue   },
    { key: 'showContentSuggestions',  label: 'Smart content suggestions',       sub: 'Recommend when to post, run polls, and launch challenges', color: T.purple },
    { key: 'showStreakRecovery',       label: 'Streak recovery prompts',         sub: 'Surface members who just broke a streak for re-engagement', color: T.amber  },
    { key: 'showDropOffMap',          label: 'Drop-off risk map',               sub: 'Show the drop-off lifecycle stage breakdown',              color: T.red    },
    { key: 'showReferrals',           label: 'Referral tracking',               sub: 'Track which members are bringing in new sign-ups',         color: T.purple },
    { key: 'showClassLoyalty',        label: 'Class loyalty warnings',          sub: 'Flag members who only attend a single class/coach',        color: '#fb923c'},
  ];
  return (
    <SCard accent={T.blue} style={{ padding: 20 }}>
      <SectionHeading icon={Sparkles} color={T.blue} title="Smart Nudges & Auto-Actions" sub="Control the AI-style suggestions and action panel behaviour" />
      {rows.map((r, i) => (
        <ToggleRow key={r.key} label={r.label} sub={r.sub} value={settings[r.key]} onChange={v => update(r.key, v)} color={r.color} last={i === rows.length - 1} />
      ))}
      <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 9, background: `${T.blue}06`, border: `1px solid ${T.blue}15` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Info style={{ width: 11, height: 11, color: T.blue }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.blue }}>About smart nudges</span>
        </div>
        <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.5 }}>
          These widgets use your live gym data to surface the most impactful action for the moment. Disabling them hides the suggestion but does not affect underlying data.
        </div>
      </div>
    </SCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabGym({
  selectedGym, classes, coaches, openModal,
  checkIns = [], allMemberships = [], atRisk = 0, retentionRate = 0,
  atRiskDays: atRiskDaysProp = 14, onAtRiskDaysChange,
}) {
  const now = new Date();
  const statusVerified = selectedGym?.verified;

  const [nudgeSettings, setNudgeSettings] = useState({
    showTodayPanel:         true,
    showContentSuggestions: true,
    showStreakRecovery:      true,
    showDropOffMap:         true,
    showReferrals:          true,
    showClassLoyalty:       true,
  });
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 12, overflow: 'hidden', background: T.card, border: `1px solid ${T.border}`, position: 'relative' }}>
        {/* Cover image */}
        <div style={{ height: 190, position: 'relative', background: `linear-gradient(135deg,#070e1c 0%,#0d1a36 50%,#070e1c 100%)`, overflow: 'hidden' }}>
          {selectedGym?.image_url && <img src={selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,${T.card}cc 100%)` }} />
          <button onClick={() => openModal('heroPhoto')}
            style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.45)', border: `1px solid ${T.borderM}`, color: T.text2, fontSize: 11, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit' }}>
            <Camera style={{ width: 12, height: 12 }} /> Edit Hero
          </button>
        </div>

        {/* Gym identity row */}
        <div style={{ padding: '0 20px 20px', marginTop: -20, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Logo */}
              <div onClick={() => openModal('logo')}
                style={{ width: 60, height: 60, borderRadius: 14, background: `linear-gradient(135deg,${T.blue},${T.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${T.blue}30`, border: `3px solid ${T.card}`, flexShrink: 0, cursor: 'pointer' }}>
                {selectedGym?.logo_url
                  ? <img src={selectedGym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }} />
                  : <Dumbbell style={{ width: 24, height: 24, color: '#fff' }} />
                }
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.text1, letterSpacing: '-0.03em', lineHeight: 1 }}>{selectedGym?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, flexWrap: 'wrap' }}>
                  {selectedGym?.type && <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{selectedGym.type}</span>}
                  {selectedGym?.city && (
                    <>
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.text3 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin style={{ width: 10, height: 10, color: T.text3 }} />
                        <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{selectedGym.city}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: statusVerified ? `${T.green}12` : `${T.amber}12`, border: `1px solid ${statusVerified ? T.green + '25' : T.amber + '25'}` }}>
                    <ShieldCheck style={{ width: 10, height: 10, color: statusVerified ? T.green : T.amber }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: statusVerified ? T.green : T.amber, letterSpacing: '0.04em' }}>
                      {statusVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => openModal('editInfo')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: `${T.blue}12`, color: T.blue, border: `1px solid ${T.blue}25`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = `${T.blue}22`}
              onMouseLeave={e => e.currentTarget.style.background = `${T.blue}12`}>
              <Settings style={{ width: 12, height: 12 }} /> Edit Info
            </button>
          </div>

          {/* Info pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 18 }}>
            {[
              { label: 'Monthly Price', value: selectedGym?.price ? `£${selectedGym.price}/mo` : 'Not set', icon: Tag,        color: selectedGym?.price ? T.text1 : T.amber },
              { label: 'Address',       value: selectedGym?.address,                                         icon: MapPin,     color: T.text1 },
              { label: 'Postcode',      value: selectedGym?.postcode,                                        icon: MapPin,     color: T.text1 },
              { label: 'Status',        value: statusVerified ? 'Verified' : 'Pending Approval',             icon: ShieldCheck, color: statusVerified ? T.green : T.amber },
            ].map((f, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: T.divider, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <f.icon style={{ width: 10, height: 10, color: T.text3 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text3 }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: f.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gym Health Score ─────────────────────────────────────────────────── */}
      <GymHealthOverview
        selectedGym={selectedGym} classes={classes} coaches={coaches}
        checkIns={checkIns} allMemberships={allMemberships}
        atRisk={atRisk} retentionRate={retentionRate} now={now}
      />

      {/* ── Manage sections ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { icon: Calendar, label: 'Classes',   count: classes.length,                     unit: 'total',  color: T.green,  fn: () => openModal('classes')   },
          { icon: Users,    label: 'Coaches',   count: coaches.length,                     unit: 'total',  color: T.blue,   fn: () => openModal('coaches')   },
          { icon: Dumbbell, label: 'Equipment', count: selectedGym?.equipment?.length || 0, unit: 'items',  color: T.purple, fn: () => openModal('equipment') },
          { icon: Star,     label: 'Amenities', count: selectedGym?.amenities?.length || 0, unit: 'listed', color: T.amber,  fn: () => openModal('amenities') },
        ].map(({ icon: Icon, label, count, unit, color, fn }, i) => (
          <button key={i} onClick={fn}
            style={{ padding: '16px 18px', borderRadius: 12, cursor: 'pointer', background: T.card, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s', textAlign: 'left', position: 'relative', overflow: 'hidden', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; e.currentTarget.style.transform = ''; }}>
            {/* Shimmer */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}28,transparent)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 16, height: 16, color }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{label}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}><span style={{ fontWeight: 800, color }}>{count}</span> {unit}</div>
              </div>
            </div>
            <ChevronRight style={{ width: 13, height: 13, color: T.text3 }} />
          </button>
        ))}
      </div>

      {/* ── Smart Nudge Settings ──────────────────────────────────────────────── */}
      <SmartNudgeSettings settings={nudgeSettings} onUpdate={setNudgeSettings} />

      {/* ── Sticky save bar ───────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', bottom: 16, zIndex: 20 }}>
        <div style={{ background: `${T.card}f0`, backdropFilter: 'blur(16px)', border: `1px solid ${T.borderM}`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Settings updated</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Changes apply to your dashboard immediately</div>
          </div>
          <button onClick={handleSave}
            style={{ padding: '8px 20px', borderRadius: 9, background: saved ? `${T.green}20` : T.blue, color: saved ? T.green : '#fff', border: saved ? `1px solid ${T.green}30` : 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            {saved ? <><Check style={{ width: 13, height: 13 }} /> Saved</> : <><Settings style={{ width: 12, height: 12 }} /> Save Settings</>}
          </button>
        </div>
      </div>

      {/* ── Photos + Admin ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* Hero Photo */}
        <SCard accent={T.blue} style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Hero Photo</div>
            <button onClick={() => openModal('heroPhoto')}
              style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}22`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Edit
            </button>
          </div>
          {selectedGym?.image_url ? (
            <div style={{ borderRadius: 10, overflow: 'hidden', height: 130, cursor: 'pointer' }} onClick={() => openModal('heroPhoto')}>
              <img src={selectedGym.image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div onClick={() => openModal('heroPhoto')}
              style={{ height: 130, borderRadius: 10, border: `2px dashed ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${T.blue}40`}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.blue}0a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon style={{ width: 15, height: 15, color: `${T.blue}80` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text3 }}>Add Hero Photo</span>
            </div>
          )}
        </SCard>

        {/* Gallery */}
        <SCard accent={T.blue} style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Photo Gallery</div>
            <button onClick={() => openModal('photos')}
              style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: `${T.blue}0a`, border: `1px solid ${T.blue}22`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Manage
            </button>
          </div>
          {selectedGym?.gallery?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {selectedGym.gallery.slice(0, 6).map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          ) : (
            <div onClick={() => openModal('photos')}
              style={{ height: 130, borderRadius: 10, border: `2px dashed ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${T.blue}40`}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.blue}0a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon style={{ width: 15, height: 15, color: `${T.blue}80` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text3 }}>Add Photos</span>
            </div>
          )}
        </SCard>

        {/* Admin */}
        <SCard accent={T.blue} style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Admin</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '10px 12px', borderRadius: 9, background: T.divider, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text3, marginBottom: 4 }}>Owner Email</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, wordBreak: 'break-all' }}>{selectedGym?.owner_email || '—'}</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 9, background: T.divider, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text3 }}>Gym ID</div>
                <CopyButton value={selectedGym?.id} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text3, fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedGym?.id || '—'}</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 9, background: statusVerified ? `${T.green}08` : `${T.amber}08`, border: `1px solid ${statusVerified ? T.green + '18' : T.amber + '18'}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text3, marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: statusVerified ? T.green : T.amber }}>{statusVerified ? '✓ Verified' : 'Pending Approval'}</div>
            </div>
          </div>
          <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
            <button style={{ width: '100%', marginTop: 12, padding: '9px 14px', borderRadius: 9, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(255,255,255,0.08)`; e.currentTarget.style.color = T.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.divider; e.currentTarget.style.color = T.text2; }}>
              <ExternalLink style={{ width: 12, height: 12 }} /> View Public Gym Page
            </button>
          </Link>
        </SCard>
      </div>

      {/* ── Danger Zone ───────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 12, border: `1px solid ${T.red}22`, background: `${T.red}04`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${T.red}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle style={{ width: 12, height: 12, color: T.red }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Danger Zone</div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>These actions are permanent and cannot be undone.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { title: 'Delete Gym',     desc: 'Permanently delete this gym and all its data, including members, check-ins, and content.', fn: () => openModal('deleteGym')     },
            { title: 'Delete Account', desc: 'Permanently delete your owner account and all associated gyms. This cannot be reversed.',   fn: () => openModal('deleteAccount') },
          ].map((d, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: T.divider, border: `1px solid ${T.red}14`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5 }}>{d.desc}</div>
              </div>
              <button onClick={d.fn}
                style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, background: `${T.red}12`, color: '#fca5a5', border: `1px solid ${T.red}22`, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${T.red}22`; e.currentTarget.style.color = T.red; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${T.red}12`; e.currentTarget.style.color = '#fca5a5'; }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
