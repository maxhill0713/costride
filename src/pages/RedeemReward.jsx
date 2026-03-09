import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Gift, Zap, Lock, CheckCircle, ChevronRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';

// ── Shared styles ─────────────────────────────────────────────────────────────
const GLASS = {
  background: 'linear-gradient(135deg, rgba(15,22,50,0.80) 0%, rgba(6,10,28,0.92) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderTop: '1px solid rgba(255,255,255,0.11)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

const SECTION_ANIM = `
@keyframes rr-fade-up {
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes rr-card-in {
  from { opacity:0; transform:translateY(20px) scale(0.96); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes rr-shimmer {
  0%   { transform:translateX(-100%); }
  100% { transform:translateX(300%); }
}
@keyframes rr-pulse-ring {
  0%,100% { opacity:0.5; transform:scale(1); }
  50%     { opacity:1;   transform:scale(1.06); }
}
`;

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'weekly',
    label: 'Weekly',
    icon: Zap,
    activeGrad: 'linear-gradient(180deg,#a855f7 0%,#7c3aed 50%,#6d28d9 100%)',
    activeFloor: '#4c1d95',
    activeGlow: 'rgba(139,92,246,0.45)',
    accentRgb: '139,92,246',
  },
  {
    id: 'community',
    label: 'Community',
    icon: Trophy,
    activeGrad: 'linear-gradient(180deg,#3b82f6 0%,#2563eb 50%,#1d4ed8 100%)',
    activeFloor: '#1e3a8a',
    activeGlow: 'rgba(59,130,246,0.4)',
    accentRgb: '59,130,246',
  },
  {
    id: 'rewards',
    label: 'Rewards',
    icon: Gift,
    activeGrad: 'linear-gradient(180deg,#fbbf24 0%,#f59e0b 50%,#d97706 100%)',
    activeFloor: '#92400e',
    activeGlow: 'rgba(251,191,36,0.4)',
    accentRgb: '251,191,36',
  },
];

// ── 3D Tab Button ─────────────────────────────────────────────────────────────
function Tab3D({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 flex-1
        whitespace-nowrap font-bold transition-all duration-100
        focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50
        py-2 rounded-lg text-xs h-9 px-3
        active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu
        ${active
          ? `text-white border border-transparent`
          : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 shadow-[0_3px_0_0_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]'
        }
      `}
      style={active ? {
        background: tab.activeGrad,
        boxShadow: `0 3px 0 0 ${tab.activeFloor}, 0 8px 20px ${tab.activeGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        border: '1px solid transparent',
      } : {}}
    >
      <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
      {tab.label}
    </button>
  );
}

