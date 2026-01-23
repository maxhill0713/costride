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
            title: t('notifications.weMissYou'),
            message: t('notifications.notCheckedIn', { days: daysSinceCheckIn }),
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
          title: t('notifications.milestone10'),
          message: t('notifications.milestone10Msg'),
          icon: '🎯'
        });
      }

      // 30-day streak
      if (currentUser.current_streak >= 30 && !achieved.includes('30_day_streak')) {
        milestones.push({
          id: '30_day_streak',
          title: t('notifications.streak30'),
          message: t('notifications.streak30Msg'),
          icon: '🔥'
        });
      }

      // Gym anniversary
      if (currentUser.gym_join_date) {
        const daysSinceJoined = differenceInDays(new Date(), parseISO(currentUser.gym_join_date));
        const years = Math.floor(daysSinceJoined / 365);
        
        if (years >= 1 && !achieved.includes(`anniversary_${years}`)) {
          const plural = years > 1 ? t('notifications.years') : t('notifications.year');
          milestones.push({
            id: `anniversary_${years}`,
            title: t('notifications.anniversary', { years, plural }),
            message: t('notifications.anniversaryMsg', { years, plural, gym: currentUser.gym_location || 'your gym' }),
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
      case 'achievement': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'challenge': return <Flame className="w-5 h-5 text-red-400" />;
      case 'streak': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'reward': return <Trophy className="w-5 h-5 text-pink-400" />;
      case 'reminder': return <Bell className="w-5 h-5 text-indigo-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'inactivity': return 'bg-slate-800/60 backdrop-blur-sm border-orange-500/30';
      case 'milestone': return 'bg-slate-800/60 backdrop-blur-sm border-yellow-500/30';
      case 'anniversary': return 'bg-slate-800/60 backdrop-blur-sm border-purple-500/30';
      case 'engagement': return 'bg-slate-800/60 backdrop-blur-sm border-cyan-500/30';
      case 'achievement': return 'bg-slate-800/60 backdrop-blur-sm border-green-500/30';
      case 'challenge': return 'bg-slate-800/60 backdrop-blur-sm border-red-500/30';
      case 'streak': return 'bg-slate-800/60 backdrop-blur-sm border-orange-500/30';
      case 'reward': return 'bg-slate-800/60 backdrop-blur-sm border-pink-500/30';
      case 'reminder': return 'bg-slate-800/60 backdrop-blur-sm border-indigo-500/30';
      default: return 'bg-slate-800/60 backdrop-blur-sm border-slate-600/40';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('notifications.loading')}</p>
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
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${getNotificationColor(notification.type)} border overflow-hidden hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 rounded-2xl ${
                  !notification.read ? 'ring-2 ring-blue-500/40' : ''
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {notification.icon && typeof notification.icon === 'string' && notification.icon.length <= 2 ? (
                        <div className="text-3xl">{notification.icon}</div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                          {getNotificationIcon(notification.type, null)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-white">{notification.title}</h3>
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
                             View
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
                            Mark as Read
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