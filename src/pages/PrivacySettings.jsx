import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Lock, Globe, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

export default function PrivacySettings() {
  const queryClient = useQueryClient();
  const highlightedSection = useSectionHighlight();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      await base44.auth.updateMe(settings);
      return base44.auth.me();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
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
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Settings')}>
            <div className="flex items-center justify-center w-10 h-10">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Privacy Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Visibility — id: section-visibility */}
        <SectionCard sectionId="visibility" highlightedSection={highlightedSection}>
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
                {currentUser.public_profile ? <Globe className="w-5 h-5 text-slate-400" /> : <Lock className="w-5 h-5 text-slate-500" />}
                <div>
                  <Label className="text-sm font-bold text-slate-100">Public Profile</Label>
                  <p className="text-xs text-slate-400">Allow others to view your profile and stats</p>
                </div>
              </div>
              <Switch checked={currentUser.public_profile ?? true} onCheckedChange={(checked) => updateSettingsMutation.mutate({ public_profile: checked })} />
            </div>
          </Card>
        </SectionCard>

      </div>
    </div>
  );
}