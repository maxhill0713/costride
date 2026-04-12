import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ShareWorkoutScreen from '../profile/ShareWorkoutScreen';
import WorkoutDaysCelebration from './WorkoutDaysCelebration';

const POSE_1_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d4e06e17_Pose2_V21.png';

function StreakCelebration({
  showStreakCelebration,
  celebrationStreakNum,
  showChallengesCelebration,
  celebrationChallenges,
  showShareWorkout,
  celebrationWorkoutName,
  celebrationExercises,
  celebrationPreviousExercises,
  celebrationDurationMinutes,
  currentUser,
  showDaysCelebration,
  weeklyWorkoutLogs,
  todayDowAdjusted,
  setShowShareWorkout,
  setShowDaysCelebration,
  setJustLoggedDay,
  onChallengesContinue,
}) {
  useEffect(() => {
    if (!showStreakCelebration) return;

    // Wait for AnimatePresence to actually render the DOM nodes
    const raf = requestAnimationFrame(() => {
      const stage = document.getElementById('streak-anim-stage');
      const numEl = document.getElementById('streak-anim-num');
      const p1 = document.getElementById('streak-anim-p1');
      const p2 = document.getElementById('streak-anim-p2');
      if (!stage || !numEl) return;

      // Reset state
      stage.style.transition = 'none';
      stage.style.opacity = '0';
      stage.style.transform = 'scale(0.4) translateY(40px)';
      stage.style.filter = 'none';
      numEl.style.transition = 'none';
      numEl.style.opacity = '0';
      numEl.style.transform = 'scale(0.3)';
      numEl.textContent = String(celebrationStreakNum);
      if (p1) p1.style.display = 'block';
      if (p2) p2.style.display = 'none';

      // Bounce in icon
      const t1 = setTimeout(() => {
        stage.style.transition = 'opacity 0.18s ease, transform 0.55s cubic-bezier(0.34,1.6,0.64,1)';
        stage.style.opacity = '1';
        stage.style.transform = 'scale(1) translateY(0)';
      }, 60);

      // Pop in number
      const t2 = setTimeout(() => {
        numEl.style.transition = 'opacity 0.15s ease, transform 0.5s cubic-bezier(0.34,1.8,0.64,1)';
        numEl.style.opacity = '1';
        numEl.style.transform = 'scale(1)';
      }, 480);

      // Swap to pose 2
      const t3 = setTimeout(() => {
        if (p1) p1.style.display = 'none';
        if (p2) p2.style.display = 'block';
      }, 880);

      // Wiggle pose 2
      const t4 = setTimeout(() => {
        if (p2) {
          p2.style.transition = 'transform 0.12s ease';
          p2.style.transform = 'rotate(-6deg) scale(1.05)';
          setTimeout(() => { p2.style.transform = 'rotate(5deg) scale(1.08)'; }, 120);
          setTimeout(() => { p2.style.transform = 'rotate(-3deg) scale(1.04)'; }, 240);
          setTimeout(() => { p2.style.transform = 'rotate(0deg) scale(1)'; }, 360);
        }
      }, 960);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    });

    return () => cancelAnimationFrame(raf);
  }, [showStreakCelebration, celebrationStreakNum]);

  const [btnEnabled, setBtnEnabled] = useState(false);
  useEffect(() => {
    if (!showChallengesCelebration) { setBtnEnabled(false); return; }
    const t = setTimeout(() => setBtnEnabled(true), 2000);
    return () => clearTimeout(t);
  }, [showChallengesCelebration]);

  return (
    <>
      {/* STAGE 1 — Streak animation */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div id="streak-anim-stage" style={{ position: 'relative', width: 180, height: 180, opacity: 0, willChange: 'transform, opacity' }}>
                <img id="streak-anim-p1" src={POSE_1_URL} alt="streak pose 1" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                <img id="streak-anim-p2" src={POSE_2_URL} alt="streak pose 2" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'none' }} />
              </div>
              <div id="streak-anim-num" style={{ fontSize: 96, fontWeight: 900, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.8)', letterSpacing: '-0.04em', lineHeight: 1, opacity: 0, transform: 'scale(0.5)' }}>
                {celebrationStreakNum - 1}
              </div>
              <div id="streak-anim-lbl" style={{ display: 'none' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 2 — Challenges */}
      <AnimatePresence>
        {showChallengesCelebration && celebrationChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-4">

            <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center', width: '100%', maxWidth: '24rem' }} className="space-y-3 mb-4">
              {celebrationChallenges.map((challenge, idx) => {
                const prevPct = Math.min(100, Math.round((challenge.previous_value / challenge.target_value) * 100));
                const newPct = Math.min(100, Math.round((challenge.new_value / challenge.target_value) * 100));
                const isComplete = newPct >= 100;
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + idx * 0.1, duration: 0.3 }}
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    }}>
                    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)' }} />

                    <div className="relative p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                          <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
                            alt="Challenge"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-white leading-tight truncate">{challenge.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{challenge.description}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-400">{challenge.new_value} / {challenge.target_value}</span>
                          <span className="text-[11px] font-bold" style={{ color: isComplete ? '#34d399' : '#64748b' }}>
                            {isComplete ? '✓ Complete' : `${newPct}%`}
                          </span>
                        </div>
                        <div className="h-4 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <motion.div
                            initial={{ width: `${prevPct}%` }}
                            animate={{ width: `${newPct}%` }}
                            transition={{ delay: 0.4 + idx * 0.1, duration: 1.2, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: isComplete ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #38bdf8, #60a5fa)' }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ fontSize: 20 }}>{challenge.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Reward</p>
                          <p className="text-[13px] font-black text-white truncate">{challenge.reward}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button
              onClick={btnEnabled ? onChallengesContinue : undefined}
              disabled={!btnEnabled}
              className="w-full max-w-sm"
              style={{
                padding: '14px 0', borderRadius: 16,
                background: btnEnabled ? 'linear-gradient(to bottom, #60a5fa, #3b82f6, #1d4ed8)' : 'rgba(59,130,246,0.25)',
                border: 'none',
                borderBottom: btnEnabled ? '4px solid #1a3fa8' : '4px solid rgba(26,63,168,0.4)',
                boxShadow: btnEnabled ? '0 4px 0 0 #1e40af, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                color: '#fff', fontSize: 16, fontWeight: 900,
                cursor: btnEnabled ? 'pointer' : 'not-allowed',
                opacity: btnEnabled ? 1 : 0.45,
                transition: 'opacity 0.4s ease, background 0.3s ease, box-shadow 0.3s ease, border-bottom 0.3s ease',
                letterSpacing: '-0.01em',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 3 — Share Workout */}
      <AnimatePresence>
        {showShareWorkout && (
          <ShareWorkoutScreen
            workoutName={celebrationWorkoutName}
            exercises={celebrationExercises}
            previousExercises={celebrationPreviousExercises}
            durationMinutes={celebrationDurationMinutes}
            currentUser={currentUser}
            onContinue={() => {
              setShowShareWorkout(false);
              setTimeout(() => setShowDaysCelebration(true), 200);
            }} />
        )}
      </AnimatePresence>

      {/* STAGE 4 — Day circles celebration */}
      <AnimatePresence>
        {showDaysCelebration && (
          <WorkoutDaysCelebration
            currentUser={currentUser}
            weeklyWorkoutLogs={weeklyWorkoutLogs}
            todayDow={todayDowAdjusted}
            onDismiss={() => {
              setShowDaysCelebration(false);
              setTimeout(() => setJustLoggedDay(null), 400);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default React.memo(StreakCelebration);