import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DashSchedule({ currentUser }) {
  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['coachClasses', coachProfile?.gym_id],
    queryFn: () => base44.entities.GymClass.filter({ gym_id: coachProfile.gym_id }),
    enabled: !!coachProfile?.gym_id,
  });

  // Build a schedule map by day
  const scheduleByDay = DAYS.reduce((acc, day) => {
    acc[day] = classes.filter(c => (c.schedule || []).some(s => s.day === day));
    return acc;
  }, {});

  const hasAnyClass = classes.length > 0;

  if (!coachProfile?.gym_id) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-semibold">No gym linked to your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white">My Schedule</h2>
        <p className="text-slate-400 text-sm">Weekly class schedule at {coachProfile?.gym_name}</p>
      </div>

      {!hasAnyClass ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No scheduled classes yet</p>
          <p className="text-slate-500 text-sm mt-1">Create classes in the Classes tab to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {DAYS.map(day => {
            const dayCls = scheduleByDay[day];
            return (
              <Card key={day} className={`border p-4 ${dayCls.length > 0 ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-900/40 border-slate-800/50'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full ${dayCls.length > 0 ? 'bg-blue-400' : 'bg-slate-600'}`} />
                  <h3 className={`font-bold text-sm ${dayCls.length > 0 ? 'text-white' : 'text-slate-600'}`}>{day}</h3>
                  {dayCls.length > 0 && (
                    <span className="text-xs text-blue-400 font-semibold ml-auto">{dayCls.length} class{dayCls.length > 1 ? 'es' : ''}</span>
                  )}
                </div>

                {dayCls.length === 0 ? (
                  <p className="text-xs text-slate-600 pl-5">No classes scheduled</p>
                ) : (
                  <div className="space-y-2 pl-5">
                    {dayCls.map(cls => {
                      const slot = (cls.schedule || []).find(s => s.day === day);
                      return (
                        <div key={cls.id} className="flex items-center gap-3 p-3 bg-slate-700/40 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm">{cls.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                              {slot?.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{slot.time}</span>}
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.duration_minutes}min</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {cls.max_capacity}</span>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                            cls.difficulty === 'beginner' ? 'bg-green-500/15 text-green-400' :
                            cls.difficulty === 'intermediate' ? 'bg-yellow-500/15 text-yellow-400' :
                            cls.difficulty === 'advanced' ? 'bg-red-500/15 text-red-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>{cls.difficulty?.replace('_',' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}