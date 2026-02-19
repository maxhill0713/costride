import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Crown, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteOwnerModal({ gym, isOpen, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const [requestMessage, setRequestMessage] = useState('');

  const { data: existingRequests = [] } = useQuery({
    queryKey: ['gymOfficialRequests', gym?.id, currentUser?.id],
    queryFn: async () => {
      const requests = await base44.entities.Notification.filter({
        user_id: currentUser.id,
        type: 'gym_official_request'
      });
      return requests.filter(r => r.message?.includes(gym?.name));
    },
    enabled: isOpen && !!gym && !!currentUser,
    staleTime: 2 * 60 * 1000
  });

  const submitOfficialRequestMutation = useMutation({
    mutationFn: async () => {
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
      onClose();
    }
  });

  const notifyOwnerMutation = useMutation({
    mutationFn: async () => {
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

  const hasSubmittedRequest = existingRequests.length > 0;

  if (!gym) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Unlock Exclusive Perks</DialogTitle>
          <DialogDescription className="text-slate-400">
            Help activate {gym.name} to unlock rewards and challenges
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                This gym isn't claimed yet. Unlock <strong>rewards, challenges, exclusive perks</strong>, and real-time updates from your gym!
              </p>
            </div>
          </div>

          {/* Notify Owner */}
          {gym.owner_email && !hasSubmittedRequest && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-semibold text-white">Notify the Owner</p>
              </div>
              <Button
                onClick={() => notifyOwnerMutation.mutate()}
                disabled={notifyOwnerMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
              >
                {notifyOwnerMutation.isPending ? 'Sending...' : 'Send Invitation Email'}
              </Button>
            </div>
          )}

          {/* Request Official Status */}
          {!hasSubmittedRequest ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-semibold text-white">Request Activation</p>
              </div>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Tell us why this gym should be activated (optional)..."
                className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 text-xs min-h-[60px]"
              />
              <Button
                onClick={() => submitOfficialRequestMutation.mutate()}
                disabled={submitOfficialRequestMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9"
              >
                {submitOfficialRequestMutation.isPending ? 'Submitting...' : 'Request Official Status'}
              </Button>
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Request Submitted!</p>
                  <p className="text-xs text-slate-300">We're reaching out to the gym owner now. 🎉</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full text-slate-300 hover:text-white hover:bg-slate-800/50"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}