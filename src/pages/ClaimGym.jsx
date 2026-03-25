import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Crown, Building2, CheckCircle, Mail, ChevronLeft, Send, Users, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClaimGym() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');
  const [requestMessage, setRequestMessage] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: () => base44.entities.Gym.filter({ id: gymId }).then(r => r[0]),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });

  // Check if user already submitted a request
  const { data: existingRequests = [] } = useQuery({
    queryKey: ['gymRequests', gymId, currentUser?.id],
    queryFn: async () => {
      const requests = await base44.entities.Notification.filter({
        user_id: currentUser.id,
        type: 'gym_claim_request'
      });
      return requests.filter(r => r.message?.includes(gym?.name));
    },
    enabled: !!gymId && !!currentUser && !!gym
  });

  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      // Create notification for admins
      await base44.entities.Notification.create({
        user_id: currentUser.id,
        type: 'gym_claim_request',
        title: `Gym Claim Request: ${gym.name}`,
        message: `${currentUser.full_name} (${currentUser.email}) wants to claim ${gym.name} in ${gym.city}. Message: ${requestMessage || 'No message provided'}`,
        icon: '🏋️',
        read: false
      });
      
      // Also update gym with claim metadata
      const currentRequests = gym.claim_requests || [];
      await base44.entities.Gym.update(gymId, {
        claim_requests: [...currentRequests, {
          user_id: currentUser.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name,
          message: requestMessage,
          date: new Date().toISOString()
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gymRequests']);
      queryClient.invalidateQueries(['gym', gymId]);
      toast.success('Request submitted successfully!');
      setRequestMessage('');
    }
  });

  const notifyOwnerMutation = useMutation({
    mutationFn: async () => {
      // Send email to gym's listed email if available
      if (gym.owner_email) {
        await base44.integrations.Core.SendEmail({
          to: gym.owner_email,
          subject: `${gym.name} - Join Your Gym Community on CoStride`,
          body: `Hi there!\n\nYour gym "${gym.name}" has been added to CoStride, and members are already checking in and engaging with your community.\n\nClaim your gym page to unlock powerful features:\n\n✅ Post updates and announcements\n✅ Create challenges and events\n✅ Manage coaches and classes\n✅ View member analytics\n✅ Offer exclusive rewards\n\nJoin CoStride today: ${window.location.origin}\n\nBest regards,\nThe CoStride Team`
        });
        toast.success('Owner notified!');
      } else {
        toast.error('No contact email available for this gym');
      }
    }
  });

  if (gymLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-slate-300 mb-4">Gym not found</p>
          <Link to={createPageUrl('Gyms')}>
            <Button>Back to Gyms</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const hasSubmittedRequest = existingRequests.length > 0;
  const totalRequests = gym.claim_requests?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('GymCommunity') + `?id=${gymId}`}>
            <Button variant="ghost" size="icon" className="text-white">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Claim Your Gym</h1>
            <p className="text-slate-400 text-sm">Take control of your community</p>
          </div>
        </div>

        {/* Gym Info Card */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{gym.name}</h2>
              <p className="text-slate-300 text-sm">{gym.city}</p>
              {totalRequests > 0 && (
                <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                  <Users className="w-3 h-3 mr-1" />
                  {totalRequests} {totalRequests === 1 ? 'request' : 'requests'}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Why Claim Your Gym?</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Engage Your Community</p>
                <p className="text-slate-400 text-xs">Post updates, create challenges, and host events</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Manage Your Team</p>
                <p className="text-slate-400 text-xs">Add coaches, schedule classes, and manage staff</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Reward Loyalty</p>
                <p className="text-slate-400 text-xs">Create custom rewards for your most dedicated members</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Track Growth</p>
                <p className="text-slate-400 text-xs">View analytics, member activity, and community insights</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Request Form */}
        {!hasSubmittedRequest ? (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Submit Claim Request</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Tell us about your role (optional)
                </label>
                <Textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="e.g., I'm the owner/manager of this gym..."
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 min-h-[100px]"
                />
              </div>
              <Button
                onClick={() => submitRequestMutation.mutate()}
                disabled={submitRequestMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl h-12 font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Our team will review your request and get back to you shortly
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-green-900/20 to-green-900/10 backdrop-blur-xl border border-green-500/30 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Request Submitted</h3>
                <p className="text-slate-300 text-sm">
                  Thanks for your interest! Our team will review your request and contact you soon.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Notify Owner Section */}
        {gym.owner_email && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Know the Owner?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Send them an invitation to join and manage their community on CoStride
            </p>
            <Button
              onClick={() => notifyOwnerMutation.mutate()}
              disabled={notifyOwnerMutation.isPending}
              variant="outline"
              className="w-full border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-xl h-12"
            >
              <Mail className="w-4 h-4 mr-2" />
              {notifyOwnerMutation.isPending ? 'Sending...' : 'Notify Owner'}
            </Button>
          </Card>
        )}

        {/* Community Stats */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Community Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-slate-800/50">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{gym.members_count || 0}</p>
              <p className="text-xs text-slate-400">Members</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-800/50">
              <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">Growing</p>
              <p className="text-xs text-slate-400">Community</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}