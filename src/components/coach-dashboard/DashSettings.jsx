import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Search, CheckCircle2, Clock, X, Loader2, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DashSettings({ currentUser }) {
  const qc = useQueryClient();
  const [gymSearch, setGymSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['myJoinRequests', currentUser?.id],
    queryFn: () => base44.entities.CoachJoinRequest.filter({ coach_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const searchGyms = async () => {
    if (!gymSearch.trim()) return;
    setSearching(true);
    try {
      const results = await base44.entities.Gym.filter({ status: 'approved' });
      const q = gymSearch.toLowerCase();
      setSearchResults(results.filter(g => g.name?.toLowerCase().includes(q) || g.city?.toLowerCase().includes(q)).slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally { setSearching(false); }
  };

  const requestMutation = useMutation({
    mutationFn: async (gym) => {
      const existing = myRequests.find(r => r.gym_id === gym.id && r.status === 'pending');
      if (existing) throw new Error('Already requested to join this gym');
      return base44.entities.CoachJoinRequest.create({
        coach_id: currentUser.id,
        coach_name: currentUser.full_name,
        coach_email: currentUser.email,
        coach_avatar: currentUser.avatar_url || null,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'pending',
        type: 'coach_request',
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myJoinRequests'] }); toast.success('Request sent!'); },
    onError: (err) => toast.error(err.message || 'Failed to send request'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.CoachJoinRequest.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myJoinRequests'] }); toast.success('Request cancelled'); },
  });

  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const approvedRequests = myRequests.filter(r => r.status === 'approved');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-black text-white">Settings</h2>
        <p className="text-slate-400 text-sm">Manage your gym connections and preferences.</p>
      </div>

      {/* Current gym */}
      <Card className="bg-slate-800/60 border-slate-700 p-5">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" /> Current Gym
        </h3>
        {coachProfile?.gym_id ? (
          <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm">{coachProfile.gym_name}</p>
              <p className="text-xs text-green-400">Active connection</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">You are currently an independent coach. Request to join a gym below.</p>
        )}
      </Card>

      {/* Request to join gym */}
      <Card className="bg-slate-800/60 border-slate-700 p-5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" /> Request to Join a Gym
        </h3>
        <div className="flex gap-2">
          <Input
            value={gymSearch}
            onChange={e => setGymSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchGyms()}
            placeholder="Search gyms by name or city..."
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
          />
          <Button onClick={searchGyms} disabled={searching} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-shrink-0">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map(gym => {
              const alreadyRequested = myRequests.some(r => r.gym_id === gym.id && r.status === 'pending');
              const alreadyApproved = myRequests.some(r => r.gym_id === gym.id && r.status === 'approved') || coachProfile?.gym_id === gym.id;
              return (
                <div key={gym.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {gym.image_url ? <img src={gym.image_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{gym.name}</p>
                    <p className="text-xs text-slate-400">{gym.city}</p>
                  </div>
                  {alreadyApproved ? (
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">Joined</Badge>
                  ) : alreadyRequested ? (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">Pending</Badge>
                  ) : (
                    <Button onClick={() => requestMutation.mutate(gym)} disabled={requestMutation.isPending} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                      Request
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <Card className="bg-slate-800/60 border-slate-700 p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Pending Requests
          </h3>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{req.gym_name}</p>
                  <p className="text-xs text-amber-400">Awaiting approval</p>
                </div>
                <button onClick={() => cancelMutation.mutate(req.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notifications placeholder */}
      <Card className="bg-slate-800/60 border-slate-700 p-5">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" /> Notification Preferences
        </h3>
        <p className="text-slate-500 text-sm">Notification settings coming soon.</p>
      </Card>
    </div>
  );
}