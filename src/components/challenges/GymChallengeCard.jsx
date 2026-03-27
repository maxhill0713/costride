import React, { useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser, onDelete = null, isOwner = false, gymImageUrl = null }) {
  const [showStats, setShowStats] = useState(false);

  const participantCount = challenge.participants?.length || 0;
  const targetValue = challenge.target_value || 50;
  const progress = Math.min(100, Math.floor((participantCount / targetValue) * 100));
  const remaining = Math.max(0, targetValue - participantCount);
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const userHasJoined = currentUser ? (challenge.participants || []).includes(currentUser.id) : false;

  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(challenge);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-2xl shadow-black/20">
        {!isExpired && (
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20 pointer-events-none" />
        )}

        {!isExpired && (
          <div className="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs font-bold px-2 py-1 rounded-lg">
            {daysLeft}d left
          </div>
        )}

        {isExpired && isOwner && onDelete && (
          <button onClick={() => onDelete(challenge.id)}
            className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        )}

        <div className="flex items-start gap-3 relative z-10">
          {/* Gym image thumbnail */}
          <div className="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden relative shadow-lg"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {gymImageUrl || challenge.image_url || challenge.gym_image_url ? (
              <img src={gymImageUrl || challenge.image_url || challenge.gym_image_url} alt={challenge.gym_name || 'Gym'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)' }} />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-black text-white mb-1 text-base">{challenge.title}</h3>
            <p className="text-sm text-slate-300 mb-3">{challenge.description}</p>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {challenge.goal_type === 'longest_streak' ? (
                <span className="bg-white/90 text-gray-700 text-xs font-semibold px-2 py-1 rounded-lg">
                  {currentUser?.streak || 0} / {targetValue} day streak
                </span>
              ) : (
                <span className="bg-white/90 text-gray-700 text-xs font-semibold px-2 py-1 rounded-lg">
                  {participantCount} / {targetValue} joined
                </span>
              )}
            </div>

            {/* ── Join button ── */}
            {!isExpired && !isOwner && (
              <motion.button
                onClick={handleJoinClick}
                disabled={userHasJoined}
                whileTap={!userHasJoined ? { scale: 0.97 } : {}}
                className={`w-full rounded-2xl h-9 text-sm font-bold shadow-md text-white ${
                  userHasJoined 
                    ? 'bg-green-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 hover:opacity-90'
                }`}
              >
                {userHasJoined ? '✓ Joined' : '⚡ Join Challenge'}
              </motion.button>
            )}

            {isOwner && (
              <div className="w-full h-9 rounded-2xl font-black text-sm flex items-center justify-center text-slate-400"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                👑 Your Challenge
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default React.memo(GymChallengeCard);