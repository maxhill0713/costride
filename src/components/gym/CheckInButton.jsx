import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';

const CHECKIN_RADIUS_METERS = 500;

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckInButton({ gym, onCheckInSuccess }) {
  const [isChecking, setIsChecking] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: () => base44.entities.Subscription.filter({ 
      user_id: currentUser.id,
      status: 'active'
    }),
    enabled: !!currentUser,
    staleTime: 10 * 60 * 1000,
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
  });

  const isClaimedGym = gym?.claim_status === 'claimed';

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id, gym?.id],
    queryFn: () => base44.entities.CheckIn.filter({ 
      user_id: currentUser.id,
      gym_id: gym.id 
    }, '-check_in_date', 200),
    enabled: !!currentUser && !!gym,
    staleTime: 1 * 60 * 1000,
  });

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('performCheckIn', { gymId: data.gym_id }),
    onSuccess: () => {
      // Show success immediately - don't block on background operations
      confetti({ 
        particleCount: 150, 
        spread: 120, 
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#3b82f6']
      });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 } }), 150);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 } }), 300);

      toast.success('✅ Checked in successfully!');

      // Trigger callback if provided
      if (onCheckInSuccess) {
        onCheckInSuccess();
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['checkIns', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.error || error?.message || 'Check-in failed';
      toast.error('Check-in failed', { description: msg });
      console.error('Check-in error:', error);
    }
  });

  const hasCheckedInToday = () => {
    if (!checkIns.length) return false;
    const today = startOfDay(new Date());
    const latestCheckIn = checkIns[0];
    const checkInDate = startOfDay(parseISO(latestCheckIn.check_in_date));
    return differenceInDays(today, checkInDate) === 0;
  };

  const handleCheckIn = async () => {
    if (!currentUser || !gym) return;
    
    if (isClaimedGym && !gymMembership) {
      toast.error('Membership required', {
        description: 'Join this gym with a join code to check in.'
      });
      return;
    }

    setIsChecking(true);
    try {
      // TODO: Re-enable location-based check-in validation when ready
      await checkInMutation.mutateAsync({ gym_id: gym.id });
    } finally {
      setIsChecking(false);
    }
  };

  if (!gym) return null;

  return (
    <div className="space-y-3">
      {isClaimedGym && !gymMembership && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 text-center mb-3">
          <p className="text-purple-900 font-semibold mb-2">Membership required</p>
          <p className="text-sm text-purple-700">Ask the gym for a join code to start checking in</p>
        </div>
      )}

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
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
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