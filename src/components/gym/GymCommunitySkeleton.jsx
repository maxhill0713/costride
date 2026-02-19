import React from 'react';

export default function GymCommunitySkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 animate-pulse">
      {/* Hero Image Skeleton */}
      <div className="relative h-48 bg-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        {/* Back button */}
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-700" />
        {/* Logo */}
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-2xl bg-slate-700 border-2 border-slate-600" />
      </div>

      {/* Gym Info */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="h-6 w-48 bg-slate-700 rounded-lg" />
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="flex gap-4 mt-2">
          <div className="h-4 w-20 bg-slate-800 rounded" />
          <div className="h-4 w-20 bg-slate-800 rounded" />
        </div>
      </div>

      {/* Check-In Button Skeleton */}
      <div className="px-4 mt-3">
        <div className="h-14 rounded-2xl bg-slate-700 w-full" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto">
        {['Home', 'Feed', 'Leaderboard', 'Events', 'Coaches'].map((tab) => (
          <div key={tab} className="h-9 w-20 flex-shrink-0 rounded-full bg-slate-800" />
        ))}
      </div>

      {/* Content Cards Skeleton */}
      <div className="px-4 mt-4 space-y-4 pb-24">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-slate-800" />
          ))}
        </div>

        {/* Post cards */}
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-slate-800/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700" />
              <div className="space-y-1">
                <div className="h-4 w-28 bg-slate-700 rounded" />
                <div className="h-3 w-16 bg-slate-800 rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-slate-700 rounded" />
            <div className="h-4 w-3/4 bg-slate-700 rounded" />
            <div className="h-32 rounded-xl bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}