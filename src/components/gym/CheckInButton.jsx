import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Flame, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckInButton({ gym }) {
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id, gym?.id],
    queryFn: () => base44.entities.CheckIn.filter({ 
      user_id: currentUser.id,
      gym_id: gym.id 
    }, '-check_in_date'),
    enabled: !!currentUser && !!gym
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['allCheckIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date'),
    enabled: !!currentUser
  });

  const checkInMutation = useMutation({
    mutationFn: async (data) => {
      const newCheckIn = await base44.entities.CheckIn.create(data);
      return newCheckIn;
    },
    onSuccess: async (newCheckIn) => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Epic confetti for every check-in
      confetti({ 
        particleCount: 150, 
        spread: 120, 
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#3b82f6']
      });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 } }), 150);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 } }), 300);
      
      queryClient.invalidateQueries({ queryKey: ['checkIns'] });
      queryClient.invalidateQueries({ queryKey: ['allCheckIns'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Check for milestones
      const totalVisits = checkIns.length + 1;
      const streak = calculateStreak([newCheckIn, ...checkIns], currentUser);
      const gymAnniversary = checkGymAnniversary(checkIns, newCheckIn);

      // Auto-update streak goals
      try {
        const userGoals = await base44.entities.Goal.filter({ 
          user_id: currentUser.id,
          status: 'active',
          goal_type: 'consistency'
        });
        
        for (const goal of userGoals) {
          if (streak > goal.current_value) {
            await base44.entities.Goal.update(goal.id, {
              current_value: streak
            });
          }
        }
      } catch (error) {
        console.error('Error updating streak goals:', error);
      }

      // Show streak in toast
      if (streak > 1) {
        toast.success(`✅ Checked in! You're on a ${streak}-day streak 🔥`, {
          description: 'Keep it going! One day at a time.',
          duration: 4000
        });
      }

      if (totalVisits === 1) {
        // Epic confetti celebration
        confetti({ 
          particleCount: 200, 
          spread: 160, 
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6']
        });
        setTimeout(() => confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } }), 200);
        setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } }), 400);
        toast.success('🎉 First check-in at ' + gym.name + '!', {
          description: 'Welcome to the community!'
        });
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: '🎉 First Check-in!',
          message: `Welcome to ${gym.name}! This is the start of an amazing journey.`,
          icon: '🎉'
        });
      } else if (totalVisits === 10) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        toast.success('🔥 10 visits milestone!', {
          description: 'You\'re building consistency!'
        });
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: '👏 You completed 10 check-ins!',
          message: 'You\'re building great consistency. Keep up the amazing work!',
          icon: '🎯'
        });
        await base44.entities.Achievement.create({
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          gym_id: gym.id,
          achievement_type: '100_lifts',
          title: '10 Visit Streak',
          description: `Checked in 10 times at ${gym.name}`,
          icon: '🔥',
          points: 50
        });
      } else if (totalVisits === 30) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        toast.success('🏆 30 visits! You\'re a Gym Regular!', {
          description: 'You\'ve built a solid habit!'
        });
        await base44.entities.Achievement.create({
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          gym_id: gym.id,
          achievement_type: 'community_leader',
          title: 'Gym Regular',
          description: `Reached 30 check-ins at ${gym.name}`,
          icon: '🏆',
          points: 75
        });
      } else if (totalVisits === 50) {
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        toast.success('💪 50 visits! You\'re a regular!', {
          description: 'Dedication level: Elite'
        });
      }

      if (streak === 7) {
        toast.success('🔥 7 day streak!', {
          description: 'Keep the momentum going!'
        });
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'streak',
          title: '🎉 Congrats! You hit a 7-day streak!',
          message: 'You\'re on fire! Keep the momentum going and watch your progress soar.',
          icon: '🔥'
        });
      } else if (streak === 30) {
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        toast.success('⚡ 30 DAY STREAK!', {
          description: 'You\'re unstoppable!'
        });
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'streak',
          title: '🎉 Congrats! You hit a 30-day streak!',
          message: 'Incredible dedication! You\'ve trained for 30 consecutive days. You\'re unstoppable!',
          icon: '⚡'
        });
        await base44.entities.Achievement.create({
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          gym_id: gym.id,
          achievement_type: 'streak_30',
          title: '30 Day Streak',
          description: 'Trained for 30 consecutive days',
          icon: '⚡',
          points: 100
        });
      }

      if (gymAnniversary) {
        confetti({ particleCount: 300, spread: 160, origin: { y: 0.6 } });
        toast.success(`🎉 ${gymAnniversary} year${gymAnniversary > 1 ? 's' : ''} at ${gym.name}!`, {
          description: 'What an incredible journey!'
        });
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: `🎉 ${gymAnniversary} Year Anniversary!`,
          message: `${gymAnniversary} year${gymAnniversary > 1 ? 's' : ''} at ${gym.name}! What an incredible journey!`,
          icon: '🎊'
        });
      }

      toast.success('✅ Checked in successfully!');
    }
  });

  const calculateStreak = (checkIns, user) => {
    if (checkIns.length === 0) return 0;
    
    let streak = 1;
    let freezesUsed = 0;
    const today = startOfDay(new Date());
    
    for (let i = 0; i < checkIns.length - 1; i++) {
      const current = startOfDay(parseISO(checkIns[i].check_in_date));
      const next = startOfDay(parseISO(checkIns[i + 1].check_in_date));
      const daysDiff = differenceInDays(current, next);
      
      // Allow 1 day grace period (1 or 2 days apart still counts as consecutive)
      if (daysDiff === 1 || daysDiff === 2) {
        streak++;
      } else if (daysDiff === 3 && user?.streak_freezes_available > 0 && freezesUsed === 0) {
        // Use a streak freeze for a 2-day gap (3 days apart)
        streak++;
        freezesUsed++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const checkGymAnniversary = (checkIns, newCheckIn) => {
    if (checkIns.length === 0) return null;
    
    const firstVisit = checkIns[checkIns.length - 1];
    const firstVisitDate = parseISO(firstVisit.check_in_date);
    const today = new Date();
    
    const yearsDiff = today.getFullYear() - firstVisitDate.getFullYear();
    const isAnniversaryMonth = today.getMonth() === firstVisitDate.getMonth();
    const isAnniversaryDay = today.getDate() === firstVisitDate.getDate();
    
    if (yearsDiff > 0 && isAnniversaryMonth && isAnniversaryDay) {
      return yearsDiff;
    }
    
    return null;
  };

  const hasCheckedInToday = () => {
    if (!checkIns.length) return false;
    const today = startOfDay(new Date());
    const lastCheckIn = startOfDay(parseISO(checkIns[0].check_in_date));
    return differenceInDays(today, lastCheckIn) === 0;
  };

  const getLastCheckInDays = () => {
    if (!checkIns.length) return null;
    const lastCheckIn = parseISO(checkIns[0].check_in_date);
    return differenceInDays(new Date(), lastCheckIn);
  };

  const daysSinceLastCheckIn = getLastCheckInDays();
  const currentStreak = calculateStreak(checkIns, currentUser);
  const isInactive = daysSinceLastCheckIn >= 7;

  const handleCheckIn = async () => {
    if (!currentUser || !gym) return;
    
    setIsChecking(true);
    try {
      await checkInMutation.mutateAsync({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        gym_id: gym.id,
        gym_name: gym.name,
        check_in_date: new Date().toISOString(),
        first_visit: checkIns.length === 0
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, y: 50 }}
              animate={{ 
                scale: [0, 1.2, 1],
                y: [50, 0, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 0.5 }}
                >
                  <CheckCircle className="w-24 h-24 text-white" strokeWidth={3} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-white text-2xl font-black">Checked In!</p>
                  {currentStreak > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      className="flex items-center justify-center gap-2 mt-2 bg-white/20 rounded-full px-4 py-1"
                    >
                      <Flame className="w-5 h-5 text-orange-300" />
                      <span className="text-white text-lg font-bold">{currentStreak + 1} Day Streak</span>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak at Risk / Freeze Option */}
      {daysSinceLastCheckIn !== null && daysSinceLastCheckIn >= 2 && currentUser?.streak_freezes_available > 0 && currentStreak > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-xl">❄️</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-cyan-900">Your streak is at risk!</p>
              <p className="text-sm text-cyan-700 mb-3">
                Use a streak freeze to protect your {currentStreak}-day streak?
              </p>
              <Button 
                onClick={async () => {
                  await base44.auth.updateMe({ 
                    streak_freezes_available: (currentUser.streak_freezes_available || 0) - 1 
                  });
                  queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                  toast.success('❄️ Streak freeze applied! Your streak is protected.');
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-2xl text-sm h-9"
              >
                Apply Freeze ({currentUser.streak_freezes_available} available)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inactivity Warning */}
      {isInactive && daysSinceLastCheckIn !== null && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-orange-900">We miss you!</p>
              <p className="text-sm text-orange-700">
                It's been {daysSinceLastCheckIn} days since your last visit. Come back and continue your journey! 💪
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Stats */}
      {checkIns.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900 uppercase">Total Visits</span>
              </div>
              <div className="text-2xl font-black text-blue-900">{checkIns.length}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-orange-900 uppercase">Streak</span>
              </div>
              <div className="text-2xl font-black text-orange-900">{currentStreak} days</div>
            </div>
          </div>
          

        </div>
      )}

      {/* Check-in Button */}
      <motion.div
        whileTap={!hasCheckedInToday() && !isChecking ? { scale: 0.95 } : {}}
        animate={isChecking ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3, repeat: isChecking ? Infinity : 0 }}
      >
        <Button
          onClick={handleCheckIn}
          disabled={hasCheckedInToday() || isChecking}
          className={`w-full h-14 rounded-2xl font-bold text-base shadow-lg transition-all ${
            hasCheckedInToday()
              ? 'bg-green-500 hover:bg-green-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
          }`}
        >
        {hasCheckedInToday() ? (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Checked In Today ✓
          </>
        ) : isChecking ? (
          'Checking in...'
        ) : (
          <>
            <MapPin className="w-5 h-5 mr-2" />
            Check In Now
          </>
        )}
        </Button>
      </motion.div>

      {hasCheckedInToday() && (
        <p className="text-center text-sm text-gray-500">
          See you tomorrow! Keep the streak alive 🔥
        </p>
      )}
    </div>
  );
}