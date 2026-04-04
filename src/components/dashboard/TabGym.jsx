/**
 * GymControlCenter.jsx
 *
 * Drop-in replacement for TabGym — the "Gym Control Center" redesign.
 * Accepts the same props as TabGym; mock data is used as fallback so
 * the component works standalone without a real backend.
 *
 * Prop interface (same as original TabGym):
 *   selectedGym, classes, coaches, openModal,
 *   checkIns, allMemberships, atRisk, retentionRate,
 *   rewards, onCreateReward, onDeleteReward, isLoading
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Dumbbell, Calendar, Users, Star, Image as ImageIcon,
  MapPin, Tag, ShieldCheck, ChevronRight, ExternalLink,
  Settings, Camera, AlertTriangle, Copy, Check,
  Sparkles, CheckCircle, Info, Activity, TrendingUp,
  Bell, Lock, CreditCard, Plus, Edit2, Zap,
  ArrowRight, BarChart2, Clock, Shield, Gift, Trash2,
  MessageSquare, Mail, Eye, Layers,
  Power, AlertCircle, Pencil, UserCheck,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Design tokens — keep in sync with dashboard-tokens
// ─────────────────────────────────────────────
const C = {
  bg:        '#07090f',
  surface:   '#0c1220',
  raised:    '#101828',
  elevated:  '#141f33',
  border:    'rgba(255,255,255,0.056)',
  borderHi:  'rgba(255,255,255,0.10)',
  accent:    '#3b82f6',
  success:   '#10b981',
  warn:      '#f59e0b',
  danger:    '#ef4444',
  t1:        '#e8f0ff',
  t2:        '#6b80a4',
  t3:        '#2f3f5c',
  divider:   'rgba(255,255,255,0.04)',
};
const R = 12; // base border-radius
const SHADOW = '0 1px 3px rgba(0,0,0,0.35)';

// ─────────────────────────────────────────────
// Mock data (used when real props not provided)
// ─────────────────────────────────────────────
const MOCK = {
  gym: {
    name: 'Iron & Oak Fitness',
    type: 'CrossFit Box',
    city: 'Manchester',
    address: '12 Canal Street',
    postcode: 'M1 4PH',
    price: 65,
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
    logo_url: null,
    verified: false,
    owner_email: 'owner@ironoak.com',
    id: 'gym_01jwkx9b3a',
    amenities: ['Free Parking', 'Changing Rooms'],
    equipment: ['Barbells', 'Kettlebells', 'Rowers', 'Pull-up Rigs'],
    membership_tiers: [{ name: 'Monthly', price: 65, description: 'Rolling, cancel anytime' }],
    description: 'The premier CrossFit experience in Manchester city centre.',
  },
  classes: [
    { name: 'Morning WOD',      coach: 'Sam T',  time: '06:30' },
    { name: 'Lunchtime HIIT',   coach: 'Sam T',  time: '12:00' },
    { name: 'Evening CrossFit', coach: 'Alex R', time: '18:30' },
  ],
  coaches: [
    { name: 'Sam Thompson', role: 'Head Coach',     active: true },
    { name: 'Alex Rivera',  role: 'CrossFit Coach', active: true },
  ],
  members: 38,
  retentionRate: 74,
  atRisk: 3,
  checkIns30: 142,
};

// ─────────────────────────────────────────────
// Base UI components
// ─────────────────────────────────────────────

function Card({ children, style = {}, leftAccent, noPad }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: R,
      boxShadow: SHADOW,
      position: 'relative',
      overflow: 'hidden',
      ...(noPad ? {} : { padding: '20px 22px' }),
      ...(leftAccent ? { borderLeft: `3px solid ${leftAccent}` } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

function IconBox({ icon: Icon, color = C.t2, bg, size = 30, iconSize = 13 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: bg || C.elevated,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon style={{ width: iconSize, height: iconSize, color }} />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    complete: { c: C.success, label: 'Complete',    bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.18)'  },
    missing:  { c: C.warn,    label: 'Incomplete',  bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.18)'  },
    critical: { c: C.danger,  label: 'Critical',    bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.18)'   },
    active:   { c: C.accent,  label: 'Active',      bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.18)'  },
    inactive: { c: C.t2,      label: 'Not set',     bg: 'rgba(107,128,164,0.06)', border: 'rgba(107,128,164,0.14)' },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 10, fontWeight: 700, color: s.c, fontFamily: 'inherit',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.c, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      flexShrink: 0, width: 38, height: 21, borderRadius: 99,
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s', fontFamily: 'inherit',
      background: value ? C.accent : 'rgba(255,255,255,0.08)',
    }}>
      <div style={{
        position: 'absolute', top: 2.5,
        left: value ? 19 : 2.5, width: 16, height: 16,
        borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function ActionBtn({ label, icon: Icon, onClick, variant = 'ghost' }) {
  const [hov, setHov] = useState(false);
  const styles = {
    ghost:   { bg: hov ? C.divider : 'transparent', color: C.t2,    border: `1px solid ${hov ? C.border : 'transparent'}` },
    outline: { bg: hov ? `${C.accent}18` : `${C.accent}0a`, color: C.accent, border: `1px solid ${C.accent}28`           },
    soft:    { bg: hov ? 'rgba(255,255,255,0.07)' : C.elevated, color: C.t1, border: `1px solid ${C.border}`             },
    danger:  { bg: hov ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.07)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)' },
  };
  const s = styles[variant] || styles.ghost;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 8,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .15s', fontSize: 11, fontWeight: 700,
        ...s,
      }}>
      {Icon && <Icon style={{ width: 10, height: 10 }} />}
      {label}
    </button>
  );
}

function SectionHeader({ id, label, purpose }) {
  return (
    <div id={id} style={{ marginBottom: 16, scrollMarginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>
      {purpose && (
        <p style={{ margin: 0, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{purpose}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Health gauge
// ─────────────────────────────────────────────
function HealthGauge({ score, size = 100, color }) {
  const r = size / 2 - 7, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.elevated} strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color: C.t1, letterSpacing: '-0.05em', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.085, fontWeight: 700, color, marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section 1 — Business Health
// ─────────────────────────────────────────────
function HealthSection({ gym, classes, coaches, members, retentionRate, atRisk, openModal }) {
  const score = useMemo(() => {
    let s = 0;
    if (gym.image_url)      s += 10;
    if (gym.description)    s += 5;
    if (gym.logo_url)       s += 5;
    if (classes.length > 0) s += 15;
    if (coaches.length > 0) s += 15;
    if (members > 0)        s += 20;
    if (retentionRate >= 70) s += 15;
    if (atRisk === 0)       s += 5;
    if (gym.verified)       s += 10;
    return Math.min(100, s);
  }, [gym, classes, coaches, members, retentionRate, atRisk]);

  const scoreColor = score >= 75 ? C.success : score >= 50 ? C.warn : C.danger;

  const checks = [
    { label: 'Hero photo uploaded',      done: !!gym.image_url,       cta: 'Add photo',   action: 'heroPhoto', priority: 'high'    },
    { label: 'Gym description written',  done: !!gym.description,     cta: 'Write it',    action: 'editInfo',  priority: 'medium'  },
    { label: 'Classes on schedule',      done: classes.length > 0,    cta: 'Add class',   action: 'classes',   priority: 'high'    },
    { label: 'At least one coach added', done: coaches.length > 0,    cta: 'Add coach',   action: 'coaches',   priority: 'high'    },
    { label: 'Pricing set',              done: !!gym.price,           cta: 'Set price',   action: 'pricing',   priority: 'critical'},
    { label: 'Members enrolled',         done: members > 0,           cta: 'Add member',  action: 'members',   priority: 'medium'  },
    { label: 'Retention ≥ 70 %',         done: retentionRate >= 70,   cta: null,          action: null,        priority: 'medium'  },
    { label: 'Gym verified',             done: !!gym.verified,        cta: null,          action: null,        priority: 'low'     },
  ];
  const doneCount = checks.filter(c => c.done).length;
  const missing   = checks.filter(c => !c.done);

  const dotColor = (priority) => ({
    critical: C.danger, high: C.warn, medium: C.accent, low: C.t3,
  }[priority] || C.t3);

  return (
    <div style={{ marginBottom: 36 }}>
      {/* ── Hero banner ── */}
      <div style={{ borderRadius: R + 2, overflow: 'hidden', background: C.surface, border: `1px solid ${C.border}`, marginBottom: 16, boxShadow: SHADOW }}>
        <div style={{ height: 130, position: 'relative', background: 'linear-gradient(135deg,#060d1c 0%,#0c1934 50%,#060d1c 100%)', overflow: 'hidden' }}>
          {gym.image_url && (
            <img src={gym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(10,18,32,0.92) 100%)' }} />
          <button onClick={() => openModal('heroPhoto')} style={{
            position: 'absolute', top: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 7,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Camera style={{ width: 10, height: 10 }} />
            {gym.image_url ? 'Change hero' : 'Add hero photo'}
          </button>
        </div>

        <div style={{ padding: '0 22px 20px', marginTop: -18, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div onClick={() => openModal('logo')} style={{
              width: 56, height: 56, borderRadius: '50%', background: C.elevated,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${C.accent}`, cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
              boxShadow: `0 0 0 4px rgba(59,130,246,0.1)`,
            }}>
              {gym.logo_url
                ? <img src={gym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Dumbbell style={{ width: 22, height: 22, color: '#fff' }} />
              }
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {gym.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {gym.type && <span style={{ fontSize: 11, color: C.t2 }}>{gym.type}</span>}
                {gym.city && (
                  <>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.t3, display: 'inline-block' }} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: C.t2 }}>
                      <MapPin style={{ width: 9, height: 9 }} />{gym.city}
                    </span>
                  </>
                )}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 5,
                  background: gym.verified ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                  border: `1px solid ${gym.verified ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
                  fontSize: 9, fontWeight: 800, color: gym.verified ? C.success : C.accent,
                }}>
                  <ShieldCheck style={{ width: 9, height: 9 }} />
                  {gym.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
          <ActionBtn label="Edit info" icon={Settings} onClick={() => openModal('editInfo')} variant="soft" />
        </div>

        {/* Quick info strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '0 22px 18px' }}>
          {[
            { label: 'Price',    value: gym.price ? `£${gym.price}/mo` : 'Not set', icon: Tag       },
            { label: 'Address',  value: gym.address || '—',                          icon: MapPin    },
            { label: 'Postcode', value: gym.postcode || '—',                         icon: MapPin    },
            { label: 'Owner',    value: gym.owner_email || '—',                      icon: Shield    },
          ].map((f, i) => (
            <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: C.elevated, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <f.icon style={{ width: 9, height: 9, color: C.t3 }} />
                <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.t3 }}>{f.label}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Health card ── */}
      <Card>
        <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
          <HealthGauge score={score} size={104} color={scoreColor} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.t1, marginBottom: 3 }}>Business health</div>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 18, lineHeight: 1.6 }}>
              {score >= 75
                ? 'Your gym is fully configured and ready to grow.'
                : `${checks.length - doneCount} items need attention before your gym is fully operational.`
              }
            </div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
              {checks.map((c, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 99,
                  background: c.done ? C.success : C.elevated,
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: C.t2 }}>{doneCount} of {checks.length} complete</span>
              {missing.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>
                  {missing.length} remaining
                </span>
              )}
            </div>
          </div>
        </div>

        {missing.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Action required
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {missing.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 9,
                  background: C.elevated, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor(c.priority), flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: C.t1, fontWeight: 500 }}>{c.label}</span>
                  {c.cta && c.action && (
                    <button onClick={() => openModal(c.action)} style={{
                      fontSize: 10, fontWeight: 700, color: C.accent,
                      background: `${C.accent}10`, border: `1px solid ${C.accent}20`,
                      borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {c.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section 2 — Business Setup
// ─────────────────────────────────────────────
function SetupCard({ icon: Icon, title, status, meta, description, cta, onCta }) {
  const [hov, setHov] = useState(false);
  return (
    <Card
      style={{ cursor: onCta ? 'pointer' : 'default', transition: 'border-color 0.15s', borderColor: hov && onCta ? C.borderHi : C.border }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBox icon={Icon} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
            {meta && <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{meta}</div>}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{description}</p>
      {cta && (
        <button onClick={onCta} style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
          color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}>
          {cta} <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      )}
    </Card>
  );
}

function SetupSection({ gym, openModal }) {
  const hasPhoto     = !!gym.image_url;
  const hasDesc      = !!gym.description;
  const hasAmenities = (gym.amenities || []).length > 0;
  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHeader id="setup" label="Business setup" purpose="How your gym appears to prospective members on FitFinder." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <SetupCard
          icon={Settings} title="Gym information"
          status={hasDesc ? 'complete' : 'missing'}
          meta={[gym.address, gym.postcode].filter(Boolean).join(' · ') || 'No address set'}
          description="Name, description, address, and contact details shown on your public profile."
          cta="Edit details" onCta={() => openModal('editInfo')}
        />
        <SetupCard
          icon={Camera} title="Photos & branding"
          status={hasPhoto ? 'complete' : 'missing'}
          meta={hasPhoto ? 'Hero photo set' : 'No photos uploaded'}
          description="Your hero image is the first thing members see. Gyms with photos get 40% more profile visits."
          cta="Manage photos" onCta={() => openModal('photos')}
        />
        <SetupCard
          icon={Star} title="Amenities"
          status={hasAmenities ? 'complete' : 'missing'}
          meta={`${(gym.amenities || []).length} listed`}
          description="Parking, showers, café — highlight what makes your gym stand out from competitors."
          cta="Update amenities" onCta={() => openModal('amenities')}
        />
        <SetupCard
          icon={Eye} title="Public profile"
          status={gym.verified ? 'active' : 'inactive'}
          meta={gym.verified ? 'Live & discoverable' : 'Pending verification'}
          description="Preview exactly how your gym appears to members searching FitFinder."
          cta="View profile" onCta={() => openModal('publicPage')}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section 3 — Operations
// ─────────────────────────────────────────────
function MiniStat({ label, value, sub, color = C.t1 }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 9, background: C.elevated, border: `1px solid ${C.border}`, flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t1, marginBottom: 1 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: C.t3 }}>{sub}</div>}
    </div>
  );
}

function OpsCard({ icon: Icon, title, description, status, stats = [], insight, cta, onCta }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBox icon={Icon} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
        </div>
        <StatusBadge status={status} />
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{description}</p>
      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {stats.map((s, i) => <MiniStat key={i} {...s} />)}
        </div>
      )}
      {insight && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '8px 10px', borderRadius: 8, background: `${C.accent}08`, border: `1px solid ${C.accent}14`, marginBottom: 14 }}>
          <Sparkles style={{ width: 10, height: 10, color: C.accent, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 10, color: C.t2, lineHeight: 1.5 }}>{insight}</span>
        </div>
      )}
      {cta && (
        <button onClick={onCta} style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
          color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}>
          {cta} <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      )}
    </Card>
  );
}

