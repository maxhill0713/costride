import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../../utils';

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

      return gym;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-600/30 max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
            Join with Code
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-300 mb-2 block">
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
              className="text-center text-2xl font-bold tracking-widest bg-slate-700/50 border-slate-600 text-white rounded-xl h-14"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              Ask your gym for their unique join code
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600/50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={code.length !== 6 || joinMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold h-12 rounded-xl"
          >
            {joinMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Join Gym
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-cyan-900/20 border border-cyan-600/30 rounded-xl">
          <h3 className="text-sm font-bold text-cyan-300 mb-2">How it works</h3>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• Get your gym's unique code</li>
            <li>• Enter it above</li>
            <li>• Instant access to the community</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}