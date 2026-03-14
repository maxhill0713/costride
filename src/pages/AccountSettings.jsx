import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Lock, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function useSectionHighlight() {
  const { search } = useLocation();
  const section = new URLSearchParams(search).get('section');
  const [highlightedSection, setHighlightedSection] = useState(null);

  useEffect(() => {
    if (!section) return;
    setHighlightedSection(section);
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`section-${section}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    const clearTimer = setTimeout(() => setHighlightedSection(null), 2500);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [section]);

  return highlightedSection;
}

function SectionCard({ sectionId, highlightedSection, children }) {
  const isHighlighted = highlightedSection === sectionId;
  return (
    <div
      id={`section-${sectionId}`}
      style={{
        borderRadius: 16,
        transition: 'box-shadow 0.4s ease',
        boxShadow: isHighlighted ? '0 0 0 2px rgba(96,165,250,0.7), 0 0 24px rgba(96,165,250,0.25)' : 'none',
      }}
    >
      {children}
    </div>
  );
}

export default function AccountSettings() {
  const queryClient = useQueryClient();
  const highlightedSection = useSectionHighlight();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwords) => {
      const response = await base44.functions.invoke('updatePassword', passwords);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError('');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error) => {
      setPasswordError(error.message || 'Failed to update password');
      toast.error('Failed to update password');
    },
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('All fields are required'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match'); return; }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Settings')}>
            <div className="flex items-center justify-center w-10 h-10">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Account Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Email — id: section-email */}
        <SectionCard sectionId="email" highlightedSection={highlightedSection}>
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Email Address</h3>
                <p className="text-sm text-slate-300">Your account email cannot be changed here</p>
              </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Current Email</Label>
              <Input type="email" value={currentUser.email} disabled className="bg-white/5 border border-white/10 text-slate-100 rounded-xl cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-2">To change your email, please contact our support team</p>
            </div>
          </Card>
        </SectionCard>

        {/* Password — id: section-password */}
        <SectionCard sectionId="password" highlightedSection={highlightedSection}>
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
                <p className="text-sm text-slate-300">Update your account password</p>
              </div>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter your current password" className="bg-white/5 border border-white/10 text-slate-100 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="bg-white/5 border border-white/10 text-slate-100 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="bg-white/5 border border-white/10 text-slate-100 rounded-xl" />
              </div>
              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-400">{passwordError}</p>
                </div>
              )}
              <Button type="submit" disabled={updatePasswordMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold h-10">
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Card>
        </SectionCard>

      </div>
    </div>
  );
}