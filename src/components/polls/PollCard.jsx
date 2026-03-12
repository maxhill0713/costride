import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PollCard({ poll, onVote, userVoted, isLoading }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const isClosed = poll.status === "closed";

  const getPercentage = (votes) => {
    if (!totalVotes) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="bg-slate-800/60 rounded-2xl p-4 space-y-3">

      {/* Title */}
      <div>
        <p className="text-white font-semibold text-sm">{poll.title}</p>
        {poll.description && (
          <p className="text-slate-400 text-xs mt-1">{poll.description}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const voted = userVoted === option.id;
          const showResults = !!userVoted || isClosed;

          return (
            <button
              key={option.id}
              disabled={!!userVoted || isClosed || isLoading}
              onClick={() => onVote?.(option.id)}
              className={`w-full relative overflow-hidden rounded-xl 
              bg-slate-700/40 hover:bg-slate-700/60 transition-all`}
            >
              {/* Result Fill */}
              {showResults && (
                <div
                  className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700
                  ${voted ? "bg-gradient-to-r from-blue-500/60 to-cyan-500/40" : "bg-gradient-to-r from-indigo-500/25 to-blue-500/20"}`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center justify-between px-4 py-2.5">
                <span
                  className={`text-sm ${
                    voted ? "text-white font-semibold" : "text-slate-200"
                  }`}
                >
                  {option.text}
                </span>

                {showResults && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-semibold">
                      {percentage}%
                    </span>

                    {voted && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-400 flex items-center justify-between">
        <span>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>

        {isClosed && (
          <span className="text-slate-500">Closed</span>
        )}
      </div>
    </div>
  );
}