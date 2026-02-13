import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PrivacySettingsContent({ searchQuery = '' }) {
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

  if (!currentUser) {
    return <p className="text-slate-400">Loading...</p>;
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Public Profile */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-400" />
              <div>
                <Label className="text-sm font-bold text-white block">Public Profile</Label>
                <p className="text-xs text-slate-400">Allow others to view your profile</p>
              </div>
            </div>
            <Switch
              checked={currentUser?.public_profile !== false}
              onCheckedChange={(checked) => {
                updateSettingsMutation.mutate({ public_profile: checked });
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}