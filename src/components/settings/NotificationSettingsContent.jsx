import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NotificationSettingsContent({ searchQuery = '' }) {
  const queryClient = useQueryClient();
  const query = searchQuery.toLowerCase();
  const showPush = !searchQuery.trim() || query.includes('push') || query.includes('notification');
  const showEmail = !searchQuery.trim() || query.includes('email') || query.includes('notification');

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
    }
  });

  if (!currentUser) {
    return <p className="text-slate-400">Loading...</p>;
  }

  return (
    <div className="space-y-4 pb-20">
      {showPush && (
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <div>
                <Label className="text-sm font-bold text-white block">Push Notifications</Label>
                <p className="text-xs text-slate-400">Get notified about important updates</p>
              </div>
            </div>
            <Switch
              checked={currentUser?.push_notifications !== false}
              onCheckedChange={(checked) => {
                updateSettingsMutation.mutate({ push_notifications: checked });
              }}
            />
          </div>
        </div>
        </Card>
        )}

        {showEmail && (
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-green-400" />
              <div>
                <Label className="text-sm font-bold text-white block">Email Notifications</Label>
                <p className="text-xs text-slate-400">Receive email updates</p>
              </div>
            </div>
            <Switch
              checked={currentUser?.email_notifications !== false}
              onCheckedChange={(checked) => {
                updateSettingsMutation.mutate({ email_notifications: checked });
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}