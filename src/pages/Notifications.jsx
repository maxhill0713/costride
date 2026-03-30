import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { createPageUrl } from '../utils';

const PAGE_SIZE = 20;

export default function Notifications() {
  const queryClient = useQueryClient();
  const nudgeCreatedRef = useRef(false);
  const milestonesCheckedRef = useRef(false);
  const sentinelRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser?.id }, '-created_date', 100),
    enabled: !!currentUser?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    }
  });

  // IntersectionObserver-based infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + PAGE_SIZE); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
          queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
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

      if (currentUser.total_check_ins >= 10 && !achieved.includes('10_visits')) {
        milestones.push({ id: '10_visits', title: '10 Visits! 🎯', message: "You've checked in 10 times. Keep it up!", icon: '🎯' });
      }

      if (currentUser.current_streak >= 30 && !achieved.includes('30_day_streak')) {
        milestones.push({ id: '30_day_streak', title: '30-Day Streak! 🔥', message: "Incredible! You've maintained a 30-day streak.", icon: '🔥' });
      }

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

      for (const milestone of milestones) {
        await base44.entities.Notification.create({
          user_id: currentUser.id,
          type: 'milestone',
          title: milestone.title,
          message: milestone.message,
          icon: milestone.icon,
          metadata: { milestone_id: milestone.id }
        });
        await base44.auth.updateMe({ milestones_achieved: [...achieved, milestone.id] });
      }

      if (milestones.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    };

    checkMilestones();
  }, [currentUser?.id, queryClient]);

  const filtered = notifications.filter(
    n => n.type !== 'gym_claim' && n.type !== 'gym_request' &&
    !String(n.message || n.title || '').toLowerCase().includes('requested') &&
    !String(n.message || n.title || '').toLowerCase().includes('claim')
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 flex items-center gap-2">
          <div className="w-[18px] h-[18px] rounded bg-slate-700/60 animate-pulse" />
          <div className="w-28 h-4 rounded bg-slate-700/60 animate-pulse" />
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{ background: '#1e293b', border: '1.5px solid #334155', borderBottom: '4px solid #0f172a', borderRadius: '16px' }}
              className="px-4 py-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-slate-700/60 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 rounded bg-slate-700/60 animate-pulse w-3/4" />
                <div className="h-3 rounded bg-slate-700/60 animate-pulse w-1/2" />
                <div className="h-2.5 rounded bg-slate-700/60 animate-pulse w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-[17px] font-black text-white tracking-tight flex items-center gap-2">
          <Bell className="w-[18px] h-[18px] text-blue-400" />
          Notifications
          {unreadCount > 0 && (
            <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">{unreadCount}</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/50 rounded-xl text-xs h-8 px-3"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-slate-600/50 rounded-3xl bg-gradient-to-br from-slate-700/50 to-slate-800/50">
            <BellOff className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-300 font-medium">No notifications yet</p>
            <p className="text-sm text-slate-400 mt-1">We'll notify you about updates and important events</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map((notification) => {
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

            {/* Infinite scroll sentinel */}
            {hasMore && <div ref={sentinelRef} className="h-8" />}
          </div>
        )}
      </div>
    </div>
  );
}
