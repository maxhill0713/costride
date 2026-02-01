import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Bell, BellOff, Moon, Sun, Lock, Globe, Ruler, LogOut, User, Camera, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings) => base44.auth.updateMe(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
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
        {/* Profile */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Profile</h3>
              <p className="text-sm text-slate-300">Customize your profile appearance</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Profile Picture */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-4 mb-3">
                <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden ring-2 ring-slate-600/50">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold text-white">
                      {currentUser.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-bold text-slate-100">Profile Picture</Label>
                  <p className="text-xs text-slate-400">Upload a photo or enter a URL</p>
                </div>
              </div>
              <Input
                type="text"
                value={currentUser.avatar_url || ''}
                onChange={(e) => updateSettingsMutation.mutate({ avatar_url: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
            </div>

            {/* Banner Image */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <Image className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-sm font-bold text-slate-100">Banner Image</Label>
                  <p className="text-xs text-slate-400">Customize your profile header background</p>
                </div>
              </div>
              {currentUser.hero_image_url && (
                <div className="mb-3 rounded-xl overflow-hidden h-20">
                  <img src={currentUser.hero_image_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                type="text"
                value={currentUser.hero_image_url || ''}
                onChange={(e) => updateSettingsMutation.mutate({ hero_image_url: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
            </div>

            {/* Display Name */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Display Name</Label>
              <Input
                type="text"
                value={currentUser.full_name || ''}
                onChange={(e) => updateSettingsMutation.mutate({ full_name: e.target.value })}
                placeholder="Your name"
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
            </div>

            {/* Bio */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Bio</Label>
              <Textarea
                value={currentUser.bio || ''}
                onChange={(e) => updateSettingsMutation.mutate({ bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <p className="text-sm text-slate-300">Manage your notification preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                {currentUser.notifications_enabled ? (
                  <Bell className="w-5 h-5 text-slate-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <Label className="text-sm font-bold text-slate-100">Push Notifications</Label>
                  <p className="text-xs text-slate-400">Get notified about challenges and updates</p>
                </div>
              </div>
              <Switch
                checked={currentUser.notifications_enabled ?? true}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ notifications_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                {currentUser.email_notifications ? (
                  <Bell className="w-5 h-5 text-slate-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <Label className="text-sm font-bold text-slate-100">Email Notifications</Label>
                  <p className="text-xs text-slate-400">Receive email updates and summaries</p>
                </div>
              </div>
              <Switch
                checked={currentUser.email_notifications ?? true}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ email_notifications: checked })}
              />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-sm">
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
              <Select 
                value={currentUser.units || 'imperial'} 
                onValueChange={(value) => updateSettingsMutation.mutate({ units: value })}
              >
                <SelectTrigger className="rounded-2xl border border-white/20 bg-white/5 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                  <SelectItem value="metric">Metric (kg, m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Account Details */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-sm">
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
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-sm">
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
        <Card className="bg-gradient-to-br from-red-600/15 to-red-500/5 backdrop-blur-sm border border-red-500/40 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Account & Session</h3>
              <p className="text-sm text-slate-300">Manage your login session</p>
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
          </div>
        </Card>
      </div>
    </div>
  );
}