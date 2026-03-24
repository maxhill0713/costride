import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Gift, Plus, Trash2, CheckCircle, Clock, Star, Zap, Award,
  Users, TrendingUp, AlertTriangle, Search, ChevronRight, X,
  BarChart2, Tag, Lock, Infinity,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  blue:    '#0ea5e9',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  divider: 'rgba(255,255,255,0.05)',
};

const REWARD_TYPES = [
  { value: 'discount',          label: 'Discount',          emoji: '💸' },
  { value: 'free_class',        label: 'Free Class',         emoji: '🧘' },
  { value: 'merchandise',       label: 'Merchandise',        emoji: '👕' },
  { value: 'free_day_pass',     label: 'Free Day Pass',      emoji: '🎟️' },
  { value: 'personal_training', label: 'Personal Training',  emoji: '🏋️' },
  { value: 'custom',            label: 'Custom',             emoji: '🎁' },
];

const REQUIREMENTS = [
  { value: 'check_ins_10',     label: '10 Check-ins' },
  { value: 'check_ins_50',     label: '50 Check-ins' },
  { value: 'streak_30',        label: '30-day streak' },
  { value: 'challenge_winner', label: 'Challenge winner' },
  { value: 'referral',         label: 'Referral' },
  { value: 'points',           label: 'Points' },
  { value: 'none',             label: 'Manual / none' },
];

const typeEmoji = type => REWARD_TYPES.find(r => r.value === type)?.emoji || '🎁';
const typeLabel = type => REWARD_TYPES.find(r => r.value === type)?.label || type;
const reqLabel  = req  => REQUIREMENTS.find(r => r.value === req)?.label || req;

// ── Tiny card shell ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, position: 'relative', overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(14,165,233,0.2),transparent)`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

