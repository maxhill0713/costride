import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dumbbell, Check, Trophy, Gift, TrendingUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function JoinGymModal({ open, onClose, gym, currentUser }) {
  const queryClient = useQueryClient();

  const joinGymMutation = useMutation({
    mutationFn: async () => {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      return base44.entities.GymMembership.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        expiry_date: expirationDate.toISOString().split('T')[0],
        membership_type: 'monthly'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymMembership'] });
      onClose();
    }
  });

  if (!gym) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-blue-500" />
            Join {gym.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 mb-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gym Membership</h3>
              {gym.price ? (
                <>
                  <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    £{gym.price}
                  </div>
                  <p className="text-sm text-gray-600">per month</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Free
                  </div>
                  <p className="text-sm text-gray-600">Join now</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Access gym facilities</span>
              </div>
              <div className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Compete on leaderboards</span>
              </div>
              <div className="flex items-start gap-2">
                <Gift className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Earn exclusive rewards</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Track your progress</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Join gym challenges</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Attend classes & events</span>
              </div>
            </div>
          </Card>

          <Button
            onClick={() => joinGymMutation.mutate()}
            disabled={joinGymMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl h-12"
          >
            {joinGymMutation.isPending ? 'Processing...' : 'Join Gym Now'}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            By joining, you agree to the gym's terms and conditions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}