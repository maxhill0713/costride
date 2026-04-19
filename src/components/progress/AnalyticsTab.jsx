import React from 'react';
import ExerciseInsights from '../profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../profile/WorkoutSplitHeatmap';
import ProgressiveOverloadTracker from '../profile/ProgressiveOverloadTracker';
import WeeklyVolumeChart from '../profile/WeeklyVolumeChart';
import WeightTracker from '../profile/WeightTracker';

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export default function AnalyticsTab({ currentUser, workoutLogs, checkIns, animateCharts }) {
  return (
    <div className="space-y-1.5">
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <WeightTracker currentUser={currentUser} />
      </div>
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <ProgressiveOverloadTracker currentUser={currentUser} animate={animateCharts} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {/* ── Empty placeholder box ── */}
        <div style={{ ...CARD, borderRadius: 16, padding: '12px 12px', flex: 1, minHeight: 180 }} />
        {/* ── Weekly Rep Volume (compressed) ── */}
        <div style={{ ...CARD, borderRadius: 16, padding: '12px 12px', flex: 1 }}>
          <WeeklyVolumeChart currentUser={currentUser} animate={animateCharts} compact />
        </div>
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