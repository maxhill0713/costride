import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Gift, Plus, Trash2, CheckCircle, Clock, Star, Zap, Award,
  Users, TrendingUp, AlertTriangle, Search, ChevronRight, X,
  BarChart2, Tag, Lock, Infinity,
} from 'lucide-react';
import { AppButton } from '@/components/ui/AppButton';
import { cn } from '@/lib/utils';

// ── Card shell ────────────────────────────────────────────────────────────────
// Each card has a subtle top gradient line (accent varies by context — kept inline where dynamic)
const CARD = 'bg-[#0b1020] border border-white/[0.04] rounded-xl relative overflow-hidden';

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

// ── Precomputed KPI color class sets (JIT requirement: full class strings) ────
const KPI_COLORS = [
  { textCls: 'text-amber-400',   iconBgCls: 'bg-amber-400/[0.08]',   iconBrdCls: 'border-amber-400/[0.13]',   hex: '#f59e0b' },
  { textCls: 'text-emerald-500', iconBgCls: 'bg-emerald-500/[0.08]', iconBrdCls: 'border-emerald-500/[0.13]', hex: '#10b981' },
  { textCls: 'text-sky-500',     iconBgCls: 'bg-sky-500/[0.08]',     iconBrdCls: 'border-sky-500/[0.13]',     hex: '#0ea5e9' },
  { textCls: 'text-violet-500',  iconBgCls: 'bg-violet-500/[0.08]',  iconBrdCls: 'border-violet-500/[0.13]',  hex: '#8b5cf6' },
];

// ── Input class string ────────────────────────────────────────────────────────
const INPUT_CLS = 'w-full bg-white/[0.04] border border-white/[0.04] rounded-lg text-[#f0f4f8] text-xs px-[11px] py-2 outline-none font-inherit box-border focus:border-white/[0.07] transition-colors';

