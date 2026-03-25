import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, X } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Notifications() {
  const queryClient = useQueryClient();
  const nudgeCreatedRef = useRef(false);
  const milestonesCheckedRef = useRef(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date', 50),
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => 
        base44.entities.Notification.update(n.id, { read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Check for inactivity and create nudges — gated to fire once per session
  useEffect(() => {
    if (!currentUser || !currentUser.last_check_in || nudgeCreatedRef.current) return;

    const checkInactivity = async () => {
      const daysSinceCheckIn = differenceInDays(new Date(), parseISO(currentUser.last_check_in));

      if (daysSinceCheckIn >= 7) {
        const existingNudge = notifications.find(n =>
          n.type === 'inactivity' && !n.read && differenceInDays(new Date(), parseISO(n.created_date)) < 1
        );

        if (!existingNudge) {
          nudgeCreatedRef.current = true;
          await base44.entities.Notification.create({
            user_id: currentUser.id,
            type: 'inactivity',
            title: 'We miss you!',
            message: `You haven't checked in for ${daysSinceCheckIn} days. Time to get back to the gym!`,
            icon: 'sad',
            action_url: createPageUrl('Gyms')
          }).catch(() => { nudgeCreatedRef.current = false; });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      }
    };

    checkInactivity();
  }, [currentUser?.id, notifications.length, queryClient]);

  // Check milestones — gated to fire once per session
  useEffect(() => {
    if (!currentUser || milestonesCheckedRef.current) return;
    milestonesCheckedRef.current = true;

    const checkMilestones = async () => {
      const milestones = [];
      const achieved = currentUser.milestones_achieved || [];

      // 10 visits milestone
      if (currentUser.total_check_ins >= 10 && !achieved.includes('10_visits')) {
        milestones.push({
          id: '10_visits',
          title: '10 Visits! 🎯',
          message: 'You\'ve checked in 10 times. Keep it up!',
          icon: '🎯'
        });
      }

      // 30-day streak
      if (currentUser.current_streak >= 30 && !achieved.includes('30_day_streak')) {
        milestones.push({
          id: '30_day_streak',
          title: '30-Day Streak! 🔥',
          message: 'Incredible! You\'ve maintained a 30-day streak.',
          icon: '🔥'
        });
      }

      // Gym anniversary
      if (currentUser.gym_join_date) {
        const daysSinceJoined = differenceInDays(new Date(), parseISO(currentUser.gym_join_date));
        const years = Math.floor(daysSinceJoined / 365);
        
        if (years >= 1 && !achieved.includes(`anniversary_${years}`)) {
          const plural = years > 1 ? 'years' : 'year';
          milestones.push({
            id: `anniversary_${years}`,
            title: `${years} ${plural} at the gym! 🎉`,
            message: `You've been training at ${currentUser.gym_location || 'your gym'} for ${years} ${plural}. Amazing dedication!`,
            icon: '🎉'
          });
        }
      }

      // Create notifications for new milestones
      for (const milestone of milestones) {
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: milestone.title,
          message: milestone.message,
          icon: milestone.icon,
          metadata: { milestone_id: milestone.id }
        });

        // Update user's achieved milestones
        await base44.auth.updateMe({
          milestones_achieved: [...achieved, milestone.id]
        });
      }

      if (milestones.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'currentUser'] });
      }
    };

    checkMilestones();
  }, [currentUser?.id, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-blue-700/40 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600/30 rounded-xl flex items-center justify-center border border-blue-500/50">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-slate-400 text-sm mt-1">{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/50 rounded-xl"
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-slate-600/50 rounded-3xl bg-gradient-to-br from-slate-700/50 to-slate-800/50">
            <BellOff className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-300 font-medium">No notifications yet</p>
            <p className="text-sm text-slate-400 mt-1">We'll notify you about updates and important events</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications
              .filter(n => n.type !== 'gym_claim' && n.type !== 'gym_request' && !String(n.message || n.title || '').toLowerCase().includes('requested') && !String(n.message || n.title || '').toLowerCase().includes('claim'))
              .map((notification) => {
                const icon = notification.icon || '🔔';
                const text = notification.message || notification.title;
                const timeAgo = notification.created_date ? format(new Date(notification.created_date), 'MMM d, h:mma') : '';
                return (
                  <div
                    key={notification.id}
                    style={{
                      background: notification.read ? '#1e293b' : '#1a2540',
                      border: `1.5px solid ${notification.read ? '#334155' : '#3b5998'}`,
                      borderBottom: `4px solid ${notification.read ? '#0f172a' : '#1a3fa8'}`,
                      borderRadius: '16px',
                    }}
                    className="relative overflow-hidden"
                  >
                    <button
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all duration-150 z-10 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                    <div
                      className="px-4 py-4 flex items-center gap-4"
                      onClick={() => !notification.read && markAsReadMutation.mutate(notification.id)}
                    >
                      <span className="text-3xl select-none flex-shrink-0 leading-none">{icon}</span>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-extrabold text-white text-[14px] leading-tight tracking-tight">
                          {notification.title}
                        </p>
                        {notification.message && notification.title && notification.message !== notification.title && (
                          <p className="text-[12px] text-slate-400 mt-1 leading-snug font-medium">{notification.message}</p>
                        )}
                        {!notification.title && (
                          <p className="text-[12px] text-slate-400 mt-1 leading-snug font-medium">{text}</p>
                        )}
                        <p className="text-[11px] text-slate-600 mt-1">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}