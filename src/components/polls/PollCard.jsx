import React, { useState, useEffect, useRef } from "react";

// ─── Animated fill bar ────────────────────────────────────────────────────────
function ProgressBar({ percentage, voted, animate }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percentage), 80);
    return () => clearTimeout(t);
  }, [percentage]);

  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden">
      <div
        className={`h-full rounded-xl transition-all duration-700 ease-out ${
          voted
            ? "bg-gradient-to-r from-violet-600/55 to-blue-500/45"
            : "bg-gradient-to-r from-violet-600/22 to-blue-500/18"
        }`}
        style={{ width: animate ? `${width}%` : "0%" }}
      />
    </div>
  );
}

// ─── Ripple effect ────────────────────────────────────────────────────────────
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const trigger = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { x, y, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  };
  return { ripples, trigger };
}

// ─── Individual option ────────────────────────────────────────────────────────
function PollOption({ option, voted, showResults, isClosed, isLoading, onVote, totalVotes, rank }) {
  const percentage = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
  const isMyVote = voted === option.id;
  const isLeading = rank === 0 && showResults && totalVotes > 0;
  const { ripples, trigger } = useRipple();

  return (
    <button
      disabled={isClosed || isLoading}
      onClick={(e) => {
        if (!isClosed && !isLoading) {
          trigger(e);
          onVote?.(option.id);
        }
      }}
      className={`
        group w-full relative overflow-hidden rounded-xl
        border transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50
        ${isMyVote
          ? "border-violet-500/50 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_2px_16px_rgba(139,92,246,0.12)]"
          : "border-white/[0.08] hover:border-white/[0.18]"
        }
        ${isClosed || isLoading ? "cursor-default" : "cursor-pointer active:scale-[0.985]"}
        bg-slate-800/50
      `}
      style={{ minHeight: 52 }}
    >
      {/* Animated percentage fill */}
      {showResults && (
        <ProgressBar percentage={percentage} voted={isMyVote} animate={showResults} />
      )}

      {/* Ripple */}
      {ripples.map((rp) => (
        <span
          key={rp.id}
          className="absolute rounded-full bg-white/10 pointer-events-none animate-ping"
          style={{ left: rp.x - 20, top: rp.y - 20, width: 40, height: 40, animationDuration: "0.6s" }}
        />
      ))}

      {/* Content */}
      <div className="relative flex items-center justify-between px-4 py-3.5 gap-3">
        {/* Leading dot */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showResults && isLeading && (
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
          )}
          <span
            className={`text-sm font-medium truncate transition-colors duration-200 ${
              isMyVote
                ? "text-white"
                : "text-slate-300 group-hover:text-white"
            }`}
          >
            {option.text}
          </span>
        </div>

        {/* Right side */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {showResults && (
            <span
              className={`text-xs font-bold tabular-nums transition-colors duration-200 ${
                isMyVote ? "text-violet-300" : "text-slate-400"
              }`}
            >
              {percentage}%
            </span>
          )}
          {isMyVote && (
            <CheckIcon className="w-4 h-4 text-violet-400 flex-shrink-0" />
          )}
          {!showResults && !isClosed && (
            <ChevronIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors duration-200 opacity-0 group-hover:opacity-100" />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Inline SVG icons (no extra deps) ────────────────────────────────────────
function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Main PollCard ─────────────────────────────────────────────────────────────
export default function PollCard({ poll, onVote, userVoted, isLoading }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const isClosed = poll.status === "closed";
  const showResults = !!userVoted || isClosed;

  // Sort for "leading" rank — we pass rank index to each option
  const sortedIds = [...poll.options]
    .sort((a, b) => b.votes - a.votes)
    .map((o) => o.id);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Subtle top-edge glow */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(148,163,184,0.15) 50%, transparent 90%)",
        }}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-white text-[15px] font-semibold leading-snug tracking-tight">
              {poll.title}
            </p>
            {poll.description && (
              <p className="text-slate-400 text-xs leading-relaxed">{poll.description}</p>
            )}
          </div>
          {isClosed && (
            <span className="flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 border border-white/10 bg-white/5">
              <LockIcon className="w-2.5 h-2.5" />
              Closed
            </span>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
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
              rank={sortedIds.indexOf(option.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs text-slate-500">
            <span className="text-slate-300 font-medium">{totalVotes}</span>{" "}
            {totalVotes === 1 ? "vote" : "votes"}
          </span>

          {isLoading && (
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border border-slate-500 border-t-violet-400 rounded-full animate-spin" />
              Saving…
            </span>
          )}

          {userVoted && !isClosed && !isLoading && (
            <span className="text-xs text-violet-400/80 font-medium">
              Tap another option to change
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
