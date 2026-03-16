import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Users, Calendar, Star, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashOverview({ currentUser }) {
  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['coachClasses', coachProfile?.gym_id],
    queryFn: () => base44.entities.GymClass.filter({ gym_id: coachProfile.gym_id }),
    enabled: !!coachProfile?.gym_id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['gymClients', coachProfile?.gym_id],
    queryFn: () => base44.entities.GymMembership.filter({ gym_id: coachProfile.gym_id, status: 'active' }),
    enabled: !!coachProfile?.gym_id,
  });

  const stats = [
    { label: 'Total Classes', value: classes.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Active Clients', value: clients.length, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Specialties', value: (coachProfile?.specialties || []).length, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Rating', value: coachProfile?.rating ? `${coachProfile.rating}★` : '—', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  const upcomingClasses = classes.filter(c => c.schedule?.length > 0).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">
          Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Coach'}! 👋
        </h2>
        <p className="text-slate-400 mt-1 text-sm">Here's a snapshot of your coaching activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`${stat.bg} border p-4`}>
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Coach profile card */}
      {coachProfile ? (
        <Card className="bg-slate-800/60 border-slate-700 p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
              {coachProfile.avatar_url
                ? <img src={coachProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-white">{coachProfile.name?.[0] || 'C'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black text-white">{coachProfile.name}</p>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  {coachProfile.gym_name ? 'Gym Coach' : 'Independent'}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{coachProfile.gym_name || 'Independent Coach'}</p>
              {coachProfile.bio && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{coachProfile.bio}</p>}
              {(coachProfile.specialties || []).length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {coachProfile.specialties.slice(0, 4).map(s => (
                    <span key={s} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-amber-500/10 border-amber-500/30 p-5">
          <p className="text-amber-300 font-semibold text-sm">
            ⚠️ No coach profile found. Visit the <strong>Profile</strong> tab to create your coach profile.
          </p>
        </Card>
      )}

      {/* Upcoming classes */}
      {upcomingClasses.length > 0 && (
        <Card className="bg-slate-800/60 border-slate-700 p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" /> Upcoming Classes
          </h3>
          <div className="space-y-2">
            {upcomingClasses.map(cls => (
              <div key={cls.id} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{cls.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {cls.schedule?.[0]?.day} · {cls.schedule?.[0]?.time} · {cls.duration_minutes}min
                    </p>
                  </div>
                </div>
                <Badge className="bg-slate-600 text-slate-300 text-xs capitalize">{cls.difficulty}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}