// ── Challenge progress card ───────────────────────────────────────────────────
function CommunityCard({ challenge, idx }) {
  const pct = Math.min(100, challenge.progress || 0);
  return (
    <div style={{
      ...GLASS,
      borderRadius: 20,
      padding: '18px 18px 16px',
      position: 'relative',
      overflow: 'hidden',
      animation: `rr-card-in 0.35s cubic-bezier(0.34,1.2,0.64,1) ${idx * 0.07}s both`,
    }}>
      {/* Left accent line */}
      <div style={{ position:'absolute',left:0,top:'15%',bottom:'15%',width:3,borderRadius:99,background:'linear-gradient(180deg,#3b82f6,#1d4ed8)',boxShadow:'0 0 8px rgba(59,130,246,0.5)' }}/>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10 }}>
        <div style={{ flex:1,paddingLeft:10 }}>
          <h4 style={{ fontSize:14,fontWeight:800,color:'#fff',marginBottom:3,letterSpacing:'-0.02em' }}>{challenge.title}</h4>
          <p style={{ fontSize:11,color:'rgba(148,163,184,0.65)',lineHeight:1.4 }}>{challenge.description}</p>
        </div>
        <div style={{ flexShrink:0,marginLeft:12,padding:'4px 10px',borderRadius:8,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.25)',display:'flex',alignItems:'center',gap:4 }}>
          <CheckCircle style={{ width:11,height:11,color:'#4ade80' }}/>
          <span style={{ fontSize:10,fontWeight:800,color:'#4ade80' }}>Joined</span>
        </div>
      </div>
      {/* Progress */}
      <div style={{ paddingLeft:10 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
          <span style={{ fontSize:10,fontWeight:700,color:'rgba(148,163,184,0.5)',textTransform:'uppercase',letterSpacing:'0.08em' }}>Progress</span>
          <span style={{ fontSize:12,fontWeight:900,color:'#fbbf24',letterSpacing:'-0.02em' }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height:5,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden' }}>
          <div style={{ height:'100%',borderRadius:99,width:`${pct}%`,background:'linear-gradient(90deg,#f59e0b,#fbbf24)',boxShadow:'0 0 8px rgba(251,191,36,0.4)',transition:'width 0.8s cubic-bezier(0.34,1.2,0.64,1)' }}/>
        </div>
      </div>
    </div>
  );
}

// ── Reward card ───────────────────────────────────────────────────────────────
function RewardCard({ reward, onClaim, isPending, isPremium, idx }) {
  const isChallenge = reward.isChallenge;
  const locked = reward.premium_only && !isPremium;
  const accentColor = isChallenge ? '#fbbf24' : '#22d3ee';
  const accentRgb = isChallenge ? '251,191,36' : '34,211,238';

  return (
    <div style={{
      ...GLASS,
      borderRadius: 20,
      padding: '18px',
      position: 'relative',
      overflow: 'hidden',
      animation: `rr-card-in 0.35s cubic-bezier(0.34,1.2,0.64,1) ${idx * 0.07}s both`,
      opacity: locked ? 0.65 : 1,
    }}>
      {/* Top accent line */}
      <div style={{ position:'absolute',top:0,left:'10%',right:'10%',height:1.5,borderRadius:99,background:`linear-gradient(90deg,transparent,rgba(${accentRgb},0.7),transparent)` }}/>

      <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:14 }}>
        {/* Icon block */}
        <div style={{ width:44,height:44,borderRadius:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:`rgba(${accentRgb},0.1)`,border:`1px solid rgba(${accentRgb},0.2)`,fontSize:20 }}>
          {isChallenge ? '🏆' : '🎁'}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
            <h3 style={{ fontSize:14,fontWeight:800,color:'#fff',letterSpacing:'-0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{reward.title}</h3>
            {reward.premium_only && (
              <span style={{ flexShrink:0,fontSize:9,fontWeight:900,letterSpacing:'0.08em',color:'#c084fc',background:'rgba(192,132,252,0.12)',border:'1px solid rgba(192,132,252,0.25)',padding:'2px 6px',borderRadius:5,textTransform:'uppercase' }}>PRO</span>
            )}
          </div>
          <p style={{ fontSize:11,color:`rgba(${accentRgb},0.8)`,fontWeight:600 }}>
            {isChallenge ? reward.earnedText : reward.description}
          </p>
        </div>
      </div>

      {/* Reward value */}
      {(reward.reward || reward.value) && (
        <div style={{ marginBottom:14,padding:'10px 12px',borderRadius:12,background:`rgba(${accentRgb},0.06)`,border:`1px solid rgba(${accentRgb},0.12)`,display:'flex',alignItems:'center',gap:8 }}>
          <Star style={{ width:13,height:13,color:accentColor,flexShrink:0 }}/>
          <span style={{ fontSize:12,color:'rgba(255,255,255,0.7)',fontWeight:600 }}>{reward.reward || reward.value}</span>
        </div>
      )}

      {/* Type badge */}
      <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:14 }}>
        <span style={{ fontSize:10,fontWeight:800,letterSpacing:'0.06em',textTransform:'uppercase',color:accentColor,background:`rgba(${accentRgb},0.1)`,border:`1px solid rgba(${accentRgb},0.2)`,padding:'3px 8px',borderRadius:6 }}>
          {isChallenge ? 'Challenge Reward' : 'Available'}
        </span>
      </div>

      {/* Claim button — 3D style */}
      <ClaimButton onClaim={onClaim} isPending={isPending} locked={locked} accentColor={accentColor} accentRgb={accentRgb} isChallenge={isChallenge}/>
    </div>
  );
}

