import React from 'react';
import { Trophy, Clock, Users, Zap, CheckCircle, ChevronRight } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CARD_ANIM = `
@keyframes wc-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
@keyframes wc-bar-fill {
  from { width: 0%; }
  to   { width: var(--bar-w); }
}
@keyframes wc-pulse-dot {
  0%,100% { opacity:1; transform:scale(1); }
  50%     { opacity:0.5; transform:scale(0.7); }
}
`;

function JoinButton({ onClick, disabled, isParticipant, isExpired, isPending }) {
  const [pressed, setPressed] = React.useState(false);

  if (isExpired && !isParticipant) return null;

  const joined = isParticipant;
  const accentRgb = joined ? '34,197,94' : '6,182,212';
  const floor = joined ? '#14532d' : '#164e63';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: '100%',
        padding: '11px 0',
        borderRadius: 13,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: '#fff',
        background: joined
          ? 'linear-gradient(180deg,rgba(34,197,94,0.22) 0%,rgba(22,163,74,0.15) 100%)'
          : pressed
            ? 'linear-gradient(180deg,rgba(6,182,212,0.3) 0%,rgba(8,145,178,0.2) 100%)'
            : 'linear-gradient(180deg,rgba(6,182,212,0.22) 0%,rgba(8,145,178,0.15) 100%)',
        border: `1px solid rgba(${accentRgb},0.35)`,
        borderBottom: pressed || joined ? `1px solid rgba(0,0,0,0.4)` : `3px solid ${floor}`,
        boxShadow: pressed || joined ? 'none' : `0 2px 0 rgba(0,0,0,0.35), 0 6px 20px rgba(${accentRgb},0.12), inset 0 1px 0 rgba(255,255,255,0.12)`,
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        transition: pressed ? 'transform 0.06s, box-shadow 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.18s',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {joined ? (
        <><CheckCircle style={{ width: 14, height: 14, color: '#4ade80' }} /><span style={{ color: '#4ade80' }}>Joined</span></>
      ) : isPending ? (
        'Joining...'
      ) : (
        <><Zap style={{ width: 13, height: 13 }} />Join Challenge</>
      )}
    </button>
  );
}

