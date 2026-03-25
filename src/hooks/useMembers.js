import { useQuery } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';

export function useDashboardStats({ gymId, atRiskDays = 14, chartRange = 30 }) {
  return useQuery({
    queryKey: ['dashboardStats', gymId, atRiskDays, chartRange],
    queryFn: () => membersService.getForDashboard({ gymId, atRiskDays, chartRange }),
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: prev => prev,
  });
}

export function useMembersPage({ gymId, filter = 'all', sort = 'recentlyActive', search = '', page = 1, pageSize = 25 }) {
  return useQuery({
    queryKey: ['members', gymId, filter, sort, search, page, pageSize],
    queryFn: () => membersService.getPage({ gymId, filter, sort, search, page, pageSize }),
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: prev => prev,
    keepPreviousData: true,
  });
}
