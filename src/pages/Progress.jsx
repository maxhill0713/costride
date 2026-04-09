import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, Target, Utensils, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AnalyticsTab from '../components/progress/AnalyticsTab';
import TargetsTab   from '../components/progress/TargetsTab';
import NutritionTab from '../components/progress/NutritionTab';
import TrainerTab   from '../components/progress/TrainerTab';

// Module-level set — tracks which tabs have animated this session
const animatedTabs = new Set();

export default function Progress() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }, '-created_date', 500),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser, staleTime: 2 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const [analyticsAnimKey, setAnalyticsAnimKey] = useState(0);
  useEffect(() => {
    if (!animatedTabs.has('analytics') && currentUser) {
      animatedTabs.add('analytics');
      setAnalyticsAnimKey(k => k + 1);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }} />
        <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4 pb-4" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center h-10 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-1 h-8 rounded bg-slate-700/60 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div style={{ height: 'calc(3rem + env(safe-area-inset-top))' }} />
        <div className="max-w-4xl mx-auto px-3 py-5 space-y-4">
          <div className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />)}
          </div>
          <div className="h-48 rounded-2xl bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }} />

      <Tabs defaultValue="analytics" className="w-full">
        {/* Fixed tab header */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4 pb-4" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center h-10">
              <TabsList className="flex justify-between w-full bg-transparent p-0 h-10 gap-0 border-0">
                <TabsTrigger value="analytics" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-sm justify-center">
                  <BarChart3 className="w-4 h-4 mr-1.5" />Analytics
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-sm justify-center">
                  <Target className="w-4 h-4 mr-1.5" />Targets
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-sm justify-center">
                  <Utensils className="w-4 h-4 mr-1.5" />Nutrition
                </TabsTrigger>
                <TabsTrigger value="rank" className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-sm justify-center">
                  <ClipboardList className="w-4 h-4 mr-1.5" />Trainer
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        <div style={{ height: 'calc(3rem + env(safe-area-inset-top))' }} />

        <TabsContent value="analytics" className="mt-0 px-3 md:px-4 py-5 pb-[130px] md:pb-5">
          <div className="max-w-4xl mx-auto">
            <AnalyticsTab currentUser={currentUser} workoutLogs={workoutLogs} checkIns={checkIns} animateCharts={analyticsAnimKey} />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-0 px-3 md:px-4 py-5 pb-[130px] md:pb-5">
          <div className="max-w-4xl mx-auto">
            <TargetsTab currentUser={currentUser} />
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="mt-0 px-3 md:px-4 py-5 pb-[130px] md:pb-5">
          <div className="max-w-4xl mx-auto">
            <NutritionTab />
          </div>
        </TabsContent>

        <TabsContent value="rank" className="mt-0 px-3 md:px-4 py-5 pb-[130px] md:pb-5">
          <div className="max-w-4xl mx-auto">
            <TrainerTab currentUser={currentUser} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}