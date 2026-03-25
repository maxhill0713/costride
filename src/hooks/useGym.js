import { useQuery } from '@tanstack/react-query';
import { gymService } from '@/services/gym.service';

export function useGym(gymId) {
  return useQuery({
    queryKey: ['gym', gymId],
    queryFn: () => gymService.getById(gymId),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: prev => prev,
  });
}

export function useGymMemberships(userId) {
  return useQuery({
    queryKey: ['gymMemberships', userId],
    queryFn: () => gymService.getMembershipsForUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: prev => prev,
  });
}

export function useOwnerGyms(email, isCoach = false) {
  return useQuery({
    queryKey: ['ownerGyms', email],
    queryFn: () => isCoach ? gymService.getForCoach(email) : gymService.getForOwner(email),
    enabled: !!email,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    retry: 3,
  });
}
