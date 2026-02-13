import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Moon, Sun, Ruler, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';

export default function AppearanceSettingsContent({ searchQuery = '' }) {
  const queryClient = useQueryClient();
  const query = searchQuery.toLowerCase();
  const showTheme = !searchQuery.trim() || query.includes('dark') || query.includes('mode') || query.includes('theme');
  const showUnit = !searchQuery.trim() || query.includes('unit') || query.includes('metric') || query.includes('imperial');
  const showLanguage = !searchQuery.trim() || query.includes('language');

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

  const isDarkMode = currentUser?.dark_mode !== false;

  return (
    <div className="space-y-4 pb-20">
      {showTheme && (
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <Label className="text-sm font-bold text-white block">Dark Mode</Label>
                <p className="text-xs text-slate-400">Easier on the eyes</p>
              </div>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={(checked) => {
                updateSettingsMutation.mutate({ dark_mode: checked });
              }}
            />
          </div>
        </div>
      </Card>

      {/* Unit System */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Ruler className="w-5 h-5 text-cyan-400" />
            <Label className="text-sm font-bold text-white">Unit System</Label>
          </div>
          <MobileSelect
            value={currentUser?.unit_system || 'metric'}
            onChange={(value) => {
              updateSettingsMutation.mutate({ unit_system: value });
            }}
            options={[
              { value: 'metric', label: 'Metric (kg, cm)' },
              { value: 'imperial', label: 'Imperial (lbs, inches)' }
            ]}
          />
        </div>
      </Card>

      {/* Language */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-green-400" />
            <Label className="text-sm font-bold text-white">Language</Label>
          </div>
          <MobileSelect
            value={currentUser?.language || 'en'}
            onChange={(value) => {
              updateSettingsMutation.mutate({ language: value });
            }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'fr', label: 'Français' },
              { value: 'de', label: 'Deutsch' }
            ]}
          />
        </div>
      </Card>
    </div>
  );
}