import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AccountSettingsContent({ searchQuery = '' }) {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showEmail = !searchQuery.trim() || searchQuery.toLowerCase().includes('email');
  const showPassword = !searchQuery.trim() || searchQuery.toLowerCase().includes('password');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwords) => {
      const response = await base44.functions.invoke('updatePassword', passwords);
      return response.data;
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  if (!currentUser) {
    return <p className="text-slate-400">Loading...</p>;
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Email */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email Address</Label>
          <Input
            type="email"
            value={currentUser.email || ''}
            disabled
            className="bg-white/5 border border-white/10 text-slate-100 rounded-xl disabled:opacity-75"
          />
          <p className="text-xs text-slate-500 mt-2">Email cannot be changed</p>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Label className="text-xs font-bold text-slate-400 uppercase mb-4 block">Change Password</Label>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <Label className="text-xs text-slate-300 mb-2 block">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300 mb-2 block">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300 mb-2 block">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium w-full"
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}