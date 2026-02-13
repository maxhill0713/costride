import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NotificationSettings() {
  const queryClient = useQueryClient();

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
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">Notification Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
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
      </div>
    </div>
  );
}