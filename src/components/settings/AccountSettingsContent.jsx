import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

export default function AccountSettingsContent() {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await base44.functions.invoke('deleteUserAccount', {});
      // Log out and redirect to login — if they sign up again with same email it's a fresh account
      base44.auth.logout('/');
    } catch (error) {
      alert('Failed to delete account: ' + error.message);
      setIsDeleting(false);
    }
  };

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
      {/* Delete Account */}
      <Card className="bg-gradient-to-br from-red-950/40 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-red-900/30 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-red-900/10 border border-red-800/20 rounded-2xl">
          <Label className="text-xs font-bold text-red-400 uppercase mb-2 block">Danger Zone</Label>
          <p className="text-xs text-slate-400 mb-4">Permanently delete your account and all associated data. This cannot be undone. If you sign up again with the same email, it will be treated as a brand new account.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full rounded-xl font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border border-red-900/40 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-400">Delete Account?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  This will permanently delete your account, all gym memberships, check-ins, lifts, goals, and any gyms you own. You will be logged out immediately.
                  <br /><br />
                  Type <span className="font-bold text-red-400">DELETE</span> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder='Type DELETE to confirm'
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700" onClick={() => setDeleteConfirmText('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
}