// ── Reward card ───────────────────────────────────────────────────────────────
function RewardCard({ reward, claimedCount, onDelete, onToggle }) {
  const isLimited = reward.quantity_limited && reward.max_quantity;
  const remaining = isLimited ? Math.max(0, reward.max_quantity - claimedCount) : null;
  const isFull    = remaining !== null && remaining === 0;

  return (
    <div className={cn(CARD, 'p-[16px_18px]')}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.12),transparent)' }} />
      <div className="flex items-start gap-3">
        {/* Emoji badge */}
        <div className="w-[42px] h-[42px] rounded-[11px] bg-amber-400/[0.08] border border-amber-400/[0.16] flex items-center justify-center text-[20px] shrink-0">
          {reward.icon || typeEmoji(reward.type)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[6px] flex-wrap mb-[3px]">
            <span className="text-[13px] font-bold text-[#f0f4f8]">{reward.title}</span>
            {reward.premium_only && (
              <span className="text-[9px] font-extrabold text-violet-500 bg-violet-500/[0.08] border border-violet-500/[0.15] rounded-[4px] px-[6px] py-[1px]">
                <Lock className="w-2 h-2 inline mr-[2px]" />PREMIUM
              </span>
            )}
            {!reward.active && (
              <span className="text-[9px] font-bold text-[#475569] bg-white/[0.05] border border-white/[0.04] rounded-[4px] px-[6px] py-[1px]">PAUSED</span>
            )}
          </div>

          {reward.description && (
            <div className="text-[11px] text-[#475569] mb-[6px] leading-[1.45]">{reward.description}</div>
          )}

          <div className="flex flex-wrap gap-[5px]">
            <span className="text-[10px] font-semibold text-[#94a3b8] bg-white/[0.05] rounded-[5px] px-2 py-[2px]">
              {typeLabel(reward.type)}
            </span>
            <span className="text-[10px] font-semibold text-sky-500 bg-sky-500/[0.06] border border-sky-500/[0.13] rounded-[5px] px-2 py-[2px]">
              {reqLabel(reward.requirement)}
            </span>
            {reward.value && (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/[0.06] border border-emerald-500/[0.12] rounded-[5px] px-2 py-[2px]">
                {reward.value}
              </span>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-end gap-[6px] shrink-0">
          <div className="flex gap-[5px]">
            <button onClick={() => onToggle(reward)} title={reward.active ? 'Pause' : 'Activate'}
              className={cn(
                'w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer border transition-colors',
                reward.active
                  ? 'bg-emerald-500/[0.07] border-emerald-500/[0.16] text-emerald-500'
                  : 'bg-white/[0.05] border-white/[0.04] text-[#475569]',
              )}>
              {reward.active ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            </button>
            <button onClick={() => onDelete(reward.id)} title="Delete"
              className="w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer bg-red-500/[0.04] border border-red-500/[0.12] text-red-500">
              <Trash2 className="w-[11px] h-[11px]" />
            </button>
          </div>
          <div className="text-right">
            <div className={cn('text-[16px] font-extrabold tracking-[-0.03em]', claimedCount > 0 ? 'text-amber-400' : 'text-[#475569]')}>
              {claimedCount}
            </div>
            <div className="text-[9px] text-[#475569] font-semibold uppercase tracking-[0.05em]">claimed</div>
          </div>
          {isLimited && (
            <div className={cn('text-[10px] font-semibold', isFull ? 'text-red-500' : 'text-[#475569]')}>
              {isFull ? 'Sold out' : `${remaining} left`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create reward form ────────────────────────────────────────────────────────
const EMPTY_FORM = { title: '', description: '', type: 'discount', requirement: 'check_ins_10', value: '', icon: '', points_required: 0, active: true, premium_only: false, quantity_limited: false, max_quantity: 0 };

const TOGGLE_OPTS = [
  { key: 'premium_only',     label: 'Premium only', activeCls: 'bg-violet-500/[0.08] border-violet-500/[0.19] text-violet-500', inactiveCls: 'bg-white/[0.05] border-white/[0.04] text-[#475569]' },
  { key: 'quantity_limited', label: 'Limited qty',  activeCls: 'bg-amber-400/[0.08] border-amber-400/[0.19] text-amber-400',   inactiveCls: 'bg-white/[0.05] border-white/[0.04] text-[#475569]' },
];

function CreateRewardPanel({ gym, onSave, onCancel, isLoading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={cn(CARD, 'p-5')}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(14,165,233,0.2),transparent)' }} />
      <div className="text-[13px] font-bold text-[#f0f4f8] mb-4">New Reward</div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-[10px]">
          <div>
            <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-[5px]">Title *</div>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Free Shake" className={INPUT_CLS} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-[5px]">Value / Amount</div>
            <input value={form.value} onChange={e => set('value', e.target.value)} placeholder="e.g. £10 off" className={INPUT_CLS} />
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-[5px]">Description</div>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this reward include?" rows={2}
            className={cn(INPUT_CLS, 'resize-none leading-[1.5]')} />
        </div>

        <div className="grid grid-cols-2 gap-[10px]">
          <div>
            <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-[5px]">Type</div>
            <select value={form.type} onChange={e => set('type', e.target.value)} className={cn(INPUT_CLS, 'cursor-pointer')} style={{ colorScheme: 'dark' }}>
              {REWARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-[5px]">Requirement</div>
            <select value={form.requirement} onChange={e => set('requirement', e.target.value)} className={cn(INPUT_CLS, 'cursor-pointer')} style={{ colorScheme: 'dark' }}>
              {REQUIREMENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {form.requirement === 'points' && (
          <div>
            <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-[5px]">Points Required</div>
            <input type="number" value={form.points_required} onChange={e => set('points_required', parseInt(e.target.value) || 0)} min={0} className={INPUT_CLS} />
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {TOGGLE_OPTS.map(tog => (
            <button key={tog.key} onClick={() => set(tog.key, !form[tog.key])}
              className={cn('flex items-center gap-[6px] px-3 py-[6px] rounded-[7px] text-[11px] font-bold cursor-pointer border transition-all', form[tog.key] ? tog.activeCls : tog.inactiveCls)}>
              <div className={cn('w-[14px] h-[14px] rounded-[4px] border-2 border-current flex items-center justify-center transition-colors', form[tog.key] ? 'bg-current' : 'bg-transparent')}>
                {form[tog.key] && <X className="w-2 h-2 text-white" />}
              </div>
              {tog.label}
            </button>
          ))}
        </div>

        {form.quantity_limited && (
          <div>
            <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-[5px]">Max Quantity</div>
            <input type="number" value={form.max_quantity} onChange={e => set('max_quantity', parseInt(e.target.value) || 0)} min={1} className={INPUT_CLS} />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <AppButton variant="secondary" size="md" className="flex-1 justify-center" onClick={onCancel}>Cancel</AppButton>
          <button
            onClick={() => { if (!form.title.trim()) return; onSave({ ...form, gym_id: gym?.id, gym_name: gym?.name }); setForm(EMPTY_FORM); }}
            disabled={!form.title.trim() || isLoading}
            className={cn('flex-[2] px-4 py-[9px] rounded-lg text-xs font-bold cursor-pointer border-none transition-opacity', form.title.trim() ? 'text-white opacity-100' : 'text-[#475569] opacity-60')}
            style={form.title.trim() ? { background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' } : { background: 'rgba(255,255,255,0.05)' }}
          >
            {isLoading ? 'Creating…' : 'Create Reward'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Redemption log row ────────────────────────────────────────────────────────
function RedemptionRow({ bonus, rewards, last }) {
  const reward = rewards.find(r => r.id === bonus.reward_id);
  const timeAgo = t => {
    const s = (Date.now() - new Date(t)) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className={cn('flex items-center gap-[10px] py-[9px]', !last && 'border-b border-white/[0.05]')}>
      <div className="w-8 h-8 rounded-[9px] bg-amber-400/[0.08] border border-amber-400/[0.13] flex items-center justify-center text-[16px] shrink-0">
        {reward?.icon || typeEmoji(reward?.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#f0f4f8] overflow-hidden text-ellipsis whitespace-nowrap">{bonus.user_name || 'Member'}</div>
        <div className="text-[10px] text-[#475569] mt-[1px]">{reward?.title || 'Unknown reward'}</div>
      </div>
      <span className="text-[10px] text-[#475569] shrink-0">{timeAgo(bonus.created_date)}</span>
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

  const kpis = [
    { icon: Gift,       label: 'Active Rewards',  value: activeRewards,    sub: `${rewards.length} total` },
    { icon: CheckCircle, label: 'Total Claimed',  value: totalClaimed,     sub: `${thisMonthClaims} this month` },
    { icon: Users,       label: 'Unique Claimers', value: uniqueClaimers,  sub: 'members redeemed' },
    { icon: TrendingUp,  label: 'This Month',      value: thisMonthClaims, sub: 'new redemptions' },
  ];

  return (
    <div className={cn('grid gap-[18px] items-start', isMobile ? 'grid-cols-1' : 'grid-cols-[1fr_280px]')}>

      {/* ── LEFT ── */}
      <div className="flex flex-col gap-[14px]">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((k, i) => {
            const { textCls, iconBgCls, iconBrdCls, hex } = KPI_COLORS[i];
            return (
              <div key={i} className={cn(CARD, 'px-[18px] py-4')}>
                {/* Data-driven gradient line — kept inline */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${hex}22,transparent)` }} />
                <div className="flex items-center justify-between mb-[10px]">
                  <span className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.09em]">{k.label}</span>
                  <div className={cn('w-[26px] h-[26px] rounded-[7px] flex items-center justify-center border', iconBgCls, iconBrdCls)}>
                    <k.icon className={cn('w-3 h-3', textCls)} />
                  </div>
                </div>
                <div className="text-[32px] font-extrabold text-[#f0f4f8] tracking-[-0.05em] leading-none mb-1">{k.value}</div>
                <div className="text-[11px] text-[#475569]">{k.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Create panel or button */}
        {showCreate
          ? <CreateRewardPanel gym={selectedGym} onSave={d => { onCreateReward(d); setShowCreate(false); }} onCancel={() => setShowCreate(false)} isLoading={isLoading} />
          : (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center justify-center gap-2 py-[13px] rounded-xl bg-amber-400/[0.05] border border-dashed border-amber-400/[0.25] text-amber-400 text-[13px] font-bold cursor-pointer hover:bg-amber-400/[0.09] transition-colors">
              <Plus className="w-[15px] h-[15px]" /> Create New Reward
            </button>
          )
        }

        {/* Most Claimed — surfaced to top on mobile */}
        {isMobile && topRewards.length > 0 && (
          <div className={cn(CARD, 'px-4 py-3.5')}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.15),transparent)' }} />
            <div className="flex items-center gap-[7px] mb-3">
              <Award className="w-[11px] h-[11px] text-amber-400" />
              <span className="text-[11px] font-bold text-[#f0f4f8]">Most Claimed</span>
            </div>
            <div className="flex flex-col gap-0">
              {topRewards.map((r, i) => (
                <div key={r.id} className={cn('flex items-center gap-[10px] py-[7px]', i < topRewards.length - 1 && 'border-b border-white/[0.05]')}>
                  <div className={cn('w-[20px] h-[20px] rounded-[5px] flex items-center justify-center text-[9px] font-extrabold shrink-0', i === 0 ? 'bg-amber-400/[0.09] text-amber-400' : 'bg-white/[0.05] text-[#475569]')}>
                    #{i + 1}
                  </div>
                  <span className="flex-1 text-[11.5px] text-[#f0f4f8] overflow-hidden text-ellipsis whitespace-nowrap">{r.title}</span>
                  <span className="text-xs font-extrabold text-amber-400 tabular-nums">{claimCountMap[r.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rewards…"
              className="w-full pl-[30px] pr-[10px] h-[34px] rounded-lg bg-white/[0.04] border border-white/[0.04] text-[#f0f4f8] text-xs outline-none box-border focus:border-white/[0.07] transition-colors" />
          </div>
          {[{ value: 'all', label: 'All' }, ...REWARD_TYPES.slice(0, 4)].map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              className={cn(
                'px-[11px] py-[5px] rounded-[7px] text-[11px] font-bold cursor-pointer border transition-all whitespace-nowrap',
                filterType === t.value
                  ? 'bg-amber-400/[0.08] text-amber-400 border-amber-400/[0.19]'
                  : 'bg-white/[0.05] text-[#475569] border-white/[0.04] hover:text-[#94a3b8]',
              )}>
              {t.emoji ? `${t.emoji} ${t.label}` : t.label}
            </button>
          ))}
        </div>

        {/* Reward list */}
        {filtered.length === 0 ? (
          <div className={cn(CARD, 'p-[40px_24px] text-center')}>
            <Gift className="w-7 h-7 text-[#475569] mx-auto mb-[10px] opacity-40 block" />
            <div className="text-[13px] font-semibold text-[#475569]">
              {rewards.length === 0 ? 'No rewards yet — create your first one above' : 'No rewards match your filters'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
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
      <div className="flex flex-col gap-3">

        {/* Top rewards — hidden on mobile (shown at top of left column instead) */}
        {!isMobile && topRewards.length > 0 && (
          <div className={cn(CARD, 'p-5')}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.15),transparent)' }} />
            <div className="flex items-center gap-[7px] mb-[14px]">
              <Award className="w-[13px] h-[13px] text-amber-400" />
              <span className="text-[13px] font-bold text-[#f0f4f8]">Most Claimed</span>
            </div>
            {topRewards.map((r, i) => (
              <div key={r.id} className={cn('flex items-center gap-[10px] py-2', i < topRewards.length - 1 && 'border-b border-white/[0.05]')}>
                <div className={cn('w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[10px] font-extrabold shrink-0', i === 0 ? 'bg-amber-400/[0.09] text-amber-400' : 'bg-white/[0.05] text-[#475569]')}>
                  #{i + 1}
                </div>
                <span className="flex-1 text-xs text-[#f0f4f8] overflow-hidden text-ellipsis whitespace-nowrap">{r.title}</span>
                <span className="text-[13px] font-extrabold text-amber-400">{claimCountMap[r.id] || 0}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent redemptions */}
        <div className={cn(CARD, 'p-5')}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(14,165,233,0.12),transparent)' }} />
          <div className="text-[13px] font-bold text-[#f0f4f8] mb-[14px]">Recent Redemptions</div>
          {claimedBonuses.length === 0 ? (
            <div className="py-4 text-center">
              <Clock className="w-[18px] h-[18px] text-[#475569] mx-auto mb-2 block opacity-50" />
              <div className="text-xs text-[#475569]">No redemptions yet</div>
            </div>
          ) : (
            claimedBonuses.slice(0, 8).map((b, i) => (
              <RedemptionRow key={b.id} bonus={b} rewards={rewards} last={i === Math.min(claimedBonuses.length, 8) - 1} />
            ))
          )}
        </div>

        {/* Tips */}
        <div className={cn(CARD, 'p-5')}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(14,165,233,0.12),transparent)' }} />
          <div className="flex items-center gap-[7px] mb-3">
            <Zap className="w-3 h-3 text-sky-500" />
            <span className="text-xs font-bold text-[#f0f4f8]">Tips</span>
          </div>
          {[
            { icon: Tag,      iconCls: 'text-emerald-500', text: 'Tie rewards to check-in milestones for maximum engagement.' },
            { icon: Star,     iconCls: 'text-amber-400',   text: 'Limited-quantity rewards create urgency and drive check-ins.' },
            { icon: Infinity, iconCls: 'text-violet-500',  text: 'Premium-only rewards incentivize members to upgrade.' },
          ].map((tip, i) => (
            <div key={i} className={cn('flex gap-[9px]', i < 2 && 'mb-[10px]')}>
              <tip.icon className={cn('w-[11px] h-[11px] shrink-0 mt-[2px]', tip.iconCls)} />
              <span className="text-[11px] text-[#475569] leading-[1.5]">{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
