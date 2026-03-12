import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function PollCard({ poll, onVote, userVoted, isLoading }) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  const hasVoted = !!userVoted && poll.voters?.includes(userVoted);

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-white font-bold text-sm leading-snug">{poll.title}</p>
        {poll.description && (
          <p className="text-slate-400 text-xs mt-1">{poll.description}</p>
        )}
      </div>

      {/* Options */}
      <div className="px-4 pb-3 space-y-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isClosed = poll.status === 'closed';
          const showResults = hasVoted || isClosed;

          return (
            <button
              key={option.id}
              onClick={() => !hasVoted && !isClosed && !isLoading && onVote?.(option.id)}
              disabled={hasVoted || isClosed || isLoading}
              className="w-full text-left relative overflow-hidden rounded-xl border border-slate-600/60 transition-all"
              style={{ minHeight: 44 }}
            >
              {/* Fill bar */}
              {showResults && (
                <div
                  className="absolute inset-0 rounded-xl bg-blue-500/20 transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-slate-100 font-medium">{option.text}</span>
                {showResults && (
                  <span className="text-xs font-bold text-slate-300 ml-2 shrink-0">{percentage}%</span>
                )}
                {hasVoted && poll.voters?.includes(userVoted) && option.votes === Math.max(...poll.options.map(o => o.votes)) && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 ml-1 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3">
        <span className="text-xs text-slate-500">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {poll.status === 'closed' && (
          <span className="text-xs text-slate-600 ml-2">· Closed</span>
        )}
      </div>
    </div>
  );
}