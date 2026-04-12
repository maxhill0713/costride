import React, { useEffect } from 'react';
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
  gymId,
  showDaysCelebration,
  weeklyWorkoutLogs,
  todayDowAdjusted,
  setShowShareWorkout,
  setShowDaysCelebration,
  setJustLoggedDay,
}) {

  // Drive the streak animation imperatively on the injected DOM nodes
  useEffect(() => {
    if (!showStreakCelebration) return;

    const stage  = document.getElementById('streak-anim-stage');
    const p1     = document.getElementById('streak-anim-p1');
    const p2     = document.getElementById('streak-anim-p2');
    const numEl  = document.getElementById('streak-anim-num');
    const lblEl  = document.getElementById('streak-anim-lbl');
    if (!stage || !p1 || !p2 || !numEl || !lblEl) return;

    // Reset
    stage.style.opacity = '0';
    stage.style.animation = 'none';
    numEl.style.opacity = '0';
    numEl.style.transform = 'scale(0.5)';
    numEl.style.transition = '';
    numEl.textContent = String(Math.max(0, celebrationStreakNum - 1));
    p1.style.display = 'block';
    p2.style.display = 'none';
    p2.style.animation = 'none';
    lblEl.style.display = 'none';
    lblEl.style.opacity = '0';
    lblEl.style.animation = 'none';
    lblEl.textContent = 'Day Streak! 🔥';
    lblEl.style.fontSize = '22px';
    lblEl.style.fontWeight = '900';
    lblEl.style.color = '#fff';
    lblEl.style.textShadow = '0 2px 8px rgba(0,0,0,0.7)';
    lblEl.style.letterSpacing = '-0.02em';
    lblEl.style.marginTop = '4px';

    const timers = [];

    // t=0 — stage bounces in
    void stage.offsetWidth;
    stage.style.animation = 'streakBounceIn 0.62s cubic-bezier(0.34,1.56,0.64,1) forwards';
    stage.style.opacity = '1';

    // t=500ms — number pops in (old streak)
    timers.push(setTimeout(() => {
      void numEl.offsetWidth;
      numEl.style.animation = 'streakNumPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards';
    }, 500));

    // t=1000ms — swap pose, glow, update number to new streak
    timers.push(setTimeout(() => {
      // Swap pose
      p1.style.display = 'none';
      p2.style.display = 'block';
      void p2.offsetWidth;
      p2.style.animation = 'streakIconPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards';
      // Glow pulse on stage
      stage.style.animation = 'streakGlowPulse 1s ease-in-out infinite';
      // Update number
      numEl.textContent = String(celebrationStreakNum);
      void numEl.offsetWidth;
      numEl.style.animation = 'streakNumPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards';
    }, 1000));

    // label stays hidden

    return () => timers.forEach(clearTimeout);
  }, [showStreakCelebration]);

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
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.88)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '0 16px',
            }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em' }}>Challenge Progress</span>
            </div>

            <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {celebrationChallenges.map((challenge, idx) => {
                const prevPct = Math.min(100, Math.round((challenge.previous_value / challenge.target_value) * 100));
                const newPct = Math.min(100, Math.round((challenge.new_value / challenge.target_value) * 100));
                const isComplete = newPct >= 100;
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 + idx * 0.12, type: 'spring', damping: 28, stiffness: 280 }}
                    style={{
                      borderRadius: 20, overflow: 'hidden', position: 'relative',
                      background: 'rgba(10,10,18,0.98)',
                      border: isComplete ? '1px solid rgba(52,211,153,0.45)' : '1px solid rgba(255,255,255,0.09)',
                      boxShadow: isComplete ? '0 0 0 1px rgba(52,211,153,0.15), 0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.5)',
                    }}>

                    {/* top shimmer line */}
                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.09) 50%, transparent 90%)' }} />
                    {/* accent bar */}
                    <div style={{ height: 3, background: isComplete ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />

                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {challenge.image_url
                            ? <img src={challenge.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 22 }}>🏋️</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: 'white', fontSize: 15, fontWeight: 900, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{challenge.title}</p>
                          {challenge.description && <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{challenge.description}</p>}
                        </div>
                        {isComplete && (
                          <div style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 99, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', fontSize: 11, fontWeight: 800, color: '#34d399' }}>✓ Done</div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.6)' }}>{challenge.new_value} / {challenge.target_value}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: isComplete ? '#34d399' : 'rgba(148,163,184,0.5)' }}>{newPct}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: `${prevPct}%` }}
                            animate={{ width: `${newPct}%` }}
                            transition={{ delay: 0.5 + idx * 0.1, duration: 1.2, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 99, background: isComplete ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#3b82f6,#6366f1)' }}
                          />
                        </div>
                      </div>

                      {/* Reward row */}
                      {challenge.reward && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 12,
                          background: 'rgba(251,191,36,0.07)',
                          border: '1px solid rgba(251,191,36,0.2)',
                        }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{challenge.emoji || '🎁'}</span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ color: 'rgba(251,191,36,0.6)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>Reward</p>
                            <p style={{ color: 'white', fontSize: 13, fontWeight: 900, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{challenge.reward}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

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
            gymId={gymId}
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