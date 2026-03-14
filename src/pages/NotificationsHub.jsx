import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Trophy, Users, Check, X, Eye, MessageCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';

function NotificationCard({ notification, onDismiss, onAction }) {
  const getIcon = () => {
    if (notification.type === 'at-risk') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (notification.type === 'milestone') return <Trophy className="w-5 h-5 text-amber-500" />;
    if (notification.type === 'booking') return <Users className="w-5 h-5 text-blue-500" />;
    return <Users className="w-5 h-5 text-slate-400" />;
  };

  const getColor = () => {
    if (notification.type === 'at-risk') return 'border-red-500/20 bg-red-500/5';
    if (notification.type === 'milestone') return 'border-amber-500/20 bg-amber-500/5';
    if (notification.type === 'booking') return 'border-blue-500/20 bg-blue-500/5';
    return 'border-slate-500/20 bg-slate-500/5';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-2xl p-4 border ${getColor()} backdrop-blur-xl`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{notification.title}</p>
          <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
          {notification.timestamp && (
            <p className="text-[10px] text-slate-600 mt-2">
              {new Date(notification.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {notification.actions?.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onAction(notification.id, action.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
              style={{
                background: action.color || 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              title={action.label}
            >
              {action.icon === 'check' && <Check className="w-4 h-4 text-green-400" />}
              {action.icon === 'x' && <X className="w-4 h-4 text-red-400" />}
              {action.icon === 'message' && <MessageCircle className="w-4 h-4 text-blue-400" />}
              {action.icon === 'mail' && <Mail className="w-4 h-4 text-slate-400" />}
            </button>
          ))}
          <button
            onClick={() => onDismiss(notification.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: gyms = [] } = useQuery({
    queryKey: ['userGyms', currentUser?.id],
    queryFn: () => base44.entities.Gym.filter({ admin_id: currentUser?.id }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  const gymIds = gyms.map(g => g.id);

  // At-risk members (no check-in in 7+ days)
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', gymIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        gymIds.map(gymId => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 500))
      );
      return results.flat();
    },
    enabled: gymIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', gymIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        gymIds.map(gymId => base44.entities.GymMember.filter({ gym_id: gymId }))
      );
      return results.flat();
    },
    enabled: gymIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Generate notifications from data
  const notifications = React.useMemo(() => {
    const notifs = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // At-risk members
    members.forEach(member => {
      const lastCheckIn = checkIns
        .filter(c => c.user_id === member.user_id)
        .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];

      if (!lastCheckIn || new Date(lastCheckIn.check_in_date) < sevenDaysAgo) {
        const daysAgo = lastCheckIn
          ? Math.floor((now - new Date(lastCheckIn.check_in_date)) / (24 * 60 * 60 * 1000))
          : null;
        notifs.push({
          id: `at-risk-${member.id}`,
          type: 'at-risk',
          title: `${member.name || 'Member'} at Risk`,
          message: daysAgo ? `No check-in for ${daysAgo} days` : 'Has not checked in recently',
          timestamp: lastCheckIn?.check_in_date || member.created_date,
          actions: [
            { id: 'message', label: 'Send Message', icon: 'message', color: 'rgba(59,130,246,0.2)' },
            { id: 'dismiss', label: 'Dismiss', icon: 'x' },
          ],
        });
      }
    });

    // Milestones (from last 7 days)
    const memberCounts = {};
    checkIns.forEach(ci => {
      if (ci.created_date && new Date(ci.created_date) > sevenDaysAgo) {
        memberCounts[ci.user_id] = (memberCounts[ci.user_id] || 0) + 1;
      }
    });

    Object.entries(memberCounts).forEach(([userId, count]) => {
      if ([10, 25, 50, 100].includes(count)) {
        const member = members.find(m => m.user_id === userId);
        notifs.push({
          id: `milestone-${userId}-${count}`,
          type: 'milestone',
          title: `${member?.name || 'Member'} Reached ${count} Visits!`,
          message: `Celebrating a great achievement this month`,
          timestamp: new Date().toISOString(),
          actions: [
            { id: 'celebrate', label: 'Celebrate', icon: 'check', color: 'rgba(34,197,94,0.2)' },
          ],
        });
      }
    });

    // Class bookings (placeholder)
    const recentMembers = checkIns
      .filter(c => new Date(c.created_date) > new Date(now.getTime() - 24 * 60 * 60 * 1000))
      .slice(0, 3);

    recentMembers.forEach(checkIn => {
      const member = members.find(m => m.user_id === checkIn.user_id);
      if (member && Math.random() > 0.5) {
        notifs.push({
          id: `booking-${checkIn.id}`,
          type: 'booking',
          title: `${member.name || 'Member'} Joined a Class`,
          message: 'Just booked the morning CrossFit session',
          timestamp: checkIn.created_date,
          actions: [
            { id: 'view', label: 'View', icon: 'message' },
          ],
        });
      }
    });

    return notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [members, checkIns]);

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  const handleDismiss = (id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleAction = (notificationId, actionId) => {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif) return;

    if (actionId === 'dismiss') {
      handleDismiss(notificationId);
    } else if (actionId === 'message') {
      // Could navigate to messages page or open a compose modal
      console.log('Send message to:', notif.title);
    } else if (actionId === 'celebrate') {
      handleDismiss(notificationId);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(2,4,10,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            <ChevronLeft style={{ width: 22, height: 22, color: '#94a3b8' }} />
          </button>
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Notifications</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 40px' }}>
        {visibleNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full border-2 border-slate-700/60 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm font-bold text-white mb-1">All caught up!</p>
            <p className="text-xs text-slate-500">No notifications at this time</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {visibleNotifications.map(notif => (
                <NotificationCard
                  key={notif.id}
                  notification={notif}
                  onDismiss={handleDismiss}
                  onAction={handleAction}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}