import React from 'react';

function Shimmer({ className }) {
  return (
    <div className={`relative overflow-hidden bg-slate-800 rounded ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
    </div>
  );
}

export default function GymCommunitySkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Image Skeleton */}
      <Shimmer className="relative h-48 w-full rounded-none">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        {/* Back button */}
        <Shimmer className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-700" />
        {/* Logo */}
        <Shimmer className="absolute bottom-4 left-4 w-16 h-16 rounded-2xl bg-slate-700 border-2 border-slate-600" />
      </Shimmer>

      {/* Gym Info */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <Shimmer className="h-6 w-48 rounded-lg" />
        <Shimmer className="h-4 w-32 rounded" />
        <div className="flex gap-4 mt-2">
          <Shimmer className="h-4 w-20 rounded" />
          <Shimmer className="h-4 w-20 rounded" />
        </div>
      </div>

      {/* Check-In Button Skeleton */}
      <div className="px-4 mt-3">
        <Shimmer className="h-14 rounded-2xl w-full" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto">
        {['Home', 'Feed', 'Leaderboard', 'Events', 'Coaches'].map((tab) => (
          <Shimmer key={tab} className="h-9 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>

      {/* Content Cards Skeleton */}
      <div className="px-4 mt-4 space-y-4 pb-24">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Shimmer key={i} className="h-20 rounded-2xl" />
          ))}
        </div>

        {/* Post cards */}
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-slate-800/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <Shimmer className="h-4 w-28 rounded" />
                <Shimmer className="h-3 w-16 rounded" />
              </div>
            </div>
            <Shimmer className="h-4 w-full rounded" />
            <Shimmer className="h-4 w-3/4 rounded" />
            <Shimmer className="h-32 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}