// ── Reward card ────────────────────────────────────────────────────────────────
function RewardCard({ reward, claimedCount, onDelete, onToggle }) {
  const [hov, setHov] = useState(false);
  const isLimited = reward.quantity_limited && reward.max_quantity;
  const remaining = isLimited ? Math.max(0, reward.max_quantity - claimedCount) : null;
  const isFull    = remaining !== null && remaining === 0;

  return (
    <Card style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Emoji badge */}
        <div style={{ width: 42, height: 42, borderRadius: 11, background: `${T.amber}14`, border: `1px solid ${T.amber}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          {reward.icon || typeEmoji(reward.type)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{reward.title}</span>
            {reward.premium_only && (
              <span style={{ fontSize: 9, fontWeight: 800, color: T.purple, background: `${T.purple}14`, border: `1px solid ${T.purple}25`, borderRadius: 4, padding: '1px 6px' }}>
                <Lock style={{ width: 8, height: 8, display: 'inline', marginRight: 2 }} />PREMIUM
              </span>
            )}
            {!reward.active && (
              <span style={{ fontSize: 9, fontWeight: 700, color: T.text3, background: T.divider, border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 6px' }}>PAUSED</span>
            )}
          </div>

          {reward.description && (
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, lineHeight: 1.45 }}>{reward.description}</div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.text2, background: T.divider, borderRadius: 5, padding: '2px 8px' }}>
              {typeLabel(reward.type)}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.blue, background: `${T.blue}10`, border: `1px solid ${T.blue}22`, borderRadius: 5, padding: '2px 8px' }}>
              {reqLabel(reward.requirement)}
            </span>
            {reward.value && (
              <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: `${T.green}10`, border: `1px solid ${T.green}20`, borderRadius: 5, padding: '2px 8px' }}>
                {reward.value}
              </span>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => onToggle(reward)} title={reward.active ? 'Pause' : 'Activate'}
              style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: reward.active ? `${T.green}12` : T.divider, border: `1px solid ${reward.active ? T.green + '28' : T.border}`, color: reward.active ? T.green : T.text3, cursor: 'pointer' }}>
              {reward.active ? <CheckCircle style={{ width: 12, height: 12 }} /> : <Clock style={{ width: 12, height: 12 }} />}
            </button>
            <button onClick={() => onDelete(reward.id)} title="Delete"
              style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${T.red}0a`, border: `1px solid ${T.red}20`, color: T.red, cursor: 'pointer' }}>
              <Trash2 style={{ width: 11, height: 11 }} />
            </button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: claimedCount > 0 ? T.amber : T.text3, letterSpacing: '-0.03em' }}>{claimedCount}</div>
            <div style={{ fontSize: 9, color: T.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>claimed</div>
          </div>
          {isLimited && (
            <div style={{ fontSize: 10, fontWeight: 600, color: isFull ? T.red : T.text3 }}>
              {isFull ? 'Sold out' : `${remaining} left`}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Create reward form ────────────────────────────────────────────────────────
const EMPTY_FORM = { title: '', description: '', type: 'discount', requirement: 'check_ins_10', value: '', icon: '', points_required: 0, active: true, premium_only: false, quantity_limited: false, max_quantity: 0 };

function CreateRewardPanel({ gym, onSave, onCancel, isLoading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = { background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text1, fontSize: 12, padding: '8px 11px', width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 16 }}>New Reward</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Title *</div>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Free Shake" style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Value / Amount</div>
            <input value={form.value} onChange={e => set('value', e.target.value)} placeholder="e.g. £10 off" style={inp} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Description</div>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this reward include?" rows={2}
            style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Type</div>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inp, cursor: 'pointer', colorScheme: 'dark' }}>
              {REWARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Requirement</div>
            <select value={form.requirement} onChange={e => set('requirement', e.target.value)} style={{ ...inp, cursor: 'pointer', colorScheme: 'dark' }}>
              {REQUIREMENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {form.requirement === 'points' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Points Required</div>
            <input type="number" value={form.points_required} onChange={e => set('points_required', parseInt(e.target.value) || 0)} min={0} style={inp} />
          </div>
        )}

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'premium_only',    label: 'Premium only',    color: T.purple },
            { key: 'quantity_limited', label: 'Limited qty',    color: T.amber  },
          ].map(tog => (
            <button key={tog.key} onClick={() => set(tog.key, !form[tog.key])}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: form[tog.key] ? `${tog.color}14` : T.divider, border: `1px solid ${form[tog.key] ? tog.color + '30' : T.border}`, color: form[tog.key] ? tog.color : T.text3, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid currentColor`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s', background: form[tog.key] ? 'currentColor' : 'transparent' }}>
                {form[tog.key] && <X style={{ width: 8, height: 8, color: 'white' }} />}
              </div>
              {tog.label}
            </button>
          ))}
        </div>

        {form.quantity_limited && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Max Quantity</div>
            <input type="number" value={form.max_quantity} onChange={e => set('max_quantity', parseInt(e.target.value) || 0)} min={1} style={inp} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '9px', borderRadius: 8, background: T.divider, border: `1px solid ${T.border}`, color: T.text2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={() => { if (!form.title.trim()) return; onSave({ ...form, gym_id: gym?.id, gym_name: gym?.name }); setForm(EMPTY_FORM); }}
            disabled={!form.title.trim() || isLoading}
            style={{ flex: 2, padding: '9px', borderRadius: 8, background: form.title.trim() ? `linear-gradient(135deg,#0ea5e9,#06b6d4)` : T.divider, border: 'none', color: form.title.trim() ? '#fff' : T.text3, fontSize: 12, fontWeight: 700, cursor: form.title.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            {isLoading ? 'Creating…' : 'Create Reward'}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Redemption log row ────────────────────────────────────────────────────────
function RedemptionRow({ bonus, rewards, avatarMap, last }) {
  const reward = rewards.find(r => r.id === bonus.reward_id);
  const timeAgo = t => {
    const s = (Date.now() - new Date(t)) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${T.amber}14`, border: `1px solid ${T.amber}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        {reward?.icon || typeEmoji(reward?.type)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bonus.user_name || 'Member'}</div>
        <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{reward?.title || 'Unknown reward'}</div>
      </div>
      <span style={{ fontSize: 10, color: T.text3, flexShrink: 0 }}>{timeAgo(bonus.created_date)}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabRewards({ selectedGym, rewards = [], onCreateReward, onDeleteReward, isLoading }) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', selectedGym?.id],
    queryFn: () => base44.entities.ClaimedBonus.filter({ gym_id: selectedGym.id }, '-created_date', 100),
    enabled: !!selectedGym?.id,
    staleTime: 2 * 60 * 1000,
  });

  const updateRewardM = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reward.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards', selectedGym?.id] }),
  });

  // Stats
  const totalClaimed   = claimedBonuses.length;
  const uniqueClaimers = new Set(claimedBonuses.map(b => b.user_id)).size;
  const activeRewards  = rewards.filter(r => r.active).length;
  const thisMonthClaims = claimedBonuses.filter(b => {
    const d = new Date(b.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Claim counts per reward
  const claimCountMap = useMemo(() => {
    const map = {};
    claimedBonuses.forEach(b => { map[b.reward_id] = (map[b.reward_id] || 0) + 1; });
    return map;
  }, [claimedBonuses]);

  // Filtered rewards
  const filtered = useMemo(() => rewards.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType === 'all' || r.type === filterType;
    return matchSearch && matchType;
  }), [rewards, search, filterType]);

  // Top rewards by claims
  const topRewards = useMemo(() => [...rewards].sort((a, b) => (claimCountMap[b.id] || 0) - (claimCountMap[a.id] || 0)).slice(0, 3), [rewards, claimCountMap]);

  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {[
            { icon: Gift,      label: 'Active Rewards',  value: activeRewards,   color: T.amber,  sub: `${rewards.length} total` },
            { icon: CheckCircle, label: 'Total Claimed',  value: totalClaimed,   color: T.green,  sub: `${thisMonthClaims} this month` },
            { icon: Users,     label: 'Unique Claimers', value: uniqueClaimers, color: T.blue,   sub: 'members redeemed' },
            { icon: TrendingUp, label: 'This Month',     value: thisMonthClaims, color: T.purple, sub: 'new redemptions' },
          ].map((k, i) => (
            <div key={i} style={{ borderRadius: 12, padding: '16px 18px', background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${k.color}22,transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '.09em' }}>{k.label}</span>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${k.color}14`, border: `1px solid ${k.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <k.icon style={{ width: 12, height: 12, color: k.color }} />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.text1, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: T.text3 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Create panel or button */}
        {showCreate
          ? <CreateRewardPanel gym={selectedGym} onSave={d => { onCreateReward(d); setShowCreate(false); }} onCancel={() => setShowCreate(false)} isLoading={isLoading} />
          : (
            <button onClick={() => setShowCreate(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: `${T.amber}0c`, border: `1px dashed ${T.amber}40`, color: T.amber, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = `${T.amber}16`}
              onMouseLeave={e => e.currentTarget.style.background = `${T.amber}0c`}>
              <Plus style={{ width: 15, height: 15 }} /> Create New Reward
            </button>
          )
        }

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.text3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rewards…"
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.text1, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          {/* Type filter chips */}
          {[{ value: 'all', label: 'All' }, ...REWARD_TYPES.slice(0, 4)].map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: filterType === t.value ? `${T.amber}14` : T.divider, color: filterType === t.value ? T.amber : T.text3, border: `1px solid ${filterType === t.value ? T.amber + '30' : T.border}`, transition: 'all 0.12s', whiteSpace: 'nowrap' }}>
              {t.emoji ? `${t.emoji} ${t.label}` : t.label}
            </button>
          ))}
        </div>

        {/* Reward list */}
        {filtered.length === 0 ? (
          <Card style={{ padding: '40px 24px', textAlign: 'center' }}>
            <Gift style={{ width: 28, height: 28, color: T.text3, margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text3 }}>{rewards.length === 0 ? 'No rewards yet — create your first one above' : 'No rewards match your filters'}</div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(reward => (
              <RewardCard
                key={reward.id}
                reward={reward}
                claimedCount={claimCountMap[reward.id] || 0}
                onDelete={onDeleteReward}
                onToggle={r => updateRewardM.mutate({ id: r.id, data: { active: !r.active } })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Top rewards */}
        {topRewards.length > 0 && (
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <Award style={{ width: 13, height: 13, color: T.amber }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Most Claimed</span>
            </div>
            {topRewards.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topRewards.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? `${T.amber}18` : T.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i === 0 ? T.amber : T.text3, flexShrink: 0 }}>#{i + 1}</div>
                <span style={{ flex: 1, fontSize: 12, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.amber }}>{claimCountMap[r.id] || 0}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Recent redemptions */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Recent Redemptions</div>
          {claimedBonuses.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <Clock style={{ width: 18, height: 18, color: T.text3, margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
              <div style={{ fontSize: 12, color: T.text3 }}>No redemptions yet</div>
            </div>
          ) : (
            claimedBonuses.slice(0, 8).map((b, i) => (
              <RedemptionRow key={b.id} bonus={b} rewards={rewards} avatarMap={{}} last={i === Math.min(claimedBonuses.length, 8) - 1} />
            ))
          )}
        </Card>

        {/* Tips */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Zap style={{ width: 12, height: 12, color: T.blue }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>Tips</span>
          </div>
          {[
            { icon: Tag,      color: T.green,  text: 'Tie rewards to check-in milestones for maximum engagement.' },
            { icon: Star,     color: T.amber,  text: 'Limited-quantity rewards create urgency and drive check-ins.' },
            { icon: Infinity, color: T.purple, text: 'Premium-only rewards incentivize members to upgrade.' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, marginBottom: i < 2 ? 10 : 0 }}>
              <tip.icon style={{ width: 11, height: 11, color: tip.color, flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 11, color: T.text3, lineHeight: 1.5 }}>{tip.text}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}