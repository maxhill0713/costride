import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function UpgradeMembershipModal({ open, onClose, currentUser }) {
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      return base44.auth.updateMe({
        has_premium: true,
        premium_expires: expirationDate.toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      onClose();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Free Plan */}
          <Card className="p-6 border-2 border-gray-200">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-3xl font-black text-gray-900">£0</div>
              <p className="text-sm text-gray-500">Basic access</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">View gym community</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Browse classes & events</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">No leaderboard access</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">No rewards program</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">Limited check-ins</span>
              </div>
            </div>
          </Card>

          {/* Premium Plan */}
          <Card className="p-6 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
              <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">£9.99</div>
              <p className="text-sm text-gray-600">per month</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Everything in Free</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Full leaderboard access</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Earn & claim rewards</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Unlimited check-ins</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Join challenges</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Track personal records</span>
              </div>
            </div>
            <Button
              onClick={() => upgradeMutation.mutate()}
              disabled={upgradeMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl"
            >
              {upgradeMutation.isPending ? 'Processing...' : 'Upgrade Now'}
            </Button>
          </Card>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Cancel anytime. Your membership will remain active until the end of the billing period.
        </p>
      </DialogContent>
    </Dialog>
  );
}