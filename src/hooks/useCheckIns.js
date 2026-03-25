import { useQuery } from '@tanstack/react-query';
import { checkInsService } from '@/services/checkins.service';

export function useUserCheckIns(userId, limit = 100) {
  return useQuery({
    queryKey: ['checkIns', userId],
    queryFn: () => checkInsService.getForUser(userId, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: prev => prev,
  });
}

export function useGymCheckIns(gymId, limit = 200) {
  return useQuery({
    queryKey: ['checkIns', gymId],
    queryFn: () => checkInsService.getForGym(gymId, limit),
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: prev => prev,
  });
}

export function useFriendCheckIns(friendIds, daysBack = 7) {
  const key = (friendIds || []).join(',');
  return useQuery({
    queryKey: ['checkIns', 'friendFeed', key],
    queryFn: () => checkInsService.getForFriends(friendIds, daysBack),
    enabled: Array.isArray(friendIds) && friendIds.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: prev => prev,
  });
}