export default function WeeklyChallengeCard({ challenge, currentUser }) {
  const [showStats, setShowStats] = React.useState(false);
  const queryClient = useQueryClient();

  const isParticipant = challenge.participants?.includes(currentUser?.id);
  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;
  const progress = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining = Math.max(0, targetValue - participantCount);
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  const urgency = daysLeft <= 2 ? 'red' : daysLeft <= 5 ? 'amber' : 'cyan';
  const urgencyColor = { red: '#f87171', amber: '#fbbf24', cyan: '#22d3ee' }[urgency];
  const urgencyRgb = { red: '248,113,113', amber: '251,191,36', cyan: '34,211,238' }[urgency];

  const joinMutation = useMutation({
    mutationFn: async () => {
      const updatedParticipants = [...(challenge.participants || []), currentUser.id];
      await base44.entities.Challenge.update(challenge.id, { participants: updatedParticipants });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['activeChallenges'] });
      const previous = queryClient.getQueryData(['activeChallenges']);
      queryClient.setQueryData(['activeChallenges'], (old = []) =>
        old.map(c => c.id === challenge.id
          ? { ...c, participants: [...(c.participants || []), currentUser.id] }
          : c)
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['activeChallenges'], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeChallenges'] });
    },
  });

  return (
    <>
      <style>{CARD_ANIM}</style>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.34, 1.2, 0.64, 1] }}
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(145deg,rgba(10,18,48,0.92) 0%,rgba(5,10,28,0.97) 100%)',
          border: `1px solid rgba(${isParticipant ? '34,197,94' : '6,182,212'},0.18)`,
          borderTop: `1px solid rgba(${isParticipant ? '34,197,94' : '6,182,212'},0.28)`,
          boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(${isParticipant ? '34,197,94' : '6,182,212'},0.06)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Top shimmer line */}
        <div style={{ position:'absolute',top:0,left:'8%',right:'8%',height:1.5,borderRadius:99,background:`linear-gradient(90deg,transparent,rgba(${isParticipant?'34,197,94':'6,182,212'},0.7),transparent)`,pointerEvents:'none' }}/>

        {/* Ambient glow orb */}
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:`radial-gradient(circle,rgba(${isParticipant?'34,197,94':'6,182,212'},0.07) 0%,transparent 70%)`,pointerEvents:'none' }}/>

        {/* Hero image strip */}
        <div style={{ position:'relative',height:110,overflow:'hidden' }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
            alt={challenge.title}
            style={{ width:'100%',height:'100%',objectFit:'cover',opacity:0.55 }}
          />
          {/* Gradient overlay */}
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(10,18,48,0.2) 0%,rgba(5,10,28,0.85) 100%)' }}/>

          {/* Days left badge */}
          <div style={{ position:'absolute',top:10,right:12,display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:99,background:'rgba(5,10,28,0.75)',border:`1px solid rgba(${urgencyRgb},0.4)`,backdropFilter:'blur(8px)' }}>
            {daysLeft <= 2 && (
              <div style={{ width:6,height:6,borderRadius:'50%',background:urgencyColor,animation:'wc-pulse-dot 1.2s ease-in-out infinite' }}/>
            )}
            <Clock style={{ width:11,height:11,color:urgencyColor }}/>
            <span style={{ fontSize:10,fontWeight:800,color:urgencyColor }}>
              {isExpired ? 'Ended' : `${daysLeft}d left`}
            </span>
          </div>

          {/* Participant count */}
          <div style={{ position:'absolute',top:10,left:12,display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:99,background:'rgba(5,10,28,0.75)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(8px)' }}>
            <Users style={{ width:11,height:11,color:'rgba(148,163,184,0.8)' }}/>
            <span style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.7)' }}>{participantCount}</span>
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding:'14px 16px 16px' }}>

          {/* Title + description */}
          <h4 style={{ fontSize:16,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',marginBottom:4,lineHeight:1.2 }}>{challenge.title}</h4>
          <p style={{ fontSize:12,color:'rgba(148,163,184,0.6)',lineHeight:1.5,marginBottom:14 }}>{challenge.description}</p>

          {/* Progress section */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
              <span style={{ fontSize:10,fontWeight:700,color:'rgba(148,163,184,0.45)',textTransform:'uppercase',letterSpacing:'0.1em' }}>Community Progress</span>
              <button
                onClick={() => setShowStats(!showStats)}
                style={{ display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:800,color:`rgba(${isParticipant?'34,197,94':'6,182,212'},0.85)`,background:'none',border:'none',cursor:'pointer',padding:0 }}
              >
                {progress}%
                <ChevronRight style={{ width:12,height:12,transform:showStats?'rotate(90deg)':'rotate(0deg)',transition:'transform 0.2s' }}/>
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ height:6,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden',position:'relative' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.1, 0.64, 1] }}
                style={{
                  height:'100%',borderRadius:99,
                  background: isParticipant
                    ? 'linear-gradient(90deg,#16a34a,#4ade80)'
                    : 'linear-gradient(90deg,#0891b2,#22d3ee)',
                  boxShadow: `0 0 10px rgba(${isParticipant?'34,197,94':'6,182,212'},0.4)`,
                }}
              />
            </div>

            {/* Stats dropdown */}
            {showStats && (
              <motion.div
                initial={{ opacity:0, height:0 }}
                animate={{ opacity:1, height:'auto' }}
                transition={{ duration: 0.2 }}
                style={{ marginTop:8,padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:`1px solid rgba(${isParticipant?'34,197,94':'6,182,212'},0.15)`,display:'flex',justifyContent:'space-around' }}
              >
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:16,fontWeight:900,color:isParticipant?'#4ade80':'#22d3ee',letterSpacing:'-0.03em' }}>{participantCount}</p>
                  <p style={{ fontSize:9,fontWeight:700,color:'rgba(148,163,184,0.45)',textTransform:'uppercase',letterSpacing:'0.08em' }}>Joined</p>
                </div>
                <div style={{ width:1,background:'rgba(255,255,255,0.07)' }}/>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:16,fontWeight:900,color:'rgba(255,255,255,0.6)',letterSpacing:'-0.03em' }}>{targetValue}</p>
                  <p style={{ fontSize:9,fontWeight:700,color:'rgba(148,163,184,0.45)',textTransform:'uppercase',letterSpacing:'0.08em' }}>Target</p>
                </div>
                <div style={{ width:1,background:'rgba(255,255,255,0.07)' }}/>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:16,fontWeight:900,color:'rgba(251,191,36,0.9)',letterSpacing:'-0.03em' }}>{remaining}</p>
                  <p style={{ fontSize:9,fontWeight:700,color:'rgba(148,163,184,0.45)',textTransform:'uppercase',letterSpacing:'0.08em' }}>Needed</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Reward strip */}
          <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:13,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',marginBottom:14 }}>
            <UniqueBadge reward={challenge.reward} size="sm" />
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ fontSize:9,fontWeight:800,letterSpacing:'0.12em',color:'rgba(148,163,184,0.4)',textTransform:'uppercase',marginBottom:2 }}>Reward</p>
              <p style={{ fontSize:13,fontWeight:800,color:'rgba(255,255,255,0.85)',letterSpacing:'-0.01em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{challenge.reward || 'Weekly Challenge Badge'}</p>
            </div>
            <Trophy style={{ width:16,height:16,color:'rgba(251,191,36,0.5)',flexShrink:0 }}/>
          </div>

          {/* CTA */}
          <JoinButton
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending || isExpired || isParticipant}
            isParticipant={isParticipant}
            isExpired={isExpired}
            isPending={joinMutation.isPending}
          />
        </div>
      </motion.div>
    </>
  );
}