function OpsSection({ gym, classes, coaches, openModal }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHeader id="ops" label="Operations" purpose="The day-to-day systems that keep your gym running smoothly." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <OpsCard
          icon={Calendar} title="Classes & schedule"
          status={classes.length > 0 ? 'complete' : 'missing'}
          description="Your timetable, capacity limits, and coach assignments — visible to members on your profile."
          stats={[
            { label: 'Classes',   value: classes.length, sub: 'scheduled' },
            { label: 'Coaches',   value: coaches.length, sub: 'assigned'  },
          ]}
          insight={classes.length === 0 ? 'Gyms with 3+ classes see 2× faster member growth.' : undefined}
          cta="Manage schedule" onCta={() => openModal('classes')}
        />
        <OpsCard
          icon={Users} title="Coaches"
          status={coaches.length > 0 ? 'complete' : 'missing'}
          description="Active coaches, specialities, and class coverage. Each coach can manage their own sessions."
          stats={[
            { label: 'Active',  value: coaches.length, sub: 'coaches' },
            { label: 'Classes', value: classes.length, sub: 'covered' },
          ]}
          cta="Manage coaches" onCta={() => openModal('coaches')}
        />
        <OpsCard
          icon={Dumbbell} title="Equipment"
          status={(gym.equipment || []).length > 0 ? 'complete' : 'missing'}
          description="Keep your equipment inventory current. Members check this before signing up or visiting."
          stats={[
            { label: 'Items', value: (gym.equipment || []).length, sub: 'in inventory' },
          ]}
          cta="Update inventory" onCta={() => openModal('equipment')}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section 4 — Revenue & Membership
// ─────────────────────────────────────────────
function RevenueSection({ gym, openModal }) {
  const tiers       = gym.membership_tiers || [];
  const hasPricing  = tiers.length > 0 || !!gym.price;
  const defaultTiers = [
    { name: 'Monthly',  price: gym.price, description: 'Rolling, cancel anytime' },
    { name: 'Annual',   price: null,      description: 'Save 2 months'           },
    { name: 'Day pass', price: null,      description: 'Pay-per-visit'           },
  ];
  const display = tiers.length > 0 ? tiers : defaultTiers;

  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHeader id="revenue" label="Revenue & membership" purpose="How your gym earns — pricing, plans, and payment structure." />

      <Card leftAccent={!hasPricing ? C.danger : undefined} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconBox icon={CreditCard} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Pricing plans</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Displayed on your public profile</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={hasPricing ? 'complete' : 'critical'} />
            <ActionBtn label="Edit pricing" icon={Edit2} onClick={() => openModal('pricing')} variant="outline" />
          </div>
        </div>

        {!hasPricing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)', marginBottom: 20 }}>
            <AlertTriangle style={{ width: 13, height: 13, color: C.danger, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.danger }}>No pricing set</div>
              <div style={{ fontSize: 10, color: C.t2, marginTop: 1 }}>Prospects can't see what you charge. Add at least one plan to start accepting members.</div>
            </div>
            <button onClick={() => openModal('pricing')} style={{ padding: '6px 14px', borderRadius: 7, background: C.danger, color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              Set pricing
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {display.map((tier, i) => (
            <div key={i} style={{ padding: '16px 14px', borderRadius: 10, background: tier.price ? 'rgba(255,255,255,0.025)' : C.elevated, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                {tier.name}
              </div>
              {tier.price ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
                    £{tier.price}<span style={{ fontSize: 11, fontWeight: 500, color: C.t3 }}>/mo</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.t3 }}>{tier.description}</div>
                </>
              ) : (
                <>
                  <button onClick={() => openModal('pricing')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 4 }}>
                    <Plus style={{ width: 10, height: 10 }} /> Set price
                  </button>
                  <div style={{ fontSize: 10, color: C.t3 }}>{tier.description}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Rewards */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconBox icon={Gift} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Rewards catalogue</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Incentives for check-ins, referrals, and milestones</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.t2 }}>0 rewards</span>
            <ActionBtn label="Add reward" icon={Plus} onClick={() => openModal('rewards')} variant="soft" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section 5 — Team & Permissions
// ─────────────────────────────────────────────
function TeamSection({ gym, coaches, openModal }) {
  const roles = [
    { label: 'Admin',      desc: 'Full access — settings, members, and billing'      },
    { label: 'Coach',      desc: 'Manage their own classes, see member check-ins'    },
    { label: 'Front desk', desc: 'Check in members, view the daily schedule'         },
  ];
  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHeader id="team" label="Team & permissions" purpose="Invite staff and control what each role can see and do." />
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Active staff</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{coaches.length} coach{coaches.length !== 1 ? 'es' : ''} added</div>
            </div>
            <ActionBtn label="Invite staff" icon={Plus} onClick={() => openModal('inviteStaff')} variant="outline" />
          </div>
          {coaches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {coaches.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: C.elevated, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${C.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: C.t3 }}>{c.role}</div>
                  </div>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.active ? C.success : C.t3 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '22px', textAlign: 'center', border: `2px dashed ${C.border}`, borderRadius: 10 }}>
              <Users style={{ width: 20, height: 20, color: C.t3, margin: '0 auto 8px', display: 'block', opacity: 0.35 }} />
              <div style={{ fontSize: 12, color: C.t3 }}>No staff yet — invite your first coach</div>
            </div>
          )}
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 14 }}>Access levels</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roles.map((r, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: C.elevated, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.t1, marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.4 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section 6 — Automations
// ─────────────────────────────────────────────
function AutomationsSection({ openModal }) {
  const [automations, setAutomations] = useState([
    { id: 'welcome',   icon: Mail,       title: 'Welcome message',    desc: 'Sent the moment someone joins your gym.',              impact: 'Improves week-1 activation',      active: false },
    { id: 'churn',     icon: TrendingUp, title: 'Churn prevention',   desc: 'Nudges members inactive for 10+ days.',                impact: 'Reduces cancellations up to 30 %', active: false },
    { id: 'reminder',  icon: Bell,       title: 'Class reminders',    desc: 'Reminds members 1 hour before their booked class.',    impact: 'Reduces no-shows significantly',   active: true  },
    { id: 'milestone', icon: Sparkles,   title: 'Milestone messages', desc: '10th check-in, 30-day streak, first anniversary.',     impact: 'Drives loyalty & word-of-mouth',  active: false },
  ]);
  const toggle = (id) => setAutomations(a => a.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const activeCount = automations.filter(a => a.active).length;

  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHeader id="automations" label="Automations" purpose="Messages and workflows that run without you — keeping members engaged while you focus on coaching." />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Smart automations</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{activeCount} of {automations.length} active</div>
          </div>
          <StatusBadge status={activeCount === 0 ? 'inactive' : activeCount === automations.length ? 'complete' : 'missing'} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {automations.map((a) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 14px', borderRadius: 10,
              background: a.active ? `${C.accent}05` : C.elevated,
              border: `1px solid ${a.active ? C.accent + '18' : C.border}`,
              transition: 'all 0.2s',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: a.active ? `${C.accent}14` : C.raised, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                <a.icon style={{ width: 13, height: 13, color: a.active ? C.accent : C.t3 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: C.t3 }}>{a.desc}</div>
                {a.active && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                    <Zap style={{ width: 9, height: 9, color: C.success }} />
                    <span style={{ fontSize: 9, color: C.success, fontWeight: 600 }}>{a.impact}</span>
                  </div>
                )}
              </div>
              <Toggle value={a.active} onChange={() => toggle(a.id)} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 12px', borderRadius: 8, background: C.elevated, border: `1px solid ${C.border}` }}>
          <Info style={{ width: 10, height: 10, color: C.t3, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 10, color: C.t3, lineHeight: 1.5 }}>Toggling an automation takes effect immediately. Existing message history is preserved.</span>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Smart Suggestions strip
// ─────────────────────────────────────────────
function SuggestionsStrip({ gym, classes, members }) {
  const suggestions = [
    !gym.image_url      && { icon: Camera,     text: 'Gyms with hero photos see 40% more profile visits. Add yours now.' },
    classes.length === 0 && { icon: Calendar,  text: 'Add your first class to start onboarding members and show your schedule.' },
    !gym.price          && { icon: CreditCard, text: 'Set a membership price so prospects know what to expect before reaching out.' },
    members < 10        && { icon: Users,      text: 'Invite your first 10 members — early adopters become your best advocates.' },
                           { icon: Sparkles,   text: 'Enable churn prevention automations to stop losing members before they cancel.' },
  ].filter(Boolean).slice(0, 3);

  if (suggestions.length === 0) return null;

  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHeader id="suggestions" label="Smart suggestions" purpose="Personalised recommendations based on your gym's current setup." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: `${C.accent}06`, border: `1px solid ${C.accent}14` }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon style={{ width: 12, height: 12, color: C.accent }} />
            </div>
            <span style={{ fontSize: 12, color: C.t2, lineHeight: 1.5, flex: 1 }}>{s.text}</span>
            <ArrowRight style={{ width: 12, height: 12, color: C.t3, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section 7 — Admin (de-emphasized)
// ─────────────────────────────────────────────
function AdminSection({ gym, openModal }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(gym.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ marginBottom: 36 }}>
      <SectionHeader id="admin" label="Admin" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Card style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>Gym ID</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code style={{ flex: 1, fontSize: 10, color: C.t2, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gym.id || '—'}</code>
            <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 5, background: copied ? 'rgba(16,185,129,0.08)' : C.elevated, border: `1px solid ${copied ? 'rgba(16,185,129,0.2)' : C.border}`, color: copied ? C.success : C.t3, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? <><Check style={{ width: 9, height: 9 }} /> Copied</> : <><Copy style={{ width: 9, height: 9 }} /> Copy</>}
            </button>
          </div>
        </Card>
        <Card style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>Verification</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ShieldCheck style={{ width: 13, height: 13, color: gym.verified ? C.success : C.t3 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: gym.verified ? C.success : C.t2 }}>
              {gym.verified ? 'Verified & live' : 'Pending — 1–2 business days'}
            </span>
          </div>
        </Card>
      </div>

      <div style={{ borderRadius: 11, border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.025)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <AlertTriangle style={{ width: 11, height: 11, color: C.danger, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.t2 }}>Danger zone</span>
          <span style={{ fontSize: 10, color: C.t3 }}>— irreversible actions</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Delete gym',     fn: () => openModal('deleteGym')     },
            { label: 'Delete account', fn: () => openModal('deleteAccount') },
          ].map((d, i) => (
            <ActionBtn key={i} label={d.label} onClick={d.fn} variant="danger" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Left sidebar nav
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'health',      label: 'Business health',   icon: Activity   },
  { id: 'setup',       label: 'Business setup',    icon: Layers     },
  { id: 'ops',         label: 'Operations',        icon: Calendar   },
  { id: 'revenue',     label: 'Revenue',           icon: CreditCard },
  { id: 'team',        label: 'Team',              icon: Users      },
  { id: 'automations', label: 'Automations',       icon: Zap        },
  { id: 'suggestions', label: 'Suggestions',       icon: Sparkles   },
  { id: 'admin',       label: 'Admin',             icon: Shield     },
];

function SideNav({ active, onNav, score, scoreColor }) {
  return (
    <div style={{
      width: 210, flexShrink: 0,
      position: 'sticky', top: 0, height: '100vh',
      overflowY: 'auto', padding: '16px 8px',
      display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${C.border}`,
    }}>
      {/* Mini health indicator */}
      <div style={{ padding: '10px 10px 16px', marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HealthGauge score={score} size={42} color={scoreColor} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t2 }}>Health score</div>
            <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>
              {score >= 75 ? 'Fully configured' : score >= 50 ? 'Needs attention' : 'Getting started'}
            </div>
          </div>
        </div>
      </div>

      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onNav(id)} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 12px', borderRadius: 8, width: '100%',
            background: isActive ? `${C.accent}12` : 'transparent',
            border: `1px solid ${isActive ? C.accent + '28' : 'transparent'}`,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s', textAlign: 'left',
            marginBottom: 2,
          }}>
            <Icon style={{ width: 13, height: 13, color: isActive ? C.accent : C.t3, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? C.t1 : C.t2 }}>
              {label}
            </span>
          </button>
        );
      })}

      {/* Bottom: view public page */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 7, width: '100%',
          padding: '8px 12px', borderRadius: 8,
          background: C.elevated, border: `1px solid ${C.border}`,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <ExternalLink style={{ width: 11, height: 11, color: C.t3 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.t2 }}>View public page</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Live stats strip (replaces top bar from original)
// ─────────────────────────────────────────────
function LiveStatsStrip({ members, checkIns30, retentionRate, atRisk }) {
  const stats = [
    { label: 'Members',     value: members,       sub: 'enrolled',    icon: Users,      color: C.t1 },
    { label: 'Check-ins',   value: checkIns30,    sub: 'this month',  icon: BarChart2,  color: C.t1 },
    { label: 'Retention',   value: `${retentionRate}%`, sub: retentionRate >= 70 ? 'Healthy' : 'Below target', icon: TrendingUp, color: retentionRate >= 70 ? C.success : C.warn },
    { label: 'At risk',     value: atRisk,        sub: atRisk > 0 ? '14+ days out' : 'All clear', icon: Zap, color: atRisk > 0 ? C.danger : C.success },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 28 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: '14px 16px 12px', borderRadius: R, background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{s.label}</span>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.elevated, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon style={{ width: 10, height: 10, color: C.t3 }} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
          <div style={{ fontSize: 9, color: C.t3, fontWeight: 500 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main export — GymControlCenter
// ─────────────────────────────────────────────
export default function GymControlCenter({
  selectedGym,
  classes      = [],
  coaches      = [],
  openModal    = () => {},
  checkIns     = [],
  allMemberships = [],
  atRisk       = 0,
  retentionRate = 0,
  rewards      = [],
  onCreateReward,
  onDeleteReward,
  isLoading,
}) {
  // Fall back to mock data if props not provided (for dev preview)
  const gym     = selectedGym || MOCK.gym;
  const cls     = classes.length     > 0 ? classes     : MOCK.classes;
  const coa     = coaches.length     > 0 ? coaches     : MOCK.coaches;
  const members = allMemberships.length > 0 ? allMemberships.length : MOCK.members;
  const ret     = retentionRate > 0 ? retentionRate : MOCK.retentionRate;
  const risk    = atRisk;
  const ci30    = checkIns.length  > 0 ? checkIns.length : MOCK.checkIns30;

  const score = useMemo(() => {
    let s = 0;
    if (gym.image_url)      s += 10;
    if (gym.description)    s += 5;
    if (gym.logo_url)       s += 5;
    if (cls.length > 0)     s += 15;
    if (coa.length > 0)     s += 15;
    if (members > 0)        s += 20;
    if (ret >= 70)          s += 15;
    if (risk === 0)         s += 5;
    if (gym.verified)       s += 10;
    return Math.min(100, s);
  }, [gym, cls, coa, members, ret, risk]);

  const scoreColor = score >= 75 ? C.success : score >= 50 ? C.warn : C.danger;
  const [activeSection, setActiveSection] = useState('health');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  // Update active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3 }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'inherit' }}>
      <SideNav active={activeSection} onNav={scrollTo} score={score} scoreColor={scoreColor} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', minWidth: 0 }}>
        {/* Live stats */}
        <LiveStatsStrip members={members} checkIns30={ci30} retentionRate={ret} atRisk={risk} />

        {/* Sections */}
        <HealthSection gym={gym} classes={cls} coaches={coa} members={members} retentionRate={ret} atRisk={risk} openModal={openModal} />
        <SetupSection gym={gym} openModal={openModal} />
        <OpsSection gym={gym} classes={cls} coaches={coa} openModal={openModal} />
        <RevenueSection gym={gym} openModal={openModal} />
        <TeamSection gym={gym} coaches={coa} openModal={openModal} />
        <AutomationsSection openModal={openModal} />
        <SuggestionsStrip gym={gym} classes={cls} members={members} />
        <AdminSection gym={gym} openModal={openModal} />
      </div>
    </div>
  );
}
