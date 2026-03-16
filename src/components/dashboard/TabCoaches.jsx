import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, CheckCircle2, X, Clock, Mail, Plus, Star, Award, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TabCoaches({ gym, currentUser }) {
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const { data: coaches = [], isLoading: coachesLoading } = useQuery({
    queryKey: ['coaches', gym?.id],
    queryFn: () => base44.entities.Coach.filter({ gym_id: gym.id }),
    enabled: !!gym?.id,
  });

  const { data: joinRequests = [] } = useQuery({
    queryKey: ['coachJoinRequests', gym?.id],
    queryFn: () => base44.entities.CoachJoinRequest.filter({ gym_id: gym.id, status: 'pending' }),
    enabled: !!gym?.id,
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (req) => {
      await base44.entities.CoachJoinRequest.update(req.id, { status: 'approved' });
      // Update coach profile with gym info
      const coachProfiles = await base44.entities.Coach.filter({ user_email: req.coach_email });
      if (coachProfiles.length > 0) {
        await base44.entities.Coach.update(coachProfiles[0].id, { gym_id: gym.id, gym_name: gym.name });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coaches', gym?.id] });
      qc.invalidateQueries({ queryKey: ['coachJoinRequests', gym?.id] });
      toast.success('Coach approved!');
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.CoachJoinRequest.update(id, { status: 'rejected' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coachJoinRequests', gym?.id] }); toast.success('Request declined'); },
  });

  const removeCoachMutation = useMutation({
    mutationFn: async (coach) => {
      await base44.entities.Coach.update(coach.id, { gym_id: null, gym_name: null });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaches', gym?.id] }); toast.success('Coach removed from gym'); },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Look up coach by email
      const coaches = await base44.entities.Coach.filter({ user_email: inviteEmail.trim() });
      if (coaches.length === 0) throw new Error('No coach found with that email');
      const coach = coaches[0];
      const existing = await base44.entities.CoachJoinRequest.filter({ coach_id: coach.id || coach.user_email, gym_id: gym.id });
      if (existing.length > 0 && existing[0].status === 'pending') throw new Error('Already invited this coach');
      return base44.entities.CoachJoinRequest.create({
        coach_id: coach.id,
        coach_name: coach.name,
        coach_email: coach.user_email,
        coach_avatar: coach.avatar_url || null,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'pending',
        type: 'gym_invite',
        message: inviteMsg,
      });
    },
    onSuccess: () => { setInviteEmail(''); setInviteMsg(''); setShowInviteForm(false); toast.success('Invite sent!'); },
    onError: (err) => toast.error(err.message || 'Failed to send invite'),
  });

  return (
    <div className="space-y-6">
      {/* Join requests */}
      {joinRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Pending Join Requests
            <span className="ml-auto w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">{joinRequests.length}</span>
          </h3>
          {joinRequests.map(req => (
            <Card key={req.id} className="bg-amber-500/10 border-amber-500/25 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                  {req.coach_avatar ? <img src={req.coach_avatar} alt="" className="w-full h-full object-cover" /> : req.coach_name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{req.coach_name || 'Unknown Coach'}</p>
                  <p className="text-xs text-slate-400">{req.coach_email}</p>
                  {req.message && <p className="text-xs text-slate-500 italic mt-0.5">"{req.message}"</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" onClick={() => approveRequestMutation.mutate(req)} disabled={approveRequestMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white h-8 gap-1 text-xs">
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rejectRequestMutation.mutate(req.id)} className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 gap-1 text-xs">
                    <X className="w-3 h-3" /> Decline
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite form */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" /> Gym Coaches ({coaches.length})
        </h3>
        <Button onClick={() => setShowInviteForm(!showInviteForm)} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1 text-sm">
          <Plus className="w-4 h-4" /> Invite Coach
        </Button>
      </div>

      {showInviteForm && (
        <Card className="bg-slate-800/80 border-slate-700 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Invite a Coach by Email</p>
          <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="coach@email.com" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
          <Input value={inviteMsg} onChange={e => setInviteMsg(e.target.value)} placeholder="Optional message..." className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowInviteForm(false)} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {inviteMutation.isPending ? 'Sending…' : 'Send Invite'}
            </Button>
          </div>
        </Card>
      )}

      {/* Coaches list */}
      {coachesLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : coaches.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No coaches yet</p>
          <p className="text-slate-500 text-sm mt-1">Invite coaches to your gym or approve join requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {coaches.map(coach => (
            <Card key={coach.id} className="bg-slate-800/60 border-slate-700 p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {coach.avatar_url ? <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" /> : coach.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-white text-sm truncate">{coach.name}</p>
                    {coach.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-400 flex-shrink-0">
                        <Star className="w-3 h-3 fill-amber-400" />{coach.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{coach.experience_years ? `${coach.experience_years} yrs exp.` : ''}</p>
                  {(coach.specialties || []).length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {coach.specialties.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  {(coach.certifications || []).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {coach.certifications.slice(0, 2).map(c => (
                        <span key={c} className="text-[10px] flex items-center gap-0.5 text-amber-400"><Award className="w-2.5 h-2.5" />{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => removeCoachMutation.mutate(coach)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}