function ClaimButton({ onClaim, isPending, locked, accentColor, accentRgb, isChallenge }) {
  const [pressed, setPressed] = useState(false);
  const floorColor = isChallenge ? '#78350f' : '#164e63';

  return (
    <button
      onClick={onClaim}
      disabled={isPending || locked}
      onMouseDown={() => !isPending && !locked && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !isPending && !locked && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: '100%',
        padding: '10px 0',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: locked ? 'rgba(148,163,184,0.5)' : '#fff',
        background: locked
          ? 'rgba(255,255,255,0.04)'
          : pressed
            ? `rgba(${accentRgb},0.25)`
            : `linear-gradient(180deg,rgba(${accentRgb},0.28) 0%,rgba(${accentRgb},0.18) 100%)`,
        border: locked ? '1px solid rgba(255,255,255,0.07)' : `1px solid rgba(${accentRgb},0.35)`,
        borderBottom: locked ? '3px solid rgba(0,0,0,0.3)' : pressed ? '1px solid rgba(0,0,0,0.4)' : `3px solid ${floorColor}`,
        boxShadow: locked ? 'none' : pressed ? 'none' : `0 2px 0 rgba(0,0,0,0.35), 0 6px 20px rgba(${accentRgb},0.15), inset 0 1px 0 rgba(255,255,255,0.15)`,
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        transition: pressed ? 'transform 0.06s, box-shadow 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.18s',
        cursor: locked || isPending ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {locked ? (
        <><Lock style={{ width:13,height:13 }}/>Pro Only</>
      ) : isPending ? (
        'Claiming...'
      ) : (
        <>{!pressed && <span style={{ fontSize:14 }}>✦</span>}Claim Reward</>
      )}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon, message, sub }) {
  return (
    <div style={{ ...GLASS,borderRadius:20,padding:'48px 24px',textAlign:'center',gridColumn:'1/-1' }}>
      <div style={{ width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:24 }}>{icon}</div>
      <p style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.3)',marginBottom:4 }}>{message}</p>
      {sub && <p style={{ fontSize:12,color:'rgba(148,163,184,0.35)' }}>{sub}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RedeemReward() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeSection, setActiveSection] = useState('weekly');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const isPremium = subscription && subscription.length > 0;

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
  const gymIds = gymMemberships.map((m) => m.gym_id);

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['activeChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, '-created_date', 20),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const weeklyChallenges = allChallenges.slice(0, 3);
  const challenges = allChallenges.filter((c) => c.participants?.includes(currentUser?.id));

  const { data: completedChallenges = [] } = useQuery({
    queryKey: ['completedChallengesReward'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'completed' }, '-created_date', 30),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['gymRewards', gymIds.join(',')],
    queryFn: () => gymIds.length > 0 ? base44.entities.Reward.filter({ gym_id: gymIds[0], active: true }) : [],
    enabled: gymIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', currentUser?.id],
    queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const claimMutation = useMutation({
    mutationFn: async (rewardData) => {
      return await base44.entities.ClaimedBonus.create({
        user_id: currentUser.id,
        reward_id: rewardData.isChallenge ? null : rewardData.id,
        challenge_id: rewardData.isChallenge ? rewardData.id : null,
        offer_details: rewardData.title,
        earned_text: rewardData.earnedText || rewardData.title,
        redemption_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        redeemed: false,
      });
    },
    onMutate: async (rewardData) => {
      await queryClient.cancelQueries({ queryKey: ['claimedBonuses', currentUser?.id] });
      const previous = queryClient.getQueryData(['claimedBonuses', currentUser?.id]);
      queryClient.setQueryData(['claimedBonuses', currentUser?.id], (old = []) => [
        ...old,
        { id: `temp-${rewardData.id}`, user_id: currentUser.id, reward_id: rewardData.id },
      ]);
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['claimedBonuses', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#fbbf24','#f59e0b','#fff','#a78bfa'] });
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses'] });
      setShowQRModal(true);
    },
  });

  const userChallengeProgress = challenges.map((challenge) => {
    const targetValue = challenge.target_value || 10;
    const progress = Math.floor((challenge.participants?.length || 0) / targetValue * 100);
    return { ...challenge, progress };
  }).sort((a, b) => b.progress - a.progress);

  const unclaimedRewards = rewards.filter((r) => {
    if (!r.active) return false;
    if (claimedBonuses.find((cb) => cb.reward_id === r.id)) return false;
    return true;
  });

  const completedChallengeRewards = completedChallenges
    .filter((c) => {
      const isParticipant = c.participants?.includes(currentUser?.id);
      const notClaimed = !claimedBonuses.find((cb) => cb.challenge_id === c.id);
      return (c.winner_id === currentUser?.id || isParticipant) && notClaimed;
    })
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      type: 'challenge',
      reward: c.reward,
      earnedText: `Completed: ${c.title}`,
      isChallenge: true,
      challengeId: c.id,
    }));

  const allRewards = [...completedChallengeRewards, ...unclaimedRewards];
  const activeTab = TABS.find((t) => t.id === activeSection);

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(160deg,#020a1e 0%,#0a1f5c 50%,#020a1e 100%)',paddingBottom:96 }}>
      <style>{SECTION_ANIM}</style>

      {/* ── Atmospheric background ── */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0 }}>
        <div style={{ position:'absolute',top:'5%',left:'20%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute',bottom:'20%',right:'10%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.05) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,0.012) 1px,transparent 1px)',backgroundSize:'28px 28px' }}/>
      </div>

      <div style={{ position:'relative',zIndex:1,maxWidth:680,margin:'0 auto',padding:'12px 14px 0' }}>

        {/* ── Tab bar ── */}
        <div style={{ display:'flex',gap:8,marginBottom:24,animation:'rr-fade-up 0.4s ease 0.06s both' }}>
          {TABS.map((tab) => (
            <Tab3D key={tab.id} tab={tab} active={activeSection === tab.id} onClick={() => setActiveSection(tab.id)} />
          ))}
        </div>

        {/* ── Section label ── */}
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,animation:'rr-fade-up 0.3s ease 0.1s both' }}>
          <div style={{ height:1,flex:1,background:`linear-gradient(90deg,rgba(${activeTab?.accentRgb},0.3),transparent)` }}/>
          <span style={{ fontSize:10,fontWeight:900,letterSpacing:'0.18em',textTransform:'uppercase',color:`rgba(${activeTab?.accentRgb},0.5)` }}>
            {activeTab?.label}
          </span>
          <div style={{ height:1,flex:1,background:`linear-gradient(90deg,transparent,rgba(${activeTab?.accentRgb},0.3))` }}/>
        </div>

        {/* ── WEEKLY ── */}
        {activeSection === 'weekly' && (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {weeklyChallenges.length > 0 ? (
              weeklyChallenges.map((challenge, i) => (
                <div key={challenge.id} style={{ animation:`rr-card-in 0.35s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.07}s both` }}>
                  <WeeklyChallengeCard challenge={challenge} currentUser={currentUser} />
                </div>
              ))
            ) : (
              <EmptyState icon="⚡" message="No weekly challenges yet" sub="Check back soon — new ones drop every week" />
            )}
          </div>
        )}

        {/* ── COMMUNITY ── */}
        {activeSection === 'community' && (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12 }}>
            {userChallengeProgress.length === 0 ? (
              <EmptyState icon="🏆" message="No challenges joined yet" sub="Visit a gym page to join community challenges" />
            ) : (
              userChallengeProgress.map((c, i) => <CommunityCard key={c.id} challenge={c} idx={i} />)
            )}
          </div>
        )}

        {/* ── REWARDS ── */}
        {activeSection === 'rewards' && (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12 }}>
            {allRewards.length === 0 ? (
              <EmptyState icon="🎁" message="No rewards available" sub="Complete challenges to unlock rewards" />
            ) : (
              allRewards.map((reward, i) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  idx={i}
                  isPremium={isPremium}
                  isPending={claimMutation.isPending}
                  onClaim={() => claimMutation.mutate(reward)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}