import React, { useState, useEffect } from "react";

function ProgressBar({ percentage, voted }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percentage), 80);
    return () => clearTimeout(t);
  }, [percentage]);
  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden">
      <div
        className={`h-full rounded-lg transition-all duration-600 ease-out ${
          voted
            ? "bg-gradient-to-r from-violet-600/50 to-blue-500/40"
            : "bg-gradient-to-r from-violet-600/18 to-blue-500/14"
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function PollOption({ option, voted, showResults, isClosed, isLoading, onVote, totalVotes, isLeading }) {
  const percentage = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
  const isMyVote = voted === option.id;

  return (
    <button
      disabled={isClosed || isLoading}
      onClick={() => { if (!isClosed && !isLoading) onVote?.(option.id); }}
      className={`
        group w-full relative overflow-hidden rounded-lg border
        transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50
        ${isMyVote
          ? "border-violet-500/45 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]"
          : "border-white/[0.08] hover:border-white/[0.18]"
        }
        ${isClosed || isLoading ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}
        bg-slate-950/60
      `}
    >
      {showResults && <ProgressBar percentage={percentage} voted={isMyVote} />}
      <div className="relative z-10 flex items-center justify-between px-2.5 py-[7px] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showResults && isLeading && (
            <span className="flex-shrink-0 w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_5px_rgba(167,139,250,0.8)]" />
          )}
          <span className={`text-[11.5px] font-medium truncate transition-colors ${isMyVote ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
            {option.text}
          </span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {showResults && (
            <span className={`text-[10.5px] font-bold tabular-nums ${isMyVote ? "text-violet-300" : "text-violet-400/80"}`}>
              {percentage}%
            </span>
          )}
          {isMyVote && (
            <svg className="w-3 h-3 text-violet-400" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {!showResults && !isClosed && (
            <svg className="w-3 h-3 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

export default function PollCard({ poll, onVote, userVoted, isLoading }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const isClosed = poll.status === "closed";
  const showResults = !!userVoted || isClosed;
  const sortedIds = [...poll.options].sort((a, b) => b.votes - a.votes).map(o => o.id);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #1e293b 0%, #0f172a 100%)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 6px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="h-px" style={{ background: "linear-gradient(90deg,transparent 10%,rgba(139,92,246,0.22) 50%,transparent 90%)" }} />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[12.5px] font-semibold text-slate-100 leading-snug">{poll.title}</p>
            {poll.description && <p className="text-[10.5px] text-slate-400/70 mt-0.5">{poll.description}</p>}
          </div>
          {isClosed && (
            <span className="flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500 border border-white/10 bg-white/4">
              Closed
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {poll.options.map((option) => (
            <PollOption
              key={option.id}
              option={option}
              voted={userVoted}
              showResults={showResults}
              isClosed={isClosed}
              isLoading={isLoading}
              onVote={onVote}
              totalVotes={totalVotes}
              isLeading={showResults && sortedIds[0] === option.id}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10.5px] text-slate-500">
            <span className="text-slate-300 font-medium">{totalVotes}</span> {totalVotes === 1 ? "vote" : "votes"}
          </span>
          {isLoading && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="w-2.5 h-2.5 border border-slate-600 border-t-violet-400 rounded-full animate-spin" />
              Saving…
            </span>
          )}
          {userVoted && !isClosed && !isLoading && (
            <span className="text-[10px] text-violet-400/75 font-medium">Tap to change vote</span>
          )}
        </div>
      </div>
    </div>
  );
}
