import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ExerciseInsights from '../profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../profile/WorkoutSplitHeatmap';
import ProgressiveOverloadTracker from '../profile/ProgressiveOverloadTracker';
import WeeklyVolumeChart from '../profile/WeeklyVolumeChart';
import WeightTracker from '../profile/WeightTracker';
import TopLiftsBox from './TopLiftsBox';

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export default function AnalyticsTab({ currentUser, workoutLogs, checkIns, animateCharts }) {
  const queryClient = useQueryClient();

  const handleSaveSBD = async (values) => {
    await base44.auth.updateMe({ sbd_prs: values });
    queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, sbd_prs: values } : old);
  };

  return (
    <div className="space-y-3">
      <div style={{ display: 'flex', gap: 12 }}>
        {/* ── Weekly Rep Volume (compressed) ── */}
        <div style={{ ...CARD, borderRadius: 16, padding: '12px 12px', flex: '0 0 42%' }}>
          <WeeklyVolumeChart currentUser={currentUser} animate={animateCharts} compact />
        </div>
        <TopLiftsBox sbdPRs={currentUser?.sbd_prs} onSave={handleSaveSBD} />
      </div>
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <ProgressiveOverloadTracker currentUser={currentUser} animate={animateCharts} />
      </div>
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <WeightTracker currentUser={currentUser} />
      </div>
      {currentUser?.workout_split && (
        <WorkoutSplitHeatmap
          checkIns={checkIns}
          workoutSplit={currentUser?.workout_split}
          weeklyGoal={currentUser?.weekly_goal}
          trainingDays={currentUser?.training_days}
          customWorkoutTypes={currentUser?.custom_workout_types || {}}
          joinDate={currentUser?.created_date}
        />
      )}
      <ExerciseInsights
        workoutLogs={workoutLogs}
        workoutSplit={currentUser?.custom_workout_types}
        trainingDays={currentUser?.training_days}
      />
    </div>
  );
}