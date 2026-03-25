import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Crown, Building2, CheckCircle, Mail, ChevronLeft, Send, Users, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function InviteOwner() {
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
    queryFn: async () => {
      const gyms = await base44.entities.Gym.filter({ id: gymId });
      return gyms[0] || null;
    },
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Check if user already submitted a request
  const { data: existingRequests = [] } = useQuery({
    queryKey: ['gymOfficialRequests', gymId, currentUser?.id],
    queryFn: async () => {
      const requests = await base44.entities.Notification.filter({
        user_id: currentUser.id,
        type: 'gym_official_request'
      });
      return requests.filter(r => r.message?.includes(gym?.name));
    },
    enabled: !!gymId && !!currentUser && !!gym,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const submitOfficialRequestMutation = useMutation({
    mutationFn: async () => {
      // Create notification for admins to make gym official
      await base44.entities.Notification.create({
        user_id: currentUser.id,
        type: 'gym_official_request',
        title: `Request: Make ${gym.name} Official`,
        message: `${currentUser.full_name} (${currentUser.email}) requests that "${gym.name}" in ${gym.city} become an official gym. Reason: ${requestMessage || 'No reason provided'}`,
        icon: '✅',
        read: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gymOfficialRequests']);
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
            <h1 className="text-2xl font-black text-white">Make Gym Official</h1>
            <p className="text-slate-400 text-sm">Unlock rewards and exclusive perks</p>
          </div>
        </div>



        {/* What is a Ghost Gym */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-bold text-white">Unlock Exclusive Member Benefits</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            This gym isn't claimed yet. Help activate it to unlock <strong className="text-white">rewards, challenges, exclusive perks</strong>, engage in your official community, participate in polls, and get real-time updates from your gym!
          </p>
        </Card>

        {/* Notify Owner Section */}
        {gym.owner_email && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Notify the Owner</h3>
            </div>
            <p className="text-slate-300 text-xs mb-3">
              Send them an invite to unlock rewards for everyone!
            </p>
            <Button
              onClick={() => notifyOwnerMutation.mutate()}
              disabled={notifyOwnerMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl h-11 font-semibold"
            >
              <Mail className="w-4 h-4 mr-2" />
              {notifyOwnerMutation.isPending ? 'Sending...' : 'Send Invitation Email'}
            </Button>
          </Card>
        )}

        {/* Request Official Status */}
        {!hasSubmittedRequest ? (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Request Activation</h3>
            </div>
            <p className="text-slate-300 text-xs mb-3">
              Our team will contact the owner to unlock rewards
            </p>
            <div className="space-y-3">
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Additional info (optional)..."
                className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 text-sm min-h-[70px]"
              />
              <Button
                onClick={() => submitOfficialRequestMutation.mutate()}
                disabled={submitOfficialRequestMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl h-11 font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitOfficialRequestMutation.isPending ? 'Submitting...' : 'Request Official Status'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-green-900/20 to-green-900/10 backdrop-blur-xl border border-green-500/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white mb-1">Request Submitted!</h3>
                <p className="text-slate-300 text-xs">
                  We're reaching out to the gym owner now. Get ready for rewards! 🎉
                </p>
              </div>
            </div>
          </Card>
        )}


      </div>
    </div>
  );
}