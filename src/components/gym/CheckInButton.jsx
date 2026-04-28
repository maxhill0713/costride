import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckInButton({ gym, onCheckInSuccess }) {
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: gymMembership } = useQuery({
    queryKey: ['gymMembership', currentUser?.id, gym?.id],
    queryFn: () => base44.entities.GymMembership.filter({
      user_id: currentUser.id,
      gym_id: gym.id,
      status: 'active'
    }).then((r) => r[0] || null),
    enabled: !!currentUser && !!gym,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const isClaimedGym = gym?.claim_status === 'claimed';

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id, gym?.id],
    queryFn: () => base44.entities.CheckIn.filter({
      user_id: currentUser.id,
      gym_id: gym.id
    }, '-check_in_date', 200),
    enabled: !!currentUser && !!gym,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('performCheckIn', { gymId: data.gym_id }),
    onSuccess: () => {
      confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 }, colors: ['#10b981', '#06b6d4', '#3b82f6'] });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 } }), 150);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 } }), 300);
      toast.success('✅ Checked in successfully!');
      if (onCheckInSuccess) onCheckInSuccess();
      queryClient.invalidateQueries({ queryKey: ['checkIns', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.error || error?.message || 'Check-in failed';
      toast.error('Check-in failed', { description: msg });
    }
  });

  const hasCheckedInToday = () => {
    if (!checkIns.length) return false;
    const today = startOfDay(new Date());
    const checkInDate = startOfDay(parseISO(checkIns[0].check_in_date));
    return differenceInDays(today, checkInDate) === 0;
  };

  const handleCheckIn = async () => {
    if (!currentUser || !gym) return;
    if (isClaimedGym && !gymMembership) {
      toast.error('Membership required', { description: 'Join this gym with a join code to check in.' });
      return;
    }
    setIsChecking(true);
    try {
      await checkInMutation.mutateAsync({ gym_id: gym.id });
      setShowSuccess(true);
      // Play success sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      // Hide success button and reset after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowSuccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (!gym) return null;

  return (
    <div className="space-y-3">
      {isClaimedGym && !gymMembership &&
        <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-4 text-center mb-3">
          <p className="text-purple-200 font-semibold mb-2">Membership required</p>
          <p className="text-sm text-purple-300">Ask the gym for a join code to start checking in</p>
        </div>
      }

      {isClaimedGym && !gymMembership ?
        <Button disabled className="w-full h-14 rounded-2xl font-bold text-base bg-gray-400 cursor-not-allowed">
          <MapPin className="w-5 h-5 mr-2" />
          Membership Required
        </Button> :
        !hasCheckedInToday() &&
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}>
              <Button
                disabled
                className="w-full h-14 rounded-2xl font-bold text-base bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white border border-transparent backdrop-blur-md shadow-[0_5px_0_0_#047857,0_8px_20px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)]">
                <Check className="w-5 h-5 mr-2" />
                Checked In
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ y: 0, opacity: 1 }}
              whileTap={!isChecking ? { scale: 0.95 } : {}}
              animate={isChecking ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3, repeat: isChecking ? Infinity : 0 }}>
              <Button
                onClick={handleCheckIn}
                disabled={isChecking || checkInMutation.isPending}
                className="w-full h-14 rounded-2xl font-bold text-base bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white border border-transparent backdrop-blur-md shadow-[0_5px_0_0_#065f46,0_8px_20px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[5px] active:scale-95 transition-all duration-100 transform-gpu">
                <CheckCircle className="w-5 h-5 mr-2" />
                {isChecking || checkInMutation.isPending ? 'Checking in...' : 'Check In'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      }
    </div>
  );
}