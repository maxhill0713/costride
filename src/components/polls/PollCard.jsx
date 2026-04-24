import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// ── Animated fill bar (identical to FeedPollCard) ────────────────────────────
function PollOptionBar({ opt, isSelected, isWinner, pct, canVote, showResults, onVote }) {
  const barRef = useRef(null);
  const MIN_FILL = 3;

  useEffect(() => {
    if (!showResults || !barRef.current) return;
    barRef.current.style.width = '0%';
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (barRef.current) {
          barRef.current.style.width = `${pct > 0 ? Math.max(pct, MIN_FILL) : MIN_FILL}%`;
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [showResults, pct]);

  return (
    <button
      onClick={() => canVote && onVote()}
      disabled={!canVote}
      className="w-full text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        borderRadius: 9,
        overflow: 'hidden',
        position: 'relative',
        border: showResults
          ? 'none'
          : isSelected
            ? '1px solid rgba(96,165,250,0.45)'
            : '1px solid rgba(255,255,255,0.08)',
        background: showResults
          ? 'transparent'
          : isSelected
            ? 'rgba(96,165,250,0.12)'
            : 'rgba(255,255,255,0.04)',
        cursor: canVote ? 'pointer' : 'default',
      }}
    >
      {showResults && (
        <div
          ref={barRef}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: '0%',
            background: isWinner ? 'rgba(37,99,235,0.45)' : 'rgba(148,163,184,0.22)',
            borderRadius: 9,
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}
      <div className="relative flex items-center justify-between px-3" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <span className="text-[13px] font-semibold" style={{ color: isSelected ? '#93c5fd' : 'rgba(255,255,255,0.8)' }}>
          {opt.text}
        </span>
        {showResults && (
          <span
            className="text-[12px] font-bold ml-2 flex-shrink-0"
            style={{ color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.35)', animation: 'pollPctFadeIn 0.4s ease 0.35s both' }}
          >
            {pct}%
          </span>
        )}
      </div>
    </button>
  );
}

// ── Main PollCard (matches FeedPollCard layout exactly) ──────────────────────
function PollCard({ poll, onVote, userVoted, isLoading, currentUser }) {
  const queryClient = useQueryClient();
  const [localVotedOption, setLocalVotedOption] = useState(() => {
    if (!userVoted) return null;
    for (const opt of (poll.options || [])) {
      if (typeof opt === 'object' && Array.isArray(opt.voters) && opt.voters.includes(currentUser?.id)) {
        return opt.id || opt.text;
      }
    }
    return null;
  });

  const voters = poll.voters || [];
  const hasVoted = !!userVoted || !!localVotedOption;
  const showResults = hasVoted;
  const endMs = poll.end_date ? new Date(poll.end_date).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
  const isExpired = endMs ? endMs < Date.now() : false;
  const timeRemainingLabel = (() => {
    if (!endMs || isExpired) return null;
    const diffMs = endMs - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) return `${Math.round(diffHours)}h left`;
    return `${Math.round(diffMs / (1000 * 60 * 60 * 24))}d left`;
  })();
  const isUrgent = timeRemainingLabel && endMs - Date.now() < 24 * 60 * 60 * 1000;

  const opts = (poll.options || []).filter(o =>
    typeof o === 'string' ? o.trim() : (o.text || o.label || '').trim()
  );
  const totalVotes = opts.reduce((sum, o) => sum + (typeof o === 'object' ? (o.votes || 0) : 0), 0);
  const winnerVotes = Math.max(...opts.map(o => (typeof o === 'object' ? o.votes || 0 : 0)), 0);

  const voteMutation = useMutation({
    mutationFn: async (optionId) => {
      const updatedOpts = (poll.options || []).map(opt => {
        if (typeof opt !== 'object') return opt;
        const isThis = (opt.id || opt.text) === optionId;
        const optVoters = Array.isArray(opt.voters) ? opt.voters : [];
        return { ...opt, votes: (opt.votes || 0) + (isThis ? 1 : 0), voters: isThis ? [...optVoters, currentUser.id] : optVoters };
      });
      await base44.entities.Poll.update(poll.id, { options: updatedOpts, voters: [...voters, currentUser.id] });
    },
    onMutate: (optionId) => setLocalVotedOption(optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymPolls'] });
      onVote && onVote();
    },
    onError: () => setLocalVotedOption(null),
  });

  // Gym info
  const gymName = poll.gym_name || 'Your Gym';
  const gymInitial = gymName.charAt(0).toUpperCase();

  const { data: gym } = useQuery({
    queryKey: ['gymForPoll', poll.gym_id],
    queryFn: () => base44.entities.Gym.filter({ id: poll.gym_id }).then(r => r[0] || null),
    enabled: !!poll.gym_id,
    staleTime: 30 * 60 * 1000,
  });

  const gymAvatar = gym?.logo_url || gym?.image_url || null;

  function formatDate(dateStr) {
    if (!dateStr) return '';
    let date = new Date(dateStr);
    if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) date = new Date(dateStr + 'Z');
    const diffMs = Date.now() - date.getTime();
    const diffMins = diffMs / 60000;
    const diffHours = diffMs / 3600000;
    const diffDays = diffMs / 86400000;
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${Math.floor(diffMins)}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffDays < 3) return `${Math.floor(diffDays)}d ago`;
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${day}${suffix} ${date.toLocaleDateString('en-GB', { month: 'long' })}`;
  }

  return (
    <>
      <style>{`@keyframes pollPctFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 overflow-hidden shadow-2xl shadow-black/40 rounded-2xl relative"
        style={{
          background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />

        <div className="relative z-10 px-4 pt-3.5 pb-4">
          {/* Question row with timer + voted tick */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-sm font-bold text-white leading-snug flex-1">
              {poll.question || poll.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              {timeRemainingLabel && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '2px 7px', borderRadius: 6,
                  background: isUrgent ? 'rgba(255,77,109,0.15)' : 'rgba(77,127,255,0.12)',
                  border: `1px solid ${isUrgent ? 'rgba(255,77,109,0.35)' : 'rgba(77,127,255,0.3)'}`,
                  color: isUrgent ? '#ff6b85' : '#60a5fa',
                  fontSize: 10, fontWeight: 700,
                }}>
                  <Clock size={9} color="currentColor" />
                  {timeRemainingLabel}
                </div>
              )}
              {showResults && <CheckCircle2 size={18} className="text-emerald-400" strokeWidth={2.5} />}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {opts.map((opt, i) => {
              const optText = typeof opt === 'object' ? (opt.text || opt.label || `Option ${i + 1}`) : opt;
              const optId = typeof opt === 'object' ? (opt.id || opt.text) : opt;
              const optVotes = typeof opt === 'object' ? (opt.votes || 0) : 0;
              const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
              const isSelected = localVotedOption === optId || userVoted === optId;
              const isWinner = optVotes === winnerVotes && optVotes > 0;
              const canVote = !showResults && !isExpired && !!currentUser && !voteMutation.isPending && !isLoading;

              return (
                <PollOptionBar
                  key={i}
                  opt={{ ...opt, text: optText, id: optId }}
                  isSelected={isSelected}
                  isWinner={isWinner}
                  pct={pct}
                  canVote={canVote}
                  showResults={showResults}
                  onVote={() => {
                    if (onVote) { onVote(optId); setLocalVotedOption(optId); }
                    else voteMutation.mutate(optId);
                  }}
                />
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              <span className="text-slate-300 font-medium">{totalVotes}</span> {totalVotes === 1 ? 'vote' : 'votes'}
            </span>
            <div className="flex items-center gap-2">
              {(voteMutation.isPending || isLoading) && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                  Saving…
                </span>
              )}
              <span className="text-[11px] text-slate-500">
                {formatDate(poll.created_date)}{isExpired ? ' · Ended' : ''}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default React.memo(PollCard);