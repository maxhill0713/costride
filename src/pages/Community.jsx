import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Users, Trophy, Dumbbell, MessageCircle, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export default function Community() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const gymIds = gymMemberships.map(m => m.gym_id);

  const { data: gyms = [] } = useQuery({
    queryKey: ['communityGyms', gymIds.join(',')],
    queryFn: async () => {
      if (gymIds.length === 0) return [];
      const results = await Promise.all(gymIds.map(id => base44.entities.Gym.filter({ id }).then(r => r[0]).catch(() => null)));
      return results.filter(Boolean);
    },
    enabled: gymIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-32">
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">Community</h1>
        <p className="text-sm text-slate-500 mb-6">Your gym communities</p>

        {gymMemberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-base font-black text-white mb-1">No Gym Communities Yet</p>
            <p className="text-sm text-slate-500 mb-5">Join a gym to access its community, leaderboard, and more.</p>
            <Link to={createPageUrl('Gyms')} className="bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold rounded-full px-5 py-2.5 flex items-center gap-2 shadow-[0_3px_0_0_#0369a1] text-sm">
              <Dumbbell className="w-4 h-4" /> Find a Gym
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {gymMemberships.map(membership => {
              const gym = gyms.find(g => g.id === membership.gym_id);
              return (
                <Link
                  key={membership.gym_id}
                  to={createPageUrl('GymCommunity') + `?id=${membership.gym_id}`}
                  className="block rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
                  style={CARD}
                >
                  <div className="relative h-24 overflow-hidden">
                    {gym?.image_url ? (
                      <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" style={{ opacity: 0.5 }} />
                    ) : (
                      <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }} />
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,4,10,0.8) 0%, transparent 70%)' }} />
                    <div className="absolute inset-0 flex items-center px-4 gap-3">
                      {gym?.logo_url ? (
                        <img src={gym.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/20 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                          <Dumbbell className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-base truncate">{membership.gym_name || gym?.name}</p>
                        <p className="text-slate-400 text-xs">{gym?.city}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Leaderboard</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Feed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Challenges</span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 capitalize">{membership.membership_type || 'member'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}