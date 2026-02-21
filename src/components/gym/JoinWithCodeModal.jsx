import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
const createPageUrl = (pageName) => `/${pageName}`;

export default function JoinWithCodeModal({ open, onClose, currentUser }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  // Pre-fill code from URL if present
  React.useEffect(() => {
    if (open) {
      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get('joinCode');
      if (joinCode) {
        setCode(joinCode.toUpperCase());
      }
    }
  }, [open]);

  const joinMutation = useMutation({
    mutationFn: async (joinCode) => {
      // Find gym by join code
      const gyms = await base44.entities.Gym.filter({ join_code: joinCode.toUpperCase() });
      
      if (gyms.length === 0) {
        throw new Error('Invalid gym code');
      }

      const gym = gyms[0];

      // Check if user already has 3 gym memberships
      const userMemberships = await base44.entities.GymMembership.filter({
        user_id: currentUser.id,
        status: 'active'
      });

      if (userMemberships.length >= 3) {
        throw new Error('You can only be a member of up to 3 gyms. Please leave a gym before joining a new one.');
      }
      
      // Check if already a member of this specific gym before checking limit
      const existingForThisGym = userMemberships.filter(m => m.gym_id === gym.id);
      if (existingForThisGym.length > 0) {
        throw new Error('Already a member of this gym');
      }

      // Check if banned
      if (gym.banned_members?.includes(currentUser.id)) {
        throw new Error('You are banned from this gym');
      }

      // Check if already a member
      const existing = await base44.entities.GymMembership.filter({
        user_id: currentUser.id,
        gym_id: gym.id,
        status: 'active'
      });

      if (existing.length > 0) {
        throw new Error('Already a member of this gym');
      }

      // Create membership
      await base44.entities.GymMembership.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        membership_type: 'monthly'
      });

      // Increment members count
      await base44.entities.Gym.update(gym.id, {
        members_count: (gym.members_count || 0) + 1
      });

      return gym;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['gymMemberships', currentUser?.id] });
    },
    onSuccess: (gym) => {
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      toast.success(`Joined ${gym.name}! 🎉`);
      onClose();
      window.location.href = createPageUrl('GymCommunity') + '?id=' + gym.id;
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }

    joinMutation.mutate(code);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-600/30 max-w-md w-full p-4 md:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-black bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
            Join with Code
          </h2>

        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <label className="text-xs md:text-sm font-bold text-slate-300 mb-2 block">
              Enter your gym's 6-character code
            </label>
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="FIT123"
              maxLength={6}
              className="text-center text-lg md:text-2xl font-bold tracking-widest bg-slate-700/50 border-slate-600 text-white rounded-xl h-10 md:h-14"
              autoFocus
            />
            <p className="text-[10px] md:text-xs text-slate-400 mt-2">
              Ask your gym for their unique join code
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 md:p-3 bg-red-900/30 border border-red-600/50 rounded-xl">
              <AlertCircle className="w-4 md:w-5 h-4 md:h-5 text-red-400 flex-shrink-0" />
              <p className="text-xs md:text-sm text-red-300">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={code.length !== 6 || joinMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold h-10 md:h-12 rounded-xl text-sm md:text-base"
          >
            {joinMutation.isPending ? (
              <>
                <Loader2 className="w-4 md:w-5 h-4 md:h-5 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                Join Gym
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-cyan-900/20 border border-cyan-600/30 rounded-xl">
          <h3 className="text-xs md:text-sm font-bold text-cyan-300 mb-2">How it works</h3>
          <ul className="text-[10px] md:text-xs text-slate-300 space-y-1">
            <li>• Get your gym's unique code</li>
            <li>• Enter it above</li>
            <li>• Instant access to the community</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}