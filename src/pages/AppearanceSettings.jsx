import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Moon, Sun, Ruler, Globe, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';

export default function AppearanceSettings() {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Settings')}>
            <div className="flex items-center justify-center w-10 h-10">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Appearance</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Dark Mode */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl">
            <div className="flex items-center gap-3">
              {currentUser.dark_mode ?
              <Moon className="w-5 h-5 text-indigo-400" /> :

              <Sun className="w-5 h-5 text-orange-400" />
              }
              <div>
                <Label className="text-sm font-bold text-slate-100">Dark Mode</Label>
                <p className="text-xs text-slate-400">Switch between light and dark theme</p>
              </div>
            </div>
            <Switch
              checked={currentUser.dark_mode ?? false}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ dark_mode: checked })} />

          </div>
        </Card>

        {/* Unit System */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
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
              { value: 'metric', label: 'Metric (kg, m)' }]
              } />

          </div>
        </Card>

        {/* Language */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-5 h-5 text-slate-400" />
              <div>
                <Label className="text-sm font-bold text-slate-100">Language</Label>
                <p className="text-xs text-slate-400">Choose your preferred language</p>
              </div>
            </div>
            <MobileSelect
              value={currentUser.language || 'en'}
              onValueChange={(value) => updateSettingsMutation.mutate({ language: value })}
              placeholder="Select language"
              triggerClassName="rounded-2xl border border-white/20 bg-white/5 text-slate-100"
              options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'fr', label: 'Français' },
              { value: 'de', label: 'Deutsch' },
              { value: 'pt', label: 'Português' }]
              } />

          </div>
        </Card>
      </div>
    </div>);

}