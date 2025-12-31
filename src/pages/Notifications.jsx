import React from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Trophy, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const notifications = [
  {
    id: 1,
    type: 'like',
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    user: 'The Beast',
    action: 'liked your post',
    time: '5m ago',
    unread: true
  },
  {
    id: 2,
    type: 'comment',
    icon: MessageCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    user: 'Iron Lady',
    action: 'commented: "Great form! 💪"',
    time: '1h ago',
    unread: true
  },
  {
    id: 3,
    type: 'follow',
    icon: UserPlus,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    user: 'Tank',
    action: 'started following you',
    time: '2h ago',
    unread: true
  },
  {
    id: 4,
    type: 'achievement',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    user: 'System',
    action: 'You earned "100 Workouts" badge!',
    time: '5h ago',
    unread: false
  },
  {
    id: 5,
    type: 'pr',
    icon: TrendingUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    user: 'Lightning',
    action: 'beat your record on Deadlift',
    time: '1d ago',
    unread: false
  }
];

export default function Notifications() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h1>
            <button className="text-sm font-semibold text-purple-600">
              Mark all read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-2">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`bg-white border-2 ${notif.unread ? 'border-purple-200 bg-purple-50/30' : 'border-gray-100'} p-4 hover:border-gray-200 transition-all cursor-pointer`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full ${notif.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <notif.icon className={`w-5 h-5 ${notif.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-bold">{notif.user}</span> {notif.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                </div>
                {notif.unread && (
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}