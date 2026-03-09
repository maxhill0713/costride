import React from 'react';
import { CheckCircle } from 'lucide-react';
import UniqueBadge from './UniqueBadge';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

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

  // Urgency: cyan → amber (≤5d) → red+pulse (≤2d)
  const urgencyColor = daysLeft <= 2 ? '#f87171' : daysLeft <= 5 ? '#fbbf24' : '#22d3ee';
  const urgencyRgb   = daysLeft <= 2 ? '248,113,113' : daysLeft <= 5 ? '251,191,36' : '34,211,238';
  const progressColor = isParticipant ? '#34d399' : urgencyColor;
  const progressRgb   = isParticipant ? '52,211,153' : urgencyRgb;

  const joinMutation = useMutation({
    mutationFn: async () => {
      const updatedParticipants = [...(challenge.participants || []), currentUser.id];
      await base44.entities.Challenge.update(challenge.id, { participants: updatedParticipants });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['weeklyChallenges'] });
      const previous = queryClient.getQueryData(['weeklyChallenges']);
      queryClient.setQueryData(['weeklyChallenges'], (old = []) =>
        old.map(c => c.id === challenge.id
          ? { ...c, participants: [...(c.participants || []), currentUser.id] }
          : c
        )
      );
      return { previous };
    },
    onError: (err, vars, context) => queryClient.setQueryData(['weeklyChallenges'], context.previous),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weeklyChallenges'] }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.34, 1.2, 0.64, 1] }}
    >
      <div style={{
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        // Matches N[900]→N[950] from dashboard
        background: 'linear-gradient(145deg, #0d1e35 0%, #060d1f 100%)',
        border: `1px solid ${isParticipant ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isParticipant
          ? '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(52,211,153,0.1), 0 4px 16px rgba(52,211,153,0.08)'
          : '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.025)',
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>

        {/* ── Atmospheric glow orbs ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 20 }}>
          {/* Top-left accent orb — changes with urgency/joined state */}
          <div style={{
            position: 'absolute', top: -40, left: -30, width: 180, height: 180,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${progressRgb},0.11) 0%, transparent 70%)`,
            transition: 'background 0.5s',
          }}/>
          {/* Bottom-right blue orb */}
          <div style={{
            position: 'absolute', bottom: -50, right: -30, width: 200, height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
          }}/>
          {/* Dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}/>
        </div>

        {/* ── Top shimmer line ── */}
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
          background: `linear-gradient(90deg, transparent, rgba(${progressRgb},0.55), transparent)`,
          transition: 'background 0.5s',
          pointerEvents: 'none', zIndex: 2,
        }}/>

        {/* ── Left accent bar ── */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: `linear-gradient(180deg, rgba(${progressRgb},0.75) 0%, transparent 100%)`,
          transition: 'background 0.5s',
          zIndex: 2,
        }}/>

        {/* ── Hero image strip ── */}
        <div style={{ position: 'relative', height: 96, overflow: 'hidden' }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
            alt="Challenge"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Fade to card bg */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(6,13,31,0) 25%, rgba(6,13,31,0.95) 100%)',
          }}/>

          {/* Days-left pill */}
          <div style={{
            position: 'absolute', top: 10, right: 12,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 99,
            background: 'rgba(6,13,31,0.75)',
            border: `1px solid rgba(${urgencyRgb},0.38)`,
            backdropFilter: 'blur(10px)',
            zIndex: 3,
          }}>
            {daysLeft <= 2 && !isExpired && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: urgencyColor,
                boxShadow: `0 0 6px ${urgencyColor}`,
                display: 'inline-block',
                animation: 'costridePulse 1.2s ease-in-out infinite',
              }}/>
            )}
            <span style={{ fontSize: 11, fontWeight: 800, color: urgencyColor, letterSpacing: '-0.01em' }}>
              {isExpired ? 'Ended' : `${daysLeft}d left`}
            </span>
          </div>

          {/* Joined badge */}
          {isParticipant && (
            <div style={{
              position: 'absolute', top: 10, left: 14,
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 99,
              background: 'rgba(52,211,153,0.15)',
              border: '1px solid rgba(52,211,153,0.4)',
              backdropFilter: 'blur(10px)',
              zIndex: 3,
            }}>
              <CheckCircle style={{ width: 11, height: 11, color: '#34d399' }}/>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>Joined</span>
            </div>
          )}
        </div>

        {/* ── Card body ── */}
        <div style={{ padding: '14px 16px 16px', position: 'relative', zIndex: 1 }}>

          {/* Title + description */}
          <h4 style={{
            fontSize: 15, fontWeight: 900, color: '#fff',
            margin: '0 0 5px', letterSpacing: '-0.02em', lineHeight: 1.25,
          }}>
            {challenge.title}
          </h4>
          <p style={{
            fontSize: 12, color: 'rgba(148,163,184,0.6)',
            margin: '0 0 14px', lineHeight: 1.45, fontWeight: 500,
          }}>
            {challenge.description}
          </p>

          {/* Progress bar */}
          <button
            onClick={() => setShowStats(!showStats)}
            style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 6 }}
          >
            <div style={{
              height: 6, borderRadius: 99, overflow: 'hidden',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg, ${progressColor}, ${isParticipant ? '#6ee7b7' : '#67e8f9'})`,
                  boxShadow: `0 0 10px rgba(${progressRgb},0.55)`,
                  transition: 'background 0.5s, box-shadow 0.5s',
                }}
              />
            </div>
          </button>

          {/* Stats dropdown */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 12,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(${progressRgb},0.18)`,
                borderRadius: 13,
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                overflow: 'hidden',
              }}
            >
              {[
                { label: 'Joined', value: participantCount },
                { label: 'Target', value: targetValue },
                { label: 'Needed', value: remaining },
              ].map(({ label, value }, i) => (
                <div key={label} style={{
                  textAlign: 'center', padding: '10px 8px',
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: progressColor, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Reward strip ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 13, marginBottom: 12,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Gold shimmer line */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
              background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.28),transparent)',
              pointerEvents: 'none',
            }}/>
            <UniqueBadge reward={challenge.reward} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.55)', marginBottom: 2 }}>
                Reward
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fde68a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {challenge.reward || 'Weekly Challenge Badge'}
              </div>
            </div>
            <div style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 15 }}>🏆</span>
            </div>
          </div>

          {/* ── Join / Joined button ── */}
          {!isExpired && (
            <motion.button
              onClick={() => !isParticipant && joinMutation.mutate()}
              disabled={joinMutation.isPending || isParticipant}
              whileTap={!isParticipant ? { scale: 0.97, y: 3 } : {}}
              style={{
                width: '100%', height: 42, borderRadius: 12, border: 'none', outline: 'none',
                fontSize: 13, fontWeight: 900, letterSpacing: '-0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                cursor: isParticipant ? 'default' : 'pointer',
                transition: 'all 0.15s',
                ...(isParticipant ? {
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderBottom: '3px solid rgba(16,185,129,0.35)',
                  color: '#34d399',
                  boxShadow: '0 4px 14px rgba(52,211,153,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                } : {
                  background: `linear-gradient(180deg, rgba(${progressRgb},0.22), rgba(${progressRgb},0.13))`,
                  border: `1px solid rgba(${progressRgb},0.38)`,
                  borderBottom: `3px solid rgba(${progressRgb},0.22)`,
                  color: progressColor,
                  boxShadow: `0 4px 14px rgba(${progressRgb},0.1), inset 0 1px 0 rgba(255,255,255,0.07)`,
                }),
              }}
            >
              {isParticipant ? (
                <><CheckCircle style={{ width: 15, height: 15 }}/> Joined</>
              ) : (
                joinMutation.isPending ? 'Joining…' : '⚡ Join Challenge'
              )}
            </motion.button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes costridePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.72); }
        }
      `}</style>
    </motion.div>
  );
}
