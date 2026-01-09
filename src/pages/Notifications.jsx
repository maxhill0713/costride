import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Flame, Trophy, Calendar, Target, CheckCircle2, AlertCircle, PartyPopper, TrendingUp, X } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser
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

  // Check for inactivity and create nudges
  useEffect(() => {
    if (!currentUser || !currentUser.last_check_in) return;

    const checkInactivity = async () => {
      const daysSinceCheckIn = differenceInDays(new Date(), parseISO(currentUser.last_check_in));
      
      if (daysSinceCheckIn >= 7) {
        // Check if we already sent this notification
        const existingNudge = notifications.find(n => 
          n.type === 'inactivity' && !n.read && differenceInDays(new Date(), parseISO(n.created_date)) < 1
        );

        if (!existingNudge) {
          await base44.entities.Notification.create({
            user_id: currentUser.id,
            type: 'inactivity',
            title: 'We miss you! 💪',
            message: `You haven't checked in for ${daysSinceCheckIn} days. Your gym buddies are waiting for you!`,
            icon: '😢',
            action_url: createPageUrl('Gyms')
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      }
    };

    checkInactivity();
  }, [currentUser, notifications, queryClient]);

  // Check milestones
  useEffect(() => {
    if (!currentUser) return;

    const checkMilestones = async () => {
      const milestones = [];
      const achieved = currentUser.milestones_achieved || [];

      // 10 visits milestone
      if (currentUser.total_check_ins >= 10 && !achieved.includes('10_visits')) {
        milestones.push({
          id: '10_visits',
          title: '10 Check-ins Milestone! 🎯',
          message: 'Congratulations! You\'ve checked in 10 times. Keep the momentum going!',
          icon: '🎯'
        });
      }

      // 30-day streak
      if (currentUser.current_streak >= 30 && !achieved.includes('30_day_streak')) {
        milestones.push({
          id: '30_day_streak',
          title: '30-Day Streak Champion! 🔥',
          message: 'Incredible! You\'ve maintained a 30-day check-in streak. You\'re unstoppable!',
          icon: '🔥'
        });
      }

      // Gym anniversary
      if (currentUser.gym_join_date) {
        const daysSinceJoined = differenceInDays(new Date(), parseISO(currentUser.gym_join_date));
        const years = Math.floor(daysSinceJoined / 365);
        
        if (years >= 1 && !achieved.includes(`anniversary_${years}`)) {
          milestones.push({
            id: `anniversary_${years}`,
            title: `${years} Year Anniversary! 🎉`,
            message: `${years} year${years > 1 ? 's' : ''} at ${currentUser.gym_location || 'your gym'}! What an amazing journey!`,
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
  }, [currentUser, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type, icon) => {
    if (icon) return icon;
    switch (type) {
      case 'inactivity': return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'milestone': return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'anniversary': return <PartyPopper className="w-5 h-5 text-purple-400" />;
      case 'engagement': return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case 'achievement': return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
      case 'challenge': return <Flame className="w-5 h-5 text-red-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'inactivity': return 'from-slate-700/70 via-orange-900/30 to-slate-800/70 border-slate-600/40';
      case 'milestone': return 'from-slate-700/70 via-yellow-900/30 to-slate-800/70 border-slate-600/40';
      case 'anniversary': return 'from-slate-700/70 via-purple-900/30 to-slate-800/70 border-slate-600/40';
      case 'engagement': return 'from-slate-700/70 via-cyan-900/30 to-slate-800/70 border-slate-600/40';
      case 'achievement': return 'from-slate-700/70 via-teal-900/30 to-slate-800/70 border-slate-600/40';
      case 'challenge': return 'from-slate-700/70 via-red-900/30 to-slate-800/70 border-slate-600/40';
      default: return 'from-slate-700/60 to-slate-800/60 border-slate-600/40';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 px-4 py-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMCAxMGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bS0xMCAwYzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMTAgMTBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyek0yNiAzNGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bTEwIDBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-cyan-100 text-sm mt-1">{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-2xl shadow-lg"
              >
                Mark all read
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
            <p className="text-sm text-slate-400 mt-1">We'll notify you about important updates</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`bg-gradient-to-r ${getNotificationColor(notification.type)} border overflow-hidden hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 rounded-3xl ${
                  !notification.read ? 'ring-2 ring-cyan-500/50' : ''
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {notification.icon && typeof notification.icon === 'string' && notification.icon.length <= 2 ? (
                        <div className="text-3xl">{notification.icon}</div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-slate-700/80 flex items-center justify-center shadow-sm border border-cyan-700/50">
                          {getNotificationIcon(notification.type, null)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">{notification.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          className="flex-shrink-0 h-8 w-8 hover:bg-slate-700/50 rounded-full"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                      <p className="text-sm font-normal text-slate-200 mb-2 leading-relaxed">{notification.message}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                        </span>
                        {!notification.read && (
                          <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs shadow-lg shadow-cyan-500/30">New</Badge>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex gap-2 mt-3">
                        {notification.action_url && (
                          <Link to={notification.action_url}>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-2xl shadow-lg"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                            >
                              Take Action
                            </Button>
                          </Link>
                        )}
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            className="bg-slate-700/50 hover:bg-slate-700 border-cyan-700/50 text-cyan-300 rounded-2xl"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}