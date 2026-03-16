import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function DashClients({ currentUser }) {
  const [search, setSearch] = useState('');

  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['gymMembers', coachProfile?.gym_id],
    queryFn: () => base44.entities.GymMembership.filter({ gym_id: coachProfile.gym_id, status: 'active' }),
    enabled: !!coachProfile?.gym_id,
  });

  const filtered = members.filter(m =>
    !search || m.user_name?.toLowerCase().includes(search.toLowerCase()) || m.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!coachProfile?.gym_id) {
    return (
      <div className="text-center py-16">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-semibold">No gym linked to your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white">Clients</h2>
        <p className="text-slate-400 text-sm">Active members at {coachProfile?.gym_name}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">{search ? 'No clients match your search' : 'No clients yet'}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {filtered.map(member => (
              <Card key={member.id} className="bg-slate-800/60 border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {member.user_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{member.user_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 truncate">{member.user_email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">Active</Badge>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {member.join_date ? new Date(member.join_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}