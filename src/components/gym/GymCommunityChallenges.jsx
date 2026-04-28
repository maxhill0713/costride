import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Trophy, CheckCircle } from 'lucide-react';
import GymChallengeCard from '../challenges/GymChallengeCard';

const CARD_STYLE = { background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 2px 12px rgba(0,0,0,0.35)' };

export default function GymCommunityChallenges({
  isGhostGym,
  showOwnerControls,
  onCreateChallenge,
  gymChallenges,
  challengeParticipants,
  currentUser,
  onJoinChallenge,
  onDeleteChallenge,
  gym,
  memberAvatarMap,
  memberNameMap
}) {
  const activeChallenges = gymChallenges.filter((c) => challengeParticipants.some((p) => p.challenge_id === c.id));
  const availableChallenges = gymChallenges.filter((c) => !challengeParticipants.some((p) => p.challenge_id === c.id));

  const renderCard = (challenge) =>
  <GymChallengeCard
    key={challenge.id}
    challenge={challenge}
    isJoined={challengeParticipants.some((p) => p.challenge_id === challenge.id)}
    onJoin={!showOwnerControls ? (c) => onJoinChallenge(c) : null}
    currentUser={currentUser}
    disabled={showOwnerControls}
    isOwner={showOwnerControls}
    onDelete={showOwnerControls ? (id) => { if (window.confirm('Delete this challenge?')) onDeleteChallenge(id); } : null}
    gymImageUrl={gym?.image_url}
    memberAvatarMap={memberAvatarMap}
    memberNameMap={memberNameMap}
  />;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
      {isGhostGym &&
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(219,39,119,0.12))', border: '1px solid rgba(139,92,246,0.3)' }}>
        <p className="text-sm font-bold text-white mb-0.5">This isn't an official community yet!</p>
        <p className="text-xs text-slate-400 leading-relaxed">Get your gym involved to unlock full challenges, leaderboards & more. Use the "Make Official" button above to get started.</p>
      </div>
      }
      {!isGhostGym && showOwnerControls &&
      <button onClick={onCreateChallenge} className="w-full rounded-2xl py-4 flex flex-col items-center gap-2 text-white font-bold active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(59,130,246,0.3)' }}>
        <Plus className="w-5 h-5" /><span className="text-sm">Create Gym Challenge</span>
      </button>
      }
      {!isGhostGym && (() => {
        if (gymChallenges.length === 0) {
          return <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}><Trophy className="w-10 h-10 mx-auto mb-3 text-slate-700" /><p className="text-white font-bold mb-1 text-sm">No Active Challenges</p><p className="text-xs text-slate-500">Check back soon for new challenges!</p></div>;
        }

        return (
          <>
            {activeChallenges.length > 0 &&
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle style={{ width: 13, height: 13, color: '#34d399' }} />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">Active</span>
              </div>
              {activeChallenges.map(renderCard)}
            </div>
            }
            {availableChallenges.length > 0 &&
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trophy style={{ width: 13, height: 13, color: '#fbbf24' }} />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">Available</span>
              </div>
              {availableChallenges.map(renderCard)}
            </div>
            }
          </>
        );
      })()}
    </motion.div>
  );
}