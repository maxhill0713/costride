import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function formatPollDate(dateStr) {
  if (!dateStr) return '';
  let date = new Date(dateStr);
  if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    date = new Date(dateStr + 'Z');
  }
  const diffMs = Date.now() - date.getTime();
  const diffMins = diffMs / (1000 * 60);
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${Math.floor(diffMins)}m ago`;
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffDays < 3) return `${Math.floor(diffDays)}d ago`;
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${day}${suffix} ${date.toLocaleDateString('en-GB', { month: 'long' })}`;
}

export default function FeedPollCard({ poll, currentUser }) {
  const queryClient = useQueryClient();

  const { data: gym } = useQuery({
    queryKey: ['gymForPoll', poll.gym_id],
    queryFn: () => base44.entities.Gym.filter({ id: poll.gym_id }).then(r => r[0] || null),
    enabled: !!poll.gym_id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const voters = poll.voters || [];
  const hasVoted = currentUser?.id && voters.includes(currentUser.id);
  const [localVotedOption, setLocalVotedOption] = useState(() => {
    if (!hasVoted) return null;
    const opts = poll.options || [];
    for (const opt of opts) {
      if (typeof opt === 'object' && opt.voters && opt.voters.includes(currentUser?.id)) return opt.id || opt.text;
    }
    return null;
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId) => {
      const opts = (poll.options || []).map(opt => {
        if (typeof opt !== 'object') return opt;
        const isThis = (opt.id || opt.text) === optionId;
        const optVoters = Array.isArray(opt.voters) ? opt.voters : [];
        return { ...opt, votes: (opt.votes || 0) + (isThis ? 1 : 0), voters: isThis ? [...optVoters, currentUser.id] : optVoters };
      });
      await base44.entities.Poll.update(poll.id, {
        options: opts,
        voters: [...voters, currentUser.id],
      });
    },
    onMutate: (optionId) => {
      setLocalVotedOption(optionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymPolls', poll.gym_id] });
      queryClient.invalidateQueries({ queryKey: ['friendPosts'] });
    },
    onError: () => {
      setLocalVotedOption(null);
      toast.error('Failed to submit vote');
    },
  });

  const gymName = gym?.name || poll.gym_name || 'Your Gym';
  const gymAvatar = gym?.logo_url || gym?.image_url || null;
  const gymInitial = gymName.charAt(0).toUpperCase();

  const opts = (poll.options || []).filter(o => {
    if (typeof o === 'string') return o.trim();
    return (o.text || o.label || '').trim();
  });

  const totalVotes = opts.reduce((sum, o) => sum + (typeof o === 'object' ? (o.votes || 0) : 0), 0);
  const showResults = hasVoted || !!localVotedOption;

  const isExpired = poll.end_date && new Date(poll.end_date) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-1 overflow-hidden shadow-2xl shadow-black/40 rounded-2xl -mx-2 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />

      <div className="relative z-10 px-4 pt-3.5 pb-4">
        {/* Header — gym avatar, name, time */}
        <div className="flex items-center justify-between mb-3">
          <Link to={createPageUrl('GymCommunity') + `?id=${poll.gym_id}`} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center flex-shrink-0">
              {gymAvatar
                ? <img src={gymAvatar} alt={gymName} className="w-full h-full object-cover" decoding="async" />
                : <span className="text-sm font-bold text-white">{gymInitial}</span>}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{gymName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 5,
                  background: 'rgba(96,165,250,0.12)',
                  border: '1px solid rgba(96,165,250,0.25)',
                  color: '#60a5fa',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <BarChart2 size={9} />
                  Poll
                </span>
                <span className="text-[11px] text-slate-500">{formatPollDate(poll.created_date)}</span>
                {isExpired && (
                  <span className="text-[10px] font-semibold text-slate-500">· Ended</span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Poll question */}
        <p className="text-sm font-bold text-white mb-3 leading-snug">
          {poll.question || poll.title}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {opts.map((opt, i) => {
            const optText = typeof opt === 'object' ? (opt.text || opt.label || `Option ${i + 1}`) : opt;
            const optId = typeof opt === 'object' ? (opt.id || opt.text) : opt;
            const optVotes = typeof opt === 'object' ? (opt.votes || 0) : 0;
            const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
            const isSelected = localVotedOption === optId;
            const canVote = !showResults && !isExpired && !!currentUser && !voteMutation.isPending;

            return (
              <button
                key={i}
                onClick={() => canVote && voteMutation.mutate(optId)}
                disabled={!canVote}
                className="w-full text-left transition-all duration-150 active:scale-[0.98]"
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: isSelected
                    ? '1px solid rgba(96,165,250,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected
                    ? 'rgba(96,165,250,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  position: 'relative',
                  cursor: canVote ? 'pointer' : 'default',
                }}
              >
                {/* Progress bar fill */}
                {showResults && (
                  <div
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${pct}%`,
                      background: isSelected
                        ? 'rgba(96,165,250,0.18)'
                        : 'rgba(255,255,255,0.04)',
                      transition: 'width 0.5s ease',
                      borderRadius: 10,
                    }}
                  />
                )}
                <div className="relative flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm font-semibold" style={{ color: isSelected ? '#93c5fd' : 'rgba(255,255,255,0.8)' }}>
                    {optText}
                  </span>
                  {showResults && (
                    <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.35)' }}>
                      {pct}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">
            {voters.length} vote{voters.length !== 1 ? 's' : ''}
          </span>
          {showResults && !hasVoted && localVotedOption && (
            <span className="text-[11px] text-blue-400 font-semibold">· Vote recorded</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}