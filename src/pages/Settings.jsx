import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Bell, BellOff, Moon, Sun, Lock, Globe, Ruler, LogOut, User, Camera, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';

export default function Settings() {
  const queryClient = useQueryClient();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleImageUpload = async (file, type) => {
    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'avatar') {
        await updateSettingsMutation.mutateAsync({ avatar_url: file_url });
      } else {
        await updateSettingsMutation.mutateAsync({ hero_image_url: file_url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      await base44.auth.updateMe(settings);
      return base44.auth.me();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
         {/* Profile Button - Full Width */}
         <Link to={createPageUrl('ProfileSettings')}>
           <div className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl h-12 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <User className="w-4 h-4 text-white" />
               </div>
               <span className="font-semibold text-white">Profile</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Notifications */}
         <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
               {/* Notifications */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-white">Notifications</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                {currentUser.notifications_enabled ? (
                  <Bell className="w-4 h-4 text-slate-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-slate-500" />
                )}
                <Label className="text-sm font-semibold text-slate-100">Push Notifications</Label>
              </div>
              <Switch
                checked={currentUser.notifications_enabled ?? true}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ notifications_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                {currentUser.email_notifications ? (
                  <Bell className="w-4 h-4 text-slate-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-slate-500" />
                )}
                <Label className="text-sm font-semibold text-slate-100">Email Notifications</Label>
              </div>
              <Switch
                checked={currentUser.email_notifications ?? true}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ email_notifications: checked })}
              />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
              {currentUser.dark_mode ? (
                <Moon className="w-6 h-6 text-white" />
              ) : (
                <Sun className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Appearance</h3>
              <p className="text-sm text-slate-300">Customize your app experience</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl">
              <div className="flex items-center gap-3">
                {currentUser.dark_mode ? (
                  <Moon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sun className="w-5 h-5 text-orange-400" />
                )}
                <div>
                  <Label className="text-sm font-bold text-slate-100">Dark Mode</Label>
                  <p className="text-xs text-slate-400">Switch between light and dark theme</p>
                </div>
              </div>
              <Switch
                checked={currentUser.dark_mode ?? false}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ dark_mode: checked })}
              />
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <Ruler className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-sm font-bold text-slate-100">Unit System</Label>
                  <p className="text-xs text-slate-400">Choose your preferred measurement units</p>
                </div>
              </div>
              <MobileSelect 
                value={currentUser.units || 'imperial'} 
                onValueChange={(value) => updateSettingsMutation.mutate({ units: value })}
                placeholder="Select units"
                triggerClassName="rounded-2xl border border-white/20 bg-white/5 text-slate-100"
                options={[
                  { value: 'imperial', label: 'Imperial (lbs, ft)' },
                  { value: 'metric', label: 'Metric (kg, m)' }
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Account Details */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Account Details</h3>
              <p className="text-sm text-slate-300">Manage your email and password</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email Address</Label>
              <Input
                type="email"
                value={currentUser.email}
                disabled
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
              <p className="text-xs text-slate-400 mt-1">Contact support to change your email</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Password</Label>
              <Input
                type="password"
                value="••••••••"
                disabled
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
              <p className="text-xs text-slate-400 mt-1">Contact support to reset your password</p>
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Privacy</h3>
              <p className="text-sm text-slate-300">Control your profile visibility</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3">
              {currentUser.public_profile ? (
                <Globe className="w-5 h-5 text-slate-400" />
              ) : (
                <Lock className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <Label className="text-sm font-bold text-slate-100">Public Profile</Label>
                <p className="text-xs text-slate-400">Allow others to view your profile and stats</p>
              </div>
            </div>
            <Switch
              checked={currentUser.public_profile ?? true}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ public_profile: checked })}
            />
          </div>
        </Card>

        {/* Logout */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Danger Zone</h3>
              <p className="text-sm text-slate-300">Irreversible account actions</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold h-10 flex items-center gap-2"
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  base44.auth.logout();
                }
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
            <p className="text-xs text-slate-400 text-center">You will be logged out from all sessions</p>
            
            <div className="border-t border-red-500/20 pt-3 mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="w-full border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl font-semibold h-10"
                  >
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-red-600/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">⚠️ Delete Account?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      This will permanently delete your account and all your data including check-ins, posts, progress{currentUser.account_type === 'gym_owner' ? ', and all gyms you own' : ''}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      onClick={async () => {
                        try {
                          await base44.functions.invoke('deleteUserAccount');
                          base44.auth.logout();
                        } catch (error) {
                          console.error('Failed to delete account:', error);
                        }
                      }}
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-red-400 text-center mt-2">⚠️ This action is permanent and cannot be undone</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}