import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function InviteOwnerModal({ open, onClose, gym }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // Send invite via backend function
      await base44.functions.invoke('inviteGymOwner', { 
        email: email.trim(),
        gym_id: gym.id,
        gym_name: gym.name
      });
      
      setSuccess(true);
      setTimeout(() => {
        setEmail('');
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to send invite:', error);
      alert('Failed to send invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 border border-slate-700/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Invite Gym Owner</DialogTitle>
          <DialogDescription className="text-slate-300">
            Send an invite to the owner of {gym?.name} to claim and manage this gym profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {success ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-300 font-semibold">Invite sent successfully!</p>
              <p className="text-sm text-green-200/70 mt-1">They'll receive an email with instructions to claim the gym.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    className="pl-10 bg-slate-800/60 border-slate-600/40 text-white placeholder:text-slate-500 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <p className="text-sm text-blue-300">
                  💡 The gym owner will be able to verify the gym, add staff, manage content, and more once they join.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 border-slate-600/50 hover:bg-slate-800/50 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={isLoading || !email.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}