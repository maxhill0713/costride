import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Mail, BellRing, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NotificationSettingsContent() {
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
    }
  });

  const [notifStatus, setNotifStatus] = useState(null); // null | 'granted' | 'denied'

  const handleRequestPermission = async () => {
    if (!window.OneSignal) {
      console.warn('OneSignal not available');
      return;
    }
    const granted = await window.OneSignal.Notifications.requestPermission();
    if (granted) {
      console.log('OneSignal push notification permission granted');
      setNotifStatus('granted');
    } else {
      console.log('OneSignal push notification permission denied');
      setNotifStatus('denied');
    }
  };

  if (!currentUser) {
    return <p className="text-slate-400">Loading...</p>;
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Enable Browser Notifications */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <Label className="text-sm font-bold text-white block">Browser Notifications</Label>
              <p className="text-xs text-slate-400">Allow CoStride to send you push notifications</p>
            </div>
          </div>
          {notifStatus === 'granted' ? (
            <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Notifications enabled!
            </div>
          ) : (
            <button
              onClick={handleRequestPermission}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              <BellRing className="w-4 h-4" />
              Turn On Notifications
            </button>
          )}
          {notifStatus === 'denied' && (
            <p className="text-xs text-red-400">Permission denied. Please enable notifications in your browser settings.</p>
          )}
        </div>
      </Card>

      {/* Push Notifications */}
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

      {/* Email Notifications */}
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