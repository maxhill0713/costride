import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, CheckCircle2 } from 'lucide-react';
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

// ── Voter avatars ─────────────────────────────────────────────────────────────
function VoterAvatars({ voterAvatarData, totalVoters, onClick }) {
  if (totalVoters === 0) return null;
  const visible = voterAvatarData.slice(0, 4);
  const extra = totalVoters - visible.length;

  return (
    <button onClick={onClick} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
      <div className="flex items-center">
        {visible.map((v, i) => (
          <div
            key={v.id || i}
            className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{
              marginLeft: i === 0 ? 0 : -8,
              zIndex: visible.length - i,
              border: '1.5px solid rgba(6,8,18,0.95)',
              background: v.avatar_url ? 'transparent' : '#334155',
            }}
          >
            {v.avatar_url
              ? <img src={v.avatar_url} alt={v.name} className="w-full h-full object-cover" />
              : (v.name || '?').charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
      <span className="text-[11px] font-semibold text-slate-400">
        {extra > 0 ? `+${extra} responses` : `${totalVoters} response${totalVoters !== 1 ? 's' : ''}`}
      </span>
    </button>
  );
}

// ── Voters list modal ─────────────────────────────────────────────────────────
function VotersModal({ open, onClose, opts, totalVoters, voterAvatarData, isLoading }) {
  const [search, setSearch] = useState('');

  const sanitised = search.replace(/[^a-zA-Z0-9_. ]/g, '').slice(0, 30).toLowerCase();

  const voterOptionMap = useMemo(() => {
    const map = {};
    opts.forEach(opt => {
      const optText = typeof opt === 'object' ? (opt.text || opt.label || '') : opt;
      const optVoters = typeof opt === 'object' && Array.isArray(opt.voters) ? opt.voters : [];
      optVoters.forEach(uid => { map[uid] = optText; });
    });
    return map;
  }, [opts]);

  const avatarById = useMemo(() => {
    const m = {};
    voterAvatarData.forEach(v => { m[v.id] = v; });
    return m;
  }, [voterAvatarData]);

  const hasPerOptionVoters = useMemo(() => {
    const hasStructuredVoters = opts.some(opt => typeof opt === 'object' && Array.isArray(opt.voters) && opt.voters.length > 0);
    const hasVoterOptionMapping = Object.keys(voterOptionMap).length > 0;
    return hasStructuredVoters || hasVoterOptionMapping;
  }, [opts, voterOptionMap]);

  const SectionHeader = ({ label }) => (
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2 pt-3 pb-1">{label}</p>
  );

  if (!open) return null;

  const renderRow = (voter, showOption = false) => {
    const chosenOption = voterOptionMap[voter.id];
    return (
      <div key={voter.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
          {voter.avatar_url
            ? <img src={voter.avatar_url} alt={voter.name} className="w-full h-full object-cover" />
            : (voter.name || '?').charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-slate-200 font-semibold flex-1 min-w-0 truncate">{voter.name || 'Member'}</span>
        {showOption && chosenOption && (
          <span className="text-[11px] font-semibold text-blue-400 flex-shrink-0 max-w-[100px] truncate">{chosenOption}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: '-100px', left: 0, right: 0, bottom: 0,
          zIndex: 10005,
          background: 'rgba(2,6,23,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-white text-center">
            {totalVoters} Response{totalVoters !== 1 ? 's' : ''}
          </h3>
        </div>
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 rounded-xl bg-white/10 border border-white/20" style={{ paddingTop: '7px', paddingBottom: '7px' }}>
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value.replace(/[^a-zA-Z0-9_. ]/g, '').slice(0, 30))}
              placeholder="Search by name..."
              maxLength={30}
              autoComplete="off"
              style={{ fontSize: '16px' }}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-80 px-3 pb-4">
          {isLoading ? (
            <p className="text-center text-slate-400 text-sm py-6">Loading...</p>
          ) : sanitised ? (
            (() => {
              const filtered = voterAvatarData.filter(v => (v.name || '').toLowerCase().includes(sanitised));
              if (filtered.length === 0) return <p className="text-center text-slate-400 text-sm py-6">No members found</p>;
              return filtered.map(v => renderRow(v, true));
            })()
          ) : hasPerOptionVoters ? (
            (() => {
              const sections = opts.map((opt, i) => {
                const optText = typeof opt === 'object' ? (opt.text || opt.label || `Option ${i + 1}`) : opt;
                let optVoterIds = typeof opt === 'object' && Array.isArray(opt.voters) ? opt.voters : [];
                if (optVoterIds.length === 0) {
                  optVoterIds = voterAvatarData.filter(v => voterOptionMap[v.id] === optText).map(v => v.id);
                }
                const optVoters = optVoterIds.map(uid => avatarById[uid]).filter(Boolean);
                return { optText, optVoters };
              }).filter(s => s.optVoters.length > 0);

              return sections.map((s, si) => (
                <div key={si}>
                  <SectionHeader label={s.optText} />
                  {s.optVoters.map(v => renderRow(v, false))}
                  {si < sections.length - 1 && <div className="mx-2 my-1 border-t border-white/[0.07]" />}
                </div>
              ));
            })()
          ) : (
            voterAvatarData.length === 0
              ? <p className="text-center text-slate-400 text-sm py-6">No responses yet</p>
              : voterAvatarData.map(v => renderRow(v, false))
          )}
        </div>
      </div>
    </>
  );
}

// ── Animated poll option bar ──────────────────────────────────────────────────
function PollOptionBar({ opt, index, isSelected, isWinner, pct, canVote, showResults, onVote }) {
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
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '0%',
            background: isWinner
              ? 'rgba(37,99,235,0.45)'
              : 'rgba(148,163,184,0.22)',
            borderRadius: 9,
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      <div
        className="relative flex items-center justify-between px-3"
        style={{ paddingTop: 8, paddingBottom: 8 }}
      >
        <span
          className="text-[13px] font-semibold"
          style={{ color: isSelected ? '#93c5fd' : 'rgba(255,255,255,0.8)' }}
        >
          {opt.text}
        </span>
        {showResults && (
          <span
            className="text-[12px] font-bold ml-2 flex-shrink-0"
            style={{
              color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.35)',
              animation: 'pollPctFadeIn 0.4s ease 0.35s both',
            }}
          >
            {pct}%
          </span>
        )}
      </div>
    </button>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────
export default function FeedPollCard({ poll, currentUser }) {
  const queryClient = useQueryClient();
  const [showVotersModal, setShowVotersModal] = useState(false);

  const { data: gym } = useQuery({
    queryKey: ['gymForPoll', poll.gym_id],
    queryFn: () => base44.entities.Gym.filter({ id: poll.gym_id }).then(r => r[0] || null),
    enabled: !!poll.gym_id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const voters = localVoters;
  const hasVoted = !!(currentUser?.id && voters.includes(currentUser.id));

  const [localVotedOption, setLocalVotedOption] = useState(() => {
    if (!hasVoted) return null;
    for (const opt of (poll.options || [])) {
      if (typeof opt === 'object' && Array.isArray(opt.voters) && opt.voters.includes(currentUser?.id)) {
        return opt.id || opt.text;
      }
    }
    return null;
  });

  const [localVoters, setLocalVoters] = useState(voters);

  const { data: voterAvatarsRaw = {}, isFetching: isLoadingVoterAvatars } = useQuery({
    queryKey: ['pollVoterAvatars', voters.join(',')],
    queryFn: () => base44.functions.invoke('getUserAvatars', { userIds: voters }).then(r => r.data?.avatars || {}),
    enabled: voters.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const voterAvatarData = useMemo(() =>
    voters.map(id => ({
      id,
      name: voterAvatarsRaw[id]?.full_name || 'Member',
      avatar_url: voterAvatarsRaw[id]?.avatar_url || null,
    })),
    [voters, voterAvatarsRaw]
  );

  const displayedAvatars = voterAvatarData.slice(0, 4);

  const voteMutation = useMutation({
    mutationFn: async (optionId) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      
      const opts = (poll.options || []).map(opt => {
        if (typeof opt !== 'object') return opt;
        const isThis = (opt.id || opt.text) === optionId;
        const optVoters = Array.isArray(opt.voters) ? opt.voters : [];
        return { ...opt, votes: (opt.votes || 0) + (isThis ? 1 : 0), voters: isThis ? [...optVoters, currentUser.id] : optVoters };
      });
      await base44.functions.invoke('votePoll', { pollId: poll.id, options: opts, voters: [...voters, currentUser.id] });
    },
    onMutate: (optionId) => {
      setLocalVotedOption(optionId);
      setLocalVoters([...voters, currentUser.id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymPolls', poll.gym_id] });
      queryClient.invalidateQueries({ queryKey: ['friendPosts'] });
    },
    onError: (err) => {
      setLocalVotedOption(null);
      setLocalVoters(voters);
      toast.error('Failed to submit vote');
    },
  });

  const gymName = gym?.name || poll.gym_name || 'Your Gym';
  const gymAvatar = gym?.logo_url || gym?.image_url || null;
  const gymInitial = gymName.charAt(0).toUpperCase();

  const CATEGORY_CONFIG = {
    equipment_replacement: { label: 'Equipment Poll', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
    favorite_equipment:    { label: 'Fav. Kit Poll',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
    rewards:               { label: 'Rewards Poll',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)'   },
    playlist:              { label: 'Playlist Poll',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
    schedule:              { label: 'Schedule Poll',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
    other:                 { label: 'Poll',           color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
  };
  const pollBadgeCfg = (poll.category && CATEGORY_CONFIG[poll.category]) || CATEGORY_CONFIG.other;

  const opts = (poll.options || []).filter(o =>
    typeof o === 'string' ? o.trim() : (o.text || o.label || '').trim()
  );

  const totalVotes = opts.reduce((sum, o) => sum + (typeof o === 'object' ? (o.votes || 0) : 0), 0);
  const showResults = hasVoted || !!localVotedOption;
  const isExpired = poll.end_date && new Date(poll.end_date) < new Date();

  const winnerVotes = Math.max(...opts.map(o => (typeof o === 'object' ? o.votes || 0 : 0)));

  return (
    <>
      <style>{`
        @keyframes pollPctFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

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

        {/* Green tick if voted */}
        {showResults && (
          <div className="absolute top-3 right-3 z-20">
            <CheckCircle2 size={18} className="text-emerald-400" strokeWidth={2.5} />
          </div>
        )}

        <div className="relative z-10 px-4 pt-3.5 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Link to={createPageUrl('GymCommunity') + `?id=${poll.gym_id}`} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center flex-shrink-0">
                {gymAvatar
                  ? <img src={gymAvatar} alt={gymName} className="w-full h-full object-cover" decoding="async" />
                  : <span className="text-sm font-bold text-white">{gymInitial}</span>}
              </div>
              {/* ── NAME row, then BADGE + TIMESTAMP below ── */}
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-white leading-tight">{gymName}</p>
                <div className="flex items-center gap-1.5">
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 5,
                    background: pollBadgeCfg.bg,
                    border: `1px solid ${pollBadgeCfg.border}`,
                    color: pollBadgeCfg.color,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    flexShrink: 0,
                  }}>
                    <BarChart2 size={9} />
                    {pollBadgeCfg.label}
                  </span>
                  <span className="text-[11px] text-slate-500">{formatPollDate(poll.created_date)}</span>
                  {isExpired && <span className="text-[10px] font-semibold text-slate-500">· Ended</span>}
                </div>
              </div>
            </Link>
          </div>

          {/* Poll question */}
          <p className="text-sm font-bold text-white mb-3 leading-snug">
            {poll.question || poll.title}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {opts.map((opt, i) => {
              const optText = typeof opt === 'object' ? (opt.text || opt.label || `Option ${i + 1}`) : opt;
              const optId = typeof opt === 'object' ? (opt.id || opt.text) : opt;
              const optVotes = typeof opt === 'object' ? (opt.votes || 0) : 0;
              const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
              const isSelected = localVotedOption === optId;
              const isWinner = optVotes === winnerVotes && optVotes > 0;
              const canVote = !showResults && !isExpired && !!currentUser && !voteMutation.isPending;

              return (
                <PollOptionBar
                  key={i}
                  index={i}
                  opt={{ ...opt, text: optText, id: optId }}
                  isSelected={isSelected}
                  isWinner={isWinner}
                  pct={pct}
                  canVote={canVote}
                  showResults={showResults}
                  onVote={() => voteMutation.mutate(optId)}
                />
              );
            })}
          </div>

          {/* Footer — voter avatars */}
          <div className="mt-3 flex items-center justify-end pr-1">
            <VoterAvatars
              voterAvatarData={displayedAvatars}
              totalVoters={voters.length}
              onClick={() => voters.length > 0 && setShowVotersModal(true)}
            />
          </div>
        </div>
      </motion.div>

      <VotersModal
        open={showVotersModal}
        onClose={() => setShowVotersModal(false)}
        opts={opts}
        totalVoters={voters.length}
        voterAvatarData={voterAvatarData}
        isLoading={isLoadingVoterAvatars}
      />
    </>
  );
}