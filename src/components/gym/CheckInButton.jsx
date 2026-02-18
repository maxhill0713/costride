import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Flame, Calendar, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CheckInButton({ gym, onCheckInSuccess }) {
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const [locationErrorDistance, setLocationErrorDistance] = useState(0);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: () => base44.entities.Subscription.filter({ 
      user_id: currentUser.id,
      status: 'active'
    }),
    enabled: !!currentUser,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const isPremium = subscription && subscription.length > 0;

  const { data: gymMembership } = useQuery({
    queryKey: ['gymMembership', currentUser?.id, gym?.id],
    queryFn: () => base44.entities.GymMembership.filter({
      user_id: currentUser.id,
      gym_id: gym.id,
      status: 'active'
    }).then(r => r[0] || null),
    enabled: !!currentUser && !!gym,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id, gym?.id],
    queryFn: () => base44.entities.CheckIn.filter({ 
      user_id: currentUser.id,
      gym_id: gym.id 
    }, '-check_in_date', 200),
    enabled: !!currentUser && !!gym,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('performCheckIn', { gymId: data.gym_id }),
    onMutate: async (newCheckIn) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['checkIns'] });
      await queryClient.cancelQueries({ queryKey: ['allCheckIns'] });
      
      // Snapshot previous values
      const previousCheckIns = queryClient.getQueryData(['checkIns', currentUser?.id, gym?.id]);
      const previousAllCheckIns = queryClient.getQueryData(['allCheckIns', currentUser?.id]);
      
      // Optimistically update check-ins
      queryClient.setQueryData(['checkIns', currentUser?.id, gym?.id], (old = []) => [newCheckIn, ...old]);
      queryClient.setQueryData(['allCheckIns', currentUser?.id], (old = []) => [newCheckIn, ...old]);
      
      return { previousCheckIns, previousAllCheckIns };
    },
    onError: (err, newCheckIn, context) => {
      // Rollback on error
      queryClient.setQueryData(['checkIns', currentUser?.id, gym?.id], context.previousCheckIns);
      queryClient.setQueryData(['allCheckIns', currentUser?.id], context.previousAllCheckIns);
    },
    onSuccess: async (newCheckIn) => {
       setShowSuccess(true);
       setTimeout(() => setShowSuccess(false), 3000);

       // Trigger workout start timer
       if (onCheckInSuccess) {
         onCheckInSuccess();
       }

       // Check if today is a rest day
       const today = new Date();
       const dayOfWeek = today.getDay();
       const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
       const trainingDays = currentUser?.training_days || [];
       const isRestDay = !trainingDays.includes(adjustedDay);

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

      // Notify friends
      try {
        const friends = await base44.entities.Friend.filter({ 
          friend_id: currentUser.id, 
          status: 'accepted' 
        });
        
        for (const friend of friends) {
          await base44.entities.Notification.create({
            user_id: friend.user_id,
            type: 'friend_activity',
            title: `${currentUser.full_name?.split(' ')[0]} checked in! 💪`,
            message: `Your friend just checked in at ${gym.name}. It's your turn!`,
            icon: '💪',
            action_url: '/Friends'
          });
        }
      } catch (error) {
        console.error('Error notifying friends:', error);
      }
      
      // Check for milestones
      const totalVisits = checkIns.length + 1;
      const streak = calculateStreak([newCheckIn, ...checkIns], currentUser);
      const gymAnniversary = checkGymAnniversary(checkIns, newCheckIn);

      // Auto-update streak and frequency goals
      try {
        const userGoals = await base44.entities.Goal.filter({ 
          user_id: currentUser.id,
          status: 'active'
        });
        
        for (const goal of userGoals) {
          // Update consistency goals (check-ins within period)
          if (goal.goal_type === 'consistency') {
            const now = new Date();
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            let relevantCheckIns = [];
            if (goal.frequency_period === 'daily') {
              relevantCheckIns = allCheckIns.filter(c => new Date(c.check_in_date) >= dayAgo);
            } else if (goal.frequency_period === 'weekly') {
              relevantCheckIns = allCheckIns.filter(c => new Date(c.check_in_date) >= weekAgo);
            } else if (goal.frequency_period === 'monthly') {
              relevantCheckIns = allCheckIns.filter(c => new Date(c.check_in_date) >= monthAgo);
            }
            
            const currentProgress = relevantCheckIns.length + 1; // +1 for today's check-in
            await base44.entities.Goal.update(goal.id, {
              current_value: currentProgress
            });
            
            // Check if goal completed
            if (currentProgress >= goal.target_value && goal.status === 'active') {
              await base44.entities.Goal.update(goal.id, { status: 'completed' });
              toast.success(`🎉 Goal completed: ${goal.title}!`);
            }
          }
          
          // Update frequency goals (workouts per week/month)
          if (goal.goal_type === 'frequency') {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            let relevantCheckIns = [];
            if (goal.frequency_period === 'weekly') {
              relevantCheckIns = allCheckIns.filter(c => new Date(c.check_in_date) >= weekAgo);
            } else if (goal.frequency_period === 'monthly') {
              relevantCheckIns = allCheckIns.filter(c => new Date(c.check_in_date) >= monthAgo);
            }
            
            const currentProgress = relevantCheckIns.length + 1; // +1 for today's check-in
            await base44.entities.Goal.update(goal.id, {
              current_value: currentProgress
            });
            
            // Check if goal completed
            if (currentProgress >= goal.target_value && goal.status === 'active') {
              await base44.entities.Goal.update(goal.id, { status: 'completed' });
              toast.success(`🎉 Goal completed: ${goal.title}!`);
            }
          }
        }
      } catch (error) {
        console.error('Error updating goals:', error);
      }

      // Show streak in toast with premium bonus
      if (isRestDay) {
        toast.success('💚 Great news! Your streak is paused, not broken.', {
          description: 'Enjoy your rest day—recovery is progress!',
          duration: 4000
        });
        // Create rest day notification
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'rest_day',
          title: '💚 Enjoying Your Rest Day',
          message: 'Good news! Your streak is on pause today, not broken. Rest is part of your progress. See you tomorrow!',
          icon: '🌿'
        });
      } else if (streak > 1) {
        toast.success(`✅ Checked in! You're on a ${streak}-day streak 🔥`, {
          description: isPremium ? '+20 points (Premium 2x Bonus) 🌟' : '+10 points',
          duration: 4000
        });
      } else if (isPremium) {
        toast.success('✅ Checked in!', {
          description: '+20 points (Premium 2x Bonus) 🌟',
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

        // Notify friends
        try {
          const friends = await base44.entities.Friend.filter({ 
            friend_id: currentUser.id, 
            status: 'accepted' 
          });
          
          for (const friend of friends) {
            await base44.entities.Notification.create({
              user_id: friend.user_id,
              type: 'friend_activity',
              title: `🔥 ${currentUser.full_name?.split(' ')[0]} hit 10 total visits!`,
              message: `${currentUser.full_name?.split(' ')[0]} is building serious consistency!`,
              icon: '🎯',
              action_url: '/Friends'
            });
          }
        } catch (error) {
          console.error('Error notifying friends:', error);
        }
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

        // Notify friends
        try {
          const friends = await base44.entities.Friend.filter({ 
            friend_id: currentUser.id, 
            status: 'accepted' 
          });
          
          for (const friend of friends) {
            await base44.entities.Notification.create({
              user_id: friend.user_id,
              type: 'friend_activity',
              title: `🔥 ${currentUser.full_name?.split(' ')[0]} hit a 7-day streak!`,
              message: `${currentUser.full_name?.split(' ')[0]} has been on fire with 7 consecutive days!`,
              icon: '🔥',
              action_url: '/Friends'
            });
          }
        } catch (error) {
          console.error('Error notifying friends:', error);
        }
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
    const trainingDays = user?.training_days || [];

    for (let i = 0; i < checkIns.length - 1; i++) {
      const current = startOfDay(parseISO(checkIns[i].check_in_date));
      const next = startOfDay(parseISO(checkIns[i + 1].check_in_date));
      const daysDiff = differenceInDays(current, next);

      // Count only training days for streak
      let skippedRestDays = 0;
      for (let j = 1; j < daysDiff; j++) {
        const dayToCheck = new Date(current);
        dayToCheck.setDate(dayToCheck.getDate() - j);
        const dayOfWeek = dayToCheck.getDay();
        const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

        // If it's a rest day, don't count it
        if (!trainingDays.includes(adjustedDay)) {
          skippedRestDays++;
        }
      }

      const trainingDaysDiff = daysDiff - skippedRestDays;

      // If consecutive training days (1 or 2 apart after accounting for rest days)
      if (trainingDaysDiff === 1 || trainingDaysDiff === 2) {
        streak++;
      } else if (trainingDaysDiff === 3 && user?.streak_freezes_available > 0 && freezesUsed === 0) {
        // Use a streak freeze for a 2-day gap
        streak++;
        freezesUsed++;
      } else if (trainingDaysDiff > 2) {
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
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCheckInDate = new Date(checkIns[0].check_in_date);
    const lastCheckInMidnight = new Date(lastCheckInDate.getFullYear(), lastCheckInDate.getMonth(), lastCheckInDate.getDate());
    return todayMidnight.getTime() === lastCheckInMidnight.getTime();
  };

  const getLastCheckInDays = () => {
    if (!checkIns.length) return null;
    const lastCheckIn = parseISO(checkIns[0].check_in_date);
    return differenceInDays(new Date(), lastCheckIn);
  };

  const daysSinceLastCheckIn = getLastCheckInDays();
  const currentStreak = calculateStreak(checkIns, currentUser);
  const isInactive = daysSinceLastCheckIn >= 7;

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const isClaimedGym = gym && (gym.owner_email || gym.admin_id);

  const handleCheckIn = async () => {
    if (!currentUser || !gym) return;
    
    // Claimed gyms require membership
    if (isClaimedGym && !gymMembership) {
      toast.error('Membership required', {
        description: 'Join this gym with a join code to check in.'
      });
      return;
    }
    
    setIsChecking(true);
    try {
      // Get user's location with permission dialog
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      // Get gym coordinates from postcode using geocoding API
      const gymPostcode = gym.postcode;
      if (!gymPostcode) {
        toast.error('Gym location not set', {
          description: 'Please contact the gym owner to set their location.'
        });
        setIsChecking(false);
        return;
      }

      // Use free geocoding API to convert postcode to coordinates
      const geocodeResponse = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(gymPostcode)}`
      );
      
      if (!geocodeResponse.ok) {
        toast.error('Could not verify gym location', {
          description: 'Please try again or contact support.'
        });
        setIsChecking(false);
        return;
      }

      const geocodeData = await geocodeResponse.json();
      const gymLat = geocodeData.result.latitude;
      const gymLon = geocodeData.result.longitude;

      // Calculate distance
      const distance = getDistance(userLat, userLon, gymLat, gymLon);
      const maxDistance = 0.5; // 500 meters = 0.5 km

      if (distance > maxDistance) {
        setLocationErrorDistance(distance);
        setShowLocationError(true);
        setIsChecking(false);
        return;
      }

      await checkInMutation.mutateAsync({ gym_id: gym.id });
    } catch (error) {
      if (error.code === error.PERMISSION_DENIED) {
        toast.error('Location access denied', {
          description: 'We use your location to confirm you are at the gym when checking in. Please enable location access.'
        });
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        toast.error('Location unavailable', {
          description: 'Could not determine your location. Please try again.'
        });
      } else if (error.code === error.TIMEOUT) {
        toast.error('Location timeout', {
          description: 'Location request timed out. Please try again.'
        });
      } else {
        console.error('Check-in error:', error);
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Location Error Dialog */}
      <AlertDialog open={showLocationError} onOpenChange={setShowLocationError}>
        <AlertDialogContent className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-4 mb-2">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-orange-900 text-center">
                Too Far From Gym
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-center space-y-3">
              <p className="text-orange-800 text-lg font-semibold">
                You must be within 500m of the gym to check in
              </p>
              <div className="bg-white/60 rounded-xl p-4 border-2 border-orange-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <span className="font-bold text-orange-900">Your Distance</span>
                </div>
                <p className="text-3xl font-black text-orange-900">
                  {(locationErrorDistance * 1000).toFixed(0)}m
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {((locationErrorDistance - 0.5) * 1000).toFixed(0)}m too far
                </p>
              </div>
              <p className="text-sm text-orange-700">
                Please move closer to {gym?.name} and try again
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button
            onClick={() => setShowLocationError(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold h-12"
          >
            Got It
          </Button>
        </AlertDialogContent>
      </AlertDialog>

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



      {/* Membership Required Message for Claimed Gyms */}
      {isClaimedGym && !gymMembership && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 text-center mb-3">
          <p className="text-purple-900 font-semibold mb-2">Membership required</p>
          <p className="text-sm text-purple-700">Ask the gym for a join code to start checking in</p>
        </div>
      )}

      {/* Check-in Button */}
      {isClaimedGym && !gymMembership ? (
        <Button disabled className="w-full h-14 rounded-2xl font-bold text-base bg-gray-400 cursor-not-allowed">
          <MapPin className="w-5 h-5 mr-2" />
          Membership Required
        </Button>
      ) : (
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
          )}

          {hasCheckedInToday() && (
        <p className="text-center text-sm text-gray-500">
          See you tomorrow! Keep the streak alive 🔥
        </p>
      )}
    </div>
  );
}