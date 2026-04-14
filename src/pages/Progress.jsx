import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, Target, Utensils, MessageCircle, ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import AnalyticsTab from '../components/progress/AnalyticsTab';
import TargetsTab   from '../components/progress/TargetsTab';
import NutritionTab from '../components/progress/NutritionTab';
import TrainerTab   from '../components/progress/TrainerTab';

const animatedTabs = new Set();

const pageSlideVariants = {
  hidden:  { x: '100%', opacity: 1 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 36, mass: 1 } },
  exit:    { x: '100%', opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 } },
};

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

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

  const [showTrainer, setShowTrainer] = useState(false);
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
        <div
          className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4"
          style={{ paddingTop: 'calc(0.4rem + env(safe-area-inset-top))', paddingBottom: 0 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end h-[3.2rem] gap-2 pt-2 pb-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-1 h-7 rounded bg-slate-700/60 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div style={{ height: '3.8rem' }} />
        <div className="max-w-4xl mx-auto px-3 py-2 space-y-4">
          <div className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />)}
          </div>
          <div className="h-48 rounded-2xl bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  const tabTriggerClass =
    'data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent ' +
    'text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 pb-2 pt-0 ' +
    'transition-colors bg-transparent text-[16.5px] justify-center leading-none flex items-center';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }} />

      <Tabs defaultValue="analytics" className="w-full">

        {/* ── Fixed header ── */}
        <div
          className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4"
          style={{ paddingTop: 'calc(0.4rem + env(safe-area-inset-top))', paddingBottom: 0 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end h-[3.2rem] pt-2 pb-2">

              {/* Centred tabs */}
              <TabsList className="absolute left-1/2 -translate-x-1/2 flex bg-transparent p-0 gap-4 border-0 h-auto mb-[-1px] bottom-2">
                <TabsTrigger value="analytics" className={tabTriggerClass}>
                  <BarChart3 className="w-4 h-4 mr-1.5" />Analytics
                </TabsTrigger>
                <TabsTrigger value="goals" className={tabTriggerClass}>
                  <Target className="w-4 h-4 mr-1.5" />Targets
                </TabsTrigger>
                <TabsTrigger value="nutrition" className={tabTriggerClass}>
                  <Utensils className="w-4 h-4 mr-1.5" />Nutrition
                </TabsTrigger>
              </TabsList>

              {/* Message icon — pushed to the right */}
              <button
                onClick={() => setShowTrainer(true)}
                className="ml-auto flex items-center justify-center w-8 h-8 mb-1.5 flex-shrink-0 rounded-full text-slate-400 active:scale-90 transition-transform"
                aria-label="Chats"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: '3.8rem' }} />

        <TabsContent value="analytics" className="mt-0 px-3 md:px-4 py-1 pb-[130px] md:pb-5">
          <div className="max-w-4xl mx-auto">
            <AnalyticsTab currentUser={currentUser} workoutLogs={workoutLogs} checkIns={checkIns} animateCharts={analyticsAnimKey} />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-0 px-3 md:px-4 py-1 pb-[130px] md:pb-5">
          <div className="max-w-4xl mx-auto">
            <TargetsTab currentUser={currentUser} />
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="mt-0 px-3 md:px-4 py-1 pb-[130px] md:pb-5">
          <div className="max-w-4xl mx-auto">
            <NutritionTab />
          </div>
        </TabsContent>

      </Tabs>

      {/* ── Chats full-page slide ── */}
      <AnimatePresence>
        {showTrainer && (
          <>
            <motion.div
              key="trainer-overlay"
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              variants={overlayVariants}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => setShowTrainer(false)}
            />
            <motion.div
              key="trainer-panel"
              className="fixed inset-0 z-50"
              style={{
                minHeight: '100dvh',
                background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)',
                paddingTop: 'env(safe-area-inset-top)',
              }}
              variants={pageSlideVariants}
              initial="hidden" animate="visible" exit="exit"
            >
              <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
                <div className="relative flex items-center px-4 py-[14.7px] border-b border-slate-700/40 flex-shrink-0">
                  <button
                    onClick={() => setShowTrainer(false)}
                    className="flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-300" />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">Chats</h2>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 px-4 pb-4">
                  <TrainerTab currentUser={currentUser} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}