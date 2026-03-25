import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService } from '@/services/messages.service';
import { usePageVisibility } from './usePageVisibility';

export function useMessages(userId) {
  const isVisible = usePageVisibility();

  return useQuery({
    queryKey: ['messages', userId],
    queryFn: () => messagesService.getThread(userId),
    enabled: !!userId,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isVisible ? 15000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useSendMessage(currentUserId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageData) => messagesService.send(messageData),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['messages', currentUserId] });
      const previous = queryClient.getQueryData(['messages', currentUserId]);
      queryClient.setQueryData(['messages', currentUserId], (old = []) => [
        { ...newMsg, id: `optimistic-${Date.now()}`, created_date: new Date().toISOString(), read: false },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', currentUserId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentUserId] });
    },
  });
}
